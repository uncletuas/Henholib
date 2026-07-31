import { useEffect, useState, useCallback } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { LogOut, ArrowLeft, ArrowRight, CheckCircle2, Circle, FileText, Download, CalendarDays, PlayCircle, Award, GraduationCap, LifeBuoy } from "lucide-react";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { VideoEmbed } from "../../components/academy/VideoEmbed";
import { ExamPanel } from "../../components/academy/ExamPanel";
import { ReviewForm } from "../../components/academy/ReviewForm";
import { studentApi, academyApi, type AuthUser, type StudentCourseDetail } from "../../lib/api";
import { type Course, type Enrollment, FALLBACK_COURSE_IMAGE, formatPrice, trackMeta } from "../../config/academy";

const TOKEN_KEY = "loopital_student";
const input: CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: "10px", border: `1px solid ${colors.hairline}`, background: "#fff", fontSize: "14px", color: colors.heading, outline: "none" };
const label: CSSProperties = { display: "block", fontSize: "12.5px", fontWeight: 600, color: colors.heading, marginBottom: "6px" };
const btnPrimary: CSSProperties = { background: gradientBrand, color: "#fff", padding: "11px 20px", borderRadius: "999px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer" };
const btnGhost: CSSProperties = { background: colors.surfaceMuted, color: colors.heading, padding: "9px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" };

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: "8px", borderRadius: "999px", background: colors.surfaceMuted, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(3, pct)}%`, background: gradientBrand, borderRadius: "999px", transition: "width 0.4s ease" }} />
    </div>
  );
}

// ── Auth ──────────────────────────────────────────────────────────────
function Auth({ onAuthed }: { onAuthed: (t: string, u: AuthUser) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = mode === "signup" ? await studentApi.signup(name, email, password) : await studentApi.signin(email, password);
      onAuthed(r.token, r.user);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[72vh] flex items-center justify-center px-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.md }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: gradientBrand }}><GraduationCap size={22} color="#fff" /></div>
        <p style={{ color: colors.blue, fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "8px" }}>LOOPITAL ACADEMY</p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>{mode === "signup" ? "Create your student account" : "Welcome back"}</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, marginBottom: "22px" }}>{mode === "signup" ? "Sign up to enroll, learn, and earn certificates." : "Sign in to continue learning."}</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "signup" && <div><label style={label}>Full name</label><input style={input} value={name} onChange={(e) => setName(e.target.value)} required /></div>}
          <div><label style={label}>Email</label><input type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          <div><label style={label}>Password</label><input type="password" style={input} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {error && <p style={{ color: "#DC2626", fontSize: "13.5px" }}>{error}</p>}
          <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
        </form>
        <p className="mt-5 text-center" style={{ fontSize: "13.5px", color: colors.textSecondary }}>
          {mode === "signup" ? "Already have an account? " : "New to the Academy? "}
          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }} style={{ background: "none", border: "none", color: colors.blue, fontWeight: 600, cursor: "pointer" }}>
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
        <div className="mt-4 text-center"><Link to="/academy" style={{ color: colors.textTertiary, fontSize: "13px" }} className="hover:underline">← Back to Academy</Link></div>
      </div>
    </div>
  );
}

// ── Learn view ─────────────────────────────────────────────────────────
function Learn({ token, courseId, onBack }: { token: string; courseId: string; onBack: () => void }) {
  const [d, setD] = useState<StudentCourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  const load = useCallback(() => {
    studentApi.course(token, courseId)
      .then((r) => { setD(r); setCompleted(new Set(r.completed)); setProgress(r.enrollment.progress); })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load course."));
  }, [token, courseId]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (key: string) => {
    const isDone = completed.has(key);
    const next = new Set(completed);
    if (isDone) next.delete(key); else next.add(key);
    setCompleted(next);
    try { const r = await studentApi.progress(token, courseId, key, !isDone); setProgress(r.progress); }
    catch { load(); }
  };

  const download = async (id: string) => {
    try { const { url } = await studentApi.materialDownloadUrl(token, id); window.open(url, "_blank", "noopener"); } catch { /* ignore */ }
  };
  const downloadCert = async (id: string) => {
    try { const { url } = await studentApi.certificateDownloadUrl(token, id); window.open(url, "_blank", "noopener"); } catch { /* ignore */ }
  };

  if (error) return <div className="max-w-4xl mx-auto px-6 py-12"><p style={{ color: "#DC2626" }}>{error}</p><button onClick={onBack} style={{ ...btnGhost, marginTop: "16px" }}>← Back</button></div>;
  if (!d) return <div className="max-w-4xl mx-auto px-6 py-12" style={{ color: colors.textTertiary }}>Loading…</div>;

  const c = d.course;
  const accent = trackMeta(c.track).accent;
  const isDone = (key: string) => completed.has(key);
  const Check = ({ k }: { k: string }) => (
    <button onClick={() => toggle(k)} title={isDone(k) ? "Mark incomplete" : "Mark complete"} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
      {isDone(k) ? <CheckCircle2 size={22} style={{ color: colors.green }} /> : <Circle size={22} style={{ color: colors.textTertiary }} />}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <button onClick={onBack} className="inline-flex items-center gap-2 mb-6" style={{ color: colors.textTertiary, fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}><ArrowLeft size={16} /> My learning</button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: accent }}>{trackMeta(c.track).name}</span>
          <h1 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>{c.title}</h1>
        </div>
        {d.certificate?.hasFile && (
          <button onClick={() => downloadCert(d.certificate!.id)} style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: "8px" }}><Award size={16} /> Download certificate</button>
        )}
      </div>
      <div className="flex items-center gap-3 mb-8" style={{ maxWidth: "420px" }}>
        <div style={{ flex: 1 }}><ProgressBar pct={progress} /></div>
        <span style={{ fontSize: "13px", fontWeight: 700, color: colors.heading }}>{progress}%</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10">
        <div className="flex flex-col gap-8">
          {/* Intro video */}
          {c.introVideoUrl && (
            <section>
              <div className="flex items-center gap-2 mb-3"><PlayCircle size={18} style={{ color: accent }} /><h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Start here — intro video</h2></div>
              <VideoEmbed url={c.introVideoUrl} title={`${c.title} intro`} />
              <label className="flex items-center gap-2 mt-3 cursor-pointer" style={{ fontSize: "14px", color: colors.heading }} onClick={() => toggle("intro")}>
                {isDone("intro") ? <CheckCircle2 size={18} style={{ color: colors.green }} /> : <Circle size={18} style={{ color: colors.textTertiary }} />} I've watched the intro
              </label>
            </section>
          )}

          {/* Self-paced videos */}
          {c.courseType === "self_paced" && c.selfPacedVideos.length > 0 && (
            <section>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "12px" }}>Course videos</h2>
              <div className="flex flex-col gap-6">
                {c.selfPacedVideos.map((v, i) => {
                  const k = `spv-${i + 1}`;
                  return (
                    <div key={k}>
                      <div className="flex items-center gap-2 mb-2"><Check k={k} /><span style={{ fontWeight: 600, color: colors.heading }}>{v.title || `Video ${i + 1}`}</span></div>
                      <VideoEmbed url={v.url} title={v.title} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Curriculum */}
          {c.curriculum.length > 0 && (
            <section>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "12px" }}>{c.courseType === "self_paced" ? "Lessons" : "Curriculum"}</h2>
              <div className="flex flex-col gap-3">
                {c.curriculum.map((w, i) => {
                  const k = `week-${w.week || i + 1}`;
                  return (
                    <div key={k} className="rounded-2xl p-4 flex gap-3.5" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                      <Check k={k} />
                      <div>
                        <p style={{ fontWeight: 700, color: colors.heading, fontSize: "15px" }}>Week {w.week || i + 1}: {w.title}</p>
                        <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, marginTop: "3px" }}>{w.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <ExamPanel token={token} courseId={c.id} courseCompleted={progress >= 100} />
          <ReviewForm token={token} courseId={c.id} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Materials */}
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
            <div className="flex items-center gap-2 mb-3"><FileText size={16} style={{ color: accent }} /><h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Materials</h3></div>
            {d.materials.length === 0 ? <p style={{ fontSize: "13.5px", color: colors.textTertiary }}>No materials available yet. They'll appear here once your course begins.</p> : (
              <div className="flex flex-col gap-2">
                {d.materials.map((m) => (
                  <button key={m.id} onClick={() => download(m.id)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[#F5F5F7]" style={{ border: `1px solid ${colors.hairline}` }}>
                    <FileText size={15} style={{ color: colors.blue, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "13.5px", fontWeight: 600, color: colors.heading }}>{m.title}</span>
                    <Download size={15} style={{ color: colors.textSecondary }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
            <div className="flex items-center gap-2 mb-3"><CalendarDays size={16} style={{ color: accent }} /><h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Schedule</h3></div>
            {d.sessions.length === 0 ? <p style={{ fontSize: "13.5px", color: colors.textTertiary }}>No sessions scheduled yet.</p> : (
              <div className="flex flex-col gap-3">
                {d.sessions.map((s) => (
                  <div key={s.id} className="flex gap-3">
                    <div className="w-1 rounded-full" style={{ background: gradientBrand }} />
                    <div>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.heading }}>{s.title || "Live session"}</p>
                      <p style={{ fontSize: "12.5px", color: colors.textSecondary }}>{fmtDate(s.startsAt)}</p>
                      {s.location && <p style={{ fontSize: "12.5px", color: colors.textTertiary }}>{s.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificate status */}
          <div className="rounded-2xl p-5" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
            <div className="flex items-center gap-2 mb-2"><Award size={16} style={{ color: accent }} /><h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Certificate</h3></div>
            {d.certificate?.hasFile ? (
              <button onClick={() => downloadCert(d.certificate!.id)} className="inline-flex items-center gap-2 mt-1" style={{ ...btnPrimary }}><Download size={15} /> Download</button>
            ) : progress >= 100 ? (
              <p style={{ fontSize: "13.5px", color: colors.textSecondary }}>You've completed everything! Your instructor will issue your certificate shortly.</p>
            ) : (
              <p style={{ fontSize: "13.5px", color: colors.textSecondary }}>Complete the course to earn your certificate of completion.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────
function Dashboard({ token, user, onLogout, onOpen }: { token: string; user: AuthUser; onLogout: () => void; onOpen: (courseId: string) => void }) {
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
  const [browse, setBrowse] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    studentApi.courses(token).then((r) => setEnrollments(r.courses)).catch((e) => { const m = e instanceof Error ? e.message : ""; if (/sign in|authoriz|expired/i.test(m)) onLogout(); setError(m); });
    academyApi.listCourses().then((r) => setBrowse(r.courses)).catch(() => {});
  }, [token, onLogout]);
  useEffect(() => { load(); }, [load]);

  const enroll = async (courseId: string) => {
    try { await studentApi.enroll(token, courseId); load(); onOpen(courseId); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't enroll."); }
  };

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course.id));
  const available = (browse ?? []).filter((c) => !enrolledIds.has(c.id));

  return (
    <div style={{ background: colors.bg, minHeight: "80vh" }}>
      <div className="sticky top-16 z-40" style={{ background: "rgba(251,251,253,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${colors.hairline}` }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", color: colors.blue }}>MY LEARNING</p>
            <p style={{ fontSize: "13px", color: colors.textTertiary }}>Welcome, {user.name.split(" ")[0]}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/contact" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "6px" }}><LifeBuoy size={15} /> Support</Link>
            <button onClick={onLogout} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "6px" }}><LogOut size={15} /> Log out</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {error && <p style={{ color: "#DC2626", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}

        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>My courses</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14.5px", marginBottom: "24px" }}>Pick up where you left off.</p>

        {!enrollments ? <p style={{ color: colors.textTertiary }}>Loading…</p> : enrollments.length === 0 ? (
          <div className="rounded-3xl p-8 text-center" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
            <p style={{ color: colors.textSecondary, fontSize: "15px" }}>You're not enrolled in any courses yet. Browse below and enroll to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrollments.map((e) => (
              <button key={e.enrollmentId} onClick={() => onOpen(e.course.id)} className="text-left rounded-3xl overflow-hidden transition-all hover:-translate-y-1" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                <div style={{ aspectRatio: "16/7", overflow: "hidden" }}><ImageWithFallback src={e.course.image || FALLBACK_COURSE_IMAGE} alt={e.course.title} className="w-full h-full object-cover" /></div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span style={{ fontSize: "11.5px", fontWeight: 600, color: trackMeta(e.course.track).accent }}>{trackMeta(e.course.track).name}</span>
                    {e.status === "completed" && <span style={{ fontSize: "11px", fontWeight: 600, color: colors.green }}>✓ Completed</span>}
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: colors.heading, marginBottom: "12px" }}>{e.course.title}</h3>
                  <div className="flex items-center gap-3">
                    <div style={{ flex: 1 }}><ProgressBar pct={e.progress} /></div>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: colors.heading }}>{e.progress}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <ProfileCard token={token} />

        {available.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", marginTop: "48px", marginBottom: "6px" }}>Browse courses</h2>
            <p style={{ color: colors.textSecondary, fontSize: "14.5px", marginBottom: "24px" }}>Enroll to unlock materials, videos, and certificates.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {available.map((c) => (
                <div key={c.id} className="rounded-3xl overflow-hidden flex flex-col" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                  <div style={{ aspectRatio: "16/9", overflow: "hidden" }}><ImageWithFallback src={c.image || FALLBACK_COURSE_IMAGE} alt={c.title} className="w-full h-full object-cover" /></div>
                  <div className="p-5 flex flex-col flex-grow">
                    <span style={{ fontSize: "11.5px", fontWeight: 600, color: trackMeta(c.track).accent }}>{trackMeta(c.track).name}</span>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: colors.heading, margin: "4px 0 8px" }}>{c.title}</h3>
                    <p style={{ color: colors.textSecondary, fontSize: "13.5px", lineHeight: 1.6, flexGrow: 1 }}>{c.shortDesc}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span style={{ fontWeight: 700, color: colors.heading }}>{formatPrice(c.priceCents, c.currency)}</span>
                      <button onClick={() => enroll(c.id)} style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px" }}>Enroll <ArrowRight size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ token }: { token: string }) {
  const [profile, setProfile] = useState<{ name: string; username: string } | null>(null);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    studentApi.profile(token).then((p) => { setProfile({ name: p.name, username: p.username }); setUsername(p.username || ""); }).catch(() => {});
  }, [token]);

  const save = async () => {
    setBusy(true); setMsg(null);
    try { const r = await studentApi.setUsername(token, username); setProfile((p) => (p ? { ...p, username: r.username } : p)); setMsg({ ok: true, text: "Saved!" }); }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save." }); }
    finally { setBusy(false); }
  };

  if (!profile) return null;
  return (
    <div className="mt-12 rounded-3xl p-7" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
      <div className="flex items-center gap-2 mb-2"><Award size={18} style={{ color: colors.green }} /><h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Your public profile</h2></div>
      <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>
        Pick a username to get a shareable page of your completed courses and certificates that anyone can view.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ color: colors.textTertiary, fontSize: "14px" }}>loopital.com/u/</span>
        <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="username" style={{ ...input, width: "180px" }} />
        <button onClick={save} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Save"}</button>
        {profile.username && <Link to={`/u/${profile.username}`} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "6px" }}>View my achievements <ArrowRight size={14} /></Link>}
      </div>
      {msg && <p style={{ color: msg.ok ? colors.green : "#DC2626", fontSize: "13px", marginTop: "10px" }}>{msg.text}</p>}
    </div>
  );
}

