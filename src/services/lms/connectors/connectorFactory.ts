import { LMSConfig, LMSPlatform } from '../../../types/lms';
import { LMSConnector } from './index';
import { MoodleConnector } from './moodleConnector';
import { CanvasConnector } from './canvasConnector';
import { BlackboardConnector } from './blackboardConnector';

/**
 * Factory class for creating LMS connectors based on platform type
 */
export class ConnectorFactory {
  private static connectors: Map<LMSPlatform, typeof MoodleConnector> = new Map([
    ['moodle', MoodleConnector],
    ['canvas', CanvasConnector],
    ['blackboard', BlackboardConnector]
  ]);

  /**
   * Create a connector instance for the specified LMS platform
   */
  static createConnector(config: LMSConfig): LMSConnector {
    const ConnectorClass = this.connectors.get(config.platform);
    
    if (!ConnectorClass) {
      throw new Error(`Unsupported LMS platform: ${config.platform}`);
    }

    return new ConnectorClass(config);
  }

  /**
   * Register a new connector for a platform
   */
  static registerConnector(platform: LMSPlatform, connectorClass: typeof MoodleConnector) {
    this.connectors.set(platform, connectorClass);
  }

  /**
   * Get list of supported platforms
   */
  static getSupportedPlatforms(): LMSPlatform[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * Check if a platform is supported
   */
  static isPlatformSupported(platform: LMSPlatform): boolean {
    return this.connectors.has(platform);
  }
}

/**
 * Generic connector for unsupported platforms
 */
export class GenericConnector extends MoodleConnector {
  constructor(config: LMSConfig) {
    super(config);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Basic HTTP test for generic platforms
      const response = await this.makeRequest('GET', '/api/health', {});
      return {
        success: response.status < 400,
        message: response.status < 400 ? 'Connection successful' : 'Connection failed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  async createCourse(courseData: any): Promise<any> {
    // Generic implementation - may need customization per platform
    return this.makeRequest('POST', '/api/courses', courseData);
  }

  async updateCourse(courseId: string, courseData: any): Promise<any> {
    return this.makeRequest('PUT', `/api/courses/${courseId}`, courseData);
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.makeRequest('DELETE', `/api/courses/${courseId}`, {});
  }

  async enrollStudent(courseId: string, userId: string): Promise<any> {
    return this.makeRequest('POST', `/api/courses/${courseId}/enrollments`, {
      user_id: userId
    });
  }

  async getStudentProgress(courseId: string, userId: string): Promise<any> {
    return this.makeRequest('GET', `/api/courses/${courseId}/progress/${userId}`, {});
  }

  async sendGrade(courseId: string, userId: string, grade: number, maxGrade: number = 100): Promise<any> {
    return this.makeRequest('POST', `/api/courses/${courseId}/grades`, {
      user_id: userId,
      grade,
      max_grade: maxGrade
    });
  }

  async uploadContent(courseId: string, content: any): Promise<any> {
    return this.makeRequest('POST', `/api/courses/${courseId}/content`, content);
  }
}

// Register the generic connector
ConnectorFactory.registerConnector('generic', GenericConnector);

/**
 * Connector registry for dynamic platform support
 */
export class ConnectorRegistry {
  private static customConnectors: Map<string, any> = new Map();

  /**
   * Register a custom connector for a specific platform or organization
   */
  static registerCustomConnector(key: string, connectorClass: any) {
    this.customConnectors.set(key, connectorClass);
  }

  /**
   * Get a custom connector
   */
  static getCustomConnector(key: string): any {
    return this.customConnectors.get(key);
  }

