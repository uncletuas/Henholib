import { motion } from "motion/react";
import { colors } from "../lib/brand";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const teamImg = "/media/office-meeting.jpg";
const officeImg = "/media/lagos-skyline.jpg";

const values = [
  { title: "Product over process", desc: "We measure everything by the quality and impact of what we build. Great products come from focused engineering, clear thinking, and a relentless user focus." },
  { title: "Built to last", desc: "We build software that organizations can depend on, reliable, secure, well-documented, and designed with long operational lifespans in mind." },
  { title: "Global from day one", desc: "Our products are designed to serve organizations anywhere in the world. We build with international standards and diverse operational contexts in mind." },
  { title: "Intelligence in everything", desc: "We believe AI should be embedded in operational software from the ground up, not bolted on. Every product we build incorporates intelligent capabilities where they create real value." },
];

export function AboutPage() {
  return (
    <div>
      {/* Header */}
      <section style={{ background: colors.surfaceMuted, padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: colors.heading, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
              A technology company building for the long run.
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.8 }}>
              Loopital Limited is a global technology company that develops software products, artificial intelligence solutions, enterprise platforms, websites, mobile applications, and digital systems that help organizations operate more efficiently.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ background: colors.surface, padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-7">
              <div>                <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: colors.heading, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: "20px" }}>
                  To build technology that moves organizations forward.
                </h2>
                <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>
                  We founded Loopital on a single conviction: most organizations are limited not by ambition, but by the technology available to them. Too many businesses and institutions still run on outdated, fragmented, or poorly designed software systems.
                </p>
                <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.8 }}>
                  Loopital exists to close that gap, by building products that are genuinely excellent, and by helping other organizations bring that same quality to their own technology.
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className=" overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                <ImageWithFallback src={teamImg} alt="Loopital team" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: colors.surfaceMuted, padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, color: colors.heading, letterSpacing: "-0.025em", lineHeight: 1.2, maxWidth: "480px" }}>
              The principles that guide everything we build.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8  bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "18px", color: colors.heading, marginBottom: "10px" }}>{v.title}</h3>
                <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.75 }}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HQ */}
      <section style={{ background: colors.surface, padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className=" overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
                <ImageWithFallback src={officeImg} alt="Loopital" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
              <div>
                <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: colors.heading, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: "16px" }}>
                  Global products, built to travel.
                </h2>
                <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.8 }}>
                  Loopital is a Nigerian technology company building software products for users and organizations around the world. We work as a distributed team, and everything we ship is designed to be used anywhere.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <Link to="/contact" className="inline-flex items-center px-6 py-3  font-semibold text-sm transition-all hover:opacity-90" style={{ background: colors.blue, color: "#fff" }}>
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
