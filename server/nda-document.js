"use strict";

/**
 * The Non-Disclosure and Confidentiality Agreement, as structured content.
 *
 * This is the single source for both renderings. The portal fetches it and
 * shows it on screen; the PDF generator walks the same array. That is the whole
 * point of keeping it here rather than as a PDF asset plus a copy of the text
 * in the frontend: with two sources, the document a person reads and the
 * document they sign can drift apart, and for an agreement that Clause 11.7
 * gives the force of a handwritten signature, that is not an acceptable class
 * of bug.
 *
 * Transcribed from Loopital_NDA.pdf (4 pages, Loopital letterhead). The text is
 * unchanged. If the agreement is ever amended, amend it here and the on-screen
 * copy, the generated PDF and the read-confirmation gate all move together.
 */

const NDA_VERSION = "2026-01";

const NDA_TITLE = "NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT";
const NDA_SUBTITLE = "Loopital Limited · Team Member Agreement";

const NDA_PREAMBLE = [
  'THIS AGREEMENT is made on the Effective Date stated at signature.',
  'BETWEEN: LOOPITAL LIMITED, a company incorporated under the laws of the Federal Republic of Nigeria, having its principal place of business in Nigeria (the "Company"), of the one part;',
  'AND: the Recipient identified at signature (the "Recipient"), of the other part.',
  'The Company and the Recipient are together referred to as the "Parties" and individually as a "Party".',
  "WHEREAS the Company is engaged in the design, development, and commercialisation of software products and technology services, including but not limited to healthcare, facility management, education, and workplace productivity platforms;",
  "AND WHEREAS in the course of the Recipient's engagement with the Company, the Recipient will have access to confidential and proprietary information belonging to the Company, its clients, its partners, and third parties;",
  "NOW THEREFORE the Parties agree as follows:",
];

/**
 * Clauses. `text` entries are paragraphs; `bullets` render as a list.
 * Numbering is part of the content because the agreement cross-references it
 * (Clause 11.7 on electronic execution, Clause 11.8 on survival).
 */
