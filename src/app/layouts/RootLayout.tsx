import { useEffect } from "react";
import { colors } from "../lib/brand";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { AccountDashboard } from "../components/AccountDashboard";
import { WaitlistModal } from "../components/WaitlistModal";
import { DemoRequestModal } from "../components/DemoRequestModal";
import { PalOnboardingModal } from "../components/PalOnboardingModal";
import { PalPlansModal } from "../components/PalPlansModal";
import { PlatformGuideModal } from "../components/PlatformGuideModal";
import { ScrollToTop } from "../components/ScrollToTop";
import { Seo } from "../components/Seo";
import { getPageSeo } from "../config/seo-pages";
import { useAuth } from "../context/AuthContext";
import { palApi } from "../lib/api";
import { launchWorkspace } from "../lib/pal";

export function RootLayout() {
  const { showAuth, setShowAuth, signOut, user, token, waitlist, setWaitlist, demoFor, setDemoFor, showPalOnboarding, setShowPalOnboarding, showPalPlans, setShowPalPlans, pendingPal, setPendingPal, showGuide, setShowGuide } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const seo = getPageSeo(location.pathname);

  // No in-site app shells — Pal is a separate app (external redirect).
  const isAppShell = false;

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

  // Show the ecosystem guide once, the first time a signed-in user lands.
  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem("loopital_guide_seen")) return;
      localStorage.setItem("loopital_guide_seen", "1");
      setShowGuide(true);
    } catch { /* storage blocked — skip */ }
  }, [user, setShowGuide]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg }}>
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
      {demoFor && <DemoRequestModal product={demoFor} onClose={() => setDemoFor(null)} />}
      {showPalOnboarding && <PalOnboardingModal />}
      {showPalPlans && token && (
        <PalPlansModal
          token={token}
          currentPlan="free"
          onContinueFree={() => { setShowPalPlans(false); launchWorkspace(token); }}
          onClose={() => { setShowPalPlans(false); launchWorkspace(token); }}
        />
      )}
      {showGuide && <PlatformGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
