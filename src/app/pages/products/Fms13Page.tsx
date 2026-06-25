import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function Fms13Page() {
  return (
    <ProductPageShell
      product={productById("fms13")}
      heroImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="FMS13 is a complete facility management system for organizations that operate buildings and sites at scale. It brings assets, maintenance, work orders, service requests, vendors, compliance, and space into one platform — so every facility runs efficiently, safely, and on schedule."
      stats={[
        { value: "Unlimited", label: "Buildings & sites" },
        { value: "Real-time", label: "Work-order visibility" },
        { value: "Full", label: "Compliance audit trail" },
      ]}
      featuresEyebrow="PLATFORM CAPABILITIES"
      featuresTitle="Everything it takes to run a facility."
      features={[
        { title: "Asset & Equipment Management", desc: "Track every asset, system, and piece of equipment across all buildings with full lifecycle and service history." },
        { title: "Maintenance & Work Orders", desc: "Plan preventive maintenance and manage reactive work orders from request through completion and sign-off." },
        { title: "Service Requests", desc: "Let occupants and staff raise, track, and resolve facility requests from any device, with clear SLAs." },
        { title: "Vendor & Contractor Management", desc: "Onboard, vet, and oversee the vendors and contractors who service your facilities, with documentation and approvals." },
        { title: "Compliance & Safety", desc: "Automate inspections, certifications, and safety compliance with expiry alerts and complete audit trails." },
        { title: "Multi-Site Operations", desc: "Run unlimited buildings, branches, and locations from one platform with role-based access and reporting." },
      ]}
      splitImage="https://images.unsplash.com/photo-1531972111231-7482a960e109?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="One system for every building, asset, and team."
      splitBody="Facilities teams juggle maintenance, vendors, compliance, and requests across scattered tools and spreadsheets. FMS13 unifies it all — giving you a single source of truth for what you own, what needs attention, and who's responsible, across your entire portfolio."
      splitBullets={[
        "Preventive and reactive maintenance in one place",
        "A complete asset and equipment register",
        "Vendor, compliance, and safety oversight",
        "Real-time visibility across every site",
      ]}
      ctaTitle="Run your facilities at peak efficiency."
      ctaBody="Talk to our team to see how FMS13 fits your portfolio of buildings, assets, and sites."
    />
  );
}
