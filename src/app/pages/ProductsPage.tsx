import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "../components/Section";
import { Reveal } from "../components/Reveal";
import { GradientText } from "../components/GradientText";
import { EcosystemCard } from "../components/EcosystemCard";
import { ecosystemProducts, inDevelopmentProducts } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";

export function ProductsPage() {
  return (
    <div>
      {/* Header */}
      <Section background={colors.surface} pad="md">
        <Reveal className="max-w-3xl">
          <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "14px" }}>PRODUCTS</p>
          <h1 style={{ marginBottom: "16px" }}>
            One ecosystem, <GradientText>built around your needs</GradientText>.
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.65 }}>
            A connected stack of platforms for how modern people and organizations run, each solving a specific problem, and stronger together. Pick the one built for you.
          </p>
        </Reveal>
      </Section>

      {/* Ecosystem grid */}
      <Section background={colors.bg} pad="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ecosystemProducts.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}><EcosystemCard product={p} /></Reveal>
          ))}
        </div>
      </Section>

      {/* In development — only shown when there is something in development */}
      {inDevelopmentProducts.length > 0 && (
        <Section background={colors.surface} pad="md">
          <Reveal className="max-w-2xl mb-6">
            <h2 style={{ marginBottom: "10px" }}>Also in the works.</h2>
            <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.6 }}>
              These are in active development. Click through to see where each one has got to.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ maxWidth: "620px" }}>
            {inDevelopmentProducts.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}><EcosystemCard product={p} /></Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming note */}
      <Section background={colors.bg} pad="md" width="narrow">
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
