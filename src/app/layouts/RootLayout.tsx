import { Outlet, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { AccountDashboard } from "../components/AccountDashboard";
import { ScrollToTop } from "../components/ScrollToTop";
import { Seo } from "../components/Seo";
import { getPageSeo } from "../config/seo-pages";
import { useAuth } from "../context/AuthContext";

export function RootLayout() {
  const { showAuth, setShowAuth, signOut, user } = useAuth();
  const location = useLocation();
  const seo = getPageSeo(location.pathname);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBFBFD" }}>
      <Seo {...seo} path={location.pathname} />
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
