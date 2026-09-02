/**
 * Human labels for the onboarding answer keys, and which of them are restricted.
 *
 * A copy of what src/app/config/onboarding-form.ts holds on the marketing side.
 * Zina is a separate app in the same repo and cannot import across that
 * boundary, so this is kept deliberately small: labels and the restricted list,
 * not the field definitions themselves. If a field is renamed there, its row
 * here stops matching and the key falls through as-is, which is ugly but never
 * wrong — it degrades to showing the raw key rather than mislabelling data.
 *
 * SENSITIVE_FIELDS is display-only. The server holds the authoritative copy in
 * server/onboarding.js and is what actually withholds the values.
 */
export const SENSITIVE_FIELDS = [
  "nin", "bvn", "tin", "idType", "idNumber",
  "bankName", "accountNumber", "accountName", "pfa", "rsaPin",
];

export const ONBOARDING_LABELS: Record<string, string> = {
  fullName: "Full legal name",
  preferredName: "Preferred name",
  dob: "Date of birth",
  gender: "Gender",
  maritalStatus: "Marital status",
  stateOfOrigin: "State of origin",
  phone: "Phone",
  altPhone: "Alternative phone",
  personalEmail: "Personal email",
  address: "Address",
  city: "City",
  stateOfResidence: "State of residence",
  role: "Role",
  roleOther: "Role (other)",
  startDate: "Start date",
  employmentType: "Engagement type",
  workMode: "Work mode",
  reportsTo: "Reports to",
  qualification: "Highest qualification",
  institution: "Institution",
  fieldOfStudy: "Field of study",
  yearsExperience: "Years of experience",
  previousEmployer: "Previous employer",
  linkedin: "LinkedIn",
  portfolio: "Portfolio",
  skills: "Strengths",
  nin: "NIN",
  bvn: "BVN",
  tin: "TIN",
  idType: "ID type",
  idNumber: "ID number",
  bankName: "Bank",
  accountNumber: "Account number",
  accountName: "Account name",
  pfa: "Pension Fund Administrator",
  rsaPin: "RSA PIN",
  emergencyName: "Emergency contact",
  emergencyRelationship: "Relationship",
  emergencyPhone: "Emergency phone",
  emergencyAddress: "Emergency address",
  nokName: "Next of kin",
  nokRelationship: "Next of kin relationship",
  nokPhone: "Next of kin phone",
  device: "Device",
  os: "Operating system",
  preferredEmail: "Preferred Loopital email",
  toolsNeeded: "Tools needed",
  accessibility: "Setup needs",
  ackHandbook: "Handbook acknowledgement",
  ackAccurate: "Accuracy acknowledgement",
  ackDataConsent: "NDPA data consent",
};
