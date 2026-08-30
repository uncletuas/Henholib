import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { payApi } from "../lib/api";
import { launchWorkspace } from "../lib/pal";
import { colors, gradientBrand, shadow } from "../lib/brand";

export function PaymentCallbackPage() {
  const { token } = useAuth();
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const [status, setStatus] = useState<"verifying" | "success" | "pending" | "failed">("verifying");

  useEffect(() => {
    if (!token) return; // wait for auth to restore
    if (!reference) { setStatus("failed"); return; }
    payApi.verify(token, reference)
      .then((r) => setStatus(r.status === "success" ? "success" : "pending"))
      .catch(() => setStatus("failed"));
  }, [token, reference]);

  const card = (icon: React.ReactNode, title: string, body: string, cta?: React.ReactNode) => (
    <div className="min-h-[70vh] flex items-center justify-center px-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-md  p-9 text-center" style={{ background: colors.surfaceMuted, border: `1px solid ${colors.hairline}`, boxShadow: shadow.md }}>
        <div className="mx-auto mb-5">{icon}</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "10px" }}>{title}</h1>
        <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.65, marginBottom: "24px" }}>{body}</p>
        {cta}
      </div>
    </div>
  );

  if (status === "verifying") return card(<Loader2 size={40} className="animate-spin" style={{ color: colors.blue }} />, "Confirming your payment…", "Hang tight, this only takes a moment.");
  if (status === "success") return card(
    <CheckCircle2 size={44} style={{ color: colors.green }} />,
    "You're upgraded 🎉",
    "Your AI coworker is now active. Jump into your Pal workspace to start using it.",
    <button onClick={() => token && launchWorkspace(token)} className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white" style={{ background: gradientBrand }}>Open Pal workspace <ArrowRight size={16} /></button>
  );
  if (status === "pending") return card(
    <Loader2 size={40} className="animate-spin" style={{ color: colors.blue }} />,
    "Payment received, activating…",
    "We're finalizing your upgrade. This can take a minute. You can head to your workspace and it'll unlock shortly.",
    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 font-semibold" style={{ border: `1px solid ${colors.hairline}`, color: colors.heading }}>Back to Loopital</Link>
  );
  return card(
    <XCircle size={44} style={{ color: "#DC2626" }} />,
    "We couldn't confirm the payment",
    "If you were charged, it'll reflect shortly, or reach us at info@loopital.com. You can try the upgrade again from your account.",
    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 font-semibold" style={{ border: `1px solid ${colors.hairline}`, color: colors.heading }}>Back to Loopital</Link>
  );
}
