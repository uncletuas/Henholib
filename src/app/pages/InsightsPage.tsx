import { motion } from "motion/react";
import { colors } from "../lib/brand";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const posts = [
  { title: "Introducing Pal: Your AI Coworker Platform", category: "Product", date: "Jun 5, 2026", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", excerpt: "Today we're officially launching Pal, our AI-powered coworker platform designed to work alongside individuals, teams, and organizations on research, content, and automation tasks." },
  { title: "Swift is now part of Pal", category: "Product", date: "Aug 25, 2026", image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", excerpt: "Ads, social publishing and the customer inbox have moved into the Pal workspace as Social. One login, one library, one messaging interface, and a coworker that can run a campaign without being asked twice. Fewer apps was always the point." },
  { title: "The future of hospital management software in Africa", category: "Insights", date: "May 15, 2026", image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", excerpt: "Healthcare institutions across Africa are still running on legacy systems or paper-based processes. We built HMS7 because we believe modern healthcare management software can and should be accessible everywhere." },
  { title: "Facility management at scale: one system, every building", category: "Enterprise", date: "May 3, 2026", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", excerpt: "Organizations running buildings at scale juggle assets, maintenance, vendors, and compliance across disconnected tools. This is why we built Modus, a complete facility management system." },
  { title: "Loopital's approach to product engineering", category: "Engineering", date: "Apr 20, 2026", image: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", excerpt: "Building software products that organizations actually depend on requires a different mindset than building apps. Here's how we think about reliability, performance, and long-term maintainability at Loopital." },
  { title: "Why we're based in Port Harcourt", category: "Company", date: "Apr 8, 2026", image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", excerpt: "We're a global technology company built from Nigeria. Here's why Port Harcourt is the right base for what we're building, and what it means to build world-class software from this city." },
];

const categories = ["All", "Product", "Engineering", "Insights", "Enterprise", "Company"];

export function InsightsPage() {
  return (
    <div>
      {/* Header */}
      <section style={{ background: colors.surfaceMuted, padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>NEWS & INSIGHTS</p>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: colors.heading, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
              Thoughts on technology, products, and what we're building.
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <section style={{ background: colors.surface, padding: "32px 0", borderBottom: `1px solid ${colors.hairline}` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat, i) => (
              <button key={cat} className="px-4 py-1.5 rounded-full text-sm transition-all" style={{ background: i === 0 ? colors.blue : colors.surfaceMuted, color: i === 0 ? "#fff" : colors.textSecondary, border: "1px solid", borderColor: i === 0 ? colors.blue : "rgba(0,0,0,0.07)" }}>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
              <div className="relative" style={{ minHeight: "320px" }}>
                <ImageWithFallback src={posts[0].image} alt={posts[0].title} className="w-full h-full object-cover absolute inset-0" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: colors.blue, color: "#fff" }}>{posts[0].category}</div>
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
                <div className="flex flex-col rounded-2xl overflow-hidden cursor-pointer group h-full" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: "3/2" }}>
                    <ImageWithFallback src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#fff", color: colors.blue }}>{post.category}</div>
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
