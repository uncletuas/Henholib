import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import fms13Logo from "../../../imports/fms13_logo.png";

const heroImg = "https://images.unsplash.com/photo-1659353590852-7c986eb6fd26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx2ZW5kb3IlMjBjb250cmFjdG9yJTIwZW50ZXJwcmlzZSUyMG1hbmFnZW1lbnQlMjJidXNpbmVzc3xlbnwxfHx8fDE3ODA5NzgxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const buildingImg = "https://images.unsplash.com/photo-1531972111231-7482a960e109?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBvZmZpY2UlMjBmYWNpbGl0eSUyMG1hbmFnZW1lbnQlMjJidWlsZGluZ3xlbnwxfHx8fDE3ODA5NTc4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  { title: "Vendor Registration & Onboarding", desc: "Digitize the entire vendor onboarding process — registration, document submission, vetting, and approval — with full visibility and audit trails." },
  { title: "Contractor Management", desc: "Track contractors across all projects and locations. Manage contracts, assign work, monitor performance, and document every interaction." },
  { title: "Compliance & Documentation", desc: "Ensure every vendor and contractor meets your compliance requirements. Automate document expiry alerts and certification renewals." },
  { title: "Multi-Site Operations", desc: "Manage vendors and contractors across unlimited offices, branches, projects, and geographic locations from a single platform." },
  { title: "Approval Workflows", desc: "Configure multi-level approval chains for vendor registration, contract issuance, purchase orders, and compliance exceptions." },
  { title: "Performance Monitoring", desc: "Score and monitor contractor performance over time. Identify top performers, flag underperformers, and make data-driven contract decisions." },
];

const sectors = ["Corporations", "Government Institutions", "Oil & Gas Companies", "Construction Firms", "Utilities & Infrastructure", "Manufacturing", "Property Management", "Logistics & Facilities"];

export function Fms13Page() {

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "#FFFBEB", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col gap-7">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-white" style={{ border: "1px solid rgba(217,119,6,0.2)" }}>
                  <ImageWithFallback src={fms13Logo} alt="FMS13" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "20px", color: "#0D0D1A" }}>FMS13</p>
                  <p style={{ fontSize: "13px", color: "#D97706", fontWeight: 500 }}>Vendor & Contractor Management</p>
                </div>
              </div>
              <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Control your contractor
                <br />
                <span style={{ color: "#D97706" }}>ecosystem at scale.</span>
              </h1>
              <p style={{ color: "#374151", fontSize: "17px", lineHeight: 1.8, maxWidth: "480px" }}>
                FMS13 is an enterprise vendor and contractor management platform designed for large organizations, corporations, and government institutions that oversee complex contractor ecosystems across multiple sites, branches, and projects.
              </p>
              <div className="flex gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#D97706", color: "#fff" }}>
                  Request a demo <ArrowRight size={14} />
                </Link>
                <Link to="/contact" className="inline-flex items-center px-7 py-3.5 rounded-xl font-medium text-sm hover:bg-amber-50" style={{ border: "1px solid rgba(217,119,6,0.2)", color: "#374151" }}>
                  Talk to us
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 40px 80px rgba(217,119,6,0.12)" }}>
                <ImageWithFallback src={heroImg} alt="FMS13 vendor management" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section style={{ background: "#FFFFFF", padding: "48px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <p style={{ color: "#9CA3AF", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>BUILT FOR ORGANIZATIONS IN</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {sectors.map(s => (
              <span key={s} className="px-4 py-2 rounded-full text-sm" style={{ background: "#FFFBEB", border: "1px solid rgba(217,119,6,0.15)", color: "#92400E" }}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <p style={{ color: "#D97706", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "10px" }}>PLATFORM FEATURES</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.2, maxWidth: "520px" }}>
              Complete oversight. Zero gaps.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex flex-col gap-3 p-7 rounded-2xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: "#D97706" }} />
                <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0D0D1A" }}>{f.title}</h3>
                <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Image section */}
      <section style={{ background: "#F7F7FB", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                <ImageWithFallback src={buildingImg} alt="Enterprise facility" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex flex-col gap-6">
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
                Governance across every location, every contractor.
              </h2>
              <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>
                Large organizations often struggle with visibility into their contractor ecosystems — contracts scattered across departments, compliance gaps, and no unified record system. FMS13 eliminates this by centralizing every vendor interaction, document, and approval in one auditable platform.
              </p>
              <ul className="flex flex-col gap-3">
                {["Complete contractor register with full history", "Automated compliance alerts and renewals", "Multi-level approval chains for every action", "Real-time performance data across all sites"].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#D97706" }} />
                    <span style={{ color: "#374151", fontSize: "15px" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#D97706", padding: "80px 0" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-6">
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Take control of your contractor ecosystem.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "17px", maxWidth: "480px", lineHeight: 1.7 }}>
              Talk to our team to see how FMS13 fits your organization's scale and compliance requirements.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/contact" className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#fff", color: "#D97706" }}>
                Request a demo
              </Link>
              <Link to="/contact" className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                Contact sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
