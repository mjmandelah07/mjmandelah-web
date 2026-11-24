"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, qs } from "@/lib/api";
import { isManager, type Page, type Supplier } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Field, Notice, PageHeader, fieldClass } from "@/components/ui";

export default function SuppliersPage() {
  const { user } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isManager(user.role)) router.replace("/");
  }, [router, user]);

  function load(next = search) {
    api<Page<Supplier>>(`/suppliers${qs({ search: next, pageSize: 50 })}`)
      .then((page) => setRows(page.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load suppliers"));
  }

  useEffect(() => {
    if (user && isManager(user.role)) load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function create(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/suppliers", { method: "POST", body: JSON.stringify({ name, phone: phone || undefined }) });
      setName("");
      setPhone("");
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the supplier");
    }
  }

  async function toggle(supplier: Supplier) {
    try {
      await api(`/suppliers/${supplier.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !supplier.isActive }),
      });
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Buying" title="Suppliers" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <form className="grid gap-3" onSubmit={create}>
            <Field label="Name"><input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required /></Field>
            <Field label="Phone"><input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
            <Button type="submit">Add supplier</Button>
          </form>
        </Card>
        <Card>
          <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); load(); }}>
            <input className={fieldClass} placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button type="submit" tone="paper">Search</Button>
          </form>
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty="No suppliers yet."
            columns={[
              { key: "name", label: "Name", render: (row) => row.name },
              { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
              {
                key: "active",
                label: "Status",
                render: (row) => (
                  <button className="text-sm font-semibold text-moss" type="button" onClick={() => toggle(row)}>
                    {row.isActive ? "Active" : "Inactive"}
                  </button>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
