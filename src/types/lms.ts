// LMS Integration Types and Interfaces

export type LMSPlatform = 'moodle' | 'canvas' | 'blackboard' | 'brightspace' | 'schoology' | 'edmodo' | 'google-classroom' | 'custom';

export type SCORMVersion = '1.2' | '2004';

export type AuthMethod = 'oauth2' | 'api-key' | 'basic' | 'sso' | 'saml';

export type ContentStatus = 'draft' | 'published' | 'archived' | 'syncing' | 'error';

export type SyncStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

// Base LMS Configuration
export interface LMSConfig {
  id: string;
  name: string;
  platform: LMSPlatform;
  baseUrl: string;
  authMethod: AuthMethod;
  credentials: LMSCredentials;
  settings: LMSSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// LMS Authentication Credentials
export interface LMSCredentials {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  ssoEndpoint?: string;
  samlMetadata?: string;
}

// LMS Platform Settings
export interface LMSSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  defaultCourseCategory?: string;
  enableGradePassback: boolean;
  enableProgressTracking: boolean;
  enableCompletionTracking: boolean;
  customFields?: Record<string, any>;
  webhookUrl?: string;
  notificationSettings: NotificationSettings;
}

// Notification Settings
export interface NotificationSettings {
  onPublish: boolean;
  onComplete: boolean;
  onError: boolean;
  emailNotifications: boolean;
  webhookNotifications: boolean;
}

// SCORM Package Configuration
export interface SCORMConfig {
  version: SCORMVersion;
  identifier: string;
  title: string;
  description?: string;
  author?: string;
  organization?: string;
  language: string;
  masteryScore?: number;
  maxTimeAllowed?: string;
  timeLimitAction?: 'exit,message' | 'exit,no message' | 'continue,message' | 'continue,no message';
  dataFromLMS?: string;
  prerequisites?: string;
  completionThreshold?: number;
}

// xAPI Configuration
export interface XAPIConfig {
  endpoint: string;
  username: string;
  password: string;
  version: string;
  activityId: string;
  activityName: Record<string, string>;
  activityDescription?: Record<string, string>;
  extensions?: Record<string, any>;
}

// Course Mapping
export interface CourseMapping {
  id: string;
  projectId: string;
  lmsConfigId: string;
  lmsCourseId?: string;
  courseName: string;
  courseCode?: string;
  category?: string;
  description?: string;
  status: ContentStatus;
  lastSync?: Date;
  syncStatus: SyncStatus;
  metadata: CourseMetadata;
  scormConfig?: SCORMConfig;
  xapiConfig?: XAPIConfig;
}

// Course Metadata
export interface CourseMetadata {
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  objectives: string[];
  prerequisites?: string[];
  targetAudience?: string;
  language: string;
  version: string;
  lastModified: Date;
}

// Student Progress Tracking
export interface StudentProgress {
  id: string;
  courseMappingId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  enrollmentDate: Date;
  startDate?: Date;
  completionDate?: Date;
  lastAccessDate?: Date;
  progressPercentage: number;
  timeSpent: number; // minutes
  score?: number;
  passed?: boolean;
  attempts: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  bookmarks?: ProgressBookmark[];
  interactions?: LearningInteraction[];
}

// Progress Bookmark
export interface ProgressBookmark {
  id: string;
  timestamp: Date;
  location: string;
  description?: string;
}

// Learning Interaction
export interface LearningInteraction {
  id: string;
  timestamp: Date;
  type: 'choice' | 'fill-in' | 'long-fill-in' | 'matching' | 'performance' | 'sequencing' | 'likert' | 'numeric' | 'other';
  description: string;
  learnerResponse?: string;
  result?: 'correct' | 'incorrect' | 'unanticipated' | 'neutral';
  latency?: number; // seconds
  weighting?: number;
}

// Sync Operation
export interface SyncOperation {
  id: string;
  type: 'publish' | 'update' | 'delete' | 'sync-progress' | 'sync-grades';
  courseMappingId: string;
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  progress: number; // 0-100
  message?: string;
  error?: string;
  details?: Record<string, any>;
}

// LMS API Response
export interface LMSApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

// Grade Passback
export interface GradePassback {
  id: string;
  courseMappingId: string;
  studentId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  completionDate: Date;
  attempts: number;
  timeSpent: number;
  status: 'pending' | 'sent' | 'acknowledged' | 'failed';
  lmsGradeId?: string;
  error?: string;
}

// Analytics Data
export interface LMSAnalytics {
  courseMappingId: string;
  totalEnrollments: number;
  activeStudents: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  passRate: number;
  dropoutRate: number;
  engagementMetrics: EngagementMetrics;
  periodStart: Date;
  periodEnd: Date;
}

// Engagement Metrics
export interface EngagementMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  returnRate: number;
  interactionRate: number;
  completionTime: number;
  mostEngagingContent: string[];
  commonDropoffPoints: string[];
}

// Export/Import Formats
export type ExportFormat = 'scorm-1.2' | 'scorm-2004' | 'xapi' | 'qti' | 'common-cartridge' | 'h5p';

// Content Package
export interface ContentPackage {
  id: string;
  projectId: string;
  format: ExportFormat;
  version: string;
  filename: string;
  fileSize: number;
  downloadUrl: string;
  createdAt: Date;
  expiresAt?: Date;
  metadata: PackageMetadata;
}

// Package Metadata
export interface PackageMetadata {
  title: string;
  description?: string;
  author: string;
  organization?: string;
  language: string;
  keywords: string[];
  duration: number;
  scormConfig?: SCORMConfig;
  xapiConfig?: XAPIConfig;
  customProperties?: Record<string, any>;
}

// Webhook Event
export interface WebhookEvent {
  id: string;
  type: 'course.published' | 'course.updated' | 'student.enrolled' | 'student.completed' | 'grade.updated' | 'sync.completed' | 'sync.failed';
  timestamp: Date;
  lmsConfigId: string;
  courseMappingId?: string;
  studentId?: string;
  data: Record<string, any>;
  processed: boolean;
  retryCount: number;
  error?: string;
}

// Integration Test Result
export interface IntegrationTestResult {
  id: string;
  lmsConfigId: string;
  testType: 'connection' | 'authentication' | 'course-creation' | 'enrollment' | 'grade-passback' | 'progress-sync';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: Record<string, any>;
  duration: number; // milliseconds
  timestamp: Date;
}

// Batch Operation
export interface BatchOperation {
  id: string;
  type: 'bulk-publish' | 'bulk-sync' | 'bulk-update' | 'bulk-delete';
  courseMappingIds: string[];
  status: SyncStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startTime: Date;
  endTime?: Date;
  results: BatchOperationResult[];
}

// Batch Operation Result
export interface BatchOperationResult {
  courseMappingId: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  error?: string;
  data?: Record<string, any>;
}