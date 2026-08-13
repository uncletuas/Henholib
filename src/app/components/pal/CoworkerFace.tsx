import { useEffect, useRef, useState } from "react";

/**
 * Living Coworker face, the exact face used inside the Pal workspace
 * (pal.loopital.com), kept in sync between the app and the loopital.com demo.
 *
 * The face is never frozen. Even at rest it blinks, glances, twitches its
 * eyebrows, breathes, and its smile gently shifts. When it speaks, the mouth
 * cycles through phoneme-like shapes (A / E / O / I / U / M / closed) with a
 * wide, warm range instead of just opening and closing in place. When it's
 * thinking, the eyes drift up-right, one brow lifts, and the mouth purses.
 *
 * Drives:
 *   - mood          → resting expression baseline (eyes, brows, mouth curve)
 *   - speaking      → run the phoneme cycle
 *   - thinking      → pull a pondering pose (look-away + raised brow)
 *   - mouthPulse    → punch the next phoneme harder on a word boundary
 *   - autonomous    → emerald eye glow
 */

export type CoworkerMood =
  | "neutral"
  | "happy"
  | "excited"
  | "sad"
  | "anxious"
  | "listening";

type Phoneme = "closed" | "M" | "A" | "E" | "O" | "I" | "U";

// A richer cycle with more vowel variety so the mouth visibly re-shapes
// word to word rather than just pulsing.
const PHONEME_CYCLE: Phoneme[] = ["A", "E", "O", "I", "M", "U", "A", "E", "closed"];

interface BrowState {
  /** Vertical offset in svg units; negative = raised. */
  lift: number;
  /** Inner-end angle in degrees, negative = pulled down (worried). */
  angle: number;
}

/** Moods that read as genuinely happy, used for smiling eyes + dimples. */
function isJoyful(mood: CoworkerMood): boolean {
  return mood === "happy" || mood === "excited";
}

type Gesture = "nod" | "shake" | "turn" | "bump" | "tilt";

