import { useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { AccountDashboard } from "../components/AccountDashboard";
import { WaitlistModal } from "../components/WaitlistModal";
import { PalOnboardingModal } from "../components/PalOnboardingModal";
import { ScrollToTop } from "../components/ScrollToTop";
import { Seo } from "../components/Seo";
import { getPageSeo } from "../config/seo-pages";
import { useAuth } from "../context/AuthContext";
import { palApi } from "../lib/api";
import { launchWorkspace } from "../lib/pal";

export function RootLayout() {
  const { showAuth, setShowAuth, signOut, user, token, waitlist, setWaitlist, showPalOnboarding, setShowPalOnboarding, pendingPal, setPendingPal } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const seo = getPageSeo(location.pathname);

  // App shells (the Academy student + facilitator portals) are full-app
  // experiences — hide the marketing site chrome (nav + footer) there.
  const isAppShell =
    location.pathname.startsWith("/academy/learn") ||
    location.pathname.startsWith("/academy/portal");

  // Deep-link from the Pal app's "Add the coworker" upgrade CTA:
  // `?upgrade=coworker` opens the account dashboard (where "Add coworker"
  // lives) when signed in, or the sign-up modal first when not.
  useEffect(() => {
    if (params.get("upgrade") !== "coworker") return;
    setShowAuth(user ? "dashboard" : "signup");
  }, [params, user, setShowAuth]);

  // Resume a "Try Pal" click after the user signs in/registers: onboard if
  // first-time, otherwise launch straight into the workspace.
  useEffect(() => {
    if (!(user && token && pendingPal)) return;
    setPendingPal(false);
    palApi.getProfile(token)
      .then((pr) => { if (!pr.onboarded) setShowPalOnboarding(true); else launchWorkspace(token); })
      .catch(() => launchWorkspace(token));
  }, [user, token, pendingPal, setPendingPal, setShowPalOnboarding]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBFBFD" }}>
      <Seo {...seo} path={location.pathname} />
      <ScrollToTop />
      {!isAppShell && <Navbar />}
      <main className={`flex-1 ${isAppShell ? "" : "pt-16"}`}>
        <Outlet />
      </main>
      {!isAppShell && <Footer />}

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
      {waitlist && (
        <WaitlistModal product={waitlist} onClose={() => setWaitlist(null)} />
      )}
      {showPalOnboarding && <PalOnboardingModal />}
    </div>
  );
}
