"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { isManager, type Role } from "@/lib/models";
import { roleLabel } from "@/lib/format";
import { useSession } from "./session";
import { useStore } from "./store";

const links: Array<{ href: string; label: string; manager?: boolean; super?: boolean }> = [
  { href: "/", label: "Counter" },
  { href: "/sell", label: "Sell" },
  { href: "/sales", label: "Sales" },
  { href: "/products", label: "Products" },
  { href: "/customers", label: "Customers" },
  { href: "/returns", label: "Returns" },
  { href: "/damages", label: "Damages" },
  { href: "/notifications", label: "Alerts" },
  { href: "/stock", label: "Stock", manager: true },
  { href: "/categories", label: "Categories", manager: true },
  { href: "/suppliers", label: "Suppliers", manager: true },
  { href: "/users", label: "Staff", manager: true },
  { href: "/jobs", label: "Jobs", manager: true },
  { href: "/settings", label: "Store", super: true },
];

function allowed(role: Role, item: (typeof links)[number]) {
  if (item.super) return role === "SUPER_ADMIN";
  if (item.manager) return isManager(role);
  return true;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const store = useStore();
  const [open, setOpen] = useState(false);
  const items = links.filter((item) => (user ? allowed(user.role, item) : false));

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <button className="rounded-lg px-2 py-1 text-sm font-semibold" onClick={() => setOpen(true)} type="button">
          Menu
        </button>
        <p className="font-display text-lg">{store.name}</p>
        <button className="text-sm text-muted" onClick={signOut} type="button">
          Out
        </button>
      </header>

      {open ? (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,280px)] flex-col bg-moss text-paper transition lg:static lg:w-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <p className="text-xs uppercase tracking-[0.18em] text-sand/80">Shop floor</p>
          <p className="font-display text-2xl leading-tight">{store.name}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`mb-1 flex items-center rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-sand text-ink" : "text-sand/90 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="font-medium">{user?.fullName}</p>
          <p className="text-xs text-sand/70">{user ? roleLabel(user.role) : ""}</p>
          <button className="mt-3 text-sm text-sand underline-offset-2 hover:underline" onClick={signOut} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
