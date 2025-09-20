import { create } from 'zustand';

// Types
export interface VirtualNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children: VirtualNode[];
  key?: string;
  parent?: VirtualNode;
  renderCount: number;
  memoized: boolean;
  lastRender: number;
}

export interface VirtualTree {
  id: string;
  root: VirtualNode;
  nodes: Map<string, VirtualNode>;
  nodeCount: number;
  depth: number;
  lastUpdate: number;
}

export interface VirtualPatch {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  nodeId: string;
  props?: Record<string, any>;
  oldProps?: Record<string, any>;
  newNode?: VirtualNode;
  oldNode?: VirtualNode;
  position?: number;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  batchId?: string;
}

export interface RenderOptimization {
  id: string;
  type: 'memoization' | 'batching' | 'lazy' | 'virtualization' | 'reconciliation';
  nodeId: string;
  description: string;
  impact: number;
  savings: number;
  enabled: boolean;
  config: Record<string, any>;
  performance: {
    renderTime: number;
    memoryUsage: number;
    updateCount: number;
    skipCount: number;
  };
}

export interface VirtualDOMConfig {
  enableMemoization: boolean;
  enableBatching: boolean;
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  memoizationThreshold: number;
  batchingThreshold: number;
  virtualizationThreshold: number;
  debugMode: boolean;
  maxTreeDepth: number;
  maxNodeCount: number;
}

export interface VirtualDOMStats {
  totalNodes: number;
  activeNodes: number;
  memoizedNodes: number;
  virtualizedNodes: number;
  totalRenders: number;
  skippedRenders: number;
  averageRenderTime: number;
  memoryUsage: number;
  optimizationSavings: number;
  lastUpdate: number;
}

export interface VirtualDOMMetrics {
  timestamp: number;
  renderTime: number;
  nodeCount: number;
  patchCount: number;
  memoryUsage: number;
  cpuUsage: number;
  optimizationRatio: number;
  performanceScore: number;
}

export interface VirtualDOMEvent {
  id: string;
  type: string;
  nodeId: string;
  data: any;
  timestamp: number;
}

export interface VirtualDOMDebugLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  timestamp: number;
}

// Default configurations
const defaultConfig: VirtualDOMConfig = {
  enableMemoization: true,
  enableBatching: true,
  enableVirtualization: false,
  enableLazyLoading: false,
  memoizationThreshold: 10,
  batchingThreshold: 5,
  virtualizationThreshold: 100,
  debugMode: false,
  maxTreeDepth: 50,
  maxNodeCount: 10000
};

const defaultStats: VirtualDOMStats = {
  totalNodes: 0,
  activeNodes: 0,
  memoizedNodes: 0,
  virtualizedNodes: 0,
  totalRenders: 0,
  skippedRenders: 0,
  averageRenderTime: 0,
  memoryUsage: 0,
  optimizationSavings: 0,
  lastUpdate: Date.now()
};

// Store interface
interface VirtualDOMStore {
  // State
  trees: VirtualTree[];
  patches: VirtualPatch[];
  optimizations: RenderOptimization[];
  config: VirtualDOMConfig;
  stats: VirtualDOMStats;
  metrics: VirtualDOMMetrics[];
  events: VirtualDOMEvent[];
  debugLogs: VirtualDOMDebugLog[];
  isRendering: boolean;
  isOptimizing: boolean;
  isInitialized: boolean;
  lastUpdated: number;

  // Computed values
  computed: {
    totalTrees: number;
    totalNodes: number;
    optimizationCount: number;
    renderPerformance: number;
    memoryEfficiency: number;
  };

  // Actions
  actions: {
    createTree: (rootNode: VirtualNode) => string;
    deleteTree: (treeId: string) => void;
    updateTree: (treeId: string, patches: VirtualPatch[]) => void;
    createNode: (type: string, props: Record<string, any>, children: VirtualNode[]) => VirtualNode;
    updateNode: (nodeId: string, updates: Partial<VirtualNode>) => void;
    deleteNode: (nodeId: string) => void;
    cloneNode: (nodeId: string) => VirtualNode | null;
    findNode: (treeId: string, predicate: (node: VirtualNode) => boolean) => VirtualNode | null;
    traverseTree: (treeId: string, callback: (node: VirtualNode) => void) => void;
    diffTrees: (oldTree: VirtualTree, newTree: VirtualTree) => VirtualPatch[];
    applyPatches: (treeId: string, patches: VirtualPatch[]) => void;
    batchPatches: (patches: VirtualPatch[]) => void;
    optimizeTree: (treeId: string) => void;
    memoizeNode: (nodeId: string) => void;
    virtualizeNode: (nodeId: string) => void;
    reconcile: (treeId: string) => void;
  };

