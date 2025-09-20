import { KeyboardShortcut } from '../../../hooks/useKeyboardShortcuts';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';
import { toast } from 'sonner';

export interface TimelineControls {
  // Playback controls
  togglePlayback: () => void;
  frameStep: (direction: 'forward' | 'backward') => void;
  skipSeconds: (seconds: number) => void;
  goToStart: () => void;
  goToEnd: () => void;
  setPlaybackRate: (rate: number) => void;
  
  // Timeline operations
  splitAtPlayhead: () => void;
  deleteSelected: () => void;
  copySelected: () => void;
  pasteAtPlayhead: () => void;
  duplicateSelected: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // Timeline navigation
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  
  // Track operations
  addVideoTrack: () => void;
  addAudioTrack: () => void;
  deleteActiveTrack: () => void;
  
  // Timeline state
  toggleSnap: () => void;
  toggleRipple: () => void;
  toggleMagnetism: () => void;
  
  // Advanced operations
  groupSelected: () => void;
  ungroupSelected: () => void;
  trimToPlayhead: () => void;
  rippleDelete: () => void;
}

/**
 * Creates comprehensive keyboard shortcuts for timeline editing
 */
export const createTimelineShortcuts = (controls: TimelineControls): KeyboardShortcut[] => [
  // ===== PLAYBACK CONTROLS =====
  {
    key: ' ',
    action: () => {
      controls.togglePlayback();
      toast.success('⏯️ Play/Pause', { duration: 1000 });
    },
    description: 'Play/Pause Timeline'
  },
  {
    key: 'k',
    action: () => {
      controls.togglePlayback();
      toast.success('⏯️ Play/Pause', { duration: 1000 });
    },
    description: 'Play/Pause (Alternative)'
  },
  {
    key: 'j',
    action: () => {
      controls.skipSeconds(-1);
      toast.success('⏪ Skip Back 1s', { duration: 800 });
    },
    description: 'Skip Back 1 Second'
  },
  {
    key: 'l',
    action: () => {
      controls.skipSeconds(1);
      toast.success('⏩ Skip Forward 1s', { duration: 800 });
    },
    description: 'Skip Forward 1 Second'
  },
  {
    key: 'ArrowLeft',
    action: () => {
      controls.frameStep('backward');
      toast.success('⬅️ Previous Frame', { duration: 600 });
    },
    description: 'Previous Frame'
  },
  {
    key: 'ArrowRight',
    action: () => {
      controls.frameStep('forward');
      toast.success('➡️ Next Frame', { duration: 600 });
    },
    description: 'Next Frame'
  },
  {
    key: 'Home',
    action: () => {
      controls.goToStart();
      toast.success('🏠 Go to Start', { duration: 1000 });
    },
    description: 'Go to Timeline Start'
  },
  {
    key: 'End',
    action: () => {
      controls.goToEnd();
      toast.success('🔚 Go to End', { duration: 1000 });
    },
    description: 'Go to Timeline End'
  },

  // ===== PLAYBACK SPEED =====
  {
    key: '1',
    action: () => {
      controls.setPlaybackRate(0.25);
      toast.success('🐌 Speed: 0.25x', { duration: 1000 });
    },
    description: 'Set Playback Speed to 0.25x'
  },
  {
    key: '2',
    action: () => {
      controls.setPlaybackRate(0.5);
      toast.success('🐢 Speed: 0.5x', { duration: 1000 });
    },
    description: 'Set Playback Speed to 0.5x'
  },
  {
    key: '3',
    action: () => {
      controls.setPlaybackRate(1.0);
      toast.success('▶️ Speed: 1.0x', { duration: 1000 });
    },
    description: 'Set Playback Speed to Normal (1x)'
  },
  {
    key: '4',
    action: () => {
      controls.setPlaybackRate(1.5);
      toast.success('🚀 Speed: 1.5x', { duration: 1000 });
    },
    description: 'Set Playback Speed to 1.5x'
  },
  {
    key: '5',
    action: () => {
      controls.setPlaybackRate(2.0);
      toast.success('⚡ Speed: 2.0x', { duration: 1000 });
    },
    description: 'Set Playback Speed to 2x'
  },

  // ===== EDITING OPERATIONS =====
  {
    key: 's',
    action: () => {
      controls.splitAtPlayhead();
      toast.success('✂️ Split at Playhead', { duration: 1200 });
    },
    description: 'Split Item at Playhead'
  },
  {
    key: 'Delete',
    action: () => {
      controls.deleteSelected();
      toast.success('🗑️ Deleted Selected', { duration: 1000 });
    },
    description: 'Delete Selected Items'
  },
  {
    key: 'Backspace',
    action: () => {
      controls.deleteSelected();
      toast.success('🗑️ Deleted Selected', { duration: 1000 });
    },
    description: 'Delete Selected Items (Alt)'
  },
  {
    key: 'c',
    ctrlKey: true,
    action: () => {
      controls.copySelected();
      toast.success('📋 Copied Selected', { duration: 1000 });
    },
    description: 'Copy Selected Items'
  },
  {
    key: 'v',
    ctrlKey: true,
    action: () => {
      controls.pasteAtPlayhead();
      toast.success('📌 Pasted at Playhead', { duration: 1000 });
    },
    description: 'Paste at Playhead'
  },
  {
    key: 'd',
    ctrlKey: true,
    action: () => {
      controls.duplicateSelected();
      toast.success('🔄 Duplicated Selected', { duration: 1000 });
    },
    description: 'Duplicate Selected Items'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: () => {
      controls.selectAll();
      toast.success('🎯 Selected All', { duration: 1000 });
    },
    description: 'Select All Items'
  },
  {
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      controls.deselectAll();
      toast.success('❌ Deselected All', { duration: 1000 });
    },
    description: 'Deselect All Items'
  },

  // ===== ZOOM AND NAVIGATION =====
  {
    key: '=',
    ctrlKey: true,
    action: () => {
      controls.zoomIn();
      toast.success('🔍 Zoom In', { duration: 800 });
    },
    description: 'Zoom In Timeline'
  },
  {
    key: '-',
    ctrlKey: true,
    action: () => {
      controls.zoomOut();
      toast.success('🔍 Zoom Out', { duration: 800 });
    },
    description: 'Zoom Out Timeline'
  },
  {
    key: '0',
    ctrlKey: true,
    action: () => {
      controls.zoomToFit();
      toast.success('🎯 Zoom to Fit', { duration: 1000 });
    },
    description: 'Zoom to Fit Timeline'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: () => {
      controls.zoomToSelection();
      toast.success('🎯 Zoom to Selection', { duration: 1000 });
    },
    description: 'Zoom to Selected Items'
  },

  // ===== TRACK OPERATIONS =====
  {
    key: 't',
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      controls.addVideoTrack();
      toast.success('🎬 Added Video Track', { duration: 1200 });
    },
    description: 'Add New Video Track'
  },
  {
    key: 'a',
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      controls.addAudioTrack();
      toast.success('🎵 Added Audio Track', { duration: 1200 });
    },
    description: 'Add New Audio Track'
  },
  {
    key: 'Delete',
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      controls.deleteActiveTrack();
      toast.success('🗑️ Deleted Active Track', { duration: 1200 });
    },
    description: 'Delete Active Track'
  },

  // ===== TIMELINE MODES =====
  {
    key: 'n',
    action: () => {
      controls.toggleSnap();
      toast.success('🧲 Snap Mode Toggled', { duration: 1000 });
    },
    description: 'Toggle Snap Mode'
  },
  {
    key: 'r',
    action: () => {
      controls.toggleRipple();
      toast.success('🌊 Ripple Edit Toggled', { duration: 1000 });
    },
    description: 'Toggle Ripple Edit Mode'
  },
  {
    key: 'm',
    action: () => {
      controls.toggleMagnetism();
      toast.success('🧲 Magnetism Toggled', { duration: 1000 });
    },
    description: 'Toggle Magnetic Timeline'
  },

  // ===== ADVANCED OPERATIONS =====
  {
    key: 'g',
    ctrlKey: true,
    action: () => {
      controls.groupSelected();
      toast.success('📦 Grouped Selected', { duration: 1200 });
    },
    description: 'Group Selected Items'
  },
  {
    key: 'g',
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      controls.ungroupSelected();
      toast.success('📤 Ungrouped Selected', { duration: 1200 });
    },
    description: 'Ungroup Selected Items'
  },
  {
    key: 't',
    shiftKey: true,
    action: () => {
      controls.trimToPlayhead();
      toast.success('✂️ Trimmed to Playhead', { duration: 1200 });
    },
    description: 'Trim to Playhead'
  },
  {
    key: 'Delete',
    shiftKey: true,
    action: () => {
      controls.rippleDelete();
      toast.success('🌊 Ripple Delete', { duration: 1200 });
    },
    description: 'Ripple Delete Selected'
  }
];

