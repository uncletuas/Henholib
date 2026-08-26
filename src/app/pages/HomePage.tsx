import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CTAButton } from "../components/CTAButton";
import { TypeCycle } from "../components/TypeCycle";
import { wash, colors, gradientBrand } from "../lib/brand";
import { HenholibShowcase } from "../components/home/HenholibShowcase";
import { ProductShowcase } from "../components/home/ProductShowcase";
import { CommitmentSection } from "../components/home/CommitmentSection";
import { HenholibCta } from "../components/home/HenholibCta";

/**
 * The homepage.
 *
 * Ordered the way a stranger reads: what we are for, the app running, the
 * problem we picked, the two products, the mission, the ask. Short blocks. The
 * app itself does the persuading, so the copy around it stays out of the way.
 */

const AUDIENCES = [
  "modern healthcare",
  "hospitals & clinics",
  "doctors & care teams",
  "patients everywhere",
  "health across Africa",
];

/** The problem, in three numbers. Concrete beats adjectives. */
const PROBLEM = [
  {
    stat: "Paper",
    line: "Most hospital records still live on paper, so nothing follows the patient out the door.",
  },
  {
    stat: "Hours",
    line: "Finding a hospital with the right specialist, or blood in stock, still means phone calls.",
  },
  {
    stat: "Cash",
    line: "Bills settle at a counter, in a queue, in a building you had to travel to.",
  },
];

export function HomePage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="brand-aura absolute" style={{ top: "-22%", right: "0%", width: "54vw", height: "54vw", background: "radial-gradient(circle at 50% 50%, rgba(242,109,33,0.20), rgba(13,159,121,0.12) 42%, transparent 70%)", filter: "blur(38px)" }} />
          <div className="brand-aura-2 absolute" style={{ bottom: "-28%", left: "-4%", width: "50vw", height: "50vw", background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.14), transparent 70%)", filter: "blur(42px)" }} />
        </div>

        <div
          className="max-w-7xl mx-auto px-6 relative grid items-center gap-10 lg:grid-cols-2"
          style={{ padding: "clamp(56px,7vw,96px) 24px clamp(48px,6vw,80px)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 glass" style={{ fontSize: "12.5px" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: gradientBrand }} />
              <span style={{ color: colors.heading, fontWeight: 600, letterSpacing: "0.02em" }}>
                Health technology, built in Africa
              </span>
            </span>

            <h1 style={{ marginBottom: "18px" }}>
              The intelligent infrastructure for<br />
              <TypeCycle phrases={AUDIENCES} />
            </h1>

            <p
              className="mx-auto lg:mx-0"
              style={{ color: colors.textSecondary, fontSize: "17.5px", lineHeight: 1.6, maxWidth: "520px", marginBottom: "28px" }}
            >
              Your records, your doctor and your emergency call belong in your
              pocket. The hospital that answers should run on the same network.
              We build both ends.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <CTAButton to="/products/henholib" size="md" variant="gradient">
                Get Henholib <ArrowRight size={16} />
              </CTAButton>
              <CTAButton to="/products/hms7" size="md" variant="outline">
                For hospitals
              </CTAButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <HenholibShowcase scale={0.78} />
          </motion.div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <Section background={colors.surface} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <p style={{ color: colors.rose, fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px" }}>
            THE PROBLEM
          </p>
          <h2 style={{ marginBottom: "12px" }}>Care breaks down in the gaps.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16.5px", lineHeight: 1.6 }}>
            Not in the consulting room. In everything around it.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3">
          {PROBLEM.map((p, i) => (
            <Reveal key={p.stat} delay={i * 0.07}>
              <div
                className="h-full"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.hairline}`,
                  borderRadius: 18,
                  padding: "22px 20px",
                }}
              >
                <p style={{ fontSize: "26px", fontWeight: 800, color: colors.heading, marginBottom: 8 }}>
                  {p.stat}
                </p>
                <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.6 }}>
                  {p.line}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── THE TWO PLATFORMS ── */}
      <Section background={wash.sky} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <h2 style={{ marginBottom: "12px" }}>Both ends of the same network.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16.5px", lineHeight: 1.6 }}>
            Henholib is the patient's side. HMS7 runs the hospital that answers.
            Book on one and it lands in the other.
          </p>
          <p style={{ color: colors.textTertiary, fontSize: "15px", lineHeight: 1.6, marginTop: "10px" }}>
            We build beyond health too.{" "}
            <Link to="/products" style={{ color: colors.blue, fontWeight: 600 }}>
              See everything →
            </Link>
          </p>
        </Reveal>
        <ProductShowcase />
      </Section>

      {/* ── MISSION ── */}
      <CommitmentSection />

      {/* ── CLOSING ── */}
      <HenholibCta />
    </div>
  );
}
