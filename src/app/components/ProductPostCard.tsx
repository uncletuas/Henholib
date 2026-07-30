import { ArrowRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { ProductLink } from "./ProductLink";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { colors } from "../lib/brand";
import type { Product } from "../config/products";

/** x.ai-style "post" card for a product, used in the products grid. */
export function ProductPostCard({ product: p }: { product: Product }) {
  return (
    <GlassCard accent={p.accent} className="h-full">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${p.accent}14`, color: p.accent }}>{p.category}</span>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
            <ImageWithFallback src={p.logo} alt={p.name} className="w-7 h-7 object-contain" />
          </div>
        </div>

        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: colors.heading }}>{p.name}</h3>
        <p style={{ color: p.accent, fontSize: "13px", fontWeight: 600, marginTop: "3px", marginBottom: "10px" }}>{p.tagline}</p>
        <p className="line-clamp-2" style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, flexGrow: 1 }}>{p.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
          {p.highlights.slice(0, 3).map((h) => (
            <span key={h} className="px-2.5 py-1 rounded-full" style={{ background: colors.surfaceMuted, color: colors.textSecondary, fontSize: "11.5px", fontWeight: 500 }}>{h}</span>
          ))}
        </div>

        <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: colors.heading }}>
          Learn more <ArrowRight size={14} style={{ color: p.accent }} />
        </span>
      </div>
      {/* Stretched link: whole card is clickable + accessible. */}
      <ProductLink product={p} className="absolute inset-0" style={{ zIndex: 2 }}>
        <span className="sr-only">{p.name}</span>
      </ProductLink>
    </GlassCard>
  );
}
