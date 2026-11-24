"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import { isManager, type Customer } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Field, Modal, Money, Notice, PageHeader, areaClass, fieldClass } from "@/components/ui";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const manager = user ? isManager(user.role) : false;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api<Customer>(`/customers/${params.id}`)
      .then(setCustomer)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Customer not found"));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function pay(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api<{ customer: Customer }>(`/customers/${params.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), note: note || undefined }),
      });
      setAmount("");
      setNote("");
      setPayOpen(false);
      setCustomer({ ...result.customer, payments: customer?.payments });
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payment failed");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/customers/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          phone: String(form.get("phone") || ""),
          email: String(form.get("email") || "") || undefined,
          address: String(form.get("address") || ""),
          notes: String(form.get("notes") || ""),
        }),
      });
      setEditOpen(false);
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update");
    }
  }

  if (!customer) return error ? <Notice>{error}</Notice> : <p>Loading customer…</p>;

  return (
    <div>
      <PageHeader
        title={customer.name}
        description="Balance due, payments already taken, and the details on this account."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => { setError(""); setPayOpen(true); }}>Take payment</Button>
            {manager ? <Button type="button" tone="paper" onClick={() => { setError(""); setEditOpen(true); }}>Edit details</Button> : null}
          </div>
        }
      />
      {error && !payOpen && !editOpen ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Balance due</p>
          <p className="font-display text-4xl"><Money amount={customer.balance} /></p>
        </Card>
        <Card>
          <p>{customer.phone || "No phone"}</p>
          <p className="text-sm text-muted">{customer.email || "No email"}</p>
          <p className="text-sm text-muted">{customer.address || "No address"}</p>
          {customer.notes ? <p className="mt-2 text-sm">{customer.notes}</p> : null}
        </Card>
      </div>
      <Modal open={payOpen} title="Take payment" eyebrow={customer.name} onClose={() => setPayOpen(false)}>
        <form className="grid gap-3" onSubmit={pay}>
          {error ? <Notice>{error}</Notice> : null}
          <Field label="Payment amount">
            <input className={fieldClass} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </Field>
          <Field label="Note">
            <input className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button type="submit">Take payment</Button>
        </form>
      </Modal>
      <Modal open={editOpen} title="Edit details" eyebrow={customer.name} onClose={() => setEditOpen(false)}>
        <form className="grid gap-3" onSubmit={save} key={customer.updatedAt ?? customer.id}>
          {error ? <Notice>{error}</Notice> : null}
          <Field label="Name"><input className={fieldClass} name="name" defaultValue={customer.name} /></Field>
          <Field label="Phone"><input className={fieldClass} name="phone" defaultValue={customer.phone ?? ""} /></Field>
          <Field label="Email"><input className={fieldClass} name="email" defaultValue={customer.email ?? ""} /></Field>
          <Field label="Address"><input className={fieldClass} name="address" defaultValue={customer.address ?? ""} /></Field>
          <Field label="Notes"><textarea className={areaClass} name="notes" defaultValue={customer.notes ?? ""} /></Field>
          <Button type="submit" tone="paper">Save details</Button>
        </form>
      </Modal>
      <Card className="mt-4">
        <h2 className="mb-2 font-display text-2xl">Payments</h2>
        <DataTable
          rows={customer.payments ?? []}
          rowKey={(row) => row.id}
          empty="No payments yet."
          columns={[
            { key: "when", label: "When", render: (row) => formatWhen(row.createdAt) },
            { key: "amount", label: "Amount", render: (row) => <Money amount={row.amount} /> },
            { key: "note", label: "Note", render: (row) => row.note || "—" },
            { key: "by", label: "Received by", render: (row) => row.receivedBy?.fullName || "—" },
          ]}
        />
      </Card>
    </div>
  );
}
