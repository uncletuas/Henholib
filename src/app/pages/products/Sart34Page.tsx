import { ProductPageShell } from "../../components/product/ProductPageShell";
import { GradientText } from "../../components/GradientText";
import { productById } from "../../config/products";

export function Sart34Page() {
  return (
    <ProductPageShell
      product={productById("sart34")}
      heroImage="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      headline={<>AI ads & CRM that <GradientText>grow your business</GradientText>.</>}
      stats={[
        { value: "1", label: "Workspace for ads & CRM" },
        { value: "AI", label: "Campaign optimization" },
        { value: "Any", label: "Device — web, desktop, mobile" },
      ]}
      featuresEyebrow="WHAT SART34 DOES"
      featuresTitle="Advertising and customer relationships, finally in one place."
      features={[
        { title: "AI Ad Campaigns", desc: "Create, launch, and optimize ad campaigns across channels with AI doing the heavy lifting." },
        { title: "Unified CRM", desc: "Every lead, contact, and conversation in a single intelligent pipeline you can actually keep up with." },
        { title: "Audience Engagement", desc: "Respond, nurture, and follow up across every channel without switching tools." },
        { title: "Cross-Platform Publishing", desc: "Create content once and distribute it everywhere your audience is." },
        { title: "Performance Insights", desc: "See what's working with clear, AI-summarized reporting on spend, reach, and conversion." },
        { title: "Mobile App", desc: "Run campaigns and reply to customers from your pocket — SART34 goes wherever you do." },
      ]}
      splitImage="https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="One command center for marketing and customers."
      splitBody="SART34 eliminates the complexity of juggling ad managers, inboxes, and spreadsheets. Plan campaigns, manage relationships, and measure results — all from one intelligent workspace, on web, desktop, or mobile."
      splitBullets={[
        "AI-powered advertising and audience targeting",
        "A complete CRM for every customer relationship",
        "Available on web, desktop, and mobile",
        "Built for growing businesses that move fast",
      ]}
      ctaTitle="Grow with AI ads and CRM in one place."
      ctaBody="Open SART34 on the web, or download the mobile app and take it with you."
    />
  );
}
