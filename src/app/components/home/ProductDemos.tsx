import { useEffect, useMemo, useRef, useState } from "react";
import { colors } from "../../lib/brand";

/**
 * The live demos that sit inside the product cards on the home page.
 *
 * Each one is a real, running miniature of what the product does — not a
 * screenshot. A still image of a chat says "there is a chat"; a conversation
 * that types itself out shows the thing working, and that is the difference
 * between a brochure and a demo.
 *
 * Three rules hold across all of them:
 *
 * 1. **They loop, quietly.** No controls, no sound, nothing to click. The card
 *    itself is the link; the demo is texture inside it.
 * 2. **They pause when off-screen and stop for reduced motion.** Six animated
 *    cards running at once on a phone is a battery complaint, and constant
 *    motion is a vestibular problem for some people. `useSteps` handles both in
 *    one place so no individual demo can forget.
 * 3. **The content is plausible, never real.** Names, amounts and readings are
 *    invented. Nothing here should ever be mistaken for a live customer record.
 */

/** Respect the OS "reduce motion" setting, live rather than at first render. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Drive a looping step counter, but only while the element is on screen.
 *
 * Returns the current step and a ref to attach. When motion is reduced the
 * counter parks on the last step, so every demo shows its finished state — the
 * information is still there, it just doesn't move.
 */
