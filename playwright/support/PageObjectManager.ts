import { Page } from '@playwright/test';
import { HomePage } from './pageObjects/HomePage';
import { CartPage } from './pageObjects/CartPage';
import { CheckoutPage } from './pageObjects/CheckoutPage';

export class PageObjectManager {
  private homePage: HomePage;
  private cartPage: CartPage;
  private checkoutPage: CheckoutPage;

  constructor(private page: Page) {
    this.homePage = new HomePage(this.page);
    this.cartPage = new CartPage(this.page);
    this.checkoutPage = new CheckoutPage(this.page);
  }

  getHomePage() {
    return this.homePage;
  }

  getCartPage() {
    return this.cartPage;
  }

  getCheckoutPage() {
    return this.checkoutPage;
  }
}
