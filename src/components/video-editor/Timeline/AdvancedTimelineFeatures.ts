import { TimelineTrack, TimelineItem } from '../../../modules/video-editor/types/Timeline.types';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';

export interface AdvancedTimelineState {
  rippleEnabled: boolean;
  magneticEnabled: boolean;
  magneticStrength: number; // Distance threshold for magnetic snap
  trimMode: 'normal' | 'ripple' | 'roll' | 'slip' | 'slide';
  snapPoints: SnapPoint[];
  magneticTargets: MagneticTarget[];
}

export interface SnapPoint {
  time: number;
  type: 'item-start' | 'item-end' | 'marker' | 'beat' | 'voice-peak' | 'cut-point' | 'grid';
  strength: number; // How strong the snap is (higher = wider snap range)
  source?: string; // ID of the item/marker that created this snap point
  label?: string;
}

export interface MagneticTarget {
  time: number;
  type: 'item-edge' | 'playhead' | 'marker';
  itemId?: string;
  trackId?: string;
  attractionRange: number;
  visualFeedback: boolean;
}

export interface RippleOperation {
  type: 'move' | 'delete' | 'insert' | 'trim';
  startTime: number;
  endTime: number;
  deltaTime: number;
  affectedTracks: string[]; // Track IDs affected by ripple
  preserveTrackLocks: boolean;
}

class AdvancedTimelineFeatures {
  private engine: TimelineEngine;
  private snapTolerance: number = 0.1; // seconds
  private cachedSnapPoints: SnapPoint[] = [];
  private cachedMagneticTargets: MagneticTarget[] = [];
  private lastCacheUpdate: number = 0;

  constructor(engine: TimelineEngine) {
    this.engine = engine;
  }

  // ===== UTILITY METHODS (NO INTERNAL STATE) =====

  // ===== RIPPLE EDIT FUNCTIONALITY =====

  /**
   * Performs ripple edit when moving items (now returns commands for execution)
   */
  performRippleMove(itemId: string, newStartTime: number, trackId: string, rippleEnabled: boolean): Array<{
    type: 'move' | 'update';
    itemId: string;
    startTime: number;
    duration?: number;
  }> {
    if (!rippleEnabled) return [];

    const engineState = this.engine.getState();
    const item = engineState.items.find(i => i.id === itemId);
    if (!item) return [];

    const deltaTime = newStartTime - item.startTime;
    const rippleStartTime = Math.max(item.startTime, newStartTime);

    const operation: RippleOperation = {
      type: 'move',
      startTime: rippleStartTime,
      endTime: rippleStartTime,
      deltaTime: deltaTime,
      affectedTracks: [trackId],
      preserveTrackLocks: true
    };

    const updatedItems = this.rippleAdjustItems(operation);
    
    // Return command-compatible operations
    return updatedItems
      .filter(updatedItem => updatedItem.id !== itemId) // Exclude the moved item itself
      .map(updatedItem => ({
        type: 'update' as const,
        itemId: updatedItem.id,
        startTime: updatedItem.startTime,
        duration: updatedItem.duration
      }));
  }

  /**
   * Performs ripple delete - returns commands for proper execution
   */
  performRippleDelete(itemIds: string[], rippleEnabled: boolean): Array<{
    type: 'delete' | 'update';
    itemId: string;
    startTime?: number;
    duration?: number;
  }> {
    if (!rippleEnabled) return [];

    const engineState = this.engine.getState();
    const operations: RippleOperation[] = [];

    // Sort items by start time to process in order
    const itemsToDelete = itemIds
      .map(id => engineState.items.find(i => i.id === id))
      .filter(Boolean)
      .sort((a, b) => a!.startTime - b!.startTime);

    for (const item of itemsToDelete) {
      if (!item) continue;

      operations.push({
        type: 'delete',
        startTime: item.startTime,
        endTime: item.startTime + item.duration,
        deltaTime: -item.duration,
        affectedTracks: [item.trackId],
        preserveTrackLocks: true
      });
    }

    // Apply ripple operations in reverse order to maintain timeline integrity
    let updatedItems = [...engineState.items];
    for (const operation of operations.reverse()) {
      updatedItems = this.rippleAdjustItems(operation, updatedItems);
    }

    // Return command-compatible operations
    const commands: Array<{
      type: 'delete' | 'update';
      itemId: string;
      startTime?: number;
      duration?: number;
    }> = [];

    // Add delete commands
    itemIds.forEach(itemId => {
      commands.push({ type: 'delete', itemId });
    });

    // Add update commands for affected items
    updatedItems
      .filter(item => !itemIds.includes(item.id))
      .forEach(item => {
        const originalItem = engineState.items.find(i => i.id === item.id);
        if (originalItem && (originalItem.startTime !== item.startTime || originalItem.duration !== item.duration)) {
          commands.push({
            type: 'update',
            itemId: item.id,
            startTime: item.startTime,
            duration: item.duration
          });
        }
      });

    return commands;
  }

