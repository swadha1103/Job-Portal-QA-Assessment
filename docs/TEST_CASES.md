# Test Cases: Job Application Portal
**Candidate:** QA Assessment Candidate  
**Total Test Cases:** 22 Cases (Covering Positive, Negative, and Boundary Scenarios)  
**Status:** All Scenarios Executed & Verified  

---

## Summary Matrix

| Category | Total Cases | Positive | Negative | Boundary | Automation Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Job Listings & Discovery** | 4 | 2 | 1 | 1 | Automated (Specs 1 & 6) |
| **Navigation & Routing** | 4 | 3 | 1 | 0 | Automated (Specs 1 & 6) |
| **Form Validation** | 7 | 2 | 3 | 2 | Automated (Specs 2 & 6) |
| **Submission Behavior & Concurrency** | 3 | 1 | 1 | 1 | Automated (Specs 3 & 6) |
| **Error Handling & Resilience** | 3 | 0 | 2 | 1 | Automated (Specs 4 & 6) |
| **Cross-Browser & Responsiveness** | 1 | 1 | 0 | 0 | Automated (Spec 5) |
| **Total** | **22** | **9** | **8** | **5** | **100% Covered** |

---

## Detailed Test Cases

### 1. Job Listings & Discovery

#### TC-001: Verify All Job Cards Render Complete Metadata
- **Type:** Positive
- **Priority:** P0 (Blocker)
- **Component:** Job Listings (`/`)
- **Preconditions:** Portal server running, database populated with active seed jobs.
- **Test Data:** Default seed jobs (Engineering, Design, Product).
- **Steps:**
  1. Navigate to the job listings homepage (`/`).
  2. Inspect each visible job card in the directory list.
  3. Verify presence of: Job Title, Department, Location (or Remote tag), Salary Range, Required Experience (Years), Type, and Description snippet.
- **Expected Result:** Every job card displays complete and correctly formatted information. No raw placeholders (e.g. `undefined`, `NaN`, `null`).
- **Actual Result:** Passed. All 6 seed jobs display complete metadata correctly.
- **Status:** **PASS**

---

#### TC-002: Verify Department and Experience Level Filtering
- **Type:** Positive
- **Priority:** P1 (Critical)
- **Component:** Job Listings (`/`)
- **Preconditions:** Candidate is on the homepage.
- **Test Data:** Department = `Engineering`, Experience Level = `Senior (5+ yrs)`.
- **Steps:**
  1. Open the Department dropdown and select `Engineering`.
  2. Open the Experience Level filter and select `Senior (5+ yrs)`.
  3. Observe the displayed job card list.
- **Expected Result:** List immediately updates to display only Engineering roles requiring 5+ years of experience. Job count counter matches the filtered count.
- **Actual Result:** Passed. Filtering functions synchronously and displays accurate subset.
- **Status:** **PASS**

---

#### TC-003: Verify Search with Non-Existent Query Shows Empty State
- **Type:** Negative
- **Priority:** P2 (Major)
- **Component:** Job Listings (`/`)
- **Preconditions:** Candidate is on the homepage.
- **Test Data:** Search keyword = `AstronautQuantumBiologist999`
- **Steps:**
  1. Click into the job search input field.
  2. Type `AstronautQuantumBiologist999`.
  3. Observe the results container.
- **Expected Result:** Job card list is hidden; a clear, friendly "No matching job openings found. Try adjusting your search or filters" message is displayed with a "Clear Filters" button.
- **Actual Result:** Passed. Zero results state renders cleanly with reset action.
- **Status:** **PASS**

---

#### TC-004: Verify Handling of Edge-Case Salary Values (Zero or Missing Formatting)
- **Type:** Boundary / Negative
- **Priority:** P2 (Major)
- **Component:** Job Listings (`/`)
- **Preconditions:** Job seed or API response contains role with salary formatted as `0` or numeric string without currency symbols.
- **Test Data:** Job entry with `salaryMin: 0` or missing currency format.
- **Steps:**
  1. Render job card with salary data.
  2. Verify currency formatting and range notation.
