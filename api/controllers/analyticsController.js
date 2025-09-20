import AnalyticsService from '../services/analyticsService.js';

class AnalyticsController {
  constructor() {
    this.analyticsService = new AnalyticsService();
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock analytics data
    this.mockAnalytics = {
      dashboard: {
        totalProjects: 156,
        activeUsers: 42,
        completedTrainings: 89,
        complianceRate: 94.5,
        monthlyGrowth: 12.3,
        popularTemplates: ['NR-10', 'NR-35', 'NR-33'],
        recentActivity: [
          { type: 'project_created', user: 'João Silva', timestamp: new Date() },
          { type: 'training_completed', user: 'Maria Santos', timestamp: new Date() }
        ]
      },
      projects: {
        engagement: {
          viewTime: 245,
          completionRate: 87.5,
          interactionRate: 92.1,
          feedbackScore: 4.6
        },
        performance: {
          loadTime: 1.2,
          errorRate: 0.3,
          uptime: 99.8,
          responseTime: 150
        }
      },
      templates: {
        usage: {
          'NR-10': { uses: 45, rating: 4.8 },
          'NR-35': { uses: 38, rating: 4.7 },
          'NR-33': { uses: 32, rating: 4.6 }
        },
        popular: [
          { id: 1, name: 'NR-10 Básico', uses: 45, category: 'Segurança Elétrica' },
          { id: 2, name: 'NR-35 Altura', uses: 38, category: 'Trabalho em Altura' }
        ]
      },
      users: {
        activity: {
          dailyActive: 28,
          weeklyActive: 156,
          monthlyActive: 342,
          avgSessionTime: 25.4
        },
        engagement: {
          loginFrequency: 4.2,
          featureUsage: {
            'editor': 89,
            'templates': 76,
            'analytics': 45
          }
        }
      },
      system: {
        overview: {
          totalStorage: '2.4 TB',
          usedStorage: '1.8 TB',
          bandwidth: '450 GB',
          apiCalls: 15420
        },
        performance: {
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 75.0,
          networkLatency: 12
        }
      },
      compliance: {
        'NR-10': { completed: 89, total: 95, rate: 93.7 },
        'NR-35': { completed: 76, total: 82, rate: 92.7 },
        'NR-33': { completed: 45, total: 50, rate: 90.0 }
      }
    };
  }

