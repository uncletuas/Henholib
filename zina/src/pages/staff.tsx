import { useState } from "react";
import { UserPlus } from "lucide-react";

import { api } from "../lib/api";
import type { RoleDefinition } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { ago, date } from "../lib/format";
import {
  Avatar,
  Badge,
  Button,
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

/**
 * Who runs the group, and what each of them may touch.
 *
 * The user's requirement was one superadmin who sees everything, with the
 * per-app operational roles still in place. Both live here: a role sets what
 * kind of work someone does, and the app scope sets where. A Modus-scoped
 * support agent signing into Zina gets Modus's tickets and nothing else — the
 * server applies the same scope to every query, so this isn't a hidden nav item.
 */
export function StaffPage() {
  const { staff: me } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.staff());
  const apps = useLoad(() => api.apps());
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function setActive(id: string, isActive: boolean) {
    setNote(null);
    try {
      await api.setStaffActive(id, isActive);
      reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't change that.");
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="Access to Zina comes from a staff record, not a separate password. Everyone signs in with the Loopital account they already have."
        action={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <UserPlus className="size-3.5" /> Grant access
          </Button>
        }
      />

      {note && (
        <div className="mb-4">
          <ErrorNote message={note} />
        </div>
      )}

      <Panel padded={false}>
        <TableWrap>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>Role</Th>
              <Th>Scope</Th>
              <Th>Last seen</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {(data?.staff || []).map((member) => (
              <tr key={member.id} className={member.isActive ? undefined : "opacity-55"}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} src={member.avatarUrl} size={32} />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {member.name}
                        {member.id === me?.id && (
                          <span className="ml-1.5 text-[11.5px] text-[color:var(--muted-foreground)]">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-[color:var(--muted-foreground)]">{member.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone={member.role === "superadmin" ? "info" : "neutral"}>{member.roleLabel}</Badge>
                  {member.title && (
                    <p className="mt-1 text-[11.5px] text-[color:var(--muted-foreground)]">
                      {member.title}
                    </p>
                  )}
                </Td>
                <Td className="text-[12.5px]">
                  {member.appScope.length === 0 ? (
                    <span className="text-[color:var(--muted-foreground)]">Whole ecosystem</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {member.appScope.map((app) => (
                        <Badge key={app}>{app}</Badge>
                      ))}
                    </div>
                  )}
                </Td>
                <Td className="text-[12.5px] text-[color:var(--muted-foreground)]">
                  {member.lastSeen ? ago(member.lastSeen) : `added ${date(member.createdAt)}`}
                </Td>
                <Td align="right">
                  {member.id !== me?.id && (
                    <Button
                      size="sm"
                      variant={member.isActive ? "danger" : "secondary"}
                      onClick={() => setActive(member.id, !member.isActive)}
                    >
                      {member.isActive ? "Deactivate" : "Restore"}
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <div className="mt-6">
        <Panel
          title="What each role can do"
          description="Ask 'may this person do X', never 'is this person an engineer' — so a role is re-scoped in one place."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.roles || []).map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        </Panel>
      </div>

      {adding && (
        <GrantAccess
          roles={data?.roles || []}
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

function RoleCard({ role }: { role: RoleDefinition }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-[13.5px] font-semibold">{role.label}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--muted-foreground)]">
        {role.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {role.permissions.map((permission) => (
          <span
            key={permission}
            className="mono rounded bg-[color:var(--muted-surface)] px-1.5 py-0.5 text-[10.5px] text-[color:var(--muted-foreground)]"
          >
            {permission}
          </span>
        ))}
      </div>
    </div>
  );
}

function GrantAccess({
  roles,
  apps,
  onClose,
  onSaved,
}: {
  roles: RoleDefinition[];
  apps: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = roles.find((r) => r.id === role);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.saveStaff({ email: email.trim(), role, title, appScope: scope });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't grant access.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Grant access to Zina"
      width={540}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} busy={busy} disabled={!email.trim()}>
            Grant access
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Email"
          hint="They must already have a Loopital account — this grants standing, it doesn't create an identity."
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@loopital.com"
          />
        </Field>
        <Field label="Role" hint={chosen?.description}>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Head of Support" />
        </Field>
        <Field
          label="Limit to certain apps"
          hint="Leave everything unticked for whole-ecosystem access. Ticking one or more restricts every screen, not just the menu."
        >
          <div className="mt-1 flex flex-wrap gap-2">
            {apps.map((app) => {
              const on = scope.includes(app.id);
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() =>
                    setScope((s) => (on ? s.filter((id) => id !== app.id) : [...s, app.id]))
                  }
                  className={
                    on
                      ? "rounded-full border border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] px-3 py-1.5 text-[12.5px] font-medium text-[color:var(--primary)]"
                      : "rounded-full border border-border px-3 py-1.5 text-[12.5px]"
                  }
                >
                  {app.name}
                </button>
              );
            })}
          </div>
        </Field>
        {error && <ErrorNote message={error} />}
      </div>
    </Modal>
  );
}
