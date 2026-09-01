// middleware/security.js
// Advanced SQL Injection Detection, Parameter Sanitization & Enterprise HTTP Security Headers

/**
 * Common SQL Injection Pattern Signatures
 */
const SQLI_PATTERNS = [
  // UNION SELECT attacks
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  // Classic boolean-based attacks: ' OR 1=1, " OR ""=", ' OR 'x'='x
  /(\bOR\b|\bAND\b)\s+['"]?(\d+|[a-zA-Z]+)['"]?\s*=\s*['"]?\2['"]?/i,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
  // Database destructive queries
  /\bDROP\s+(TABLE|DATABASE|VIEW|PROCEDURE|TRIGGER|INDEX)\b/i,
  /\bTRUNCATE\s+(TABLE)?\b/i,
  /\bALTER\s+TABLE\b/i,
  // Execution attacks
  /\b(EXEC|EXECUTE)\s*(\(|\s+)/i,
  /\bSP_EXECUTESQL\b/i,
  /\bXP_CMDSHELL\b/i,
  // Time-based and delay attacks
  /\bWAITFOR\s+DELAY\b/i,
  /\bSLEEP\s*\(\s*\d+\s*\)/i,
  /\bBENCHMARK\s*\(\s*\d+\s*,\s*[^)]+\)/i,
  // SQL commenting tricks: --, /* */, #
  /--[^\r\n]*/,
  /\/\*[\s\S]*?\*\//,
  // Stacked query executions (e.g. ; DROP TABLE...)
  /;\s*(DROP|DELETE|UPDATE|INSERT|SELECT|ALTER|CREATE|EXEC)\b/i,
  // SQL Server/MySQL hex & char obfuscation
  /\bCHAR\s*\(\s*\d+\s*\)/i,
  /\b0x[0-9a-fA-F]{8,}\b/i
];

/**
 * Check if a string value contains an SQL Injection attack signature
 */
function containsSqlInjection(value) {
  if (typeof value !== 'string') return false;
  // Ignore short normal inputs (e.g. standard names, codes, dates)
  if (value.length < 3) return false;

  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(value)) {
      return pattern;
    }
  }
  return false;
}

/**
 * Recursively inspect an object/array for SQL injection payloads
 */
function scanPayload(obj, path = '') {
  if (!obj) return null;

  if (typeof obj === 'string') {
    const matchedPattern = containsSqlInjection(obj);
    if (matchedPattern) {
      return { path, value: obj, pattern: matchedPattern.toString() };
    }
    return null;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const match = scanPayload(obj[i], `${path}[${i}]`);
      if (match) return match;
    }
    return null;
  }

  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      // Check key name itself
      const keyMatch = containsSqlInjection(key);
      if (keyMatch) {
        return { path: `${path}.${key}`, value: key, pattern: keyMatch.toString() };
      }
      const match = scanPayload(val, `${path}.${key}`);
      if (match) return match;
    }
  }

  return null;
}

/**
 * SQL Injection Detection and Firewall Guard Middleware
 */
const sqlInjectionGuard = (req, res, next) => {
  // Allowlist certain internal routes that legitimately accept SQL or code snippets if any
  if (req.path.startsWith('/assets') || req.path.startsWith('/uploads')) {
    return next();
  }

  // Scan Query Parameters
  const queryViolation = scanPayload(req.query, 'query');
  if (queryViolation) {
    console.warn(`[SECURITY ALERT] Blocked SQL Injection in URL query from IP: ${req.ip}, Path: ${req.originalUrl}, Detected: ${queryViolation.pattern} in ${queryViolation.path}`);
    return res.status(400).json({
      error: 'Security Warning: Malicious request pattern (SQL Injection) detected and blocked.',
      field: queryViolation.path
    });
  }

  // Scan URL Route Parameters
  const paramsViolation = scanPayload(req.params, 'params');
  if (paramsViolation) {
    console.warn(`[SECURITY ALERT] Blocked SQL Injection in Route param from IP: ${req.ip}, Path: ${req.originalUrl}, Detected: ${paramsViolation.pattern} in ${paramsViolation.path}`);
    return res.status(400).json({
      error: 'Security Warning: Malicious request pattern (SQL Injection) detected and blocked.'
    });
  }

  // Scan JSON or Form Body
  if (req.body && typeof req.body === 'object') {
    const bodyViolation = scanPayload(req.body, 'body');
    if (bodyViolation) {
      console.warn(`[SECURITY ALERT] Blocked SQL Injection in HTTP Body from IP: ${req.ip}, Path: ${req.originalUrl}, Detected: ${bodyViolation.pattern} in ${bodyViolation.path}`);
      return res.status(400).json({
        error: 'Security Warning: Malicious request pattern (SQL Injection) detected and blocked.',
        field: bodyViolation.path
      });
    }
  }

  next();
};

/**
 * Enterprise HTTP Security Headers Middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking by forbidding embedding outside sameorigin
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable sensitive hardware features unless explicitly needed
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Input sanitization helper to strip dangerous null bytes
 */
const sanitizeInputs = (req, res, next) => {
  const clean = (val) => {
    if (typeof val === 'string') {
      return val.replace(/\0/g, ''); // strip null bytes
    }
    if (val && typeof val === 'object') {
      for (const k of Object.keys(val)) {
        val[k] = clean(val[k]);
      }
    }
    return val;
  };

  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  next();
};

module.exports = {
  sqlInjectionGuard,
  securityHeaders,
  sanitizeInputs,
  containsSqlInjection
};
