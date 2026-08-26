import { useEffect, useRef, useState } from "react";

/**
 * The Pal coworker's face.
 *
 * Rewritten to be calm. The previous version drove a `requestAnimationFrame`
 * loop that called `setState` on every frame, re-rendering the whole SVG sixty
 * times a second, and layered random head gestures on top of it: nods, shakes,
 * turns, tilts and bumps firing on a timer. The result read as twitchy rather
 * than alive, and it was expensive.
 *
 * What replaced it:
 *
 *   - No per-frame React state. The only continuous motion is a CSS breathing
 *     transform, which runs on the compositor and costs nothing.
 *   - No head gestures. A face that keeps jerking looks nervous. This one holds
 *     still and lets the eyes and mouth carry the expression.
 *   - Blinking stays, because a face that never blinks is unsettling, but it is
 *     infrequent and quick.
 *   - Happy is the default mood, and happy means genuinely smiling: the mouth
 *     curves up and the eyes arch, which is what actually reads as a smile. A
 *     smile drawn only on the mouth reads as polite, not warm.
 *
 * Strokes are thick with round caps and the fill is solid white, so the face
 * stays legible at 24px and looks confident rather than faint.
 *
 * Kept in sync with the copy inside the Pal workspace. Change one, change both.
 */

export type CoworkerMood =
  | "neutral"
  | "happy"
  | "excited"
  | "sad"
  | "anxious"
  | "listening";

/** Mouth shapes cycled while speaking. Vowel-ish, so it reads as articulation. */
const VISEMES = [0.55, 1, 0.7, 0.35, 0.85, 0.5] as const;

interface MoodShape {
  /** Smile depth. Positive curves up, negative curves down. */
  curve: number;
  /** Eye openness, 1 = round, lower = arched or narrowed. */
  open: number;
  /** True when the eyes should arch upward, which is what a real smile does. */
  arch: boolean;
  /** Brow offset in viewBox units. Negative is raised. */
  brow: number;
}

const MOODS: Record<CoworkerMood, MoodShape> = {
  happy: { curve: 3.2, open: 0.78, arch: true, brow: -0.5 },
  excited: { curve: 3.8, open: 0.9, arch: true, brow: -1.1 },
  neutral: { curve: 1.6, open: 1, arch: false, brow: 0 },
  listening: { curve: 1.9, open: 1, arch: false, brow: -0.4 },
  sad: { curve: -1.8, open: 0.85, arch: false, brow: 0.6 },
  anxious: { curve: -0.8, open: 1.05, arch: false, brow: 0.3 },
};

