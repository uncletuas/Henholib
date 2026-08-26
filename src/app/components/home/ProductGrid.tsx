import { Link } from "react-router";
import { colors } from "../../lib/brand";
import { Reveal } from "../Reveal";

/**
 * What we build, as a row of cards.
 *
 * Replaces the closing Henholib pitch, which framed the company as "your
 * records, in your hands". Records are one feature of one product. What
 * Loopital actually does is make healthcare easier to deliver and easier to
 * reach, and that is four things, not one.
 *
 * The layout follows the reference the founder supplied: a coloured banner
 * carrying the name, a quiet category line under it, then the title as the
 * link. The banner does the work, so the text stays short.
 */

interface Card {
  /** Big text on the banner. */
  banner: string;
  /** The quiet line under the card, where a date would sit in the reference. */
  category: string;
  title: string;
  href: string;
  external?: boolean;
  /** Two stops plus an off-axis highlight, so the banner has depth rather than a flat fill. */
  gradient: string;
  /** Banner text colour. */
  ink?: string;
}

const CARDS: Card[] = [
  {
    banner: "Care in your pocket",
    category: "For patients",
    title: "Henholib, find care and reach it",
    href: "/products/henholib",
    gradient:
      "radial-gradient(120% 120% at 78% 12%, #FFC58A 0%, transparent 55%), linear-gradient(140deg, #F26D21 0%, #E0521A 100%)",
  },
  {
    banner: "The hospital, running",
    category: "For hospitals and clinics",
    title: "HMS7, the hospital operating system",
    href: "/products/hms7",
    gradient:
      "radial-gradient(120% 120% at 20% 10%, #6FE3C4 0%, transparent 55%), linear-gradient(140deg, #0D9F79 0%, #07634C 100%)",
  },
  {
    banner: "HMOs & Insurance",
    category: "For health plans",
    title: "Run your policies and members on our platform",
    href: "/contact",
    gradient:
      "radial-gradient(120% 120% at 82% 18%, #B49CFF 0%, transparent 55%), linear-gradient(140deg, #6D5AF0 0%, #3B2E9E 100%)",
  },
  {
    banner: "Beyond health",
    category: "Facilities, schools and teams",
    title: "Modus, Beacon and Pal",
    href: "/products",
    gradient:
      "radial-gradient(120% 120% at 25% 85%, #7FD8C0 0%, transparent 55%), linear-gradient(140deg, #1E3A34 0%, #0B1A17 100%)",
  },
];

function ProductCard({ card }: { card: Card }) {
  const inner = (
    <>
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "16 / 9",
          borderRadius: 12,
          background: card.gradient,
          display: "grid",
          placeItems: "center",
          padding: "18px",
        }}
      >
        <p
          style={{
            color: card.ink ?? "#FFFFFF",
            fontSize: "clamp(17px, 1.6vw, 22px)",
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          {card.banner}
        </p>
      </div>

      <p style={{ color: colors.textTertiary, fontSize: "12.5px", marginTop: "12px" }}>
        {card.category}
      </p>
      <p
        className="transition-colors group-hover:underline"
        style={{ color: colors.heading, fontSize: "15px", fontWeight: 500, marginTop: "3px", lineHeight: 1.4 }}
      >
        {card.title}
      </p>
    </>
  );

  const cls = "group block transition-transform duration-300 hover:-translate-y-1";

  return card.external ? (
    <a href={card.href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link to={card.href} className={cls}>
      {inner}
    </Link>
  );
}

export function ProductGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((c, i) => (
        <Reveal key={c.title} delay={i * 0.06}>
          <ProductCard card={c} />
        </Reveal>
      ))}
    </div>
  );
}
