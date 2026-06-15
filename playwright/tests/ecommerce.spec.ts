import { test } from '@playwright/test';
import { PageObjectManager } from '../support/PageObjectManager';

test.describe('E-commerce Flow with POM', () => {
  test('should allow user to add product to cart and proceed to checkout', async ({ page }) => {
    const pom = new PageObjectManager(page);
    const homePage = pom.getHomePage();
    const cartPage = pom.getCartPage();
    const checkoutPage = pom.getCheckoutPage();

    // 1. Visit the home page
    await homePage.navigate();
    await homePage.verifyHeading();

    // 2. Add a product to cart
    const productName = await homePage.addFirstProductToCart();

    // 3. Open cart and verify item
    await homePage.openCart();
    await cartPage.verifyCartOpened();
    await cartPage.verifyProductInCart(productName);

    // 4. Proceed to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.verifyCheckoutPage();

    // 5. Fill Shipping Info
    await checkoutPage.fillShippingInfo({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
    });

    // 6. Fill Payment Info
    await checkoutPage.fillPaymentInfo({
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/26',
      cvv: '123',
    });

    // 7. Verify Summary and Place Order
    await checkoutPage.verifyOrderSummary();
    await checkoutPage.placeOrder();

    // 8. Success Page
    await checkoutPage.verifyOrderSuccess();
  });
});
