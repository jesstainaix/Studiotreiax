import { EventSystem } from './eventSystem';

/**
 * Command interface for implementing the Command pattern
 */
export interface Command {
  execute(): void | Promise<void>;
  undo(): void | Promise<void>;
  redo(): void | Promise<void>;
  description: string;
}

/**
 * Command Manager for handling undo/redo functionality
 * Features:
 * - Command execution and history tracking
 * - Undo/redo stack management
 * - Command batching for complex operations
 * - Automatic event emission for state changes
 */
export class CommandManager {
  private static instance: CommandManager;
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private batchCommands: Command[] = [];
  private isBatching: boolean = false;
  private maxHistorySize: number = 100;
  private eventSystem: EventSystem;

  private constructor() {
    this.eventSystem = EventSystem.getInstance();
  }

  /**
   * Get the singleton instance of the CommandManager
   */
  public static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  /**
   * Execute a command and add it to the undo stack
   * @param command The command to execute
   */
  public async execute(command: Command): Promise<void> {
    try {
      await command.execute();

      if (this.isBatching) {
        this.batchCommands.push(command);
      } else {
        this.addToUndoStack(command);
      }

      this.emitHistoryChange();
    } catch (error) {
      console.error('[CommandManager] Error executing command:', error);
      throw error;
    }
  }

  /**
   * Start a batch of commands that should be treated as a single operation
   */
  public startBatch(): void {
    this.isBatching = true;
    this.batchCommands = [];
  }

  /**
   * End the current batch of commands and add them to the undo stack as a single operation
   */
  public endBatch(): void {
    if (!this.isBatching || this.batchCommands.length === 0) return;

    const batchCommand: Command = {
      execute: async () => {
        for (const command of this.batchCommands) {
          await command.execute();
        }
      },
      undo: async () => {
        for (const command of [...this.batchCommands].reverse()) {
          await command.undo();
        }
      },
      redo: async () => {
        for (const command of this.batchCommands) {
          await command.redo();
        }
      },
      description: `Batch: ${this.batchCommands.map(c => c.description).join(', ')}`
    };

    this.addToUndoStack(batchCommand);
    this.isBatching = false;
    this.batchCommands = [];
    this.emitHistoryChange();
  }

  /**
   * Undo the last executed command
   */
  public async undo(): Promise<void> {
    if (this.undoStack.length === 0) return;

    try {
      const command = this.undoStack.pop()!;
      await command.undo();
      this.redoStack.push(command);
      this.emitHistoryChange();
    } catch (error) {
      console.error('[CommandManager] Error undoing command:', error);
      throw error;
    }
  }

  /**
   * Redo the last undone command
   */
  public async redo(): Promise<void> {
    if (this.redoStack.length === 0) return;

    try {
      const command = this.redoStack.pop()!;
      await command.redo();
      this.undoStack.push(command);
      this.emitHistoryChange();
    } catch (error) {
      console.error('[CommandManager] Error redoing command:', error);
      throw error;
    }
  }

  /**
   * Clear all command history
   */
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.batchCommands = [];
    this.isBatching = false;
    this.emitHistoryChange();
  }

  /**
   * Get the current history state
   */
  public getHistoryState(): {
    canUndo: boolean;
    canRedo: boolean;
    undoDescription?: string;
    redoDescription?: string;
  } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoDescription: this.undoStack[this.undoStack.length - 1]?.description,
      redoDescription: this.redoStack[this.redoStack.length - 1]?.description
    };
  }

  /**
   * Set the maximum size of the command history
   * @param size The maximum number of commands to keep in history
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    this.trimHistory();
  }

  /**
   * Add a command to the undo stack and clear the redo stack
   */
  private addToUndoStack(command: Command): void {
    this.undoStack.push(command);
    this.redoStack = [];
    this.trimHistory();
  }

  /**
   * Trim the history to the maximum size
   */
  private trimHistory(): void {
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack = this.undoStack.slice(-this.maxHistorySize);
    }
  }

  /**
   * Emit history change event
   */
  private emitHistoryChange(): void {
    this.eventSystem.emit('project.save', {
      projectId: 'current',
    });
  }
}