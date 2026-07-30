import type { ReactNode } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Section } from "../Section";
import { Reveal } from "../Reveal";
import { CTAButton } from "../CTAButton";
import { PlatformPills } from "../PlatformPills";
import { StoreBadges } from "../StoreBadges";
import type { Product } from "../../config/products";
import { colors, shadow } from "../../lib/brand";
import { useAuth } from "../../context/AuthContext";

export interface ProductFeature {
  title: string;
  desc: string;
}

export interface ProductPageContent {
  product: Product;
  heroImage: string;
  /** Headline — falls back to the catalog tagline. */
  headline?: ReactNode;
  /** Hero sub-paragraph — falls back to the catalog description. */
  heroBody?: string;
  /** Trust/stat strip. */
  stats?: { value: string; label: string }[];
  featuresEyebrow: string;
  featuresTitle: string;
  features: ProductFeature[];
  /** Split deep-dive section. */
  splitImage: string;
  splitTitle: string;
  splitBody: string;
  splitBullets: string[];
  ctaTitle: string;
  ctaBody: string;
}

/**
 * Apple-style marketing template shared by the product detail pages.
 * The hero CTAs and mobile store badges are derived from the product catalog
 * so launch-vs-demo and account-linking rules stay consistent everywhere.
 */
export function ProductPageShell(c: ProductPageContent) {
  const p = c.product;
  const launch = p.ctaType === "launch";
  const waitlist = p.ctaType === "waitlist";
  const { setWaitlist } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: colors.surface, padding: "clamp(64px,9vw,120px) 0" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 60% at 75% 25%, ${p.accent}14, transparent 70%)` }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal from="left">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "#fff", border: `1px solid ${p.accent}22`, boxShadow: shadow.sm }}>
                  <ImageWithFallback src={p.logo} alt={p.name} className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "20px", color: colors.heading }}>{p.name}</p>
                  <p style={{ fontSize: "13px", color: p.accent, fontWeight: 600 }}>{p.category}</p>
                </div>
              </div>
              <h1 style={{ fontSize: "clamp(2.2rem,4.6vw,3.8rem)", marginBottom: "22px" }}>{c.headline ?? p.tagline}</h1>
              <p style={{ color: colors.textSecondary, fontSize: "19px", lineHeight: 1.7, maxWidth: "500px", marginBottom: "26px" }}>{c.heroBody ?? p.description}</p>
              {p.offer && (
                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: `${p.accent}14`, color: p.accent, fontSize: "13.5px", fontWeight: 600 }}>
                    <Sparkles size={14} /> {p.offer}
                  </span>
                </div>
              )}
              <div className="mb-7"><PlatformPills platforms={p.platforms} /></div>
              <div className="flex flex-wrap items-center gap-3">
                {waitlist ? (
                  <>
                    <button onClick={() => setWaitlist(p.id)} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95" style={{ background: p.accent, fontSize: "15px" }}>Join the waitlist <ArrowRight size={16} /></button>
                    <CTAButton to="/contact" variant="outline">Contact us</CTAButton>
                  </>
                ) : launch ? (
                  <>
                    <CTAButton href={p.appHref} external variant="gradient" style={{ background: p.accent }}>{p.accountLinked ? `Launch ${p.name}` : `Open ${p.name}`} <ArrowRight size={16} /></CTAButton>
                    {p.accountLinked ? (
                      <CTAButton href={p.appHref} external variant="outline">Sign in</CTAButton>
                    ) : (
                      <CTAButton to="/contact" variant="outline">Contact us</CTAButton>
                    )}
                  </>
                ) : (
                  <>
                    <CTAButton to="/contact" variant="gradient" style={{ background: p.accent }}>Book a demo <ArrowRight size={16} /></CTAButton>
                    <CTAButton to="/contact" variant="outline">Talk to sales</CTAButton>
                  </>
                )}
              </div>
              {p.mobile && (
                <div className="mt-8">
                  <p style={{ color: colors.textTertiary, fontSize: "13px", marginBottom: "12px" }}>Download the mobile app</p>
                  <StoreBadges appStore={p.mobile.appStore} playStore={p.mobile.playStore} theme="dark" size="sm" />
                </div>
              )}
            </Reveal>
            <Reveal from="right">
              <div className="relative rounded-[28px] overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: shadow.lg }}>
                <ImageWithFallback src={c.heroImage} alt={p.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p.accent}22 0%, transparent 55%)` }} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      {c.stats && (
        <section style={{ background: colors.bg, padding: "48px 0", borderTop: `1px solid ${colors.hairline}`, borderBottom: `1px solid ${colors.hairline}` }}>
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-8 text-center">
              {c.stats.map((s) => (
                <div key={s.label}>
                  <p style={{ fontWeight: 700, fontSize: "30px", color: p.accent, letterSpacing: "-0.02em" }}>{s.value}</p>
                  <p style={{ color: colors.textSecondary, fontSize: "14px", marginTop: "6px" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <Section background={colors.surface} pad="lg">
        <Reveal className="mb-14 max-w-xl">
          <p style={{ color: p.accent, fontSize: "14px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "12px" }}>{c.featuresEyebrow}</p>
          <h2>{c.featuresTitle}</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {c.features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="flex flex-col gap-3 p-7 rounded-3xl h-full" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1" style={{ background: `${p.accent}14` }}>
                  <Check size={16} style={{ color: p.accent }} />
                </div>
                <h3 style={{ fontSize: "17px" }}>{f.title}</h3>
                <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Split deep-dive */}
      <Section background={colors.bg} pad="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal from="left">
            <h2 style={{ marginBottom: "20px" }}>{c.splitTitle}</h2>
            <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.8, marginBottom: "24px" }}>{c.splitBody}</p>
            <ul className="flex flex-col gap-3.5">
              {c.splitBullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${p.accent}16` }}>
                    <Check size={12} style={{ color: p.accent }} />
                  </span>
                  <span style={{ color: colors.heading, fontSize: "15.5px", lineHeight: 1.5 }}>{b}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal from="right">
            <div className="rounded-[28px] overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: shadow.lg }}>
              <ImageWithFallback src={c.splitImage} alt={c.splitTitle} className="w-full h-full object-cover" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* CTA */}
      <section style={{ background: p.accent, padding: "clamp(72px,9vw,110px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", marginBottom: "18px" }}>{c.ctaTitle}</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "18px", lineHeight: 1.65, marginBottom: "32px" }}>{c.ctaBody}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {waitlist ? (
              <button onClick={() => setWaitlist(p.id)} className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold transition-all hover:opacity-95 active:scale-[0.98]" style={{ background: "#fff", color: p.accent, fontSize: "16px" }}>Join the waitlist</button>
            ) : launch ? (
              <CTAButton href={p.appHref} external variant="solid" size="lg" style={{ background: "#fff", color: p.accent }}>{p.accountLinked ? `Launch ${p.name}` : `Open ${p.name}`}</CTAButton>
            ) : (
              <CTAButton to="/contact" variant="solid" size="lg" style={{ background: "#fff", color: p.accent }}>Book a demo</CTAButton>
            )}
            <CTAButton to="/products" variant="ghost-light" size="lg">All products</CTAButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
