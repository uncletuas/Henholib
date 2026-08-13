import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { colors } from "../lib/brand";
import { CoworkerFace, type CoworkerMood } from "./pal/CoworkerFace";

const PAIRS: { q: string; a: string; mood: CoworkerMood }[] = [
  { q: "Summarize the Q3 board deck", a: "Done, 5 key takeaways, 3 risks, and a one-line recommendation. Want the email draft too?", mood: "happy" },
  { q: "Draft a launch post for Swift", a: "Here's a punchy 3-line post with a clear CTA and 5 on-brand hashtags, ready to publish.", mood: "excited" },
  { q: "Where are we losing users in onboarding?", a: "Four drop-off points. The biggest is step 3, it asks for too much. I've proposed fixes.", mood: "neutral" },
];

/**
 * The Pal face on its gradient chip, the exact living coworker from
 * pal.loopital.com. `speaking`/`thinking`/`mood` animate the face.
 */
function PalChip({
  size = 36,
  dot = true,
  speaking = false,
  thinking = false,
  mood = "neutral",
  mouthPulse = 0,
  trackPointer = false,
  interactive = false,
}: {
  size?: number;
  dot?: boolean;
  speaking?: boolean;
  thinking?: boolean;
  mood?: CoworkerMood;
  mouthPulse?: number;
  trackPointer?: boolean;
  interactive?: boolean;
}) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-[30%] flex items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}
      >
        <CoworkerFace
          size={Math.round(size * 0.82)}
          speaking={speaking}
          thinking={thinking}
          mood={mood}
          mouthPulse={mouthPulse}
          trackPointer={trackPointer}
          interactive={interactive}
        />
      </div>
      {dot && (
        <span
          className="absolute rounded-full"
          style={{ width: size * 0.28, height: size * 0.28, top: -size * 0.06, right: -size * 0.06, background: colors.green, border: "2px solid #fff" }}
        />
      )}
    </div>
  );
}

export function TypingChat() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"prompt" | "think" | "answer" | "hold">("prompt");
  const [pulse, setPulse] = useState(0);

  const pair = PAIRS[i];

  useEffect(() => {
    if (reduce) { setPrompt(PAIRS[0].q); setAnswer(PAIRS[0].a); setPhase("hold"); return; }
    const p0 = PAIRS[i];
    const timers: ReturnType<typeof setTimeout>[] = [];
    setPrompt(""); setAnswer(""); setPhase("prompt"); setPulse(0);

    let p = 0;
    const typeP = () => {
      p += 1; setPrompt(p0.q.slice(0, p));
      if (p < p0.q.length) timers.push(setTimeout(typeP, 30));
      else { setPhase("think"); timers.push(setTimeout(startA, 1000)); }
    };
    let a = 0;
    const startA = () => {
      setPhase("answer");
      const typeA = () => {
        a += 1;
        setAnswer(p0.a.slice(0, a));
        // Punch the mouth on word boundaries so it "articulates" words.
        if (p0.a[a - 1] === " ") setPulse((v) => v + 1);
        if (a < p0.a.length) timers.push(setTimeout(typeA, 18));
        else { setPhase("hold"); timers.push(setTimeout(() => setI((v) => (v + 1) % PAIRS.length), 2600)); }
      };
      typeA();
    };
    timers.push(setTimeout(typeP, 350));
    return () => timers.forEach(clearTimeout);
  }, [i, reduce]);

  return (
    <div className="glass-panel relative overflow-hidden text-left" style={{ borderRadius: "26px", padding: "18px" }}>
      {/* header */}
      <div className="flex items-center gap-2.5 pb-3.5 mb-3.5" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
        <PalChip size={38} speaking={phase === "answer"} thinking={phase === "think"} mood={pair.mood} mouthPulse={pulse} trackPointer interactive />
        <div className="flex-1">
          <p style={{ fontSize: "13px", fontWeight: 700, color: colors.heading, lineHeight: 1.1 }}>Pal</p>
          <p style={{ fontSize: "11px", color: colors.textTertiary }}>AI coworker</p>
        </div>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.green }} />
          <span style={{ fontSize: "11px", color: colors.textTertiary }}>online</span>
        </span>
      </div>

      {/* conversation */}
      <div className="flex flex-col gap-3" style={{ minHeight: "150px" }}>
        <div className="self-end max-w-[86%] px-3.5 py-2.5 rounded-2xl rounded-br-md" style={{ background: colors.surfaceMuted }}>
          <p style={{ fontSize: "13.5px", color: colors.heading, lineHeight: 1.5 }}>
            {prompt}{phase === "prompt" && <span className="type-caret">▋</span>}
          </p>
        </div>
        {(phase === "think" || phase === "answer" || phase === "hold") && (
          <div className="self-start flex items-end gap-2 max-w-[92%]">
            <PalChip size={26} dot={false} speaking={phase === "answer"} thinking={phase === "think"} mood={pair.mood} mouthPulse={pulse} />
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}>
              {phase === "think" ? (
                <span className="inline-flex gap-1 py-1">
                  {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full type-caret" style={{ background: colors.blue, animationDelay: `${d * 0.18}s` }} />)}
                </span>
              ) : (
                <p style={{ fontSize: "13.5px", color: colors.heading, lineHeight: 1.55 }}>
                  {answer}{phase === "answer" && <span className="type-caret">▋</span>}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
