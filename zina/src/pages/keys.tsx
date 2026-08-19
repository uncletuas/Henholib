import { useMemo, useState } from "react";
import { Eye, ExternalLink, Plus, Search, Trash2 } from "lucide-react";

import { api } from "../lib/api";
import type { ExternalService, ManagedApp, Secret, ServiceVar } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import {
  AppMark,
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
  Select,
  cx,
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
 * Every external service the ecosystem runs on — and the live values behind it.
 *
 * This screen is a catalog first and a vault second. It lists every service we
 * depend on whether or not anyone has configured it, because the questions an
 * operator actually has are "what are we paying for", "which app breaks if this
 * expires" and "where do I change it" — and an empty screen answers none of
 * them.
 *
 * **A value with a variable name is live.** Each service pulls its own set from
 * the hub at startup and re-checks every minute, so rotating a key or switching
 * a provider takes effect without a code change or a redeploy.
 *
 * Storage is what makes centralising this defensible: sealed with AES-256-GCM
 * under a key that lives in the environment and never in the database, shown as
 * a masked preview, and revealed only by an explicit click that is audited.
 */
export function KeysPage() {
  const { can } = useSession();
  const services = useLoad(() => api.services());
  const apps = useLoad(() => api.apps());
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState<{ envVar: string; appId: string; secret: boolean } | null>(null);
  const [adding, setAdding] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set((services.data?.services ?? []).map((s) => s.category))),
    [services.data]
  );

  const shown = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (services.data?.services ?? []).filter((s) => {
      if (category && s.category !== category) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        s.vars.some((v) => v.key.toLowerCase().includes(q))
      );
    });
  }, [services.data, term, category]);

  const totals = useMemo(() => {
    const all = services.data?.services ?? [];
    return {
      set: all.reduce((n, s) => n + s.set, 0),
      total: all.reduce((n, s) => n + s.total, 0),
      missingCritical: all.filter((s) => s.critical && s.set < s.total).length,
    };
  }, [services.data]);

  return (
    <>
      <PageHeader
        title="API keys & credentials"
        description="Every service the group depends on. Anything with a variable name is live — the app pulls it at startup and re-checks every minute, so changing a key here needs no redeploy."
        action={
          can("secret:manage") ? (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> Add something not listed
            </Button>
          ) : undefined
        }
      />

      {services.data && !services.data.configured && (
        <div className="mb-5">
          <ErrorNote message="ZINA_ENCRYPTION_KEY isn't set on the API, so credentials can't be stored or read. Set it, redeploy, then reload." />
        </div>
      )}

      {services.loading ? (
        <Loading label="Reading the catalog" />
      ) : services.error ? (
        <ErrorNote message={services.error} onRetry={services.reload} />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-4 text-[13px]">
            <span className="text-[color:var(--muted-foreground)]">
              <strong className="text-[color:var(--foreground)]">{totals.set}</strong> of {totals.total}{" "}
              values configured
            </span>
            {totals.missingCritical > 0 && (
              <Badge tone="warning">
                {totals.missingCritical} critical service{totals.missingCritical === 1 ? "" : "s"} incomplete
              </Badge>
            )}
          </div>

          <FilterBar>
            <Chip active={category === ""} onClick={() => setCategory("")}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
            <div className="relative ml-auto w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--subtle-foreground)]" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Service or variable"
                className="pl-9"
              />
            </div>
          </FilterBar>

          {shown.length === 0 ? (
            <Panel>
              <Empty title="Nothing matches" description="Try a different service or variable name." />
            </Panel>
          ) : (
            <div className="space-y-5">
              {shown.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  apps={apps.data?.apps ?? []}
                  canManage={can("secret:manage")}
                  canReveal={can("secret:reveal")}
                  onEdit={(envVar, appId, isSecret) => setEditing({ envVar, appId, secret: isSecret })}
                  onChanged={services.reload}
                />
              ))}
            </div>
          )}

          {(services.data?.uncatalogued.length ?? 0) > 0 && (
            <div className="mt-5">
              <Panel
                title="Not in the catalog"
                description="Stored by hand and not described by any service. Worth adding to the catalog so it's not a mystery later."
              >
                <ul className="space-y-2 text-[13px]">
                  {services.data!.uncatalogued.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3">
                      <code className="mono text-[12px]">{row.envVar}</code>
                      <span className="text-[color:var(--muted-foreground)]">
                        {row.appId ?? "unassigned"} · {row.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </>
      )}

      {editing && (
        <SetValue
          envVar={editing.envVar}
          appId={editing.appId}
          isSecret={editing.secret}
          canReveal={can("secret:reveal")}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            services.reload();
          }}
        />
      )}

      {adding && (
        <AddSecret
          apps={(apps.data?.apps ?? []).map((a) => ({ id: a.id, name: a.name }))}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            services.reload();
          }}
        />
      )}
    </>
  );
}

