import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { ProductPostCard } from "../components/ProductPostCard";
import { FeaturedProductCard } from "../components/FeaturedProductCard";
import { flagshipProducts, availableProducts, inDevelopmentProducts } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";

export function ProductsPage() {
  return (
    <div>
      {/* Header */}
      <Section background={colors.surface} pad="md">
        <Reveal className="max-w-3xl">
          <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "14px" }}>PRODUCTS</p>
          <h1 style={{ marginBottom: "16px" }}>
            Software built to <GradientText>solve real problems</GradientText>.
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.65 }}>
            Our flagship platforms are ready to work for you today, with more on the way. Here's what's available now, and what's coming next.
          </p>
        </Reveal>
      </Section>

      {/* Flagship */}
      <Section background={colors.bg} pad="md">
        <Reveal className="mb-8">
          <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "10px" }}>FLAGSHIP</p>
          <h2>Our flagship platforms.</h2>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {flagshipProducts.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}><FeaturedProductCard product={p} /></Reveal>
          ))}
        </div>
      </Section>

      {/* Available */}
      <Section background={colors.surface} pad="md">
        <Reveal className="mb-8">
          <p style={{ color: colors.green, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "10px" }}>AVAILABLE NOW</p>
          <h2>More platforms you can use today.</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableProducts.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}><ProductPostCard product={p} /></Reveal>
          ))}
        </div>
      </Section>

      {/* In development */}
      <Section background={colors.bg} pad="md">
        <Reveal className="max-w-2xl mb-8">
          <p style={{ color: colors.textTertiary, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "10px" }}>IN DEVELOPMENT</p>
          <h2 style={{ marginBottom: "12px" }}>Coming soon.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.6 }}>
            These AI products are still in active development. Join the waitlist to be first in line when they launch.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ maxWidth: "760px" }}>
          {inDevelopmentProducts.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}><ProductPostCard product={p} /></Reveal>
          ))}
        </div>
      </Section>

      {/* Upcoming note */}
      <Section background={colors.surface} pad="md" width="narrow">
        <Reveal className="text-center flex flex-col items-center gap-4">
          <span className="inline-flex px-4 py-1.5 rounded-full glass">
            <span style={{ color: colors.textSecondary, fontSize: "13px", fontWeight: 500 }}>More coming soon</span>
          </span>
          <h2>Our portfolio is growing.</h2>
          <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.7, maxWidth: "520px" }}>
            Loopital continuously develops new software. Follow News &amp; Insights to be first to learn about upcoming launches.
          </p>
          <Link to="/insights" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: colors.blue }}>
            Follow our news <ArrowRight size={14} />
          </Link>
          <div className="w-full h-px mt-2" style={{ background: gradientBrand, opacity: 0.4 }} />
        </Reveal>
      </Section>
    </div>
  );
}
