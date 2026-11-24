import type { ReactNode } from "react";

type IconName =
  | "counter"
  | "sell"
  | "sales"
  | "returns"
  | "catalog"
  | "products"
  | "categories"
  | "stock"
  | "suppliers"
  | "damages"
  | "people"
  | "customers"
  | "staff"
  | "reports"
  | "audit"
  | "analytics"
  | "alerts"
  | "jobs"
  | "profile"
  | "store"
  | "logout";

const paths: Record<IconName, ReactNode> = {
  counter: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  sell: (
    <>
      <path d="M6.5 8h11l-.8 11.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3L6.5 8Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </>
  ),
  sales: (
    <>
      <path d="M8 3.5h8a1 1 0 0 1 1 1V20l-2.2-1.4L12 20.8 9.2 18.6 7 20V4.5a1 1 0 0 1 1-1Z" />
      <path d="M10 8h4M10 12h4" />
    </>
  ),
  returns: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9.5a6.5 6.5 0 1 1 0 13H12" />
    </>
  ),
  catalog: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" />
    </>
  ),
  products: (
    <>
      <path d="M20 13.2 12.2 21a1.6 1.6 0 0 1-2.3 0L3.8 14.9V4.8h10.1L20 13.2Z" />
      <path d="M8.2 8.2h.01" />
    </>
  ),
  categories: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),
  stock: (
    <>
      <path d="M4 7h16v4H4z" />
      <path d="M6 11v8h12v-8" />
      <path d="M10 15h4" />
    </>
  ),
  suppliers: (
    <>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h4.2L21 13.2V15h-7" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17.2" cy="17.5" r="1.6" />
    </>
  ),
  damages: (
    <>
      <path d="M12 4 21.2 20H2.8L12 4Z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.2h.01" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="2.6" />
      <path d="M3.8 18.5c.6-2.6 2.6-4 5.2-4s4.6 1.4 5.2 4" />
      <circle cx="16.5" cy="9" r="2.1" />
      <path d="M16.2 14.6c1.8.3 3.1 1.5 3.8 3.9" />
    </>
  ),
  customers: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19c1-2.8 3-4.2 6.5-4.2s5.5 1.4 6.5 4.2" />
    </>
  ),
  staff: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="12" cy="10" r="2" />
      <path d="M8.5 16.2c.6-1.5 1.8-2.2 3.5-2.2s2.9.7 3.5 2.2" />
    </>
  ),
  reports: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>
  ),
  audit: (
    <>
      <path d="M9 3.5h6V7H9z" />
      <path d="M8 5H6.5v15h11V5H16" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 19h16" />
      <path d="m5 15 4.2-5 3.6 3 6-7" />
    </>
  ),
  alerts: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.4 2H4.6L6 16Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  jobs: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="10" r="2.4" />
      <path d="M7.6 17.2c.8-1.8 2.3-2.7 4.4-2.7s3.6.9 4.4 2.7" />
    </>
  ),
  store: (
    <>
      <path d="M4 10 6.2 4.5h11.6L20 10" />
      <path d="M4 10h16v9H4z" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  logout: (
    <>
      <path d="M10 7V5h9v14h-9v-2" />
      <path d="M13 12H4" />
      <path d="m7 9-3 3 3 3" />
    </>
  ),
};

export function iconForHref(href: string): IconName {
  const icons: Record<string, IconName> = {
    "/": "counter",
    "/sell": "sell",
    "/sales": "sales",
    "/returns": "returns",
    "/products": "products",
    "/categories": "categories",
    "/stock": "stock",
    "/suppliers": "suppliers",
    "/damages": "damages",
    "/customers": "customers",
    "/users": "staff",
    "/audit": "audit",
    "/analytics": "analytics",
    "/notifications": "alerts",
    "/jobs": "jobs",
    "/profile": "profile",
    "/settings": "store",
  };
  return icons[href] ?? "counter";
}

export function iconForGroup(id: string): IconName {
  const icons: Record<string, IconName> = {
    sales: "sales",
    catalog: "catalog",
    people: "people",
    reports: "reports",
    setup: "store",
    shop: "store",
  };
  return icons[id] ?? "counter";
}

export function NavIcon({ name, className = "h-[18px] w-[18px]" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function LogoutIcon() {
  return <NavIcon name="logout" className="h-4 w-4" />;
}
