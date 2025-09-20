import { BaseLMSConnector, createApiUrl, handleApiError, validateConfig } from './index';
import { LMSConfig, LMSApiResponse, StudentProgress } from '../../../types/lms';

export class BlackboardConnector extends BaseLMSConnector {
  platform = 'blackboard';
  private accessToken?: string;
  private tokenExpiry?: Date;

  protected async getAuthHeaders(config: LMSConfig): Promise<Record<string, string>> {
    // Ensure we have a valid access token
    await this.ensureValidToken(config);
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  private async ensureValidToken(config: LMSConfig): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return; // Token is still valid
    }

    // Get new token
    await this.getAccessToken(config);
  }

  private async getAccessToken(config: LMSConfig): Promise<void> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const tokenUrl = createApiUrl(config.baseUrl, '/learn/api/public/v1/oauth2/token');
      
      const credentials = btoa(`${config.credentials.clientId}:${config.credentials.clientSecret}`);
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || 'Token request failed');
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
    } catch (error) {
      console.error('Blackboard token request failed:', error);
      throw error;
    }
  }

  async authenticate(config: LMSConfig): Promise<boolean> {
    try {
      await this.getAccessToken(config);
      return true;
    } catch (error) {
      console.error('Blackboard authentication failed:', error);
      return false;
    }
  }

  async testConnection(config: LMSConfig): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, '/learn/api/public/v1/system/version');
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Connection test failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: {
          version: data.learn?.major + '.' + data.learn?.minor,
          build: data.learn?.patch,
          hostname: config.baseUrl
        },
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async createCourse(config: LMSConfig, courseData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, '/learn/api/public/v1/courses');
      const headers = await this.getAuthHeaders(config);
      
      const course = {
        externalId: courseData.shortname || courseData.title.toLowerCase().replace(/\s+/g, '_'),
        courseId: courseData.shortname || courseData.title.toLowerCase().replace(/\s+/g, '_'),
        name: courseData.title,
        description: courseData.description || '',
        allowGuests: false,
        readOnly: false,
        termId: courseData.termId,
        availability: {
          available: 'Yes',
          duration: {
            type: 'Continuous'
          }
        },
        enrollment: {
          type: 'InstructorLed',
          start: courseData.startDate || new Date().toISOString(),
          end: courseData.endDate,
          accessCode: courseData.accessCode
        },
        locale: {
          id: courseData.locale || 'pt_BR'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(course)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Course creation failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async updateCourse(config: LMSConfig, courseId: string, courseData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}`);
      const headers = await this.getAuthHeaders(config);
      
      const course = {
        name: courseData.title,
        description: courseData.description || '',
        availability: {
          available: courseData.available ? 'Yes' : 'No'
        }
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(course)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Course update failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async deleteCourse(config: LMSConfig, courseId: string): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}`);
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: data.message || 'Course deletion failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: { message: 'Course deleted successfully' },
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async enrollStudent(config: LMSConfig, courseId: string, studentId: string): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/users/${studentId}`);
      const headers = await this.getAuthHeaders(config);
      
      const enrollment = {
        availability: {
          available: 'Yes'
        },
        courseRoleId: 'Student'
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(enrollment)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Student enrollment failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async getStudentProgress(config: LMSConfig, courseId: string, studentId?: string): Promise<LMSApiResponse<StudentProgress[]>> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      let url = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/users`);
      if (studentId) {
        url = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/users/${studentId}`);
      }
      
      const headers = await this.getAuthHeaders(config);
      const response = await fetch(url, { headers });
      const enrollments = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: enrollments.message || 'Failed to get student progress',
          statusCode: response.status
        };
      }

      // Get gradebook data for progress
      const gradebookUrl = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/gradebook/columns`);
      const gradebookResponse = await fetch(gradebookUrl, { headers });
      const gradebook = gradebookResponse.ok ? await gradebookResponse.json() : { results: [] };

      // Transform Blackboard data to our StudentProgress format
      const users = Array.isArray(enrollments) ? enrollments : [enrollments];
      const progressData: StudentProgress[] = users
        .filter((user: any) => user.courseRoleId === 'Student')
        .map((user: any) => {
          return {
            id: `${courseId}-${user.userId}`,
            courseMappingId: courseId,
            studentId: user.userId,
            studentName: user.name?.given + ' ' + user.name?.family,
            studentEmail: user.contact?.email,
            enrollmentDate: user.created ? new Date(user.created) : new Date(),
            startDate: user.created ? new Date(user.created) : undefined,
            completionDate: user.lastAccessed ? new Date(user.lastAccessed) : undefined,
            lastAccessDate: user.lastAccessed ? new Date(user.lastAccessed) : new Date(),
            progressPercentage: 0, // Would need additional API calls to calculate
            timeSpent: 0, // Would need additional API calls to calculate
            score: 0, // Would need gradebook API calls
            passed: false,
            attempts: 1,
            status: user.availability?.available === 'Yes' ? 'in-progress' : 'not-started' as const,
            bookmarks: [],
            interactions: []
          };
        });

      return {
        success: true,
        data: progressData,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async sendGrade(config: LMSConfig, courseId: string, studentId: string, grade: number): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      // First, get or create a grade column
      const columnsUrl = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/gradebook/columns`);
      const headers = await this.getAuthHeaders(config);
      
      // Create grade column if it doesn't exist
      const column = {
        externalId: 'scorm_completion',
        name: 'SCORM Course Completion',
        description: 'Grade for SCORM course completion',
        externalGrade: true,
        score: {
          possible: 100
        },
        availability: {
          available: 'Yes'
        },
        grading: {
          type: 'Numeric',
          due: null,
          attemptsAllowed: 1,
          scoringModel: 'Last'
        }
      };

      const columnResponse = await fetch(columnsUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(column)
      });

      const columnData = await columnResponse.json();
      const columnId = columnData.id;

      // Submit grade
      const gradeUrl = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/gradebook/columns/${columnId}/users/${studentId}`);
      
      const gradeData = {
        score: grade,
        text: `Score: ${grade}/100`,
        notes: 'SCORM course completion grade',
        feedback: 'Completed SCORM course successfully'
      };

      const response = await fetch(gradeUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(gradeData)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Grade update failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async uploadContent(config: LMSConfig, courseId: string, content: File | Blob): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const headers = await this.getAuthHeaders(config);
      
      // Step 1: Create content item
      const contentUrl = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/contents`);
      
      const contentItem = {
        title: content instanceof File ? content.name.replace('.zip', '') : 'SCORM Package',
        body: 'SCORM learning content package',
        description: 'Interactive learning content',
        contentHandler: {
          id: 'resource/x-bb-externallink'
        },
        availability: {
          available: 'Yes',
          allowGuests: false,
          adaptiveRelease: {}
        }
      };

      const contentResponse = await fetch(contentUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(contentItem)
      });

      const contentData = await contentResponse.json();

      if (!contentResponse.ok) {
        return {
          success: false,
          error: contentData.message || 'Content creation failed',
          statusCode: contentResponse.status
        };
      }

      // Step 2: Upload file attachment
      const attachmentUrl = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/contents/${contentData.id}/attachments`);
      
      const formData = new FormData();
      formData.append('file', content);

      const uploadHeaders = { ...headers };
      delete uploadHeaders['Content-Type']; // Let browser set multipart boundary

      const uploadResponse = await fetch(attachmentUrl, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        return {
          success: false,
          error: uploadData.message || 'File upload failed',
          statusCode: uploadResponse.status
        };
      }

      return {
        success: true,
        data: {
          contentId: contentData.id,
          attachmentId: uploadData.id,
          ...uploadData
        },
        statusCode: uploadResponse.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Blackboard-specific methods
  async getCourseContents(config: LMSConfig, courseId: string): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/contents`);
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get course contents',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async getGradebookColumns(config: LMSConfig, courseId: string): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, `/learn/api/public/v1/courses/${courseId}/gradebook/columns`);
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get gradebook columns',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async createWebhook(config: LMSConfig, webhookData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['clientId', 'clientSecret']);
      
      const url = createApiUrl(config.baseUrl, '/learn/api/public/v1/webhooks');
      const headers = await this.getAuthHeaders(config);
      
      const webhook = {
        url: webhookData.callbackUrl,
        events: webhookData.events || ['course.created', 'course.updated', 'user.created'],
        description: webhookData.description || 'Studio IA webhook for LMS integration'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhook)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Webhook creation failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data,
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
}

export default BlackboardConnector;