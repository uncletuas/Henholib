import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function Fms13Page() {
  return (
    <ProductPageShell
      product={productById("fms13")}
      heroImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="FMS13 is an enterprise vendor and contractor management platform for large organizations, corporations, and government institutions that oversee complex contractor ecosystems across multiple sites, branches, and projects."
      stats={[
        { value: "Unlimited", label: "Sites & locations" },
        { value: "Multi-level", label: "Approval chains" },
        { value: "Full", label: "Audit trail" },
      ]}
      featuresEyebrow="PLATFORM FEATURES"
      featuresTitle="Complete oversight. Zero gaps."
      features={[
        { title: "Vendor Registration & Onboarding", desc: "Digitize the entire onboarding process — registration, documents, vetting, and approval — with full audit trails." },
        { title: "Contractor Management", desc: "Track contractors across all projects and locations. Manage contracts, assign work, and document every interaction." },
        { title: "Compliance & Documentation", desc: "Ensure every vendor meets your requirements, with automated document expiry alerts and certification renewals." },
        { title: "Multi-Site Operations", desc: "Manage vendors across unlimited offices, branches, projects, and geographies from a single platform." },
        { title: "Approval Workflows", desc: "Configure multi-level approval chains for registration, contracts, purchase orders, and compliance exceptions." },
        { title: "Performance Monitoring", desc: "Score and monitor contractor performance over time to make data-driven contract decisions." },
      ]}
      splitImage="https://images.unsplash.com/photo-1531972111231-7482a960e109?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="Governance across every location, every contractor."
      splitBody="Large organizations struggle with visibility into their contractor ecosystems — contracts scattered across departments, compliance gaps, and no unified record system. FMS13 centralizes every vendor interaction, document, and approval in one auditable platform."
      splitBullets={[
        "Complete contractor register with full history",
        "Automated compliance alerts and renewals",
        "Multi-level approval chains for every action",
        "Real-time performance data across all sites",
      ]}
      ctaTitle="Take control of your contractor ecosystem."
      ctaBody="Talk to our team to see how FMS13 fits your organization's scale and compliance requirements."
    />
  );
}
