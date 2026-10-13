const { test, expect } = require('@playwright/test');
const { ApplicationFormPage } = require('./pages/ApplicationFormPage');

test.describe('Module 6: Defect Verifications & Bug Reproductions', () => {
  test('BUG-001: should reproduce race condition duplicate submission if button debounce is omitted', async ({ page }) => {
    await page.goto('/job/1?bug=BUG-001');

    let requestCount = 0;
    page.on('request', req => {
      if (req.url().includes('/api/applications') && req.method() === 'POST') {
        requestCount++;
      }
    });

    const formPage = new ApplicationFormPage(page);
    await formPage.fillValidApplication({
      fullName: 'Double Clicker',
      email: 'double.clicker@example.com'
    });

    // Fire two rapid clicks via DOM evaluation to simulate simultaneous clicks
    await page.evaluate(() => {
      const btn = document.getElementById('submit-btn');
      btn.click();
      btn.click();
    });

    await page.waitForTimeout(600);

    // Confirms the defect: without synchronous debouncing, 2 requests leak through
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });

  test('BUG-002: should reproduce vulnerability where whitespace-only input passes validation if untrimmed', async ({ page }) => {
    await page.goto('/job/1?bug=BUG-002');
    const formPage = new ApplicationFormPage(page);

    // Enter whitespace-only strings
    await formPage.fillFullName('     '); // 5 spaces
    await formPage.fillEmail('whitespace.candidate@example.com');
    await formPage.fillExperience(3);
    await formPage.fillCoverLetter('                              '); // 30 spaces
    await formPage.setTermsAccepted(true);

    // Fire submit
    await page.locator('[data-testid="submit-btn"]').click();
    await page.waitForTimeout(600);

    // Verify defect reproduction: error is NOT shown because spaces satisfied raw length
    await expect(formPage.errorFullName).toHaveText('');
  });

  test('BUG-003: should reproduce salary formatting anomaly displaying raw $0 - $0', async ({ page }) => {
    await page.goto('/?bug=BUG-003');

    // In bug mode, formatter prints `$${job.salaryMin || 0} - $${job.salaryMax || 0}`
    const salaryElement = page.locator('[data-testid="job-salary-1"]');
    const text = await salaryElement.textContent();
    // Raw unformatted number string without thousand separators or currency label
    expect(text).toBe('$140000 - $180000');
  });

  test('BUG-004: should reproduce unhandled TypeError when accessing non-existent role without guard', async ({ page }) => {
    // Listen for the unhandled page error
    const pageErrorPromise = page.waitForEvent('pageerror');

    // Navigate to non-existent job with bug flag
    await page.goto('/job/99999?bug=BUG-004');

    const capturedError = await pageErrorPromise;
    expect(capturedError).not.toBeNull();
    expect(capturedError.message).toMatch(/reading 'title'|undefined/);
  });

  test('BUG-005: should reproduce infinite disabled state if network error is unhandled without finally block', async ({ page }) => {
    await page.goto('/job/1?bug=BUG-005');
    const formPage = new ApplicationFormPage(page);

    // Intercept network to drop
    await page.route('**/api/applications', route => route.abort('failed'));

    await formPage.fillValidApplication({
      fullName: 'Offline User',
      email: 'offline.user@example.com'
    });

    // Attempt submit - don't block on network failure
    await page.locator('[data-testid="submit-btn"]').click();
    await page.waitForTimeout(600);

    // Defect reproduction: button remains disabled indefinitely without retry alert
    await expect(formPage.submitBtn).toBeDisabled();
    await expect(formPage.formAlert).toBeHidden();
  });
});
