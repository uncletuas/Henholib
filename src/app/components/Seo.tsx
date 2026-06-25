import { useEffect } from "react";
import { SITE_URL, OG_IMAGE } from "../config/site";

interface SeoProps {
  /** Full <title>. Keep ~50–60 chars; brand is appended automatically unless includeBrand=false. */
  title: string;
  description: string;
  /** Path beginning with "/", e.g. "/products". Used for the canonical URL. */
  path: string;
  /** Keep this page out of search results (still followed). */
  noindex?: boolean;
  /** Absolute or root-relative social image. */
  image?: string;
  /** og:type — "website" (default) or "article". */
  type?: "website" | "article";
  /** JSON-LD structured data object(s). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Append " | Loopital" to the title. */
  includeBrand?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-route SEO. Updates document title, meta description, robots, canonical,
 * Open Graph / Twitter tags, and JSON-LD on navigation. Google renders JS and
 * picks these up; pair with the static sitemap for crawl coverage.
 */
export function Seo({ title, description, path, noindex, image, type = "website", jsonLd, includeBrand = true }: SeoProps) {
  useEffect(() => {
    const fullTitle = includeBrand && !/loopital/i.test(title) ? `${title} | Loopital` : title;
    const url = `${SITE_URL}${path === "/" ? "/" : path.replace(/\/$/, "")}`;
    const img = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : OG_IMAGE;

    document.title = fullTitle;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, follow" : "index, follow");
    upsertLink("canonical", url);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", "Loopital");
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", img);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", img);

    // Refresh JSON-LD: drop any we previously injected, then add the new set.
    document.head.querySelectorAll('script[data-seo-jsonld="1"]').forEach((n) => n.remove());
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const block of blocks) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.dataset.seoJsonld = "1";
        script.text = JSON.stringify(block);
        document.head.appendChild(script);
      }
    }
  }, [title, description, path, noindex, image, type, jsonLd, includeBrand]);

  return null;
}