  /**
   * Core ripple adjustment logic
   */
  private rippleAdjustItems(operation: RippleOperation, items?: TimelineItem[]): TimelineItem[] {
    const engineState = this.engine.getState();
    const workingItems = items || engineState.items;

    return workingItems.map(item => {
      // Skip if item is not in affected tracks
      if (!operation.affectedTracks.includes(item.trackId)) return item;

      // Skip locked tracks if preserve locks is enabled
      if (operation.preserveTrackLocks) {
        const track = engineState.tracks.find(t => t.id === item.trackId);
        if (track?.locked) return item;
      }

      // Only affect items that start after the operation point
      if (item.startTime >= operation.startTime) {
        return {
          ...item,
          startTime: Math.max(0, item.startTime + operation.deltaTime)
        };
      }

      return item;
    });
  }

  // ===== MAGNETIC TIMELINE FUNCTIONALITY =====

  /**
   * Calculates magnetic snap for item movement with caching
   */
  calculateMagneticSnap(draggedItemId: string, proposedTime: number, magneticEnabled: boolean, magneticStrength: number = 0.2): {
    snappedTime: number;
    magneticTarget?: MagneticTarget;
    visualFeedback: boolean;
  } {
    if (!magneticEnabled) {
      return { snappedTime: proposedTime, visualFeedback: false };
    }

    // Use cached targets if available and recent
    const now = Date.now();
    if (now - this.lastCacheUpdate > 100 || this.cachedMagneticTargets.length === 0) {
      this.cachedMagneticTargets = this.generateMagneticTargets(draggedItemId);
      this.lastCacheUpdate = now;
    }

    const closestTarget = this.findClosestMagneticTarget(proposedTime, this.cachedMagneticTargets);

    if (closestTarget && Math.abs(proposedTime - closestTarget.time) <= magneticStrength) {
      return {
        snappedTime: closestTarget.time,
        magneticTarget: closestTarget,
        visualFeedback: true
      };
    }

    return { snappedTime: proposedTime, visualFeedback: false };
  }

  /**
   * Generates magnetic targets for item edges and important timeline points
   */
  generateMagneticTargets(excludeItemId?: string): MagneticTarget[] {
    const engineState = this.engine.getState();
    const targets: MagneticTarget[] = [];

    // Add playhead as magnetic target
    targets.push({
      time: engineState.currentTime,
      type: 'playhead',
      attractionRange: 0.2, // Default magnetic strength
      visualFeedback: true
    });

    // Add item edges as magnetic targets
    engineState.items.forEach(item => {
      if (item.id === excludeItemId) return;

      // Item start
      targets.push({
        time: item.startTime,
        type: 'item-edge',
        itemId: item.id,
        trackId: item.trackId,
        attractionRange: 0.2, // Default magnetic strength
        visualFeedback: true
      });

      // Item end
      targets.push({
        time: item.startTime + item.duration,
        type: 'item-edge',
        itemId: item.id,
        trackId: item.trackId,
        attractionRange: 0.2, // Default magnetic strength
        visualFeedback: true
      });
    });

    // Add markers as magnetic targets
    engineState.markers?.forEach(marker => {
      targets.push({
        time: marker.time,
        type: 'marker',
        attractionRange: 0.3, // Markers have stronger attraction (1.5x default)
        visualFeedback: true
      });
    });

    return targets;
  }

