import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function Stack62Page() {
  return (
    <ProductPageShell
      product={productById("stack62")}
      heroImage="https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="Pal is an AI coworker that handles research, knowledge management, content, and workflow automation, so your team thinks faster and works at a fundamentally higher level. It's not open to the public yet; join the waitlist to be first in line for early access."
      stats={[
        { value: "AI-native", label: "Built from day one" },
        { value: "Web + Desktop", label: "Works where you do" },
        { value: "Early access", label: "Join the waitlist" },
      ]}
      featuresEyebrow="WHAT Pal DOES"
      featuresTitle="An AI coworker for the whole team."
      features={[
        { title: "Research & Synthesis", desc: "Ask a question and get a sourced, structured answer, Pal reads, compares, and summarizes so you don't have to." },
        { title: "Knowledge Management", desc: "Turn scattered documents and conversations into a living, searchable memory your whole team can draw on." },
        { title: "Content Generation", desc: "Draft, rewrite, and polish documents, posts, and communications in your voice, grounded in your context." },
        { title: "Workflow Automation", desc: "Hand off repetitive, multi-step work, Pal executes the busywork so people focus on judgment and craft." },
        { title: "Decision Support", desc: "Weigh options, surface trade-offs, and pressure-test ideas with an assistant that thinks alongside you." },
        { title: "Works Across Your Stack", desc: "Designed to plug into the tools your team already uses, on web and desktop." },
      ]}
      splitImage="https://images.unsplash.com/photo-1531403009284-440f080d1e12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="Your team's most intelligent member."
      splitBody="Pal is built to work the way a great colleague does, proactive, context-aware, and reliable. It carries your team's knowledge, takes on the heavy lifting, and raises the ceiling on what a small team can accomplish."
      splitBullets={[
        "Research, writing, and automation in one place",
        "Grounded in your team's own knowledge",
        "AI at the core, not bolted on later",
        "Web and desktop, wherever you work",
      ]}
      ctaTitle="Be first in line for Pal."
      ctaBody="Pal isn't public yet. Join the waitlist and we'll let you know the moment early access opens."
    />
  );
}
