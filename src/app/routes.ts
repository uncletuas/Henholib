import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ProductsPage } from "./pages/ProductsPage";
import { Stack62Page } from "./pages/products/Stack62Page";
import { Sart34Page } from "./pages/products/Sart34Page";
import { Hms7Page } from "./pages/products/Hms7Page";
import { HenholibPage } from "./pages/products/HenholibPage";
import { Fms13Page } from "./pages/products/Fms13Page";
import { Edm73Page } from "./pages/products/Edm73Page";
import { ServicesPage } from "./pages/ServicesPage";
import { AcademyPage } from "./pages/academy/AcademyPage";
import { AcademyCoursePage } from "./pages/academy/AcademyCoursePage";
import { AcademyApplyPage } from "./pages/academy/AcademyApplyPage";
import { AcademyAdminPage } from "./pages/academy/AcademyAdminPage";
import { FacilitatorPortalPage } from "./pages/academy/FacilitatorPortalPage";
import { StudentPortalPage } from "./pages/academy/StudentPortalPage";
import { VerifyPage } from "./pages/academy/VerifyPage";
import { AchievementsPage } from "./pages/academy/AchievementsPage";
import { ContactPage } from "./pages/ContactPage";
import { InsightsPage } from "./pages/InsightsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { FounderPage } from "./pages/FounderPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "about", Component: AboutPage },
      { path: "products", Component: ProductsPage },
      { path: "products/stack62", Component: Stack62Page },
      { path: "products/sart34", Component: Sart34Page },
      { path: "products/hms7", Component: Hms7Page },
      { path: "products/henholib", Component: HenholibPage },
      { path: "products/fms13", Component: Fms13Page },
      { path: "products/edm73", Component: Edm73Page },
      { path: "services", Component: ServicesPage },
      { path: "academy", Component: AcademyPage },
      { path: "academy/admin", Component: AcademyAdminPage },
      { path: "academy/portal", Component: FacilitatorPortalPage },
      { path: "academy/learn", Component: StudentPortalPage },
      { path: "verify", Component: VerifyPage },
      { path: "u/:username", Component: AchievementsPage },
      { path: "academy/apply/:slug", Component: AcademyApplyPage },
      { path: "academy/:slug", Component: AcademyCoursePage },
      { path: "contact", Component: ContactPage },
      { path: "insights", Component: InsightsPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "terms", Component: TermsPage },
      { path: "tuamene.bestgod", Component: FounderPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
