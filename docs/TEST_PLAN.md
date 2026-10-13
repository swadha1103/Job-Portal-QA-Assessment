# Test Plan: Candidate Job Application Portal
**Candidate:** QA Assessment Candidate  
**Project:** Job Application Portal Testing  
**Goal:** Assess functionality, identify bugs, verify expected behavior, and automate key test scenarios.

---

## 1. Overview & Objective

The goal of this test plan is to test the **Job Application Portal** thoroughly. The portal allows candidates to:
1. Browse open job listings.
2. View specific job requirements, salaries, and benefits.
3. Submit application forms with contact information and cover letters.

As a tester, my objective is to make sure the portal works smoothly for candidates, catches invalid data before saving it, doesn't crash on network or server errors, and prevents duplicate applications.

---

## 2. Testing Scope

### What I Am Testing (In-Scope):
- **Job Listings:** Verify that titles, departments, locations, salaries, and experience requirements display properly without placeholder or raw values.
- **Navigation:** Test clicking on job cards, breadcrumb navigation back to home, browser back/forward buttons, and handling invalid URLs (e.g., `/job/99999`).
- **Form Validation:** 
  - Required fields (Full Name, Email, Experience, Cover Letter, Terms).
  - Email format checks (rejecting missing `@`, missing domain, spaces).
  - Whitespace-only input (spaces should not pass required checks).
  - Boundary Value Analysis (BVA) for Experience (0, 50 valid; -1, 51 invalid) and Cover Letter length (min 20 characters).
- **Submission Behavior:**
  - Successful submission returns a confirmation ID.
  - Prevention of accidental double-clicking by disabling the submit button.
  - Duplicate submission detection when the same email applies for the same role twice.
- **Error Handling & Resilience:**
  - Backend 500 error display (friendly error banner, preserves user input).
  - Network disconnect / offline handling (shows retry message, does not freeze).
  - High network latency (shows loading indicator and prevents multiple clicks).
- **Cross-Browser & Responsiveness:**
  - Layout behavior on Desktop and Mobile screens (375px width, tap targets >= 44px).
  - Keyboard Tab navigation through form inputs.

### What I Am Not Testing (Out-of-Scope):
- Recruiter internal admin dashboard (applicant review system).
- User authentication / candidate login accounts (the portal is an open candidate application flow).
- Destructive load / stress testing over thousands of requests per second (violates testing safety rules).

---

## 3. Test Prioritization & Reasoning (15% Evaluation Criteria)

When planning tests, I prioritized scenarios into P0, P1, and P2 based on business impact:

| Priority | Definition | Why this Priority was Assigned |
| :---: | :--- | :--- |
| **P0 (Blocker / Must Have)** | Features that are essential for the portal to work. | If a candidate cannot see jobs or cannot submit their application, the entire hiring portal fails. If rapid clicking creates duplicate records, recruiter databases get corrupted. These must be tested and passing first. |
| **P1 (High / Important)** | Features where a bug causes data issues or poor error recovery. | If validation allows whitespace names or bad emails, recruiters receive junk data. If a server glitch erases a candidate's long cover letter without an error message, the candidate will abandon the portal. |
| **P2 (Medium / Nice to Have)** | Usability, cosmetic, and edge cases. | Search empty states, loading spinners on slow connections, and keyboard accessibility. They are important for a polished candidate experience, but don't completely block hiring. |

### Prioritized Scenarios Table:

| Scenario | Scope | Priority | Why it matters |
| :--- | :--- | :---: | :--- |
| **SC-01** | Candidate submits valid application and receives reference ID | **P0** | Happy path: Main purpose of the portal. |
| **SC-02** | Submit button disables immediately to prevent double submissions | **P0** | Prevents duplicate records in database if candidate double-clicks. |
| **SC-03** | System blocks submission if mandatory fields are left empty | **P0** | Ensures required candidate information is collected. |
| **SC-04** | Clicking a job card opens the exact matching role details | **P0** | External job links (LinkedIn/Indeed) must land on the right role. |
| **SC-05** | Duplicate application with same email for same job is rejected | **P0** | Prevents spam and multiple applications for one position. |
| **SC-06** | Whitespace-only input (e.g. `"   "`) is rejected in Name & Cover Letter | **P1** | Prevents candidates from bypassing mandatory fields with spaces. |
| **SC-07** | Invalid email addresses are rejected with clear error message | **P1** | Recruiters need a valid email to contact candidates. |
| **SC-08** | Experience field rejects negative numbers and numbers above 50 | **P1** | Boundary testing: Prevents unrealistic or invalid numbers. |
| **SC-09** | Server 500 error shows error banner and keeps candidate's typed text | **P1** | Preserves candidate's cover letter so they don't have to retype. |
| **SC-10** | Non-existent job URL (`/job/99999`) shows friendly 404 page | **P1** | Handles expired job links gracefully without crashing. |
| **SC-11** | Department and experience filters show matching roles | **P1** | Helps candidates easily find relevant openings. |
| **SC-12** | Mobile viewport (375px width) renders without horizontal scroll | **P1** | Over 50% of applicants browse on mobile phones. |
| **SC-13** | Searching for non-existent role shows clear empty state | **P2** | Good UX feedback instead of a broken blank page. |
| **SC-14** | High network latency shows loading spinner | **P2** | Informs user that their submission is currently processing. |
| **SC-15** | Keyboard Tab order through form inputs | **P2** | Accessibility for users navigating via keyboard. |

---

## 4. Testing Techniques Used

1. **Positive Testing:** Verifying expected behaviors when valid data is entered (happy path).
2. **Negative Testing:** Verifying that incorrect or missing data triggers clear error messages.
3. **Boundary Value Analysis (BVA):** Testing minimum and maximum allowed inputs:
   - Experience: `-1` (invalid), `0` (valid minimum), `50` (valid maximum), `51` (invalid).
   - Cover Letter: `19` chars (invalid), `20` chars (valid minimum).
4. **Resilience & Network Testing:** Simulating dropped connections, HTTP 500 server errors, and 2.5-second network delays using Playwright's `page.route()` interception.
5. **Concurrency Testing:** Testing rapid consecutive clicks on the submit button within milliseconds.

---

## 5. Tools & Test Environment

- **Mock Application:** Node.js v22 + Express (local server serving frontend and API).
- **Test Automation:** Playwright (`@playwright/test`) using JavaScript.
- **Browsers:** Chromium (Desktop), Firefox (Desktop), Mobile Chrome emulation (Pixel 5).
- **Design Pattern:** Page Object Model (POM) to keep locators and test logic clean and reusable.

---

## 6. Entry and Exit Criteria

### Entry Criteria:
- Mock server runs locally on `http://localhost:3000`.
- Seed jobs loaded with titles, requirements, and salaries.
- Playwright installed with browser binaries.

### Exit Criteria:
- All P0 and P1 test cases executed.
- All 25 automated tests pass without flakiness.
- All discovered bugs logged with steps to reproduce, actual vs expected, and proposed fixes.
