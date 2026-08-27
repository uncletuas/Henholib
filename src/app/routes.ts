import { createBrowserRouter, redirect } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ProductsPage } from "./pages/ProductsPage";
import { PalPage } from "./pages/products/PalPage";
import { Hms7Page } from "./pages/products/Hms7Page";
import { HenholibPage } from "./pages/products/HenholibPage";
import { Edm73Page } from "./pages/products/Edm73Page";
import { ModusRedirect } from "./components/AppRedirects";
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
      // Product pages live at the product's name. The codename paths are kept
      // as 301-style redirects rather than deleted: they are in search results
      // and in the company profile PDF, and a dead link is a worse outcome than
      // an old one that forwards.
      { path: "products/pal", Component: PalPage },
      { path: "products/modus", Component: ModusRedirect },
      { path: "products/beacon", Component: Edm73Page },
      { path: "products/henholib", Component: HenholibPage },
      { path: "products/hms7", Component: Hms7Page },

      { path: "products/stack62", loader: () => redirect("/products/pal") },
      // Swift was folded into Pal. Its old paths point at the portfolio
      // rather than swift.loopital.com, which no longer resolves.
      { path: "products/swift", loader: () => redirect("/products") },
      { path: "products/sart34", loader: () => redirect("/products") },
      { path: "products/fms13", Component: ModusRedirect },
      { path: "products/edm73", loader: () => redirect("/products/beacon") },
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
