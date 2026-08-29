import { Baby, Briefcase, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors } from "../../lib/brand";
import { Reveal } from "../Reveal";
import { Section } from "../Section";

/**
 * For real life.
 *
 * This replaced a "THE PROBLEM" block: three grey cards reading Paper, Hours,
 * Paperwork. It was accurate and completely cold, which is the wrong register
 * for a health company. Nobody chooses healthcare because a company understands
 * its own market; they choose it because it looks after the people they love.
 *
 * So the section warms up. Each card gets its own colour rather than sharing
 * one grey, because the three moments are genuinely different in feeling: a
 * family, a workplace, a child growing up. The icon sits on a gradient
 * medallion, the card lifts on hover, and a soft aura sits behind the whole
 * band so it does not read as another flat row of boxes.
 */

interface LifeCard {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
}

const CARDS: LifeCard[] = [
  {
    icon: HeartHandshake,
    title: "Family",
    body: "Add your parents, your kids, your partner. One plan that looks after everyone who matters to you, not just you.",
    accent: "#F26D21",
  },
  {
    icon: Briefcase,
    title: "At Work",
    body: "Give your team real cover. Group health plans and fast access to care mean fewer sick days, and people who feel looked after.",
    accent: "#2563EB",
  },
  {
    icon: Baby,
    title: "Growing Up",
    body: "From a toddler's first fever to a student's first time living away from home, care that grows with every stage of life.",
    accent: "#0D9F79",
  },
];

function Card({ card }: { card: LifeCard }) {
  const Icon = card.icon;
  return (
    <article
      className="group relative h-full transition-colors duration-200"
      style={{
        background: colors.surface,
        border: `1px solid ${colors.hairline}`,
        borderRadius: 12,
        padding: "28px 26px",
      }}
    >
      <div className="relative">
        {/* The icon is the one place colour appears, and it appears as a mark
            rather than a filled tile. Three saturated gradient medallions in a
            row was the loudest thing on the page. */}
        <span className="inline-grid place-items-center" style={{ marginBottom: 20 }}>
          <Icon size={26} strokeWidth={1.75} color={card.accent} />
        </span>

        <h3
          style={{
            fontSize: "19px",
            fontWeight: 600,
            color: colors.heading,
            marginBottom: 9,
            letterSpacing: "-0.015em",
          }}
        >
          {card.title}
        </h3>

        <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.65 }}>
          {card.body}
        </p>
      </div>
    </article>
  );
}

export function RealLifeSection() {
  return (
    <div>
      <Section background="transparent" pad="md">
        <Reveal className="max-w-2xl mb-10">
          <p
            style={{
              color: colors.textTertiary,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.09em",
              marginBottom: "16px",
            }}
          >
            FOR REAL LIFE
          </p>
          <h2 style={{ marginBottom: "14px" }}>
            Healthcare that shows up for the people you love.
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.6 }}>
            Not just when something's wrong. For every ordinary, wonderful part
            of life.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <Card card={c} />
            </Reveal>
          ))}
        </div>
      </Section>
    </div>
  );
}
