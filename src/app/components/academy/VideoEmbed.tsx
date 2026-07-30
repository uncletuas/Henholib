import { ExternalLink } from "lucide-react";
import { colors } from "../../lib/brand";

/** Convert a YouTube/Vimeo watch URL into an embeddable player URL. */
function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "player.vimeo.com") return url;
  } catch { /* not a URL */ }
  return null;
}

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const embed = toEmbed(url);
  if (embed) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#000", border: `1px solid ${colors.hairline}` }}>
        <iframe
          src={embed}
          title={title || "Course video"}
          className="w-full h-full"
          style={{ border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: colors.surfaceMuted, color: colors.blue, fontWeight: 600, fontSize: "14px" }}>
      <ExternalLink size={16} /> Open video
    </a>
  );
}
