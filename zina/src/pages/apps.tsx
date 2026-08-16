import { useState } from "react";
import { ExternalLink, RefreshCw, Settings2 } from "lucide-react";

import { api } from "../lib/api";
import type { ManagedApp } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { ago } from "../lib/format";
import {
  AppMark,
  Button,
  ErrorNote,
  Field,
  HealthBadge,
  Input,
  Loading,
  Modal,
  PageHeader,
  Panel,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

/**
 * The registry: which apps Zina manages, and how it reaches each one.
 *
 * Connecting a new product is a form here, not a deploy. That matters because
 * the ops URL of a free Render service changes more often than anyone would
 * like, and having to ship the API to fix a dashboard link is the kind of
 * friction that ends with the dashboard being ignored.
 */
export function AppsPage() {
  const { can } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.apps());
  const [editing, setEditing] = useState<ManagedApp | null>(null);
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

  if (loading) return <Loading label="Reading the registry" />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Apps"
        description="Every product Zina manages. An app becomes fully visible here once it exposes its ops connector and shares a secret."
        action={
          <Button onClick={recheck} busy={checking}>
            <RefreshCw className="size-3.5" /> Re-check
          </Button>
        }
      />

      <Panel padded={false}>
        <TableWrap>
          <thead>
            <tr>
              <Th>App</Th>
              <Th>Connector</Th>
              <Th>Health</Th>
              <Th>Checked</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {(data?.apps || []).map((app) => (
              <tr key={app.id} className={app.enabled ? undefined : "opacity-55"}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <AppMark name={app.name} accent={app.accent} size={26} />
                    <div className="min-w-0">
                      <p className="font-medium">{app.name}</p>
                      <p className="text-[12px] text-[color:var(--muted-foreground)]">
                        {app.id} · {app.tagline}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {app.opsBaseUrl ? (
                    <>
                      <p className="mono text-[12px] break-all">{app.opsBaseUrl}</p>
                      <p className="text-[11.5px] text-[color:var(--muted-foreground)]">
                        {app.hasSecret ? "Secret set" : "No secret — calls will be refused"}
                      </p>
                    </>
                  ) : (
                    <span className="text-[12.5px] text-[color:var(--muted-foreground)]">
                      Not connected
                    </span>
                  )}
                </Td>
                <Td>
                  <HealthBadge status={app.health} />
                  {app.healthDetail && (
                    <p className="mt-1 max-w-[240px] text-[11.5px] text-[color:var(--muted-foreground)]">
                      {app.healthDetail}
                    </p>
                  )}
                </Td>
                <Td className="text-[12.5px] text-[color:var(--muted-foreground)]">
                  {ago(app.checkedAt)}
                  {app.latencyMs != null && <span className="tabular"> · {app.latencyMs}ms</span>}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1.5">
                    {app.appUrl && (
                      <a
                        href={app.appUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md p-1.5 text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted-surface)]"
                        aria-label={`Visit ${app.name}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    {can("app:manage") && (
                      <Button size="sm" variant="ghost" onClick={() => setEditing(app)}>
                        <Settings2 className="size-3.5" /> Configure
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      {editing && (
        <ConfigureApp
          app={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function ConfigureApp({
  app,
  onClose,
  onSaved,
}: {
  app: ManagedApp;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: app.name,
    tagline: app.tagline || "",
    appUrl: app.appUrl || "",
    adminUrl: app.adminUrl || "",
    opsBaseUrl: app.opsBaseUrl || "",
    accent: app.accent,
  });
  // Left blank on purpose: an empty box means "leave the stored secret alone",
  // so saving a name change never silently wipes the connector's credentials.
  const [opsSecret, setOpsSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.updateApp(app.id, {
        ...form,
        ...(opsSecret ? { opsSecret } : {}),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Configure ${app.name}`}
      width={560}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} busy={busy}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Accent colour">
            <Input value={form.accent} onChange={set("accent")} placeholder="#2563eb" />
          </Field>
        </div>
        <Field label="Tagline">
          <Input value={form.tagline} onChange={set("tagline")} />
        </Field>
        <Field label="Public app URL">
          <Input value={form.appUrl} onChange={set("appUrl")} placeholder="https://…" />
        </Field>
        <Field
          label="Fallback admin URL"
          hint="Where 'Manage' lands if the app hasn't implemented the session handshake yet."
        >
          <Input value={form.adminUrl} onChange={set("adminUrl")} placeholder="https://…" />
        </Field>
        <Field
          label="Ops connector base URL"
          hint="The root Zina calls, e.g. https://beacon.loopital.com/api/ops"
        >
          <Input value={form.opsBaseUrl} onChange={set("opsBaseUrl")} placeholder="https://…/ops" />
        </Field>
        <Field
          label="Connector secret"
          hint={
            app.hasSecret
              ? "A secret is stored. Leave blank to keep it, or paste a new one to replace it."
              : "Paste the shared secret this app signs and verifies with."
          }
        >
          <Input
            type="password"
            value={opsSecret}
            onChange={(e) => setOpsSecret(e.target.value)}
            placeholder={app.hasSecret ? "••••••••" : ""}
            autoComplete="new-password"
          />
        </Field>
        {error && <ErrorNote message={error} />}
      </div>
    </Modal>
  );
}
