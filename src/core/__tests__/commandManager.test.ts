import { CommandManager, Command } from '../commandManager';
import { EventSystem } from '../eventSystem';

// Mock EventSystem
jest.mock('../eventSystem', () => ({
  EventSystem: {
    getInstance: jest.fn().mockReturnValue({
      emit: jest.fn(),
    }),
  },
}));

describe('CommandManager', () => {
  let commandManager: CommandManager;
  let eventSystem: EventSystem;

  beforeEach(() => {
    // Reset singleton instance before each test
    (CommandManager as any).instance = null;
    commandManager = CommandManager.getInstance();
    eventSystem = EventSystem.getInstance();
    (eventSystem.emit as jest.Mock).mockClear();
  });

  // Test command for use in tests
  const createTestCommand = (description: string): Command => ({
    execute: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    description,
  });

  it('should be a singleton', () => {
    const instance1 = CommandManager.getInstance();
    const instance2 = CommandManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should execute a command and add it to the undo stack', async () => {
    const command = createTestCommand('Test Command');
    await commandManager.execute(command);

    expect(command.execute).toHaveBeenCalledTimes(1);
    expect(commandManager.getHistoryState().canUndo).toBe(true);
    expect(commandManager.getHistoryState().undoDescription).toBe('Test Command');
    expect(eventSystem.emit).toHaveBeenCalledWith('project.save', { projectId: 'current' });
  });

  it('should undo a command and add it to the redo stack', async () => {
    const command = createTestCommand('Undo Command');
    await commandManager.execute(command);
    await commandManager.undo();

    expect(command.undo).toHaveBeenCalledTimes(1);
    expect(commandManager.getHistoryState().canUndo).toBe(false);
    expect(commandManager.getHistoryState().canRedo).toBe(true);
    expect(commandManager.getHistoryState().redoDescription).toBe('Undo Command');
    expect(eventSystem.emit).toHaveBeenCalledTimes(2);
  });

  it('should redo a command and add it back to the undo stack', async () => {
    const command = createTestCommand('Redo Command');
    await commandManager.execute(command);
    await commandManager.undo();
    await commandManager.redo();

    expect(command.redo).toHaveBeenCalledTimes(1);
    expect(commandManager.getHistoryState().canUndo).toBe(true);
    expect(commandManager.getHistoryState().canRedo).toBe(false);
    expect(commandManager.getHistoryState().undoDescription).toBe('Redo Command');
    expect(eventSystem.emit).toHaveBeenCalledTimes(3);
  });

  it('should clear the redo stack when a new command is executed', async () => {
    const command1 = createTestCommand('Command 1');
    const command2 = createTestCommand('Command 2');

    await commandManager.execute(command1);
    await commandManager.undo();
    await commandManager.execute(command2);

    expect(commandManager.getHistoryState().canRedo).toBe(false);
  });

  it('should handle command execution errors gracefully', async () => {
    const error = new Error('Execution failed');
    const command: Command = {
      execute: jest.fn().mockRejectedValue(error),
      undo: jest.fn(),
      redo: jest.fn(),
      description: 'Error Command',
    };

    await expect(commandManager.execute(command)).rejects.toThrow('Execution failed');
    expect(commandManager.getHistoryState().canUndo).toBe(false);
  });

  it('should handle batch commands correctly', async () => {
    const command1 = createTestCommand('Batch 1');
    const command2 = createTestCommand('Batch 2');

    commandManager.startBatch();
    await commandManager.execute(command1);
    await commandManager.execute(command2);
    commandManager.endBatch();

    expect(command1.execute).toHaveBeenCalledTimes(1);
    expect(command2.execute).toHaveBeenCalledTimes(1);
    expect(commandManager.getHistoryState().canUndo).toBe(true);
    expect(commandManager.getHistoryState().undoDescription).toContain('Batch 1, Batch 2');

    await commandManager.undo();
    expect(command2.undo).toHaveBeenCalledTimes(1);
    expect(command1.undo).toHaveBeenCalledTimes(1);
  });

  it('should limit the history size', async () => {
    commandManager.setMaxHistorySize(2);

    for (let i = 0; i < 5; i++) {
      await commandManager.execute(createTestCommand(`Command ${i + 1}`));
    }

    expect(commandManager.getHistoryState().undoDescription).toBe('Command 5');
    await commandManager.undo();
    expect(commandManager.getHistoryState().undoDescription).toBe('Command 4');
    await commandManager.undo();
    expect(commandManager.getHistoryState().canUndo).toBe(false);
  });

  it('should clear all history', async () => {
    await commandManager.execute(createTestCommand('Command 1'));
    await commandManager.execute(createTestCommand('Command 2'));
    await commandManager.undo();

    commandManager.clear();

    expect(commandManager.getHistoryState().canUndo).toBe(false);
    expect(commandManager.getHistoryState().canRedo).toBe(false);
  });
});