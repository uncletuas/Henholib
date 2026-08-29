import { useState } from "react";
import { X, Check, Loader2, Minus, Plus } from "lucide-react";
import { palApi, type PalPlan } from "../lib/api";
import { colors, gradientBrand } from "../lib/brand";

interface PalPlansModalProps {
  token: string | null;
  currentPlan?: PalPlan;
  onClose: () => void;
  /** Onboarding mode: the Free tier becomes an action that opens the workspace. */
  onContinueFree?: () => void;
}

type Currency = "NGN" | "USD";

const fmtNgn = (n: number) => "₦" + n.toLocaleString("en-NG");
const fmtUsd = (n: number) => "$" + n;

/** Pal pricing: Free / Pro / Business. Prices are display values; Paystack charges
 *  the NGN amount (foreign cards pay the NGN equivalent). Business is per-seat. */
const PLANS: Array<{
  key: PalPlan;
  name: string;
  ngn: number; // per month (per seat for business)
  usd: number;
  perSeat?: boolean;
  minSeats?: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    key: "free",
    name: "Free",
    ngn: 0,
    usd: 0,
    tagline: "The full workspace, on us.",
    features: [
      "Docs, Sheets, Slides, Files, Systems & more",
      "AI coworker: 5 messages/day",
      "50,000 tokens/day",
      "1 user",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    ngn: 35000,
    usd: 25,
    tagline: "Your full AI coworker.",
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited coworker (fair-use ~3M tokens/mo)",
      "Research, content, automation & decisions",
      "Priority model + workflow automations",
      "Desktop app + priority support",
    ],
  },
  {
    key: "business",
    name: "Business",
    ngn: 42000,
    usd: 30,
    perSeat: true,
    minSeats: 3,
    tagline: "For teams that run on Pal.",
    features: [
      "Everything in Pro, per user",
      "Shared team workspace & Systems",
      "Admin console + roles, SSO",
      "Pooled ~5M tokens/user/mo",
      "Centralized billing",
    ],
  },
];

export function PalPlansModal({ token, currentPlan, onClose, onContinueFree }: PalPlansModalProps) {
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [seats, setSeats] = useState(3);
  const [busy, setBusy] = useState<PalPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const choose = async (plan: PalPlan) => {
    if (!token || plan === "free") return;
    setBusy(plan);
    setErr(null);
    try {
      const r = await palApi.subscribe(token, { plan, seats: plan === "business" ? seats : 1 });
      window.location.href = r.authorizationUrl;
    } catch {
      setErr("Couldn't start checkout. Please try again.");
      setBusy(null);
    }
  };

  const price = (p: (typeof PLANS)[number]) => {
    if (p.ngn === 0) return { big: "Free", sub: "" };
    const perSeat = p.perSeat ? " /user" : "";
    if (currency === "NGN") return { big: fmtNgn(p.ngn), sub: `/mo${perSeat}` };
    return { big: fmtUsd(p.usd), sub: `/mo${perSeat}` };
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: "rgba(10,10,15,0.5)", backdropFilter: "blur(16px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-4xl  flex flex-col" style={{ background: colors.surface, border: `1px solid ${colors.hairline}`, boxShadow: "0 40px 110px rgba(0,0,0,0.25)", maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
          <div>
            <p style={{ color: colors.heading, fontSize: "18px", fontWeight: 700 }}>Choose your Pal plan</p>
            <p style={{ color: colors.textTertiary, fontSize: "13px", marginTop: "2px" }}>The workspace is free. Upgrade the AI coworker when you're ready.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full p-0.5" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
              {(["NGN", "USD"] as Currency[]).map((c) => (
                <button key={c} onClick={() => setCurrency(c)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: currency === c ? "#fff" : "transparent", color: currency === c ? colors.heading : colors.textTertiary, boxShadow: currency === c ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {c === "NGN" ? "₦ NGN" : "$ USD"}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-2  hover:bg-[#F5F5F7] transition-colors" style={{ color: colors.textTertiary }}><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {err && <p className="mb-4 text-center" style={{ color: "#DC2626", fontSize: "13px" }}>{err}</p>}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {PLANS.map((p) => {
              const pr = price(p);
              const isCurrent = currentPlan === p.key;
              return (
                <div key={p.key} className="flex flex-col  p-6" style={{ background: p.highlight ? colors.bg : "#fff", border: p.highlight ? `2px solid ${colors.blue}` : `1px solid ${colors.hairline}` }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: colors.heading, fontSize: "16px", fontWeight: 700 }}>{p.name}</span>
                    {p.highlight && <span className="px-2 py-0.5  text-white text-[10px] font-semibold" style={{ background: gradientBrand }}>POPULAR</span>}
                  </div>
                  <p style={{ color: colors.textTertiary, fontSize: "12.5px", marginTop: "4px", minHeight: "34px" }}>{p.tagline}</p>
                  <div className="flex items-baseline gap-1.5 mt-2 mb-1">
                    <span style={{ color: colors.heading, fontSize: "28px", fontWeight: 800 }}>{pr.big}</span>
                    {pr.sub && <span style={{ color: colors.textTertiary, fontSize: "13px" }}>{pr.sub}</span>}
                  </div>

                  {p.perSeat && (
                    <div className="flex items-center gap-3 my-2">
                      <span style={{ color: colors.textSecondary, fontSize: "12.5px" }}>Seats</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSeats((s) => Math.max(p.minSeats || 3, s - 1))} className="w-7 h-7  flex items-center justify-center" style={{ border: `1px solid ${colors.hairline}`, color: colors.heading }}><Minus size={13} /></button>
                        <span style={{ color: colors.heading, fontSize: "14px", fontWeight: 600, minWidth: "20px", textAlign: "center" }}>{seats}</span>
                        <button onClick={() => setSeats((s) => Math.min(500, s + 1))} className="w-7 h-7  flex items-center justify-center" style={{ border: `1px solid ${colors.hairline}`, color: colors.heading }}><Plus size={13} /></button>
                      </div>
                      <span style={{ color: colors.textTertiary, fontSize: "12px" }}>
                        = {currency === "NGN" ? fmtNgn(p.ngn * seats) : fmtUsd(p.usd * seats)}/mo
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-3 mb-5 flex-1">
                    {p.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <Check size={15} style={{ color: colors.blue, marginTop: "1px", flexShrink: 0 }} />
                        <span style={{ color: colors.textSecondary, fontSize: "12.5px", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {p.key === "free" ? (
                    onContinueFree ? (
                      <button onClick={onContinueFree} className="py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-[#F5F5F7]" style={{ background: colors.lightSurface, color: colors.onLight, border: `1px solid ${colors.hairline}` }}>
                        Start with Free
                      </button>
                    ) : (
                      <button disabled className="py-2.5 rounded-full text-sm font-medium" style={{ background: colors.bg, color: colors.textTertiary, border: `1px solid ${colors.hairline}`, cursor: "default" }}>
                        {currentPlan === "free" || !currentPlan ? "Your plan" : "Included"}
                      </button>
                    )
                  ) : (
                    <button onClick={() => choose(p.key)} disabled={busy !== null || isCurrent} className="py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: p.highlight ? gradientBrand : colors.heading }}>
                      {busy === p.key ? <Loader2 size={15} className="animate-spin" /> : isCurrent ? "Current plan" : `Get ${p.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center mt-5" style={{ color: colors.textTertiary, fontSize: "11.5px" }}>
            Prices billed monthly via Paystack. USD shown for reference, charged in NGN. Save ~17% on annual billing (contact us).
          </p>
        </div>
      </div>
    </div>
  );
}
