import { motion } from "motion/react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const teamImg = "https://images.unsplash.com/photo-1551434678-e076c223a692?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGNvbXB1dGVyc3xlbnwxfHx8fDE3ODA5NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080";

const openings = [
  { title: "Senior Software Engineer", dept: "Engineering", location: "Port Harcourt, Nigeria (Hybrid)", type: "Full-time" },
  { title: "Product Designer (UI/UX)", dept: "Design", location: "Remote", type: "Full-time" },
  { title: "Frontend Engineer (React)", dept: "Engineering", location: "Port Harcourt, Nigeria (Hybrid)", type: "Full-time" },
  { title: "Machine Learning Engineer", dept: "AI Research", location: "Remote", type: "Full-time" },
  { title: "Product Manager", dept: "Product", location: "Port Harcourt, Nigeria", type: "Full-time" },
  { title: "Sales & Partnerships Manager", dept: "Commercial", location: "Nigeria / Remote", type: "Full-time" },
];

const perks = [
  { title: "Work that matters", desc: "You'll work on software used by real organizations to solve real problems — not side features on a product no one cares about." },
  { title: "Remote-friendly culture", desc: "Many of our roles can be done remotely. We care about output, not where you sit." },
  { title: "Learning & growth", desc: "We invest in the development of every team member — through training, resources, and space to explore new ideas." },
  { title: "Competitive compensation", desc: "We benchmark compensation against international technology companies, not just local market rates." },
];

export function CareersPage() {
  return (
    <div>
      {/* Header */}
      <section style={{ background: "#F7F7FB", padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p style={{ color: "#2563EB", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>CAREERS</p>
              <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
                Help us build what's next.
              </h1>
              <p style={{ color: "#6B7280", fontSize: "18px", lineHeight: 1.8 }}>
                Loopital is growing. We're looking for engineers, designers, and product thinkers who want to build software that genuinely matters — and who want to do some of the best work of their careers.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                <ImageWithFallback src={teamImg} alt="Loopital team" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why work here */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <p style={{ color: "#2563EB", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>WHY LOOPITAL</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.2, maxWidth: "480px" }}>
              What it's like to work here.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {perks.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8 rounded-2xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "17px", color: "#0D0D1A", marginBottom: "8px" }}>{p.title}</h3>
                <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: 1.75 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section style={{ background: "#F7F7FB", padding: "96px 0" }}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <p style={{ color: "#2563EB", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>OPEN POSITIONS</p>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em" }}>
              Current openings
            </h2>
          </motion.div>
          <div className="flex flex-col gap-3">
            {openings.map((role, i) => (
              <motion.div key={role.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "16px", color: "#0D0D1A", marginBottom: "4px" }}>{role.title}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm px-2.5 py-0.5 rounded-full" style={{ background: "#EEF4FF", color: "#2563EB", fontSize: "12px" }}>{role.dept}</span>
                      <span style={{ color: "#6B7280", fontSize: "13px" }}>{role.location}</span>
                      <span style={{ color: "#9CA3AF", fontSize: "13px" }}>{role.type}</span>
                    </div>
                  </div>
                  <Link to="/contact" className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "#2563EB", color: "#fff" }}>
                    Apply now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center" style={{ color: "#9CA3AF", fontSize: "14px" }}>
            Don't see the right role? <Link to="/contact" className="font-semibold" style={{ color: "#2563EB" }}>Send us an open application.</Link>
          </motion.p>
        </div>
      </section>
    </div>
  );
}
