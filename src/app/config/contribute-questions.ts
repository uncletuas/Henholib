/**
 * The "Contribute to Henholib" question set.
 *
 * Kept as data rather than JSX so the form renders itself. The question set
 * will change as we learn what people actually answer, and editing a table is
 * a smaller act than editing a component. It is also what lets the backend
 * store answers in one jsonb column without a migration per question.
 */

export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "single"
  | "multi";

export interface Field {
  /** Stored as the key in the answers object, so keep it stable. */
  name: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /** Cap on a multi-select, per the spec's "up to 3". */
  max?: number;
  /** Show only when another field holds one of these values. */
  showIf?: { field: string; anyOf: string[] };
  /** Reveal a free-text box when this option is chosen. */
  otherFor?: string;
  help?: string;
}

export interface Step {
  title: string;
  fields: Field[];
}

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  "Outside Nigeria",
];

/** Shared closing steps. Identical on both paths. */
const CLOSING_STEPS: Step[] = [
  {
    title: "Anything else?",
    fields: [
      {
        name: "openFeedback",
        label: "Is there anything else you'd like to tell us?",
        help: "A frustration, an idea, a story. We're genuinely listening.",
        kind: "textarea",
      },
    ],
  },
];

export const INDIVIDUAL_STEPS: Step[] = [
  {
    title: "About you",
    fields: [
      { name: "name", label: "Full name", kind: "text", required: true, placeholder: "Ada Okafor" },
      { name: "email", label: "Email", kind: "email", required: true, placeholder: "you@example.com" },
      { name: "phone", label: "Phone number", kind: "tel", required: true, placeholder: "+234 800 000 0000" },
      { name: "location", label: "City or state", kind: "single", options: NIGERIAN_STATES },
      { name: "ageRange", label: "Age range", kind: "single", options: ["18-24", "25-34", "35-44", "45-54", "55+"] },
    ],
  },
  {
    title: "How you get care today",
    fields: [
      {
        name: "accessMethod",
        label: "How do you usually access healthcare today?",
        kind: "multi",
        options: [
          "Nearest hospital or clinic",
          "A trusted doctor",
          "Recommendations from family or friends",
          "Telemedicine or phone consultation",
          "Traditional or alternative medicine",
          "I delay going unless necessary",
        ],
      },
      {
        name: "frustrations",
        label: "What's most frustrating about getting care today?",
        help: "Pick up to three.",
        kind: "multi",
        max: 3,
        options: [
          "Long wait times",
          "Not knowing where to go",
          "Cost of care",
          "No insurance coverage",
          "Difficulty getting appointments",
          "Poor communication from hospital staff",
          "Lack of follow-up after treatment",
          "Managing medication",
          "Emergency response time",
        ],
      },
      {
        name: "coverage",
        label: "Do you currently have any of these?",
        kind: "single",
        options: ["Health insurance", "An HMO plan", "Neither, I pay directly"],
      },
      {
        name: "coverageProvider",
        label: "Which provider?",
        kind: "text",
        placeholder: "e.g. Hygeia, Reliance",
        showIf: { field: "coverage", anyOf: ["Health insurance", "An HMO plan"] },
      },
    ],
  },
  {
    title: "What would help most",
    fields: [
      {
        name: "wouldHelp",
        label: "What would make getting care easier for you?",
        help: "Pick up to three.",
        kind: "multi",
        max: 3,
        options: [
          "Booking appointments faster",
          "Knowing where to go instantly",
          "Managing my HMO or insurance in one place",
          "Fast help in an emergency",
          "Clear, upfront healthcare costs",
          "Medication reminders",
          "Having my health records in one place",
          "Telemedicine access",
        ],
      },
      {
        name: "likelihood",
        label: "How likely are you to use an app like Henholib?",
        kind: "single",
        options: ["Very likely", "Somewhat likely", "Not sure yet", "Unlikely"],
      },
      {
        name: "device",
        label: "What device do you mostly use?",
        kind: "single",
        options: ["Android smartphone", "iPhone", "Basic or feature phone", "Computer"],
      },
    ],
  },
  {
    title: "Getting involved",
    fields: [
      { name: "earlyAccess", label: "Want early access when we launch?", kind: "single", options: ["Yes", "Maybe later", "No thanks"] },
      { name: "willTest", label: "Would you test the app and give feedback before public launch?", kind: "single", options: ["Yes", "No"] },
      {
        name: "heardVia",
        label: "How did you hear about Henholib?",
        kind: "single",
        options: ["Social media", "Friend or family", "An event", "A hospital or clinic", "Search engine", "Other"],
        otherFor: "Other",
      },
    ],
  },
  ...CLOSING_STEPS,
];

