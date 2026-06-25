import { Link } from "react-router";
import loopitalLogo from "../../imports/loopital.com_logo.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { products } from "../config/products";

const productLinks = products.map((p) => ({ label: `${p.name} — ${p.category}`, href: p.detailHref, external: p.external }));

const columns = [
  {
    title: "Products",
    links: [...productLinks, { label: "All Products", href: "/products" }],
  },
  {
    title: "Services",
    links: [
      { label: "Web Development", href: "/services#web" },
      { label: "Mobile Applications", href: "/services#mobile" },
      { label: "AI Solutions", href: "/services#ai" },
      { label: "Enterprise Platforms", href: "/services#enterprise" },
      { label: "Digital Systems", href: "/services#digital" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Loopital", href: "/about" },
      { label: "News & Insights", href: "/insights" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "License Agreement", href: "/terms#license" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "#06080F", color: "#F9FAFB" }}>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-10">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-20">
          <div className="md:col-span-1">
            <ImageWithFallback src={loopitalLogo} alt="Loopital" className="h-7 w-auto object-contain mb-5" style={{ filter: "brightness(0) invert(1)" }} />
            <p style={{ color: "#8A8A93", fontSize: "14px", lineHeight: 1.8 }}>
              Building the connected digital infrastructure powering the next generation of work, communication, healthcare, and enterprise.
            </p>
            <p className="mt-5" style={{ color: "#5A5A63", fontSize: "13px" }}>Port Harcourt, Nigeria</p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <p style={{ color: "#F9FAFB", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "18px" }}>{c.title.toUpperCase()}</p>
              <ul className="flex flex-col gap-3.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l && l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white" style={{ color: "#8A8A93", fontSize: "14px" }}>{l.label}</a>
                    ) : (
                      <Link to={l.href} className="transition-colors hover:text-white" style={{ color: "#8A8A93", fontSize: "14px" }}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "#5A5A63", fontSize: "13px" }}>
            © {new Date().getFullYear()} Loopital Limited. All rights reserved. Registered in Nigeria.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981" }} />
            <span style={{ color: "#5A5A63", fontSize: "13px" }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
