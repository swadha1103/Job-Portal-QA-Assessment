/**
 * Page Object Model: Job Detail Page
 */
class JobDetailPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.viewContainer = page.locator('[data-testid="job-detail-view"]');
    this.title = page.locator('[data-testid="detail-title"]');
    this.deptBadge = page.locator('[data-testid="detail-dept-badge"]');
    this.typeBadge = page.locator('[data-testid="detail-type-badge"]');
    this.locationBadge = page.locator('[data-testid="detail-location-badge"]');
    this.salary = page.locator('[data-testid="detail-salary"]');
    this.experience = page.locator('[data-testid="detail-experience"]');
    this.description = page.locator('[data-testid="detail-description"]');
    this.responsibilitiesList = page.locator('[data-testid="detail-responsibilities"] li');
    this.requirementsList = page.locator('[data-testid="detail-requirements"] li');
    this.benefitsList = page.locator('[data-testid="detail-benefits"] li');
    
    // Breadcrumbs
    this.breadcrumbHome = page.locator('[data-testid="breadcrumb-home"]');
    this.breadcrumbDept = page.locator('[data-testid="breadcrumb-department"]');
    this.breadcrumbTitle = page.locator('[data-testid="breadcrumb-title"]');

    // Not found
    this.notFoundContainer = page.locator('[data-testid="not-found-view"]');
    this.backToJobsBtn = page.locator('[data-testid="back-to-jobs-btn"]');
  }

  async goto(jobId) {
    await this.page.goto(`/job/${jobId}`);
  }

  async clickBreadcrumbHome() {
    await this.breadcrumbHome.click();
  }

  async isNotFoundDisplayed() {
    return await this.notFoundContainer.isVisible();
  }
}

module.exports = { JobDetailPage };
