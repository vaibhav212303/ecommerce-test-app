/**
 * ADVERSARIAL QA TEST — Currency Conversion: Stale Rate Attack
 *
 * What the AI tested:  Math is correct when rate = 1 (frozen, perfect world)
 * What this tests:     What happens when the rate changes while the user is
 *                      sitting on the checkout page — a normal, real-world event.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { CartProvider } from "@/context/CartContext";
import { CustomerProvider } from "@/context/CustomerContext";
import CheckoutPage from "@/app/checkout/page";

// ─── THE FIX: use vi.hoisted so the mock variable is available at hoist time ──
const { mockGetConversionRate } = vi.hoisted(() => ({
  mockGetConversionRate: vi.fn(),
}));

vi.mock("@/lib/currencyRate", () => ({
  getConversionRate: mockGetConversionRate,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.useFakeTimers();

function setCart(totalPrice: number) {
  localStorage.setItem(
    "cart",
    JSON.stringify([
      {
        id: "product-1",
        name: "Leather Boots",
        description: "Premium boots",
        price: totalPrice,
        image: "boots.jpg",
        category: "Footwear",
        quantity: 1,
      },
    ])
  );
}

function renderCheckout(totalPrice: number) {
  setCart(totalPrice);
  return render(
    <CustomerProvider>
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    </CustomerProvider>
  );
}

describe("❌ ADVERSARIAL QA — Currency Conversion: Stale Rate", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("FAILS: displayed EUR price becomes stale when rate changes mid-session", async () => {
    mockGetConversionRate.mockResolvedValueOnce(0.87);

    await act(async () => {
      renderCheckout(426.92);
    });

    // Rate changes in the market
    mockGetConversionRate.mockResolvedValueOnce(0.94);

    // 70 seconds pass — cache is expired
    await act(async () => {
      vi.advanceTimersByTime(70_000);
    });

    // QA expects the display to update to new rate: 426.92 * 0.94 = €401.30
    // FAILS: component never refreshes — user sees stale price
    const updatedDisplay = screen.queryByText(/401/);
    expect(updatedDisplay).not.toBeNull();
  });

  it("FAILS: no staleness warning shown when conversion rate is outdated", async () => {
    mockGetConversionRate.mockResolvedValue(0.87);

    await act(async () => {
      renderCheckout(426.92);
    });

    await act(async () => {
      vi.advanceTimersByTime(70_000);
    });

    // QA expects a visible warning after rate becomes stale
    // FAILS: no such warning exists in the component
    const warning = screen.queryByText(
      /rate may be outdated|exchange rate has changed|refresh/i
    );
    expect(warning).not.toBeNull();
  });

  it("FAILS: rate is not re-validated before payment is submitted", async () => {
    mockGetConversionRate.mockResolvedValueOnce(0.87);

    await act(async () => {
      renderCheckout(426.92);
    });

    await act(async () => {
      vi.advanceTimersByTime(70_000);
    });

    // QA expects a fresh fetch before order placement
    // FAILS: only 1 fetch ever happens (on page load)
    expect(mockGetConversionRate.mock.calls.length).toBeGreaterThan(1);
  });
});
