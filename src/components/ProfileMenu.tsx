"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { useCustomer } from "@/context/CustomerContext";

export function ProfileMenu() {
  const { customer, signOut } = useCustomer();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Open profile menu"
        className="rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <UserCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 rounded-lg border bg-white p-4 shadow-lg">
          {customer ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="font-semibold text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.email}</p>
              </div>

              <div className="rounded-md bg-teal-50 p-3 text-sm text-teal-900">
                <p className="font-semibold capitalize">{customer.type} Customer</p>
                {customer.type === "gold" ? (
                  <p className="mt-1 text-xs">
                    Eligible Gold customers get 10% off on orders of $500+, capped at $100.
                  </p>
                ) : customer.type === "admin" ? (
                  <p className="mt-1 text-xs">Admin demo account with store-management access.</p>
                ) : (
                  <p className="mt-1 text-xs">Standard shopping account.</p>
                )}
              </div>

              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block rounded-md border px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Switch user
              </Link>

              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900">Guest user</p>
                <p className="text-sm text-gray-600">
                  Sign in to choose a normal, gold, or admin customer account.
                </p>
              </div>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                Go to login
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
