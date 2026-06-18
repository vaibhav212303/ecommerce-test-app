"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const router = useRouter();
  const quantity = items.find((item) => item.id === product.id)?.quantity ?? 0;

  const handleBuyNow = () => {
    addItem(product);
    router.push("/checkout");
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
      <div className="aspect-h-1 aspect-w-1 h-64 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
          {product.category}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </p>
            {quantity === 0 ? (
              <button
                onClick={() => addItem(product)}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
              >
                <ShoppingCart className="h-4 w-4" />
                Add
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="rounded-full p-1 transition-colors hover:bg-blue-100 active:bg-blue-200"
                  aria-label={`Decrease ${product.name} quantity`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="rounded-full p-1 transition-colors hover:bg-blue-100 active:bg-blue-200"
                  aria-label={`Increase ${product.name} quantity`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleBuyNow}
            className="w-full rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
