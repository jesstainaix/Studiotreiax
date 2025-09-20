/**
 * Analytics API Service
 * Handles all API calls for analytics data
 */

const API_BASE_URL = 'http://localhost:3001/api';

class AnalyticsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/analytics`;
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // Add auth token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Analytics API Error:', error);
      throw error;
    }
  }

  // Dashboard Analytics
  async getDashboardAnalytics() {
    return this.apiCall('/dashboard');
  }

  // Project Analytics
  async getProjectAnalytics(projectId) {
    return this.apiCall(`/projects/${projectId}`);
  }

  async getProjectEngagement(projectId) {
    return this.apiCall(`/projects/${projectId}/engagement`);
  }

  async getProjectPerformance(projectId) {
    return this.apiCall(`/projects/${projectId}/performance`);
  }

  // Template Analytics
  async getTemplateAnalytics(templateId) {
    return this.apiCall(`/templates/${templateId}`);
  }

  async getPopularTemplates() {
    return this.apiCall('/templates/popular');
  }

  async getTemplateUsage() {
    return this.apiCall('/templates/usage');
  }

  // User Analytics
  async getUserAnalytics(userId) {
    return this.apiCall(`/users/${userId}`);
  }

  async getUserActivity() {
    return this.apiCall('/users/activity');
  }

  async getUserEngagement() {
    return this.apiCall('/users/engagement');
  }

  // System Analytics
  async getSystemOverview() {
    return this.apiCall('/system/overview');
  }

  async getSystemPerformance() {
    return this.apiCall('/system/performance');
  }

  async getSystemUsage() {
    return this.apiCall('/system/usage');
  }

  // Compliance Analytics
  async getComplianceAnalytics(nrType) {
    return this.apiCall(`/compliance/${nrType}`);
  }

  async getTrainingCompliance() {
    return this.apiCall('/compliance/training/overview');
  }

  async getComplianceReports() {
    return this.apiCall('/compliance/reports');
  }

  // Reports
  async generateReport(type, parameters = {}) {
    return this.apiCall(`/reports/${type}/generate`, {
      method: 'POST',
      body: JSON.stringify(parameters)
    });
  }

  async getReport(reportId) {
    return this.apiCall(`/reports/${reportId}`);
  }

  async getReports() {
    return this.apiCall('/reports');
  }

  async deleteReport(reportId) {
    return this.apiCall(`/reports/${reportId}`, {
      method: 'DELETE'
    });
  }

  // Export Data
  async exportData(parameters = {}) {
    return this.apiCall('/export', {
      method: 'POST',
      body: JSON.stringify(parameters)
    });
  }

  // Real-time Analytics
  async getActiveUsers() {
    return this.apiCall('/realtime/users');
  }

  async getSystemStatus() {
    return this.apiCall('/realtime/system');
  }

  async getRealTimeMetrics() {
    return this.apiCall('/realtime/metrics');
  }

  // Custom Analytics
  async customQuery(query, parameters = {}) {
    return this.apiCall('/custom/query', {
      method: 'POST',
      body: JSON.stringify({ query, parameters })
    });
  }

  // Metrics Collection
  async trackMetric(metric, value, metadata = {}) {
    return this.apiCall('/metrics/track', {
      method: 'POST',
      body: JSON.stringify({ metric, value, metadata })
    });
  }

  async trackEvent(event, properties = {}) {
    return this.apiCall('/events/track', {
      method: 'POST',
      body: JSON.stringify({ event, properties })
    });
  }

  // PRD Specific Analytics

  // Engagement Metrics
  async getEngagementMetrics(projectId = null, timeframe = '30d') {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('timeframe', timeframe);
    
    return this.apiCall(`/engagement/metrics?${params.toString()}`);
  }

  // Compliance Reporting
  async getComplianceReporting(nrType = null, period = '30d', department = null) {
    const params = new URLSearchParams();
    if (nrType) params.append('nrType', nrType);
    params.append('period', period);
    if (department) params.append('department', department);
    
    return this.apiCall(`/compliance/reporting?${params.toString()}`);
  }

  // Executive Dashboard
  async getExecutiveDashboard(period = '30d', department = null) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (department) params.append('department', department);
    
    return this.apiCall(`/executive/dashboard?${params.toString()}`);
  }

  // Training ROI Analysis
  async getTrainingROI(period = '30d', department = null, trainingType = null) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (department) params.append('department', department);
    if (trainingType) params.append('trainingType', trainingType);
    
    return this.apiCall(`/training/roi?${params.toString()}`);
  }

  // ROI Analysis
  async getROIAnalysis(period = '30d', department = null, trainingType = null) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (department) params.append('department', department);
    if (trainingType) params.append('trainingType', trainingType);
    
    return this.apiCall(`/roi/analysis?${params.toString()}`);
  }

  // Security Analysis
  async getSecurityAnalysis(period = '30d', department = null, riskLevel = null) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (department) params.append('department', department);
    if (riskLevel) params.append('riskLevel', riskLevel);
    
    return this.apiCall(`/security/analysis?${params.toString()}`);
  }

  // Incident Analysis
  async getIncidentAnalysis(period = '30d', department = null, severity = null) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (department) params.append('department', department);
    if (severity) params.append('severity', severity);
    
    return this.apiCall(`/security/incidents?${params.toString()}`);
  }

  // Safety Program Effectiveness
  async getSafetyProgramEffectiveness(period = '30d', program = null) {
    const params = new URLSearchParams();
    params.append('period', period);
    if (program) params.append('program', program);
    
    return this.apiCall(`/safety/effectiveness?${params.toString()}`);
  }

  // Certification Management
  async getCertificationStatus(userId = null, nrType = null) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (nrType) params.append('nrType', nrType);
    
    return this.apiCall(`/certification/status?${params.toString()}`);
  }

  // Audit Trail
  async getAuditTrail(startDate = null, endDate = null, userId = null, action = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (userId) params.append('userId', userId);
    if (action) params.append('action', action);
    
    return this.apiCall(`/audit/trail?${params.toString()}`);
  }
}

// Create and export singleton instance
const analyticsAPI = new AnalyticsAPI();
export default analyticsAPI;