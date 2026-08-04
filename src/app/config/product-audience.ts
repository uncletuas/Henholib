// Needs-first framing for each product: who it's for + the problem it solves.
// Drives the compact, audience-oriented ecosystem cards on the home/products
// pages (so visitors self-select by their need, not by scanning a product list).
export const productAudience: Record<string, { audience: string; need: string }> = {
  henholib: {
    audience: "For patients & individuals",
    need: "Find hospitals, book doctors, message your care team, and handle emergencies — your whole health, in your pocket.",
  },
  fms13: {
    audience: "For facility managers",
    need: "Maintenance, assets, work orders, and vendors under control across every building and site.",
  },
  hms7: {
    audience: "For hospitals & clinics",
    need: "Patient records, billing, pharmacy, and staff — the operating system that runs your hospital.",
  },
  edm73: {
    audience: "For schools & institutions",
    need: "Admissions, students, grades, timetables, and fees — one platform to run your school end to end.",
  },
  stack62: {
    audience: "For teams & knowledge work",
    need: "An AI coworker for research, content, and workflow automation, so your team works at a higher level.",
  },
  sart34: {
    audience: "For marketers & sales",
    need: "AI-powered advertising and CRM in one intelligent workspace — win attention and keep relationships.",
  },
};
