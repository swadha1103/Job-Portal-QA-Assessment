const { test, expect } = require('@playwright/test');
const { JobDirectoryPage } = require('./pages/JobDirectoryPage');
const { JobDetailPage } = require('./pages/JobDetailPage');

test.describe('Module 1: Job Listings & Navigation', () => {
  let directoryPage;
  let detailPage;

  test.beforeEach(async ({ page }) => {
    directoryPage = new JobDirectoryPage(page);
    detailPage = new JobDetailPage(page);
    await directoryPage.goto();
  });

  test('TC-001 (P0): should display all job listings with titles, salaries, experience, and departments', async ({ page }) => {
    const cards = directoryPage.getJobCards();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Verify metadata on the first job (Senior Full Stack Engineer)
    const title = directoryPage.getJobTitle(1);
    await expect(title).toHaveText('Senior Full Stack Engineer');

    const salary = directoryPage.getJobSalary(1);
    await expect(salary).toContainText('$140,000 - $180,000 USD');

    const dept = directoryPage.getJobDept(1);
    await expect(dept).toHaveText('Engineering');

    const exp = page.locator('[data-testid="job-exp-1"]');
    await expect(exp).toContainText('5+ years');

    const desc = page.locator('[data-testid="job-desc-1"]');
    await expect(desc).not.toBeEmpty();
  });

  test('TC-002 (P1): should filter job listings by department and experience level', async () => {
    // Filter by Engineering department
    await directoryPage.selectDepartment('Engineering');
    await directoryPage.selectMinExperience(7);

    // Should only show Staff DevOps & VP of Engineering (experience >= 7)
    await expect(directoryPage.getJobCards()).toHaveCount(2);

    await expect(directoryPage.getJobTitle(3)).toHaveText('Staff DevOps & Platform Engineer');
    await expect(directoryPage.getJobTitle(6)).toHaveText('VP of Engineering');

    // Reset filters
    await directoryPage.resetFilters();
    await expect(directoryPage.getJobCards()).toHaveCount(6);
  });

  test('TC-003 (P2): should display empty state when search finds no matching roles', async () => {
    await directoryPage.search('NonExistentJobRoleXYZ123');
    await expect(directoryPage.emptyState).toBeVisible();
    await expect(directoryPage.jobsGrid).toBeHidden();
    await expect(directoryPage.resultsCount).toHaveText('Showing 0 open positions');

    // Clicking reset returns all jobs
    await directoryPage.emptyResetBtn.click();
    await expect(directoryPage.emptyState).toBeHidden();
    await expect(directoryPage.jobsGrid).toBeVisible();
    await expect(directoryPage.getJobCards()).toHaveCount(6);
  });

  test('TC-005 (P0): should navigate from job card to role detail page with matching role details', async ({ page }) => {
    await directoryPage.clickViewRoleAndApply(1);

    await expect(page).toHaveURL(/\/job\/1/);
    await expect(detailPage.title).toHaveText('Senior Full Stack Engineer');
    await expect(detailPage.deptBadge).toHaveText('Engineering');
    await expect(detailPage.salary).toHaveText('$140,000 - $180,000 USD');
    await expect(detailPage.experience).toHaveText('5+ years');

    // Verify requirements & responsibilities rendered
    expect(await detailPage.responsibilitiesList.count()).toBeGreaterThanOrEqual(3);
    expect(await detailPage.requirementsList.count()).toBeGreaterThanOrEqual(3);
  });

  test('TC-006 (P1): should return to directory listings via breadcrumb link', async ({ page }) => {
    await directoryPage.clickViewRoleAndApply(2);
    await expect(page).toHaveURL(/\/job\/2/);

    await detailPage.clickBreadcrumbHome();
    await expect(page).toHaveURL('/');
    await expect(directoryPage.jobsGrid).toBeVisible();
  });

  test('TC-007 (P1): should display 404 Not Found view when navigating to non-existent job ID', async ({ page }) => {
    await detailPage.goto(99999);
    await expect(detailPage.notFoundContainer).toBeVisible();
    await expect(detailPage.backToJobsBtn).toBeVisible();

    await detailPage.backToJobsBtn.click();
    await expect(page).toHaveURL('/');
    await expect(directoryPage.jobsGrid).toBeVisible();
  });
});
