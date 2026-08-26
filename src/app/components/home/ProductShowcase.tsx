import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { colors, shadow, tint } from "../../lib/brand";
import { Reveal } from "../Reveal";
import { Hms7Demo } from "./ProductDemos";

/**
 * HMS7, running a miniature of the real screen.
 *
 * Laid out the way xAI lays its surfaces out — a centred grid with real air
 * around it, every tile a working sample, the name bottom-left and a quiet
 * "Explore" on the right. The space is part of the design; crowding the tiles
 * is what turns a grid of demos into a feature table.
 *
 * The footer is a solid band of the product's own colour with light type on it.
 *
 * HMS7 alone. Henholib is already running in the hero, and the same phone twice
 * on one page reads as padding. Beacon, Modus and Pal live on /products, which
 * is what that page is for.
 */

interface CardProps {
  label: string;
  blurb: string;
  href: string;
  external?: boolean;
  accent: string;
  /** Phones need a portrait window; desktop screens a landscape one. */
  shape: "mobile" | "desktop";
  children: ReactNode;
}

function ShowcaseCard({ label, blurb, href, external, accent, shape, children }: CardProps) {
  const body = (
    <>
      <div
        className={shape === "mobile" ? "px-3 pt-4 pb-4" : "px-4 pt-4 pb-4"}
        style={{
          height: 320,
          overflow: "hidden",
          // A soft wash of the product's colour behind the device, so the screen
          // sits on something rather than floating on flat white.
          background: `linear-gradient(180deg, ${tint(accent, 0.14)} 0%, ${tint(accent, 0.04)} 100%)`,
        }}
      >
        {children}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: accent }}>
        <div className="min-w-0">
          <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}>{label}</p>
          <p className="truncate" style={{ color: "rgba(255,255,255,0.82)", fontSize: "11.5px" }}>
            {blurb}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 600 }}
        >
          Explore <ArrowRight size={14} />
        </span>
      </div>
    </>
  );

  const style = {
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: shadow.md,
    border: `1px solid ${tint(accent, 0.2)}`,
    background: colors.surface,
  };

  const cls = "group block h-full transition-transform duration-300 hover:-translate-y-1";

  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls} style={style}>
      {body}
    </a>
  ) : (
    <Link to={href} className={cls} style={style}>
      {body}
    </Link>
  );
}

export function ProductShowcase() {
  return (
    <div className="mx-auto" style={{ maxWidth: 1040 }}>
      {/* HMS7 alone, full width. Henholib is already running in the hero, and
          showing the same phone twice on one page reads as padding. */}
      <div className="grid grid-cols-1">
        <Reveal>
          <ShowcaseCard label="HMS7" blurb="The hospital operating system" href="/products/hms7" accent="#0D9F79" shape="desktop">
            <Hms7Demo />
          </ShowcaseCard>
        </Reveal>
      </div>
    </div>
  );
}
