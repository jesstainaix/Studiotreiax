const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * Rate limiting configurations for different endpoints
 */

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user?.role === 'admin';
  }
});

// Authentication rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use email/username + IP for auth attempts
    const identifier = req.body?.email || req.body?.username || 'unknown';
    return `${identifier}:${req.ip}`;
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    error: 'Muitas tentativas de redefinição de senha. Tente novamente em 1 hora.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `password_reset:${email}:${req.ip}`;
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 uploads per minute
  message: {
    success: false,
    error: 'Muitos uploads. Tente novamente em 1 minuto.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.role === 'admin';
  }
});

// API creation rate limiter (for projects, templates, etc.)
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each user to 5 creations per minute
  message: {
    success: false,
    error: 'Muitas criações. Tente novamente em 1 minuto.',
    code: 'CREATE_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.role === 'admin';
  }
});

// Search rate limiter
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each user to 30 searches per minute
  message: {
    success: false,
    error: 'Muitas buscas. Tente novamente em 1 minuto.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Analytics rate limiter
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each user to 20 analytics requests per minute
  message: {
    success: false,
    error: 'Muitas requisições de analytics. Tente novamente em 1 minuto.',
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.role === 'admin';
  }
});

// Email sending rate limiter
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 emails per hour
  message: {
    success: false,
    error: 'Muitos emails enviados. Tente novamente em 1 hora.',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Slow down middleware for gradual response delays
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // maximum delay of 20 seconds
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.role === 'admin';
  }
});

// Custom rate limiter factory
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Burst protection for specific endpoints
const burstProtection = rateLimit({
  windowMs: 1000, // 1 second
  max: 5, // max 5 requests per second
  message: {
    success: false,
    error: 'Muitas requisições muito rápidas. Diminua a velocidade.',
    code: 'BURST_LIMIT_EXCEEDED',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// IP-based rate limiter for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // higher limit for public endpoints
  message: {
    success: false,
    error: 'Muitas requisições do seu IP. Tente novamente em 15 minutos.',
    code: 'IP_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// User-specific rate limiter
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // higher limit for authenticated users
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    code: 'USER_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (!req.user?.id) {
      throw new Error('User rate limiter requires authentication');
    }
    return req.user.id;
  },
  skip: (req) => {
    return req.user?.role === 'admin';
  }
});

// Premium user rate limiter (higher limits)
const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // much higher limit for premium users
  message: {
    success: false,
    error: 'Limite de requisições premium excedido. Tente novamente em 15 minutos.',
    code: 'PREMIUM_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return req.user?.role === 'admin' || req.user?.isPremium;
  }
});

// Adaptive rate limiter based on user role
const adaptiveLimiter = (req, res, next) => {
  let limiter;
  
  if (!req.user) {
    limiter = publicLimiter;
  } else if (req.user.role === 'admin') {
    return next(); // No limits for admin
  } else if (req.user.isPremium) {
    limiter = premiumLimiter;
  } else {
    limiter = userLimiter;
  }
  
  return limiter(req, res, next);
};

// Rate limiter for different HTTP methods
const methodBasedLimiter = {
  GET: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    keyGenerator: (req) => req.user?.id || req.ip
  }),
  POST: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => req.user?.id || req.ip
  }),
  PUT: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => req.user?.id || req.ip
  }),
  DELETE: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.id || req.ip
  })
};

// Apply method-based rate limiting
const applyMethodLimiter = (req, res, next) => {
  const limiter = methodBasedLimiter[req.method];
  if (limiter) {
    return limiter(req, res, next);
  }
  return generalLimiter(req, res, next);
};

// Rate limiter with custom headers
const customHeaderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
  onLimitReached: (req, res, options) => {
    console.log(`Rate limit reached for ${req.user?.id || req.ip} at ${new Date().toISOString()}`);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      remaining: req.rateLimit.remaining,
      reset: new Date(req.rateLimit.resetTime)
    });
  }
});

module.exports = {
  // Basic limiters
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  createLimiter,
  searchLimiter,
  analyticsLimiter,
  emailLimiter,
  
  // Advanced limiters
  speedLimiter,
  burstProtection,
  publicLimiter,
  userLimiter,
  premiumLimiter,
  adaptiveLimiter,
  
  // Method-based limiting
  methodBasedLimiter,
  applyMethodLimiter,
  
  // Custom limiters
  createCustomLimiter,
  customHeaderLimiter
};