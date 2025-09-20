// Command Manager with Undo/Redo functionality and History Tracking

import { EditorCommand, CommandHistory, CommandState } from '../types/editor';
import { eventSystem, emitEditorEvent } from './eventSystem';

/**
 * Command Manager implementing the Command Pattern with undo/redo functionality
 * Provides comprehensive history tracking and batch operations for optimal performance
 */
export class CommandManager {
  private history: CommandHistory[] = [];
  private currentIndex = -1;
  private maxHistorySize = 1000;
  private batchMode = false;
  private batchCommands: EditorCommand[] = [];
  private savePoints: Set<number> = new Set();
  private performanceMetrics = {
    commandsExecuted: 0,
    undoOperations: 0,
    redoOperations: 0,
    averageExecutionTime: 0,
    batchOperations: 0
  };

  private static instance: CommandManager;

  /**
   * Singleton pattern for global command management
   */
  public static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  /**
   * Execute a command with automatic history tracking
   */
  public async execute(command: EditorCommand): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      // Validate command before execution
      if (!this.validateCommand(command)) {
        console.warn('Invalid command rejected:', command);
        return false;
      }

      // Execute the command
      const result = await command.execute();
      
      if (result) {
        if (this.batchMode) {
          this.batchCommands.push(command);
        } else {
          this.addToHistory(command);
        }
        
        // Emit command executed event
        emitEditorEvent.commandExecuted({
          command: command.type,
          timestamp: Date.now(),
          executionTime: performance.now() - startTime
        });
        
        this.updatePerformanceMetrics(performance.now() - startTime, 'execute');
      }
      
