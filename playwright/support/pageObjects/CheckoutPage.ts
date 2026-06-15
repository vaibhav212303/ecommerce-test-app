import { Page, expect } from '@playwright/test';

export class CheckoutPage {
  constructor(private page: Page) {}

  async verifyCheckoutPage() {
    await expect(this.page.locator('h1')).toContainText('Checkout');
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
}