- **Expected Result:** If salary is undisclosed or competitive, UI displays "Competitive / Disclosed upon interview" or standard formatted currency `$X - $Y`. Raw `$0 - $0` or unformatted integers (`140000`) must not display.
- **Actual Result:** **DEFECT IDENTIFIED (BUG-003)**: Unformatted raw integer or `$0` renders if salary string lacks parser sanitization.
- **Status:** **FAIL (Logged as BUG-003)**

---

### 2. Navigation & Routing

#### TC-005: Verify Role Navigation from Job Card to Details View
- **Type:** Positive
- **Priority:** P0 (Blocker)
- **Component:** Navigation (`/` -> `/job/:id`)
- **Preconditions:** Homepage rendered with job listings.
- **Test Data:** Job ID `1` ("Senior Full Stack Engineer").
- **Steps:**
  1. Click "View Role & Apply" button on the Senior Full Stack Engineer card.
  2. Verify browser URL changes to `/job/1`.
  3. Verify the role detail page header displays "Senior Full Stack Engineer".
  4. Verify the job requirements, responsibilities, and application form are displayed.
- **Expected Result:** Route loads seamlessly, URL matches role ID, and all role-specific requirements are visible.
- **Actual Result:** Passed. Smooth navigation and full role data rendered.
- **Status:** **PASS**

---

#### TC-006: Verify Breadcrumb Navigation Returns to Listings with Intact State
- **Type:** Positive
- **Priority:** P1 (Critical)
- **Component:** Navigation Breadcrumbs
- **Preconditions:** Candidate is on `/job/1`.
- **Test Data:** Breadcrumb link "← Back to all jobs".
- **Steps:**
  1. Click the "← Back to all jobs" or "Home" breadcrumb link.
  2. Verify browser returns to `/`.
  3. Verify job listings are rendered and search/scroll state is preserved.
- **Expected Result:** Navigation returns to root homepage smoothly without page refresh errors.
- **Actual Result:** Passed. Correctly navigates back to job directory.
- **Status:** **PASS**

---

#### TC-007: Verify Direct Navigation to Non-Existent Role ID (404 Handling)
- **Type:** Negative / Boundary
- **Priority:** P1 (Critical)
- **Component:** Routing (`/job/99999`)
- **Preconditions:** Candidate enters deep-link with non-existent ID.
- **Test Data:** URL `http://localhost:3000/job/99999`.
- **Steps:**
  1. Direct browser navigation to `/job/99999`.
  2. Observe application response.
- **Expected Result:** Application displays a polished 404 "Job Not Found - The position you are looking for may have been filled or removed" page with a prominent "Browse Open Roles" link. No uncaught JavaScript exceptions or blank screen.
- **Actual Result:** **DEFECT IDENTIFIED (BUG-004)**: Unhandled route causes a blank container or cryptic script error when role ID is not in seed.
- **Status:** **FAIL (Logged as BUG-004)**

---

#### TC-008: Verify Browser Back/Forward History Buttons
- **Type:** Positive
- **Priority:** P2 (Major)
- **Component:** Navigation & History API
- **Preconditions:** Candidate navigated from `/` to `/job/1` and then to `/job/2`.
- **Steps:**
  1. Click browser Back button.
  2. Verify current view is `/job/1`.
  3. Click browser Back button again.
  4. Verify current view is `/`.
  5. Click browser Forward button.
  6. Verify view restores to `/job/1`.
- **Expected Result:** History stack responds accurately to browser navigation actions without state corruption.
- **Actual Result:** Passed.
- **Status:** **PASS**

---

### 3. Application Form Validation

#### TC-009: Verify Successful Validation with Valid Data
- **Type:** Positive
- **Priority:** P0 (Blocker)
- **Component:** Application Form
- **Preconditions:** Candidate is on `/job/1`.
- **Test Data:**
  - Full Name: `Jane Doe`
  - Email: `jane.doe@example.com`
  - Phone: `+1-555-019-2834`
  - Experience: `6`
  - Cover Letter: `I am highly interested in this senior engineering role and bring 6 years of distributed systems experience.`
  - Resume: Valid PDF (`sample_resume.pdf`)
  - Terms Checkbox: Checked (`true`)
