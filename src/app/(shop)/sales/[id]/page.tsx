"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, downloadAuthorized, openAuthorized } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import { isManager, type Sale } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Money, Notice, PageHeader, Status } from "@/components/ui";

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const manager = user ? isManager(user.role) : false;
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Sale>(`/sales/${params.id}`)
      .then(setSale)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Sale not found"));
  }, [params.id]);

  async function voidSale() {
    if (!sale) return;
    setPending(true);
    setError("");
    try {
      setSale(await api<Sale>(`/sales/${sale.id}/void`, { method: "POST" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not void this sale");
    } finally {
      setPending(false);
    }
  }

  if (!sale) return error ? <Notice>{error}</Notice> : <p>Loading sale…</p>;

  return (
    <div>
      <PageHeader
        eyebrow={formatWhen(sale.createdAt)}
        title={sale.receiptNumber}
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => openAuthorized(`/sales/${sale.id}/receipt/print`)}>Print</Button>
            <Button type="button" tone="paper" onClick={() => downloadAuthorized(`/sales/${sale.id}/receipt.pdf`, `${sale.receiptNumber}.pdf`)}>PDF</Button>
          </div>
        }
      />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <Status value={sale.channel} />
        <Status value={sale.status} />
        <Status value={sale.paymentMethod} />
        <Status value={sale.receiptStatus} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <DataTable
            rows={sale.items}
            rowKey={(row) => row.id}
            empty="No lines."
            columns={[
              { key: "name", label: "Item", render: (row) => row.productName },
              { key: "qty", label: "Qty", render: (row) => row.quantity },
              { key: "left", label: "Left", render: (row) => row.remainingQty },
              { key: "price", label: "Price", render: (row) => <Money amount={row.unitPrice} /> },
              { key: "total", label: "Line", render: (row) => <Money amount={row.lineTotal} /> },
            ]}
          />
        </Card>
        <Card>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Customer</dt>
            <dd className="text-right">{sale.customer?.name || sale.customerName || "—"}</dd>
            <dt className="text-muted">Cashier</dt>
            <dd className="text-right">{sale.cashier.fullName}</dd>
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-right"><Money amount={sale.subtotal} /></dd>
            <dt className="text-muted">Discount</dt>
            <dd className="text-right"><Money amount={sale.discount} /></dd>
            <dt className="text-muted">Tax</dt>
            <dd className="text-right"><Money amount={sale.tax} /></dd>
            <dt className="text-muted">Total</dt>
            <dd className="text-right font-display text-2xl"><Money amount={sale.total} /></dd>
            <dt className="text-muted">Paid</dt>
            <dd className="text-right"><Money amount={sale.amountPaid} /></dd>
            <dt className="text-muted">Change</dt>
            <dd className="text-right"><Money amount={sale.changeDue} /></dd>
            <dt className="text-muted">Balance</dt>
            <dd className="text-right"><Money amount={sale.balanceDue} /></dd>
          </dl>
          {sale.notes ? <p className="mt-3 text-sm text-muted">{sale.notes}</p> : null}
          {manager && sale.status === "COMPLETED" ? (
            <Button className="mt-4" tone="danger" type="button" disabled={pending} onClick={voidSale}>
              {pending ? "Voiding…" : "Void sale"}
            </Button>
          ) : null}
        </Card>
      </div>
      {sale.returns.length ? (
        <Card className="mt-4">
          <h2 className="mb-2 font-display text-2xl">Returns</h2>
          <ul className="divide-y divide-line">
            {sale.returns.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p>{entry.reason}</p>
                  <p className="text-xs text-muted">{entry.processedBy.fullName} · {formatWhen(entry.createdAt)}</p>
                </div>
                <Money amount={entry.refundAmount} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
