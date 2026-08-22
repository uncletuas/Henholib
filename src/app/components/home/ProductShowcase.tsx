import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { colors, shadow, tint } from "../../lib/brand";
import { Reveal } from "../Reveal";
import {
  BeaconDemo,
  HenholibDemo,
  Hms7Demo,
  ModusDemo,
  PalDemo,
  SwiftDemo,
} from "./ProductDemos";

/**
 * The product grid on the home page: one card per product, each running a live
 * miniature of the thing itself.
 *
 * The shape is borrowed from the way xAI presents its surfaces — a tiled grid
 * where every tile is a working sample, labelled bottom-left with a quiet
 * "Explore" on the right. What makes that layout work is restraint: the demo
 * fills the card and the chrome almost disappears, so the eye reads the product
 * rather than the packaging.
 *
 * Row rhythm is deliberate. Three equal tiles, then two wider ones, so the grid
 * doesn't read as a spreadsheet — the second row gives the two demos with more
 * to show (bed occupancy, a vitals trace) the room to show it.
 */

interface CardProps {
  label: string;
  blurb: string;
  href: string;
  external?: boolean;
  accent: string;
  children: ReactNode;
  className?: string;
}

function ShowcaseCard({ label, blurb, href, external, accent, children, className }: CardProps) {
  const body = (
    <>
      {/* The demo. Fixed height so every tile in a row lines up regardless of
          how much its contents happen to draw. */}
      <div className="px-5 pt-5 pb-3" style={{ height: "200px", overflow: "hidden" }}>
        {children}
      </div>

      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5"
        style={{ borderTop: `1px solid ${tint(accent, 0.18)}`, background: colors.surface }}
      >
        <div className="min-w-0">
          <p style={{ color: colors.heading, fontSize: "14px", fontWeight: 600 }}>{label}</p>
          <p className="truncate" style={{ color: colors.textTertiary, fontSize: "12px" }}>
            {blurb}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: accent, fontSize: "12.5px", fontWeight: 600 }}
        >
          Explore <ArrowRight size={13} />
        </span>
      </div>
    </>
  );

  // Each card carries a wash of its product's own colour, strongest at the top
  // where the screen sits. That is what stops six white rectangles reading as a
  // spreadsheet — the grid gets a rhythm of temperature, and every product is
  // recognisable by its tile before you read a word of it.
  const style = {
    background: `linear-gradient(180deg, ${tint(accent, 0.13)} 0%, ${tint(accent, 0.04)} 42%, ${colors.surface} 100%)`,
    border: `1px solid ${tint(accent, 0.22)}`,
    borderRadius: "20px",
    boxShadow: shadow.sm,
  };

  const cls = `group block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${className ?? ""}`;

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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Reveal>
          <ShowcaseCard
            label="Pal"
            blurb="AI workspace and coworker"
            href="/products/pal"
            accent="#6D5AF0"
            className="h-full"
          >
            <PalDemo />
          </ShowcaseCard>
        </Reveal>
        <Reveal delay={0.06}>
          <ShowcaseCard
            label="Swift"
            blurb="AI ads and CRM"
            href="https://swift.loopital.com"
            external
            accent="#0EA5E9"
            className="h-full"
          >
            <SwiftDemo />
          </ShowcaseCard>
        </Reveal>
        <Reveal delay={0.12}>
          <ShowcaseCard
            label="Modus"
            blurb="Facility and fleet operations"
            href="https://modus.loopital.com"
            external
            accent="#0891B2"
            className="h-full"
          >
            <ModusDemo />
          </ShowcaseCard>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
        <Reveal className="md:col-span-5">
          <ShowcaseCard
            label="Beacon"
            blurb="Schools and training institutions"
            href="/products/beacon"
            accent="#D6294E"
            className="h-full"
          >
            <BeaconDemo />
          </ShowcaseCard>
        </Reveal>
        <Reveal delay={0.06} className="md:col-span-4">
          <ShowcaseCard
            label="Henholib"
            blurb="Your health, in your pocket"
            href="/products/henholib"
            accent="#F97316"
            className="h-full"
          >
            <HenholibDemo />
          </ShowcaseCard>
        </Reveal>
        <Reveal delay={0.12} className="md:col-span-3">
          <ShowcaseCard
            label="HMS7"
            blurb="The hospital operating system"
            href="/products/hms7"
            accent="#0D9F79"
            className="h-full"
          >
            <Hms7Demo />
          </ShowcaseCard>
        </Reveal>
      </div>
    </>
  );
}
