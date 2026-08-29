import { useRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from "react";

interface GlassCardProps {
  children: ReactNode;
  /** Hex accent used to tint the cursor spotlight glow. */
  accent?: string;
  /** Enable cursor spotlight + tilt (auto-disabled on touch / reduced-motion). */
  interactive?: boolean;
  /** Use the more opaque .glass-panel surface. */
  panel?: boolean;
  className?: string;
  style?: CSSProperties;
}

function glow(hex?: string): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "rgba(37,99,235,0.16)";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.18)`;
}

/**
 * Translucent frosted card. When interactive (and the device has a fine pointer
 * and no reduced-motion preference), it paints a cursor-tracked spotlight and a
 * subtle 3D tilt, the signature "lively glass" feel.
 */
export function GlassCard({ children, accent, interactive = true, panel, className, style }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled] = useState(
    () =>
      interactive &&
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!enabled || !el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.transform = `perspective(900px) rotateX(${(py - 0.5) * -4}deg) rotateY(${(px - 0.5) * 4}deg) translateY(-4px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };

  const css: CSSProperties = {
    borderRadius: 0,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    ...(enabled ? ({ "--glow": glow(accent) } as CSSProperties) : {}),
    ...style,
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden ${panel ? "glass-panel" : "glass"} ${enabled ? "glass-spotlight" : ""} ${className ?? ""}`}
      style={css}
    >
      {children}
    </div>
  );
}
