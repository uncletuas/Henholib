import { ArrowRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { ProductLink } from "./ProductLink";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { colors } from "../lib/brand";
import { productAudience } from "../config/product-audience";
import type { Product } from "../config/products";

/**
 * Compact, needs-first product tile — leads with WHO it's for and the problem
 * it solves, so a visitor clicks straight through to the product for their need
 * (Palantir/Salesforce-style ecosystem, not a product list). No cover image.
 */
export function EcosystemCard({ product: p }: { product: Product }) {
  const a = productAudience[p.id];
  return (
    <GlassCard accent={p.accent} className="h-full">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
            <ImageWithFallback src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: p.accent, letterSpacing: "0.04em" }}>{a?.audience.toUpperCase()}</span>
        </div>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: colors.heading }}>{p.name}</h3>
        <p style={{ color: colors.textSecondary, fontSize: "13.5px", lineHeight: 1.55, marginTop: "5px", flexGrow: 1 }}>{a?.need}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-4" style={{ color: colors.heading }}>
          Explore {p.name} <ArrowRight size={13} style={{ color: p.accent }} />
        </span>
      </div>
      <ProductLink product={p} className="absolute inset-0" style={{ zIndex: 2 }}>
        <span className="sr-only">{p.name}</span>
      </ProductLink>
    </GlassCard>
  );
}