function useSteps(count: number, intervalMs: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      setStep(count - 1);
      return;
    }
    if (!visible) return;
    const id = setInterval(() => setStep((s) => (s + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [visible, reduced, count, intervalMs]);

  return { ref, step, reduced };
}

const mono = 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace';

// ── Pal ────────────────────────────────────────────────────────────────────

// Three turns, kept short on purpose: the card gives the demo a fixed 200px and
// a fourth exchange overflowed it, clipping the conversation from the top.
const PAL_TURNS = [
  { who: "user", text: "Summarise the Q3 board pack" },
  { who: "pal", text: "12 pages → 5 points. Revenue up 18%, hiring behind plan." },
  { who: "user", text: "Draft the follow-up" },
];

export function PalDemo() {
  const { ref, step } = useSteps(PAL_TURNS.length + 2, 1700);

  return (
    <div ref={ref} className="flex flex-col gap-2.5 justify-end h-full">
      {PAL_TURNS.map((t, i) => {
        const shown = i <= step;
        const mine = t.who === "user";
        return (
          <div
            key={i}
            className={mine ? "self-end" : "self-start"}
            style={{
              maxWidth: "82%",
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0)" : "translateY(6px)",
              transition: "opacity .45s ease, transform .45s ease",
            }}
          >
            <div
              className="px-3.5 py-2.5 rounded-2xl"
              style={{
                background: mine ? colors.blue : colors.surfaceMuted,
                color: mine ? "#08101F" : colors.text,
                fontSize: "12.5px",
                lineHeight: 1.5,
                fontWeight: mine ? 600 : 400,
                borderBottomRightRadius: mine ? "6px" : undefined,
                borderBottomLeftRadius: mine ? undefined : "6px",
              }}
            >
              {t.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Swift ──────────────────────────────────────────────────────────────────

// Four, not five: the fifth row fell outside the card's 200px window and got
// clipped mid-word. The point ("one brief, every platform") lands either way.
const PLATFORMS = ["Meta", "Google", "TikTok", "LinkedIn"];

export function SwiftDemo() {
  const { ref, step, reduced } = useSteps(PLATFORMS.length + 4, 850);
  const brief = "Weekend sale, 20% off, women 25-40, Lagos";
  const typed = reduced ? brief : brief.slice(0, Math.min(brief.length, (step + 1) * 11));

  return (
    <div ref={ref} className="flex flex-col gap-3 h-full">
      <div
        className="px-3 py-2.5 rounded-xl"
        style={{ background: colors.surfaceMuted, border: `1px solid ${colors.hairline}` }}
      >
        <p style={{ color: colors.textTertiary, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>
          BRIEF
        </p>
        <p style={{ color: colors.text, fontSize: "12.5px", marginTop: "3px", minHeight: "17px" }}>
          {typed}
          {!reduced && typed.length < brief.length && (
            <span style={{ color: colors.cyan, fontWeight: 700 }}>▏</span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {PLATFORMS.map((p, i) => {
          const done = step > i + 1;
          const working = step === i + 1;
          return (
            <div key={p} className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 15,
                  height: 15,
                  background: done ? colors.green : working ? colors.cyan : colors.surfaceMuted,
                  color: done || working ? "#06110C" : colors.textTertiary,
                  fontSize: "9px",
                  fontWeight: 800,
                  transition: "background .35s ease",
                }}
              >
                {done ? "✓" : working ? "•" : ""}
              </span>
              <span
                style={{
                  color: done ? colors.text : colors.textTertiary,
                  fontSize: "12px",
                  transition: "color .35s ease",
                }}
              >
                {p}
              </span>
              <span
                className="ml-auto"
                style={{ color: colors.textTertiary, fontSize: "11px", fontFamily: mono }}
              >
                {done ? "live" : working ? "publishing" : "queued"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modus ──────────────────────────────────────────────────────────────────

const ASSETS = [
  { name: "Chiller 02", metric: "7.2 bar", state: "ok" },
  { name: "Generator A", metric: "412 kW", state: "ok" },
  { name: "Pump 3", metric: "no signal", state: "alert" },
  { name: "Lift West", metric: "due in 3d", state: "warn" },
];

export function ModusDemo() {
  const { ref, step } = useSteps(ASSETS.length * 2, 1100);
  const active = step % ASSETS.length;

  return (
    <div ref={ref} className="flex flex-col gap-1.5 h-full justify-center">
      {ASSETS.map((a, i) => {
        const tone =
          a.state === "alert" ? "#F87171" : a.state === "warn" ? "#FBBF24" : colors.green;
        const on = i === active;
        return (
          <div
            key={a.name}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{
              background: on ? colors.surfaceRaised : "transparent",
              border: `1px solid ${on ? colors.hairline : "transparent"}`,
              transition: "background .4s ease, border-color .4s ease",
            }}
          >
            <span
              className="rounded-full shrink-0"
              style={{
                width: 7,
                height: 7,
                background: tone,
                boxShadow: a.state === "alert" ? `0 0 0 3px ${tone}26` : undefined,
              }}
            />
            <span style={{ color: colors.text, fontSize: "12.5px", fontWeight: 500 }}>{a.name}</span>
            <span
              className="ml-auto"
              style={{ color: a.state === "ok" ? colors.textTertiary : tone, fontSize: "11.5px", fontFamily: mono }}
            >
              {a.metric}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Beacon ─────────────────────────────────────────────────────────────────

const RESULTS = [
  { name: "Adaeze O.", score: 84 },
  { name: "Ibrahim K.", score: 71 },
  { name: "Chinedu A.", score: 92 },
  { name: "Fatima B.", score: 66 },
];

export function BeaconDemo() {
  const { ref, step } = useSteps(RESULTS.length + 2, 850);

  return (
    <div ref={ref} className="flex flex-col gap-2.5 h-full justify-center">
      <div className="flex items-baseline justify-between">
        <span style={{ color: colors.textTertiary, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>
          SS2 · MATHEMATICS
        </span>
        <span style={{ color: colors.textTertiary, fontSize: "10.5px", fontFamily: mono }}>
          {Math.min(step + 1, RESULTS.length)}/{RESULTS.length} released
        </span>
      </div>
      {RESULTS.map((r, i) => {
        const shown = i <= step;
        return (
          <div key={r.name} className="flex items-center gap-3">
            <span
              style={{
                color: shown ? colors.text : colors.textTertiary,
                fontSize: "12px",
                width: "74px",
                transition: "color .4s ease",
              }}
            >
              {r.name}
            </span>
            <span className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: colors.surfaceMuted }}>
              <span
                className="block h-full rounded-full"
                style={{
                  width: shown ? `${r.score}%` : "0%",
                  background: r.score >= 70 ? colors.green : colors.cyan,
                  transition: "width .8s cubic-bezier(.4,0,.2,1)",
                }}
              />
            </span>
            <span
              style={{
                color: shown ? colors.heading : "transparent",
                fontSize: "11.5px",
                fontFamily: mono,
                width: "22px",
                textAlign: "right",
                transition: "color .4s ease",
              }}
            >
              {r.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Henholib ───────────────────────────────────────────────────────────────

export function HenholibDemo() {
  const { ref, step, reduced } = useSteps(60, 90);

  // A calm resting trace. Deterministic, so it looks like a reading rather than
  // noise, and the beat lands where a real QRS complex would.
  const path = useMemo(() => {
    const pts: string[] = [];
    for (let x = 0; x <= 100; x += 1) {
      const beat = x % 25;
      let y = 20;
      if (beat === 8) y = 14;
      else if (beat === 10) y = 4;
      else if (beat === 12) y = 30;
      else if (beat === 14) y = 18;
      else if (beat > 16 && beat < 21) y = 20 - Math.sin((beat - 16) / 4 * Math.PI) * 3.5;
      pts.push(`${x === 0 ? "M" : "L"}${x},${y}`);
    }
    return pts.join(" ");
  }, []);

  const bpm = reduced ? 72 : 70 + (step % 5);

  return (
    <div ref={ref} className="flex flex-col gap-3 h-full justify-center">
      <div className="flex items-end gap-2">
        <span style={{ color: colors.heading, fontSize: "30px", fontWeight: 700, lineHeight: 1 }}>{bpm}</span>
        <span style={{ color: colors.textTertiary, fontSize: "11.5px", marginBottom: "3px" }}>bpm · resting</span>
      </div>
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" style={{ width: "100%", height: "42px" }} aria-hidden>
        <path d={path} fill="none" stroke={colors.green} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      </svg>
      <div className="flex gap-1.5 flex-wrap">
        {["Records synced", "Dr. Eze · Thu 10:30"].map((chip) => (
          <span
            key={chip}
            className="px-2.5 py-1 rounded-full"
            style={{ background: colors.surfaceMuted, color: colors.textSecondary, fontSize: "11px" }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── HMS7 ───────────────────────────────────────────────────────────────────

const WARDS = [
  { ward: "Emergency", used: 11, total: 12 },
  { ward: "Maternity", used: 7, total: 14 },
  { ward: "Paediatrics", used: 5, total: 10 },
];

export function Hms7Demo() {
  const { ref, step } = useSteps(WARDS.length + 2, 1000);

  return (
    <div ref={ref} className="flex flex-col gap-3 h-full justify-center">
      {WARDS.map((w, i) => {
        const shown = i <= step;
        const pct = (w.used / w.total) * 100;
        const tight = pct > 85;
        return (
          <div key={w.ward} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span style={{ color: colors.text, fontSize: "12px" }}>{w.ward}</span>
              <span
                style={{
                  color: tight ? "#FBBF24" : colors.textTertiary,
                  fontSize: "11.5px",
                  fontFamily: mono,
                }}
              >
                {w.used}/{w.total} beds
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: w.total }).map((_, b) => (
                <span
                  key={b}
                  className="flex-1 rounded-sm"
                  style={{
                    height: 8,
                    background:
                      shown && b < w.used
                        ? tight
                          ? "#FBBF24"
                          : colors.cyan
                        : colors.surfaceMuted,
                    transition: `background .5s ease ${b * 0.03}s`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
