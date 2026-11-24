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
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("CASHIER");

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

  async function create(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password, phone: phone || undefined, role }),
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("");
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the account");
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
            <Field label="Full name"><input className={fieldClass} value={fullName} onChange={(event) => setFullName(event.target.value)} required /></Field>
            <Field label="Email"><input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
            <Field label="Password" hint="At least 8 characters"><input className={fieldClass} type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></Field>
            <Field label="Phone"><input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
            <Field label="Role">
              <select className={fieldClass} value={role} onChange={(event) => setRole(event.target.value as Role)}>
                {roles.map((item) => (
                  <option key={item} value={item}>{roleLabel(item)}</option>
                ))}
              </select>
            </Field>
            <Button type="submit">Create account</Button>
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
    </div>
  );
}
