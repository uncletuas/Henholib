import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table2 } from "lucide-react";

import { api } from "../lib/api";
import { useLoad } from "../lib/session";
import { count, money } from "../lib/format";
import {
  Button,
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

/**
 * Growth across the group.
 *
 * Two charts, one filter row above both, and a table twin for each — a value
 * that can only be read by hovering isn't readable at all.
 *
 * Colour follows the product, never its rank: the slot is taken from a fixed
 * order, so filtering the date range can't repaint a series and turn "Pal is
 * blue" into a lie. The five categorical slots are the validated ramp in
 * styles.css; a sixth earning product folds into a neutral "Other" rather than
 * inventing a hue that no longer passes the CVD check.
 */

const SERIES_ORDER = ["stack62", "fms13", "edm73", "hms7", "loopital"];
const SLOTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const OTHER_COLOR = "var(--muted-foreground)";

function colorFor(product: string, earning: string[]): string {
  const ranked = SERIES_ORDER.filter((p) => earning.includes(p));
  const extras = earning.filter((p) => !SERIES_ORDER.includes(p)).sort();
  const index = [...ranked, ...extras].indexOf(product);
  return index >= 0 && index < SLOTS.length ? SLOTS[index] : OTHER_COLOR;
}

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

const axisProps = {
  stroke: "var(--muted-foreground)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

function tooltipStyle() {
  return {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      fontSize: 12.5,
      color: "var(--foreground)",
    },
    labelStyle: { color: "var(--muted-foreground)", marginBottom: 4 },
    cursor: { stroke: "var(--border-strong)", strokeWidth: 1 },
  };
}

const shortDay = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [tables, setTables] = useState(false);
  const { data, error, loading, reload } = useLoad(() => api.analytics(days), [days]);

  const signups = useMemo(
    () => (data?.signups || []).map((row) => ({ day: row.day, count: row.count })),
    [data]
  );

  // Pivot the flat revenue rows into one record per day with a column per
  // product, which is the shape a multi-series line needs.
  const { revenueRows, earningProducts } = useMemo(() => {
    const products = Array.from(new Set((data?.revenue || []).map((r) => r.product)));
    const byDay = new Map<string, Record<string, number | string>>();
    for (const row of data?.revenue || []) {
      const existing = byDay.get(row.day) || { day: row.day };
      existing[row.product] = ((existing[row.product] as number) || 0) + row.totalMinor / 100;
      byDay.set(row.day, existing);
    }
    // Fill the gaps: a product with no payment on a day is zero, not a hole.
    const rows = [...byDay.values()]
      .map((row) => {
        for (const product of products) if (row[product] === undefined) row[product] = 0;
        return row;
      })
      .sort((a, b) => String(a.day).localeCompare(String(b.day)));
    return { revenueRows: rows, earningProducts: products };
  }, [data]);

  const totalSignups = signups.reduce((sum, row) => sum + row.count, 0);
  const totalRevenue = (data?.revenue || []).reduce((sum, row) => sum + row.totalMinor, 0);
  const delivered = (data?.email || [])
    .filter((row) => row.status === "sent")
    .reduce((sum, row) => sum + row.count, 0);
  const emailFailed = (data?.email || [])
    .filter((row) => row.status === "failed")
    .reduce((sum, row) => sum + row.count, 0);
  const activePlans = (data?.subscriptions || [])
    .filter((row) => row.status === "active")
    .reduce((sum, row) => sum + row.count, 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Signups and revenue are computed from Loopital's own ledger, so they're exact. Per-app metrics appear once an app pushes its daily rollups."
      />

      {/* One filter row above everything it scopes — never a filter per card. */}
      <FilterBar>
        {RANGES.map((range) => (
          <Chip key={range.days} active={days === range.days} onClick={() => setDays(range.days)}>
            {range.label}
          </Chip>
        ))}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setTables((t) => !t)}>
          <Table2 className="size-3.5" /> {tables ? "Hide tables" : "Show tables"}
        </Button>
      </FilterBar>

      {error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="New accounts" value={count(totalSignups)} hint={`Last ${days} days`} />
            <Stat label="Revenue" value={money(totalRevenue)} hint={`Last ${days} days`} />
            <Stat label="Active plans" value={count(activePlans)} hint="Right now" />
            <Stat
              label="Email delivered"
              value={count(delivered)}
              tone={emailFailed ? "warning" : "success"}
              hint={emailFailed ? `${count(emailFailed)} failed` : "Nothing bounced"}
            />
          </div>

          {/* Held at reduced opacity on refetch rather than flashing a skeleton,
              so changing the range doesn't jump the layout. */}
          <div
            className="mt-6 space-y-5 transition-opacity"
            style={{ opacity: loading && data ? 0.55 : 1 }}
          >
            {loading && !data ? (
              <Loading label="Reading the numbers" />
            ) : (
              <>
                <Panel
                  title="New accounts each day"
                  description="One Loopital account signs into every app, so this is the group's growth."
                >
                  {signups.length === 0 ? (
                    <Empty title="No signups in this window" />
                  ) : (
                    <>
                      {/* Height includes the axis band, so the card never grows
                          its own nested scrollbar. */}
                      <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={signups} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                            <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={false} />
                            <XAxis dataKey="day" tickFormatter={shortDay} {...axisProps} minTickGap={28} />
                            <YAxis width={44} allowDecimals={false} {...axisProps} />
                            <Tooltip
                              {...tooltipStyle()}
                              labelFormatter={(value) => shortDay(String(value))}
                              formatter={(value: number) => [count(value), "Accounts"]}
                            />
                            {/* A single series needs no legend box — the title
                                already names what is plotted. */}
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="var(--chart-1)"
                              strokeWidth={2}
                              fill="var(--chart-1)"
                              fillOpacity={0.1}
                              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      {tables && (
                        <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-border">
                          <TableWrap>
                            <thead>
                              <tr>
                                <Th>Day</Th>
                                <Th align="right">New accounts</Th>
                              </tr>
                            </thead>
                            <tbody>
                              {signups.map((row) => (
                                <tr key={row.day}>
                                  <Td>{shortDay(row.day)}</Td>
                                  <Td align="right" className="tabular">
                                    {count(row.count)}
                                  </Td>
                                </tr>
                              ))}
                            </tbody>
                          </TableWrap>
                        </div>
                      )}
                    </>
                  )}
                </Panel>

                <Panel
                  title="Revenue by product"
                  description="One Paystack account, split by what was bought. Amounts are in the gateway's currency."
                >
                  {revenueRows.length === 0 ? (
                    <Empty title="Nothing collected in this window" />
                  ) : (
                    <>
                      <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueRows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                            <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={false} />
                            <XAxis dataKey="day" tickFormatter={shortDay} {...axisProps} minTickGap={28} />
                            <YAxis
                              width={56}
                              {...axisProps}
                              tickFormatter={(value: number) => value.toLocaleString()}
                            />
                            <Tooltip
                              {...tooltipStyle()}
                              labelFormatter={(value) => shortDay(String(value))}
                              formatter={(value: number, name: string) => [
                                money(Math.round(value * 100)),
                                name,
                              ]}
                            />
                            {/* Always present for two or more series: identity
                                must never rest on colour-matching alone. */}
                            <Legend
                              iconType="plainline"
                              wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
                            />
                            {earningProducts.map((product) => (
                              <Line
                                key={product}
                                type="monotone"
                                dataKey={product}
                                name={product}
                                stroke={colorFor(product, earningProducts)}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {tables && (
                        <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-border">
                          <TableWrap>
                            <thead>
                              <tr>
                                <Th>Day</Th>
                                {earningProducts.map((product) => (
                                  <Th key={product} align="right">
                                    {product}
                                  </Th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {revenueRows.map((row) => (
                                <tr key={String(row.day)}>
                                  <Td>{shortDay(String(row.day))}</Td>
                                  {earningProducts.map((product) => (
                                    <Td key={product} align="right" className="tabular">
                                      {money(Math.round(((row[product] as number) || 0) * 100))}
                                    </Td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </TableWrap>
                        </div>
                      )}
                    </>
                  )}
                </Panel>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel title="Plans in force" description="Every active and trialing subscription." padded={false}>
                    {(data?.subscriptions || []).length === 0 ? (
                      <Empty title="No subscriptions yet" />
                    ) : (
                      <TableWrap>
                        <thead>
                          <tr>
                            <Th>Product</Th>
                            <Th>Plan</Th>
                            <Th>Status</Th>
                            <Th align="right">Accounts</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.subscriptions || [])
                            .slice()
                            .sort((a, b) => b.count - a.count)
                            .map((row, i) => (
                              <tr key={i}>
                                <Td>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="size-2 shrink-0 rounded-full"
                                      style={{ background: colorFor(row.product, earningProducts) }}
                                      aria-hidden
                                    />
                                    {row.product}
                                  </span>
                                </Td>
                                <Td>{row.plan}</Td>
                                <Td className="capitalize">{row.status}</Td>
                                <Td align="right" className="tabular font-medium">
                                  {count(row.count)}
                                </Td>
                              </tr>
                            ))}
                        </tbody>
                      </TableWrap>
                    )}
                  </Panel>

                  <Panel
                    title="What the apps report"
                    description="Daily rollups pushed by each app's connector."
                    padded={false}
                  >
                    {(data?.appMetrics || []).length === 0 ? (
                      <Empty
                        title="No app metrics yet"
                        description="An app starts appearing here once it posts rollups to /zina/ingest/metrics."
                      />
                    ) : (
                      <TableWrap>
                        <thead>
                          <tr>
                            <Th>App</Th>
                            <Th>Metric</Th>
                            <Th align="right">Latest</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.values(
                            (data?.appMetrics || []).reduce<
                              Record<string, { appId: string; metric: string; day: string; value: number }>
                            >((latest, row) => {
                              const key = `${row.appId}:${row.metric}`;
                              if (!latest[key] || latest[key].day < row.day) latest[key] = row;
                              return latest;
                            }, {})
                          ).map((row) => (
                            <tr key={`${row.appId}-${row.metric}`}>
                              <Td>{row.appId}</Td>
                              <Td>{row.metric}</Td>
                              <Td align="right" className="tabular font-medium">
                                {count(row.value)}
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </TableWrap>
                    )}
                  </Panel>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
