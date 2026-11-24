"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, qs } from "@/lib/api";
import { isManager, type Page, type Supplier } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Field, Notice, PageHeader, areaClass, fieldClass } from "@/components/ui";

const empty = { name: "", phone: "", email: "", address: "", notes: "" };

export default function SuppliersPage() {
  const { user } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isManager(user.role)) router.replace("/");
  }, [router, user]);

  function load(next = search) {
    api<Page<Supplier>>(`/suppliers${qs({ search: next, pageSize: 50, includeInactive: true })}`)
      .then((page) => setRows(page.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load suppliers"));
  }

  useEffect(() => {
    if (user && isManager(user.role)) load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function resetForm() {
    setForm(empty);
    setEditing(null);
  }

  function beginEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      notes: supplier.notes ?? "",
    });
    setError("");
  }

  function setField(key: keyof typeof empty, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    const body = {
      name: form.name,
      phone: form.phone,
      email: form.email.trim() || null,
      address: form.address,
      notes: form.notes,
    };
    try {
      await api(editing ? `/suppliers/${editing.id}` : "/suppliers", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(editing ? body : { ...body, email: body.email || undefined }),
      });
      resetForm();
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the supplier");
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
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <form className="grid gap-3" onSubmit={save}>
            <p className="font-display text-2xl">{editing ? "Edit supplier" : "New supplier"}</p>
            <Field label="Name">
              <input className={fieldClass} value={form.name} onChange={(event) => setField("name", event.target.value)} required minLength={2} />
            </Field>
            <Field label="Phone">
              <input className={fieldClass} value={form.phone} onChange={(event) => setField("phone", event.target.value)} />
            </Field>
            <Field label="Email">
              <input className={fieldClass} type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} />
            </Field>
            <Field label="Address">
              <input className={fieldClass} value={form.address} onChange={(event) => setField("address", event.target.value)} />
            </Field>
            <Field label="Notes">
              <textarea className={areaClass} value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">{editing ? "Save changes" : "Add supplier"}</Button>
              {editing ? (
                <Button type="button" tone="paper" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
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
              {
                key: "name",
                label: "Name",
                render: (row) => (
                  <div>
                    <p>{row.name}</p>
                    {row.email ? <p className="text-xs text-muted">{row.email}</p> : null}
                  </div>
                ),
              },
              { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
              {
                key: "edit",
                label: "Edit",
                render: (row) => (
                  <button className="text-sm font-semibold text-moss" type="button" onClick={() => beginEdit(row)}>
                    Edit
                  </button>
                ),
              },
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
