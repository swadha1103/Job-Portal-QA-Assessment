# Bug Reports: Job Application Portal
**Candidate:** QA Assessment Candidate  
**Total Defects Found:** 5 Issues (Discovered during Exploratory & Automation Testing)  
**Environment:** Chrome, Firefox, Node.js v22 LTS on Windows 11  

---

## Defect Summary Dashboard

| Bug ID | Title | Severity | Priority | Component | Status |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **BUG-001** | Race condition on rapid double-clicking dispatches duplicate submissions | **Critical** | **P0** | Submission Engine | **Confirmed & Reproduced** |
| **BUG-002** | Whitespace-only string bypasses mandatory validation in Full Name & Cover Letter | **High** | **P1** | Form Validation | **Confirmed & Reproduced** |
| **BUG-003** | Undisclosed or zero salary field renders misleading "$0 - $0" badge | **Medium** | **P2** | Job Listings UI | **Confirmed & Reproduced** |
| **BUG-004** | Invalid role ID route (`/job/99999`) results in blank screen unhandled runtime exception | **High** | **P1** | Routing / Navigation | **Confirmed & Reproduced** |
| **BUG-005** | Network connection drop causes perpetual locked spinner without error message | **High** | **P1** | Error Handling | **Confirmed & Reproduced** |

---

## Detailed Bug Reports

### BUG-001: Race Condition on Rapid Double-Clicking Causes Duplicate Submissions

- **Bug ID:** BUG-001
- **Title:** Rapid consecutive clicking on "Submit Application" button sends multiple POST requests before button disable takes effect, creating duplicate applicant records
- **Severity:** **Critical** (Data corruption / Duplicate database transactions)
- **Priority:** **P0** (Blocker)
- **Component:** `frontend/app.js` -> `handleApplicationSubmit()` & `backend/server.js` -> `POST /api/applications`
- **Environment:** Google Chrome 131, Firefox 133, WebKit (Safari), Windows 11
- **Automated Regression Test:** `tests/06_bug_reproductions.spec.js` -> `BUG-001`

#### Description
When a candidate fills the job application form and rapidly double-clicks the "Submit Application" button (or clicks multiple times on high-latency mobile networks), the button's `disabled` property is not engaged synchronously before the second click event is queued. As a result, two concurrent HTTP `POST /api/applications` requests are dispatched to the backend. The backend processes both payloads in parallel, creating duplicate applicant records with identical details and firing duplicate confirmation sequences.

#### Steps to Reproduce
1. Navigate to any job posting (e.g. `http://localhost:3000/job/1`).
2. Fill all required fields with valid candidate data:
   - Full Name: `Michael Chang`
   - Email: `michael.chang@example.com`
   - Experience: `5`
   - Cover Letter: `Senior engineer with 5 years experience applying for the backend role.`
   - Check "I agree to the terms and privacy policy".
3. Open Browser DevTools -> Network tab.
4. Rapidly click the "Submit Application" button twice (within 50ms) OR dispatch programmatic double-click via Playwright:
   ```javascript
   await page.locator('#submit-btn').click({ clickCount: 2, delay: 10 });
   ```
5. Inspect the Network tab and database records.

#### Expected Result
- The button should immediately lock (`disabled="true"`) and debounce click events synchronously upon the initial interaction.
- Exactly **one** HTTP POST request should be dispatched.
- Only **one** candidate application should be created.
- Subsequent click attempts during in-flight network activity should be completely ignored.

#### Actual Result
- Two HTTP `POST /api/applications` requests are dispatched with status `200 OK`.
- Two unique application IDs are returned.
- Server logs reveal two identical records created for `michael.chang@example.com` on Job ID `1` within 18ms of each other.

#### Impact Analysis
In a production ATS, this causes severe operational friction:
- Duplicate candidate profiles in recruiter pipelines.
- Candidate receives two confirmation emails, reducing brand credibility.
- Race conditions in automated candidate screening pipelines.

#### Recommended Code Fix
Implement synchronous client-side debouncing and optimistic flag check at the beginning of the click handler, combined with backend database idempotency keys:
```javascript
// In frontend handler:
let isSubmitting = false;

async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return; // Immediate synchronous guard
  isSubmitting = true;
  
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.textContent = 'Submitting Application...';
  
  try {
    const response = await fetch('/api/applications', { /* ... */ });
    // handle response
  } finally {
    // re-enable only on handled error
  }
}
```

---

### BUG-002: Whitespace-Only String Bypasses Mandatory Validation in Required Fields

