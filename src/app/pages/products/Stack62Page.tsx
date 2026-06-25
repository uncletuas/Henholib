import { ProductPageShell } from "../../components/product/ProductPageShell";
import { GradientText } from "../../components/GradientText";
import { productById } from "../../config/products";

export function Stack62Page() {
  return (
    <ProductPageShell
      product={productById("stack62")}
      heroImage="https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      headline={<>The way work will be done <GradientText>in the future</GradientText>.</>}
      stats={[
        { value: "10×", label: "Faster research" },
        { value: "24/7", label: "Always available" },
        { value: "1", label: "Workspace for everything" },
      ]}
      featuresEyebrow="WHAT STACK62 DOES"
      featuresTitle="An intelligent coworker for every part of the workday."
      features={[
        { title: "Research & Synthesis", desc: "Pull together answers from across your knowledge, the web, and your documents — summarized and cited." },
        { title: "Content Generation", desc: "Draft, refine, and repurpose content in your voice, from first idea to finished output." },
        { title: "Workflow Automation", desc: "Hand off repetitive, multi-step work and let STACK62 run it end to end." },
        { title: "Knowledge Management", desc: "Turn scattered information into an organized, searchable second brain for your team." },
        { title: "Decision Support", desc: "Weigh options, model trade-offs, and surface the context you need to decide with confidence." },
        { title: "Team Collaboration", desc: "Bring an AI partner into the way your team already works — alongside people, not in their way." },
      ]}
      splitImage="https://images.unsplash.com/photo-1531482615713-2afd69097998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="Human and AI, working as one team."
      splitBody="STACK62 isn't a chatbot bolted onto your tools. It's an intelligent coworker that understands your context, takes on real work, and helps your team operate at a fundamentally higher level."
      splitBullets={[
        "Understands your documents, data, and context",
        "Available on web and desktop, wherever you work",
        "Automates repetitive work so people focus on judgment",
        "Built with enterprise-grade privacy and control",
      ]}
      ctaTitle="Put an intelligent coworker on your team."
      ctaBody="Launch STACK62 and experience the future of work today."
    />
  );
}
