import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { colors } from "../../lib/brand";
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
        style={{ borderTop: `1px solid ${colors.hairline}` }}
      >
        <div className="min-w-0">
          <p style={{ color: colors.heading, fontSize: "14px", fontWeight: 600 }}>{label}</p>
          <p className="truncate" style={{ color: colors.textTertiary, fontSize: "12px" }}>
            {blurb}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: colors.textSecondary, fontSize: "12.5px", fontWeight: 500 }}
        >
          Explore <ArrowRight size={13} />
        </span>
      </div>
    </>
  );

  const style = {
    background: colors.surface,
    border: `1px solid ${colors.hairline}`,
    borderRadius: "20px",
    // The accent only shows on hover, as a hairline lift. Six saturated borders
    // at rest would turn the grid into a colour chart.
    ["--accent" as string]: accent,
  };

  const cls = `group block overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${className ?? ""}`;

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
            accent="#8B89FF"
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
            accent={colors.cyan}
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
            accent="#22B8D6"
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
            accent="#E0526B"
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
            accent={colors.green}
            className="h-full"
          >
            <Hms7Demo />
          </ShowcaseCard>
        </Reveal>
      </div>
    </>
  );
}
