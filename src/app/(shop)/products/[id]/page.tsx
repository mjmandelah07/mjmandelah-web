"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { flattenCategories, isManager, type Category, type Product } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, ConfirmModal, Field, Modal, Money, Notice, PageHeader, Status, areaClass, fieldClass } from "@/components/ui";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const manager = user ? isManager(user.role) : false;
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);

  function load() {
    api<Product>(`/products/${params.id}`)
      .then(setProduct)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Product not found"));
  }

  useEffect(() => {
    load();
    if (manager) api<Category[]>("/categories").then(setCategories).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, manager]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, string | number | boolean> = {
      name: String(form.get("name") || ""),
      categoryId: String(form.get("categoryId") || ""),
      unit: String(form.get("unit") || "pcs"),
      retailPrice: Number(form.get("retailPrice")),
      wholesalePrice: Number(form.get("wholesalePrice")),
      wholesaleMinQty: Number(form.get("wholesaleMinQty") || 1),
      reorderLevel: Number(form.get("reorderLevel") || 0),
      isActive: form.get("isActive") === "on",
    };
    const barcode = String(form.get("barcode") || "").trim();
    const description = String(form.get("description") || "");
    if (barcode) body.barcode = barcode;
    body.description = description;
    if (form.get("costPrice")) body.costPrice = Number(form.get("costPrice"));
    try {
      setProduct(await api<Product>(`/products/${product.id}`, { method: "PATCH", body: JSON.stringify(body) }));
      setEditOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update");
    } finally {
      setPending(false);
    }
  }

  async function addImages(files: FileList | null) {
    if (!product || !files?.length) return;
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("images", file));
    try {
      setProduct(await api<Product>(`/products/${product.id}/images`, { method: "POST", body }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload");
    }
  }

  async function removeImage(fileId: string) {
    if (!product) return;
    try {
      setProduct(await api<Product>(`/products/${product.id}/images/${fileId}`, { method: "DELETE" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove the photo");
    }
  }

  if (!product) {
    return error ? <Notice>{error}</Notice> : <p>Loading product…</p>;
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}. ${product.category.name}. Prices, stock, and photos.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {product.isLowStock ? <Status value="LOW" /> : null}
            {manager ? <Button type="button" onClick={() => { setError(""); setEditOpen(true); }}>Edit product</Button> : null}
          </div>
        }
      />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p className="text-muted">On hand</p>
            <p className="num text-right text-2xl">{product.quantityOnHand} {product.unit}</p>
            <p className="text-muted">Retail</p>
            <p className="text-right"><Money amount={product.retailPrice} /></p>
            <p className="text-muted">Wholesale</p>
            <p className="text-right"><Money amount={product.wholesalePrice} /></p>
            {product.costPrice !== undefined ? (
              <>
                <p className="text-muted">Cost</p>
                <p className="text-right"><Money amount={product.costPrice} /></p>
              </>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {product.images.map((image) => (
              <figure key={image.id} className="overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-28 w-full object-cover" />
                {manager ? (
                  <button className="w-full py-1 text-xs text-danger" type="button" onClick={() => setImageToRemove(image.id)}>
                    Remove
                  </button>
                ) : null}
              </figure>
            ))}
          </div>
        </Card>
        <Card>
          <p>{product.description || "No description."}</p>
          <p className="mt-3 text-sm text-muted">{product.category.name} · barcode {product.barcode || "none"}</p>
        </Card>
      </div>
      <Modal open={editOpen} title="Edit product" eyebrow={product.sku} wide onClose={() => setEditOpen(false)}>
        <form className="grid gap-3" onSubmit={save} key={product.updatedAt ?? product.id}>
              <Field label="Name"><input className={fieldClass} name="name" defaultValue={product.name} required /></Field>
              <Field label="Category">
                <select className={fieldClass} name="categoryId" defaultValue={product.category.id}>
                  <option value={product.category.id}>{product.category.name}</option>
                  {flattenCategories(categories)
                    .filter((option) => option.id !== product.category.id)
                    .map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Retail"><input className={fieldClass} name="retailPrice" defaultValue={product.retailPrice} /></Field>
                <Field label="Wholesale"><input className={fieldClass} name="wholesalePrice" defaultValue={product.wholesalePrice} /></Field>
                <Field label="Cost"><input className={fieldClass} name="costPrice" defaultValue={product.costPrice ?? ""} /></Field>
                <Field label="Unit"><input className={fieldClass} name="unit" defaultValue={product.unit} /></Field>
                <Field label="Wholesale minimum"><input className={fieldClass} name="wholesaleMinQty" defaultValue={product.wholesaleMinQty} /></Field>
                <Field label="Reorder level"><input className={fieldClass} name="reorderLevel" defaultValue={product.reorderLevel} /></Field>
              </div>
              <Field label="Barcode"><input className={fieldClass} name="barcode" defaultValue={product.barcode ?? ""} /></Field>
              <Field label="Description"><textarea className={areaClass} name="description" defaultValue={product.description ?? ""} /></Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
                Active
              </label>
              <p className="text-xs text-muted">SKU {product.sku} stays as the shop assigned it. Quantity changes through stock intake or an adjustment.</p>
              <Field label="Add photos">
                <input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addImages(event.target.files)} />
              </Field>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(imageToRemove)}
        title="Remove photo"
        message="Remove this photo from the product?"
        pending={pending}
        onConfirm={() => {
          if (!imageToRemove) return;
          removeImage(imageToRemove).finally(() => setImageToRemove(null));
        }}
        onClose={() => setImageToRemove(null)}
      />
    </div>
  );
}
