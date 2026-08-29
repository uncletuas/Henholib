import { useState } from "react";
import { X, ArrowRight, Layers, Check } from "lucide-react";
import { colors, gradientBrand } from "../lib/brand";

/**
 * First-run "what this account is" note, shown once to new users and reachable
 * anytime from the account menu.
 *
 * It used to walk through the other products as well. Three product pitches is a lot
 * to put in front of someone who has just signed up and hasn't asked about
 * either product yet — so signup now explains the account and stops there. The
 * products sell themselves from their own pages, where someone arrives already
 * interested.
 *
 * Still written as a list so a page can be added back without reshaping the
 * component; the tab strip appears again the moment there is more than one.
 */

interface Guide {
  key: "loopital" | "pal";
  name: string;
  tagline: string;
  icon: React.ReactNode;
  what: string;
  can: string[];
  how: string[];
  cta?: { label: string; href: string };
}

const GUIDES: Guide[] = [
  {
    key: "loopital",
    name: "Loopital",
    tagline: "One account for everything",
    icon: <Layers size={18} />,
    what: "Loopital is your single account across every product we build. One email and password signs you in everywhere. no separate logins, one shared profile.",
    can: [
      "Open Pal with the same account",
      "Manage your plans and payments in one place",
      "Keep one profile (name, photo) across every app",
    ],
    how: [
      "You're already signed in. that's all it takes.",
      "Use the app switcher in your account menu to jump between products.",
      "Open “Manage account” anytime to see plans and billing.",
    ],
  },
];

export function PlatformGuideModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const g = GUIDES[tab];

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4" style={{ background: "rgba(10,10,15,0.5)", backdropFilter: "blur(16px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg  flex flex-col overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: "0 40px 110px rgba(0,0,0,0.25)", maxHeight: "92vh" }}>
        {/* Header */}
        <div className="px-7 pt-6 pb-4" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
          <div className="flex items-center justify-between">
            <p style={{ color: colors.heading, fontSize: "17px", fontWeight: 700 }}>Getting started</p>
            <button onClick={onClose} className="p-2  hover:bg-[#F5F5F7]" style={{ color: colors.textTertiary }}><X size={18} /></button>
          </div>
          <p style={{ color: colors.textTertiary, fontSize: "13px", marginTop: "2px" }}>Here's what your Loopital account is.</p>
          {/* Tabs. only worth showing when there's more than one page. */}
          {GUIDES.length > 1 && (
            <div className="flex gap-2 mt-4">
              {GUIDES.map((x, i) => (
                <button key={x.key} onClick={() => setTab(i)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: i === tab ? gradientBrand : colors.bg, color: i === tab ? "#fff" : colors.textSecondary, border: i === tab ? "none" : `1px solid ${colors.hairline}` }}>
                  {x.icon}{x.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">
          <div>
            <p style={{ color: colors.textTertiary, fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em" }}>{g.tagline.toUpperCase()}</p>
            <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, marginTop: "8px" }}>{g.what}</p>
          </div>

          <div>
            <p style={{ color: colors.heading, fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>What you can do</p>
            <div className="flex flex-col gap-2.5">
              {g.can.map((c) => (
                <div key={c} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${colors.green}1a` }}><Check size={11} style={{ color: colors.green }} /></span>
                  <span style={{ color: colors.textSecondary, fontSize: "13.5px", lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: colors.heading, fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>How to start</p>
            <div className="flex flex-col gap-2.5">
              {g.how.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: gradientBrand, fontSize: "11px", fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ color: colors.textSecondary, fontSize: "13.5px", lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${colors.hairline}` }}>
          <button onClick={onClose} style={{ color: colors.textTertiary, fontSize: "13px" }}>Skip for now</button>
          <div className="flex items-center gap-2">
            {tab < GUIDES.length - 1 ? (
              <button onClick={() => setTab(tab + 1)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: gradientBrand }}>
                Next <ArrowRight size={14} />
              </button>
            ) : g.cta ? (
              <a href={g.cta.href} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: gradientBrand }}>
                {g.cta.label} <ArrowRight size={14} />
              </a>
            ) : (
              <button onClick={onClose} className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: gradientBrand }}>Done</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
