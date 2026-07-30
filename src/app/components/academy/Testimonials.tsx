import { Section } from "../Section";
import { Reveal } from "../Reveal";
import { colors, shadow } from "../../lib/brand";

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
}

/**
 * Course testimonials. Intentionally renders nothing until the first cohort
 * produces real feedback — wired up now so adding testimonials is drop-in.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Section background={colors.surface} pad="lg">
      <Reveal className="max-w-2xl mb-10">
        <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "12px" }}>WHAT GRADUATES SAY</p>
        <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>From people who took the course.</h2>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((t, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <figure className="h-full rounded-3xl p-7" style={{ background: colors.bg, border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
              <blockquote style={{ color: colors.heading, fontSize: "16px", lineHeight: 1.7 }}>“{t.quote}”</blockquote>
              <figcaption className="mt-5" style={{ fontSize: "14px" }}>
                <span style={{ color: colors.heading, fontWeight: 600 }}>{t.name}</span>
                {t.role && <span style={{ color: colors.textTertiary }}> · {t.role}</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