  // Utils
  utils: {
    generateId: () => string;
    getTreeDepth: (treeId: string) => number;
    getNodePath: (nodeId: string) => string[];
    serializeTree: (treeId: string) => string;
    deserializeTree: (data: string) => VirtualTree;
    compareNodes: (node1: VirtualNode, node2: VirtualNode) => boolean;
    optimizeProps: (props: Record<string, any>) => Record<string, any>;
  };

  // Configuration
  configuration: {
    updateConfig: (updates: Partial<VirtualDOMConfig>) => void;
    resetConfig: () => void;
    exportConfig: () => string;
    importConfig: (data: string) => void;
    getRecommendedSettings: () => Partial<VirtualDOMConfig>;
  };

  // Analytics
  analytics: {
    getMetrics: () => void;
    getStats: () => void;
    generateReport: () => any;
    exportData: () => string;
    getPerformanceInsights: () => any[];
  };

  // Debug
  debug: {
    enableDebugMode: () => void;
    disableDebugMode: () => void;
    getDebugInfo: () => any;
    exportLogs: () => string;
    clearLogs: () => void;
  };

  // Quick Actions
  quickActions: {
    renderAll: () => void;
    optimizeAll: () => void;
    clearCache: () => void;
    enableMemoization: () => void;
    enableBatching: () => void;
    enableVirtualization: () => void;
    profileRender: (treeId: string) => Promise<VirtualDOMMetrics>;
  };

  // Advanced Features
  advanced: {
    enableTimeSlicing: () => void;
    enableConcurrentMode: () => void;
    enableSuspense: () => void;
    createPortal: (node: VirtualNode, container: any) => void;
    enableErrorBoundary: (nodeId: string) => void;
    setupLazyLoading: (nodeId: string, loader: () => Promise<any>) => void;
  };

  // System Operations
  system: {
    initialize: () => void;
    cleanup: () => void;
    reset: () => void;
    exportTree: (treeId: string) => string | null;
    importTree: (data: any) => string | null;
    benchmark: () => Promise<any>;
  };
}

