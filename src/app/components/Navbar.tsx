import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProductLink } from "./ProductLink";
import { AccountMenu } from "./AccountMenu";
import { products } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";
import { useAuth } from "../context/AuthContext";
import { openPalWorkspace } from "../lib/pal";
import loopitalLogo from "../../imports/loopital-logo.svg";

const company = [
  { label: "About Loopital", href: "/about" },
  { label: "News & Insights", href: "/insights" },
  { label: "Contact Us", href: "/contact" },
];

export function Navbar() {
  const location = useLocation();
  const { user, token, setShowAuth, signOut, setShowPalOnboarding, setPendingPal } = useAuth();
  const tryPal = () => openPalWorkspace({ user, token, setShowAuth, setShowPalOnboarding, setPendingPal });
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setMobileOpen(false); setActiveMenu(null); }, [location]);

  const openMenu = (name: string) => {
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    setActiveMenu(name);
  };
  const closeMenu = () => {
    menuTimeout.current = setTimeout(() => setActiveMenu(null), 120);
  };

  const linkColor = (name: string) => (activeMenu === name ? colors.heading : colors.textSecondary);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled || mobileOpen || activeMenu ? "rgba(10,11,15,0.86)" : "rgba(10,11,15,0.55)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: scrolled ? `1px solid ${colors.hairline}` : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <ImageWithFallback src={loopitalLogo} alt="Loopital" className="h-7 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Products */}
            <div onMouseEnter={() => openMenu("products")} onMouseLeave={closeMenu} className="relative">
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors" style={{ color: linkColor("products") }}>
                Products <ChevronDown size={14} className={`transition-transform ${activeMenu === "products" ? "rotate-180" : ""}`} />
              </button>
              {activeMenu === "products" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[660px]" onMouseEnter={() => openMenu("products")} onMouseLeave={closeMenu}>
                  <div className="rounded-3xl overflow-hidden" style={{ background: colors.surface, boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)" }}>
                    <div className="p-3 grid grid-cols-2 gap-1">
                      {products.map((p) => (
                        <ProductLink key={p.id} product={p} className="flex items-start gap-3.5 p-4 rounded-2xl transition-colors hover:bg-[#F5F5F7] group">
                          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: colors.surfaceMuted, border: `1px solid ${colors.hairline}` }}>
                            <ImageWithFallback src={p.logo} alt={p.name} className="w-8 h-8 object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: colors.heading }}>{p.name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: `${p.accent}14`, color: p.accent }}>{p.category}</span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: colors.textSecondary }}>{p.theme}</p>
                          </div>
                        </ProductLink>
                      ))}
                    </div>
                    <div className="px-5 py-3.5 flex items-center justify-end" style={{ borderTop: `1px solid ${colors.hairline}`, background: colors.surfaceMuted }}>
                      <Link to="/products" className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: colors.blue }}>
                        View all products <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Company */}
            <div onMouseEnter={() => openMenu("company")} onMouseLeave={closeMenu} className="relative">
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors" style={{ color: linkColor("company") }}>
                Company <ChevronDown size={14} className={`transition-transform ${activeMenu === "company" ? "rotate-180" : ""}`} />
              </button>
              {activeMenu === "company" && (
                <div className="absolute top-full left-0 pt-3 w-52" onMouseEnter={() => openMenu("company")} onMouseLeave={closeMenu}>
                  <div className="rounded-2xl overflow-hidden p-2" style={{ background: colors.surface, boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)" }}>
                    {company.map((c) => (
                      <Link key={c.label} to={c.href} className="block px-4 py-2.5 rounded-xl text-sm transition-colors hover:bg-[#F5F5F7]" style={{ color: colors.textSecondary }}>{c.label}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            <button onClick={tryPal} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95" style={{ background: gradientBrand }}>{user ? "Pal Workspace" : "Try Pal Workspace"} <ArrowRight size={15} /></button>
            {user ? (
              <AccountMenu />
            ) : (
              <button onClick={() => setShowAuth("signin")} className="px-4 py-2.5 rounded-full text-sm font-semibold transition-colors hover:bg-[#F5F5F7]" style={{ color: colors.heading, border: `1px solid ${colors.hairline}` }}>Sign in</button>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: colors.heading }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden px-6 py-4 flex flex-col gap-1" style={{ background: colors.bg, borderTop: `1px solid ${colors.hairline}`, maxHeight: "82vh", overflowY: "auto" }}>
          <p className="text-xs font-semibold px-3 py-2" style={{ color: colors.textTertiary, letterSpacing: "0.06em" }}>PRODUCTS</p>
          {products.map((p) => (
            <ProductLink key={p.id} product={p} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F5F7]">
              <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: colors.surfaceMuted, border: `1px solid ${colors.hairline}` }}>
                <ImageWithFallback src={p.logo} alt={p.name} className="w-7 h-7 object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: colors.heading }}>{p.name}</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{p.category}</p>
              </div>
            </ProductLink>
          ))}
          <div className="h-px my-2" style={{ background: colors.hairline }} />
          {company.map((c) => (
            <Link key={c.label} to={c.href} className="block px-3 py-2.5 rounded-xl text-sm hover:bg-[#F5F5F7]" style={{ color: colors.textSecondary }}>{c.label}</Link>
          ))}
          <div className="h-px my-2" style={{ background: colors.hairline }} />
          <div className="flex flex-col gap-2 mt-2">
            <button onClick={() => { setMobileOpen(false); tryPal(); }} className="py-3 rounded-full text-sm font-semibold text-white text-center inline-flex items-center justify-center gap-1.5" style={{ background: gradientBrand }}>{user ? "Pal Workspace" : "Try Pal Workspace"} <ArrowRight size={15} /></button>
            {user ? (
              <>
                <button onClick={() => { setShowAuth("dashboard"); setMobileOpen(false); }} className="text-left px-3 py-2.5 rounded-xl text-sm hover:bg-[#F5F5F7]" style={{ color: colors.textSecondary }}>Manage account</button>
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-left px-3 py-2.5 rounded-xl text-sm hover:bg-[#F5F5F7]" style={{ color: colors.textSecondary }}>Sign out</button>
              </>
            ) : (
              <button onClick={() => { setShowAuth("signin"); setMobileOpen(false); }} className="py-3 rounded-full text-sm font-semibold text-white text-center" style={{ background: gradientBrand }}>Sign in</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