      return result;
    } catch (error) {
      console.error('Command execution failed:', error);
      emitEditorEvent.commandFailed({
        command: command.type,
        error: error.message,
        timestamp: Date.now()
      });
      return false;
    }
  }

  /**
   * Execute multiple commands in batch for performance optimization
   */
  public async executeBatch(commands: EditorCommand[], description = 'Batch Operation'): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      this.startBatch();
      
      const results = await Promise.all(
        commands.map(command => this.execute(command))
      );
      
      const success = results.every(result => result);
      
      if (success) {
        this.commitBatch(description);
      } else {
        this.cancelBatch();
      }
      
      this.updatePerformanceMetrics(performance.now() - startTime, 'batch');
      return success;
    } catch (error) {
      this.cancelBatch();
      console.error('Batch execution failed:', error);
      return false;
    }
  }

  /**
   * Undo the last command or batch
   */
  public async undo(): Promise<boolean> {
    if (!this.canUndo()) {
      return false;
    }

    const startTime = performance.now();
    const historyItem = this.history[this.currentIndex];
    
    try {
      if (historyItem.isBatch) {
        // Undo batch commands in reverse order
        const commands = [...historyItem.commands].reverse();
        const results = await Promise.all(
          commands.map(command => command.undo())
        );
        
        const success = results.every(result => result);
        if (success) {
          this.currentIndex--;
          emitEditorEvent.commandUndone({
            type: 'batch',
            description: historyItem.description,
            timestamp: Date.now()
          });
        }
        
        this.updatePerformanceMetrics(performance.now() - startTime, 'undo');
        return success;
      } else {
        // Undo single command
        const command = historyItem.commands[0];
        const result = await command.undo();
        
        if (result) {
          this.currentIndex--;
          emitEditorEvent.commandUndone({
            type: command.type,
            timestamp: Date.now()
          });
        }
        
        this.updatePerformanceMetrics(performance.now() - startTime, 'undo');
        return result;
      }
    } catch (error) {
      console.error('Undo operation failed:', error);
      return false;
    }
  }

  /**
   * Redo the next command or batch
   */
  public async redo(): Promise<boolean> {
    if (!this.canRedo()) {
      return false;
    }

    const startTime = performance.now();
    const historyItem = this.history[this.currentIndex + 1];
    
    try {
      if (historyItem.isBatch) {
        // Redo batch commands in original order
        const results = await Promise.all(
          historyItem.commands.map(command => command.execute())
        );
        
        const success = results.every(result => result);
        if (success) {
          this.currentIndex++;
          emitEditorEvent.commandRedone({
            type: 'batch',
            description: historyItem.description,
            timestamp: Date.now()
          });
        }
        
        this.updatePerformanceMetrics(performance.now() - startTime, 'redo');
        return success;
      } else {
        // Redo single command
        const command = historyItem.commands[0];
        const result = await command.execute();
        
        if (result) {
          this.currentIndex++;
          emitEditorEvent.commandRedone({
            type: command.type,
            timestamp: Date.now()
          });
        }
        
        this.updatePerformanceMetrics(performance.now() - startTime, 'redo');
        return result;
      }
    } catch (error) {
      console.error('Redo operation failed:', error);
      return false;
    }
  }

  /**
   * Check if undo is possible
   */
  public canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current command state
   */
  public getState(): CommandState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historySize: this.history.length,
      currentIndex: this.currentIndex,
      lastCommand: this.currentIndex >= 0 ? 
        this.history[this.currentIndex].description : null,
      nextCommand: this.canRedo() ? 
        this.history[this.currentIndex + 1].description : null,
      hasUnsavedChanges: this.hasUnsavedChanges()
    };
  }

  /**
   * Get command history for debugging or UI display
   */
  public getHistory(): CommandHistory[] {
    return this.history.map(item => ({
      ...item,
      commands: item.commands.map(cmd => ({
        type: cmd.type,
        description: cmd.description,
        timestamp: cmd.timestamp
      }))
    }));
  }

  /**
   * Start batch mode for grouping commands
   */
  public startBatch(): void {
    this.batchMode = true;
    this.batchCommands = [];
  }

  /**
   * Commit batch commands to history
   */
  public commitBatch(description = 'Batch Operation'): void {
    if (this.batchCommands.length > 0) {
      const batchHistory: CommandHistory = {
        commands: [...this.batchCommands],
        timestamp: Date.now(),
        description,
        isBatch: true
      };
      
      this.addToHistory(null, batchHistory);
    }
    
    this.batchMode = false;
    this.batchCommands = [];
  }

  /**
   * Cancel current batch operation
   */
  public cancelBatch(): void {
    this.batchMode = false;
    this.batchCommands = [];
  }

  /**
   * Mark current position as save point
   */
  public markSavePoint(): void {
    this.savePoints.add(this.currentIndex);
  }

  /**
   * Clear all save points
   */
  public clearSavePoints(): void {
    this.savePoints.clear();
  }

  /**
   * Check if there are unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    return !this.savePoints.has(this.currentIndex);
  }

  /**
   * Clear command history
   */
  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.savePoints.clear();
    this.batchCommands = [];
    this.batchMode = false;
  }

  /**
   * Set maximum history size
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(10, size);
    this.trimHistory();
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Add command to history
   */
  private addToHistory(command?: EditorCommand | null, batchHistory?: CommandHistory): void {
    // Remove any redo history when adding new command
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    if (batchHistory) {
      this.history.push(batchHistory);
    } else if (command) {
      const historyItem: CommandHistory = {
        commands: [command],
        timestamp: Date.now(),
        description: command.description,
        isBatch: false
      };
      this.history.push(historyItem);
    }

    this.currentIndex = this.history.length - 1;
    this.trimHistory();
  }

  /**
   * Trim history to maximum size
   */
  private trimHistory(): void {
    if (this.history.length > this.maxHistorySize) {
      const removeCount = this.history.length - this.maxHistorySize;
      this.history.splice(0, removeCount);
      this.currentIndex -= removeCount;
      
      // Update save points
      const newSavePoints = new Set<number>();
      for (const savePoint of this.savePoints) {
        const newIndex = savePoint - removeCount;
        if (newIndex >= 0) {
          newSavePoints.add(newIndex);
        }
      }
      this.savePoints = newSavePoints;
    }
  }

  /**
   * Validate command before execution
   */
  private validateCommand(command: EditorCommand): boolean {
    return (
      command &&
      typeof command.execute === 'function' &&
      typeof command.undo === 'function' &&
      command.type &&
      command.description
    );
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(executionTime: number, operation: 'execute' | 'undo' | 'redo' | 'batch'): void {
    const alpha = 0.1; // Smoothing factor for rolling average
    
    switch (operation) {
      case 'execute':
        this.performanceMetrics.commandsExecuted++;
        break;
      case 'undo':
        this.performanceMetrics.undoOperations++;
        break;
      case 'redo':
        this.performanceMetrics.redoOperations++;
        break;
      case 'batch':
        this.performanceMetrics.batchOperations++;
        break;
    }
    
    this.performanceMetrics.averageExecutionTime = 
      (1 - alpha) * this.performanceMetrics.averageExecutionTime + 
      alpha * executionTime;
  }
}