  private findClosestMagneticTarget(time: number, targets: MagneticTarget[]): MagneticTarget | null {
    let closest: MagneticTarget | null = null;
    let closestDistance = Infinity;

    for (const target of targets) {
      const distance = Math.abs(time - target.time);
      if (distance < closestDistance && distance <= target.attractionRange) {
        closest = target;
        closestDistance = distance;
      }
    }

    return closest;
  }

  // ===== ENHANCED SNAP FUNCTIONALITY =====

  /**
   * Generates comprehensive snap points including beats, voice peaks, and cut points
   */
  generateEnhancedSnapPoints(): SnapPoint[] {
    const engineState = this.engine.getState();
    const snapPoints: SnapPoint[] = [];

    // Grid-based snap points (every second, half-second, etc.)
    const gridInterval = this.calculateOptimalGridInterval();
    for (let time = 0; time <= engineState.duration; time += gridInterval) {
      snapPoints.push({
        time: time,
        type: 'grid',
        strength: 1,
        label: `${time}s`
      });
    }

    // Item-based snap points
    engineState.items.forEach(item => {
      // Item start
      snapPoints.push({
        time: item.startTime,
        type: 'item-start',
        strength: 3,
        source: item.id,
        label: `${item.name} start`
      });

      // Item end
      snapPoints.push({
        time: item.startTime + item.duration,
        type: 'item-end',
        strength: 3,
        source: item.id,
        label: `${item.name} end`
      });

      // Cut points within items (for video editing)
      if (item.type === 'video') {
        const cutPoints = this.detectCutPoints(item);
        cutPoints.forEach((cutTime, index) => {
          snapPoints.push({
            time: item.startTime + cutTime,
            type: 'cut-point',
            strength: 2,
            source: item.id,
            label: `Cut ${index + 1}`
          });
        });
      }

      // Voice peaks for audio items
      if (item.type === 'audio') {
        const voicePeaks = this.detectVoicePeaks(item);
        voicePeaks.forEach((peakTime, index) => {
          snapPoints.push({
            time: item.startTime + peakTime,
            type: 'voice-peak',
            strength: 2,
            source: item.id,
            label: `Peak ${index + 1}`
          });
        });
      }
    });

    // Marker-based snap points
    engineState.markers?.forEach(marker => {
      snapPoints.push({
        time: marker.time,
        type: 'marker',
        strength: 4, // Markers have high snap priority
        source: marker.id,
        label: marker.label || `Marker ${marker.type}`
      });
    });

    // Sort by time and remove duplicates
    return this.deduplicateSnapPoints(snapPoints.sort((a, b) => a.time - b.time));
  }

  private calculateOptimalGridInterval(): number {
    const engineState = this.engine.getState();
    
    // Adjust grid interval based on zoom level and timeline duration
    if (engineState.duration < 30) return 0.1; // 100ms for short clips
    if (engineState.duration < 300) return 0.5; // 500ms for medium clips
    if (engineState.duration < 1800) return 1; // 1s for longer clips
    return 5; // 5s for very long timelines
  }

  private detectCutPoints(item: TimelineItem): number[] {
    // Simplified cut point detection - in real implementation, this would analyze
    // video frames for scene changes, motion vectors, etc.
    const cutPoints: number[] = [];
    const numberOfCuts = Math.floor(item.duration / 10); // One cut every 10 seconds

    for (let i = 1; i <= numberOfCuts; i++) {
      cutPoints.push((item.duration * i) / (numberOfCuts + 1));
    }

    return cutPoints;
  }

  private detectVoicePeaks(item: TimelineItem): number[] {
    // Simplified voice peak detection - in real implementation, this would analyze
    // audio waveform data for amplitude peaks
    const peaks: number[] = [];
    const numberOfPeaks = Math.floor(item.duration / 5); // One peak every 5 seconds

    for (let i = 1; i <= numberOfPeaks; i++) {
      peaks.push((item.duration * i) / (numberOfPeaks + 1));
    }

    return peaks;
  }

