"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-green-100 p-4">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
        Order Placed!
      </h1>
      <p className="mt-4 text-xl text-gray-500">
        Thank you for your purchase. We&apos;ve received your order and will notify you
        once it ships.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <ShoppingBag className="h-5 w-5" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
