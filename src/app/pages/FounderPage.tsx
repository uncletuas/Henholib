import { ArrowRight, Sparkles, Landmark, GraduationCap, Award } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { CTAButton } from "../components/CTAButton";
import { colors, gradientBrand, shadow } from "../lib/brand";
import { CONTACT_EMAIL, FOUNDER_IMAGE } from "../config/site";

const impactAreas = [
  "Innovation",
  "Education",
  "Environmental protection",
  "Climate action",
  "Healthcare",
];

export function FounderPage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 55% at 78% 20%, rgba(14,165,233,0.14), rgba(16,185,129,0.08) 45%, transparent 72%)" }} />
        <div className="max-w-7xl mx-auto px-6 relative" style={{ padding: "clamp(56px,8vw,110px) 24px" }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-16 items-center">
            <Reveal from="left">
              <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "18px" }}>
                FOUNDER &amp; CEO · LOOPITAL
              </p>
              <h1 style={{ fontSize: "clamp(2.6rem,5.4vw,4.4rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.03, marginBottom: "22px" }}>
                Tuamene Bestgod
              </h1>
              <p style={{ fontSize: "clamp(1.25rem,2.3vw,1.7rem)", lineHeight: 1.35, marginBottom: "24px", color: colors.heading, fontWeight: 500 }}>
                Building AI and software that connect <GradientText>Africa's institutions and its people</GradientText>.
              </p>
              <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.75, maxWidth: "560px", marginBottom: "30px" }}>
                I'm the founder and CEO of Loopital, a technology company building AI and software solutions for businesses, corporations, and governments across Africa.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <CTAButton href={`mailto:${CONTACT_EMAIL}`} variant="gradient" size="lg">Get in touch <ArrowRight size={16} /></CTAButton>
                <CTAButton to="/about" variant="outline" size="lg">Explore Loopital</CTAButton>
              </div>
            </Reveal>

            <Reveal from="right">
              <div className="relative mx-auto" style={{ maxWidth: "460px" }}>
                <div className="rounded-[28px] overflow-hidden" style={{ aspectRatio: "4/5", boxShadow: shadow.lg, border: `1px solid ${colors.hairline}`, background: colors.surfaceMuted }}>
                  <ImageWithFallback src={FOUNDER_IMAGE} alt="Tuamene Bestgod, Founder & CEO of Loopital" className="w-full h-full object-cover" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── WHAT I'M BUILDING ── */}
      <Section background={colors.surface} pad="lg" width="narrow">
        <Reveal>
          <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "14px" }}>WHAT I'M BUILDING</p>
          <h2 style={{ fontSize: "clamp(1.8rem,3.2vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Connecting a broken healthcare system.
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: "19px", lineHeight: 1.8 }}>
            Our current focus is <strong style={{ color: colors.heading }}>Henholib</strong>, a platform tackling one of Nigeria's most urgent problems: disconnected healthcare. We're building the infrastructure that links hospitals together and gives every patient a single health identity — one record that travels with them wherever they seek care.
          </p>
          <div className="mt-8">
            <CTAButton to="/products/henholib" variant="outline">Learn about Henholib <ArrowRight size={15} /></CTAButton>
          </div>
        </Reveal>
      </Section>

      {/* ── BEYOND LOOPITAL ── */}
      <Section background={colors.bg} pad="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Reveal from="left">
            <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "14px" }}>BEYOND LOOPITAL</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.2vw,2.4rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "20px" }}>
              Speaking, teaching, and serving.
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.8 }}>
              Beyond building Loopital, I'm a public speaker and a volunteer on projects driving positive change. I regularly share perspectives on public issues, and I train young people in schools across Nigeria to think, build, and lead with impact.
            </p>
          </Reveal>
          <Reveal from="right">
            <div className="flex flex-col gap-3">
              {impactAreas.map((area) => (
                <div key={area} className="flex items-center gap-3 px-5 py-4 rounded-2xl" style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: gradientBrand }} />
                  <span style={{ color: colors.heading, fontSize: "16px", fontWeight: 500 }}>{area}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── NATIONAL POLICY ── */}
      <Section background={colors.surface} pad="lg" width="narrow">
        <Reveal className="flex flex-col items-start gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${colors.blue}12`, border: `1px solid ${colors.blue}22` }}>
            <Landmark size={22} style={{ color: colors.blue }} />
          </div>
          <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em" }}>NATIONAL POLICY</p>
          <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Contributing to how Nigeria turns research into impact.
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.8 }}>
            I've had the opportunity to contribute to national policy conversations — including the <strong style={{ color: colors.heading }}>Zero Draft of the National Research to Commercialization Policy</strong>, a joint initiative of the Federal Ministry of Education and the Federal Ministry of Innovation, Science and Technology.
          </p>
        </Reveal>
      </Section>

      {/* ── EARLY RECOGNITION ── */}
      <Section background={colors.bg} pad="lg" width="narrow">
        <Reveal className="flex flex-col items-start gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${colors.green}12`, border: `1px solid ${colors.green}22` }}>
            <Award size={22} style={{ color: colors.green }} />
          </div>
          <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em" }}>WHERE IT STARTED</p>
          <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Leadership isn't about age or title.
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.8 }}>
            My path toward transformational leadership started early. At 16, I was named <strong style={{ color: colors.heading }}>Camper of the Year at CITY Camp</strong> (Catch and Inspire Them Young), organized by the Eagle's Hope Foundation — now the Eagle's Hope Charity Organization. That planted a belief I still carry: leadership isn't about age or title. It's about the willingness to build, serve, and inspire change wherever you are.
          </p>
        </Reveal>
      </Section>

      {/* ── PULL QUOTE ── */}
      <section style={{ background: colors.ink, padding: "clamp(72px,10vw,130px) 0" }}>
        <Reveal className="max-w-4xl mx-auto px-6 text-center">
          <Sparkles size={26} style={{ color: "#7DD3FC", margin: "0 auto 24px" }} />
          <p style={{ color: "#F5F5F7", fontSize: "clamp(1.5rem,3.4vw,2.4rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.35 }}>
            "I'm driven by a single goal — to build solutions and lead in ways that create lasting, positive impact, for <GradientText>Africa and for the world</GradientText>."
          </p>
        </Reveal>
      </section>

      {/* ── EDUCATION & ROOTS ── */}
      <Section background={colors.surface} pad="lg" width="narrow">
        <Reveal className="flex flex-col items-start gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${colors.cyan}12`, border: `1px solid ${colors.cyan}22` }}>
            <GraduationCap size={22} style={{ color: colors.cyan }} />
          </div>
          <p style={{ color: colors.cyan, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em" }}>EDUCATION &amp; ROOTS</p>
          <p style={{ color: colors.textSecondary, fontSize: "19px", lineHeight: 1.8 }}>
            I hold a Bachelor of Technology (B.Tech) in Electrical/Electronics Engineering from Rivers State University. I'm from Rivers State, Nigeria, and I grew up in <strong style={{ color: colors.heading }}>Bori</strong> — a small city that shaped how I see the world.
          </p>
        </Reveal>
      </Section>

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(72px,9vw,110px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", fontSize: "clamp(1.9rem,3.6vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "18px" }}>
            Let's build something that lasts.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "18px", lineHeight: 1.65, marginBottom: "32px" }}>
            Whether it's a partnership, a speaking invitation, or an idea worth pursuing — I'd love to hear from you.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <CTAButton href={`mailto:${CONTACT_EMAIL}`} variant="solid" size="lg" style={{ background: "#fff", color: colors.blue }}>Get in touch</CTAButton>
            <CTAButton to="/products" variant="ghost-light" size="lg">See what we're building</CTAButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
