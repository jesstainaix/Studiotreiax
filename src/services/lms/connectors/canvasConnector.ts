import { BaseLMSConnector, createApiUrl, handleApiError, validateConfig } from './index';
import { LMSConfig, LMSApiResponse, StudentProgress } from '../../../types/lms';

export class CanvasConnector extends BaseLMSConnector {
  platform = 'canvas';

  protected async getAuthHeaders(config: LMSConfig): Promise<Record<string, string>> {
    return {
      'Authorization': `Bearer ${config.credentials.accessToken || config.credentials.apiKey}`
    };
  }

  async authenticate(config: LMSConfig): Promise<boolean> {
    try {
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, '/api/v1/users/self');
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, { headers });
      return response.ok;
    } catch (error) {
      console.error('Canvas authentication failed:', error);
      return false;
    }
  }

  async testConnection(config: LMSConfig): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, '/api/v1/users/self');
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
          id: data.id,
          name: data.name,
          email: data.email,
          login_id: data.login_id
        },
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async createCourse(config: LMSConfig, courseData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, '/api/v1/accounts/1/courses');
      const headers = await this.getAuthHeaders(config);
      
      const course = {
        name: courseData.title,
        course_code: courseData.shortname || courseData.title.toLowerCase().replace(/\s+/g, '_'),
        description: courseData.description || '',
        is_public: false,
        is_public_to_auth_users: false,
        public_syllabus: false,
        public_syllabus_to_auth: false,
        public_description: courseData.description || '',
        allow_student_wiki_edits: false,
        allow_wiki_comments: false,
        allow_student_forum_attachments: false,
        open_enrollment: false,
        self_enrollment: false,
        restrict_enrollments_to_course_dates: false,
        term_id: courseData.term_id,
        sis_course_id: courseData.sis_course_id,
        integration_id: courseData.integration_id,
        hide_final_grades: false,
        apply_assignment_group_weights: false,
        time_zone: courseData.time_zone || 'America/Sao_Paulo',
        offer: true
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ course })
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
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}`);
      const headers = await this.getAuthHeaders(config);
      
      const course = {
        name: courseData.title,
        course_code: courseData.shortname || courseData.title.toLowerCase().replace(/\s+/g, '_'),
        description: courseData.description || '',
        public_description: courseData.description || ''
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ course })
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
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}`);
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Course deletion failed',
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

  async enrollStudent(config: LMSConfig, courseId: string, studentId: string): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/enrollments`);
      const headers = await this.getAuthHeaders(config);
      
      const enrollment = {
        user_id: studentId,
        type: 'StudentEnrollment',
        enrollment_state: 'active',
        notify: false
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enrollment })
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
      validateConfig(config, ['accessToken']);
      
      let url = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/enrollments`);
      if (studentId) {
        url += `?user_id=${studentId}`;
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

      // Get course analytics for progress data
      const analyticsUrl = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/analytics/student_summaries`);
      const analyticsResponse = await fetch(analyticsUrl, { headers });
      const analytics = analyticsResponse.ok ? await analyticsResponse.json() : [];

      // Transform Canvas data to our StudentProgress format
      const progressData: StudentProgress[] = enrollments
        .filter((enrollment: any) => enrollment.type === 'StudentEnrollment')
        .map((enrollment: any) => {
          const studentAnalytics = analytics.find((a: any) => a.id === enrollment.user_id) || {};
          
          return {
            id: `${courseId}-${enrollment.user_id}`,
            courseMappingId: courseId,
            studentId: enrollment.user_id.toString(),
            studentName: enrollment.user?.name,
            studentEmail: enrollment.user?.email,
            enrollmentDate: new Date(enrollment.created_at),
            startDate: enrollment.created_at ? new Date(enrollment.created_at) : undefined,
            completionDate: enrollment.completed_at ? new Date(enrollment.completed_at) : undefined,
            lastAccessDate: enrollment.last_activity_at ? new Date(enrollment.last_activity_at) : new Date(),
            progressPercentage: studentAnalytics.page_views_level || 0,
            timeSpent: studentAnalytics.participations_level || 0,
            score: enrollment.grades?.current_score || 0,
            passed: enrollment.grades?.current_score >= 70, // Assuming 70% pass rate
            attempts: 1,
            status: enrollment.enrollment_state === 'completed' ? 'completed' : 'in-progress' as const,
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
      validateConfig(config, ['accessToken']);
      
      // First, get or create an assignment for grading
      const assignmentUrl = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/assignments`);
      const headers = await this.getAuthHeaders(config);
      
      // Create assignment if it doesn't exist
      const assignment = {
        name: 'SCORM Course Completion',
        description: 'Grade for SCORM course completion',
        points_possible: 100,
        grading_type: 'points',
        submission_types: ['external_tool'],
        published: true
      };

      const assignmentResponse = await fetch(assignmentUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignment })
      });

      const assignmentData = await assignmentResponse.json();
      const assignmentId = assignmentData.id;

      // Submit grade
      const gradeUrl = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`);
      
      const submission = {
        posted_grade: grade.toString()
      };

      const response = await fetch(gradeUrl, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ submission })
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
      validateConfig(config, ['accessToken']);
      
      const headers = await this.getAuthHeaders(config);
      
      // Step 1: Request upload URL
      const uploadUrl = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/files`);
      
      const uploadRequest = {
        name: content instanceof File ? content.name : 'scorm-package.zip',
        size: content.size,
        content_type: content.type || 'application/zip',
        parent_folder_path: '/course files/scorm'
      };

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(uploadRequest)
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        return {
          success: false,
          error: uploadData.message || 'Upload request failed',
          statusCode: uploadResponse.status
        };
      }

      // Step 2: Upload file to the provided URL
      const formData = new FormData();
      Object.entries(uploadData.upload_params).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', content);

      const fileUploadResponse = await fetch(uploadData.upload_url, {
        method: 'POST',
        body: formData
      });

      if (!fileUploadResponse.ok) {
        return {
          success: false,
          error: 'File upload failed',
          statusCode: fileUploadResponse.status
        };
      }

      // Step 3: Confirm upload
      const confirmResponse = await fetch(uploadData.upload_url, {
        method: 'POST',
        headers
      });

      const confirmData = await confirmResponse.json();

      return {
        success: true,
        data: confirmData,
        statusCode: confirmResponse.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Canvas-specific methods
  async getCourseModules(config: LMSConfig, courseId: string): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/modules`);
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get course modules',
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

  async createExternalTool(config: LMSConfig, courseId: string, toolData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/external_tools`);
      const headers = await this.getAuthHeaders(config);
      
      const externalTool = {
        name: toolData.name,
        privacy_level: 'public',
        consumer_key: toolData.consumerKey || 'studio-ia',
        shared_secret: toolData.sharedSecret || 'secret',
        url: toolData.launchUrl,
        description: toolData.description || '',
        custom_fields: toolData.customFields || {},
        account_navigation: {
          enabled: false
        },
        course_navigation: {
          enabled: true,
          text: toolData.name,
          visibility: 'public'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(externalTool)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'External tool creation failed',
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

  async getGradebook(config: LMSConfig, courseId: string): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['accessToken']);
      
      const url = createApiUrl(config.baseUrl, `/api/v1/courses/${courseId}/gradebook_history/feed`);
      const headers = await this.getAuthHeaders(config);
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get gradebook',
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

export default CanvasConnector;