import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, Check, User } from "lucide-react";
import { colors } from "../lib/brand";
import { contributeApi } from "../lib/api";
import { DONATE_URL } from "../config/site";
import {
  INDIVIDUAL_STEPS,
  ORGANIZATION_STEPS,
  type Field,
  type Step,
} from "../config/contribute-questions";

/**
 * Contribute to Henholib.
 *
 * A guided conversation rather than a long form, which is the whole point of
 * the spec. Three decisions carry that:
 *
 *  - The fork is two large cards, not a dropdown. It decides the entire path,
 *    so it deserves to be the only thing on screen.
 *  - One group of questions per screen, with a visible position. A long
 *    scrolling form tells you up front how much work it wants; a stepper does
 *    not, and people finish it.
 *  - The ending says what happens next. "Thank you" closes a loop the visitor
 *    did not open.
 *
 * Progress is saved to localStorage on every change. Most of this traffic will
 * be mobile, where a backgrounded tab is routinely discarded, and losing
 * eighteen answers to a phone call is how a form gets abandoned for good.
 *
 * Only name, email, phone and consent are enforced. Everything else is
 * skippable on purpose: a partial answer is worth more than an abandonment.
 */

const STORAGE_KEY = "loopital.contribute.v1";
const ORANGE = "#F26D21";

type Path = "individual" | "organization";
type Answers = Record<string, string | string[]>;

/** UTM and referrer, captured once and carried with the submission. */
function attribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = p.get(k);
    if (v) out[k] = v;
  }
  if (document.referrer) out.referrer = document.referrer;
  return out;
}

