import { Apple, Play } from "lucide-react";

interface StoreBadgesProps {
  appStore?: string;
  playStore?: string;
  /** Light badges for dark backgrounds vs dark badges for light backgrounds. */
  theme?: "dark" | "light";
  size?: "sm" | "md";
}

/**
 * App Store + Google Play download badges. Henholib is the product with a
 * mobile app, so these live on its surfaces only. Links default to "#" until
 * real store URLs are supplied via the product catalog.
 */
export function StoreBadges({ appStore = "#", playStore = "#", theme = "dark", size = "md" }: StoreBadgesProps) {
  const dark = theme === "dark";
  const pad = size === "sm" ? "px-4 py-2.5" : "px-5 py-3";
  const base: React.CSSProperties = {
    background: dark ? "#0A0A0F" : "#FFFFFF",
    color: dark ? "#FFFFFF" : "#0A0A0F",
    border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.12)",
  };

  const badge = (href: string, Icon: typeof Apple, top: string, bottom: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3  transition-all hover:-translate-y-0.5 ${pad}`}
      style={base}
    >
      <Icon size={size === "sm" ? 22 : 26} />
      <span className="flex flex-col leading-none text-left">
        <span style={{ fontSize: "10px", opacity: 0.7, marginBottom: "3px" }}>{top}</span>
        <span style={{ fontSize: size === "sm" ? "14px" : "16px", fontWeight: 600 }}>{bottom}</span>
      </span>
    </a>
  );

  return (
    <div className="flex flex-wrap gap-3">
      {badge(appStore, Apple, "Download on the", "App Store")}
      {badge(playStore, Play, "Get it on", "Google Play")}
    </div>
  );
}
