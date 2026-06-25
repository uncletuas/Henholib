import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { AccountDashboard } from "../components/AccountDashboard";
import { ScrollToTop } from "../components/ScrollToTop";
import { useAuth } from "../context/AuthContext";

export function RootLayout() {
  const { showAuth, setShowAuth, signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBFBFD" }}>
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />

      {(showAuth === "signin" || showAuth === "signup") && (
        <AuthModal
          mode={showAuth}
          onClose={() => setShowAuth("none")}
          onToggleMode={() => setShowAuth(showAuth === "signin" ? "signup" : "signin")}
        />
      )}
      {showAuth === "dashboard" && user && (
        <AccountDashboard
          user={user}
          onClose={() => setShowAuth("none")}
          onSignOut={signOut}
        />
      )}
    </div>
  );
}
