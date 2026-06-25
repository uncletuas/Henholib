import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function Hms7Page() {
  return (
    <ProductPageShell
      product={productById("hms7")}
      heroImage="https://images.unsplash.com/photo-1628372095387-017d1099fc19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="HMS7 is an enterprise-grade hospital management system built for the complexity of modern healthcare. It unifies patient records, scheduling, billing, staff, and operational reporting into one trusted platform."
      stats={[
        { value: "HIPAA", label: "Compliance ready" },
        { value: "99.9%", label: "Uptime SLA" },
        { value: "256-bit", label: "Data encryption" },
      ]}
      featuresEyebrow="PLATFORM MODULES"
      featuresTitle="Every function of a hospital, in one system."
      features={[
        { title: "Patient Records (EMR)", desc: "Complete electronic medical records that give clinicians full patient history at their fingertips." },
        { title: "Appointment Management", desc: "Multi-department scheduling with automated reminders, rescheduling, and resource allocation." },
        { title: "Billing & Insurance", desc: "Streamlined billing, insurance claims processing, and payment tracking with full audit trails." },
        { title: "Staff Administration", desc: "Manage roles, shifts, credentials, and performance for clinical and administrative staff." },
        { title: "Pharmacy & Inventory", desc: "Track medications, consumables, and equipment with automated reorder and expiry alerts." },
        { title: "Operational Reporting", desc: "Dashboards for leadership covering patient flow, revenue, and operational KPIs." },
      ]}
      splitImage="https://images.unsplash.com/photo-1512102438733-bfa4ed29aef7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="Trusted by clinics, hospitals, and health networks."
      splitBody="HMS7 is built to handle the operational demands of modern healthcare — from small independent clinics to large multi-department hospitals — with compliance, patient privacy, and clinical workflow efficiency as non-negotiable foundations."
      splitBullets={[
        "Designed for compliance from the ground up",
        "Works across departments and specialties",
        "Reduces administrative overhead by up to 40%",
        "Scales from a single clinic to a hospital network",
      ]}
      ctaTitle="Ready to modernize your healthcare operations?"
      ctaBody="Request a demo and see how HMS7 can transform your facility's operations."
    />
  );
}
