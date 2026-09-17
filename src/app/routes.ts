import { createBrowserRouter, redirect } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { ContributePage } from "./pages/ContributePage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { InsightsPage } from "./pages/InsightsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { FounderPage } from "./pages/FounderPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * The company pages. The site root and everything under the app (/portal, /rx…)
 * is served by the Loopital app on the same domain, so a client-side navigation
 * to "/" hands over with a full page load instead of rendering anything here.
 */
function toApp(path: string) {
  return () => {
    if (typeof window !== "undefined") window.location.replace(path);
    return null;
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, loader: toApp("/") },
      { path: "about", Component: AboutPage },
      // The old product pages are gone; anyone arriving on one lands in the app.
      { path: "products", loader: toApp("/") },
      { path: "products/*", loader: toApp("/") },
      { path: "contact", Component: ContactPage },
      { path: "contribute", Component: ContributePage },
      { path: "insights", Component: InsightsPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "terms", Component: TermsPage },
      { path: "refund-policy", Component: RefundPolicyPage },
      // Internal. Noindex in seo-pages.
      { path: "onboarding", Component: OnboardingPage },
      { path: "tuamene.bestgod", Component: FounderPage },
      { path: "payment/callback", loader: () => redirect("/contact") },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
