import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, PenLine, Type, Upload, ArrowRight, ArrowLeft, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { colors } from "../lib/brand";
import { onboardingApi, type NdaDocument, type OnboardingState } from "../lib/api";
import { ONBOARDING_STEPS, type Field } from "../config/onboarding-form";

/**
 * The team onboarding portal.
 *
 * Four stages in a fixed order: account, agreement, details, handbook. Which one
 * renders is decided by `stage` from the server, never by local state — that is
 * what makes "close the browser, come back on another device" land in the right
 * place, and it means the UI cannot get ahead of what the API will actually
 * allow.
 *
 * Three things here are load-bearing rather than decorative:
 *
 * The Sign button stays disabled until the document has been scrolled to the
 * end. Clause 12.1 has the signer confirm they read it in full, and a portal
 * that lets someone sign a document it never showed them makes that confirmation
 * untrue at the moment it is given.
 *
 * The signing date is never collected. The server stamps it. A date the signer
 * types is a date the signer can get wrong on a document where the execution
 * date is evidence.
 *
 * Answers save to the server on every step change, not to localStorage. The spec
 * asks for resume across devices, and a browser's storage cannot do that.
 */

const CORAL = "#FF7A59";
const INK = "#23303A";
const CREAM = "#FFFCF7";
const LINE = "#E4E0D6";
const OK = "#2FBD64";

