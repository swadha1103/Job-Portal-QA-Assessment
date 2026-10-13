/**
 * TalentCraft Careers Portal - Main Application Controller
 */

window.App = (function () {
  let allJobs = [];
  let currentJob = null;
  let isSubmitting = false;

  // Initialize defect flags from URL search params if present
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('bug') === 'BUG-001') window.__SIMULATE_BUG_001 = true;
  if (urlParams.get('bug') === 'BUG-002') window.__SIMULATE_BUG_002 = true;
  if (urlParams.get('bug') === 'BUG-003') window.__SIMULATE_BUG_003 = true;
  if (urlParams.get('bug') === 'BUG-004') window.__SIMULATE_BUG_004 = true;
  if (urlParams.get('bug') === 'BUG-005') window.__SIMULATE_BUG_005 = true;

  // DOM Elements
  const jobsView = document.getElementById('jobs-view');
  const jobDetailView = document.getElementById('job-detail-view');
  const notFoundView = document.getElementById('not-found-view');
  const jobsGrid = document.getElementById('jobs-grid');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const headerJobsBadge = document.getElementById('header-jobs-badge');

  // Filter Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterDept = document.getElementById('filter-department');
  const filterExp = document.getElementById('filter-experience');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const emptyResetBtn = document.getElementById('empty-reset-btn');

  // Form Elements
  const applicationForm = document.getElementById('application-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const formAlert = document.getElementById('form-alert');
  const formAlertTitle = document.getElementById('form-alert-title');
  const formAlertMessage = document.getElementById('form-alert-message');
  const formAlertClose = document.getElementById('form-alert-close');
  const coverLetterInput = document.getElementById('coverLetter');
  const charCounter = document.getElementById('char-counter');
  const resumeInput = document.getElementById('resume');
  const fileDropArea = document.getElementById('file-drop-area');
  const fileStatusText = document.getElementById('file-status-text');

  // Modal Elements
  const successModal = document.getElementById('success-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  /* ========================================================================
     Salary Formatter (with BUG-003 handling)
     ======================================================================== */
  function formatSalary(job) {
    if (window.__SIMULATE_BUG_003 === true) {
      // BUG-003: Naively prints raw $0 - $0 or unformatted numbers without checking validity
      return `$${job.salaryMin || 0} - $${job.salaryMax || 0}`;
    }

    if (!job.salaryMin && !job.salaryMax) {
      return 'Competitive / Dependent on experience';
    }
    if (!job.salaryMin || job.salaryMin === 0) {
      return `Up to $${(job.salaryMax || 0).toLocaleString()} ${job.salaryCurrency || 'USD'}`;
    }
    return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()} ${job.salaryCurrency || 'USD'}`;
  }

  /* ========================================================================
     Initialization
     ======================================================================== */
  async function init() {
    setupEventListeners();
    await loadJobs();
    Router.handleRouteChange();
  }

  function setupEventListeners() {
    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
        }
        applyFilters();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
      });
    }

    // Filter dropdowns
    if (filterDept) filterDept.addEventListener('change', applyFilters);
    if (filterExp) filterExp.addEventListener('change', applyFilters);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

    // Breadcrumb navigation
    const breadcrumbHome = document.getElementById('breadcrumb-home');
    if (breadcrumbHome) {
      breadcrumbHome.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigateTo('/');
      });
    }

    const brandLogo = document.getElementById('brand-logo');
    if (brandLogo) {
      brandLogo.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigateTo('/');
      });
    }

    const navJobs = document.getElementById('nav-jobs');
    if (navJobs) {
      navJobs.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigateTo('/');
      });
    }

    // Cover letter character count
    if (coverLetterInput && charCounter) {
      coverLetterInput.addEventListener('input', () => {
        const len = coverLetterInput.value.length;
        charCounter.textContent = `${len} / 2000`;
      });
    }

    // Resume file upload
    if (resumeInput && fileDropArea) {
      resumeInput.addEventListener('change', handleFileChange);
    }

    // Form submission
    if (applicationForm) {
      applicationForm.addEventListener('submit', handleFormSubmit);
    }

    // Real-time inline field validation on blur
    const validatedFields = ['fullName', 'email', 'phone', 'experience', 'coverLetter', 'termsAccepted'];
    validatedFields.forEach(fieldName => {
      const el = document.getElementById(fieldName);
      if (el) {
        el.addEventListener('blur', () => {
          const val = el.type === 'checkbox' ? el.checked : el.value;
          const err = FormValidator.validateField(fieldName, val);
          setFieldError(fieldName, err);
        });
        el.addEventListener('input', () => {
          if (el.classList.contains('has-error')) {
            const val = el.type === 'checkbox' ? el.checked : el.value;
            const err = FormValidator.validateField(fieldName, val);
            setFieldError(fieldName, err);
          }
        });
      }
    });

    // Form Alert close
    if (formAlertClose) {
      formAlertClose.addEventListener('click', () => {
        formAlert.style.display = 'none';
      });
    }

    // Modal close
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        successModal.style.display = 'none';
        Router.navigateTo('/');
      });
    }

    // Not found back button
    const notFoundBackBtn = document.getElementById('not-found-back-btn');
    if (notFoundBackBtn) {
      notFoundBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigateTo('/');
      });
    }
  }

  /* ========================================================================
     Jobs Data & Rendering
     ======================================================================== */
  async function loadJobs() {
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      allJobs = data.jobs || [];
      if (headerJobsBadge) {
        headerJobsBadge.textContent = `${allJobs.length} Open Roles`;
      }
      renderJobsGrid(allJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      if (jobsGrid) {
        jobsGrid.innerHTML = `<div class="alert-banner alert-danger">Unable to load job positions. Please refresh.</div>`;
      }
    }
  }

  function renderJobsGrid(jobs) {
    if (!jobsGrid) return;
    jobsGrid.innerHTML = '';

    if (jobs.length === 0) {
      jobsGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (resultsCount) resultsCount.textContent = 'Showing 0 open positions';
      return;
    }

    jobsGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    if (resultsCount) resultsCount.textContent = `Showing ${jobs.length} open position${jobs.length === 1 ? '' : 's'}`;

    jobs.forEach(job => {
      const card = document.createElement('article');
      card.className = 'job-card';
      card.setAttribute('data-testid', `job-card-${job.id}`);

      const salaryString = formatSalary(job);

      card.innerHTML = `
        <div class="job-card-header">
          <div class="job-card-badges">
            <span class="badge badge-dept" data-testid="job-dept-${job.id}">${job.department}</span>
            <span class="badge badge-type">${job.type}</span>
            <span class="badge badge-location">${job.location}</span>
          </div>
          <h3 class="job-card-title" data-testid="job-title-${job.id}">${job.title}</h3>
          <div class="job-card-meta">
            <div class="job-meta-item">
              <span class="job-salary-highlight" data-testid="job-salary-${job.id}">${salaryString}</span>
            </div>
            <div class="job-meta-item">
              <span data-testid="job-exp-${job.id}">⏱ ${job.experienceLabel}</span>
            </div>
          </div>
        </div>
        <p class="job-card-desc" data-testid="job-desc-${job.id}">${job.description}</p>
        <div class="job-card-footer">
          <button type="button" class="btn btn-primary btn-block" data-testid="view-job-${job.id}" onclick="App.navigateToJob(${job.id})">
            View Role & Apply →
          </button>
        </div>
      `;

      jobsGrid.appendChild(card);
    });
  }

  function applyFilters() {
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const dept = filterDept ? filterDept.value : 'all';
    const minExp = filterExp && filterExp.value !== '' ? parseInt(filterExp.value, 10) : null;

    let filtered = [...allJobs];

    if (dept !== 'all') {
      filtered = filtered.filter(j => j.department === dept);
    }

    if (minExp !== null) {
      filtered = filtered.filter(j => j.experience >= minExp);
    }

    if (q) {
      filtered = filtered.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q)
      );
    }

    renderJobsGrid(filtered);
  }

  function resetFilters() {
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    if (filterDept) filterDept.value = 'all';
    if (filterExp) filterExp.value = '';
    renderJobsGrid(allJobs);
  }

  /* ========================================================================
     Routing & View Switching
     ======================================================================== */
  function navigateToJob(jobId) {
    Router.navigateTo(`/job/${jobId}`);
  }

  async function onRouteChanged(route) {
    // Hide all views first
    if (jobsView) jobsView.style.display = 'none';
    if (jobDetailView) jobDetailView.style.display = 'none';
    if (notFoundView) notFoundView.style.display = 'none';

    if (route.view === 'directory') {
      if (jobsView) jobsView.style.display = 'block';
      window.scrollTo(0, 0);
    } else if (route.view === 'detail') {
      await showJobDetail(route.jobId);
    } else {
      showNotFound();
    }
  }

  async function showJobDetail(jobId) {
    let job = allJobs.find(j => j.id === jobId);

    if (!job) {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          job = await res.json();
        }
      } catch (e) {
        // network failure
      }
    }

    // BUG-004 Simulation: Accessing property on undefined throws runtime error
    if (window.__SIMULATE_BUG_004 === true && !job) {
      console.error('Triggering BUG-004 unhandled runtime TypeError');
      // Intentionally accessing property on undefined to trigger defect:
      const badAccess = job.title;
      return;
    }

    if (!job) {
      showNotFound();
      return;
    }

    currentJob = job;

    // Populate detail DOM
    document.getElementById('breadcrumb-department').textContent = job.department;
    document.getElementById('breadcrumb-title').textContent = job.title;

    document.getElementById('detail-dept-badge').textContent = job.department;
    document.getElementById('detail-type-badge').textContent = job.type;
    document.getElementById('detail-location-badge').textContent = job.location;
    document.getElementById('detail-title').textContent = job.title;
    document.getElementById('detail-salary').textContent = formatSalary(job);
    document.getElementById('detail-experience').textContent = job.experienceLabel;
    document.getElementById('detail-description').textContent = job.description;

    populateList('detail-responsibilities', job.responsibilities || []);
    populateList('detail-requirements', job.requirements || []);
    populateList('detail-benefits', job.benefits || []);

    // Set hidden field
    document.getElementById('applied-job-id').value = job.id;

    // Reset Form state
    resetFormErrors();
    if (formAlert) formAlert.style.display = 'none';

    if (jobDetailView) jobDetailView.style.display = 'block';
    window.scrollTo(0, 0);
  }

  function populateList(elementId, items) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      el.appendChild(li);
    });
  }

  function showNotFound() {
    if (jobsView) jobsView.style.display = 'none';
    if (jobDetailView) jobDetailView.style.display = 'none';
    if (notFoundView) notFoundView.style.display = 'block';
    window.scrollTo(0, 0);
  }

  /* ========================================================================
     Form Handling & Submission
     ======================================================================== */
  function handleFileChange() {
    if (!resumeInput || !resumeInput.files || resumeInput.files.length === 0) return;
    const file = resumeInput.files[0];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    const isValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExt) {
      setFieldError('resume', 'Invalid file type. Only .pdf, .doc, and .docx files are permitted.');
      resumeInput.value = '';
      if (fileStatusText) fileStatusText.textContent = 'Click or drag & drop resume file';
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setFieldError('resume', 'File size exceeds 5MB limit. Please upload a smaller file.');
      resumeInput.value = '';
      if (fileStatusText) fileStatusText.textContent = 'Click or drag & drop resume file';
      return;
    }

    setFieldError('resume', null);
    if (fileStatusText) {
      fileStatusText.textContent = `Attached: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    }
  }

  function setFieldError(fieldName, errorMessage) {
    const errEl = document.getElementById(`error-${fieldName}`);
    const inputEl = document.getElementById(fieldName);
    if (errEl) {
      errEl.textContent = errorMessage || '';
    }
    if (inputEl) {
      if (errorMessage) {
        inputEl.classList.add('has-error');
      } else {
        inputEl.classList.remove('has-error');
      }
    }
  }

  function resetFormErrors() {
    const fields = ['fullName', 'email', 'phone', 'experience', 'linkedin', 'coverLetter', 'resume', 'termsAccepted'];
    fields.forEach(f => setFieldError(f, null));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    // BUG-001 Simulation Guard:
    // If BUG-001 simulation is ON, do NOT debounce or synchronously lock button.
    const isSimulatingBug1 = window.__SIMULATE_BUG_001 === true;

    if (!isSimulatingBug1 && isSubmitting) {
      console.warn('Submission already in progress. Ignoring repeated click.');
      return;
    }

    // Extract Form Values
    const formData = new FormData(applicationForm);
    const formValues = {
      jobId: formData.get('jobId'),
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      experience: formData.get('experience'),
      linkedin: formData.get('linkedin'),
      coverLetter: formData.get('coverLetter'),
      termsAccepted: formData.get('termsAccepted') === 'on' || formData.get('termsAccepted') === true
    };

    // Client-side validation
    const validationResult = FormValidator.validateAll(formValues);
    if (!validationResult.isValid) {
      for (const [field, err] of Object.entries(validationResult.errors)) {
        setFieldError(field, err);
      }
      showFormAlert('Please fix the highlighted errors before submitting.', 'danger');
      return;
    }

    resetFormErrors();
    if (formAlert) formAlert.style.display = 'none';

    // Set Submitting State (Synchronous lock in standard mode)
    if (!isSimulatingBug1) {
      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnSpinner) btnSpinner.style.display = 'inline-block';
        if (btnText) btnText.textContent = 'Submitting Application...';
      }
    }

    // BUG-005 Simulation: Missing try/catch and finally block
    if (window.__SIMULATE_BUG_005 === true) {
      // Unhandled promise rejection on network failure
      const payload = {
        ...formValues,
        bugMode: window.__SIMULATE_BUG_002 ? 'BUG_002' : undefined
      };
      // Fetch without .catch() or finally
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return handleSuccess(data);
    }

    // Standard Resilient Implementation
    try {
      const payload = {
        ...formValues,
        bugMode: isSimulatingBug1 ? 'BUG_001_ALLOW_DUPE' : (window.__SIMULATE_BUG_002 ? 'BUG_002' : undefined)
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 201) {
        handleSuccess(data);
      } else if (response.status === 409) {
        showFormAlert(data.message || 'You have already submitted an application for this position.', 'warning');
      } else if (response.status === 400) {
        if (data.errors) {
          for (const [field, err] of Object.entries(data.errors)) {
            setFieldError(field, err);
          }
        }
        showFormAlert(data.error || 'Validation failed on server.', 'danger');
      } else {
        showFormAlert('Server error occurred while submitting your application. Please try again.', 'danger');
      }
    } catch (networkError) {
      console.error('Network submission failure:', networkError);
      showFormAlert('Network connection issue. Your details have been preserved—please try again.', 'danger');
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        if (btnSpinner) btnSpinner.style.display = 'none';
        if (btnText) btnText.textContent = 'Submit Application';
      }
    }
  }

  function handleSuccess(data) {
    if (applicationForm) applicationForm.reset();
    if (charCounter) charCounter.textContent = '0 / 2000';
    if (fileStatusText) fileStatusText.textContent = 'Click or drag & drop resume file';

    // Populate receipt
    document.getElementById('receipt-id').textContent = data.applicationId || 'APP-2026-CONFIRMED';
    document.getElementById('receipt-role').textContent = currentJob ? currentJob.title : 'Selected Role';
    document.getElementById('receipt-email').textContent = (data.record && data.record.email) || 'Applicant Email';

    if (successModal) successModal.style.display = 'flex';
  }

  function showFormAlert(message, type = 'danger') {
    if (!formAlert) return;
    formAlert.className = `alert-banner alert-${type}`;
    if (formAlertTitle) {
      formAlertTitle.textContent = type === 'danger' ? 'Submission Error' : (type === 'warning' ? 'Notice' : 'Success');
    }
    if (formAlertMessage) formAlertMessage.textContent = message;
    formAlert.style.display = 'flex';
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    navigateToJob,
    onRouteChanged,
    formatSalary
  };
})();