  // Dashboard Analytics
  async getDashboardAnalytics(req, res) {
    try {
      const userId = req.user?.id || 'anonymous';
      const analytics = await this.analyticsService.getDashboardAnalytics(userId);
      res.json({
        success: true,
        data: analytics || this.mockAnalytics.dashboard
      });
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard analytics'
      });
    }
  }

  // Project Analytics
  async getProjectAnalytics(req, res) {
    try {
      const { projectId } = req.params;
      const analytics = await this.analyticsService.getProjectAnalytics(projectId);
      res.json({
        success: true,
        data: analytics || {
          projectId,
          views: 1250,
          completions: 1089,
          avgRating: 4.6,
          ...this.mockAnalytics.projects
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get project analytics'
      });
    }
  }

  async getProjectEngagement(req, res) {
    try {
      const { projectId } = req.params;
      const engagement = await this.analyticsService.getProjectEngagement(projectId);
      res.json({
        success: true,
        data: engagement || this.mockAnalytics.projects.engagement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get project engagement'
      });
    }
  }

  async getProjectPerformance(req, res) {
    try {
      const { projectId } = req.params;
      const performance = await this.analyticsService.getProjectPerformance(projectId);
      res.json({
        success: true,
        data: performance || this.mockAnalytics.projects.performance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get project performance'
      });
    }
  }

  // Template Analytics
  async getTemplateAnalytics(req, res) {
    try {
      const { templateId } = req.params;
      const analytics = await this.analyticsService.getTemplateAnalytics(templateId);
      res.json({
        success: true,
        data: analytics || {
          templateId,
          uses: 45,
          rating: 4.8,
          downloads: 156,
          favorites: 23
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get template analytics'
      });
    }
  }

  async getPopularTemplates(req, res) {
    try {
      const templates = await this.analyticsService.getPopularTemplates();
      res.json({
        success: true,
        data: templates || this.mockAnalytics.templates.popular
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get popular templates'
      });
    }
  }

  async getTemplateUsage(req, res) {
    try {
      const usage = await this.analyticsService.getTemplateUsage();
      res.json({
        success: true,
        data: usage || this.mockAnalytics.templates.usage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get template usage'
      });
    }
  }

  // User Analytics
  async getUserAnalytics(req, res) {
    try {
      const { userId } = req.params;
      const analytics = await this.analyticsService.getUserAnalytics(userId);
      res.json({
        success: true,
        data: analytics || {
          userId,
          projectsCreated: 12,
          templatesUsed: 8,
          totalTime: 145,
          lastActive: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user analytics'
      });
    }
  }

  async getUserActivity(req, res) {
    try {
      const activity = await this.analyticsService.getUserActivity();
      res.json({
        success: true,
        data: activity || this.mockAnalytics.users.activity
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user activity'
      });
    }
  }

  async getUserEngagement(req, res) {
    try {
      const engagement = await this.analyticsService.getUserEngagement();
      res.json({
        success: true,
        data: engagement || this.mockAnalytics.users.engagement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user engagement'
      });
    }
  }

  // System Analytics
  async getSystemOverview(req, res) {
    try {
      const overview = await this.analyticsService.getSystemOverview();
      res.json({
        success: true,
        data: overview || this.mockAnalytics.system.overview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get system overview'
      });
    }
  }

  async getSystemPerformance(req, res) {
    try {
      const performance = await this.analyticsService.getSystemPerformance();
      res.json({
        success: true,
        data: performance || this.mockAnalytics.system.performance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get system performance'
      });
    }
  }

  async getSystemUsage(req, res) {
    try {
      const usage = await this.analyticsService.getSystemUsage();
      res.json({
        success: true,
        data: usage || {
          storage: '1.8 TB',
          bandwidth: '450 GB',
          requests: 15420,
          errors: 23
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get system usage'
      });
    }
  }

  // Compliance Analytics
  async getComplianceAnalytics(req, res) {
    try {
      const { nrType } = req.params;
      const compliance = await this.analyticsService.getComplianceAnalytics(nrType);
      res.json({
        success: true,
        data: compliance || this.mockAnalytics.compliance[nrType] || {
          nrType,
          completed: 0,
          total: 0,
          rate: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance analytics'
      });
    }
  }

  async getTrainingCompliance(req, res) {
    try {
      const compliance = await this.analyticsService.getTrainingCompliance();
      res.json({
        success: true,
        data: compliance || this.mockAnalytics.compliance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get training compliance'
      });
    }
  }

  async getComplianceReports(req, res) {
    try {
      const reports = await this.analyticsService.getComplianceReports();
      res.json({
        success: true,
        data: reports || [
          { id: 1, type: 'NR-10', period: '2024-01', status: 'completed' },
          { id: 2, type: 'NR-35', period: '2024-01', status: 'pending' }
        ]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance reports'
      });
    }
  }

  // Reports
  async generateReport(req, res) {
    try {
      const { type } = req.params;
      const { startDate, endDate, filters } = req.query;
      const report = await this.analyticsService.generateReport(type, { startDate, endDate, filters });
      res.json({
        success: true,
        data: report || {
          id: Date.now(),
          type,
          status: 'generating',
          createdAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate report'
      });
    }
  }

  async getReport(req, res) {
    try {
      const { reportId } = req.params;
      const report = await this.analyticsService.getReport(reportId);
      res.json({
        success: true,
        data: report || {
          id: reportId,
          type: 'usage',
          status: 'completed',
          url: `/reports/${reportId}.pdf`
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get report'
      });
    }
  }

  async getReports(req, res) {
    try {
      const reports = await this.analyticsService.getReports(req.user.id);
      res.json({
        success: true,
        data: reports || [
          { id: 1, type: 'usage', status: 'completed', createdAt: new Date() },
          { id: 2, type: 'compliance', status: 'pending', createdAt: new Date() }
        ]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get reports'
      });
    }
  }

  async deleteReport(req, res) {
    try {
      const { reportId } = req.params;
      await this.analyticsService.deleteReport(reportId);
      res.json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete report'
      });
    }
  }

  // Export Data
  async exportData(req, res) {
    try {
      const { type, format, filters } = req.body;
      const exportData = await this.analyticsService.exportData(type, format, filters);
      res.json({
        success: true,
        data: exportData || {
          downloadUrl: `/exports/${Date.now()}.${format}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to export data'
      });
    }
  }

  // Real-time Analytics
  async getActiveUsers(req, res) {
    try {
      const activeUsers = await this.analyticsService.getActiveUsers();
      res.json({
        success: true,
        data: activeUsers || {
          count: 42,
          users: [
            { id: 1, name: 'João Silva', activity: 'editing' },
            { id: 2, name: 'Maria Santos', activity: 'viewing' }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get active users'
      });
    }
  }

  async getSystemStatus(req, res) {
    try {
      const status = await this.analyticsService.getSystemStatus();
      res.json({
        success: true,
        data: status || {
          status: 'healthy',
          uptime: '99.8%',
          services: {
            api: 'online',
            database: 'online',
            storage: 'online'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get system status'
      });
    }
  }

  // Custom Analytics
  async customQuery(req, res) {
    try {
      const { query, parameters } = req.body;
      const result = await this.analyticsService.customQuery(query, parameters);
      res.json({
        success: true,
        data: result || { message: 'Custom query executed' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to execute custom query'
      });
    }
  }

  // Metrics Collection
  async trackMetric(req, res) {
    try {
      const { metric, value, metadata } = req.body;
      await this.analyticsService.trackMetric(metric, value, metadata, req.user.id);
      res.json({
        success: true,
        message: 'Metric tracked successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to track metric'
      });
    }
  }

  async trackEvent(req, res) {
    try {
      const { event, properties } = req.body;
      await this.analyticsService.trackEvent(event, properties, req.user.id);
      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to track event'
      });
    }
  }

  // Engagement Metrics (PRD Requirements)
  async getEngagementMetrics(req, res) {
    try {
      const { projectId, timeframe } = req.query;
      const metrics = await this.analyticsService.getEngagementMetrics(projectId, timeframe);
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get engagement metrics'
      });
    }
  }

  // Compliance Reporting (PRD Requirements)
  async getComplianceReporting(req, res) {
    try {
      const { nrType, period, department } = req.query;
      const reporting = await this.analyticsService.getComplianceReporting(nrType, period, department);
      res.json({
        success: true,
        data: reporting
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance reporting'
      });
    }
  }

  // Executive Dashboard (PRD Requirements)
  async getExecutiveDashboard(req, res) {
    try {
      const { period, department } = req.query;
      const dashboard = await this.analyticsService.getExecutiveDashboard(period, department);
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get executive dashboard'
      });
    }
  }

  // Real-time Metrics (PRD Requirements)
  async getRealTimeMetrics(req, res) {
    try {
      const metrics = await this.analyticsService.getRealTimeMetrics();
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get real-time metrics'
      });
    }
  }

  // Training ROI Analysis
  async getTrainingROI(req, res) {
    try {
      const { period, department, trainingType } = req.query;
      const roi = await this.analyticsService.getTrainingROI(period, department, trainingType);
      res.json({
        success: true,
        data: roi
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get training ROI'
      });
    }
  }

  // Safety Program Effectiveness
  async getSafetyProgramEffectiveness(req, res) {
    try {
      const { period, program } = req.query;
      const effectiveness = await this.analyticsService.getSafetyProgramEffectiveness(period, program);
      res.json({
        success: true,
        data: effectiveness
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get safety program effectiveness'
      });
    }
  }

  // Certification Management
  async getCertificationStatus(req, res) {
    try {
      const { userId, nrType } = req.query;
      const status = await this.analyticsService.getCertificationStatus(userId, nrType);
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get certification status'
      });
    }
  }

  // Audit Trail
  async getAuditTrail(req, res) {
    try {
      const { startDate, endDate, userId, action } = req.query;
      const trail = await this.analyticsService.getAuditTrail(startDate, endDate, userId, action);
      res.json({
        success: true,
        data: trail
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get audit trail'
      });
    }
  }

  // ROI Analysis
  async getROIAnalysis(req, res) {
    try {
      const { period, department, trainingType } = req.query;
      const roi = await this.analyticsService.getROIAnalytics(period, department, trainingType);
      res.json({
        success: true,
        data: roi
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get ROI analysis'
      });
    }
  }

  // Security Analysis
  async getSecurityAnalysis(req, res) {
    try {
      const { period, department, riskLevel } = req.query;
      const security = await this.analyticsService.getSecurityAnalytics(period, department, riskLevel);
      res.json({
        success: true,
        data: security
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get security analysis'
      });
    }
  }

  // Incident Analysis
  async getIncidentAnalysis(req, res) {
    try {
      const { period, department, severity } = req.query;
      const incidents = await this.analyticsService.getIncidentAnalysis(period, department, severity);
      res.json({
        success: true,
        data: incidents
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get incident analysis'
      });
    }
  }
}

export default AnalyticsController;