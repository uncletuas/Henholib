import { useEffect, useState, useCallback } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link } from "react-router";
import { Plus, Trash2, Pencil, LogOut, X, GripVertical, Upload, UserPlus, KeyRound, Award, CalendarDays, RotateCcw } from "lucide-react";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { academyAdminApi, uploadToS3, type AcademyApplication, type AdminEnrollment } from "../../lib/api";
import { type Course, type Material, type Facilitator, type CourseSession, TRACKS, formatPrice, statusLabel } from "../../config/academy";
import { ExamEditor } from "../../components/academy/ExamEditor";

const TOKEN_KEY = "loopital_academy_admin";

const input: CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: "10px",
  border: `1px solid ${colors.hairline}`, background: "#fff", fontSize: "14px",
  color: colors.heading, outline: "none",
};
const label: CSSProperties = { display: "block", fontSize: "12.5px", fontWeight: 600, color: colors.heading, marginBottom: "6px" };
const btnPrimary: CSSProperties = { background: gradientBrand, color: "#fff", padding: "11px 20px", borderRadius: "999px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer" };
const btnGhost: CSSProperties = { background: colors.surfaceMuted, color: colors.heading, padding: "10px 18px", borderRadius: "999px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer" };

function isAuthError(msg: string) {
  return /not authorized|session|expired|unauthor/i.test(msg);
}

// ── Auth (bootstrap / login) ────────────────────────────────────────────
function AdminAuth({ onToken }: { onToken: (t: string) => void }) {
  const [mode, setMode] = useState<"loading" | "bootstrap" | "login">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    academyAdminApi
      .status()
      .then((r) => setMode(r.initialized ? "login" : "bootstrap"))
      .catch(() => setMode("login"));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "bootstrap") {
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      if (password !== confirm) return setError("Passwords don't match.");
    }
    setBusy(true);
    try {
      const r = mode === "bootstrap"
        ? await academyAdminApi.bootstrap(password)
        : await academyAdminApi.login(password);
      onToken(r.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.md }}>
        <p style={{ color: colors.blue, fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.09em", marginBottom: "8px" }}>LOOPITAL ACADEMY · ADMIN</p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>
          {mode === "bootstrap" ? "Set up your admin password" : "Admin sign in"}
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: 1.6, marginBottom: "22px" }}>
          {mode === "bootstrap"
            ? "Create the password you'll use to manage the Academy. Keep it safe — it's the key to the portal."
            : "Enter your admin password to manage courses and applications."}
        </p>
        {mode === "loading" ? (
          <p style={{ color: colors.textTertiary }}>Loading…</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label style={label}>Password</label>
              <input type="password" style={input} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            </div>
            {mode === "bootstrap" && (
              <div>
                <label style={label}>Confirm password</label>
                <input type="password" style={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
            )}
            {error && <p style={{ color: "#DC2626", fontSize: "13.5px" }}>{error}</p>}
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1, marginTop: "4px" }}>
              {busy ? "Please wait…" : mode === "bootstrap" ? "Create password & continue" : "Sign in"}
            </button>
          </form>
        )}
        <div className="mt-6 text-center">
          <Link to="/academy" style={{ color: colors.textTertiary, fontSize: "13px" }} className="hover:underline">← Back to Academy</Link>
        </div>
      </div>
    </div>
  );
}

// ── Course editor ───────────────────────────────────────────────────────
interface Draft {
  id?: string;
  slug: string; title: string; image: string; track: string;
  courseType: string; deliveryMode: string;
  shortDesc: string; fullDesc: string; whoForText: string;
  curriculum: { week: number; title: string; desc: string }[];
  format: { duration: string; cadence: string; commitment: string; delivery: string; prerequisites: string };
  priceDollars: number; currency: string; status: string; published: boolean; sortOrder: number;
  instructorName: string; instructorTitle: string; instructorBio: string;
  introVideoUrl: string; selfPacedVideos: { title: string; url: string }[];
}

const DEFAULT_BIO =
  "Tuamene Bestgod is the founder and CEO of Loopital, building AI and software for businesses, institutions, and governments across Africa. He teaches from real-world practice — shipping production AI systems and helping teams and leaders adopt them well.";