export function CoworkerFace({
  speaking = false,
  thinking = false,
  size = 28,
  mood = "happy",
  mouthPulse = 0,
  autonomous = false,
  trackPointer = false,
  interactive = false,
}: {
  speaking?: boolean;
  thinking?: boolean;
  size?: number;
  mood?: CoworkerMood;
  mouthPulse?: number;
  autonomous?: boolean;
  /** Eyes follow the pointer. Off by default; the marketing site keeps it off. */
  trackPointer?: boolean;
  /** Hovering warms the expression. Off by default. */
  interactive?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [blink, setBlink] = useState(false);
  const [viseme, setViseme] = useState(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hovering lifts the mood one step, so an interactive face feels responsive
  // without the head physically moving.
  const effective: CoworkerMood =
    interactive && hovered ? "excited" : thinking ? "listening" : mood;
  const shape = MOODS[effective];

  // ── Blink ──────────────────────────────────────────────────────────
  // Sparse and quick. Two state updates per blink, nothing between them.
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          if (cancelled) return;
          setBlink(true);
          window.setTimeout(() => {
            if (!cancelled) setBlink(false);
            schedule();
          }, 120);
        },
        3200 + Math.random() * 3600,
      );
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reduced]);

  // ── Speaking ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!speaking || reduced) {
      setViseme(0);
      return;
    }
    const id = window.setInterval(
      () => setViseme((v) => (v + 1) % VISEMES.length),
      130,
    );
    return () => window.clearInterval(id);
  }, [speaking, reduced]);

  /** A word boundary punches the current shape rather than restarting it. */
  useEffect(() => {
    if (mouthPulse > 0) setViseme((v) => (v + 1) % VISEMES.length);
  }, [mouthPulse]);

  // ── Gaze ───────────────────────────────────────────────────────────
  // Either follows the pointer, or drifts on a slow timer. Both are sparse:
  // a handful of updates a minute, not sixty a second.
  useEffect(() => {
    if (reduced) return;

    if (trackPointer) {
      const onMove = (e: PointerEvent) => {
        const el = svgRef.current?.getBoundingClientRect();
        if (!el) return;
        const dx = (e.clientX - (el.left + el.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (el.top + el.height / 2)) / window.innerHeight;
        setGaze({
          x: Math.max(-1, Math.min(1, dx * 2.4)),
          y: Math.max(-1, Math.min(1, dy * 2.4)),
        });
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }

    let cancelled = false;
    let timer: number;
    const drift = () => {
      timer = window.setTimeout(
        () => {
          if (cancelled) return;
          // Thinking looks up and away. Otherwise a small, unhurried glance.
          setGaze(
            thinking
              ? { x: 0.55, y: -0.6 }
              : { x: (Math.random() - 0.5) * 0.9, y: (Math.random() - 0.5) * 0.6 },
          );
          drift();
        },
        2600 + Math.random() * 2800,
      );
    };
    drift();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trackPointer, thinking, reduced]);

  // ── Geometry ───────────────────────────────────────────────────────
  const gx = gaze.x * 1.15;
  const gy = gaze.y * 0.85;

  const eyeY = 11.6 + gy;
  const leftX = 9.9 + gx;
  const rightX = 18.1 + gx;

  const openness = blink ? 0.06 : shape.open;
  const eyeRy = 3.05 * openness;

  const mouthY = 19.2;
  const speakOpen = speaking ? VISEMES[viseme] : 0;
  // Speaking opens the mouth; otherwise it is a smile stroke.
  const mouthH = 1.1 + speakOpen * 3.2;
  const curve = shape.curve;

  const ink = "#FFFFFF";
  const stroke = 2.4;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="Pal"
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      style={{
        display: "block",
        overflow: "visible",
        // The only continuous motion. CSS, so it never re-renders React.
        animation: reduced ? "none" : "pal-face-breathe 5.2s ease-in-out infinite",
        transformOrigin: "50% 60%",
      }}
    >
      {/* Brows. Present only when the mood asks for them, so a resting face
          stays clean rather than busy. */}
      {shape.brow !== 0 && !blink && (
        <>
          <path
            d={`M ${leftX - 2.5} ${8.1 + shape.brow} Q ${leftX} ${7.2 + shape.brow} ${leftX + 2.5} ${8.1 + shape.brow}`}
            stroke={ink}
            strokeWidth={1.7}
            strokeLinecap="round"
            opacity={0.9}
          />
          <path
            d={`M ${rightX - 2.5} ${8.1 + shape.brow} Q ${rightX} ${7.2 + shape.brow} ${rightX + 2.5} ${8.1 + shape.brow}`}
            stroke={ink}
            strokeWidth={1.7}
            strokeLinecap="round"
            opacity={0.9}
          />
        </>
      )}

      {/* Eyes. A genuine smile arches them, so happy draws arcs rather than
          circles. That is the difference between warm and merely polite. */}
      {shape.arch && !blink ? (
        <>
          <path
            d={`M ${leftX - 2.9} ${eyeY + 1.1} Q ${leftX} ${eyeY - 2.6} ${leftX + 2.9} ${eyeY + 1.1}`}
            stroke={ink}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${rightX - 2.9} ${eyeY + 1.1} Q ${rightX} ${eyeY - 2.6} ${rightX + 2.9} ${eyeY + 1.1}`}
            stroke={ink}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <ellipse cx={leftX} cy={eyeY} rx={2.5} ry={eyeRy} fill={ink} />
          <ellipse cx={rightX} cy={eyeY} rx={2.5} ry={eyeRy} fill={ink} />
          {autonomous && !blink && (
            <>
              <circle cx={leftX} cy={eyeY} r={3.6} fill="#34D399" opacity={0.22} />
              <circle cx={rightX} cy={eyeY} r={3.6} fill="#34D399" opacity={0.22} />
            </>
          )}
        </>
      )}

      {/* Mouth. Speaking opens it, otherwise it is a thick, confident smile. */}
      {speaking ? (
        <ellipse
          cx={14}
          cy={mouthY}
          rx={3.1}
          ry={mouthH}
          fill={ink}
          style={{ transition: "ry 90ms ease" }}
        />
      ) : (
        <path
          d={`M ${14 - 4.2} ${mouthY - curve * 0.35} Q 14 ${mouthY + curve} ${14 + 4.2} ${mouthY - curve * 0.35}`}
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          style={{ transition: "d 260ms ease" }}
        />
      )}

      {/* Cheeks. Only when genuinely happy, and only faintly. */}
      {shape.arch && (
        <>
          <circle cx={6.6} cy={16.4} r={1.5} fill={ink} opacity={0.2} />
          <circle cx={21.4} cy={16.4} r={1.5} fill={ink} opacity={0.2} />
        </>
      )}

      <style>{`
        @keyframes pal-face-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.035); }
        }
      `}</style>
    </svg>
  );
}
