import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { studentApi } from "../../lib/api";

export function ReviewForm({ token, courseId }: { token: string; courseId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!rating) { setError("Pick a rating."); return; }
    setBusy(true); setError(null);
    try { await studentApi.review(token, courseId, rating, comment); setDone(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't submit."); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
      <div className="flex items-center gap-2 mb-3"><MessageSquare size={18} style={{ color: colors.green }} /><h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Rate this course</h3></div>
      {done ? (
        <p style={{ color: colors.green, fontSize: "14.5px" }}>Thanks for your review!</p>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                <Star size={26} style={{ color: n <= (hover || rating) ? "#F5A623" : colors.hairline }} fill={n <= (hover || rating) ? "#F5A623" : "transparent"} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share what you thought (optional)" style={{ width: "100%", minHeight: "72px", padding: "11px 13px", borderRadius: "12px", border: `1px solid ${colors.hairline}`, background: colors.bg, fontSize: "14px", color: colors.heading, outline: "none", resize: "vertical" }} />
          {error && <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
          <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white mt-3" style={{ background: gradientBrand, fontSize: "14px", opacity: busy ? 0.6 : 1 }}>{busy ? "Submitting…" : "Submit review"}</button>
        </>
      )}
    </div>
  );
}
