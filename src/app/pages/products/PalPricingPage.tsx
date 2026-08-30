import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Reveal } from "../../components/Reveal";
import { colors } from "../../lib/brand";
import {
  PAL_PLANS,
  PAL_CREDIT_BUNDLES,
  naira,
  type PalPlan,
} from "../../config/pal-plans";

/**
 * Pal — plans and pricing.
 *
 * Two decisions shape this page.
 *
 * The prices are real: they come from src/app/config/pal-plans.ts, which is
 * checked against server/app.js on every build. A pricing page is the one page
 * where an invented number is a lie rather than a placeholder.
 *
 * And every button joins the waitlist, because that is the only thing anyone
 * can actually do. Pal has not opened, and the hub has no Paystack secret set,
 * so a "Subscribe" button would take a person to a 503. Showing a price you
 * cannot yet be charged is honest; offering a checkout that fails is not.
 */

const INDIGO = colors.primary;

function WaitlistButton({
  onClick,
  variant = "solid",
  size = "md",
  label = "Join the Waitlist",
}: {
  onClick: () => void;
  variant?: "solid" | "light" | "outline";
  size?: "md" | "lg";
  label?: string;
}) {
  const styles =
    variant === "solid"
      ? { background: INDIGO, color: "#FFFFFF", border: `1px solid ${INDIGO}` }
      : variant === "light"
        ? { background: "#FFFFFF", color: INDIGO, border: `1px solid #FFFFFF` }
        : { background: "transparent", color: colors.heading, border: `1px solid ${colors.hairlineStrong}` };
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 font-semibold transition-opacity hover:opacity-90"
      style={{
        ...styles,
        padding: size === "lg" ? "16px 30px" : "13px 22px",
        fontSize: size === "lg" ? "16px" : "15px",
      }}
    >
      {label} <ArrowRight size={16} />
    </button>
  );
}

/** The price line. Free says "Free" rather than "₦0", which reads as a bill. */
function Price({ plan }: { plan: PalPlan }) {
  if (plan.amountKobo === 0) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: "38px", fontWeight: 300, color: colors.heading, letterSpacing: "-0.02em" }}>
          Free
        </span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: "38px", fontWeight: 300, color: colors.heading, letterSpacing: "-0.02em" }}>
          {naira(plan.amountKobo)}
        </span>
        <span style={{ fontSize: "15px", color: colors.textTertiary }}>
          {plan.perSeat ? "per person / month" : "per month"}
        </span>
      </div>
      {plan.usd !== null && (
        <p style={{ fontSize: "13.5px", color: colors.textTertiary, marginTop: 4 }}>
          About ${plan.usd} — billed in naira
          {plan.perSeat ? `, minimum ${plan.minSeats} people` : ""}
        </p>
      )}
    </div>
  );
}

function PlanCard({ plan, featured, onJoin }: { plan: PalPlan; featured: boolean; onJoin: () => void }) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: colors.surface,
        border: `1px solid ${featured ? INDIGO : colors.hairline}`,
        padding: "28px 26px 26px",
      }}
    >
      <div style={{ minHeight: 26 }}>
        {featured && (
          <span
            style={{
              background: "rgba(109,90,240,0.10)",
              color: INDIGO,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              padding: "4px 9px",
            }}
          >
            MOST PEOPLE START HERE
          </span>
        )}
      </div>

      <h2 style={{ fontSize: "22px", color: colors.heading, marginTop: 14, marginBottom: 4 }}>
        {plan.name}
      </h2>
      <p style={{ fontSize: "14.5px", color: colors.textSecondary, lineHeight: 1.55, marginBottom: 20 }}>
        {plan.tagline}
      </p>

      <Price plan={plan} />

      <div style={{ height: 1, background: colors.hairline, margin: "22px 0 20px" }} />

      <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.heading, marginBottom: 12 }}>
        {plan.best}
      </p>

      <ul className="flex flex-col gap-2.5" style={{ marginBottom: 26 }}>
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5" style={{ fontSize: "14.5px", color: colors.textSecondary, lineHeight: 1.5 }}>
            <Check size={16} strokeWidth={2.4} style={{ color: INDIGO, flexShrink: 0, marginTop: 2 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "auto" }}>
        <WaitlistButton onClick={onJoin} variant={featured ? "solid" : "outline"} />
      </div>
    </div>
  );
}

