import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { colors, shadow } from "../../lib/brand";
import { CoworkerFace } from "./CoworkerFace";

/**
 * Pal, hovering.
 *
 * The coworker floats in the corner of the site the way it floats in the corner
 * of the workspace, and every so often says something about what Loopital
 * builds. It cannot be talked to: no input, no send, no network. It is a live
 * thing on the page, not a support widget.
 *
 * Restraint is the design. A chat box asks a visitor to do work before they
 * have seen anything; a coworker already working, occasionally mentioning what
 * it just did, shows the product instead.
 */

interface Line {
  text: string;
  mood: "neutral" | "happy" | "excited";
}

const LINES: Line[] = [
  { text: "Henholib puts your records, your doctor and your emergency call on your phone.", mood: "happy" },
  { text: "HMS7 runs the hospital that answers when you book. Same network, both ends.", mood: "neutral" },
  { text: "I am Pal. I draft the report, answer the email and post to your socials while you do the work only you can do.", mood: "excited" },
  { text: "Modus keeps every building, asset and work order in one place.", mood: "neutral" },
  { text: "Beacon runs admissions, fees and results for schools end to end.", mood: "happy" },
  { text: "One Loopital account opens all of it. No separate logins.", mood: "excited" },
];

const VISIBLE_MS = 7600;
const GAP_MS = 5200;
const FIRST_MS = 2600;

export function PalGenie() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [showing, setShowing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (dismissed) return;
    const queue: ReturnType<typeof setTimeout>[] = [];
    timers.current = queue;

    if (reduce) {
      // One message, held. No cycling, no motion.
      queue.push(setTimeout(() => setShowing(true), FIRST_MS));
      return () => queue.forEach(clearTimeout);
    }

    const cycle = (first: boolean) => {
      queue.push(
        setTimeout(
          () => {
            setShowing(true);
            queue.push(
              setTimeout(() => {
                setShowing(false);
                setI((v) => (v + 1) % LINES.length);
                cycle(false);
              }, VISIBLE_MS),
            );
          },
          first ? FIRST_MS : GAP_MS,
        ),
      );
    };
    cycle(true);
    return () => queue.forEach(clearTimeout);
  }, [reduce, dismissed]);

  if (dismissed) return null;
  const line = LINES[i];

  return (
    <div
      className="fixed z-40 flex items-end gap-2"
      style={{ right: "clamp(14px,3vw,28px)", bottom: "clamp(14px,3vw,28px)" }}
    >
      {/* The bubble sits to the left of the face on wide screens and above it
          on narrow ones, so it never runs off the edge. */}
      <div
        aria-hidden="true"
        className="glass-panel hidden sm:block"
        style={{
          maxWidth: 300,
          borderRadius: 18,
          padding: "12px 14px",
          boxShadow: shadow.md,
          opacity: showing ? 1 : 0,
          transform: showing ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
          transition: "opacity 420ms ease, transform 420ms cubic-bezier(0.22,1,0.36,1)",
          pointerEvents: "none",
        }}
      >
        <p style={{ fontSize: "11px", fontWeight: 700, color: colors.blue, letterSpacing: "0.06em" }}>PAL</p>
        <p style={{ fontSize: "13px", color: colors.heading, lineHeight: 1.5, marginTop: 2 }}>
          {line.text}
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Hide Pal"
          className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full"
          style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, color: colors.textTertiary, fontSize: 11, lineHeight: 1 }}
        >
          ×
        </button>

        <div
          className="rounded-[30%] overflow-hidden grid place-items-center"
          style={{
            width: 60,
            height: 60,
            background: "linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)",
            boxShadow: "0 14px 34px rgba(79,70,229,0.34)",
            animation: reduce ? "none" : "pal-hover 4.8s ease-in-out infinite",
          }}
        >
          {/* trackPointer and interactive stay off: the face keeps its whole
              autonomous life but never reacts to the reader. */}
          <CoworkerFace
            size={48}
            speaking={showing}
            mood={line.mood}
            trackPointer={false}
            interactive={false}
          />
        </div>
        <span
          className="absolute rounded-full"
          style={{ width: 12, height: 12, right: 2, bottom: 2, background: colors.green, border: "2px solid #fff" }}
        />
      </div>

      <style>{`
        @keyframes pal-hover {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}
