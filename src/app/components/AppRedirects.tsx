import { useEffect } from "react";
import { SWIFT_URL, MODUS_URL } from "../config/site";

/**
 * Swift and Modus no longer have on-site landing pages — their old
 * /products/* routes now bounce straight to the live app so any existing
 * bookmark or search result lands the user in the product itself.
 */
function goto(url: string) {
  if (typeof window !== "undefined") window.location.replace(url);
}

export function SwiftRedirect() {
  useEffect(() => goto(SWIFT_URL), []);
  return null;
}

export function ModusRedirect() {
  useEffect(() => goto(MODUS_URL), []);
  return null;
}
