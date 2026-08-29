import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { openPalWorkspace } from "../../lib/pal";
import { Reveal } from "../Reveal";
import { colors, shadow } from "../../lib/brand";
import type { Product } from "../../config/products";

/**
 * The product landing template, shaped like the Pal page.
 *
 * It replaced a shell that opened with a logo tile, a category chip, a stats
 * row and a six-card feature grid. That layout answered "what does this
 * software have" before anyone had decided they cared, and every product page
 * read as the same spec sheet with different nouns in it.
 *
 * This follows the argument the Pal page makes instead: say the thing, say why
 * it is different from what they already know, show the three steps, show it
 * working, say what it is actually for, then ask once.
 *
 * The action is deliberately not part of the template's opinion. Each product
 * keeps whatever CTA it already had, launch, register, waitlist or demo, and
 * this only decides where the button sits and what it looks like.
 */

export interface LandingStep {
  title: string;
  body: string;
}

export interface ProductLandingContent {
  product: Product;
  /** The hero line. Short, and about them rather than the software. */
  headline: ReactNode;
  /** One paragraph under it. */
  subhead: string;
  /** Small line under the button. */
  ctaNote?: string;
  heroImage: string;
  heroImageAlt: string;

  /** The idea: why this is different from what they already do. */
  ideaTitle: string;
  ideaBody: string;
  /** The one-line landing after the idea. */
  ideaPunch?: string;

  stepsTitle?: string;
  steps: LandingStep[];

  /** The split: it working, beside a paragraph. */
  splitTitle: string;
  splitBody: string;
  splitImage: string;
  splitImageAlt: string;

  /** What it is actually for. */
  scopeTitle: string;
  scopeBody: string;

  /** The boxed reassurance before the close. */
  noteTitle?: string;
  noteBody?: string;

  /** The closing line above the last button. */
  closing: string;
}

/**
 * The product's own action, rendered identically wherever it appears.
 *
 * Reading the CTA off `ctaType` rather than taking a label as a prop is what
 * stops a page shipping a button that says one thing and does another.
 */
function ProductAction({
  product,
  variant = "solid",
  size = "md",
}: {
  product: Product;
  variant?: "solid" | "light";
  size?: "md" | "lg";
}) {
  const { user, token, setShowAuth, setShowPalOnboarding, setPendingPal, setShowPalWaitlist, setWaitlist, setDemoFor } =
    useAuth();

  const label =
    product.ctaType === "waitlist"
      ? "Join the waitlist"
      : product.ctaType === "register"
        ? "Register your organisation"
        : product.ctaType === "demo"
          ? "Request a demo"
          : `Open ${product.name}`;

  const act = () => {
    if (product.ctaType === "waitlist") return setWaitlist(product.id);
    if (product.ctaType === "register" || product.ctaType === "demo")
      return setDemoFor(product.id);
    if (product.id === "stack62")
      return openPalWorkspace({ user, token, setShowAuth, setShowPalOnboarding, setPendingPal, setShowPalWaitlist });
    if (product.appHref) window.location.href = product.appHref;
  };

  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={act}
      className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90"
      style={{
        background: solid ? product.accent : "#FFFFFF",
        color: solid ? "#FFFFFF" : product.accent,
        padding: size === "lg" ? "15px 28px" : "12px 22px",
        fontSize: size === "lg" ? "16px" : "15px",
      }}
    >
      {label} <ArrowRight size={17} />
    </button>
  );
}

function Step({ n, step }: { n: number; step: LandingStep }) {
  return (
    <div className="flex gap-4">
      <span
        className="grid shrink-0 place-items-center font-bold"
        style={{
          width: 34,
          height: 34,
          background: colors.surfaceMuted,
          color: colors.heading,
          fontSize: "14px",
        }}
      >
        {n}
      </span>
      <div>
        <p style={{ fontSize: "17px", fontWeight: 600, color: colors.heading, marginBottom: 5 }}>
          {step.title}
        </p>
        <p style={{ color: colors.textSecondary, fontSize: "15.5px", lineHeight: 1.6 }}>
          {step.body}
        </p>
      </div>
    </div>
  );
}

