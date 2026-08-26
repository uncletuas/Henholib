import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { CTAButton } from "../components/CTAButton";
import { PalCoworkerPreview } from "../components/pal/PalCoworkerPreview";
import { TypeCycle } from "../components/TypeCycle";
import { wash, colors, gradientBrand } from "../lib/brand";
import { ProductShowcase } from "../components/home/ProductShowcase";
import { CommitmentSection } from "../components/home/CommitmentSection";
import { HenholibCta } from "../components/home/HenholibCta";


// Rotating audiences for the hero headline. Health leads, because health is what
// Loopital is for: the patient first, then the people and institutions who care
// for them. The wider portfolio lives on /products rather than in this rotation.
const AUDIENCES = [
  "modern healthcare",
  "hospitals & clinics",
  "doctors & care teams",
  "patients everywhere",
  "public health systems",
  "pharmacies & labs",
  "health across Africa",
];


export function HomePage() {
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
              <span style={{ color: colors.heading, fontWeight: 600, letterSpacing: "0.02em" }}>Health technology · AI · Clinical platforms</span>
            </span>
            <h1 style={{ marginBottom: "18px" }}>
              The intelligent infrastructure for<br />
              <TypeCycle phrases={AUDIENCES} />
            </h1>
            <p className="mx-auto" style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.6, maxWidth: "540px", marginBottom: "28px" }}>
              Loopital is a health technology company. We build the software that hospitals run on
              and the app that puts your own health in your hands — connected, so care doesn't stop
              at the door.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <CTAButton to="/products" size="md" variant="gradient">Explore products <ArrowRight size={16} /></CTAButton>
              <CTAButton to="/contact" size="md" variant="outline">Talk to us</CTAButton>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto" style={{ marginTop: "clamp(40px,5vw,64px)" }}>
            <PalCoworkerPreview />
          </motion.div>
        </div>
      </section>

      {/* ── HEALTH PLATFORMS (live demos) ── */}
      {/* Each tile runs a working miniature of the product rather than a
          screenshot: the demos loop, pause off-screen, and settle on their end
          state when the reader prefers reduced motion. */}
      <Section background={wash.sky} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <h2 style={{ marginBottom: "12px" }}>Health technology, both sides of it.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.6 }}>
            Care breaks down in the gap between the patient and the hospital. We build both ends of
            it — Henholib puts your records, your doctor and your emergency call in your pocket, and
            HMS7 runs the hospital that answers. They are one network, so the hospital you book with
            is the system your care actually happens in.
          </p>
          <p style={{ color: colors.textTertiary, fontSize: "15px", lineHeight: 1.6, marginTop: "12px" }}>
            We build beyond health too, for facilities, schools and teams.{" "}
            <Link to="/products" style={{ color: colors.blue, fontWeight: 600 }}>
              See the full portfolio →
            </Link>
          </p>
        </Reveal>
        <ProductShowcase />
      </Section>

      {/* ── COMMITMENT (full-bleed, footage behind) ── */}
      <CommitmentSection />

      {/* ── CLOSING: Henholib ── */}
      <HenholibCta />
    </div>
  );
}
