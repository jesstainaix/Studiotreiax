import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Validation schemas
const PerformanceMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  timestamp: z.number(),
  category: z.enum(['load', 'runtime', 'network', 'memory', 'user', 'ai']),
  tags: z.record(z.string()).optional(),
  threshold: z.object({
    warning: z.number(),
    critical: z.number(),
  }).optional(),
});

const PerformanceAlertSchema = z.object({
  id: z.string(),
  metricId: z.string(),
  severity: z.enum(['warning', 'critical']),
  message: z.string(),
  timestamp: z.number(),
  acknowledged: z.boolean(),
});

const MetricsReportSchema = z.object({
  metrics: z.array(PerformanceMetricSchema),
  alerts: z.array(PerformanceAlertSchema),
  timestamp: z.number(),
});

const MetricsQuerySchema = z.object({
  category: z.enum(['load', 'runtime', 'network', 'memory', 'user', 'ai']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.string().optional(),
});

// In-memory storage (in production, use a proper database)
interface StoredMetric extends z.infer<typeof PerformanceMetricSchema> {
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

interface StoredAlert extends z.infer<typeof PerformanceAlertSchema> {
  sessionId?: string;
}

let metricsStorage: StoredMetric[] = [];
let alertsStorage: StoredAlert[] = [];
const MAX_STORAGE_SIZE = 10000;

// Helper functions
const cleanupOldData = () => {
  const oneHour = 60 * 60 * 1000;
  const cutoff = Date.now() - oneHour;
  
  metricsStorage = metricsStorage.filter(metric => metric.timestamp > cutoff);
  alertsStorage = alertsStorage.filter(alert => alert.timestamp > cutoff);
};

const saveToFile = async (data: any, filename: string) => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const filepath = path.join(logsDir, filename);
    await fs.appendFile(filepath, JSON.stringify(data) + '\n');
  } catch (error) {
    console.error('Failed to save performance data to file:', error);
  }
};

const calculateStats = (metrics: StoredMetric[]) => {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const fiveMinutes = 5 * oneMinute;
  const oneHour = 60 * oneMinute;
  
  const recentMetrics = {
    lastMinute: metrics.filter(m => now - m.timestamp < oneMinute),
    lastFiveMinutes: metrics.filter(m => now - m.timestamp < fiveMinutes),
    lastHour: metrics.filter(m => now - m.timestamp < oneHour),
  };
  
  const categorizeMetrics = (metricsList: StoredMetric[]) => {
    return metricsList.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);
  };
  
  const calculateCategoryStats = (values: number[]) => {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  };
  
  return {
    overview: {
      totalMetrics: metrics.length,
      lastMinute: recentMetrics.lastMinute.length,
      lastFiveMinutes: recentMetrics.lastFiveMinutes.length,
      lastHour: recentMetrics.lastHour.length,
    },
    categories: {
      lastMinute: Object.entries(categorizeMetrics(recentMetrics.lastMinute))
        .reduce((acc, [category, values]) => {
          acc[category] = calculateCategoryStats(values);
          return acc;
        }, {} as Record<string, any>),
      lastFiveMinutes: Object.entries(categorizeMetrics(recentMetrics.lastFiveMinutes))
        .reduce((acc, [category, values]) => {
          acc[category] = calculateCategoryStats(values);
          return acc;
        }, {} as Record<string, any>),
      lastHour: Object.entries(categorizeMetrics(recentMetrics.lastHour))
        .reduce((acc, [category, values]) => {
          acc[category] = calculateCategoryStats(values);
          return acc;
        }, {} as Record<string, any>),
    },
  };
};

// Routes

