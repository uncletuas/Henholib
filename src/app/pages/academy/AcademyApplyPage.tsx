import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Reveal } from "../../components/Reveal";
import { CTAButton } from "../../components/CTAButton";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { academyApi } from "../../lib/api";
import { type Course, formatPrice, statusLabel, trackMeta } from "../../config/academy";

const HEARD_OPTIONS = ["Social media", "A friend or colleague", "Search engine", "Loopital website", "An event", "Other"];

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: `1px solid ${colors.hairline}`,
  background: colors.bg,
  fontSize: "15px",
  color: colors.heading,
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: colors.heading,
  marginBottom: "7px",
};

export function AcademyApplyPage() {
  const { slug = "" } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [motivation, setMotivation] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    academyApi
      .getCourse(slug)
      .then((r) => setCourse(r.course))
      .catch(() => setCourse(null))
      .finally(() => setLoaded(true));
  }, [slug]);

  const enrolling = course?.status === "enrolling";
  const heading = enrolling ? "Apply for this course" : "Join the waitlist";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await academyApi.apply({ courseSlug: slug, name, email, phone, motivation, heardFrom });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loaded && !course) {
    return (
      <div className="max-w-3xl mx-auto px-6 text-center" style={{ padding: "120px 24px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "14px" }}>Course not found</h1>
        <p style={{ color: colors.textSecondary, marginBottom: "24px" }}>We couldn't find that course.</p>
        <CTAButton to="/academy" variant="gradient">Back to Academy <ArrowRight size={16} /></CTAButton>
      </div>
    );
  }

  const accent = course ? trackMeta(course.track).accent : colors.blue;

  return (
    <section style={{ background: colors.bg, minHeight: "70vh", padding: "clamp(48px,7vw,90px) 0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12">
          {/* Context */}
          <Reveal from="left">
            {course && (
              <Link to={`/academy/${course.slug}`} className="inline-flex items-center gap-2 mb-6 text-sm hover:underline" style={{ color: colors.textTertiary }}>
                ← Back to {course.title}
              </Link>
            )}
            <p style={{ color: accent, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "14px" }}>LOOPITAL ACADEMY</p>
            <h1 style={{ fontSize: "clamp(2rem,3.8vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: "16px" }}>
              {heading}
            </h1>
            {course && (
              <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.7, marginBottom: "26px" }}>
                {course.title} · <strong style={{ color: colors.heading }}>{formatPrice(course.priceCents, course.currency)}</strong> · {statusLabel(course.status)}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {[
                "Tell us a little about you and why you're interested.",
                enrolling ? "We'll follow up with next steps and cohort dates." : "We'll email you the moment enrollment opens.",
                "No payment now, this is an application, not a checkout.",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
                    <Check size={12} style={{ color: accent }} />
                  </span>
                  <span style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.55 }}>{t}</span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Form / success */}
          <Reveal from="right">
            <div className="rounded-3xl p-7 md:p-9" style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: shadow.md }}>
              {done ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: `${colors.green}16` }}>
                    <CheckCircle2 size={28} style={{ color: colors.green }} />
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "10px" }}>You're all set.</h2>
                  <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.7, marginBottom: "24px" }}>
                    Thanks, {name.split(" ")[0] || "there"}, we've received your {enrolling ? "application" : "waitlist request"} for <strong style={{ color: colors.heading }}>{course?.title}</strong>. We'll be in touch by email.
                  </p>
                  <CTAButton to="/academy" variant="outline">Browse more courses <ArrowRight size={15} /></CTAButton>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col gap-5">
                  <div>
                    <label style={labelStyle} htmlFor="ap-name">Full name</label>
                    <input id="ap-name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label style={labelStyle} htmlFor="ap-email">Email</label>
                      <input id="ap-email" type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="ap-phone">Phone <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(optional)</span></label>
                      <input id="ap-phone" style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="ap-course">Course</label>
                    <input id="ap-course" style={{ ...inputStyle, color: colors.textSecondary }} value={course?.title || slug} readOnly />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="ap-motivation">Why are you interested? <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(optional)</span></label>
                    <textarea id="ap-motivation" style={{ ...inputStyle, minHeight: "96px", resize: "vertical" }} value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="What do you hope to get out of this course?" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="ap-heard">How did you hear about us? <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(optional)</span></label>
                    <select id="ap-heard" style={inputStyle} value={heardFrom} onChange={(e) => setHeardFrom(e.target.value)}>
                      <option value="">Select one…</option>
                      {HEARD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {error && <p style={{ color: "#DC2626", fontSize: "14px" }}>{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60 disabled:translate-y-0"
                    style={{ background: gradientBrand, padding: "15px 28px", fontSize: "15px" }}
                  >
                    {submitting ? "Submitting…" : enrolling ? "Submit application" : "Join the waitlist"}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                  <p style={{ color: colors.textTertiary, fontSize: "12.5px", lineHeight: 1.6, textAlign: "center" }}>
                    By submitting, you agree to be contacted about this course. We never share your details.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
