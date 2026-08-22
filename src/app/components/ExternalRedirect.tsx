import { useEffect } from "react";
import { colors } from "../lib/brand";

// Sends visitors of a legacy in-site route to the product's own subdomain
// landing page. Renders a lightweight branded splash during the redirect.
export function ExternalRedirect({ to, name }: { to: string; name: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.replace(to);
    }, 600);
    return () => clearTimeout(t);
  }, [to]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 text-center px-6"
      style={{ minHeight: "calc(100vh - 64px)", background: colors.surface }}
    >
      <div
        className="w-10 h-10 rounded-full animate-spin"
        style={{ border: "3px solid #EEF4FF", borderTopColor: colors.blue }}
      />
      <div>
        <p style={{ fontSize: "18px", fontWeight: 700, color: colors.heading }}>
          Taking you to {name}
        </p>
        <p style={{ fontSize: "14px", color: colors.textSecondary, marginTop: "6px" }}>
          If you are not redirected,{" "}
          <a href={to} style={{ color: colors.blue, fontWeight: 600 }}>
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
