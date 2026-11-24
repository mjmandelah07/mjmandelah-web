"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { useSession } from "@/components/session";
import { Button, Card, Notice, PageHeader, PasswordField } from "@/components/ui";

export default function ProfilePage() {
  const { user } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setOk("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match");
      return;
    }
    setPending(true);
    try {
      await api("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOk("Password updated. Use it the next time you sign in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
            <dt className="text-muted">Name</dt>
            <dd>{user?.fullName}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="break-all">{user?.email}</dd>
            <dt className="text-muted">Role</dt>
            <dd>{user ? roleLabel(user.role) : ""}</dd>
          </dl>
          <p className="mt-4 text-sm text-muted">A manager creates your account and gives you the password. The shop does not email it.</p>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-2xl">Update password</h2>
          <form className="grid gap-3" onSubmit={changePassword}>
            {error ? <Notice>{error}</Notice> : null}
            {ok ? <Notice tone="ok">{ok}</Notice> : null}
            <PasswordField
              label="Current password"
              id="current-password"
              autoComplete="current-password"
              minLength={8}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <PasswordField
              label="New password"
              hint="At least 8 characters"
              id="new-password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <PasswordField
              label="Confirm new password"
              id="confirm-password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Update password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
