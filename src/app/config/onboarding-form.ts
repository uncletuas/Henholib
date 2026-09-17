/**
 * The nine-step onboarding form.
 *
 * ⚠ DERIVED, NOT TRANSCRIBED. The portal spec names a companion document,
 * `Loopital_Onboarding_Form_Spec.md`, as the field-by-field authority. That file
 * was not supplied. These fields are derived from the nine section names in the
 * spec's summary table plus what a Nigerian company actually needs to pay
 * someone and put them on a payroll — NIN, BVN, TIN, PFA and RSA PIN are the
 * standard set, not invented.
 *
 * They are deliberately data rather than JSX so correcting them against the real
 * spec is an edit to this table and nothing else. Check them before anyone
 * relies on the payroll and statutory steps.
 *
 * Same shape as contribute-questions.ts on purpose: one Field type in this
 * codebase, one renderer, one set of behaviours.
 */

export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "textarea"
  | "single"
  | "multi"
  // A single tick that stores boolean `true`. The acknowledgements were
  // "single" selects with one option, which stored the string "I agree" while
  // the server checked for `true` — so the form let you through and the API
  // refused, with nothing the person could do about it.
  | "consent";

export interface Field {
  /** Key in the answers object. Stable — the server stores answers by this. */
  name: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  placeholder?: string;
  help?: string;
  required?: boolean;
  /** Show only when another field holds one of these values. */
  showIf?: { field: string; anyOf: string[] };
  /** Marks a field as payroll or identification data, which Zina hides from
   *  admins without the finance permission. The server enforces it too. */
  sensitive?: boolean;
}

export interface Step {
  title: string;
  intro?: string;
  fields: Field[];
}

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

/** Kept in step with server/onboarding.js ROLES — the NDA signature uses the
 *  same list, and a role that differs between the two makes the agreement and
 *  the personnel record disagree about the same person. */
export const ROLES = [
  "Chief Executive Officer",
  "Chief Operating Officer",
  "Finance & Administration Lead",
  "Head of Engineering",
  "Software Engineer",
  "Product Designer",
  "Product Manager",
  "Marketing & Growth",
  "Sales & Partnerships",
  "Customer Support",
  "Operations",
  "Intern",
  "Other",
];

