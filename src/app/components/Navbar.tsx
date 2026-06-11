import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import loopitalLogo from "../../imports/loopital.com_logo.png";
import fms13Logo from "../../imports/fms13_logo.png";
import hms7Logo from "../../imports/hms7_logo.png";
import sart34Logo from "../../imports/sart34_logo.png";
import stack62Logo from "../../imports/stack62_logo.png";

const products = [
  { name: "STACK62", logo: stack62Logo, tagline: "AI Coworker Platform", desc: "Intelligent digital assistant for teams and individuals.", href: "http://stack62-web.onrender.com", accent: "#7C3AED", external: true },
  { name: "SART34", logo: sart34Logo, tagline: "Social Media Management", desc: "Publish, manage, and advertise across all social platforms.", href: "/products/sart34", accent: "#0891B2" },
  { name: "HMS7", logo: hms7Logo, tagline: "Hospital Management System", desc: "Unified platform for modern healthcare institutions.", href: "/products/hms7", accent: "#059669" },
  { name: "FMS13", logo: fms13Logo, tagline: "Vendor & Contractor Management", desc: "Enterprise-grade vendor and contractor oversight.", href: "/products/fms13", accent: "#D97706" },
];

const services = [
  { label: "Web Development", href: "/services#web" },
  { label: "Mobile Applications", href: "/services#mobile" },
  { label: "AI & Machine Learning", href: "/services#ai" },
  { label: "Enterprise Platforms", href: "/services#enterprise" },
  { label: "Digital Systems", href: "/services#digital" },
  { label: "Technology Consulting", href: "/services#consulting" },
];

const company = [
  { label: "About Loopital", href: "/about" },
  { label: "News & Insights", href: "/insights" },
  { label: "Careers", href: "/careers" },
  { label: "Contact Us", href: "/contact" },
];

export function Navbar() {
  const { user, setShowAuth } = useAuth();
  const location = useLocation();
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

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background: scrolled || mobileOpen ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(24px)",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(0,0,0,0.06)",
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
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
                  style={{ color: activeMenu === "products" ? "#4F46E5" : "#374151" }}
                >
                  Products <ChevronDown size={14} className={`transition-transform ${activeMenu === "products" ? "rotate-180" : ""}`} />
                </button>
                {activeMenu === "products" && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[620px]"
                    onMouseEnter={() => openMenu("products")}
                    onMouseLeave={closeMenu}
                  >
                    <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)" }}>
                      <div className="p-2 grid grid-cols-2 gap-1">
                        {products.map((p) => (
                          <a
                            key={p.name}
                            href={p.href}
                            target={p.external ? "_blank" : "_self"}
                            rel={p.external ? "noopener noreferrer" : undefined}
                            className="flex items-start gap-3 p-4 rounded-xl transition-colors hover:bg-gray-50 group"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-gray-50" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                              <ImageWithFallback src={p.logo} alt={p.name} className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold" style={{ color: "#0D0D1A" }}>{p.name}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${p.accent}12`, color: p.accent }}>{p.tagline}</span>
                              </div>
                              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>{p.desc}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA" }}>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>More products launching soon</span>
                        <Link to="/products" className="text-xs font-semibold transition-colors hover:text-[#3730A3]" style={{ color: "#4F46E5" }}>
                          View all products →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Services */}
              <div onMouseEnter={() => openMenu("services")} onMouseLeave={closeMenu} className="relative">
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
                  style={{ color: activeMenu === "services" ? "#4F46E5" : "#374151" }}
                >
                  Services <ChevronDown size={14} className={`transition-transform ${activeMenu === "services" ? "rotate-180" : ""}`} />
                </button>
                {activeMenu === "services" && (
                  <div
                    className="absolute top-full left-0 pt-2 w-64"
                    onMouseEnter={() => openMenu("services")}
                    onMouseLeave={closeMenu}
                  >
                    <div className="rounded-xl overflow-hidden bg-white p-2" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)" }}>
                      {services.map((s) => (
                        <Link
                          key={s.label}
                          to={s.href}
                          className="block px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-50"
                          style={{ color: "#374151" }}
                        >
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Company */}
              <div onMouseEnter={() => openMenu("company")} onMouseLeave={closeMenu} className="relative">
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
                  style={{ color: activeMenu === "company" ? "#4F46E5" : "#374151" }}
                >
                  Company <ChevronDown size={14} className={`transition-transform ${activeMenu === "company" ? "rotate-180" : ""}`} />
                </button>
                {activeMenu === "company" && (
                  <div
                    className="absolute top-full left-0 pt-2 w-52"
                    onMouseEnter={() => openMenu("company")}
                    onMouseLeave={closeMenu}
                  >
                    <div className="rounded-xl overflow-hidden bg-white p-2" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)" }}>
                      {company.map((c) => (
                        <Link
                          key={c.label}
                          to={c.href}
                          className="block px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-50"
                          style={{ color: "#374151" }}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Auth */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <button
                  onClick={() => setShowAuth("dashboard")}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-gray-50"
                  style={{ border: "1px solid rgba(0,0,0,0.09)" }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#4F46E5" }}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm" style={{ color: "#0D0D1A" }}>{user.name}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuth("signin")}
                    className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50"
                    style={{ color: "#374151" }}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setShowAuth("signup")}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: "#4F46E5", color: "#fff" }}
                  >
                    Get started
                  </button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: "#0D0D1A" }}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t px-6 py-4 flex flex-col gap-1" style={{ borderColor: "rgba(0,0,0,0.06)", maxHeight: "80vh", overflowY: "auto" }}>
            <p className="text-xs font-semibold px-3 py-2" style={{ color: "#9CA3AF", letterSpacing: "0.06em" }}>PRODUCTS</p>
            {products.map((p) => (
              <a key={p.name} href={p.href} target={p.external ? "_blank" : "_self"} rel={p.external ? "noopener noreferrer" : undefined} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <ImageWithFallback src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0D0D1A" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{p.tagline}</p>
                </div>
              </a>
            ))}
            <div className="h-px my-2" style={{ background: "rgba(0,0,0,0.06)" }} />
            <p className="text-xs font-semibold px-3 py-2" style={{ color: "#9CA3AF", letterSpacing: "0.06em" }}>SERVICES</p>
            {services.map((s) => (
              <Link key={s.label} to={s.href} className="block px-3 py-2.5 rounded-xl text-sm hover:bg-gray-50" style={{ color: "#374151" }}>{s.label}</Link>
            ))}
            <div className="h-px my-2" style={{ background: "rgba(0,0,0,0.06)" }} />
            {company.map((c) => (
              <Link key={c.label} to={c.href} className="block px-3 py-2.5 rounded-xl text-sm hover:bg-gray-50" style={{ color: "#374151" }}>{c.label}</Link>
            ))}
            <div className="flex flex-col gap-2 mt-4">
              {user ? (
                <button onClick={() => { setShowAuth("dashboard"); setMobileOpen(false); }} className="py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "#4F46E5" }}>My Account</button>
              ) : (
                <>
                  <button onClick={() => { setShowAuth("signin"); setMobileOpen(false); }} className="py-3 rounded-xl text-sm border" style={{ color: "#0D0D1A", borderColor: "rgba(0,0,0,0.1)" }}>Sign in</button>
                  <button onClick={() => { setShowAuth("signup"); setMobileOpen(false); }} className="py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "#4F46E5" }}>Get started</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
