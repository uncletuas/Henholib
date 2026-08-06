import { ProductPageShell } from "../../components/product/ProductPageShell";
import { productById } from "../../config/products";

export function Edm73Page() {
  return (
    <ProductPageShell
      product={productById("edm73")}
      heroImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      heroBody="EDM73 is a complete management system for educational organizations, running admissions, students, staff, classes, timetables, grades, fees, and communication from one platform. It's not open to the public yet; join the waitlist to be first in line for early access."
      stats={[
        { value: "All-in-one", label: "One platform, end to end" },
        { value: "Web + Desktop", label: "For your whole institution" },
        { value: "Early access", label: "Join the waitlist" },
      ]}
      featuresEyebrow="WHAT EDM73 DOES"
      featuresTitle="Run your entire institution from one place."
      features={[
        { title: "Admissions & Enrollment", desc: "Manage applications, admissions, and enrollment end to end, from first inquiry to a registered student." },
        { title: "Students & Records", desc: "A single, reliable record for every student, profiles, attendance, performance, and history in one place." },
        { title: "Staff & Classes", desc: "Organize teachers, staff, classes, and sections, and assign the right people to the right groups." },
        { title: "Timetables & Grades", desc: "Build timetables, record assessments, and generate grades and report cards without the spreadsheets." },
        { title: "Fees & Finance", desc: "Track fees, invoices, and payments, and give administrators a clear view of the institution's finances." },
        { title: "Communication", desc: "Keep students, parents, and staff informed with announcements and messaging built into the platform." },
      ]}
      splitImage="https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      splitTitle="Built for schools, colleges, and training institutions."
      splitBody="EDM73 replaces the patchwork of registers, spreadsheets, and disconnected tools most institutions rely on. Everything, people, classes, grades, fees, and communication, lives in one connected system, so your team spends less time on admin and more time on education."
      splitBullets={[
        "Admissions, students, staff, and classes in one system",
        "Timetables, grades, and report cards without spreadsheets",
        "Fees, invoicing, and payment tracking",
        "Web and desktop, for your whole institution",
      ]}
      ctaTitle="Be first in line for EDM73."
      ctaBody="EDM73 isn't public yet. Join the waitlist and we'll let you know the moment early access opens."
    />
  );
}
