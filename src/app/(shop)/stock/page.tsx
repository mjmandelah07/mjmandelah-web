"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import { isManager, type Page, type Product, type StockIntake, type StockMovement, type Supplier } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Field, Money, Notice, PageHeader, Status, fieldClass } from "@/components/ui";

export default function StockPage() {
  const { user } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [intakes, setIntakes] = useState<StockIntake[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [adjustProduct, setAdjustProduct] = useState("");
  const [adjustQty, setAdjustQty] = useState("1");
  const [direction, setDirection] = useState<"INCREASE" | "DECREASE">("DECREASE");
  const [reason, setReason] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isManager(user.role)) router.replace("/");
  }, [router, user]);

  function load() {
    Promise.all([
      api<Page<Product>>("/products?pageSize=100"),
      api<Page<Supplier>>("/suppliers?pageSize=100"),
      api<Page<StockIntake>>("/stock/intakes?pageSize=10"),
      api<Page<StockMovement>>("/stock/movements?pageSize=15"),
    ])
      .then(([productPage, supplierPage, intakePage, movementPage]) => {
        setProducts(productPage.data);
        setSuppliers(supplierPage.data);
        setIntakes(intakePage.data);
        setMovements(movementPage.data);
        if (!productId && productPage.data[0]) setProductId(productPage.data[0].id);
        if (!adjustProduct && productPage.data[0]) setAdjustProduct(productPage.data[0].id);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load stock"));
  }

  useEffect(() => {
    if (user && isManager(user.role)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function intake(event: FormEvent) {
    event.preventDefault();
    setError("");
    const items = [{ productId, quantity: Number(quantity), unitCost: Number(unitCost) }];
    try {
      if (receipt) {
        const body = new FormData();
        if (supplierId) body.set("supplierId", supplierId);
        if (reference) body.set("reference", reference);
        body.set("items", JSON.stringify(items));
        body.set("receipt", receipt);
        await api("/stock/intakes", { method: "POST", body });
      } else {
        await api("/stock/intakes", {
          method: "POST",
          body: JSON.stringify({
            supplierId: supplierId || undefined,
            reference: reference || undefined,
            items,
          }),
        });
      }
      setReference("");
      setUnitCost("");
      setReceipt(null);
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Intake failed");
    }
  }

  async function adjust(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/stock/adjustments", {
        method: "POST",
        body: JSON.stringify({
          productId: adjustProduct,
          quantity: Number(adjustQty),
          direction,
          reason,
        }),
      });
      setReason("");
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Adjustment failed");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Warehouse" title="Stock" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-2xl">Receive delivery</h2>
          <form className="grid gap-3" onSubmit={intake}>
            <Field label="Product">
              <select className={fieldClass} value={productId} onChange={(event) => setProductId(event.target.value)}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Quantity"><input className={fieldClass} inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></Field>
              <Field label="Unit cost"><input className={fieldClass} inputMode="decimal" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} required /></Field>
            </div>
            <Field label="Supplier">
              <select className={fieldClass} value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                <option value="">None</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Reference"><input className={fieldClass} value={reference} onChange={(event) => setReference(event.target.value)} /></Field>
            <Field label="Receipt photo">
              <input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} />
            </Field>
            <Button type="submit">Save intake</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-2xl">Adjust count</h2>
          <form className="grid gap-3" onSubmit={adjust}>
            <Field label="Product">
              <select className={fieldClass} value={adjustProduct} onChange={(event) => setAdjustProduct(event.target.value)}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} · {product.quantityOnHand}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Quantity"><input className={fieldClass} inputMode="numeric" value={adjustQty} onChange={(event) => setAdjustQty(event.target.value)} required /></Field>
              <Field label="Direction">
                <select className={fieldClass} value={direction} onChange={(event) => setDirection(event.target.value as "INCREASE" | "DECREASE")}>
                  <option value="INCREASE">Increase</option>
                  <option value="DECREASE">Decrease</option>
                </select>
              </Field>
            </div>
            <Field label="Reason">
              <input className={fieldClass} minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} required />
            </Field>
            <Button type="submit" tone="paper">Save adjustment</Button>
          </form>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="mb-2 font-display text-2xl">Intakes</h2>
        <DataTable
          rows={intakes}
          rowKey={(row) => row.id}
          empty="No deliveries yet."
          columns={[
            { key: "when", label: "When", render: (row) => formatWhen(row.createdAt) },
            { key: "ref", label: "Reference", render: (row) => row.reference || "—" },
            { key: "supplier", label: "Supplier", render: (row) => row.supplier?.name || "—" },
            { key: "items", label: "Lines", render: (row) => row.items.map((item) => `${item.product.name} × ${item.quantity}`).join(", ") },
            { key: "cost", label: "Cost", render: (row) => <Money amount={row.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)} /> },
          ]}
        />
      </Card>
      <Card className="mt-4">
        <h2 className="mb-2 font-display text-2xl">Movements</h2>
        <DataTable
          rows={movements}
          rowKey={(row) => row.id}
          empty="No movements yet."
          columns={[
            { key: "when", label: "When", render: (row) => formatWhen(row.createdAt) },
            { key: "product", label: "Product", render: (row) => row.product.name },
            { key: "type", label: "Type", render: (row) => <Status value={row.type} /> },
            { key: "qty", label: "Qty", render: (row) => <span className="num">{row.quantity}</span> },
            { key: "after", label: "After", render: (row) => row.balanceAfter },
          ]}
        />
      </Card>
    </div>
  );
}
