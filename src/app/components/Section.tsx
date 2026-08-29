import type { ReactNode, CSSProperties } from "react";

interface SectionProps {
  children: ReactNode;
  /** Background fill. Defaults to the page canvas. */
  background?: string;
  /** A light shadow edge above the section, so bands separate without a hard
   *  rule and without tinting the whole page. */
  divided?: boolean;
  /** Vertical padding scale. */
  pad?: "sm" | "md" | "lg";
  /** Constrain inner content width. */
  width?: "default" | "narrow" | "wide" | "full";
  id?: string;
  className?: string;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
}

/* Tightened. The old rhythm topped out at 140px, which left the page feeling
   like separate documents stacked up rather than one argument. */
const padMap = {
  sm: "clamp(36px, 4vw, 52px)",
  md: "clamp(48px, 5vw, 72px)",
  lg: "clamp(64px, 6.5vw, 92px)",
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
  divided = false,
  pad = "lg",
  width = "default",
  id,
  className,
  style,
  innerStyle,
}: SectionProps) {
  return (
    <section
      id={id}
      className={className}
      style={{
        background,
        padding: `${padMap[pad]} 0`,
        // A soft inset edge rather than a 1px line: it reads as one surface
        // lifting off another, which is how sections separate on a white page
        // without borders drawing themselves to your attention.
        ...(divided
          ? { boxShadow: "inset 0 1px 0 rgba(10,10,11,0.06), 0 -1px 3px rgba(10,10,11,0.04)" }
          : {}),
        ...style,
      }}
    >
      <div
        className="mx-auto px-6"
        style={{ maxWidth: widthMap[width], width: "100%", ...innerStyle }}
      >
        {children}
      </div>
    </section>
  );
}