  private deduplicateSnapPoints(snapPoints: SnapPoint[]): SnapPoint[] {
    const deduplicated: SnapPoint[] = [];
    const tolerance = 0.01; // 10ms tolerance for duplicates

    snapPoints.forEach(point => {
      const existing = deduplicated.find(p => Math.abs(p.time - point.time) < tolerance);
      
      if (!existing) {
        deduplicated.push(point);
      } else if (point.strength > existing.strength) {
        // Replace with higher strength snap point
        const index = deduplicated.indexOf(existing);
        deduplicated[index] = point;
      }
    });

    return deduplicated;
  }

  /**
   * Find the best snap point for a given time
   */
  findBestSnapPoint(time: number, snapPoints?: SnapPoint[]): SnapPoint | null {
    const points = snapPoints || this.cachedSnapPoints;
    let bestPoint: SnapPoint | null = null;
    let bestDistance = Infinity;

    for (const point of points) {
      const distance = Math.abs(time - point.time);
      const snapRange = this.snapTolerance * (point.strength / 2);

      if (distance <= snapRange && distance < bestDistance) {
        bestPoint = point;
        bestDistance = distance;
      }
    }

    return bestPoint;
  }

  // ===== ADVANCED TRIMMING MODES =====

  /**
   * Performs trim operation based on current trim mode
   */
  performAdvancedTrim(itemId: string, edge: 'start' | 'end', newTime: number, trimMode: 'normal' | 'ripple' | 'roll' | 'slip' | 'slide' = 'normal'): {
    updatedItems: TimelineItem[];
    additionalOperations: string[];
  } {
    const engineState = this.engine.getState();
    const item = engineState.items.find(i => i.id === itemId);
    if (!item) return { updatedItems: [], additionalOperations: [] };

    switch (trimMode) {
      case 'normal':
        return this.performNormalTrim(item, edge, newTime);
      
      case 'ripple':
        return this.performRippleTrim(item, edge, newTime);
      
      case 'roll':
        return this.performRollTrim(item, edge, newTime);
      
      case 'slip':
        return this.performSlipTrim(item, newTime);
      
      case 'slide':
        return this.performSlideTrim(item, newTime);
      
      default:
        return this.performNormalTrim(item, edge, newTime);
    }
  }

  private performNormalTrim(item: TimelineItem, edge: 'start' | 'end', newTime: number): {
    updatedItems: TimelineItem[];
    additionalOperations: string[];
  } {
    const updatedItem = { ...item };

    if (edge === 'start') {
      const newDuration = item.startTime + item.duration - newTime;
      if (newDuration > 0.1) { // Minimum 100ms duration
        updatedItem.startTime = newTime;
        updatedItem.duration = newDuration;
      }
    } else {
      const newDuration = newTime - item.startTime;
      if (newDuration > 0.1) {
        updatedItem.duration = newDuration;
      }
    }

    return {
      updatedItems: [updatedItem],
      additionalOperations: [`Trimmed ${item.name} from ${edge}`]
    };
  }

  private performRippleTrim(item: TimelineItem, edge: 'start' | 'end', newTime: number): {
    updatedItems: TimelineItem[];
    additionalOperations: string[];
  } {
    const normalTrim = this.performNormalTrim(item, edge, newTime);
    
    if (edge === 'start') {
      const deltaTime = newTime - item.startTime;
      const rippleItems = this.rippleAdjustItems({
        type: 'trim',
        startTime: item.startTime,
        endTime: newTime,
        deltaTime: deltaTime,
        affectedTracks: [item.trackId],
        preserveTrackLocks: true
      });

      return {
        updatedItems: rippleItems,
        additionalOperations: [...normalTrim.additionalOperations, 'Applied ripple effect']
      };
    }

    return normalTrim;
  }

