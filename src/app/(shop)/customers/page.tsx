"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import type { Customer, Page } from "@/lib/models";
import { Button, Card, DataTable, Field, Money, Notice, PageHeader, TextLink, fieldClass } from "@/components/ui";

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function load(nextSearch = search) {
    api<Page<Customer>>(`/customers${qs({ search: nextSearch, pageSize: 50 })}`)
      .then((page) => setRows(page.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load customers"));
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      setName("");
      setPhone("");
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the customer");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Accounts" title="Customers" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <form className="grid gap-3" onSubmit={create}>
            <Field label="Name"><input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required /></Field>
            <Field label="Phone"><input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
            <Button type="submit">Add customer</Button>
          </form>
        </Card>
        <Card>
          <form
            className="mb-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              load();
            }}
          >
            <input className={fieldClass} placeholder="Name or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button type="submit" tone="paper">Search</Button>
          </form>
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty="No customers yet."
            columns={[
              { key: "name", label: "Name", render: (row) => <TextLink href={`/customers/${row.id}`}>{row.name}</TextLink> },
              { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
              { key: "balance", label: "Balance", render: (row) => <Money amount={row.balance} /> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
