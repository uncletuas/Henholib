import { ArrowRight, Sparkles, Landmark, GraduationCap, Award, Briefcase, HeartPulse, MapPin } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { CTAButton } from "../components/CTAButton";
import { SocialLinks } from "../components/SocialLinks";
import { colors, gradientBrand, shadow } from "../lib/brand";
import { CONTACT_EMAIL, FOUNDER_IMAGE } from "../config/site";

const glance = [
  { icon: Briefcase, label: "Role", value: "Founder & CEO, Loopital" },
  { icon: HeartPulse, label: "Building", value: "Henholib, connected healthcare for Nigeria" },
  { icon: Award, label: "Recognition", value: "Camper of the Year at 16, CITY Camp" },
  { icon: Landmark, label: "Policy", value: "Contributor, National Research-to-Commercialization Policy (Zero Draft)" },
  { icon: GraduationCap, label: "Education", value: "B.Tech, Electrical/Electronics, Rivers State University" },
  { icon: MapPin, label: "Roots", value: "Bori, Rivers State, Nigeria" },
];

export function FounderPage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 60% at 82% 18%, rgba(14,165,233,0.16), rgba(16,185,129,0.08) 45%, transparent 72%)" }} />
        <div className="max-w-7xl mx-auto px-6 relative" style={{ padding: "clamp(60px,8vw,120px) 24px" }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-20 items-center">
            <Reveal from="left">
              <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "20px" }}>
                FOUNDER &amp; CEO · LOOPITAL
              </p>
              <h1 style={{ fontSize: "clamp(2.8rem,6vw,4.8rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: "24px" }}>
                Tuamene<br />Bestgod
              </h1>
              <p style={{ fontSize: "clamp(1.3rem,2.4vw,1.8rem)", lineHeight: 1.35, marginBottom: "26px", color: colors.heading, fontWeight: 500, maxWidth: "560px" }}>
                Building AI and software that connect <GradientText>Africa's institutions and its people</GradientText>.
              </p>
              <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.75, maxWidth: "540px", marginBottom: "30px" }}>
                I'm the founder and CEO of Loopital, a technology company building AI and software for businesses, corporations, and governments across Africa, and a public speaker, volunteer, and advocate for impact.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <CTAButton href={`mailto:${CONTACT_EMAIL}`} variant="gradient" size="lg">Get in touch <ArrowRight size={16} /></CTAButton>
                <CTAButton to="/about" variant="outline" size="lg">Explore Loopital</CTAButton>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ color: colors.textTertiary, fontSize: "13px", fontWeight: 500 }}>Follow</span>
                <span className="w-8 h-px" style={{ background: colors.hairline }} />
                <SocialLinks size={17} chip={colors.surface} color={colors.heading} />
              </div>
            </Reveal>

            <Reveal from="right">
              <div className="relative mx-auto" style={{ maxWidth: "440px" }}>
                {/* gradient ring frame */}
                <div className="rounded-[32px] p-[3px]" style={{ background: gradientBrand, boxShadow: shadow.lg }}>
                  <div className="rounded-[30px] overflow-hidden" style={{ aspectRatio: "4/5", background: colors.surfaceMuted }}>
                    <ImageWithFallback src={FOUNDER_IMAGE} alt="Tuamene Bestgod, Founder & CEO of Loopital" className="w-full h-full object-cover" />
                  </div>
                </div>
                {/* floating caption chip */}
                <div className="absolute -bottom-5 -left-4 sm:left-6 px-5 py-3.5 rounded-2xl flex items-center gap-3" style={{ background: colors.surface, boxShadow: shadow.md, border: `1px solid ${colors.hairline}` }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: gradientBrand }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: colors.heading, lineHeight: 1.2 }}>Tuamene Bestgod</p>
                    <p style={{ fontSize: "12px", color: colors.textTertiary }}>Founder &amp; CEO, Loopital</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── THE WORK (narrative + at-a-glance) ── */}
      <Section background={colors.surface} pad="lg">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-14 lg:gap-16">
          <Reveal>
            <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "16px" }}>THE WORK</p>
            <h2 style={{ fontSize: "clamp(1.9rem,3.4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "28px", maxWidth: "620px" }}>
              Technology that serves people, and leadership that outlasts the title.
            </h2>
            <div className="flex flex-col gap-6" style={{ color: colors.textSecondary, fontSize: "18.5px", lineHeight: 1.85 }}>
              <p>
                My current focus is <strong style={{ color: colors.heading }}>Henholib</strong>, a platform tackling one of Nigeria's most urgent problems: disconnected healthcare. We're building the infrastructure that links hospitals together and gives every patient a single health identity, one record that travels with them wherever they seek care.
              </p>
              <p>
                Beyond building Loopital, I'm a public speaker and a volunteer on projects driving positive change across innovation, education, environmental protection, climate action, and healthcare. I regularly share perspectives on public issues, and I train young people in schools across Nigeria to think, build, and lead with impact. I've also had the privilege of contributing to national policy, including the <strong style={{ color: colors.heading }}>Zero Draft of the National Research to Commercialization Policy</strong>, a joint initiative of the Federal Ministry of Education and the Federal Ministry of Innovation, Science and Technology.
              </p>
              <p>
                That path started early. At 16, I was named <strong style={{ color: colors.heading }}>Camper of the Year at CITY Camp</strong> (Catch and Inspire Them Young), organized by the Eagle's Hope Foundation. It planted a belief I still carry: leadership isn't about age or title, it's about the willingness to build, serve, and inspire change wherever you are.
              </p>
            </div>
            <div className="mt-9">
              <CTAButton to="/products/henholib" variant="outline">Learn about Henholib <ArrowRight size={15} /></CTAButton>
            </div>
          </Reveal>

          {/* At a glance */}
          <Reveal from="right">
            <div className="rounded-3xl p-7 lg:sticky lg:top-24" style={{ background: colors.bg, border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
              <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.09em", color: colors.textTertiary, marginBottom: "20px" }}>AT A GLANCE</p>
              <div className="flex flex-col gap-5">
                {glance.map((g) => (
                  <div key={g.label} className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradientBrand }}>
                      <g.icon size={16} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: colors.textTertiary, letterSpacing: "0.04em", marginBottom: "2px" }}>{g.label.toUpperCase()}</p>
                      <p style={{ fontSize: "14.5px", color: colors.heading, fontWeight: 500, lineHeight: 1.5 }}>{g.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── PULL QUOTE ── */}
      <section style={{ background: colors.ink, padding: "clamp(80px,11vw,140px) 0" }}>
        <Reveal className="max-w-4xl mx-auto px-6 text-center">
          <Sparkles size={28} style={{ color: "#7DD3FC", margin: "0 auto 28px" }} />
          <p style={{ color: colors.surfaceMuted, fontSize: "clamp(1.6rem,3.6vw,2.6rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.32 }}>
            “I'm driven by a single goal, to build solutions and lead in ways that create lasting, positive impact, for <GradientText>Africa and for the world</GradientText>.”
          </p>
        </Reveal>
      </section>

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(76px,9vw,120px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", fontSize: "clamp(2rem,3.8vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "18px" }}>
            Let's build something that lasts.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "18px", lineHeight: 1.65, marginBottom: "34px", maxWidth: "560px", marginInline: "auto" }}>
            Whether it's a partnership, a speaking invitation, or an idea worth pursuing, I'd love to hear from you.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <CTAButton href={`mailto:${CONTACT_EMAIL}`} variant="solid" size="lg" style={{ background: "#fff", color: colors.blue }}>Get in touch</CTAButton>
            <CTAButton to="/products" variant="ghost-light" size="lg">See what we're building</CTAButton>
          </div>
          <div className="flex justify-center">
            <SocialLinks size={18} chip="rgba(255,255,255,0.16)" color="#fff" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