export function PalPricingPage() {
  const { setShowPalWaitlist } = useAuth();
  const join = () => setShowPalWaitlist(true);

  return (
    <div style={{ background: colors.bg }}>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ background: "#0E0B22", padding: "clamp(56px,7vw,88px) 24px clamp(48px,6vw,72px)" }}>
        <Reveal className="mx-auto text-center" style={{ maxWidth: 720 }}>
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(2.1rem,4.4vw,3.2rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 16,
            }}
          >
            Pay for a coworker,
            <br />
            not for software.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.74)", fontSize: "18px", lineHeight: 1.65 }}>
            One price a month, and Pal does the work. Start free, move up when
            you find yourself handing it more than it can carry.
          </p>
        </Reveal>
      </section>

      {/* ── PLANS ────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(48px,5vw,68px) 24px clamp(40px,4vw,56px)" }}>
        <div className="mx-auto grid gap-5 md:grid-cols-3" style={{ maxWidth: 1080 }}>
          {PAL_PLANS.map((plan, i) => (
            <Reveal key={plan.key} delay={i * 0.06}>
              <PlanCard plan={plan} featured={plan.key === "pro"} onJoin={join} />
            </Reveal>
          ))}
        </div>
        <p
          className="mx-auto text-center"
          style={{ maxWidth: 680, marginTop: 26, fontSize: "14px", color: colors.textTertiary, lineHeight: 1.65 }}
        >
          Prices are in naira and charged in naira. Pal is not open yet, so
          nothing is billed today — join the waitlist and these are the prices
          you will see when it is.
        </p>
      </section>

      {/* ── CREDITS ──────────────────────────────────────────────── */}
      <section style={{ background: colors.bgSubtle, padding: "clamp(52px,6vw,80px) 24px" }}>
        <div className="mx-auto" style={{ maxWidth: 900 }}>
          <Reveal className="text-center" style={{ maxWidth: 660, margin: "0 auto 32px" }}>
            <h2 style={{ marginBottom: 14 }}>When Pal spends money outside Pal.</h2>
            <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.7 }}>
              Your subscription pays for Pal. Credits pay for the things Pal does
              that cost real money somewhere else — putting an ad live on Meta or
              TikTok, publishing to a platform, generating media. Buy them when
              you need them; they do not expire.
            </p>
          </Reveal>

          <Reveal>
            <div style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                <thead>
                  <tr>
                    {["Bundle", "Credits", "Price", "Per credit"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i === 0 ? "left" : "right",
                          padding: "14px 20px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          color: colors.textTertiary,
                          borderBottom: `1px solid ${colors.hairline}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAL_CREDIT_BUNDLES.map((b) => (
                    <tr key={b.key}>
                      <td style={{ padding: "14px 20px", fontSize: "15px", fontWeight: 600, color: colors.heading, borderBottom: `1px solid ${colors.hairline}` }}>
                        {b.name}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "15px", color: colors.textSecondary, textAlign: "right", borderBottom: `1px solid ${colors.hairline}` }}>
                        {b.credits.toLocaleString("en-NG")}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "15px", color: colors.heading, textAlign: "right", borderBottom: `1px solid ${colors.hairline}`, whiteSpace: "nowrap" }}>
                        {naira(b.amountKobo)}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", color: colors.textTertiary, textAlign: "right", borderBottom: `1px solid ${colors.hairline}`, whiteSpace: "nowrap" }}>
                        {naira(Math.round(b.amountKobo / b.credits))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <p style={{ marginTop: 18, fontSize: "14px", color: colors.textTertiary, lineHeight: 1.65, textAlign: "center" }}>
            Credits are not your ad budget. What a platform charges to run your
            ad is paid to that platform, on your own account.
          </p>
        </div>
      </section>

      {/* ── WHAT EVERY PLAN INCLUDES ─────────────────────────────── */}
      <section style={{ padding: "clamp(52px,6vw,80px) 24px" }}>
        <div className="mx-auto" style={{ maxWidth: 900 }}>
          <Reveal className="text-center" style={{ maxWidth: 620, margin: "0 auto 30px" }}>
            <h2 style={{ marginBottom: 14 }}>The same Pal on every plan.</h2>
            <p style={{ color: colors.textSecondary, fontSize: "17px", lineHeight: 1.7 }}>
              Paying more does not unlock a smarter coworker. It buys you more
              room to use the one you already have.
            </p>
          </Reveal>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              "The full workspace: documents, files, tasks and rooms",
              "One library and one inbox, however many channels you connect",
              "Social publishing, scheduling and the shared inbox",
              "A coworker that remembers every conversation",
              "Your data stays yours, and you can export it",
              "Cancel whenever you like, from your account",
            ].map((f) => (
              <div key={f} className="flex gap-2.5" style={{ fontSize: "15px", color: colors.textSecondary, lineHeight: 1.6 }}>
                <Check size={17} strokeWidth={2.4} style={{ color: INDIGO, flexShrink: 0, marginTop: 3 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUESTIONS ────────────────────────────────────────────── */}
      <section style={{ background: colors.bgSubtle, padding: "clamp(52px,6vw,80px) 24px" }}>
        <div className="mx-auto flex flex-col gap-7" style={{ maxWidth: 760 }}>
          {[
            {
              q: "What is a token?",
              a: "Roughly a word. Reading a long document, drafting a report or holding a long conversation uses more of them. The monthly allowance on Pro is enough for most people to stop thinking about it.",
            },
            {
              q: "What happens when I run out?",
              a: "Pal tells you before it becomes a problem. You can move up a plan or wait for the month to turn over. Nothing you have made is locked away.",
            },
            {
              q: "Can I change plan later?",
              a: "Yes, up or down, from your account. A change takes effect on your next billing date.",
            },
            {
              q: "Why does Business have a three-person minimum?",
              a: "Because what it adds is shared: shared workspaces, a team inbox, roles. Below three people it is Pro with extra steps, and you would be paying more for less.",
            },
            {
              q: "Can I get a refund?",
              a: "Yes, within the terms of our refund policy. It covers subscriptions, unused credits and duplicate charges, and it is written in plain language.",
            },
          ].map((item) => (
            <Reveal key={item.q}>
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: colors.heading, marginBottom: 7 }}>
                {item.q}
              </h3>
              <p style={{ fontSize: "15.5px", color: colors.textSecondary, lineHeight: 1.75 }}>
                {item.a}
                {item.q.startsWith("Can I get a refund") && (
                  <>
                    {" "}
                    <Link to="/refund-policy" style={{ color: INDIGO, fontWeight: 600 }}>
                      Read the refund policy
                    </Link>
                    .
                  </>
                )}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CLOSING ──────────────────────────────────────────────── */}
      <section style={{ background: "#0E0B22", padding: "clamp(56px,6vw,84px) 24px" }}>
        <Reveal className="mx-auto text-center" style={{ maxWidth: 600 }}>
          <h2 style={{ color: "#FFFFFF", marginBottom: 14 }}>
            Pal is not open yet.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.74)", fontSize: "17px", lineHeight: 1.7, marginBottom: 26 }}>
            We are letting people in a few at a time so the first experience is
            the right one. Join the waitlist and we will bring you in as we open
            access.
          </p>
          <div className="mx-auto" style={{ maxWidth: 300 }}>
            <WaitlistButton onClick={join} variant="light" size="lg" />
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: 16 }}>
            <Link to="/products/pal" style={{ color: "rgba(255,255,255,0.72)" }}>
              Back to Pal
            </Link>
          </p>
        </Reveal>
      </section>
    </div>
  );
}
