import { useState } from "react";
import { X, User, Users, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { palApi } from "../lib/api";
import { launchWorkspace } from "../lib/pal";
import { productById } from "../config/products";
import { colors, gradientBrand } from "../lib/brand";

const pal = productById("stack62");
const input: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: "12px", border: `1px solid ${colors.hairline}`, background: colors.surfaceMuted, fontSize: "14px", color: colors.heading, outline: "none" };

export function PalOnboardingModal() {
  const { token, setShowPalOnboarding } = useAuth();
  const [useType, setUseType] = useState<"personal" | "team" | "">("");
  const [orgName, setOrgName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!useType) { setError("Choose how you'll use Pal."); return; }
    if (!token) return;
    setBusy(true); setError(null);
    try {
      await palApi.saveOnboarding(token, { useType, orgName: useType === "team" ? orgName : undefined, teamSize: useType === "team" ? teamSize : undefined });
      setShowPalOnboarding(false);
      await launchWorkspace(token); // same-tab redirect into the workspace
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  const Choice = ({ id, icon, title, desc }: { id: "personal" | "team"; icon: React.ReactNode; title: string; desc: string }) => (
    <button onClick={() => setUseType(id)} className="flex-1 text-left p-4 rounded-2xl transition-all" style={{ border: `1.5px solid ${useType === id ? colors.blue : colors.hairline}`, background: useType === id ? `${colors.blue}0a` : colors.surface }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: useType === id ? gradientBrand : colors.surfaceMuted, color: useType === id ? "#fff" : colors.textSecondary }}>{icon}</div>
      <p style={{ fontWeight: 700, fontSize: "14.5px", color: colors.heading }}>{title}</p>
      <p style={{ fontSize: "12.5px", color: colors.textSecondary, marginTop: "2px", lineHeight: 1.4 }}>{desc}</p>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(10,10,15,0.45)", backdropFilter: "blur(16px)" }} onClick={(e) => { if (e.target === e.currentTarget) setShowPalOnboarding(false); }}>
      <div className="relative w-full max-w-md rounded-[28px] p-8 flex flex-col gap-5" style={{ background: colors.surface, boxShadow: "0 40px 100px rgba(0,0,0,0.22)", border: `1px solid ${colors.hairline}` }}>
        <button onClick={() => setShowPalOnboarding(false)} className="absolute top-5 right-5 p-2 rounded-lg hover:bg-[#F5F5F7]" style={{ color: colors.textTertiary }}><X size={18} /></button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
            <ImageWithFallback src={pal.logo} alt="Pal" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 style={{ fontSize: "20px" }}>Welcome to Pal</h2>
            <p style={{ color: colors.textSecondary, fontSize: "13.5px" }}>A couple of quick questions to set up your workspace.</p>
          </div>
        </div>

        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: colors.heading, marginBottom: "10px" }}>How will you use Pal?</p>
          <div className="flex gap-3">
            <Choice id="personal" icon={<User size={18} />} title="Personal" desc="Just for me and my own work." />
            <Choice id="team" icon={<Users size={18} />} title="Team" desc="For my team or organization." />
          </div>
        </div>

        {useType === "team" && (
          <div className="flex flex-col gap-3">
            <input style={input} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" />
            <select style={input} value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
              <option value="">Team size…</option>
              <option>Just me</option>
              <option>2–10</option>
              <option>11–50</option>
              <option>51–200</option>
              <option>200+</option>
            </select>
          </div>
        )}

        {error && <p style={{ color: "#EF4444", fontSize: "13px" }}>{error}</p>}
        <button onClick={submit} disabled={busy} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60" style={{ background: gradientBrand, fontSize: "15px" }}>
          {busy ? "Setting up…" : <>Enter workspace <ArrowRight size={16} /></>}
        </button>
        <p style={{ fontSize: "12px", color: colors.textTertiary, textAlign: "center", lineHeight: 1.5 }}>The workspace is free. The AI coworker is a paid upgrade you can add anytime.</p>
      </div>
    </div>
  );
}
