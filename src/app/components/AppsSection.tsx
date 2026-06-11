import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import fms13Logo from "../../imports/fms13_logo.png";
import hms7Logo from "../../imports/hms7_logo.png";
import sart34Logo from "../../imports/sart34_logo.png";
import stack62Logo from "../../imports/stack62_logo.png";

interface AppsSectionProps {
  onDownload: (appName: string) => void;
  currentUser: { name: string; email: string } | null;
  onSignUp: () => void;
}

const apps = [
  {
    id: "fms13",
    name: "FMS13",
    logo: fms13Logo,
    category: "Facility Management Software",
    tagline: "Run every facility from one place.",
    description:
      "FMS13 is built for operations teams managing physical spaces — whether that's a single building or a portfolio of sites. Track assets, schedule maintenance, manage work orders, and stay audit-ready without juggling spreadsheets.",
    bullets: [
      "Asset register with lifecycle tracking",
      "Preventive maintenance scheduling",
      "Work order creation and dispatch",
      "Compliance checklist management",
      "Multi-site reporting dashboard",
    ],
    image: "https://images.unsplash.com/photo-1531972111231-7482a960e109?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBvZmZpY2UlMjBmYWNpbGl0eSUyMG1hbmFnZW1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3ODA5NTc4Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    platform: "Windows · macOS",
    version: "v1.3.0",
    accent: "#4F46E5",
    imageLeft: false,
  },
  {
    id: "hms7",
    name: "HMS7",
    logo: hms7Logo,
    category: "Healthcare Management System",
    tagline: "Patient care, precisely managed.",
    description:
      "HMS7 gives clinics, hospitals, and health networks a reliable system for patient records, scheduling, billing, and clinical workflows. Built to meet compliance standards and reduce administrative overhead so care teams can focus on what matters.",
    bullets: [
      "Electronic medical records (EMR)",
      "Appointment and resource scheduling",
      "Insurance claims and billing",
      "Clinical workflow management",
      "HIPAA-compliant data handling",
    ],
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxoZWFsdGhjYXJlJTIwaG9zcGl0YWwlMjBtZWRpY2FsJTIwc29mdHdhcmV8ZW58MXx8fHwxNzgwOTU3ODc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    platform: "Windows · macOS",
    version: "v0.7.2",
    accent: "#0891B2",
    imageLeft: true,
  },
  {
    id: "sart34",
    name: "SART34",
    logo: sart34Logo,
    category: "Retail Analytics Tool",
    tagline: "Know your numbers. Grow your store.",
    description:
      "SART34 turns your sales, inventory, and customer data into clear decisions. Designed for retailers who need real-time visibility into what's selling, what's sitting, and where revenue is being left on the table.",
    bullets: [
      "Real-time sales performance tracking",
      "Inventory level alerts and forecasting",
      "Customer purchasing behaviour analysis",
      "Promotion effectiveness reporting",
      "POS system integration",
    ],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRhaWwlMjBzdG9yZSUyMGFuYWx5dGljcyUyMGRhdGElMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzgwOTU3ODc5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    platform: "Windows · macOS",
    version: "v3.4.1",
    accent: "#D97706",
    imageLeft: false,
  },
  {
    id: "stack62",
    name: "STACK62",
    logo: stack62Logo,
    category: "Stack Control & Monitoring",
    tagline: "Full-stack visibility for engineering teams.",
    description:
      "STACK62 gives engineering and DevOps teams a single interface to monitor infrastructure, manage deployments, control team access, and maintain a complete audit trail. Built for teams that need accountability at every layer.",
    bullets: [
      "Real-time infrastructure monitoring",
      "Deployment pipeline management",
      "Role-based access controls",
      "Incident logs and audit history",
      "Multi-environment support",
    ],
    image: "https://images.unsplash.com/photo-1695668548342-c0c1ad479aee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxlbmdpbmVlcmluZyUyMHNlcnZlciUyMGluZnJhc3RydWN0dXJlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3ODA5NTc4Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    platform: "Windows · macOS · Linux",
    version: "v6.2.4",
    accent: "#059669",
    imageLeft: true,
  },
];

export function AppsSection({ onDownload, currentUser, onSignUp }: AppsSectionProps) {
  const handleDownloadClick = (appName: string) => {
    if (!currentUser) {
      onSignUp();
    } else {
      onDownload(appName);
    }
  };

  return (
    <section id="apps" className="py-24" style={{ background: "#FFFFFF" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <p style={{ color: "#4F46E5", fontSize: "14px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "12px" }}>
            OUR APPLICATIONS
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
            Four problems. Four dedicated solutions.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto" style={{ color: "#6B7280", fontSize: "17px", lineHeight: 1.7 }}>
            Each application is purpose-built for one industry. Download the one that fits your operation, activate it with your account, and get to work.
          </p>
        </motion.div>

        {/* App rows */}
        <div className="flex flex-col gap-32">
          {apps.map((app, i) => (
            <motion.div
              key={app.id}
              id={app.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${app.imageLeft ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              {/* Image */}
              <div className={app.imageLeft ? "lg:order-1" : ""}>
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    aspectRatio: "3/2",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
                  }}
                >
                  <ImageWithFallback
                    src={app.image}
                    alt={`${app.name} — ${app.category}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Category chip on image */}
                  <div
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0D0D1A" }}>{app.category}</span>
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div className={`flex flex-col gap-6 ${app.imageLeft ? "lg:order-2" : ""}`}>
                {/* App logo + name */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#F7F7FB" }}
                  >
                    <ImageWithFallback src={app.logo} alt={app.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <p
                      className="font-bold tracking-tight"
                      style={{ fontSize: "22px", color: "#0D0D1A", letterSpacing: "-0.01em" }}
                    >
                      {app.name}
                    </p>
                    <p style={{ fontSize: "13px", color: app.accent, fontWeight: 500 }}>{app.version}</p>
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                      fontWeight: 700,
                      color: "#0D0D1A",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      marginBottom: "12px",
                    }}
                  >
                    {app.tagline}
                  </h3>
                  <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.75 }}>
                    {app.description}
                  </p>
                </div>

                {/* Bullet list — text-only, no icons */}
                <ul className="flex flex-col gap-2.5">
                  {app.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span
                        className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: app.accent }}
                      />
                      <span style={{ color: "#374151", fontSize: "15px", lineHeight: 1.6 }}>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Platform + Download */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  <button
                    onClick={() => handleDownloadClick(app.name)}
                    className="px-7 py-3.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95 font-semibold"
                    style={{ background: app.accent, color: "#fff", fontSize: "15px" }}
                  >
                    Download {app.name}
                  </button>
                  <div>
                    <p style={{ color: "#9CA3AF", fontSize: "12px" }}>Available for</p>
                    <p style={{ color: "#374151", fontSize: "13px", fontWeight: 500 }}>{app.platform}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