  /**
   * List all custom connectors
   */
  static listCustomConnectors(): string[] {
    return Array.from(this.customConnectors.keys());
  }
}

/**
 * Utility functions for connector management
 */
export const ConnectorUtils = {
  /**
   * Validate connector configuration
   */
  validateConfig(config: LMSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name?.trim()) {
      errors.push('Configuration name is required');
    }

    if (!config.apiUrl?.trim()) {
      errors.push('API URL is required');
    }

    if (!config.platform) {
      errors.push('Platform is required');
    }

    if (!config.authMethod) {
      errors.push('Authentication method is required');
    }

    // Validate credentials based on auth method
    switch (config.authMethod) {
      case 'api_key':
        if (!config.credentials.apiKey?.trim()) {
          errors.push('API Key is required for API key authentication');
        }
        break;
      case 'basic_auth':
        if (!config.credentials.username?.trim() || !config.credentials.password?.trim()) {
          errors.push('Username and password are required for basic authentication');
        }
        break;
      case 'oauth':
        if (!config.credentials.clientId?.trim() || !config.credentials.clientSecret?.trim()) {
          errors.push('Client ID and Client Secret are required for OAuth authentication');
        }
        break;
      case 'token':
        if (!config.credentials.accessToken?.trim()) {
          errors.push('Access token is required for token authentication');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Test connector capabilities
   */
  async testConnectorCapabilities(connector: LMSConnector): Promise<{
    capabilities: string[];
    limitations: string[];
  }> {
    const capabilities: string[] = [];
    const limitations: string[] = [];

    try {
      // Test basic connection
      const connectionTest = await connector.testConnection();
      if (connectionTest.success) {
        capabilities.push('Basic Connection');
      } else {
        limitations.push('Connection Failed');
      }

      // Test course creation (if supported)
      try {
        await connector.createCourse({
          name: 'Test Course',
          description: 'Test course for capability testing',
          test: true
        });
        capabilities.push('Course Creation');
      } catch {
        limitations.push('Course Creation Not Supported');
      }

      // Test enrollment (if supported)
      try {
        await connector.enrollStudent('test-course', 'test-user');
        capabilities.push('Student Enrollment');
      } catch {
        limitations.push('Student Enrollment Not Supported');
      }

      // Test progress tracking (if supported)
      try {
        await connector.getStudentProgress('test-course', 'test-user');
        capabilities.push('Progress Tracking');
      } catch {
        limitations.push('Progress Tracking Not Supported');
      }

      // Test grade passback (if supported)
      try {
        await connector.sendGrade('test-course', 'test-user', 85);
        capabilities.push('Grade Passback');
      } catch {
        limitations.push('Grade Passback Not Supported');
      }

    } catch (error) {
      limitations.push(`General Error: ${error.message}`);
    }

    return { capabilities, limitations };
  },

  /**
   * Get connector metadata
   */
  getConnectorMetadata(platform: LMSPlatform): {
    name: string;
    description: string;
    version: string;
    features: string[];
    requirements: string[];
  } {
    const metadata = {
      moodle: {
        name: 'Moodle Connector',
        description: 'Official connector for Moodle LMS platform',
        version: '1.0.0',
        features: [
          'Course Management',
          'User Enrollment',
          'Progress Tracking',
          'Grade Passback',
          'SCORM Support',
          'File Upload'
        ],
        requirements: [
          'Moodle 3.5+',
          'Web Services enabled',
          'REST protocol enabled',
          'Valid API token'
        ]
      },
      canvas: {
        name: 'Canvas Connector',
        description: 'Official connector for Canvas LMS platform',
        version: '1.0.0',
        features: [
          'Course Management',
          'User Enrollment',
          'Progress Tracking',
          'Grade Passback',
          'External Tools',
          'File Upload'
        ],
        requirements: [
          'Canvas instance',
          'API access enabled',
          'Valid access token',
          'Developer key (for OAuth)'
        ]
      },
      blackboard: {
        name: 'Blackboard Connector',
        description: 'Official connector for Blackboard Learn platform',
        version: '1.0.0',
        features: [
          'Course Management',
          'User Enrollment',
          'Progress Tracking',
          'Grade Passback',
          'Content Upload',
          'Webhook Support'
        ],
        requirements: [
          'Blackboard Learn 9.1+',
          'REST API enabled',
          'Application registered',
          'Valid OAuth credentials'
        ]
      },
      generic: {
        name: 'Generic Connector',
        description: 'Generic connector for custom or unsupported platforms',
        version: '1.0.0',
        features: [
          'Basic HTTP requests',
          'Configurable endpoints',
          'Custom authentication',
          'Flexible data mapping'
        ],
        requirements: [
          'HTTP API available',
          'Authentication method supported',
          'Custom configuration'
        ]
      }
    };

    return metadata[platform] || metadata.generic;
  }
};