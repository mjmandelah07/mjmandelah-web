"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import type { DamageReport, Page, Product } from "@/lib/models";
import { Button, Card, DataTable, Field, Notice, PageHeader, areaClass, fieldClass } from "@/components/ui";

export default function DamagesPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [rows, setRows] = useState<DamageReport[]>([]);
  const [error, setError] = useState("");

  function load() {
    api<Page<DamageReport>>("/damages?pageSize=20")
      .then((page) => setRows(page.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load damages"));
  }

  useEffect(() => {
    load();
  }, []);

  async function findProducts(event: FormEvent) {
    event.preventDefault();
    const page = await api<Page<Product>>(`/products${qs({ search, pageSize: 8 })}`);
    setProducts(page.data);
    if (page.data[0]) setProductId(page.data[0].id);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!images?.length) {
      setError("Add at least one photo");
      return;
    }
    setError("");
    const body = new FormData();
    body.set("productId", productId);
    body.set("quantity", quantity);
    body.set("reason", reason);
    if (notes.trim()) body.set("notes", notes.trim());
    Array.from(images).forEach((file) => body.append("images", file));
    try {
      await api("/damages", { method: "POST", body });
      setReason("");
      setNotes("");
      setImages(null);
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not record the damage");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Shelf" title="Damages" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <form className="mb-4 flex gap-2" onSubmit={findProducts}>
            <input className={fieldClass} placeholder="Find a product" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button type="submit" tone="paper">Find</Button>
          </form>
          <form className="grid gap-3" onSubmit={submit}>
            <Field label="Product">
              <select className={fieldClass} value={productId} onChange={(event) => setProductId(event.target.value)} required>
                <option value="">Choose</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} · {product.quantityOnHand} on hand</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input className={fieldClass} inputMode="numeric" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </Field>
            <Field label="Reason">
              <input className={fieldClass} minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} required />
            </Field>
            <Field label="Notes">
              <textarea className={areaClass} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Field label="Photos" hint="At least one JPEG, PNG, or WebP.">
              <input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(event) => setImages(event.target.files)} />
            </Field>
            <Button type="submit">Record damage</Button>
          </form>
        </Card>
        <Card>
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty="No damage reports."
            columns={[
              { key: "product", label: "Product", render: (row) => row.product.name },
              { key: "qty", label: "Qty", render: (row) => row.quantity },
              { key: "reason", label: "Reason", render: (row) => row.reason },
              { key: "when", label: "When", render: (row) => formatWhen(row.createdAt) },
              {
                key: "photo",
                label: "Photo",
                render: (row) =>
                  row.images[0] ? (
                    <a className="font-semibold text-moss" href={row.images[0].url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
