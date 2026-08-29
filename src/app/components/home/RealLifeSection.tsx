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
 * Three cards, no icons, no colour. The words are the content; a decorative
 * glyph above each one added nothing except three more things to look at.
 */

interface LifeCard {
  title: string;
  body: string;
}

const CARDS: LifeCard[] = [
  {
    title: "Family",
    body: "Add your parents, your kids, your partner. One plan that looks after everyone who matters to you, not just you.",
  },
  {
    title: "At Work",
    body: "Give your team real cover. Group health plans and fast access to care mean fewer sick days, and people who feel looked after.",
  },
  {
    title: "Growing Up",
    body: "From a toddler's first fever to a student's first time living away from home, care that grows with every stage of life.",
  },
];

function Card({ card }: { card: LifeCard }) {
  return (
    <article
      className="group relative h-full transition-colors duration-200"
      style={{
        background: colors.surface,
        border: `1px solid ${colors.hairline}`,
        borderRadius: 0,
        padding: "28px 26px",
      }}
    >
      <div className="relative">
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
      <Section background={colors.bgSubtle} pad="md" divided>
        <Reveal className="max-w-2xl mb-10">          <h2 style={{ marginBottom: "14px" }}>
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
