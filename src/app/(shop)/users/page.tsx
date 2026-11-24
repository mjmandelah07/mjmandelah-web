"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, qs } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { isManager, type Page, type Role, type StaffUser } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, DataTable, Field, Modal, Notice, PageHeader, fieldClass } from "@/components/ui";

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
  const [formOpen, setFormOpen] = useState(false);

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
    setFormOpen(false);
  }

  function beginCreate() {
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("CASHIER");
    setEditing(null);
    setError("");
    setFormOpen(true);
  }

  function beginEdit(member: StaffUser) {
    setEditing(member);
    setFullName(member.fullName);
    setEmail(member.email);
    setPhone(member.phone ?? "");
    setRole(member.role);
    setError("");
    setFormOpen(true);
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
      <PageHeader title="Staff" description="Accounts for cashiers and managers. A new password is shown once, then you pass it on." action={<Button type="button" onClick={beginCreate}>Add staff</Button>} />
      {error && !formOpen ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
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
      <Modal open={formOpen} title={editing ? "Edit staff" : "New staff"} eyebrow="Access" onClose={resetForm}>
        <form className="grid gap-3" onSubmit={create}>
          {error ? <Notice>{error}</Notice> : null}
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
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Create account"}</Button>
        </form>
      </Modal>
      <Modal open={Boolean(handed)} title="Account created" eyebrow="Sign-in details" onClose={() => setHanded(null)}>
        {handed ? (
          <>
            <p className="text-sm text-muted">
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
          </>
        ) : null}
      </Modal>
    </div>
  );
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
