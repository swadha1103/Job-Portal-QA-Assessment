/**
 * Page Object Model: Job Directory & Listings Page
 */
class JobDirectoryPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.deptFilter = page.locator('[data-testid="filter-department"]');
    this.expFilter = page.locator('[data-testid="filter-experience"]');
    this.resetBtn = page.locator('[data-testid="reset-filters-btn"]');
    this.resultsCount = page.locator('[data-testid="results-count"]');
    this.jobsGrid = page.locator('[data-testid="jobs-grid"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.emptyResetBtn = page.locator('[data-testid="empty-reset-btn"]');
    this.headerBadge = page.locator('[data-testid="header-jobs-badge"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.jobsGrid.waitFor({ state: 'visible' });
  }

  async search(keyword) {
    await this.searchInput.fill(keyword);
  }

  async selectDepartment(dept) {
    await this.deptFilter.selectOption(dept);
  }

  async selectMinExperience(expYears) {
    await this.expFilter.selectOption(String(expYears));
  }

  async resetFilters() {
    await this.resetBtn.click();
  }

  getJobCards() {
    return this.page.locator('.job-card');
  }

  getJobCardById(id) {
    return this.page.locator(`[data-testid="job-card-${id}"]`);
  }

  async clickViewRoleAndApply(id) {
    await this.page.locator(`[data-testid="view-job-${id}"]`).click();
  }

  getJobTitle(id) {
    return this.page.locator(`[data-testid="job-title-${id}"]`);
  }

  getJobSalary(id) {
    return this.page.locator(`[data-testid="job-salary-${id}"]`);
  }

  getJobDept(id) {
    return this.page.locator(`[data-testid="job-dept-${id}"]`);
  }
}

module.exports = { JobDirectoryPage };
