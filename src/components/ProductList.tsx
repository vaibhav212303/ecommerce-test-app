"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import { ProductCard } from "./ProductCard";

const PRODUCTS_PER_PAGE = 9;

export function ProductList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") ?? "";

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategory
        ? product.category === selectedCategory
        : true;
      const matchesSearch = query
        ? [product.name, product.category, product.description]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    pageStartIndex,
    pageStartIndex + PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-xl">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="product-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products by name, category, or description..."
            className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={safeCurrentPage === page ? "page" : undefined}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition ${
                      safeCurrentPage === page
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safeCurrentPage === totalPages}
                className="rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed bg-white p-10 text-center">
          <p className="text-lg font-semibold text-gray-900">
            No products found
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Try searching with a different product name or category.
          </p>
        </div>
      )}
    </div>
  );
}