// POST /api/performance/metrics - Receive performance metrics
router.post('/metrics', async (req, res) => {
  try {
    const validatedData = MetricsReportSchema.parse(req.body);
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referer = req.headers['referer'] || 'unknown';
    
    // Add metadata to metrics
    const enrichedMetrics: StoredMetric[] = validatedData.metrics.map(metric => ({
      ...metric,
      sessionId,
      userAgent,
      url: referer,
    }));
    
    // Add metadata to alerts
    const enrichedAlerts: StoredAlert[] = validatedData.alerts.map(alert => ({
      ...alert,
      sessionId,
    }));
    
    // Store in memory
    metricsStorage.push(...enrichedMetrics);
    alertsStorage.push(...enrichedAlerts);
    
    // Cleanup old data
    if (metricsStorage.length > MAX_STORAGE_SIZE) {
      metricsStorage = metricsStorage.slice(-MAX_STORAGE_SIZE);
    }
    if (alertsStorage.length > MAX_STORAGE_SIZE) {
      alertsStorage = alertsStorage.slice(-MAX_STORAGE_SIZE);
    }
    
    // Save to file for persistence
    if (enrichedMetrics.length > 0) {
      await saveToFile({
        type: 'metrics',
        data: enrichedMetrics,
        timestamp: validatedData.timestamp,
        sessionId,
      }, `performance-metrics-${new Date().toISOString().split('T')[0]}.jsonl`);
    }
    
    if (enrichedAlerts.length > 0) {
      await saveToFile({
        type: 'alerts',
        data: enrichedAlerts,
        timestamp: validatedData.timestamp,
        sessionId,
      }, `performance-alerts-${new Date().toISOString().split('T')[0]}.jsonl`);
    }
    
    // Clean up old data periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanupOldData();
    }
    
    res.json({
      success: true,
      received: {
        metrics: enrichedMetrics.length,
        alerts: enrichedAlerts.length,
      },
      storage: {
        totalMetrics: metricsStorage.length,
        totalAlerts: alertsStorage.length,
      },
    });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid data format',
    });
  }
});

// GET /api/performance/metrics - Retrieve performance metrics
router.get('/metrics', (req, res) => {
  try {
    const query = MetricsQuerySchema.parse(req.query);
    
    let filteredMetrics = [...metricsStorage];
    
    // Filter by category
    if (query.category) {
      filteredMetrics = filteredMetrics.filter(metric => metric.category === query.category);
    }
    
    // Filter by time range
    if (query.startTime) {
      const startTime = new Date(query.startTime).getTime();
      filteredMetrics = filteredMetrics.filter(metric => metric.timestamp >= startTime);
    }
    
    if (query.endTime) {
      const endTime = new Date(query.endTime).getTime();
      filteredMetrics = filteredMetrics.filter(metric => metric.timestamp <= endTime);
    }
    
    // Apply limit
    const limit = query.limit ? parseInt(query.limit, 10) : 1000;
    filteredMetrics = filteredMetrics.slice(-limit);
    
    res.json({
      success: true,
      metrics: filteredMetrics,
      total: filteredMetrics.length,
      query,
    });
  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid query parameters',
    });
  }
});

// GET /api/performance/alerts - Retrieve performance alerts
router.get('/alerts', (req, res) => {
  try {
    const { acknowledged } = req.query;
    
    let filteredAlerts = [...alertsStorage];
    
    if (acknowledged !== undefined) {
      const isAcknowledged = acknowledged === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === isAcknowledged);
    }
    
    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({
      success: true,
      alerts: filteredAlerts,
      total: filteredAlerts.length,
    });
  } catch (error) {
    console.error('Error retrieving performance alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/performance/alerts/:id/acknowledge - Acknowledge an alert
router.post('/alerts/:id/acknowledge', (req, res) => {
  try {
    const { id } = req.params;
    const alert = alertsStorage.find(a => a.id === id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }
    
    alert.acknowledged = true;
    
    res.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/performance/stats - Get performance statistics
router.get('/stats', (req, res) => {
  try {
    const stats = calculateStats(metricsStorage);
    
    const alertStats = {
      total: alertsStorage.length,
      unacknowledged: alertsStorage.filter(a => !a.acknowledged).length,
      critical: alertsStorage.filter(a => a.severity === 'critical').length,
      warning: alertsStorage.filter(a => a.severity === 'warning').length,
    };
    
    res.json({
      success: true,
      stats: {
        ...stats,
        alerts: alertStats,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error calculating performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/performance/health - Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    storage: {
      metrics: metricsStorage.length,
      alerts: alertsStorage.length,
    },
    timestamp: Date.now(),
  });
});

// DELETE /api/performance/data - Clear performance data (admin only)
router.delete('/data', (req, res) => {
  try {
    const { confirm } = req.query;
    
    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Add ?confirm=true to clear all data.',
      });
    }
    
    const clearedMetrics = metricsStorage.length;
    const clearedAlerts = alertsStorage.length;
    
    metricsStorage = [];
    alertsStorage = [];
    
    res.json({
      success: true,
      message: 'Performance data cleared',
      cleared: {
        metrics: clearedMetrics,
        alerts: clearedAlerts,
      },
    });
  } catch (error) {
    console.error('Error clearing performance data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;