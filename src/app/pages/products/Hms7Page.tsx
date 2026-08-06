import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function Hms7Page() {
  return (
    <ProductPageShell
      product={productById("hms7")}
      heroImage="https://images.unsplash.com/photo-1628372095387-017d1099fc19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="HMS7 is an enterprise-grade hospital management system built for the complexity of modern healthcare. It runs the hospital side, patient records, scheduling, billing, pharmacy, staff, and operational reporting, and connects directly to Henholib, the app your patients use to book, message, and reach you. Hospitals get access free after a short demo."
      stats={[
        { value: "3 months", label: "Free to start" },
        { value: "99.9%", label: "Uptime SLA" },
        { value: "Henholib", label: "Patient app, connected" },
      ]}
      featuresEyebrow="PLATFORM MODULES"
      featuresTitle="Every function of a hospital, in one system."
      features={[
        { title: "Patient Records (EMR)", desc: "Complete electronic medical records that give clinicians full patient history at their fingertips." },
        { title: "Appointment Management", desc: "Multi-department scheduling with automated reminders, rescheduling, and resource allocation." },
        { title: "Billing & Insurance", desc: "Streamlined billing, insurance claims processing, and payment tracking with full audit trails." },
        { title: "Staff Administration", desc: "Manage roles, shifts, credentials, and performance for clinical and administrative staff." },
        { title: "Pharmacy & Inventory", desc: "Track medications, consumables, and equipment with automated reorder and expiry alerts." },
        { title: "Connected to Henholib", desc: "Bookings, messages, and emergency alerts from the patient app flow straight into HMS7, one connected experience." },
      ]}
      splitImage="https://images.unsplash.com/photo-1512102438733-bfa4ed29aef7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="The hospital side of a connected care network."
      splitBody="HMS7 handles the operational demands of modern healthcare, from small independent clinics to large multi-department hospitals, while Henholib gives the patients they serve a direct line in. Compliance, patient privacy, and clinical workflow efficiency are non-negotiable foundations on both sides."
      splitBullets={[
        "Runs the hospital; Henholib runs the patient experience",
        "Designed for compliance from the ground up",
        "Works across departments and specialties",
        "Free for the first 3 months, request access via a quick demo",
      ]}
      ctaTitle="Ready to modernize your hospital's operations?"
      ctaBody="Request a demo and we'll set your hospital up on HMS7, free for the first 3 months."
    />
  );
}
