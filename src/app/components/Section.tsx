import type { ReactNode, CSSProperties } from "react";

interface SectionProps {
  children: ReactNode;
  /** Background fill. Defaults to the page canvas. */
  background?: string;
  /** Vertical padding scale. */
  pad?: "sm" | "md" | "lg";
  /** Constrain inner content width. */
  width?: "default" | "narrow" | "wide" | "full";
  id?: string;
  className?: string;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
}

const padMap = {
  sm: "clamp(56px, 7vw, 88px)",
  md: "clamp(80px, 10vw, 128px)",
  lg: "clamp(96px, 12vw, 160px)",
};

const widthMap = {
  narrow: "880px",
  default: "1200px",
  wide: "1320px",
  full: "100%",
};

/**
 * Consistent vertical rhythm + centered content column. The site "breathes":
 * generous section padding and a calm max-width.
 */
export function Section({
  children,
  background = "transparent",
  pad = "lg",
  width = "default",
  id,
  className,
  style,
  innerStyle,
}: SectionProps) {
  return (
    <section id={id} className={className} style={{ background, padding: `${padMap[pad]} 0`, ...style }}>
      <div
        className="mx-auto px-6"
        style={{ maxWidth: widthMap[width], width: "100%", ...innerStyle }}
      >
        {children}
      </div>
    </section>
  );
}