function ServiceCard({
  service,
  apps,
  canManage,
  canReveal,
  onEdit,
  onChanged,
}: {
  service: ExternalService;
  apps: ManagedApp[];
  canManage: boolean;
  canReveal: boolean;
  onEdit: (envVar: string, appId: string, isSecret: boolean) => void;
  onChanged: () => void;
}) {
  const complete = service.set === service.total;

  return (
    <Panel
      padded={false}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {service.name}
          {service.critical && !complete && <Badge tone="warning">incomplete</Badge>}
          {complete && <Badge tone="success">configured</Badge>}
          <span className="text-[11.5px] font-normal text-[color:var(--subtle-foreground)]">
            {service.category}
          </span>
        </span>
      }
      description={service.purpose}
      action={
        service.console ? (
          <a
            href={service.console}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[color:var(--primary)]"
          >
            Console <ExternalLink className="size-3" />
          </a>
        ) : undefined
      }
    >
      <ul className="divide-y divide-[color:var(--border)]">
        {service.vars.map((v) => (
          <VarRow
            key={v.key}
            v={v}
            apps={apps}
            canManage={canManage}
            canReveal={canReveal}
            onEdit={onEdit}
            onChanged={onChanged}
          />
        ))}
      </ul>
    </Panel>
  );
}

function VarRow({
  v,
  apps,
  canManage,
  canReveal,
  onEdit,
  onChanged,
}: {
  v: ServiceVar;
  apps: ManagedApp[];
  canManage: boolean;
  canReveal: boolean;
  onEdit: (envVar: string, appId: string, isSecret: boolean) => void;
  onChanged: () => void;
}) {
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  async function reveal(secretId: string) {
    try {
      const { value } = await api.revealSecret(secretId);
      setRevealed((r) => ({ ...r, [secretId]: value }));
    } catch (e) {
      setRevealed((r) => ({ ...r, [secretId]: e instanceof Error ? e.message : "Couldn't reveal." }));
    }
  }

  async function clear(secretId: string) {
    if (!confirm("Remove this value? The app falls back to its own environment on next restart.")) return;
    await api.deleteSecret(secretId);
    onChanged();
  }

  return (
    <li className="px-5 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <code className="mono text-[12.5px] font-semibold">{v.key}</code>
        {!v.secret && <span className="text-[11px] text-[color:var(--subtle-foreground)]">not secret</span>}
      </div>
      {v.note && (
        <p className="mt-0.5 text-[12px] leading-relaxed text-[color:var(--muted-foreground)]">{v.note}</p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        {v.apps.map((entry) => {
          const app = apps.find((a) => a.id === entry.appId);
          const value = entry.secretId ? revealed[entry.secretId] : undefined;
          return (
            <div
              key={entry.appId}
              className={cx(
                "flex min-w-[240px] flex-1 items-center gap-2.5 rounded-lg border px-3 py-2",
                entry.set ? "border-border" : "border-dashed border-[color:var(--border-strong)]"
              )}
            >
              <AppMark name={app?.name ?? entry.appId} accent={app?.accent} size={20} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium">{app?.name ?? entry.appId}</p>
                {entry.set ? (
                  <code className="mono block truncate text-[11.5px] text-[color:var(--muted-foreground)]">
                    {value ?? entry.preview}
                  </code>
                ) : (
                  <p className="text-[11.5px] text-[color:var(--subtle-foreground)]">Not set</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {entry.set && canReveal && v.secret && !value && entry.secretId && (
                  <button
                    onClick={() => reveal(entry.secretId!)}
                    aria-label={`Reveal ${v.key} for ${entry.appId}`}
                    className="rounded-md p-1.5 text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted-surface)]"
                  >
                    <Eye className="size-3.5" />
                  </button>
                )}
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={() => onEdit(v.key, entry.appId, v.secret)}>
                    {entry.set ? "Change" : "Set"}
                  </Button>
                )}
                {entry.set && canManage && entry.secretId && (
                  <button
                    onClick={() => clear(entry.secretId!)}
                    aria-label={`Remove ${v.key} for ${entry.appId}`}
                    className="rounded-md p-1.5 text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted-surface)]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </li>
  );
}

/** Set or rotate one variable for one app. */
function SetValue({
  envVar,
  appId,
  isSecret,
  onClose,
  onSaved,
}: {
  envVar: string;
  appId: string;
  isSecret: boolean;
  canReveal: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.saveSecret({
        appId,
        // The label is what makes the row unique per app, so it has to be
        // derived from the variable rather than typed — otherwise the same key
        // saved twice becomes two rows and the app gets whichever won.
        label: envVar,
        envVar,
        value,
        kind: isSecret ? "api_key" : "config",
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
      title={envVar}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} busy={busy} disabled={!value}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[13px] text-[color:var(--muted-foreground)]">
          For <strong className="text-[color:var(--foreground)]">{appId}</strong>. Saving takes effect
          within a minute — no redeploy. A value the app captured at boot (an open database pool, say)
          needs a restart to pick it up.
        </p>
        <Field label="Value">
          <Input
            type={isSecret ? "password" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
        </Field>
        {error && <ErrorNote message={error} />}
      </div>
    </Modal>
  );
}

/** For anything the catalog doesn't describe yet. */
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
    appId: apps[0]?.id ?? "",
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
            Store it
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
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </Field>
        <Field
          label="Environment variable"
          hint="Name it and the app receives this value at startup. Leave blank to record it without sending it anywhere."
        >
          <Input
            value={form.envVar}
            onChange={(e) => setForm({ ...form, envVar: e.target.value })}
            placeholder="SOME_API_KEY"
          />
        </Field>
        <Field label="Value" hint="Sealed before it's stored.">
          <Input
            type="password"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Note">
          <Input value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} />
        </Field>
        {error && <ErrorNote message={error} />}
      </div>
    </Modal>
  );
}

/** Kept exported for the raw vault view, which the app detail page links to. */
export type { Secret };