- **Bug ID:** BUG-002
- **Title:** Whitespace-only input in Full Name and Cover Letter fields passes client-side validation and submits blank candidate records
- **Severity:** **High** (Invalid data ingestion / Applicant quality degradation)
- **Priority:** **P1** (Critical)
- **Component:** `frontend/validation.js` -> `validateField()`
- **Environment:** All modern browsers (Chromium, Firefox, WebKit)
- **Automated Regression Test:** `tests/06_bug_reproductions.spec.js` -> `BUG-002`

#### Description
The client-side form validation checks string length using `value.length >= 2` for Full Name and `value.length >= 20` for Cover Letter, without invoking `.trim()`. Consequently, entering space characters (e.g., `"   "`) satisfies the length condition, permitting candidates to submit an application with no actual name or cover letter content.

#### Steps to Reproduce
1. Navigate to `http://localhost:3000/job/1`.
2. In the "Full Name" input, enter 5 spaces (`"     "`).
3. In the "Email Address" input, enter `valid.email@example.com`.
4. In the "Years of Experience" input, enter `4`.
5. In the "Cover Letter" input, enter 25 spaces (`"                         "`).
6. Check the terms checkbox.
7. Click "Submit Application".

#### Expected Result
- The application should trim inputs before evaluating length.
- Validation should reject the inputs and display:
  - *"Full Name cannot be empty or contain only whitespace."*
  - *"Cover Letter must contain at least 20 non-whitespace characters."*
- Form submission should be halted.

#### Actual Result
- The form passes client-side checks and dispatches the payload to the server.
- The applicant profile is saved with a blank name and empty cover letter string.

#### Impact Analysis
- Recruiter pipelines receive "nameless" candidate applications.
- Corrupts candidate search indexes and automated email personalization templates (e.g. "Dear , thank you for applying").

#### Recommended Code Fix
Sanitize and trim inputs before boundary evaluation:
```javascript
const trimmedName = fullNameInput.value.trim();
if (!trimmedName || trimmedName.length < 2) {
  showError('fullName', 'Please enter your full name (minimum 2 characters).');
  isValid = false;
}

const trimmedCover = coverLetterInput.value.trim();
if (!trimmedCover || trimmedCover.length < 20) {
  showError('coverLetter', 'Cover letter must contain at least 20 characters.');
  isValid = false;
}
```

---

### BUG-003: Undisclosed or Zero Salary Value Renders Misleading "$0 - $0" Badge

- **Bug ID:** BUG-003
- **Title:** Job postings with unspecified, zero, or unformatted salary ranges display as "$0 - $0" rather than "Competitive / Disclosed upon interview"
- **Severity:** **Medium** (UI / Candidate trust & transparency)
- **Priority:** **P2** (Major)
- **Component:** `frontend/components/jobCard.js` -> `formatSalary()`
- **Environment:** Cross-Browser UI
- **Automated Regression Test:** `tests/06_bug_reproductions.spec.js` -> `BUG-003`

#### Description
When a job posting does not have an explicit numeric salary range (e.g., `salaryMin: 0, salaryMax: 0` or undisclosed compensation), the frontend formatter blindly prefixes dollar signs: `formatSalary(min, max) => `$${min} - $${max}``. This produces a badge reading **"$0 - $0"** in the job card and job header.

#### Steps to Reproduce
1. Navigate to the job listings page `http://localhost:3000/`.
2. Locate a job posting with undisclosed salary or inspect a role configured with 0 base compensation.
3. Observe the compensation badge on the job card and role detail page.

#### Expected Result
- The UI should display a polished compensation badge:
  `"Competitive / Disclosed upon interview"` or `"Salary Commensurate with Experience"`.
- Zero values should never be rendered as literal `$0 - $0`.

#### Actual Result
- The badge displays literal `"$0 - $0"`, making the company appear as if it is offering an unpaid position or broken data.

#### Impact Analysis
- Reputational damage to the hiring organization.
- Candidate drop-off under the assumption that the role is unpaid or fraudulent.

#### Recommended Code Fix
```javascript
function formatSalary(min, max, currency = 'USD') {
  if (!min && !max) {
    return 'Competitive / Dependent on experience';
  }
  if (!min || min === 0) {
    return `Up to $${max.toLocaleString()}`;
  }
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
}
```

---

### BUG-004: Direct Navigation to Non-Existent Job ID Renders Blank Screen with Uncaught Exception

- **Bug ID:** BUG-004
- **Title:** Accessing non-existent job URL (`/job/99999`) throws uncaught TypeError and renders blank screen instead of friendly 404 page
- **Severity:** **High** (Broken Navigation / User dead-end)
- **Priority:** **P1** (Critical)
- **Component:** `frontend/router.js` & `frontend/pages/jobDetail.js`
- **Environment:** All Browsers
- **Automated Regression Test:** `tests/06_bug_reproductions.spec.js` -> `BUG-004`