- **Steps:**
  1. Fill in all fields with valid data.
  2. Click "Submit Application".
- **Expected Result:** Form passes all client-side and server-side validation checks; submission spinner displays, followed by confirmation dialog.
- **Actual Result:** Passed.
- **Status:** **PASS**

---

#### TC-010: Verify Validation Errors on Missing Required Fields
- **Type:** Negative
- **Priority:** P0 (Blocker)
- **Component:** Application Form
- **Preconditions:** Candidate is on `/job/1` with empty form.
- **Test Data:** All fields left blank.
- **Steps:**
  1. Leave Full Name, Email, Experience, Cover Letter empty. Leave Terms unchecked.
  2. Click "Submit Application".
- **Expected Result:** Form submission is blocked. Inline error alerts appear under each mandatory field (`Full Name is required`, `Valid email is required`, `Years of experience is required`, `Cover letter is required`, `You must agree to terms`). Focus shifts to the first invalid field.
- **Actual Result:** Passed. Inline validation flags trigger for all required fields.
- **Status:** **PASS**

---

#### TC-011: Verify Email Format Validation (RFC 5322 & Malformed Inputs)
- **Type:** Negative
- **Priority:** P1 (Critical)
- **Component:** Form Validation (`email`)
- **Preconditions:** Candidate is on application form.
- **Test Data:**
  - Case A: `plainaddress` (Missing `@` and domain)
  - Case B: `@missingusername.com` (Missing username)
  - Case C: `candidate@.com` (Missing domain label)
  - Case D: `candidate@domain` (Missing Top Level Domain)
  - Case E: `candidate user@domain.com` (Contains space)
- **Steps:**
  1. Enter test email address into the Email field.
  2. Trigger blur or click "Submit Application".
  3. Verify whether validation passes or fails.
- **Expected Result:** Form blocks submission for all malformed cases and displays "Please enter a valid email address (e.g., name@example.com)".
- **Actual Result:** Passed. Strict regex and RFC format validation catches malformed inputs.
- **Status:** **PASS**

---

#### TC-012: Verify Whitespace-Only Input Rejection in Required Fields
- **Type:** Negative / Boundary
- **Priority:** P1 (Critical)
- **Component:** Form Validation (`fullName`, `coverLetter`)
- **Preconditions:** Candidate is on application form.
- **Test Data:**
  - Full Name: `"      "` (6 spaces)
  - Cover Letter: `"                    "` (20 spaces)
- **Steps:**
  1. Input whitespace-only into Full Name and Cover Letter fields.
  2. Fill other fields with valid values.
  3. Click "Submit Application".
- **Expected Result:** Form trims input before validation. Form blocks submission and displays "Full Name cannot consist solely of whitespace" and "Cover Letter cannot consist solely of whitespace".
- **Actual Result:** **DEFECT IDENTIFIED (BUG-002)**: Without `.trim()` in raw client validation, string length check (`length >= 2`) evaluated whitespace as valid, allowing blank candidate names to pass to backend.
- **Status:** **FAIL (Logged as BUG-002)**

---

#### TC-013: Boundary Analysis on Experience Field
- **Type:** Boundary
- **Priority:** P1 (Critical)
- **Component:** Form Validation (`experience`)
- **Preconditions:** Candidate is on application form.
- **Test Data:**
  - Case A: `-1` (Negative boundary - Invalid)
  - Case B: `0` (Minimum boundary - Valid for entry-level/intern)
  - Case C: `1` (Min+1 - Valid)
  - Case D: `50` (Max boundary - Valid)
  - Case E: `51` (Max+1 boundary - Invalid)
  - Case F: `e`, `abc`, `NaN` (Non-numeric characters - Invalid)
- **Steps:**
  1. Enter each value into the Experience (years) input field.
  2. Attempt submission.
