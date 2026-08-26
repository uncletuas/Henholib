import { useState } from "react";
import type { FormEvent } from "react";

import { useSession } from "../lib/session";
import { Button, ErrorNote, Field, Input } from "../components/ui";

/**
 * The one door.
 *
 * senate, ministry, assembly and academia each had their own sign-in with its
 * own password. This replaces all four: the same Loopital account you already
 * have, and standing granted by a staff record rather than a separate
 * credential to remember and rotate.
 */
export function LoginPage() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--sidebar)] p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
              <path
                d="M6 7h12l-8 10h8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[19px] font-semibold text-white">Zina</h1>
            <p className="text-[12.5px] text-[color:var(--sidebar-muted)]">
              The Loopital control plane
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--card)] p-6"
        >
          <h2 className="text-[15px] font-semibold">Sign in</h2>
          <p className="mt-1 text-[13px] text-[color:var(--muted-foreground)]">
            Use your Loopital account. Access is granted by role, not by a separate password.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@loopital.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </div>

          {error && (
            <div className="mt-4">
              <ErrorNote message={error} />
            </div>
          )}

          <Button type="submit" variant="primary" busy={busy} className="mt-5 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-[12px] text-[color:var(--sidebar-muted)]">
          Managing Pal, Modus, Beacon, Henholib and Loopital.
        </p>
      </div>
    </div>
  );
}
