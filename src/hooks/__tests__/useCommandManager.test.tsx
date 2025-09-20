import { renderHook, act } from '@testing-library/react';
import { useCommandManager } from '../useCommandManager';
import { CommandManager, Command } from '../../core/commandManager';

// Mock CommandManager
jest.mock('../../core/commandManager', () => {
  const mockInstance = {
    execute: jest.fn(),
    startBatch: jest.fn(),
    endBatch: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    clear: jest.fn(),
    getHistoryState: jest.fn(),
  };

  return {
    CommandManager: {
      getInstance: jest.fn(() => mockInstance),
    },
    Command: jest.requireActual('../../core/commandManager').Command,
  };
});

describe('useCommandManager', () => {
  let commandManager: jest.Mocked<CommandManager>;

  beforeEach(() => {
    commandManager = CommandManager.getInstance() as jest.Mocked<CommandManager>;
    jest.clearAllMocks();
  });

  it('should return the same instance on multiple renders', () => {
    const { result, rerender } = renderHook(() => useCommandManager());
    const firstInstance = result.current;

    rerender();
    expect(result.current).toBe(firstInstance);
    expect(CommandManager.getInstance).toHaveBeenCalledTimes(1);
  });

  it('should execute a command', async () => {
    const { result } = renderHook(() => useCommandManager());
    const command: Command = {
      execute: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      description: 'Test Command',
    };

    await act(async () => {
      await result.current.execute(command);
    });

    expect(commandManager.execute).toHaveBeenCalledWith(command);
  });

  it('should handle batch operations', async () => {
    const { result } = renderHook(() => useCommandManager());
    const commands = [
      {
        execute: jest.fn(),
        undo: jest.fn(),
        redo: jest.fn(),
        description: 'Batch Command 1',
      },
      {
        execute: jest.fn(),
        undo: jest.fn(),
        redo: jest.fn(),
        description: 'Batch Command 2',
      },
    ];

    await act(async () => {
      await result.current.executeBatch(commands);
    });

    expect(commandManager.startBatch).toHaveBeenCalled();
    expect(commandManager.execute).toHaveBeenCalledTimes(2);
    expect(commandManager.endBatch).toHaveBeenCalled();
  });

  it('should handle undo and redo operations', async () => {
    const { result } = renderHook(() => useCommandManager());

    await act(async () => {
      await result.current.undo();
      await result.current.redo();
    });

    expect(commandManager.undo).toHaveBeenCalled();
    expect(commandManager.redo).toHaveBeenCalled();
  });

  it('should create update commands correctly', async () => {
    const { result } = renderHook(() => useCommandManager());
    const getValue = jest.fn().mockReturnValue('old');
    const setValue = jest.fn();

    const command = result.current.createCommand.update(
      'Update value',
      getValue,
      setValue,
      'new'
    );

    await act(async () => {
      await command.execute();
      await command.undo();
      await command.redo();
    });

    expect(setValue).toHaveBeenNthCalledWith(1, 'new');
    expect(setValue).toHaveBeenNthCalledWith(2, 'old');
    expect(setValue).toHaveBeenNthCalledWith(3, 'new');
    expect(command.description).toBe('Update value');
  });

  it('should create add commands correctly', async () => {
    const { result } = renderHook(() => useCommandManager());
    const list = ['item1'];
    const getList = jest.fn().mockReturnValue(list);
    const setList = jest.fn();
    const newItem = 'item2';

    const command = result.current.createCommand.add(
      'Add item',
      getList,
      setList,
      newItem
    );

    await act(async () => {
      await command.execute();
    });

    expect(setList).toHaveBeenCalledWith(['item1', 'item2']);
  });

  it('should create remove commands correctly', async () => {
    const { result } = renderHook(() => useCommandManager());
    const list = ['item1', 'item2'];
    const getList = jest.fn().mockReturnValue(list);
    const setList = jest.fn();
    const itemToRemove = 'item2';

    const command = result.current.createCommand.remove(
      'Remove item',
      getList,
      setList,
      itemToRemove
    );

    await act(async () => {
      await command.execute();
    });

    expect(setList).toHaveBeenCalledWith(['item1']);
  });

  it('should create reorder commands correctly', async () => {
    const { result } = renderHook(() => useCommandManager());
    const list = ['item1', 'item2', 'item3'];
    const getList = jest.fn().mockReturnValue(list);
    const setList = jest.fn();

    const command = result.current.createCommand.reorder(
      'Reorder items',
      getList,
      setList,
      0,
      2
    );

    await act(async () => {
      await command.execute();
    });

    expect(setList).toHaveBeenCalledWith(['item2', 'item3', 'item1']);
  });

  it('should clear history', () => {
    const { result } = renderHook(() => useCommandManager());

    act(() => {
      result.current.clearHistory();
    });

    expect(commandManager.clear).toHaveBeenCalled();
  });

  it('should get history state', () => {
    const { result } = renderHook(() => useCommandManager());
    const mockState = {
      canUndo: true,
      canRedo: false,
      undoDescription: 'Last command',
      redoDescription: undefined,
    };

    commandManager.getHistoryState.mockReturnValue(mockState);

    const state = result.current.getHistoryState();
    expect(state).toEqual(mockState);
  });
});