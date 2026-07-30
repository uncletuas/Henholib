// Seeds the Loopital Academy course catalog. Idempotent: existing courses
// (matched by slug) are left untouched, so admin edits are never overwritten.
// Run after `npm run migrate`:  node scripts/seed-academy.mjs
//
// Reads cluster/secret ARNs from CDK outputs.json or CLUSTER_ARN / DB_SECRET_ARN.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { RDSDataClient, ExecuteStatementCommand } from "@aws-sdk/client-rds-data";

const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || "eu-north-1";
const DB_NAME = "loopital";

let clusterArn = process.env.CLUSTER_ARN;
let secretArn = process.env.DB_SECRET_ARN;

if (!clusterArn || !secretArn) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const outputs = JSON.parse(readFileSync(path.join(here, "..", "outputs.json"), "utf8"));
  const stack = outputs.LoopitalStack || Object.values(outputs)[0];
  clusterArn = clusterArn || stack.ClusterArn;
  secretArn = secretArn || stack.DbSecretArn;
}

if (!clusterArn || !secretArn) {
  console.error("Missing ClusterArn/DbSecretArn. Deploy first or set env vars.");
  process.exit(1);
}

const client = new RDSDataClient({ region });

// Track pricing (USD cents). Every course inherits its track's price.
const PRICE = { technical: 10000, business: 20000, public: 30000 };

