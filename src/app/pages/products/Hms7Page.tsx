import { ProductLanding } from "../../components/product/ProductLanding";
import { productById } from "../../config/products";

/**
 * HMS7, written for the person who runs the hospital.
 *
 * The action is unchanged: it still opens the registration form.
 */
export function Hms7Page() {
  return (
    <ProductLanding
      product={productById("hms7")}
      headline={
        <>
          Run the whole hospital
          <br />
          from one place.
        </>
      }
      subhead="Records, appointments, billing, pharmacy, staff and claims in a single system. Register your hospital and we set you up."
      ctaNote="Free for the first three months."
      heroImage="/media/mission-bg.jpg"
      heroImageAlt="A patient checking in at a hospital reception"
      ideaTitle="The paper is the problem."
      ideaBody="A file that lives in a cabinet cannot tell you which beds are free, which claims are unpaid, or what a patient was given last time. Every question becomes a walk down a corridor, and every answer arrives late."
      ideaPunch="Ask the system. It already knows."
      steps={[
        {
          title: "Register your hospital.",
          body: "Tell us your size and what matters first. No sales call before anyone has seen the software.",
        },
        {
          title: "We migrate your records.",
          body: "Your patients, staff and price list come across. You do not start from an empty database.",
        },
        {
          title: "Run it end to end.",
          body: "Front desk, wards, pharmacy, billing and claims on one system, so nothing is retyped.",
        },
      ]}
      splitTitle="Your patients arrive already checked in."
      splitBody="Hospitals on HMS7 are on the Henholib network. Patients book from their phone, show a QR code at reception, and their record is on your screen before they sit down. The appointment, the notes and the bill are the same record."
      splitImage="/media/henholib-care.jpg"
      splitImageAlt="The Henholib care screen, where patients book a hospital"
      scopeTitle="Built for how hospitals actually run."
      scopeBody="Patient records, appointments, admissions, pharmacy stock, staff rosters, billing, insurance claims and compliance. HMOs and insurers manage their members on the same platform, so approvals stop living in email."
      noteTitle="We onboard you properly."
      noteBody="Register and our team gets in touch to plan the rollout, migrate your records and train your staff. Three months free, so you can run it in earnest before deciding."
      closing="Stop chasing paper. Start running the hospital."
    />
  );
}
