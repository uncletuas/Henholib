import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Clock } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CTAButton } from "./CTAButton";
import { academyApi } from "../lib/api";
import { type Course, FALLBACK_COURSE_IMAGE, formatPrice, statusLabel, trackMeta } from "../config/academy";
import { colors } from "../lib/brand";

/** Interactive tabbed showcase of Loopital Academy courses (real, from the API). */
export function AcademyShowcase() {
  const reduce = useReducedMotion();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    academyApi.listCourses().then((r) => setCourses(r.courses)).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (reduce || !courses || courses.length === 0) return;
    const t = setInterval(() => { if (!paused.current) setActive((a) => (a + 1) % courses.length); }, 5200);
    return () => clearInterval(t);
  }, [reduce, courses]);

  if (!courses) return <div className="glass-panel rounded-[26px] p-10 text-center" style={{ color: colors.textTertiary }}>Loading courses…</div>;
  if (courses.length === 0) return null;

  const c = courses[active % courses.length];
  const accent = trackMeta(c.track).accent;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-6 lg:gap-8" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      {/* Tabs */}
      <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 lg:max-h-[440px] lg:overflow-y-auto">
        {courses.map((course, i) => {
          const on = i === active;
          const a = trackMeta(course.track).accent;
          return (
            <button
              key={course.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all flex-shrink-0 lg:flex-shrink ${on ? "glass" : ""}`}
              style={{ minWidth: "230px", border: on ? `1px solid ${a}40` : `1px solid ${colors.hairline}`, background: on ? undefined : colors.surface }}
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1px solid ${colors.hairline}` }}>
                <ImageWithFallback src={course.image || FALLBACK_COURSE_IMAGE} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p style={{ fontWeight: 700, fontSize: "13.5px", color: colors.heading, lineHeight: 1.2 }}>{course.title}</p>
                <p style={{ fontSize: "11.5px", color: on ? a : colors.textTertiary, fontWeight: 500 }}>{trackMeta(course.track).name.replace(" Track", "")}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel overflow-hidden"
            style={{ borderRadius: "26px" }}
          >
            <div className="relative" style={{ aspectRatio: "16/8" }}>
              <ImageWithFallback src={c.image || FALLBACK_COURSE_IMAGE} alt={c.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${accent}33 0%, transparent 55%)` }} />
              <span className="absolute top-4 left-4 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.92)", color: accent }}>{trackMeta(c.track).name}</span>
              <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full" style={c.status === "enrolling" ? { background: colors.green, color: "#fff" } : { background: "rgba(255,255,255,0.92)", color: colors.textTertiary }}>{statusLabel(c.status)}</span>
            </div>
            <div className="p-6 lg:p-7">
              <h3 style={{ fontSize: "clamp(1.25rem,2vw,1.6rem)", fontWeight: 800, letterSpacing: "-0.02em", color: colors.heading, marginBottom: "8px" }}>{c.title}</h3>
              <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.65, marginBottom: "16px" }}>{c.shortDesc}</p>
              <div className="flex items-center gap-4 mb-5" style={{ fontSize: "14px" }}>
                <span style={{ color: colors.heading, fontWeight: 700 }}>{formatPrice(c.priceCents, c.currency)}</span>
                {c.format?.duration && <span className="inline-flex items-center gap-1.5" style={{ color: colors.textTertiary }}><Clock size={14} /> {c.format.duration}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CTAButton to={`/academy/${c.slug}`} variant="gradient" size="sm">View course <ArrowRight size={15} /></CTAButton>
                <CTAButton to="/academy" variant="outline" size="sm">Browse the Academy</CTAButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
