import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "../config/site";

// Load the Google Identity Services script once, shared across mounts.
let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const w = window as unknown as { google?: { accounts?: { id?: unknown } } };
    if (w.google?.accounts?.id) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Sign-In."));
    document.head.appendChild(s);
  });
  return gisPromise;
}

interface GoogleWindow {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
        renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
      };
    };
  };
}

/**
 * Renders Google's official "Sign in / up with Google" button. On success it
 * hands the ID token (credential) up to the caller, which exchanges it with the
 * backend for a session.
 */
export function GoogleSignInButton({
  onCredential,
  text = "continue_with",
}: {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !ref.current) return;
        const id = (window as unknown as GoogleWindow).google?.accounts?.id;
        if (!id) return;
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => { if (resp.credential) cb.current(resp.credential); },
        });
        ref.current.innerHTML = "";
        id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text,
          shape: "pill",
          logo_alignment: "center",
          width: 320,
        });
      })
      .catch(() => { /* Google unavailable. the email/password form still works */ });
    return () => { cancelled = true; };
  }, [text]);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={ref} className="flex justify-center min-h-[44px]" />;
}
