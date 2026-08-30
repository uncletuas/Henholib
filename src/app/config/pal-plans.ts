/**
 * Pal's plans, credit bundles and limits — for display on the pricing page.
 *
 * THE AUTHORITY IS `server/app.js`, not this file. `PAL_PLANS` and
 * `BILLING_CATALOG.stack62` there are what Paystack actually charges; this is a
 * copy so the marketing page renders instantly instead of waiting on a cold
 * Render dyno to answer, which is the wrong trade for a page whose whole job is
 * to be read.
 *
 * A price shown here that differs from the price charged there is not a display
 * bug, it is a customer being quoted one number and billed another — next to a
 * refund policy, no less. `npm run check:pricing` compares the two files and
 * fails if they have drifted. Run it before shipping a price change, and change
 * both sides in the same commit.
 *
 * Amounts are kobo, matching the server, because Paystack charges in the
 * currency's subunit. Divide by 100 for naira; `naira()` does it for you.
 */

/** Kobo to a display string: 3500000 -> "₦35,000". */
export const naira = (kobo: number) =>
  "₦" + (kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 });

export interface PalPlan {
  key: string;
  name: string;
  /** Kobo per month. Zero for Free. */
  amountKobo: number;
  /** Display-only reference. Paystack charges NGN; foreign cards pay the NGN equivalent. */
  usd: number | null;
  /** Business is billed per seat, and will not sell fewer than `minSeats`. */
  perSeat: boolean;
  minSeats: number;
  tagline: string;
  /** The line that decides it for the person reading. */
  best: string;
  features: string[];
}

export const PAL_PLANS: PalPlan[] = [
  {
    key: "free",
    name: "Free",
    amountKobo: 0,
    usd: 0,
    perSeat: false,
    minSeats: 1,
    tagline: "Enough to see whether Pal is any good.",
    best: "For trying it out.",
    features: [
      "5 messages a day",
      "50,000 tokens a day",
      "The full workspace: documents, files, tasks",
      "One person",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    amountKobo: 3500000,
    usd: 25,
    perSeat: false,
    minSeats: 1,
    tagline: "Pal, without having to ration it.",
    best: "For one person who wants the work handled.",
    features: [
      "Unlimited messages",
      "3,000,000 tokens a month",
      "Social, inbox and scheduling",
      "Your coworker remembers everything",
      "One person",
    ],
  },
  {
    key: "business",
    name: "Business",
    amountKobo: 4200000,
    usd: 30,
    perSeat: true,
    minSeats: 3,
    tagline: "One coworker the whole team can hand work to.",
    best: "For teams who share the same work.",
    features: [
      "Everything in Pro, per person",
      "5,000,000 tokens per person, per month",
      "Shared workspaces, files and rooms",
      "Team inbox and shared social accounts",
      "Roles and permissions",
    ],
  },
];

export interface CreditBundle {
  key: string;
  name: string;
  amountKobo: number;
  credits: number;
}

/**
 * Credits are separate from the subscription on purpose.
 *
 * A subscription pays for Pal. Credits pay for the things Pal does that cost
 * real money outside this company — putting an ad live on Meta or TikTok,
 * publishing to a platform, generating media. Bundling those into a flat fee
 * would mean either capping them somewhere arbitrary or absorbing a bill we do
 * not control.
 */
export const PAL_CREDIT_BUNDLES: CreditBundle[] = [
  { key: "starter", name: "Starter", amountKobo: 500000, credits: 100 },
  { key: "growth", name: "Growth", amountKobo: 1200000, credits: 300 },
  { key: "pro", name: "Pro", amountKobo: 3000000, credits: 800 },
  { key: "business", name: "Business", amountKobo: 8500000, credits: 2500 },
  { key: "scale", name: "Scale", amountKobo: 18000000, credits: 6000 },
];
