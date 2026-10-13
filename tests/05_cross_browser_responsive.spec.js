const { test, expect } = require('@playwright/test');
const { JobDirectoryPage } = require('./pages/JobDirectoryPage');
const { ApplicationFormPage } = require('./pages/ApplicationFormPage');

test.describe('Module 5: Cross-Browser & Viewport Responsiveness', () => {
  test('TC-022A (P1): should render responsive mobile layout without horizontal overflow', async ({ page }) => {
    // Set mobile viewport (iPhone SE dimension)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const directoryPage = new JobDirectoryPage(page);
    await expect(directoryPage.jobsGrid).toBeVisible();

    // Verify no horizontal document overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Navigate to job detail on mobile
    await directoryPage.clickViewRoleAndApply(1);
    await expect(page).toHaveURL(/\/job\/1/);

    const formPage = new ApplicationFormPage(page);
    await expect(formPage.form).toBeVisible();

    // Verify form submit button is accessible and has proper tap target height
    const btnBox = await formPage.submitBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    expect(btnBox.height).toBeGreaterThanOrEqual(44); // WCAG minimum 44px tap target

    // Verify no horizontal overflow on detail page
    const detailHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(detailHorizontalScroll).toBe(false);
  });

  test('TC-022B (P2): should support keyboard tab sequence through mandatory form fields', async ({ page }) => {
    await page.goto('/job/1');
    const formPage = new ApplicationFormPage(page);

    // Focus on full name
    await formPage.fullNameInput.focus();
    await expect(formPage.fullNameInput).toBeFocused();

    // Press Tab -> Email
    await page.keyboard.press('Tab');
    await expect(formPage.emailInput).toBeFocused();

    // Press Tab -> Phone
    await page.keyboard.press('Tab');
    await expect(formPage.phoneInput).toBeFocused();

    // Press Tab -> Experience
    await page.keyboard.press('Tab');
    await expect(formPage.experienceInput).toBeFocused();
  });
});
