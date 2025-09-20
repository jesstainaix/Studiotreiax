import { CoverageData, TestResult, CoverageReport } from '../types/testing';

export interface CoverageThresholds {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface CoverageAnalysisResult {
  coverage: CoverageData;
  thresholds: CoverageThresholds;
  violations: string[];
  recommendations: string[];
  trend: CoverageTrend[];
}

export interface CoverageTrend {
  date: string;
  coverage: number;
  change: number;
}

export class CoverageAnalyzer {
  private static instance: CoverageAnalyzer;
  private thresholds: CoverageThresholds;
  private history: CoverageData[] = [];

  private constructor() {
    this.thresholds = {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    };
    this.loadHistory();
  }

  public static getInstance(): CoverageAnalyzer {
    if (!CoverageAnalyzer.instance) {
      CoverageAnalyzer.instance = new CoverageAnalyzer();
    }
    return CoverageAnalyzer.instance;
  }

  public analyzeCoverage(testResults: TestResult[]): CoverageAnalysisResult {
    const coverage = this.calculateCoverage(testResults);
    const violations = this.checkThresholds(coverage);
    const recommendations = this.generateRecommendations(coverage, violations);
    const trend = this.calculateTrend(coverage);

    // Store in history
    this.addToHistory(coverage);

    return {
      coverage,
      thresholds: this.thresholds,
      violations,
      recommendations,
      trend
    };
  }

  public generateCoverageReport(analysis: CoverageAnalysisResult): CoverageReport {
    const timestamp = new Date();
    
    return {
      id: `coverage-${timestamp.getTime()}`,
      timestamp,
      coverage: analysis.coverage,
      thresholds: analysis.thresholds,
      violations: analysis.violations,
      recommendations: analysis.recommendations,
      trend: analysis.trend,
      summary: this.generateSummary(analysis),
      details: this.generateDetails(analysis)
    };
  }

  public setThresholds(thresholds: Partial<CoverageThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.saveThresholds();
  }

  public getThresholds(): CoverageThresholds {
    return { ...this.thresholds };
  }

  public exportCoverageData(format: 'json' | 'csv' | 'xml'): string {
    const data = {
      history: this.history,
      thresholds: this.thresholds,
      lastAnalysis: this.history[this.history.length - 1]
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'xml':
        return this.convertToXML(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private calculateCoverage(testResults: TestResult[]): CoverageData {
    // Simulate coverage calculation from test results
    // In a real implementation, this would integrate with coverage tools
    const totalFiles = testResults.length;
    const coveredFiles = testResults.filter(test => test.coverage && test.coverage > 0).length;
    
    const baseCoverage = totalFiles > 0 ? (coveredFiles / totalFiles) * 100 : 0;
    
    return {
      total: Math.round(baseCoverage + Math.random() * 10),
      statements: Math.round(baseCoverage + Math.random() * 15),
      branches: Math.round(baseCoverage - Math.random() * 10),
      functions: Math.round(baseCoverage + Math.random() * 5),
      lines: Math.round(baseCoverage + Math.random() * 8),
      files: {
        total: totalFiles,
        covered: coveredFiles,
        uncovered: totalFiles - coveredFiles
      }
    };
  }

  private checkThresholds(coverage: CoverageData): string[] {
    const violations: string[] = [];

    if (coverage.statements < this.thresholds.statements) {
      violations.push(`Statement coverage (${coverage.statements}%) below threshold (${this.thresholds.statements}%)`);
    }

    if (coverage.branches < this.thresholds.branches) {
      violations.push(`Branch coverage (${coverage.branches}%) below threshold (${this.thresholds.branches}%)`);
    }

    if (coverage.functions < this.thresholds.functions) {
      violations.push(`Function coverage (${coverage.functions}%) below threshold (${this.thresholds.functions}%)`);
    }

    if (coverage.lines < this.thresholds.lines) {
      violations.push(`Line coverage (${coverage.lines}%) below threshold (${this.thresholds.lines}%)`);
    }

    return violations;
  }

  private generateRecommendations(coverage: CoverageData, violations: string[]): string[] {
    const recommendations: string[] = [];

    if (violations.length === 0) {
      recommendations.push('Excellent coverage! Consider maintaining current testing practices.');
      return recommendations;
    }

    if (coverage.statements < this.thresholds.statements) {
      recommendations.push('Add more unit tests to cover untested statements');
      recommendations.push('Focus on testing edge cases and error conditions');
    }

    if (coverage.branches < this.thresholds.branches) {
      recommendations.push('Improve branch coverage by testing all conditional paths');
      recommendations.push('Add tests for if/else statements and switch cases');
    }

    if (coverage.functions < this.thresholds.functions) {
      recommendations.push('Ensure all functions have corresponding tests');
      recommendations.push('Pay special attention to utility and helper functions');
    }

    if (coverage.lines < this.thresholds.lines) {
      recommendations.push('Increase line coverage by testing more code paths');
      recommendations.push('Remove or test dead code that is not covered');
    }

    // General recommendations
    if (coverage.total < 70) {
      recommendations.push('Consider implementing Test-Driven Development (TDD)');
      recommendations.push('Set up automated coverage reporting in CI/CD pipeline');
    }

    return recommendations;
  }

  private calculateTrend(currentCoverage: CoverageData): CoverageTrend[] {
    const trend: CoverageTrend[] = [];
    const days = 7;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let coverage: number;
      let change: number;
      
      if (i === 0) {
        // Current day
        coverage = currentCoverage.total;
        change = this.history.length > 1 ? 
          coverage - this.history[this.history.length - 2].total : 0;
      } else {
        // Historical data (simulated)
        const baseValue = currentCoverage.total;
        coverage = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 10));
        change = i === days - 1 ? 0 : (Math.random() - 0.5) * 5;
      }
      
      trend.push({
        date: date.toISOString().split('T')[0],
        coverage: Math.round(coverage * 100) / 100,
        change: Math.round(change * 100) / 100
      });
    }
    
    return trend;
  }

