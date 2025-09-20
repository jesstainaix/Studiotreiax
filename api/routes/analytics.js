import express from 'express';
import AnalyticsController from '../controllers/analyticsController.js';

const router = express.Router();

// Initialize controller
const analyticsController = new AnalyticsController();

// Dashboard Analytics
router.get('/dashboard', 
  analyticsController.getDashboardAnalytics.bind(analyticsController)
);

// Project Analytics
router.get('/projects/:projectId', 
  analyticsController.getProjectAnalytics.bind(analyticsController)
);

router.get('/projects/:projectId/engagement', 
  analyticsController.getProjectEngagement.bind(analyticsController)
);

router.get('/projects/:projectId/performance', 
  analyticsController.getProjectPerformance.bind(analyticsController)
);

// Template Analytics
router.get('/templates/:templateId', 
  analyticsController.getTemplateAnalytics.bind(analyticsController)
);

router.get('/templates/popular', 
  analyticsController.getPopularTemplates.bind(analyticsController)
);

router.get('/templates/usage', 
  analyticsController.getTemplateUsage.bind(analyticsController)
);

// User Analytics
router.get('/users/:userId', 
  analyticsController.getUserAnalytics.bind(analyticsController)
);

router.get('/users/activity', 
  analyticsController.getUserActivity.bind(analyticsController)
);

router.get('/users/engagement', 
  analyticsController.getUserEngagement.bind(analyticsController)
);

// System Analytics
router.get('/system/overview', 
  analyticsController.getSystemOverview.bind(analyticsController)
);

router.get('/system/performance', 
  analyticsController.getSystemPerformance.bind(analyticsController)
);

router.get('/system/usage', 
  analyticsController.getSystemUsage.bind(analyticsController)
);

// Compliance Analytics
router.get('/compliance/:nrType', 
  analyticsController.getComplianceAnalytics.bind(analyticsController)
);

router.get('/compliance/training/overview', 
  analyticsController.getTrainingCompliance.bind(analyticsController)
);

router.get('/compliance/reports', 
  analyticsController.getComplianceReports.bind(analyticsController)
);

// Reports
router.post('/reports/:type/generate', 
  analyticsController.generateReport.bind(analyticsController)
);

router.get('/reports/:reportId', 
  analyticsController.getReport.bind(analyticsController)
);

router.get('/reports', 
  analyticsController.getReports.bind(analyticsController)
);

router.delete('/reports/:reportId', 
  analyticsController.deleteReport.bind(analyticsController)
);

// Export Data
router.post('/export', 
  analyticsController.exportData.bind(analyticsController)
);

// Real-time Analytics
router.get('/realtime/users', 
  analyticsController.getActiveUsers.bind(analyticsController)
);

router.get('/realtime/system', 
  analyticsController.getSystemStatus.bind(analyticsController)
);

// Custom Analytics
router.post('/custom/query', 
  analyticsController.customQuery.bind(analyticsController)
);

// Metrics Collection
router.post('/metrics/track', 
  analyticsController.trackMetric.bind(analyticsController)
);

router.post('/events/track', 
  analyticsController.trackEvent.bind(analyticsController)
);

// PRD Specific Analytics Routes

// Engagement Metrics
router.get('/engagement/metrics', 
  analyticsController.getEngagementMetrics.bind(analyticsController)
);

// Compliance Reporting
router.get('/compliance/reporting', 
  analyticsController.getComplianceReporting.bind(analyticsController)
);

// Executive Dashboard
router.get('/executive/dashboard', 
  analyticsController.getExecutiveDashboard.bind(analyticsController)
);

// Real-time Metrics
router.get('/realtime/metrics', 
  analyticsController.getRealTimeMetrics.bind(analyticsController)
);

// Training ROI Analysis
router.get('/training/roi', 
  analyticsController.getTrainingROI.bind(analyticsController)
);

// Safety Program Effectiveness
router.get('/safety/effectiveness', 
  analyticsController.getSafetyProgramEffectiveness.bind(analyticsController)
);

// Certification Management
router.get('/certification/status', 
  analyticsController.getCertificationStatus.bind(analyticsController)
);

// Audit Trail
router.get('/audit/trail', 
  analyticsController.getAuditTrail.bind(analyticsController)
);

// ROI Analysis Routes
router.get('/roi/analysis', 
  analyticsController.getROIAnalysis.bind(analyticsController)
);

router.get('/roi/training', 
  analyticsController.getTrainingROI.bind(analyticsController)
);

// Security Analysis Routes
router.get('/security/analysis', 
  analyticsController.getSecurityAnalysis.bind(analyticsController)
);

router.get('/security/incidents', 
  analyticsController.getIncidentAnalysis.bind(analyticsController)
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Analytics route error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

export default router;