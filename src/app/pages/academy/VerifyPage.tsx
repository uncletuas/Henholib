import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ShieldCheck, ShieldX, Search } from "lucide-react";
import { Section } from "../../components/Section";
import { GradientText } from "../../components/GradientText";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { academyApi } from "../../lib/api";

type Result = { valid: boolean; name?: string; courseTitle?: string; issuedAt?: string; serial?: string } | null;

export function VerifyPage() {
  const [params, setParams] = useSearchParams();
  const [serial, setSerial] = useState(params.get("id") || "");
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async (e?: FormEvent) => {
    e?.preventDefault();
    const s = serial.trim();
    if (!s) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await academyApi.verify(s);
      setResult(r);
      setParams({ id: s }, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section pad="lg" width="narrow">
      <div className="text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: gradientBrand }}>
          <ShieldCheck size={26} color="#fff" />
        </div>
        <p style={{ color: colors.blue, fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "12px" }}>CERTIFICATE VERIFICATION</p>
        <h1 style={{ marginBottom: "14px" }}>Verify a <GradientText>Loopital Academy</GradientText> certificate.</h1>
        <p style={{ color: colors.textSecondary, fontSize: "16px", lineHeight: 1.6, marginBottom: "28px" }}>
          Enter the certificate ID (printed on the certificate, e.g. <code style={{ fontSize: "13px", background: colors.surfaceMuted, padding: "2px 6px", borderRadius: "6px" }}>LA-XXXX-0000</code>) to confirm it's genuine.
        </p>

        <form onSubmit={check} className="flex gap-2 mb-8">
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Certificate ID"
            className="flex-1"
            style={{ padding: "13px 16px", borderRadius: "14px", border: `1px solid ${colors.hairline}`, background: "#fff", fontSize: "15px", color: colors.heading, outline: "none" }}
          />
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-5 rounded-2xl font-semibold text-white" style={{ background: gradientBrand, opacity: busy ? 0.6 : 1 }}>
            <Search size={16} /> {busy ? "Checking…" : "Verify"}
          </button>
        </form>

        {error && <p style={{ color: "#DC2626", fontSize: "14px" }}>{error}</p>}

        {result && (
          <div className="rounded-3xl p-7 text-left" style={{ background: "#fff", border: `1px solid ${result.valid ? `${colors.green}40` : `${colors.hairline}`}`, boxShadow: shadow.md }}>
            {result.valid ? (
              <>
                <div className="flex items-center gap-2.5 mb-4">
                  <ShieldCheck size={22} style={{ color: colors.green }} />
                  <span style={{ fontWeight: 700, color: colors.green, fontSize: "16px" }}>Genuine certificate</span>
                </div>
                <dl className="flex flex-col gap-3">
                  {[["Awarded to", result.name], ["Course", result.courseTitle], ["Issued", result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : ""], ["Certificate ID", result.serial]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt style={{ color: colors.textTertiary, fontSize: "13px", fontWeight: 600 }}>{k}</dt>
                      <dd style={{ color: colors.heading, fontSize: "14.5px", fontWeight: 600, textAlign: "right" }}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <ShieldX size={22} style={{ color: "#DC2626" }} />
                <span style={{ fontWeight: 700, color: "#DC2626", fontSize: "16px" }}>No certificate found for that ID.</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <Link to="/academy" style={{ color: colors.textTertiary, fontSize: "13px" }} className="hover:underline">← Back to the Academy</Link>
        </div>
      </div>
    </Section>
  );
}
