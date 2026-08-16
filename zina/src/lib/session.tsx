import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { api, storeToken, storedToken, UnauthorizedError } from "./api";
import type { Permission, Staff } from "./api";

/**
 * Who is signed in, and what they're allowed to do.
 *
 * `can()` is the only thing screens should ask. The server checks the same
 * permission on every route — this exists so the UI doesn't offer an action
 * that would be refused, not as the enforcement itself.
 */
interface SessionValue {
  staff: Staff | null;
  loading: boolean;
  can: (permission: Permission) => boolean;
  /** Whether this person is limited to specific apps, and which. */
  scope: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on load. A token that the server no longer honours is
  // cleared rather than left to fail the next request confusingly.
  useEffect(() => {
    let cancelled = false;
    if (!storedToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ staff }) => {
        if (!cancelled) setStaff(staff);
      })
      .catch(() => {
        storeToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, staff } = await api.login(email, password);
    storeToken(token);
    setStaff(staff);
  }, []);

  const signOut = useCallback(() => {
    storeToken(null);
    setStaff(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      staff,
      loading,
      scope: staff?.appScope ?? [],
      can: (permission) => Boolean(staff?.permissions.includes(permission)),
      signIn,
      signOut,
    }),
    [staff, loading, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

/**
 * Load something once, with the three states every screen actually has:
 * loading, failed, and here-it-is.
 *
 * A session that expires mid-flight signs the user out rather than showing an
 * error they can do nothing about.
 */
export function useLoad<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; error: string | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const session = useContext(SessionContext);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof UnauthorizedError) session?.signOut();
        else setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, error, loading, reload: () => setNonce((n) => n + 1) };
}
