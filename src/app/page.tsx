import { Suspense } from "react";
import { ProductList } from "@/components/ProductList";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Summer Collection
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Discover our latest arrivals and timeless classics.
        </p>
      </div>
      <Suspense fallback={<div className="text-center text-gray-500">Loading products...</div>}>
        <ProductList />
      </Suspense>
    </div>
  );
}