  private performRollTrim(item: TimelineItem, edge: 'start' | 'end', newTime: number): {
    updatedItems: TimelineItem[];
    additionalOperations: string[];
  } {
    const engineState = this.engine.getState();
    const adjacentItem = this.findAdjacentItem(item, edge);
    
    if (!adjacentItem) {
      return this.performNormalTrim(item, edge, newTime);
    }

    const updatedItems: TimelineItem[] = [];
    
    if (edge === 'start' && adjacentItem.startTime + adjacentItem.duration === item.startTime) {
      // Roll edit with previous item
      const deltaTime = newTime - item.startTime;
      
      updatedItems.push({
        ...item,
        startTime: newTime,
        duration: item.duration - deltaTime
      });
      
      updatedItems.push({
        ...adjacentItem,
        duration: adjacentItem.duration + deltaTime
      });
    } else if (edge === 'end' && item.startTime + item.duration === adjacentItem.startTime) {
      // Roll edit with next item
      const deltaTime = newTime - (item.startTime + item.duration);
      
      updatedItems.push({
        ...item,
        duration: item.duration + deltaTime
      });
      
      updatedItems.push({
        ...adjacentItem,
        startTime: adjacentItem.startTime + deltaTime,
        duration: adjacentItem.duration - deltaTime
      });
    }

    return {
      updatedItems,
      additionalOperations: [`Roll edit between ${item.name} and ${adjacentItem.name}`]
    };
  }

  private performSlipTrim(item: TimelineItem, newTime: number): {
    updatedItems: TimelineItem[];
    additionalOperations: string[];
  } {
    // Slip edit moves the content within the item without changing its timeline position
    const updatedItem = {
      ...item,
      // In a real implementation, this would adjust the source offset
      metadata: {
        ...item.metadata,
        sourceOffset: (item.metadata?.sourceOffset || 0) + (newTime - item.startTime)
      }
    };

    return {
      updatedItems: [updatedItem],
      additionalOperations: [`Slipped content in ${item.name}`]
    };
  }

  private performSlideTrim(item: TimelineItem, newTime: number): {
    updatedItems: TimelineItem[];
    additionalOperations: string[];
  } {
    // Slide edit moves the entire item while adjusting adjacent items
    const deltaTime = newTime - item.startTime;
    const engineState = this.engine.getState();
    const trackItems = engineState.items.filter(i => i.trackId === item.trackId && i.id !== item.id);
    
    const updatedItems: TimelineItem[] = [{
      ...item,
      startTime: newTime
    }];

    // Adjust adjacent items
    trackItems.forEach(trackItem => {
      if (trackItem.startTime + trackItem.duration <= item.startTime && trackItem.startTime + trackItem.duration > newTime) {
        // Previous item needs to be shortened
        updatedItems.push({
          ...trackItem,
          duration: Math.max(0.1, newTime - trackItem.startTime)
        });
      } else if (trackItem.startTime >= item.startTime + item.duration && trackItem.startTime < newTime + item.duration) {
        // Next item needs to be moved
        updatedItems.push({
          ...trackItem,
          startTime: newTime + item.duration
        });
      }
    });

    return {
      updatedItems,
      additionalOperations: [`Slide edit moved ${item.name} and adjusted adjacent items`]
    };
  }

  private findAdjacentItem(item: TimelineItem, edge: 'start' | 'end'): TimelineItem | null {
    const engineState = this.engine.getState();
    const trackItems = engineState.items
      .filter(i => i.trackId === item.trackId && i.id !== item.id)
      .sort((a, b) => a.startTime - b.startTime);

    if (edge === 'start') {
      // Find item that ends exactly where this item starts
      return trackItems.find(i => Math.abs((i.startTime + i.duration) - item.startTime) < 0.01) || null;
    } else {
      // Find item that starts exactly where this item ends
      return trackItems.find(i => Math.abs(i.startTime - (item.startTime + item.duration)) < 0.01) || null;
    }
  }

  // ===== STATE MANAGEMENT =====

  // Cache management methods
  clearCache(): void {
    this.cachedSnapPoints = [];
    this.cachedMagneticTargets = [];
    this.lastCacheUpdate = 0;
  }

  updateSnapPoints(): void {
    this.cachedSnapPoints = this.generateEnhancedSnapPoints();
  }

  /**
   * Get cached snap points
   */
  getCachedSnapPoints(): SnapPoint[] {
    return this.cachedSnapPoints;
  }

  setSnapTolerance(tolerance: number): void {
    this.snapTolerance = Math.max(0.01, Math.min(1, tolerance));
  }
}

export default AdvancedTimelineFeatures;