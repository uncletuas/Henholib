import type { ReactNode, ElementType, CSSProperties } from "react";

interface GradientTextProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * Paints the signature blue→green brand gradient onto its text.
 * Reserve for hero accent words and key moments — the one brand accent.
 */
export function GradientText({ children, as: Tag = "span", className, style }: GradientTextProps) {
  return (
    <Tag className={`brand-gradient-text${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </Tag>
  );
}
