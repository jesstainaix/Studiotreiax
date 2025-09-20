import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  ignoreInputs?: boolean;
  shortcuts: KeyboardShortcut[];
}

export const useKeyboardShortcuts = ({
  enabled = true,
  ignoreInputs = true,
  shortcuts
}: UseKeyboardShortcutsOptions) => {
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore shortcuts when typing in input fields
    if (ignoreInputs && (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    )) {
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = (shortcut.ctrlKey ?? false) === event.ctrlKey;
      const shiftMatch = (shortcut.shiftKey ?? false) === event.shiftKey;
      const altMatch = (shortcut.altKey ?? false) === event.altKey;
      const metaMatch = (shortcut.metaKey ?? false) === event.metaKey;
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [enabled, ignoreInputs]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  // Helper function to format shortcut display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.metaKey) parts.push('Cmd');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    
    // Format special keys
    let keyDisplay = shortcut.key;
    switch (shortcut.key.toLowerCase()) {
      case ' ':
        keyDisplay = 'Space';
        break;
      case 'arrowleft':
        keyDisplay = '←';
        break;
      case 'arrowright':
        keyDisplay = '→';
        break;
      case 'arrowup':
        keyDisplay = '↑';
        break;
      case 'arrowdown':
        keyDisplay = '↓';
        break;
      case 'home':
        keyDisplay = 'Home';
        break;
      case 'end':
        keyDisplay = 'End';
        break;
      case 'escape':
        keyDisplay = 'Esc';
        break;
      case 'enter':
        keyDisplay = 'Enter';
        break;
      case 'backspace':
        keyDisplay = 'Backspace';
        break;
      case 'delete':
        keyDisplay = 'Delete';
        break;
      default:
        keyDisplay = shortcut.key.toUpperCase();
    }
    
    parts.push(keyDisplay);
    return parts.join('+');
  }, []);

  // Get all shortcuts with formatted display
  const getShortcutsList = useCallback(() => {
    return shortcutsRef.current.map(shortcut => ({
      ...shortcut,
      display: formatShortcut(shortcut)
    }));
  }, [formatShortcut]);

  return {
    formatShortcut,
    getShortcutsList
  };
};

// Predefined shortcut sets for common video editor actions
export const createPlaybackShortcuts = (controls: {
  togglePlayback: () => void;
  frameStep: (direction: 'forward' | 'backward') => void;
  skipSeconds: (seconds: number) => void;
  goToStart: () => void;
  goToEnd: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setPlaybackRate: (rate: number) => void;
}): KeyboardShortcut[] => [
  {
    key: ' ',
    action: controls.togglePlayback,
    description: 'Play/Pause'
  },
  {
    key: 'k',
    action: controls.togglePlayback,
    description: 'Play/Pause (Alternative)'
  },
  {
    key: 'ArrowLeft',
    action: () => controls.frameStep('backward'),
    description: 'Previous Frame'
  },
  {
    key: 'ArrowRight',
    action: () => controls.frameStep('forward'),
    description: 'Next Frame'
  },
  {
    key: 'ArrowLeft',
    shiftKey: true,
    action: () => controls.skipSeconds(-10),
    description: 'Skip Back 10 Seconds'
  },
  {
    key: 'ArrowRight',
    shiftKey: true,
    action: () => controls.skipSeconds(10),
    description: 'Skip Forward 10 Seconds'
  },
  {
    key: 'j',
    action: () => controls.skipSeconds(-10),
    description: 'Skip Back 10 Seconds'
  },
  {
    key: 'l',
    action: () => controls.skipSeconds(10),
    description: 'Skip Forward 10 Seconds'
  },
  {
    key: 'Home',
    action: controls.goToStart,
    description: 'Go to Start'
  },
  {
    key: 'End',
    action: controls.goToEnd,
    description: 'Go to End'
  },
  {
    key: 'm',
    action: controls.toggleMute,
    description: 'Toggle Mute'
  },
  {
    key: 'f',
    action: controls.toggleFullscreen,
    description: 'Toggle Fullscreen'
  },
  {
    key: '1',
    action: () => controls.setPlaybackRate(0.25),
    description: 'Set Speed to 0.25x'
  },
  {
    key: '2',
    action: () => controls.setPlaybackRate(0.5),
    description: 'Set Speed to 0.5x'
  },
  {
    key: '3',
    action: () => controls.setPlaybackRate(1),
    description: 'Set Speed to 1x'
  },
  {
    key: '4',
    action: () => controls.setPlaybackRate(2),
    description: 'Set Speed to 2x'
  },
  {
    key: '5',
    action: () => controls.setPlaybackRate(4),
    description: 'Set Speed to 4x'
  }
];

export const createEditingShortcuts = (actions: {
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  cut: () => void;
  delete: () => void;
  selectAll: () => void;
  save: () => void;
}): KeyboardShortcut[] => [
  {
    key: 'z',
    ctrlKey: true,
    action: actions.undo,
    description: 'Undo'
  },
  {
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    action: actions.redo,
    description: 'Redo'
  },
  {
    key: 'y',
    ctrlKey: true,
    action: actions.redo,
    description: 'Redo (Alternative)'
  },
  {
    key: 'c',
    ctrlKey: true,
    action: actions.copy,
    description: 'Copy'
  },
  {
    key: 'v',
    ctrlKey: true,
    action: actions.paste,
    description: 'Paste'
  },
  {
    key: 'x',
    ctrlKey: true,
    action: actions.cut,
    description: 'Cut'
  },
  {
    key: 'Delete',
    action: actions.delete,
    description: 'Delete Selected'
  },
  {
    key: 'Backspace',
    action: actions.delete,
    description: 'Delete Selected'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: actions.selectAll,
    description: 'Select All'
  },
  {
    key: 's',
    ctrlKey: true,
    action: actions.save,
    description: 'Save Project'
  }
];

export default useKeyboardShortcuts;