import { motion } from "motion/react";
import { colors } from "../lib/brand";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const posts = [
  { title: "One product: Loopital", category: "Product", date: "Sep 16, 2026", image: "/media/care-ward.jpg", excerpt: "We are putting everything we have into one thing: a single health record for every Nigerian, and the network of hospitals, pharmacies and labs that uses it. Loopital now lives at loopital.com." },
  { title: "The future of hospital management software in Africa", category: "Insights", date: "May 15, 2026", image: "/media/doctor-portrait.jpg", excerpt: "Healthcare institutions across Africa are still running on legacy systems or paper-based processes. We built Loopital because we believe modern healthcare software can and should be accessible everywhere." },
  { title: "Loopital's approach to product engineering", category: "Engineering", date: "Apr 20, 2026", image: "/media/office-meeting.jpg", excerpt: "Building software products that organizations actually depend on requires a different mindset than building apps. Here's how we think about reliability, performance, and long-term maintainability at Loopital." },
  { title: "Why we're based in Port Harcourt", category: "Company", date: "Apr 8, 2026", image: "/media/lagos-skyline.jpg", excerpt: "We're a global technology company built from Nigeria. Here's why Port Harcourt is the right base for what we're building, and what it means to build world-class software from this city." },
];

const categories = ["All", "Product", "Engineering", "Insights", "Company"];

export function InsightsPage() {
  return (
    <div>
      {/* Header */}
      <section style={{ background: colors.surfaceMuted, padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: colors.heading, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
              Thoughts on health technology and what we're building.
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <section style={{ background: colors.surface, padding: "32px 0", borderBottom: `1px solid ${colors.hairline}` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat, i) => (
              <button key={cat} className="px-4 py-1.5 text-sm transition-all" style={{ background: i === 0 ? colors.blue : colors.surfaceMuted, color: i === 0 ? "#fff" : colors.textSecondary, border: "1px solid", borderColor: i === 0 ? colors.blue : "rgba(0,0,0,0.07)" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section style={{ background: colors.surface, padding: "64px 0 96px" }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* Featured */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0  overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
              <div className="relative" style={{ minHeight: "320px" }}>
                <ImageWithFallback src={posts[0].image} alt={posts[0].title} className="w-full h-full object-cover absolute inset-0" />
                <div className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold" style={{ background: colors.blue, color: "#fff" }}>{posts[0].category}</div>
              </div>
              <div className="flex flex-col justify-center gap-4 p-10 bg-white">
                <span style={{ color: colors.textTertiary, fontSize: "13px" }}>{posts[0].date}</span>
                <h2 style={{ fontWeight: 800, fontSize: "24px", color: colors.heading, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{posts[0].title}</h2>
                <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.75 }}>{posts[0].excerpt}</p>
                <button className="self-start text-sm font-semibold" style={{ color: colors.blue }}>Read more →</button>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post, i) => (
              <motion.div key={post.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="flex flex-col  overflow-hidden cursor-pointer group h-full" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: "3/2" }}>
                    <ImageWithFallback src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold" style={{ background: "#fff", color: colors.blue }}>{post.category}</div>
                  </div>
                  <div className="flex flex-col gap-3 p-6 flex-1 bg-white">
                    <span style={{ color: colors.textTertiary, fontSize: "12px" }}>{post.date}</span>
                    <h3 style={{ fontWeight: 700, fontSize: "17px", color: colors.heading, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{post.title}</h3>
                    <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.7 }}>{post.excerpt}</p>
                    <button className="self-start mt-auto text-sm font-semibold" style={{ color: colors.blue }}>Read more →</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
