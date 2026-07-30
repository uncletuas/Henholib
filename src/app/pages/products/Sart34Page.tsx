import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function Sart34Page() {
  return (
    <ProductPageShell
      product={productById("sart34")}
      heroImage="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="SART34 unifies advertising and customer relationships in one place — run AI-powered ad campaigns, manage every conversation, and grow your audience from a single intelligent workspace, on any device. It's not open to the public yet; join the waitlist to get early access."
      stats={[
        { value: "Ads + CRM", label: "In one workspace" },
        { value: "AI-powered", label: "Campaigns & replies" },
        { value: "Early access", label: "Join the waitlist" },
      ]}
      featuresEyebrow="WHAT SART34 DOES"
      featuresTitle="Advertising and customer relationships, unified."
      features={[
        { title: "AI Ad Campaigns", desc: "Plan, generate, and launch ad campaigns across platforms with AI drafting the creative and copy for you." },
        { title: "Unified CRM", desc: "Every lead and conversation in one inbox, with AI-drafted follow-ups so no enquiry ever goes cold." },
        { title: "Audience Engagement", desc: "Reach and nurture your audience with the right message at the right moment, from a single place." },
        { title: "Cross-Platform Publishing", desc: "Compose once and publish everywhere — social, ads, and messaging, coordinated from one workspace." },
        { title: "Conversation Management", desc: "See and respond to messages and comments from every connected channel in one unified view." },
        { title: "On Any Device", desc: "Built for web, desktop, and mobile, so your marketing moves with you." },
      ]}
      splitImage="https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="AI ads & CRM for growing businesses."
      splitBody="SART34 brings the two halves of growth — winning attention and keeping relationships — into one intelligent workspace. Instead of juggling ad tools, spreadsheets, and inboxes, your team runs campaigns and conversations side by side, with AI doing the heavy lifting."
      splitBullets={[
        "Ads and CRM in a single workspace",
        "AI writes campaigns and follow-ups",
        "One inbox for every channel",
        "Web, desktop, and mobile",
      ]}
      ctaTitle="Be first in line for SART34."
      ctaBody="SART34 isn't public yet. Join the waitlist and we'll let you know the moment early access opens."
    />
  );
}
