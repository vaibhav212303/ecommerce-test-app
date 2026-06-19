import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutPage from "./page";
import { CartProvider } from "@/context/CartContext";
import { CustomerProvider } from "@/context/CustomerContext";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/currencyRate", () => ({
  getConversionRate: vi.fn().mockResolvedValue(1),
}));

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

async function renderCheckout({
  totalPrice,
  customerType = "normal",
}: {
  totalPrice: number;
  customerType?: "normal" | "gold" | "admin";
}) {
  setCart(totalPrice);
  localStorage.setItem("customerType", customerType);

  render(
    <CustomerProvider>
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    </CustomerProvider>,
  );

  await screen.findByText("Your Order");
}

describe("Checkout pricing rules", () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("applies SAVE50 coupon for an eligible user", async () => {
    const user = userEvent.setup();
    await renderCheckout({ totalPrice: 200, customerType: "normal" });

    await user.type(screen.getByPlaceholderText("SAVE50"), "SAVE50");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      screen.getByText("SAVE50 applied successfully."),
    ).toBeInTheDocument();
    expect(screen.getByText("Coupon SAVE50")).toBeInTheDocument();
    expect(screen.getByText("-$50.00")).toBeInTheDocument();
    expect(screen.getByText("Estimated tax")).toBeInTheDocument();
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByText("$212.00")).toBeInTheDocument();
  });

  it("does not allow SAVE50 to be applied more than once per user", async () => {
    const user = userEvent.setup();
    localStorage.setItem("coupon:SAVE50:normal.customer@example.com", "used");
    await renderCheckout({ totalPrice: 200, customerType: "normal" });

    await user.type(screen.getByPlaceholderText("SAVE50"), "SAVE50");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      screen.getByText("SAVE50 has already been used for this user."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Coupon SAVE50")).not.toBeInTheDocument();
  });

  it("does not combine SAVE50 coupon with the gold customer discount", async () => {
    const user = userEvent.setup();
    await renderCheckout({ totalPrice: 600, customerType: "gold" });

    expect(screen.getByText("Gold customer discount")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("SAVE50"), "SAVE50");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      screen.getByText("Coupon and customer discount cannot be combined."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Coupon SAVE50")).not.toBeInTheDocument();
  });

  it("charges $50 shipping for orders below $1,000", async () => {
    await renderCheckout({ totalPrice: 999, customerType: "normal" });

    const shippingRow = screen.getAllByText("Shipping").at(-1)?.closest("div");

    expect(shippingRow).toBeDefined();
    expect(
      within(shippingRow as HTMLElement).getByText("$50.00"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("$50 shipping applies below $1,000."),
    ).toBeInTheDocument();
    expect(screen.getByText("$79.92")).toBeInTheDocument();
    expect(screen.getByText("$1128.92")).toBeInTheDocument();
  });

  it("applies free shipping for orders of $1,000 or more", async () => {
    await renderCheckout({ totalPrice: 1000, customerType: "normal" });

    const shippingRow = screen.getAllByText("Shipping").at(-1)?.closest("div");

    expect(shippingRow).toBeDefined();
    expect(
      within(shippingRow as HTMLElement).getByText("Free"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Free shipping applied for orders of $1,000 or more."),
    ).toBeInTheDocument();
    expect(screen.getByText("$80.00")).toBeInTheDocument();
    expect(screen.getByText("$1080.00")).toBeInTheDocument();
  });
});