export function ProductLanding(c: ProductLandingContent) {
  const p = c.product;

  return (
    <div style={{ background: colors.surface }}>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: colors.heading }}>
        <div
          className="mx-auto grid items-center gap-10 px-6 lg:grid-cols-2"
          style={{ maxWidth: 1200, paddingTop: "clamp(48px,6vw,84px)", paddingBottom: "clamp(44px,5vw,72px)" }}
        >
          <Reveal>
            <h1 style={{ color: "#FFFFFF", marginBottom: 18 }}>{c.headline}</h1>
            <p
              style={{
                color: "rgba(255,255,255,0.74)",
                fontSize: "18px",
                lineHeight: 1.65,
                maxWidth: 500,
                marginBottom: 26,
              }}
            >
              {c.subhead}
            </p>
            <ProductAction product={p} size="lg" />
            {c.ctaNote && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: 14 }}>
                {c.ctaNote}
              </p>
            )}
          </Reveal>

          <Reveal delay={0.12}>
            <img
              src={c.heroImage}
              alt={c.heroImageAlt}
              className="w-full"
              style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}
            />
          </Reveal>
        </div>
      </section>

      {/* ── THE IDEA ─────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(48px,5vw,76px) 24px" }}>
        <Reveal className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <h2 style={{ marginBottom: 16 }}>{c.ideaTitle}</h2>
          <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.7 }}>
            {c.ideaBody}
          </p>
          {c.ideaPunch && (
            <p
              style={{
                color: colors.heading,
                fontSize: "19px",
                fontWeight: 600,
                lineHeight: 1.6,
                marginTop: 20,
              }}
            >
              {c.ideaPunch}
            </p>
          )}
        </Reveal>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section
        style={{
          background: colors.bgSubtle,
          padding: "clamp(48px,5vw,76px) 24px",
          boxShadow: "inset 0 1px 0 rgba(10,10,11,0.06)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 1000 }}>
          <Reveal className="mb-9">
            <h2>{c.stepsTitle ?? "How it works."}</h2>
          </Reveal>
          <div className="grid gap-7 md:grid-cols-3">
            {c.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <Step n={i + 1} step={s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT ────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(48px,5vw,76px) 24px" }}>
        <div className="mx-auto grid items-center gap-10 lg:grid-cols-2" style={{ maxWidth: 1140 }}>
          <Reveal>
            <img
              src={c.splitImage}
              alt={c.splitImageAlt}
              className="w-full"
              style={{ boxShadow: shadow.md }}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 style={{ marginBottom: 16 }}>{c.splitTitle}</h2>
            <p style={{ color: colors.textSecondary, fontSize: "17.5px", lineHeight: 1.7 }}>
              {c.splitBody}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SCOPE ────────────────────────────────────────────────── */}
      <section
        style={{
          background: colors.bgSubtle,
          padding: "clamp(48px,5vw,76px) 24px",
          boxShadow: "inset 0 1px 0 rgba(10,10,11,0.06)",
        }}
      >
        <Reveal className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <h2 style={{ marginBottom: 16 }}>{c.scopeTitle}</h2>
          <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.7 }}>
            {c.scopeBody}
          </p>
        </Reveal>
      </section>

      {/* ── NOTE ─────────────────────────────────────────────────── */}
      {c.noteTitle && (
        <section style={{ padding: "clamp(48px,5vw,76px) 24px" }}>
          <Reveal
            className="mx-auto text-center"
            style={{
              maxWidth: 720,
              background: colors.surface,
              border: `1px solid ${colors.hairline}`,
              padding: "clamp(30px,4vw,44px)",
            }}
          >
            <h2 style={{ marginBottom: 14 }}>{c.noteTitle}</h2>
            <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.7, marginBottom: 24 }}>
              {c.noteBody}
            </p>
            <ProductAction product={p} />
          </Reveal>
        </section>
      )}

      {/* ── CLOSING ──────────────────────────────────────────────── */}
      <section style={{ background: colors.heading }}>
        <Reveal
          className="mx-auto px-6 text-center"
          style={{
            maxWidth: 780,
            paddingTop: "clamp(48px,6vw,80px)",
            paddingBottom: "clamp(48px,6vw,80px)",
          }}
        >
          <h2 style={{ color: "#FFFFFF", marginBottom: 26 }}>{c.closing}</h2>
          <ProductAction product={p} variant="light" size="lg" />
        </Reveal>
      </section>
    </div>
  );
}