/**
 * Creates contextual shortcuts for different timeline modes
 */
export const createContextualShortcuts = (
  mode: 'select' | 'trim' | 'ripple' | 'slip',
  controls: Partial<TimelineControls>
): KeyboardShortcut[] => {
  const baseShortcuts: KeyboardShortcut[] = [
    {
      key: 'Escape',
      action: () => {
        controls.deselectAll?.();
        toast.success('❌ Cancelled Operation', { duration: 1000 });
      },
      description: 'Cancel Current Operation'
    }
  ];

  switch (mode) {
    case 'trim':
      return [
        ...baseShortcuts,
        {
          key: 'q',
          action: () => {
            toast.success('✂️ Trim Start', { duration: 1000 });
          },
          description: 'Trim Start of Selection'
        },
        {
          key: 'w',
          action: () => {
            toast.success('✂️ Trim End', { duration: 1000 });
          },
          description: 'Trim End of Selection'
        }
      ];
      
    case 'ripple':
      return [
        ...baseShortcuts,
        {
          key: 'x',
          action: () => {
            controls.rippleDelete?.();
            toast.success('🌊 Ripple Delete', { duration: 1200 });
          },
          description: 'Ripple Delete'
        }
      ];
      
    default:
      return baseShortcuts;
  }
};

/**
 * Quick reference for all timeline shortcuts
 */
