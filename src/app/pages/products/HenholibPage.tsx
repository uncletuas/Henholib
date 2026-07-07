import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function HenholibPage() {
  return (
    <ProductPageShell
      product={productById("henholib")}
      heroImage="https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="Henholib puts your entire hospital and health experience on your phone — search for hospitals, book consultations with doctors, message your care team, and raise an emergency alert the moment you need help. Sign up in minutes; no waiting on anyone."
      stats={[
        { value: "Free", label: "To sign up" },
        { value: "24/7", label: "Emergency alerts" },
        { value: "1-tap", label: "Book a consultation" },
      ]}
      featuresEyebrow="WHAT YOU CAN DO"
      featuresTitle="Everything between you and better care, in one app."
      features={[
        { title: "Book Consultations", desc: "Find the right doctor and book an appointment in a few taps — in person or virtual." },
        { title: "Hospital Search", desc: "Discover hospitals and clinics near you, compare services, and see what each offers." },
        { title: "Emergency Alerts", desc: "Raise an alert when it matters most and get help routed to you quickly." },
        { title: "Chat With Your Care Team", desc: "Message doctors and hospital staff, ask follow-up questions, and stay in the loop." },
        { title: "Appointments & Records", desc: "Keep your upcoming visits, history, and health information organized in one place." },
        { title: "Reminders", desc: "Never miss a consultation or medication with timely, gentle nudges." },
      ]}
      splitImage="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="The patient side of a connected hospital network."
      splitBody="Henholib is the individual-facing half of the HMS7 ecosystem. While HMS7 runs the hospital — records, scheduling, billing, and operations — Henholib gives the people they care for a direct line in: booking, messaging, and emergencies flow between the two, so patients and hospitals finally share one connected experience."
      splitBullets={[
        "One app for booking, messaging, and emergencies",
        "Connected to hospitals running HMS7",
        "Free for individuals — sign up anytime",
        "Built for your phone, works on the web too",
      ]}
      ctaTitle="Your health, finally in your hands."
      ctaBody="Create your free Henholib account and take control of your hospital and health experience today."
    />
  );
}
