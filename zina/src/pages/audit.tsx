import { api } from "../lib/api";
import { useLoad } from "../lib/session";
import { dateTime, humanise } from "../lib/format";
import {
  Avatar,
  Badge,
  Empty,
  ErrorNote,
  Loading,
  PageHeader,
  Panel,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

/**
 * What was done, by whom.
 *
 * A single account that can reach every app, every customer's record and every
 * credential needs a record of its own use. Every mutating route in Zina writes
 * here — including the reveals, which are the entries that matter most.
 */
export function AuditPage() {
  const { data, error, loading, reload } = useLoad(() => api.audit({ limit: 200 }));

  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  const entries = data?.entries || [];

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every change made through Zina, and every credential revealed. Reads aren't logged; actions are."
      />

      {entries.length === 0 ? (
        <Panel>
          <Empty title="Nothing recorded yet" description="Actions appear here as they happen." />
        </Panel>
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Who</Th>
                <Th>Did what</Th>
                <Th>To</Th>
                <Th>App</Th>
                <Th align="right">When</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={entry.actor.name || entry.actor.email || "?"} size={26} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium">{entry.actor.name || "Unknown"}</p>
                        <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                          {entry.actor.email}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={sensitivity(entry.action)}>{humanise(entry.action)}</Badge>
                    {entry.detail && Object.keys(entry.detail).length > 0 && (
                      <p className="mono mt-1 max-w-[280px] truncate text-[11px] text-[color:var(--muted-foreground)]">
                        {JSON.stringify(entry.detail)}
                      </p>
                    )}
                  </Td>
                  <Td className="text-[12.5px] break-all">{entry.target || "—"}</Td>
                  <Td className="text-[12.5px]">{entry.appId || "—"}</Td>
                  <Td align="right" className="text-[12.5px] text-[color:var(--muted-foreground)]">
                    {dateTime(entry.createdAt)}
                    {entry.ip && <p className="mono text-[11px]">{entry.ip}</p>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}

/** Reveals and deletions stand out; routine saves don't. */
function sensitivity(action: string): "danger" | "warning" | "neutral" {
  if (action.includes("reveal") || action.includes("delete") || action.includes("deactivate")) {
    return "danger";
  }
  if (action.includes("switch") || action.includes("suspend") || action.startsWith("staff.")) {
    return "warning";
  }
  return "neutral";
}
