import { BaseLMSConnector, createApiUrl, handleApiError, validateConfig } from './index';
import { LMSConfig, LMSApiResponse, StudentProgress } from '../../../types/lms';

export class MoodleConnector extends BaseLMSConnector {
  platform = 'moodle';

  protected async getAuthHeaders(config: LMSConfig): Promise<Record<string, string>> {
    return {
      'Authorization': `Bearer ${config.credentials.accessToken || config.credentials.apiKey}`
    };
  }

  async authenticate(config: LMSConfig): Promise<boolean> {
    try {
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      return response.ok && !data.exception;
    } catch (error) {
      console.error('Moodle authentication failed:', error);
      return false;
    }
  }

  async testConnection(config: LMSConfig): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.exception) {
        return {
          success: false,
          error: data.message || 'Connection test failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: {
          sitename: data.sitename,
          username: data.username,
          firstname: data.firstname,
          lastname: data.lastname,
          release: data.release,
          version: data.version
        },
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async createCourse(config: LMSConfig, courseData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      
      const course = {
        fullname: courseData.title,
        shortname: courseData.shortname || courseData.title.toLowerCase().replace(/\s+/g, '_'),
        summary: courseData.description || '',
        categoryid: courseData.categoryid || 1,
        format: 'topics',
        showgrades: 1,
        newsitems: 0,
        startdate: Math.floor(Date.now() / 1000),
        maxbytes: 0,
        showreports: 0,
        visible: 1,
        hiddensections: 0,
        groupmode: 0,
        groupmodeforce: 0,
        defaultgroupingid: 0,
        enablecompletion: 1,
        completionnotify: 0,
        lang: courseData.language || 'pt_br'
      };

      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_course_create_courses',
        moodlewsrestformat: 'json',
        'courses[0][fullname]': course.fullname,
        'courses[0][shortname]': course.shortname,
        'courses[0][summary]': course.summary,
        'courses[0][categoryid]': course.categoryid.toString(),
        'courses[0][format]': course.format,
        'courses[0][showgrades]': course.showgrades.toString(),
        'courses[0][newsitems]': course.newsitems.toString(),
        'courses[0][startdate]': course.startdate.toString(),
        'courses[0][maxbytes]': course.maxbytes.toString(),
        'courses[0][showreports]': course.showreports.toString(),
        'courses[0][visible]': course.visible.toString(),
        'courses[0][hiddensections]': course.hiddensections.toString(),
        'courses[0][groupmode]': course.groupmode.toString(),
        'courses[0][groupmodeforce]': course.groupmodeforce.toString(),
        'courses[0][defaultgroupingid]': course.defaultgroupingid.toString(),
        'courses[0][enablecompletion]': course.enablecompletion.toString(),
        'courses[0][completionnotify]': course.completionnotify.toString(),
        'courses[0][lang]': course.lang
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();

      if (data.exception) {
        return {
          success: false,
          error: data.message || 'Course creation failed',
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data[0], // Moodle returns array of created courses
        statusCode: response.status
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  async updateCourse(config: LMSConfig, courseId: string, courseData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_course_update_courses',
        moodlewsrestformat: 'json',
        'courses[0][id]': courseId,
        'courses[0][fullname]': courseData.title,
        'courses[0][shortname]': courseData.shortname || courseData.title.toLowerCase().replace(/\s+/g, '_'),
        'courses[0][summary]': courseData.description || ''
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();

      if (data.exception) {
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
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_course_delete_courses',
        moodlewsrestformat: 'json',
        'courseids[0]': courseId
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();

      if (data.exception) {
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
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'enrol_manual_enrol_users',
        moodlewsrestformat: 'json',
        'enrolments[0][roleid]': '5', // Student role ID in Moodle
        'enrolments[0][userid]': studentId,
        'enrolments[0][courseid]': courseId
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();

      if (data.exception) {
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
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      
      // Get course completion data
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_completion_get_course_completion_status',
        moodlewsrestformat: 'json',
        courseid: courseId
      });

      if (studentId) {
        params.append('userid', studentId);
      }

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.exception) {
        return {
          success: false,
          error: data.message || 'Failed to get student progress',
          statusCode: response.status
        };
      }

      // Transform Moodle data to our StudentProgress format
      const progressData: StudentProgress[] = data.statuses?.map((status: any) => ({
        id: `${courseId}-${status.userid}`,
        courseMappingId: courseId,
        studentId: status.userid.toString(),
        enrollmentDate: new Date(status.timeenrolled * 1000),
        startDate: status.timestarted ? new Date(status.timestarted * 1000) : undefined,
        completionDate: status.timecompleted ? new Date(status.timecompleted * 1000) : undefined,
        lastAccessDate: new Date(),
        progressPercentage: status.progress || 0,
        timeSpent: 0, // Moodle doesn't provide this directly
        score: status.grade || 0,
        passed: status.completed === 1,
        attempts: 1,
        status: status.completed === 1 ? 'completed' : 'in-progress' as const,
        bookmarks: [],
        interactions: []
      })) || [];

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
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_grades_update_grades',
        moodlewsrestformat: 'json',
        source: 'studio-ia',
        courseid: courseId,
        component: 'mod_scorm',
        activityid: '1', // This would need to be dynamic based on the actual activity
        itemnumber: '0',
        'grades[0][userid]': studentId,
        'grades[0][rawgrade]': grade.toString()
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();

      if (data.exception) {
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
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/upload.php');
      
      const formData = new FormData();
      formData.append('token', config.credentials.apiKey!);
      formData.append('filearea', 'draft');
      formData.append('itemid', '0');
      formData.append('file', content);

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.exception) {
        return {
          success: false,
          error: data.message || 'Content upload failed',
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

  // Moodle-specific methods
  async getCourseCategories(config: LMSConfig): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'core_course_get_categories',
        moodlewsrestformat: 'json'
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.exception) {
        return {
          success: false,
          error: data.message || 'Failed to get categories',
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

  async createSCORMActivity(config: LMSConfig, courseId: string, scormData: any): Promise<LMSApiResponse> {
    try {
      validateConfig(config, ['apiKey']);
      
      const url = createApiUrl(config.baseUrl, '/webservice/rest/server.php');
      
      const params = new URLSearchParams({
        wstoken: config.credentials.apiKey!,
        wsfunction: 'mod_scorm_add_instance',
        moodlewsrestformat: 'json',
        courseid: courseId,
        name: scormData.name,
        intro: scormData.description || '',
        introformat: '1',
        packagefileid: scormData.packageFileId,
        scormtype: 'local',
        reference: scormData.filename,
        maxgrade: scormData.maxGrade || 100,
        grademethod: '1',
        maxattempt: scormData.maxAttempts || 0,
        forcecompleted: '0',
        forcenewattempt: '0',
        lastattemptlock: '0',
        masteryoverride: '1',
        showgrades: '1',
        displaycoursestructure: '0',
        skipview: '0',
        hidebrowse: '0',
        hidetoc: '0',
        nav: '1',
        navpositionleft: '-100',
        navpositiontop: '-100',
        auto: '0',
        popup: '0',
        options: '',
        width: '100',
        height: '500',
        timeopen: '0',
        timeclose: '0',
        displayattemptstatus: '1',
        completionstatusrequired: '4',
        completionscorerequired: '0',
        completionstatusallscos: '0'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await response.json();

      if (data.exception) {
        return {
          success: false,
          error: data.message || 'SCORM activity creation failed',
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

export default MoodleConnector;