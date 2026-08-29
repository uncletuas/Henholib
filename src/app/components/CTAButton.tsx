import type { ReactNode, CSSProperties } from "react";
import { Link } from "react-router";
import { gradientBrand, colors } from "../lib/brand";

type Variant = "gradient" | "solid" | "outline" | "ghost-light";

interface CTAButtonProps {
  children: ReactNode;
  /** Internal route -> react-router Link. External/app URL -> anchor. */
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  external?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
}

const sizeMap = {
  sm: { padding: "9px 16px", fontSize: "14px" },
  md: { padding: "12px 22px", fontSize: "15px" },
  lg: { padding: "15px 28px", fontSize: "16px" },
};

function variantStyle(variant: Variant): CSSProperties {
  switch (variant) {
    // "gradient" is the primary action and is now a solid ink fill. The name
    // stays because a dozen call sites use it.
    case "gradient":
      return { background: gradientBrand, color: "#fff", border: "1px solid transparent" };
    case "solid":
      return { background: colors.heading, color: "#fff", border: "1px solid transparent" };
    case "outline":
      return { background: "#fff", color: colors.heading, border: `1px solid ${colors.hairlineStrong}` };
    case "ghost-light":
      return { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)" };
  }
}

/**
 * The action used across the marketing surface.
 *
 * Squared off rather than pill-shaped: a 999px radius on every button is
 * friendly to the point of being generic, and an 8px radius reads as software.
 * The hover is a colour shift, not a lift, because half the page rising a
 * pixel on mouseover is motion for its own sake.
 */
export function CTAButton({
  children,
  to,
  href,
  onClick,
  variant = "gradient",
  external = false,
  size = "md",
  className,
  style,
}: CTAButtonProps) {
  const css: CSSProperties = {
    ...sizeMap[size],
    ...variantStyle(variant),
    borderRadius: "8px",
    fontWeight: 600,
    letterSpacing: "-0.005em",
    ...style,
  };
  const cls = `inline-flex items-center justify-center gap-2 transition-colors duration-200 hover:opacity-90 ${className ?? ""}`;

  if (to) return <Link to={to} className={cls} style={css} onClick={onClick}>{children}</Link>;
  if (href) return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls} style={css} onClick={onClick}>{children}</a>;
  return <button onClick={onClick} className={cls} style={css}>{children}</button>;
}
