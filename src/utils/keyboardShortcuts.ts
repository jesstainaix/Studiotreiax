import { create } from 'zustand';
import { toast } from 'sonner';

// Interfaces
export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  context?: string;
  category: string;
  action: () => void;
  enabled: boolean;
  global: boolean;
  preventDefault: boolean;
  stopPropagation: boolean;
  priority: number;
  customizable: boolean;
  icon?: string;
  tags: string[];
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface ShortcutGroup {
  id: string;
  name: string;
  description: string;
  shortcuts: string[];
  enabled: boolean;
  context?: string;
  priority: number;
  icon?: string;
  color?: string;
}

export interface ShortcutContext {
  id: string;
  name: string;
  description: string;
  element?: HTMLElement;
  selector?: string;
  active: boolean;
  priority: number;
  shortcuts: string[];
}

export interface KeySequence {
  keys: string[];
  timestamp: number;
  context?: string;
  completed: boolean;
}

export interface ShortcutStats {
  totalShortcuts: number;
  activeShortcuts: number;
  customShortcuts: number;
  totalUsage: number;
  mostUsed: KeyboardShortcut[];
  recentlyUsed: KeyboardShortcut[];
  categoryStats: Record<string, number>;
  contextStats: Record<string, number>;
  averageResponseTime: number;
  successRate: number;
}

export interface ShortcutConfig {
  enabled: boolean;
  showTooltips: boolean;
  showFeedback: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  sequenceTimeout: number;
  maxSequenceLength: number;
  caseSensitive: boolean;
  allowRepeats: boolean;
  debugMode: boolean;
  autoSave: boolean;
  theme: 'light' | 'dark' | 'auto';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  animationDuration: number;
  shortcuts: Record<string, string[]>;
}

export interface ShortcutPerformance {
  responseTime: number;
  memoryUsage: number;
  eventCount: number;
  errorCount: number;
  lastError?: string;
  isHealthy: boolean;
  recommendations: string[];
}

// Store
interface ShortcutStore {
  // State
  shortcuts: Record<string, KeyboardShortcut>;
  groups: Record<string, ShortcutGroup>;
  contexts: Record<string, ShortcutContext>;
  activeContext: string | null;
  currentSequence: KeySequence | null;
  stats: ShortcutStats;
  config: ShortcutConfig;
  performance: ShortcutPerformance;
  isRecording: boolean;
  recordingShortcut: string | null;
  
  // Actions
  addShortcut: (shortcut: Omit<KeyboardShortcut, 'id' | 'createdAt' | 'usageCount'>) => string;
  updateShortcut: (id: string, updates: Partial<KeyboardShortcut>) => void;
  removeShortcut: (id: string) => void;
  enableShortcut: (id: string) => void;
  disableShortcut: (id: string) => void;
  executeShortcut: (id: string) => void;
  
  // Groups
  addGroup: (group: Omit<ShortcutGroup, 'id'>) => string;
  updateGroup: (id: string, updates: Partial<ShortcutGroup>) => void;
  removeGroup: (id: string) => void;
  enableGroup: (id: string) => void;
  disableGroup: (id: string) => void;
  
  // Contexts
  addContext: (context: Omit<ShortcutContext, 'id'>) => string;
  updateContext: (id: string, updates: Partial<ShortcutContext>) => void;
  removeContext: (id: string) => void;
  setActiveContext: (id: string | null) => void;
  
  // Key handling
  handleKeyDown: (event: KeyboardEvent) => boolean;
  handleKeyUp: (event: KeyboardEvent) => void;
  startSequence: (keys: string[]) => void;
  addToSequence: (key: string) => void;
  completeSequence: () => void;
  clearSequence: () => void;
  
  // Recording
  startRecording: (shortcutId: string) => void;
  stopRecording: () => void;
  recordKey: (key: string) => void;
  
