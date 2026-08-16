import { useState } from "react";
import { Send } from "lucide-react";

import { api } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { count, dateTime } from "../lib/format";
import {
  Badge,
  Button,
  Chip,
  Empty,
  ErrorNote,
  Field,
  FilterBar,
  Input,
  Loading,
  Modal,
  PageHeader,
  Panel,
  Stat,
  TableWrap,
  Td,
  Textarea,
  Th,
} from "../components/ui";

/**
 * The one notification system, and its log.
 *
 * Every app now sends through the same endpoint on the same Resend account, so
 * a failure is visible here regardless of which product caused it. That is the
 * point of the consolidation: "did they get the email?" is one question with
 * one place to look, instead of four provider dashboards.
 */
export function NotificationsPage() {
  const { can } = useSession();
  const [status, setStatus] = useState("");
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(false);

  const { data, error, loading, reload } = useLoad(
    () => api.notifications({ status, q, limit: 100 }),
    [status, q]
  );

  const sent = data?.stats30d.sent || 0;
  const failed = data?.stats30d.failed || 0;
  const total = sent + failed + (data?.stats30d.queued || 0);
  const rate = total ? Math.round((sent / total) * 100) : null;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Every transactional email in the ecosystem goes out through one Resend account and is logged here."
        action={
          can("notify:send") ? (
            <Button variant="primary" onClick={() => setComposing(true)}>
              <Send className="size-3.5" /> Send a message
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Delivered" value={count(sent)} hint="Last 30 days" tone="success" />
        <Stat label="Failed" value={count(failed)} tone={failed ? "danger" : "neutral"} hint="Last 30 days" />
        <Stat
          label="Delivery rate"
          value={rate == null ? "—" : `${rate}%`}
          tone={rate != null && rate < 95 ? "warning" : "neutral"}
        />
        <Stat
          label="Sender"
          value={data?.configured ? "Live" : "Not set"}
          tone={data?.configured ? "success" : "danger"}
          hint={data?.from || "RESEND_API_KEY missing"}
        />
      </div>

      <div className="mt-6">
        <FilterBar>
          {["", "sent", "failed", "queued"].map((value) => (
            <Chip key={value || "all"} active={status === value} onClick={() => setStatus(value)}>
              {value ? value[0].toUpperCase() + value.slice(1) : "Everything"}
            </Chip>
          ))}
          <form
            className="ml-auto flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(term.trim());
            }}
          >
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Recipient or subject"
              className="w-56"
            />
            <Button type="submit" size="sm">
              Find
            </Button>
          </form>
        </FilterBar>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote message={error} onRetry={reload} />
        ) : !data || data.notifications.length === 0 ? (
          <Panel>
            <Empty title="Nothing logged" description="Emails appear here as soon as any app sends one." />
          </Panel>
        ) : (
          <Panel padded={false}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Subject</Th>
                  <Th>To</Th>
                  <Th>From app</Th>
                  <Th>Status</Th>
                  <Th align="right">When</Th>
                </tr>
              </thead>
              <tbody>
                {data.notifications.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <p className="font-medium">{item.subject}</p>
                      {item.template && (
                        <p className="mono text-[11px] text-[color:var(--muted-foreground)]">
                          {item.template}
                        </p>
                      )}
                    </Td>
                    <Td className="text-[12.5px]">{item.to}</Td>
                    <Td className="text-[12.5px]">{item.appId || "loopital"}</Td>
                    <Td>
                      <Badge
                        tone={
                          item.status === "sent" ? "success" : item.status === "failed" ? "danger" : "warning"
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.error && (
                        <p className="mt-1 max-w-[280px] text-[11.5px]" style={{ color: "var(--danger)" }}>
                          {item.error}
                        </p>
                      )}
                    </Td>
                    <Td align="right" className="text-[12.5px] text-[color:var(--muted-foreground)]">
                      {dateTime(item.createdAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Panel>
        )}
      </div>

      {composing && <Compose onClose={() => setComposing(false)} onSent={reload} />}
    </>
  );
}

function Compose({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await api.sendNotification({ to: to.trim(), subject: subject.trim(), body });
      setDone(true);
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Send a message"
      width={560}
      footer={
        done ? (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={send} busy={busy} disabled={!to || !subject || !body}>
              Send
            </Button>
          </>
        )
      }
    >
      {done ? (
        <p className="text-[13.5px]">
          Sent to <strong>{to}</strong>. It will appear in the log with its delivery status.
        </p>
      ) : (
        <div className="space-y-4">
          <Field label="To">
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="person@example.com" />
          </Field>
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field
            label="Message"
            hint="Plain text. Blank lines become paragraphs in the branded template."
          >
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} />
          </Field>
          {error && <ErrorNote message={error} />}
        </div>
      )}
    </Modal>
  );
}
