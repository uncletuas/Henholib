import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { colors, gradientBrand } from "../lib/brand";
import loopitalMark from "../../imports/loopital-mark.png";

// The Loopital app lives at the site root, served by the app itself rather than
// this site, so links to it are plain anchors (a full page load), never router links.
const APP_HOME = "/";
const APP_SIGN_IN = "/portal/login";

const links = [
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contribute", href: "/contribute" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: "#FFFFFF",
        borderBottom: `1px solid ${colors.hairline}`,
        boxShadow: scrolled ? "0 1px 3px rgba(10,10,11,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-[72px]">
          <a href={APP_HOME} className="flex items-center flex-shrink-0">
            <span className="flex items-center gap-2">
              <ImageWithFallback src={loopitalMark} alt="" className="h-8 w-8 object-contain" />
              <span style={{ fontSize: "20px", fontWeight: 700, color: colors.heading, letterSpacing: "-0.02em" }}>Loopital</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="px-4 py-2 text-[13px] font-medium uppercase tracking-[0.06em] transition-colors"
                style={{ color: location.pathname === l.href ? colors.heading : colors.textSecondary }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2.5">
            <a href={APP_SIGN_IN} className="px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.05em] transition-colors hover:bg-[#F7F7F8]" style={{ color: colors.heading, border: `1px solid ${colors.hairline}` }}>Sign in</a>
            <a href={APP_HOME} className="inline-flex items-center gap-1.5 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-white transition-opacity hover:opacity-90" style={{ background: gradientBrand }}>Open Loopital <ArrowRight size={15} /></a>
          </div>

          <button className="lg:hidden p-2" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)} style={{ color: colors.heading }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden px-6 py-4 flex flex-col gap-1" style={{ background: colors.bg, borderTop: `1px solid ${colors.hairline}`, maxHeight: "82vh", overflowY: "auto" }}>
          {links.map((l) => (
            <Link key={l.href} to={l.href} className="block px-3 py-2.5 text-sm hover:bg-[#F5F5F7]" style={{ color: colors.textSecondary }}>{l.label}</Link>
          ))}
          <div className="h-px my-2" style={{ background: colors.hairline }} />
          <a href={APP_HOME} className="py-3 text-sm font-semibold text-white text-center inline-flex items-center justify-center gap-1.5" style={{ background: gradientBrand }}>Open Loopital <ArrowRight size={15} /></a>
          <a href={APP_SIGN_IN} className="py-3 text-sm font-semibold text-center" style={{ color: colors.heading, border: `1px solid ${colors.hairline}` }}>Sign in</a>
        </div>
      )}
    </nav>
  );
}
