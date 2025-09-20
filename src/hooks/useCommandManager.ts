import { useCallback, useMemo } from 'react';
import { CommandManager, EditorCommand as Command } from '../utils/commandManager';

/**
 * React hook for using the CommandManager in components
 * Provides type-safe command execution and undo/redo functionality
 */
export function useCommandManager() {
  const commandManager = useMemo(() => CommandManager.getInstance(), []);

  /**
   * Execute a command
   * @param command The command to execute
   */
  const execute = useCallback(async (command: Command) => {
    await commandManager.execute(command);
  }, [commandManager]);

  /**
   * Start a batch of commands
   */
  const startBatch = useCallback(() => {
    commandManager.startBatch();
  }, [commandManager]);

  /**
   * End the current batch of commands
   */
  const endBatch = useCallback(() => {
    commandManager.endBatch();
  }, [commandManager]);

  /**
   * Execute a batch of commands as a single operation
   * @param commands The commands to execute as a batch
   */
  const executeBatch = useCallback(async (commands: Command[]) => {
    commandManager.startBatch();
    try {
      for (const command of commands) {
        await commandManager.execute(command);
      }
    } finally {
      commandManager.endBatch();
    }
  }, [commandManager]);

  /**
   * Undo the last executed command
   */
  const undo = useCallback(async () => {
    await commandManager.undo();
  }, [commandManager]);

  /**
   * Redo the last undone command
   */
  const redo = useCallback(async () => {
    await commandManager.redo();
  }, [commandManager]);

  /**
   * Get the current history state
   */
  const getHistoryState = useCallback(() => {
    return commandManager.getHistoryState();
  }, [commandManager]);

  /**
   * Clear all command history
   */
  const clearHistory = useCallback(() => {
    commandManager.clear();
  }, [commandManager]);

  /**
   * Create a command factory for common operations
   */
  const createCommand = {
    /**
     * Create a command for updating a value
     * @param description Command description
     * @param getValue Function to get the current value
     * @param setValue Function to set the new value
     * @param newValue The new value to set
     */
    update: <T>(
      description: string,
      getValue: () => T,
      setValue: (value: T) => void | Promise<void>,
      newValue: T
    ): Command => {
      const oldValue = getValue();
      return {
        execute: async () => setValue(newValue),
        undo: async () => setValue(oldValue),
        redo: async () => setValue(newValue),
        description
      };
    },

    /**
     * Create a command for adding an item to a list
     * @param description Command description
     * @param getList Function to get the current list
     * @param setList Function to set the new list
     * @param item The item to add
     */
    add: <T>(
      description: string,
      getList: () => T[],
      setList: (list: T[]) => void | Promise<void>,
      item: T
    ): Command => {
      return {
        execute: async () => setList([...getList(), item]),
        undo: async () => setList(getList().filter(i => i !== item)),
        redo: async () => setList([...getList(), item]),
        description
      };
    },

    /**
     * Create a command for removing an item from a list
     * @param description Command description
     * @param getList Function to get the current list
     * @param setList Function to set the new list
     * @param item The item to remove
     */
    remove: <T>(
      description: string,
      getList: () => T[],
      setList: (list: T[]) => void | Promise<void>,
      item: T
    ): Command => {
      return {
        execute: async () => setList(getList().filter(i => i !== item)),
        undo: async () => setList([...getList(), item]),
        redo: async () => setList(getList().filter(i => i !== item)),
        description
      };
    },

    /**
     * Create a command for reordering items in a list
     * @param description Command description
     * @param getList Function to get the current list
     * @param setList Function to set the new list
     * @param fromIndex The original index
     * @param toIndex The target index
     */
    reorder: <T>(
      description: string,
      getList: () => T[],
      setList: (list: T[]) => void | Promise<void>,
      fromIndex: number,
      toIndex: number
    ): Command => {
      return {
        execute: async () => {
          const list = [...getList()];
          const [item] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, item);
          await setList(list);
        },
        undo: async () => {
          const list = [...getList()];
          const [item] = list.splice(toIndex, 1);
          list.splice(fromIndex, 0, item);
          await setList(list);
        },
        redo: async () => {
          const list = [...getList()];
          const [item] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, item);
          await setList(list);
        },
        description
      };
    }
  };

  return {
    execute,
    startBatch,
    endBatch,
    executeBatch,
    undo,
    redo,
    getHistoryState,
    clearHistory,
    createCommand
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * function MyComponent() {
 *   const [text, setText] = useState('');
 *   const { execute, undo, redo, createCommand } = useCommandManager();
 * 
 *   const handleTextChange = (newText: string) => {
 *     execute(
 *       createCommand.update(
 *         'Update text',
 *         () => text,
 *         setText,
 *         newText
 *       )
 *     );
 *   };
 * 
 *   return (
 *     <div>
 *       <input
 *         value={text}
 *         onChange={e => handleTextChange(e.target.value)}
 *       />
 *       <button onClick={undo}>Undo</button>
 *       <button onClick={redo}>Redo</button>
 *     </div>
 *   );
 * }
 * ```
 */