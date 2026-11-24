"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { useSession } from "@/components/session";
import { StoreProvider } from "@/components/store";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, router, user]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="font-display text-2xl">Opening the counter…</p>
      </div>
    );
  }

  return (
    <StoreProvider>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
