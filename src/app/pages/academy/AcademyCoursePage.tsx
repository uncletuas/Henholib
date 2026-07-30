import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowRight, Check, Clock, CalendarDays, Layers, Signal, ListChecks } from "lucide-react";
import { Section } from "../../components/Section";
import { Reveal } from "../../components/Reveal";
import { CTAButton } from "../../components/CTAButton";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { Testimonials } from "../../components/academy/Testimonials";
import type { Testimonial } from "../../components/academy/Testimonials";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { academyApi } from "../../lib/api";
import { FOUNDER_IMAGE } from "../../config/site";
import { type Course, formatPrice, statusLabel, trackMeta } from "../../config/academy";

export function AcademyCoursePage() {
  const { slug = "" } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    setStatus("loading");
    academyApi
      .getCourse(slug)
      .then((r) => { setCourse(r.course); setStatus("ready"); })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  if (status === "loading") {
    return <div className="max-w-7xl mx-auto px-6" style={{ padding: "120px 24px", color: colors.textTertiary }}>Loading course…</div>;
  }

  if (status === "notfound" || !course) {
    return (
      <Section pad="lg" width="narrow" className="text-center">
        <h1 style={{ fontSize: "clamp(1.8rem,3.4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "14px" }}>Course not found</h1>
        <p style={{ color: colors.textSecondary, fontSize: "18px", marginBottom: "26px" }}>This course isn't available. Browse everything Loopital Academy offers instead.</p>
        <CTAButton to="/academy" variant="gradient">Back to Academy <ArrowRight size={16} /></CTAButton>
      </Section>
    );
  }

  const accent = trackMeta(course.track).accent;
  const enrolling = course.status === "enrolling";
  const applyHref = `/academy/apply/${course.slug}`;
  const applyLabel = enrolling ? "Apply now" : "Join the waitlist";

  const facts = [
    { icon: Clock, label: "Duration", value: course.format?.duration },
    { icon: CalendarDays, label: "Schedule", value: course.format?.cadence },
    { icon: Layers, label: "Commitment", value: course.format?.commitment },
    { icon: Signal, label: "Format", value: course.format?.delivery },
    { icon: ListChecks, label: "Prerequisites", value: course.format?.prerequisites },
  ].filter((f) => f.value);

  // Wired up now; populated once the first cohort produces real feedback.
  const testimonials: Testimonial[] = [];

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: colors.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 55% 50% at 80% 15%, ${accent}1f, transparent 70%)` }} />
        <div className="max-w-7xl mx-auto px-6 relative" style={{ padding: "clamp(48px,7vw,90px) 24px" }}>
          <Reveal>
            <div className="flex items-center gap-2.5 mb-5" style={{ fontSize: "13px" }}>
              <Link to="/academy" style={{ color: colors.textTertiary }} className="hover:underline">Academy</Link>
              <span style={{ color: colors.textTertiary }}>/</span>
              <span style={{ color: accent, fontWeight: 600 }}>{trackMeta(course.track).name}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={enrolling ? { background: `${colors.green}16`, color: colors.green } : { background: colors.surfaceMuted, color: colors.textTertiary }}>
                    {statusLabel(course.status)}
                  </span>
                </div>
                <h1 style={{ fontSize: "clamp(2.2rem,4.4vw,3.4rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.06, marginBottom: "18px" }}>
                  {course.title}
                </h1>
                <p style={{ color: colors.textSecondary, fontSize: "19px", lineHeight: 1.7, maxWidth: "620px" }}>
                  {course.shortDesc}
                </p>
              </div>

              {/* Enrollment card */}
              <div className="rounded-3xl p-7 lg:sticky lg:top-24" style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: shadow.md }}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", color: colors.heading }}>
                    {formatPrice(course.priceCents, course.currency)}
                  </span>
                  <span style={{ color: colors.textTertiary, fontSize: "14px" }}>· {trackMeta(course.track).name.replace(" Track", "")}</span>
                </div>
                <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "20px" }}>
                  {enrolling ? "Enrolling for the next live cohort." : "Not open yet — join the waitlist to be first to know."}
                </p>
                <div className="flex flex-col gap-3">
                  {facts.slice(0, 4).map((f) => (
                    <div key={f.label} className="flex items-center gap-3" style={{ fontSize: "14px" }}>
                      <f.icon size={16} style={{ color: accent, flexShrink: 0 }} />
                      <span style={{ color: colors.textTertiary }}>{f.label}:</span>
                      <span style={{ color: colors.heading, fontWeight: 500 }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <CTAButton to={applyHref} variant="gradient" size="lg" className="w-full">{applyLabel} <ArrowRight size={16} /></CTAButton>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── OVERVIEW + WHO FOR ── */}
      <Section background={colors.surface} pad="lg">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-14">
          <Reveal>
            <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "14px" }}>ABOUT THIS COURSE</p>
            <p style={{ color: colors.textSecondary, fontSize: "19px", lineHeight: 1.8 }}>{course.fullDesc}</p>
          </Reveal>
          {course.whoFor.length > 0 && (
            <Reveal from="right">
              <div className="rounded-3xl p-7" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: colors.heading, marginBottom: "16px" }}>Who this is for</h3>
                <ul className="flex flex-col gap-3">
                  {course.whoFor.map((w) => (
                    <li key={w} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
                        <Check size={12} style={{ color: accent }} />
                      </span>
                      <span style={{ color: colors.text, fontSize: "15px", lineHeight: 1.55 }}>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </Section>

      {/* ── CURRICULUM ── */}
      {course.curriculum.length > 0 && (
        <Section background={colors.bg} pad="lg">
          <Reveal className="max-w-2xl mb-10">
            <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "12px" }}>CURRICULUM</p>
            <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>What you'll cover, week by week.</h2>
          </Reveal>
          <div className="flex flex-col gap-4">
            {course.curriculum.map((wk, i) => (
              <Reveal key={wk.week ?? i} delay={i * 0.04}>
                <div className="rounded-3xl p-6 md:p-7 flex flex-col md:flex-row gap-5 md:gap-8" style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: `${accent}12`, color: accent }}>
                      Week {wk.week ?? i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: colors.heading, marginBottom: "8px" }}>{wk.title}</h3>
                    <p style={{ color: colors.textSecondary, fontSize: "15.5px", lineHeight: 1.7 }}>{wk.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ── INSTRUCTOR ── */}
      <Section background={colors.surface} pad="lg">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
          <Reveal from="left">
            <div className="relative mx-auto" style={{ maxWidth: "340px" }}>
              <div className="rounded-[26px] overflow-hidden" style={{ aspectRatio: "4/5", boxShadow: shadow.lg, border: `1px solid ${colors.hairline}`, background: colors.surfaceMuted }}>
                <ImageWithFallback src={FOUNDER_IMAGE} alt={course.instructorName || "Loopital Academy instructor"} className="w-full h-full object-cover" />
              </div>
            </div>
          </Reveal>
          <Reveal from="right">
            <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "14px" }}>YOUR INSTRUCTOR</p>
            <h2 style={{ fontSize: "clamp(1.5rem,2.6vw,2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>
              {course.instructorName || "Tuamene Bestgod"}
            </h2>
            <p style={{ color: accent, fontSize: "15px", fontWeight: 500, marginBottom: "16px" }}>{course.instructorTitle || "Founder & CEO of Loopital"}</p>
            <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.8 }}>{course.instructorBio}</p>
          </Reveal>
        </div>
      </Section>

      <Testimonials items={testimonials} />

      {/* ── CLOSING CTA ── */}
      <section style={{ background: gradientBrand, padding: "clamp(64px,8vw,100px) 0" }}>
        <Reveal className="max-w-3xl mx-auto px-6 text-center">
          <h2 style={{ color: "#fff", fontSize: "clamp(1.8rem,3.4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            {enrolling ? "Ready to start?" : `Be first in line for ${course.title}.`}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "18px", lineHeight: 1.65, marginBottom: "30px" }}>
            {enrolling
              ? "Secure your place in the next live cohort — it's a small group, and spots are limited."
              : "Join the waitlist and we'll let you know the moment enrollment opens."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <CTAButton to={applyHref} variant="solid" size="lg" style={{ background: "#fff", color: colors.blue }}>{applyLabel}</CTAButton>
            <CTAButton to="/academy" variant="ghost-light" size="lg">Browse other courses</CTAButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
