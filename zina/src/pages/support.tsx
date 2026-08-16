import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import { api } from "../lib/api";
import type { Ticket } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { ago, count, dateTime } from "../lib/format";
import {
  Badge,
  Button,
  Chip,
  Empty,
  ErrorNote,
  FilterBar,
  Loading,
  PageHeader,
  Panel,
  Select,
  Stat,
  TableWrap,
  Td,
  Textarea,
  Th,
} from "../components/ui";

const STATUS_TONE = {
  open: "warning",
  in_progress: "info",
  waiting: "neutral",
  resolved: "success",
  closed: "neutral",
} as const;

const priorityTone = (priority: Ticket["priority"]) =>
  priority === "urgent" ? "danger" : priority === "high" ? "warning" : "neutral";

/**
 * One support queue for the whole group.
 *
 * A ticket raised inside Beacon and a message sent through the contact form on
 * loopital.com land in the same list, tagged with where they came from. Support
 * stops being "which portal was that in?" and becomes one thing to work through.
 */
export function SupportPage() {
  const [status, setStatus] = useState("");
  const { data, error, loading, reload } = useLoad(() => api.tickets({ status }), [status]);

  const counts = data?.counts || {};
  const waiting = (counts.open || 0) + (counts.in_progress || 0);

  return (
    <>
      <PageHeader
        title="Support"
        description="Every request from every app, in one queue. Replying sends the email — there is no separate step."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Needs a reply" value={count(waiting)} tone={waiting ? "warning" : "success"} />
        <Stat label="Open" value={count(counts.open || 0)} />
        <Stat label="In progress" value={count(counts.in_progress || 0)} />
        <Stat label="Resolved" value={count(counts.resolved || 0)} tone="success" />
      </div>

      <div className="mt-6">
        <FilterBar>
          {["", "open", "in_progress", "waiting", "resolved", "closed"].map((value) => (
            <Chip key={value || "all"} active={status === value} onClick={() => setStatus(value)}>
              {value ? value.replace("_", " ") : "Everything"}
            </Chip>
          ))}
        </FilterBar>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote message={error} onRetry={reload} />
        ) : !data || data.tickets.length === 0 ? (
          <Panel>
            <Empty
              title="Nothing waiting"
              description="Requests from any app, and the loopital.com contact form, arrive here."
            />
          </Panel>
        ) : (
          <Panel padded={false}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Request</Th>
                  <Th>From</Th>
                  <Th>App</Th>
                  <Th>Priority</Th>
                  <Th align="right">Updated</Th>
                </tr>
              </thead>
              <tbody>
                {data.tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[color:var(--muted-surface)]">
                    <Td>
                      <Link to={`/support/${ticket.id}`} className="block">
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                          {count(ticket.messages)} message{ticket.messages === 1 ? "" : "s"}
                        </p>
                      </Link>
                    </Td>
                    <Td>
                      <p className="text-[13px]">{ticket.requester.name || "—"}</p>
                      <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                        {ticket.requester.email}
                      </p>
                    </Td>
                    <Td className="text-[12.5px]">{ticket.appId || "loopital"}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={STATUS_TONE[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
                        {ticket.priority !== "normal" && (
                          <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
                        )}
                      </div>
                    </Td>
                    <Td align="right" className="text-[12.5px] text-[color:var(--muted-foreground)]">
                      {ago(ticket.updatedAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Panel>
        )}
      </div>
    </>
  );
}

export function TicketPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { can } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.ticket(id), [id]);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  const { ticket, messages } = data;

  async function send() {
    setSending(true);
    setNote(null);
    try {
      const result = await api.replyToTicket(id, reply);
      setReply("");
      setNote(
        result.emailed
          ? "Sent."
          : `Saved, but the email didn't go out: ${result.emailError ?? "unknown error"}.`
      );
      reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setSending(false);
    }
  }

  async function change(field: "status" | "priority", value: string) {
    await api.updateTicket(id, { [field]: value });
    reload();
  }

  return (
    <>
      <button
        onClick={() => navigate("/support")}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[color:var(--muted-foreground)] hover:underline"
      >
        <ArrowLeft className="size-3.5" /> Support queue
      </button>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <h1 className="text-[20px] font-semibold">{ticket.subject}</h1>
          <p className="mt-1 text-[13px] text-[color:var(--muted-foreground)]">
            {ticket.requester.name ? `${ticket.requester.name} · ` : ""}
            {ticket.requester.email} · {ticket.appId || "loopital"}
          </p>

          <div className="mt-5 space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.author === "staff"
                    ? "rounded-xl border border-border bg-[color:var(--muted-surface)] p-4"
                    : "rounded-xl border border-border bg-card p-4"
                }
              >
                <header className="mb-2 flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="font-semibold">
                    {message.author === "staff"
                      ? message.staffName || "Loopital"
                      : message.author === "system"
                        ? "System"
                        : ticket.requester.name || ticket.requester.email}
                  </span>
                  <span className="text-[color:var(--muted-foreground)]">
                    {dateTime(message.createdAt)}
                    {message.author === "staff" && !message.emailed && " · not emailed"}
                  </span>
                </header>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{message.body}</p>
              </article>
            ))}
          </div>

          {can("support:respond") && (
            <div className="mt-5">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={5}
                placeholder={`Reply to ${ticket.requester.name || ticket.requester.email}…`}
              />
              <div className="mt-2 flex items-center gap-3">
                <Button variant="primary" onClick={send} busy={sending} disabled={!reply.trim()}>
                  Send reply
                </Button>
                {note && <p className="text-[12.5px] text-[color:var(--muted-foreground)]">{note}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Panel title="Handling">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium">Status</span>
                <Select
                  value={ticket.status}
                  disabled={!can("support:respond")}
                  onChange={(e) => change("status", e.target.value)}
                >
                  {["open", "in_progress", "waiting", "resolved", "closed"].map((value) => (
                    <option key={value} value={value}>
                      {value.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium">Priority</span>
                <Select
                  value={ticket.priority}
                  disabled={!can("support:respond")}
                  onChange={(e) => change("priority", e.target.value)}
                >
                  {["low", "normal", "high", "urgent"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </Panel>

          <Panel title="Details">
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Raised</dt>
                <dd>{dateTime(ticket.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Last activity</dt>
                <dd>{ago(ticket.updatedAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Source</dt>
                <dd>{ticket.appId || "loopital"}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
