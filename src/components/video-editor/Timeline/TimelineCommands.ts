import { EditorCommand } from '../../../utils/commandManager';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';
import { TimelineItem, TimelineTrack } from '../../../modules/video-editor/types/Timeline.types';

/**
 * Timeline-specific command implementations using the Command Pattern
 * Each command encapsulates a specific timeline operation with undo/redo functionality
 */

export class AddTimelineItemCommand implements EditorCommand {
  public type = 'timeline.item.add';
  public description: string;
  public timestamp = Date.now();
  private addedItem: TimelineItem | null = null;

  constructor(
    private timelineEngine: TimelineEngine,
    private item: TimelineItem,
    private trackId: string
  ) {
    this.description = `Add ${item.type} item "${item.name || 'Unnamed'}"`;
  }

  async execute(): Promise<boolean> {
    const track = this.timelineEngine.getTracks().find(t => t.id === this.trackId);
    if (!track) {
      throw new Error(`Track ${this.trackId} not found`);
    }

    // Execute the add operation
    this.timelineEngine.dispatch({
      type: 'ADD_ITEM',
      payload: { item: this.item, trackId: this.trackId }
    });

    this.addedItem = this.item;
    return true;
  }

  async undo(): Promise<boolean> {
    if (this.addedItem) {
      this.timelineEngine.dispatch({
        type: 'REMOVE_ITEM',
        payload: { itemId: this.addedItem.id }
      });
      return true;
    }
    return false;
  }

  async redo(): Promise<boolean> {
    await this.execute();
  }
}

export class RemoveTimelineItemCommand implements EditorCommand {
  public type = 'timeline.item.remove';
  public timestamp = Date.now();
  public description: string;
  private removedItem: TimelineItem | null = null;
  private originalTrackId: string | null = null;

  constructor(
    private timelineEngine: TimelineEngine,
    private itemId: string
  ) {
    this.description = `Remove timeline item`;
  }

  async execute(): Promise<boolean> {
    // Store item for undo
    const tracks = this.timelineEngine.getTracks();
    for (const track of tracks) {
      const item = track.items.find(i => i.id === this.itemId);
      if (item) {
        this.removedItem = { ...item };
        this.originalTrackId = track.id;
        break;
      }
    }

    if (!this.removedItem) {
      throw new Error(`Item ${this.itemId} not found`);
    }

    this.timelineEngine.dispatch({
      type: 'REMOVE_ITEM',
      payload: { itemId: this.itemId }
    });
  }

  async undo(): Promise<boolean> {
    if (this.removedItem && this.originalTrackId) {
      this.timelineEngine.dispatch({
        type: 'ADD_ITEM',
        payload: { item: this.removedItem, trackId: this.originalTrackId }
      });
    }
  }

  async redo(): Promise<boolean> {
    this.timelineEngine.dispatch({
      type: 'REMOVE_ITEM',
      payload: { itemId: this.itemId }
    });
  }
}

export class MoveTimelineItemCommand implements EditorCommand {
  public type = 'timeline.item.move';
  public timestamp = Date.now();
  public description: string;
  private previousState: {
    trackId: string;
    startTime: number;
  } | null = null;

  constructor(
    private timelineEngine: TimelineEngine,
    private itemId: string,
    private newTrackId: string,
    private newStartTime: number
  ) {
    this.description = `Move timeline item`;
  }

  async execute(): Promise<boolean> {
    // Store previous state
    const tracks = this.timelineEngine.getTracks();
    for (const track of tracks) {
      const item = track.items.find(i => i.id === this.itemId);
      if (item) {
        this.previousState = {
          trackId: track.id,
          startTime: item.startTime
        };
        break;
      }
    }

    if (!this.previousState) {
      throw new Error(`Item ${this.itemId} not found`);
    }

    this.timelineEngine.dispatch({
      type: 'MOVE_ITEM',
      payload: {
        itemId: this.itemId,
        trackId: this.newTrackId,
        startTime: this.newStartTime
      }
    });
  }

