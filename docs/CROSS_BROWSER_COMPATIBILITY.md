# Cross-Browser & Multi-Device Compatibility Evaluation
**Candidate:** QA Assessment Candidate  
**Target:** Desktop (Chrome, Firefox, Safari) & Mobile (iOS, Android)  

---

## 1. Objective & Scope

Job applicants use a wide spectrum of operating systems, hardware form factors, and browser rendering engines. This document establishes the key cross-browser compatibility checks, risk vectors, matrix of supported environments, and automated verification strategy for the Job Application Portal.

---

## 2. Browser Engine Matrix & Support Tiers

| Engine | Primary Browsers | Market Share Target | Support Tier | Validation Scope |
| :--- | :--- | :---: | :---: | :--- |
| **Blink / Chromium** | Google Chrome, MS Edge, Brave, Opera | ~66% | **Tier 1 (Primary)** | Full automation, visual layout, network simulation, strict accessibility |
| **Gecko** | Mozilla Firefox | ~3.5% | **Tier 1 (Primary)** | Layout rendering, form control validation pseudo-classes (`:user-invalid`), history navigation |
| **WebKit** | Apple Safari (macOS & iOS) | ~19% | **Tier 1 (Primary)** | CSS flexbox/grid calculation, iOS virtual keyboard overlay, date/file pickers, date formatting |
| **Chromium Mobile** | Chrome for Android | ~10% | **Tier 1 (Primary)** | Touch target boundaries (minimum 44x44px), viewport zoom resilience, orientation change |

---

## 3. High-Priority Compatibility Vectors & Test Checks

### 3.1 Form Controls & Input Pseudo-Classes
- **Risk:** Different rendering engines handle HTML5 validation balloons differently. For example, Firefox displays native tooltips on `:invalid` fields upon submit, while Safari has historically exhibited quirks in suppressing native bubbles when custom JS validation executes.
- **Verification Check:** Ensure custom accessible error banners and ARIA live regions (`role="alert"`, `aria-describedby`) are rendered uniformly across all browsers rather than relying solely on engine-dependent HTML5 validation bubbles.

### 3.2 File Upload & Drag-and-Drop (`<input type="file">`)
- **Risk:** Safari on iOS enforces strict sandboxed file access (allowing photo library or iCloud Drive), while desktop browsers provide standard system file explorer dialogs. File MIME type detection can differ (e.g. `application/pdf` vs extension `.pdf`).
- **Verification Check:** Verify that resume upload accepts both MIME types and file extensions (`.pdf`, `.doc`, `.docx`), displays the selected file name cleanly, and provides a clear "Remove/Replace file" button.

### 3.3 CSS Grid & Flexbox Alignment on Mobile Viewports
- **Risk:** On narrow mobile screens (<375px), two-column forms can cause horizontal overflow or unreadable text wrapping if flex shrink or min-width boundaries are not defensive.
- **Verification Check:** Ensure all form fields dynamically collapse to 100% width on viewports ≤ 768px, eliminating horizontal scrolling (`overflow-x: hidden`).

### 3.4 Button Debouncing & Double-Click Timing Across Input Devices
- **Risk:** Touch screens often trigger rapid touch events ("tap bouncing") or synthetic mouse clicks that differ in timing from desktop physical mouse clicks.
- **Verification Check:** Synchronous debouncing and disabling of the submit button must fire uniformly on both touch interactions (`touchstart`/`touchend`) and pointer events (`click`).

### 3.5 Viewport Height (`100vh` vs `100dvh`) with Mobile Virtual Keyboard
- **Risk:** On iOS Safari and Chrome Android, popping up the on-screen software keyboard resizes the visible viewport, which can obscure the active input field or submit button if fixed/sticky headers or absolute footers are used.
- **Verification Check:** Utilize modern dynamic viewport units (`100dvh`) and standard document scroll flow, ensuring the active focused field remains scrolled into view when the mobile keyboard appears.

### 3.6 Color Contrast & Dark/Light System Preferences (`prefers-color-scheme`)
- **Risk:** High-contrast modes on Windows and dark mode on macOS/iOS can cause text legibility issues if colors are hardcoded without CSS variable fallback tokens.
- **Verification Check:** Verify WCAG 2.1 AA compliant contrast ratios (minimum 4.5:1 for body copy and 3:1 for large headings) in all modes.

---

## 4. Automated Cross-Browser Test Matrix

The automated Playwright test suite (`playwright.config.js`) tests the application against:
1. **Desktop Chromium** (1280x720, Default DPR)
2. **Desktop Firefox** (1280x720)
3. **Desktop WebKit** (1280x720, Safari engine)
4. **Mobile Chrome** (Pixel 5 emulation, 393x851, Touch enabled)
5. **Mobile Safari** (iPhone 13 emulation, 390x844, Touch enabled)

All 5 browser targets execute the high-priority suites to ensure zero regressions across rendering engines.
