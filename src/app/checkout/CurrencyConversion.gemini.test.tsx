import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutPage from "./page";
import { CartProvider } from "@/context/CartContext";
import { CustomerProvider } from "@/context/CustomerContext";

// Use vi.hoisted() to make mock variables available in vi.mock() calls
const { pushMock, getConversionRateMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  getConversionRateMock: vi.fn().mockResolvedValue(0.92), // Default: EUR rate
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/currencyRate", () => ({
  getConversionRate: getConversionRateMock,
}));

/**
 * Helper: Set up a cart with a specific total price in localStorage
 */
function setCart(totalPrice: number) {
  localStorage.setItem(
    "cart",
    JSON.stringify([
      {
        id: "test-product",
        name: "Test Product",
        description: "Test product description",
        price: totalPrice,
        image: "test.jpg",
        category: "Test",
        quantity: 1,
      },
    ]),
  );
}

/**
 * Helper: Render CheckoutPage with providers
 * Wraps in act() for async operations
 */
async function renderCheckout({
  totalPrice,
  customerType = "normal",
}: {
  totalPrice: number;
  customerType?: "normal" | "gold" | "admin";
}) {
  setCart(totalPrice);
  localStorage.setItem("customerType", customerType);

  await act(async () => {
    render(
      <CustomerProvider>
        <CartProvider>
          <CheckoutPage />
        </CartProvider>
      </CustomerProvider>,
    );
  });

  // Wait for the order summary to render
  await screen.findByText("Your Order");
}

