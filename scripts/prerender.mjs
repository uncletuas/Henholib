/**
 * Bake per-route metadata into static HTML.
 *
 * The site is a client-rendered SPA: `Seo.tsx` writes the title, description,
 * canonical and Open Graph tags from a `useEffect` after React mounts. Google
 * renders JavaScript and eventually sees them, but three things never do:
 *
 *   - Social scrapers. Facebook, LinkedIn, WhatsApp, X and Slack fetch the HTML
 *     and read it. They do not run scripts. Every shared link was therefore
 *     showing the homepage title and description, whichever page was shared.
 *   - Crawlers with no render budget, which is most of them outside Google.
 *   - The first paint of the tab title, which flashed the generic one.
 *
 * So after the Vite build, this walks the route table and writes one real HTML
 * file per route with the right tags already in the markup. The SPA still boots
 * and takes over exactly as before; the difference is only what a fetch sees.
 *
 * The output goes to `dist-seo/` with flattened filenames plus a manifest, not
 * into `dist/` at the route path. S3 has a flat keyspace, so the keys
 * `products` and `products/hms7` can happily coexist; a local filesystem cannot
 * hold `dist/products` as a file and a directory at once. Staging sidesteps that
 * entirely, and the manifest tells the deploy which key each file belongs at.
 *
 * Keys are extensionless because CloudFront maps `/products/henholib` to the S3
 * key `products/henholib` and does not append `index.html` for sub-paths. The
 * deploy therefore uploads them with an explicit `text/html` content type,
 * since there is no extension to infer one from.
 */
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';
const STAGE = 'dist-seo';
const SITE = 'https://www.loopital.com';
const OG_IMAGE = `${SITE}/og-image.png`;

/**
 * Load the real route table rather than a copy of it.
 *
 * seo-pages.ts is TypeScript and imports two sibling config modules, so it is
 * bundled to a temporary ESM file first. Importing the actual source is what
 * stops this script drifting out of step with the site.
 */
