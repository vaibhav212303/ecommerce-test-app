"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { categories } from "@/data/products";
import { CartSidebar } from "./CartSidebar";
import { ProfileMenu } from "./ProfileMenu";

export function Navbar() {
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-teal-500">TESTR</span>
              <span className="italic text-black mr-0.5">i</span>
              <span className="text-teal-500">G</span>-E-SHOP
            </Link>
            <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto whitespace-nowrap" aria-label="Product categories">
              <Link
                href="/"
                className="rounded-full px-2.5 py-1 text-sm font-medium text-gray-600 transition hover:bg-teal-50 hover:text-teal-700"
              >
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/?category=${encodeURIComponent(category)}`}
                  className="rounded-full px-2.5 py-1 text-sm font-medium text-gray-600 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProfileMenu />
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Open shopping cart"
              className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
