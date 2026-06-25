import { useEffect } from "react";
import { useLocation } from "react-router";

// Resets scroll position to the top on every route change, and smoothly
// scrolls to an anchor when the URL contains a hash (e.g. /services#ai).
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
