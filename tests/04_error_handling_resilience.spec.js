const { test, expect } = require('@playwright/test');
const { ApplicationFormPage } = require('./pages/ApplicationFormPage');

test.describe('Module 4: Error Handling & Network Resilience', () => {
  let formPage;

  test.beforeEach(async ({ page }) => {
    formPage = new ApplicationFormPage(page);
    await page.goto('/job/1');
  });

  test('TC-019 (P1): should gracefully handle HTTP 500 server error, show error banner, and preserve typed candidate inputs', async ({ page }) => {
    // Intercept backend API to return HTTP 500
    await page.route('**/api/applications', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database transaction deadlock' })
      });
    });

    const candidateData = {
      fullName: 'Robert Pattinson',
      email: 'robert.pattinson@example.com',
      experience: 8,
      coverLetter: 'Eight years of building enterprise microservices with high reliability.'
    };

    await formPage.fillValidApplication(candidateData);
    await formPage.submit();

    // Verify error banner is shown
    await expect(formPage.formAlert).toBeVisible();
    await expect(formPage.formAlert).toContainText('Server error occurred while submitting your application.');

    // CRITICAL: Verify candidate input data is PRESERVED (not erased on failure)
    await expect(formPage.fullNameInput).toHaveValue(candidateData.fullName);
    await expect(formPage.emailInput).toHaveValue(candidateData.email);
    await expect(formPage.experienceInput).toHaveValue(String(candidateData.experience));
    await expect(formPage.coverLetterInput).toHaveValue(candidateData.coverLetter);

    // Verify submit button is re-enabled so candidate can retry
    await expect(formPage.submitBtn).toBeEnabled();
    await expect(formPage.submitBtn).toContainText('Submit Application');
  });

  test('TC-020 (P1): should catch network dropouts / aborted requests and provide a retry notification', async ({ page }) => {
    // Intercept API to simulate dropped connection
    await page.route('**/api/applications', route => {
      route.abort('internetdisconnected');
    });

    await formPage.fillValidApplication({
      fullName: 'Maya Lin',
      email: 'maya.lin@example.com'
    });
    await formPage.submit();

    // Verify user-friendly network alert is displayed
    await expect(formPage.formAlert).toBeVisible();
    await expect(formPage.formAlert).toContainText('Network connection issue. Your details have been preserved—please try again.');

    // Verify form data preserved
    await expect(formPage.fullNameInput).toHaveValue('Maya Lin');
    await expect(formPage.emailInput).toHaveValue('maya.lin@example.com');

    // Verify button is re-enabled to allow retry once network reconnects
    await expect(formPage.submitBtn).toBeEnabled();
  });

  test('TC-021 (P2): should display animated loading feedback during high network latency (2500ms delay)', async ({ page }) => {
    // Intercept API with artificial delay
    await page.route('**/api/applications', async route => {
      await new Promise(r => setTimeout(r, 1200));
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          applicationId: 'APP-2026-9876',
          record: { email: 'slow.network@example.com' }
        })
      });
    });

    await formPage.fillValidApplication({
      fullName: 'Latency Candidate',
      email: 'slow.network@example.com'
    });

    // Initiate submit
    await formPage.submit();

    // Verify button shows loading state and is disabled during flight
    await expect(formPage.submitBtn).toBeDisabled();
    await expect(formPage.submitBtn).toContainText('Submitting Application...');

    // Await eventual success modal
    await expect(formPage.successModal).toBeVisible();
    await expect(formPage.receiptId).toHaveText('APP-2026-9876');
  });
});
