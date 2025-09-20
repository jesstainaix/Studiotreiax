import { 
  LMSConfig, 
  ProgressData, 
  CompletionStatus, 
  LearningProgress, 
  AnalyticsData,
  SyncStatus,
  ProgressEvent,
  GradeData
} from '../../types/lms';
import { User, Project } from '../../types';
import { XAPIService } from './xapi/xapiService';

export interface ProgressTrackerConfig {
  lmsConfig: LMSConfig;
  syncInterval: number; // in milliseconds
  batchSize: number;
  retryAttempts: number;
  enableRealTimeSync: boolean;
  enableOfflineMode: boolean;
}

export interface ProgressSnapshot {
  id: string;
  userId: string;
  projectId: string;
  timestamp: Date;
  progress: LearningProgress;
  events: ProgressEvent[];
  syncStatus: SyncStatus;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
  lastSyncTime: Date;
}

export class ProgressTracker {
  private config: ProgressTrackerConfig;
  private xapiService: XAPIService;
  private progressCache: Map<string, ProgressSnapshot> = new Map();
  private syncQueue: ProgressSnapshot[] = [];
  private syncTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: ProgressTrackerConfig) {
    this.config = config;
    this.xapiService = new XAPIService({
      endpoint: config.lmsConfig.xapiEndpoint || '',
      auth: config.lmsConfig.credentials,
      version: '1.0.3'
    });

    this.initializeSync();
  }

  // Progress Tracking Methods
  async startTracking(userId: string, projectId: string): Promise<void> {
    const progressId = this.generateProgressId(userId, projectId);
    
    const initialProgress: LearningProgress = {
      userId,
      projectId,
      startTime: new Date(),
      currentPosition: 0,
      totalDuration: 0,
      completionPercentage: 0,
      status: 'in_progress',
      timeSpent: 0,
      interactions: [],
      milestones: [],
      lastActivity: new Date()
    };

    const snapshot: ProgressSnapshot = {
      id: progressId,
      userId,
      projectId,
      timestamp: new Date(),
      progress: initialProgress,
      events: [],
      syncStatus: 'pending'
    };

    this.progressCache.set(progressId, snapshot);
    
    // Send start event
    await this.recordEvent(userId, projectId, {
      type: 'started',
      timestamp: new Date(),
      data: { projectId }
    });

    this.emit('progress:started', { userId, projectId, progress: initialProgress });
  }

  async updateProgress(
    userId: string, 
    projectId: string, 
    progressData: Partial<LearningProgress>
  ): Promise<void> {
    const progressId = this.generateProgressId(userId, projectId);
    const snapshot = this.progressCache.get(progressId);
    
    if (!snapshot) {
      throw new Error('Progress tracking not started for this user/project');
    }

    // Update progress
    snapshot.progress = {
      ...snapshot.progress,
      ...progressData,
      lastActivity: new Date()
    };

    // Calculate completion percentage
    if (progressData.currentPosition !== undefined && snapshot.progress.totalDuration > 0) {
      snapshot.progress.completionPercentage = 
        (progressData.currentPosition / snapshot.progress.totalDuration) * 100;
    }

    // Update status based on completion
    if (snapshot.progress.completionPercentage >= 100) {
      snapshot.progress.status = 'completed';
      snapshot.progress.completionTime = new Date();
    }

    snapshot.timestamp = new Date();
    snapshot.syncStatus = 'pending';

    // Record progress event
    await this.recordEvent(userId, projectId, {
      type: 'progress_updated',
      timestamp: new Date(),
      data: progressData
    });

    // Add to sync queue if real-time sync is enabled
    if (this.config.enableRealTimeSync) {
      this.addToSyncQueue(snapshot);
    }

    this.emit('progress:updated', { userId, projectId, progress: snapshot.progress });
  }

  async recordInteraction(
    userId: string, 
    projectId: string, 
    interaction: {
      type: string;
      timestamp: Date;
      data: any;
    }
  ): Promise<void> {
    const progressId = this.generateProgressId(userId, projectId);
    const snapshot = this.progressCache.get(progressId);
    
    if (!snapshot) {
      throw new Error('Progress tracking not started for this user/project');
    }

    // Add interaction to progress
    snapshot.progress.interactions.push({
      id: this.generateId(),
      type: interaction.type,
      timestamp: interaction.timestamp,
      data: interaction.data
    });

    // Record as event
    await this.recordEvent(userId, projectId, {
      type: 'interaction',
      timestamp: interaction.timestamp,
      data: {
        interactionType: interaction.type,
        ...interaction.data
      }
    });

    snapshot.syncStatus = 'pending';
    this.emit('interaction:recorded', { userId, projectId, interaction });
  }

  async recordMilestone(
    userId: string, 
    projectId: string, 
    milestone: {
      id: string;
      name: string;
      timestamp: Date;
      data?: any;
    }
  ): Promise<void> {
    const progressId = this.generateProgressId(userId, projectId);
    const snapshot = this.progressCache.get(progressId);
    
    if (!snapshot) {
      throw new Error('Progress tracking not started for this user/project');
    }

    // Add milestone to progress
    snapshot.progress.milestones.push({
      id: milestone.id,
      name: milestone.name,
      timestamp: milestone.timestamp,
      completed: true,
      data: milestone.data
    });

    // Record as event
    await this.recordEvent(userId, projectId, {
      type: 'milestone_reached',
      timestamp: milestone.timestamp,
      data: {
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        ...milestone.data
      }
    });

    snapshot.syncStatus = 'pending';
    this.emit('milestone:reached', { userId, projectId, milestone });
  }

  async completeProgress(userId: string, projectId: string, grade?: number): Promise<void> {
    const progressId = this.generateProgressId(userId, projectId);
    const snapshot = this.progressCache.get(progressId);
    
    if (!snapshot) {
      throw new Error('Progress tracking not started for this user/project');
    }

    // Mark as completed
    snapshot.progress.status = 'completed';
    snapshot.progress.completionTime = new Date();
    snapshot.progress.completionPercentage = 100;
    
    if (grade !== undefined) {
      snapshot.progress.finalGrade = grade;
    }

    // Record completion event
    await this.recordEvent(userId, projectId, {
      type: 'completed',
      timestamp: new Date(),
      data: { 
        grade,
        timeSpent: snapshot.progress.timeSpent,
        completionPercentage: 100
      }
    });

    snapshot.syncStatus = 'pending';
    
    // Force immediate sync for completion
    await this.syncProgress(snapshot);

    this.emit('progress:completed', { userId, projectId, progress: snapshot.progress });
  }

  // Event Recording
  private async recordEvent(userId: string, projectId: string, event: ProgressEvent): Promise<void> {
    const progressId = this.generateProgressId(userId, projectId);
    const snapshot = this.progressCache.get(progressId);
    
    if (snapshot) {
      snapshot.events.push(event);
    }

    // Send to xAPI if configured
    if (this.config.lmsConfig.xapiEndpoint) {
      try {
        await this.xapiService.sendStatement({
          actor: { mbox: `mailto:user_${userId}@example.com` },
          verb: this.mapEventToVerb(event.type),
          object: {
            id: `project_${projectId}`,
            definition: {
              name: { 'en-US': `Project ${projectId}` }
            }
          },
          timestamp: event.timestamp.toISOString(),
          result: event.data
        });
      } catch (error) {
        console.error('Failed to send xAPI statement:', error);
      }
    }
  }

  // Synchronization Methods
  private initializeSync(): void {
    if (this.config.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        this.performBatchSync();
      }, this.config.syncInterval);
    }
  }

  private addToSyncQueue(snapshot: ProgressSnapshot): void {
    const existingIndex = this.syncQueue.findIndex(s => s.id === snapshot.id);
    if (existingIndex >= 0) {
      this.syncQueue[existingIndex] = snapshot;
    } else {
      this.syncQueue.push(snapshot);
    }

    // Trigger immediate sync if queue is full
    if (this.syncQueue.length >= this.config.batchSize) {
      this.performBatchSync();
    }
  }

  private async performBatchSync(): Promise<SyncResult> {
    if (this.syncQueue.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        errors: [],
        lastSyncTime: new Date()
      };
    }

    const batch = this.syncQueue.splice(0, this.config.batchSize);
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const snapshot of batch) {
      try {
        await this.syncProgress(snapshot);
        syncedCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Failed to sync ${snapshot.id}: ${error.message}`);
        
        // Re-add to queue for retry if attempts remaining
        if ((snapshot as any).retryCount < this.config.retryAttempts) {
          (snapshot as any).retryCount = ((snapshot as any).retryCount || 0) + 1;
          this.syncQueue.push(snapshot);
        }
      }
    }

    const result: SyncResult = {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      errors,
      lastSyncTime: new Date()
    };

    this.emit('sync:completed', result);
    return result;
  }

  private async syncProgress(snapshot: ProgressSnapshot): Promise<void> {
    try {
      // Send progress to LMS
      const response = await fetch(`${this.config.lmsConfig.apiUrl}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.lmsConfig.credentials.accessToken}`
        },
        body: JSON.stringify({
          userId: snapshot.userId,
          projectId: snapshot.projectId,
          progress: snapshot.progress,
          events: snapshot.events,
          timestamp: snapshot.timestamp
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      snapshot.syncStatus = 'synced';
      this.emit('progress:synced', { snapshot });
    } catch (error) {
      snapshot.syncStatus = 'failed';
      throw error;
    }
  }

  // Grade Passback
  async sendGrade(userId: string, projectId: string, gradeData: GradeData): Promise<void> {
    try {
      const response = await fetch(`${this.config.lmsConfig.apiUrl}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.lmsConfig.credentials.accessToken}`
        },
        body: JSON.stringify({
          userId,
          projectId,
          ...gradeData
        })
      });

      if (!response.ok) {
        throw new Error(`Grade passback failed: ${response.statusText}`);
      }

      this.emit('grade:sent', { userId, projectId, gradeData });
    } catch (error) {
      console.error('Grade passback failed:', error);
      throw error;
    }
  }

  // Analytics and Reporting
  getProgressSummary(userId: string, projectId?: string): LearningProgress[] {
    const summaries: LearningProgress[] = [];
    
    for (const [id, snapshot] of this.progressCache) {
      if (snapshot.userId === userId && (!projectId || snapshot.projectId === projectId)) {
        summaries.push(snapshot.progress);
      }
    }

    return summaries;
  }

  getAnalytics(userId: string, projectId: string): AnalyticsData {
    const progressId = this.generateProgressId(userId, projectId);
    const snapshot = this.progressCache.get(progressId);
    
    if (!snapshot) {
      throw new Error('No progress data found');
    }

    const progress = snapshot.progress;
    const events = snapshot.events;

    return {
      totalTimeSpent: progress.timeSpent,
      completionRate: progress.completionPercentage,
      interactionCount: progress.interactions.length,
      milestonesReached: progress.milestones.filter(m => m.completed).length,
      averageSessionTime: this.calculateAverageSessionTime(events),
      engagementScore: this.calculateEngagementScore(progress, events),
      learningVelocity: this.calculateLearningVelocity(progress),
      retentionRate: this.calculateRetentionRate(events)
    };
  }

  // Utility Methods
  private generateProgressId(userId: string, projectId: string): string {
    return `${userId}_${projectId}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private mapEventToVerb(eventType: string): any {
    const verbMap: Record<string, any> = {
      'started': { id: 'http://adlnet.gov/expapi/verbs/launched' },
      'progress_updated': { id: 'http://adlnet.gov/expapi/verbs/progressed' },
      'interaction': { id: 'http://adlnet.gov/expapi/verbs/interacted' },
      'milestone_reached': { id: 'http://adlnet.gov/expapi/verbs/mastered' },
      'completed': { id: 'http://adlnet.gov/expapi/verbs/completed' }
    };

    return verbMap[eventType] || { id: 'http://adlnet.gov/expapi/verbs/experienced' };
  }

  private calculateAverageSessionTime(events: ProgressEvent[]): number {
    const sessionStarts = events.filter(e => e.type === 'started');
    const sessionEnds = events.filter(e => e.type === 'completed' || e.type === 'paused');
    
    if (sessionStarts.length === 0) return 0;
    
    let totalTime = 0;
    let sessionCount = 0;
    
    for (let i = 0; i < sessionStarts.length; i++) {
      const start = sessionStarts[i];
      const end = sessionEnds[i];
      
      if (end) {
        totalTime += end.timestamp.getTime() - start.timestamp.getTime();
        sessionCount++;
      }
    }
    
    return sessionCount > 0 ? totalTime / sessionCount : 0;
  }

  private calculateEngagementScore(progress: LearningProgress, events: ProgressEvent[]): number {
    let score = 0;
    
    // Base score from completion
    score += progress.completionPercentage * 0.4;
    
    // Interaction score
    score += Math.min(progress.interactions.length * 2, 30);
    
    // Milestone score
    score += progress.milestones.filter(m => m.completed).length * 5;
    
    // Time engagement score
    const expectedTime = progress.totalDuration;
    const actualTime = progress.timeSpent;
    if (expectedTime > 0) {
      const timeRatio = Math.min(actualTime / expectedTime, 2);
      score += timeRatio * 20;
    }
    
    return Math.min(score, 100);
  }

  private calculateLearningVelocity(progress: LearningProgress): number {
    if (!progress.startTime || progress.timeSpent === 0) return 0;
    
    const timeElapsed = Date.now() - progress.startTime.getTime();
    const hoursElapsed = timeElapsed / (1000 * 60 * 60);
    
    return progress.completionPercentage / hoursElapsed;
  }

  private calculateRetentionRate(events: ProgressEvent[]): number {
    const sessionEvents = events.filter(e => e.type === 'started');
    if (sessionEvents.length < 2) return 100;
    
    const totalSessions = sessionEvents.length;
    const completedSessions = events.filter(e => e.type === 'completed').length;
    
    return (completedSessions / totalSessions) * 100;
  }

  // Event System
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.progressCache.clear();
    this.syncQueue.length = 0;
    this.eventListeners.clear();
  }
}

export default ProgressTracker;