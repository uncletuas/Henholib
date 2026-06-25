import { Globe, Monitor, Smartphone } from "lucide-react";
import { colors } from "../lib/brand";

export type Platform = "web" | "desktop" | "mobile";

const meta: Record<Platform, { label: string; icon: typeof Globe }> = {
  web: { label: "Web", icon: Globe },
  desktop: { label: "Desktop", icon: Monitor },
  mobile: { label: "Mobile", icon: Smartphone },
};

interface PlatformPillsProps {
  platforms: Platform[];
  /** Render light pills on a dark background. */
  dark?: boolean;
}

/** Compact "Web · Desktop · Mobile" availability row. */
export function PlatformPills({ platforms, dark = false }: PlatformPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {platforms.map((p) => {
        const Icon = meta[p].icon;
        return (
          <span
            key={p}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: dark ? "rgba(255,255,255,0.08)" : colors.surfaceMuted,
              color: dark ? "#D1D5DB" : colors.textSecondary,
              border: dark ? "1px solid rgba(255,255,255,0.10)" : `1px solid ${colors.hairline}`,
            }}
          >
            <Icon size={13} />
            {meta[p].label}
          </span>
        );
      })}
    </div>
  );
}
