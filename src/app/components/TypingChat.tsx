import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { productById } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";

const PAIRS = [
  { q: "Summarize the Q3 board deck", a: "Done — 5 key takeaways, 3 risks, and a one-line recommendation. Want the email draft too?" },
  { q: "Draft a launch post for SART34", a: "Here's a punchy 3-line post with a clear CTA and 5 on-brand hashtags, ready to publish." },
  { q: "Where are we losing users in onboarding?", a: "Four drop-off points. The biggest is step 3 — it asks for too much. I've proposed fixes." },
];

const stack62 = productById("stack62");

export function TypingChat() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"prompt" | "think" | "answer" | "hold">("prompt");

  useEffect(() => {
    if (reduce) { setPrompt(PAIRS[0].q); setAnswer(PAIRS[0].a); setPhase("hold"); return; }
    const pair = PAIRS[i];
    const timers: ReturnType<typeof setTimeout>[] = [];
    setPrompt(""); setAnswer(""); setPhase("prompt");

    let p = 0;
    const typeP = () => {
      p += 1; setPrompt(pair.q.slice(0, p));
      if (p < pair.q.length) timers.push(setTimeout(typeP, 30));
      else { setPhase("think"); timers.push(setTimeout(startA, 850)); }
    };
    let a = 0;
    const startA = () => {
      setPhase("answer");
      const typeA = () => {
        a += 1; setAnswer(pair.a.slice(0, a));
        if (a < pair.a.length) timers.push(setTimeout(typeA, 18));
        else { setPhase("hold"); timers.push(setTimeout(() => setI((v) => (v + 1) % PAIRS.length), 2600)); }
      };
      typeA();
    };
    timers.push(setTimeout(typeP, 350));
    return () => timers.forEach(clearTimeout);
  }, [i, reduce]);

  return (
    <div className="glass-panel relative overflow-hidden" style={{ borderRadius: "26px", padding: "18px" }}>
      {/* header */}
      <div className="flex items-center gap-2.5 pb-3.5 mb-3.5" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
          <ImageWithFallback src={stack62.logo} alt="STACK62" className="w-5 h-5 object-contain" />
        </div>
        <div className="flex-1">
          <p style={{ fontSize: "13px", fontWeight: 700, color: colors.heading, lineHeight: 1.1 }}>STACK62</p>
          <p style={{ fontSize: "11px", color: colors.textTertiary }}>AI coworker</p>
        </div>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.green }} />
          <span style={{ fontSize: "11px", color: colors.textTertiary }}>online</span>
        </span>
      </div>

      {/* conversation */}
      <div className="flex flex-col gap-3" style={{ minHeight: "150px" }}>
        {/* user */}
        <div className="self-end max-w-[86%] px-3.5 py-2.5 rounded-2xl rounded-br-md" style={{ background: colors.surfaceMuted }}>
          <p style={{ fontSize: "13.5px", color: colors.heading, lineHeight: 1.5 }}>
            {prompt}{phase === "prompt" && <span className="type-caret">▋</span>}
          </p>
        </div>
        {/* assistant */}
        {(phase === "think" || phase === "answer" || phase === "hold") && (
          <div className="self-start flex items-end gap-2 max-w-[92%]">
            <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: gradientBrand }}>
              <ImageWithFallback src={stack62.logo} alt="" className="w-4 h-4 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.12)" }}>
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
