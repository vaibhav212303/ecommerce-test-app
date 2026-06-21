"use client";

import React, { createContext, useContext, ReactNode } from "react";

export interface Customer {
  email?: string;
  type: "normal" | "gold" | "admin";
  tier: string;
  successfulOrdersLast90Days: number;
}

interface CustomerContextType {
  customer: Customer | null;
  login: (customer: Customer) => void;
  logout: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  React.useEffect(() => {
    const customerType = localStorage.getItem("customerType") as "normal" | "gold" | "admin" | null;
    if (customerType) {
      const newCustomer: Customer = {
        type: customerType,
        tier: customerType === "gold" ? "gold" : "standard",
        successfulOrdersLast90Days: customerType === "gold" ? 5 : 0,
      };
      setCustomer(newCustomer);
    }
  }, []);

  const login = (newCustomer: Customer) => {
    setCustomer(newCustomer);
    localStorage.setItem("customerType", newCustomer.type);
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem("customerType");
  };

  return (
    <CustomerContext.Provider value={{ customer, login, logout }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within CustomerProvider");
  }
  return context;
}
