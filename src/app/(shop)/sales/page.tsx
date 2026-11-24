"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import type { Page, Sale, SaleChannel, SaleStatus } from "@/lib/models";
import { Card, DataTable, Money, Notice, PageHeader, Pager, Status, TextLink, fieldClass } from "@/components/ui";

export default function SalesPage() {
  const [rows, setRows] = useState<Page<Sale> | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function load(nextPage = page) {
    setError("");
    api<Page<Sale>>(
      `/sales${qs({
        page: nextPage,
        pageSize: 20,
        search,
        channel: channel as SaleChannel,
        status: status as SaleStatus,
        from,
        to,
      })}`,
    )
      .then(setRows)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load sales"));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    load(1);
  }

  return (
    <div>
      <PageHeader title="Sales" description="Completed sales for the dates you choose, and the receipt for each one." />
      <Card>
        <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={onFilter}>
          <input className={fieldClass} placeholder="Receipt number" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className={fieldClass} value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="">All channels</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
          </select>
          <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIAL_RETURN">Partial return</option>
            <option value="RETURNED">Returned</option>
            <option value="VOID">Void</option>
          </select>
          <input className={fieldClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From" />
          <input className={fieldClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To" />
          <button className="h-11 rounded-xl bg-sand px-4 text-sm font-semibold" type="submit">Filter</button>
        </form>
        {error ? <Notice>{error}</Notice> : null}
        <DataTable
          rows={rows?.data ?? []}
          rowKey={(row) => row.id}
          empty="No sales match this filter."
          columns={[
            { key: "receipt", label: "Receipt", render: (row) => <TextLink href={`/sales/${row.id}`}>{row.receiptNumber}</TextLink> },
            { key: "when", label: "When", render: (row) => formatWhen(row.createdAt) },
            { key: "channel", label: "Channel", render: (row) => <Status value={row.channel} /> },
            { key: "status", label: "Status", render: (row) => <Status value={row.status} /> },
            { key: "total", label: "Total", render: (row) => <Money amount={row.total} /> },
            { key: "cashier", label: "Cashier", render: (row) => row.cashier.fullName },
          ]}
        />
        {rows ? <Pager meta={rows.meta} onPage={(next) => { setPage(next); load(next); }} /> : null}
      </Card>
    </div>
  );
}
