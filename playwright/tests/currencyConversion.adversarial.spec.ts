import { test, expect } from "@playwright/test";

/**
 * ADVERSARIAL QA — Playwright
 *
 * What Gemini tested:  Happy path. Rate loads. Numbers display. Flow completes.
 * What this tests:     Real user behavior. Rate changes mid-session.
 *                      User sees one price. Pays a different one.
 */

test.describe.skip("❌ ADVERSARIAL QA — Currency Rate: Real World Behaviour", () => {
  test.beforeEach(async ({ page }) => {
    // Set up cart in localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem(
        "cart",
        JSON.stringify([
          {
            id: "product-1",
            name: "Leather Boots",
            description: "Premium boots",
            price: 426.92,
            image: "boots.jpg",
            category: "Footwear",
            quantity: 1,
          },
        ])
      );
    });
  });

  /**
   * SCENARIO 1 — The rate the user sees is not the rate at payment time.
   *
   * Gemini's test: rate loads, number shows. Done.
   * QA question:   what if the rate changes while the user is deciding?
   *
   * We intercept the API twice:
   *   - First call (page load):  rate = 0.87  → shows €371.42
   *   - Second call (60s later): rate = 0.94  → should update to €401.30
   *
   * FAILS because: the component never re-fetches after the initial load.
   * The user sees a stale price with no warning.
   */
  test("FAILS: displayed EUR price does not update when rate changes mid-session", async ({
    page,
  }) => {
    let callCount = 0;

    // Intercept the live rate API
    await page.route("**/api/liverate**", async (route) => {
      callCount++;
      const rate = callCount === 1 ? 0.87 : 0.94;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ base: "USD", rates: { EUR: rate } }),
      });
    });

    await page.goto("http://localhost:3000/checkout");

    // User sees initial price at rate 0.87
    // 426.92 * 0.87 = 371.42
    await expect(page.getByText(/371/)).toBeVisible();

    // 60 seconds pass — simulate with a short wait in the test
    // In reality this is time passing while user reads, fills form, decides
    await page.waitForTimeout(2000);

    // QA EXPECTATION: price should refresh to reflect new rate 0.94
    // 426.92 * 0.94 = 401.30
    // FAILS: page still shows 371 — stale price, no warning
    await expect(page.getByText(/401/)).toBeVisible();
  });

  /**
   * SCENARIO 2 — No warning shown to the user when rate is stale.
   *
   * A production checkout must communicate rate freshness.
   * Gemini never built this. The PRD listed it as out of scope.
   * This is what QA catches that the spec missed.
   *
   * FAILS because: no staleness indicator exists in the component.
   */
  test("FAILS: no staleness warning shown when rate is outdated", async ({
    page,
  }) => {
    await page.route("**/api/liverate**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ base: "USD", rates: { EUR: 0.87 } }),
      });
    });

    await page.goto("http://localhost:3000/checkout");
    await page.waitForTimeout(2000);

    // QA EXPECTATION: after rate becomes stale, user should see a warning
    // FAILS: no such text exists anywhere on the page
    await expect(
      page.getByText(/rate may be outdated|exchange rate has changed|refresh/i)
    ).toBeVisible();
  });

  /**
   * SCENARIO 3 — Full flow: price shown at step 1 ≠ price at Place Order.
   *
   * This is the money scenario for your webinar.
   * User sees €371 on the shipping page.
   * Rate changes before they reach the summary page.
   * They click Place Order — no re-fetch happens.
   * The price they agreed to is not the price being processed.
   *
   * FAILS because: rate is never re-validated before order submission.
   */
  test("FAILS: rate is not re-validated before Place Order is clicked", async ({
    page,
  }) => {
    let callCount = 0;

    await page.route("**/api/liverate**", async (route) => {
      callCount++;
      const rate = callCount === 1 ? 0.87 : 0.94;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ base: "USD", rates: { EUR: rate } }),
      });
    });

    await page.goto("http://localhost:3000/checkout");

    // Step 1: Shipping
    await page.fill('input[name="email"]', "user@example.com");
    await page.fill('input[name="firstName"]', "John");
    await page.fill('input[name="lastName"]', "Doe");
    await page.fill('input[name="address"]', "123 Main St");
    await page.fill('input[name="city"]', "New York");
    await page.fill('input[name="zipCode"]', "10001");
    await page.getByRole("button", { name: /continue to payment/i }).click();

    // Step 2: Payment
    await page.fill('input[name="cardNumber"]', "4111111111111111");
    await page.fill('input[name="expiry"]', "12/27");
    await page.fill('input[name="cvv"]', "123");
    await page.getByRole("button", { name: /review order/i }).click();

    // Step 3: Summary — user clicks Place Order
    await page.getByRole("button", { name: /place order/i }).click();

    // QA EXPECTATION: a second API call should have happened before order placement
    // to ensure the displayed rate matches the current market rate
    // FAILS: callCount is still 1 — rate was never re-fetched
    expect(callCount).toBeGreaterThan(1);
  });
}); 