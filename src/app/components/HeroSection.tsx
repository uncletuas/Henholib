import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center"
      style={{ paddingTop: "80px", background: "#FFFFFF" }}
    >
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-80px)] py-16">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-8"
          >
            <div
              className="inline-flex self-start items-center px-4 py-1.5 rounded-full"
              style={{
                background: "#EEF2FF",
                border: "1px solid #C7D2FE",
              }}
            >
              <span style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 500 }}>
                Professional software, instantly activated
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#0D0D1A",
              }}
            >
              Download the app.
              <br />
              <span style={{ color: "#4F46E5" }}>Your license</span>
              <br />
              follows you in.
            </h1>

            <p style={{ color: "#6B7280", fontSize: "1.15rem", lineHeight: 1.75, maxWidth: "460px" }}>
              Loopital builds focused desktop software for specific industries. Download the application for your field, create your account, and your subscription activates the moment you sign in — no license files, no activation codes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => document.getElementById("apps")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: "#4F46E5", color: "#fff", fontSize: "16px", fontWeight: 600 }}
              >
                Browse applications
              </button>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 rounded-xl transition-all duration-200 hover:bg-[#EEF2FF]"
                style={{ border: "1px solid #C7D2FE", color: "#4F46E5", fontSize: "16px", fontWeight: 500 }}
              >
                Create free account
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              {[
                { value: "12,000+", label: "Active users" },
                { value: "4", label: "Applications" },
                { value: "99.9%", label: "Uptime SLA" },
              ].map((s) => (
                <div key={s.label}>
                  <p style={{ fontWeight: 700, fontSize: "20px", color: "#0D0D1A", letterSpacing: "-0.02em" }}>{s.value}</p>
                  <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: image */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                aspectRatio: "4/3",
                boxShadow: "0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)",
              }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGNvbXB1dGVyc3xlbnwxfHx8fDE3ODA5NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Team using Loopital software"
                className="w-full h-full object-cover"
              />
              {/* Overlay badge */}
              <div
                className="absolute bottom-5 left-5 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0D0D1A" }}>License activated</p>
                  <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Signed in · 3 seats active</p>
                </div>
              </div>
            </div>

            {/* Decorative dot grid */}
            <div
              className="absolute -top-8 -right-8 w-40 h-40 pointer-events-none -z-10"
              style={{
                backgroundImage: "radial-gradient(circle, #C7D2FE 1.5px, transparent 1.5px)",
                backgroundSize: "18px 18px",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