  // Config
  updateConfig: (updates: Partial<ShortcutConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => void;
  
  // Stats
  updateStats: () => void;
  resetStats: () => void;
  getShortcutStats: (id: string) => Partial<ShortcutStats>;
  
  // Performance
  updatePerformance: () => void;
  optimizePerformance: () => void;
  
  // Utilities
  findShortcut: (keys: string[], context?: string) => KeyboardShortcut | null;
  validateShortcut: (keys: string[]) => boolean;
  formatKeys: (keys: string[]) => string;
  parseKeys: (keyString: string) => string[];
  getConflicts: (keys: string[], context?: string) => KeyboardShortcut[];
  
  // Data
  exportData: () => string;
  importData: (data: string) => void;
  clearData: () => void;
  resetSystem: () => void;
}

// Default config
const defaultConfig: ShortcutConfig = {
  enabled: true,
  showTooltips: true,
  showFeedback: true,
  soundEnabled: false,
  vibrationEnabled: false,
  sequenceTimeout: 2000,
  maxSequenceLength: 5,
  caseSensitive: false,
  allowRepeats: true,
  debugMode: false,
  autoSave: true,
  theme: 'auto',
  position: 'top-right',
  animationDuration: 300,
  shortcuts: {}
};

// Store implementation
export const useShortcutStore = create<ShortcutStore>((set, get) => ({
  // Initial state
  shortcuts: {},
  groups: {},
  contexts: {},
  activeContext: null,
  currentSequence: null,
  stats: {
    totalShortcuts: 0,
    activeShortcuts: 0,
    customShortcuts: 0,
    totalUsage: 0,
    mostUsed: [],
    recentlyUsed: [],
    categoryStats: {},
    contextStats: {},
    averageResponseTime: 0,
    successRate: 100
  },
  config: defaultConfig,
  performance: {
    responseTime: 0,
    memoryUsage: 0,
    eventCount: 0,
    errorCount: 0,
    isHealthy: true,
    recommendations: []
  },
  isRecording: false,
  recordingShortcut: null,
  
  // Shortcut actions
  addShortcut: (shortcut) => {
    const id = `shortcut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newShortcut: KeyboardShortcut = {
      ...shortcut,
      id,
      createdAt: new Date(),
      usageCount: 0
    };
    
    set((state) => ({
      shortcuts: {
        ...state.shortcuts,
        [id]: newShortcut
      }
    }));
    
    get().updateStats();
    return id;
  },
  
  updateShortcut: (id, updates) => {
    set((state) => ({
      shortcuts: {
        ...state.shortcuts,
        [id]: {
          ...state.shortcuts[id],
          ...updates
        }
      }
    }));
    
    get().updateStats();
  },
  
  removeShortcut: (id) => {
    set((state) => {
      const { [id]: removed, ...rest } = state.shortcuts;
      return { shortcuts: rest };
    });
    
    get().updateStats();
  },
  
  enableShortcut: (id) => {
    get().updateShortcut(id, { enabled: true });
  },
  
  disableShortcut: (id) => {
    get().updateShortcut(id, { enabled: false });
  },
  
  executeShortcut: (id) => {
    const shortcut = get().shortcuts[id];
    if (!shortcut || !shortcut.enabled) return;
    
    try {
      const startTime = performance.now();
      shortcut.action();
      const endTime = performance.now();
      
      // Update usage stats
      get().updateShortcut(id, {
        lastUsed: new Date(),
        usageCount: shortcut.usageCount + 1
      });
      
      // Update performance
      set((state) => ({
        performance: {
          ...state.performance,
          responseTime: endTime - startTime,
          eventCount: state.performance.eventCount + 1
        }
      }));
      
      // Show feedback
      if (get().config.showFeedback) {
        toast.success(`Atalho executado: ${shortcut.name}`);
      }
      
      get().updateStats();
    } catch (error) {
      console.error('Error executing shortcut:', error);
      
      set((state) => ({
        performance: {
          ...state.performance,
          errorCount: state.performance.errorCount + 1,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      
      if (get().config.showFeedback) {
        toast.error(`Erro ao executar atalho: ${shortcut.name}`);
      }
    }
  },
  
  // Group actions
  addGroup: (group) => {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    set((state) => ({
      groups: {
        ...state.groups,
        [id]: { ...group, id }
      }
    }));
    
    return id;
  },
  
  updateGroup: (id, updates) => {
    set((state) => ({
      groups: {
        ...state.groups,
        [id]: {
          ...state.groups[id],
          ...updates
        }
      }
    }));
  },
  
  removeGroup: (id) => {
    set((state) => {
      const { [id]: removed, ...rest } = state.groups;
      return { groups: rest };
    });
  },
  
  enableGroup: (id) => {
    const group = get().groups[id];
    if (!group) return;
    
    get().updateGroup(id, { enabled: true });
    
    // Enable all shortcuts in group
    group.shortcuts.forEach(shortcutId => {
      get().enableShortcut(shortcutId);
    });
  },
  
  disableGroup: (id) => {
    const group = get().groups[id];
    if (!group) return;
    
    get().updateGroup(id, { enabled: false });
    
    // Disable all shortcuts in group
    group.shortcuts.forEach(shortcutId => {
      get().disableShortcut(shortcutId);
    });
  },
  
  // Context actions
  addContext: (context) => {
    const id = `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    set((state) => ({
      contexts: {
        ...state.contexts,
        [id]: { ...context, id }
      }
    }));
    
    return id;
  },
  
  updateContext: (id, updates) => {
    set((state) => ({
      contexts: {
        ...state.contexts,
        [id]: {
          ...state.contexts[id],
          ...updates
        }
      }
    }));
  },
  
  removeContext: (id) => {
    set((state) => {
      const { [id]: removed, ...rest } = state.contexts;
      return { contexts: rest };
    });
  },
  
  setActiveContext: (id) => {
    set({ activeContext: id });
  },
  
  // Key handling
  handleKeyDown: (event) => {
    const config = get().config;
    if (!config.enabled) return false;
    
    const key = formatKeyEvent(event);
    const state = get();
    
    // Check if we're in a sequence
    if (state.currentSequence) {
      get().addToSequence(key);
      return true;
    }
    
    // Look for direct match
    const shortcut = get().findShortcut([key], state.activeContext || undefined);
    if (shortcut) {
      if (shortcut.preventDefault) event.preventDefault();
      if (shortcut.stopPropagation) event.stopPropagation();
      
      get().executeShortcut(shortcut.id);
      return true;
    }
    
    // Start sequence if this could be the beginning of one
    const potentialShortcuts = Object.values(state.shortcuts).filter(s => 
      s.enabled && s.keys.length > 1 && s.keys[0] === key &&
      (!s.context || s.context === state.activeContext)
    );
    
    if (potentialShortcuts.length > 0) {
      get().startSequence([key]);
      return true;
    }
    
    return false;
  },
  
  handleKeyUp: (event) => {
    // Handle key up events if needed
  },
  
  startSequence: (keys) => {
    set({
      currentSequence: {
        keys,
        timestamp: Date.now(),
        context: get().activeContext || undefined,
        completed: false
      }
    });
    
    // Set timeout to clear sequence
    setTimeout(() => {
      const current = get().currentSequence;
      if (current && current.timestamp === Date.now()) {
        get().clearSequence();
      }
    }, get().config.sequenceTimeout);
  },
  
  addToSequence: (key) => {
    const sequence = get().currentSequence;
    if (!sequence) return;
    
    const newKeys = [...sequence.keys, key];
    
    // Check for complete match
    const shortcut = get().findShortcut(newKeys, sequence.context);
    if (shortcut) {
      get().executeShortcut(shortcut.id);
      get().completeSequence();
      return;
    }
    
    // Check if sequence is still valid
    const potentialShortcuts = Object.values(get().shortcuts).filter(s => 
      s.enabled && s.keys.length > newKeys.length &&
      s.keys.slice(0, newKeys.length).every((k, i) => k === newKeys[i]) &&
      (!s.context || s.context === sequence.context)
    );
    
    if (potentialShortcuts.length === 0 || newKeys.length >= get().config.maxSequenceLength) {
      get().clearSequence();
      return;
    }
    
    // Update sequence
    set({
      currentSequence: {
        ...sequence,
        keys: newKeys
      }
    });
  },
  
  completeSequence: () => {
    set({
      currentSequence: {
        ...get().currentSequence!,
        completed: true
      }
    });
    
    setTimeout(() => get().clearSequence(), 100);
  },
  
  clearSequence: () => {
    set({ currentSequence: null });
  },
  
  // Recording
  startRecording: (shortcutId) => {
    set({
      isRecording: true,
      recordingShortcut: shortcutId
    });
  },
  
  stopRecording: () => {
    set({
      isRecording: false,
      recordingShortcut: null
    });
  },
  
  recordKey: (key) => {
    const { isRecording, recordingShortcut } = get();
    if (!isRecording || !recordingShortcut) return;
    
    const shortcut = get().shortcuts[recordingShortcut];
    if (!shortcut) return;
    
    get().updateShortcut(recordingShortcut, {
      keys: [...shortcut.keys, key]
    });
  },
  
  // Config
  updateConfig: (updates) => {
    set((state) => ({
      config: {
        ...state.config,
        ...updates
      }
    }));
  },
  
  resetConfig: () => {
    set({ config: defaultConfig });
  },
  
  exportConfig: () => {
    return JSON.stringify(get().config, null, 2);
  },
  
  importConfig: (configString) => {
    try {
      const config = JSON.parse(configString);
      set({ config: { ...defaultConfig, ...config } });
    } catch (error) {
      console.error('Error importing config:', error);
    }
  },
  
  // Stats
  updateStats: () => {
    const { shortcuts, groups, contexts } = get();
    
    const shortcutList = Object.values(shortcuts);
    const activeShortcuts = shortcutList.filter(s => s.enabled);
    const customShortcuts = shortcutList.filter(s => s.customizable);
    
    const categoryStats: Record<string, number> = {};
    const contextStats: Record<string, number> = {};
    
    shortcutList.forEach(shortcut => {
      categoryStats[shortcut.category] = (categoryStats[shortcut.category] || 0) + 1;
      if (shortcut.context) {
        contextStats[shortcut.context] = (contextStats[shortcut.context] || 0) + 1;
      }
    });
    
    const mostUsed = shortcutList
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
    
    const recentlyUsed = shortcutList
      .filter(s => s.lastUsed)
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, 10);
    
    const totalUsage = shortcutList.reduce((sum, s) => sum + s.usageCount, 0);
    
    set((state) => ({
      stats: {
        totalShortcuts: shortcutList.length,
        activeShortcuts: activeShortcuts.length,
        customShortcuts: customShortcuts.length,
        totalUsage,
        mostUsed,
        recentlyUsed,
        categoryStats,
        contextStats,
        averageResponseTime: state.performance.responseTime,
        successRate: state.performance.errorCount === 0 ? 100 : 
          ((state.performance.eventCount - state.performance.errorCount) / state.performance.eventCount) * 100
      }
    }));
  },
  
  resetStats: () => {
    set((state) => ({
      stats: {
        totalShortcuts: 0,
        activeShortcuts: 0,
        customShortcuts: 0,
        totalUsage: 0,
        mostUsed: [],
        recentlyUsed: [],
        categoryStats: {},
        contextStats: {},
        averageResponseTime: 0,
        successRate: 100
      },
      shortcuts: Object.fromEntries(
        Object.entries(state.shortcuts).map(([id, shortcut]) => [
          id,
          { ...shortcut, usageCount: 0, lastUsed: undefined }
        ])
      )
    }));
  },
  
  getShortcutStats: (id) => {
    const shortcut = get().shortcuts[id];
    if (!shortcut) return {};
    
    return {
      totalUsage: shortcut.usageCount,
      lastUsed: shortcut.lastUsed
    };
  },
  
  // Performance
  updatePerformance: () => {
    const { performance, shortcuts } = get();
    const shortcutCount = Object.keys(shortcuts).length;
    
    const memoryUsage = JSON.stringify({ shortcuts }).length / 1024; // KB
    const isHealthy = performance.errorCount < 10 && memoryUsage < 1000;
    
    const recommendations: string[] = [];
    if (performance.errorCount > 5) {
      recommendations.push('Muitos erros detectados - verifique os atalhos');
    }
    if (memoryUsage > 500) {
      recommendations.push('Alto uso de memória - considere limpar dados antigos');
    }
    if (shortcutCount > 100) {
      recommendations.push('Muitos atalhos - considere organizar em grupos');
    }
    
    set((state) => ({
      performance: {
        ...state.performance,
        memoryUsage,
        isHealthy,
        recommendations
      }
    }));
  },
  
  optimizePerformance: () => {
    // Remove unused shortcuts
    const { shortcuts } = get();
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    const optimizedShortcuts = Object.fromEntries(
      Object.entries(shortcuts).filter(([_, shortcut]) => 
        shortcut.usageCount > 0 || 
        !shortcut.lastUsed || 
        shortcut.lastUsed > cutoffDate
      )
    );
    
    set({ shortcuts: optimizedShortcuts });
    get().updateStats();
    get().updatePerformance();
  },
  
  // Utilities
  findShortcut: (keys, context) => {
    const { shortcuts } = get();
    
    return Object.values(shortcuts).find(shortcut => 
      shortcut.enabled &&
      shortcut.keys.length === keys.length &&
      shortcut.keys.every((key, index) => key === keys[index]) &&
      (!shortcut.context || shortcut.context === context)
    ) || null;
  },
  
  validateShortcut: (keys) => {
    return keys.length > 0 && keys.every(key => key.trim().length > 0);
  },
  
  formatKeys: (keys) => {
    return keys.join(' + ');
  },
  
  parseKeys: (keyString) => {
    return keyString.split('+').map(key => key.trim());
  },
  
  getConflicts: (keys, context) => {
    const { shortcuts } = get();
    
    return Object.values(shortcuts).filter(shortcut => 
      shortcut.keys.length === keys.length &&
      shortcut.keys.every((key, index) => key === keys[index]) &&
      (!shortcut.context || shortcut.context === context)
    );
  },
  
  // Data management
  exportData: () => {
    const { shortcuts, groups, contexts, config } = get();
    return JSON.stringify({ shortcuts, groups, contexts, config }, null, 2);
  },
  
  importData: (dataString) => {
    try {
      const data = JSON.parse(dataString);
      set({
        shortcuts: data.shortcuts || {},
        groups: data.groups || {},
        contexts: data.contexts || {},
        config: { ...defaultConfig, ...data.config }
      });
      get().updateStats();
    } catch (error) {
      console.error('Error importing data:', error);
    }
  },
  
  clearData: () => {
    set({
      shortcuts: {},
      groups: {},
      contexts: {},
      activeContext: null,
      currentSequence: null
    });
    get().updateStats();
  },
  
  resetSystem: () => {
    set({
      shortcuts: {},
      groups: {},
      contexts: {},
      activeContext: null,
      currentSequence: null,
      config: defaultConfig,
      isRecording: false,
      recordingShortcut: null
    });
    get().updateStats();
    get().updatePerformance();
  }
}));

