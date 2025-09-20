import { CommandManager, Command } from '../commandManager';

// Mock command for testing
class MockCommand implements Command {
  public executed = false;
  public undone = false;

  constructor(
    public id: string,
    public description: string,
    private executeAction?: () => void,
    private undoAction?: () => void
  ) {}

  execute(): void {
    this.executed = true;
    this.executeAction?.();
  }

  undo(): void {
    this.undone = true;
    this.undoAction?.();
  }

  canExecute(): boolean {
    return true;
  }

  canUndo(): boolean {
    return this.executed;
  }
}

describe('CommandManager', () => {
  let commandManager: CommandManager;

  beforeEach(() => {
    commandManager = CommandManager.getInstance();
    commandManager.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CommandManager.getInstance();
      const instance2 = CommandManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Command Execution', () => {
    it('should execute commands correctly', () => {
      const mockExecute = jest.fn();
      const command = new MockCommand('test-1', 'Test Command', mockExecute);

      commandManager.execute(command);

      expect(command.executed).toBe(true);
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should not execute commands that cannot be executed', () => {
      const command = new MockCommand('test-2', 'Invalid Command');
      jest.spyOn(command, 'canExecute').mockReturnValue(false);

      const result = commandManager.execute(command);

      expect(result).toBe(false);
      expect(command.executed).toBe(false);
    });

    it('should add executed commands to history', () => {
      const command = new MockCommand('test-3', 'History Test');
      
      commandManager.execute(command);
      
      const history = commandManager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toBe(command);
    });
  });

  describe('Undo Functionality', () => {
    it('should undo the last executed command', () => {
      const mockUndo = jest.fn();
      const command = new MockCommand('undo-1', 'Undo Test', undefined, mockUndo);
      
      commandManager.execute(command);
      const undoResult = commandManager.undo();
      
      expect(undoResult).toBe(true);
      expect(command.undone).toBe(true);
      expect(mockUndo).toHaveBeenCalled();
    });

    it('should return false when there are no commands to undo', () => {
      const result = commandManager.undo();
      expect(result).toBe(false);
    });

    it('should not undo commands that cannot be undone', () => {
      const command = new MockCommand('no-undo', 'No Undo Command');
      jest.spyOn(command, 'canUndo').mockReturnValue(false);
      
      commandManager.execute(command);
      const result = commandManager.undo();
      
      expect(result).toBe(false);
      expect(command.undone).toBe(false);
    });
  });

  describe('Redo Functionality', () => {
    it('should redo previously undone commands', () => {
      const mockExecute = jest.fn();
      const command = new MockCommand('redo-1', 'Redo Test', mockExecute);
      
      commandManager.execute(command);
      commandManager.undo();
      
      mockExecute.mockClear();
      const redoResult = commandManager.redo();
      
      expect(redoResult).toBe(true);
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should return false when there are no commands to redo', () => {
      const result = commandManager.redo();
      expect(result).toBe(false);
    });

    it('should clear redo stack when new command is executed', () => {
      const command1 = new MockCommand('clear-1', 'Command 1');
      const command2 = new MockCommand('clear-2', 'Command 2');
      
      commandManager.execute(command1);
      commandManager.undo();
      commandManager.execute(command2);
      
      const redoResult = commandManager.redo();
      expect(redoResult).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should execute multiple commands in batch', () => {
      const commands = [
        new MockCommand('batch-1', 'Batch Command 1'),
        new MockCommand('batch-2', 'Batch Command 2'),
        new MockCommand('batch-3', 'Batch Command 3')
      ];
      
      commandManager.executeBatch(commands);
      
      commands.forEach(cmd => {
        expect(cmd.executed).toBe(true);
      });
      
      const history = commandManager.getHistory();
      expect(history).toHaveLength(3);
    });

    it('should stop batch execution on first failure', () => {
      const command1 = new MockCommand('batch-success', 'Success');
      const command2 = new MockCommand('batch-fail', 'Fail');
      const command3 = new MockCommand('batch-not-executed', 'Not Executed');
      
      jest.spyOn(command2, 'canExecute').mockReturnValue(false);
      
      const results = commandManager.executeBatch([command1, command2, command3]);
      
      expect(command1.executed).toBe(true);
      expect(command2.executed).toBe(false);
      expect(command3.executed).toBe(false);
      expect(results).toEqual([true, false, false]);
    });
  });

  describe('History Management', () => {
    it('should respect maximum history size', () => {
      const maxSize = 5;
      commandManager.setMaxHistorySize(maxSize);
      
      // Execute more commands than max size
      for (let i = 0; i < maxSize + 3; i++) {
        const command = new MockCommand(`history-${i}`, `Command ${i}`);
        commandManager.execute(command);
      }
      
      const history = commandManager.getHistory();
      expect(history).toHaveLength(maxSize);
    });

    it('should clear history correctly', () => {
      const command = new MockCommand('clear-test', 'Clear Test');
      commandManager.execute(command);
      
      commandManager.clear();
      
      const history = commandManager.getHistory();
      expect(history).toHaveLength(0);
      expect(commandManager.canUndo()).toBe(false);
      expect(commandManager.canRedo()).toBe(false);
    });
  });

  describe('State Queries', () => {
    it('should correctly report undo/redo availability', () => {
      expect(commandManager.canUndo()).toBe(false);
      expect(commandManager.canRedo()).toBe(false);
      
      const command = new MockCommand('state-test', 'State Test');
      commandManager.execute(command);
      
      expect(commandManager.canUndo()).toBe(true);
      expect(commandManager.canRedo()).toBe(false);
      
      commandManager.undo();
      
      expect(commandManager.canUndo()).toBe(false);
      expect(commandManager.canRedo()).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should track command execution metrics', () => {
      const command = new MockCommand('metrics-test', 'Metrics Test');
      
      commandManager.execute(command);
      
      const metrics = commandManager.getMetrics();
      expect(metrics.totalCommands).toBe(1);
      expect(metrics.totalExecutions).toBe(1);
      expect(metrics.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });
});