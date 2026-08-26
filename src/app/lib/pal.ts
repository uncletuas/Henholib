import { PAL_URL } from "../config/site";
import { ssoApi, palApi, type AuthUser } from "./api";

type AuthView = "none" | "signin" | "signup" | "dashboard";

/** SSO-launch the Pal workspace in the current tab (avoids popup blocking). */
export async function launchWorkspace(token: string) {
  try {
    const { ssoToken } = await ssoApi.getLaunchToken("stack62", token);
    window.location.href = `${PAL_URL}/sso?token=${encodeURIComponent(ssoToken)}`;
  } catch {
    window.location.href = PAL_URL;
  }
}

interface PalCtx {
  user: AuthUser | null;
  token: string | null;
  setShowAuth: (v: AuthView) => void;
  setShowPalOnboarding: (v: boolean) => void;
  setPendingPal: (v: boolean) => void;
  setShowPalWaitlist?: (v: boolean) => void;
}

/**
 * Pal is closed to the public.
 *
 * Every in-site route into the workspace stops at the waitlist. What is
 * deliberately NOT gated is pal.loopital.com itself: typing the address, or
 * following a direct link, still reaches the app. That is what keeps internal
 * testing working without a flag anyone has to remember to flip back.
 */
export const PAL_PUBLIC_ACCESS = false;

/**
 * The "Try Pal" action. Not signed in → register (then resume after auth via
 * pendingPal). First-time → onboarding (personal/team). Otherwise → launch.
 */
export function openPalWorkspace(ctx: PalCtx) {
  if (!PAL_PUBLIC_ACCESS) {
    ctx.setShowPalWaitlist?.(true);
    return;
  }
  if (!ctx.user || !ctx.token) {
    ctx.setPendingPal(true);
    ctx.setShowAuth("signup");
    return;
  }
  const token = ctx.token;
  palApi
    .getProfile(token)
    .then((pr) => { if (!pr.onboarded) ctx.setShowPalOnboarding(true); else launchWorkspace(token); })
    .catch(() => launchWorkspace(token));
}
