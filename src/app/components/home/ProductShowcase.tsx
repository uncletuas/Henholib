import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { colors, shadow, tint } from "../../lib/brand";
import { Reveal } from "../Reveal";
import { BeaconDemo, HenholibDemo, Hms7Demo, ModusDemo, SwiftDemo } from "./ProductDemos";

/**
 * The product grid: one card per product, each running a miniature of the real
 * screen.
 *
 * Laid out the way xAI lays its surfaces out — a centred grid with real air
 * around it, every tile a working sample, the name bottom-left and a quiet
 * "Explore" on the right. The space is part of the design; crowding the tiles
 * is what turns a grid of demos into a feature table.
 *
 * The footer is a solid band of the product's own colour with light type on it.
 * At a glance, that row of coloured bands is what says these are five different
 * products rather than five views of one.
 *
 * Pal is deliberately absent — the hero runs a Pal demo directly above this
 * grid, and the same product twice on one screen reads as padding.
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
        className={shape === "mobile" ? "px-4 pt-6 pb-5" : "px-6 pt-6 pb-6"}
        style={{
          height: 440,
          overflow: "hidden",
          // A soft wash of the product's colour behind the device, so the screen
          // sits on something rather than floating on flat white.
          background: `linear-gradient(180deg, ${tint(accent, 0.14)} 0%, ${tint(accent, 0.04)} 100%)`,
        }}
      >
        {children}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: accent }}>
        <div className="min-w-0">
          <p style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 700, lineHeight: 1.2 }}>{label}</p>
          <p className="truncate" style={{ color: "rgba(255,255,255,0.82)", fontSize: "12.5px" }}>
            {blurb}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}
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
    <div className="mx-auto" style={{ maxWidth: 1120 }}>
      {/* Phones get narrow columns, desktop screens wide ones, so nothing sits
          marooned in space its device never meant to fill. */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Reveal className="md:col-span-4">
          <ShowcaseCard
            label="Swift"
            blurb="AI ads and CRM"
            href="https://swift.loopital.com"
            external
            accent="#12B76A"
            shape="mobile"
          >
            <SwiftDemo />
          </ShowcaseCard>
        </Reveal>

        <Reveal delay={0.06} className="md:col-span-8">
          <ShowcaseCard
            label="Modus"
            blurb="Facility and fleet operations"
            href="https://modus.loopital.com"
            external
            accent="#0891B2"
            shape="desktop"
          >
            <ModusDemo />
          </ShowcaseCard>
        </Reveal>

        <Reveal delay={0.12} className="md:col-span-8">
          <ShowcaseCard
            label="Beacon"
            blurb="Schools and training institutions"
            href="/products/beacon"
            accent="#D6294E"
            shape="desktop"
          >
            <BeaconDemo />
          </ShowcaseCard>
        </Reveal>

        <Reveal delay={0.18} className="md:col-span-4">
          <ShowcaseCard
            label="Henholib"
            blurb="Your health, in your pocket"
            href="/products/henholib"
            accent="#F26D21"
            shape="mobile"
          >
            <HenholibDemo />
          </ShowcaseCard>
        </Reveal>

        <Reveal delay={0.24} className="md:col-span-12">
          <ShowcaseCard
            label="HMS7"
            blurb="The hospital operating system"
            href="/products/hms7"
            accent="#0D9F79"
            shape="desktop"
          >
            <Hms7Demo />
          </ShowcaseCard>
        </Reveal>
      </div>
    </div>
  );
}