#### Description
When a candidate navigates to an invalid job ID or clicks a link to an expired role (e.g. `http://localhost:3000/job/99999`), the router attempts to read properties of `undefined` (`job.title`) when populating the page DOM. This triggers an uncaught JavaScript `TypeError: Cannot read properties of undefined (reading 'title')`, halting execution and leaving the candidate staring at a blank white screen with no error feedback or way to navigate back.

#### Steps to Reproduce
1. In the browser address bar, navigate directly to `http://localhost:3000/job/99999`.
2. Open Browser DevTools Console.
3. Observe the rendered view and console logs.

#### Expected Result
- The application router should detect that the requested job ID was not found.
- A user-friendly 404 Error component should render with:
  - Header: *"Position No Longer Available"*
  - Description: *"The job you are looking for has either closed or does not exist."*
  - CTA Button: *"Browse All Active Openings"* linking back to `/`.
- Console should log a clean warning without unhandled runtime exceptions.

#### Actual Result
- Blank white page is rendered.
- Uncaught exception in console: `Uncaught TypeError: Cannot read properties of undefined (reading 'title') at renderJobDetail (jobDetail.js:14)`.
- No navigation buttons or home links are available.

#### Impact Analysis
- Dead-end user experience for candidates arriving from external job aggregators (LinkedIn, Indeed) after roles close.
- Candidate bounce rate increases by 100% on dead links.

#### Recommended Code Fix
```javascript
async function loadJobDetail(jobId) {
  const container = document.getElementById('app-root');
  try {
    const response = await fetch(`/api/jobs/${jobId}`);
    if (!response.ok || response.status === 404) {
      renderNotFound();
      return;
    }
    const job = await response.json();
    renderJobDetail(job);
  } catch (err) {
    renderNotFound();
  }
}

function renderNotFound() {
  document.getElementById('app-root').innerHTML = `
    <div class="error-container" data-testid="job-not-found">
      <h2>Role Not Found</h2>
      <p>The job you are looking for is no longer accepting applications.</p>
      <a href="/" class="btn-primary" data-testid="back-to-jobs-btn">← Browse Open Roles</a>
    </div>
  `;
}
```

---

### BUG-005: Network Connection Disconnect Leaves Form Stuck in Infinite Loading State Without Retry Action

- **Bug ID:** BUG-005
- **Title:** Network dropout during form submission causes unhandled promise rejection; submit button stays permanently disabled with no retry banner
- **Severity:** **High** (Resilience / Data loss)
- **Priority:** **P1** (Critical)
- **Component:** `frontend/app.js` -> `submitApplication()`
- **Environment:** All Browsers (Network Throttling / Offline)
- **Automated Regression Test:** `tests/06_bug_reproductions.spec.js` -> `BUG-005`

#### Description
If a candidate experiences an internet disconnect, timeout, or DNS failure while submitting their application, the `fetch()` call throws a `TypeError: Failed to fetch`. Because the request handler lacks an active `.catch()` block or `finally` block to re-enable the submit button, the button remains permanently disabled displaying `"Submitting Application..."`. The candidate is left unaware of whether the application succeeded or failed, and is unable to click retry without refreshing the page and losing all entered cover letter and contact details.

#### Steps to Reproduce
1. Navigate to `http://localhost:3000/job/1`.
2. Fill the application form with complete valid data.
3. In DevTools Network tab, set throttling to "Offline" (or simulate network drop).
4. Click "Submit Application".
5. Observe the submit button and page interface.

#### Expected Result
- The network exception is caught.
- A prominent error banner is displayed: *"Network connection lost. Please verify your connection and try again."*
- Form data remains populated and intact.
- Submit button is restored to its active clickable state (`disabled = false`) so the candidate can retry as soon as connectivity resumes.

#### Actual Result
- Uncaught (in promise) `TypeError: Failed to fetch` logged in console.
- Button remains disabled with text `"Submitting Application..."` indefinitely.
- Candidate cannot re-attempt submission without refreshing the page.

#### Impact Analysis
- Critical loss of candidate conversions, especially on mobile networks or spotty Wi-Fi.
- Candidate frustration from losing typed responses.

#### Recommended Code Fix
```javascript
try {
  const response = await fetch('/api/applications', { /* ... */ });
  // process success
} catch (networkError) {
  console.error('Submission failed due to network error:', networkError);
  showBanner('Unable to submit application due to a network connection issue. Your information has been preserved—please try again.', 'error');
} finally {
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');
  submitBtn.textContent = 'Submit Application';
}
```
