import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap, Users, Building2, Landmark } from "lucide-react";
import { Section } from "../../components/Section";
import { Reveal } from "../../components/Reveal";
import { GradientText } from "../../components/GradientText";
import { CTAButton } from "../../components/CTAButton";
import { CourseCard } from "../../components/academy/CourseCard";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { academyApi } from "../../lib/api";
import { TRACKS, type Course, type TrackKey } from "../../config/academy";
import { FOUNDER_IMAGE } from "../../config/site";

const trackIcon: Record<TrackKey, typeof Users> = {
  technical: GraduationCap,
  business: Users,
  public: Landmark,
};

const highlights = [
  { icon: GraduationCap, title: "Learn by doing", desc: "Every course is hands-on, with labs and a capstone you can actually use." },
  { icon: Users, title: "Live cohorts", desc: "Small live sessions with real instruction — not pre-recorded videos you watch alone." },
  { icon: Building2, title: "Built for real work", desc: "Practical AI skills you apply the same week — for your job, business, or institution." },
];

export function AcademyPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    academyApi
      .listCourses()
      .then((r) => setCourses(r.courses))
      .catch((e) => setError(e.message || "Couldn't load courses."));
  }, []);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 75% 15%, rgba(37,99,235,0.12), rgba(16,185,129,0.07) 45%, transparent 72%)" }} />
        <div className="max-w-7xl mx-auto px-6 relative" style={{ padding: "clamp(64px,9vw,120px) 24px" }}>
          <Reveal className="max-w-3xl">
            <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "18px" }}>
              LOOPITAL ACADEMY
            </p>
            <h1 style={{ fontSize: "clamp(2.5rem,5.4vw,4.2rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.04, marginBottom: "22px" }}>
              Practical AI training for the way you <GradientText>actually work</GradientText>.
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: "19px", lineHeight: 1.7, maxWidth: "620px", marginBottom: "30px" }}>
              Loopital Academy teaches individuals, businesses, and the public sector how to use AI well — through hands-on, live courses built around real outcomes, not hype. Learn from a team that ships production AI every day.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <CTAButton href="#tracks" variant="gradient" size="lg">Browse courses <ArrowRight size={16} /></CTAButton>
              <CTAButton to="/contact" variant="outline" size="lg">Train your team</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WHY ── */}
      <Section background={colors.surface} pad="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.06}>
              <div className="h-full rounded-3xl p-7" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: gradientBrand }}>
                  <h.icon size={20} color="#fff" />
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: colors.heading, marginBottom: "8px" }}>{h.title}</h3>
                <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.7 }}>{h.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── TRACKS + COURSES ── */}
      <section id="tracks" style={{ background: colors.bg, padding: "clamp(72px,9vw,120px) 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="max-w-2xl mb-4">
            <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "12px" }}>COURSES</p>
            <h2 style={{ fontSize: "clamp(1.9rem,3.4vw,2.7rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Three tracks. One practical outcome.
            </h2>
          </Reveal>

          {error && (
            <p style={{ color: colors.textSecondary, marginTop: "24px" }}>{error}</p>
          )}
          {!courses && !error && (
            <p style={{ color: colors.textTertiary, marginTop: "24px" }}>Loading courses…</p>
          )}

          {courses &&
            TRACKS.map((track) => {
              const list = courses.filter((c) => c.track === track.key);
              if (list.length === 0) return null;
              const Icon = trackIcon[track.key];
              return (
                <div key={track.key} className="mt-14">
                  <Reveal>
                    <div className="flex items-start gap-4 mb-7">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${track.accent}14`, border: `1px solid ${track.accent}22` }}>
                        <Icon size={22} style={{ color: track.accent }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", color: colors.heading }}>{track.name}</h3>
                        <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.6, maxWidth: "640px", marginTop: "4px" }}>{track.blurb}</p>
                      </div>
                    </div>
                  </Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {list.map((c) => (
                      <CourseCard key={c.id} course={c} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ── INSTRUCTOR ── */}
      <Section background={colors.surface} pad="lg">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-center">
          <Reveal from="left">
            <div className="relative mx-auto" style={{ maxWidth: "380px" }}>
              <div className="rounded-[28px] overflow-hidden" style={{ aspectRatio: "4/5", boxShadow: shadow.lg, border: `1px solid ${colors.hairline}`, background: colors.surfaceMuted }}>
                <ImageWithFallback src={FOUNDER_IMAGE} alt="Tuamene Bestgod, Founder & CEO of Loopital" className="w-full h-full object-cover" />
              </div>
            </div>
          </Reveal>
          <Reveal from="right">
            <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "14px" }}>YOUR INSTRUCTOR</p>
            <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "18px" }}>
              Taught by people who build AI for a living.
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.8, marginBottom: "16px" }}>
              Loopital Academy is led by <strong style={{ color: colors.heading }}>Tuamene Bestgod</strong>, founder and CEO of Loopital, alongside our engineering and product team. We build and ship production AI systems every day — and we teach from that practice, not from theory.
            </p>
            <CTAButton to="/tuamene.bestgod" variant="outline">Meet the founder <ArrowRight size={15} /></CTAButton>
          </Reveal>
        </div>
      </Section>

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(72px,9vw,110px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", fontSize: "clamp(1.9rem,3.6vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "18px" }}>
            Bring AI into your organization.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "18px", lineHeight: 1.65, marginBottom: "32px" }}>
            Training a team, a company, or a public institution? We run tailored cohorts. Tell us what you need.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <CTAButton to="/contact" variant="solid" size="lg" style={{ background: "#fff", color: colors.blue }}>Talk to us</CTAButton>
            <CTAButton href="#tracks" variant="ghost-light" size="lg">See all courses</CTAButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
