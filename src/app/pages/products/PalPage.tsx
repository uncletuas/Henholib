import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Reveal } from "../../components/Reveal";
import { colors, shadow } from "../../lib/brand";

/**
 * The Pal landing page.
 *
 * It replaced a generic product template: stock photography that had nothing to
 * do with the product, and copy written like a specification. Six features in a
 * grid, each explaining a capability nobody asked about yet.
 *
 * This version is built around one idea the founder wrote: hand it to Pal,
 * consider it done. Sections sit close together because the page is an argument
 * that builds, not a set of unrelated panels, and every CTA is the same one,
 * because there is only one thing to do here until Pal opens.
 */

// Pal reads in the brand primary rather than its own indigo pair.
const INDIGO = colors.primary;
const INDIGO_LIGHT = "#8A79FF";

function WaitlistButton({
  onClick,
  variant = "solid",
  size = "md",
}: {
  onClick: () => void;
  variant?: "solid" | "light";
  size?: "md" | "lg";
}) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90"
      style={{
        background: solid ? INDIGO : "#FFFFFF",
        color: solid ? "#FFFFFF" : INDIGO,
        padding: size === "lg" ? "16px 30px" : "13px 24px",
        fontSize: size === "lg" ? "16px" : "15px",
        boxShadow: "none",
      }}
    >
      Join the Waitlist <ArrowRight size={17} />
    </button>
  );
}

/** One numbered step. Three of these carry the How It Works section. */
function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <span
        className="grid shrink-0 place-items-center font-bold"
        style={{
          width: 34,
          height: 34,
          background: "rgba(109,90,240,0.10)",
          color: INDIGO,
          fontSize: "14px",
        }}
      >
        {n}
      </span>
      <div>
        <p style={{ fontSize: "17px", fontWeight: 700, color: colors.heading, marginBottom: 5 }}>
          {title}
        </p>
        <p style={{ color: colors.textSecondary, fontSize: "15.5px", lineHeight: 1.6 }}>
          {body}
        </p>
      </div>
    </div>
  );
}

