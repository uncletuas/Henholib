import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { CTAButton } from "../components/CTAButton";
import { ProductLink } from "../components/ProductLink";
import { PlatformPills } from "../components/PlatformPills";
import { StoreBadges } from "../components/StoreBadges";
import { products } from "../config/products";
import { colors, gradientBrand, shadow } from "../lib/brand";
import { useAuth } from "../context/AuthContext";

// Tasteful imagery per product theme, unified by gradient overlays.
const imagery: Record<string, string> = {
  stack62: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  sart34: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  hms7: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  henholib: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
  fms13: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
};
const aiImg = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
const servicesImg = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

export function HomePage() {
  const { setWaitlist } = useAuth();
  return (
    <div>
      {/* ── IMMERSIVE HERO ── */}
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: "94vh", background: colors.bg }}>
        {/* ambient blue→green aura */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="brand-aura absolute" style={{ top: "-20%", right: "-10%", width: "70vw", height: "70vw", background: "radial-gradient(circle at 50% 50%, rgba(14,165,233,0.18), rgba(16,185,129,0.10) 40%, transparent 70%)", filter: "blur(20px)" }} />
          <div className="brand-aura absolute" style={{ bottom: "-30%", left: "-15%", width: "55vw", height: "55vw", background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.14), transparent 70%)", filter: "blur(20px)", animationDelay: "-6s" }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 w-full relative text-center py-32">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <h1 style={{ marginBottom: "28px" }}>
              The infrastructure powering<br className="hidden sm:block" /> the next era of{" "}
              <GradientText>intelligent organizations</GradientText>.
            </h1>
            <p className="mx-auto" style={{ color: colors.textSecondary, fontSize: "21px", lineHeight: 1.6, maxWidth: "640px", marginBottom: "40px" }}>
              Loopital builds software products, AI, and enterprise platforms that help businesses
              and institutions operate at a fundamentally higher level.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <CTAButton to="/products" size="lg" variant="gradient">Explore products <ArrowRight size={17} /></CTAButton>
              <CTAButton to="/contact" size="lg" variant="outline">Talk to us</CTAButton>
            </div>
          </motion.div>

          {/* hero product strip */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }} className="mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {products.map((p) => (
              <ProductLink key={p.id} product={p} className="flex items-center gap-2.5 transition-opacity hover:opacity-100" style={{ opacity: 0.75 }}>
                <ImageWithFallback src={p.logo} alt={p.name} className="w-7 h-7 object-contain" />
                <span style={{ color: colors.heading, fontSize: "15px", fontWeight: 600 }}>{p.name}</span>
              </ProductLink>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ECOSYSTEM TEASER ── */}
      <Section background={colors.surface} pad="lg">
        <Reveal className="text-center max-w-3xl mx-auto">
          <p style={{ color: colors.blue, fontSize: "14px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "20px" }}>OUR PRODUCTS</p>
          <h2 style={{ marginBottom: "24px" }}>One intelligent infrastructure for modern organizations.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "19px", lineHeight: 1.65, marginBottom: "36px" }}>
            Purpose-built software platforms for the way modern organizations work, communicate, operate,
            and grow — each powerful on its own and designed to work together seamlessly.
          </p>
          <CTAButton to="/products" variant="solid">Explore all products <ArrowRight size={16} /></CTAButton>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <ProductLink product={p} className="flex flex-col gap-4 p-7 rounded-3xl h-full transition-all duration-300 hover:-translate-y-1 group" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${p.accent}12`, border: `1px solid ${p.accent}22` }}>
                  <ImageWithFallback src={p.logo} alt={p.name} className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "17px", color: colors.heading }}>{p.name}</p>
                  <p style={{ color: p.accent, fontSize: "13px", fontWeight: 500, marginTop: "2px" }}>{p.theme}</p>
                </div>
                <span className="text-sm inline-flex items-center gap-1 mt-auto transition-colors" style={{ color: colors.textSecondary }}>
                  Learn more <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </ProductLink>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── PRODUCT STORY BLOCKS ── */}
      {products.map((p, i) => {
        const reversed = i % 2 === 1;
        return (
          <Section key={p.id} background={i % 2 === 0 ? colors.bg : colors.surface} pad="lg">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-14 items-center`}>
              <Reveal from={reversed ? "left" : "right"} className={reversed ? "lg:order-2" : ""}>
                <div className="relative rounded-[28px] overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: shadow.lg }}>
                  <ImageWithFallback src={imagery[p.id]} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p.accent}22 0%, transparent 55%)` }} />
                </div>
              </Reveal>

              <Reveal from={reversed ? "right" : "left"} className={reversed ? "lg:order-1" : ""}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${p.accent}12`, border: `1px solid ${p.accent}22` }}>
                    <ImageWithFallback src={p.logo} alt={p.name} className="w-7 h-7 object-contain" />
                  </div>
                  <span style={{ color: p.accent, fontSize: "14px", fontWeight: 600, letterSpacing: "0.04em" }}>{p.theme.toUpperCase()}</span>
                </div>
                <h2 style={{ marginBottom: "20px" }}>{p.tagline}</h2>
                <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.7, marginBottom: "24px" }}>{p.description}</p>

                <div className="flex flex-wrap gap-2 mb-7">
                  {p.highlights.map((h) => (
                    <span key={h} className="px-3.5 py-2 rounded-full text-sm" style={{ background: colors.surfaceMuted, color: colors.heading, border: `1px solid ${colors.hairline}` }}>{h}</span>
                  ))}
                </div>

                <div className="mb-6"><PlatformPills platforms={p.platforms} /></div>

                {p.offer && (
                  <div className="mb-5">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: `${p.accent}14`, color: p.accent, fontSize: "13.5px", fontWeight: 600 }}>
                      <Sparkles size={14} /> {p.offer}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {p.ctaType === "waitlist" ? (
                    <>
                      <button onClick={() => setWaitlist(p.id)} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95" style={{ background: p.accent, fontSize: "15px" }}>Join the waitlist <ArrowRight size={16} /></button>
                      <CTAButton to={p.detailHref} variant="outline">Learn more</CTAButton>
                    </>
                  ) : p.ctaType === "launch" ? (
                    <>
                      <CTAButton href={p.appHref} external variant="gradient" style={{ background: p.accent }}>Open {p.name} <ArrowRight size={16} /></CTAButton>
                      <CTAButton to={p.detailHref} variant="outline">Learn more</CTAButton>
                    </>
                  ) : (
                    <>
                      <CTAButton to="/contact" variant="solid">Book a demo <ArrowRight size={16} /></CTAButton>
                      <CTAButton to={p.detailHref} variant="outline">Learn more</CTAButton>
                    </>
                  )}
                </div>

                {p.mobile && (
                  <div className="mt-7">
                    <p style={{ color: colors.textTertiary, fontSize: "13px", marginBottom: "12px" }}>Also available on mobile</p>
                    <StoreBadges appStore={p.mobile.appStore} playStore={p.mobile.playStore} theme="dark" size="sm" />
                  </div>
                )}
              </Reveal>
            </div>
          </Section>
        );
      })}

      {/* ── AI THREAD (single dramatic dark beat) ── */}
      <section style={{ background: colors.ink, padding: "clamp(96px,12vw,160px) 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal from="left">
              <div className="rounded-[28px] overflow-hidden relative" style={{ aspectRatio: "4/3", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
                <ImageWithFallback src={aiImg} alt="AI built in" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(16,185,129,0.15) 60%, transparent 80%)" }} />
              </div>
            </Reveal>
            <Reveal from="right">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <Sparkles size={14} style={{ color: "#7DD3FC" }} />
                <span style={{ color: "#9FE6FF", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em" }}>AI AT THE CORE</span>
              </span>
              <h2 style={{ color: "#F5F5F7", marginBottom: "22px" }}>
                AI built in from day one — <GradientText>not bolted on later</GradientText>.
              </h2>
              <p style={{ color: "#A1A1AA", fontSize: "18px", lineHeight: 1.8, marginBottom: "28px" }}>
                Led by STACK62, intelligence runs through everything we build — handling research,
                content, automation, and decision support so people can focus on higher-value work.
              </p>
              <button onClick={() => setWaitlist("stack62")} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95" style={{ background: gradientBrand, fontSize: "15px" }}>Join the STACK62 waitlist <ArrowRight size={16} /></button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SERVICES STRIP ── */}
      <Section background={colors.surface} pad="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal from="left">
            <p style={{ color: colors.blue, fontSize: "14px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "16px" }}>SERVICES</p>
            <h2 style={{ marginBottom: "20px" }}>We build technology for other organizations too.</h2>
            <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.75, marginBottom: "28px" }}>
              Beyond our own products, Loopital designs and delivers websites, mobile apps, enterprise
              platforms, and custom digital systems — held to the same engineering standard as everything we ship.
            </p>
            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {["Web Development", "Mobile Apps", "AI Solutions", "Enterprise Systems", "Digital Transformation", "Tech Consulting"].map((s) => (
                <div key={s} className="flex items-center gap-2.5 px-4 py-3 rounded-2xl" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: gradientBrand }} />
                  <span style={{ color: colors.heading, fontSize: "14px" }}>{s}</span>
                </div>
              ))}
            </div>
            <CTAButton to="/services" variant="outline">See all services <ArrowRight size={16} /></CTAButton>
          </Reveal>
          <Reveal from="right">
            <div className="rounded-[28px] overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: shadow.lg }}>
              <ImageWithFallback src={servicesImg} alt="Services" className="w-full h-full object-cover" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(80px,10vw,120px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", marginBottom: "20px" }}>See what Loopital can do for your organization.</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "19px", lineHeight: 1.65, marginBottom: "36px" }}>
            Explore the product line or talk to us about building something specific for your team.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <CTAButton to="/products" variant="solid" size="lg" style={{ background: "#fff", color: colors.heading }}>Explore products</CTAButton>
            <CTAButton to="/contact" variant="ghost-light" size="lg">Talk to us</CTAButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
