import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap, Users, Building2, Landmark, Check } from "lucide-react";
import { Section } from "../../components/Section";
import { Reveal } from "../../components/Reveal";
import { GradientText } from "../../components/GradientText";
import { CTAButton } from "../../components/CTAButton";
import { CourseCard } from "../../components/academy/CourseCard";
import { AcademyExperience } from "../../components/academy/AcademyExperience";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { academyApi } from "../../lib/api";
import { TRACKS, type Course, type TrackKey } from "../../config/academy";
import { CONTACT_EMAIL, FOUNDER_IMAGE } from "../../config/site";

const trackIcon: Record<TrackKey, typeof Users> = {
  technical: GraduationCap,
  business: Users,
  public: Landmark,
};

const orgOfferings = [
  "AI adoption & the future of work for your whole team",
  "Tailored cohorts mapped to your industry and tools",
  "Delivered online or on-site at your offices",
  "For companies, hospitals, and public institutions",
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
              Loopital Academy teaches individuals, businesses, and the public sector how to use AI well, through hands-on, live courses built around real outcomes, not hype. Learn from a team that ships production AI every day.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <CTAButton href="#tracks" variant="gradient" size="lg">Browse courses <ArrowRight size={16} /></CTAButton>
              <CTAButton to="/academy/learn" variant="outline" size="lg">My Learning</CTAButton>
            </div>
            <p style={{ color: colors.textTertiary, fontSize: "14px", marginTop: "22px" }}>
              🌍 All courses run online as live cohorts · 🏢{" "}
              <a href="#organizations" style={{ color: colors.blue, fontWeight: 600 }}>In-house training</a> for organizations on request
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── EXPERIENCE (immersive) ── */}
      <AcademyExperience />

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

      {/* ── FOR ORGANIZATIONS ── */}
      <section id="organizations" style={{ background: colors.surface, padding: "clamp(72px,9vw,120px) 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal from="left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: `${colors.blue}0f`, border: `1px solid ${colors.blue}22` }}>
                <Building2 size={15} style={{ color: colors.blue }} />
                <span style={{ color: colors.blue, fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.04em" }}>FOR ORGANIZATIONS</span>
              </div>
              <h2 style={{ fontSize: "clamp(1.9rem,3.4vw,2.7rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.12, marginBottom: "18px" }}>
                Bring Loopital Academy <GradientText>in-house</GradientText>.
              </h2>
              <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.8, marginBottom: "26px", maxWidth: "560px" }}>
                Our public courses run online, but for organizations, we also deliver private, in-house training on special request. We run staff programs on <strong style={{ color: colors.heading }}>AI adoption and the future of work</strong>, tailored to your team, your sector, and your goals. We discuss the scope together and shape a cohort around it.
              </p>
              <div className="flex flex-col gap-3 mb-8">
                {orgOfferings.map((o) => (
                  <div key={o} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${colors.green}18` }}>
                      <Check size={12} style={{ color: colors.green }} />
                    </span>
                    <span style={{ color: colors.text, fontSize: "15.5px", lineHeight: 1.55 }}>{o}</span>
                  </div>
                ))}
              </div>
              <CTAButton href={`mailto:${CONTACT_EMAIL}?subject=In-house%20AI%20training%20for%20our%20organization`} variant="gradient" size="lg">
                Discuss in-house training <ArrowRight size={16} />
              </CTAButton>
            </Reveal>
            <Reveal from="right">
              <div className="rounded-[28px] overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: shadow.lg, border: `1px solid ${colors.hairline}` }}>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1080&q=80"
                  alt="Loopital Academy in-house training for organizations"
                  className="w-full h-full object-cover"
                />
              </div>
            </Reveal>
          </div>
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
              Loopital Academy is led by <strong style={{ color: colors.heading }}>Tuamene Bestgod</strong>, founder and CEO of Loopital, alongside our engineering and product team. We build and ship production AI systems every day, and we teach from that practice, not from theory.
            </p>
            <CTAButton to="/tuamene.bestgod" variant="outline">Meet the founder <ArrowRight size={15} /></CTAButton>
          </Reveal>
        </div>
      </Section>

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(72px,9vw,110px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", fontSize: "clamp(1.9rem,3.6vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "18px" }}>
            Start learning with Loopital Academy.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "18px", lineHeight: 1.65, marginBottom: "32px" }}>
            Pick a course and join the next live cohort, or talk to us about training your whole team.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <CTAButton href="#tracks" variant="solid" size="lg" style={{ background: "#fff", color: colors.blue }}>Browse courses</CTAButton>
            <CTAButton to="/contact" variant="ghost-light" size="lg">Talk to us</CTAButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
