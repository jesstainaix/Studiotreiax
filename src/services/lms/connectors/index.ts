// LMS Platform Connectors

import { LMSConfig, LMSApiResponse, CourseMapping, StudentProgress } from '../../../types/lms';

// Base LMS Connector Interface
export interface LMSConnector {
  platform: string;
  authenticate(config: LMSConfig): Promise<boolean>;
  testConnection(config: LMSConfig): Promise<LMSApiResponse>;
  createCourse(config: LMSConfig, courseData: any): Promise<LMSApiResponse>;
  updateCourse(config: LMSConfig, courseId: string, courseData: any): Promise<LMSApiResponse>;
  deleteCourse(config: LMSConfig, courseId: string): Promise<LMSApiResponse>;
  enrollStudent(config: LMSConfig, courseId: string, studentId: string): Promise<LMSApiResponse>;
  getStudentProgress(config: LMSConfig, courseId: string, studentId?: string): Promise<LMSApiResponse<StudentProgress[]>>;
  sendGrade(config: LMSConfig, courseId: string, studentId: string, grade: number): Promise<LMSApiResponse>;
  uploadContent(config: LMSConfig, courseId: string, content: File | Blob): Promise<LMSApiResponse>;
}

// Base Connector Class
export abstract class BaseLMSConnector implements LMSConnector {
  abstract platform: string;

  protected async makeRequest(
    url: string,
    options: RequestInit = {},
    config: LMSConfig
  ): Promise<LMSApiResponse> {
    try {
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers
        }
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || 'Request failed',
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 0
      };
    }
  }

  protected abstract getAuthHeaders(config: LMSConfig): Promise<Record<string, string>>;

  abstract authenticate(config: LMSConfig): Promise<boolean>;
  abstract testConnection(config: LMSConfig): Promise<LMSApiResponse>;
  abstract createCourse(config: LMSConfig, courseData: any): Promise<LMSApiResponse>;
  abstract updateCourse(config: LMSConfig, courseId: string, courseData: any): Promise<LMSApiResponse>;
  abstract deleteCourse(config: LMSConfig, courseId: string): Promise<LMSApiResponse>;
  abstract enrollStudent(config: LMSConfig, courseId: string, studentId: string): Promise<LMSApiResponse>;
  abstract getStudentProgress(config: LMSConfig, courseId: string, studentId?: string): Promise<LMSApiResponse<StudentProgress[]>>;
  abstract sendGrade(config: LMSConfig, courseId: string, studentId: string, grade: number): Promise<LMSApiResponse>;
  abstract uploadContent(config: LMSConfig, courseId: string, content: File | Blob): Promise<LMSApiResponse>;
}

// Utility functions
export function createApiUrl(baseUrl: string, endpoint: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanEndpoint}`;
}

export function handleApiError(error: any): LMSApiResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
    statusCode: error.status || 0
  };
}

export function validateConfig(config: LMSConfig, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!config.credentials[field as keyof typeof config.credentials]) {
      throw new Error(`Missing required configuration field: ${field}`);
    }
  }
}