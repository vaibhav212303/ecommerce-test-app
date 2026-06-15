import { Page, expect } from '@playwright/test';

export class CartPage {
  constructor(private page: Page) {}

  async verifyCartOpened() {
    await expect(this.page.getByRole('heading', { name: /shopping cart/i })).toBeVisible();
  }

  async verifyProductInCart(productName: string) {
    await expect(this.page.locator('ul')).toContainText(productName);
  }

  async proceedToCheckout() {
    await this.page.getByRole('link', { name: /checkout/i }).click();
  }
}
