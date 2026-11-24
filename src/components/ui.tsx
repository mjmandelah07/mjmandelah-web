"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/format";
import type { PageMeta } from "@/lib/models";
import { useStore } from "./store";

export const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink outline-none transition focus:border-leaf";

export const areaClass =
  "min-h-24 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition focus:border-leaf";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-3.2 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.1 6.8C3.6 8.5 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.8-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PasswordField({
  label,
  hint,
  id,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name ?? "password";
  return (
    <div className="grid gap-1.5 text-sm">
      <label htmlFor={inputId} className="font-medium text-ink/80">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={`${fieldClass} pr-12 ${className}`}
        />
        <button
          type="button"
          className="absolute inset-y-1 right-1 grid w-10 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function Button({
  children,
  tone = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "ghost" | "danger" | "paper" }) {
  const tones = {
    primary: "bg-moss text-paper hover:bg-leaf",
    ghost: "bg-transparent text-ink hover:bg-sand",
    danger: "bg-danger text-white hover:opacity-90",
    paper: "border border-line bg-card text-ink hover:bg-sand",
  };
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-card p-4 shadow-[0_1px_0_rgba(28,23,18,0.04)] sm:p-5 ${className}`}>{children}</section>;
}

export function Notice({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "ok" }) {
  const styles = tone === "ok" ? "border-leaf/30 bg-leaf/10 text-moss" : "border-danger/30 bg-danger/10 text-danger";
  return <p className={`rounded-xl border px-3 py-2 text-sm ${styles}`}>{children}</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted">{children}</p>;
}

export function Money({ amount, className = "" }: { amount: number; className?: string }) {
  const { currency } = useStore();
  return <span className={`num ${className}`}>{formatMoney(amount, currency)}</span>;
}

export function Status({ value }: { value: string }) {
  const tone =
    value === "COMPLETED" || value === "READY" || value === "DONE" || value === "up"
      ? "bg-leaf/15 text-moss"
      : value === "VOID" || value === "FAILED" || value === "RETURNED"
        ? "bg-danger/10 text-danger"
        : "bg-sand text-ink";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{value.replaceAll("_", " ")}</span>;
}

export function Pager({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  if (meta.pageCount <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <Button tone="paper" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </Button>
      <span className="text-muted">
        {meta.page} of {meta.pageCount}
      </span>
      <Button tone="paper" disabled={meta.page >= meta.pageCount} onClick={() => onPage(meta.page + 1)}>
        Next
      </Button>
    </div>
  );
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty,
}: {
  rows: T[];
  columns: Array<{ key: string; label: string; render: (row: T) => React.ReactNode }>;
  rowKey: (row: T) => string;
  empty: string;
}) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              {columns.map((column) => (
                <th key={column.key} className="px-2 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line/80 last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-2 py-3 align-middle">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <article key={rowKey(row)} className="grid gap-2 py-3">
            {columns.map((column) => (
              <div key={column.key} className="flex items-start justify-between gap-4">
                <span className="text-xs uppercase tracking-wide text-muted">{column.label}</span>
                <div className="text-right text-sm">{column.render(row)}</div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-moss underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}
