import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import loopitalLogo from "../../imports/loopital.com_logo.png";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AuthModalProps {
  mode: "signin" | "signup";
  onClose: () => void;
  onSuccess: (user: { name: string; email: string }) => void;
  onToggleMode: () => void;
}

export function AuthModal({ mode, onClose, onSuccess, onToggleMode }: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({ name: name || email.split("@")[0], email });
    }, 1200);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#F7F7FB",
    color: "#0D0D1A",
    fontSize: "15px",
    outline: "none",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.5)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl p-8 flex flex-col gap-6 bg-white" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.07)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ color: "#9CA3AF" }}>
          <X size={18} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <ImageWithFallback src={loopitalLogo} alt="Loopital" className="h-8 w-auto object-contain" />
          <div className="text-center">
            <h2 style={{ color: "#0D0D1A", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.01em" }}>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "4px" }}>{mode === "signin" ? "Sign in to access your products and account." : "Start your 14-day free trial. No credit card required."}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label style={{ color: "#374151", fontSize: "13px", fontWeight: 500 }}>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={inputStyle} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#4F46E5"; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.12)"; }} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label style={{ color: "#374151", fontSize: "13px", fontWeight: 500 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" style={inputStyle} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#4F46E5"; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.12)"; }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ color: "#374151", fontSize: "13px", fontWeight: 500 }}>Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "48px" }} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#4F46E5"; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.12)"; }} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-100 transition-colors" style={{ color: "#9CA3AF" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p style={{ color: "#EF4444", fontSize: "13px" }}>{error}</p>}
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-1" style={{ background: "#4F46E5", color: "#fff", fontSize: "15px" }}>
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === "signin" ? "Sign in" : "Create account")}
          </button>
        </form>
        <p className="text-center" style={{ color: "#6B7280", fontSize: "14px" }}>
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={onToggleMode} className="font-semibold transition-colors hover:text-[#3730A3]" style={{ color: "#4F46E5" }}>
            {mode === "signin" ? "Sign up free" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
