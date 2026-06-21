# Product Requirements Document
## Feature: Dynamic Currency Conversion at Checkout
**Project:** TESTRIG-E-SHOP
**Version:** 1.0
**Status:** Implemented
**Last Updated:** June 2026

---

## 1. Objective

Allow customers to view their checkout total converted into their preferred currency before completing payment. The conversion must use live market rates and display clearly alongside the USD total.

---

## 2. Scope

This feature applies exclusively to the checkout page (`/checkout`). It is a **display-only** conversion — the actual charge is always processed in USD. The converted amount is shown for customer reference only.

---

## 3. User Story

> As a customer shopping from outside the United States, I want to see my total in my local currency so that I can make an informed payment decision before placing my order.

---

## 4. Functional Requirements

### 4.1 Currency Selector
- A dropdown must be shown below the USD total on the order summary panel.
- Supported currencies: `EUR`, `GBP`, `JPY`, `USD`
- Default selection: `EUR`
- When `USD` is selected, no API call is made — display the USD total directly.

### 4.2 Conversion Rate Fetching
- Rates are fetched via the internal proxy API: `GET /api/liverate?base=USD&symbols={target}`
- The client utility function is `getConversionRate(from: string, to: string): Promise<number>` located at `src/lib/currencyRate.ts`
- Rates are cached in memory for **60 seconds** to avoid excessive API calls.
- If the API call fails, display an error message: `"Failed to fetch currency rate"`

### 4.3 Converted Amount Display
- Format: Use `toLocaleString` with `style: 'currency'` and the selected currency code.
- Example: `Total: €372.23`
- While fetching: display `"Fetching rate..."`
- On error: display error message in red.

### 4.4 Reactivity
- When the user changes the currency dropdown, a new rate must be fetched immediately (unless cached).
- When the cart total changes (coupon applied, item removed), the converted amount must update.

---

## 5. Technical Scope

| Layer | File | Responsibility |
|-------|------|----------------|
| API Proxy | `src/app/api/liverate/route.ts` | Fetches live rates from exchangerate-api.com, validates currency codes |
| Rate Utility | `src/lib/currencyRate.ts` | In-memory cache, 60s TTL, calls `/api/liverate` |
| UI Component | `src/app/checkout/page.tsx` | `CurrencyConversion` component, dropdown, display |

---

## 6. Validation Criteria (Acceptance Tests)

The following scenarios must pass before this feature is considered production-ready:

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | User selects EUR on page load | Converted EUR total is displayed |
| 2 | User switches from EUR to GBP | New GBP rate is fetched and displayed |
| 3 | User switches to USD | No API call made, USD total shown directly |
| 4 | API call is in progress | "Fetching rate..." is displayed |
| 5 | API call fails | Error message shown in red |
| 6 | User applies SAVE50 coupon | Converted amount updates to reflect new total |
| 7 | Cached rate is used within 60s | No duplicate API call made |

---

## 7. Out of Scope

- Charging the customer in a non-USD currency
- Locking the exchange rate at the time of order placement
- Displaying rate source or timestamp to the user
- Alerting the user when the cached rate has expired
- Re-fetching the rate automatically at any interval during the session

> **Note:** Items listed as out of scope in Section 7 represent known limitations of v1.0. They are **not tested** in the current test suite and are candidates for v1.1 hardening.

---

## 8. Known Risks (Deferred to v1.1)

| Risk | Description | Impact |
|------|-------------|--------|
| Rate staleness | Cached rate may be up to 60s old at time of payment decision | User sees incorrect converted total |
| No re-validation at payment | Rate is not re-fetched when user clicks "Place Order" | Displayed price may differ from rate used by payment processor |
| No staleness indicator | User has no way to know how old the displayed rate is | Loss of trust if discrepancy is noticed post-payment |

---

## 9. Gemini Prompt (For Live Demo)

Use the following prompt to instruct Gemini to generate unit tests for this feature:

```
I have a Next.js e-commerce checkout page at src/app/checkout/page.tsx.

It contains a CurrencyConversion component that:
- Fetches a live USD conversion rate on mount using getConversionRate() from @/lib/currencyRate
- Displays the cart total converted to the selected currency (EUR, GBP, JPY, USD)
- Shows "Fetching rate..." while loading
- Shows an error message if the fetch fails
- Caches the rate for 60 seconds in memory

The getConversionRate function signature:
  async function getConversionRate(from: string, to: string): Promise<number>

The acceptance criteria from the PRD are:
1. Converted EUR total is displayed on load
2. Switching currency fetches a new rate and updates display
3. Selecting USD shows the USD total without an API call
4. "Fetching rate..." is shown while fetch is in progress
5. Error message shown in red if fetch fails
6. Converted amount updates when coupon is applied

Write a complete Vitest + React Testing Library test file that:
- Covers all 6 acceptance criteria above
- Mocks @/lib/currencyRate using vi.hoisted
- Mocks next/navigation
- Wraps components in CartProvider and CustomerProvider
- Follows the pattern in src/app/checkout/page.test.tsx
- Uses userEvent for interactions
- Has clear test descriptions
```
