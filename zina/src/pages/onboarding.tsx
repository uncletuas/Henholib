import { useState } from "react";

import { api, downloadFile, type OnboardingMember } from "../lib/api";
import { useLoad } from "../lib/session";
import { dateTime } from "../lib/format";
import {
  Badge,
  Button,
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
 * The three status columns are the spec's, in the order the gate enforces them —
 * account, NDA, form — so anyone stalled is stalled at a nameable place.
 *
 * Payroll and identification are withheld by the API, not hidden here.
 * `sensitiveHidden` on the response is the server saying it dropped those fields
 * for this caller; the page reports that rather than rendering empty rows, so an
 * operator knows the data exists and that they are not the one who may see it.
 * A column blanked in the browser while the endpoint still returns it would be
 * styling, not access control.
 */

function MemberDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, error, loading } = useLoad(() => api.onboardingMember(userId), [userId]);
  const [dlError, setDlError] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;

  const entries = Object.entries(data.answers).filter(
    ([, v]) => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0),
  );

  const grab = () =>
    downloadFile(
      `/zina/onboarding/${userId}/nda.pdf`,
      `Loopital-NDA-${(data.name || "member").replace(/\s+/g, "-")}.pdf`,
    ).catch((e: unknown) => setDlError((e as Error).message));

  return (
    <Panel
      title={data.name || data.email}
      description={data.email}
      action={<Button onClick={onClose}>Close</Button>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={data.ndaSigned ? "success" : "warning"}>
          {data.ndaSigned ? `NDA signed ${dateTime(data.ndaSignedAt)}` : "NDA not signed"}
        </Badge>
        <Badge tone={data.formComplete ? "success" : "warning"}>
          {data.formComplete ? "Form complete" : `Form at step ${data.step} of 9`}
        </Badge>
      </div>

      {data.nda && (
        <div className="mb-5 text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
          Signed as “{data.nda.fullName}”
          {data.nda.role ? `, ${data.nda.role}` : ""}, by {data.nda.method} signature, at{" "}
          {dateTime(data.nda.signedAt)}.
          {data.nda.ip ? ` From ${data.nda.ip}.` : ""}
          <div className="mt-3">
            <Button onClick={grab}>Download signed NDA</Button>
          </div>
        </div>
      )}

      {dlError && <ErrorNote message={dlError} />}

      {data.sensitiveHidden && (
        <div className="mb-4 text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
          Payroll and identification details are on file for this person but are not
          shown to your role. The Finance &amp; Administration Lead and the CEO can
          see them.
        </div>
      )}

      {entries.length === 0 ? (
        <Empty title="Nothing filled in yet" description="They have not started the form." />
      ) : (
        <TableWrap>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <Th>
                  {ONBOARDING_LABELS[k] || k}
                  {SENSITIVE_FIELDS.includes(k) && (
                    <span className="ml-1.5 text-[11px] opacity-60">restricted</span>
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
  const { data, error, loading, reload } = useLoad(() => api.onboarding(), []);
  const [open, setOpen] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);

  const members: OnboardingMember[] = data?.members ?? [];
  const signed = members.filter((m) => m.ndaSigned).length;
  const complete = members.filter((m) => m.formComplete).length;

  const exportCsv = () =>
    downloadFile("/zina/onboarding/export", "loopital-onboarding.csv").catch((e: unknown) =>
      setDlError((e as Error).message),
    );

  return (
    <>
      <PageHeader
        title="Team onboarding"
        description="Accounts created, agreements signed, and details submitted."
        action={<Button onClick={exportCsv}>Export CSV</Button>}
      />

      {dlError && <ErrorNote message={dlError} />}
      {error && <ErrorNote message={error} onRetry={reload} />}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Accounts" value={members.length} />
        <Stat label="NDA signed" value={`${signed} of ${members.length}`} tone={signed === members.length && members.length > 0 ? "success" : "neutral"} />
        <Stat label="Onboarding complete" value={`${complete} of ${members.length}`} tone={complete === members.length && members.length > 0 ? "success" : "neutral"} />
      </div>

      {loading ? (
        <Loading />
      ) : members.length === 0 ? (
        <Empty
          title="Nobody has started onboarding yet"
          description="Rows appear here as soon as someone creates an account at loopital.com/onboarding."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Account created</Th>
              <Th>NDA</Th>
              <Th>Form</Th>
              <Th align="right">Record</Th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId}>
                <Td>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-[12px] text-[color:var(--muted-foreground)]">{m.email}</div>
                </Td>
                <Td>{m.role || "—"}</Td>
                <Td>{dateTime(m.accountCreated)}</Td>
                <Td>
                  <Badge tone={m.ndaSigned ? "success" : "warning"}>
                    {m.ndaSigned ? "Signed" : "Not signed"}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={m.formComplete ? "success" : "warning"}>
                    {m.formComplete ? "Complete" : `Step ${m.step} of 9`}
                  </Badge>
                </Td>
                <Td align="right">
                  <Button onClick={() => setOpen(open === m.userId ? null : m.userId)}>
                    {open === m.userId ? "Hide" : "View"}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {open && (
        <div className="mt-5">
          <MemberDetail userId={open} onClose={() => setOpen(null)} />
        </div>
      )}
    </>
  );
}
