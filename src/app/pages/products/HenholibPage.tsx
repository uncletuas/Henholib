import { ProductLanding } from "../../components/product/ProductLanding";
import { productById } from "../../config/products";

/**
 * Henholib, written for a patient rather than a procurement officer.
 *
 * The action is unchanged: it still launches the app.
 */
export function HenholibPage() {
  return (
    <ProductLanding
      product={productById("henholib")}
      headline={<>Your hospital,<br />in your pocket.</>}
      subhead="Find care, book it, carry your records, and get help fast when it matters. Free, and yours from the day you sign up."
      ctaNote="Free to join. No card, no paperwork."
      heroImage="/media/henholib-home.jpg"
      heroImageAlt="The Henholib home screen showing a health ID card"

      ideaTitle="Care shouldn't start with a phone call."
      ideaBody="Finding a hospital that treats what you have, has a slot this week, and takes your cover usually means ringing round and hoping. Henholib already knows. Search by what you need treated, see who is nearest, and book."
      ideaPunch="Open the app. Get seen."

      steps={[
        { title: "Find the right hospital.", body: "Nearest first, or search by what you need treated. No ringing round." },
        { title: "Book, and turn up.", body: "Pick a doctor and a time. Show your Henholib ID at the desk and they already have you." },
        { title: "Keep everything.", body: "Visits, prescriptions and results stay on your phone, so the next doctor is not starting from nothing." },
      ]}

      splitTitle="When it's an emergency, seconds matter."
      splitBody="Press SOS and Henholib shares your live location with responders and alerts the nearest Henholib hospital. Medical, police or fire. Your blood group, allergies and emergency contact are already on the card a paramedic needs to see."
      splitImage="/media/henholib-sos.jpg"
      splitImageAlt="The Henholib emergency SOS screen"

      scopeTitle="For you, and for everyone you look after."
      scopeBody="Add your parents, your children, your partner. Pay a hospital bill from the app. Keep every prescription in one place. It is the whole business of being a patient, on one screen."

      closing="Your health, finally in one place."
    />
  );
}