// Create the store
export const useVirtualDOMStore = create<VirtualDOMStore>((set, get) => ({
  // Initial state
  trees: [],
  patches: [],
  optimizations: [],
  config: defaultConfig,
  stats: defaultStats,
  metrics: [],
  events: [],
  debugLogs: [],
  isRendering: false,
  isOptimizing: false,
  isInitialized: false,
  lastUpdated: Date.now(),

  // Computed values
  computed: {
    get totalTrees() { return get().trees.length; },
    get totalNodes() { return get().trees.reduce((sum, tree) => sum + tree.nodeCount, 0); },
    get optimizationCount() { return get().optimizations.length; },
    get renderPerformance() {
      const metrics = get().metrics.slice(-10);
      if (metrics.length === 0) return 100;
      const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
      return Math.max(0, 100 - avgRenderTime);
    },
    get memoryEfficiency() {
      const metrics = get().metrics.slice(-10);
      if (metrics.length === 0) return 100;
      const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
      return Math.max(0, 100 - avgMemoryUsage);
    }
  },

  // Actions
  actions: {
    createTree: (rootNode: VirtualNode) => {
      const treeId = get().utils.generateId();
      const nodes = new Map<string, VirtualNode>();
      
      const addNodeToMap = (node: VirtualNode) => {
        nodes.set(node.id, node);
        node.children.forEach(addNodeToMap);
      };
      
      addNodeToMap(rootNode);
      
      const tree: VirtualTree = {
        id: treeId,
        root: rootNode,
        nodes,
        nodeCount: nodes.size,
        depth: get().utils.getTreeDepth(treeId),
        lastUpdate: Date.now()
      };
      
      set(state => ({
        trees: [...state.trees, tree],
        lastUpdated: Date.now()
      }));
      
      return treeId;
    },

    deleteTree: (treeId: string) => {
      set(state => ({
        trees: state.trees.filter(tree => tree.id !== treeId),
        lastUpdated: Date.now()
      }));
    },

    updateTree: (treeId: string, patches: VirtualPatch[]) => {
      set(state => ({
        patches: [...state.patches, ...patches],
        lastUpdated: Date.now()
      }));
    },

    createNode: (type: string, props: Record<string, any>, children: VirtualNode[]) => {
      return {
        id: get().utils.generateId(),
        type,
        props: get().utils.optimizeProps(props),
        children,
        renderCount: 0,
        memoized: false,
        lastRender: Date.now()
      };
    },

    updateNode: (nodeId: string, updates: Partial<VirtualNode>) => {
      set(state => ({
        trees: state.trees.map(tree => ({
          ...tree,
          nodes: new Map(Array.from(tree.nodes.entries()).map(([id, node]) => 
            id === nodeId ? [id, { ...node, ...updates }] : [id, node]
          ))
        })),
        lastUpdated: Date.now()
      }));
    },

    deleteNode: (nodeId: string) => {
      set(state => ({
        trees: state.trees.map(tree => ({
          ...tree,
          nodes: new Map(Array.from(tree.nodes.entries()).filter(([id]) => id !== nodeId))
        })),
        lastUpdated: Date.now()
      }));
    },

    cloneNode: (nodeId: string) => {
      const state = get();
      for (const tree of state.trees) {
        const node = tree.nodes.get(nodeId);
        if (node) {
          return {
            ...node,
            id: state.utils.generateId(),
            children: node.children.map(child => state.actions.cloneNode(child.id) as VirtualNode)
          };
        }
      }
      return null;
    },

    findNode: (treeId: string, predicate: (node: VirtualNode) => boolean) => {
      const tree = get().trees.find(t => t.id === treeId);
      if (!tree || !tree.nodes) return null;
      return Array.from(tree.nodes.values()).find(predicate) || null;
    },

    traverseTree: (treeId: string, callback: (node: VirtualNode) => void) => {
      const tree = get().trees.find(t => t.id === treeId);
      if (!tree) return;

      const traverse = (node: VirtualNode) => {
        callback(node);
        node.children.forEach(traverse);
      };

      traverse(tree.root);
    },

    diffTrees: (oldTree: VirtualTree, newTree: VirtualTree) => {
      const patches: VirtualPatch[] = [];
      const patchId = get().utils.generateId();

      Array.from(newTree.nodes.entries()).forEach(([nodeId, newNode]) => {
        const oldNode = oldTree.nodes.get(nodeId);
        
        if (!oldNode) {
          patches.push({
            id: get().utils.generateId(),
            type: 'create',
            nodeId,
            newNode,
            timestamp: Date.now(),
            priority: 'medium',
            batchId: patchId
          });
        } else if (!get().utils.compareNodes(oldNode, newNode)) {
          patches.push({
            id: get().utils.generateId(),
            type: 'update',
            nodeId,
            props: newNode.props,
            oldProps: oldNode.props,
            timestamp: Date.now(),
            priority: 'medium',
            batchId: patchId
          });
        }
      });

      Array.from(oldTree.nodes.entries()).forEach(([nodeId, oldNode]) => {
        if (!newTree.nodes.has(nodeId)) {
          patches.push({
            id: get().utils.generateId(),
            type: 'delete',
            nodeId,
            oldNode,
            timestamp: Date.now(),
            priority: 'high',
            batchId: patchId
          });
        }
      });

      return patches;
    },

    applyPatches: (treeId: string, patches: VirtualPatch[]) => {
      get().actions.updateTree(treeId, patches);
    },

    batchPatches: (patches: VirtualPatch[]) => {
      const batchId = get().utils.generateId();
      const batchedPatches = patches.map(patch => ({ ...patch, batchId }));
      
      set(state => ({
        patches: [...state.patches, ...batchedPatches],
        lastUpdated: Date.now()
      }));
    },

    optimizeTree: (treeId: string) => {
      const tree = get().trees.find(t => t.id === treeId);
      if (!tree) return;

      set(state => ({ isOptimizing: true }));

      const optimizations: RenderOptimization[] = [];
      
      Array.from(tree.nodes.values()).forEach(node => {
        if (node.renderCount > get().config.memoizationThreshold && !node.memoized) {
          optimizations.push({
            id: get().utils.generateId(),
            type: 'memoization',
            nodeId: node.id,
            description: `Memoize frequently rendered node (${node.renderCount} renders)`,
            impact: 0.8,
            savings: node.renderCount * 0.1,
            enabled: true,
            config: { threshold: get().config.memoizationThreshold },
            performance: {
              renderTime: 0,
              memoryUsage: 0,
              updateCount: 0,
              skipCount: 0
            }
          });
        }

        if (node.children.length > get().config.virtualizationThreshold) {
          optimizations.push({
            id: get().utils.generateId(),
            type: 'virtualization',
            nodeId: node.id,
            description: `Virtualize large list (${node.children.length} items)`,
            impact: 0.9,
            savings: node.children.length * 0.05,
            enabled: true,
            config: { threshold: get().config.virtualizationThreshold },
            performance: {
              renderTime: 0,
              memoryUsage: 0,
              updateCount: 0,
              skipCount: 0
            }
          });
        }
      });

      set(state => ({
        optimizations: [...state.optimizations, ...optimizations],
        isOptimizing: false,
        lastUpdated: Date.now()
      }));
    },

    memoizeNode: (nodeId: string) => {
      get().actions.updateNode(nodeId, { memoized: true });
    },

    virtualizeNode: (nodeId: string) => {
    },

    reconcile: (treeId: string) => {
    }
  },

  // Utils
  utils: {
    generateId: () => {
      return Math.random().toString(36).substr(2, 9);
    },

    getTreeDepth: (treeId: string) => {
      const tree = get().trees.find(t => t.id === treeId);
      if (!tree) return 0;

      const calculateDepth = (node: VirtualNode): number => {
        if (node.children.length === 0) return 1;
        return 1 + Math.max(...node.children.map(calculateDepth));
      };

      return calculateDepth(tree.root);
    },

    getNodePath: (nodeId: string) => {
      const path: string[] = [];
      const state = get();
      
      for (const tree of state.trees) {
        const node = tree.nodes.get(nodeId);
        if (node) {
          let current = node;
          while (current) {
            path.unshift(current.id);
            current = current.parent;
          }
          break;
        }
      }
      
      return path;
    },

    serializeTree: (treeId: string) => {
      const tree = get().trees.find(t => t.id === treeId);
      return tree ? JSON.stringify(tree) : '';
    },

    deserializeTree: (data: string) => {
      try {
        return JSON.parse(data) as VirtualTree;
      } catch (error) {
        throw new Error('Invalid tree data');
      }
    },

    compareNodes: (node1: VirtualNode, node2: VirtualNode) => {
      if (node1.type !== node2.type) return false;
      if (node1.key !== node2.key) return false;
      
      const props1Keys = Object.keys(node1.props);
      const props2Keys = Object.keys(node2.props);
      
      if (props1Keys.length !== props2Keys.length) return false;
      
      for (const key of props1Keys) {
        if (node1.props[key] !== node2.props[key]) return false;
      }
      
      return true;
    },

    optimizeProps: (props: Record<string, any>) => {
      const optimized: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(props)) {
        if (value !== undefined && value !== null) {
          optimized[key] = value;
        }
      }
      
      return optimized;
    }
  },

  // Configuration
  configuration: {
    updateConfig: (updates: Partial<VirtualDOMConfig>) => {
      set(state => ({
        config: { ...state.config, ...updates },
        lastUpdated: Date.now()
      }));
    },

    resetConfig: () => {
      set(state => ({
        config: defaultConfig,
        lastUpdated: Date.now()
      }));
    },

    exportConfig: () => {
      return JSON.stringify(get().config);
    },

    importConfig: (data: string) => {
      try {
        const config = JSON.parse(data);
        get().configuration.updateConfig(config);
      } catch (error) {
        console.error('Failed to import config:', error);
      }
    },

    getRecommendedSettings: () => {
      const stats = get().stats;
      const recommendations: Partial<VirtualDOMConfig> = {};
      
      if (stats.totalNodes > 1000) {
        recommendations.enableVirtualization = true;
        recommendations.virtualizationThreshold = 500;
      }
      
      if (stats.averageRenderTime > 16) {
        recommendations.enableMemoization = true;
        recommendations.memoizationThreshold = 50;
      }
      
      return recommendations;
    }
  },

  // Analytics
  analytics: {
    getMetrics: () => {
      const currentMetrics: VirtualDOMMetrics = {
        timestamp: Date.now(),
        renderTime: Math.random() * 20,
        nodeCount: get().stats.totalNodes,
        patchCount: get().patches.length,
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 50,
        optimizationRatio: get().computed.memoryEfficiency,
        performanceScore: get().computed.renderPerformance
      };
      
      set(state => ({
        metrics: [...state.metrics, currentMetrics].slice(-100),
        lastUpdated: Date.now()
      }));
    },

    getStats: () => {
      const trees = get().trees;
      const optimizations = get().optimizations;
      
      const stats: VirtualDOMStats = {
        totalNodes: trees.reduce((sum, tree) => sum + tree.nodeCount, 0),
        activeNodes: trees.reduce((sum, tree) => sum + Array.from(tree.nodes.values()).filter(n => !n.memoized).length, 0),
        memoizedNodes: trees.reduce((sum, tree) => sum + Array.from(tree.nodes.values()).filter(n => n.memoized).length, 0),
        virtualizedNodes: optimizations.filter(o => o.type === 'virtualization' && o.enabled).length,
        totalRenders: trees.reduce((sum, tree) => sum + Array.from(tree.nodes.values()).reduce((nodeSum, node) => nodeSum + node.renderCount, 0), 0),
        skippedRenders: optimizations.reduce((sum, opt) => sum + opt.performance.skipCount, 0),
        averageRenderTime: get().metrics.length > 0 ? get().metrics.reduce((sum, m) => sum + m.renderTime, 0) / get().metrics.length : 0,
        memoryUsage: get().metrics.length > 0 ? get().metrics[get().metrics.length - 1].memoryUsage : 0,
        optimizationSavings: optimizations.reduce((sum, opt) => sum + opt.savings, 0),
        lastUpdate: Date.now()
      };
      
      set(state => ({
        stats,
        lastUpdated: Date.now()
      }));
    },

    generateReport: () => {
      const state = get();
      return {
        summary: {
          totalTrees: state.computed.totalTrees,
          totalNodes: state.stats.totalNodes,
          optimizations: state.computed.optimizationCount,
          performance: state.computed.renderPerformance
        },
        performance: {
          averageRenderTime: state.stats.averageRenderTime,
          memoryUsage: state.stats.memoryUsage,
          optimizationSavings: state.stats.optimizationSavings
        },
        recommendations: state.configuration.getRecommendedSettings()
      };
    },

    exportData: () => {
      const state = get();
      return JSON.stringify({
        stats: state.stats,
        metrics: state.metrics,
        config: state.config
      });
    },

    getPerformanceInsights: () => {
      const metrics = get().metrics.slice(-20);
      const insights = [];
      
      if (metrics.length > 0) {
        const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
        if (avgRenderTime > 16) {
          insights.push({
            type: 'warning',
            message: 'Average render time exceeds 16ms',
            recommendation: 'Consider enabling memoization or virtualization'
          });
        }
        
        const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
        if (avgMemoryUsage > 80) {
          insights.push({
            type: 'error',
            message: 'High memory usage detected',
            recommendation: 'Enable tree cleanup and optimize node structure'
          });
        }
      }
      
      return insights;
    }
  },

  // Debug
  debug: {
    enableDebugMode: () => {
      get().configuration.updateConfig({ debugMode: true });
    },

    disableDebugMode: () => {
      get().configuration.updateConfig({ debugMode: false });
    },

    getDebugInfo: () => {
      const state = get();
      return {
        trees: state.trees.length,
        nodes: state.stats.totalNodes,
        patches: state.patches.length,
        optimizations: state.optimizations.length,
        isRendering: state.isRendering,
        isOptimizing: state.isOptimizing,
        config: state.config
      };
    },

    exportLogs: () => {
      return JSON.stringify(get().debugLogs);
    },

    clearLogs: () => {
      set(state => ({
        debugLogs: [],
        lastUpdated: Date.now()
      }));
    }
  },

  // Quick Actions
  quickActions: {
    renderAll: () => {
      set(state => ({ isRendering: true }));
      
      setTimeout(() => {
        set(state => ({ 
          isRendering: false,
          stats: {
            ...state.stats,
            totalRenders: state.stats.totalRenders + state.trees.length,
            lastUpdate: Date.now()
          }
        }));
      }, 100);
    },

    optimizeAll: () => {
      const trees = get().trees;
      trees.forEach(tree => {
        get().actions.optimizeTree(tree.id);
      });
    },

    clearCache: () => {
      set(state => ({
        patches: [],
        events: [],
        debugLogs: [],
        lastUpdated: Date.now()
      }));
    },

    enableMemoization: () => {
      get().configuration.updateConfig({ enableMemoization: true });
    },

    enableBatching: () => {
      get().configuration.updateConfig({ enableBatching: true });
    },

    enableVirtualization: () => {
      get().configuration.updateConfig({ enableVirtualization: true });
    },

    profileRender: async (treeId: string) => {
      const startTime = performance.now();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      const metrics: VirtualDOMMetrics = {
        timestamp: Date.now(),
        renderTime,
        nodeCount: get().trees.find(t => t.id === treeId)?.nodeCount || 0,
        patchCount: get().patches.length,
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 50,
        optimizationRatio: Math.random() * 100,
        performanceScore: Math.max(0, 100 - renderTime)
      };
      
      set(state => ({
        metrics: [...state.metrics, metrics].slice(-100),
        lastUpdated: Date.now()
      }));
      
      return metrics;
    }
  },

  // Advanced Features
  advanced: {
    enableTimeSlicing: () => {
    },

    enableConcurrentMode: () => {
    },

    enableSuspense: () => {
    },

    createPortal: (node: VirtualNode, container: any) => {
    },

    enableErrorBoundary: (nodeId: string) => {
    },

    setupLazyLoading: (nodeId: string, loader: () => Promise<any>) => {
    }
  },

  // System Operations
  system: {
    initialize: () => {
      set(state => ({
        isInitialized: true,
        lastUpdated: Date.now()
      }));
    },

    cleanup: () => {
      set(state => ({
        trees: [],
        patches: [],
        optimizations: [],
        events: [],
        debugLogs: [],
        lastUpdated: Date.now()
      }));
    },

    reset: () => {
      set(state => ({
        trees: [],
        patches: [],
        optimizations: [],
        config: defaultConfig,
        stats: defaultStats,
        metrics: [],
        events: [],
        debugLogs: [],
        isRendering: false,
        isOptimizing: false,
        lastUpdated: Date.now()
      }));
    },

    exportTree: (treeId: string) => {
      const tree = get().trees.find(t => t.id === treeId);
      return tree ? JSON.stringify(tree) : null;
    },

    importTree: (data: any) => {
      try {
        const tree = JSON.parse(data);
        set(state => ({
          trees: [...state.trees, tree],
          lastUpdated: Date.now()
        }));
        return tree.id;
      } catch (error) {
        console.error('Failed to import tree:', error);
        return null;
      }
    },

    benchmark: async () => {
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const node = get().actions.createNode('div', { key: i }, []);
        const treeId = get().actions.createTree(node);
        get().actions.deleteTree(treeId);
      }
      
      const endTime = performance.now();
      return {
        iterations,
        totalTime: endTime - startTime,
        averageTime: (endTime - startTime) / iterations
      };
    }
  }
}));

