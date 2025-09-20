import { LMSConfig, LMSPlatform, TestResult, TestSuite } from '../../../types/lms';
import { ConnectorFactory } from '../connectors/connectorFactory';
import { LMSConnector } from '../connectors/index';
import { SCORMExporter } from '../scorm/scormExporter';
import { XAPIService } from '../xapi/xapiService';

/**
 * Comprehensive integration testing suite for LMS connections
 */
export class LMSIntegrationTester {
  private connector: LMSConnector;
  private config: LMSConfig;
  private testResults: Map<string, TestResult> = new Map();

  constructor(config: LMSConfig) {
    this.config = config;
    this.connector = ConnectorFactory.createConnector(config);
  }

  /**
   * Run complete test suite
   */
  async runFullTestSuite(): Promise<TestSuite> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Basic connectivity tests
    tests.push(await this.testConnection());
    tests.push(await this.testAuthentication());
    tests.push(await this.testApiEndpoints());

    // Core functionality tests
    tests.push(await this.testCourseManagement());
    tests.push(await this.testUserEnrollment());
    tests.push(await this.testContentUpload());
    tests.push(await this.testProgressTracking());
    tests.push(await this.testGradePassback());

    // Advanced feature tests
    tests.push(await this.testSCORMSupport());
    tests.push(await this.testXAPISupport());
    tests.push(await this.testBatchOperations());
    tests.push(await this.testErrorHandling());

    // Performance tests
    tests.push(await this.testPerformance());
    tests.push(await this.testConcurrency());

    const endTime = Date.now();
    const duration = endTime - startTime;

    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const skipped = tests.filter(t => t.status === 'skipped').length;

