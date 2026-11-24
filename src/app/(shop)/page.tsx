"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api, qs } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import { isManager, type MyReport, type OverviewReport } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, Money, Notice, PageHeader, Status, TextLink, fieldClass } from "@/components/ui";

export default function DashboardPage() {
  const { user } = useSession();
  const manager = user ? isManager(user.role) : false;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [overview, setOverview] = useState<OverviewReport | null>(null);
  const [mine, setMine] = useState<MyReport | null>(null);
  const [error, setError] = useState("");

  function load(nextFrom = from, nextTo = to) {
    setError("");
    const tasks: Array<Promise<void>> = [
      api<MyReport>("/reports/me").then(setMine),
    ];
    if (manager) {
      tasks.push(
        api<OverviewReport>(`/reports/overview${qs({ from: nextFrom, to: nextTo })}`).then(setOverview),
      );
    }
    Promise.all(tasks).catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load the counter"));
  }

  useEffect(() => {
    load();
    // Initial load only. Date changes go through the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Today"
        title={`Hello, ${user?.fullName.split(" ")[0] ?? "there"}`}
        action={
          <Link href="/sell">
            <Button>New sale</Button>
          </Link>
        }
      />
      {error ? <Notice>{error}</Notice> : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Your sales today</p>
          <p className="mt-2 font-display text-4xl">
            <Money amount={mine?.total ?? 0} />
          </p>
          <p className="mt-1 text-sm text-muted">{mine?.salesCount ?? 0} completed receipts</p>
        </Card>
        {manager && overview ? (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-muted">Shop takings</p>
              <TextLink href="/analytics">Charts</TextLink>
            </div>
            <p className="mt-2 font-display text-4xl">
              <Money amount={overview.retailTotal + overview.wholesaleTotal} />
            </p>
            <p className="mt-1 text-sm text-muted">{overview.salesCount} sales in this range</p>
          </Card>
        ) : null}
      </div>

      {manager ? (
        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={onFilter}>
          <input className={fieldClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From" />
          <input className={fieldClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To" />
          <Button type="submit" tone="paper">
            Apply dates
          </Button>
        </form>
      ) : null}

      {overview ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Retail" amount={overview.retailTotal} />
            <Stat label="Wholesale" amount={overview.wholesaleTotal} />
            <Stat label="Returns" amount={overview.returnsTotal} note={`${overview.returnsCount} slips`} />
            <Stat label="Stock at retail" amount={overview.stockRetailValue} note={`Cost ${overview.stockCostValue.toFixed(2)}`} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-2xl">Recent sales</h2>
                <TextLink href="/sales">All sales</TextLink>
              </div>
              {overview.recentSales.length === 0 ? (
                <p className="text-sm text-muted">No sales in this range.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {overview.recentSales.map((sale) => (
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
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-2xl">Low stock</h2>
                <TextLink href="/products?lowStock=1">Products</TextLink>
              </div>
              <p className="mb-3 text-sm text-muted">{overview.damagedUnits} damaged units in this range.</p>
              {overview.lowStock.length === 0 ? (
                <p className="text-sm text-muted">Nothing is at or below its reorder level.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {overview.lowStock.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <TextLink href={`/products/${product.id}`}>{product.name}</TextLink>
                        <p className="text-xs text-muted">{product.sku}</p>
                      </div>
                      <p className="text-sm">
                        <span className="num text-lg">{product.quantityOnHand}</span>
                        <span className="text-muted"> / {product.reorderLevel}</span>
                      </p>
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

function Stat({ label, amount, note }: { label: string; amount: number; note?: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl">
        <Money amount={amount} />
      </p>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </Card>
  );
}
