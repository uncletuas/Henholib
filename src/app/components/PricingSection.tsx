import { useState } from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import fms13Logo from "../../imports/fms13_logo.png";
import hms7Logo from "../../imports/hms7_logo.png";
import sart34Logo from "../../imports/sart34_logo.png";
import stack62Logo from "../../imports/stack62_logo.png";

interface PricingSectionProps {
  onSelectPlan: (app: string, plan: string) => void;
}

const appPricing = [
  {
    id: "fms13",
    name: "FMS13",
    logo: fms13Logo,
    category: "Facility Management",
    accent: "#4F46E5",
    note: "Priced per location. Switch or cancel anytime.",
    plans: [
      {
        name: "Solo Site",
        price: 49,
        period: "month",
        description: "Single-location facilities management.",
        features: [
          "1 site / location",
          "Up to 3 users",
          "Asset register",
          "Work order management",
          "Email support",
        ],
      },
      {
        name: "Multi-Site",
        price: 99,
        period: "month",
        description: "For teams managing multiple locations.",
        features: [
          "Up to 5 sites",
          "Up to 15 users",
          "Everything in Solo Site",
          "Preventive maintenance scheduler",
          "Compliance checklists",
          "Priority support",
        ],
        highlight: true,
      },
      {
        name: "Enterprise",
        price: null,
        period: null,
        description: "Unlimited sites with custom onboarding.",
        features: [
          "Unlimited sites",
          "Unlimited users",
          "Everything in Multi-Site",
          "Custom reporting",
          "SLA guarantee",
          "Dedicated account manager",
        ],
      },
    ],
  },
  {
    id: "hms7",
    name: "HMS7",
    logo: hms7Logo,
    category: "Healthcare Management",
    accent: "#0891B2",
    note: "Priced per practitioner count. HIPAA-compliant on all plans.",
    plans: [
      {
        name: "Clinic",
        price: 69,
        period: "month",
        description: "Small clinics and solo practices.",
        features: [
          "Up to 3 practitioners",
          "Up to 5 admin users",
          "Patient records (EMR)",
          "Basic scheduling",
          "Standard billing",
        ],
      },
      {
        name: "Hospital",
        price: 149,
        period: "month",
        description: "Mid-size hospitals and health centres.",
        features: [
          "Up to 20 practitioners",
          "Unlimited admin users",
          "Everything in Clinic",
          "Insurance claims workflow",
          "Department-level scheduling",
          "Priority support",
        ],
        highlight: true,
      },
      {
        name: "Health Network",
        price: null,
        period: null,
        description: "Multi-facility health systems and networks.",
        features: [
          "Unlimited practitioners",
          "Multi-facility management",
          "Everything in Hospital",
          "Custom integrations",
          "Compliance audit tools",
          "Dedicated support",
        ],
      },
    ],
  },
  {
    id: "sart34",
    name: "SART34",
    logo: sart34Logo,
    category: "Retail Analytics",
    accent: "#D97706",
    note: "Priced per number of stores. POS integration included on all plans.",
    plans: [
      {
        name: "Single Store",
        price: 39,
        period: "month",
        description: "One store, complete retail analytics.",
        features: [
          "1 store",
          "Up to 5 users",
          "Sales performance dashboard",
          "Inventory tracking",
          "Weekly reports",
        ],
      },
      {
        name: "Retail Chain",
        price: 89,
        period: "month",
        description: "Multiple stores under one dashboard.",
        features: [
          "Up to 10 stores",
          "Up to 25 users",
          "Everything in Single Store",
          "Cross-store comparison reports",
          "Customer behaviour analytics",
          "Priority support",
        ],
        highlight: true,
      },
      {
        name: "Enterprise",
        price: null,
        period: null,
        description: "Large retail groups and franchises.",
        features: [
          "Unlimited stores",
          "Unlimited users",
          "Everything in Retail Chain",
          "Custom KPI dashboards",
          "API access",
          "Dedicated account manager",
        ],
      },
    ],
  },
  {
    id: "stack62",
    name: "STACK62",
    logo: stack62Logo,
    category: "Stack Control",
    accent: "#059669",
    note: "Priced per engineering team size. Linux support included on all plans.",
    plans: [
      {
        name: "Team",
        price: 59,
        period: "month",
        description: "Small engineering teams getting started.",
        features: [
          "Up to 5 engineers",
          "2 environments",
          "Infrastructure monitoring",
          "Basic deployment pipelines",
          "Audit logs (30 days)",
        ],
      },
      {
        name: "Scale",
        price: 129,
        period: "month",
        description: "Growing teams with complex infrastructure.",
        features: [
          "Up to 25 engineers",
          "Unlimited environments",
          "Everything in Team",
          "Role-based access controls",
          "Deployment approvals workflow",
          "Audit logs (1 year)",
          "Priority support",
        ],
        highlight: true,
      },
      {
        name: "Enterprise",
        price: null,
        period: null,
        description: "Large engineering orgs with custom needs.",
        features: [
          "Unlimited engineers",
          "Everything in Scale",
          "SSO / SAML integration",
          "Custom audit retention",
          "SLA guarantee",
          "Dedicated engineer support",
        ],
      },
    ],
  },
];

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [activeApp, setActiveApp] = useState("fms13");
  const app = appPricing.find((a) => a.id === activeApp)!;

  return (
    <section id="pricing" className="py-24" style={{ background: "#FFFFFF" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p style={{ color: "#4F46E5", fontSize: "14px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "12px" }}>
            PRICING
          </p>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "#0D0D1A",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            Each app has its own plan.
          </h2>
          <p className="mt-4 max-w-xl mx-auto" style={{ color: "#6B7280", fontSize: "17px", lineHeight: 1.7 }}>
            You only pay for the applications you use. Select an app below to see its pricing.
          </p>
        </motion.div>

        {/* App tab switcher */}
        <div className="flex justify-center mb-12">
          <div
            className="inline-flex gap-2 p-2 rounded-2xl flex-wrap justify-center"
            style={{ background: "#F7F7FB", border: "1px solid rgba(0,0,0,0.07)" }}
          >
            {appPricing.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveApp(a.id)}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: activeApp === a.id ? "#FFFFFF" : "transparent",
                  color: activeApp === a.id ? "#0D0D1A" : "#6B7280",
                  fontWeight: activeApp === a.id ? 600 : 400,
                  fontSize: "15px",
                  boxShadow: activeApp === a.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  border: activeApp === a.id ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
                }}
              >
                <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden" style={{ background: "#F7F7FB" }}>
                  <ImageWithFallback src={a.logo} alt={a.name} className="w-5 h-5 object-contain" />
                </div>
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected app pricing */}
        <motion.div
          key={activeApp}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <p style={{ color: "#9CA3AF", fontSize: "14px" }}>{app.note}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {app.plans.map((plan, i) => (
              <div
                key={plan.name}
                className="flex flex-col p-8 rounded-2xl"
                style={{
                  background: plan.highlight ? "#0D0D1A" : "#F7F7FB",
                  border: plan.highlight ? "none" : "1px solid rgba(0,0,0,0.07)",
                  position: "relative",
                }}
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: app.accent }}
                  >
                    Most popular
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: plan.highlight ? "#FFFFFF" : "#0D0D1A",
                      marginBottom: "6px",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p style={{ color: plan.highlight ? "#9CA3AF" : "#6B7280", fontSize: "14px" }}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1.5">
                      <span
                        style={{
                          fontSize: "44px",
                          fontWeight: 800,
                          color: plan.highlight ? "#FFFFFF" : "#0D0D1A",
                          letterSpacing: "-0.03em",
                          lineHeight: 1,
                        }}
                      >
                        ${plan.price}
                      </span>
                      <span style={{ color: plan.highlight ? "#9CA3AF" : "#6B7280", fontSize: "15px" }}>/ mo</span>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontSize: "32px",
                        fontWeight: 700,
                        color: plan.highlight ? "#FFFFFF" : "#0D0D1A",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Custom
                    </span>
                  )}
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span
                        className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: plan.highlight ? app.accent : app.accent }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          color: plan.highlight ? "#D1D5DB" : "#374151",
                          lineHeight: 1.6,
                        }}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelectPlan(app.name, plan.name)}
                  className="w-full py-3.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95 font-semibold"
                  style={{
                    background: plan.highlight ? app.accent : "#FFFFFF",
                    color: plan.highlight ? "#fff" : "#0D0D1A",
                    fontSize: "15px",
                    border: plan.highlight ? "none" : "1px solid rgba(0,0,0,0.1)",
                  }}
                >
                  {plan.price === null ? "Contact sales" : "Get started"}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
