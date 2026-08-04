import { ArrowRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { ProductLink } from "./ProductLink";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { colors } from "../lib/brand";
import { productImagery } from "../config/product-media";
import type { Product } from "../config/products";

/** x.ai-style "post" card for a product — cover image + glass body, cursor-reactive. */
export function ProductPostCard({ product: p }: { product: Product }) {
  const soon = p.stage === "coming_soon";
  return (
    <GlassCard accent={p.accent} className="h-full">
      {/* Cover */}
      <div className="relative" style={{ aspectRatio: "16/9" }}>
        <ImageWithFallback src={productImagery[p.id]} alt={p.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, ${p.accent}30 0%, transparent 55%)` }} />
        <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.9)", color: p.accent }}>{p.category}</span>
        <span className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full" style={soon ? { background: "rgba(6,8,15,0.72)", color: "#fff" } : { background: colors.green, color: "#fff" }}>{soon ? "Coming soon" : "Available now"}</span>
        <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
          <ImageWithFallback src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col" style={{ minHeight: "180px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: colors.heading }}>{p.name}</h3>
        <p style={{ color: p.accent, fontSize: "13px", fontWeight: 600, marginTop: "3px", marginBottom: "10px" }}>{p.tagline}</p>
        <p className="line-clamp-2" style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, flexGrow: 1 }}>{p.description}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-4" style={{ color: colors.heading }}>
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
