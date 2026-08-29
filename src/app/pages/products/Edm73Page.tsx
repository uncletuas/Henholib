import { ProductLanding } from "../../components/product/ProductLanding";
import { productById } from "../../config/products";

/**
 * Beacon, written for a head teacher or a registrar.
 *
 * The action is unchanged: it still opens the demo request.
 */
export function Edm73Page() {
  return (
    <ProductLanding
      product={productById("edm73")}
      headline={
        <>
          One system for
          <br />
          the whole school.
        </>
      }
      subhead="Admissions, students, staff, timetables, grades, fees and messages home. All of it in one place, all of it talking to itself."
      ctaNote="Book a demo and we will use your own fee structure."
      heroImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
      heroImageAlt="Students in a classroom"
      ideaTitle="Six spreadsheets is not a system."
      ideaBody="Admissions in one file, fees in another, results in a third, and a group chat for parents. Every one of them is somebody's job to keep in step, and the day they disagree is the day a parent notices first."
      ideaPunch="One record per student. Everything hangs off it."
      steps={[
        {
          title: "Bring your school across.",
          body: "Students, staff, classes and your fee structure, loaded before you start.",
        },
        {
          title: "Run the term.",
          body: "Admissions, attendance, timetables, grades and fees, from one place.",
        },
        {
          title: "Keep parents in the loop.",
          body: "Results, invoices and announcements go home automatically, on the record.",
        },
      ]}
      splitTitle="The term runs itself, mostly."
      splitBody="Registration opens and closes on schedule. Fee reminders go out without anybody writing them. Results reach parents the day they are approved. The work that used to be twenty people remembering becomes the system doing it."
      splitImage="https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
      splitImageAlt="A school administrator at a desk"
      scopeTitle="For schools, colleges and training institutions."
      scopeBody="Admissions and enrollment, student and staff records, classes and timetables, grades and transcripts, fees and receipts, and communication home. Built for institutions run by people with too much to do."
      noteTitle="Beacon is opening soon."
      noteBody="We are onboarding institutions one at a time so each rollout is done properly. Book a demo and we will walk you through it with your own admissions and fees."
      closing="Give the school one system to trust."
    />
  );
}
