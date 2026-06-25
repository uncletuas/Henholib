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
  sm: { padding: "10px 18px", fontSize: "14px" },
  md: { padding: "13px 26px", fontSize: "15px" },
  lg: { padding: "16px 32px", fontSize: "16px" },
};

function variantStyle(variant: Variant): CSSProperties {
  switch (variant) {
    case "gradient":
      return { background: gradientBrand, color: "#fff", border: "1px solid transparent" };
    case "solid":
      return { background: colors.heading, color: "#fff", border: "1px solid transparent" };
    case "outline":
      return { background: "transparent", color: colors.heading, border: `1px solid rgba(0,0,0,0.14)` };
    case "ghost-light":
      return { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)" };
  }
}

/** Pill-shaped primary action used across the marketing surface. */
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
    borderRadius: "999px",
    fontWeight: 600,
    ...style,
  };
  const cls = `inline-flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 ${className ?? ""}`;

  if (to) return <Link to={to} className={cls} style={css} onClick={onClick}>{children}</Link>;
  if (href) return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls} style={css} onClick={onClick}>{children}</a>;
  return <button onClick={onClick} className={cls} style={css}>{children}</button>;
}