function toDraft(c?: Course): Draft {
  if (!c) return {
    slug: "", title: "", image: "", track: "technical", courseType: "live", deliveryMode: "online",
    shortDesc: "", fullDesc: "", whoForText: "",
    curriculum: [{ week: 1, title: "", desc: "" }],
    format: { duration: "4 weeks", cadence: "", commitment: "", delivery: "Live online cohort", prerequisites: "None" },
    priceDollars: 100, currency: "USD", status: "coming_soon", published: true, sortOrder: 0,
    instructorName: "Tuamene Bestgod", instructorTitle: "Founder & CEO of Loopital", instructorBio: DEFAULT_BIO,
    introVideoUrl: "", selfPacedVideos: [],
  };
  return {
    id: c.id, slug: c.slug, title: c.title, image: c.image || "", track: c.track,
    courseType: c.courseType || "live", deliveryMode: c.deliveryMode || "online",
    shortDesc: c.shortDesc, fullDesc: c.fullDesc,
    whoForText: (c.whoFor || []).join("\n"),
    curriculum: c.curriculum?.length ? c.curriculum.map((w) => ({ week: w.week, title: w.title, desc: w.desc })) : [{ week: 1, title: "", desc: "" }],
    format: {
      duration: c.format?.duration || "", cadence: c.format?.cadence || "", commitment: c.format?.commitment || "",
      delivery: c.format?.delivery || "Live online cohort", prerequisites: c.format?.prerequisites || "",
    },
    priceDollars: (c.priceCents || 0) / 100, currency: c.currency || "USD", status: c.status,
    published: c.published, sortOrder: c.sortOrder,
    instructorName: c.instructorName, instructorTitle: c.instructorTitle, instructorBio: c.instructorBio,
    introVideoUrl: c.introVideoUrl || "", selfPacedVideos: c.selfPacedVideos || [],
  };
}

const KB = 1024;
function fileSize(n: number) {
  if (!n) return "";
  if (n < KB * KB) return `${Math.round(n / KB)} KB`;
  return `${(n / (KB * KB)).toFixed(1)} MB`;
}

