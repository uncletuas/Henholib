import { useEffect } from "react";
import { SART34_URL, FMS13_URL } from "../config/site";

/**
 * Swift and FMS13 no longer have on-site landing pages — their old
 * /products/* routes now bounce straight to the live app so any existing
 * bookmark or search result lands the user in the product itself.
 */
function goto(url: string) {
  if (typeof window !== "undefined") window.location.replace(url);
}

export function SwiftRedirect() {
  useEffect(() => goto(SART34_URL), []);
  return null;
}

export function Fms13Redirect() {
  useEffect(() => goto(FMS13_URL), []);
  return null;
}