export const ONBOARDING_STEPS: Step[] = [
  {
    title: "Personal information",
    intro: "The basics, as they appear on your official documents.",
    fields: [
      { name: "fullName", label: "Full legal name", kind: "text", required: true, placeholder: "As it appears on your ID" },
      { name: "preferredName", label: "What we should call you", kind: "text", placeholder: "The name you actually go by" },
      { name: "dob", label: "Date of birth", kind: "date" },
      { name: "gender", label: "Gender", kind: "single", options: ["Female", "Male", "Prefer not to say"] },
      { name: "maritalStatus", label: "Marital status", kind: "single", options: ["Single", "Married", "Prefer not to say"] },
      { name: "stateOfOrigin", label: "State of origin", kind: "single", options: NIGERIAN_STATES },
    ],
  },
  {
    title: "Contact information",
    intro: "How we reach you, and where you are.",
    fields: [
      { name: "phone", label: "Phone number", kind: "tel", required: true, placeholder: "+234 800 000 0000" },
      { name: "altPhone", label: "Alternative phone", kind: "tel", placeholder: "Optional" },
      { name: "personalEmail", label: "Personal email", kind: "email", help: "Separate from your Loopital address, for anything HR-related." },
      { name: "address", label: "Residential address", kind: "textarea", placeholder: "Street, area" },
      { name: "city", label: "City or town", kind: "text" },
      { name: "stateOfResidence", label: "State of residence", kind: "single", options: NIGERIAN_STATES },
    ],
  },
  {
    title: "Your role at Loopital",
    fields: [
      { name: "role", label: "Role", kind: "single", options: ROLES, required: true },
      { name: "roleOther", label: "Tell us your role", kind: "text", showIf: { field: "role", anyOf: ["Other"] } },
      { name: "startDate", label: "Start date", kind: "date" },
      { name: "employmentType", label: "Engagement type", kind: "single", options: ["Full-time", "Part-time", "Contract", "Internship", "Volunteer"] },
      { name: "workMode", label: "How you will mostly work", kind: "single", options: ["On-site", "Remote", "Hybrid"] },
      { name: "reportsTo", label: "Who you report to", kind: "text", placeholder: "If you know" },
    ],
  },
  {
    title: "Professional background",
    intro: "Enough for us to know what you bring. Not a CV.",
    fields: [
      { name: "qualification", label: "Highest qualification", kind: "single", options: ["Secondary school", "OND / NCE", "HND", "Bachelor's degree", "Master's degree", "Doctorate", "Self-taught"] },
      { name: "institution", label: "Institution", kind: "text" },
      { name: "fieldOfStudy", label: "Field of study", kind: "text" },
      { name: "yearsExperience", label: "Years of relevant experience", kind: "single", options: ["Under 1", "1-3", "3-5", "5-10", "10+"] },
      { name: "previousEmployer", label: "Most recent employer", kind: "text", placeholder: "Optional" },
      { name: "linkedin", label: "LinkedIn", kind: "text", placeholder: "Optional" },
      { name: "portfolio", label: "Portfolio, GitHub or website", kind: "text", placeholder: "Optional" },
      { name: "skills", label: "What are you strongest at?", kind: "textarea", help: "A few lines is plenty." },
    ],
  },
  {
    title: "Identification and statutory details",
    intro:
      "Required to put you on payroll and meet statutory obligations. Only the Finance & Administration Lead and the CEO can see this section.",
    fields: [
      { name: "nin", label: "National Identification Number (NIN)", kind: "text", sensitive: true, placeholder: "11 digits" },
      { name: "bvn", label: "Bank Verification Number (BVN)", kind: "text", sensitive: true, placeholder: "11 digits" },
      { name: "tin", label: "Tax Identification Number (TIN)", kind: "text", sensitive: true, placeholder: "If you have one" },
      { name: "idType", label: "Which ID will you provide?", kind: "single", sensitive: true, options: ["National ID card", "International passport", "Driver's licence", "Voter's card"] },
      { name: "idNumber", label: "ID document number", kind: "text", sensitive: true },
    ],
  },
  {
    title: "Payroll details",
    intro: "Where your salary goes. Same access restriction as the previous step.",
    fields: [
      { name: "bankName", label: "Bank", kind: "text", sensitive: true, placeholder: "e.g. GTBank" },
      { name: "accountNumber", label: "Account number", kind: "text", sensitive: true, placeholder: "10 digits" },
      { name: "accountName", label: "Account name", kind: "text", sensitive: true, help: "Must match the name on the account exactly." },
      { name: "pfa", label: "Pension Fund Administrator", kind: "text", sensitive: true, placeholder: "If you have one" },
      { name: "rsaPin", label: "RSA PIN", kind: "text", sensitive: true, placeholder: "If you have one" },
    ],
  },
  {
    title: "Emergency contact and next of kin",
    intro: "The person we call if something happens. Please make sure they know.",
    fields: [
      { name: "emergencyName", label: "Emergency contact name", kind: "text", required: true },
      { name: "emergencyRelationship", label: "Relationship to you", kind: "text", placeholder: "e.g. sister, friend" },
      { name: "emergencyPhone", label: "Emergency contact phone", kind: "tel", required: true },
      { name: "emergencyAddress", label: "Their address", kind: "textarea", placeholder: "Optional" },
      { name: "nokName", label: "Next of kin name", kind: "text", help: "Leave blank if this is the same person as above." },
      { name: "nokRelationship", label: "Next of kin relationship", kind: "text" },
      { name: "nokPhone", label: "Next of kin phone", kind: "tel" },
    ],
  },
  {
    title: "IT and equipment",
    intro: "So your access and your kit are ready before your first day.",
    fields: [
      { name: "device", label: "What will you work on?", kind: "single", options: ["My own laptop", "I need a company laptop", "Desktop", "Mainly my phone"] },
      { name: "os", label: "Operating system", kind: "single", options: ["Windows", "macOS", "Linux", "Not sure"] },
      { name: "preferredEmail", label: "Preferred Loopital email address", kind: "text", placeholder: "firstname@loopital.com" },
      {
        name: "toolsNeeded",
        label: "Which tools will you need access to?",
        kind: "multi",
        options: ["GitHub", "Zina admin portal", "Design tools", "Analytics", "Customer support inbox", "Social accounts", "Accounting"],
      },
      { name: "accessibility", label: "Anything we should set up to make work easier for you?", kind: "textarea", help: "Equipment, software, working arrangements. Optional, and it stays with the admin team." },
    ],
  },
  {
    title: "Acknowledgements",
    intro: "Three confirmations, and you are done.",
    fields: [
      {
        name: "ackHandbook",
        label: "I understand I am expected to read the Loopital Handbook, and to raise anything in it I disagree with.",
        kind: "consent",
        
        required: true,
      },
      {
        name: "ackAccurate",
        label: "The information I have given here is accurate to the best of my knowledge.",
        kind: "consent",
        
        required: true,
      },
      {
        name: "ackDataConsent",
        label:
          "I consent to Loopital Limited holding and processing this information for employment and statutory purposes, under the Nigeria Data Protection Act 2023.",
        kind: "consent",
        
        required: true,
      },
    ],
  },
];

/** Field names the server and Zina treat as restricted. Derived from the table
 *  above so the two can never disagree about what counts as sensitive. */
export const SENSITIVE_FIELDS: string[] = ONBOARDING_STEPS.flatMap((s) =>
  s.fields.filter((f) => f.sensitive).map((f) => f.name),
);
