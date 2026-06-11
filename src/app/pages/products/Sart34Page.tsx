import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import sart34Logo from "../../../imports/sart34_logo.png";

const heroImg = "https://images.unsplash.com/photo-1683721003111-070bcc053d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NpYWwlMjBtZWRpYSUyMG1hcmtldGluZyUyMGRpZ2l0YWwlMjBhZHZlcnRpc2luZyUyMGNhbXBhaWdufGVufDF8fHx8MTc4MDk3ODEzMHww&ixlib=rb-4.1.0&q=80&w=1080";
const mobileImg = "https://images.unsplash.com/photo-1611926653458-09294b3142bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxzb2NpYWwlMjBtZWRpYSUyMG1hcmtldGluZyUyMGRpZ2l0YWwlMjBhZHZlcnRpc2luZyUyMGNhbXBhaWdufGVufDF8fHx8MTc4MDk3ODEzMHww&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  { title: "Unified Social Dashboard", desc: "Connect Facebook, Instagram, X (Twitter), LinkedIn, TikTok, YouTube, and more. View and manage every account from a single interface." },
  { title: "Multi-Platform Publishing", desc: "Write once, publish everywhere. Schedule and distribute content across all connected platforms simultaneously with platform-appropriate formatting." },
  { title: "AI-Powered Ad Creation", desc: "Let AI generate ad copy, visuals, and targeting strategies based on your product, audience, and campaign goals." },
  { title: "Campaign Management", desc: "Plan, launch, and monitor advertising campaigns across Facebook Ads, Instagram Ads, LinkedIn Ads, and more from one place." },
  { title: "Social Engagement Hub", desc: "Reply to comments, messages, and mentions across all platforms from one unified inbox — without jumping between apps." },
  { title: "Analytics & Reporting", desc: "Track reach, engagement, conversions, and ad spend across every platform with consolidated reports and performance dashboards." },
];

export function Sart34Page() {

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "#ECFEFF", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col gap-7">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-white" style={{ border: "1px solid rgba(8,145,178,0.2)" }}>
                  <ImageWithFallback src={sart34Logo} alt="SART34" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "20px", color: "#0D0D1A" }}>SART34</p>
                  <p style={{ fontSize: "13px", color: "#0891B2", fontWeight: 500 }}>Social Media Management</p>
                </div>
              </div>
              <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Every platform.
                <br />
                <span style={{ color: "#0891B2" }}>One dashboard.</span>
              </h1>
              <p style={{ color: "#374151", fontSize: "17px", lineHeight: 1.8, maxWidth: "480px" }}>
                SART34 connects all your social media accounts into a single workspace. Publish content everywhere at once, run AI-powered ad campaigns, and manage all your social engagement — without the chaos of switching tools.
              </p>
              <div className="flex gap-3">
                <a href="http://sart34-66csy4gyv-loopitals-projects.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#0891B2", color: "#fff" }}>
                  Get started <ArrowRight size={14} />
                </a>
                <a href="/contact" className="inline-flex items-center px-7 py-3.5 rounded-xl font-medium text-sm transition-all hover:bg-white/60" style={{ border: "1px solid rgba(8,145,178,0.2)", color: "#374151" }}>
                  Talk to us
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 40px 80px rgba(8,145,178,0.15)" }}>
                <ImageWithFallback src={heroImg} alt="SART34 social media platform" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <p style={{ color: "#0891B2", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "10px" }}>PLATFORM FEATURES</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.2, maxWidth: "520px" }}>
              Everything social, centralized.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex flex-col gap-3 p-7 rounded-2xl" style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: "#0891B2" }} />
                <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#0D0D1A" }}>{f.title}</h3>
                <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual split */}
      <section style={{ background: "#F7F7FB", padding: "96px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.08)" }}>
                <ImageWithFallback src={mobileImg} alt="Social media on mobile" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex flex-col gap-6">
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
                Built for businesses, creators, and agencies.
              </h2>
              <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>
                Whether you're a solo creator managing a personal brand, a business running marketing campaigns, or an agency handling dozens of clients — SART34 scales to fit your workflow without adding complexity.
              </p>
              <ul className="flex flex-col gap-3">
                {["Post to all platforms with one click", "AI writes your ad copy and targets your audience", "Manage comments and DMs from one inbox", "Track ROI across every campaign and platform"].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#0891B2" }} />
                    <span style={{ color: "#374151", fontSize: "15px" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0891B2", padding: "80px 0" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-6">
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Manage every social channel from one place.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "17px", maxWidth: "480px", lineHeight: 1.7 }}>
              Start using SART34 today and take control of your social media presence.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="http://sart34-66csy4gyv-loopitals-projects.vercel.app/" target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#fff", color: "#0891B2" }}>
                Get started
              </a>
              <a href="/contact" className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                Talk to us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
