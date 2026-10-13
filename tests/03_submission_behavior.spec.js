const { test, expect } = require('@playwright/test');
const { ApplicationFormPage } = require('./pages/ApplicationFormPage');

test.describe('Module 3: Submission Behavior & Concurrency', () => {
  let formPage;

  test.beforeEach(async ({ page, request }) => {
    // Reset test database before each submission test
    await request.post('/api/reset');
    formPage = new ApplicationFormPage(page);
    await page.goto('/job/1');
  });

  test('TC-016 (P0): should successfully submit application and display confirmation receipt with reference ID', async ({ page }) => {
    const candidateData = {
      fullName: 'Emma Watson',
      email: 'emma.watson@example.com',
      experience: 4,
      coverLetter: 'I have 4 years of experience as a full stack engineer building distributed cloud applications.'
    };

    // Listen to network request
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/applications') && response.request().method() === 'POST'
    );

    await formPage.fillValidApplication(candidateData);
    await formPage.submit();

    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.applicationId).toMatch(/^APP-2026-\d{4}$/);

    // Verify Success Modal UI
    await expect(formPage.successModal).toBeVisible();
    await expect(formPage.receiptId).toHaveText(body.applicationId);
    await expect(formPage.receiptEmail).toHaveText('emma.watson@example.com');
    await expect(formPage.receiptRole).toHaveText('Senior Full Stack Engineer');

    // Close modal
    await formPage.closeSuccessModal();
    await expect(page).toHaveURL('/');
  });

  test('TC-017 (P0): should debounce rapid double-clicks and disable button during flight to prevent duplicate requests', async ({ page }) => {
    let postRequestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/applications') && request.method() === 'POST') {
        postRequestCount++;
      }
    });

    await formPage.fillValidApplication({
      fullName: 'Lucas Scott',
      email: 'lucas.scott@example.com'
    });

    // Dispatch rapid clicks
    await Promise.all([
      formPage.submitBtn.click({ force: true, noWaitAfter: true }),
      formPage.submitBtn.click({ force: true, noWaitAfter: true })
    ]);

    // Wait for submission completion
    await expect(formPage.successModal).toBeVisible();

    // Verify exactly ONE request was dispatched due to synchronous locking
    expect(postRequestCount).toBe(1);
  });

  test('TC-018 (P0): should detect duplicate application for same role and display conflict notification', async () => {
    const candidateEmail = 'duplicate.candidate@example.com';

    // Submit first application
    await formPage.fillValidApplication({
      fullName: 'David Miller',
      email: candidateEmail
    });
    await formPage.submit();
    await expect(formPage.successModal).toBeVisible();
    await formPage.closeSuccessModal();

    // Return to the same job role
    await formPage.page.goto('/job/1');

    // Attempt second submission with the same email
    await formPage.fillValidApplication({
      fullName: 'David Miller',
      email: candidateEmail
    });
    await formPage.submit();

    // Expect duplicate alert banner
    await expect(formPage.formAlert).toBeVisible();
    await expect(formPage.formAlert).toContainText('You have already submitted an application for this position');
    await expect(formPage.successModal).toBeHidden();
  });
});
