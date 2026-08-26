import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { launchProductApp, type AccountProductId } from "../lib/api";
import type { Product } from "../config/products";
import { gradientBrand } from "../lib/brand";
import type { CSSProperties, ReactNode } from "react";

interface LaunchAppButtonProps {
  product: Product;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Override the fill (defaults to the product accent). */
  background?: string;
  className?: string;
  style?: CSSProperties;
}

const sizeMap = {
  sm: { padding: "10px 18px", fontSize: "14px" },
  md: { padding: "13px 26px", fontSize: "15px" },
  lg: { padding: "16px 32px", fontSize: "16px" },
};

/**
 * "Launch Pal" button. When the user is signed into loopital, it
 * performs the SSO handoff so they arrive at the app already authenticated;
 * otherwise it opens the app normally. Only for account-linked products.
 */
export function LaunchAppButton({ product, children, size = "md", background, className, style }: LaunchAppButtonProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (!product.appHref) return;
    setLoading(true);
    try {
      await launchProductApp(product.appHref, product.id as AccountProductId, token);
    } finally {
      setLoading(false);
    }
  };

  const css: CSSProperties = {
    ...sizeMap[size],
    background: background ?? gradientBrand,
    color: "#fff",
    borderRadius: "999px",
    fontWeight: 600,
    ...style,
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-70 ${className ?? ""}`}
      style={css}
    >
      {children ?? `Launch ${product.name}`}
      {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
    </button>
  );
}
