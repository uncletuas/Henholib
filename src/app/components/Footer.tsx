import { Link } from "react-router";
import loopitalLogo from "../../imports/loopital.com_logo.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const col = (title: string, links: { label: string; href: string; external?: boolean }[]) => ({ title, links });

const columns = [
  col("Products", [
    { label: "STACK62 — AI Coworker", href: "http://stack62-web.onrender.com", external: true },
    { label: "SART34 — Social Media", href: "/products/sart34" },
    { label: "HMS7 — Healthcare", href: "/products/hms7" },
    { label: "FMS13 — Vendor Management", href: "/products/fms13" },
    { label: "All Products", href: "/products" },
  ]),
  col("Services", [
    { label: "Web Development", href: "/services#web" },
    { label: "Mobile Applications", href: "/services#mobile" },
    { label: "AI Solutions", href: "/services#ai" },
    { label: "Enterprise Platforms", href: "/services#enterprise" },
    { label: "Digital Systems", href: "/services#digital" },
  ]),
  col("Company", [
    { label: "About Loopital", href: "/about" },
    { label: "News & Insights", href: "/insights" },
    { label: "Careers", href: "/careers" },
    { label: "Contact Us", href: "/contact" },
  ]),
  col("Legal", [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "License Agreement", href: "/terms#license" },
  ]),
];

export function Footer() {
  return (
    <footer style={{ background: "#0A0A14", color: "#F9FAFB" }}>
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="md:col-span-1">
            <ImageWithFallback src={loopitalLogo} alt="Loopital" className="h-7 w-auto object-contain mb-4" style={{ filter: "brightness(0) invert(1)" }} />
            <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.75 }}>
              A global technology company building software products, AI solutions, and digital systems for organizations worldwide.
            </p>
            <p className="mt-4" style={{ color: "#4B5563", fontSize: "13px" }}>
              Port Harcourt, Nigeria
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p style={{ color: "#F9FAFB", fontSize: "12px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "16px" }}>
                {col.title.toUpperCase()}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white" style={{ color: "#6B7280", fontSize: "14px" }}>
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.href} className="transition-colors hover:text-white" style={{ color: "#6B7280", fontSize: "14px" }}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ color: "#4B5563", fontSize: "13px" }}>
            © {new Date().getFullYear()} Loopital Limited. All rights reserved. Registered in Nigeria.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span style={{ color: "#4B5563", fontSize: "13px" }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
