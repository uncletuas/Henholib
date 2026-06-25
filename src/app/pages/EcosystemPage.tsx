import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { CTAButton } from "../components/CTAButton";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { products } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";
import loopitalLogo from "../../imports/loopital.com_logo.png";

// Node positions on the 1000×620 map viewBox, one per product district.
const nodes = [
  { id: "stack62", x: 200, y: 150 },
  { id: "sart34", x: 800, y: 150 },
  { id: "hms7", x: 200, y: 470 },
  { id: "fms13", x: 800, y: 470 },
] as const;

const HUB = { x: 500, y: 310 };

export function EcosystemPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: colors.ink, padding: "clamp(96px,12vw,150px) 0 clamp(64px,8vw,90px)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="brand-aura absolute" style={{ top: "-10%", left: "30%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(14,165,233,0.18), transparent 65%)", filter: "blur(30px)" }} />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <Reveal>
            <p style={{ color: "#7DD3FC", fontSize: "14px", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "20px" }}>THE LOOPITAL ECOSYSTEM</p>
            <h1 style={{ color: "#F5F5F7", marginBottom: "24px" }}>
              One connected <GradientText>digital infrastructure</GradientText>.
            </h1>
            <p className="mx-auto" style={{ color: "#A1A1AA", fontSize: "20px", lineHeight: 1.65, maxWidth: "620px" }}>
              Explore the Loopital ecosystem as a living city — where intelligence, communication,
              healthcare, and enterprise governance work together seamlessly.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The map */}
      <section style={{ background: colors.ink, paddingBottom: "clamp(80px,10vw,130px)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-[32px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))" }}>
            <svg viewBox="0 0 1000 620" className="w-full h-auto" style={{ display: "block" }}>
              <defs>
                <linearGradient id="flow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="50%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* connection lines (animated dash flow) */}
              {nodes.map((n, i) => (
                <motion.line
                  key={`l-${n.id}`}
                  x1={HUB.x} y1={HUB.y} x2={n.x} y2={n.y}
                  stroke="url(#flow)" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray="6 10"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.9 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.15 }}
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-160" dur="4s" repeatCount="indefinite" />
                </motion.line>
              ))}

              {/* product nodes */}
              {nodes.map((n, i) => {
                const p = products.find((pr) => pr.id === n.id)!;
                return (
                  <motion.g
                    key={n.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.15 }}
                  >
                    <circle cx={n.x} cy={n.y} r="58" fill="rgba(255,255,255,0.04)" stroke={`${p.accent}`} strokeOpacity="0.5" strokeWidth="1.5" />
                    <circle cx={n.x} cy={n.y} r="40" fill="#0B0E17" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <image href={p.logo} x={n.x - 22} y={n.y - 22} width="44" height="44" />
                    <text x={n.x} y={n.y + 86} textAnchor="middle" fill="#F5F5F7" fontSize="20" fontWeight="700">{p.name}</text>
                    <text x={n.x} y={n.y + 108} textAnchor="middle" fill={p.accent} fontSize="13" fontWeight="600">{p.theme}</text>
                  </motion.g>
                );
              })}

              {/* central hub */}
              <motion.g initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <circle cx={HUB.x} cy={HUB.y} r="74" fill="rgba(255,255,255,0.05)" stroke="url(#flow)" strokeWidth="2" />
                <circle cx={HUB.x} cy={HUB.y} r="52" fill="#0B0E17" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <image href={loopitalLogo} x={HUB.x - 34} y={HUB.y - 16} width="68" height="32" style={{ filter: "brightness(0) invert(1)" }} />
              </motion.g>
            </svg>
          </div>
          <p className="text-center mt-8" style={{ color: "#71717A", fontSize: "14px" }}>
            Each product is a district of the same intelligent infrastructure.
          </p>
        </div>
      </section>

      {/* District story sections */}
      {products.map((p, i) => (
        <Section key={p.id} background={i % 2 === 0 ? colors.bg : colors.surface} pad="md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <Reveal className="lg:col-span-1" from="none">
              <span style={{ fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 700, color: `${p.accent}`, opacity: 0.25, letterSpacing: "-0.04em" }}>0{i + 1}</span>
            </Reveal>
            <Reveal className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${p.accent}12`, border: `1px solid ${p.accent}22` }}>
                  <ImageWithFallback src={p.logo} alt={p.name} className="w-7 h-7 object-contain" />
                </div>
                <span style={{ color: p.accent, fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em" }}>{p.theme.toUpperCase()}</span>
              </div>
              <h2 style={{ marginBottom: "16px" }}>{p.name} powers {p.theme.replace("The Future of ", "").toLowerCase()}.</h2>
              <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.75, marginBottom: "20px" }}>{p.description}</p>
              <Link to={p.detailHref} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: p.accent }}>
                Explore {p.name} <ArrowRight size={14} />
              </Link>
            </Reveal>
            <Reveal className="lg:col-span-4" from="right">
              <div className="flex flex-wrap gap-2">
                {p.highlights.map((h) => (
                  <span key={h} className="px-3.5 py-2 rounded-full text-sm" style={{ background: colors.surfaceMuted, color: colors.heading, border: `1px solid ${colors.hairline}` }}>{h}</span>
                ))}
              </div>
            </Reveal>
          </div>
        </Section>
      ))}

      {/* Closing */}
      <section style={{ background: gradientBrand, padding: "clamp(80px,10vw,120px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", marginBottom: "20px" }}>Together, they form a connected digital future.</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "19px", lineHeight: 1.65, marginBottom: "36px" }}>
            Loopital isn't simply launching products — we're building the technology ecosystem of the
            next generation of work, communication, healthcare, and enterprise.
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
