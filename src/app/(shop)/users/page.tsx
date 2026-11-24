"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, qs } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { isManager, type Page, type Role, type StaffUser } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Field, Notice, PageHeader, fieldClass } from "@/components/ui";

export default function UsersPage() {
  const { user } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<StaffUser[]>([]);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("CASHIER");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [handed, setHanded] = useState<{ name: string; email: string; password: string } | null>(null);
  const [editing, setEditing] = useState<StaffUser | null>(null);

  useEffect(() => {
    if (user && !isManager(user.role)) router.replace("/");
  }, [router, user]);

  function load() {
    api<Page<StaffUser>>(`/users${qs({ pageSize: 50 })}`)
      .then((page) => setRows(page.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load staff"));
  }

  useEffect(() => {
    if (user && isManager(user.role)) load();
  }, [user]);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("CASHIER");
    setEditing(null);
  }

  function beginEdit(member: StaffUser) {
    setEditing(member);
    setFullName(member.fullName);
    setEmail(member.email);
    setPhone(member.phone ?? "");
    setRole(member.role);
    setError("");
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (editing) {
        await api(`/users/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ fullName, email, phone, role }),
        });
        resetForm();
      } else {
        const password = generatePassword();
        await api("/users", {
          method: "POST",
          body: JSON.stringify({ fullName, email, password, phone: phone || undefined, role }),
        });
        setCopied(false);
        setCopyError("");
        setHanded({ name: fullName, email, password });
        resetForm();
      }
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the account");
    } finally {
      setPending(false);
    }
  }

  async function copyDetails() {
    if (!handed) return;
    try {
      await navigator.clipboard.writeText(`Email: ${handed.email}\nPassword: ${handed.password}`);
      setCopyError("");
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError("Copy was blocked. Select the email and password below.");
    }
  }

  async function toggle(member: StaffUser) {
    try {
      await api(`/users/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the account");
    }
  }

  const roles: Role[] = user?.role === "SUPER_ADMIN" ? ["CASHIER", "ADMIN", "SUPER_ADMIN"] : ["CASHIER", "ADMIN"];

  return (
    <div>
      <PageHeader eyebrow="Access" title="Staff" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <form className="grid gap-3" onSubmit={create}>
            <p className="font-display text-2xl">{editing ? "Edit staff" : "New staff"}</p>
            <Field label="Full name"><input className={fieldClass} value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} /></Field>
            <Field label="Email"><input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
            {editing ? null : (
              <p className="text-xs text-muted">A password is created for them. You copy it from the next screen and send it yourself.</p>
            )}
            <Field label="Phone"><input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
            <Field label="Role">
              <select className={fieldClass} value={role} onChange={(event) => setRole(event.target.value as Role)}>
                {roles.map((item) => (
                  <option key={item} value={item}>{roleLabel(item)}</option>
                ))}
              </select>
            </Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Create account"}</Button>
              {editing ? (
                <Button type="button" tone="paper" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
        <Card>
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty="No staff yet."
            columns={[
              { key: "name", label: "Name", render: (row) => row.fullName },
              { key: "email", label: "Email", render: (row) => row.email },
              {
                key: "edit",
                label: "Edit",
                render: (row) => (
                  <button className="text-sm font-semibold text-moss" type="button" onClick={() => beginEdit(row)}>
                    Edit
                  </button>
                ),
              },
              { key: "role", label: "Role", render: (row) => roleLabel(row.role) },
              {
                key: "active",
                label: "Status",
                render: (row) => (
                  <button className="text-sm font-semibold text-moss" type="button" onClick={() => toggle(row)}>
                    {row.isActive ? "Active" : "Disabled"}
                  </button>
                ),
              },
            ]}
          />
        </Card>
      </div>
      {handed ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-4 sm:place-items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="account-created" className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Sign-in details</p>
            <h2 id="account-created" className="font-display text-3xl">Account created</h2>
            <p className="mt-2 text-sm text-muted">
              Give these to {handed.name}. This password is shown only now. They can change it from Profile after signing in.
            </p>
            <dl className="mt-4 grid gap-3 rounded-xl bg-sand/70 p-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
                <dd className="break-all font-medium">{handed.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Password</dt>
                <dd className="break-all font-medium">{handed.password}</dd>
              </div>
            </dl>
            {copyError ? <p className="mt-3 text-sm text-danger">{copyError}</p> : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={copyDetails}>{copied ? "Copied" : "Copy email and password"}</Button>
              <Button type="button" tone="paper" onClick={() => setHanded(null)}>Done</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
