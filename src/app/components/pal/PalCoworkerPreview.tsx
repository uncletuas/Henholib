import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { colors, shadow } from "../../lib/brand";
import { CoworkerFace, type CoworkerMood } from "./CoworkerFace";

/**
 * The Pal coworker, running on the marketing site.
 *
 * This is a replica of the live coworker at pal.loopital.com, with one
 * deliberate difference: you cannot talk to it. There is no input, no send, no
 * network call. It simply speaks on its own — the same thing the real coworker
 * does through its flash bubble when nobody has opened the panel — and what it
 * says is an invitation into a part of the Pal workspace.
 *
 * That restraint is the point. A chat box on a landing page asks the reader to
 * do work before they have seen anything; a coworker that is already working,
 * and occasionally mentions what it just finished, shows the product instead.
 *
 * Cadence note: the real coworker waits 75s between flashes because it sits
 * beside you all day and nagging is its failure mode. Here the reader is gone
 * inside a minute, so the loop runs continuously — think, speak, hold — and is
 * never left sitting empty.
 */

interface CoworkerLine {
  text: string;
  mood: CoworkerMood;
  /** The workspace surface this line is inviting the reader into. */
  feature: string;
}

const LINES: CoworkerLine[] = [
  {
    text: "I drafted this week's report while you were out. Every number came straight from your own systems, so there was nothing to reconcile.",
    mood: "happy",
    feature: "Reports",
  },
  {
    text: "Three emails needed answers this morning. I've written replies to all of them and left them for you to send.",
    mood: "excited",
    feature: "Inbox",
  },
  {
    text: "A lead came in from your campaign an hour ago. I answered them, qualified them, and moved them into the pipeline.",
    mood: "happy",
    feature: "Social",
  },
  {
    text: "Your Thursday was triple-booked. I moved the two internal reviews and told everyone why.",
    mood: "neutral",
    feature: "Schedules",
  },
  {
    text: "That 40-page supplier contract is now a one-page summary. The auto-renewal clause is worth two minutes of your time.",
    mood: "neutral",
    feature: "Documents",
  },
  {
    text: "Ask me to build the thing you keep doing by hand, and I'll have a working version of it before your coffee goes cold.",
    mood: "excited",
    feature: "Operations",
  },
];

const THINK_MS = 1100;
const HOLD_MS = 7000;
const TYPE_MS = 20;

/** The Pal face on its gradient chip. Alive, but it will not follow you. */
function PalChip({
  size = 36,
  dot = true,
  speaking = false,
  thinking = false,
  mood = "neutral",
  mouthPulse = 0,
}: {
  size?: number;
  dot?: boolean;
  speaking?: boolean;
  thinking?: boolean;
  mood?: CoworkerMood;
  mouthPulse?: number;
}) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-[30%] flex items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}
      >
        {/* trackPointer and interactive are deliberately off: the face keeps its
            whole autonomous life — blinking, saccades, brow twitches, breathing,
            head gestures — but never reacts to the reader. */}
        <CoworkerFace
          size={Math.round(size * 0.82)}
          speaking={speaking}
          thinking={thinking}
          mood={mood}
          mouthPulse={mouthPulse}
          trackPointer={false}
          interactive={false}
        />
      </div>
      {dot && (
        <span
          className="absolute rounded-full"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            top: -size * 0.06,
            right: -size * 0.06,
            background: colors.green,
            border: "2px solid #fff",
          }}
        />
      )}
    </div>
  );
}

export function PalCoworkerPreview() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"think" | "speak" | "hold">("think");
  const [pulse, setPulse] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const line = LINES[i];

  useEffect(() => {
    // With reduced motion the coworker says one thing and then stays still.
    if (reduce) {
      setTyped(LINES[0].text);
      setPhase("hold");
      return;
    }

    const current = LINES[i];
    const queue: ReturnType<typeof setTimeout>[] = [];
    timers.current = queue;
    setTyped("");
    setPulse(0);
    setPhase("think");

    let n = 0;
    const type = () => {
      n += 1;
      setTyped(current.text.slice(0, n));
      // Punch the mouth on word boundaries so it articulates rather than hums.
      if (current.text[n - 1] === " ") setPulse((v) => v + 1);
      if (n < current.text.length) {
        queue.push(setTimeout(type, TYPE_MS));
      } else {
        setPhase("hold");
        queue.push(setTimeout(() => setI((v) => (v + 1) % LINES.length), HOLD_MS));
      }
    };

    queue.push(
      setTimeout(() => {
        setPhase("speak");
        type();
      }, THINK_MS),
    );

    return () => queue.forEach(clearTimeout);
  }, [i, reduce]);

  return (
    <div
      className="glass-panel relative overflow-hidden text-left"
      style={{ borderRadius: "26px", padding: "18px" }}
      // The reader is watching, not conversing. Announce what this is once,
      // rather than shouting every new sentence into a screen reader.
      role="img"
      aria-label="Pal, the Loopital AI coworker, describing work it has just finished"
    >
      {/* header */}
      <div
        className="flex items-center gap-2.5 pb-3.5 mb-3.5"
        style={{ borderBottom: `1px solid ${colors.hairline}` }}
      >
        <PalChip
          size={38}
          speaking={phase === "speak"}
          thinking={phase === "think"}
          mood={line.mood}
          mouthPulse={pulse}
        />
        <div className="flex-1">
          <p style={{ fontSize: "13px", fontWeight: 700, color: colors.heading, lineHeight: 1.1 }}>
            Pal
          </p>
          <p style={{ fontSize: "11px", color: colors.textTertiary }}>AI coworker</p>
        </div>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.green }} />
          <span style={{ fontSize: "11px", color: colors.textTertiary }}>working</span>
        </span>
      </div>

      {/* What Pal is saying. One bubble, always Pal's — there is no other side
          to this conversation. */}
      <div className="flex flex-col gap-3" style={{ minHeight: "150px" }} aria-hidden="true">
        <div className="self-start flex items-end gap-2 max-w-[92%]">
          <PalChip
            size={26}
            dot={false}
            speaking={phase === "speak"}
            thinking={phase === "think"}
            mood={line.mood}
            mouthPulse={pulse}
          />
          <div
            className="px-3.5 py-2.5 rounded-2xl rounded-bl-md"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.14)",
            }}
          >
            {phase === "think" ? (
              <span className="inline-flex gap-1 py-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full type-caret"
                    style={{ background: colors.blue, animationDelay: `${d * 0.18}s` }}
                  />
                ))}
              </span>
            ) : (
              <p style={{ fontSize: "13.5px", color: colors.heading, lineHeight: 1.55 }}>
                {typed}
                {phase === "speak" && <span className="type-caret">▋</span>}
              </p>
            )}
          </div>
        </div>

        {/* The part of the workspace that line came from. Held back until the
            sentence lands, so the eye reads the work first and the label second. */}
        {phase === "hold" && (
          <div
            className="self-start ml-9 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.hairline}`,
              boxShadow: shadow.sm,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#6D5AF0" }} />
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: colors.heading }}>
              {line.feature}
            </span>
            <span style={{ fontSize: "11.5px", color: colors.textTertiary }}>
              in Pal Workspace
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
