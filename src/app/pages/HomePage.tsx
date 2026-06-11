import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Zap, Globe, Layers, Smartphone, RefreshCw, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import fms13Logo from "../../imports/fms13_logo.png";
import hms7Logo from "../../imports/hms7_logo.png";
import sart34Logo from "../../imports/sart34_logo.png";
import stack62Logo from "../../imports/stack62_logo.png";

const heroImg = "https://images.unsplash.com/photo-1559136555-9303baea8ebd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGNvbXB1dGVyc3xlbnwxfHx8fDE3ODA5NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const aiImg = "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxBSSUyMGFydGlmaWNpYWwlMjBpbnRlbGxpZ2VuY2UlMjB0ZWNobm9sb2d5JTIwd29ya3NwYWNlJTIwcHJvZHVjdGl2aXR5fGVufDF8fHx8MTc4MDk3ODEyOXww&ixlib=rb-4.1.0&q=80&w=1080";
const webImg = "https://images.unsplash.com/photo-1547658719-da2b51169166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx3ZWIlMjBkZXZlbG9wbWVudCUyMG1vYmlsZSUyMGFwcCUyMGNvZGluZyUyMHNvZnR3YXJlJTIwYnVpbGR8ZW58MXx8fHwxNzgwOTc4MTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080";

const products = [
  { name: "STACK62", logo: stack62Logo, category: "AI Coworker Platform", desc: "An intelligent digital coworker that handles research, content, automation, and decision support — so your team can focus on higher-value work.", href: "http://stack62-web.onrender.com", accent: "#7C3AED", accentBg: "#F5F3FF", external: true },
  { name: "SART34", logo: sart34Logo, category: "Social Media Management", desc: "Publish across every platform, run AI-powered ad campaigns, and manage all your social activity from one unified workspace.", href: "/products/sart34", accent: "#0891B2", accentBg: "#ECFEFF", external: false },
  { name: "HMS7", logo: hms7Logo, category: "Hospital Management System", desc: "A unified platform for hospitals and clinics to manage patients, staff, billing, and operations at enterprise scale.", href: "/products/hms7", accent: "#059669", accentBg: "#ECFDF5", external: false },
  { name: "FMS13", logo: fms13Logo, category: "Vendor & Contractor Management", desc: "Complete oversight of vendors, contractors, and compliance across all your offices, sites, and operational locations.", href: "/products/fms13", accent: "#D97706", accentBg: "#FFFBEB", external: false },
];

const capabilities = [
  { icon: Zap, title: "Software Products", desc: "Purpose-built applications solving real operational problems for businesses and institutions." },
  { icon: Layers, title: "Artificial Intelligence", desc: "AI-powered features and standalone solutions that augment human capability across workflows." },
  { icon: Globe, title: "Enterprise Platforms", desc: "Large-scale digital infrastructure built for reliability, compliance, and organizational control." },
  { icon: Smartphone, title: "Web & Mobile Apps", desc: "Modern applications built for clients across diverse industries worldwide." },
  { icon: RefreshCw, title: "Digital Systems", desc: "End-to-end digital transformation for organizations modernizing their operations." },
  { icon: MessageSquare, title: "Technology Consulting", desc: "Strategic guidance for businesses planning, building, or scaling their technology." },
];

