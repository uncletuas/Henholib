import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

/**
 * Modus.
 *
 * On-site rather than a redirect: the app itself is no longer hosted, so the
 * old link to modus.loopital.com would land on nothing. The page stays, the
 * story stays, and the CTA is a waitlist until it ships.
 */
export function ModusPage() {
  return (
    <ProductPageShell
      product={productById("fms13")}
      heroImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="Modus keeps every building, asset and work order in one place. Assets, maintenance, service requests, vendors, compliance and space across every site you run."
      stats={[
        { value: "Every site", label: "One platform, all buildings" },
        { value: "Web + Desktop", label: "Office and on the ground" },
        { value: "Guided setup", label: "We migrate your asset register" },
      ]}
      featuresEyebrow="WHAT MODUS DOES"
      featuresTitle="Every facility, fully under control."
      features={[
        { title: "Assets & Maintenance", desc: "One register for everything you own, with planned and reactive maintenance against each item." },
        { title: "Work Orders", desc: "Raise, assign and close work orders, so nothing sits in somebody's inbox unnoticed." },
        { title: "Service Requests", desc: "Let the people using a building report a problem, and route it to whoever fixes it." },
        { title: "Vendors", desc: "Contractors, contracts and callouts tracked in one place, with the history behind every job." },
        { title: "Compliance & Safety", desc: "Inspections, certificates and renewals, with the dates that matter surfaced before they pass." },
        { title: "Space", desc: "Know what each room and floor is for, who is in it, and what it costs to run." },
      ]}
      splitImage="https://images.unsplash.com/photo-1503387762-592deb58ef4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="Built for the people who keep buildings running."
      splitBody="Facilities work is reactive by nature. Modus makes it plannable: one register, one queue, one record of what was done and when, so the next person picking it up is not starting from scratch."
      splitBullets={[
        "Assets, maintenance and work orders in one place",
        "Vendors and compliance tracked against every job",
        "Works across every site you operate",
      ]}
    />
  );
}