export function StudentPortalPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [view, setView] = useState<{ name: "dashboard" } | { name: "learn"; courseId: string }>({ name: "dashboard" });
  const [params, setParams] = useSearchParams();
  const enrollId = params.get("enroll");

  useEffect(() => {
    if (!token) { setRestoring(false); return; }
    studentApi.me(token).then((r) => setUser(r.user)).catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }).finally(() => setRestoring(false));
  }, [token]);

  // Post-registration: a course id in ?enroll= auto-enrolls the signed-in
  // student and opens the course, then clears the param.
  useEffect(() => {
    if (!token || !user || !enrollId) return;
    let cancelled = false;
    studentApi.enroll(token, enrollId)
      .then(() => { if (!cancelled) setView({ name: "learn", courseId: enrollId }); })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        const next = new URLSearchParams(params);
        next.delete("enroll");
        setParams(next, { replace: true });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, enrollId]);

  const onAuthed = (t: string, u: AuthUser) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); setUser(u); setRestoring(false); };
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null); setView({ name: "dashboard" }); };

  if (restoring) return <div className="max-w-5xl mx-auto px-6 py-20" style={{ color: colors.textTertiary }}>Loading…</div>;
  if (!token || !user) return <Auth onAuthed={onAuthed} />;
  if (view.name === "learn") return <Learn token={token} courseId={view.courseId} onBack={() => setView({ name: "dashboard" })} />;
  return <Dashboard token={token} user={user} onLogout={logout} onOpen={(courseId) => setView({ name: "learn", courseId })} />;
}
