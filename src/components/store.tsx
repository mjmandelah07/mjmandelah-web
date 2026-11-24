"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { StoreProfile } from "@/lib/models";

type StoreValue = {
  name: string;
  currency: string;
};

const StoreContext = createContext<StoreValue>({ name: "Mjmandelah", currency: "NGN" });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<StoreValue>({ name: "Mjmandelah", currency: "NGN" });

  useEffect(() => {
    api<StoreProfile>("/settings")
      .then((profile) => setStore({ name: profile.name, currency: profile.currency || "NGN" }))
      .catch(() => undefined);
  }, []);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
