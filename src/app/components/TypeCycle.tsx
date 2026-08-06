import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Types out a phrase, holds, deletes it, then cycles to the next, used for the
 * changing audience word in the hero headline. Renders the text with the brand
 * gradient plus a blinking caret. Static (first phrase) under reduced-motion.
 */
export function TypeCycle({ phrases, caretColor = "#2563EB" }: { phrases: string[]; caretColor?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) { setText(phrases[0]); return; }
    const current = phrases[i % phrases.length];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting) {
      if (text.length < current.length) t = setTimeout(() => setText(current.slice(0, text.length + 1)), 65);
      else t = setTimeout(() => setDeleting(true), 1700);
    } else {
      if (text.length > 0) t = setTimeout(() => setText(current.slice(0, text.length - 1)), 34);
      else { setDeleting(false); setI((v) => (v + 1) % phrases.length); }
    }
    return () => clearTimeout(t);
  }, [text, deleting, i, reduce, phrases]);

  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span className="brand-gradient-text">{text || " "}</span>
      <span className="type-caret" style={{ color: caretColor, fontWeight: 300, marginLeft: "1px" }}>|</span>
    </span>
  );
}