export const ORGANIZATION_STEPS: Step[] = [
  {
    title: "About your organisation",
    fields: [
      { name: "organisation", label: "Facility or organisation name", kind: "text", required: true, placeholder: "St. Mary's Hospital" },
      { name: "name", label: "Your name", kind: "text", required: true, placeholder: "Dr Ada Okafor" },
      {
        name: "role",
        label: "Your role",
        kind: "single",
        options: ["Owner or Founder", "Medical Director", "Hospital Administrator", "IT or Operations Manager", "Doctor", "Nurse", "Other"],
        otherFor: "Other",
      },
      { name: "email", label: "Email", kind: "email", required: true, placeholder: "you@facility.com" },
      { name: "phone", label: "Phone number", kind: "tel", required: true, placeholder: "+234 800 000 0000" },
      { name: "location", label: "City or state", kind: "single", options: NIGERIAN_STATES },
      { name: "website", label: "Website", kind: "text", placeholder: "Optional" },
    ],
  },
  {
    title: "About the facility",
    fields: [
      {
        name: "facilityType",
        label: "What type of facility are you?",
        kind: "single",
        options: ["General Hospital", "Specialist Hospital or Clinic", "Primary Health Centre", "Diagnostic or Laboratory Centre", "Pharmacy", "Maternity Home", "Dental Clinic", "Eye Clinic", "Teaching Hospital", "Other"],
        otherFor: "Other",
      },
      { name: "ownership", label: "Are you private or public?", kind: "single", options: ["Private", "Public or government"] },
      { name: "branches", label: "How many locations or branches do you operate?", kind: "single", options: ["1", "2-5", "6+"] },
      { name: "beds", label: "How many beds does your facility have?", kind: "single", options: ["Under 20", "20-100", "100+", "Not applicable"] },
      { name: "dailyPatients", label: "How many patients do you see on an average day?", kind: "single", options: ["Under 30", "30-100", "100+"] },
      { name: "staffCount", label: "How many staff work at your facility?", kind: "single", options: ["1-10", "11-50", "51-200", "200+"] },
    ],
  },
  {
    title: "How you operate today",
    fields: [
      {
        name: "recordsToday",
        label: "How do you currently manage patient records?",
        kind: "single",
        options: ["Paper files", "Spreadsheets", "Existing software", "A mix of these"],
      },
      {
        name: "existingSoftware",
        label: "Which software?",
        kind: "text",
        placeholder: "Optional",
        showIf: { field: "recordsToday", anyOf: ["Existing software", "A mix of these"] },
      },
      {
        name: "billingToday",
        label: "How do you currently handle billing and payments?",
        kind: "multi",
        options: ["Cash", "Bank transfer", "POS or card", "HMO claims processing", "A mix of these"],
      },
      { name: "acceptsHmo", label: "Do you accept HMO or insurance patients?", kind: "single", options: ["Yes", "No", "Some plans only"] },
      {
        name: "slowdowns",
        label: "What slows your operations down the most?",
        help: "Pick up to three.",
        kind: "multi",
        max: 3,
        options: [
          "Long patient wait times",
          "Manual record-keeping",
          "Billing and payment tracking",
          "Staff coordination",
          "Prescription or pharmacy tracking",
          "Inventory or supply tracking",
          "Regulatory reporting",
          "Patient follow-up",
        ],
      },
      { name: "digitisation", label: "How digitised is your facility today?", kind: "single", options: ["Not at all", "A little", "Mostly", "Fully digitised"] },
    ],
  },
  {
    title: "Interest in HMS7",
    fields: [
      {
        name: "interest",
        label: "How interested are you in a system like HMS7?",
        kind: "single",
        options: ["Very interested, we need this now", "Interested, show me a demo", "Not sure yet", "Not interested"],
      },
      {
        name: "prioritie",
        label: "What would matter most to your facility?",
        help: "Pick up to three.",
        kind: "multi",
        max: 3,
        options: [
          "Faster patient processing",
          "Accurate, automated billing",
          "Digital patient records",
          "Better staff coordination",
          "Easier regulatory reporting",
          "Fewer errors",
          "Better patient experience",
        ],
      },
      { name: "freeTrial", label: "Would you be open to a free trial with hands-on support from our team?", kind: "single", options: ["Yes, definitely", "Maybe, tell me more", "Not right now"] },
      { name: "commitNeeds", label: "What would you need to see to commit to HMS7 long-term?", kind: "textarea" },
      { name: "decisionMakers", label: "Who else at your facility should be part of this decision?", kind: "textarea", placeholder: "e.g. Medical Director and IT lead" },
    ],
  },
  ...CLOSING_STEPS,
];
