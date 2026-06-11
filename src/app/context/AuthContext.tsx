import { createContext, useContext, useState, ReactNode } from "react";

interface User { name: string; email: string; }

interface AuthContextType {
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
  showAuth: "none" | "signin" | "signup" | "dashboard";
  setShowAuth: (v: "none" | "signin" | "signup" | "dashboard") => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState<"none" | "signin" | "signup" | "dashboard">("none");

  return (
    <AuthContext.Provider value={{
      user,
      signIn: (u) => { setUser(u); setShowAuth("dashboard"); },
      signOut: () => { setUser(null); setShowAuth("none"); },
      showAuth,
      setShowAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
