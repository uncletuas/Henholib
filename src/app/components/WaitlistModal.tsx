import { useState } from "react";
import { X, Check } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { productById, type ProductId } from "../config/products";
import { waitlistApi } from "../lib/api";
import { colors } from "../lib/brand";

interface WaitlistModalProps {
  product: ProductId;
  onClose: () => void;
}

export function WaitlistModal({ product, onClose }: WaitlistModalProps) {
  const p = productById(product);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      await waitlistApi.join(p.id, email, name || undefined);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = p.accent; };
  const blur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(0,0,0,0.12)"; };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: "14px",
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
      <div className="relative w-full max-w-md rounded-[28px] p-9 flex flex-col gap-6" style={{ background: colors.surface, boxShadow: "0 40px 100px rgba(0,0,0,0.22)", border: `1px solid ${colors.hairline}` }}>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-lg hover:bg-[#F5F5F7] transition-colors" style={{ color: colors.textTertiary }}>
          <X size={18} />
        </button>

        {done ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${p.accent}16` }}>
              <Check size={26} style={{ color: p.accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: "23px" }}>You're on the list.</h2>
              <p style={{ color: colors.textSecondary, fontSize: "14.5px", marginTop: "8px", lineHeight: 1.6 }}>
                Thanks for your interest in {p.name}. We'll email <strong style={{ color: colors.heading }}>{email}</strong> the moment it opens up.
              </p>
            </div>
            <button onClick={onClose} className="mt-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]" style={{ background: p.accent, fontSize: "15px" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "#fff", border: `1px solid ${p.accent}22` }}>
                <ImageWithFallback src={p.logo} alt={p.name} className="w-9 h-9 object-contain" />
              </div>
              <div className="text-center">
                <h2 style={{ fontSize: "24px" }}>Join the {p.name} waitlist</h2>
                <p style={{ color: colors.textSecondary, fontSize: "14px", marginTop: "6px", lineHeight: 1.6 }}>
                  {p.name} isn't open to the public yet. Leave your email and we'll let you know the moment you can get in.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Name <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(optional)</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ color: colors.heading, fontSize: "13px", fontWeight: 500 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              {error && <p style={{ color: "#EF4444", fontSize: "13px" }}>{error}</p>}
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 rounded-full font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60 mt-1" style={{ background: p.accent, fontSize: "15px" }}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Join the waitlist"}
              </button>
            </form>
            <p className="text-center" style={{ color: colors.textTertiary, fontSize: "12.5px" }}>
              We'll only use your email to tell you about {p.name}. No spam.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
