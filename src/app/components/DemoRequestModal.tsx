import { useState } from "react";
import type { FormEvent } from "react";
import { Check, X } from "lucide-react";
import { colors, shadow } from "../lib/brand";
import { productById } from "../config/products";
import type { ProductId } from "../config/products";
import { demoApi } from "../lib/api";

/**
 * "Request a demo", asked properly.
 *
 * This used to be a link to /contact, which asked a hospital administrator the
 * same three questions it asks someone reporting a typo. Every reply then had
 * to begin by working out what they actually run, which is a wasted round trip
 * on the request that matters most.
 *
 * So the qualifying questions differ per product: a school is sized in students
 * and a hospital in beds, and knowing which before the first call is the whole
 * point of the form. Anything the form sends is recorded by the API — the field
 * list lives here, not in a server-side schema, so adding a question is a
 * one-line change that cannot silently start dropping answers.
 */

interface Field {
  name: string;
  label: string;
  type?: "text" | "select" | "textarea";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

const COMMON: Field[] = [
  { name: "name", label: "Your name", required: true, placeholder: "Ada Okafor" },
  { name: "role", label: "Your role", placeholder: "Head of Operations" },
  { name: "email", label: "Work email", required: true, placeholder: "you@organisation.com" },
  { name: "phone", label: "Phone", placeholder: "+234 …" },
];

/** The questions worth asking before the first conversation, per product. */
const PER_PRODUCT: Partial<Record<ProductId, { orgLabel: string; fields: Field[] }>> = {
  edm73: {
    orgLabel: "School or institution",
    fields: [
      {
        name: "institutionType",
        label: "Type",
        type: "select",
        options: ["Primary school", "Secondary school", "College", "University", "Training institute"],
      },
      {
        name: "students",
        label: "Roughly how many students?",
        type: "select",
        options: ["Under 200", "200. 500", "500. 1,500", "1,500. 5,000", "Over 5,000"],
      },
      {
        name: "currentSystem",
        label: "What do you use today?",
        placeholder: "Spreadsheets, another system, paper…",
      },
    ],
  },
  hms7: {
    orgLabel: "Hospital or facility",
    fields: [
      {
        name: "facilityType",
        label: "Type",
        type: "select",
        options: ["Teaching hospital", "General hospital", "Specialist clinic", "Diagnostic centre", "Health group"],
      },
      {
        name: "beds",
        label: "Roughly how many beds?",
        type: "select",
        options: ["Under 20", "20 to 50", "50 to 150", "150 to 500", "Over 500"],
      },
      {
        name: "priority",
        label: "What matters most first?",
        type: "select",
        options: ["Patient records", "Billing and claims", "Pharmacy", "Ward and bed management", "Everything"],
      },
    ],
  },
  fms13: {
    orgLabel: "Organisation",
    fields: [
      {
        name: "sites",
        label: "How many sites or buildings?",
        type: "select",
        options: ["1", "2. 5", "6. 20", "Over 20"],
      },
      { name: "assets", label: "What are you maintaining?", placeholder: "Generators, chillers, lifts, fleet…" },
    ],
  },
};

const FALLBACK = { orgLabel: "Organisation", fields: [] as Field[] };

export function DemoRequestModal({ product, onClose }: { product: ProductId; onClose: () => void }) {
  const p = productById(product);
  // Health organisations register and get onboarded; everyone else books a demo.
  const isRegister = p.ctaType === "register";
  const spec = PER_PRODUCT[product] ?? FALLBACK;
  const fields: Field[] = [
    { name: "organisation", label: spec.orgLabel, required: true },
    ...COMMON,
    ...spec.fields,
    { name: "message", label: "Anything else we should know?", type: "textarea" },
  ];

  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await demoApi.request({ product, ...values });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: "100%",
    borderRadius: "12px",
    border: `1px solid ${colors.hairline}`,
    background: colors.surface,
    padding: "10px 13px",
    fontSize: "14px",
    color: colors.heading,
    outline: "none",
  } as const;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 pt-[6vh]"
      style={{ background: "rgba(10,12,20,0.45)", backdropFilter: "blur(10px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isRegister ? `Register your organisation for ${p.name}` : `Request a ${p.name} demo`}
        className="w-full rounded-[24px] overflow-hidden"
        style={{ maxWidth: 560, background: colors.surface, boxShadow: shadow.lg }}
      >
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5" style={{ background: `${p.accent}0f` }}>
          <div>
            <p style={{ color: p.accent, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em" }}>
              {p.name.toUpperCase()}
            </p>
            <h2 style={{ color: colors.heading, fontSize: "21px", fontWeight: 700, marginTop: "4px" }}>
              {done ? (isRegister ? "Registration received" : "Request received") : (isRegister ? "Register your organisation" : "Request a demo")}
            </h2>
            {!done && (
              <p style={{ color: colors.textSecondary, fontSize: "13.5px", marginTop: "6px" }}>
                {isRegister
                  ? "A few details so we can set you up properly and get in touch about onboarding."
                  : "A few details so the first conversation is useful rather than introductory."}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 shrink-0"
            style={{ color: colors.textTertiary }}
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="px-7 py-8 text-center">
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{ width: 46, height: 46, background: `${p.accent}1a`, color: p.accent }}
            >
              <Check size={22} />
            </span>
            <p style={{ color: colors.heading, fontSize: "16px", fontWeight: 600, marginTop: "14px" }}>
              {isRegister ? "You are registered." : "Thanks, we will be in touch shortly."}
            </p>
            <p style={{ color: colors.textSecondary, fontSize: "14px", marginTop: "6px", lineHeight: 1.6 }}>
              {isRegister
                ? `A confirmation is on its way to ${values.email}. Our team will contact you to begin onboarding ${values.organisation}.`
                : `A confirmation is on its way to ${values.email}. Someone will follow up to arrange a time that suits ${values.organisation}.`}
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-full px-6 py-2.5 font-semibold text-white"
              style={{ background: p.accent, fontSize: "14px" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-7 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => {
                const full = f.type === "textarea" || f.name === "organisation";
                return (
                  <label key={f.name} className={full ? "sm:col-span-2" : undefined}>
                    <span
                      className="mb-1.5 block"
                      style={{ color: colors.heading, fontSize: "13px", fontWeight: 600 }}
                    >
                      {f.label}
                      {f.required && <span style={{ color: p.accent }}> *</span>}
                    </span>

                    {f.type === "select" ? (
                      <select
                        required={f.required}
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Select…</option>
                        {f.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                        style={{ ...inputStyle, resize: "vertical" }}
                      />
                    ) : (
                      <input
                        type={f.name === "email" ? "email" : "text"}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </label>
                );
              })}
            </div>

            {error && (
              <p style={{ color: "#DC2626", fontSize: "13.5px", marginTop: "14px" }} role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                disabled={busy}
                className="rounded-full px-6 py-3 font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: p.accent, fontSize: "14.5px" }}
              >
                {busy ? "Sending…" : "Request a demo"}
              </button>
              <span style={{ color: colors.textTertiary, fontSize: "12.5px" }}>
                No obligation. We'll reply by email.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
