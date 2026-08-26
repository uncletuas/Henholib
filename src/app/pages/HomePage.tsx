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
import { ProductGrid } from "../components/home/ProductGrid";
import { RealLifeSection } from "../components/home/RealLifeSection";

/**
 * The homepage.
 *
 * Ordered the way a stranger reads: what we are for, the app running, who it
 * is for, the hospital end of it, the mission, then everything we build. Short
 * blocks. The app does the persuading, so the copy stays out of the way.
 */

const AUDIENCES = [
  "modern healthcare",
  "hospitals & clinics",
  "doctors & care teams",
  "patients everywhere",
  "health across Africa",
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
              We build the software that hospitals, health plans and patients
              run on, so getting care is faster and delivering it is simpler.
              One network, from the clinic to the phone in your hand.
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

      {/* ── FOR REAL LIFE ── */}
      <RealLifeSection />

      {/* ── HMS7, THE HOSPITAL END ── */}
      <Section background={wash.sky} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <h2 style={{ marginBottom: "12px" }}>The other end of the network.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16.5px", lineHeight: 1.6 }}>
            HMS7 runs the hospital that answers. Records, appointments, billing,
            pharmacy and claims in one place, with HMOs and insurers managing
            their members on the same platform.
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

      {/* ── WHAT WE BUILD ── */}
      <Section background={colors.surface} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <h2 style={{ marginBottom: "12px" }}>What we build.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16.5px", lineHeight: 1.6 }}>
            Software for everyone in the chain: the patient looking for care, the
            hospital delivering it, and the health plan paying for it.
          </p>
        </Reveal>
        <ProductGrid />
      </Section>
    </div>
  );
}
