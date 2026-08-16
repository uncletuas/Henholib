import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { api } from "../lib/api";
import { useLoad } from "../lib/session";
import { count } from "../lib/format";
import {
  AppMark,
  Button,
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
 * Where the data lives, and whether it's answering.
 *
 * Loopital's own pool is measured here directly. Every other app reports its
 * own database state through its connector, because Zina holds no credentials
 * for their stores — a single portal that could open six databases would be a
 * single thing worth stealing.
 */
export function DatabasesPage() {
  const { data, error, loading, reload } = useLoad(() => api.databases());
  const [checking, setChecking] = useState(false);

  async function recheck() {
    setChecking(true);
    try {
      reload();
    } finally {
      setChecking(false);
    }
  }

  if (loading) return <Loading label="Asking each app about its database" />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const own = data?.own;
  const reachable = (data?.apps || []).filter((a) => a.status === "ok").length;
  const connected = (data?.apps || []).filter((a) => a.connected).length;

  return (
    <>
      <PageHeader
        title="Databases"
        description="Each app owns its own store and reports on it. Zina never holds another app's credentials."
        action={
          <Button onClick={recheck} busy={checking}>
            <RefreshCw className="size-3.5" /> Re-check
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Loopital database"
          value={own?.status === "ok" ? "Healthy" : "Unreachable"}
          tone={own?.status === "ok" ? "success" : "danger"}
          hint={own?.size ? `${own.size} used` : undefined}
        />
        <Stat label="Open connections" value={count(own?.connections ?? 0)} hint="Across the cluster" />
        <Stat
          label="Pool in use"
          value={own?.pool ? `${own.pool.total - own.pool.idle}/${own.pool.total}` : "—"}
          tone={own?.pool && own.pool.waiting > 0 ? "warning" : "neutral"}
          hint={own?.pool?.waiting ? `${own.pool.waiting} waiting` : "Nothing waiting"}
        />
        <Stat
          label="Apps answering"
          value={`${reachable}/${connected || 0}`}
          tone={connected && reachable < connected ? "warning" : "neutral"}
          hint="Of those connected"
        />
      </div>

      {own && (
        <div className="mt-6">
          <Panel
            title="Loopital"
            description="Accounts, subscriptions, the payment ledger, notifications and Zina's own tables — the `loopital` schema on pal-db."
          >
            <dl className="grid gap-4 sm:grid-cols-4">
              {[
                ["Database", own.database ?? "—"],
                ["Size on disk", own.size ?? "—"],
                ["Round trip", own.latencyMs != null ? `${own.latencyMs}ms` : "—"],
                ["Idle in pool", own.pool ? String(own.pool.idle) : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--subtle-foreground)]">
                    {label}
                  </dt>
                  <dd className="tabular mt-1 text-[15px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {own.detail && (
              <p className="mt-3 text-[12.5px]" style={{ color: "var(--danger)" }}>
                {own.detail}
              </p>
            )}
          </Panel>
        </div>
      )}

      <div className="mt-6">
        <Panel title="The other apps" padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>App</Th>
                <Th>Connector</Th>
                <Th>Database</Th>
                <Th align="right">Round trip</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.apps || []).map((app) => (
                <tr key={app.appId}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <AppMark name={app.name} accent={app.accent} size={24} />
                      <span className="font-medium">{app.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <HealthBadge status={app.status} />
                    {app.detail && (
                      <p className="mt-1 max-w-[300px] text-[11.5px] text-[color:var(--muted-foreground)]">
                        {app.detail}
                      </p>
                    )}
                  </Td>
                  <Td className="text-[12.5px]">
                    {app.dbStatus || (
                      <span className="text-[color:var(--muted-foreground)]">
                        {app.connected ? "Not reported" : "—"}
                      </span>
                    )}
                  </Td>
                  <Td align="right" className="tabular text-[12.5px] text-[color:var(--muted-foreground)]">
                    {app.latencyMs != null ? `${app.latencyMs}ms` : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      </div>
    </>
  );
}
