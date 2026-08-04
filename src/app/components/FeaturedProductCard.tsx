import { ArrowRight, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { CTAButton } from "./CTAButton";
import { PlatformPills } from "./PlatformPills";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { productImagery } from "../config/product-media";
import { colors } from "../lib/brand";
import type { Product } from "../config/products";
import { useAuth } from "../context/AuthContext";

/** Large, promotional card for a flagship product (Henholib, EDM73). */
export function FeaturedProductCard({ product: p }: { product: Product }) {
  const { setWaitlist } = useAuth();
  const soon = p.stage === "coming_soon";
  return (
    <GlassCard accent={p.accent} panel className="h-full flex flex-col">
      <div className="relative" style={{ aspectRatio: "16/8" }}>
        <ImageWithFallback src={productImagery[p.id]} alt={p.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, ${p.accent}38 0%, transparent 55%)` }} />
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.92)", color: p.accent }}>
          <Sparkles size={12} /> Flagship
        </span>
        <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full" style={soon ? { background: "rgba(6,8,15,0.72)", color: "#fff" } : { background: colors.green, color: "#fff" }}>{soon ? "Coming soon" : "Available now"}</span>
      </div>

      <div className="p-7 lg:p-8 flex flex-col flex-grow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
            <ImageWithFallback src={p.logo} alt={p.name} className="w-8 h-8 object-contain" />
          </div>
          <div>
            <p style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em", color: colors.heading, lineHeight: 1.1 }}>{p.name}</p>
            <p style={{ fontSize: "13px", color: p.accent, fontWeight: 600 }}>{p.category}</p>
          </div>
        </div>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, color: colors.heading, marginBottom: "8px" }}>{p.tagline}</p>
        <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.65, marginBottom: "16px", flexGrow: 1 }}>{p.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.highlights.slice(0, 4).map((h) => (
            <span key={h} className="px-2.5 py-1 rounded-full" style={{ background: colors.surfaceMuted, color: colors.textSecondary, fontSize: "12px", fontWeight: 500 }}>{h}</span>
          ))}
        </div>
        <div className="mb-5"><PlatformPills platforms={p.platforms} /></div>

        <div className="flex flex-wrap items-center gap-3">
          {p.ctaType === "waitlist" ? (
            <button onClick={() => setWaitlist(p.id)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: p.accent, fontSize: "14px" }}>Join the waitlist <ArrowRight size={15} /></button>
          ) : p.ctaType === "launch" ? (
            <CTAButton href={p.appHref} external variant="gradient" size="sm" style={{ background: p.accent }}>Open {p.name} <ArrowRight size={15} /></CTAButton>
          ) : (
            <CTAButton to="/contact" variant="solid" size="sm">Book a demo <ArrowRight size={15} /></CTAButton>
          )}
          <CTAButton to={p.detailHref} variant="outline" size="sm">Learn more</CTAButton>
        </div>
      </div>
    </GlassCard>
  );
}
