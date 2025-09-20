import { conflictResolver } from '../conflictResolver';
import { CollaborationAction, ConflictResolution } from '../conflictResolver';

describe('ConflictResolver', () => {
  describe('Conflict Detection', () => {
    test('should detect no conflicts for different elements', () => {
      const action1: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const action2: CollaborationAction = {
        id: 'action-2',
        type: 'clip_modified',
        data: { clipId: 'clip-2', property: 'duration', value: 3 },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const conflicts = conflictResolver.detectConflicts([action1], [action2]);
      expect(conflicts).toHaveLength(0);
    });

    test('should detect conflicts for same element different properties', () => {
      const action1: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const action2: CollaborationAction = {
        id: 'action-2',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'position', value: 10 },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const conflicts = conflictResolver.detectConflicts([action1], [action2]);
      expect(conflicts).toHaveLength(0); // Different properties, no conflict
    });

    test('should detect conflicts for same element same property', () => {
      const action1: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const action2: CollaborationAction = {
        id: 'action-2',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 8 },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const conflicts = conflictResolver.detectConflicts([action1], [action2]);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'property_conflict',
        elementId: 'clip-1',
        property: 'duration',
        localAction: action1,
        remoteAction: action2
      });
    });

    test('should detect timeline position conflicts', () => {
      const action1: CollaborationAction = {
        id: 'action-1',
        type: 'clip_added',
        data: { clipId: 'clip-1', trackId: 'track-1', startTime: 10, duration: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const action2: CollaborationAction = {
        id: 'action-2',
        type: 'clip_added',
        data: { clipId: 'clip-2', trackId: 'track-1', startTime: 12, duration: 5 },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const conflicts = conflictResolver.detectConflicts([action1], [action2]);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('timeline_overlap');
    });

    test('should detect deletion conflicts', () => {
      const action1: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const action2: CollaborationAction = {
        id: 'action-2',
        type: 'clip_deleted',
        data: { clipId: 'clip-1' },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const conflicts = conflictResolver.detectConflicts([action1], [action2]);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('deletion_conflict');
    });
  });

  describe('Conflict Resolution', () => {
    test('should resolve property conflict with last-writer-wins', () => {
      const localAction: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const remoteAction: CollaborationAction = {
        id: 'action-2',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 8 },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const resolution = conflictResolver.resolveConflict(localAction, remoteAction, 'last_writer_wins');
      
      expect(resolution.strategy).toBe('last_writer_wins');
      expect(resolution.resolvedAction.data.value).toBe(8); // Remote action is newer
      expect(resolution.success).toBe(true);
    });

    test('should resolve property conflict with merge strategy', () => {
      const localAction: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', properties: { duration: 5, volume: 0.8 } },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const remoteAction: CollaborationAction = {
        id: 'action-2',
        type: 'clip_modified',
        data: { clipId: 'clip-1', properties: { position: 10, opacity: 0.9 } },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const resolution = conflictResolver.resolveConflict(localAction, remoteAction, 'merge');
      
      expect(resolution.strategy).toBe('merge');
      expect(resolution.resolvedAction.data.properties).toEqual({
        duration: 5,
        volume: 0.8,
        position: 10,
        opacity: 0.9
      });
      expect(resolution.success).toBe(true);
    });

    test('should resolve timeline overlap with auto-adjust', () => {
      const localAction: CollaborationAction = {
        id: 'action-1',
        type: 'clip_added',
        data: { clipId: 'clip-1', trackId: 'track-1', startTime: 10, duration: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const remoteAction: CollaborationAction = {
        id: 'action-2',
        type: 'clip_added',
        data: { clipId: 'clip-2', trackId: 'track-1', startTime: 12, duration: 5 },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const resolution = conflictResolver.resolveConflict(localAction, remoteAction, 'auto_adjust');
      
      expect(resolution.strategy).toBe('auto_adjust');
      expect(resolution.resolvedAction.data.startTime).toBe(15); // Adjusted to avoid overlap
      expect(resolution.success).toBe(true);
    });

    test('should handle deletion conflict with keep_existing', () => {
      const localAction: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const remoteAction: CollaborationAction = {
        id: 'action-2',
        type: 'clip_deleted',
        data: { clipId: 'clip-1' },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const resolution = conflictResolver.resolveConflict(localAction, remoteAction, 'keep_existing');
      
      expect(resolution.strategy).toBe('keep_existing');
      expect(resolution.resolvedAction).toEqual(localAction);
      expect(resolution.success).toBe(true);
    });

    test('should handle deletion conflict with accept_deletion', () => {
      const localAction: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const remoteAction: CollaborationAction = {
        id: 'action-2',
        type: 'clip_deleted',
        data: { clipId: 'clip-1' },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const resolution = conflictResolver.resolveConflict(localAction, remoteAction, 'accept_deletion');
      
      expect(resolution.strategy).toBe('accept_deletion');
      expect(resolution.resolvedAction).toEqual(remoteAction);
      expect(resolution.success).toBe(true);
    });

    test('should fail resolution for unsupported strategy', () => {
      const localAction: CollaborationAction = {
        id: 'action-1',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 5 },
        userId: 'user-1',
        timestamp: Date.now(),
        projectId: 'test-project'
      };

      const remoteAction: CollaborationAction = {
        id: 'action-2',
        type: 'clip_modified',
        data: { clipId: 'clip-1', property: 'duration', value: 8 },
        userId: 'user-2',
        timestamp: Date.now() + 1000,
        projectId: 'test-project'
      };

      const resolution = conflictResolver.resolveConflict(localAction, remoteAction, 'invalid_strategy' as any);
      
      expect(resolution.success).toBe(false);
      expect(resolution.error).toContain('Unsupported resolution strategy');
    });
  });

  describe('Automatic Resolution', () => {
    test('should auto-resolve simple property conflicts', () => {
      const conflicts = [{
        id: 'conflict-1',
        type: 'property_conflict' as const,
        elementId: 'clip-1',
        property: 'duration',
        localAction: {
          id: 'action-1',
          type: 'clip_modified' as const,
          data: { clipId: 'clip-1', property: 'duration', value: 5 },
          userId: 'user-1',
          timestamp: Date.now(),
          projectId: 'test-project'
        },
        remoteAction: {
          id: 'action-2',
          type: 'clip_modified' as const,
          data: { clipId: 'clip-1', property: 'duration', value: 8 },
          userId: 'user-2',
          timestamp: Date.now() + 1000,
          projectId: 'test-project'
        },
        severity: 'medium' as const,
        timestamp: Date.now()
      }];

      const resolutions = conflictResolver.autoResolve(conflicts);
      
      expect(resolutions).toHaveLength(1);
      expect(resolutions[0].success).toBe(true);
      expect(resolutions[0].strategy).toBe('last_writer_wins');
    });

    test('should auto-resolve timeline overlaps', () => {
      const conflicts = [{
        id: 'conflict-1',
        type: 'timeline_overlap' as const,
        elementId: 'clip-2',
        trackId: 'track-1',
        localAction: {
          id: 'action-1',
          type: 'clip_added' as const,
          data: { clipId: 'clip-1', trackId: 'track-1', startTime: 10, duration: 5 },
          userId: 'user-1',
          timestamp: Date.now(),
          projectId: 'test-project'
        },
        remoteAction: {
          id: 'action-2',
          type: 'clip_added' as const,
          data: { clipId: 'clip-2', trackId: 'track-1', startTime: 12, duration: 5 },
          userId: 'user-2',
          timestamp: Date.now() + 1000,
          projectId: 'test-project'
        },
        severity: 'high' as const,
        timestamp: Date.now()
      }];

      const resolutions = conflictResolver.autoResolve(conflicts);
      
      expect(resolutions).toHaveLength(1);
      expect(resolutions[0].success).toBe(true);
      expect(resolutions[0].strategy).toBe('auto_adjust');
    });

    test('should not auto-resolve high-severity deletion conflicts', () => {
      const conflicts = [{
        id: 'conflict-1',
        type: 'deletion_conflict' as const,
        elementId: 'clip-1',
        localAction: {
          id: 'action-1',
          type: 'clip_modified' as const,
          data: { clipId: 'clip-1', property: 'duration', value: 5 },
          userId: 'user-1',
          timestamp: Date.now(),
          projectId: 'test-project'
        },
        remoteAction: {
          id: 'action-2',
          type: 'clip_deleted' as const,
          data: { clipId: 'clip-1' },
          userId: 'user-2',
          timestamp: Date.now() + 1000,
          projectId: 'test-project'
        },
        severity: 'high' as const,
        timestamp: Date.now()
      }];

      const resolutions = conflictResolver.autoResolve(conflicts);
      
      expect(resolutions).toHaveLength(0); // High-severity conflicts require manual resolution
    });
  });

  describe('Conflict Analysis', () => {
    test('should analyze conflict severity', () => {
      const propertyConflict = {
        type: 'property_conflict' as const,
        elementId: 'clip-1',
        property: 'duration'
      };

      const timelineConflict = {
        type: 'timeline_overlap' as const,
        elementId: 'clip-1',
        trackId: 'track-1'
      };

      const deletionConflict = {
        type: 'deletion_conflict' as const,
        elementId: 'clip-1'
      };

      expect(conflictResolver.analyzeSeverity(propertyConflict)).toBe('medium');
      expect(conflictResolver.analyzeSeverity(timelineConflict)).toBe('high');
      expect(conflictResolver.analyzeSeverity(deletionConflict)).toBe('high');
    });

    test('should get conflict statistics', () => {
      const conflicts = [
        { type: 'property_conflict', severity: 'medium' },
        { type: 'timeline_overlap', severity: 'high' },
        { type: 'deletion_conflict', severity: 'high' },
        { type: 'property_conflict', severity: 'low' }
      ] as any[];

      const stats = conflictResolver.getConflictStats(conflicts);
      
      expect(stats).toEqual({
        total: 4,
        byType: {
          property_conflict: 2,
          timeline_overlap: 1,
          deletion_conflict: 1
        },
        bySeverity: {
          low: 1,
          medium: 1,
          high: 2
        },
        autoResolvable: 2 // property conflicts and low severity ones
      });
    });
  });
});