export function CoworkerFace({
  speaking = false,
  thinking = false,
  size = 28,
  mood = "neutral",
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
  /** Eyes follow the mouse cursor across the whole page. */
  trackPointer?: boolean;
  /** Hovering the face makes it smile, widen its eyes and react with a gesture. */
  interactive?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hovered, setHovered] = useState(false);
  /** Live transform string driven by the gesture engine (nod/shake/turn/...). */
  const [xform, setXform] = useState("");
  /** True while the pointer is being tracked (eyes locked to cursor). */
  const [tracking, setTracking] = useState(false);
  const [blink, setBlink] = useState(false);
  const [phonemeIdx, setPhonemeIdx] = useState(0);
  const [punching, setPunching] = useState(false);
  /** Subtle gaze drift, in svg units relative to centred eyes. */
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  /** Brow micro-twitch, distinct from mood baseline. */
  const [browTwitch, setBrowTwitch] = useState<BrowState>({ lift: 0, angle: 0 });
  /** Subtle breathing scale (0.97..1.03). */
  const [breath, setBreath] = useState(1);
  /** Slow idle motion (0..1 sine) so the resting smile is never static. */
  const [idle, setIdle] = useState(0);

  const phonemeTimer = useRef<number | null>(null);

  // ── Blink loop ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const blinkBase =
      mood === "anxious" ? 1700 : mood === "sad" ? 3800 : 2800;
    const schedule = (): number =>
      window.setTimeout(
        () => {
          if (cancelled) return;
          setBlink(true);
          window.setTimeout(() => {
            if (cancelled) return;
            setBlink(false);
            // Occasional double-blink for life
            if (Math.random() < 0.18) {
              window.setTimeout(() => {
                if (cancelled) return;
                setBlink(true);
                window.setTimeout(() => {
                  if (cancelled) return;
                  setBlink(false);
                  handle = schedule();
                }, 110);
              }, 130);
            } else {
              handle = schedule();
            }
          }, mood === "anxious" ? 80 : 130);
        },
        blinkBase + Math.random() * 1800,
      );
    let handle = schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [mood]);

  // ── Gaze drift ────────────────────────────────────────────────────
  // Eyes never sit perfectly still, small saccades every 1.5-4s give
  // the face an "I'm looking around, taking things in" quality.
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      // While locked to the cursor, the pointer effect owns the gaze.
      if (tracking && !thinking) {
        handle = window.setTimeout(tick, 400);
        return;
      }
      if (thinking) {
        // Pondering: look up-right, sustained.
        setGaze({ x: 0.8, y: -0.7 });
      } else {
        // Wander randomly within ±0.8 svg units
        const x = (Math.random() - 0.5) * 1.6;
        const y = (Math.random() - 0.5) * 1.2;
        setGaze({ x, y });
      }
      const next = thinking ? 1800 : 1400 + Math.random() * 2400;
      handle = window.setTimeout(tick, next);
    };
    let handle = window.setTimeout(tick, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [thinking, tracking]);

  // ── Eyes follow the mouse cursor ──────────────────────────────────
  // When trackPointer is on, we read the face's on-screen centre and steer
  // the pupils toward the pointer. Falls back to wander when the mouse is
  // idle/away (tracking flips off after a short pause).
  useEffect(() => {
    if (!trackPointer || thinking) return;
    let idle: number | null = null;
    const onMove = (e: PointerEvent) => {
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      // Normalise then scale to the eye's travel range (svg units).
      const gx = Math.max(-2.1, Math.min(2.1, (dx / dist) * Math.min(dist / 90, 1) * 2.1));
      const gy = Math.max(-1.6, Math.min(1.6, (dy / dist) * Math.min(dist / 90, 1) * 1.6));
      setGaze({ x: gx, y: gy });
      setTracking(true);
      if (idle) window.clearTimeout(idle);
      idle = window.setTimeout(() => setTracking(false), 1400);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (idle) window.clearTimeout(idle);
    };
  }, [trackPointer, thinking]);

  // ── Brow micro-twitches ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (thinking) {
        // Ponder: one brow up, the other flat. Asymmetry sells it.
        setBrowTwitch({ lift: -1.4, angle: -8 });
      } else if (mood === "anxious") {
        setBrowTwitch({ lift: -0.3, angle: -14 });
      } else if (mood === "excited") {
        setBrowTwitch({ lift: -1.3, angle: 7 });
      } else if (mood === "happy") {
        setBrowTwitch({ lift: -0.6, angle: 5 });
      } else if (mood === "sad") {
        setBrowTwitch({ lift: 0.5, angle: -10 });
      } else {
        // Neutral / listening, occasional small lift to feel alive
        setBrowTwitch({
          lift: Math.random() < 0.4 ? -0.4 : 0,
          angle: (Math.random() - 0.5) * 4,
        });
      }
      const next = thinking ? 1400 : 2200 + Math.random() * 2600;
      handle = window.setTimeout(tick, next);
    };
    let handle = window.setTimeout(tick, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [mood, thinking]);

  // ── Head gestures ─────────────────────────────────────────────────
  // Instead of a constant sway (which reads as "shaking"), the head is
  // mostly still and occasionally plays a deliberate gesture — a nod, a
  // "no" shake, a curious tilt, a look-to-the-side turn, or a little bump.
  // Gestures fire more often (and immediately) while the face is hovered.
  const gestureRef = useRef<{ type: Gesture; start: number; dur: number } | null>(null);
  const playGesture = (type: Gesture) => {
    const dur =
      type === "shake" ? 720 : type === "turn" ? 1100 : type === "tilt" ? 1300 : type === "nod" ? 640 : 560;
    gestureRef.current = { type, start: performance.now(), dur };
  };

  // Drive the transform every frame from the active gesture (+ a barely-there
  // idle sway so a resting head isn't frozen, but never jitters).
  useEffect(() => {
    let cancelled = false;
    const rest0 = performance.now();
    const loop = (t: number) => {
      if (cancelled) return;
      const g = gestureRef.current;
      let tf = "";
      if (g) {
        const p = (t - g.start) / g.dur;
        if (p >= 1) gestureRef.current = null;
        else tf = gestureTransform(g.type, p);
      }
      if (!tf) {
        if (thinking) tf = "rotate(-3deg)";
        else tf = `rotate(${(Math.sin((t - rest0) / 2600) * 0.6).toFixed(2)}deg)`;
      }
      setXform(tf);
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [thinking]);

  // Schedule occasional idle gestures; brisker while hovered.
  useEffect(() => {
    if (thinking) return;
    let cancelled = false;
    const pool: Gesture[] = ["nod", "tilt", "turn", "shake", "bump"];
    const tick = () => {
      if (cancelled) return;
      if (!speaking) playGesture(pool[Math.floor(Math.random() * pool.length)]);
      const base = hovered ? 1500 : 5200;
      const jitter = hovered ? 1400 : 4200;
      handle = window.setTimeout(tick, base + Math.random() * jitter);
    };
    let handle = window.setTimeout(tick, hovered ? 200 : 2600);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [thinking, speaking, hovered]);

  // ── Breathing + idle mouth life ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const start = performance.now();
    const step = (t: number) => {
      if (cancelled) return;
      const phase = (t - start) / 1800; // ~1.8s per breath
      setBreath(1 + Math.sin(phase * Math.PI * 2) * 0.025);
      // Slow, independent idle wave (~3.2s) so the resting smile eases
      // in and out instead of sitting perfectly still.
      setIdle((Math.sin((t - start) / 3200) + 1) / 2);
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // ── Phoneme cycle when speaking ───────────────────────────────────
  useEffect(() => {
    if (!speaking) {
      if (phonemeTimer.current) {
        window.clearInterval(phonemeTimer.current);
        phonemeTimer.current = null;
      }
      setPhonemeIdx(0);
      return;
    }
    const tickMs = mood === "excited" ? 90 : mood === "sad" ? 155 : 115;
    phonemeTimer.current = window.setInterval(() => {
      setPhonemeIdx((i) => (i + 1) % PHONEME_CYCLE.length);
    }, tickMs);
    return () => {
      if (phonemeTimer.current) {
        window.clearInterval(phonemeTimer.current);
        phonemeTimer.current = null;
      }
    };
  }, [speaking, mood]);

  // ── Word-boundary punch ───────────────────────────────────────────
  useEffect(() => {
    if (!mouthPulse) return;
    setPunching(true);
    const id = window.setTimeout(() => setPunching(false), 140);
    return () => window.clearTimeout(id);
  }, [mouthPulse]);

  // Hovering the face lifts it into a big, warm reaction — a broad grin.
  const reacting = interactive && hovered && !thinking;
  const effMood: CoworkerMood = reacting ? "excited" : mood;

  // ── Compute mouth ─────────────────────────────────────────────────
  const phoneme: Phoneme = speaking ? PHONEME_CYCLE[phonemeIdx] : "closed";
  const openness = speaking ? (punching ? 1.0 : 0.86) : 0;
  const mouthPath = thinking
    ? thinkingMouthPath()
    : speaking
      ? phonemePath(phoneme, effMood, openness)
      : restingMouthPath(effMood, reacting ? 1 : idle);
  const mouthOpen =
    !thinking && openness > 0.3 && phoneme !== "M" && phoneme !== "closed";
  // A resting "excited" face keeps its mouth slightly open (a grin).
  const restingGrin = !thinking && !speaking && effMood === "excited";
  const mouthFilled = mouthOpen || restingGrin;

  // ── Eyes ──────────────────────────────────────────────────────────
  const eyeColor = autonomous ? "#a7f3d0" : "white";
  const eyeRyBase =
    thinking
      ? 1.6
      : effMood === "excited"
        ? 1.35
        : effMood === "happy"
          ? 1.5
          : effMood === "sad"
            ? 1.3
            : 1.9;
  // Eyes widen a touch on hover for an alert, delighted look.
  const eyeRy = blink ? 0.2 : reacting ? Math.max(eyeRyBase, 1.75) : eyeRyBase;
  const eyeY = effMood === "sad" ? 13 : effMood === "excited" ? 11 : 12;
  const leftEyeCx = 10 + gaze.x;
  const rightEyeCx = 18 + gaze.x;
  const eyesCy = eyeY + gaze.y;
  // Smiling eyes: for joyful moods, draw a soft upward arc over each eye
  // so the whole face reads as a genuine smile, not just a curved mouth.
  const joyful = isJoyful(effMood) && !thinking;
  const showSmileEyes = joyful && !blink;

  // ── Brows ─────────────────────────────────────────────────────────
  const browY = eyeY - 3 + browTwitch.lift;
  const leftBrow = browPath(true, browY, browTwitch.angle, blink ? 0 : 1);
  const rightBrow = browPath(false, browY, browTwitch.angle, blink ? 0 : 1);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 28 28"
      width={size}
      height={size}
      className="select-none"
      aria-hidden
      onPointerEnter={interactive ? () => { setHovered(true); playGesture("bump"); } : undefined}
      onPointerLeave={interactive ? () => setHovered(false) : undefined}
      style={{
        transform: `${xform} scale(${breath})`,
        transformOrigin: "center",
        cursor: interactive ? "pointer" : undefined,
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      {/* Brows */}
      <path
        d={leftBrow}
        stroke={eyeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity={blink ? 0.4 : 0.9}
        style={{ transition: "d 0.25s ease, opacity 0.15s ease" }}
      />
      <path
        d={rightBrow}
        stroke={eyeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity={blink ? 0.4 : 0.9}
        style={{ transition: "d 0.25s ease, opacity 0.15s ease" }}
      />

      {/* Eyes */}
      <ellipse
        cx={leftEyeCx}
        cy={eyesCy}
        rx="1.7"
        ry={eyeRy}
        fill={eyeColor}
        style={{
          transition: "ry 0.1s ease, cx 0.4s ease, cy 0.4s ease, fill 0.3s ease",
        }}
      />
      <ellipse
        cx={rightEyeCx}
        cy={eyesCy}
        rx="1.7"
        ry={eyeRy}
        fill={eyeColor}
        style={{
          transition: "ry 0.1s ease, cx 0.4s ease, cy 0.4s ease, fill 0.3s ease",
        }}
      />

      {/* Smiling-eye arcs for joyful moods */}
      {showSmileEyes && (
        <>
          <path
            d={`M ${leftEyeCx - 2} ${eyesCy - 0.2} Q ${leftEyeCx} ${eyesCy - 2.3} ${leftEyeCx + 2} ${eyesCy - 0.2}`}
            stroke={eyeColor}
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          <path
            d={`M ${rightEyeCx - 2} ${eyesCy - 0.2} Q ${rightEyeCx} ${eyesCy - 2.3} ${rightEyeCx + 2} ${eyesCy - 0.2}`}
            stroke={eyeColor}
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        </>
      )}

      {/* Autonomous-mode eye glow */}
      {autonomous && !blink && (
        <>
          <circle cx={leftEyeCx} cy={eyesCy} r="2.6" fill="#10b981" opacity="0.25">
            <animate
              attributeName="opacity"
              values="0.1;0.35;0.1"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={rightEyeCx} cy={eyesCy} r="2.6" fill="#10b981" opacity="0.25">
            <animate
              attributeName="opacity"
              values="0.35;0.1;0.35"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}

      {/* Dimples, a couple of soft dots at the corners when joyful */}
      {joyful && !speaking && (
        <>
          <circle cx="6.4" cy="19" r="0.7" fill="white" opacity="0.5" />
          <circle cx="21.6" cy="19" r="0.7" fill="white" opacity="0.5" />
        </>
      )}

      {/* Mouth */}
      <path
        d={mouthPath}
        stroke="white"
        strokeWidth={thinking ? 1.5 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={mouthFilled ? "rgba(255,255,255,0.9)" : "none"}
        style={{
          transition: "d 0.08s ease-out, fill 0.15s ease-out",
        }}
      />
    </svg>
  );
}

/* ── Head-gesture transforms ────────────────────────────────────────── */
/** A deliberate head gesture as a function of progress p (0..1). */
function gestureTransform(type: Gesture, p: number): string {
  const env = Math.sin(p * Math.PI); // 0 → 1 → 0 ease envelope
  switch (type) {
    case "nod": // a "yes" pitch — dip down and back up
      return `translateY(${(env * 1.7).toFixed(2)}px) scaleY(${(1 - env * 0.05).toFixed(3)})`;
    case "shake": // a "no" yaw — quick left/right, damped
      return `rotate(${(Math.sin(p * Math.PI * 3) * (1 - p) * 8).toFixed(2)}deg)`;
    case "turn": // glance to the side and back
      return `rotate(${(env * 9).toFixed(2)}deg) translateX(${(env * 1.3).toFixed(2)}px)`;
    case "bump": // a happy little bob-forward pop
      return `scale(${(1 + env * 0.13).toFixed(3)}) translateY(${(-env * 1.5).toFixed(2)}px)`;
    case "tilt": // a curious slow head-tilt
      return `rotate(${(env * 8).toFixed(2)}deg)`;
    default:
      return "";
  }
}

/* ── Brow geometry ─────────────────────────────────────────────────── */
function browPath(
  left: boolean,
  y: number,
  angle: number,
  opacity: number,
): string {
  if (opacity === 0) return "M 0 0"; // hidden on blink
  const innerX = left ? 12 : 16;
  const outerX = left ? 8 : 20;
  const len = Math.abs(outerX - innerX);
  const rad = (angle * Math.PI) / 180;
  const dy = Math.sin(rad) * len * (left ? -1 : 1);
  const outerY = y + dy;
  return `M ${innerX} ${y} L ${outerX} ${outerY}`;
}

/* ── Mouth path generation ─────────────────────────────────────────── */

/**
 * Resting mouth. `idle` (0..1) eases the smile a touch wider/warmer so a
 * face that isn't speaking still feels alive.
 */
function restingMouthPath(mood: CoworkerMood, idle = 0.5): string {
  const w = idle * 0.7; // 0..0.7 svg units of extra smile width
  switch (mood) {
    case "happy":
      return `M ${6.5 - w} 18 Q 14 ${22.6 + idle * 0.5} ${21.5 + w} 18`;
    case "excited":
      // Open grin (filled by caller), big and joyful.
      return ellipsePath(14, 19.4, 4.6 + w, 2.3 + idle * 0.3);
    case "sad":
      return `M 7 20.6 Q 14 ${17.8 - idle * 0.3} 21 20.6`;
    case "anxious":
      return `M 7 19 Q 10 17.6 13 19 Q 16 20.5 19 19 Q 20.6 18.4 21 19`;
    case "listening":
      return `M ${8 - w * 0.5} 18.5 Q 14 ${20.2 + idle * 0.4} ${20 + w * 0.5} 18.5`;
    case "neutral":
    default:
      // A gentle friendly upcurve, easing with idle.
      return `M ${8.5 - w * 0.5} 18.9 Q 14 ${20.8 + idle * 0.4} ${19.5 + w * 0.5} 18.9`;
  }
}

function thinkingMouthPath(): string {
  // Pursed, slightly off-centre, faint pinch, "hmm" look.
  return `M 11 19.5 Q 13.5 18.6 16 19.5`;
}

/**
 * Phoneme shapes, a wide, warm set so the mouth visibly re-shapes:
 *   - A : wide-open oval (loud)          - O : round, medium
 *   - E : wide + shallow (smile-shaped)  - I : narrow horizontal slit
 *   - U : small forward purse            - M / closed : gentle closed curve
 *
 * Mood tints the shape: happy/excited keep upturned corners even when
 * open; sad keeps corners pulled down.
 */
function phonemePath(
  p: Phoneme,
  mood: CoworkerMood,
  openness: number,
): string {
  const cornerLift = isJoyful(mood) ? -0.7 : mood === "sad" ? 0.7 : 0;
  const t = Math.max(0, Math.min(1, openness));

  switch (p) {
    case "closed":
    case "M": {
      const cy = 19 + cornerLift * 0.3;
      const dip = 19.6 + cornerLift * 0.3;
      return `M 8.5 ${cy} Q 14 ${dip} 19.5 ${cy}`;
    }
    case "A": {
      // Wide open oval, the biggest opening.
      const rx = 4.8 + t * 0.6;
      const ry = 2.6 + t * 0.9;
      return ellipsePath(14, 19.6 + cornerLift * 0.2, rx, ry);
    }
    case "E": {
      // Wide + shallow, smile-like.
      const rx = 5.6 + t * 0.5;
      const ry = 1.2 + t * 0.5;
      const cy = 19.3 + cornerLift * 0.3;
      return ellipsePath(14, cy, rx, ry);
    }
    case "O": {
      // Round, medium.
      const r = 2.2 + t * 0.8;
      return ellipsePath(14, 19.6, r, r);
    }
    case "U": {
      // Small forward purse.
      const r = 1.5 + t * 0.5;
      return ellipsePath(14, 19.7, r, r * 1.15);
    }
    case "I": {
      // Narrow horizontal slit.
      const rx = 4.6;
      const ry = 0.85 + t * 0.35;
      return ellipsePath(14, 19.4 + cornerLift * 0.3, rx, ry);
    }
    default:
      return restingMouthPath(mood);
  }
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}
