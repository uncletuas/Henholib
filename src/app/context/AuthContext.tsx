import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authApi, AuthUser } from "../lib/api";
import type { ProductId } from "../config/products";

type AuthView = "none" | "signin" | "signup" | "dashboard";

interface AuthContextType {
  user: AuthUser | null;
  /** Bearer token for authenticated API calls (e.g. the account portal). */
  token: string | null;
  /** True while restoring an existing session on first load. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  showAuth: AuthView;
  setShowAuth: (v: AuthView) => void;
  /** The product whose waitlist modal is open, or null when closed. */
  waitlist: ProductId | null;
  setWaitlist: (p: ProductId | null) => void;
  /** Pal workspace onboarding modal (personal vs team) open state. */
  showPalOnboarding: boolean;
  setShowPalOnboarding: (v: boolean) => void;
  /** True when a "Try Pal" click is waiting for sign-in to complete. */
  pendingPal: boolean;
  setPendingPal: (v: boolean) => void;
}

const TOKEN_KEY = "loopital_token";
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showAuth, setShowAuth] = useState<AuthView>("none");
  const [waitlist, setWaitlist] = useState<ProductId | null>(null);
  const [showPalOnboarding, setShowPalOnboarding] = useState(false);
  const [pendingPal, setPendingPal] = useState(false);

  // Restore session from a stored token on first load.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setInitializing(false);
      return;
    }
    authApi
      .me(stored)
      .then((res) => { setUser(res.user); setToken(stored); })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setInitializing(false));
  }, []);

  const persist = (t: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    // Google-style: signing in just closes the modal; the account menu (avatar)
    // is how you reach your apps + account afterwards.
    setShowAuth("none");
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
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setShowAuth("none");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, initializing, signIn, signUp, signOut, showAuth, setShowAuth, waitlist, setWaitlist, showPalOnboarding, setShowPalOnboarding, pendingPal, setPendingPal }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
