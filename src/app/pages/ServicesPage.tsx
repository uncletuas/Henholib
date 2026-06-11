import { motion } from "motion/react";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const webImg = "https://images.unsplash.com/photo-1547658719-da2b51169166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx3ZWIlMjBkZXZlbG9wbWVudCUyMG1vYmlsZSUyMGFwcCUyMGNvZGluZyUyMHNvZnR3YXJlJTIwYnVpbGR8ZW58MXx8fHwxNzgwOTc4MTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const aiImg = "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxBSSUyMGFydGlmaWNpYWwlMjBpbnRlbGxpZ2VuY2UlMjB0ZWNobm9sb2d5JTIwd29ya3NwYWNlJTIwcHJvZHVjdGl2aXR5fGVufDF8fHx8MTc4MDk3ODEyOXww&ixlib=rb-4.1.0&q=80&w=1080";
const serverImg = "https://images.unsplash.com/photo-1695668548342-c0c1ad479aee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxlbmdpbmVlcmluZyUyMHNlcnZlciUyMGluZnJhc3RydWN0dXJlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3ODA5NzgxNzl8MA&ixlib=rb-4.1.0&q=80&w=1080";

const services = [
  {
    id: "web",
    title: "Web Development",
    subtitle: "Modern websites and web applications.",
    desc: "We design and build websites and web applications that are fast, accessible, and built to convert. From corporate websites to complex web platforms, we apply the same engineering standards we use for our own products to every client project.",
    deliverables: ["Corporate and marketing websites", "Web applications and portals", "E-commerce platforms", "SaaS products and dashboards", "API integrations and backends"],
    image: webImg,
  },
  {
    id: "mobile",
    title: "Mobile Applications",
    subtitle: "iOS and Android apps built to perform.",
    desc: "We build native and cross-platform mobile applications for iOS and Android. Whether you need a consumer-facing app or an enterprise mobile tool, we bring design quality and engineering depth to every build.",
    deliverables: ["iOS and Android native apps", "Cross-platform mobile apps", "Enterprise mobile tools", "Mobile-first web apps", "App maintenance and scaling"],
    image: webImg,
  },
  {
    id: "ai",
    title: "AI & Machine Learning",
    subtitle: "Intelligent systems built into your products.",
    desc: "We build AI-powered features, automated workflows, and machine learning systems that create real operational value. From natural language interfaces to predictive analytics, we help organizations leverage AI in ways that are practical, reliable, and genuinely useful.",
    deliverables: ["AI-powered product features", "Natural language processing", "Predictive analytics", "Intelligent automation", "AI strategy and consulting"],
    image: aiImg,
  },
  {
    id: "enterprise",
    title: "Enterprise Platforms",
    subtitle: "Large-scale digital infrastructure.",
    desc: "We design and build enterprise software platforms — the kind of system that an entire organization depends on. We handle the architecture, security, scalability, and compliance requirements that come with building at enterprise scale.",
    deliverables: ["Custom enterprise software", "ERP and operational systems", "Data platforms and warehouses", "System integrations", "Legacy system modernization"],
    image: serverImg,
  },
  {
    id: "digital",
    title: "Digital Systems",
    subtitle: "End-to-end digital transformation.",
    desc: "We help organizations modernize their operations by designing and implementing complete digital systems — from process mapping and workflow design to implementation and ongoing support.",
    deliverables: ["Digital process design", "Workflow automation systems", "Document management systems", "Reporting and analytics platforms", "Digital operations consulting"],
    image: webImg,
  },
  {
    id: "consulting",
    title: "Technology Consulting",
    subtitle: "Strategic guidance for technology decisions.",
    desc: "Organizations facing significant technology decisions benefit from external expertise. We provide technology consulting for businesses planning new systems, evaluating technology vendors, or navigating digital transformation.",
    deliverables: ["Technology strategy development", "Architecture review and planning", "Vendor evaluation", "Build-vs-buy analysis", "Technology roadmapping"],
    image: aiImg,
  },
];

export function ServicesPage() {
  return (
    <div>
      {/* Header */}
      <section style={{ background: "#F7F7FB", padding: "80px 0 64px" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <p style={{ color: "#4F46E5", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>SERVICES</p>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
              We build technology for your business too.
            </h1>
            <p style={{ color: "#6B7280", fontSize: "18px", lineHeight: 1.8 }}>
              Beyond our own software products, Loopital works with businesses and organizations to design and build the technology they need — applying the same engineering depth and product thinking we bring to our own work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services list */}
      <section style={{ background: "#FFFFFF", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-24">
          {services.map((svc, i) => (
            <motion.div
              key={svc.id}
              id={svc.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-14 items-center ${i % 2 === 1 ? "" : ""}`}
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "3/2", boxShadow: "0 24px 64px rgba(0,0,0,0.08)" }}>
                  <ImageWithFallback src={svc.image} alt={svc.title} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className={`flex flex-col gap-6 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <div>
                  <p style={{ color: "#4F46E5", fontSize: "12px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "8px" }}>SERVICE</p>
                  <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "6px" }}>{svc.title}</h2>
                  <p style={{ color: "#4F46E5", fontSize: "15px", fontWeight: 500, marginBottom: "14px" }}>{svc.subtitle}</p>
                  <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>{svc.desc}</p>
                </div>
                <div>
                  <p style={{ color: "#0D0D1A", fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>What we deliver</p>
                  <ul className="flex flex-col gap-2.5">
                    {svc.deliverables.map(d => (
                      <li key={d} className="flex items-start gap-3">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#4F46E5]" />
                        <span style={{ color: "#374151", fontSize: "15px" }}>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#F7F7FB", padding: "80px 0" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-5">
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em" }}>Have a project in mind?</h2>
            <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8, maxWidth: "440px" }}>Tell us what you're building. We'll figure out the best way to help.</p>
            <Link to="/contact" className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#4F46E5", color: "#fff" }}>
              Get in touch
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
