import { Link, useParams } from "react-router";
import { useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

import { api } from "../lib/api";
import type { OpsSection } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { ago, count, money } from "../lib/format";
import {
  AppMark,
  Badge,
  Button,
  Empty,
  ErrorNote,
  HealthBadge,
  Loading,
  Panel,
  Stat,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

/**
 * One app, managed from inside Zina.
 *
 * This exists because bouncing an operator out to four separate portals is the
 * thing we were trying to get rid of — and half those portals aren't reachable
 * anyway. What the app itself knows (its users, its figures, its health) comes
 * over the connector. What the group knows about it (revenue, subscribers,
 * email, support) was already here.
 *
 * Every connector-backed block degrades on its own: an app with no connector
 * still shows its money and its tickets, because those never belonged to the
 * app in the first place.
 */
export function AppDetailPage() {
  const { id = "" } = useParams();
  const { can } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.appDashboard(id), [id]);
  const [opening, setOpening] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (loading) return <Loading label="Asking the app about itself" />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  const { app } = data;
  const emailFailed = data.email30d.failed || 0;
  const openTickets = data.tickets.filter((t) => ["open", "in_progress"].includes(t.status)).length;
  const activePlans = data.money.subscriptions
    .filter((s) => s.status === "active")
    .reduce((n, s) => n + s.count, 0);

  const summaryEntries =
    data.summary.available && data.summary.data
      ? Object.entries(data.summary.data).filter(
          ([, v]) => typeof v === "number" || typeof v === "string" || v === null
        )
      : [];

  const appUsers =
    data.users.available && data.users.data?.users ? data.users.data.users : [];

  async function openOwnPortal() {
    setOpening(true);
    setNote(null);
    try {
      const result = await api.switchInto(app.id);
      if (result.mode === "link" && result.note) setNote(result.note);
      window.open(result.url, "_blank", "noopener");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't open that app.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <>
      <Link
        to="/apps"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[color:var(--muted-foreground)] hover:underline"
      >
        <ArrowLeft className="size-3.5" /> All apps
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <AppMark name={app.name} accent={app.accent} size={44} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[22px] font-semibold">{app.name}</h1>
              <HealthBadge status={data.health.status} />
            </div>
            <p className="text-[13.5px] text-[color:var(--muted-foreground)]">{app.tagline}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={reload}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          {app.appUrl && (
            <a
              href={app.appUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[color:var(--muted-surface)] px-3.5 py-2 text-[13.5px] font-medium"
            >
              Visit app <ExternalLink className="size-3" />
            </a>
          )}
          {can("app:switch") && (
            <Button variant="primary" onClick={openOwnPortal} busy={opening}>
              Open its own portal <ExternalLink className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {note && (
        <div className="mb-5 rounded-xl border border-border bg-[color:var(--muted-surface)] px-4 py-3 text-[13px]">
          {note}
        </div>
      )}

      {!app.connected && (
        <div className="mb-5">
          <ErrorNote
            message={`${app.name} has no ops connector configured, so it can't report its own figures. Everything below still shows what Loopital knows about it — set its connector URL under Apps → Configure.`}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Collected" value={money(data.money.collectedMinor)} hint="Shared Paystack" />
        <Stat label="Subscribers" value={count(activePlans)} hint="Active plans" />
        <Stat label="Open support" value={count(openTickets)} tone={openTickets ? "warning" : "neutral"} />
        <Stat
          label="Email failures"
          value={count(emailFailed)}
          tone={emailFailed ? "danger" : "success"}
          hint="Last 30 days"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Panel
            title={`What ${app.name} reports`}
            description="Live from the app's own database, over its connector."
          >
            {summaryEntries.length > 0 ? (
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {summaryEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--subtle-foreground)]">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="mt-1 text-[20px] font-semibold">
                      {value === null ? "—" : typeof value === "number" ? count(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <OpsFallback section={data.summary} appName={app.name} />
            )}
          </Panel>

          {can("billing:read") && (
            <Panel title="Recent payments" padded={false}>
              {data.money.recentPayments.length === 0 ? (
                <Empty title="No payments yet" />
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Customer</Th>
                      <Th>For</Th>
                      <Th>Status</Th>
                      <Th align="right">Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.money.recentPayments.map((p) => (
                      <tr key={p.reference}>
                        <Td>
                          <p className="font-medium">{p.customer?.name ?? "—"}</p>
                          <p className="text-[12px] text-[color:var(--muted-foreground)]">
                            {p.customer?.email}
                          </p>
                        </Td>
                        <Td>
                          {p.purpose === "credits"
                            ? `${count(p.credits ?? 0)} credits`
                            : p.plan || "subscription"}
                        </Td>
                        <Td>
                          <Badge
                            tone={
                              p.status === "success"
                                ? "success"
                                : p.status === "failed"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {p.status}
                          </Badge>
                        </Td>
                        <Td align="right" className="tabular font-medium">
                          {money(p.amountMinor, p.currency)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Panel>
          )}

          {can("user:read") && (
            <Panel
              title={`People in ${app.name}`}
              description="A sample from the app's own user table."
            >
              {appUsers.length > 0 ? (
                <ul className="divide-y divide-[color:var(--border)]">
                  {appUsers.map((u, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{String(u.name ?? "—")}</p>
                        <p className="truncate text-[12px] text-[color:var(--muted-foreground)]">
                          {String(u.email ?? "")}
                        </p>
                      </div>
                      {u.status ? <Badge>{String(u.status)}</Badge> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <OpsFallback section={data.users} appName={app.name} />
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          <Panel title="Health">
            <dl className="space-y-2.5 text-[13px]">
              {[
                ["Connector", app.connected ? "Configured" : "Not configured"],
                ["Secret", app.hasSecret ? "Set" : "Missing"],
                ["Round trip", data.health.latencyMs != null ? `${data.health.latencyMs}ms` : "—"],
                ["Database", data.health.db_status ?? "—"],
                ["Version", data.health.version ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-[color:var(--muted-foreground)]">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {data.health.detail && (
              <p className="mt-3 text-[12.5px]" style={{ color: "var(--danger)" }}>
                {data.health.detail}
              </p>
            )}
          </Panel>

          {can("secret:read") && (
            <Panel
              title="Configuration"
              description="What this app receives from Zina at startup."
              action={
                <Link to="/keys" className="text-[12.5px] font-semibold text-[color:var(--primary)]">
                  Manage
                </Link>
              }
            >
              {data.config.length === 0 ? (
                <p className="text-[13px] text-[color:var(--muted-foreground)]">
                  Nothing set — this app runs entirely on its own environment.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.config.map((c) => (
                    <li key={c.envVar} className="flex items-baseline justify-between gap-3">
                      <code className="mono text-[12px]">{c.envVar}</code>
                      <span className="shrink-0 text-[11.5px] text-[color:var(--muted-foreground)]">
                        {c.rotatedAt ? ago(c.rotatedAt) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {can("support:read") && (
            <Panel title="Support" padded={false}>
              {data.tickets.length === 0 ? (
                <Empty title="Nothing waiting" />
              ) : (
                <ul className="divide-y divide-[color:var(--border)]">
                  {data.tickets.map((t) => (
                    <li key={t.id} className="px-5 py-3">
                      <Link to={`/support/${t.id}`} className="block hover:underline">
                        <p className="truncate text-[13.5px] font-medium">{t.subject}</p>
                      </Link>
                      <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                        {t.status.replace("_", " ")} · {ago(t.updatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Why a connector-backed block isn't there, in words.
 *
 * "This app hasn't implemented that yet" is a different fact from "we couldn't
 * reach it", and neither is the same as "there's nothing". One empty state for
 * all three would quietly misreport the first two.
 *
 * A plain component over `OpsSection<unknown>` rather than a generic
 * render-prop: inferring a type parameter through JSX children sent the
 * compiler into a recursion it never returned from.
 */
function OpsFallback({ section, appName }: { section: OpsSection<unknown>; appName: string }) {
  const message =
    section.reason === "unconfigured" || section.reason === "no-secret"
      ? `${appName} isn't connected to Zina yet.`
      : section.reason === "unsupported"
        ? `${appName} doesn't report this yet.`
        : section.reason === "timeout"
          ? `${appName} didn't answer in time — it may be asleep.`
          : section.reason === "self"
            ? "Managed directly by Loopital."
            : `Couldn't reach ${appName}${section.detail ? `: ${section.detail}` : "."}`;

  return <p className="text-[13px] text-[color:var(--muted-foreground)]">{message}</p>;
}