  private generateSummary(analysis: CoverageAnalysisResult): string {
    const { coverage, violations } = analysis;
    
    if (violations.length === 0) {
      return `Excellent coverage at ${coverage.total}%. All thresholds met.`;
    }
    
    return `Coverage at ${coverage.total}% with ${violations.length} threshold violation(s). Improvement needed.`;
  }

  private generateDetails(analysis: CoverageAnalysisResult): Record<string, any> {
    return {
      coverageBreakdown: {
        statements: `${analysis.coverage.statements}% (threshold: ${analysis.thresholds.statements}%)`,
        branches: `${analysis.coverage.branches}% (threshold: ${analysis.thresholds.branches}%)`,
        functions: `${analysis.coverage.functions}% (threshold: ${analysis.thresholds.functions}%)`,
        lines: `${analysis.coverage.lines}% (threshold: ${analysis.thresholds.lines}%)`
      },
      filesCoverage: analysis.coverage.files,
      trendAnalysis: {
        direction: this.getTrendDirection(analysis.trend),
        averageChange: this.getAverageChange(analysis.trend)
      },
      nextSteps: analysis.recommendations.slice(0, 3)
    };
  }

  private getTrendDirection(trend: CoverageTrend[]): 'improving' | 'declining' | 'stable' {
    if (trend.length < 2) return 'stable';
    
    const recentChange = trend[trend.length - 1].change;
    
    if (recentChange > 1) return 'improving';
    if (recentChange < -1) return 'declining';
    return 'stable';
  }

  private getAverageChange(trend: CoverageTrend[]): number {
    if (trend.length === 0) return 0;
    
    const totalChange = trend.reduce((sum, item) => sum + item.change, 0);
    return Math.round((totalChange / trend.length) * 100) / 100;
  }

  private addToHistory(coverage: CoverageData): void {
    this.history.push(coverage);
    
    // Keep only last 30 entries
    if (this.history.length > 30) {
      this.history = this.history.slice(-30);
    }
    
    this.saveHistory();
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('coverageHistory');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load coverage history:', error);
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('coverageHistory', JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save coverage history:', error);
    }
  }

  private saveThresholds(): void {
    try {
      localStorage.setItem('coverageThresholds', JSON.stringify(this.thresholds));
    } catch (error) {
      console.warn('Failed to save coverage thresholds:', error);
    }
  }

  private convertToCSV(data: any): string {
    const headers = ['Date', 'Total', 'Statements', 'Branches', 'Functions', 'Lines'];
    const rows = data.history.map((item: CoverageData, index: number) => {
      const date = new Date();
      date.setDate(date.getDate() - (data.history.length - 1 - index));
      return [
        date.toISOString().split('T')[0],
        item.total,
        item.statements,
        item.branches,
        item.functions,
        item.lines
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  private convertToXML(data: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<coverage>\n';
    
    xml += '  <thresholds>\n';
    Object.entries(data.thresholds).forEach(([key, value]) => {
      xml += `    <${key}>${value}</${key}>\n`;
    });
    xml += '  </thresholds>\n';
    
    xml += '  <history>\n';
    data.history.forEach((item: CoverageData, index: number) => {
      const date = new Date();
      date.setDate(date.getDate() - (data.history.length - 1 - index));
      xml += '    <entry>\n';
      xml += `      <date>${date.toISOString().split('T')[0]}</date>\n`;
      xml += `      <total>${item.total}</total>\n`;
      xml += `      <statements>${item.statements}</statements>\n`;
      xml += `      <branches>${item.branches}</branches>\n`;
      xml += `      <functions>${item.functions}</functions>\n`;
      xml += `      <lines>${item.lines}</lines>\n`;
      xml += '    </entry>\n';
    });
    xml += '  </history>\n';
    
    xml += '</coverage>';
    return xml;
  }
}

// Export singleton instance
export const coverageAnalyzer = CoverageAnalyzer.getInstance();

// Export utility functions
export const analyzeCoverage = (testResults: TestResult[]) => 
  coverageAnalyzer.analyzeCoverage(testResults);

export const generateCoverageReport = (analysis: CoverageAnalysisResult) => 
  coverageAnalyzer.generateCoverageReport(analysis);

export const setCoverageThresholds = (thresholds: Partial<CoverageThresholds>) => 
  coverageAnalyzer.setThresholds(thresholds);

export const getCoverageThresholds = () => 
  coverageAnalyzer.getThresholds();

export const exportCoverageData = (format: 'json' | 'csv' | 'xml') => 
  coverageAnalyzer.exportCoverageData(format);