"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Notice, fieldClass } from "@/components/ui";
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
      <section className="hidden flex-col justify-between bg-moss px-10 py-12 text-paper lg:flex">
        <p className="text-xs uppercase tracking-[0.22em] text-sand/80">Mjmandelah</p>
        <div>
          <h1 className="font-display text-6xl leading-[0.95]">The counter for retail and wholesale.</h1>
          <p className="mt-6 max-w-md text-sand/85">
            Sell, print a receipt, take a return, and see what is left on the shelf. Cashiers and managers share one floor.
          </p>
        </div>
        <p className="text-sm text-sand/70">Stock, credit, and damages stay on the same ledger.</p>
      </section>
      <section className="flex items-center px-5 py-12 sm:px-10">
        <form className="mx-auto grid w-full max-w-md gap-4" onSubmit={onSubmit}>
          <div className="lg:hidden">
            <p className="text-xs uppercase tracking-[0.18em] text-clay">Mjmandelah</p>
            <h1 className="font-display text-4xl">Sign in</h1>
          </div>
          <div className="hidden lg:block">
            <h1 className="font-display text-4xl">Sign in</h1>
            <p className="mt-2 text-sm text-muted">Use the account a manager created for you.</p>
          </div>
          {error ? <Notice>{error}</Notice> : null}
          <Field label="Email">
            <input className={fieldClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Password">
            <input className={fieldClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Checking…" : "Open the counter"}
          </Button>
        </form>
      </section>
    </div>
  );
}
