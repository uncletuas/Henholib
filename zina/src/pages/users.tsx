import { useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";

import { api } from "../lib/api";
import { useLoad } from "../lib/session";
import { count, date } from "../lib/format";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  ErrorNote,
  Input,
  Loading,
  PageHeader,
  Panel,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

const PAGE = 50;

/**
 * One directory for the whole group.
 *
 * The Loopital account is the identity everywhere, so this lists accounts, not
 * per-app records — the per-app view lives on the person's own page, where the
 * connectors are asked what each app knows about that email address.
 */
export function UsersPage() {
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);

  const { data, error, loading, reload } = useLoad(
    () => api.users({ q, limit: PAGE, offset }),
    [q, offset]
  );

  function search(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    setQ(term.trim());
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Every Loopital account. One identity signs into Pal, Swift, Modus, Beacon and Henholib."
      />

      <form onSubmit={search} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--subtle-foreground)]" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="primary">
          Search
        </Button>
        {q && (
          <Button
            type="button"
            onClick={() => {
              setTerm("");
              setQ("");
              setOffset(0);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : !data || data.users.length === 0 ? (
        <Panel>
          <Empty
            title={q ? `Nobody matches “${q}”` : "No accounts yet"}
            description={q ? "Try a different name or email." : undefined}
          />
        </Panel>
      ) : (
        <>
          <Panel padded={false}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Person</Th>
                  <Th>Products</Th>
                  <Th align="right">Joined</Th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-[color:var(--muted-surface)]">
                    <Td>
                      <Link to={`/users/${user.id}`} className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatarUrl} size={32} />
                        <div className="min-w-0">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-[12px] text-[color:var(--muted-foreground)]">{user.email}</p>
                        </div>
                      </Link>
                    </Td>
                    <Td>
                      {user.products.length === 0 ? (
                        <span className="text-[12.5px] text-[color:var(--muted-foreground)]">
                          Free tier only
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {user.products.map((product) => (
                            <Badge key={product} tone="info">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Td>
                    <Td align="right" className="text-[12.5px] text-[color:var(--muted-foreground)]">
                      {date(user.createdAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Panel>

          <div className="mt-4 flex items-center justify-between text-[12.5px] text-[color:var(--muted-foreground)]">
            <span>
              {count(offset + 1)}–{count(Math.min(offset + PAGE, data.total))} of {count(data.total)}
            </span>
            <div className="flex gap-2">
              <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                Previous
              </Button>
              <Button
                size="sm"
                disabled={offset + PAGE >= data.total}
                onClick={() => setOffset(offset + PAGE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