// Course materials: upload (presigned S3), list, download, delete.
function MaterialsManager({ courseId, token }: { courseId: string; token: string }) {
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("manual");
  const [studentVisible, setStudentVisible] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    academyAdminApi.listMaterials(token, courseId).then((r) => setMaterials(r.materials)).catch((e) => setError(e.message));
  }, [token, courseId]);
  useEffect(() => { load(); }, [load]);

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choose a file first.");
    if (!title.trim()) return setError("Give the material a title.");
    setBusy(true);
    try {
      const { uploadUrl, fileKey } = await academyAdminApi.materialUploadUrl(token, { courseId, fileName: file.name, contentType: file.type || "application/octet-stream" });
      await uploadToS3(uploadUrl, file);
      await academyAdminApi.createMaterial(token, { courseId, title: title.trim(), kind, fileKey, fileName: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size, studentVisible });
      setTitle(""); setFile(null);
      const el = document.getElementById("mat-file") as HTMLInputElement | null; if (el) el.value = "";
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const download = async (id: string) => {
    try { const { url } = await academyAdminApi.materialDownloadUrl(token, id); window.open(url, "_blank", "noopener"); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't open file."); }
  };
  const del = async (m: Material) => {
    if (!window.confirm(`Delete "${m.title}"?`)) return;
    try { await academyAdminApi.deleteMaterial(token, m.id); load(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't delete."); }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
      <p style={{ ...label, marginBottom: "4px" }}>Training materials</p>
      <p style={{ fontSize: "12.5px", color: colors.textTertiary, marginBottom: "14px" }}>Manuals & slides for facilitators; student-visible files download once the course is live.</p>

      {materials && materials.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: colors.blue, minWidth: "54px" }}>{m.kind}</span>
              <button type="button" onClick={() => download(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.heading, fontWeight: 600, fontSize: "13.5px", textAlign: "left", flex: 1 }}>{m.title}</button>
              <span style={{ fontSize: "12px", color: colors.textTertiary }}>{fileSize(m.sizeBytes)}</span>
              <span title={m.studentVisible ? "Visible to students" : "Facilitators only"} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: m.studentVisible ? `${colors.green}16` : colors.surfaceMuted, color: m.studentVisible ? colors.green : colors.textTertiary }}>{m.studentVisible ? "Students" : "Staff only"}</span>
              <button type="button" onClick={() => del(m)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
      {materials && materials.length === 0 && <p style={{ fontSize: "13px", color: colors.textTertiary, marginBottom: "12px" }}>No materials yet.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Material title (e.g. Week 1 Manual)" />
        <div className="flex gap-3">
          <select style={{ ...input, flex: 1 }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="manual">Manual</option>
            <option value="slides">Slides</option>
            <option value="resource">Resource</option>
          </select>
          <label className="flex items-center gap-2 whitespace-nowrap" style={{ fontSize: "13px", color: colors.heading }}>
            <input type="checkbox" checked={studentVisible} onChange={(e) => setStudentVisible(e.target.checked)} /> Students
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <input id="mat-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: "13px", flex: 1 }} />
        <button type="button" onClick={upload} disabled={busy} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "6px", opacity: busy ? 0.6 : 1 }}>
          <Upload size={15} /> {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

function CourseEditor({ course, token, onClose, onSaved }: { course?: Course; token: string; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(() => toDraft(course));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await academyAdminApi.saveCourse(token, {
        id: d.id,
        slug: d.slug, title: d.title, image: d.image, track: d.track as Course["track"],
        courseType: d.courseType as Course["courseType"], deliveryMode: d.deliveryMode as Course["deliveryMode"],
        shortDesc: d.shortDesc, fullDesc: d.fullDesc,
        whoFor: d.whoForText.split("\n").map((s) => s.trim()).filter(Boolean),
        curriculum: d.curriculum.map((w, i) => ({ week: Number(w.week) || i + 1, title: w.title.trim(), desc: w.desc.trim() })).filter((w) => w.title || w.desc),
        format: d.format,
        priceCents: Math.round((Number(d.priceDollars) || 0) * 100),
        currency: d.currency, status: d.status as Course["status"], published: d.published, sortOrder: Number(d.sortOrder) || 0,
        instructorName: d.instructorName, instructorTitle: d.instructorTitle, instructorBio: d.instructorBio,
        introVideoUrl: d.introVideoUrl, selfPacedVideos: d.selfPacedVideos,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  const updWeek = (i: number, k: "week" | "title" | "desc", v: string) =>
    setD((p) => ({ ...p, curriculum: p.curriculum.map((w, j) => (j === i ? { ...w, [k]: k === "week" ? Number(v) || 0 : v } : w)) }));

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto" style={{ background: "rgba(6,8,15,0.5)", padding: "24px" }} onClick={onClose}>
      <div className="w-full max-w-3xl rounded-3xl my-6" style={{ background: "#fff", boxShadow: shadow.lg }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{course ? "Edit course" : "New course"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textTertiary }}><X size={20} /></button>
        </div>
        <form onSubmit={save} className="px-7 py-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={label}>Title</label>
              <input style={input} value={d.title} onChange={(e) => set("title", e.target.value)} required />
            </div>
            <div>
              <label style={label}>URL slug</label>
              <input style={input} value={d.slug} onChange={(e) => set("slug", e.target.value)} placeholder="generative-ai-masterclass" required />
            </div>
          </div>

          <div>
            <label style={label}>Cover image URL</label>
            <div className="flex items-center gap-3">
              <input style={input} value={d.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…  (leave blank for a default)" />
              {d.image && <img src={d.image} alt="" style={{ width: "56px", height: "40px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${colors.hairline}` }} />}
            </div>
          </div>

          <div>
            <label style={label}>Intro video URL <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(YouTube/Vimeo — students watch before class)</span></label>
            <input style={input} value={d.introVideoUrl} onChange={(e) => set("introVideoUrl", e.target.value)} placeholder="https://youtu.be/…" />
          </div>

          {d.courseType === "self_paced" && (
            <div className="rounded-2xl p-4" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
              <div className="flex items-center justify-between mb-2">
                <p style={label}>Self-paced videos <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(Coursera-style lessons)</span></p>
                <button type="button" onClick={() => set("selfPacedVideos", [...d.selfPacedVideos, { title: "", url: "" }])} style={{ ...btnGhost, padding: "6px 12px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "5px" }}><Plus size={14} /> Add video</button>
              </div>
              <div className="flex flex-col gap-2">
                {d.selfPacedVideos.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input style={{ ...input, flex: "0 0 34%", padding: "8px 10px" }} value={v.title} onChange={(e) => set("selfPacedVideos", d.selfPacedVideos.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder={`Video ${i + 1} title`} />
                    <input style={{ ...input, flex: 1, padding: "8px 10px" }} value={v.url} onChange={(e) => set("selfPacedVideos", d.selfPacedVideos.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} placeholder="https://youtu.be/…" />
                    <button type="button" onClick={() => set("selfPacedVideos", d.selfPacedVideos.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}><Trash2 size={16} /></button>
                  </div>
                ))}
                {d.selfPacedVideos.length === 0 && <p style={{ fontSize: "12.5px", color: colors.textTertiary }}>No videos yet — add lessons students can watch on their own.</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label style={label}>Track</label>
              <select style={input} value={d.track} onChange={(e) => set("track", e.target.value)}>
                {TRACKS.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Course type</label>
              <select style={input} value={d.courseType} onChange={(e) => set("courseType", e.target.value)}>
                <option value="live">Live cohort (tutor-led)</option>
                <option value="self_paced">Self-paced (video)</option>
              </select>
            </div>
            <div>
              <label style={label}>Delivery</label>
              <select style={input} value={d.deliveryMode} onChange={(e) => set("deliveryMode", e.target.value)}>
                <option value="online">Online</option>
                <option value="in_house">In-house</option>
                <option value="both">Online or in-house</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label style={label}>Price ({d.currency})</label>
              <input type="number" min="0" step="1" style={input} value={d.priceDollars} onChange={(e) => set("priceDollars", Number(e.target.value))} />
            </div>
            <div>
              <label style={label}>Status</label>
              <select style={input} value={d.status} onChange={(e) => set("status", e.target.value)}>
                <option value="enrolling">Enrolling now</option>
                <option value="coming_soon">Coming soon</option>
              </select>
            </div>
            <div>
              <label style={label}>Sort order</label>
              <input type="number" style={input} value={d.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label style={label}>Short description</label>
            <input style={input} value={d.shortDesc} onChange={(e) => set("shortDesc", e.target.value)} placeholder="One line shown on cards" />
          </div>
          <div>
            <label style={label}>Full description</label>
            <textarea style={{ ...input, minHeight: "80px", resize: "vertical" }} value={d.fullDesc} onChange={(e) => set("fullDesc", e.target.value)} />
          </div>
          <div>
            <label style={label}>Who this is for <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(one per line)</span></label>
            <textarea style={{ ...input, minHeight: "80px", resize: "vertical" }} value={d.whoForText} onChange={(e) => set("whoForText", e.target.value)} />
          </div>

          {/* Format */}
          <div>
            <p style={{ ...label, marginBottom: "10px" }}>Format</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input style={input} value={d.format.duration} onChange={(e) => set("format", { ...d.format, duration: e.target.value })} placeholder="Duration (e.g. 4 weeks)" />
              <input style={input} value={d.format.cadence} onChange={(e) => set("format", { ...d.format, cadence: e.target.value })} placeholder="Cadence (e.g. 2 live sessions/week · 90 min)" />
              <input style={input} value={d.format.commitment} onChange={(e) => set("format", { ...d.format, commitment: e.target.value })} placeholder="Commitment (e.g. ~12 hours total)" />
              <input style={input} value={d.format.delivery} onChange={(e) => set("format", { ...d.format, delivery: e.target.value })} placeholder="Delivery (e.g. Live online cohort)" />
              <input style={{ ...input, gridColumn: "1 / -1" }} value={d.format.prerequisites} onChange={(e) => set("format", { ...d.format, prerequisites: e.target.value })} placeholder="Prerequisites" />
            </div>
          </div>

          {/* Curriculum */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p style={label}>Curriculum</p>
              <button type="button" onClick={() => setD((p) => ({ ...p, curriculum: [...p.curriculum, { week: p.curriculum.length + 1, title: "", desc: "" }] }))} style={{ ...btnGhost, padding: "6px 12px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Plus size={14} /> Add week
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {d.curriculum.map((w, i) => (
                <div key={i} className="rounded-2xl p-3" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <GripVertical size={15} style={{ color: colors.textTertiary }} />
                    <input type="number" style={{ ...input, width: "70px", padding: "7px 9px" }} value={w.week} onChange={(e) => updWeek(i, "week", e.target.value)} />
                    <input style={{ ...input, padding: "7px 10px" }} value={w.title} onChange={(e) => updWeek(i, "title", e.target.value)} placeholder="Week title" />
                    <button type="button" onClick={() => setD((p) => ({ ...p, curriculum: p.curriculum.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}><Trash2 size={16} /></button>
                  </div>
                  <textarea style={{ ...input, minHeight: "54px", resize: "vertical", padding: "8px 10px" }} value={w.desc} onChange={(e) => updWeek(i, "desc", e.target.value)} placeholder="What this week covers" />
                </div>
              ))}
            </div>
          </div>

          {/* Instructor */}
          <div>
            <p style={{ ...label, marginBottom: "10px" }}>Instructor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input style={input} value={d.instructorName} onChange={(e) => set("instructorName", e.target.value)} placeholder="Name" />
              <input style={input} value={d.instructorTitle} onChange={(e) => set("instructorTitle", e.target.value)} placeholder="Title" />
            </div>
            <textarea style={{ ...input, minHeight: "70px", resize: "vertical" }} value={d.instructorBio} onChange={(e) => set("instructorBio", e.target.value)} placeholder="Instructor bio" />
          </div>

          {course?.id ? (
            <MaterialsManager courseId={course.id} token={token} />
          ) : (
            <p style={{ fontSize: "13px", color: colors.textTertiary }}>Save the course first to upload training materials.</p>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer" style={{ fontSize: "14px", color: colors.heading }}>
            <input type="checkbox" checked={d.published} onChange={(e) => set("published", e.target.checked)} />
            Published (visible on the site)
          </label>

          {error && <p style={{ color: "#DC2626", fontSize: "13.5px" }}>{error}</p>}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : "Save course"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"courses" | "facilitators" | "students" | "applications" | "settings">("courses");
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [apps, setApps] = useState<AcademyApplication[] | null>(null);
  const [editing, setEditing] = useState<{ course?: Course } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const guard = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    if (isAuthError(msg)) onLogout();
    setErr(msg);
  }, [onLogout]);

  const loadCourses = useCallback(() => {
    academyAdminApi.listCourses(token).then((r) => setCourses(r.courses)).catch(guard);
  }, [token, guard]);
  const loadApps = useCallback(() => {
    academyAdminApi.listApplications(token).then((r) => setApps(r.applications)).catch(guard);
  }, [token, guard]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (tab === "applications" && !apps) loadApps(); }, [tab, apps, loadApps]);

  const del = async (c: Course) => {
    if (!window.confirm(`Delete "${c.title}"? This can't be undone.`)) return;
    try { await academyAdminApi.deleteCourse(token, c.id); loadCourses(); } catch (e) { guard(e); }
  };

  const tabBtn = (key: typeof tab, text: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: "9px 16px", borderRadius: "999px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
        background: tab === key ? colors.heading : "transparent", color: tab === key ? "#fff" : colors.textSecondary,
      }}
    >{text}</button>
  );

  return (
    <div style={{ background: colors.bg, minHeight: "80vh" }}>
      {/* Top bar */}
      <div className="sticky top-16 z-40" style={{ background: "rgba(251,251,253,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${colors.hairline}` }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", color: colors.blue }}>ACADEMY ADMIN</p>
            <p style={{ fontSize: "13px", color: colors.textTertiary }}>Manage courses, pricing & applications</p>
          </div>
          <div className="flex items-center gap-2">
            {tabBtn("courses", "Courses")}
            {tabBtn("facilitators", "Facilitators")}
            {tabBtn("students", "Students")}
            {tabBtn("applications", "Applications")}
            {tabBtn("settings", "Settings")}
            <button onClick={onLogout} title="Log out" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 14px" }}><LogOut size={15} /> Log out</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {err && <p style={{ color: "#DC2626", fontSize: "14px", marginBottom: "16px" }}>{err}</p>}

        {tab === "courses" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Courses {courses && <span style={{ color: colors.textTertiary, fontWeight: 500 }}>({courses.length})</span>}</h2>
              <button onClick={() => setEditing({})} style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: "6px" }}><Plus size={16} /> New course</button>
            </div>
            {!courses ? <p style={{ color: colors.textTertiary }}>Loading…</p> : (
              <div className="flex flex-col gap-3">
                {courses.map((c) => (
                  <div key={c.id} className="rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 700, color: colors.heading, fontSize: "15px" }}>{c.title}</span>
                        {!c.published && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: colors.surfaceMuted, color: colors.textTertiary }}>Hidden</span>}
                      </div>
                      <p style={{ fontSize: "12.5px", color: colors.textTertiary, marginTop: "2px" }}>/academy/{c.slug}</p>
                    </div>
                    <span style={{ fontSize: "13px", color: colors.textSecondary, minWidth: "150px" }}>{TRACKS.find((t) => t.key === c.track)?.name}</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: colors.heading, minWidth: "60px" }}>{formatPrice(c.priceCents, c.currency)}</span>
                    <span style={{ fontSize: "12.5px", padding: "3px 10px", borderRadius: "999px", background: c.status === "enrolling" ? `${colors.green}16` : colors.surfaceMuted, color: c.status === "enrolling" ? colors.green : colors.textTertiary }}>{statusLabel(c.status)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing({ course: c })} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: "6px" }}><Pencil size={17} /></button>
                      <button onClick={() => del(c)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: "6px" }}><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "applications" && (
          <>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>Applications {apps && <span style={{ color: colors.textTertiary, fontWeight: 500 }}>({apps.length})</span>}</h2>
            <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "22px" }}>Everyone who applied or joined a waitlist, newest first.</p>
            {!apps ? <p style={{ color: colors.textTertiary }}>Loading…</p> : apps.length === 0 ? (
              <p style={{ color: colors.textTertiary }}>No applications yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${colors.hairline}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ background: colors.surfaceMuted, textAlign: "left" }}>
                      {["Name", "Email", "Phone", "Course", "Why interested", "Heard via", "Date"].map((h) => (
                        <th key={h} style={{ padding: "12px 14px", fontWeight: 600, color: colors.heading, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id} style={{ borderTop: `1px solid ${colors.hairline}` }}>
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: colors.heading, whiteSpace: "nowrap" }}>{a.name}</td>
                        <td style={{ padding: "11px 14px", color: colors.textSecondary }}><a href={`mailto:${a.email}`} style={{ color: colors.blue }}>{a.email}</a></td>
                        <td style={{ padding: "11px 14px", color: colors.textSecondary, whiteSpace: "nowrap" }}>{a.phone || "—"}</td>
                        <td style={{ padding: "11px 14px", color: colors.textSecondary }}>{a.courseTitle}</td>
                        <td style={{ padding: "11px 14px", color: colors.textSecondary, maxWidth: "260px" }}>{a.motivation || "—"}</td>
                        <td style={{ padding: "11px 14px", color: colors.textSecondary, whiteSpace: "nowrap" }}>{a.heardFrom || "—"}</td>
                        <td style={{ padding: "11px 14px", color: colors.textTertiary, whiteSpace: "nowrap" }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "facilitators" && <FacilitatorsTab token={token} courses={courses} onGuard={guard} />}

        {tab === "students" && <StudentsTab token={token} courses={courses} onGuard={guard} />}

        {tab === "settings" && <SettingsTab token={token} onLogout={onLogout} />}
      </div>

      {editing && (
        <CourseEditor
          course={editing.course}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); loadCourses(); }}
        />
      )}
    </div>
  );
}

function FacilitatorsTab({ token, courses, onGuard }: { token: string; courses: Course[] | null; onGuard: (e: unknown) => void }) {
  const [list, setList] = useState<Facilitator[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", title: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    academyAdminApi.listFacilitators(token).then((r) => setList(r.facilitators)).catch(onGuard);
  }, [token, onGuard]);
  useEffect(() => { load(); }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      await academyAdminApi.createFacilitator(token, form);
      setForm({ name: "", email: "", title: "", password: "" });
      setAdding(false);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't add facilitator."); }
    finally { setBusy(false); }
  };

  const toggleAssign = async (f: Facilitator, courseId: string, assigned: boolean) => {
    setList((prev) => prev?.map((x) => x.id === f.id ? { ...x, courseIds: assigned ? [...x.courseIds, courseId] : x.courseIds.filter((c) => c !== courseId) } : x) ?? prev);
    try { await academyAdminApi.assignFacilitator(token, f.id, courseId, assigned); } catch (e) { onGuard(e); load(); }
  };

  const resetPw = async (f: Facilitator) => {
    const pw = window.prompt(`Set a new password for ${f.name} (min 8 chars):`);
    if (!pw) return;
    if (pw.length < 8) { window.alert("Password must be at least 8 characters."); return; }
    try { await academyAdminApi.setFacilitatorPassword(token, f.id, pw); window.alert("Password updated."); } catch (e) { onGuard(e); }
  };

  const del = async (f: Facilitator) => {
    if (!window.confirm(`Remove ${f.name}? They will lose portal access.`)) return;
    try { await academyAdminApi.deleteFacilitator(token, f.id); load(); } catch (e) { onGuard(e); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Facilitators {list && <span style={{ color: colors.textTertiary, fontWeight: 500 }}>({list.length})</span>}</h2>
        <button onClick={() => setAdding((v) => !v)} style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: "6px" }}><UserPlus size={16} /> Add facilitator</button>
      </div>
      <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "22px" }}>Onboard trainers and assign them to courses. They sign in at <strong>/academy/portal</strong> to access their training materials.</p>

      {adding && (
        <form onSubmit={create} className="rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
          <div><label style={label}>Name</label><input style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label style={label}>Email</label><input type="email" style={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label style={label}>Title <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(optional)</span></label><input style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lead Facilitator" /></div>
          <div><label style={label}>Temporary password</label><input style={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="They can change it after login" required /></div>
          {error && <p style={{ color: "#DC2626", fontSize: "13.5px" }} className="sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button type="button" onClick={() => setAdding(false)} style={btnGhost}>Cancel</button>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Adding…" : "Add facilitator"}</button>
          </div>
        </form>
      )}

      {!list ? <p style={{ color: colors.textTertiary }}>Loading…</p> : list.length === 0 ? (
        <p style={{ color: colors.textTertiary }}>No facilitators yet. Add your first trainer above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((f) => (
            <div key={f.id} className="rounded-2xl px-5 py-4" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <span style={{ fontWeight: 700, color: colors.heading, fontSize: "15px" }}>{f.name}</span>
                  {f.title && <span style={{ fontSize: "12.5px", color: colors.textTertiary }}> · {f.title}</span>}
                  <p style={{ fontSize: "13px", color: colors.textSecondary }}>{f.email}</p>
                </div>
                <button onClick={() => resetPw(f)} title="Reset password" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 12px", fontSize: "13px" }}><KeyRound size={14} /> Password</button>
                <button onClick={() => del(f)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: "6px" }}><Trash2 size={17} /></button>
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.hairline}` }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: colors.textTertiary, marginBottom: "8px" }}>ASSIGNED COURSES</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(courses ?? []).map((c) => {
                    const on = f.courseIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "13.5px", color: on ? colors.heading : colors.textSecondary }}>
                        <input type="checkbox" checked={on} onChange={(e) => toggleAssign(f, c.id, e.target.checked)} />
                        {c.title}
                      </label>
                    );
                  })}
                  {(!courses || courses.length === 0) && <span style={{ fontSize: "13px", color: colors.textTertiary }}>Create courses first to assign them.</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function fmtDT(iso: string) {
  try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}

function StudentsTab({ token, courses, onGuard }: { token: string; courses: Course[] | null; onGuard: (e: unknown) => void }) {
  const [courseId, setCourseId] = useState("");
  const [enrollments, setEnrollments] = useState<AdminEnrollment[] | null>(null);
  const [sessions, setSessions] = useState<CourseSession[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [sess, setSess] = useState({ title: "", startsAt: "", endsAt: "", location: "" });

  useEffect(() => { if (!courseId && courses && courses.length) setCourseId(courses[0].id); }, [courses, courseId]);

  const load = useCallback(() => {
    if (!courseId) return;
    academyAdminApi.listEnrollments(token, courseId).then((r) => setEnrollments(r.enrollments)).catch(onGuard);
    academyAdminApi.listSessions(token, courseId).then((r) => setSessions(r.sessions)).catch(onGuard);
  }, [token, courseId, onGuard]);
  useEffect(() => { setEnrollments(null); setSessions(null); load(); }, [load]);

  const genCert = async (e: AdminEnrollment) => {
    if (!window.confirm(`Generate a certificate for ${e.name} and mark the course complete?`)) return;
    setMsg(null);
    try {
      const r = await academyAdminApi.generateCertificate(token, e.id);
      setMsg(r.emailed ? `Certificate ${r.serial} issued and emailed to ${e.email}.` : `Certificate ${r.serial} issued. Email not sent (${r.emailError || "SES not configured"}). The student can still download it from their portal.`);
      load();
    } catch (err) { onGuard(err); }
  };
  const removeEnr = async (e: AdminEnrollment) => {
    if (!window.confirm(`Remove ${e.name} from this course?`)) return;
    try { await academyAdminApi.removeEnrollment(token, e.id); load(); } catch (err) { onGuard(err); }
  };
  const grant = async (e: AdminEnrollment) => {
    try { await academyAdminApi.grantRetake(token, courseId, e.userId); setMsg(`Granted ${e.name} 3 more exam attempts.`); } catch (err) { onGuard(err); }
  };
  const addSession = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!sess.startsAt) return;
    try {
      await academyAdminApi.createSession(token, { courseId, title: sess.title, startsAt: new Date(sess.startsAt).toISOString(), endsAt: sess.endsAt ? new Date(sess.endsAt).toISOString() : undefined, location: sess.location });
      setSess({ title: "", startsAt: "", endsAt: "", location: "" });
      load();
    } catch (err) { onGuard(err); }
  };
  const delSession = async (id: string) => { try { await academyAdminApi.deleteSession(token, id); load(); } catch (err) { onGuard(err); } };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Students &amp; Schedule</h2>
        <select style={{ ...input, maxWidth: "320px" }} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          {(!courses || courses.length === 0) && <option>Create a course first</option>}
        </select>
      </div>
      {msg && <p style={{ fontSize: "13.5px", color: colors.green, marginBottom: "16px" }}>{msg}</p>}

      {courseId && <div className="mb-6"><ExamEditor token={token} courseId={courseId} api={academyAdminApi} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        {/* Enrollments */}
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px" }}>Enrolled students {enrollments && <span style={{ color: colors.textTertiary, fontWeight: 500 }}>({enrollments.length})</span>}</h3>
          {!enrollments ? <p style={{ color: colors.textTertiary }}>Loading…</p> : enrollments.length === 0 ? (
            <p style={{ color: colors.textTertiary, fontSize: "14px" }}>No students enrolled in this course yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {enrollments.map((e) => (
                <div key={e.id} className="rounded-2xl px-4 py-3.5" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <p style={{ fontWeight: 700, color: colors.heading, fontSize: "14.5px" }}>{e.name}</p>
                      <p style={{ fontSize: "12.5px", color: colors.textSecondary }}>{e.email}</p>
                    </div>
                    <span style={{ fontSize: "12.5px", color: colors.heading, fontWeight: 600 }}>{e.progress}%</span>
                    <button onClick={() => grant(e)} title="Grant 3 more exam attempts" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "4px", padding: "7px 10px", fontSize: "12.5px" }}><RotateCcw size={13} /> Retake</button>
                    {e.certSerial
                      ? <span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "999px", background: `${colors.green}16`, color: colors.green }} title={e.certSerial}>Certified</span>
                      : <button onClick={() => genCert(e)} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 12px", fontSize: "12.5px" }}><Award size={13} /> Certificate</button>}
                    <button onClick={() => removeEnr(e)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions / calendar */}
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px" }}>Schedule</h3>
          {sessions && sessions.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
                  <CalendarDays size={15} style={{ color: colors.blue, flexShrink: 0 }} />
                  <div className="flex-1">
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.heading }}>{s.title || "Session"}</p>
                    <p style={{ fontSize: "12px", color: colors.textSecondary }}>{fmtDT(s.startsAt)}{s.location ? ` · ${s.location}` : ""}</p>
                  </div>
                  <button onClick={() => delSession(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addSession} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
            <input style={input} value={sess.title} onChange={(e) => setSess({ ...sess, title: e.target.value })} placeholder="Session title (e.g. Week 1 Live)" />
            <div className="grid grid-cols-2 gap-3">
              <div><label style={{ ...label, fontSize: "11.5px" }}>Starts</label><input type="datetime-local" style={input} value={sess.startsAt} onChange={(e) => setSess({ ...sess, startsAt: e.target.value })} required /></div>
              <div><label style={{ ...label, fontSize: "11.5px" }}>Ends</label><input type="datetime-local" style={input} value={sess.endsAt} onChange={(e) => setSess({ ...sess, endsAt: e.target.value })} /></div>
            </div>
            <input style={input} value={sess.location} onChange={(e) => setSess({ ...sess, location: e.target.value })} placeholder="Location or meeting link" />
            <button type="submit" style={{ ...btnPrimary, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px" }}><Plus size={15} /> Add session</button>
          </form>
        </div>
      </div>
    </>
  );
}

function SettingsTab({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) return setMsg({ ok: false, text: "New password must be at least 8 characters." });
    if (next !== confirm) return setMsg({ ok: false, text: "New passwords don't match." });
    setBusy(true);
    try {
      await academyAdminApi.changePassword(token, current, next);
      setMsg({ ok: true, text: "Password updated." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Couldn't update password.";
      if (isAuthError(text)) onLogout();
      setMsg({ ok: false, text });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>Settings</h2>
      <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "24px" }}>Change your admin password.</p>
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl p-7" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
        <div><label style={label}>Current password</label><input type="password" style={input} value={current} onChange={(e) => setCurrent(e.target.value)} required /></div>
        <div><label style={label}>New password</label><input type="password" style={input} value={next} onChange={(e) => setNext(e.target.value)} required /></div>
        <div><label style={label}>Confirm new password</label><input type="password" style={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
        {msg && <p style={{ color: msg.ok ? colors.green : "#DC2626", fontSize: "13.5px" }}>{msg.text}</p>}
        <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Updating…" : "Update password"}</button>
      </form>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────
export function AcademyAdminPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const setAuth = (t: string) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); };
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); };

  return token ? <Dashboard token={token} onLogout={logout} /> : <AdminAuth onToken={setAuth} />;
}
