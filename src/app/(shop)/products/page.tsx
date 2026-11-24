"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import { isManager, type Page, type Product } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Money, Notice, PageHeader, Pager, Status, TextLink, fieldClass } from "@/components/ui";

function ProductList() {
  const params = useSearchParams();
  const { user } = useSession();
  const manager = user ? isManager(user.role) : false;
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(params.get("lowStock") === "1");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Page<Product> | null>(null);
  const [error, setError] = useState("");

  function load(nextPage = page, nextSearch = search, nextLow = lowStock) {
    setError("");
    api<Page<Product>>(`/products${qs({ search: nextSearch, lowStock: nextLow || undefined, page: nextPage, pageSize: 20 })}`)
      .then(setRows)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load products"));
  }

  useEffect(() => {
    load(1, "", params.get("lowStock") === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    load(1);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        action={
          manager ? (
            <Link href="/products/new">
              <Button>Add product</Button>
            </Link>
          ) : null
        }
      />
      <Card>
        <form className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={onSearch}>
          <input className={fieldClass} placeholder="Search name or SKU" value={search} onChange={(event) => setSearch(event.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(event) => {
                setLowStock(event.target.checked);
                setPage(1);
                load(1, search, event.target.checked);
              }}
            />
            Low stock
          </label>
          <Button type="submit" tone="paper">Search</Button>
        </form>
        {error ? <Notice>{error}</Notice> : null}
        <DataTable
          rows={rows?.data ?? []}
          rowKey={(row) => row.id}
          empty="No products yet."
          columns={[
            {
              key: "name",
              label: "Product",
              render: (row) => (
                <div>
                  <TextLink href={`/products/${row.id}`}>{row.name}</TextLink>
                  <p className="text-xs text-muted">{row.sku}</p>
                </div>
              ),
            },
            { key: "category", label: "Category", render: (row) => row.category.name },
            { key: "qty", label: "On hand", render: (row) => <span className="num">{row.quantityOnHand}</span> },
            { key: "retail", label: "Retail", render: (row) => <Money amount={row.retailPrice} /> },
            { key: "stock", label: "Stock", render: (row) => (row.isLowStock ? <Status value="LOW" /> : "Ok") },
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

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductList />
    </Suspense>
  );
}
