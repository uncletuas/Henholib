import { useState } from "react";
import { Eye, KeyRound, Plus, Trash2 } from "lucide-react";

import { api } from "../lib/api";
import type { Secret } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { date } from "../lib/format";
import {
  AppMark,
  Badge,
  Button,
  Empty,
  ErrorNote,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Panel,
  Select,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

const KINDS = [
  { id: "api_key", label: "API key" },
  { id: "database", label: "Database URL" },
  { id: "url", label: "Service URL" },
  { id: "webhook", label: "Webhook secret" },
  { id: "oauth", label: "OAuth credential" },
  { id: "config", label: "Setting" },
  { id: "other", label: "Other" },
];

/**
 * The credential vault — and the ecosystem's live configuration.
 *
 * Every key, connection string and service URL the group runs on, in one place.
 * That is only defensible because of how it's stored: sealed with AES-256-GCM
 * under a key that lives in the environment and never in the database, shown as
 * a masked preview, and revealed only by an explicit click that writes an audit
 * entry.
 *
 * **A value with a variable name is live.** Each service pulls its own set from
 * `/ops-config` at startup and re-checks every minute, so rotating a key or
 * repointing a URL takes effect without a code change or a redeploy. That is
 * the whole reason this screen exists rather than a spreadsheet: a two-person
 * team shouldn't have to ship a release to change a Paystack key.
 *
 * A value with no variable name is recorded but never injected — useful for
 * keeping track of a credential an app doesn't read from its environment.
 */
export function KeysPage() {
  const { can } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.secrets());
  const apps = useLoad(() => api.apps());
  const [adding, setAdding] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  async function reveal(secret: Secret) {
    try {
      const { value } = await api.revealSecret(secret.id);
      setRevealed((r) => ({ ...r, [secret.id]: value }));
    } catch (e) {
      setRevealed((r) => ({
        ...r,
        [secret.id]: e instanceof Error ? e.message : "Couldn't reveal that.",
      }));
    }
  }

  async function remove(secret: Secret) {
    if (!confirm(`Delete “${secret.label}”? This only removes Zina's record of it.`)) return;
    await api.deleteSecret(secret.id);
    reload();
  }

  const grouped = new Map<string, Secret[]>();
  for (const secret of data?.secrets || []) {
    const key = secret.appId || "shared";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(secret);
  }

  return (
    <>
      <PageHeader
        title="API keys & credentials"
        description="What every app runs on, sealed at rest. Recording a key here is a record, not a deploy — the live value still lives in each service's environment."
        action={
          can("secret:manage") ? (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> Add a credential
            </Button>
          ) : undefined
        }
      />

      {data && !data.configured && (
        <div className="mb-5">
          <ErrorNote message="ZINA_ENCRYPTION_KEY isn't set on the API, so credentials can't be stored or read. Set it, then reload." />
        </div>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : grouped.size === 0 ? (
        <Panel>
          <Empty
            title="Nothing recorded yet"
            description="Add the keys each app depends on so rotating one doesn't start with a search through old messages."
          />
        </Panel>
      ) : (
        <div className="space-y-5">
          {[...grouped.entries()].map(([appId, secrets]) => {
            const app = apps.data?.apps.find((a) => a.id === appId);
            const live = secrets.filter((s) => s.envVar).length;
            return (
              <Panel
                key={appId}
                padded={false}
                title={
                  <span className="flex items-center gap-2">
                    <AppMark name={app?.name || "Shared"} accent={app?.accent} size={20} />
                    {app?.name || "Not tied to an app"}
                  </span>
                }
                description={
                  appId === "shared"
                    ? "Recorded for reference. Nothing here is sent to any app."
                    : live > 0
                      ? `${live} of ${secrets.length} are live configuration — ${app?.name ?? appId} pulls them at startup and re-checks every minute.`
                      : "None of these have a variable name, so none are sent to the app."
                }
              >
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Credential</Th>
                      <Th>Kind</Th>
                      <Th>Value</Th>
                      <Th align="right">Rotated</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {secrets.map((secret) => (
                      <tr key={secret.id}>
                        <Td>
                          <p className="flex items-center gap-2 font-medium">
                            {secret.label}
                            {secret.envVar && <Badge tone="success">live</Badge>}
                          </p>
                          {secret.envVar && (
                            <p className="mono text-[11.5px] text-[color:var(--muted-foreground)]">
                              {secret.envVar}
                            </p>
                          )}
                          {secret.hint && (
                            <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                              {secret.hint}
                            </p>
                          )}
                        </Td>
                        <Td>
                          <Badge>{KINDS.find((k) => k.id === secret.kind)?.label || secret.kind}</Badge>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <code className="mono break-all text-[12px]">
                              {revealed[secret.id] ?? secret.preview}
                            </code>
                            {can("secret:reveal") && !revealed[secret.id] && (
                              <Button size="sm" variant="ghost" onClick={() => reveal(secret)}>
                                <Eye className="size-3.5" /> Reveal
                              </Button>
                            )}
                          </div>
                        </Td>
                        <Td align="right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[12.5px] text-[color:var(--muted-foreground)]">
                              {date(secret.rotatedAt || secret.createdAt)}
                            </span>
                            {can("secret:manage") && (
                              <button
                                onClick={() => remove(secret)}
                                aria-label={`Delete ${secret.label}`}
                                className="rounded-md p-1.5 text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted-surface)]"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </Panel>
            );
          })}
        </div>
      )}

      {adding && (
        <AddSecret
          apps={(apps.data?.apps || []).map((a) => ({ id: a.id, name: a.name }))}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
    </>
  );
}

function AddSecret({
  apps,
  onClose,
  onSaved,
}: {
  apps: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    appId: apps[0]?.id || "",
    kind: "api_key",
    label: "",
    envVar: "",
    value: "",
    hint: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.saveSecret(form);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a credential"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} busy={busy} disabled={!form.label || !form.value}>
            <KeyRound className="size-3.5" /> Store it
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App">
            <Select value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })}>
              <option value="">Not tied to an app</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kind">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Label">
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Paystack live secret"
          />
        </Field>
        <Field
          label="Environment variable"
          hint="Name it and the app receives this value at startup — no redeploy. Leave it blank to record the credential without sending it anywhere."
        >
          <Input
            value={form.envVar}
            onChange={(e) => setForm({ ...form, envVar: e.target.value })}
            placeholder="PAYSTACK_SECRET_KEY"
          />
        </Field>
        <Field label="Value" hint="Sealed before it's stored. Nobody sees it again without an audited reveal.">
          <Input
            type="password"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Note">
          <Input
            value={form.hint}
            onChange={(e) => setForm({ ...form, hint: e.target.value })}
            placeholder="Where it's used, who issued it"
          />
        </Field>
        {error && <ErrorNote message={error} />}
      </div>
    </Modal>
  );
}