export function PalPage() {
  const { setShowPalWaitlist } = useAuth();
  const join = () => setShowPalWaitlist(true);

  return (
    <div style={{ background: colors.surface }}>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "#0E0B22" }}>
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(70% 60% at 20% 0%, rgba(124,116,255,0.28) 0%, transparent 65%)",
          }}
        />
        <div
          className="relative mx-auto grid items-center gap-10 px-6 lg:grid-cols-2"
          style={{ maxWidth: 1200, paddingTop: "clamp(56px,7vw,92px)", paddingBottom: "clamp(48px,6vw,80px)" }}
        >
          <Reveal>            <h1
              style={{
                color: "#FFFFFF",
                fontSize: "clamp(2.4rem,5vw,4rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                marginBottom: 18,
              }}
            >
              Hand it to Pal.
              <br />
              Consider it done.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.76)", fontSize: "18px", lineHeight: 1.65, maxWidth: 500, marginBottom: 26 }}>
              Pal has its own workspace, its own tools, and its own way of
              getting things handled. You don't manage it. You just ask.
            </p>
            <WaitlistButton onClick={join} size="lg" />
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: 14 }}>
              Be first in when Pal opens up.{" "}
              <Link to="/products/pal/pricing" style={{ color: "rgba(255,255,255,0.82)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                See plans and pricing
              </Link>
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <img
              src="/media/pal-hero.png"
              alt="Pal at its own workspace, with today's tasks and team activity beside it"
              className="w-full"
              style={{ borderRadius: 0, boxShadow: "0 40px 90px rgba(0,0,0,0.45)" }}
            />
          </Reveal>
        </div>
      </section>

      {/* ── THE IDEA ─────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(56px,6vw,84px) 24px" }}>
        <Reveal className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <h2 style={{ marginBottom: 16 }}>Not an assistant. A coworker.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.7 }}>
            Assistants wait for instructions and forget by tomorrow. Pal
            remembers everything, every conversation, every task, every platform
            you work in, and shows up already knowing where things stand.
          </p>
          <p style={{ color: colors.heading, fontSize: "19px", fontWeight: 600, lineHeight: 1.6, marginTop: 20 }}>
            Give it something to do. Walk away. It's handled.
          </p>
        </Reveal>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ background: colors.bg, padding: "clamp(56px,6vw,84px) 24px" }}>
        <div className="mx-auto" style={{ maxWidth: 1000 }}>
          <Reveal className="mb-9">
            <h2>How it works.</h2>
          </Reveal>
          <div className="grid gap-7 md:grid-cols-3">
            <Reveal>
              <Step
                n="1"
                title="Tell it what you need."
                body="No forms, no setup wizard. Just say it, the way you'd tell a coworker."
              />
            </Reveal>
            <Reveal delay={0.08}>
              <Step
                n="2"
                title="It remembers everything."
                body="Every app, every message, every thread, pulled into one place, so nothing gets lost between platforms again."
              />
            </Reveal>
            <Reveal delay={0.16}>
              <Step
                n="3"
                title="It gets to work, in its own space."
                body="Pal sets up what you need in its own workspace, ready when you are, editable anytime you want to change your mind."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── COLLABORATION ────────────────────────────────────────── */}
      <section style={{ padding: "clamp(56px,6vw,84px) 24px" }}>
        <div
          className="mx-auto grid items-center gap-10 lg:grid-cols-2"
          style={{ maxWidth: 1140 }}
        >
          <Reveal>
            <img
              src="/media/pal-secondary.png"
              alt="A team around a table working alongside Pal"
              className="w-full"
              style={{ borderRadius: 0, boxShadow: shadow.lg }}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 style={{ marginBottom: 16 }}>Work with it, not just through it.</h2>
            <p style={{ color: colors.textSecondary, fontSize: "17.5px", lineHeight: 1.7 }}>
              Pal isn't a black box that spits out results. Open its workspace,
              see what it's working on, adjust it, add to it, or just hand it the
              next thing. It's less "type a prompt," more "walk into the next
              office and say, can you take care of this."
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SCOPE ────────────────────────────────────────────────── */}
      <section style={{ background: colors.bg, padding: "clamp(56px,6vw,84px) 24px" }}>
        <Reveal className="mx-auto text-center" style={{ maxWidth: 760 }}>
          <h2 style={{ marginBottom: 16 }}>Built for the work you actually do.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.7 }}>
            Pal handles the everyday operations that eat your time, tracking,
            follow-ups, reminders, staying on top of what's happening across your
            apps. Not a website builder, not another app to manage. A coworker
            for the business you're already running.
          </p>
        </Reveal>
      </section>

      {/* ── WAITLIST FRAMING ─────────────────────────────────────── */}
      <section style={{ padding: "clamp(56px,6vw,84px) 24px" }}>
        <Reveal
          className="mx-auto text-center"
          style={{
            maxWidth: 720,
            background: colors.surface,
            border: `1px solid ${colors.hairline}`,
            borderRadius: 0,
            padding: "clamp(32px,4vw,48px)",
            boxShadow: shadow.md,
          }}
        >
          <h2 style={{ marginBottom: 14 }}>Pal isn't open to everyone yet.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.7, marginBottom: 24 }}>
            We're building this deliberately, testing it ourselves before handing
            it to real teams. Join the waitlist and we'll bring you in as we open
            access.
          </p>
          <WaitlistButton onClick={join} />
        </Reveal>
      </section>

      {/* ── CLOSING ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "#0E0B22" }}>
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(60% 80% at 80% 20%, rgba(124,116,255,0.26) 0%, transparent 65%)",
          }}
        />
        <Reveal
          className="relative mx-auto px-6 text-center"
          style={{ maxWidth: 780, paddingTop: "clamp(56px,7vw,90px)", paddingBottom: "clamp(56px,7vw,90px)" }}
        >
          <h2
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(1.9rem,3.6vw,2.9rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 26,
            }}
          >
            Stop juggling apps. Start handing things off, soon.
          </h2>
          <WaitlistButton onClick={join} variant="light" size="lg" />
        </Reveal>
      </section>
    </div>
  );
}