// Utility functions
export const formatKeyEvent = (event: KeyboardEvent): string => {
  const parts: string[] = [];
  
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');
  
  const key = event.key;
  if (key !== 'Control' && key !== 'Alt' && key !== 'Shift' && key !== 'Meta') {
    parts.push(key);
  }
  
  return parts.join('+');
};

export const getKeyIcon = (key: string): string => {
  const iconMap: Record<string, string> = {
    'Ctrl': '⌃',
    'Alt': '⌥',
    'Shift': '⇧',
    'Meta': '⌘',
    'Enter': '↵',
    'Escape': '⎋',
    'Tab': '⇥',
    'Space': '␣',
    'Backspace': '⌫',
    'Delete': '⌦',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→'
  };
  
  return iconMap[key] || key;
};

export const getShortcutColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'navigation': 'blue',
    'editing': 'green',
    'file': 'purple',
    'view': 'orange',
    'tools': 'red',
    'help': 'gray',
    'custom': 'indigo'
  };
  
  return colorMap[category] || 'gray';
};

// Keyboard shortcut manager class
export class KeyboardShortcutManager {
  private store = useShortcutStore;
  private listeners: Map<string, (event: KeyboardEvent) => void> = new Map();
  private initialized = false;
  
  constructor() {
    this.init();
  }
  