async function loadRoutes() {
  const dir = await mkdtemp(join(tmpdir(), 'loopital-seo-'));
  const out = join(dir, 'seo.mjs');
  await build({
    entryPoints: ['src/app/config/seo-pages.ts'],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
    // Vite's `import.meta.env` does not exist under Node. The config modules
    // only read it for the API base, which metadata never touches, so an empty
    // object is enough to let the bundle evaluate.
    define: { 'import.meta.env': '{}' },
    // Asset imports are irrelevant to metadata; stub them so the bundle links.
    loader: { '.png': 'text', '.jpg': 'text', '.svg': 'text' },
  });
  const mod = await import(pathToFileURL(out).href);
  await rm(dir, { recursive: true, force: true });
  return mod.pageSeo;
}

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Replace a tag if the template already has it, otherwise add it before </head>. */
function setTag(html, matcher, tag) {
  return matcher.test(html)
    ? html.replace(matcher, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
}

function render(template, path, seo) {
  const title = /loopital/i.test(seo.title) ? seo.title : `${seo.title} | Loopital`;
  const url = `${SITE}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
  const image = seo.image
    ? seo.image.startsWith('http')
      ? seo.image
      : `${SITE}${seo.image}`
    : OG_IMAGE;

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta\s+name="description"[^>]*>/, `<meta name="description" content="${esc(seo.description)}" />`);
  html = setTag(html, /<meta\s+name="robots"[^>]*>/, `<meta name="robots" content="${seo.noindex ? 'noindex, follow' : 'index, follow'}" />`);
  html = setTag(html, /<link\s+rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);

  html = setTag(html, /<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(seo.description)}" />`);
  html = setTag(html, /<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<meta\s+property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`);
  html = setTag(html, /<meta\s+property="og:type"[^>]*>/, `<meta property="og:type" content="${seo.type ?? 'website'}" />`);

  html = setTag(html, /<meta\s+name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta\s+name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(seo.description)}" />`);
  html = setTag(html, /<meta\s+name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`);

  // Per-route JSON-LD, appended rather than replacing the baseline Organization
  // block already in index.html.
  if (seo.jsonLd) {
    const blocks = Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd];
    const scripts = blocks
      .map((b) => `    <script type="application/ld+json">${JSON.stringify(b)}</script>`)
      .join('\n');
    html = html.replace('</head>', `${scripts}\n  </head>`);
  }
  return html;
}

/**
 * Write the sitemap from the same route table the pages come from.
 *
 * Hand-maintaining it is how a sitemap ends up advertising URLs that redirect
 * (both Swift paths did) and omitting ones that exist. Generating it means the
 * two can no longer disagree.
 *
 * Priority follows depth and intent rather than being flat: the homepage and
 * the two health products are what we want ranked, legal pages are not.
 */
async function writeSitemap(pageSeo) {
  const today = new Date().toISOString().slice(0, 10);

  const WEIGHT = {
    '/': { priority: '1.0', changefreq: 'weekly' },
    '/products': { priority: '0.9', changefreq: 'weekly' },
    '/products/henholib': { priority: '0.9', changefreq: 'monthly' },
    '/products/hms7': { priority: '0.9', changefreq: 'monthly' },
    '/products/beacon': { priority: '0.7', changefreq: 'monthly' },
    '/products/modus': { priority: '0.7', changefreq: 'monthly' },
    '/products/pal': { priority: '0.7', changefreq: 'monthly' },
    '/products/pal/pricing': { priority: '0.7', changefreq: 'monthly' },
    // Ranked above the legal pages: it is a page we actively want answered,
    // and it is linked from campaigns that run off-site.
    '/contribute': { priority: '0.8', changefreq: 'monthly' },
    '/refund-policy': { priority: '0.3', changefreq: 'yearly' },
    '/about': { priority: '0.6', changefreq: 'monthly' },
    '/insights': { priority: '0.6', changefreq: 'weekly' },
    '/contact': { priority: '0.6', changefreq: 'yearly' },
    '/tuamene.bestgod': { priority: '0.5', changefreq: 'monthly' },
    '/privacy': { priority: '0.2', changefreq: 'yearly' },
    '/terms': { priority: '0.2', changefreq: 'yearly' },
  };

  // The live apps on their own subdomains.
  //
  // Only Henholib. Pal, Modus and Zina are hosted again, but they are not
  // pages: Pal and Modus open on a sign-in wall and Zina is the admin console,
  // so there is nothing for a crawler to index and a login screen in the
  // results helps nobody. Their marketing pages under /products are what should
  // rank. Swift no longer exists at all.
  const SUBDOMAINS = [
    { loc: 'https://henholib.loopital.com/', priority: '0.8', changefreq: 'weekly' },
  ];

  const rows = [];
  for (const [path, seo] of Object.entries(pageSeo)) {
    if (seo.noindex) continue; // never advertise what we ask not to index
    const w = WEIGHT[path] ?? { priority: '0.5', changefreq: 'monthly' };
    const loc = `${SITE}${path === '/' ? '/' : path}`;
    rows.push(
      `  <url><loc>${loc}</loc><lastmod>${today}</lastmod>` +
        `<changefreq>${w.changefreq}</changefreq><priority>${w.priority}</priority></url>`,
    );
  }
  for (const s of SUBDOMAINS) {
    rows.push(
      `  <url><loc>${s.loc}</loc><lastmod>${today}</lastmod>` +
        `<changefreq>${s.changefreq}</changefreq><priority>${s.priority}</priority></url>`,
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(join(DIST, 'sitemap.xml'), xml, 'utf8');
  await writeFile('public/sitemap.xml', xml, 'utf8');
  console.log(`prerender: sitemap.xml written with ${rows.length} URLs.`);
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('prerender: dist/index.html is missing. Run the build first.');
    process.exit(1);
  }
  const template = await readFile(join(DIST, 'index.html'), 'utf8');
  const pageSeo = await loadRoutes();

  await rm(STAGE, { recursive: true, force: true });
  await mkdir(STAGE, { recursive: true });

  const manifest = [];
  for (const [path, seo] of Object.entries(pageSeo)) {
    const html = render(template, path, seo);

    if (path === '/') {
      // The root is also the SPA fallback, so it stays dist/index.html and
      // ships with the ordinary sync.
      await writeFile(join(DIST, 'index.html'), html, 'utf8');
      continue;
    }

    const key = path.replace(/^\//, '');
    const file = key.replace(/\//g, '__');
    await writeFile(join(STAGE, file), html, 'utf8');
    manifest.push({ file, key });
  }

  await writeFile(
    join(STAGE, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  );

  await writeSitemap(pageSeo);
  console.log(
    `prerender: dist/index.html + ${manifest.length} route file(s) staged in ${STAGE}/.`,
  );
}

main().catch((err) => {
  console.error('prerender failed:', err);
  process.exit(1);
});
