import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authApi, AuthUser } from "../lib/api";

/**
 * The team-member session used by the onboarding portal (loopital.com/onboarding).
 * Patients and hospitals sign in to the Loopital app itself, not here.
 */
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  /** True while restoring an existing session on first load. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const TOKEN_KEY = "loopital_token";
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(TOKEN_KEY); } catch { /* storage blocked */ }
    if (!stored) {
      setInitializing(false);
      return;
    }
    authApi
      .me(stored)
      .then((res) => { setUser(res.user); setToken(stored); })
      .catch(() => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } })
      .finally(() => setInitializing(false));
  }, []);

  const persist = (t: string, u: AuthUser) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage blocked */ }
    setToken(t);
    setUser(u);
  };

  const signIn = async (email: string, password: string) => {
    const res = await authApi.signin(email, password);
    persist(res.token, res.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const res = await authApi.signup(name, email, password);
    persist(res.token, res.user);
  };

  const signOut = () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, initializing, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
