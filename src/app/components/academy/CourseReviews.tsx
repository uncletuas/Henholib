import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Section } from "../Section";
import { Reveal } from "../Reveal";
import { colors, shadow } from "../../lib/brand";
import { academyApi } from "../../lib/api";
import type { Review } from "../../config/academy";

export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} style={{ color: n <= Math.round(rating) ? "#F5A623" : colors.hairline }} fill={n <= Math.round(rating) ? "#F5A623" : "transparent"} />
      ))}
    </span>
  );
}

export function CourseReviews({ courseId }: { courseId: string }) {
  const [data, setData] = useState<{ reviews: Review[]; count: number; average: number } | null>(null);

  useEffect(() => {
    academyApi.reviews(courseId).then(setData).catch(() => setData({ reviews: [], count: 0, average: 0 }));
  }, [courseId]);

  if (!data || data.count === 0) return null;

  return (
    <Section background={colors.bg} pad="lg">
      <Reveal className="max-w-2xl mb-8">
        <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "12px" }}>REVIEWS</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.02em", color: colors.heading }}>{data.average.toFixed(1)}</span>
          <div>
            <Stars rating={data.average} size={18} />
            <p style={{ color: colors.textSecondary, fontSize: "14px", marginTop: "2px" }}>{data.count} review{data.count === 1 ? "" : "s"} from students</p>
          </div>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.reviews.slice(0, 9).map((r, i) => (
          <Reveal key={i} delay={i * 0.04}>
            <div className="h-full rounded-3xl p-6" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
              <Stars rating={r.rating} />
              {r.comment && <p style={{ color: colors.heading, fontSize: "15px", lineHeight: 1.65, margin: "12px 0 14px" }}>“{r.comment}”</p>}
              <p style={{ color: colors.textTertiary, fontSize: "13px", fontWeight: 600, marginTop: r.comment ? 0 : "12px" }}>{r.name}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
