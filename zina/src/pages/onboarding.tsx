import { useState } from "react";

import { api, API_BASE_URL, type OnboardingMember } from "../lib/api";
import { useLoad, useSession } from "../lib/session";
import { dateTime } from "../lib/format";
import {
  Badge,
  Empty,
  ErrorNote,
  Loading,
  PageHeader,
  Panel,
  Stat,
  TableWrap,
  Td,
  Th,
} from "../components/ui";
import { ONBOARDING_LABELS, SENSITIVE_FIELDS } from "../lib/onboarding-fields";

/**
 * Who has actually joined, and how far they got.
 *
 * The three status columns are the spec's, in order, because that order is the
 * gate: an account with no NDA cannot have a form, and a form cannot be complete
 * before the NDA is signed. Anyone stalled is stalled at a nameable place.
 *
 * Payroll and identification are withheld by the API, not hidden by this page.
 * `sensitiveHidden` on the response is the server saying it dropped those fields
 * for this caller — finance and the superadmin get them, everyone else gets the
 * notice. A column blanked in the browser while the API still returns it is
 * styling, not access control.
 */

/** Downloads that need an Authorization header, which an <a href> cannot carry. */
async function authedDownload(path: string, filename: string, token: string | null) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(res.status === 404 ? "Nothing on file for that person." : "Download failed.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function MemberDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { token } = useSession();
  const { data, error, loading } = useLoad(() => api.onboardingMember(userId), [userId]);
  const [dlError, setDlError] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;

  const entries = Object.entries(data.answers).filter(
    ([, v]) => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && !v.length),
  );

  return (
    <Panel
      title={data.name || data.email}
      actions={
        <button type="button" onClick={onClose} style={{ fontSize: 13, cursor: "pointer" }}>
          Close
        </button>
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <Badge tone={data.ndaSigned ? "success" : "muted"}>
          {data.ndaSigned ? `NDA signed ${dateTime(data.ndaSignedAt)}` : "NDA not signed"}
        </Badge>
        <Badge tone={data.formComplete ? "success" : "muted"}>
          {data.formComplete ? "Form complete" : `Form at step ${data.step} of 9`}
        </Badge>
      </div>

      {data.nda && (
        <div style={{ marginBottom: 18, fontSize: 13, lineHeight: 1.7, opacity: 0.85 }}>
          <strong>Signature record.</strong> Signed as “{data.nda.fullName}”
          {data.nda.role ? `, ${data.nda.role}` : ""}, by {data.nda.method} signature, at{" "}
          {dateTime(data.nda.signedAt)}.
          {data.nda.ip ? ` From ${data.nda.ip}.` : ""}
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              style={{ fontSize: 13, cursor: "pointer" }}
              onClick={() =>
                authedDownload(
                  `/zina/onboarding/${userId}/nda.pdf`,
                  `Loopital-NDA-${(data.name || "member").replace(/\s+/g, "-")}.pdf`,
                  token,
                ).catch((e) => setDlError((e as Error).message))
              }
            >
              Download signed NDA
            </button>
          </div>
          {dlError && <ErrorNote message={dlError} />}
        </div>
      )}

      {data.sensitiveHidden && (
        <div style={{ marginBottom: 16, fontSize: 13, lineHeight: 1.65, opacity: 0.75 }}>
          Payroll and identification details are recorded for this person but are
          not shown to your role. The Finance &amp; Administration Lead and the
          CEO can see them.
        </div>
      )}

      {entries.length === 0 ? (
        <Empty>Nothing filled in yet.</Empty>
      ) : (
        <TableWrap>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <Th style={{ width: 240, textAlign: "left" }}>
                  {ONBOARDING_LABELS[k] || k}
                  {SENSITIVE_FIELDS.includes(k) && (
                    <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>restricted</span>
                  )}
                </Th>
                <Td>{Array.isArray(v) ? v.join(", ") : String(v)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Panel>
  );
}

export function OnboardingPage() {
  const { token } = useSession();
  const { data, error, loading, reload } = useLoad(() => api.onboarding(), []);
  const [open, setOpen] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);

  const members: OnboardingMember[] = data?.members ?? [];
  const signed = members.filter((m) => m.ndaSigned).length;
  const complete = members.filter((m) => m.formComplete).length;

  return (
    <>
      <PageHeader
        title="Team onboarding"
        subtitle="Accounts created, agreements signed, and details submitted."
        actions={
          <button
            type="button"
            style={{ fontSize: 13, cursor: "pointer" }}
            onClick={() =>
              authedDownload("/zina/onboarding/export", "loopital-onboarding.csv", token).catch((e) =>
                setDlError((e as Error).message),
              )
            }
          >
            Export CSV
          </button>
        }
      />

      {dlError && <ErrorNote message={dlError} />}
      {error && <ErrorNote message={error} onRetry={reload} />}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <Stat label="Accounts" value={String(members.length)} />
        <Stat label="NDA signed" value={`${signed} of ${members.length}`} />
        <Stat label="Onboarding complete" value={`${complete} of ${members.length}`} />
      </div>

      {loading ? (
        <Loading />
      ) : members.length === 0 ? (
        <Empty>Nobody has started onboarding yet.</Empty>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Account</Th>
              <Th>NDA</Th>
              <Th>Form</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId}>
                <Td>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{m.email}</div>
                </Td>
                <Td>{m.role || "—"}</Td>
                <Td>{dateTime(m.accountCreated)}</Td>
                <Td>
                  <Badge tone={m.ndaSigned ? "success" : "muted"}>
                    {m.ndaSigned ? "Signed" : "Not signed"}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={m.formComplete ? "success" : "muted"}>
                    {m.formComplete ? "Complete" : `Step ${m.step} of 9`}
                  </Badge>
                </Td>
                <Td>
                  <button
                    type="button"
                    style={{ fontSize: 13, cursor: "pointer" }}
                    onClick={() => setOpen(open === m.userId ? null : m.userId)}
                  >
                    {open === m.userId ? "Hide" : "View"}
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {open && (
        <div style={{ marginTop: 20 }}>
          <MemberDetail userId={open} onClose={() => setOpen(null)} />
        </div>
      )}
    </>
  );
}
