const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Load Jobs Data
const jobsFilePath = path.join(__dirname, 'data', 'jobs.json');
let jobsData = [];
try {
  jobsData = JSON.parse(fs.readFileSync(jobsFilePath, 'utf8'));
} catch (err) {
  console.error('Error loading jobs.json:', err);
}

// In-Memory Database for Candidate Submissions
let applications = [];

// Helper: RFC 5322 Email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// API: Get all jobs with optional filters
app.get('/api/jobs', (req, res) => {
  const { department, experienceMin, search } = req.query;
  let results = [...jobsData];

  if (department && department !== 'all') {
    results = results.filter(j => j.department.toLowerCase() === department.toLowerCase());
  }

  if (experienceMin !== undefined && experienceMin !== '') {
    const minExp = parseInt(experienceMin, 10);
    if (!isNaN(minExp)) {
      results = results.filter(j => j.experience >= minExp);
    }
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.department.toLowerCase().includes(q)
    );
  }

  res.json({
    total: results.length,
    jobs: results
  });
});

// API: Get single job by ID
app.get('/api/jobs/:id', (req, res) => {
  const jobId = parseInt(req.params.id, 10);
  const job = jobsData.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job position not found',
      message: `No active role matches ID ${req.params.id}`
    });
  }

  res.json(job);
});

// API: Submit Application
app.post('/api/applications', async (req, res) => {
  // Support error simulation headers for resilience testing
  const simulateError = req.headers['x-simulate-error'] || req.body.simulateError;
  if (simulateError === '500') {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Simulated backend database failure during transaction write.'
    });
  }

  const simulateDelay = parseInt(req.headers['x-simulate-delay'] || req.body.simulateDelay || 0, 10);
  if (simulateDelay > 0) {
    await new Promise(r => setTimeout(r, simulateDelay));
  }

  const {
    jobId,
    fullName,
    email,
    phone,
    experience,
    linkedin,
    coverLetter,
    termsAccepted,
    bugMode // Optional flag to simulate specific defect behaviors
  } = req.body;

  const errors = {};

  // Bug 2 Simulation Mode: if client bypassed whitespace check and bug mode is active
  const isBug2 = bugMode === 'BUG_002';

  // Validation: Full Name
  if (!fullName || (!isBug2 && fullName.trim().length < 2)) {
    errors.fullName = 'Full Name is required and must contain at least 2 characters.';
  }

  // Validation: Email
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'A valid email address is required (e.g. name@example.com).';
  }

  // Validation: Experience
  const expNum = parseInt(experience, 10);
  if (experience === undefined || experience === '' || isNaN(expNum) || expNum < 0 || expNum > 50) {
    errors.experience = 'Years of experience must be a valid number between 0 and 50.';
  }

  // Validation: Cover Letter
  if (!coverLetter || (!isBug2 && coverLetter.trim().length < 20)) {
    errors.coverLetter = 'Cover letter must contain at least 20 characters.';
  } else if (coverLetter && coverLetter.length > 2000) {
    errors.coverLetter = 'Cover letter cannot exceed 2000 characters.';
  }

  // Validation: Terms
  if (termsAccepted !== true && termsAccepted !== 'true' && termsAccepted !== 'on') {
    errors.termsAccepted = 'You must accept the terms and privacy policy to submit.';
  }

  // Validation: Job ID exists
  const targetJobId = parseInt(jobId, 10);
  const jobExists = jobsData.some(j => j.id === targetJobId);
  if (!jobExists) {
    errors.jobId = 'Target job position does not exist.';
  }

  // Return validation errors if any
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors
    });
  }

  // Duplicate Submission Check: Same email applied for same role
  const isDuplicate = applications.some(app =>
    app.jobId === targetJobId &&
    app.email.toLowerCase().trim() === email.toLowerCase().trim()
  );

  // If duplicate detection is active (unless Bug 1 concurrency race explicitly forces duplicate)
  const isBug1 = bugMode === 'BUG_001_ALLOW_DUPE';
  if (isDuplicate && !isBug1) {
    return res.status(409).json({
      error: 'Duplicate application detected',
      message: 'You have already submitted an application for this position. Our hiring team is reviewing your profile.'
    });
  }

  // Successful submission record creation
  const applicationId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const record = {
    applicationId,
    jobId: targetJobId,
    fullName: fullName ? fullName.trim() : '',
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : null,
    experience: expNum,
    linkedin: linkedin ? linkedin.trim() : null,
    coverLetter: coverLetter ? coverLetter.trim() : '',
    submittedAt: new Date().toISOString()
  };

  applications.push(record);

  res.status(201).json({
    success: true,
    applicationId,
    message: 'Application submitted successfully!',
    record: {
      applicationId: record.applicationId,
      fullName: record.fullName,
      email: record.email,
      jobId: record.jobId,
      submittedAt: record.submittedAt
    }
  });
});

// API: Get applications list (for verification in testing)
app.get('/api/applications', (req, res) => {
  res.json({
    total: applications.length,
    applications
  });
});

// API: Reset in-memory database
app.post('/api/reset', (req, res) => {
  applications = [];
  res.json({ message: 'Applications database reset successfully.' });
});

// Serve Single Page Application on direct route access (e.g. /job/:id)
app.get('/job/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all for SPA navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Job Application Portal server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