// Export singleton instance
export const commandManager = CommandManager.getInstance();

// Convenience functions for common command operations
export const editorCommands = {
  // Execute single command
  execute: (command: EditorCommand) => commandManager.execute(command),
  
  // Execute multiple commands as batch
  executeBatch: (commands: EditorCommand[], description?: string) => 
    commandManager.executeBatch(commands, description),
  
  // Undo/Redo operations
  undo: () => commandManager.undo(),
  redo: () => commandManager.redo(),
  
  // State queries
  canUndo: () => commandManager.canUndo(),
  canRedo: () => commandManager.canRedo(),
  getState: () => commandManager.getState(),
  
  // Batch operations
  startBatch: () => commandManager.startBatch(),
  commitBatch: (description?: string) => commandManager.commitBatch(description),
  cancelBatch: () => commandManager.cancelBatch(),
  
  // Save point management
  markSavePoint: () => commandManager.markSavePoint(),
  hasUnsavedChanges: () => commandManager.hasUnsavedChanges()
};

// Base command class for common command implementations
export abstract class BaseCommand implements EditorCommand {
  public abstract type: string;
  public abstract description: string;
  public timestamp: number;
  protected previousState?: any;
  protected newState?: any;

  constructor() {
    this.timestamp = Date.now();
  }

  public abstract execute(): Promise<boolean>;
  public abstract undo(): Promise<boolean>;

  /**
   * Store state for undo operation
   */
  protected storeState(previous: any, current: any): void {
    this.previousState = previous;
    this.newState = current;
  }

  /**
   * Validate state before execution
   */
  protected validateState(): boolean {
    return true; // Override in subclasses for specific validation
  }
}

// Example command implementations
export class AddElementCommand extends BaseCommand {
  public type = 'canvas.element.add';
  public description: string;
  
  constructor(
    private element: any,
    private canvas: any
  ) {
    super();
    this.description = `Add ${element.type} element`;
  }

  public async execute(): Promise<boolean> {
    try {
      this.canvas.add(this.element);
      this.storeState(null, this.element);
      return true;
    } catch (error) {
      console.error('Failed to add element:', error);
      return false;
    }
  }

  public async undo(): Promise<boolean> {
    try {
      this.canvas.remove(this.element);
      return true;
    } catch (error) {
      console.error('Failed to remove element:', error);
      return false;
    }
  }
}

export class ModifyElementCommand extends BaseCommand {
  public type = 'canvas.element.modify';
  public description: string;
  
  constructor(
    private element: any,
    private property: string,
    private newValue: any,
    private oldValue: any
  ) {
    super();
    this.description = `Modify ${element.type} ${property}`;
    this.storeState(oldValue, newValue);
  }

  public async execute(): Promise<boolean> {
    try {
      this.element[this.property] = this.newValue;
      return true;
    } catch (error) {
      console.error('Failed to modify element:', error);
      return false;
    }
  }

  public async undo(): Promise<boolean> {
    try {
      this.element[this.property] = this.oldValue;
      return true;
    } catch (error) {
      console.error('Failed to undo element modification:', error);
      return false;
    }
  }
}

export default commandManager;