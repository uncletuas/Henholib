import { motion } from "motion/react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const teamImg = "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGNvbXB1dGVyc3xlbnwxfHx8fDE3ODA5NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const officeImg = "https://images.unsplash.com/photo-1531972111231-7482a960e109?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBvZmZpY2UlMjBmYWNpbGl0eSUyMG1hbmFnZW1lbnQlMjJidWlsZGluZ3xlbnwxfHx8fDE3ODA5NTc4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080";

const values = [
  { title: "Product over process", desc: "We measure everything by the quality and impact of what we build. Great products come from focused engineering, clear thinking, and a relentless user focus." },
  { title: "Built to last", desc: "We build software that organizations can depend on — reliable, secure, well-documented, and designed with long operational lifespans in mind." },
  { title: "Global from day one", desc: "Our products and services are designed to serve organizations anywhere in the world. We build with international standards and diverse operational contexts in mind." },
  { title: "Intelligence in everything", desc: "We believe AI should be embedded in operational software from the ground up — not bolted on. Every product we build incorporates intelligent capabilities where they create real value." },
];

export function AboutPage() {
  return (
    <div>
      {/* Header */}
      <section style={{ background: "#F7F7FB", padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>ABOUT LOOPITAL</p>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
              A technology company building for the long run.
            </h1>
            <p style={{ color: "#6B7280", fontSize: "18px", lineHeight: 1.8 }}>
              Loopital Limited is a global technology company that develops software products, artificial intelligence solutions, enterprise platforms, websites, mobile applications, and digital systems that help organizations operate more efficiently.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-7">
              <div>
                <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>OUR MISSION</p>
                <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: "20px" }}>
                  To build technology that moves organizations forward.
                </h2>
                <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>
                  We founded Loopital on a single conviction: most organizations are limited not by ambition, but by the technology available to them. Too many businesses and institutions still run on outdated, fragmented, or poorly designed software systems.
                </p>
                <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>
                  Loopital exists to close that gap — by building products that are genuinely excellent, and by helping other organizations bring that same quality to their own technology.
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                <ImageWithFallback src={teamImg} alt="Loopital team" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: "#F7F7FB", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>HOW WE WORK</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.2, maxWidth: "480px" }}>
              The principles that guide everything we build.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8 rounded-2xl bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "18px", color: "#0D0D1A", marginBottom: "10px" }}>{v.title}</h3>
                <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: 1.75 }}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HQ */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                <ImageWithFallback src={officeImg} alt="Loopital headquarters" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
              <div>
                <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>HEADQUARTERED IN NIGERIA</p>
                <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: "16px" }}>
                  Global products built from Port Harcourt.
                </h2>
                <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>
                  Loopital is headquartered at Pyale Hub in Port Harcourt, Rivers State, Nigeria. From here, we build software products and deliver technology services to clients and users around the world. We are proudly a Nigerian technology company with global ambition.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-4 pl-4" style={{ borderLeft: "3px solid #4F46E5" }}>
                <p style={{ fontWeight: 600, color: "#0D0D1A", fontSize: "15px" }}>Pyale Hub</p>
                <p style={{ color: "#6B7280", fontSize: "14px" }}>21 Bekwere Wosu Street, D-Line, Diobu</p>
                <p style={{ color: "#6B7280", fontSize: "14px" }}>Port Harcourt, Rivers State, Nigeria</p>
              </div>
              <div className="flex gap-3 mt-2">
                <Link to="/careers" className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#4F46E5", color: "#fff" }}>
                  View open roles
                </Link>
                <Link to="/contact" className="inline-flex items-center px-6 py-3 rounded-xl font-medium text-sm transition-all hover:bg-gray-50" style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
                  Contact us
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
