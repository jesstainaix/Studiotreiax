import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Validation schema for error reports
const ErrorReportSchema = z.object({
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }),
  context: z.object({
    component: z.string().optional(),
    action: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    timestamp: z.number(),
    userAgent: z.string(),
    url: z.string(),
    metadata: z.record(z.any()).optional(),
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['network', 'validation', 'runtime', 'ai', 'auth', 'unknown']),
});

type ErrorReport = z.infer<typeof ErrorReportSchema>;

// In-memory storage for errors (in production, use a database)
const errorStorage: ErrorReport[] = [];
const MAX_STORED_ERRORS = 1000;

// Ensure logs directory exists
const ensureLogsDirectory = async () => {
  const logsDir = path.join(process.cwd(), 'logs');
  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
  }
  return logsDir;
};

// Write error to log file
const writeErrorToFile = async (errorReport: ErrorReport) => {
  try {
    const logsDir = await ensureLogsDirectory();
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `errors-${today}.json`);
    
    const logEntry = {
      ...errorReport,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: new Date().toISOString(),
    };
    
    // Read existing logs
    let existingLogs: any[] = [];
    try {
      const existingData = await fs.readFile(logFile, 'utf-8');
      existingLogs = JSON.parse(existingData);
    } catch {
      // File doesn't exist or is empty
    }
    
    // Add new log entry
    existingLogs.push(logEntry);
    
    // Keep only last 1000 entries per day
    if (existingLogs.length > MAX_STORED_ERRORS) {
      existingLogs = existingLogs.slice(-MAX_STORED_ERRORS);
    }
    
    // Write back to file
    await fs.writeFile(logFile, JSON.stringify(existingLogs, null, 2));
  } catch (error) {
    console.error('Failed to write error to file:', error);
  }
};

// POST /api/errors - Report an error
router.post('/', async (req, res) => {
  try {
    const errorReport = ErrorReportSchema.parse(req.body);
    
    // Store in memory
    errorStorage.push(errorReport);
    
    // Keep only recent errors in memory
    if (errorStorage.length > MAX_STORED_ERRORS) {
      errorStorage.shift();
    }
    
    // Write to file for persistence
    await writeErrorToFile(errorReport);
    
    // Log critical errors to console
    if (errorReport.severity === 'critical') {
      console.error('🚨 CRITICAL ERROR REPORTED:', {
        error: errorReport.error.message,
        component: errorReport.context.component,
        action: errorReport.context.action,
        timestamp: new Date(errorReport.context.timestamp).toISOString(),
      });
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Error reported successfully',
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
  } catch (error) {
    console.error('Failed to process error report:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Invalid error report format',
      error: error instanceof z.ZodError ? error.errors : 'Unknown error',
    });
  }
});

// GET /api/errors - Get error statistics
router.get('/stats', (req, res) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;
  
  const recentErrors = errorStorage.filter(
    error => now - error.context.timestamp < oneHour
  );
  
  const dailyErrors = errorStorage.filter(
    error => now - error.context.timestamp < oneDay
  );
  
  const weeklyErrors = errorStorage.filter(
    error => now - error.context.timestamp < oneWeek
  );
  
  const errorsByCategory = errorStorage.reduce((acc, error) => {
    acc[error.category] = (acc[error.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const errorsBySeverity = errorStorage.reduce((acc, error) => {
    acc[error.severity] = (acc[error.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topErrors = Object.entries(
    errorStorage.reduce((acc, error) => {
      const key = `${error.error.name}: ${error.error.message}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([error, count]) => ({ error, count }));
  
  res.json({
    success: true,
    data: {
      total: errorStorage.length,
      recent: {
        lastHour: recentErrors.length,
        lastDay: dailyErrors.length,
        lastWeek: weeklyErrors.length,
      },
      byCategory: errorsByCategory,
      bySeverity: errorsBySeverity,
      topErrors,
      trends: {
        hourlyRate: recentErrors.length,
        dailyRate: dailyErrors.length / 24,
        weeklyRate: weeklyErrors.length / (7 * 24),
      },
    },
  });
});

// GET /api/errors/recent - Get recent errors
router.get('/recent', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const severity = req.query.severity as string;
  const category = req.query.category as string;
  
  let filteredErrors = [...errorStorage];
  
  if (severity) {
    filteredErrors = filteredErrors.filter(error => error.severity === severity);
  }
  
  if (category) {
    filteredErrors = filteredErrors.filter(error => error.category === category);
  }
  
  // Sort by timestamp (most recent first)
  filteredErrors.sort((a, b) => b.context.timestamp - a.context.timestamp);
  
  // Limit results
  filteredErrors = filteredErrors.slice(0, limit);
  
  res.json({
    success: true,
    data: filteredErrors,
    total: filteredErrors.length,
  });
});

// DELETE /api/errors - Clear error storage (admin only)
router.delete('/', (req, res) => {
  const { confirm } = req.body;
  
  if (confirm !== 'CLEAR_ALL_ERRORS') {
    return res.status(400).json({
      success: false,
      message: 'Confirmation required. Send { "confirm": "CLEAR_ALL_ERRORS" }',
    });
  }
  
  const clearedCount = errorStorage.length;
  errorStorage.length = 0;
  
  res.json({
    success: true,
    message: `Cleared ${clearedCount} errors from memory`,
    clearedCount,
  });
});

// Health check for error reporting system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    memoryUsage: {
      storedErrors: errorStorage.length,
      maxCapacity: MAX_STORED_ERRORS,
      utilizationPercent: (errorStorage.length / MAX_STORED_ERRORS) * 100,
    },
  });
});

export default router;