"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { flattenCategories, type Category, type Product } from "@/lib/models";
import { Button, Field, Notice, areaClass, fieldClass } from "@/components/ui";

export function ProductForm({ onSaved }: { onSaved: (product: Product) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [images, setImages] = useState<FileList | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);

  useEffect(() => {
    api<Category[]>("/categories").then(setCategories).catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const opening = Number(form.get("openingQuantity") || 0);
    try {
      let product: Product;
      if ((images && images.length) || receipt) {
        const body = new FormData();
        for (const [key, value] of form.entries()) {
          if (typeof value === "string" && value.trim()) body.append(key, value);
        }
        if (images) Array.from(images).forEach((file) => body.append("images", file));
        if (receipt && opening >= 1) body.append("receipt", receipt);
        product = await api<Product>("/products", { method: "POST", body });
      } else {
        const payload: Record<string, string | number> = {};
        for (const [key, value] of form.entries()) {
          if (typeof value !== "string" || !value.trim()) continue;
          payload[key] = ["retailPrice", "wholesalePrice", "costPrice", "wholesaleMinQty", "reorderLevel", "openingQuantity", "openingUnitCost"].includes(key)
            ? Number(value)
            : value;
        }
        product = await api<Product>("/products", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved(product);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the product");
    } finally {
      setPending(false);
    }
  }

  const options = flattenCategories(categories);

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" hint="The shop assigns a SKU from this name.">
          <input className={fieldClass} name="name" required minLength={2} />
        </Field>
        <Field label="Category">
          <select className={fieldClass} name="categoryId" required defaultValue="">
            <option value="" disabled>Choose</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Retail price">
          <input className={fieldClass} name="retailPrice" required inputMode="decimal" />
        </Field>
        <Field label="Wholesale price">
          <input className={fieldClass} name="wholesalePrice" required inputMode="decimal" />
        </Field>
        <Field label="Cost price">
          <input className={fieldClass} name="costPrice" inputMode="decimal" />
        </Field>
        <Field label="Unit" hint="pcs, carton, bottle">
          <input className={fieldClass} name="unit" placeholder="pcs" />
        </Field>
        <Field label="Barcode">
          <input className={fieldClass} name="barcode" />
        </Field>
        <Field label="Wholesale minimum">
          <input className={fieldClass} name="wholesaleMinQty" inputMode="numeric" defaultValue="1" />
        </Field>
        <Field label="Reorder level">
          <input className={fieldClass} name="reorderLevel" inputMode="numeric" defaultValue="0" />
        </Field>
        <Field label="Opening quantity">
          <input className={fieldClass} name="openingQuantity" inputMode="numeric" defaultValue="0" />
        </Field>
        <Field label="Opening unit cost">
          <input className={fieldClass} name="openingUnitCost" inputMode="decimal" />
        </Field>
      </div>
      <Field label="Description">
        <textarea className={areaClass} name="description" />
      </Field>
      <Field label="Photos" hint="JPEG, PNG, or WebP. Up to 6, 5MB each.">
        <input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setImages(event.target.files)} />
      </Field>
      <Field label="Supplier receipt" hint="Only sent when opening quantity is at least 1.">
        <input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save product"}</Button>
    </form>
  );
}
