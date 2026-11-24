"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Field, Notice, PasswordField, fieldClass } from "@/components/ui";
import { useSession } from "@/components/session";

export default function LoginPage() {
  const { user, ready, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <Image
          src="/sign-in.jpg"
          alt="A staff member checking warehouse stock on a tablet"
          fill
          priority
          sizes="50vw"
          className="object-cover object-[72%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-moss via-moss/55 to-ink/30" />
        <div className="relative flex min-h-screen flex-col justify-between px-10 py-12 text-paper">
          <p className="text-xs uppercase tracking-[0.22em] text-sand/80">Mjmandelah</p>
          <div>
            <h1 className="font-display text-6xl leading-[0.95]">The counter for retail and wholesale.</h1>
            <p className="mt-6 max-w-md text-sand/85">
              Sell, print a receipt, take a return, and see what is left on the shelf. Cashiers and managers share one floor.
            </p>
          </div>
          <p className="text-sm text-sand/70">Stock, credit, and damages stay on the same ledger.</p>
        </div>
      </section>
      <section className="flex min-h-screen flex-col">
        <div className="relative h-56 shrink-0 overflow-hidden lg:hidden">
          <Image
            src="/sign-in.jpg"
            alt="A staff member checking warehouse stock on a tablet"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[72%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/10 to-ink/25" />
          <p className="absolute top-5 left-5 text-xs uppercase tracking-[0.18em] text-paper">Mjmandelah</p>
        </div>
        <form className="mx-auto grid w-full max-w-md flex-1 content-center gap-4 px-5 py-10 sm:px-10" onSubmit={onSubmit}>
          <div>
            <h1 className="font-display text-4xl">Sign in</h1>
            <p className="mt-2 text-sm text-muted">Use the account a manager created for you.</p>
          </div>
          {error ? <Notice>{error}</Notice> : null}
          <Field label="Email">
            <input className={fieldClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <PasswordField label="Password" id="login-password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" disabled={pending}>
            {pending ? "Checking…" : "Open the counter"}
          </Button>
        </form>
      </section>
    </div>
  );
}
