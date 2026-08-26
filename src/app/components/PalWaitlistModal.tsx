import { useState } from "react";
import { Check, X } from "lucide-react";
import { colors, shadow } from "../lib/brand";
import { waitlistApi } from "../lib/api";
import { CoworkerFace } from "./pal/CoworkerFace";

/**
 * Pal is not open to the public yet.
 *
 * Every "Try Pal Workspace" click lands here instead of launching the app. The
 * direct link to pal.loopital.com is untouched and still works, which is what
 * keeps internal testing possible without a feature flag to forget about later.
 *
 * The face is here rather than a generic form because the thing being waited
 * for is the coworker, and showing it is more persuasive than describing it.
 */
export function PalWaitlistModal({
  open,
  onClose,
  defaultEmail,
  defaultName,
}: {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [name, setName] = useState(defaultName ?? "");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("Add your email so we can reach you.");
    setState("sending");
    setError(null);
    try {
      await waitlistApi.join("stack62", email.trim(), name.trim() || undefined);
      setState("done");
    } catch {
      setError("That did not go through. Try again in a moment.");
      setState("idle");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center px-4"
      style={{ background: "rgba(11,16,32,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Join the Pal waitlist"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full"
        style={{
          maxWidth: 440,
          background: colors.surface,
          borderRadius: 26,
          padding: "30px 28px",
          boxShadow: shadow.lg,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4"
          style={{ color: colors.textTertiary }}
        >
          <X size={18} />
        </button>

        <div
          className="grid place-items-center rounded-[30%] overflow-hidden"
          style={{
            width: 62,
            height: 62,
            background: "linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)",
            marginBottom: 16,
          }}
        >
          <CoworkerFace size={50} mood="happy" trackPointer={false} interactive={false} />
        </div>

        {state === "done" ? (
          <>
            <h2 style={{ fontSize: "22px", color: colors.heading, marginBottom: 8 }}>
              You are on the list.
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.6 }}>
              We are letting people in a group at a time so the coworker gets the
              attention it needs. You will hear from us at {email}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full py-3 font-semibold"
              style={{ background: colors.surfaceMuted, color: colors.heading, fontSize: "14.5px" }}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: "22px", color: colors.heading, marginBottom: 8 }}>
              Pal opens soon.
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: "15px", lineHeight: 1.6, marginBottom: 20 }}>
              An AI coworker that drafts the report, answers the inbox and
              publishes to your socials. We are onboarding in small groups. Leave
              your email and we will come to you.
            </p>

            <form onSubmit={join} className="grid gap-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full"
                style={{
                  border: `1px solid ${colors.hairlineStrong}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: "15px",
                  color: colors.heading,
                }}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@company.com"
                className="w-full"
                style={{
                  border: `1px solid ${colors.hairlineStrong}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: "15px",
                  color: colors.heading,
                }}
              />
              {error && (
                <p style={{ color: colors.rose, fontSize: "13px" }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={state === "sending"}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold disabled:opacity-60"
                style={{ background: "linear-gradient(120deg,#6366F1,#4F46E5)", color: "#fff", fontSize: "14.5px" }}
              >
                {state === "sending" ? "Adding you…" : (<><Check size={16} /> Join the waitlist</>)}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
