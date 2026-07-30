import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CTAButton } from "./CTAButton";
import { PlatformPills } from "./PlatformPills";
import { products } from "../config/products";
import { colors } from "../lib/brand";
import { useAuth } from "../context/AuthContext";

const imagery: Record<string, string> = {
  stack62: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  sart34: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  hms7: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  henholib: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  fms13: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
};

/** Interactive tabbed product showcase — click a product, its panel morphs in. */
export function ProductSwitcher() {
  const { setWaitlist } = useAuth();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => { if (!paused.current) setActive((a) => (a + 1) % products.length); }, 5200);
    return () => clearInterval(t);
  }, [reduce]);

  const p = products[active];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-6 lg:gap-8" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      {/* Tabs */}
      <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        {products.map((prod, i) => {
          const on = i === active;
          return (
            <button
              key={prod.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all flex-shrink-0 lg:flex-shrink ${on ? "glass" : ""}`}
              style={{ minWidth: "220px", border: on ? `1px solid ${prod.accent}40` : `1px solid ${colors.hairline}`, background: on ? undefined : colors.surface }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
                <ImageWithFallback src={prod.logo} alt={prod.name} className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <p style={{ fontWeight: 700, fontSize: "14.5px", color: colors.heading }}>{prod.name}</p>
                <p style={{ fontSize: "12px", color: on ? prod.accent : colors.textTertiary, fontWeight: 500 }}>{prod.category}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={p.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel overflow-hidden"
            style={{ borderRadius: "26px" }}
          >
            <div className="relative" style={{ aspectRatio: "16/8" }}>
              <ImageWithFallback src={imagery[p.id]} alt={p.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${p.accent}33 0%, transparent 55%)` }} />
              <span className="absolute top-4 left-4 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.9)", color: p.accent }}>{p.theme}</span>
            </div>
            <div className="p-6 lg:p-7">
              <h3 style={{ fontSize: "clamp(1.25rem,2vw,1.6rem)", fontWeight: 800, letterSpacing: "-0.02em", color: colors.heading, marginBottom: "10px" }}>{p.tagline}</h3>
              <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.65, marginBottom: "16px" }}>{p.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.highlights.map((h) => (
                  <span key={h} className="px-2.5 py-1 rounded-full" style={{ background: colors.surfaceMuted, color: colors.textSecondary, fontSize: "12px", fontWeight: 500 }}>{h}</span>
                ))}
              </div>
              <div className="mb-5"><PlatformPills platforms={p.platforms} /></div>
              {p.offer && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${p.accent}14`, color: p.accent, fontSize: "13px", fontWeight: 600 }}>
                    <Sparkles size={13} /> {p.offer}
                  </span>
                </div>
              )}
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
