const { test, expect } = require('@playwright/test');
const { ApplicationFormPage } = require('./pages/ApplicationFormPage');

test.describe('Module 2: Form Validation & Boundary Testing', () => {
  let formPage;

  test.beforeEach(async ({ page }) => {
    formPage = new ApplicationFormPage(page);
    await page.goto('/job/1');
  });

  test('TC-010 (P0): should block submission and show validation errors when mandatory fields are missing', async () => {
    // Attempt submitting without entering any values
    await formPage.submit();

    // Verify inline field error alerts are displayed
    await expect(formPage.errorFullName).toHaveText('Full Name is required.');
    await expect(formPage.errorEmail).toHaveText('Email Address is required.');
    await expect(formPage.errorExperience).toHaveText('Years of experience is required.');
    await expect(formPage.errorCoverLetter).toHaveText('Cover Letter is required.');
    await expect(formPage.errorTerms).toHaveText('You must agree to the terms and privacy policy to submit.');

    // Top alert banner should also display
    await expect(formPage.formAlert).toBeVisible();
    await expect(formPage.formAlert).toContainText('Please fix the highlighted errors before submitting.');
    await expect(formPage.successModal).toBeHidden();
  });

  test('TC-011 (P1): should reject malformed email formats and accept valid RFC 5322 emails', async () => {
    const invalidEmails = [
      'plainaddress',
      'missingatsign.com',
      '@missingusername.com',
      'candidate@.com',
      'candidate@domain',
      'user name@domain.com'
    ];

    for (const email of invalidEmails) {
      await formPage.fillEmail(email);
      // Trigger validation by blurring or submitting
      await formPage.submit();
      await expect(formPage.errorEmail).toHaveText('Please enter a valid email address (e.g. name@example.com).');
    }

    // Valid email clears error
    await formPage.fillEmail('valid.applicant@example.com');
    await formPage.emailInput.blur();
    await expect(formPage.errorEmail).toHaveText('');
  });

  test('TC-012 (P1): should reject whitespace-only strings in mandatory fields', async () => {
    // Fill full name with whitespace only
    await formPage.fillFullName('     ');
    // Fill cover letter with whitespace only
    await formPage.fillCoverLetter('                      ');

    await formPage.submit();

    // Field errors should trigger indicating fields cannot be empty
    await expect(formPage.errorFullName).toHaveText('Full Name is required.');
    await expect(formPage.errorCoverLetter).toHaveText('Cover Letter is required.');
  });

  test('TC-013 (P1): Boundary Value Analysis - Experience field (0, 50 valid; -1, 51 invalid)', async () => {
    // Negative boundary: -1
    await formPage.fillExperience(-1);
    await formPage.submit();
    await expect(formPage.errorExperience).toHaveText('Experience cannot be negative (minimum is 0).');

    // Upper boundary + 1: 51
    await formPage.fillExperience(51);
    await formPage.submit();
    await expect(formPage.errorExperience).toHaveText('Years of experience cannot exceed 50.');

    // Valid minimum boundary: 0 (e.g. internship / fresh graduate)
    await formPage.fillExperience(0);
    await formPage.experienceInput.blur();
    await expect(formPage.errorExperience).toHaveText('');

    // Valid maximum boundary: 50
    await formPage.fillExperience(50);
    await formPage.experienceInput.blur();
    await expect(formPage.errorExperience).toHaveText('');
  });

  test('TC-014 (P2): Boundary Value Analysis - Cover letter character length (<20 invalid, >=20 valid)', async () => {
    // 19 characters (1 char short of minimum 20)
    const nineteenChars = 'Short intro letter!';
    expect(nineteenChars.length).toBe(19);

    await formPage.fillCoverLetter(nineteenChars);
    await formPage.submit();
    await expect(formPage.errorCoverLetter).toContainText('Cover letter must contain at least 20 characters (currently 19)');

    // Exactly 20 characters (minimum boundary)
    const twentyChars = '12345678901234567890';
    expect(twentyChars.length).toBe(20);

    await formPage.fillCoverLetter(twentyChars);
    await formPage.coverLetterInput.blur();
    await expect(formPage.errorCoverLetter).toHaveText('');
  });

  test('TC-015 (P1): should enforce Terms & Privacy agreement before allowing submission', async () => {
    await formPage.fillValidApplication({ termsAccepted: false });
    await formPage.termsCheckbox.setChecked(false);
    await formPage.submit();

    await expect(formPage.errorTerms).toHaveText('You must agree to the terms and privacy policy to submit.');
    await expect(formPage.successModal).toBeHidden();
  });
});
