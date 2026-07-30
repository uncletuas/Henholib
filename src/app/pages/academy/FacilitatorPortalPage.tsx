import { useEffect, useState, useCallback } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link } from "react-router";
import { LogOut, FileText, PlayCircle, Download, KeyRound } from "lucide-react";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { facilitatorApi, type FacilitatorCourse, type FacilitatorProfile } from "../../lib/api";
import { trackMeta } from "../../config/academy";

const TOKEN_KEY = "loopital_academy_facilitator";

const input: CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: "10px", border: `1px solid ${colors.hairline}`, background: "#fff", fontSize: "14px", color: colors.heading, outline: "none" };
const label: CSSProperties = { display: "block", fontSize: "12.5px", fontWeight: 600, color: colors.heading, marginBottom: "6px" };
const btnPrimary: CSSProperties = { background: gradientBrand, color: "#fff", padding: "11px 20px", borderRadius: "999px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer" };
const btnGhost: CSSProperties = { background: colors.surfaceMuted, color: colors.heading, padding: "9px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" };

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try { const r = await facilitatorApi.login(email, password); onToken(r.token); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign in failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.md }}>
        <p style={{ color: colors.blue, fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "8px" }}>LOOPITAL ACADEMY · FACILITATOR</p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>Facilitator sign in</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, marginBottom: "22px" }}>Access your assigned courses and training materials.</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div><label style={label}>Email</label><input type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          <div><label style={label}>Password</label><input type="password" style={input} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {error && <p style={{ color: "#DC2626", fontSize: "13.5px" }}>{error}</p>}
          <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="mt-6 text-center"><Link to="/academy" style={{ color: colors.textTertiary, fontSize: "13px" }} className="hover:underline">← Back to Academy</Link></div>
      </div>
    </div>
  );
}

function ChangePassword({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) return setMsg({ ok: false, text: "New password must be at least 8 characters." });
    setBusy(true);
    try { await facilitatorApi.changePassword(token, current, next); setMsg({ ok: true, text: "Password updated." }); setCurrent(""); setNext(""); }
    catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : "Couldn't update." }); }
    finally { setBusy(false); }
  };

  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "6px" }}><KeyRound size={14} /> Change password</button>;
  return (
    <form onSubmit={submit} className="rounded-2xl p-5 flex flex-col gap-3 max-w-sm" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
      <div><label style={label}>Current password</label><input type="password" style={input} value={current} onChange={(e) => setCurrent(e.target.value)} required /></div>
      <div><label style={label}>New password</label><input type="password" style={input} value={next} onChange={(e) => setNext(e.target.value)} required /></div>
      {msg && <p style={{ color: msg.ok ? colors.green : "#DC2626", fontSize: "13px" }}>{msg.text}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Update"}</button>
        <button type="button" onClick={() => setOpen(false)} style={btnGhost}>Close</button>
      </div>
    </form>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [profile, setProfile] = useState<FacilitatorProfile | null>(null);
  const [courses, setCourses] = useState<FacilitatorCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    facilitatorApi.me(token)
      .then((r) => { setProfile(r.facilitator); setCourses(r.courses); })
      .catch((e) => { const m = e instanceof Error ? e.message : "Session expired."; if (/authoriz|session|expired/i.test(m)) onLogout(); setError(m); });
  }, [token, onLogout]);

  const download = useCallback(async (id: string) => {
    try { const { url } = await facilitatorApi.materialDownloadUrl(token, id); window.open(url, "_blank", "noopener"); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't open file."); }
  }, [token]);

  return (
    <div style={{ background: colors.bg, minHeight: "80vh" }}>
      <div className="sticky top-16 z-40" style={{ background: "rgba(251,251,253,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${colors.hairline}` }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", color: colors.blue }}>FACILITATOR PORTAL</p>
            <p style={{ fontSize: "13px", color: colors.textTertiary }}>{profile ? `Welcome, ${profile.name.split(" ")[0]}` : "Loopital Academy"}</p>
          </div>
          <button onClick={onLogout} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "6px" }}><LogOut size={15} /> Log out</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {error && <p style={{ color: "#DC2626", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>Your courses</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14.5px", marginBottom: "28px" }}>Training materials for the courses you facilitate.</p>

        {!courses ? <p style={{ color: colors.textTertiary }}>Loading…</p> : courses.length === 0 ? (
          <p style={{ color: colors.textTertiary }}>You haven't been assigned to any courses yet. Your admin will assign them.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {courses.map((c) => (
              <div key={c.id} className="rounded-3xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                <div className="px-6 py-5 flex items-center justify-between gap-4" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
                  <div>
                    <span style={{ fontSize: "11.5px", fontWeight: 600, color: trackMeta(c.track as "technical").accent }}>{trackMeta(c.track as "technical").name}</span>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: colors.heading }}>{c.title}</h3>
                  </div>
                  {c.introVideoUrl && (
                    <a href={c.introVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2" style={{ color: colors.blue, fontSize: "13.5px", fontWeight: 600 }}>
                      <PlayCircle size={16} /> Intro video
                    </a>
                  )}
                </div>
                <div className="px-6 py-5">
                  {c.materials.length === 0 ? (
                    <p style={{ fontSize: "13.5px", color: colors.textTertiary }}>No materials uploaded yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {c.materials.map((m) => (
                        <button key={m.id} onClick={() => download(m.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F5F5F7]" style={{ border: `1px solid ${colors.hairline}` }}>
                          <FileText size={16} style={{ color: colors.blue, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: "14px", fontWeight: 600, color: colors.heading }}>{m.title}</span>
                          <span style={{ fontSize: "11px", textTransform: "uppercase", color: colors.textTertiary }}>{m.kind}</span>
                          <Download size={15} style={{ color: colors.textSecondary }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10">
          <ChangePassword token={token} />
        </div>
      </div>
    </div>
  );
}

export function FacilitatorPortalPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const setAuth = (t: string) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); };
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); };
  return token ? <Dashboard token={token} onLogout={logout} /> : <Login onToken={setAuth} />;
}