const NDA_CLAUSES = [
  {
    heading: "1. DEFINITION OF CONFIDENTIAL INFORMATION",
    text: [
      '1.1 "Confidential Information" means any and all information, in any form or medium, whether or not marked as confidential, disclosed to or accessed by the Recipient in connection with their engagement with the Company, including without limitation:',
    ],
    bullets: [
      "Source code, software architecture, algorithms, databases, technical documentation, system designs, and development methodologies relating to Henholib, HMS7, Modus, Pal Workspace, Beacon, and any other current or future Company product;",
      "Patient data, health records, personal data, and any information relating to identifiable individuals accessed through Company systems;",
      "Client, customer, hospital, school, and partner information, including identities, agreements, negotiations, pricing, and any data belonging to such parties;",
      "Business plans, product roadmaps, strategy documents, market research, pricing models, financial records, projections, valuations, and investor communications;",
      "Trade secrets, know-how, inventions, designs, processes, and any intellectual property owned or licensed by the Company;",
      "Employee and team information, including compensation, equity arrangements, personnel records, and internal organisational matters;",
      "Any information which, by its nature or the circumstances of its disclosure, would reasonably be understood to be confidential.",
    ],
  },
  {
    heading: "2. EXCLUSIONS",
    text: [
      "2.1 Confidential Information does not include information which: (a) is or becomes publicly available through no breach of this Agreement by the Recipient; (b) was lawfully known to the Recipient prior to disclosure by the Company, as evidenced by written records; (c) is lawfully received from a third party without restriction and without breach of any obligation of confidence; or (d) is independently developed by the Recipient without reference to or use of the Confidential Information.",
      "2.2 The burden of establishing that any information falls within an exclusion under Clause 2.1 rests with the Recipient.",
    ],
  },
  {
    heading: "3. OBLIGATIONS OF THE RECIPIENT",
    text: [
      "3.1 The Recipient shall hold all Confidential Information in strict confidence and shall not disclose, publish, or otherwise make available any Confidential Information to any third party without the prior written consent of the Company.",
      "3.2 The Recipient shall use Confidential Information solely for the purpose of performing their duties for the Company, and for no other purpose whatsoever, including no personal, commercial, academic, or competitive purpose.",
      "3.3 The Recipient shall exercise at least the same degree of care in protecting Confidential Information as they would exercise in protecting their own confidential information, and in no event less than a reasonable standard of care.",
      "3.4 The Recipient shall access only such Confidential Information as is necessary for the performance of their duties, and shall not access, view, copy, or extract any records, including patient or personal data, for which they have no legitimate work-related purpose.",
      "3.5 The Recipient shall not remove, copy, transmit, or store Confidential Information on any personal device, personal account, external storage medium, or third-party service, except where expressly authorised in writing by the Company.",
      "3.6 The Recipient shall immediately notify the Company upon becoming aware of any actual or suspected unauthorised disclosure, loss, theft, or misuse of Confidential Information, whether caused by the Recipient or any other person.",
    ],
  },
  {
    heading: "4. DATA PROTECTION AND HEALTH INFORMATION",
    text: [
      "4.1 The Recipient acknowledges that the Company processes sensitive personal data, including health data, and that such processing is governed by the Nigeria Data Protection Act 2023 and any successor or related legislation.",
      "4.2 The Recipient shall comply fully with all applicable data protection laws, the Company's internal data handling policies, and any instructions issued by the Company regarding the processing of personal or health data.",
      "4.3 The Recipient acknowledges that unauthorised access to, disclosure of, or misuse of health data may constitute a criminal offence and may result in personal liability in addition to any action taken by the Company.",
    ],
  },
  {
    heading: "5. INTELLECTUAL PROPERTY",
    text: [
      "5.1 All intellectual property, including but not limited to software, source code, designs, documentation, inventions, improvements, processes, and works of authorship, created by the Recipient in the course of their engagement with the Company, or created using Company resources, Company time, or Confidential Information, shall be the sole and exclusive property of the Company.",
      "5.2 The Recipient hereby assigns to the Company all right, title, and interest in and to such intellectual property, and agrees to execute any further documents reasonably required to give effect to such assignment.",
      "5.3 The Recipient waives all moral rights in such works to the fullest extent permitted by law.",
    ],
  },
  {
    heading: "6. RETURN OF MATERIALS",
    text: [
      "6.1 Upon termination of the Recipient's engagement with the Company, or upon written request by the Company at any time, the Recipient shall immediately return to the Company all documents, devices, records, files, and materials containing or derived from Confidential Information, and shall permanently delete all electronic copies within their possession or control.",
      "6.2 The Recipient shall, if requested, provide written confirmation of compliance with Clause 6.1.",
    ],
  },
  {
    heading: "7. NON-CIRCUMVENTION",
    text: [
      "7.1 During the term of engagement and for a period of twelve (12) months thereafter, the Recipient shall not use Confidential Information to solicit, divert, or interfere with any client, customer, hospital, school, partner, supplier, or investor of the Company with whom the Recipient had contact or about whom the Recipient obtained Confidential Information.",
      "7.2 Nothing in this Clause shall be construed to prevent the Recipient from lawfully seeking or accepting alternative employment.",
    ],
  },
  {
    heading: "8. DURATION",
    text: [
      "8.1 The obligations of confidentiality under this Agreement shall commence on the Effective Date and shall continue for the duration of the Recipient's engagement with the Company and for a period of five (5) years following its termination, howsoever arising.",
      "8.2 Notwithstanding Clause 8.1, obligations relating to trade secrets and to personal and health data shall continue indefinitely, for so long as such information retains its confidential character or for so long as required by applicable law, whichever is longer.",
    ],
  },
  {
    heading: "9. NO LICENCE OR WARRANTY",
    text: [
      "9.1 Nothing in this Agreement grants the Recipient any right, title, licence, or interest in or to any Confidential Information or intellectual property of the Company, save the limited right to use such information strictly for the performance of their duties.",
    ],
  },
  {
    heading: "10. REMEDIES",
    text: [
      "10.1 The Recipient acknowledges that any breach of this Agreement may cause irreparable harm to the Company for which monetary damages alone would be an inadequate remedy.",
      "10.2 Accordingly, the Company shall be entitled to seek injunctive relief and specific performance, in addition to any other remedies available at law or in equity, without the necessity of posting bond or proving actual damages.",
    ],
  },
  {
    heading: "11. GENERAL PROVISIONS",
    text: [
      "11.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
      "11.2 Jurisdiction. The Parties submit to the exclusive jurisdiction of the courts of the Federal Republic of Nigeria in respect of any dispute arising out of or in connection with this Agreement.",
      "11.3 Severability. If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid provision shall be replaced by a valid provision which most closely reflects the original intention.",
      "11.4 Entire Agreement. This Agreement constitutes the entire agreement between the Parties in respect of its subject matter and supersedes all prior discussions, representations, and agreements, whether written or oral.",
      "11.5 Amendment. No amendment or variation of this Agreement shall be effective unless made in writing and signed by both Parties.",
      "11.6 No Waiver. Failure or delay by either Party in exercising any right under this Agreement shall not constitute a waiver of that right.",
      "11.7 Electronic Execution. The Parties agree that this Agreement may be executed electronically, and that an electronic signature, including a typed signature, drawn signature, or uploaded signature image applied through the Company's onboarding platform, shall have the same legal force and effect as a handwritten signature. The Parties further agree that an electronically stored copy of this Agreement shall be admissible as evidence of its terms.",
      "11.8 Survival. Clauses 1, 3, 4, 5, 6, 7, 8, 10, and 11 shall survive the termination of this Agreement.",
    ],
  },
  {
    heading: "12. ACKNOWLEDGEMENT",
    text: [
      "12.1 The Recipient confirms that they have read this Agreement in full, have had the opportunity to seek independent legal advice, and understand and accept its terms.",
      "12.2 The Recipient acknowledges that this Agreement is entered into freely and voluntarily.",
      "IN WITNESS WHEREOF the Parties have executed this Agreement on the date first written above.",
    ],
  },
];

const NDA_FOOTER = "www.loopital.com   ·   info@loopital.com   ·   +234 705 939 9170";

const COMPANY_SIGNATORY = {
  name: "BestGod Tuamene",
  title: "Chief Executive Officer",
  company: "Loopital Limited",
};

module.exports = {
  NDA_VERSION,
  NDA_TITLE,
  NDA_SUBTITLE,
  NDA_PREAMBLE,
  NDA_CLAUSES,
  NDA_FOOTER,
  COMPANY_SIGNATORY,
};