  init() {
    if (this.initialized) return;
    
    // Global key listener
    const globalListener = (event: KeyboardEvent) => {
      this.store.getState().handleKeyDown(event);
    };
    
    document.addEventListener('keydown', globalListener);
    this.listeners.set('global', globalListener);
    
    // Context detection
    this.setupContextDetection();
    
    // Load default shortcuts
    this.loadDefaultShortcuts();
    
    this.initialized = true;
  }
  
  private setupContextDetection() {
    // Detect active context based on focused element
    const detectContext = () => {
      const activeElement = document.activeElement;
      const { contexts } = this.store.getState();
      
      let activeContext: string | null = null;
      
      Object.values(contexts).forEach(context => {
        if (context.active && context.element && context.element.contains(activeElement)) {
          if (!activeContext || context.priority > contexts[activeContext].priority) {
            activeContext = context.id;
          }
        }
        
        if (context.active && context.selector && activeElement?.matches(context.selector)) {
          if (!activeContext || context.priority > contexts[activeContext].priority) {
            activeContext = context.id;
          }
        }
      });
      
      this.store.getState().setActiveContext(activeContext);
    };
    
    document.addEventListener('focusin', detectContext);
    document.addEventListener('focusout', detectContext);
    
    this.listeners.set('focusin', detectContext as any);
    this.listeners.set('focusout', detectContext as any);
  }
  
