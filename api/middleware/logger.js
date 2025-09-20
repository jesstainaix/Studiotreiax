const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'studio-ia-api' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Access logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    
    // Audit logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '90d', // Keep audit logs longer
      zippedArchive: true
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Custom log levels for audit
const auditLogger = winston.createLogger({
  levels: {
    audit: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'audit',
      maxSize: '20m',
      maxFiles: '90d',
      zippedArchive: true
    })
  ]
});

// Morgan HTTP request logger
const httpLogFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Create write stream for Morgan
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Morgan middleware
const httpLogger = morgan(httpLogFormat, {
  stream: accessLogStream,
  skip: (req, res) => {
    // Skip logging for health checks and static files
    return req.url === '/health' || req.url.startsWith('/uploads/');
  }
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    sessionId: req.sessionID,
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.method !== 'GET' ? req.body : undefined
    },
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Audit logging middleware
const auditLog = (action, details = {}) => {
  return (req, res, next) => {
    const auditData = {
      action,
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      sessionId: req.sessionID,
      ...details
    };
    
    // Add request body for certain actions
    if (['CREATE', 'UPDATE', 'DELETE'].includes(action)) {
      auditData.requestData = req.body;
    }
    
    auditLogger.audit('User action', auditData);
    
    // Also log to main logger for important actions
    if (['LOGIN', 'LOGOUT', 'CREATE', 'DELETE', 'PERMISSION_CHANGE'].includes(action)) {
      logger.info(`Audit: ${action}`, auditData);
    }
    
    next();
  };
};

// Security event logger
const securityLog = (event, details = {}) => {
  const securityData = {
    event,
    severity: details.severity || 'medium',
    ip: details.ip,
    userAgent: details.userAgent,
    userId: details.userId,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  logger.warn(`Security Event: ${event}`, securityData);
  auditLogger.audit(`Security: ${event}`, securityData);
};

// Performance logging middleware
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          userId: req.user?.id,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    next();
  };
};

// Database operation logger
const dbLogger = {
  query: (operation, table, details = {}) => {
    logger.debug('Database operation', {
      operation,
      table,
      ...details,
      timestamp: new Date().toISOString()
    });
  },
  
  error: (operation, table, error, details = {}) => {
    logger.error('Database error', {
      operation,
      table,
      error: {
        message: error.message,
        code: error.code
      },
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

// API usage logger
const apiUsageLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('API Usage', {
      endpoint: `${req.method} ${req.route?.path || req.url}`,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// File operation logger
const fileLogger = {
  upload: (filename, size, userId, details = {}) => {
    logger.info('File uploaded', {
      action: 'FILE_UPLOAD',
      filename,
      size,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
    
    auditLogger.audit('File upload', {
      action: 'FILE_UPLOAD',
      filename,
      size,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
  },
  
  delete: (filename, userId, details = {}) => {
    logger.info('File deleted', {
      action: 'FILE_DELETE',
      filename,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
    
    auditLogger.audit('File delete', {
      action: 'FILE_DELETE',
      filename,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
  },
  
  access: (filename, userId, details = {}) => {
    logger.debug('File accessed', {
      action: 'FILE_ACCESS',
      filename,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

// System event logger
const systemLogger = {
  startup: (details = {}) => {
    logger.info('System startup', {
      event: 'SYSTEM_STARTUP',
      nodeVersion: process.version,
      platform: process.platform,
      ...details,
      timestamp: new Date().toISOString()
    });
  },
  
  shutdown: (details = {}) => {
    logger.info('System shutdown', {
      event: 'SYSTEM_SHUTDOWN',
      ...details,
      timestamp: new Date().toISOString()
    });
  },
  
  error: (error, details = {}) => {
    logger.error('System error', {
      event: 'SYSTEM_ERROR',
      error: {
        message: error.message,
        stack: error.stack
      },
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

// Log cleanup utility
const cleanupLogs = (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      logger.error('Error reading logs directory', { error: err.message });
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime < cutoffDate) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error('Error deleting old log file', { file, error: err.message });
            } else {
              logger.info('Deleted old log file', { file });
            }
          });
        }
      });
    });
  });
};

module.exports = {
  // Main logger
  logger,
  auditLogger,
  
  // Middleware
  httpLogger,
  requestLogger,
  errorLogger,
  performanceLogger,
  apiUsageLogger,
  
  // Specialized loggers
  dbLogger,
  fileLogger,
  systemLogger,
  
  // Utility functions
  auditLog,
  securityLog,
  cleanupLogs,
  
  // Log directories
  logsDir
};