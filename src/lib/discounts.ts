export const GOLD_CUSTOMER_DISCOUNT = {
  percentage: 0.1,
  minimumOrderAmount: 500,
  minimumSuccessfulOrdersLast90Days: 3,
  maximumDiscount: 100,
} as const;

export interface CustomerDiscountProfile {
  tier: string;
  successfulOrdersLast90Days: number;
}

export function calculateGoldCustomerDiscount(
  orderAmount: number,
  customer: CustomerDiscountProfile
) {
  const isEligible =
    customer.tier.toLowerCase() === "gold" &&
    orderAmount >= GOLD_CUSTOMER_DISCOUNT.minimumOrderAmount &&
    customer.successfulOrdersLast90Days >=
      GOLD_CUSTOMER_DISCOUNT.minimumSuccessfulOrdersLast90Days;

  if (!isEligible) return 0;

  return Math.min(
    orderAmount * GOLD_CUSTOMER_DISCOUNT.percentage,
    GOLD_CUSTOMER_DISCOUNT.maximumDiscount
  );
}
