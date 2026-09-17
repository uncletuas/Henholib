import { Link } from "react-router";
import { colors } from "../lib/brand";
import { CONTACT_EMAIL } from "../config/site";

/**
 * The refund policy.
 *
 * Written to be read by a customer who is annoyed, not by a lawyer. Every
 * section says what happens, in what timeframe, and what the person has to do —
 * because the whole value of publishing this is that someone can settle a
 * question without opening a support ticket.
 *
 * The commitments here are deliberate choices, not boilerplate, and they are
 * the ones a founder should confirm before this becomes a promise: fourteen
 * days on a first subscription payment, no pro-rata refund on a cancelled
 * month, thirty days on unspent credits, and spent credits being gone because
 * the money has already left for Meta or TikTok.
 *
 * It follows the same shape as Terms and Privacy so the three read as one set,
 * minus the eyebrow label those two still carry.
 */

interface Section {
  id?: string;
  title: string;
  body: string[];
}

const EFFECTIVE = "17 September 2026";

const sections: Section[] = [
  {
    title: "What this covers",
    body: [
      "This policy applies to everything you can pay Loopital Limited for directly, including care payments, wallet top-ups and plans bought in the Loopital app. Payments are processed by Paystack and charged in Nigerian naira.",
      "Where you have signed a separate written agreement with us — as hospitals and other institutions on Loopital normally do — that agreement governs, and this policy fills any gap it leaves silent.",
      "Nothing here takes away rights you have under the Federal Competition and Consumer Protection Act 2018 or any other Nigerian law.",
    ],
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    body: [
      "If a subscription is not what you expected, tell us within 14 days of your first payment and we will refund it in full. You do not need to justify the request.",
      "After those first 14 days, subscriptions renew monthly and are charged in advance. You can cancel at any time from your account. Cancelling stops the next charge; it does not refund the month you are already in, and you keep full access until that month ends.",
      "If you cancel and we charge you anyway, that is our mistake and we refund it in full.",
    ],
  },
  {
    id: "care",
    title: "Payments for care",
    body: [
      "When you pay a hospital, pharmacy or lab through Loopital, you are paying that facility for its care; Loopital carries the payment. If a visit, test or prescription you paid for did not happen, the facility refunds it, and we make sure the refund reaches you.",
      "Tell us through the app or by email and we will follow it up with the facility. Where a facility does not respond within 10 business days, we step in.",
    ],
  },
  {
    title: "Charges that were never right",
    body: [
      "Some charges we refund in full, always, with no time limit and no questions: a duplicate charge, a charge after you cancelled, a charge on a card you did not authorise, and any amount that differs from the price shown at checkout.",
      "If a service is unavailable for a prolonged period through our fault, tell us and we will credit or refund the affected time.",
    ],
  },
  {
    title: "What we do not refund",
    body: [
      "Time on a subscription month you chose to cancel partway through. Fees a bank or card issuer charges you, which never reach us. And onboarding, migration or training work under an enterprise agreement once that work has started — though we will always talk about what is fair if something has gone wrong.",
    ],
  },
  {
    id: "how",
    title: "How to ask for a refund",
    body: [
      `Email ${CONTACT_EMAIL} from the address on the account. Tell us what you paid for and roughly when. You do not need an invoice number, though it helps if you have one.`,
      "We reply within 2 business days and decide within 5. If we say no, we tell you why in plain terms, and you can come back to us.",
    ],
  },
  {
    title: "How the money comes back",
    body: [
      "Refunds go back to the card or account you paid from. We cannot send a refund somewhere else — Paystack returns it along the path it came.",
      "Once we approve a refund, it usually reaches you within 5 to 10 business days. The delay after that point is with the banks, not with us, but if it has been longer than that, chase us and we will chase Paystack.",
    ],
  },
  {
    title: "Before you raise a chargeback",
    body: [
      "If you dispute a charge with your bank, the funds are frozen while the bank investigates and we lose the ability to simply refund you, which usually makes things slower for you rather than faster. Email us first. If we are wrong, we would rather just refund you.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this policy. Any change applies to purchases made after it is published, never backwards to something you have already paid for. The effective date at the top tells you which version you are reading.",
    ],
  },
  {
    title: "Contact",
    body: [
      `${CONTACT_EMAIL} · Loopital Limited, registered in Nigeria.`,
    ],
  },
];

export function RefundPolicyPage() {
  return (
    <div style={{ background: colors.bg }}>
      <section style={{ background: colors.bgSubtle, padding: "clamp(56px,6vw,80px) 24px clamp(32px,4vw,48px)" }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <h1 style={{ fontSize: "clamp(2rem,4vw,2.85rem)", color: colors.heading, letterSpacing: "-0.025em", marginBottom: 12 }}>
            Refund Policy
          </h1>
          <p style={{ color: colors.textTertiary, fontSize: "14px" }}>
            Effective {EFFECTIVE}
          </p>
        </div>
      </section>

      <section style={{ padding: "clamp(40px,5vw,64px) 24px clamp(64px,7vw,96px)" }}>
        <div className="mx-auto flex flex-col gap-9" style={{ maxWidth: 760 }}>
          <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.8 }}>
            We would rather refund you than keep money you feel you should not
            have paid. This page says exactly when we do that, how long it takes,
            and the few cases where we cannot — so you can settle the question
            without having to ask anyone.
          </p>

          {sections.map((s) => (
            <div key={s.title} id={s.id}>
              <h2 style={{ fontWeight: 600, fontSize: "19px", color: colors.heading, marginBottom: 10 }}>
                {s.title}
              </h2>
              <div className="flex flex-col gap-3.5">
                {s.body.map((p, i) => (
                  <p key={i} style={{ color: colors.textSecondary, fontSize: "15.5px", lineHeight: 1.8 }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${colors.hairline}`, paddingTop: 24 }}>
            <p style={{ color: colors.textTertiary, fontSize: "14.5px", lineHeight: 1.75 }}>
              See also our{" "}
              <Link to="/terms" style={{ color: colors.heading, fontWeight: 600 }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" style={{ color: colors.heading, fontWeight: 600 }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