- **Expected Result:** `0` and `50` pass validation. Values `< 0`, `> 50`, or non-numeric strings trigger error "Years of experience must be between 0 and 50".
- **Actual Result:** Passed with boundary validation rules.
- **Status:** **PASS**

---

#### TC-014: Boundary Analysis on Cover Letter Length
- **Type:** Boundary
- **Priority:** P2 (Major)
- **Component:** Form Validation (`coverLetter`)
- **Preconditions:** Candidate is on application form.
- **Test Data:**
  - Case A: 19 characters (`"Short intro letter!"`) -> Below minimum
  - Case B: 20 characters (`"I am excited to app!"`) -> Exactly minimum boundary
  - Case C: 2000 characters -> Exactly maximum boundary
  - Case D: 2001 characters -> Exceeds maximum boundary
- **Steps:**
  1. Enter test string into Cover Letter.
  2. Verify character counter and validation trigger.
- **Expected Result:** 19 characters rejected with "Cover letter must be at least 20 characters". 20 and 2000 characters accepted. >2000 characters truncated or rejected with max character limit warning.
- **Actual Result:** Passed. Character count indicator and validation boundaries verified.
- **Status:** **PASS**

---

#### TC-015: File Upload Type and Size Restrictions
- **Type:** Negative / Security
- **Priority:** P1 (Critical)
- **Component:** Resume Upload (`resume`)
- **Preconditions:** Candidate is on application form.
- **Test Data:**
  - Case A: Executable file (`malicious_payload.exe`)
  - Case B: Oversized file (6.2 MB PDF)
  - Case C: Valid PDF (250 KB `.pdf`)
- **Steps:**
  1. Attempt uploading Case A (`.exe`). Verify validation.
  2. Attempt uploading Case B (6.2 MB). Verify validation.
  3. Upload Case C (valid PDF). Verify validation.
- **Expected Result:** Case A rejected with "Only .pdf, .doc, and .docx files are permitted". Case B rejected with "Resume file size must not exceed 5MB". Case C accepted with file name and size preview.
- **Actual Result:** Passed.
- **Status:** **PASS**

---

### 4. Submission Behavior & Concurrency

#### TC-016: Verify Successful Application Submission and Confirmation
- **Type:** Positive
- **Priority:** P0 (Blocker)
- **Component:** Submission Flow
- **Preconditions:** Candidate filled valid data for job ID `1`.
- **Steps:**
  1. Click "Submit Application".
  2. Wait for submission network request to complete.
- **Expected Result:** 
  1. Success modal / confirmation banner displays: "Application Submitted Successfully!".
  2. Unique Application Reference Code is generated (e.g., `APP-2026-XXXX`).
  3. Confirmation summary displays candidate email and applied role.
  4. Form is cleared or locked against re-submission.
- **Actual Result:** Passed.
- **Status:** **PASS**

---

#### TC-017: Verify Accidental Rapid Double-Clicking Prevention
- **Type:** Negative / Concurrency
- **Priority:** P0 (Blocker)
- **Component:** Submission Debouncing / Button Disabling
- **Preconditions:** Candidate has filled valid application data.
- **Test Data:** Two click events triggered within 20 milliseconds on "Submit Application".
- **Steps:**
  1. Fill form with valid candidate information.
  2. Trigger two rapid successive click events on "Submit Application" button.
  3. Monitor browser network requests and server access logs.
- **Expected Result:** Button is immediately disabled with `disabled="true"` attribute and loading spinner on the first click. Only ONE POST request is dispatched to the backend. No duplicate submission error or duplicate record created.
- **Actual Result:** **DEFECT IDENTIFIED (BUG-001)**: If network has brief latency and button disabling does not engage synchronously on `mousedown`/first click tick, two duplicate POST requests are dispatched, causing race condition.
- **Status:** **FAIL (Logged as BUG-001)**

---

#### TC-018: Verify Duplicate Submission Handling for Same Role & Email
- **Type:** Negative / Data Integrity
- **Priority:** P0 (Blocker)
- **Component:** Submission API & Duplicate Detection
- **Preconditions:** Candidate `alex.turner@example.com` has previously submitted an application for Job ID `1`.
- **Test Data:** Same email `alex.turner@example.com` applying for Job ID `1` again.
- **Steps:**
  1. Fill form with `alex.turner@example.com` on Job ID `1`.
  2. Click "Submit Application".
