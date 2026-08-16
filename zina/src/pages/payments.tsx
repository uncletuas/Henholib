import { useState } from "react";
import { Link } from "react-router";

import { api } from "../lib/api";
import { useLoad } from "../lib/session";
import { count, dateTime, money } from "../lib/format";
import {
  Badge,
  Chip,
  Empty,
  ErrorNote,
  FilterBar,
  Loading,
  PageHeader,
  Panel,
  Stat,
  TableWrap,
  Td,
  Th,
} from "../components/ui";

const STATUSES = ["", "success", "pending", "failed"] as const;

/**
 * One Paystack account, one ledger.
 *
 * Every product's money runs through the same `/billing/checkout` and the same
 * webhook, so this table is the whole picture rather than one product's slice.
 * The catalog underneath is read from the API that actually charges — a price
 * list that could disagree with the checkout would be worse than none.
 */
export function PaymentsPage() {
  const [status, setStatus] = useState<string>("");
  const [product, setProduct] = useState<string>("");

  const { data, error, loading, reload } = useLoad(
    () => api.payments({ status, product, limit: 100 }),
    [status, product]
  );
  const catalog = useLoad(() => api.billingCatalog());

  const products = Array.from(new Set((data?.summary || []).map((s) => s.product))).sort();
  const collected = (data?.summary || [])
    .filter((s) => s.status === "success")
    .reduce((sum, s) => sum + s.totalMinor, 0);
  const pending = (data?.summary || [])
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.count, 0);
  const failed = (data?.summary || [])
    .filter((s) => s.status === "failed")
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every product bills through the one connected Paystack account, so this is the whole ledger."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Collected" value={money(collected)} hint="Successful payments" />
        <Stat label="Awaiting" value={count(pending)} tone={pending ? "warning" : "neutral"} hint="Started, not settled" />
        <Stat label="Failed" value={count(failed)} tone={failed ? "danger" : "neutral"} />
        <Stat
          label="Gateway"
          value={catalog.data?.configured ? "Live" : "Not set"}
          tone={catalog.data?.configured ? "success" : "danger"}
          hint={catalog.data?.currency}
        />
      </div>

      <div className="mt-6">
        <FilterBar>
          {STATUSES.map((value) => (
            <Chip key={value || "all"} active={status === value} onClick={() => setStatus(value)}>
              {value ? value[0].toUpperCase() + value.slice(1) : "All statuses"}
            </Chip>
          ))}
          <span className="mx-1 h-5 w-px bg-[color:var(--border)]" />
          <Chip active={product === ""} onClick={() => setProduct("")}>
            All products
          </Chip>
          {products.map((value) => (
            <Chip key={value} active={product === value} onClick={() => setProduct(value)}>
              {value}
            </Chip>
          ))}
        </FilterBar>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote message={error} onRetry={reload} />
        ) : !data || data.payments.length === 0 ? (
          <Panel>
            <Empty title="Nothing here" description="No payment matches these filters." />
          </Panel>
        ) : (
          <Panel padded={false}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Customer</Th>
                  <Th>Product</Th>
                  <Th>For</Th>
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
                    <Td>
                      <p className="font-medium">{payment.customer?.name}</p>
                      <p className="text-[12px] text-[color:var(--muted-foreground)]">
                        {payment.customer?.email}
                      </p>
                    </Td>
                    <Td>{payment.product}</Td>
                    <Td>
                      {payment.purpose === "credits"
                        ? `${count(payment.credits ?? 0)} credits`
                        : payment.plan || "subscription"}
                      {payment.seats > 1 && (
                        <span className="text-[color:var(--muted-foreground)]"> × {payment.seats}</span>
                      )}
                    </Td>
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
          </Panel>
        )}
      </div>

      <div className="mt-6">
        <Panel
          title="Price list"
          description="What the checkout charges, read from the API that charges it. Prices are set server-side so they can't be tampered with by a client."
        >
          {catalog.loading ? (
            <Loading label="Reading the catalog" />
          ) : catalog.error ? (
            <ErrorNote message={catalog.error} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {(catalog.data?.products || []).map((entry) => {
                const items = entry.purposes.flatMap((p) =>
                  p.items.map((item) => ({ ...item, purpose: p.purpose }))
                );
                return (
                  <div key={entry.product} className="rounded-lg border border-border p-4">
                    <p className="text-[13.5px] font-semibold">{entry.product}</p>
                    {items.length === 0 ? (
                      <p className="mt-2 text-[12.5px] text-[color:var(--muted-foreground)]">
                        Nothing on sale yet.
                      </p>
                    ) : (
                      <ul className="mt-2.5 space-y-1.5">
                        {items.map((item) => (
                          <li
                            key={`${item.purpose}-${item.key}`}
                            className="flex items-baseline justify-between gap-3 text-[13px]"
                          >
                            <span>
                              {item.key}
                              {item.credits ? (
                                <span className="text-[color:var(--muted-foreground)]">
                                  {" "}
                                  · {count(item.credits)} credits
                                </span>
                              ) : null}
                              {item.seatBased ? (
                                <span className="text-[color:var(--muted-foreground)]"> · per seat</span>
                              ) : null}
                            </span>
                            <span className="tabular font-medium">
                              {money(item.amountMinor, catalog.data?.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!catalog.data?.configured && (
            <p className="mt-4 text-[12.5px]" style={{ color: "var(--warning)" }}>
              PAYSTACK_SECRET_KEY isn't set on the API, so no checkout will start. Add it in{" "}
              <Link to="/keys" className="underline">
                API keys
              </Link>{" "}
              and on the service's environment.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
