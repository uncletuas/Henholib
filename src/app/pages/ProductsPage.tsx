import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import fms13Logo from "../../imports/fms13_logo.png";
import hms7Logo from "../../imports/hms7_logo.png";
import sart34Logo from "../../imports/sart34_logo.png";
import stack62Logo from "../../imports/stack62_logo.png";

const products = [
  {
    name: "STACK62",
    logo: stack62Logo,
    category: "AI Coworker Platform",
    tagline: "Your team's most intelligent member.",
    desc: "STACK62 is an AI coworker platform that handles research, knowledge management, content creation, workflow automation, and intelligent decision support — helping individuals and teams work at a fundamentally higher level.",
    href: "http://stack62-web.onrender.com",
    external: true,
    accent: "#7C3AED",
    accentBg: "#F5F3FF",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxBSSUyMGFydGlmaWNpYWwlMjBpbnRlbGxpZ2VuY2UlMjB0ZWNobm9sb2d5JTIwd29ya3NwYWNlJTIwcHJvZHVjdGl2aXR5fGVufDF8fHx8MTc4MDk3ODEyOXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    name: "SART34",
    logo: sart34Logo,
    category: "Social Media Management",
    tagline: "Publish everywhere. Manage everything from one place.",
    desc: "SART34 connects all your social media accounts and pages into a single dashboard. Create content once and distribute it across platforms, run AI-powered ad campaigns, and manage engagement — without switching tools.",
    href: "/products/sart34",
    accent: "#0891B2",
    accentBg: "#ECFEFF",
    image: "https://images.unsplash.com/photo-1683721003111-070bcc053d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NpYWwlMjBtZWRpYSUyMG1hcmtldGluZyUyMGRpZ2l0YWwlMjBhZHZlcnRpc2luZyUyMGNhbXBhaWdufGVufDF8fHx8MTc4MDk3ODEzMHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    name: "HMS7",
    logo: hms7Logo,
    category: "Hospital Management System",
    tagline: "Built for the complexity of modern healthcare.",
    desc: "HMS7 gives hospitals, clinics, and health networks a single platform for patient records, appointments, billing, staff management, and compliance — reducing administrative burden and improving care delivery.",
    href: "/products/hms7",
    accent: "#059669",
    accentBg: "#ECFDF5",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxoZWFsdGhjYXJlJTIwaG9zcGl0YWwlMjBtZWRpY2FsJTIwc29mdHdhcmV8ZW58MXx8fHwxNzgwOTU3ODc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    name: "FMS13",
    logo: fms13Logo,
    category: "Vendor & Contractor Management",
    tagline: "Control your contractor ecosystem at enterprise scale.",
    desc: "FMS13 centralizes vendor registration, contractor oversight, compliance tracking, documentation, and performance monitoring across all your locations — giving large organizations the visibility and control they need.",
    href: "/products/fms13",
    accent: "#D97706",
    accentBg: "#FFFBEB",
    image: "https://images.unsplash.com/photo-1659353590864-c3314d25a261?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZW5kb3IlMjBjb250cmFjdG9yJTIwZW50ZXJwcmlzZSUyMG1hbmFnZW1lbnQlMjJidXNpbmVzc3xlbnwxfHx8fDE3ODA5NzgxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export function ProductsPage() {
  return (
    <div>
      {/* Header */}
      <section style={{ background: "#F7F7FB", padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>PRODUCTS</p>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "700px", marginBottom: "20px" }}>
              Software built to solve real problems.
            </h1>
            <p style={{ color: "#6B7280", fontSize: "18px", lineHeight: 1.75, maxWidth: "580px" }}>
              Each Loopital product is a focused, enterprise-grade solution for a specific operational challenge. More products are in development as we continue to expand our product portfolio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product list */}
      <section style={{ padding: "80px 0", background: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-24">
          {products.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-14 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div className={`relative ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "3/2", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}>
                  <span className="text-xs font-semibold" style={{ color: p.accent }}>{p.category}</span>
                </div>
              </div>

              <div className={`flex flex-col gap-6 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: p.accentBg, border: `1px solid ${p.accent}20` }}>
                    <ImageWithFallback src={p.logo} alt={p.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: "22px", color: "#0D0D1A", letterSpacing: "-0.01em" }}>{p.name}</p>
                    <p style={{ fontSize: "13px", color: p.accent, fontWeight: 500 }}>{p.category}</p>
                  </div>
                </div>
                <h2 style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 700, color: "#0D0D1A", letterSpacing: "-0.02em", lineHeight: 1.25 }}>{p.tagline}</h2>
                <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>{p.desc}</p>
                <a
                  href={p.href}
                  target={p.external ? "_blank" : "_self"}
                  rel={p.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 self-start px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: p.accent, color: "#fff" }}
                >
                  Learn more about {p.name} <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Upcoming */}
      <section style={{ background: "#F7F7FB", padding: "80px 0" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-5">
            <div className="inline-flex px-4 py-1.5 rounded-full" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <span style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 500 }}>More coming soon</span>
            </div>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em" }}>
              Our product portfolio is growing.
            </h2>
            <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8, maxWidth: "480px" }}>
              Loopital continuously develops new software products. Follow our News & Insights section to be among the first to learn about upcoming launches.
            </p>
            <Link to="/insights" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#4F46E5" }}>
              Follow our news <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
