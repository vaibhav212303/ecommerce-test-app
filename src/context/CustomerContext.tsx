"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CustomerDiscountProfile } from "@/lib/discounts";

export type CustomerType = "normal" | "gold" | "admin";

export interface Customer extends CustomerDiscountProfile {
  type: CustomerType;
  name: string;
  email: string;
}

interface CustomerContextType {
  customer: Customer | null;
  customers: Customer[];
  signInAs: (type: CustomerType) => void;
  signOut: () => void;
}

export const demoCustomers: Customer[] = [
  {
    type: "normal",
    name: "Normal Customer",
    email: "normal.customer@example.com",
    tier: "normal",
    successfulOrdersLast90Days: 1,
  },
  {
    type: "gold",
    name: "Gold Customer",
    email: "gold.customer@example.com",
    tier: "gold",
    successfulOrdersLast90Days: 3,
  },
  {
    type: "admin",
    name: "Admin Customer",
    email: "admin.customer@example.com",
    tier: "admin",
    successfulOrdersLast90Days: 0,
  },
];

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const savedCustomerType = localStorage.getItem("customerType") as CustomerType | null;
    const savedCustomer = demoCustomers.find((demo) => demo.type === savedCustomerType);
    if (savedCustomer) setCustomer(savedCustomer);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      customers: demoCustomers,
      signInAs: (type: CustomerType) => {
        const nextCustomer = demoCustomers.find((demo) => demo.type === type) ?? null;
        setCustomer(nextCustomer);
        if (nextCustomer) localStorage.setItem("customerType", nextCustomer.type);
      },
      signOut: () => {
        setCustomer(null);
        localStorage.removeItem("customerType");
      },
    }),
    [customer],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
}
