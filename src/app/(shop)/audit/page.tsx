"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, qs } from "@/lib/api";
import { formatWhen, todayInput } from "@/lib/format";
import { isManager, type Page, type PaymentMethod, type Product, type Sale, type SaleChannel, type SaleStatus, type StaffUser } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Money, Notice, PageHeader, Pager, Status, TextLink, fieldClass } from "@/components/ui";

function AuditList() {
  const params = useSearchParams();
  const { user } = useSession();
  const manager = user ? isManager(user.role) : false;
  const [rows, setRows] = useState<Page<Sale> | null>(null);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [matches, setMatches] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [channel, setChannel] = useState(params.get("channel") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [payment, setPayment] = useState(params.get("paymentMethod") ?? "");
  const [cashierId, setCashierId] = useState(params.get("cashierId") ?? "");
  const [from, setFrom] = useState(params.get("from") ?? todayInput());
  const [to, setTo] = useState(params.get("to") ?? todayInput());
  const [productQuery, setProductQuery] = useState("");
  const [productId, setProductId] = useState(params.get("productId") ?? "");
  const [productName, setProductName] = useState("");

  function filters(overrides: Partial<ReturnType<typeof currentFilters>> = {}) {
    return { ...currentFilters(), ...overrides };
  }

  function currentFilters() {
    return {
      search,
      channel: channel as SaleChannel,
      status: status as SaleStatus,
      paymentMethod: payment as PaymentMethod,
      cashierId,
      productId,
      from,
      to,
    };
  }

  function load(nextPage = page, overrides: Partial<ReturnType<typeof currentFilters>> = {}) {
    setError("");
    api<Page<Sale>>(`/sales${qs({ ...filters(overrides), page: nextPage, pageSize: 20 })}`)
      .then(setRows)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load the audit"));
  }

  useEffect(() => {
    load(1);
    if (productId) {
      api<Product>(`/products/${productId}`)
        .then((product) => setProductName(product.name))
        .catch(() => setProductName(""));
    }
    // Query string is the first filter set. Later edits go through the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!manager) return;
    api<Page<StaffUser>>("/users?page=1&pageSize=100")
      .then((result) => setStaff(result.data))
      .catch(() => setStaff([]));
  }, [manager]);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    load(1);
  }

  function findProducts(event: FormEvent) {
    event.preventDefault();
    const term = productQuery.trim();
    if (!term) {
      setMatches([]);
      return;
    }
    api<Page<Product>>(`/products${qs({ search: term, page: 1, pageSize: 8 })}`)
      .then((result) => setMatches(result.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not find products"));
  }

  function clearDates() {
    setFrom("");
    setTo("");
    setPage(1);
    load(1, { from: "", to: "" });
  }

  return (
    <div>
      <PageHeader
        title="Audit"
        description="Every sale in the dates you choose, including voids, returns, and who rang it up."
        action={manager ? <TextLink href="/analytics">Charts</TextLink> : undefined}
      />
      <Card>
        <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={onFilter}>
          <input className={fieldClass} placeholder="Receipt number" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className={fieldClass} value={channel} aria-label="Channel" onChange={(event) => setChannel(event.target.value)}>
            <option value="">Retail and wholesale</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
          </select>
          <select className={fieldClass} value={status} aria-label="Status" onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIAL_RETURN">Partial return</option>
            <option value="RETURNED">Returned</option>
            <option value="VOID">Void</option>
          </select>
          <select className={fieldClass} value={payment} aria-label="Payment" onChange={(event) => setPayment(event.target.value)}>
            <option value="">All payments</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="TRANSFER">Transfer</option>
            <option value="CREDIT">Credit</option>
          </select>
          {manager ? (
            <select className={fieldClass} value={cashierId} aria-label="Cashier" onChange={(event) => setCashierId(event.target.value)}>
              <option value="">All cashiers</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName}
                </option>
              ))}
            </select>
          ) : null}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:col-span-2 xl:col-span-1">
            <input className={fieldClass} type="date" value={from} aria-label="From" onChange={(event) => setFrom(event.target.value)} />
            <input className={fieldClass} type="date" value={to} aria-label="To" onChange={(event) => setTo(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3">
            <Button type="submit">Apply filters</Button>
            <Button type="button" tone="paper" onClick={clearDates}>
              Any date
            </Button>
          </div>
        </form>

        <form className="mb-4" onSubmit={findProducts}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={`${fieldClass} min-w-0 flex-1`}
              placeholder="Find a product by name or SKU"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
            />
            <Button type="submit" tone="paper" className="shrink-0">
              Find product
            </Button>
          </div>
          {productId ? (
            <p className="text-sm">
              Showing sales that include <span className="font-semibold">{productName || "this product"}</span>.{" "}
              <button
                type="button"
                className="font-semibold text-moss underline-offset-2 hover:underline"
                onClick={() => {
                  setProductId("");
                  setProductName("");
                  setMatches([]);
                  setPage(1);
                  load(1, { productId: "" });
                }}
              >
                Clear product
              </button>
            </p>
          ) : null}
          {matches.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {matches.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className="rounded-full border border-line bg-sand px-3 py-1 text-sm"
                    onClick={() => {
                      setProductId(product.id);
                      setProductName(product.name);
                      setMatches([]);
                      setProductQuery("");
                      setPage(1);
                      load(1, { productId: product.id });
                    }}
                  >
                    {product.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>

        {error ? <Notice>{error}</Notice> : null}
        {rows ? <p className="mb-3 text-sm text-muted">{rows.meta.total} sales</p> : null}
        <DataTable
          rows={rows?.data ?? []}
          rowKey={(row) => row.id}
          empty="No sales match this filter."
          columns={[
            { key: "receipt", label: "Receipt", render: (row) => <TextLink href={`/sales/${row.id}`}>{row.receiptNumber}</TextLink> },
            { key: "when", label: "When", render: (row) => formatWhen(row.createdAt) },
            { key: "channel", label: "Channel", render: (row) => <Status value={row.channel} /> },
            { key: "status", label: "Status", render: (row) => <Status value={row.status} /> },
            { key: "payment", label: "Payment", render: (row) => row.paymentMethod },
            {
              key: "products",
              label: "Products",
              render: (row) => {
                const names = row.items.slice(0, 2).map((item) => item.productName);
                const extra = row.items.length - names.length;
                return extra > 0 ? `${names.join(", ")} +${extra}` : names.join(", ");
              },
            },
            { key: "customer", label: "Customer", render: (row) => row.customerName || row.customer?.name || "Walk-in" },
            { key: "total", label: "Total", render: (row) => <Money amount={row.total} /> },
            { key: "cashier", label: "Cashier", render: (row) => row.cashier.fullName },
          ]}
        />
        {rows ? (
          <Pager
            meta={rows.meta}
            onPage={(next) => {
              setPage(next);
              load(next);
            }}
          />
        ) : null}
      </Card>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense>
      <AuditList />
    </Suspense>
  );
}
