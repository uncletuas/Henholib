import type { ReactNode, CSSProperties } from "react";
import { Link } from "react-router";
import type { Product } from "../config/products";

interface ProductLinkProps {
  product: Product;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/**
 * Links to a product's "learn more" destination, rendering an external anchor
 * for products whose landing page lives on a subdomain (Pal, Swift) and an
 * in-site route for the rest (HMS7, Modus).
 */
export function ProductLink({ product, children, className, style, onClick }: ProductLinkProps) {
  if (product.external) {
    return (
      <a href={product.detailHref} target="_blank" rel="noopener noreferrer" className={className} style={style} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={product.detailHref} className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}
