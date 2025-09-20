import jwt from 'jsonwebtoken';
import usersService from '../services/usersService.js';

// JWT Secret keys (in production, use environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'mock_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mock_jwt_refresh_secret';

/**
 * Authentication middleware - DISABLED
 * Always allows access without verification
 */
const authenticate = async (req, res, next) => {
  // Authentication system disabled - allow all requests
  req.user = null;
  req.userId = null;
  req.userRole = 'guest';
  req.userPermissions = [];
  next();
};

/**
 * Optional authentication middleware - DISABLED
 * Always continues without user info
 */
const optionalAuth = async (req, res, next) => {
  // Authentication system disabled - continue without user info
  req.user = null;
  req.userId = null;
  req.userRole = null;
  req.userPermissions = [];
  next();
};

/**
 * Role-based authorization middleware - DISABLED
 * Always allows access regardless of role
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Authorization system disabled - allow all requests
    next();
  };
};

/**
 * Permission-based authorization middleware - DISABLED
 * Always allows access regardless of permissions
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    // Authorization system disabled - allow all requests
    next();
  };
};

/**
 * Admin-only authorization middleware - DISABLED
 * Always allows access regardless of admin status
 */
const requireAdmin = (req, res, next) => {
  // Authorization system disabled - allow all requests
  next();
};

/**
 * Manager or Admin authorization middleware - DISABLED
 * Always allows access regardless of role
 */
const requireManagerOrAdmin = (req, res, next) => {
  // Authorization system disabled - allow all requests
  next();
};

/**
 * Owner or Admin authorization middleware
 * Allows resource owner or admin access
 */
const requireOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin can access everything
    if (req.userRole === 'admin') {
      return next();
    }

    try {
      // Get resource owner ID
      const ownerId = typeof getResourceOwnerId === 'function' 
        ? await getResourceOwnerId(req)
        : getResourceOwnerId;

      // Check if user is the owner
      if (req.userId === ownerId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Access denied - not resource owner',
        code: 'NOT_OWNER'
      });
    } catch (error) {
      console.error('Owner check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        code: 'AUTH_CHECK_ERROR'
      });
    }
  };
};

/**
 * Department-based authorization middleware
 * Allows access only to users from specific departments
 */
const requireDepartment = (...allowedDepartments) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin can access everything
    if (req.userRole === 'admin') {
      return next();
    }

    if (!allowedDepartments.includes(req.user.department)) {
      return res.status(403).json({
        success: false,
        error: 'Department access denied',
        code: 'DEPARTMENT_ACCESS_DENIED',
        required: allowedDepartments,
        current: req.user.department
      });
    }

    next();
  };
};

/**
 * Rate limiting by user
 * Limits requests per user per time window
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of userRequests.entries()) {
      if (now - data.windowStart > windowMs) {
        userRequests.delete(userId);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const userId = req.userId || req.ip; // Use IP if not authenticated
    const now = Date.now();

    if (!userRequests.has(userId)) {
      userRequests.set(userId, {
        count: 1,
        windowStart: now
      });
      return next();
    }

    const userData = userRequests.get(userId);
    
    // Reset window if expired
    if (now - userData.windowStart > windowMs) {
      userData.count = 1;
      userData.windowStart = now;
      return next();
    }

    // Check if limit exceeded
    if (userData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userData.windowStart + windowMs - now) / 1000)
      });
    }

    userData.count++;
    next();
  };
};

/**
 * API Key authentication middleware
 * For external API access
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }

  // In production, validate against database
  const validApiKeys = [
    'studio_treiax_api_key_dev_001',
    'studio_treiax_api_key_prod_001'
  ];

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  // Add API key info to request
  req.apiKey = apiKey;
  req.isApiRequest = true;
  
  next();
};

/**
 * Session validation middleware
 * Validates active session
 */
const validateSession = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Session ID required',
        code: 'MISSING_SESSION'
      });
    }

    // Validate session through users service
    const session = await usersService.validateSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
    }

    req.session = session;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Session validation failed',
      code: 'SESSION_ERROR'
    });
  }
};

/**
 * Two-factor authentication middleware
 * Requires 2FA verification for sensitive operations
 */
const require2FA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.twoFactorEnabled) {
    return res.status(403).json({
      success: false,
      error: 'Two-factor authentication required',
      code: 'REQUIRE_2FA'
    });
  }

  const twoFactorToken = req.headers['x-2fa-token'];
  
  if (!twoFactorToken) {
    return res.status(403).json({
      success: false,
      error: 'Two-factor token required',
      code: 'MISSING_2FA_TOKEN'
    });
  }

  // In production, validate 2FA token
  // For now, accept any 6-digit number
  if (!/^\d{6}$/.test(twoFactorToken)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid two-factor token',
      code: 'INVALID_2FA_TOKEN'
    });
  }

  next();
};

/**
 * Audit logging middleware
 * Logs sensitive operations for audit trail
 */
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Store audit info in request for later logging
    req.auditInfo = {
      action,
      resource,
      userId: req.userId,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Continue to next middleware
    next();
  };
};

export {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAdmin,
  requireManagerOrAdmin,
  requireOwnerOrAdmin,
  requireDepartment,
  userRateLimit,
  authenticateApiKey,
  validateSession,
  require2FA,
  auditLog,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};

export default authenticate;