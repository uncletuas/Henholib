import { useState } from "react";
import { Link } from "react-router";
import { ExternalLink, RefreshCw } from "lucide-react";

import { api } from "../lib/api";
import type { AppSummaryCard } from "../lib/api";
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
  PageHeader,
  Panel,
  Stat,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

/**
 * The screen the user actually asked for: everything, at a glance.
 *
 * Three bands, in the order a founder reads them — the group's totals, then
 * each app's own state, then what happened most recently. Nothing here is a
 * drill-down: every figure that could be explored links to the screen that
 * explores it.
 */
export function OverviewPage() {
  const { staff, can } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.overview());
  const [checking, setChecking] = useState(false);

  async function recheck() {
    setChecking(true);
    try {
      await api.checkHealth();
      reload();
    } finally {
      setChecking(false);
    }
  }

  if (loading) return <Loading label="Gathering the ecosystem" />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  const openTickets = (data.tickets.open || 0) + (data.tickets.in_progress || 0);
  const failedEmail = data.notifications7d.failed || 0;

  return (
    <>
      <PageHeader
        title={`Good to see you, ${(staff?.name || "").split(" ")[0]}`}
        description="Every Loopital app, on one screen. Figures from Loopital's own ledger are exact; each app reports its own."
        action={
          <Button onClick={recheck} busy={checking}>
            <RefreshCw className="size-3.5" /> Re-check all apps
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Accounts" value={count(data.totals.users)} hint={`+${count(data.totals.newUsers30d)} in 30 days`} />
        <Stat label="Active plans" value={count(data.totals.activeSubscriptions)} hint="Across all products" />
        <Stat label="Collected" value={money(data.totals.grossMinor)} hint="One Paystack account" />
        <Stat
          label="Open support"
          value={count(openTickets)}
          tone={openTickets > 0 ? "warning" : "neutral"}
          hint={openTickets ? "Waiting on us" : "Nothing waiting"}
        />
        <Stat
          label="Email failures"
          value={count(failedEmail)}
          tone={failedEmail > 0 ? "danger" : "success"}
          hint="Last 7 days"
        />
      </div>

      <div className="mt-6">
        <Panel
          title="The apps"
          description="Health is the last connector check. A summary appears once an app implements its ops connector."
          padded={false}
        >
          <div className="grid gap-px bg-[color:var(--border)] sm:grid-cols-2 xl:grid-cols-3">
            {data.apps.map((app) => (
              <AppCard key={app.id} app={app} canSwitch={can("app:switch")} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Latest payments"
          description="Every product, one ledger."
          padded={false}
          action={
            can("billing:read") ? (
              <Link to="/payments" className="text-[12.5px] font-semibold text-[color:var(--primary)]">
                All payments
              </Link>
            ) : undefined
          }
        >
          {data.recentPayments.length === 0 ? (
            <Empty title="No payments yet" description="They'll appear here the moment the first one clears." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Product</Th>
                  <Th>For</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">When</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((payment) => (
                  <tr key={payment.reference}>
                    <Td>
                      <p className="font-medium">{payment.customer?.name}</p>
                      <p className="text-[12px] text-[color:var(--muted-foreground)]">
                        {payment.customer?.email}
                      </p>
                    </Td>
                    <Td>{payment.product}</Td>
                    <Td>
                      {payment.purpose === "credits"
                        ? `${count(payment.credits ?? 0)} credits`
                        : payment.plan || "subscription"}
                    </Td>
                    <Td align="right" className="tabular font-medium">
                      {money(payment.amountMinor, payment.currency)}
                    </Td>
                    <Td align="right">
                      <Badge
                        tone={
                          payment.status === "success"
                            ? "success"
                            : payment.status === "failed"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {payment.status}
                      </Badge>
                      <p className="mt-1 text-[11.5px] text-[color:var(--muted-foreground)]">
                        {ago(payment.createdAt)}
                      </p>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Revenue by product">
            {Object.keys(data.revenueByProduct).length === 0 ? (
              <p className="text-[13px] text-[color:var(--muted-foreground)]">Nothing collected yet.</p>
            ) : (
              <ul className="space-y-3">
                {Object.entries(data.revenueByProduct)
                  .sort((a, b) => b[1].grossMinor - a[1].grossMinor)
                  .map(([product, figures]) => {
                    const app = data.apps.find((a) => a.id === product);
                    return (
                      <li key={product} className="flex items-center gap-3">
                        <AppMark name={app?.name || product} accent={app?.accent} size={22} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium">{app?.name || product}</p>
                          <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                            {count(figures.paid)} paid
                            {figures.pending ? ` · ${count(figures.pending)} pending` : ""}
                          </p>
                        </div>
                        <span className="tabular text-[13.5px] font-semibold">
                          {money(figures.grossMinor)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Panel>

          <Panel title="Email, last 7 days">
            <ul className="space-y-2 text-[13.5px]">
              {["sent", "queued", "failed"].map((status) => (
                <li key={status} className="flex items-center justify-between">
                  <span className="capitalize text-[color:var(--muted-foreground)]">{status}</span>
                  <span className="tabular font-semibold">{count(data.notifications7d[status] || 0)}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/notifications"
              className="mt-4 inline-block text-[12.5px] font-semibold text-[color:var(--primary)]"
            >
              Open the notification log
            </Link>
          </Panel>
        </div>
      </div>
    </>
  );
}

/**
 * One app's tile.
 *
 * The summary block is deliberately generic — whatever key/value pairs the app
 * chose to report are rendered as they came. An ecosystem of six different
 * products will never agree on one set of metrics, and forcing them to would
 * mean showing nothing until they all complied.
 */
function AppCard({ app, canSwitch }: { app: AppSummaryCard; canSwitch: boolean }) {
  const summaryEntries = app.summary
    ? Object.entries(app.summary).filter(([, v]) => typeof v === "number" || typeof v === "string").slice(0, 4)
    : [];

  return (
    <div className="bg-[color:var(--card)] p-5">
      <div className="flex items-start gap-3">
        <AppMark name={app.name} accent={app.accent} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14.5px] font-semibold">{app.name}</h3>
            <HealthBadge status={app.health} />
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[color:var(--muted-foreground)]">
            {app.tagline}
          </p>
        </div>
      </div>

      {summaryEntries.length > 0 ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {summaryEntries.map(([key, value]) => (
            <div key={key}>
              <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-[color:var(--subtle-foreground)]">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </dt>
              <dd className="tabular text-[15px] font-semibold">
                {typeof value === "number" ? count(value) : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-[12.5px] leading-relaxed text-[color:var(--muted-foreground)]">
          {app.connected
            ? app.summaryError === "unsupported"
              ? "Connected, but this app doesn't report a summary yet."
              : "Connected — waiting for its first report."
            : "No ops connector yet, so this app can't report its own figures."}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        {/* Manage opens the app's dashboard *inside* Zina. Bouncing straight out
            to its own portal was the thing that didn't work — half of them
            aren't reachable, and the ones that are ask for another login. */}
        {canSwitch && (
          <Link
            to={`/apps/${app.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[color:var(--muted-surface)] px-2.5 py-1.5 text-[12.5px] font-medium hover:border-[color:var(--border-strong)]"
          >
            Manage
          </Link>
        )}
        {app.appUrl && (
          <a
            href={app.appUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12.5px] text-[color:var(--muted-foreground)] hover:underline"
          >
            Visit <ExternalLink className="size-3" />
          </a>
        )}
        <span className="ml-auto text-[11.5px] text-[color:var(--subtle-foreground)]">
          {app.checkedAt ? `checked ${ago(app.checkedAt)}` : "never checked"}
        </span>
      </div>
    </div>
  );
}
