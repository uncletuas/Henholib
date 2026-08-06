import { motion, useReducedMotion } from "motion/react";
import { Hammer, Users, Rocket, Sparkles } from "lucide-react";
import { colors } from "../../lib/brand";

const pillars = [
  { icon: Hammer, title: "Learn by doing", desc: "Every course is hands-on, real labs and a capstone you actually keep and use.", accent: "#6D8BFF" },
  { icon: Users, title: "Live cohorts", desc: "Small live sessions with real instruction and real people. Never pre-recorded lectures you watch alone.", accent: "#3ED0E0" },
  { icon: Rocket, title: "Built for real work", desc: "Practical AI skills you apply the same week, for your job, your business, or your institution.", accent: "#34E4A8" },
];

/**
 * The Academy "experience" band, an immersive, self-contained dark scene with
 * drifting gradient light and floating glass pillars. Motion pauses under
 * prefers-reduced-motion.
 */
export function AcademyExperience() {
  const reduce = useReducedMotion();
  const float = (i: number) =>
    reduce ? {} : { animate: { y: [0, -10, 0] }, transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 } };

  return (
    <section style={{ background: colors.bg, padding: "clamp(48px,7vw,90px) 0" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-[36px] overflow-hidden" style={{ background: colors.ink, boxShadow: "0 50px 120px rgba(6,8,15,0.35)" }}>
          {/* Drifting light blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <motion.div
              className="absolute rounded-full"
              style={{ width: "46%", height: "70%", top: "-15%", left: "-8%", background: "radial-gradient(circle, rgba(37,99,235,0.55), transparent 68%)", filter: "blur(50px)" }}
              animate={reduce ? {} : { x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "50%", height: "80%", bottom: "-25%", right: "-10%", background: "radial-gradient(circle, rgba(16,185,129,0.5), transparent 68%)", filter: "blur(55px)" }}
              animate={reduce ? {} : { x: [0, -70, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "34%", height: "50%", top: "25%", left: "42%", background: "radial-gradient(circle, rgba(14,165,233,0.4), transparent 70%)", filter: "blur(50px)" }}
              animate={reduce ? {} : { x: [0, 40, -30, 0], y: [0, -40, 20, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* faint grid for depth */}
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black, transparent 80%)" }} />
          </div>

          {/* Content */}
          <div className="relative px-6 sm:px-10 lg:px-16" style={{ padding: "clamp(48px,7vw,84px) clamp(24px,5vw,64px)" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
                <Sparkles size={14} style={{ color: "#7DD3FC" }} />
                <span style={{ color: "#E5E7EB", fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.04em" }}>THE ACADEMY DIFFERENCE</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(1.9rem,3.8vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
                A different kind of AI training.
              </h2>
              <p style={{ color: "rgba(229,231,235,0.75)", fontSize: "18px", lineHeight: 1.7, marginTop: "16px" }}>
                Not another shelf of videos. Loopital Academy is live, practical, and built to change how you work, a world of its own.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {pillars.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    {...float(i)}
                    className="h-full rounded-3xl p-7 transition-colors"
                    style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent}99)`, boxShadow: `0 12px 30px ${p.accent}44` }}>
                      <p.icon size={22} color="#0B1020" />
                    </div>
                    <h3 style={{ color: "#fff", fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "10px" }}>{p.title}</h3>
                    <p style={{ color: "rgba(229,231,235,0.72)", fontSize: "15px", lineHeight: 1.7 }}>{p.desc}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
