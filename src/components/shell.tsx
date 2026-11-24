"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { isManager, type Role } from "@/lib/models";
import { roleLabel } from "@/lib/format";
import { iconForGroup, iconForHref, LogoutIcon, NavIcon } from "./icons";
import { useSession } from "./session";
import { useStore } from "./store";

type NavLink = { href: string; label: string; manager?: boolean; super?: boolean };

type NavEntry =
  | ({ kind: "link" } & NavLink)
  | { kind: "group"; id: string; label: string; items: NavLink[] };

type MenuEntry =
  | { type: "link"; href: string; label: string }
  | { type: "group"; id: string; label: string; items: NavLink[] };

const navigation: NavEntry[] = [
  { kind: "link", href: "/", label: "Counter" },
  { kind: "link", href: "/sell", label: "Sell" },
  { kind: "link", href: "/sales", label: "Sales" },
  { kind: "link", href: "/products", label: "Products" },
  { kind: "link", href: "/customers", label: "Customers" },
  { kind: "link", href: "/returns", label: "Returns" },
  { kind: "link", href: "/damages", label: "Damages" },
  { kind: "link", href: "/notifications", label: "Alerts" },
  { kind: "link", href: "/stock", label: "Stock", manager: true },
  { kind: "link", href: "/analytics", label: "Analytics", manager: true },
  { kind: "link", href: "/audit", label: "Audit" },
  {
    kind: "group",
    id: "setup",
    label: "Setup",
    items: [
      { href: "/categories", label: "Categories", manager: true },
      { href: "/suppliers", label: "Suppliers", manager: true },
      { href: "/users", label: "Staff", manager: true },
      { href: "/jobs", label: "Jobs", manager: true },
      { href: "/settings", label: "Store", super: true },
    ],
  },
  { kind: "link", href: "/profile", label: "Profile" },
];

function allowed(role: Role, item: NavLink) {
  if (item.super) return role === "SUPER_ADMIN";
  if (item.manager) return isManager(role);
  return true;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 opacity-70 transition ${open ? "rotate-90" : ""}`}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "M";
}

function rowClass(tone: "active" | "quiet" | "idle") {
  const tones = {
    active: "bg-sand text-ink",
    quiet: "bg-white/10 text-paper",
    idle: "text-sand/90 hover:bg-white/10",
  };
  return `flex h-9 shrink-0 items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium transition-colors ${tones[tone]}`;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const entries = useMemo(() => {
    if (!user) return [];
    return navigation.flatMap((entry): MenuEntry[] => {
      if (entry.kind === "link") {
        return allowed(user.role, entry) ? [{ type: "link" as const, href: entry.href, label: entry.label }] : [];
      }
      const items = entry.items.filter((item) => allowed(user.role, item));
      if (items.length === 1) return [{ type: "link" as const, href: items[0].href, label: items[0].label }];
      if (items.length > 1) return [{ type: "group" as const, id: entry.id, label: entry.label, items }];
      return [];
    });
  }, [user]);

  const routeGroup = entries.reduce<string | null>((current, entry) => {
    if (current) return current;
    if (entry.type === "group" && entry.items.some((item) => isActive(pathname, item.href))) return entry.id;
    return null;
  }, null);

  useEffect(() => {
    if (routeGroup) setOpenGroup(routeGroup);
  }, [routeGroup]);

  function signOut() {
    logout();
    router.replace("/login");
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="min-h-screen">
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
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(86vw,16rem)] flex-col overflow-hidden bg-moss text-paper shadow-[8px_0_24px_rgba(22,56,44,0.08)] transition lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sand font-display text-lg text-ink">M</span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl leading-none">{store.name}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sand/65">Shop floor</p>
          </div>
        </div>
        <nav className="sidebar-nav flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-3 pb-3">
          {entries.map((entry) => {
            if (entry.type === "link") {
              const active = isActive(pathname, entry.href);
              const link = (
                <Link key={entry.href} href={entry.href} onClick={closeMenu} className={rowClass(active ? "active" : "idle")}>
                  <NavIcon name={iconForHref(entry.href)} />
                  <span className="truncate">{entry.label}</span>
                </Link>
              );
              if (entry.href === "/profile") {
                return (
                  <div key={entry.href} className="mt-auto shrink-0 border-t border-white/10 pt-2">
                    {link}
                  </div>
                );
              }
              return link;
            }

            const expanded = openGroup === entry.id;
            const groupActive = entry.items.some((item) => isActive(pathname, item.href));
            return (
              <div key={entry.id} className="shrink-0">
                <button
                  type="button"
                  aria-expanded={expanded}
                  className={`w-full ${rowClass(groupActive && !expanded ? "quiet" : "idle")}`}
                  onClick={() => setOpenGroup(expanded ? null : entry.id)}
                >
                  <NavIcon name={iconForGroup(entry.id)} />
                  <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
                  <Chevron open={expanded} />
                </button>
                {expanded ? (
                  <div className="mt-0.5 ml-4 grid gap-0.5 border-l border-white/15 pl-2">
                    {entry.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link key={item.href} href={item.href} onClick={closeMenu} className={rowClass(active ? "active" : "idle")}>
                          <NavIcon name={iconForHref(item.href)} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-2.5 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-semibold text-ink">
              {initials(user?.fullName ?? store.name)}
            </span>
            <div className="min-w-0 flex-1">
              <Link href="/profile" onClick={closeMenu} className="block truncate text-sm font-semibold hover:underline">
                {user?.fullName}
              </Link>
              <p className="truncate text-xs text-sand/70">{user ? roleLabel(user.role) : ""}</p>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sand/80 hover:bg-white/10 hover:text-paper"
              onClick={signOut}
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
