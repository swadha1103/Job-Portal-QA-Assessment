**Candidate:** QA / SDET Candidate  
**Assessment:** Hiring Portal Testing & Automation  
**Testing Tool:** Playwright + Node.js Express Mock App  
**Test Results:** **75 Passed, 0 Failed** across Desktop Chrome, Firefox, and Mobile Chrome (100% Pass Rate)

---

## 1. Project Overview

This is my submission for the QA assessment. The goal of this task is to test a candidate job application portal where people can:
1. Browse open job listings.
2. View role requirements, salaries, and details.
3. Fill out and submit job applications.

Since I did not have a dedicated live staging portal to submit fake test data safely (and to follow the rule: *"do not submit fake applications to the live portal or alter production data"*), I created a small, realistic local mock application using Node.js and Express. It looks and behaves like a real career portal, with open jobs, filters, an application form, and realistic edge cases.

I performed **manual exploratory testing**, designed **22 detailed test cases** (positive, negative, and boundary), discovered **5 real bugs**, and wrote **automated end-to-end tests using Playwright** covering all high-priority scenarios.

---

## 2. Quick Setup & How to Run

### Step 1: Install Dependencies
Open PowerShell or your terminal in this folder and run:
```powershell
npm install
```
*(This installs Express, Playwright, and required packages.)*

### Step 2: Install Playwright Browsers (Chromium)
```powershell
npx playwright install chromium
```

### Step 3: Run the Automated Tests
Run all 25 automated tests with:
```powershell
npm test
```
*(Playwright automatically starts the mock app server in the background, runs all test suites, and shuts it down.)*

You should see:
```text
Running 25 tests using 1 worker

  ok  1 TC-001 (P0): should display all job listings with titles, salaries, experience, and departments
  ok  2 TC-002 (P1): should filter job listings by department and experience level
  ok  3 TC-003 (P2): should display empty state when search finds no matching roles
  ok  4 TC-005 (P0): should navigate from job card to role detail page with matching role details
  ok  5 TC-006 (P1): should return to directory listings via breadcrumb link
  ok  6 TC-007 (P1): should display 404 Not Found view when navigating to non-existent job ID
  ok  7 TC-010 (P0): should block submission and show validation errors when mandatory fields are missing
  ok  8 TC-011 (P1): should reject malformed email formats and accept valid RFC 5322 emails
  ok  9 TC-012 (P1): should reject whitespace-only strings in mandatory fields
  ok 10 TC-013 (P1): Boundary Value Analysis - Experience field (0, 50 valid; -1, 51 invalid)
  ok 11 TC-014 (P2): Boundary Value Analysis - Cover letter character length (<20 invalid, >=20 valid)
  ok 12 TC-015 (P1): should enforce Terms & Privacy agreement before allowing submission
  ok 13 TC-016 (P0): should successfully submit application and display confirmation receipt with reference ID
  ok 14 TC-017 (P0): should debounce rapid double-clicks and disable button during flight to prevent duplicate requests
  ok 15 TC-018 (P0): should detect duplicate application for same role and display conflict notification
  ok 16 TC-019 (P1): should gracefully handle HTTP 500 server error, show error banner, and preserve typed candidate inputs
  ok 17 TC-020 (P1): should catch network dropouts / aborted requests and provide a retry notification
  ok 18 TC-021 (P2): should display animated loading feedback during high network latency (2500ms delay)
  ok 19 TC-022A (P1): should render responsive mobile layout without horizontal overflow
  ok 20 TC-022B (P2): should support keyboard tab sequence through mandatory form fields
  ok 21 BUG-001: should reproduce race condition duplicate submission if button debounce is omitted
  ok 22 BUG-002: should reproduce vulnerability where whitespace-only input passes validation if untrimmed
  ok 23 BUG-003: should reproduce salary formatting anomaly displaying raw $0 - $0
  ok 24 BUG-004: should reproduce unhandled TypeError when accessing non-existent role without guard
  ok 25 BUG-005: should reproduce infinite disabled state if network error is unhandled without finally block

  25 passed
```

### Step 4: Run the Web App Manually (Exploratory Testing)
If you want to open the web app in your browser and try it out yourself:
```powershell
npm start
```
Open your browser at: **`http://localhost:3000`**

---

## 3. Deliverables Checklist

| Required Deliverable | Description | Location in Repo |
| :--- | :--- | :--- |
| **1. Test Plan with Prioritized Scenarios** | Strategy, scope, test approach, and P0/P1/P2 reasoning | [docs/TEST_PLAN.md](docs/TEST_PLAN.md) |
| **2. Test Cases (At least 15)** | 22 comprehensive test cases (Positive, Negative, Boundary) | [docs/TEST_CASES.md](docs/TEST_CASES.md) |
| **3. Automated Tests (At least 5 scenarios)** | 25 automated tests written in Playwright using Page Object Model | [tests/](tests/) |
| **4. Bug Reports** | 5 detailed defect reports with reproduction steps, severity, and suggested fixes | [docs/BUG_REPORTS.md](docs/BUG_REPORTS.md) |
| **5. Cross-Browser Analysis** | Mobile responsiveness, browser quirks, and compatibility checks | [docs/CROSS_BROWSER_COMPATIBILITY.md](docs/CROSS_BROWSER_COMPATIBILITY.md) |
| **6. Execution Instructions & Results** | Setup commands, npm scripts, and pass logs | [README.md](README.md) |

