"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import type { Page, ReturnRecord, Sale } from "@/lib/models";
import { Button, Card, DataTable, Field, Money, Notice, PageHeader, fieldClass } from "@/components/ui";

export default function ReturnsPage() {
  const [search, setSearch] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState<ReturnRecord[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  function loadReturns() {
    api<Page<ReturnRecord>>("/returns?pageSize=20")
      .then((page) => setRows(page.data))
      .catch(() => undefined);
  }

  useEffect(() => {
    loadReturns();
  }, []);

  async function find(event: FormEvent) {
    event.preventDefault();
    setError("");
    setOk("");
    try {
      const page = await api<Page<Sale>>(`/sales${qs({ search: search.trim(), pageSize: 1 })}`);
      const found = page.data[0];
      if (!found) {
        setSale(null);
        setError("No sale with that receipt number");
        return;
      }
      const full = await api<Sale>(`/sales/${found.id}`);
      setSale(full);
      setQuantities({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not find the sale");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!sale) return;
    const items = sale.items
      .filter((item) => (quantities[item.id] || 0) > 0)
      .map((item) => ({ saleItemId: item.id, quantity: quantities[item.id] }));
    if (!items.length) {
      setError("Choose a quantity to return");
      return;
    }
    setError("");
    try {
      await api("/returns", {
        method: "POST",
        body: JSON.stringify({ saleId: sale.id, reason, items }),
      });
      setOk("Return saved and stock restored.");
      setReason("");
      setQuantities({});
      const full = await api<Sale>(`/sales/${sale.id}`);
      setSale(full);
      loadReturns();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Return failed");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="After the sale" title="Returns" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      {ok ? <div className="mb-4"><Notice tone="ok">{ok}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <form className="flex gap-2" onSubmit={find}>
            <input className={fieldClass} placeholder="Receipt number" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button type="submit" tone="paper">Find</Button>
          </form>
          {sale ? (
            <form className="mt-4 grid gap-3" onSubmit={submit}>
              <p className="text-sm text-muted">{sale.receiptNumber} · {sale.status}</p>
              {sale.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_90px] items-center gap-2">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted">{item.remainingQty} can come back</p>
                  </div>
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    max={item.remainingQty}
                    value={quantities[item.id] ?? 0}
                    onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) }))}
                  />
                </div>
              ))}
              <Field label="Reason">
                <input className={fieldClass} value={reason} minLength={3} onChange={(event) => setReason(event.target.value)} required />
              </Field>
              <Button type="submit">Record return</Button>
            </form>
          ) : null}
        </Card>
        <Card>
          <h2 className="mb-2 font-display text-2xl">Recent</h2>
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty="No returns yet."
            columns={[
              { key: "sale", label: "Sale", render: (row) => row.sale.receiptNumber },
              { key: "when", label: "When", render: (row) => formatWhen(row.createdAt) },
              { key: "reason", label: "Reason", render: (row) => row.reason },
              { key: "refund", label: "Refund", render: (row) => <Money amount={row.refundAmount} /> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