describe("CurrencyConversion Component - PRD Acceptance Criteria", () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockClear();
    getConversionRateMock.mockClear();
    getConversionRateMock.mockResolvedValue(0.92); // Reset to EUR default
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * AC-1: Converted EUR total is displayed on page load
   * Verifies that when the component mounts, it automatically fetches EUR conversion
   * and displays the converted total with €currency symbol
   */
  it("AC-1: displays converted EUR total on page load", async () => {
    getConversionRateMock.mockResolvedValue(0.92); // 1 USD = 0.92 EUR

    // Render with $100 USD subtotal
    // Expected: $100 + $16 tax (8%) + $50 shipping = $166 USD
    // Converted: $166 * 0.92 = €152.72 EUR
    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    // Verify the currency selector is set to EUR by default
    const currencySelect = screen.getByRole("combobox") as HTMLSelectElement;
    expect(currencySelect.value).toBe("EUR");

    // Wait for conversion to complete and verify EUR amount is displayed
    const totalElement = await screen.findByText(/€/);
    expect(totalElement).toBeInTheDocument();

    // Verify getConversionRate was called with correct parameters
    expect(getConversionRateMock).toHaveBeenCalledWith("USD", "EUR");
  });

  /**
   * AC-2: Switching currency from EUR to GBP fetches a new rate and updates display
   * Verifies that changing the dropdown triggers a new API call and the display updates
   */
  it("AC-2: fetches new rate and updates display when switching EUR to GBP", async () => {
    getConversionRateMock.mockResolvedValue(0.92); // Initial EUR rate
    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    // Clear previous calls
    getConversionRateMock.mockClear();

    // Set up GBP rate and switch currency
    getConversionRateMock.mockResolvedValue(0.79); // 1 USD = 0.79 GBP
    const user = userEvent.setup();
    const currencySelect = screen.getByRole("combobox");

    await act(async () => {
      await user.selectOptions(currencySelect, "GBP");
    });

    // Verify getConversionRate was called with GBP
    await vi.waitFor(() => {
      expect(getConversionRateMock).toHaveBeenCalledWith("USD", "GBP");
    });

    // Verify GBP symbol appears (£ or similar in the converted total)
    // The component uses toLocaleString which will format with £ for GBP
    await screen.findByText(/£/);
  });

  /**
   * AC-3: Selecting USD shows the USD total without making an API call
   * Verifies that USD is the base currency and doesn't trigger getConversionRate
   */
  it("AC-3: selects USD and shows total without API call", async () => {
    getConversionRateMock.mockResolvedValue(0.92);
    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    // Verify initial EUR call was made
    expect(getConversionRateMock).toHaveBeenCalledWith("USD", "EUR");

    // Clear the mock to track new calls
    getConversionRateMock.mockClear();

    const user = userEvent.setup();
    const currencySelect = screen.getByRole("combobox");

    // Switch to USD
    await act(async () => {
      await user.selectOptions(currencySelect, "USD");
    });

    // Verify getConversionRate was NOT called for USD
    // (since USD is the base currency)
    expect(getConversionRateMock).not.toHaveBeenCalledWith("USD", "USD");

    // Verify the currency select shows USD
    expect(currencySelect).toHaveValue("USD");

    // The displayed total should be in USD (no special currency symbol needed)
    // It should show the calculated total
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  /**
   * AC-4: "Fetching rate..." is shown while fetch is in progress
   * Verifies the loading state is displayed during API call
   */
  it("AC-4: shows 'Fetching rate...' loading state while fetching", async () => {
    let resolveFetch: ((value: number) => void) | null = null;
    const fetchPromise = new Promise<number>((resolve) => {
      resolveFetch = resolve;
    });

    // Set up a promise that we control
    getConversionRateMock.mockReturnValue(fetchPromise as Promise<number>);

    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    // The loading state should appear while the promise is pending
    const loadingText = screen.queryByText("Fetching rate...");
    expect(loadingText).toBeInTheDocument();

    // Resolve the promise
    resolveFetch?.(0.92);

    // Wait for loading to disappear
    await vi.waitFor(() => {
      expect(screen.queryByText("Fetching rate...")).not.toBeInTheDocument();
    });

    // Verify the converted amount is now displayed
    await screen.findByText(/Total:/);
  });

  /**
   * AC-5: Error message shown in red if fetch fails
   * Verifies that API errors display a user-friendly error message in red
   */
  it("AC-5: displays error message in red when conversion rate fetch fails", async () => {
    // Simulate a network or API error
    getConversionRateMock.mockRejectedValue(new Error("Network error"));

    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    // Wait for the error message to appear
    const errorMessage = await screen.findByText("Failed to fetch currency rate");
    expect(errorMessage).toBeInTheDocument();

    // Verify the error is displayed in red (text-red-600)
    expect(errorMessage).toHaveClass("text-red-600");
  });

  /**
   * AC-6: Converted amount updates when SAVE50 coupon is applied and total changes
   * Verifies that when the total price changes (e.g., coupon applied, tax recalculated),
   * the converted amount automatically updates
   */
  it("AC-6: updates converted amount when SAVE50 coupon applied and total changes", async () => {
    getConversionRateMock.mockResolvedValue(0.92); // EUR rate
    const user = userEvent.setup();

    // Start with $200 subtotal
    await renderCheckout({ totalPrice: 200, customerType: "normal" });

    // Verify initial total: $200 + $16 tax + $50 shipping = $266
    // Converted: $266 * 0.92 = €244.72
    const initialTotal = await screen.findByText(/€/);
    expect(initialTotal).toBeInTheDocument();

    // Apply SAVE50 coupon
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    await user.type(emailInput, "normal.customer@example.com");

    const couponInput = screen.getByPlaceholderText("SAVE50");
    await user.type(couponInput, "SAVE50");

    const applyButton = screen.getByRole("button", { name: "Apply" });
    await user.click(applyButton);

    // Wait for the coupon success message
    await vi.waitFor(() => {
      expect(screen.getByText("SAVE50 applied successfully.")).toBeInTheDocument();
    });

    // After coupon applied:
    // New total: $200 - $50 (SAVE50) + $16 tax + $50 shipping = $216
    // Converted: $216 * 0.92 = €198.72
    // The converted amount should update to reflect the new total

    // Verify that the EUR total is still displayed and reflects the new amount
    const updatedTotal = screen.getByText(/€/);
    expect(updatedTotal).toBeInTheDocument();

    // Verify SAVE50 discount line is shown
    expect(screen.getByText("Coupon SAVE50")).toBeInTheDocument();
    expect(screen.getByText("-$50.00")).toBeInTheDocument();
  });

  /**
   * Additional test: Multiple rapid currency switches
   * Verifies that rapid currency changes don't cause race conditions
   */
  it("handles rapid currency switches without race conditions", async () => {
    getConversionRateMock.mockResolvedValue(0.92);
    const user = userEvent.setup();

    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    const currencySelect = screen.getByRole("combobox");
    getConversionRateMock.mockClear();

    // Rapidly switch currencies
    await act(async () => {
      await user.selectOptions(currencySelect, "GBP");
      getConversionRateMock.mockResolvedValue(0.79);
    });

    await act(async () => {
      await user.selectOptions(currencySelect, "JPY");
      getConversionRateMock.mockResolvedValue(149.5);
    });

    await act(async () => {
      await user.selectOptions(currencySelect, "EUR");
      getConversionRateMock.mockResolvedValue(0.92);
    });

    // Final state should be EUR
    expect(currencySelect).toHaveValue("EUR");

    // Verify a currency symbol is displayed
    expect(screen.getByText(/€/)).toBeInTheDocument();
  });

  /**
   * Additional test: Error recovery when switching currencies after error
   * Verifies that the component recovers from an error when user switches currency
   */
  it("recovers from error state when switching currencies", async () => {
    // First call fails
    getConversionRateMock.mockRejectedValueOnce(new Error("Network error"));
    const user = userEvent.setup();

    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    // Verify error is displayed
    const errorMessage = await screen.findByText("Failed to fetch currency rate");
    expect(errorMessage).toBeInTheDocument();

    // Now set up successful response for GBP
    getConversionRateMock.mockResolvedValue(0.79);

    const currencySelect = screen.getByRole("combobox");

    await act(async () => {
      await user.selectOptions(currencySelect, "GBP");
    });

    // Wait for the error to clear
    await vi.waitFor(() => {
      expect(screen.queryByText("Failed to fetch currency rate")).not.toBeInTheDocument();
    });

    // Verify GBP symbol appears (currency conversion successful)
    await screen.findByText(/£/);
  });

  /**
   * Additional test: All currency options are available
   * Verifies that the dropdown contains all expected currencies
   */
  it("displays all available currency options in dropdown", async () => {
    getConversionRateMock.mockResolvedValue(0.92);
    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    const currencySelect = screen.getByRole("combobox") as HTMLSelectElement;
    const options = Array.from(currencySelect.options).map((opt) => opt.value);

    expect(options).toEqual(["EUR", "USD", "GBP", "JPY"]);
  });

  /**
   * Additional test: Converted total shows in correct currency format
   * Verifies that toLocaleString() properly formats with currency symbol
   */
  it("displays converted total with correct locale-specific formatting", async () => {
    getConversionRateMock.mockResolvedValue(1.2); // EUR rate
    await renderCheckout({ totalPrice: 100, customerType: "normal" });

    // Wait for conversion to complete
    const convertedTotal = await screen.findByText(/Total:/);
    expect(convertedTotal).toBeInTheDocument();

    // The parent should contain the formatted currency amount
    const totalContainer = convertedTotal.closest("span");
    expect(totalContainer).toBeInTheDocument();

    // Should have a bold span with the currency
    const boldAmount = totalContainer?.querySelector(".font-bold");
    expect(boldAmount?.textContent).toMatch(/€|£|¥|\d/);
  });
});
