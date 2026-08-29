import { ProductLanding } from "../../components/product/ProductLanding";
import { productById } from "../../config/products";

/**
 * Modus, written for whoever gets the call when something breaks.
 *
 * The action is unchanged: it still joins the waitlist.
 */
export function ModusPage() {
  return (
    <ProductLanding
      product={productById("fms13")}
      headline={
        <>
          Every building,
          <br />
          under control.
        </>
      }
      subhead="Assets, maintenance, work orders, vendors and compliance across every site you run. One register, one queue, one record."
      ctaNote="Join the waitlist for early access."
      heroImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
      heroImageAlt="A building exterior"
      ideaTitle="Facilities work is reactive. It does not have to be."
      ideaBody="A generator fails, someone calls someone, a contractor comes out, and none of it is written down anywhere the next person will find. So the same fault gets diagnosed three times by three people."
      ideaPunch="Log it once. Everyone after you knows."
      steps={[
        {
          title: "Put everything in the register.",
          body: "Every asset across every site, with what it is and when it was last touched.",
        },
        {
          title: "Work goes in a queue.",
          body: "Requests and faults become work orders with an owner, so nothing sits in an inbox.",
        },
        {
          title: "The history stays.",
          body: "What was done, by whom, at what cost. The next person is not starting from scratch.",
        },
      ]}
      splitTitle="Planned beats reactive, every time."
      splitBody="Modus turns maintenance from a series of emergencies into a schedule. Inspections and certificates surface before they lapse, contractors are tracked against the jobs they did, and you can see what a building actually costs to run."
      splitImage="https://images.unsplash.com/photo-1503387762-592deb58ef4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
      splitImageAlt="A technician working on building equipment"
      scopeTitle="For the people who keep buildings running."
      scopeBody="Assets and maintenance, work orders and service requests, vendors and contracts, compliance and safety, and space across every site. Whether that is one office or forty."
      noteTitle="Modus is not open yet."
      noteBody="We are finishing it properly before handing it to teams who depend on it. Join the waitlist and we will bring you in as we open access."
      closing="Stop firefighting. Start running the estate."
    />
  );
}