- **Expected Result:** System detects duplicate submission. Backend returns HTTP 409 Conflict. Frontend displays clear message: "You have already submitted an application for this role. Our recruitment team is reviewing your profile."
- **Actual Result:** Passed. Duplicate submission correctly intercepted with HTTP 409 and user-friendly notice.
- **Status:** **PASS**

---

### 5. Error Handling & Network Resilience

#### TC-019: Verify Graceful Recovery on HTTP 500 Server Error
- **Type:** Negative / Error Handling
- **Priority:** P1 (Critical)
- **Component:** API Error Interception (`/api/applications`)
- **Preconditions:** Candidate has filled application form.
- **Test Data:** Mocked HTTP 500 Internal Server Error response.
- **Steps:**
  1. Intercept `/api/applications` to respond with HTTP 500 `{ error: "Internal Server Error" }`.
  2. Click "Submit Application".
- **Expected Result:**
  1. Application displays non-disruptive, prominent error banner: "Server error occurred while submitting your application. Please try again in a few moments."
  2. Candidate's entered form data (Name, Email, Cover Letter) is PRESERVED (not wiped out).
  3. Submit button re-enables allowing the candidate to retry without retyping their entire application.
- **Actual Result:** Passed. Form inputs preserved and actionable retry banner displayed.
- **Status:** **PASS**

---

#### TC-020: Verify Network Failure / Offline Connectivity Handling
- **Type:** Negative / Network Chaos
- **Priority:** P1 (Critical)
- **Component:** Network Interception
- **Preconditions:** Candidate filled application form.
- **Test Data:** Aborted network request (`failed('internetdisconnected')`).
- **Steps:**
  1. Simulate network disconnect / route abort on `/api/applications`.
  2. Click "Submit Application".
- **Expected Result:** Application catches network failure, presents candidate-friendly banner: "Network connection lost. Please check your internet connection and try again", and keeps all inputs intact.
- **Actual Result:** **DEFECT IDENTIFIED (BUG-005)**: Unhandled promise rejection if fetch fails without try/catch wrapper, leaving button in perpetual "Submitting..." disabled state.
- **Status:** **FAIL (Logged as BUG-005)**

---

#### TC-021: Verify UI Feedback on Slow Network Latency (>3 Seconds)
- **Type:** Boundary / Latency
- **Priority:** P2 (Major)
- **Component:** Network Latency Simulation
- **Preconditions:** Candidate clicks submit on high latency connection.
- **Test Data:** 3000ms server response delay.
- **Steps:**
  1. Add 3-second delay to backend application endpoint.
  2. Click "Submit Application".
  3. Observe UI state during the 3-second delay.
- **Expected Result:** Submit button transitions to "Submitting Application..." state with animated loading spinner. Button remains disabled. No UI freezing occurs. After 3 seconds, success modal displays normally.
- **Actual Result:** Passed. UI provides clear loading feedback throughout the delay.
- **Status:** **PASS**

---

### 6. Cross-Browser & Responsiveness

#### TC-022: Verify Form and Directory Layout across Desktop and Mobile Viewports
- **Type:** Positive
- **Priority:** P1 (Critical)
- **Component:** Responsive Design (Desktop 1280x720, Mobile 375x667)
- **Preconditions:** Application rendered on varying viewport dimensions.
- **Steps:**
  1. Render application at 1280x720 (Desktop Chromium, Firefox, WebKit).
  2. Render application at 375x667 (Mobile device emulation).
  3. Test job card stacking, filter dropdowns, and form input usability.
- **Expected Result:** No horizontal scroll overflow on mobile viewports. Form inputs expand to 100% width with touch-friendly tap targets (minimum 44px). Job cards stack cleanly into single-column layout.
- **Actual Result:** Passed. Clean responsive layout across desktop and mobile form factors.
- **Status:** **PASS**