/** Analytics hook. Fires if a tracker is present, and is silent if not. */
function track(event: string, data: Record<string, unknown> = {}) {
  const w = window as unknown as { dataLayer?: unknown[] };
  try {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...data });
  } catch {
    /* analytics must never break the form */
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${colors.hairlineStrong}`,
  padding: "12px 14px",
  fontSize: "16px", // 16px stops iOS zooming the page on focus
  color: colors.heading,
  background: "#fff",
};

/** Every option is a real label with a real input behind it, and a 44px target. */
function Option({
  name,
  value,
  checked,
  onChange,
  type,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  type: "radio" | "checkbox";
  disabled?: boolean;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3"
      style={{
        minHeight: 44,
        padding: "10px 14px",
        border: `1px solid ${checked ? ORANGE : colors.hairline}`,
        background: checked ? "rgba(242,109,33,0.06)" : "#fff",
        opacity: disabled && !checked ? 0.45 : 1,
      }}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled && !checked}
        style={{ accentColor: ORANGE, width: 17, height: 17 }}
      />
      <span style={{ fontSize: "15px", color: colors.heading, lineHeight: 1.4 }}>{value}</span>
    </label>
  );
}

function FieldView({
  field,
  answers,
  setAnswer,
  error,
}: {
  field: Field;
  answers: Answers;
  setAnswer: (name: string, v: string | string[]) => void;
  error?: string;
}) {
  const value = answers[field.name];
  const selected = Array.isArray(value) ? value : [];
  const atMax = field.max ? selected.length >= field.max : false;

  return (
    <div>
      <label
        htmlFor={`f-${field.name}`}
        style={{ display: "block", fontSize: "15.5px", fontWeight: 600, color: colors.heading, marginBottom: 4 }}
      >
        {field.label}
        {field.required && <span style={{ color: ORANGE }}> *</span>}
      </label>
      {field.help && (
        <p style={{ fontSize: "13.5px", color: colors.textTertiary, marginBottom: 10 }}>{field.help}</p>
      )}

      {(field.kind === "text" || field.kind === "email" || field.kind === "tel") && (
        <input
          id={`f-${field.name}`}
          type={field.kind}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => setAnswer(field.name, e.target.value)}
          style={{ ...inputStyle, marginTop: field.help ? 0 : 8 }}
        />
      )}

      {field.kind === "textarea" && (
        <textarea
          id={`f-${field.name}`}
          rows={6}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => setAnswer(field.name, e.target.value)}
          style={{ ...inputStyle, marginTop: field.help ? 0 : 8, resize: "vertical" }}
        />
      )}

      {(field.kind === "single" || field.kind === "multi") && (
        <div
          className="grid gap-2"
          style={{ marginTop: field.help ? 0 : 8 }}
          role={field.kind === "single" ? "radiogroup" : "group"}
          aria-label={field.label}
        >
          {(field.options ?? []).map((opt) => {
            const isChecked =
              field.kind === "single" ? value === opt : selected.includes(opt);
            return (
              <Option
                key={opt}
                name={field.name}
                value={opt}
                type={field.kind === "single" ? "radio" : "checkbox"}
                checked={isChecked}
                disabled={field.kind === "multi" && atMax}
                onChange={() => {
                  if (field.kind === "single") {
                    setAnswer(field.name, value === opt ? "" : opt);
                  } else {
                    setAnswer(
                      field.name,
                      isChecked ? selected.filter((s) => s !== opt) : [...selected, opt],
                    );
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* The free-text box that appears when "Other" is chosen. */}
      {field.otherFor && value === field.otherFor && (
        <input
          type="text"
          aria-label={`${field.label}, please specify`}
          placeholder="Tell us more"
          value={typeof answers[`${field.name}Other`] === "string" ? (answers[`${field.name}Other`] as string) : ""}
          onChange={(e) => setAnswer(`${field.name}Other`, e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
        />
      )}

      {error && <p style={{ color: "#C2410C", fontSize: "13.5px", marginTop: 6 }}>{error}</p>}
    </div>
  );
}

export function ContributePage() {
  const [path, setPath] = useState<Path | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Restore a part-finished attempt.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { path: Path; stepIndex: number; answers: Answers };
      if (saved.path) {
        setPath(saved.path);
        setStepIndex(saved.stepIndex ?? 0);
        setAnswers(saved.answers ?? {});
      }
    } catch {
      /* a corrupt draft is not worth failing over */
    }
  }, []);

  useEffect(() => {
    if (!path) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ path, stepIndex, answers }));
    } catch {
      /* private mode */
    }
  }, [path, stepIndex, answers]);

  const steps: Step[] = useMemo(
    () => (path === "organization" ? ORGANIZATION_STEPS : INDIVIDUAL_STEPS),
    [path],
  );
  /** Steps plus the consent screen at the end. */
  const total = steps.length + 1;
  const onConsentStep = stepIndex === steps.length;

  const setAnswer = useCallback((name: string, v: string | string[]) => {
    setAnswers((a) => ({ ...a, [name]: v }));
    setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));
  }, []);

  const visible = useCallback(
    (f: Field) => !f.showIf || f.showIf.anyOf.includes(String(answers[f.showIf.field] ?? "")),
    [answers],
  );

  function validateStep(): boolean {
    if (onConsentStep) {
      if (!consent) {
        setErrors({ consent: "Please tick the box so we can reply." });
        return false;
      }
      return true;
    }
    const next: Record<string, string> = {};
    for (const f of steps[stepIndex].fields) {
      if (!f.required || !visible(f)) continue;
      const v = answers[f.name];
      if (typeof v !== "string" || !v.trim()) {
        next[f.name] = "This one we do need.";
      } else if (f.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        next[f.name] = "That email looks incomplete.";
      } else if (f.kind === "tel" && v.replace(/\D/g, "").length < 7) {
        next[f.name] = "That number looks short.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (!validateStep()) return;
    track("contribute_step_complete", { path, step: stepIndex + 1, of: total });
    setStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!validateStep()) return;
    setSending(true);
    setFailure(null);
    try {
      await contributeApi.send({
        // Narrowed, not asserted: the submit button only exists after a fork is
        // chosen, but the compiler cannot see that from here.
        path: path as "individual" | "organization",
        name: String(answers.name ?? ""),
        email: String(answers.email ?? ""),
        phone: String(answers.phone ?? ""),
        organisation: String(answers.organisation ?? ""),
        consent: true,
        answers,
        attribution: attribution(),
      });
      track("contribute_submitted", { path });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* nothing to clean up */
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "That did not send. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  // ── Confirmation ────────────────────────────────────────────────────
  if (done) {
    const org = path === "organization";
    return (
      <div style={{ background: colors.surface, padding: "clamp(64px,9vw,120px) 24px" }}>
        <div className="mx-auto text-center" style={{ maxWidth: 640 }}>
          <span
            className="inline-grid place-items-center"
            style={{ width: 52, height: 52, background: ORANGE, color: "#fff", marginBottom: 22 }}
          >
            <Check size={26} />
          </span>
          <h1 style={{ marginBottom: 16 }}>
            {org
              ? `Thank you for the detailed picture of how ${String(answers.organisation || "your facility")} operates.`
              : "Thank you, this genuinely helps."}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: "17.5px", lineHeight: 1.7, marginBottom: 30 }}>
            {org
              ? "Our team personally reviews every facility response. If there is a fit for an early pilot, we will reach out directly within five business days."
              : "We're reading every response as we finish building Henholib. If you asked for early access, we'll reach out when we're ready for you."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {!org && (
              <button
                type="button"
                onClick={() => {
                  const url = "https://www.loopital.com/products/henholib";
                  if (navigator.share) void navigator.share({ title: "Henholib", url });
                  else void navigator.clipboard?.writeText(url);
                }}
                className="inline-flex items-center gap-2 font-semibold"
                style={{ background: ORANGE, color: "#fff", padding: "13px 24px", fontSize: "15px" }}
              >
                Share Henholib with someone
              </button>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-semibold"
              style={{ border: `1px solid ${colors.hairlineStrong}`, color: colors.heading, padding: "13px 24px", fontSize: "15px" }}
            >
              Back to homepage
            </Link>
          </div>

          {/*
            The donation ask, and deliberately after the thank-you rather than
            beside it. Someone who has just given eighteen answers has already
            contributed; leading with a request for money would make the whole
            questionnaire read as a funnel to one.
          */}
          <div style={{ borderTop: `1px solid ${colors.hairline}`, marginTop: 40, paddingTop: 32 }}>
            <p style={{ color: colors.heading, fontSize: "17px", fontWeight: 600, marginBottom: 8 }}>
              Want to do more than answer questions?
            </p>
            <p style={{ color: colors.textSecondary, fontSize: "15.5px", lineHeight: 1.7, marginBottom: 20 }}>
              Henholib and HMS7 are built and tested. Getting them into real
              hospitals, clinics, pharmacies and laboratories is what we are
              raising for. Any amount moves it forward.
            </p>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("contribute_donate_click", { path })}
              className="inline-flex items-center gap-2 font-semibold"
              style={{ background: colors.heading, color: "#fff", padding: "13px 24px", fontSize: "15px" }}
            >
              Donate on Crowdr <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── The fork ────────────────────────────────────────────────────────
  if (!path) {
    return (
      <div style={{ background: colors.surface, padding: "clamp(56px,7vw,100px) 24px" }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          <h1 style={{ marginBottom: 16 }}>Help us build Henholib right.</h1>
          <p style={{ color: colors.textSecondary, fontSize: "18px", lineHeight: 1.7, marginBottom: 36 }}>
            Whether you're a patient tired of starting over at every hospital, or
            a facility looking for a better way to run, your answers directly
            shape what we build next. Takes about three minutes.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "individual" as const, icon: User, title: "I'm an individual", body: "Tell us about your experience getting healthcare." },
              { id: "organization" as const, icon: Building2, title: "I'm an organisation or facility", body: "Tell us how your facility runs today." },
            ].map(({ id, icon: Icon, title, body }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPath(id);
                  setStepIndex(0);
                  track("contribute_started", { path: id });
                }}
                className="text-left transition-colors"
                style={{
                  border: `1px solid ${colors.hairline}`,
                  background: "#fff",
                  padding: "28px 24px",
                  minHeight: 160,
                }}
              >
                <Icon size={26} color={ORANGE} strokeWidth={1.75} />
                <p style={{ fontSize: "19px", fontWeight: 600, color: colors.heading, margin: "16px 0 6px" }}>
                  {title}
                </p>
                <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.6 }}>{body}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── The questionnaire ───────────────────────────────────────────────
  const step = steps[stepIndex];
  const pct = Math.round(((stepIndex + 1) / total) * 100);

  return (
    <div style={{ background: colors.surface, padding: "clamp(40px,5vw,72px) 24px clamp(56px,7vw,96px)" }}>
      <div className="mx-auto" style={{ maxWidth: 640 }}>
        {/* Position, always visible. */}
        <div style={{ marginBottom: 26 }}>
          <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textTertiary }}>
              Step {stepIndex + 1} of {total}
            </span>
            <button
              type="button"
              onClick={() => {
                setPath(null);
                setStepIndex(0);
              }}
              style={{ fontSize: "13px", color: colors.textTertiary, textDecoration: "underline" }}
            >
              Start over
            </button>
          </div>
          <div style={{ height: 3, background: colors.surfaceMuted }}>
            <div
              style={{ height: "100%", width: `${pct}%`, background: ORANGE, transition: "width 300ms ease" }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(1.6rem,3vw,2.1rem)", marginBottom: 26 }}>
          {onConsentStep ? "Almost done." : step.title}
        </h1>

        {onConsentStep ? (
          <div className="grid gap-5">
            <label
              className="flex cursor-pointer items-start gap-3"
              style={{ minHeight: 44, padding: "14px", border: `1px solid ${consent ? ORANGE : colors.hairline}`, background: "#fff" }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErrors({});
                }}
                style={{ accentColor: ORANGE, width: 17, height: 17, marginTop: 2 }}
              />
              <span style={{ fontSize: "15px", color: colors.heading, lineHeight: 1.5 }}>
                I'm okay with Loopital contacting me about Henholib and HMS7 updates.
              </span>
            </label>
            {errors.consent && <p style={{ color: "#C2410C", fontSize: "13.5px" }}>{errors.consent}</p>}
            <p style={{ fontSize: "13.5px", color: colors.textTertiary, lineHeight: 1.6 }}>
              We'll only use this to improve Henholib and reach out about next
              steps. Read our <Link to="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</Link>.
            </p>
            {failure && <p style={{ color: "#C2410C", fontSize: "14px" }}>{failure}</p>}
          </div>
        ) : (
          <div className="grid gap-7">
            {step.fields.filter(visible).map((f) => (
              <FieldView key={f.name} field={f} answers={answers} setAnswer={setAnswer} error={errors[f.name]} />
            ))}
          </div>
        )}

        <div className="mt-9 flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-2 font-semibold disabled:opacity-40"
            style={{ border: `1px solid ${colors.hairlineStrong}`, color: colors.heading, padding: "13px 20px", fontSize: "15px", minHeight: 44 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="button"
            onClick={onConsentStep ? submit : next}
            disabled={sending}
            className="inline-flex flex-1 items-center justify-center gap-2 font-semibold disabled:opacity-60"
            style={{ background: ORANGE, color: "#fff", padding: "13px 24px", fontSize: "15px", minHeight: 44 }}
          >
            {onConsentStep ? (sending ? "Sending…" : "Send my answers") : "Continue"}
            {!onConsentStep && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
