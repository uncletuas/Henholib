import { colors } from "../lib/brand";
import { Outlet, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ScrollToTop } from "../components/ScrollToTop";
import { Seo } from "../components/Seo";
import { getPageSeo } from "../config/seo-pages";

export function RootLayout() {
  const location = useLocation();
  const seo = getPageSeo(location.pathname);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg }}>
      <Seo {...seo} path={location.pathname} />
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
