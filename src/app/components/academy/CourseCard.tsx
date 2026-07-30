import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { colors, shadow } from "../../lib/brand";
import { type Course, FALLBACK_COURSE_IMAGE, formatPrice, statusLabel, courseTypeLabel, trackMeta } from "../../config/academy";

/** Course card with a cover image, used on the Academy landing page. */
export function CourseCard({ course }: { course: Course }) {
  const accent = trackMeta(course.track).accent;
  const enrolling = course.status === "enrolling";
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}
    >
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
        <ImageWithFallback
          src={course.image || FALLBACK_COURSE_IMAGE}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,8,15,0.28), transparent 55%)" }} />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.92)", color: accent }}>
            {trackMeta(course.track).name.replace(" Track", "")}
          </span>
          {course.courseType === "self_paced" && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.92)", color: colors.heading }}>
              {courseTypeLabel(course.courseType)}
            </span>
          )}
        </div>
        <span
          className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={enrolling ? { background: colors.green, color: "#fff" } : { background: "rgba(255,255,255,0.92)", color: colors.textTertiary }}
        >
          {statusLabel(course.status)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-grow" style={{ padding: "22px 24px 24px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: colors.heading, marginBottom: "8px" }}>
          {course.title}
        </h3>
        <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.65, marginBottom: "18px", flexGrow: 1 }}>
          {course.shortDesc}
        </p>
        <div className="flex items-center justify-between gap-3 pt-4" style={{ borderTop: `1px solid ${colors.hairline}` }}>
          <div className="flex items-center gap-2" style={{ color: colors.textTertiary, fontSize: "13px" }}>
            <Clock size={14} />
            <span>{course.format?.duration || courseTypeLabel(course.courseType)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: colors.heading, fontSize: "15px", fontWeight: 700 }}>
              {formatPrice(course.priceCents, course.currency)}
            </span>
            <ArrowRight size={16} style={{ color: accent }} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
