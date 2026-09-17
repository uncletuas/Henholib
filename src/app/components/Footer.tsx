import { Link } from "react-router";
import loopitalMark from "../../imports/loopital-mark.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type FooterLink = { label: string; href: string; app?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Loopital",
    links: [
      { label: "Open the app", href: "/", app: true },
      { label: "Sign in", href: "/portal/login", app: true },
      { label: "Contribute", href: "/contribute" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Loopital", href: "/about" },
      { label: "News & Insights", href: "/insights" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "#06080F", color: "#F9FAFB" }}>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div>
            <span className="flex items-center gap-2 mb-5">
              <ImageWithFallback src={loopitalMark} alt="" className="h-8 w-8 object-contain" />
              <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>Loopital</span>
            </span>
            <p style={{ color: "#8A8A93", fontSize: "14px", lineHeight: 1.8 }}>
              One health record for every Nigerian: find care, book doctors, pay for treatment and carry your health history everywhere.
            </p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <p style={{ color: "#F9FAFB", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "18px" }}>{c.title.toUpperCase()}</p>
              <ul className="flex flex-col gap-3.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.app ? (
                      <a href={l.href} className="transition-colors hover:text-white" style={{ color: "#8A8A93", fontSize: "14px" }}>{l.label}</a>
                    ) : (
                      <Link to={l.href} className="transition-colors hover:text-white" style={{ color: "#8A8A93", fontSize: "14px" }}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "#5A5A63", fontSize: "13px" }}>
            © {new Date().getFullYear()} Loopital Limited. All rights reserved. Registered in Nigeria.
          </p>
        </div>
      </div>
    </footer>
  );
}
