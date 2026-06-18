"use client";

import React from "react";
import { ShieldCheck, Star, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Customer, CustomerType, useCustomer } from "@/context/CustomerContext";

const userIcons: Record<CustomerType, React.ComponentType<{ className?: string }>> = {
  normal: User,
  gold: Star,
  admin: ShieldCheck,
};

const userDescriptions: Record<CustomerType, string> = {
  normal: "Standard customer account for regular checkout and shopping.",
  gold: "Loyalty account with 10% off eligible $500+ orders, capped at $100.",
  admin: "Admin demo account for store staff and management flows.",
};

export default function LoginPage() {
  const router = useRouter();
  const { customer, customers, signInAs } = useCustomer();

  const handleLogin = (type: CustomerType) => {
    signInAs(type);
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Login</h1>
        <p className="mt-3 text-lg text-gray-500">
          Pick a demo user type to experience TESTRIG-E-SHOP as that customer.
        </p>
      </div>

      {customer && (
        <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-teal-200 bg-teal-50 p-4 text-center text-sm text-teal-900">
          Currently signed in as <span className="font-semibold">{customer.name}</span>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {customers.map((demoCustomer) => (
          <LoginCard
            key={demoCustomer.type}
            customer={demoCustomer}
            isActive={customer?.type === demoCustomer.type}
            onLogin={() => handleLogin(demoCustomer.type)}
          />
        ))}
      </div>
    </div>
  );
}

function LoginCard({
  customer,
  isActive,
  onLogin,
}: {
  customer: Customer;
  isActive: boolean;
  onLogin: () => void;
}) {
  const Icon = userIcons[customer.type];

  return (
    <div className="flex flex-col rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
        {customer.type} customer
      </p>
      <h2 className="mt-2 text-xl font-bold text-gray-900">{customer.name}</h2>
      <p className="mt-1 text-sm text-gray-500">{customer.email}</p>
      <p className="mt-4 flex-1 text-sm text-gray-600">{userDescriptions[customer.type]}</p>
      {customer.type === "gold" && (
        <p className="mt-4 rounded-md bg-yellow-50 p-3 text-xs text-yellow-900">
          {customer.successfulOrdersLast90Days} successful orders in the last 90 days.
        </p>
      )}
      <button
        onClick={onLogin}
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
        disabled={isActive}
      >
        {isActive ? "Signed in" : `Login as ${customer.type}`}
      </button>
    </div>
  );
}