  async undo(): Promise<boolean> {
    if (this.previousState) {
      this.timelineEngine.dispatch({
        type: 'MOVE_ITEM',
        payload: {
          itemId: this.itemId,
          trackId: this.previousState.trackId,
          startTime: this.previousState.startTime
        }
      });
    }
  }

  async redo(): Promise<boolean> {
    this.timelineEngine.dispatch({
      type: 'MOVE_ITEM',
      payload: {
        itemId: this.itemId,
        trackId: this.newTrackId,
        startTime: this.newStartTime
      }
    });
  }
}

export class ResizeTimelineItemCommand implements EditorCommand {
  public type = 'timeline.item.resize';
  public timestamp = Date.now();
  public description: string;
  private previousDuration: number | null = null;
  private previousStartTime: number | null = null;

  constructor(
    private timelineEngine: TimelineEngine,
    private itemId: string,
    private newDuration: number,
    private newStartTime?: number
  ) {
    this.description = `Resize timeline item`;
  }

  async execute(): Promise<boolean> {
    // Store previous state
    const tracks = this.timelineEngine.getTracks();
    for (const track of tracks) {
      const item = track.items.find(i => i.id === this.itemId);
      if (item) {
        this.previousDuration = item.duration;
        this.previousStartTime = item.startTime;
        break;
      }
    }

    if (this.previousDuration === null) {
      throw new Error(`Item ${this.itemId} not found`);
    }

    this.timelineEngine.dispatch({
      type: 'RESIZE_ITEM',
      payload: {
        itemId: this.itemId,
        duration: this.newDuration,
        startTime: this.newStartTime
      }
    });
  }

  async undo(): Promise<boolean> {
    if (this.previousDuration !== null && this.previousStartTime !== null) {
      this.timelineEngine.dispatch({
        type: 'RESIZE_ITEM',
        payload: {
          itemId: this.itemId,
          duration: this.previousDuration,
          startTime: this.previousStartTime
        }
      });
    }
  }

  async redo(): Promise<boolean> {
    this.timelineEngine.dispatch({
      type: 'RESIZE_ITEM',
      payload: {
        itemId: this.itemId,
        duration: this.newDuration,
        startTime: this.newStartTime
      }
    });
  }
}

export class AddTrackCommand implements EditorCommand {
  public type = 'timeline.track.add';
  public timestamp = Date.now();
  public description: string;
  private addedTrackId: string | null = null;

  constructor(
    private timelineEngine: TimelineEngine,
    private track: Omit<TimelineTrack, 'id'>
  ) {
    this.description = `Add ${track.type} track "${track.name}"`;
  }

  async execute(): Promise<boolean> {
    const trackWithId = {
      ...this.track,
      id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    } as TimelineTrack;

    this.addedTrackId = trackWithId.id;

    this.timelineEngine.dispatch({
      type: 'ADD_TRACK',
      payload: trackWithId
    });
  }

  async undo(): Promise<boolean> {
    if (this.addedTrackId) {
      this.timelineEngine.dispatch({
        type: 'REMOVE_TRACK',
        payload: { trackId: this.addedTrackId }
      });
    }
  }

  async redo(): Promise<boolean> {
    await this.execute();
  }
}

export class RemoveTrackCommand implements EditorCommand {
  public type = 'timeline.track.remove';
  public timestamp = Date.now();
  public description: string;
  private removedTrack: TimelineTrack | null = null;

  constructor(
    private timelineEngine: TimelineEngine,
    private trackId: string
  ) {
    this.description = `Remove track`;
  }

  async execute(): Promise<boolean> {
    // Store track for undo
    const track = this.timelineEngine.getTracks().find(t => t.id === this.trackId);
    if (!track) {
      throw new Error(`Track ${this.trackId} not found`);
    }

    this.removedTrack = { ...track, items: [...track.items] };

    this.timelineEngine.dispatch({
      type: 'REMOVE_TRACK',
      payload: { trackId: this.trackId }
    });
  }

