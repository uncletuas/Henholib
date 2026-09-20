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
 * Output: dist/pages/<route>.html (e.g. dist/pages/about.html). nginx serves the
 * company routes from those files and falls back to dist/index.html; the site
 * root "/" belongs to the Loopital app and is never served from here.
 */
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';
const PAGES = join(DIST, 'pages');
const SITE = 'https://loopital.com';
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
 * The sitemap is no longer written here.
 *
 * The app generates it from what actually exists — the category and location pages, and
 * every facility on the network — so a second, hand-weighted copy of eight company URLs
 * could only disagree with it. The company pages are listed there too.
 */

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('prerender: dist/index.html is missing. Run the build first.');
    process.exit(1);
  }
  const template = await readFile(join(DIST, 'index.html'), 'utf8');
  const pageSeo = await loadRoutes();

  await rm(PAGES, { recursive: true, force: true });
  await mkdir(PAGES, { recursive: true });

  let count = 0;
  for (const [path, seo] of Object.entries(pageSeo)) {
    if (path === '/') continue; // the app's page, not ours
    await writeFile(join(PAGES, `${path.replace(/^\//, '')}.html`), render(template, path, seo), 'utf8');
    count++;
  }

  console.log(
    `prerender: ${count} route file(s) written to ${PAGES}/.`,
  );
}

main().catch((err) => {
  console.error('prerender failed:', err);
  process.exit(1);
});
