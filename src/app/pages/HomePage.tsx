import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { CTAButton } from "../components/CTAButton";
import { ProductLink } from "../components/ProductLink";
import { GlassCard } from "../components/GlassCard";
import { CountUp } from "../components/CountUp";
import { TypingChat } from "../components/TypingChat";
import { ProductPostCard } from "../components/ProductPostCard";
import { ProductSwitcher } from "../components/ProductSwitcher";
import { products } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";
import { useAuth } from "../context/AuthContext";

const servicesImg = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

const stats = [
  { to: products.length, label: "Products in the ecosystem" },
  { to: 7, label: "Academy courses" },
  { to: 3, suffix: "mo", label: "Free to get started" },
];

const services = ["Web Development", "Mobile Apps", "AI Solutions", "Enterprise Systems", "Digital Transformation", "Tech Consulting"];

export function HomePage() {
  const { setWaitlist } = useAuth();
  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
        {/* live mesh backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="brand-aura absolute" style={{ top: "-18%", right: "-8%", width: "58vw", height: "58vw", background: "radial-gradient(circle at 50% 50%, rgba(14,165,233,0.18), rgba(16,185,129,0.10) 42%, transparent 70%)", filter: "blur(30px)" }} />
          <div className="brand-aura-2 absolute" style={{ bottom: "-28%", left: "-14%", width: "50vw", height: "50vw", background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.16), transparent 70%)", filter: "blur(34px)" }} />
          <div className="brand-aura absolute" style={{ top: "20%", left: "38%", width: "34vw", height: "34vw", background: "radial-gradient(circle at 50% 50%, rgba(109,106,240,0.12), transparent 72%)", filter: "blur(40px)", animationDelay: "-9s" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative" style={{ padding: "clamp(56px,7vw,96px) 24px clamp(40px,5vw,64px)" }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 glass" style={{ fontSize: "12.5px" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: gradientBrand }} />
                <span style={{ color: colors.heading, fontWeight: 600, letterSpacing: "0.02em" }}>Software · AI · Enterprise platforms</span>
              </span>
              <h1 style={{ marginBottom: "18px" }}>
                The intelligent infrastructure for <GradientText>modern organizations</GradientText>.
              </h1>
              <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.6, maxWidth: "500px", marginBottom: "26px" }}>
                Loopital builds products, AI, and platforms that help businesses and institutions
                operate at a fundamentally higher level.
              </p>
              <div className="flex flex-wrap gap-3">
                <CTAButton to="/products" size="md" variant="gradient">Explore products <ArrowRight size={16} /></CTAButton>
                <CTAButton to="/contact" size="md" variant="outline">Talk to us</CTAButton>
              </div>

              {/* logo strip */}
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                {products.map((p) => (
                  <ProductLink key={p.id} product={p} className="flex items-center gap-2 transition-opacity hover:opacity-100" style={{ opacity: 0.72 }}>
                    <ImageWithFallback src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
                    <span style={{ color: colors.heading, fontSize: "14px", fontWeight: 600 }}>{p.name}</span>
                  </ProductLink>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
              <TypingChat />
            </motion.div>
          </div>

          {/* stats */}
          <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl px-4 py-4 text-center">
                <p style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: colors.heading }}>
                  <GradientText><CountUp to={s.to} suffix={s.suffix} /></GradientText>
                </p>
                <p style={{ fontSize: "12.5px", color: colors.textSecondary, marginTop: "2px", lineHeight: 1.3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS: post-card feed ── */}
      <Section background={colors.surface} pad="md">
        <Reveal className="max-w-2xl mb-10">
          <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "12px" }}>OUR PRODUCTS</p>
          <h2 style={{ marginBottom: "12px" }}>One intelligent infrastructure, five focused products.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.6 }}>
            Each powerful on its own, designed to work together — for the way modern organizations work, communicate, operate, and grow.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <ProductPostCard product={p} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── INTERACTIVE SWITCHER ── */}
      <Section background={colors.bg} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "12px" }}>EXPLORE THE LINEUP</p>
          <h2>See each product in action.</h2>
        </Reveal>
        <Reveal><ProductSwitcher /></Reveal>
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
                <h2 style={{ marginBottom: "14px" }}>AI built in from day one — <GradientText>not bolted on later</GradientText>.</h2>
                <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.7, marginBottom: "22px", maxWidth: "560px" }}>
                  Led by STACK62, intelligence runs through everything we build — research, content,
                  automation, and decision support, so your people focus on higher-value work.
                </p>
                <button onClick={() => setWaitlist("stack62")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: gradientBrand, fontSize: "14px" }}>Join the STACK62 waitlist <ArrowRight size={15} /></button>
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

      {/* ── SERVICES ── */}
      <Section background={colors.bg} pad="md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <Reveal from="left">
            <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "12px" }}>SERVICES</p>
            <h2 style={{ marginBottom: "14px" }}>We build technology for other organizations too.</h2>
            <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.7, marginBottom: "22px" }}>
              Beyond our own products, Loopital designs and delivers websites, mobile apps, enterprise
              platforms, and custom digital systems — held to the same engineering standard.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-7">
              {services.map((s) => (
                <div key={s} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl glass">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: gradientBrand }} />
                  <span style={{ color: colors.heading, fontSize: "13.5px" }}>{s}</span>
                </div>
              ))}
            </div>
            <CTAButton to="/services" variant="outline" size="sm">See all services <ArrowRight size={15} /></CTAButton>
          </Reveal>
          <Reveal from="right">
            <GlassCard className="p-2.5">
              <div className="rounded-[20px] overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <ImageWithFallback src={servicesImg} alt="Services" className="w-full h-full object-cover" />
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </Section>

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(64px,8vw,96px) 0" }}>
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
