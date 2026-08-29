import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import loopitalLogo from "../../imports/loopital-logo.svg";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { colors, gradientBrand } from "../lib/brand";

interface AuthModalProps {
  mode: "signin" | "signup";
  onClose: () => void;
  onToggleMode: () => void;
}

export function AuthModal({ mode, onClose, onToggleMode }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") await signUp(name, email, password);
      else await signIn(email, password);
      // On success the auth context switches the view to the dashboard.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setError(""); setLoading(true);
    try { await signInWithGoogle(credential); }
    catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed."); setLoading(false); }
  };

  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = colors.blue; };
  const blur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(0,0,0,0.12)"; };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 0,
    border: "1px solid rgba(0,0,0,0.12)",
    background: colors.surfaceMuted,
    color: colors.heading,
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,15,0.45)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md  p-9 flex flex-col gap-6" style={{ background: colors.surface, boxShadow: "0 40px 100px rgba(0,0,0,0.22)", border: `1px solid ${colors.hairline}` }}>
        <button onClick={onClose} className="absolute top-5 right-5 p-2  hover:bg-[#F5F5F7] transition-colors" style={{ color: colors.textTertiary }}>
          <X size={18} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <ImageWithFallback src={loopitalLogo} alt="Loopital" className="h-8 w-auto object-contain" />
          <div className="text-center">
            <h2 style={{ fontSize: "24px" }}>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
            <p style={{ color: colors.textSecondary, fontSize: "14px", marginTop: "6px" }}>
              {mode === "signin" ? "Sign in to manage your products and subscriptions." : "One account for Pal and everything Loopital."}
            </p>
          </div>
        </div>

        {/* Google sign-in / up */}
        <div className="flex flex-col gap-4">
          <GoogleSignInButton text={mode === "signup" ? "signup_with" : "signin_with"} onCredential={handleGoogle} />
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px" style={{ background: colors.hairline }} />
            <span style={{ color: colors.textTertiary, fontSize: "12.5px" }}>or</span>
            <span className="flex-1 h-px" style={{ background: colors.hairline }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "48px" }} onFocus={focus} onBlur={blur} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-100 transition-colors" style={{ color: colors.textTertiary }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p style={{ color: "#EF4444", fontSize: "13px" }}>{error}</p>}
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 rounded-full font-semibold transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60 mt-1" style={{ background: gradientBrand, color: "#fff", fontSize: "15px" }}>
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === "signin" ? "Sign in" : "Create account")}
          </button>
        </form>
        <p className="text-center" style={{ color: colors.textSecondary, fontSize: "14px" }}>
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={onToggleMode} className="font-semibold" style={{ color: colors.blue }}>
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
