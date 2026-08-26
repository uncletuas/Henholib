import { useEffect } from "react";
import { MODUS_URL } from "../config/site";

/**
 * Modus has no on-site landing page — its old /products/* routes bounce
 * straight to the live app so any existing bookmark or search result lands the
 * user in the product itself.
 *
 * Swift used to redirect from here too. It was folded into Pal, so its paths
 * now resolve to /products in routes.ts instead of a host that is gone.
 */
function goto(url: string) {
  if (typeof window !== "undefined") window.location.replace(url);
}

export function ModusRedirect() {
  useEffect(() => goto(MODUS_URL), []);
  return null;
}
