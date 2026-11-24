"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { StoreProfile } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, Field, Notice, PageHeader, areaClass, fieldClass } from "@/components/ui";

export default function SettingsPage() {
  const { user } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") router.replace("/");
  }, [router, user]);

  useEffect(() => {
    api<StoreProfile>("/settings")
      .then(setProfile)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load settings"));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setOk("");
    try {
      const next = await api<StoreProfile>("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          address: String(form.get("address") || ""),
          phone: String(form.get("phone") || ""),
          email: String(form.get("email") || ""),
          currency: String(form.get("currency") || "NGN").toUpperCase(),
          receiptFooter: String(form.get("receiptFooter") || ""),
        }),
      });
      setProfile(next);
      setOk("Store profile saved. New receipts use these details.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save");
    }
  }

  if (!profile) return error ? <Notice>{error}</Notice> : <p>Loading store…</p>;

  return (
    <div>
      <PageHeader eyebrow="Receipts" title="Store profile" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      {ok ? <div className="mb-4"><Notice tone="ok">{ok}</Notice></div> : null}
      <Card>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save} key={profile.updatedAt}>
          <Field label="Name"><input className={fieldClass} name="name" defaultValue={profile.name} required /></Field>
          <Field label="Currency" hint="3 letters, for example NGN"><input className={fieldClass} name="currency" maxLength={3} minLength={3} defaultValue={profile.currency} required /></Field>
          <Field label="Phone"><input className={fieldClass} name="phone" defaultValue={profile.phone ?? ""} /></Field>
          <Field label="Email"><input className={fieldClass} name="email" defaultValue={profile.email ?? ""} /></Field>
          <div className="sm:col-span-2">
            <Field label="Address"><input className={fieldClass} name="address" defaultValue={profile.address ?? ""} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Receipt footer"><textarea className={areaClass} name="receiptFooter" defaultValue={profile.receiptFooter ?? ""} /></Field>
          </div>
          <Button type="submit">Save profile</Button>
        </form>
      </Card>
    </div>
  );
}