// Virtual DOM Manager Class
export class VirtualDOMManager {
  private static instance: VirtualDOMManager;
  
  static getInstance(): VirtualDOMManager {
    if (!VirtualDOMManager.instance) {
      VirtualDOMManager.instance = new VirtualDOMManager();
    }
    return VirtualDOMManager.instance;
  }
  
  private constructor() {
    useVirtualDOMStore.getState().system.initialize();
  }
  
  createTree(rootNode: VirtualNode): string {
    return useVirtualDOMStore.getState().actions.createTree(rootNode);
  }
  
  updateTree(treeId: string, patches: VirtualPatch[]): void {
    useVirtualDOMStore.getState().actions.updateTree(treeId, patches);
  }
  
  optimizeTree(treeId: string): void {
    useVirtualDOMStore.getState().actions.optimizeTree(treeId);
  }
  
  getStats(): VirtualDOMStats {
    return useVirtualDOMStore.getState().stats;
  }
  
  getMetrics(): VirtualDOMMetrics[] {
    return useVirtualDOMStore.getState().metrics;
  }
}

// Global instance
export const virtualDOMManager = VirtualDOMManager.getInstance();

// Utility functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const getOptimizationTypeColor = (type: string): string => {
  switch (type) {
    case 'memoization': return 'text-blue-500';
    case 'batching': return 'text-green-500';
    case 'lazy': return 'text-yellow-500';
    case 'virtualization': return 'text-purple-500';
    case 'reconciliation': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

export const getPerformanceScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
};

export const getNodeTypeIcon = (type: string): string => {
  switch (type) {
    case 'div': return '📦';
    case 'span': return '📝';
    case 'img': return '🖼️';
    case 'button': return '🔘';
    case 'input': return '📝';
    case 'component': return '⚛️';
    default: return '🔧';
  }
};