"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api, qs } from "@/lib/api";
import { formatMoney, formatWhen, titleCase, todayInput } from "@/lib/format";
import { isManager, type AnalyticsReport } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, Money, Notice, PageHeader, Status, TextLink, fieldClass } from "@/components/ui";

type Preset = "today" | "month" | "year" | "custom";
type Bucket = "hour" | "day" | "month";

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function yearStart() {
  return `${new Date().getUTCFullYear()}-01-01`;
}

function bucketLabel(value: string, bucket: Bucket) {
  const date = new Date(value);
  if (bucket === "hour") {
    return new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  if (bucket === "month") {
    return new Intl.DateTimeFormat("en-NG", { month: "short", year: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short" }).format(date);
}

export default function AnalyticsPage() {
  const { user } = useSession();
  const manager = user ? isManager(user.role) : false;
  const [preset, setPreset] = useState<Preset>("today");
  const [from, setFrom] = useState(todayInput());
  const [to, setTo] = useState(todayInput());
  const [bucket, setBucket] = useState<Bucket>("hour");
  const [loadedBucket, setLoadedBucket] = useState<Bucket>("hour");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState("");
  const request = useRef(0);

  function load(nextFrom = from, nextTo = to, nextBucket = bucket) {
    const id = ++request.current;
    setError("");
    api<AnalyticsReport>(`/reports/analytics${qs({ from: nextFrom, to: nextTo, bucket: nextBucket })}`)
      .then((next) => {
        if (id !== request.current) return;
        setLoadedBucket(nextBucket);
        setReport(next);
      })
      .catch((caught) => {
        if (id === request.current) setError(caught instanceof Error ? caught.message : "Could not load analytics");
      });
  }

  useEffect(() => {
    if (!manager) return;
    load(todayInput(), todayInput(), "hour");
    // First paint is today. Later changes go through the presets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  function applyPreset(next: Preset) {
    const today = todayInput();
    const nextFrom = next === "month" ? monthStart() : next === "year" ? yearStart() : next === "today" ? today : from;
    const nextTo = next === "custom" ? to : today;
    const nextBucket: Bucket = next === "year" ? "month" : next === "month" ? "day" : next === "today" ? "hour" : bucket;
    setPreset(next);
    setFrom(nextFrom);
    setTo(nextTo);
    setBucket(nextBucket);
    if (next !== "custom") load(nextFrom, nextTo, nextBucket);
  }

  function onCustom(event: FormEvent) {
    event.preventDefault();
    setPreset("custom");
    load();
  }

  if (user && !manager) {
    return (
      <div>
        <PageHeader title="Analytics" description="Totals and the chart for the range you pick." />
        <Notice>Analytics is for managers.</Notice>
      </div>
    );
  }

  const auditHref = `/audit${qs({ from, to })}`;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Totals and the chart for the range you pick."
        action={<TextLink href={auditHref}>Open this range in the audit</TextLink>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["today", "Today"],
            ["month", "This month"],
            ["year", "This year"],
            ["custom", "Custom"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`h-11 rounded-xl px-4 text-sm font-semibold ${preset === value ? "bg-moss text-paper" : "border border-line bg-card"}`}
            onClick={() => applyPreset(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={onCustom}>
        <input className={fieldClass} type="date" value={from} aria-label="From" onChange={(event) => setFrom(event.target.value)} />
        <input className={fieldClass} type="date" value={to} aria-label="To" onChange={(event) => setTo(event.target.value)} />
        <select className={fieldClass} value={bucket} aria-label="Chart buckets" onChange={(event) => setBucket(event.target.value as Bucket)}>
          <option value="hour">By hour</option>
          <option value="day">By day</option>
          <option value="month">By month</option>
        </select>
        <Button type="submit" tone="paper">
          Apply
        </Button>
      </form>

      {error ? <Notice>{error}</Notice> : null}
      {report && report.bucket !== loadedBucket ? (
        <p className="mb-4 text-sm text-muted">This range is grouped by {report.bucket} so the chart stays readable.</p>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Stat label="Takings" amount={report.total} note={`${report.salesCount} sales · avg ${formatMoney(report.averageSale)}`} />
            <Stat label="Retail" amount={report.retailTotal} />
            <Stat label="Wholesale" amount={report.wholesaleTotal} />
            <Stat label="Units sold" amount={report.unitsSold} plain note="Completed lines, voids excluded" />
            <Stat label="Best receipt" amount={report.bestSales[0]?.total ?? 0} note={report.bestSales[0]?.receiptNumber ?? "No sales in this range"} />
            <Stat label="Top product" amount={report.popularProducts[0]?.total ?? 0} note={report.popularProducts[0] ? `${report.popularProducts[0].name} · ${report.popularProducts[0].quantity}` : "No products sold"} />
          </div>

          <Card className="mt-4">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl">Sales</h2>
              <div className="flex gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-leaf" /> Retail
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-clay" /> Wholesale
                </span>
              </div>
            </div>
            <SalesChart series={report.series} bucket={report.bucket} />
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-display text-2xl">Popular products</h2>
              {report.popularProducts.length === 0 ? (
                <p className="text-sm text-muted">Nothing sold in this range.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {report.popularProducts.map((product) => (
                    <li key={product.productId} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <TextLink href={`/products/${product.productId}`}>{product.name}</TextLink>
                        <p className="text-xs text-muted">
                          {product.sku} · {product.quantity} sold
                        </p>
                      </div>
                      <div className="text-right">
                        <Money amount={product.total} />
                        <p>
                          <TextLink href={`/audit${qs({ from, to, productId: product.productId })}`}>Audit</TextLink>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-display text-2xl">Payments</h2>
              {report.payments.length === 0 ? (
                <p className="text-sm text-muted">No payments in this range.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {report.payments.map((payment) => (
                    <li key={payment.method} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium">{titleCase(payment.method)}</p>
                        <p className="text-xs text-muted">{payment.count} sales</p>
                      </div>
                      <Money amount={payment.total} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-display text-2xl">Best sales</h2>
              {report.bestSales.length === 0 ? (
                <p className="text-sm text-muted">No sales in this range.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {report.bestSales.map((sale) => (
                    <li key={sale.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <TextLink href={`/sales/${sale.id}`}>{sale.receiptNumber}</TextLink>
                        <p className="text-xs text-muted">
                          {sale.cashier.fullName} · {formatWhen(sale.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Status value={sale.channel} />
                        <p className="mt-1">
                          <Money amount={sale.total} />
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-display text-2xl">Cashiers</h2>
              {report.cashiers.length === 0 ? (
                <p className="text-sm text-muted">No completed sales in this range.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {report.cashiers.map((cashier) => (
                    <li key={cashier.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium">{cashier.fullName}</p>
                        <p className="text-xs text-muted">{cashier.count} sales</p>
                      </div>
                      <div className="text-right">
                        <Money amount={cashier.total} />
                        <p>
                          <TextLink href={`/audit${qs({ from, to, cashierId: cashier.id })}`}>Audit</TextLink>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, amount, note, plain = false }: { label: string; amount: number; note?: string; plain?: boolean }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl">{plain ? <span className="num">{amount}</span> : <Money amount={amount} />}</p>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </Card>
  );
}

function SalesChart({ series, bucket }: { series: AnalyticsReport["series"]; bucket: Bucket }) {
  const peak = Math.max(1, ...series.map((point) => point.retail + point.wholesale));
  const step = series.length > 18 ? Math.ceil(series.length / 8) : 1;
  const empty = series.every((point) => point.count === 0);
  if (empty) return <p className="text-sm text-muted">No completed sales in this range.</p>;

  return (
    <div className="overflow-x-auto">
      <div className="flex h-56 items-end gap-1" style={{ minWidth: Math.max(series.length * 28, 280) }}>
        {series.map((point, index) => {
          const retail = (point.retail / peak) * 100;
          const wholesale = (point.wholesale / peak) * 100;
          const caption = `${bucketLabel(point.bucket, bucket)} · ${point.count} · retail ${formatMoney(point.retail)} · wholesale ${formatMoney(point.wholesale)}`;
          return (
            <div key={point.bucket} className="flex min-w-6 flex-1 flex-col items-center" title={caption}>
              <div className="flex h-44 w-full items-end justify-center">
                <div className="flex h-full w-3 flex-col justify-end overflow-hidden rounded-t bg-sand/70">
                  <div className="bg-clay" style={{ height: `${wholesale}%` }} />
                  <div className="bg-leaf" style={{ height: `${retail}%` }} />
                </div>
              </div>
              <span className="mt-1 h-4 truncate text-[10px] text-muted">{index % step === 0 ? bucketLabel(point.bucket, bucket) : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
