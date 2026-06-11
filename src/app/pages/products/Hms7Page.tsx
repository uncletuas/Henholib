import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import hms7Logo from "../../../imports/hms7_logo.png";

const heroImg = "https://images.unsplash.com/photo-1628372095387-017d1099fc19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwaG9zcGl0YWwlMjBtZWRpY2FsJTIwc29mdHdhcmV8ZW58MXx8fHwxNzgwOTU3ODc4fDA&ixlib=rb-4.1.0&q=80&w=1080";
const clinicImg = "https://images.unsplash.com/photo-1512102438733-bfa4ed29aef7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxoZWFsdGhjYXJlJTIwaG9zcGl0YWwlMjBtZWRpY2FsJTIwc29mdHdhcmV8ZW58MXx8fHwxNzgwOTU3ODc4fDA&ixlib=rb-4.1.0&q=80&w=1080";

const modules = [
  { title: "Patient Records (EMR)", desc: "Comprehensive electronic medical records that give clinicians complete patient history at their fingertips." },
  { title: "Appointment Management", desc: "Multi-department scheduling with automated reminders, rescheduling, and resource allocation." },
  { title: "Billing & Insurance", desc: "Streamlined billing workflows, insurance claims processing, and payment tracking with full audit trails." },
  { title: "Staff Administration", desc: "Manage roles, shifts, credentials, and performance for doctors, nurses, and administrative staff." },
  { title: "Pharmacy & Inventory", desc: "Track medications, consumables, and medical equipment with automated reorder alerts and expiry tracking." },
  { title: "Operational Reporting", desc: "Comprehensive dashboards for hospital leadership covering patient flow, revenue, and operational KPIs." },
];

export function Hms7Page() {

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "#ECFDF5", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col gap-7">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-white" style={{ border: "1px solid rgba(5,150,105,0.2)" }}>
                  <ImageWithFallback src={hms7Logo} alt="HMS7" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "20px", color: "#0D0D1A" }}>HMS7</p>
                  <p style={{ fontSize: "13px", color: "#059669", fontWeight: 500 }}>Hospital Management System</p>
                </div>
              </div>
              <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Modern healthcare
                <br />
                <span style={{ color: "#059669" }}>demands modern systems.</span>
              </h1>
              <p style={{ color: "#374151", fontSize: "17px", lineHeight: 1.8, maxWidth: "480px" }}>
                HMS7 is an enterprise-grade hospital management system built for the complexity of modern healthcare. It unifies patient records, scheduling, billing, staff management, and operational reporting into one trusted platform.
              </p>
              <div className="flex gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#059669", color: "#fff" }}>
                  Request a demo <ArrowRight size={14} />
                </Link>
                <Link to="/contact" className="inline-flex items-center px-7 py-3.5 rounded-xl font-medium text-sm transition-all hover:bg-green-50" style={{ border: "1px solid rgba(5,150,105,0.2)", color: "#374151" }}>
                  Talk to us
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 40px 80px rgba(5,150,105,0.15)" }}>
                <ImageWithFallback src={heroImg} alt="HMS7 healthcare system" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{ background: "#FFFFFF", padding: "48px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[{ v: "HIPAA", l: "Compliance Ready" }, { v: "99.9%", l: "Uptime SLA" }, { v: "256-bit", l: "Data Encryption" }].map(s => (
              <div key={s.l}>
                <p style={{ fontWeight: 800, fontSize: "28px", color: "#059669", letterSpacing: "-0.02em" }}>{s.v}</p>
                <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "4px" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <p style={{ color: "#059669", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "10px" }}>PLATFORM MODULES</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.2, maxWidth: "500px" }}>
              Every function of a hospital, in one system.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m, i) => (
              <motion.div key={m.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex flex-col gap-3 p-7 rounded-2xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: "#059669" }} />
                <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0D0D1A" }}>{m.title}</h3>
                <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.7 }}>{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Image section */}
      <section style={{ background: "#F7F7FB", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
                Trusted by clinics, hospitals, and health networks.
              </h2>
              <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>
                HMS7 is built to handle the operational demands of modern healthcare institutions — from small independent clinics to large multi-department hospitals. The system is designed with regulatory compliance, patient privacy, and clinical workflow efficiency as non-negotiable foundations.
              </p>
              <ul className="flex flex-col gap-3">
                {["Designed for compliance from the ground up", "Works across departments and specialties", "Reduces administrative overhead by up to 40%", "Scales from a single clinic to a hospital network"].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#059669" }} />
                    <span style={{ color: "#374151", fontSize: "15px" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                <ImageWithFallback src={clinicImg} alt="Healthcare professionals" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#059669", padding: "80px 0" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-6">
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Ready to modernize your healthcare operations?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "17px", maxWidth: "480px", lineHeight: 1.7 }}>
              Request a demo and see how HMS7 can transform your facility's operations.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/contact" className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#fff", color: "#059669" }}>
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
