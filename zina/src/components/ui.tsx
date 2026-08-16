import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

import type { HealthStatus } from "../lib/api";
import { initials } from "../lib/format";

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

// ── Surfaces ───────────────────────────────────────────────────────────────

export function Panel({
  title,
  description,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cx(
        "rounded-xl border border-border bg-card",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-[13px] text-[color:var(--muted-foreground)]">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-[color:var(--muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * A single figure.
 *
 * The label sits above the number, not below: the eye lands on the big thing
 * first and needs the label already read to make sense of it.
 */
export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneColor =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "danger"
          ? "var(--danger)"
          : "var(--foreground)";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--subtle-foreground)]">
        {label}
      </p>
      {/* Proportional figures on purpose: tabular-nums gives every digit the
          width of a zero, which makes a large standalone number look loose.
          Tabular is for columns that must align, not for a headline. */}
      <p className="mt-1.5 text-[26px] font-semibold leading-none" style={{ color: toneColor }}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[12px] text-[color:var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

// ── Marks and state ────────────────────────────────────────────────────────

/** The small coloured square that says which app a row belongs to. */
export function AppMark({
  name,
  accent,
  size = 22,
}: {
  name: string;
  accent?: string | null;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[6px] font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: accent || "var(--muted-foreground)",
        fontSize: Math.round(size * 0.42),
      }}
      title={name}
    >
      {String(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

export function Avatar({ name, src, size = 30 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[color:var(--muted-surface)] font-semibold text-[color:var(--muted-foreground)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_STYLE: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: "color-mix(in srgb, var(--muted-foreground) 14%, transparent)", fg: "var(--muted-foreground)" },
  success: { bg: "color-mix(in srgb, var(--success) 16%, transparent)", fg: "var(--success)" },
  warning: { bg: "color-mix(in srgb, var(--warning) 18%, transparent)", fg: "var(--warning)" },
  danger: { bg: "color-mix(in srgb, var(--danger) 16%, transparent)", fg: "var(--danger)" },
  info: { bg: "color-mix(in srgb, var(--info) 16%, transparent)", fg: "var(--info)" },
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  const style = TONE_STYLE[tone];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
      style={{ background: style.bg, color: style.fg }}
    >
      {children}
    </span>
  );
}

const HEALTH_TONE: Record<HealthStatus, Tone> = {
  ok: "success",
  degraded: "warning",
  down: "danger",
  unconfigured: "neutral",
  unknown: "neutral",
};

const HEALTH_LABEL: Record<HealthStatus, string> = {
  ok: "Healthy",
  degraded: "Degraded",
  down: "Down",
  unconfigured: "Not connected",
  unknown: "Unchecked",
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const tone = HEALTH_TONE[status] ?? "neutral";
  return (
    <Badge tone={tone}>
      <span
        className="size-1.5 rounded-full"
        style={{ background: TONE_STYLE[tone].fg }}
        aria-hidden
      />
      {HEALTH_LABEL[status] ?? status}
    </Badge>
  );
}

// ── Controls ───────────────────────────────────────────────────────────────

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  busy?: boolean;
};

export function Button({
  variant = "secondary",
  size = "md",
  busy = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55";
  const sizing = size === "sm" ? "px-2.5 py-1.5 text-[12.5px]" : "px-3.5 py-2 text-[13.5px]";
  const variants = {
    primary:
      "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:brightness-95",
    secondary:
      "border border-border bg-[color:var(--muted-surface)] hover:border-[color:var(--border-strong)]",
    ghost: "hover:bg-[color:var(--muted-surface)]",
    danger:
      "border border-[color:var(--danger)] text-[color:var(--danger)] hover:bg-[color:color-mix(in_srgb,var(--danger)_12%,transparent)]",
  } as const;

  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(base, sizing, variants[variant], className)}
    >
      {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[color:var(--muted-foreground)]">{hint}</span>}
    </label>
  );
}

const controlClass =
  "w-full rounded-lg border border-border bg-[color:var(--input-background)] px-3 py-2 text-[13.5px] outline-none placeholder:text-[color:var(--subtle-foreground)] focus:border-[color:var(--ring)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(controlClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlClass, "min-h-24 resize-y", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(controlClass, "pr-8", props.className)} />;
}

// ── Tables ─────────────────────────────────────────────────────────────────

/**
 * Wide content scrolls inside its own container. The page body must never
 * scroll sideways — a dashboard that shifts horizontally when a long email
 * address appears is unusable on a laptop.
 */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[13.5px]">{children}</table>
    </div>
  );
}

export function Th({ children, align = "left" }: { children?: ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={cx(
        "border-b border-border px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-[color:var(--subtle-foreground)]",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cx(
        "border-b border-border px-4 py-3 align-middle",
        align === "right" ? "text-right" : "text-left",
        className
      )}
    >
      {children}
    </td>
  );
}

// ── States ─────────────────────────────────────────────────────────────────

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-[13.5px] text-[color:var(--muted-foreground)]">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-4 py-3.5 text-[13.5px]"
      style={{
        borderColor: "color-mix(in srgb, var(--danger) 40%, transparent)",
        background: "color-mix(in srgb, var(--danger) 8%, transparent)",
      }}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" style={{ color: "var(--danger)" }} aria-hidden />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1.5 text-[12.5px] font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-[14px] font-medium">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-[color:var(--muted-foreground)]">
          {description}
        </p>
      )}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Escape closes, and focus moves into the dialog so a keyboard user isn't
  // left tabbing through the page behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-[8vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full rounded-xl border border-border bg-card shadow-[var(--elevation-lg)] outline-none"
        style={{ maxWidth: width }}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-[color:var(--muted-surface)]">
            <X className="size-4" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-border px-5 py-3.5">{footer}</footer>
        )}
      </div>
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-[color:var(--primary)]"
          : "border-border hover:border-[color:var(--border-strong)]"
      )}
    >
      {children}
    </button>
  );
}
