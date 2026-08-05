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
}

/**
 * The "Try Pal" action. Not signed in → register (then resume after auth via
 * pendingPal). First-time → onboarding (personal/team). Otherwise → launch.
 */
export function openPalWorkspace(ctx: PalCtx) {
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
