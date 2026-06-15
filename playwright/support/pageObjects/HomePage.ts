import { Page, expect } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/');
  }

  async verifyHeading() {
    await expect(this.page.locator('h1')).toContainText('Summer Collection');
  }

  async addFirstProductToCart() {
    const productCard = this.page.locator('div.group').first();
    const productName = await productCard.locator('h3').innerText();
    await productCard.getByRole('button', { name: /add/i }).click();
    return productName;
  }

  async openCart() {
    await this.page.getByRole('button', { name: /open shopping cart/i }).click();
  }
}
