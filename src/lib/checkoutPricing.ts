export const SAVE50_COUPON_CODE = "SAVE50";
export const SAVE50_COUPON_DISCOUNT = 50;
export const FREE_SHIPPING_MINIMUM = 1000;
export const STANDARD_SHIPPING_FEE = 50;
export const DEFAULT_TAX_RATE = 0.08;

export interface CheckoutPricingInput {
  subtotal: number;
  discountAmount?: number;
  couponApplied?: boolean;
  taxRate?: number;
}

export interface CheckoutPricingSummary {
  subtotal: number;
  discountAmount: number;
  couponDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  shippingFee: number;
  total: number;
  taxRate: number;
}

export function getCouponUsageKey(userIdentifier: string) {
  return `coupon:${SAVE50_COUPON_CODE}:${userIdentifier.toLowerCase()}`;
}

export function calculateCheckoutPricing({
  subtotal,
  discountAmount = 0,
  couponApplied = false,
  taxRate = DEFAULT_TAX_RATE,
}: CheckoutPricingInput): CheckoutPricingSummary {
  const safeSubtotal = Math.max(0, subtotal);
  const safeDiscountAmount = Math.min(Math.max(0, discountAmount), safeSubtotal);
  const remainingAfterDiscount = safeSubtotal - safeDiscountAmount;
  const couponDiscount = couponApplied
    ? Math.min(SAVE50_COUPON_DISCOUNT, remainingAfterDiscount)
    : 0;
  const taxableAmount = Math.max(0, remainingAfterDiscount - couponDiscount);
  const taxAmount = taxableAmount * taxRate;
  const shippingFee = safeSubtotal >= FREE_SHIPPING_MINIMUM ? 0 : STANDARD_SHIPPING_FEE;
  const total = taxableAmount + taxAmount + shippingFee;

  return {
    subtotal: safeSubtotal,
    discountAmount: safeDiscountAmount,
    couponDiscount,
    taxableAmount,
    taxAmount,
    shippingFee,
    total,
    taxRate,
  };
}