export const TIMELINE_SHORTCUTS_REFERENCE = {
  playback: [
    { keys: 'Space/K', action: 'Play/Pause' },
    { keys: 'J/L', action: 'Skip Backward/Forward' },
    { keys: '←/→', action: 'Frame Step' },
    { keys: 'Home/End', action: 'Go to Start/End' },
    { keys: '1-5', action: 'Playback Speed' }
  ],
  editing: [
    { keys: 'S', action: 'Split at Playhead' },
    { keys: 'Del/Backspace', action: 'Delete Selected' },
    { keys: 'Ctrl+C/V', action: 'Copy/Paste' },
    { keys: 'Ctrl+D', action: 'Duplicate' },
    { keys: 'Ctrl+A', action: 'Select All' }
  ],
  timeline: [
    { keys: 'Ctrl + +/-', action: 'Zoom In/Out' },
    { keys: 'Ctrl+0', action: 'Zoom to Fit' },
    { keys: 'Ctrl+F', action: 'Zoom to Selection' },
    { keys: 'N/R/M', action: 'Toggle Snap/Ripple/Magnet' }
  ],
  tracks: [
    { keys: 'Ctrl+Shift+T', action: 'Add Video Track' },
    { keys: 'Ctrl+Shift+A', action: 'Add Audio Track' },
    { keys: 'Ctrl+Shift+Del', action: 'Delete Active Track' }
  ],
  advanced: [
    { keys: 'Ctrl+G', action: 'Group Selected' },
    { keys: 'Ctrl+Shift+G', action: 'Ungroup Selected' },
    { keys: 'Shift+T', action: 'Trim to Playhead' },
    { keys: 'Shift+Del', action: 'Ripple Delete' }
  ]
};