import { describe, expect, it } from "vitest";
import {
  calculateCheckoutPricing,
  getCouponUsageKey,
  SAVE50_COUPON_DISCOUNT,
  STANDARD_SHIPPING_FEE,
} from "./checkoutPricing";

describe("calculateCheckoutPricing", () => {
  it("calculates tax after discounts and coupon, before shipping", () => {
    const pricing = calculateCheckoutPricing({
      subtotal: 500,
      discountAmount: 50,
      couponApplied: true,
      taxRate: 0.08,
    });

    expect(pricing.couponDiscount).toBe(SAVE50_COUPON_DISCOUNT);
    expect(pricing.taxableAmount).toBe(400);
    expect(pricing.taxAmount).toBe(32);
    expect(pricing.shippingFee).toBe(STANDARD_SHIPPING_FEE);
    expect(pricing.total).toBe(482);
  });

  it("applies free shipping based on the original subtotal threshold", () => {
    const pricing = calculateCheckoutPricing({
      subtotal: 1000,
      couponApplied: true,
      taxRate: 0.08,
    });

    expect(pricing.shippingFee).toBe(0);
    expect(pricing.taxableAmount).toBe(950);
    expect(pricing.taxAmount).toBe(76);
    expect(pricing.total).toBe(1026);
  });

  it("caps discounts and coupons so totals never go negative", () => {
    const pricing = calculateCheckoutPricing({
      subtotal: 25,
      discountAmount: 100,
      couponApplied: true,
      taxRate: 0.08,
    });

    expect(pricing.discountAmount).toBe(25);
    expect(pricing.couponDiscount).toBe(0);
    expect(pricing.taxableAmount).toBe(0);
    expect(pricing.taxAmount).toBe(0);
    expect(pricing.total).toBe(STANDARD_SHIPPING_FEE);
  });
});

describe("getCouponUsageKey", () => {
  it("normalizes user identifiers", () => {
    expect(getCouponUsageKey("USER@Example.COM")).toBe(
      "coupon:SAVE50:user@example.com",
    );
  });
});
