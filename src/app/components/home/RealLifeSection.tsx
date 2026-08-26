import { Baby, Briefcase, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors, tint } from "../../lib/brand";
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
      className="group relative h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1.5"
      style={{
        background: colors.surface,
        border: `1px solid ${tint(card.accent, 0.18)}`,
        borderRadius: 22,
        padding: "30px 26px 28px",
        boxShadow: "0 10px 30px rgba(15,23,41,0.06)",
      }}
    >
      {/* A wash of the card's own colour, strongest at the top where the icon
          sits, fading out before it reaches the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(110% 80% at 12% 0%, ${tint(card.accent, 0.16)} 0%, transparent 62%)`,
          opacity: 0.85,
        }}
      />

      <div className="relative">
        <span
          className="inline-grid place-items-center transition-transform duration-300 group-hover:scale-105"
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: `linear-gradient(140deg, ${card.accent} 0%, ${tint(card.accent, 0.72)} 100%)`,
            boxShadow: `0 10px 22px ${tint(card.accent, 0.34)}`,
            marginBottom: 18,
          }}
        >
          <Icon size={24} strokeWidth={2} color="#FFFFFF" />
        </span>

        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: colors.heading,
            marginBottom: 8,
            letterSpacing: "-0.01em",
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
    <div className="relative overflow-hidden">
      {/* Warm aura behind the band. Keeps the section from sitting on flat
          white without tinting the cards themselves. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="brand-aura absolute"
          style={{
            top: "-30%",
            left: "8%",
            width: "46vw",
            height: "46vw",
            background:
              "radial-gradient(circle at 50% 50%, rgba(242,109,33,0.13), transparent 68%)",
            filter: "blur(46px)",
          }}
        />
        <div
          className="brand-aura-2 absolute"
          style={{
            bottom: "-34%",
            right: "4%",
            width: "42vw",
            height: "42vw",
            background:
              "radial-gradient(circle at 50% 50%, rgba(13,159,121,0.12), transparent 70%)",
            filter: "blur(48px)",
          }}
        />
      </div>

      <Section background="transparent" pad="md">
        <Reveal className="max-w-2xl mb-10">
          <p
            style={{
              color: "#F26D21",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: "14px",
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