  private loadDefaultShortcuts() {
    const { addShortcut, addGroup, addContext } = this.store.getState();
    
    // Navigation shortcuts
    addShortcut({
      name: 'Ir para Home',
      description: 'Navegar para a página inicial',
      keys: ['Ctrl+h'],
      category: 'navigation',
      action: () => window.location.href = '/',
      enabled: true,
      global: true,
      preventDefault: true,
      stopPropagation: true,
      priority: 1,
      customizable: true,
      tags: ['navigation', 'home'],
      usageCount: 0
    });
    
    addShortcut({
      name: 'Voltar',
      description: 'Voltar para a página anterior',
      keys: ['Alt+ArrowLeft'],
      category: 'navigation',
      action: () => window.history.back(),
      enabled: true,
      global: true,
      preventDefault: true,
      stopPropagation: true,
      priority: 1,
      customizable: true,
      tags: ['navigation', 'back'],
      usageCount: 0
    });
    
    // Editing shortcuts
    addShortcut({
      name: 'Salvar',
      description: 'Salvar o documento atual',
      keys: ['Ctrl+s'],
      category: 'editing',
      action: () => {
        const event = new CustomEvent('save-document');
        document.dispatchEvent(event);
      },
      enabled: true,
      global: true,
      preventDefault: true,
      stopPropagation: true,
      priority: 1,
      customizable: true,
      tags: ['editing', 'save'],
      usageCount: 0
    });
    
    // View shortcuts
    addShortcut({
      name: 'Alternar Tema',
      description: 'Alternar entre tema claro e escuro',
      keys: ['Ctrl+Shift+t'],
      category: 'view',
      action: () => {
        const event = new CustomEvent('toggle-theme');
        document.dispatchEvent(event);
      },
      enabled: true,
      global: true,
      preventDefault: true,
      stopPropagation: true,
      priority: 1,
      customizable: true,
      tags: ['view', 'theme'],
      usageCount: 0
    });
    
    // Help shortcuts
    addShortcut({
      name: 'Mostrar Ajuda',
      description: 'Mostrar painel de ajuda',
      keys: ['F1'],
      category: 'help',
      action: () => {
        const event = new CustomEvent('show-help');
        document.dispatchEvent(event);
      },
      enabled: true,
      global: true,
      preventDefault: true,
      stopPropagation: true,
      priority: 1,
      customizable: true,
      tags: ['help'],
      usageCount: 0
    });
    
    // Create default groups
    const navigationGroup = addGroup({
      name: 'Navegação',
      description: 'Atalhos para navegação',
      shortcuts: [],
      enabled: true,
      priority: 1,
      icon: 'navigation',
      color: 'blue'
    });
    
    const editingGroup = addGroup({
      name: 'Edição',
      description: 'Atalhos para edição',
      shortcuts: [],
      enabled: true,
      priority: 1,
      icon: 'edit',
      color: 'green'
    });
    
    // Create default contexts
    addContext({
      name: 'Editor',
      description: 'Contexto do editor de código',
      selector: '.editor, .code-editor, textarea, input[type="text"]',
      active: true,
      priority: 1,
      shortcuts: []
    });
    
    addContext({
      name: 'Global',
      description: 'Contexto global da aplicação',
      active: true,
      priority: 0,
      shortcuts: []
    });
  }
  
  destroy() {
    this.listeners.forEach((listener, event) => {
      document.removeEventListener(event, listener);
    });
    
    this.listeners.clear();
    this.initialized = false;
  }
}

// Global instance
export const shortcutManager = new KeyboardShortcutManager();

// React hook
export const useKeyboardShortcuts = () => {
  const store = useShortcutStore();
  
  return {
    ...store,
    manager: shortcutManager
  };
};