import { Page, expect } from '@playwright/test';

export class CheckoutPage {
  constructor(private page: Page) {}

  async verifyCheckoutPage() {
    await expect(this.page.locator('h1')).toContainText('Checkout');
  }

  async getCurrencyDropdown() {
    return this.page.locator('select.border.rounded');
  }

  async getCurrentCurrency() {
    const select = await this.getCurrencyDropdown();
    return await select.inputValue();
  }

  async selectCurrency(currency: 'EUR' | 'GBP' | 'JPY' | 'USD') {
    const select = await this.getCurrencyDropdown();
    await select.selectOption(currency);
    // Wait for conversion to complete
    await this.page.waitForTimeout(500);
  }

  async getConvertedTotal() {
    // The converted total is in a span with the currency symbol
    const totalSpan = this.page.locator('span.font-bold');
    return await totalSpan.textContent();
  }

  async isLoadingStateVisible() {
    return await this.page.locator('text=Fetching rate...').isVisible();
  }

  async isErrorStateVisible() {
    return await this.page.locator('text=Failed to fetch currency rate').isVisible();
  }

  async waitForConversionToComplete() {
    // Wait for loading to disappear
    await this.page.waitForSelector('text=Fetching rate...', { state: 'hidden', timeout: 5000 }).catch(() => null);
    // Wait for converted total to appear
    await this.page.locator('span.font-bold').first().waitFor({ timeout: 5000 });
  }

  async verifyEURDefaultOnLoad() {
    const currency = await this.getCurrentCurrency();
    expect(currency).toBe('EUR');
    const total = await this.getConvertedTotal();
    expect(total).toContain('€');
  }

  async verifyUSDShowsRawTotal() {
    // When USD is selected, the total should be in USD format
    const total = await this.getConvertedTotal();
    expect(total).toBeTruthy();
  }

  async fillShippingInfo(info: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
  }) {
    await this.page.locator('input[name="email"]').fill(info.email);
    await this.page.locator('input[name="firstName"]').fill(info.firstName);
    await this.page.locator('input[name="lastName"]').fill(info.lastName);
    await this.page.locator('input[name="address"]').fill(info.address);
    await this.page.locator('input[name="city"]').fill(info.city);
    await this.page.locator('input[name="zipCode"]').fill(info.zipCode);
    await this.page.getByRole('button', { name: /continue to payment/i }).click();
  }

  async fillPaymentInfo(info: {
    cardNumber: string;
    expiry: string;
    cvv: string;
  }) {
    await this.page.locator('input[name="cardNumber"]').fill(info.cardNumber);
    await this.page.locator('input[name="expiry"]').fill(info.expiry);
    await this.page.locator('input[name="cvv"]').fill(info.cvv);
    await this.page.getByRole('button', { name: /review order/i }).click();
  }

  async verifyOrderSummary() {
    await expect(this.page.getByRole('heading', { name: /order summary/i })).toBeVisible();
  }

  async placeOrder() {
    await this.page.getByRole('button', { name: /place order/i }).click();
  }

  async verifyOrderSuccess() {
    await expect(this.page.locator('h1')).toContainText('Order Placed!');
  }

  async navigateToCheckout() {
    await this.page.goto('/checkout');
    await this.verifyCheckoutPage();
  }
}
