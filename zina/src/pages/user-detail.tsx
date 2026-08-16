import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { api } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { count, date, dateTime, money } from "../lib/format";
import {
  AppMark,
  Avatar,
  Badge,
  Empty,
  ErrorNote,
  Loading,
  Panel,
  Stat,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

/**
 * One person, everywhere at once.
 *
 * This is the screen that support actually needs: what they pay for, what we
 * emailed them and whether it arrived, what they've asked us before, and which
 * apps know them — all without opening four portals to assemble the story.
 */
export function UserDetailPage() {
  const { id = "" } = useParams();
  const { can } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.user(id), [id]);

  if (loading) return <Loading label="Assembling this person's record" />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  const { user } = data;
  const paid = data.payments.filter((p) => p.status === "success");
  const lifetime = paid.reduce((sum, p) => sum + p.amountMinor, 0);
  const failedEmails = data.emails.filter((e) => e.status === "failed").length;

  return (
    <>
      <Link
        to="/users"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[color:var(--muted-foreground)] hover:underline"
      >
        <ArrowLeft className="size-3.5" /> All users
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={user.name} src={user.avatarUrl} size={56} />
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold">{user.name}</h1>
          <p className="text-[13.5px] text-[color:var(--muted-foreground)]">
            {user.email}
            {user.username ? ` · @${user.username}` : ""}
          </p>
          <p className="mt-0.5 text-[12.5px] text-[color:var(--subtle-foreground)]">
            Joined {date(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Lifetime value" value={money(lifetime)} hint={`${count(paid.length)} payments`} />
        <Stat label="Active plans" value={count(data.subscriptions.filter((s) => s.status === "active").length)} />
        <Stat label="Support requests" value={count(data.tickets.length)} />
        <Stat
          label="Undelivered email"
          value={count(failedEmails)}
          tone={failedEmails ? "danger" : "success"}
          hint={failedEmails ? "Worth checking the address" : "All delivered"}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Panel title="Subscriptions" padded={false}>
            {data.subscriptions.length === 0 ? (
              <Empty title="No paid plans" description="This account is on the free tier everywhere." />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Plan</Th>
                    <Th>Status</Th>
                    <Th align="right">Renews</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.subscriptions.map((sub) => (
                    <tr key={`${sub.product}-${sub.plan}`}>
                      <Td className="font-medium">{sub.product}</Td>
                      <Td>
                        {sub.plan}
                        {sub.seats > 1 && (
                          <span className="text-[color:var(--muted-foreground)]"> × {sub.seats} seats</span>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={sub.status === "active" ? "success" : sub.status === "past_due" ? "danger" : "neutral"}>
                          {sub.status}
                        </Badge>
                      </Td>
                      <Td align="right" className="text-[12.5px] text-[color:var(--muted-foreground)]">
                        {date(sub.currentPeriodEnd)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Panel>

          {can("billing:read") && (
            <Panel title="Payments" padded={false}>
              {data.payments.length === 0 ? (
                <Empty title="No payments" />
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Reference</Th>
                      <Th>Product</Th>
                      <Th>Status</Th>
                      <Th align="right">Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.reference}>
                        <Td>
                          <p className="mono text-[12px]">{payment.reference}</p>
                          <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                            {dateTime(payment.createdAt)}
                          </p>
                        </Td>
                        <Td>{payment.product}</Td>
                        <Td>
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
                        </Td>
                        <Td align="right" className="tabular font-medium">
                          {money(payment.amountMinor, payment.currency)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Panel>
          )}

          {can("notify:read") && (
            <Panel title="Email history" description="Every message sent to this address, across all apps." padded={false}>
              {data.emails.length === 0 ? (
                <Empty title="Nothing sent yet" />
              ) : (
                <ul className="divide-y divide-[color:var(--border)]">
                  {data.emails.map((email, i) => (
                    <li key={i} className="flex items-start gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{email.subject}</p>
                        <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                          {email.appId || "loopital"} · {dateTime(email.createdAt)}
                        </p>
                        {email.error && (
                          <p className="mt-1 text-[11.5px]" style={{ color: "var(--danger)" }}>
                            {email.error}
                          </p>
                        )}
                      </div>
                      <Badge
                        tone={email.status === "sent" ? "success" : email.status === "failed" ? "danger" : "warning"}
                      >
                        {email.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          <Panel
            title="Known to"
            description="Asked live of each app's connector."
          >
            <ul className="space-y-3">
              {data.inApps.map((entry) => (
                <li key={entry.appId} className="flex items-start gap-3">
                  <AppMark name={entry.name} accent={entry.accent} size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{entry.name}</p>
                    <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                      {entry.known
                        ? "Has an account here"
                        : entry.unavailable === "unconfigured"
                          ? "Not connected to Zina yet"
                          : entry.unavailable === "unsupported"
                            ? "Doesn't answer user lookups yet"
                            : entry.unavailable
                              ? "Couldn't be reached"
                              : "No account here"}
                    </p>
                  </div>
                  {entry.known && <Badge tone="success">Yes</Badge>}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Pal workspace">
            <dl className="space-y-2.5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Onboarded</dt>
                <dd className="font-medium">{user.pal.onboarded ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Use</dt>
                <dd className="font-medium">{user.pal.useType || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Organisation</dt>
                <dd className="truncate font-medium">{user.pal.orgName || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Team size</dt>
                <dd className="font-medium">{user.pal.teamSize || "—"}</dd>
              </div>
            </dl>
          </Panel>

          {can("support:read") && (
            <Panel title="Support history" padded={false}>
              {data.tickets.length === 0 ? (
                <Empty title="Never been in touch" />
              ) : (
                <ul className="divide-y divide-[color:var(--border)]">
                  {data.tickets.map((ticket) => (
                    <li key={ticket.id} className="px-5 py-3">
                      <Link to={`/support/${ticket.id}`} className="block hover:underline">
                        <p className="truncate text-[13.5px] font-medium">{ticket.subject}</p>
                      </Link>
                      <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                        {ticket.status} · {date(ticket.createdAt)}
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
