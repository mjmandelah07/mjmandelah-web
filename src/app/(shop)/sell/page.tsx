"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { absoluteApiPath, api, qs } from "@/lib/api";
import { roundMoney } from "@/lib/format";
import type { Customer, Page, PaymentMethod, Product, SaleChannel, SaleCreated } from "@/lib/models";
import { Button, Card, Field, Money, Notice, PageHeader, fieldClass } from "@/components/ui";

type CartLine = { product: Product; quantity: number };

export default function SellPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [channel, setChannel] = useState<SaleChannel>("RETAIL");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [customerName, setCustomerName] = useState("Walk-in");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<SaleCreated | null>(null);

  useEffect(() => {
    api<Page<Customer>>("/customers?pageSize=100")
      .then((page) => setCustomers(page.data))
      .catch(() => undefined);
  }, []);

  const estimate = useMemo(() => {
    let subtotal = 0;
    for (const line of cart) {
      const price = channel === "WHOLESALE" ? line.product.wholesalePrice : line.product.retailPrice;
      subtotal = roundMoney(subtotal + roundMoney(price * line.quantity));
    }
    const discountValue = Number(discount) || 0;
    const rate = Number(taxRate) || 0;
    const discounted = Math.max(0, roundMoney(subtotal - discountValue));
    const tax = roundMoney((discounted * rate) / 100);
    return { subtotal, tax, total: roundMoney(discounted + tax) };
  }, [cart, channel, discount, taxRate]);

  async function findProducts(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    try {
      const trimmed = search.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }
      const page = await api<Page<Product>>(`/products${qs({ search: trimmed, pageSize: 8 })}`);
      setResults(page.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed");
    }
  }

  async function scanBarcode() {
    const code = search.trim();
    if (!code) return;
    setError("");
    try {
      const product = await api<Product>(`/products${qs({ barcode: code })}`);
      addProduct(product);
      setSearch("");
      setResults([]);
    } catch {
      await findProducts();
    }
  }

  function addProduct(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (!existing) return [...current, { product, quantity: 1 }];
      return current.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
    });
  }

  async function checkout(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCreated(null);
    if (!cart.length) {
      setError("Add at least one product");
      return;
    }
    if (channel === "WHOLESALE") {
      const short = cart.find((line) => line.quantity < line.product.wholesaleMinQty);
      if (short) {
        setError(`${short.product.name} needs at least ${short.product.wholesaleMinQty} for wholesale`);
        return;
      }
    }
    if (paymentMethod === "CREDIT" && !customerId) {
      setError("Choose a customer for credit");
      return;
    }
    setPending(true);
    try {
      const paid = amountPaid === "" ? undefined : Number(amountPaid);
      const sale = await api<SaleCreated>("/sales", {
        method: "POST",
        body: JSON.stringify({
          channel,
          paymentMethod,
          customerId: customerId || undefined,
          customerName: customerName || undefined,
          discount: Number(discount) || 0,
          taxRate: Number(taxRate) || 0,
          amountPaid: paid,
          notes: notes || undefined,
          items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        }),
      });
      setCreated(sale);
      setCart([]);
      setAmountPaid("");
      setNotes("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sale failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Sell" title={channel === "RETAIL" ? "Retail counter" : "Wholesale counter"} />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      {created ? (
        <Card className="mb-4">
          <p className="text-sm text-muted">Receipt {created.receipt.number}</p>
          <p className="font-display text-3xl">
            <Money amount={created.sale.total} />
          </p>
          <p className="text-sm text-muted">
            Paid <Money amount={created.sale.amountPaid} />
            {created.sale.changeDue > 0 ? <> · Change <Money amount={created.sale.changeDue} /></> : null}
            {created.sale.balanceDue > 0 ? <> · Balance <Money amount={created.sale.balanceDue} /></> : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={absoluteApiPath(created.receipt.printUrl)} target="_blank" rel="noreferrer">
              <Button type="button">Print</Button>
            </a>
            <a href={`${absoluteApiPath(created.receipt.printUrl)}&autoprint=1`} target="_blank" rel="noreferrer">
              <Button type="button" tone="paper">Print dialog</Button>
            </a>
            <a href={absoluteApiPath(created.receipt.pdfUrl)}>
              <Button type="button" tone="paper">Download PDF</Button>
            </a>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={findProducts}>
            <input
              className={fieldClass}
              placeholder="Name, SKU, or barcode"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" tone="paper">Search</Button>
              <Button type="button" onClick={scanBarcode}>Lookup</Button>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-line">
            {results.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted">
                    {product.sku} · {product.quantityOnHand} {product.unit} on hand
                  </p>
                </div>
                <div className="text-right">
                  <p>
                    <Money amount={channel === "WHOLESALE" ? product.wholesalePrice : product.retailPrice} />
                  </p>
                  <button className="text-sm font-semibold text-moss" type="button" onClick={() => addProduct(product)}>
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <form className="grid gap-3" onSubmit={checkout}>
            <div className="grid grid-cols-2 gap-2">
              <select className={fieldClass} value={channel} onChange={(event) => setChannel(event.target.value as SaleChannel)}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
              </select>
              <select
                className={fieldClass}
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="TRANSFER">Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
            {paymentMethod === "CREDIT" || channel === "WHOLESALE" ? (
              <Field label="Customer">
                <select className={fieldClass} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Name on receipt">
                <input className={fieldClass} value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              </Field>
            )}
            <ul className="divide-y divide-line">
              {cart.map((line) => (
                <li key={line.product.id} className="grid grid-cols-[1fr_88px_auto] items-center gap-2 py-3">
                  <div>
                    <p className="font-medium">{line.product.name}</p>
                    <p className="text-xs text-muted">
                      <Money amount={channel === "WHOLESALE" ? line.product.wholesalePrice : line.product.retailPrice} />
                      {channel === "WHOLESALE" ? ` · min ${line.product.wholesaleMinQty}` : ""}
                    </p>
                  </div>
                  <input
                    className={fieldClass}
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) =>
                      setCart((current) =>
                        current.map((item) =>
                          item.product.id === line.product.id ? { ...item, quantity: Number(event.target.value) || 1 } : item,
                        ),
                      )
                    }
                  />
                  <button
                    className="text-sm text-danger"
                    type="button"
                    onClick={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Discount">
                <input className={fieldClass} inputMode="decimal" value={discount} onChange={(event) => setDiscount(event.target.value)} />
              </Field>
              <Field label="Tax %">
                <input className={fieldClass} inputMode="decimal" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} />
              </Field>
              <Field label="Amount paid">
                <input className={fieldClass} inputMode="decimal" placeholder={String(estimate.total)} value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} />
              </Field>
            </div>
            <Field label="Notes">
              <input className={fieldClass} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted">Estimate before the server confirms</p>
                <p className="font-display text-3xl">
                  <Money amount={estimate.total} />
                </p>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Take payment"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
