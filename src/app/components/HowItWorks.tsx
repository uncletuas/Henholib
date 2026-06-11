import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: "#F7F7FB", padding: "96px 0" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p style={{ color: "#4F46E5", fontSize: "14px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "12px" }}>
            HOW IT WORKS
          </p>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "#0D0D1A",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            Download first. Sign in to activate.
          </h2>
          <p className="mt-4 max-w-xl mx-auto" style={{ color: "#6B7280", fontSize: "17px", lineHeight: 1.7 }}>
            No license files. No activation codes. Your Loopital account carries the license — wherever you install the app, it follows.
          </p>
        </motion.div>

        {/* Three-column steps with big images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              step: "1",
              title: "Download the application",
              description:
                "Browse our applications and download the one built for your industry. No account needed to download — the installer is free.",
              image: "https://images.unsplash.com/photo-1597673030062-0a0f1a801a31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBzb2Z0d2FyZSUyMGRvd25sb2FkJTIwbGFwdG9wJTIwd29ya3NwYWNlfGVufDF8fHx8MTc4MDk1Nzg4NHww&ixlib=rb-4.1.0&q=80&w=1080",
              accent: "#4F46E5",
            },
            {
              step: "2",
              title: "Create your Loopital account",
              description:
                "Sign up on loopital.com, choose a subscription plan for the application you downloaded, and manage everything from your account — billing, seats, and renewals.",
              image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxlbmdpbmVlcmluZyUyMHNlcnZlciUyMGluZnJhc3RydWN0dXJlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3ODA5NTc4Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
              accent: "#0891B2",
            },
            {
              step: "3",
              title: "Sign in inside the app to activate",
              description:
                "Open the installed app, enter your Loopital credentials, and your subscription activates instantly. Every device you install on authenticates from the same account.",
              image: "https://images.unsplash.com/photo-1551434678-e076c223a692?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGNvbXB1dGVyc3xlbnwxfHx8fDE3ODA5NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
              accent: "#059669",
            },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="flex flex-col gap-5"
            >
              {/* Image */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ aspectRatio: "4/3", boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
              >
                <ImageWithFallback src={s.image} alt={s.title} className="w-full h-full object-cover" />
                <div
                  className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: s.accent }}
                >
                  {s.step}
                </div>
              </div>

              {/* Text */}
              <div className="px-1">
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0D0D1A", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                  {s.title}
                </h3>
                <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: 1.7 }}>
                  {s.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Callout block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-10 flex flex-col justify-center gap-4" style={{ background: "#FFFFFF" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#0D0D1A", letterSpacing: "-0.015em" }}>
                One account. All your subscriptions.
              </h3>
              <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: 1.75 }}>
                If you use more than one Loopital application, everything is managed from the same account. Each app has its own subscription and pricing — you only pay for what you use, and you can manage each one separately without logging into different portals.
              </p>
              <ul className="flex flex-col gap-2 mt-2">
                {[
                  "Separate subscriptions per application",
                  "Manage billing and seats in one dashboard",
                  "One login activates all your licensed apps",
                  "Cancel or upgrade each app independently",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#4F46E5]" />
                    <span style={{ color: "#374151", fontSize: "15px" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative" style={{ minHeight: "280px" }}>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1606857521015-7f9fcf423740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBvZmZpY2UlMjB0ZWFtJTIwd29ya2luZyUyMGNvbXB1dGVyc3xlbnwxfHx8fDE3ODA5NTc4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Team managing accounts"
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