  async undo(): Promise<boolean> {
    if (this.removedTrack) {
      this.timelineEngine.dispatch({
        type: 'ADD_TRACK',
        payload: this.removedTrack
      });
    }
  }

  async redo(): Promise<boolean> {
    this.timelineEngine.dispatch({
      type: 'REMOVE_TRACK',
      payload: { trackId: this.trackId }
    });
  }
}

export class SplitItemCommand implements EditorCommand {
  public type = 'timeline.item.split';
  public timestamp = Date.now();
  public description: string;
  private originalItem: TimelineItem | null = null;
  private createdItems: TimelineItem[] = [];

  constructor(
    private timelineEngine: TimelineEngine,
    private itemId: string,
    private splitTime: number
  ) {
    this.description = `Split timeline item`;
  }

  async execute(): Promise<boolean> {
    // Store original item
    const tracks = this.timelineEngine.getTracks();
    for (const track of tracks) {
      const item = track.items.find(i => i.id === this.itemId);
      if (item) {
        this.originalItem = { ...item };
        break;
      }
    }

    if (!this.originalItem) {
      throw new Error(`Item ${this.itemId} not found`);
    }

    this.timelineEngine.dispatch({
      type: 'SPLIT_ITEM',
      payload: { itemId: this.itemId, time: this.splitTime }
    });

    // Note: In a real implementation, the split command would return the created items
    // For now, we'll assume the split worked and store references
  }

  async undo(): Promise<boolean> {
    if (this.originalItem) {
      // Remove split items and restore original
      this.createdItems.forEach(item => {
        this.timelineEngine.dispatch({
          type: 'REMOVE_ITEM',
          payload: { itemId: item.id }
        });
      });

      this.timelineEngine.dispatch({
        type: 'ADD_ITEM',
        payload: { item: this.originalItem, trackId: this.originalItem.trackId }
      });
    }
  }

  async redo(): Promise<boolean> {
    this.timelineEngine.dispatch({
      type: 'SPLIT_ITEM',
      payload: { itemId: this.itemId, time: this.splitTime }
    });
  }
}

export class BatchTimelineCommand implements EditorCommand {
  public type = 'timeline.batch';
  public timestamp = Date.now();
  public description: string;

  constructor(
    private commands: EditorCommand[],
    description?: string
  ) {
    this.description = description || `Batch operation (${commands.length} commands)`;
  }

  async execute(): Promise<boolean> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo(): Promise<boolean> {
    // Undo in reverse order
    for (const command of [...this.commands].reverse()) {
      await command.undo();
    }
  }

  async redo(): Promise<boolean> {
    await this.execute();
  }
}

/**
 * Factory functions for creating common timeline commands
 */
export const createTimelineCommands = (timelineEngine: TimelineEngine) => ({
  addItem: (item: TimelineItem, trackId: string) => 
    new AddTimelineItemCommand(timelineEngine, item, trackId),
    
  removeItem: (itemId: string) => 
    new RemoveTimelineItemCommand(timelineEngine, itemId),
    
  moveItem: (itemId: string, trackId: string, startTime: number) => 
    new MoveTimelineItemCommand(timelineEngine, itemId, trackId, startTime),
    
  resizeItem: (itemId: string, duration: number, startTime?: number) => 
    new ResizeTimelineItemCommand(timelineEngine, itemId, duration, startTime),
    
  addTrack: (track: Omit<TimelineTrack, 'id'>) => 
    new AddTrackCommand(timelineEngine, track),
    
  removeTrack: (trackId: string) => 
    new RemoveTrackCommand(timelineEngine, trackId),
    
  splitItem: (itemId: string, splitTime: number) => 
    new SplitItemCommand(timelineEngine, itemId, splitTime),
    
  batch: (commands: EditorCommand[], description?: string) => 
    new BatchTimelineCommand(commands, description)
});