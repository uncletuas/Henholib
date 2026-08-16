/** Shared formatting. Kept in one place so a figure reads the same on every screen. */

/**
 * Money arrives in minor units (kobo, cents) because that is how Paystack and
 * the ledger store it. Never format a minor amount as if it were major.
 */
export function money(minor: number, currency = "NGN"): string {
  const value = (Number(minor) || 0) / 100;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function count(value: number | null | undefined): string {
  return (Number(value) || 0).toLocaleString();
}

/** A compact absolute date — "14 Aug 2026". Unambiguous across regions. */
export function date(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${date(value)}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * "3 minutes ago". Used for health checks and activity, where the age of the
 * fact matters more than the clock time it happened at.
 */
export function ago(value: string | null | undefined): string {
  if (!value) return "never";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "never";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date(value);
}

export function initials(name: string | null | undefined): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Turn `support.reply` or `app.switch` into `Support reply`. */
export function humanise(value: string): string {
  const words = String(value || "").replace(/[._-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
