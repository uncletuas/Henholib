import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ProductsPage } from "./pages/ProductsPage";
import { Stack62Page } from "./pages/products/Stack62Page";
import { Hms7Page } from "./pages/products/Hms7Page";
import { HenholibPage } from "./pages/products/HenholibPage";
import { Edm73Page } from "./pages/products/Edm73Page";
import { SwiftRedirect, Fms13Redirect } from "./components/AppRedirects";
import { PaymentCallbackPage } from "./pages/PaymentCallbackPage";
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
      { path: "products/sart34", Component: SwiftRedirect },
      { path: "products/hms7", Component: Hms7Page },
      { path: "products/henholib", Component: HenholibPage },
      { path: "products/fms13", Component: Fms13Redirect },
      { path: "products/edm73", Component: Edm73Page },
      { path: "payment/callback", Component: PaymentCallbackPage },
      { path: "contact", Component: ContactPage },
      { path: "insights", Component: InsightsPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "terms", Component: TermsPage },
      { path: "tuamene.bestgod", Component: FounderPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
