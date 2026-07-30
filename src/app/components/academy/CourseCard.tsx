import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { colors, shadow } from "../../lib/brand";
import { type Course, formatPrice, statusLabel, trackMeta } from "../../config/academy";

/** Compact course card used on the Academy landing page. */
export function CourseCard({ course }: { course: Course }) {
  const accent = trackMeta(course.track).accent;
  const enrolling = course.status === "enrolling";
  return (
    <Link
      to={`/academy/${course.slug}`}
      className="group flex flex-col h-full rounded-3xl transition-all duration-200 hover:-translate-y-1"
      style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm, padding: "26px" }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${accent}14`, color: accent }}
        >
          {trackMeta(course.track).name.replace(" Track", "")}
        </span>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={
            enrolling
              ? { background: `${colors.green}16`, color: colors.green }
              : { background: colors.surfaceMuted, color: colors.textTertiary }
          }
        >
          {statusLabel(course.status)}
        </span>
      </div>

      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: colors.heading, marginBottom: "8px" }}>
        {course.title}
      </h3>
      <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.65, marginBottom: "18px", flexGrow: 1 }}>
        {course.shortDesc}
      </p>

      <div className="flex items-center justify-between gap-3 pt-4" style={{ borderTop: `1px solid ${colors.hairline}` }}>
        <div className="flex items-center gap-2" style={{ color: colors.textTertiary, fontSize: "13px" }}>
          <Clock size={14} />
          <span>{course.format?.duration || "Live cohort"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: colors.heading, fontSize: "15px", fontWeight: 700 }}>
            {formatPrice(course.priceCents, course.currency)}
          </span>
          <ArrowRight size={16} style={{ color: accent }} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
