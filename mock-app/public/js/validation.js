/**
 * TalentCraft Careers Portal - Form Validation Module
 */

const FormValidator = (function () {
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

  function validateField(name, value, allValues = {}) {
    // Check if BUG_002 simulation is active (skips trimming whitespace)
    const isBug2 = window.__SIMULATE_BUG_002 === true;

    switch (name) {
      case 'fullName': {
        const val = isBug2 ? (value || '') : (value || '').trim();
        if (!val) {
          return 'Full Name is required.';
        }
        if (val.length < 2) {
          return 'Full Name must contain at least 2 characters.';
        }
        if (val.length > 50) {
          return 'Full Name cannot exceed 50 characters.';
        }
        return null;
      }

      case 'email': {
        const val = (value || '').trim();
        if (!val) {
          return 'Email Address is required.';
        }
        if (!EMAIL_REGEX.test(val)) {
          return 'Please enter a valid email address (e.g. name@example.com).';
        }
        return null;
      }

      case 'phone': {
        const val = (value || '').trim();
        if (!val) return null; // Optional
        const cleaned = val.replace(/[\s\-\(\)\+]/g, '');
        if (cleaned.length < 7 || cleaned.length > 15 || !/^\d+$/.test(cleaned)) {
          return 'Please enter a valid phone number (7-15 digits).';
        }
        return null;
      }

      case 'experience': {
        if (value === undefined || value === null || value === '') {
          return 'Years of experience is required.';
        }
        const num = Number(value);
        if (isNaN(num)) {
          return 'Experience must be a valid number.';
        }
        if (num < 0) {
          return 'Experience cannot be negative (minimum is 0).';
        }
        if (num > 50) {
          return 'Years of experience cannot exceed 50.';
        }
        return null;
      }

      case 'linkedin': {
        const val = (value || '').trim();
        if (!val) return null; // Optional
        if (!URL_REGEX.test(val)) {
          return 'Please enter a valid URL (e.g. https://linkedin.com/in/username).';
        }
        return null;
      }

      case 'coverLetter': {
        const val = isBug2 ? (value || '') : (value || '').trim();
        if (!val) {
          return 'Cover Letter is required.';
        }
        if (val.length < 20) {
          return `Cover letter must contain at least 20 characters (currently ${val.length}).`;
        }
        if (val.length > 2000) {
          return 'Cover letter cannot exceed 2000 characters.';
        }
        return null;
      }

      case 'termsAccepted': {
        if (!value) {
          return 'You must agree to the terms and privacy policy to submit.';
        }
        return null;
      }

      default:
        return null;
    }
  }

  function validateAll(formValues) {
    const errors = {};
    const fields = ['fullName', 'email', 'phone', 'experience', 'linkedin', 'coverLetter', 'termsAccepted'];

    for (const field of fields) {
      const error = validateField(field, formValues[field], formValues);
      if (error) {
        errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  return {
    validateField,
    validateAll,
    EMAIL_REGEX
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormValidator;
}