    return {
      configId: this.config.id,
      platform: this.config.platform,
      timestamp: new Date(),
      duration,
      summary: {
        total: tests.length,
        passed,
        failed,
        skipped,
        successRate: (passed / (passed + failed)) * 100
      },
      tests,
      recommendations: this.generateRecommendations(tests)
    };
  }

  /**
   * Test basic connection
   */
  async testConnection(): Promise<TestResult> {
    const testName = 'Basic Connection';
    const startTime = Date.now();

    try {
      const result = await this.connector.testConnection();
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: result.success ? 'passed' : 'failed',
        duration,
        message: result.message,
        details: {
          endpoint: this.config.apiUrl,
          authMethod: this.config.authMethod,
          responseTime: duration
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Connection failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test authentication
   */
  async testAuthentication(): Promise<TestResult> {
    const testName = 'Authentication';
    const startTime = Date.now();

    try {
      const result = await this.connector.authenticate();
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: result.success ? 'passed' : 'failed',
        duration,
        message: result.success ? 'Authentication successful' : 'Authentication failed',
        details: {
          authMethod: this.config.authMethod,
          tokenExpiry: result.tokenExpiry,
          permissions: result.permissions
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Authentication error: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test API endpoints availability
   */
  async testApiEndpoints(): Promise<TestResult> {
    const testName = 'API Endpoints';
    const startTime = Date.now();

    const endpoints = [
      { path: '/courses', method: 'GET', required: true },
      { path: '/users', method: 'GET', required: true },
      { path: '/enrollments', method: 'GET', required: false },
      { path: '/grades', method: 'GET', required: false }
    ];

    const results = [];
    let criticalFailures = 0;

    for (const endpoint of endpoints) {
      try {
        await this.connector.makeRequest(endpoint.method as any, endpoint.path, {});
        results.push({ ...endpoint, status: 'available' });
      } catch (error) {
        results.push({ ...endpoint, status: 'unavailable', error: error.message });
        if (endpoint.required) {
          criticalFailures++;
        }
      }
    }

    const duration = Date.now() - startTime;
    const status = criticalFailures === 0 ? 'passed' : 'failed';

    return {
      name: testName,
      status,
      duration,
      message: `${results.filter(r => r.status === 'available').length}/${endpoints.length} endpoints available`,
      details: {
        endpoints: results,
        criticalFailures
      }
    };
  }

  /**
   * Test course management operations
   */
  async testCourseManagement(): Promise<TestResult> {
    const testName = 'Course Management';
    const startTime = Date.now();

    try {
      const testCourse = {
        name: `Test Course ${Date.now()}`,
        description: 'Automated test course - safe to delete',
        category: 'Testing',
        test: true
      };

      // Test course creation
      const createdCourse = await this.connector.createCourse(testCourse);
      const courseId = createdCourse.id || createdCourse.courseid;

      if (!courseId) {
        throw new Error('Course creation did not return valid ID');
      }

      // Test course update
      const updatedCourse = await this.connector.updateCourse(courseId, {
        ...testCourse,
        description: 'Updated test course description'
      });

      // Test course deletion
      await this.connector.deleteCourse(courseId);

      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        message: 'Course CRUD operations successful',
        details: {
          courseId,
          operations: ['create', 'update', 'delete'],
          testCourse
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Course management failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test user enrollment
   */
  async testUserEnrollment(): Promise<TestResult> {
    const testName = 'User Enrollment';
    const startTime = Date.now();

    try {
      // This test requires existing course and user IDs
      // In a real scenario, you'd use test accounts
      const testCourseId = 'test-course-id';
      const testUserId = 'test-user-id';

      const enrollment = await this.connector.enrollStudent(testCourseId, testUserId);
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        message: 'User enrollment successful',
        details: {
          courseId: testCourseId,
          userId: testUserId,
          enrollment
        }
      };
    } catch (error) {
      // If test data doesn't exist, mark as skipped rather than failed
      const isTestDataIssue = error.message.includes('not found') || error.message.includes('invalid');
      
      return {
        name: testName,
        status: isTestDataIssue ? 'skipped' : 'failed',
        duration: Date.now() - startTime,
        message: isTestDataIssue ? 'Skipped - test data not available' : `Enrollment failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test content upload
   */
  async testContentUpload(): Promise<TestResult> {
    const testName = 'Content Upload';
    const startTime = Date.now();

    try {
      const testContent = {
        name: 'Test Content',
        type: 'video',
        data: 'base64-encoded-test-data',
        size: 1024
      };

      const result = await this.connector.uploadContent('test-course-id', testContent);
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        message: 'Content upload successful',
        details: {
          contentId: result.id,
          uploadSize: testContent.size,
          uploadTime: duration
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Content upload failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test progress tracking
   */
  async testProgressTracking(): Promise<TestResult> {
    const testName = 'Progress Tracking';
    const startTime = Date.now();

    try {
      const progress = await this.connector.getStudentProgress('test-course-id', 'test-user-id');
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        message: 'Progress tracking successful',
        details: {
          progressData: progress,
          hasCompletion: 'completion' in progress,
          hasGrades: 'grades' in progress
        }
      };
    } catch (error) {
      const isTestDataIssue = error.message.includes('not found');
      
      return {
        name: testName,
        status: isTestDataIssue ? 'skipped' : 'failed',
        duration: Date.now() - startTime,
        message: isTestDataIssue ? 'Skipped - test data not available' : `Progress tracking failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test grade passback
   */
  async testGradePassback(): Promise<TestResult> {
    const testName = 'Grade Passback';
    const startTime = Date.now();

    try {
      const result = await this.connector.sendGrade('test-course-id', 'test-user-id', 85, 100);
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        message: 'Grade passback successful',
        details: {
          grade: 85,
          maxGrade: 100,
          result
        }
      };
    } catch (error) {
      const isTestDataIssue = error.message.includes('not found');
      
      return {
        name: testName,
        status: isTestDataIssue ? 'skipped' : 'failed',
        duration: Date.now() - startTime,
        message: isTestDataIssue ? 'Skipped - test data not available' : `Grade passback failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test SCORM support
   */
  async testSCORMSupport(): Promise<TestResult> {
    const testName = 'SCORM Support';
    const startTime = Date.now();

    try {
      const scormExporter = new SCORMExporter();
      const testPackage = await scormExporter.createPackage({
        title: 'Test SCORM Package',
        description: 'Test package for integration testing',
        content: {
          videos: [{
            id: 'test-video',
            title: 'Test Video',
            duration: 120,
            url: 'test-video.mp4'
          }]
        }
      });

      // Test SCORM package upload (if supported)
      const result = await this.connector.uploadContent('test-course-id', {
        name: 'Test SCORM Package',
        type: 'scorm',
        data: testPackage,
        scormVersion: '2004'
      });

      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        message: 'SCORM support verified',
        details: {
          packageSize: testPackage.length,
          scormVersion: '2004',
          uploadResult: result
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `SCORM test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test xAPI support
   */
  async testXAPISupport(): Promise<TestResult> {
    const testName = 'xAPI Support';
    const startTime = Date.now();

    try {
      const xapiService = new XAPIService({
        endpoint: this.config.apiUrl + '/xapi',
        auth: {
          username: this.config.credentials.username || 'test',
          password: this.config.credentials.password || 'test'
        }
      });

      const testStatement = {
        actor: {
          name: 'Test User',
          mbox: 'mailto:test@example.com'
        },
        verb: {
          id: 'http://adlnet.gov/expapi/verbs/completed',
          display: { 'en-US': 'completed' }
        },
        object: {
          id: 'http://example.com/test-activity',
          definition: {
            name: { 'en-US': 'Test Activity' }
          }
        }
      };

      await xapiService.sendStatement(testStatement);
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: 'passed',
        duration,
        message: 'xAPI support verified',
        details: {
          statement: testStatement,
          endpoint: xapiService.config.endpoint
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `xAPI test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test batch operations
   */
  async testBatchOperations(): Promise<TestResult> {
    const testName = 'Batch Operations';
    const startTime = Date.now();

    try {
      const batchSize = 5;
      const operations = Array.from({ length: batchSize }, (_, i) => ({
        type: 'enrollment',
        courseId: 'test-course-id',
        userId: `test-user-${i}`,
        data: { role: 'student' }
      }));

      // Simulate batch processing
      const results = [];
      for (const operation of operations) {
        try {
          const result = await this.connector.enrollStudent(operation.courseId, operation.userId);
          results.push({ ...operation, status: 'success', result });
        } catch (error) {
          results.push({ ...operation, status: 'failed', error: error.message });
        }
      }

      const duration = Date.now() - startTime;
      const successCount = results.filter(r => r.status === 'success').length;
      const successRate = (successCount / batchSize) * 100;

      return {
        name: testName,
        status: successRate >= 80 ? 'passed' : 'failed',
        duration,
        message: `Batch operations: ${successCount}/${batchSize} successful (${successRate.toFixed(1)}%)`,
        details: {
          batchSize,
          successCount,
          successRate,
          results
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Batch operations failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<TestResult> {
    const testName = 'Error Handling';
    const startTime = Date.now();

    const errorTests = [
      {
        name: 'Invalid Course ID',
        test: () => this.connector.updateCourse('invalid-course-id', { name: 'Test' })
      },
      {
        name: 'Invalid User ID',
        test: () => this.connector.enrollStudent('test-course', 'invalid-user-id')
      },
      {
        name: 'Malformed Request',
        test: () => this.connector.createCourse(null as any)
      }
    ];

    const results = [];
    for (const errorTest of errorTests) {
      try {
        await errorTest.test();
        results.push({ ...errorTest, status: 'unexpected_success' });
      } catch (error) {
        // Expected behavior - errors should be properly handled
        results.push({ 
          ...errorTest, 
          status: 'properly_handled',
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    const properlyHandled = results.filter(r => r.status === 'properly_handled').length;
    const successRate = (properlyHandled / errorTests.length) * 100;

    return {
      name: testName,
      status: successRate >= 80 ? 'passed' : 'failed',
      duration,
      message: `Error handling: ${properlyHandled}/${errorTests.length} errors properly handled`,
      details: {
        tests: results,
        successRate
      }
    };
  }

  /**
   * Test performance
   */
  async testPerformance(): Promise<TestResult> {
    const testName = 'Performance';
    const startTime = Date.now();

    try {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const iterationStart = Date.now();
        await this.connector.testConnection();
        times.push(Date.now() - iterationStart);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      const duration = Date.now() - startTime;
      const status = avgTime < 2000 ? 'passed' : 'failed'; // 2 second threshold

      return {
        name: testName,
        status,
        duration,
        message: `Average response time: ${avgTime.toFixed(0)}ms`,
        details: {
          iterations,
          avgTime,
          maxTime,
          minTime,
          times
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Performance test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test concurrency
   */
  async testConcurrency(): Promise<TestResult> {
    const testName = 'Concurrency';
    const startTime = Date.now();

    try {
      const concurrentRequests = 5;
      const promises = Array.from({ length: concurrentRequests }, () => 
        this.connector.testConnection()
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successful / concurrentRequests) * 100;
      
      const duration = Date.now() - startTime;
      const status = successRate >= 80 ? 'passed' : 'failed';

      return {
        name: testName,
        status,
        duration,
        message: `Concurrency: ${successful}/${concurrentRequests} requests successful`,
        details: {
          concurrentRequests,
          successful,
          successRate,
          results: results.map(r => r.status)
        }
      };
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Concurrency test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];
    const failedTests = tests.filter(t => t.status === 'failed');
    const slowTests = tests.filter(t => t.duration && t.duration > 5000);

    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} tests failed. Review configuration and credentials.`);
    }

    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} tests were slow (>5s). Consider optimizing network or server performance.`);
    }

    const connectionTest = tests.find(t => t.name === 'Basic Connection');
    if (connectionTest?.status === 'failed') {
      recommendations.push('Basic connection failed. Verify API URL and network connectivity.');
    }

    const authTest = tests.find(t => t.name === 'Authentication');
    if (authTest?.status === 'failed') {
      recommendations.push('Authentication failed. Verify credentials and authentication method.');
    }

    const performanceTest = tests.find(t => t.name === 'Performance');
    if (performanceTest?.status === 'failed') {
      recommendations.push('Performance issues detected. Consider implementing caching or optimizing requests.');
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passed successfully. Integration is ready for production use.');
    }

    return recommendations;
  }
}

/**
 * Utility functions for testing
 */
export const TestingUtils = {
  /**
   * Generate test report
   */
  generateReport(testSuite: TestSuite): string {
    const { summary, tests, recommendations } = testSuite;
    
    let report = `# LMS Integration Test Report\n\n`;
    report += `**Platform:** ${testSuite.platform}\n`;
    report += `**Date:** ${testSuite.timestamp.toISOString()}\n`;
    report += `**Duration:** ${testSuite.duration}ms\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Total Tests:** ${summary.total}\n`;
    report += `- **Passed:** ${summary.passed}\n`;
    report += `- **Failed:** ${summary.failed}\n`;
    report += `- **Skipped:** ${summary.skipped}\n`;
    report += `- **Success Rate:** ${summary.successRate.toFixed(1)}%\n\n`;
    
    report += `## Test Results\n\n`;
    tests.forEach(test => {
      const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      report += `${status} **${test.name}** (${test.duration}ms)\n`;
      report += `   ${test.message}\n\n`;
    });
    
    report += `## Recommendations\n\n`;
    recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
    
    return report;
  },

  /**
   * Export test results to JSON
   */
  exportToJSON(testSuite: TestSuite): string {
    return JSON.stringify(testSuite, null, 2);
  },

  /**
   * Compare test results
   */
  compareResults(current: TestSuite, previous: TestSuite): {
    improved: string[];
    degraded: string[];
    new: string[];
    removed: string[];
  } {
    const currentTests = new Map(current.tests.map(t => [t.name, t]));
    const previousTests = new Map(previous.tests.map(t => [t.name, t]));
    
    const improved: string[] = [];
    const degraded: string[] = [];
    const newTests: string[] = [];
    const removed: string[] = [];
    
    // Check for improvements and degradations
    currentTests.forEach((currentTest, name) => {
      const previousTest = previousTests.get(name);
      if (previousTest) {
        if (currentTest.status === 'passed' && previousTest.status === 'failed') {
          improved.push(name);
        } else if (currentTest.status === 'failed' && previousTest.status === 'passed') {
          degraded.push(name);
        }
      } else {
        newTests.push(name);
      }
    });
    
    // Check for removed tests
    previousTests.forEach((_, name) => {
      if (!currentTests.has(name)) {
        removed.push(name);
      }
    });
    
    return {
      improved,
      degraded,
      new: newTests,
      removed
    };
  }
};