// Curated, on-theme course cover images (Unsplash). Admin-editable per course.
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1080&q=80`;
const IMG = {
  "generative-ai-masterclass": U("photo-1677442136019-21780ecad995"),
  "software-development-with-ai": U("photo-1461749280684-dccba630e2f6"),
  "application-development-with-ai": U("photo-1531482615713-2afd69097998"),
  "ai-for-business-executives": U("photo-1552664730-d307ca884978"),
  "ai-for-marketing": U("photo-1460925895917-afdab827c52f"),
  "ai-for-research-and-planning": U("photo-1454165804606-c3d57bc86b40"),
  "ai-for-governance": U("photo-1529107386315-e1a2ed48a620"),
};

const INSTRUCTOR = {
  name: "Tuamene Bestgod",
  title: "Founder & CEO of Loopital",
  bio: "Tuamene Bestgod is the founder and CEO of Loopital, building AI and software for businesses, institutions, and governments across Africa. He teaches from real-world practice — shipping production AI systems and helping teams and leaders adopt them well.",
};

const courses = [
  {
    slug: "generative-ai-masterclass",
    title: "Generative AI Masterclass",
    track: "technical",
    status: "enrolling",
    shortDesc: "Go from zero to confidently using generative AI in your work — no prior experience needed.",
    fullDesc:
      "A practical, hands-on introduction to generative AI for professionals, entrepreneurs, students, and career-switchers. You'll understand how the tools actually work, learn to write prompts that get real results, and leave with an AI workflow you'll keep using long after the course ends.",
    whoFor: [
      "Professionals who want to work faster with AI",
      "Entrepreneurs and business owners",
      "Students and career-switchers",
      "Anyone with no prior AI experience",
    ],
    format: {
      duration: "4 weeks",
      cadence: "2 live sessions/week · 90 min each",
      commitment: "8 sessions · ~12 hours total",
      delivery: "Live online cohort",
      prerequisites: "None",
    },
    curriculum: [
      { week: 1, title: "Understanding Generative AI", desc: "What generative AI is in plain language, how large language models work without the math, and the current tool landscape across text, image, audio, and video — with live comparisons of outputs." },
      { week: 2, title: "Prompt Engineering Fundamentals", desc: "The anatomy of a strong prompt, iterating based on output, and the most common mistakes. Hands-on lab rewriting weak prompts into strong ones." },
      { week: 3, title: "Practical Applications", desc: "Using AI for writing, research, summarization, and basic workflow automation. Hands-on lab solving a real work task live." },
      { week: 4, title: "Your AI Toolkit & Capstone", desc: "Choosing the right tools for your role, ethics and limitations, and data-privacy basics. Capstone: present a personal or team AI workflow you'll use going forward." },
    ],
  },
  {
    slug: "software-development-with-ai",
    title: "Software Development with AI",
    track: "technical",
    status: "coming_soon",
    shortDesc: "Ship better software faster by making AI a dependable part of your development workflow.",
    fullDesc:
      "For developers and engineers who already write code, this course turns AI from a novelty into a reliable part of your workflow — from generating and reviewing code to catching the mistakes AI itself makes.",
    whoFor: [
      "Developers and software engineers",
      "CS students who already write code",
      "Engineers adopting AI tooling",
    ],
    format: {
      duration: "4 weeks",
      cadence: "2 live sessions/week · 2 hours each",
      commitment: "8 sessions · ~16 hours total",
      delivery: "Live online cohort",
      prerequisites: "Basic programming knowledge in any language",
    },
    curriculum: [
      { week: 1, title: "The AI-Assisted Development Landscape", desc: "Overview of tools (Claude Code, GitHub Copilot, Cursor), where AI fits in the dev lifecycle, setting up an AI-assisted environment, and prompting for code generation." },
      { week: 2, title: "Building Features End-to-End", desc: "Pair-programming with AI on a real feature, managing context across a multi-file project, and debugging with AI. Hands-on lab: build a feature from spec to working code." },
      { week: 3, title: "Testing, Review & Catching AI Mistakes", desc: "Common AI coding failure modes (hallucinated libraries/APIs, security gaps), using AI to write and properly review tests, and refactoring legacy code with AI." },
      { week: 4, title: "Capstone", desc: "Build and ship a small working application using AI tools at every stage. Present the project and process — what worked, what didn't, and what you'd change." },
    ],
  },
  {
    slug: "application-development-with-ai",
    title: "Application Development with AI",
    track: "technical",
    status: "coming_soon",
    shortDesc: "Turn an idea into a working app with AI — even without a traditional engineering background.",
    fullDesc:
      "For founders, product people, and non-technical or semi-technical builders, this course takes you from a business idea to a launched MVP using AI-assisted, no-code, and low-code tools.",
    whoFor: [
      "Founders and product people",
      "Non-technical and semi-technical builders",
      "Anyone who wants to build real apps without an engineering background",
    ],
    format: {
      duration: "4 weeks",
      cadence: "2 live sessions/week · 2 hours each",
      commitment: "8 sessions · ~16 hours total",
      delivery: "Live online cohort",
      prerequisites: "None — just comfort using a computer and willingness to experiment",
    },
    curriculum: [
      { week: 1, title: "The No-Code + AI Landscape & From Idea to Spec", desc: "AI-assisted app-building tools (Claude, Cursor, Replit), what's realistic to build this way, and turning a business idea into a spec AI can build from. Lab: write a spec for your own idea." },
      { week: 2, title: "Building Your First Working App", desc: "A live build from spec to a working interface, iterating with AI based on what you see, and common pitfalls when building without a plan." },
      { week: 3, title: "Data, Forms & Simple Backends", desc: "Connecting your app to data (forms, storage, simple databases) and handling user input safely. Lab: add a data-driven feature to your app." },
      { week: 4, title: "Testing, Deployment & Capstone", desc: "Getting real feedback before launching, deploying your app, and basic troubleshooting. Capstone: launch a working MVP of your own idea and present it." },
    ],
  },
  {
    slug: "ai-for-business-executives",
    title: "AI for Business Executives",
    track: "business",
    status: "enrolling",
    shortDesc: "Lead AI adoption in your organization with clarity — separating genuine capability from hype.",
    fullDesc:
      "A focused program for leaders and decision-makers who need to make smart AI decisions. You'll leave able to spot real opportunities, evaluate vendors without being sold to, and drive adoption responsibly.",
    whoFor: [
      "C-suite leaders and senior managers",
      "Business owners",
      "Institutional decision-makers",
      "Hospital and healthcare administrators",
    ],
    format: {
      duration: "3 weeks",
      cadence: "1 live session/week · 2 hours each",
      commitment: "3 sessions · ~6 hours total",
      delivery: "Live online cohort",
      prerequisites: "None",
    },
    curriculum: [
      { week: 1, title: "AI Literacy for Leaders", desc: "What AI can and cannot realistically do today, separating genuine capability from hype, and understanding the risk landscape — data, security, and reputational." },
      { week: 2, title: "Finding AI Opportunity in Your Organization", desc: "A simple framework for auditing where AI could save time or cost, prioritizing opportunities by impact and feasibility, with case discussion on real adoption in African businesses and institutions." },
      { week: 3, title: "Leading AI Adoption & Capstone", desc: "Change management and team buy-in, evaluating AI vendors and tools without being sold to, and governance basics. Capstone: leave with a one-page AI adoption roadmap for your organization." },
    ],
  },
  {
    slug: "ai-for-marketing",
    title: "AI for Marketing",
    track: "business",
    status: "coming_soon",
    shortDesc: "Build a practical AI marketing workflow — from content at scale to data-driven campaigns.",
    fullDesc:
      "For marketers and brand teams, this course builds a hands-on AI toolkit for content, creative, and campaign analysis while keeping your brand voice consistent.",
    whoFor: [
      "Marketers and brand managers",
      "Content and social media teams",
      "Small business owners",
    ],
    format: {
      duration: "4 weeks",
      cadence: "1 live session/week · 2 hours each",
      commitment: "4 sessions · ~8 hours total",
      delivery: "Live online cohort",
      prerequisites: "None",
    },
    curriculum: [
      { week: 1, title: "AI-Generated Content at Scale", desc: "Copywriting for ads, social posts, and email with AI while maintaining brand voice. Lab: generate a week's worth of content for a real brand." },
      { week: 2, title: "Visual & Video Content", desc: "AI image generation for marketing, AI video tools and where they fit today, and keeping visual brand consistency." },
      { week: 3, title: "Data-Driven Marketing", desc: "Using AI for audience insight and segmentation, personalization at scale, and campaign performance analysis." },
      { week: 4, title: "Your AI Marketing Workflow & Capstone", desc: "Choosing a practical tool stack for your team's size and budget. Capstone: present a full AI-assisted campaign plan, from content to analysis." },
    ],
  },
  {
    slug: "ai-for-research-and-planning",
    title: "AI for Research & Planning",
    track: "business",
    status: "coming_soon",
    shortDesc: "Use AI to research, analyze, and plan — responsibly and without fabricated findings.",
    fullDesc:
      "For analysts, planners, and academics, this course covers AI-assisted research, data analysis, scenario planning, and writing for decision-makers, with a strong emphasis on verifying AI-sourced information.",
    whoFor: [
      "Policy analysts",
      "NGO and development professionals",
      "Corporate strategy teams",
      "Academics and researchers",
    ],
    format: {
      duration: "4 weeks",
      cadence: "1 live session/week · 2 hours each",
      commitment: "4 sessions · ~8 hours total",
      delivery: "Live online cohort",
      prerequisites: "None",
    },
    curriculum: [
      { week: 1, title: "AI-Assisted Research Methods", desc: "Literature review and synthesis with AI, gathering and organizing data efficiently, and verifying AI-sourced information to avoid fabricated claims." },
      { week: 2, title: "Data Analysis & Visualization", desc: "Using AI tools to analyze datasets and build clear visualizations. Lab: turn a raw dataset into a clear visual summary." },
      { week: 3, title: "Scenario Planning & Forecasting", desc: "Using AI to model different future scenarios, the strengths and serious limitations of AI-assisted forecasting, and a case applied to a real planning problem." },
      { week: 4, title: "Writing, Presenting & Capstone", desc: "Drafting reports and briefs with AI assistance and structuring findings for decision-makers. Capstone: produce a research or planning brief on a topic relevant to your work." },
    ],
  },
  {
    slug: "ai-for-governance",
    title: "AI for Governance",
    track: "public",
    status: "coming_soon",
    shortDesc: "Help the public sector adopt AI to improve service delivery — responsibly and accountably.",
    fullDesc:
      "For government officials and public sector administrators, this course builds AI literacy for public service, covers real applications in service delivery, and grounds everything in ethics, regulation, and accountability.",
    whoFor: [
      "Government officials and policymakers",
      "Public sector administrators",
    ],
    format: {
      duration: "3 weeks",
      cadence: "1 live session/week · 2 hours each",
      commitment: "3 sessions · ~6 hours total",
      delivery: "Live online cohort",
      prerequisites: "None",
    },
    curriculum: [
      { week: 1, title: "AI Fundamentals for Public Service", desc: "AI literacy for non-technical public sector audiences, the global landscape of government AI adoption with real case studies, and where AI genuinely helps service delivery." },
      { week: 2, title: "AI Applications in Public Service Delivery", desc: "Citizen service delivery and case management, data-driven policy design, and resource-allocation and fraud-detection use cases, applied to a Nigerian public sector context." },
      { week: 3, title: "Governance, Ethics, Regulation & Capstone", desc: "Data privacy and citizen protection, and procurement guidance for evaluating AI vendors and systems. Capstone: draft a one-page AI adoption framework for a public sector function of your choice." },
    ],
  },
];

function param(name, raw) {
  if (raw === null || raw === undefined) return { name, value: { isNull: true } };
  return { name, value: { stringValue: String(raw) } };
}

async function run() {
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    const params = [
      param("slug", c.slug),
      param("title", c.title),
      param("image", IMG[c.slug] || null),
      param("track", c.track),
      param("short_desc", c.shortDesc),
      param("full_desc", c.fullDesc),
      param("who_for", JSON.stringify(c.whoFor)),
      param("curriculum", JSON.stringify(c.curriculum)),
      param("format", JSON.stringify(c.format)),
      param("price_cents", PRICE[c.track]),
      param("status", c.status),
      param("sort_order", i + 1),
      param("instructor_name", INSTRUCTOR.name),
      param("instructor_title", INSTRUCTOR.title),
      param("instructor_bio", INSTRUCTOR.bio),
    ];
    process.stdout.write(`Seeding: ${c.slug} ($${PRICE[c.track] / 100}, ${c.status})...\n`);
    await client.send(
      new ExecuteStatementCommand({
        resourceArn: clusterArn,
        secretArn,
        database: DB_NAME,
        sql: `INSERT INTO academy_courses
                (slug, title, image, track, short_desc, full_desc, who_for, curriculum, format,
                 price_cents, currency, status, published, sort_order,
                 instructor_name, instructor_title, instructor_bio)
              VALUES
                (:slug, :title, :image, :track, :short_desc, :full_desc, :who_for, :curriculum, :format,
                 :price_cents::int, 'USD', :status, true, :sort_order::int,
                 :instructor_name, :instructor_title, :instructor_bio)
              ON CONFLICT (slug) DO UPDATE SET image = COALESCE(academy_courses.image, EXCLUDED.image)`,
        parameters: params,
      })
    );
  }
  console.log("Academy seed complete.");
}

run().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
