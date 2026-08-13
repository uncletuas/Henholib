import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { CTAButton } from "../components/CTAButton";
import { GlassCard } from "../components/GlassCard";
import { TypingChat } from "../components/TypingChat";
import { TypeCycle } from "../components/TypeCycle";
import { EcosystemCard } from "../components/EcosystemCard";
import { ecosystemProducts } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";
import { useAuth } from "../context/AuthContext";


// Rotating audiences for the hero headline, the kinds of people, organizations,
// industries, and governments Loopital builds for.
const AUDIENCES = [
  "modern organizations",
  "growing businesses",
  "hospitals & clinics",
  "government & public service",
  "banks & fintechs",
  "schools & universities",
  "ambitious startups",
  "enterprises across Africa",
];


export function HomePage() {
  const { setWaitlist } = useAuth();
  return (
    <div>
      {/* ── HERO (centered) ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="brand-aura absolute" style={{ top: "-20%", right: "2%", width: "52vw", height: "52vw", background: "radial-gradient(circle at 50% 50%, rgba(14,165,233,0.18), rgba(16,185,129,0.10) 42%, transparent 70%)", filter: "blur(34px)" }} />
          <div className="brand-aura-2 absolute" style={{ bottom: "-26%", left: "0%", width: "48vw", height: "48vw", background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.15), transparent 70%)", filter: "blur(38px)" }} />
          <div className="brand-aura absolute" style={{ top: "8%", left: "34%", width: "36vw", height: "36vw", background: "radial-gradient(circle at 50% 50%, rgba(109,106,240,0.12), transparent 72%)", filter: "blur(44px)", animationDelay: "-9s" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative" style={{ padding: "clamp(64px,8vw,110px) 24px clamp(56px,7vw,90px)" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 glass" style={{ fontSize: "12.5px" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: gradientBrand }} />
              <span style={{ color: colors.heading, fontWeight: 600, letterSpacing: "0.02em" }}>Software · AI · Enterprise platforms</span>
            </span>
            <h1 style={{ marginBottom: "18px" }}>
              The intelligent infrastructure for<br />
              <TypeCycle phrases={AUDIENCES} />
            </h1>
            <p className="mx-auto" style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.6, maxWidth: "540px", marginBottom: "28px" }}>
              Loopital builds products, AI, and platforms that help businesses and institutions
              operate at a fundamentally higher level.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <CTAButton to="/products" size="md" variant="gradient">Explore products <ArrowRight size={16} /></CTAButton>
              <CTAButton to="/contact" size="md" variant="outline">Talk to us</CTAButton>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto" style={{ marginTop: "clamp(40px,5vw,64px)" }}>
            <TypingChat />
          </motion.div>
        </div>
      </section>

      {/* ── ECOSYSTEM (needs-first) ── */}
      <Section background={colors.surface} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "12px" }}>THE LOOPITAL ECOSYSTEM</p>
          <h2 style={{ marginBottom: "12px" }}>Find the platform built for your need.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.6 }}>
            From your own health to running a hospital, a facility, or a school, each platform solves a specific problem, works on its own, and connects to the rest.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ecosystemProducts.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <EcosystemCard product={p} />
            </Reveal>
          ))}
        </div>
      </Section>


      {/* ── AI AT THE CORE (compact glass beat) ── */}
      <Section background={colors.surface} pad="md">
        <Reveal>
          <GlassCard interactive={false} className="p-8 lg:p-10" style={{ borderRadius: "28px" }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: `${colors.blue}0f`, border: `1px solid ${colors.blue}22` }}>
                  <Sparkles size={13} style={{ color: colors.blue }} />
                  <span style={{ color: colors.blue, fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.03em" }}>AI AT THE CORE</span>
                </span>
                <h2 style={{ marginBottom: "14px" }}>AI built in from day one, <GradientText>not bolted on later</GradientText>.</h2>
                <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.7, marginBottom: "22px", maxWidth: "560px" }}>
                  Led by Pal, intelligence runs through everything we build, research, content,
                  automation, and decision support, so your people focus on higher-value work.
                </p>
                <button onClick={() => setWaitlist("stack62")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: gradientBrand, fontSize: "14px" }}>Join the Pal waitlist <ArrowRight size={15} /></button>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {["Research & synthesis", "Content generation", "Workflow automation", "Decision support"].map((h) => (
                  <span key={h} className="px-3.5 py-2 rounded-full" style={{ background: colors.bg, border: `1px solid ${colors.hairline}`, color: colors.heading, fontSize: "13px", fontWeight: 500 }}>{h}</span>
                ))}
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </Section>

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(72px,9vw,110px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>See what Loopital can do for your organization.</h2>
          <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "17px", lineHeight: 1.6, marginBottom: "30px" }}>
            Explore the product line or talk to us about building something specific for your team.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <CTAButton to="/products" variant="solid" size="md" style={{ background: "#fff", color: colors.heading }}>Explore products</CTAButton>
            <CTAButton to="/contact" variant="ghost-light" size="md">Talk to us</CTAButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