const input: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${LINE}`,
  background: "#fff",
  padding: "12px 14px",
  fontSize: "16px", // 16px keeps iOS from zooming the page on focus
  color: INK,
  minHeight: 44,
};

const btn = (variant: "solid" | "ghost" = "solid"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  minHeight: 44,
  padding: "12px 22px",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  border: variant === "solid" ? `1px solid ${CORAL}` : `1px solid ${LINE}`,
  background: variant === "solid" ? CORAL : "#fff",
  color: variant === "solid" ? "#fff" : INK,
});

function Shell({ children, step }: { children: React.ReactNode; step: 1 | 2 | 3 }) {
  const stages = ["Sign the NDA", "Complete your details", "Get the handbook"];
  return (
    <div style={{ background: CREAM, minHeight: "100vh", padding: "clamp(28px,5vw,56px) 20px", fontFamily: 'Poppins, "Rubik", system-ui, sans-serif' }}>
      <div className="mx-auto" style={{ maxWidth: 760 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 26, flexWrap: "wrap" }}>
          {stages.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const done = n < step;
            const now = n === step;
            return (
              <div key={label} className="flex items-center gap-2" style={{ fontSize: "13px" }}>
                <span
                  className="grid place-items-center"
                  style={{
                    width: 22, height: 22, flexShrink: 0,
                    background: done ? OK : now ? CORAL : "#fff",
                    color: done || now ? "#fff" : "#9AA0A6",
                    border: done || now ? "none" : `1px solid ${LINE}`,
                    fontSize: "12px", fontWeight: 700,
                  }}
                >
                  {done ? <Check size={13} /> : n}
                </span>
                <span style={{ color: now ? INK : "#8A8C93", fontWeight: now ? 600 : 400 }}>{label}</span>
                {i < 2 && <span style={{ color: LINE, margin: "0 4px" }}>—</span>}
              </div>
            );
          })}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Draw / type / upload, producing a transparent PNG data URL either way. */
function SignaturePad({
  name,
  onChange,
}: {
  name: string;
  onChange: (v: { method: "drawn" | "typed" | "uploaded"; dataUrl: string } | null) => void;
}) {
  const [tab, setTab] = useState<"drawn" | "typed" | "uploaded">("drawn");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [typedFont, setTypedFont] = useState(0);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const FONTS = useMemo(
    () => [
      { label: "Flowing", css: '"Segoe Script", "Brush Script MT", cursive' },
      { label: "Upright", css: '"Lucida Handwriting", "Apple Chancery", cursive' },
      { label: "Plain", css: 'Georgia, "Times New Roman", serif' },
    ],
    [],
  );

  // ── Draw ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "drawn") return;
    const c = canvasRef.current;
    if (!c) return;
    // Back the canvas at device resolution, or a drawn signature is a blurry
    // one on every phone, which is where most of these will be signed.
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#101828";
  }, [tab]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  };
  const end = () => {
    drawing.current = false;
    const c = canvasRef.current;
    if (c && dirty.current) onChange({ method: "drawn", dataUrl: c.toDataURL("image/png") });
  };
  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange(null);
  };

  // ── Type ──────────────────────────────────────────────────────────────
  // Rendered to a canvas rather than sent as text, so the server stores one
  // kind of thing regardless of how it was produced.
  useEffect(() => {
    if (tab !== "typed") return;
    if (!name.trim()) {
      onChange(null);
      return;
    }
    const c = document.createElement("canvas");
    const ratio = 2;
    c.width = 620 * ratio;
    c.height = 170 * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#101828";
    ctx.font = `44px ${FONTS[typedFont].css}`;
    ctx.textBaseline = "middle";
    ctx.fillText(name.trim(), 12, 88);
    onChange({ method: "typed", dataUrl: c.toDataURL("image/png") });
  }, [tab, name, typedFont, FONTS, onChange]);

  // ── Upload ────────────────────────────────────────────────────────────
  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("That image is over 5MB. Please use a smaller one.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Re-encode to PNG so a JPEG upload still reaches the server as the
        // one format the PDF embedder accepts.
        const c = document.createElement("canvas");
        const scale = Math.min(1, 620 / img.width);
        c.width = img.width * scale;
        c.height = img.height * scale;
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        onChange({ method: "uploaded", dataUrl: c.toDataURL("image/png") });
        setUploadName(file.name);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const TabBtn = ({ id, icon, label }: { id: typeof tab; icon: React.ReactNode; label: string }) => (
    <button
      type="button"
      onClick={() => { onChange(null); setTab(id); }}
      className="inline-flex items-center gap-2"
      style={{
        minHeight: 44, padding: "10px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
        border: `1px solid ${tab === id ? CORAL : LINE}`,
        background: tab === id ? "rgba(255,122,89,0.08)" : "#fff",
        color: tab === id ? CORAL : INK,
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 14 }}>
        <TabBtn id="drawn" icon={<PenLine size={15} />} label="Draw" />
        <TabBtn id="typed" icon={<Type size={15} />} label="Type" />
        <TabBtn id="uploaded" icon={<Upload size={15} />} label="Upload" />
      </div>

      {tab === "drawn" && (
        <div>
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            style={{ width: "100%", height: 170, border: `1px dashed ${LINE}`, background: "#fff", touchAction: "none", cursor: "crosshair" }}
          />
          <button type="button" onClick={clear} style={{ ...btn("ghost"), marginTop: 10 }}>Clear</button>
        </div>
      )}

      {tab === "typed" && (
        <div>
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
            {FONTS.map((f, i) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setTypedFont(i)}
                style={{
                  minHeight: 44, padding: "8px 16px", cursor: "pointer", fontSize: "20px",
                  fontFamily: f.css,
                  border: `1px solid ${typedFont === i ? CORAL : LINE}`,
                  background: typedFont === i ? "rgba(255,122,89,0.08)" : "#fff", color: INK,
                }}
              >
                {name.trim() || "Your name"}
              </button>
            ))}
          </div>
          {!name.trim() && (
            <p style={{ fontSize: "13.5px", color: "#8A8C93" }}>Fill in your full legal name above and it will appear here.</p>
          )}
        </div>
      )}

      {tab === "uploaded" && (
        <div>
          <label
            style={{
              display: "block", border: `1px dashed ${LINE}`, background: "#fff",
              padding: "26px 18px", textAlign: "center", cursor: "pointer", color: INK, fontSize: "14.5px",
            }}
          >
            <Upload size={18} style={{ display: "inline", marginRight: 8, verticalAlign: "-3px" }} />
            {uploadName || "Choose a PNG or JPG of your signature"}
            <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <p style={{ fontSize: "13px", color: "#8A8C93", marginTop: 8 }}>
            A transparent PNG looks best. Under 5MB.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Has this field actually been answered?
 *
 * Written out rather than done inline with String(): a consent checkbox holds a
 * boolean, and String(false) is "false", which is truthy. The inline version
 * waved an unticked box past the client and left the server to refuse it, which
 * is a dead end for whoever is filling the form.
 */
function isFilled(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim().length > 0;
}

/** One form field. Shared by every step. */
function FieldView({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const str = typeof value === "string" ? value : "";

  return (
    <div>
      <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: INK, marginBottom: 4 }}>
        {field.label}
        {field.required && <span style={{ color: CORAL }}> *</span>}
      </label>
      {field.help && <p style={{ fontSize: "13px", color: "#8A8C93", marginBottom: 8 }}>{field.help}</p>}

      {["text", "email", "tel", "date"].includes(field.kind) && (
        <input
          type={field.kind}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...input, marginTop: field.help ? 0 : 8 }}
        />
      )}

      {field.kind === "textarea" && (
        <textarea
          rows={4}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...input, marginTop: field.help ? 0 : 8, resize: "vertical" }}
        />
      )}

      {field.kind === "consent" && (
        <label
          className="flex cursor-pointer gap-3"
          style={{
            minHeight: 44, padding: "12px 14px", alignItems: "flex-start",
            border: `1px solid ${value === true ? CORAL : LINE}`,
            background: value === true ? "rgba(255,122,89,0.06)" : "#fff",
            marginTop: field.help ? 0 : 8,
          }}
        >
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            style={{ accentColor: CORAL, width: 18, height: 18, marginTop: 2, flexShrink: 0 }}
          />
          <span style={{ fontSize: "15px", color: INK, lineHeight: 1.5 }}>I agree</span>
        </label>
      )}

      {field.kind === "single" && (
        <div className="grid gap-2" style={{ marginTop: field.help ? 0 : 8 }}>
          {(field.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-3"
              style={{
                minHeight: 44, padding: "10px 14px",
                border: `1px solid ${str === opt ? CORAL : LINE}`,
                background: str === opt ? "rgba(255,122,89,0.06)" : "#fff",
              }}
            >
              <input
                type="radio"
                name={field.name}
                checked={str === opt}
                onChange={() => onChange(str === opt ? "" : opt)}
                style={{ accentColor: CORAL, width: 17, height: 17 }}
              />
              <span style={{ fontSize: "15px", color: INK, lineHeight: 1.45 }}>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.kind === "multi" && (
        <div className="grid gap-2 sm:grid-cols-2" style={{ marginTop: field.help ? 0 : 8 }}>
          {(field.options ?? []).map((opt) => {
            const on = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-3"
                style={{
                  minHeight: 44, padding: "10px 14px",
                  border: `1px solid ${on ? CORAL : LINE}`,
                  background: on ? "rgba(255,122,89,0.06)" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange(on ? selected.filter((x) => x !== opt) : [...selected, opt])}
                  style={{ accentColor: CORAL, width: 17, height: 17 }}
                />
                <span style={{ fontSize: "15px", color: INK }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Poppins, loaded only here.
 *
 * The spec names it as the portal's typeface, but the public site runs on Rubik
 * and Merriweather and pulling a third family into the global stylesheet would
 * make every marketing page pay for one internal screen. Injected on mount,
 * scoped by the wrapper's fontFamily, removed on unmount.
 */
function usePoppins() {
  useEffect(() => {
    const id = "poppins-onboarding";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

export function OnboardingPage() {
  usePoppins();
  const { user, token, signIn, signUp } = useAuth();

  const [state, setState] = useState<OnboardingState | null>(null);
  const [doc, setDoc] = useState<NdaDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account stage
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  // NDA stage
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const docRef = useRef<HTMLDivElement | null>(null);

  /**
   * Has the reader reached the end of the agreement?
   *
   * The first version only listened for scroll, which meant the consent boxes
   * stayed disabled forever in the two cases where no scroll event ever fires:
   * a viewport tall enough to show the whole document, and a document that
   * failed to load and left a short "Loading…" box. Both left someone staring
   * at a checkbox that would not tick.
   *
   * So: if there is nothing to scroll, there is nothing left to read. The
   * tolerance is generous because sub-pixel rounding on zoomed and
   * high-density displays routinely leaves scrollTop a point or two short of
   * the arithmetic bottom.
   */
  const checkRead = useCallback(() => {
    const el = docRef.current;
    if (!el) return;
    const nothingToScroll = el.scrollHeight <= el.clientHeight + 4;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
    if (nothingToScroll || atBottom) setScrolledToEnd(true);
  }, []);
  const [readConfirmed, setReadConfirmed] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [role, setRole] = useState("");
  const [sig, setSig] = useState<{ method: "drawn" | "typed" | "uploaded"; dataUrl: string } | null>(null);

  // Form stage
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Set the moment a person edits anything, so autosave never fires on load.
  const [dirty, setDirty] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const s = await onboardingApi.state(token);
      setState(s);
      setAnswers(s.answers || {});
      setStepIndex(Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, (s.step || 1) - 1)));
      setLegalName((prev) => prev || String(s.answers?.fullName || s.name || ""));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!token || state?.stage !== "nda" || doc) return;
    onboardingApi.document(token).then(setDoc).catch((e) => setError((e as Error).message));
  }, [token, state?.stage, doc]);

  /**
   * Auto-save, debounced.
   *
   * The spec asks for a save on every field blur as well as on step changes.
   * Step changes alone are not enough: someone who fills in step five and then
   * closes the tab loses that step, and "close it and come back" is the thing
   * this portal explicitly promises. Debounced rather than per-keystroke so a
   * long text answer is one write, not sixty.
   *
   * `dirty` guards the first pass, so simply loading the page does not write
   * back the answers it just read.
   */
  useEffect(() => {
    if (state?.stage !== "form" || !token || !dirty) return;
    const t = setTimeout(() => {
      onboardingApi
        .saveForm(token, stepIndex + 1, answers)
        .then((r) => setSavedAt(r.savedAt))
        .catch(() => { /* a failed autosave must not interrupt typing */ });
    }, 1200);
    return () => clearTimeout(t);
  }, [answers, stepIndex, state?.stage, token, dirty]);

  // The "Saved" tick means "just saved", so it has to expire. A permanent tick
  // says nothing about whether the last thing typed actually reached the server.
  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2600);
    return () => clearTimeout(t);
  }, [savedAt]);

  // Re-measure after the agreement paints. Without this the gate is decided
  // against an empty box and never revisited.
  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(checkRead, 60);
    window.addEventListener("resize", checkRead);
    return () => { clearTimeout(t); window.removeEventListener("resize", checkRead); };
  }, [doc, checkRead]);

  // ── Stage: account ────────────────────────────────────────────────────
  if (!user || !token) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (mode === "signup") {
        if (form.password.length < 8) return setError("Use at least 8 characters for your password.");
        if (form.password !== form.confirm) return setError("Those passwords do not match.");
      }
      setBusy(true);
      try {
        if (mode === "signup") await signUp(form.name.trim(), form.email.trim(), form.password);
        else await signIn(form.email.trim(), form.password);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <Shell step={1}>
        <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)", color: INK, marginBottom: 12 }}>
          Welcome to Loopital
        </h1>
        <p style={{ color: "#5B6167", fontSize: "17px", lineHeight: 1.7, marginBottom: 26 }}>
          You are joining a team building software that helps people reach further.
          Let us get you set up. This takes about 15 minutes, and you can pause and
          come back at any time.
        </p>

        <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${LINE}`, padding: "24px 22px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: INK, marginBottom: 4 }}>
            {mode === "signup" ? "Create your account" : "Sign in"}
          </h2>
          <p style={{ fontSize: "13.5px", color: "#8A8C93", marginBottom: 18 }}>
            This becomes your permanent Loopital account, not a one-off login.
          </p>

          <div className="grid gap-3">
            {mode === "signup" && (
              <input placeholder="Full name" value={form.name} required
                onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} />
            )}
            <input type="email" placeholder="Email address" value={form.email} required
              onChange={(e) => setForm({ ...form, email: e.target.value })} style={input} />
            <input type="password" placeholder="Password (at least 8 characters)" value={form.password} required
              onChange={(e) => setForm({ ...form, password: e.target.value })} style={input} />
            {mode === "signup" && (
              <input type="password" placeholder="Confirm password" value={form.confirm} required
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} style={input} />
            )}
          </div>

          {error && <p style={{ color: "#C2410C", fontSize: "14px", marginTop: 12 }}>{error}</p>}

          <button type="submit" disabled={busy} style={{ ...btn(), width: "100%", marginTop: 18 }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === "signup" ? "Create your account" : "Sign in"}
          </button>

          <p style={{ fontSize: "14px", color: "#5B6167", marginTop: 14, textAlign: "center" }}>
            {mode === "signup" ? "Already started? " : "Need an account? "}
            <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }}
              style={{ color: CORAL, fontWeight: 600, cursor: "pointer", background: "none", border: "none" }}>
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </Shell>
    );
  }

  if (!state) {
    return (
      <Shell step={1}>
        <div className="flex items-center gap-2" style={{ color: "#8A8C93" }}>
          <Loader2 size={16} className="animate-spin" /> Loading your onboarding…
        </div>
      </Shell>
    );
  }

  // ── Stage: NDA ────────────────────────────────────────────────────────
  if (state.stage === "nda") {
    const canSign = scrolledToEnd && readConfirmed && legalConsent && !!sig && legalName.trim().length > 1 && !!role;

    const sign = async () => {
      if (!canSign || !sig) return;
      setBusy(true);
      setError(null);
      try {
        await onboardingApi.signNda(token, {
          fullName: legalName.trim(),
          role,
          method: sig.method,
          signature: sig.dataUrl,
          readConfirmed: true,
          legalConsent: true,
        });
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <Shell step={1}>
        <h1 style={{ fontSize: "clamp(1.6rem,3.4vw,2.1rem)", color: INK, marginBottom: 10 }}>
          Welcome to the team, {(state.name || "").split(" ")[0] || "there"}
        </h1>
        <p style={{ color: "#5B6167", fontSize: "16px", lineHeight: 1.7, marginBottom: 22 }}>
          Before anything else, please read and sign our Non-Disclosure Agreement.
          Loopital works with sensitive information, including patient health
          records. This agreement protects that information, our clients, and you.
          Please read it fully.
        </p>

        <div
          ref={docRef}
          onScroll={checkRead}
          style={{
            height: 420, overflowY: "auto", background: "#fff",
            border: `1px solid ${LINE}`, padding: "22px 20px", marginBottom: 12,
          }}
        >
          {!doc ? (
            <p style={{ color: "#8A8C93" }}>Loading the agreement…</p>
          ) : (
            <>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: INK, marginBottom: 4 }}>{doc.title}</h2>
              <p style={{ fontSize: "13px", color: "#8A8C93", marginBottom: 16 }}>{doc.subtitle}</p>
              {doc.preamble.map((t, i) => (
                <p key={i} style={{ fontSize: "13.5px", color: "#3B4149", lineHeight: 1.75, marginBottom: 10 }}>{t}</p>
              ))}
              {doc.clauses.map((c) => (
                <div key={c.heading} style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: "13.5px", fontWeight: 700, color: INK, marginBottom: 6 }}>{c.heading}</h3>
                  {(c.text || []).map((t, i) => (
                    <p key={i} style={{ fontSize: "13.5px", color: "#3B4149", lineHeight: 1.75, marginBottom: 8 }}>{t}</p>
                  ))}
                  {(c.bullets || []).length > 0 && (
                    <ul style={{ paddingLeft: 18, listStyle: "disc" }}>
                      {(c.bullets || []).map((b, i) => (
                        <li key={i} style={{ fontSize: "13.5px", color: "#3B4149", lineHeight: 1.7, marginBottom: 6 }}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              <p style={{ fontSize: "12px", color: "#8A8C93", marginTop: 20, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
                {doc.footer}
              </p>
            </>
          )}
        </div>

        {!scrolledToEnd && (
          <p style={{ fontSize: "13.5px", color: CORAL, marginBottom: 16 }}>
            Please scroll to the end of the agreement before signing.
          </p>
        )}

        <div style={{ background: "#fff", border: `1px solid ${LINE}`, padding: "22px 20px" }}>
          <div className="grid gap-4" style={{ marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: INK, marginBottom: 6 }}>
                Full legal name <span style={{ color: CORAL }}>*</span>
              </label>
              <input value={legalName} onChange={(e) => setLegalName(e.target.value)} style={input} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: INK, marginBottom: 6 }}>
                Your role at Loopital <span style={{ color: CORAL }}>*</span>
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...input, appearance: "auto" }}>
                <option value="">Choose your role</option>
                {state.roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: INK, marginBottom: 6 }}>Date</label>
              <p style={{ fontSize: "14px", color: "#5B6167", background: "#F6F4EF", border: `1px solid ${LINE}`, padding: "12px 14px" }}>
                Recorded automatically when you sign, from our server clock.
              </p>
            </div>
          </div>

          <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: INK, marginBottom: 10 }}>
            Your signature <span style={{ color: CORAL }}>*</span>
          </label>
          <SignaturePad name={legalName} onChange={setSig} />

          <div className="grid gap-3" style={{ marginTop: 20 }}>
            <label className="flex gap-3" style={{ cursor: "pointer", fontSize: "14.5px", color: INK, lineHeight: 1.6 }}>
              <input type="checkbox" checked={readConfirmed} disabled={!scrolledToEnd}
                onChange={(e) => setReadConfirmed(e.target.checked)}
                style={{ accentColor: CORAL, width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
              <span>I have read and understood the Non-Disclosure and Confidentiality Agreement in full.</span>
            </label>
            <label className="flex gap-3" style={{ cursor: "pointer", fontSize: "14.5px", color: INK, lineHeight: 1.6 }}>
              <input type="checkbox" checked={legalConsent} disabled={!scrolledToEnd}
                onChange={(e) => setLegalConsent(e.target.checked)}
                style={{ accentColor: CORAL, width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
              <span>
                I agree that my electronic signature is the legal equivalent of my
                handwritten signature, and that it binds me to the terms of this
                Agreement.
              </span>
            </label>
          </div>

          {error && <p style={{ color: "#C2410C", fontSize: "14px", marginTop: 14 }}>{error}</p>}

          <button type="button" onClick={sign} disabled={!canSign || busy}
            style={{ ...btn(), width: "100%", marginTop: 20, opacity: canSign && !busy ? 1 : 0.5, cursor: canSign && !busy ? "pointer" : "not-allowed" }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Sign the agreement
          </button>
        </div>
      </Shell>
    );
  }

  // ── Stage: the nine-step form ─────────────────────────────────────────
  if (state.stage === "form") {
    const step = ONBOARDING_STEPS[stepIndex];
    const visible = step.fields.filter(
      (f) => !f.showIf || f.showIf.anyOf.includes(String(answers[f.showIf.field] ?? "")),
    );
    const missing = visible.filter((f) => f.required && !isFilled(answers[f.name]));

    const persist = async (nextStep: number) => {
      try {
        const r = await onboardingApi.saveForm(token, nextStep + 1, answers);
        setSavedAt(r.savedAt);
      } catch (e) {
        setError((e as Error).message);
      }
    };

    const next = async () => {
      if (missing.length) return setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      setError(null);
      if (stepIndex < ONBOARDING_STEPS.length - 1) {
        const n = stepIndex + 1;
        setStepIndex(n);
        void persist(n);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setBusy(true);
        try {
          await onboardingApi.submitForm(token, answers);
          await refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }
    };

    return (
      <Shell step={2}>
        <div style={{ marginBottom: 18 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#8A8C93" }}>
              Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
            {savedAt && (
              <span className="inline-flex items-center gap-1.5" style={{ fontSize: "13px", color: OK }}>
                <Check size={13} /> Saved
              </span>
            )}
          </div>
          <div style={{ height: 4, background: LINE }}>
            <div style={{ height: 4, background: CORAL, width: `${((stepIndex + 1) / ONBOARDING_STEPS.length) * 100}%`, transition: "width .3s" }} />
          </div>
        </div>

        {state.step > 1 && stepIndex + 1 === state.step && (
          <p style={{ fontSize: "14.5px", color: "#5B6167", marginBottom: 14 }}>
            Welcome back. You left off at step {state.step} of {ONBOARDING_STEPS.length}.
          </p>
        )}

        <div style={{ background: "#fff", border: `1px solid ${LINE}`, padding: "24px 22px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: INK, marginBottom: step.intro ? 6 : 18 }}>{step.title}</h2>
          {step.intro && <p style={{ fontSize: "14.5px", color: "#5B6167", lineHeight: 1.65, marginBottom: 20 }}>{step.intro}</p>}

          <div className="grid gap-5">
            {visible.map((f) => (
              <FieldView key={f.name} field={f} value={answers[f.name]}
                onChange={(v) => { setDirty(true); setAnswers((a) => ({ ...a, [f.name]: v })); }} />
            ))}
          </div>

          {error && <p style={{ color: "#C2410C", fontSize: "14px", marginTop: 16 }}>{error}</p>}

          <div className="flex flex-wrap gap-3" style={{ marginTop: 24 }}>
            {stepIndex > 0 && (
              <button type="button" onClick={() => { setStepIndex(stepIndex - 1); setError(null); }} style={btn("ghost")}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button type="button" onClick={next} disabled={busy} style={{ ...btn(), flex: 1, minWidth: 180 }}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {stepIndex === ONBOARDING_STEPS.length - 1 ? "Finish onboarding" : "Save and continue"}
              {stepIndex < ONBOARDING_STEPS.length - 1 && <ArrowRight size={16} />}
            </button>
          </div>

          <button type="button" onClick={() => void persist(stepIndex)}
            style={{ marginTop: 12, background: "none", border: "none", color: "#8A8C93", fontSize: "14px", cursor: "pointer", textDecoration: "underline" }}>
            Save and continue later
          </button>
        </div>
      </Shell>
    );
  }

  // ── Stage: done ───────────────────────────────────────────────────────
  const download = async (path: string, filename: string) => {
    setError(null);
    try {
      const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("That file is not available yet.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Shell step={3}>
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, padding: "32px 26px" }}>
        <span className="inline-grid place-items-center" style={{ width: 52, height: 52, background: OK, color: "#fff", marginBottom: 20 }}>
          <Check size={26} />
        </span>
        <h1 style={{ fontSize: "clamp(1.6rem,3.4vw,2.1rem)", color: INK, marginBottom: 14 }}>
          You are officially part of the team
        </h1>
        <p style={{ color: "#5B6167", fontSize: "16px", lineHeight: 1.75, marginBottom: 12 }}>
          Congratulations, {(state.name || "").split(" ")[0] || "and welcome"}. Your agreement is signed and your details are in.
        </p>
        <p style={{ color: "#5B6167", fontSize: "16px", lineHeight: 1.75, marginBottom: 12 }}>
          One last thing, and it matters more than the paperwork. The Loopital
          Handbook explains how we think, how we work, and what we are actually
          trying to build. Read it properly this week, then read it again in three
          months. It will make more sense the second time.
        </p>
        <p style={{ color: INK, fontSize: "16px", fontWeight: 600, marginBottom: 26 }}>
          Welcome to Loopital. Reach Beyond.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => download(onboardingApi.handbookUrl(), "The-Loopital-Handbook.pdf")}
            style={btn()}
          >
            <Download size={16} /> Download the Loopital Handbook
          </button>
          <button type="button" onClick={() => download(onboardingApi.ndaPdfUrl(), "Loopital-NDA-Signed.pdf")} style={btn("ghost")}>
            <Download size={16} /> Download my signed NDA
          </button>
        </div>

        {error && <p style={{ color: "#C2410C", fontSize: "14px", marginTop: 14 }}>{error}</p>}

        <p style={{ fontSize: "14px", color: "#8A8C93", marginTop: 22, lineHeight: 1.7 }}>
          Your Loopital email and tool access will be set up shortly. Questions?{" "}
          <a href="mailto:info@loopital.com" style={{ color: CORAL }}>info@loopital.com</a> or 0705 939 9170.
        </p>
      </div>
    </Shell>
  );
}
