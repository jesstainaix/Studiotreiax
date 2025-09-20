import { TestResult, TestReport, TestType, TestStatus } from '../types/testing';
import { CoverageData } from './coverageAnalyzer';

export interface ReportConfig {
  includeDetails: boolean;
  includeCoverage: boolean;
  includeCharts: boolean;
  includeEnvironment: boolean;
  theme: 'light' | 'dark';
  format: 'html' | 'json' | 'xml' | 'pdf';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface ReportMetrics {
  totalTests: number;
  passRate: number;
  failRate: number;
  averageDuration: number;
  coveragePercentage: number;
  flakyTests: number;
  slowTests: TestResult[];
  failedTests: TestResult[];
  trends: {
    passRateTrend: number;
    coverageTrend: number;
    durationTrend: number;
  };
}

export class ReportGenerator {
  private static instance: ReportGenerator;
  private config: ReportConfig;
  private templates: Map<string, string> = new Map();

  private constructor() {
    this.config = {
      includeDetails: true,
      includeCoverage: true,
      includeCharts: true,
      includeEnvironment: true,
      theme: 'light',
      format: 'html'
    };
    this.initializeTemplates();
  }

  public static getInstance(): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator();
    }
    return ReportGenerator.instance;
  }

  public async generateReport(
    results: TestResult[],
    coverage?: CoverageData,
    config?: Partial<ReportConfig>
  ): Promise<string> {
    const reportConfig = { ...this.config, ...config };
    const metrics = this.calculateMetrics(results);
    const charts = this.generateChartData(results, metrics);

    const report: TestReport = {
      id: `report-${Date.now()}`,
      timestamp: new Date(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        pending: results.filter(r => r.status === 'pending').length,
        duration: results.reduce((sum, r) => sum + r.duration, 0),
        coverage: coverage?.overall || metrics.coveragePercentage
      },
      results,
      environment: this.getEnvironmentInfo(),
      config: reportConfig,
      metrics,
      charts,
      coverage
    };

    switch (reportConfig.format) {
      case 'html':
        return this.generateHTMLReport(report);
      case 'json':
        return this.generateJSONReport(report);
      case 'xml':
        return this.generateXMLReport(report);
      case 'pdf':
        return this.generatePDFReport(report);
      default:
        throw new Error(`Unsupported format: ${reportConfig.format}`);
    }
  }

  public generateDashboardData(results: TestResult[]): any {
    const metrics = this.calculateMetrics(results);
    const charts = this.generateChartData(results, metrics);

    return {
      summary: {
        totalTests: metrics.totalTests,
        passRate: metrics.passRate,
        failRate: metrics.failRate,
        coverage: metrics.coveragePercentage,
        avgDuration: metrics.averageDuration
      },
      charts: {
        statusDistribution: charts.statusChart,
        typeDistribution: charts.typeChart,
        durationTrend: charts.durationChart,
        coverageTrend: charts.coverageChart
      },
      insights: this.generateInsights(results, metrics),
      recommendations: this.generateRecommendations(results, metrics)
    };
  }

  public exportReport(report: string, filename: string, format: string): void {
    const blob = new Blob([report], { 
      type: this.getMimeType(format) 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public updateConfig(newConfig: Partial<ReportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ReportConfig {
    return { ...this.config };
  }

  private calculateMetrics(results: TestResult[]): ReportMetrics {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed');
    const slowTests = results
      .filter(r => r.duration > 5000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const failRate = totalTests > 0 ? (failedTests.length / totalTests) * 100 : 0;
    const averageDuration = totalTests > 0 ? 
      results.reduce((sum, r) => sum + r.duration, 0) / totalTests : 0;
    
    const coveragePercentage = totalTests > 0 ?
      results.reduce((sum, r) => sum + (r.coverage || 0), 0) / totalTests : 0;

    // Simulate flaky test detection
    const flakyTests = Math.floor(totalTests * 0.05); // 5% flaky rate

    // Simulate trends (would come from historical data)
    const trends = {
      passRateTrend: Math.random() * 10 - 5, // -5% to +5%
      coverageTrend: Math.random() * 8 - 4,  // -4% to +4%
      durationTrend: Math.random() * 20 - 10 // -10% to +10%
    };

    return {
      totalTests,
      passRate,
      failRate,
      averageDuration,
      coveragePercentage,
      flakyTests,
      slowTests,
      failedTests,
      trends
    };
  }

  private generateChartData(results: TestResult[], metrics: ReportMetrics): any {
    // Status distribution chart
    const statusChart: ChartData = {
      labels: ['Passed', 'Failed', 'Skipped', 'Pending'],
      datasets: [{
        label: 'Test Status',
        data: [
          results.filter(r => r.status === 'passed').length,
          results.filter(r => r.status === 'failed').length,
          results.filter(r => r.status === 'skipped').length,
          results.filter(r => r.status === 'pending').length
        ],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#6B7280']
      }]
    };

    // Test type distribution
    const typeChart: ChartData = {
      labels: ['Unit', 'Integration', 'E2E'],
      datasets: [{
        label: 'Test Types',
        data: [
          results.filter(r => r.type === 'unit').length,
          results.filter(r => r.type === 'integration').length,
          results.filter(r => r.type === 'e2e').length
        ],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B']
      }]
    };

    // Duration trend (simulated)
    const durationChart: ChartData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Average Duration (ms)',
        data: [
          metrics.averageDuration * 0.9,
          metrics.averageDuration * 0.95,
          metrics.averageDuration * 1.1,
          metrics.averageDuration
        ],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }]
    };

    // Coverage trend (simulated)
    const coverageChart: ChartData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Coverage %',
        data: [
          metrics.coveragePercentage * 0.92,
          metrics.coveragePercentage * 0.96,
          metrics.coveragePercentage * 0.98,
          metrics.coveragePercentage
        ],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      }]
    };

    return {
      statusChart,
      typeChart,
      durationChart,
      coverageChart
    };
  }

  private generateInsights(results: TestResult[], metrics: ReportMetrics): string[] {
    const insights: string[] = [];

    if (metrics.passRate > 95) {
      insights.push('🎉 Excellent test pass rate! Your code quality is very high.');
    } else if (metrics.passRate < 80) {
      insights.push('⚠️ Low test pass rate detected. Consider reviewing failing tests.');
    }

    if (metrics.coveragePercentage > 90) {
      insights.push('📊 Great code coverage! Your tests cover most of the codebase.');
    } else if (metrics.coveragePercentage < 70) {
      insights.push('📈 Code coverage could be improved. Consider adding more tests.');
    }

    if (metrics.slowTests.length > 0) {
      insights.push(`⏱️ ${metrics.slowTests.length} slow tests detected. Consider optimization.`);
    }

    if (metrics.flakyTests > 0) {
      insights.push(`🔄 ${metrics.flakyTests} potentially flaky tests identified.`);
    }

    if (metrics.trends.passRateTrend > 2) {
      insights.push('📈 Test pass rate is improving over time!');
    } else if (metrics.trends.passRateTrend < -2) {
      insights.push('📉 Test pass rate is declining. Review recent changes.');
    }

    return insights;
  }

  private generateRecommendations(results: TestResult[], metrics: ReportMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.failRate > 10) {
      recommendations.push('Focus on fixing failing tests to improve overall stability.');
    }

    if (metrics.coveragePercentage < 80) {
      recommendations.push('Add more unit tests to increase code coverage.');
    }

    if (metrics.slowTests.length > 5) {
      recommendations.push('Optimize slow tests or consider running them separately.');
    }

    if (metrics.averageDuration > 10000) {
      recommendations.push('Consider parallelizing test execution to reduce overall runtime.');
    }

    const e2eTests = results.filter(r => r.type === 'e2e').length;
    const unitTests = results.filter(r => r.type === 'unit').length;
    
    if (e2eTests > unitTests) {
      recommendations.push('Consider adding more unit tests for faster feedback.');
    }

    if (metrics.flakyTests > metrics.totalTests * 0.1) {
      recommendations.push('Investigate and fix flaky tests to improve reliability.');
    }

    return recommendations;
  }

  private generateHTMLReport(report: TestReport): string {
    const template = this.templates.get('html') || this.getDefaultHTMLTemplate();
    
    return template
      .replace('{{TITLE}}', `Test Report - ${report.timestamp.toLocaleDateString()}`)
      .replace('{{TIMESTAMP}}', report.timestamp.toISOString())
      .replace('{{SUMMARY}}', this.generateHTMLSummary(report))
      .replace('{{CHARTS}}', this.generateHTMLCharts(report))
      .replace('{{DETAILS}}', this.generateHTMLDetails(report))
      .replace('{{INSIGHTS}}', this.generateHTMLInsights(report))
      .replace('{{THEME}}', report.config?.theme || 'light');
  }

  private generateJSONReport(report: TestReport): string {
    return JSON.stringify(report, null, 2);
  }

  private generateXMLReport(report: TestReport): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testReport>\n';
    xml += `  <id>${report.id}</id>\n`;
    xml += `  <timestamp>${report.timestamp.toISOString()}</timestamp>\n`;
    xml += this.generateXMLSummary(report);
    xml += this.generateXMLResults(report);
    xml += this.generateXMLMetrics(report);
    xml += '</testReport>';
    return xml;
  }

  private generatePDFReport(report: TestReport): string {
    // For PDF generation, we would typically use a library like jsPDF
    // For now, return HTML that can be converted to PDF
    return this.generateHTMLReport(report);
  }

  private generateHTMLSummary(report: TestReport): string {
    return `
      <div class="summary-grid">
        <div class="metric-card">
          <h3>Total Tests</h3>
          <div class="metric-value">${report.summary.total}</div>
        </div>
        <div class="metric-card passed">
          <h3>Passed</h3>
          <div class="metric-value">${report.summary.passed}</div>
        </div>
        <div class="metric-card failed">
          <h3>Failed</h3>
          <div class="metric-value">${report.summary.failed}</div>
        </div>
        <div class="metric-card">
          <h3>Coverage</h3>
          <div class="metric-value">${report.summary.coverage}%</div>
        </div>
      </div>
    `;
  }

  private generateHTMLCharts(report: TestReport): string {
    if (!report.config?.includeCharts) return '';
    
    return `
      <div class="charts-section">
        <h2>Visual Analytics</h2>
        <div class="charts-grid">
          <div class="chart-container">
            <canvas id="statusChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="typeChart"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  private generateHTMLDetails(report: TestReport): string {
    if (!report.config?.includeDetails) return '';
    
    let html = '<div class="details-section"><h2>Test Details</h2><table class="results-table">';
    html += '<thead><tr><th>Test Name</th><th>Type</th><th>Status</th><th>Duration</th><th>Coverage</th></tr></thead><tbody>';
    
    report.results.forEach(result => {
      html += `
        <tr class="${result.status}">
          <td>${result.name}</td>
          <td>${result.type}</td>
          <td><span class="status-badge ${result.status}">${result.status}</span></td>
          <td>${result.duration}ms</td>
          <td>${result.coverage || 0}%</td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    return html;
  }

  private generateHTMLInsights(report: TestReport): string {
    const insights = this.generateInsights(report.results, report.metrics!);
    const recommendations = this.generateRecommendations(report.results, report.metrics!);
    
    let html = '<div class="insights-section">';
    
    if (insights.length > 0) {
      html += '<h2>Insights</h2><ul class="insights-list">';
      insights.forEach(insight => {
        html += `<li>${insight}</li>`;
      });
      html += '</ul>';
    }
    
    if (recommendations.length > 0) {
      html += '<h2>Recommendations</h2><ul class="recommendations-list">';
      recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
      });
      html += '</ul>';
    }
    
    html += '</div>';
    return html;
  }

  private generateXMLSummary(report: TestReport): string {
    return `
  <summary>
    <total>${report.summary.total}</total>
    <passed>${report.summary.passed}</passed>
    <failed>${report.summary.failed}</failed>
    <skipped>${report.summary.skipped}</skipped>
    <coverage>${report.summary.coverage}</coverage>
    <duration>${report.summary.duration}</duration>
  </summary>
    `;
  }

  private generateXMLResults(report: TestReport): string {
    let xml = '  <results>\n';
    report.results.forEach(result => {
      xml += '    <test>\n';
      xml += `      <name>${this.escapeXML(result.name)}</name>\n`;
      xml += `      <type>${result.type}</type>\n`;
      xml += `      <status>${result.status}</status>\n`;
      xml += `      <duration>${result.duration}</duration>\n`;
      xml += `      <coverage>${result.coverage || 0}</coverage>\n`;
      if (result.error) {
        xml += `      <error>${this.escapeXML(result.error)}</error>\n`;
      }
      xml += '    </test>\n';
    });
    xml += '  </results>\n';
    return xml;
  }

  private generateXMLMetrics(report: TestReport): string {
    if (!report.metrics) return '';
    
    return `
  <metrics>
    <passRate>${report.metrics.passRate}</passRate>
    <failRate>${report.metrics.failRate}</failRate>
    <averageDuration>${report.metrics.averageDuration}</averageDuration>
    <flakyTests>${report.metrics.flakyTests}</flakyTests>
  </metrics>
    `;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      html: 'text/html',
      json: 'application/json',
      xml: 'application/xml',
      pdf: 'application/pdf'
    };
    return mimeTypes[format] || 'text/plain';
  }

  private getEnvironmentInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null
    };
  }

  private initializeTemplates(): void {
    this.templates.set('html', this.getDefaultHTMLTemplate());
  }

  private getDefaultHTMLTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en" data-theme="{{THEME}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        :root {
            --primary: #3B82F6;
            --success: #10B981;
            --warning: #F59E0B;
            --error: #EF4444;
            --bg: #FFFFFF;
            --surface: #F9FAFB;
            --text: #111827;
            --border: #E5E7EB;
        }
        
        [data-theme="dark"] {
            --bg: #111827;
            --surface: #1F2937;
            --text: #F9FAFB;
            --border: #374151;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        h1, h2, h3 { margin-bottom: 1rem; }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .metric-card {
            background: var(--surface);
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid var(--border);
            text-align: center;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin-top: 0.5rem;
        }
        
        .passed .metric-value { color: var(--success); }
        .failed .metric-value { color: var(--error); }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .chart-container {
            background: var(--surface);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid var(--border);
        }
        
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
        }
        
        .results-table th,
        .results-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        
        .results-table th {
            background: var(--surface);
            font-weight: 600;
        }
        
        .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .status-badge.passed { background: var(--success); color: white; }
        .status-badge.failed { background: var(--error); color: white; }
        .status-badge.skipped { background: var(--warning); color: white; }
        
        .insights-list,
        .recommendations-list {
            list-style: none;
            margin-bottom: 1rem;
        }
        
        .insights-list li,
        .recommendations-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--border);
        }
        
        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>{{TITLE}}</h1>
            <p>Generated on {{TIMESTAMP}}</p>
        </header>
        
        <main>
            {{SUMMARY}}
            {{CHARTS}}
            {{DETAILS}}
            {{INSIGHTS}}
        </main>
    </div>
</body>
</html>
    `;
  }
}

// Export singleton instance
export const reportGenerator = ReportGenerator.getInstance();

// Export utility functions
export const generateReport = (
  results: TestResult[], 
  coverage?: CoverageData, 
  config?: Partial<ReportConfig>
) => reportGenerator.generateReport(results, coverage, config);

export const generateDashboard = (results: TestResult[]) => 
  reportGenerator.generateDashboardData(results);

export const exportReport = (report: string, filename: string, format: string) => 
  reportGenerator.exportReport(report, filename, format);