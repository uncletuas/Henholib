import { Link } from "react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { CTAButton } from "../components/CTAButton";
import { LaunchAppButton } from "../components/LaunchAppButton";
import { PlatformPills } from "../components/PlatformPills";
import { products } from "../config/products";
import { colors, gradientBrand, shadow } from "../lib/brand";

const imagery: Record<string, string> = {
  stack62: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  sart34: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  hms7: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  henholib: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  fms13: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
};

export function ProductsPage() {
  return (
    <div>
      {/* Header */}
      <Section background={colors.surface} pad="md">
        <Reveal className="max-w-3xl">
          <p style={{ color: colors.blue, fontSize: "14px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "16px" }}>PRODUCTS</p>
          <h1 style={{ marginBottom: "24px" }}>
            Software built to <GradientText>solve real problems</GradientText>.
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "20px", lineHeight: 1.7 }}>
            Each Loopital product is a focused, enterprise-grade platform for a specific operational
            challenge — and together they form one connected ecosystem.
          </p>
        </Reveal>
      </Section>

      {/* Product list */}
      <Section background={colors.bg} pad="md">
        <div className="flex flex-col gap-24">
          {products.map((p, i) => {
            const reversed = i % 2 === 1;
            return (
              <Reveal key={p.id}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                  <div className={`relative ${reversed ? "lg:order-2" : ""}`}>
                    <div className="rounded-[28px] overflow-hidden" style={{ aspectRatio: "3/2", boxShadow: shadow.lg }}>
                      <ImageWithFallback src={imagery[p.id]} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p.accent}22 0%, transparent 55%)` }} />
                    </div>
                  </div>

                  <div className={`flex flex-col gap-5 ${reversed ? "lg:order-1" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: `${p.accent}12`, border: `1px solid ${p.accent}22` }}>
                        <ImageWithFallback src={p.logo} alt={p.name} className="w-10 h-10 object-contain" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "22px", color: colors.heading }}>{p.name}</p>
                        <p style={{ fontSize: "13px", color: p.accent, fontWeight: 600 }}>{p.category}</p>
                      </div>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.6rem,2.6vw,2.2rem)" }}>{p.tagline}</h2>
                    <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.75 }}>{p.description}</p>
                    <PlatformPills platforms={p.platforms} />
                    {p.offer && (
                      <div>
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: `${p.accent}14`, color: p.accent, fontSize: "13px", fontWeight: 600 }}>
                          <Sparkles size={13} /> {p.offer}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1">
                      {p.ctaType === "launch" ? (
                        p.accountLinked ? (
                          <LaunchAppButton product={p} background={p.accent}>Open {p.name}</LaunchAppButton>
                        ) : (
                          <>
                            <CTAButton href={p.appHref} external variant="gradient" style={{ background: p.accent }}>
                              Open {p.name} <ArrowRight size={15} />
                            </CTAButton>
                            <CTAButton to={p.detailHref} variant="outline">Learn more</CTAButton>
                          </>
                        )
                      ) : (
                        <>
                          <CTAButton to={p.detailHref} variant="gradient" style={{ background: p.accent }}>
                            Explore {p.name} <ArrowRight size={15} />
                          </CTAButton>
                          <CTAButton to="/contact" variant="outline">Book a demo</CTAButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Upcoming */}
      <Section background={colors.surface} pad="md" width="narrow">
        <Reveal className="text-center flex flex-col items-center gap-5">
          <span className="inline-flex px-4 py-1.5 rounded-full" style={{ background: colors.surfaceMuted, border: `1px solid ${colors.hairline}` }}>
            <span style={{ color: colors.textSecondary, fontSize: "13px", fontWeight: 500 }}>More coming soon</span>
          </span>
          <h2>Our product portfolio is growing.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.75, maxWidth: "520px" }}>
            Loopital continuously develops new software. Follow News &amp; Insights to be among the first
            to learn about upcoming launches.
          </p>
          <Link to="/insights" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: colors.blue }}>
            Follow our news <ArrowRight size={14} />
          </Link>
          <div className="w-full h-px mt-2" style={{ background: gradientBrand, opacity: 0.4 }} />
        </Reveal>
      </Section>
    </div>
  );
}
