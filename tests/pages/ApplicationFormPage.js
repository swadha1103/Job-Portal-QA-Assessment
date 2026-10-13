/**
 * Page Object Model: Candidate Application Form
 */
class ApplicationFormPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.form = page.locator('[data-testid="application-form"]');
    this.fullNameInput = page.locator('[data-testid="input-fullname"]');
    this.emailInput = page.locator('[data-testid="input-email"]');
    this.phoneInput = page.locator('[data-testid="input-phone"]');
    this.experienceInput = page.locator('[data-testid="input-experience"]');
    this.linkedinInput = page.locator('[data-testid="input-linkedin"]');
    this.coverLetterInput = page.locator('[data-testid="input-coverletter"]');
    this.resumeInput = page.locator('[data-testid="input-resume"]');
    this.termsCheckbox = page.locator('[data-testid="input-terms"]');
    this.submitBtn = page.locator('[data-testid="submit-btn"]');
    this.charCounter = page.locator('[data-testid="char-counter"]');
    this.formAlert = page.locator('[data-testid="form-alert"]');
    
    // Field Errors
    this.errorFullName = page.locator('[data-testid="error-fullname"]');
    this.errorEmail = page.locator('[data-testid="error-email"]');
    this.errorPhone = page.locator('[data-testid="error-phone"]');
    this.errorExperience = page.locator('[data-testid="error-experience"]');
    this.errorLinkedin = page.locator('[data-testid="error-linkedin"]');
    this.errorCoverLetter = page.locator('[data-testid="error-coverletter"]');
    this.errorResume = page.locator('[data-testid="error-resume"]');
    this.errorTerms = page.locator('[data-testid="error-terms"]');

    // Success Modal
    this.successModal = page.locator('[data-testid="success-modal"]');
    this.modalTitle = page.locator('[data-testid="modal-title"]');
    this.receiptId = page.locator('[data-testid="receipt-id"]');
    this.receiptRole = page.locator('[data-testid="receipt-role"]');
    this.receiptEmail = page.locator('[data-testid="receipt-email"]');
    this.modalCloseBtn = page.locator('[data-testid="modal-close-btn"]');
  }

  async fillFullName(name) {
    await this.fullNameInput.fill(name);
  }

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPhone(phone) {
    await this.phoneInput.fill(phone);
  }

  async fillExperience(exp) {
    await this.experienceInput.fill(String(exp));
  }

  async fillLinkedin(url) {
    await this.linkedinInput.fill(url);
  }

  async fillCoverLetter(text) {
    await this.coverLetterInput.fill(text);
  }

  async setTermsAccepted(checked = true) {
    await this.termsCheckbox.setChecked(checked);
  }

  async fillValidApplication(data = {}) {
    const defaultData = {
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+1 (555) 234-5678',
      experience: 5,
      linkedin: 'https://linkedin.com/in/sarahjenkins',
      coverLetter: 'I am excited to apply for this role. With 5 years of production experience in scalable cloud services, I am confident in adding immediate value to your team.',
      termsAccepted: true
    };
    const finalData = { ...defaultData, ...data };

    await this.fillFullName(finalData.fullName);
    await this.fillEmail(finalData.email);
    if (finalData.phone) await this.fillPhone(finalData.phone);
    await this.fillExperience(finalData.experience);
    if (finalData.linkedin) await this.fillLinkedin(finalData.linkedin);
    await this.fillCoverLetter(finalData.coverLetter);
    await this.setTermsAccepted(finalData.termsAccepted);
  }

  async submit() {
    await this.submitBtn.click();
  }

  async clickSubmitRapidly(times = 2) {
    // Dispatch rapid clicks
    for (let i = 0; i < times; i++) {
      await this.submitBtn.click({ force: true, noWaitAfter: true });
    }
  }

  async isSuccessModalVisible() {
    return await this.successModal.isVisible();
  }

  async closeSuccessModal() {
    await this.modalCloseBtn.click();
  }
}

module.exports = { ApplicationFormPage };