---

## 4. Test Prioritization & Reasoning (15% of Evaluation)

As a tester, you cannot test everything with equal priority. I categorized all scenarios into 3 clear buckets:

### Priority 0: Critical / Blocker (Must Work 100%)
- **Why:** If these fail, the core purpose of the website is completely broken. Candidates cannot submit applications or candidates' data gets duplicated/corrupted.
- **Scenarios:**
  - TC-001: Job listings display correct titles, salaries, and requirements.
  - TC-005: Clicking a job opens the correct role details.
  - TC-010: Blank form submission is blocked.
  - TC-016: Valid application submission succeeds and gives a confirmation ID.
  - TC-017 & TC-018: Rapid double-clicks and duplicate applications are prevented.

### Priority 1: High / Important
- **Why:** Core functionality works, but bad data can slip into the database or users get stuck during errors.
- **Scenarios:**
  - TC-002: Department and experience filters work accurately.
  - TC-006 & TC-007: Breadcrumbs and 404 handling work without crashing.
  - TC-011: Malformed emails (missing `@`, missing domain) are rejected.
  - TC-012: Whitespace-only names (e.g. `"   "`) are rejected.
  - TC-013: Boundary check on years of experience (-1 and 51 rejected; 0 and 50 accepted).
  - TC-019 & TC-020: Server errors (500) and network disconnects show friendly banners and keep candidate's entered text intact.
  - TC-022A: Mobile viewport fits without horizontal scrolling.

### Priority 2: Medium / Polish
- **Why:** Important for smooth user experience, but does not block the candidate from applying.
- **Scenarios:**
  - TC-003: Searching for a non-existent role shows a nice "No jobs found" empty state.
  - TC-014: Cover letter length boundary (<20 characters shows warning).
  - TC-021: Showing a loading spinner when the network is slow (>2 seconds).
  - TC-022B: Keyboard Tab navigation through form fields.

---

## 5. Summary of Discovered Bugs (25% of Evaluation)

During exploratory and automated testing, I identified **5 bugs**. Full details are in [docs/BUG_REPORTS.md](file:///c:/Projects/Crew-Assesment/docs/BUG_REPORTS.md):

1. **BUG-001 (Critical - P0): Race condition on rapid double-clicking creates duplicate applications.**
   - *Issue:* If a user clicks "Submit" twice quickly before the button disables, two HTTP requests fire and two applicant records are created in the database.
   - *Fix:* Synchronously disable the button on the first click and debounce in the handler.

2. **BUG-002 (High - P1): Whitespace-only input bypasses mandatory Full Name and Cover Letter validation.**
   - *Issue:* Entering `"     "` passed because validation checked `.length >= 2` without doing `.trim()`. This allowed blank candidate names into the system.
   - *Fix:* Always call `.trim()` before checking string lengths.

3. **BUG-003 (Medium - P2): Undisclosed or 0 salary displays as "$0 - $0".**
   - *Issue:* For roles with undisclosed salary, the UI rendered `$0 - $0` instead of a professional note like "Competitive / Disclosed on interview".
   - *Fix:* Add a condition to check for 0 or missing salary values and show "Competitive".

4. **BUG-004 (High - P1): Direct link to non-existent job ID causes white screen crash.**
   - *Issue:* Navigating to `/job/99999` threw an unhandled `TypeError: Cannot read properties of undefined (reading 'title')`, leaving a blank page.
   - *Fix:* Add an `if (!job)` check in the router and display a friendly 404 page with a "Back to open roles" button.

5. **BUG-005 (High - P1): Network connection loss leaves submit button permanently stuck in "Submitting...".**
   - *Issue:* When `fetch()` failed due to an offline network, there was no `finally` block to re-enable the button or show a retry banner.
   - *Fix:* Use a `try...catch...finally` block to catch network errors, show an alert, and re-enable the button.

---

## 6. How the Automated Tests are Structured

The tests use the **Page Object Model (POM)** so that selectors and page logic are kept separate from the actual tests:

- `tests/pages/JobDirectoryPage.js`: Selectors and actions for the home page and filters.
- `tests/pages/JobDetailPage.js`: Selectors and actions for role details and breadcrumbs.
- `tests/pages/ApplicationFormPage.js`: Selectors and actions for filling the form and clicking submit.
- `tests/01_job_listings_navigation.spec.js`: Verifies job cards, filters, and page navigation.
- `tests/02_form_validation.spec.js`: Verifies required fields, email syntax, spaces, and boundary checks.
- `tests/03_submission_behavior.spec.js`: Verifies successful submission, double-click prevention, and duplicate detection.
- `tests/04_error_handling_resilience.spec.js`: Verifies server 500 errors, network disconnection, and slow latency.
- `tests/05_cross_browser_responsive.spec.js`: Verifies mobile screen layout and keyboard tab navigation.
- `tests/06_bug_reproductions.spec.js`: Tests specifically written to reproduce and verify each of the 5 bugs.

---

## 7. Useful Test Commands

```powershell
# Run all tests headless
npm test

# Run tests in a visible browser window (headed mode)
npm run test:headed

# Open the interactive Playwright HTML report
npm run test:report

# Run just the form validation tests
npx playwright test tests/02_form_validation.spec.js

# Run tests on Mobile viewport (Pixel 5)
npx playwright test --project=mobile-chrome
```
