// Server-side Validation Middleware
const validators = {
  required: (value) => value !== undefined && value !== null && String(value).trim() !== '',
  email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()),
  phone: (value) => !value || /^[+\d][\d\s-]{7,14}$/.test(String(value).trim()),
  number: (value) => !value || !isNaN(parseFloat(value)),
  positive: (value) => !value || parseFloat(value) > 0,
  integer: (value) => !value || Number.isInteger(Number(value)),
  minLength: (value, min) => !value || String(value).trim().length >= parseInt(min),
  maxLength: (value, max) => !value || String(value).trim().length <= parseInt(max),
  min: (value, min) => !value || parseFloat(value) >= parseFloat(min),
  max: (value, max) => !value || parseFloat(value) <= parseFloat(max),
  gstin: (value) => !value || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(value).trim().toUpperCase()),
  pan: (value) => !value || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(value).trim().toUpperCase()),
  pincode: (value) => !value || /^[0-9]{6}$/.test(String(value).trim()),
  date: (value) => !value || !isNaN(Date.parse(value)),
  in: (value, options) => !value || (Array.isArray(options) && options.includes(value))
};

const getMessage = (field, rule) => {
  switch (rule.type) {
    case 'required': return rule.message || `${field} is required`;
    case 'email': return rule.message || 'Invalid email format';
    case 'phone': return rule.message || 'Invalid phone number format';
    case 'positive': return rule.message || `${field} must be greater than 0`;
    case 'min': return rule.message || `${field} must be at least ${rule.min}`;
    case 'max': return rule.message || `${field} must be at most ${rule.max}`;
    case 'minLength': return rule.message || `${field} must be at least ${rule.min} characters`;
    case 'maxLength': return rule.message || `${field} must be at most ${rule.max} characters`;
    case 'gstin': return rule.message || 'Invalid GSTIN format';
    case 'pan': return rule.message || 'Invalid PAN format';
    case 'pincode': return rule.message || 'Invalid PIN code';
    case 'in': return rule.message || `Invalid value for ${field}`;
    default: return rule.message || `${field} is invalid`;
  }
};

const validate = (rules) => (req, res, next) => {
  const errors = {};
  const source = req.body || {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = source[field];
    for (const rule of fieldRules) {
      let valid = true;
      if (typeof rule === 'string') {
        valid = validators[rule] ? validators[rule](value) : true;
      } else if (rule.type && validators[rule.type]) {
        valid = validators[rule.type](value, rule.min, rule.max);
      }
      if (!valid) {
        if (!errors[field]) errors[field] = [];
        errors[field].push(typeof rule === 'string' ? `${field} is invalid` : getMessage(field, rule));
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }
  next();
};

module.exports = { validate, validators };