export function HomePage() {
  const { setShowAuth } = useAuth();

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden" style={{ background: "#FFFFFF" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 50%, #EEF2FF 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-6 w-full py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col gap-8">
              <h1 style={{ fontSize: "clamp(2.4rem,5vw,4.2rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#0D0D1A" }}>
                Helping Organizations Operate More Efficiently in the Era of{" "}
                <span style={{ color: "#4F46E5" }}>AI</span>
              </h1>
              <p style={{ color: "#6B7280", fontSize: "1.1rem", lineHeight: 1.8, maxWidth: "480px" }}>
                Loopital builds software products, AI solutions, and enterprise platforms that help businesses and institutions operate at a higher level.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 group" style={{ background: "#4F46E5", color: "#fff", fontSize: "15px" }}>
                  See our products
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/contact" className="inline-flex items-center px-7 py-3.5 rounded-xl font-medium transition-all hover:bg-gray-50" style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#374151", fontSize: "15px" }}>
                  Get in touch
                </Link>
              </div>
              <div className="flex items-center gap-10 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                {[{ v: "4+", l: "Software products" }, { v: "12k+", l: "Active users" }, { v: "Global", l: "Reach" }].map(s => (
                  <div key={s.l}>
                    <p style={{ fontWeight: 800, fontSize: "24px", color: "#0D0D1A", letterSpacing: "-0.02em" }}>{s.v}</p>
                    <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "2px" }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="relative hidden lg:block">
              <div className="rounded-3xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 40px 80px rgba(79,70,229,0.12), 0 0 0 1px rgba(0,0,0,0.05)" }}>
                <ImageWithFallback src={heroImg} alt="Loopital team at work" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-6 -right-6 w-40 h-40 pointer-events-none" style={{ backgroundImage: "radial-gradient(#C7D2FE 1.5px,transparent 1.5px)", backgroundSize: "20px 20px" }} />
              <div className="absolute -bottom-5 -left-5 w-28 h-28 rounded-3xl pointer-events-none" style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── OUR PRODUCTS ── */}
      <section style={{ padding: "96px 0", background: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <div>
              <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "10px" }}>OUR PRODUCTS</p>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                Flagship software platforms.
              </h2>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[#3730A3] flex-shrink-0" style={{ color: "#4F46E5" }}>
              View all products <ArrowRight size={14} />
            </Link>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {products.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <a
                  href={p.href}
                  target={p.external ? "_blank" : "_self"}
                  rel={p.external ? "noopener noreferrer" : undefined}
                  className="flex flex-col gap-5 p-8 rounded-2xl h-full transition-all duration-200 hover:-translate-y-1 group"
                  style={{ background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.07)", display: "flex", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${p.accent}35`; e.currentTarget.style.boxShadow = `0 20px 56px ${p.accent}12`; e.currentTarget.style.background = "#FFFFFF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#FAFAFA"; }}
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: p.accentBg, border: `1px solid ${p.accent}20`, width: "52px", height: "52px" }}>
                      <ImageWithFallback src={p.logo} alt={p.name} className="w-9 h-9 object-contain" />
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-[#4F46E5] group-hover:text-white" style={{ background: "rgba(0,0,0,0.04)", color: "#9CA3AF" }}>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontWeight: 700, fontSize: "20px", color: "#0D0D1A", letterSpacing: "-0.01em" }}>{p.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: p.accentBg, color: p.accent }}>{p.category}</span>
                    </div>
                    <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                  <div className="mt-auto pt-1">
                    <span className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: p.accent }}>Learn more <ArrowRight size={13} /></span>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FEATURE HIGHLIGHT ── */}
      <section style={{ background: "#0A0A14", padding: "100px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="rounded-2xl overflow-hidden relative" style={{ aspectRatio: "4/3", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
                <ImageWithFallback src={aiImg} alt="AI technology" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, transparent 60%)" }} />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex flex-col gap-6">
              <div className="inline-flex self-start px-3.5 py-1.5 rounded-full" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)" }}>
                <span style={{ color: "#C4B5FD", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em" }}>AI COWORKER PLATFORM</span>
              </div>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#F9FAFB", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
                AI built in from day one — not bolted on later.
              </h2>
              <p style={{ color: "#9CA3AF", fontSize: "16px", lineHeight: 1.85 }}>
                STACK62 puts an intelligent digital coworker alongside your entire team — handling research, content, automation, and decision support so people can focus on higher-value work.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {["Research & Synthesis", "Content Generation", "Workflow Automation", "Decision Support"].map(f => (
                  <div key={f} className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#A78BFA" }} />
                    <span style={{ color: "#D1D5DB", fontSize: "13px" }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="http://stack62-web.onrender.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 self-start px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 mt-2" style={{ background: "#7C3AED", color: "#fff" }}>
                Try STACK62 <ArrowRight size={14} />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section style={{ background: "#F7F7FB", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "10px" }}>WHAT WE DO</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", maxWidth: "560px", lineHeight: 1.15 }}>
              Purpose-built software for organizations that can't afford to stand still.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex flex-col gap-4 p-7 rounded-2xl bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                  <c.icon size={18} style={{ color: "#4F46E5" }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0D0D1A", marginBottom: "6px" }}>{c.title}</h3>
                  <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.7 }}>{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES STRIP ── */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
              <div>
                <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "10px" }}>SERVICES</p>
                <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "16px" }}>
                  We build technology for other businesses too.
                </h2>
                <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.85 }}>
                  Beyond our own products, Loopital partners with companies to design and deliver websites, mobile apps, enterprise platforms, and custom digital systems — applying the same engineering standards we hold ourselves to.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                {["Web Development", "Mobile Apps", "AI Solutions", "Enterprise Systems", "Digital Transformation", "Tech Consulting"].map(s => (
                  <div key={s} className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4F46E5" }} />
                    <span style={{ color: "#374151", fontSize: "14px" }}>{s}</span>
                  </div>
                ))}
              </div>
              <Link to="/services" className="inline-flex items-center gap-2 self-start text-sm font-semibold transition-colors hover:text-[#3730A3] mt-1" style={{ color: "#4F46E5" }}>
                See all services <ArrowRight size={14} />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.08)" }}>
                <ImageWithFallback src={webImg} alt="Web and app development" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 50%, #6D28D9 100%)", padding: "88px 0" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-6">
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              See what Loopital can do for your organization.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "17px", maxWidth: "500px", lineHeight: 1.75 }}>
              Explore our product line or talk to us about building something specific for your team.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-1">
              <Link to="/products" className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-95 hover:-translate-y-0.5" style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                Explore products
              </Link>
              <Link to="/contact" className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/15" style={{ border: "1px solid rgba(255,255,255,0.35)", color: "#fff" }}>
                Talk to us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
