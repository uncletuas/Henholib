import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CTAButton } from "../components/CTAButton";
import { TypeCycle } from "../components/TypeCycle";
import { colors } from "../lib/brand";
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

// One phrase per thing we actually build: HMS7, Henholib, the HMO side of the
// platform, Beacon, Modus, and Pal. Health leads because it is the largest part
// of the business and because the first phrase is what shows under
// reduced-motion, but the cycle is no longer healthcare-only.
//
// Each has to read as a sentence after "The intelligent infrastructure for",
// and TypeCycle renders with `white-space: nowrap` — a phrase longer than the
// ~20 characters here cannot wrap and will push the headline sideways on a
// narrow screen. Keep them short.
const AUDIENCES = [
  "hospitals & clinics",
  "patients everywhere",
  "health plans & HMOs",
  "schools & campuses",
  "buildings & estates",
  "the work you do",
];

export function HomePage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
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
            <h1 style={{ marginBottom: "20px", letterSpacing: "-0.035em", lineHeight: 1.02 }}>
              The intelligent infrastructure<br />
              for <TypeCycle phrases={AUDIENCES} />
            </h1>

            <p
              className="mx-auto lg:mx-0"
              style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.6, maxWidth: "500px", marginBottom: "32px" }}
            >
              We build the software that hospitals, health plans, schools and
              facilities teams run on, and the AI coworker that works beside
              them. Less time fighting systems, more time doing the work.
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
      {/* Subtle ground: it sits between the white hero and the white HMS7
          band, and three white sections in a row read as one long page. */}
      <RealLifeSection />

      {/* ── HMS7, THE HOSPITAL END ── */}
      <Section background={colors.surface} pad="md" divided>
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
      <Section background={colors.surface} pad="md" divided>
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
