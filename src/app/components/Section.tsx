import type { ReactNode, CSSProperties } from "react";

interface SectionProps {
  children: ReactNode;
  /** Background fill. Defaults to the page canvas. */
  background?: string;
  /** Hairline above the section. Sections separate by rule and space now that
   *  the tinted backgrounds are gone. */
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

const padMap = {
  sm: "clamp(52px, 6vw, 80px)",
  md: "clamp(72px, 8vw, 108px)",
  lg: "clamp(96px, 10vw, 140px)",
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
        ...(divided ? { borderTop: "1px solid rgba(10,10,11,0.08)" } : {}),
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
