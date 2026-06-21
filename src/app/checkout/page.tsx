"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CreditCard,
  Truck,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversionRate } from "@/lib/currencyRate";
import { calculateGoldCustomerDiscount } from "@/lib/discounts";
import {
  SAVE50_COUPON_CODE,
  calculateCheckoutPricing,
  getCouponUsageKey,
} from "@/lib/checkoutPricing";
import { useCustomer } from "@/context/CustomerContext";

type Step = "shipping" | "payment" | "summary";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { customer } = useCustomer();
  const router = useRouter();
  const [step, setStep] = useState<Step>("shipping");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const goldCustomerDiscount = customer
    ? calculateGoldCustomerDiscount(totalPrice, customer)
    : 0;
  const pricing = calculateCheckoutPricing({
    subtotal: totalPrice,
    discountAmount: goldCustomerDiscount,
    couponApplied,
  });
  const couponDiscount = pricing.couponDiscount;
  const shippingFee = pricing.shippingFee;
  const payableTotal = pricing.total;

  if (items.length === 0 && step !== "summary") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Return to shop
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email" && couponApplied && !customer) {
      setCouponApplied(false);
      setCouponMessage("Coupon removed because checkout email changed.");
    }
  };

  const handleApplyCoupon = () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    const userIdentifier =
      customer?.email ?? formData.email.trim().toLowerCase();

    if (normalizedCode !== SAVE50_COUPON_CODE) {
      setCouponApplied(false);
      setCouponMessage("Invalid coupon code.");
      return;
    }

    if (goldCustomerDiscount > 0) {
      setCouponApplied(false);
      setCouponMessage("Coupon and customer discount cannot be combined.");
      return;
    }

    if (!userIdentifier) {
      setCouponMessage("Enter your email before applying this coupon.");
      return;
    }

    if (localStorage.getItem(getCouponUsageKey(userIdentifier)) === "used") {
      setCouponApplied(false);
      setCouponMessage("SAVE50 has already been used for this user.");
      return;
    }

    setCouponApplied(true);
    setCouponMessage("SAVE50 applied successfully.");
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponMessage(null);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "shipping") setStep("payment");
    else if (step === "payment") setStep("summary");
  };

  const handleBack = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "summary") setStep("payment");
  };

  const handlePlaceOrder = () => {
    const userIdentifier =
      customer?.email ?? formData.email.trim().toLowerCase();

    // Simulate API call
    setTimeout(() => {
      if (couponApplied && userIdentifier) {
        localStorage.setItem(getCouponUsageKey(userIdentifier), "used");
      }
      clearCart();
      router.push("/checkout/success");
    }, 1000);
  };

  const steps = [
    { id: "shipping", title: "Shipping", icon: Truck },
    { id: "payment", title: "Payment", icon: CreditCard },
    { id: "summary", title: "Summary", icon: Receipt },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <div className="mt-8 flex items-center justify-center">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    step === s.id
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : steps.findIndex((x) => x.id === step) > idx
                        ? "border-green-600 bg-green-50 text-green-600"
                        : "border-gray-300 text-gray-400",
                  )}
                >
                  {steps.findIndex((x) => x.id === step) > idx ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    step === s.id ? "text-blue-600" : "text-gray-500",
                  )}
                >
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "mb-6 h-0.5 w-16 sm:w-24",
                    steps.findIndex((x) => x.id === step) > idx
                      ? "bg-green-600"
                      : "bg-gray-300",
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {step === "shipping" && (
            <form
              onSubmit={handleNext}
              className="space-y-6 rounded-lg bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">Shipping Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    required
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    required
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    required
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    required
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    required
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
              >
                Continue to Payment <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {step === "payment" && (
            <form
              onSubmit={handleNext}
              className="space-y-6 rounded-lg bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Card Number
                  </label>
                  <input
                    required
                    type="text"
                    name="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      required
                      type="text"
                      name="expiry"
                      placeholder="MM/YY"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CVV
                    </label>
                    <input
                      required
                      type="text"
                      name="cvv"
                      placeholder="000"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 rounded-md border px-6 py-3 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                >
                  Review Order <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {step === "summary" && (
            <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium">Shipping Address</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {formData.firstName} {formData.lastName}
                    <br />
                    {formData.address}
                    <br />
                    {formData.city}, {formData.zipCode}
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">Payment Method</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Ending in {formData.cardNumber.slice(-4) || "****"}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 rounded-md border px-6 py-3 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700"
                >
                  Place Order <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-lg bg-white p-6 shadow-sm h-fit">
          <h2 className="mb-4 font-semibold text-gray-900">Your Order</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <label className="block text-xs font-medium text-gray-600">
                  Coupon code
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="SAVE50"
                    disabled={couponApplied}
                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {couponApplied ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p
                    className={cn(
                      "mt-2 text-xs",
                      couponApplied ? "text-green-700" : "text-red-600",
                    )}
                  >
                    {couponMessage}
                  </p>
                )}
              </div>
              {goldCustomerDiscount > 0 ? (
                <div className="flex justify-between text-green-700">
                  <span>Gold customer discount</span>
                  <span>-${goldCustomerDiscount.toFixed(2)}</span>
                </div>
              ) : customer?.type === "gold" ? (
                <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-700">
                  Gold customers get 10% off on orders of $500+ after 3
                  successful orders in the last 90 days.
                </p>
              ) : customer?.type === "admin" ? (
                <p className="rounded-md bg-blue-50 p-2 text-xs text-blue-700">
                  Admin accounts can place demo orders but do not receive
                  customer discounts.
                </p>
              ) : null}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon SAVE50</span>
                  <span>-${couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="rounded-md bg-slate-50 p-3 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Estimated tax </span>
                  <span>${pricing.taxAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Tax is calculated after discounts and before shipping.
                </p>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>
                  {shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              {shippingFee === 0 ? (
                <p className="rounded-md bg-green-50 p-2 text-xs text-green-700">
                  Free shipping applied for orders of $1,000 or more.
                </p>
              ) : (
                <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                  $50 shipping applies below $1,000.
                </p>
              )}
              <div className="flex justify-between border-t pt-3 text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${payableTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Dynamic Currency Conversion */}
            <CurrencyConversion totalPrice={payableTotal} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Currency Conversion Component ---
function CurrencyConversion({ totalPrice }: { totalPrice: number }) {
  const [target, setTarget] = useState("EUR"); // Default target currency
  const [converted, setConverted] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchRate() {
      setLoading(true);
      setError(null);
      try {
        const rate = await getConversionRate("USD", target);
        if (!ignore) setConverted(rate * totalPrice);
      } catch (e: any) {
        setError("Failed to fetch currency rate");
        setConverted(null);
      } finally {
        setLoading(false);
      }
    }
    if (target !== "USD") fetchRate();
    else setConverted(totalPrice);
    return () => {
      ignore = true;
    };
  }, [target, totalPrice]);

  return (
    <div className="mt-6">
      <label className="block mb-1 text-xs text-gray-600">Show total in:</label>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="border rounded px-2 py-1 text-xs"
      >
        {/* Add other desired currencies */}
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
        <option value="GBP">GBP</option>
        <option value="JPY">JPY</option>
      </select>
      <div className="mt-2 text-sm">
        {loading && <span>Fetching rate...</span>}
        {!loading && error && <span className="text-red-600">{error}</span>}
        {!loading && converted !== null && !error && (
          <span>
            Total:{" "}
            <span className="font-bold">
              {converted.toLocaleString(undefined, {
                style: "currency",
                currency: target,
              })}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
