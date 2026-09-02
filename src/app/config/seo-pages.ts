// Per-route SEO metadata, looked up by pathname and rendered once in RootLayout.
// Keeping it centralized means titles/descriptions/structured-data live in one
// place and unknown paths (404s) default to noindex.

import { organizationLd, websiteLd, softwareApplicationLd, breadcrumbLd, personLd, faqLd } from "./structured-data";
import { FOUNDER_IMAGE, FOUNDER_SOCIALS } from "./site";
import { PAL_PLANS } from "./pal-plans";

// Pal is the one product with published prices, so it is the one product
// whose schema can state them. Derived from the same array the pricing page
// renders, which is itself checked against the server on every build.
const PAL_PRICE_HIGH = String(
  Math.max(...PAL_PLANS.map((p) => p.amountKobo)) / 100,
);

export interface PageSeo {
  title: string;
  description: string;
  noindex?: boolean;
  type?: "website" | "article";
  /** Optional per-page OG/Twitter image (absolute or site-relative). */
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const productCrumb = (name: string, path: string) =>
  breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name, path },
  ]);

export const pageSeo: Record<string, PageSeo> = {
  "/": {
    // Health leads the title because it is what we rank for and what most of
    // the search volume is, but the description now names the whole portfolio.
    // The homepage stopped being a healthcare-only page; its metadata followed.
    title: "Software for Hospitals, Schools and the Teams Behind Them",
    description:
      "Loopital builds HMS7 for hospitals, Henholib for patients, Beacon for schools, Modus for facilities and Pal, the office of your AI coworker. Built in Nigeria.",
    jsonLd: [organizationLd, websiteLd],
  },
  "/products": {
    title: "Products: Hospital, Health, School and Facility Software",
    description:
      "Five products, one account: HMS7 for hospitals, Henholib for patients, Beacon for schools, Modus for facilities and Pal, the office of your AI coworker.",
    jsonLd: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]),
  },
  "/products/hms7": {
    title: "HMS7, Hospital Management System Software",
    description:
      "Hospital management software for patient records, appointments, billing, pharmacy and staff. Connected to the Henholib patient app. Free for 3 months.",
    image: "/media/clinic-team.jpg",
    jsonLd: [
      softwareApplicationLd({
        name: "HMS7",
        category: "HealthApplication",
        description:
          "Enterprise hospital management system for patient records, appointments, billing, staff, pharmacy, and compliance, connected to the Henholib patient app.",
        path: "/products/hms7",
        // No public price: HMS7 is sold on a contract after onboarding. An
        // invented one here would be the figure Google shows.
      }),
      productCrumb("HMS7", "/products/hms7"),
      faqLd([
        {
          q: "What does HMS7 cost?",
          a: "HMS7 is free for the first three months after a short demo, so a hospital can run it properly before deciding.",
        },
        {
          q: "Does HMS7 handle billing and insurance?",
          a: "Yes. Billing, insurance claims, pharmacy stock, staff scheduling and compliance are all part of the platform alongside patient records.",
        },
        {
          q: "How does HMS7 connect to patients?",
          a: "Through Henholib. Patients on Henholib book, message their care team and receive alerts from the same system the hospital runs.",
        },
      ]),
    ],
  },
  "/products/henholib": {
    title: "Henholib, Book Doctors, Hospital Search & Emergency Alerts",
    description:
      "Find a hospital, book a doctor, hold your records and raise an emergency alert from your phone. Free health app for patients in Nigeria and beyond.",
    image: "/media/family-newborn.jpg",
    jsonLd: [
      softwareApplicationLd({
        name: "Henholib",
        category: "HealthApplication",
        description:
          "Personal health app for hospital search, doctor consultations, care-team messaging, and emergency alerts, connected to hospitals running HMS7.",
        path: "/products/henholib",
        operatingSystem: "Android, iOS, Web",
        offer: { price: "0", currency: "NGN", description: "Free for patients. No card required." },
      }),
      productCrumb("Henholib", "/products/henholib"),
      faqLd([
        {
          q: "Is Henholib free?",
          a: "Yes. Anyone can sign up and use Henholib free to find hospitals, book consultations, hold their records and raise emergency alerts.",
        },
        {
          q: "How do I book a doctor on Henholib?",
          a: "Open Care, search by what you need treated or by the nearest hospital, pick a time and confirm. The booking lands in the hospital's own system if they run HMS7.",
        },
        {
          q: "What happens when I press the SOS button?",
          a: "Henholib shares your live location with responders and alerts the nearest Henholib hospital. You can choose medical, police or fire.",
        },
        {
          q: "Who can see my health records?",
          a: "You can. Records are yours, and a hospital sees them when you choose to share them, for example by showing your Henholib ID at the desk.",
        },
      ]),
    ],
  },
  // The Henholib research questionnaire. Indexed on purpose: we want people to
  // find it and answer it, and it is linked from campaigns that run off-site.
  // Pricing carries real prices, so it is indexed and described precisely:
  // people search for what a thing costs, and a vague description wastes the
  // one line we get in the result.
  "/products/pal/pricing": {
    title: "Pal Pricing and Plans",
    description:
      "What Pal costs: a free plan, Pro at NGN 35,000 a month, and Business at NGN 42,000 per person. Credits for ads and publishing are bought separately.",
    jsonLd: breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
      { name: "Pal", path: "/products/pal" },
      { name: "Pricing", path: "/products/pal/pricing" },
    ]),
  },
  "/refund-policy": {
    title: "Refund Policy",
    description:
      "When Loopital refunds you, how long it takes, and the few cases we cannot. Covers subscriptions, unused credits, duplicate charges and cancellations.",
    jsonLd: breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Refund Policy", path: "/refund-policy" },
    ]),
  },
  "/contribute": {
    title: "Help Us Build Henholib",
    description:
      "Tell us how you get healthcare today, or how your hospital runs. A few minutes of answers shape what Henholib and HMS7 become.",
    image: "/media/care-ward.jpg",
    jsonLd: breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Contribute", path: "/contribute" },
    ]),
  },
  "/products/pal": {
    title: "Pal, the Office of Your AI Coworker",
    description:
      "Pal Workspace is where your AI coworker works. A member of your team, not a tool you operate. Join the waitlist for early access.",
    image: "/media/pal-hero.png",
    jsonLd: [
      softwareApplicationLd({
        name: "Pal",
        category: "BusinessApplication",
        description:
          "The office of your AI coworker. A member of your team that drafts, researches, answers the inbox and runs the work you hand it.",
        path: "/products/pal",
        offerRange: { low: "0", high: PAL_PRICE_HIGH, currency: "NGN" },
      }),
      productCrumb("Pal", "/products/pal"),
    ],
  },
  "/products/beacon": {
    title: "Beacon, School Management Software for Africa",
    description:
      "Beacon is a complete educational-organization management system for admissions, students, staff, classes, timetables, grades, fees, and communication, for schools, colleges, and training institutions. Request a demo to see it with your own data.",
    image: "/media/school-students.jpg",
    jsonLd: [
      softwareApplicationLd({
        name: "Beacon",
        category: "BusinessApplication",
        description:
          "Educational-organization management system for admissions, students, staff, classes, timetables, grades, fees, and communication.",
        path: "/products/beacon",
      }),
      productCrumb("Beacon", "/products/beacon"),
    ],
  },
  // Modus had no entry here at all, which meant the default applied: noindex,
  // and absent from the generated sitemap. A whole product page invisible to
  // search for as long as that was true.
  "/products/modus": {
    title: "Modus, Facility and Asset Management Software",
    description:
      "Modus runs assets, maintenance, work orders, vendors and compliance across every site you operate. One register, one queue, one record. Join the waitlist.",
    image: "/media/tower-lagos.jpg",
    jsonLd: [
      softwareApplicationLd({
        name: "Modus",
        category: "BusinessApplication",
        description:
          "Facility management system for asset registers, planned and reactive maintenance, work orders, vendors and contracts, compliance and multi-site operations.",
        path: "/products/modus",
      }),
      productCrumb("Modus", "/products/modus"),
    ],
  },
  "/about": {
    title: "About Loopital, a Software Company Built in Nigeria",
    description:
      "Loopital is a Nigerian software company using technology and AI to solve Africa's most important problems, starting with how healthcare is delivered.",
    image: "/media/office-meeting.jpg",
    jsonLd: organizationLd,
  },
  "/insights": {
    title: "Health Tech News and Insights from Loopital",
    description:
      "Product news and engineering notes on hospital software, patient apps and AI, from the team building health technology across Africa.",
  },
  "/contact": {
    title: "Contact Loopital, Book a Hospital Software Demo",
    description:
      "Talk to the Loopital team about HMS7 for your hospital, Henholib for your patients, or a rollout of Modus or Beacon. Book a demo or send a message.",
  },
  "/tuamene.bestgod": {
    title: "Tuamene Bestgod, Founder & CEO of Loopital",
    description:
      "Tuamene Bestgod is the founder and CEO of Loopital, building AI and software for businesses and governments across Africa, and Henholib, connecting Nigeria's hospitals with a single patient health identity. Speaker, volunteer, and advocate for impact.",
    image: FOUNDER_IMAGE,
    jsonLd: [
      personLd({
        name: "Tuamene Bestgod",
        jobTitle: "Founder & CEO of Loopital",
        path: "/tuamene.bestgod",
        image: FOUNDER_IMAGE,
        description:
          "Founder and CEO of Loopital, a technology company building AI and software for businesses, corporations, and governments across Africa. Building Henholib to connect hospitals and give patients a single health identity. Public speaker and volunteer across innovation, education, environment, climate, and healthcare.",
        alumniOf: "Rivers State University",
        homeLocation: "Rivers State, Nigeria",
        knowsAbout: ["Artificial Intelligence", "Software Engineering", "Healthcare Technology", "Leadership", "Public Policy", "Innovation"],
        sameAs: FOUNDER_SOCIALS.map((s) => s.href),
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Tuamene Bestgod", path: "/tuamene.bestgod" },
      ]),
    ],
  },
  // The team onboarding portal. Internal, behind a login, and holding NDAs and
  // payroll data — indexing it would put a door to that in search results.
  "/onboarding": {
    title: "Team Onboarding",
    description: "Loopital team onboarding. Sign in to continue.",
    noindex: true,
  },
  // Paths that hold no content: the payment return leg, and the codename URLs
  // kept alive for old links and the printed company profile, which redirect to
  // the real product pages.
  //
  // These need an entry precisely because they have nothing to say. Without one
  // the default applies and they serve the raw index.html, which carries
  // "index, follow" and the homepage's title — five near-duplicate homepages
  // competing with the real one. "noindex, follow" drops them while still
  // passing any link equity through to where they redirect.
  //
  // They are no longer Disallow-ed in robots.txt, and that is deliberate: a
  // blocked crawl cannot read the noindex it is being asked to obey, so
  // Disallow is how a URL ends up indexed with no description at all.
  ...Object.fromEntries(
    [
      ["/payment/callback", "Payment"],
      ["/products/swift", "Swift"],
      ["/products/sart34", "Swift"],
      ["/products/stack62", "Pal"],
      ["/products/fms13", "Modus"],
      ["/products/edm73", "Beacon"],
    ].map(([path, name]) => [
      path,
      {
        title: name,
        description: "This page has moved. You are being redirected.",
        noindex: true,
      } satisfies PageSeo,
    ]),
  ),
  "/privacy": {
    title: "Privacy Policy",
    description: "How Loopital collects, uses and protects your information, including health data held in Henholib and HMS7.",
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms governing use of Loopital's website, products, and services.",
  },
};

const NOT_FOUND: PageSeo = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist. Explore Loopital's products and services instead.",
  noindex: true,
};

/** Resolve SEO config for a pathname; unknown paths get a noindex 404 default. */
export function getPageSeo(pathname: string): PageSeo {
  const key = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  if (pageSeo[key]) return pageSeo[key];
  return NOT_FOUND;
}
