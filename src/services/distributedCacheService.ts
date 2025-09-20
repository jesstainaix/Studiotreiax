import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface CacheEntry {
  id: string;
  key: string;
  value: any;
  size: number;
  ttl: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  compressed: boolean;
  encrypted: boolean;
  metadata: {
    source: string;
    version: string;
    checksum: string;
    dependencies: string[];
  };
}

export interface CacheNode {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  status: 'online' | 'offline' | 'syncing' | 'error';
  capacity: number;
  used: number;
  latency: number;
  load: number;
  lastSync: Date;
  health: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  metrics: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    throughput: number;
  };
}

export interface CacheStrategy {
  id: string;
  name: string;
  type: 'lru' | 'lfu' | 'fifo' | 'ttl' | 'adaptive';
  maxSize: number;
  maxEntries: number;
  ttlDefault: number;
  compressionThreshold: number;
  encryptionEnabled: boolean;
  replicationFactor: number;
  consistencyLevel: 'eventual' | 'strong' | 'weak';
  evictionPolicy: {
    algorithm: string;
    threshold: number;
    batchSize: number;
  };
}

export interface CacheOperation {
  id: string;
  type: 'get' | 'set' | 'delete' | 'invalidate' | 'sync';
  key: string;
  nodeId: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  size?: number;
  error?: string;
  metadata: {
    hitType: 'hit' | 'miss' | 'stale';
    source: 'local' | 'remote' | 'origin';
    compressed: boolean;
    encrypted: boolean;
  };
}

export interface CacheConfig {
  global: {
    enabled: boolean;
    defaultTtl: number;
    maxMemory: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    monitoringEnabled: boolean;
  };
  replication: {
    enabled: boolean;
    factor: number;
    strategy: 'sync' | 'async' | 'hybrid';
    conflictResolution: 'timestamp' | 'version' | 'manual';
  };
  invalidation: {
    enabled: boolean;
    strategy: 'immediate' | 'lazy' | 'scheduled';
    batchSize: number;
    interval: number;
  };
  optimization: {
    autoEviction: boolean;
    prefetching: boolean;
    compression: boolean;
    deduplication: boolean;
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  compressionRatio: number;
  memoryUsage: number;
  networkTraffic: number;
  operationsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  isHealthy: boolean;
  systemHealth: number;
  recommendations: string[];
}

export interface CacheMetrics {
  performance: {
    throughput: number;
    latency: number;
    errorRate: number;
    availability: number;
  };
  storage: {
    utilization: number;
    fragmentation: number;
    compressionRatio: number;
    growthRate: number;
  };
  network: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
    connections: number;
  };
  efficiency: {
    hitRatio: number;
    evictionRatio: number;
    replicationEfficiency: number;
    costPerOperation: number;
  };
}

// Utility Functions
export const formatCacheSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatCacheTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

export const getCacheStatusColor = (status: string): string => {
  switch (status) {
    case 'online': return 'text-green-600';
    case 'offline': return 'text-red-600';
    case 'syncing': return 'text-blue-600';
    case 'error': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getCachePriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const getCacheTypeIcon = (type: string): string => {
  switch (type) {
    case 'lru': return '🔄';
    case 'lfu': return '📊';
    case 'fifo': return '➡️';
    case 'ttl': return '⏰';
    case 'adaptive': return '🧠';
    default: return '💾';
  }
};

export const calculateCacheHealth = (stats: CacheStats): number => {
  const hitRateScore = Math.min(stats.hitRate * 100, 100);
  const memoryScore = Math.max(100 - stats.memoryUsage, 0);
  const errorScore = Math.max(100 - (stats.errorRate * 100), 0);
  const latencyScore = Math.max(100 - (stats.averageLatency / 10), 0);
  
  return (hitRateScore * 0.3 + memoryScore * 0.25 + errorScore * 0.25 + latencyScore * 0.2);
};

export const generateCacheRecommendations = (stats: CacheStats, config: CacheConfig): string[] => {
  const recommendations: string[] = [];
  
  if (stats.hitRate < 0.8) {
    recommendations.push('Consider increasing cache size or adjusting TTL values');
  }
  
  if (stats.memoryUsage > 0.9) {
    recommendations.push('Memory usage is high, enable compression or increase eviction');
  }
  
  if (stats.errorRate > 0.05) {
    recommendations.push('High error rate detected, check node health and network connectivity');
  }
  
  if (stats.averageLatency > 100) {
    recommendations.push('High latency detected, consider adding more cache nodes or optimizing network');
  }
  
  if (stats.evictionRate > 0.3) {
    recommendations.push('High eviction rate, consider increasing cache capacity');
  }
  
  return recommendations;
};

// Store Interface
interface DistributedCacheStore {
  // State
  entries: CacheEntry[];
  nodes: CacheNode[];
  strategies: CacheStrategy[];
  operations: CacheOperation[];
  config: CacheConfig;
  stats: CacheStats;
  metrics: CacheMetrics;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedEntryId: string | null;
  selectedNodeId: string | null;
  selectedStrategyId: string | null;
  
  // Computed State
  computed: {
    totalEntries: number;
    totalNodes: number;
    activeNodes: number;
    totalSize: number;
    averageLatency: number;
    systemLoad: number;
    recentOperations: CacheOperation[];
    topEntries: CacheEntry[];
    healthyNodes: CacheNode[];
    criticalEntries: CacheEntry[];
  };
  
  // Filtered State
  filtered: {
    entries: CacheEntry[];
    nodes: CacheNode[];
    operations: CacheOperation[];
  };
  
  // Actions
  actions: {
    // Entry Management
    createEntry: (entry: Omit<CacheEntry, 'id' | 'createdAt' | 'lastAccessed' | 'accessCount'>) => Promise<void>;
    updateEntry: (id: string, updates: Partial<CacheEntry>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    getEntry: (key: string) => Promise<CacheEntry | null>;
    setEntry: (key: string, value: any, options?: Partial<CacheEntry>) => Promise<void>;
    invalidateEntry: (key: string) => Promise<void>;
    invalidateByTag: (tag: string) => Promise<void>;
    
    // Node Management
    addNode: (node: Omit<CacheNode, 'id' | 'lastSync'>) => Promise<void>;
    updateNode: (id: string, updates: Partial<CacheNode>) => Promise<void>;
    removeNode: (id: string) => Promise<void>;
    syncNode: (id: string) => Promise<void>;
    syncAllNodes: () => Promise<void>;
    
    // Strategy Management
    createStrategy: (strategy: Omit<CacheStrategy, 'id'>) => Promise<void>;
    updateStrategy: (id: string, updates: Partial<CacheStrategy>) => Promise<void>;
    deleteStrategy: (id: string) => Promise<void>;
    applyStrategy: (id: string) => Promise<void>;
    
    // Cache Operations
    get: (key: string, options?: { nodeId?: string; consistency?: string }) => Promise<any>;
    set: (key: string, value: any, options?: { ttl?: number; tags?: string[]; priority?: string }) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: (pattern?: string) => Promise<void>;
    exists: (key: string) => Promise<boolean>;
    
    // Optimization
    optimize: () => Promise<void>;
    compress: (entryId: string) => Promise<void>;
    decompress: (entryId: string) => Promise<void>;
    evict: (strategy?: string) => Promise<void>;
    prefetch: (keys: string[]) => Promise<void>;
    
    // Configuration
    updateConfig: (updates: Partial<CacheConfig>) => Promise<void>;
    resetConfig: () => Promise<void>;
    exportConfig: () => string;
    importConfig: (config: string) => Promise<void>;
    
    // Analytics
    refreshStats: () => Promise<void>;
    refreshMetrics: () => Promise<void>;
    generateReport: () => Promise<string>;
    
    // System
    refresh: () => Promise<void>;
    reset: () => Promise<void>;
    backup: () => Promise<string>;
    restore: (backup: string) => Promise<void>;
  };
  
  // Setters
  setSelectedEntry: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedStrategy: (id: string | null) => void;
  setError: (error: string | null) => void;
}

// Create Store
export const useDistributedCacheStore = create<DistributedCacheStore>()
  subscribeWithSelector((set, get) => ({
    // Initial State
    entries: [],
    nodes: [],
    strategies: [],
    operations: [],
    config: {
      global: {
        enabled: true,
        defaultTtl: 3600000, // 1 hour
        maxMemory: 1073741824, // 1GB
        compressionEnabled: true,
        encryptionEnabled: false,
        monitoringEnabled: true
      },
      replication: {
        enabled: true,
        factor: 2,
        strategy: 'async',
        conflictResolution: 'timestamp'
      },
      invalidation: {
        enabled: true,
        strategy: 'immediate',
        batchSize: 100,
        interval: 60000
      },
      optimization: {
        autoEviction: true,
        prefetching: true,
        compression: true,
        deduplication: true
      }
    },
    stats: {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0.85,
      missRate: 0.15,
      evictionRate: 0.05,
      compressionRatio: 0.7,
      memoryUsage: 0.6,
      networkTraffic: 0,
      operationsPerSecond: 1000,
      averageLatency: 25,
      errorRate: 0.01,
      isHealthy: true,
      systemHealth: 95,
      recommendations: []
    },
    metrics: {
      performance: {
        throughput: 1000,
        latency: 25,
        errorRate: 0.01,
        availability: 0.999
      },
      storage: {
        utilization: 0.6,
        fragmentation: 0.1,
        compressionRatio: 0.7,
        growthRate: 0.05
      },
      network: {
        bandwidth: 1000000000, // 1Gbps
        latency: 10,
        packetLoss: 0.001,
        connections: 100
      },
      efficiency: {
        hitRatio: 0.85,
        evictionRatio: 0.05,
        replicationEfficiency: 0.95,
        costPerOperation: 0.001
      }
    },
    
    // UI State
    isLoading: false,
    error: null,
    selectedEntryId: null,
    selectedNodeId: null,
    selectedStrategyId: null,
    
    // Computed State
    computed: {
      totalEntries: 0,
      totalNodes: 0,
      activeNodes: 0,
      totalSize: 0,
      averageLatency: 0,
      systemLoad: 0,
      recentOperations: [],
      topEntries: [],
      healthyNodes: [],
      criticalEntries: []
    },
    
    // Filtered State
    filtered: {
      entries: [],
      nodes: [],
      operations: []
    },
    
    // Actions
    actions: {
      // Entry Management
      createEntry: async (entryData) => {
        set({ isLoading: true, error: null });
        
        try {
          const entry: CacheEntry = {
            ...entryData,
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            lastAccessed: new Date(),
            accessCount: 0
          };
          
          set(state => ({
            entries: [...state.entries, entry],
            isLoading: false
          }));
          
          // Update computed state
          get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to create cache entry', isLoading: false });
        }
      },
      
      updateEntry: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            entries: state.entries.map(entry => 
              entry.id === id ? { ...entry, ...updates } : entry
            ),
            isLoading: false
          }));
          
          get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to update cache entry', isLoading: false });
        }
      },
      
      deleteEntry: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            entries: state.entries.filter(entry => entry.id !== id),
            isLoading: false
          }));
          
          get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to delete cache entry', isLoading: false });
        }
      },
      
      getEntry: async (key) => {
        const { entries } = get();
        const entry = entries.find(e => e.key === key);
        
        if (entry) {
          // Update access statistics
          get().actions.updateEntry(entry.id, {
            lastAccessed: new Date(),
            accessCount: entry.accessCount + 1
          });
        }
        
        return entry || null;
      },
      
      setEntry: async (key, value, options = {}) => {
        const existingEntry = await get().actions.getEntry(key);
        
        if (existingEntry) {
          await get().actions.updateEntry(existingEntry.id, {
            value,
            ...options,
            lastAccessed: new Date()
          });
        } else {
          await get().actions.createEntry({
            key,
            value,
            size: JSON.stringify(value).length,
            ttl: options.ttl || get().config.global.defaultTtl,
            tags: options.tags || [],
            priority: (options.priority as any) || 'medium',
            compressed: false,
            encrypted: false,
            metadata: {
              source: 'manual',
              version: '1.0.0',
              checksum: '',
              dependencies: []
            }
          });
        }
      },
      
      invalidateEntry: async (key) => {
        const entry = await get().actions.getEntry(key);
        if (entry) {
          await get().actions.deleteEntry(entry.id);
        }
      },
      
      invalidateByTag: async (tag) => {
        const { entries } = get();
        const entriesToInvalidate = entries.filter(entry => entry.tags.includes(tag));
        
        for (const entry of entriesToInvalidate) {
          await get().actions.deleteEntry(entry.id);
        }
      },
      
      // Node Management
      addNode: async (nodeData) => {
        set({ isLoading: true, error: null });
        
        try {
          const node: CacheNode = {
            ...nodeData,
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lastSync: new Date()
          };
          
          set(state => ({
            nodes: [...state.nodes, node],
            isLoading: false
          }));
          
          get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to add cache node', isLoading: false });
        }
      },
      
      updateNode: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            nodes: state.nodes.map(node => 
              node.id === id ? { ...node, ...updates } : node
            ),
            isLoading: false
          }));
          
          get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to update cache node', isLoading: false });
        }
      },
      
      removeNode: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            nodes: state.nodes.filter(node => node.id !== id),
            isLoading: false
          }));
          
          get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to remove cache node', isLoading: false });
        }
      },
      
      syncNode: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          await get().actions.updateNode(id, {
            status: 'syncing',
            lastSync: new Date()
          });
          
          // Simulate sync operation
          setTimeout(async () => {
            await get().actions.updateNode(id, {
              status: 'online'
            });
          }, 2000);
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to sync cache node', isLoading: false });
        }
      },
      
      syncAllNodes: async () => {
        const { nodes } = get();
        
        for (const node of nodes) {
          if (node.status === 'online') {
            await get().actions.syncNode(node.id);
          }
        }
      },
      
      // Strategy Management
      createStrategy: async (strategyData) => {
        set({ isLoading: true, error: null });
        
        try {
          const strategy: CacheStrategy = {
            ...strategyData,
            id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          
          set(state => ({
            strategies: [...state.strategies, strategy],
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to create cache strategy', isLoading: false });
        }
      },
      
      updateStrategy: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            strategies: state.strategies.map(strategy => 
              strategy.id === id ? { ...strategy, ...updates } : strategy
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to update cache strategy', isLoading: false });
        }
      },
      
      deleteStrategy: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          set(state => ({
            strategies: state.strategies.filter(strategy => strategy.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete cache strategy', isLoading: false });
        }
      },
      
      applyStrategy: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const { strategies } = get();
          const strategy = strategies.find(s => s.id === id);
          
          if (strategy) {
            // Apply strategy logic here
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to apply cache strategy', isLoading: false });
        }
      },
      
      // Cache Operations
      get: async (key, options = {}) => {
        const entry = await get().actions.getEntry(key);
        
        // Record operation
        const operation: CacheOperation = {
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'get',
          key,
          nodeId: options.nodeId || 'local',
          timestamp: new Date(),
          duration: Math.random() * 50 + 10,
          success: !!entry,
          size: entry?.size,
          metadata: {
            hitType: entry ? 'hit' : 'miss',
            source: 'local',
            compressed: entry?.compressed || false,
            encrypted: entry?.encrypted || false
          }
        };
        
        set(state => ({
          operations: [operation, ...state.operations.slice(0, 999)]
        }));
        
        return entry?.value || null;
      },
      
      set: async (key, value, options = {}) => {
        await get().actions.setEntry(key, value, options);
        
        // Record operation
        const operation: CacheOperation = {
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'set',
          key,
          nodeId: 'local',
          timestamp: new Date(),
          duration: Math.random() * 30 + 5,
          success: true,
          size: JSON.stringify(value).length,
          metadata: {
            hitType: 'miss',
            source: 'local',
            compressed: false,
            encrypted: false
          }
        };
        
        set(state => ({
          operations: [operation, ...state.operations.slice(0, 999)]
        }));
      },
      
      delete: async (key) => {
        await get().actions.invalidateEntry(key);
        
        // Record operation
        const operation: CacheOperation = {
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'delete',
          key,
          nodeId: 'local',
          timestamp: new Date(),
          duration: Math.random() * 20 + 5,
          success: true,
          metadata: {
            hitType: 'hit',
            source: 'local',
            compressed: false,
            encrypted: false
          }
        };
        
        set(state => ({
          operations: [operation, ...state.operations.slice(0, 999)]
        }));
      },
      
      clear: async (pattern) => {
        const { entries } = get();
        
        if (pattern) {
          const regex = new RegExp(pattern);
          const entriesToDelete = entries.filter(entry => regex.test(entry.key));
          
          for (const entry of entriesToDelete) {
            await get().actions.deleteEntry(entry.id);
          }
        } else {
          set({ entries: [] });
        }
      },
      
      exists: async (key) => {
        const entry = await get().actions.getEntry(key);
        return !!entry;
      },
      
      // Optimization
      optimize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate optimization
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          set({ isLoading: false });
          get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to optimize cache', isLoading: false });
        }
      },
      
      compress: async (entryId) => {
        await get().actions.updateEntry(entryId, { compressed: true });
      },
      
      decompress: async (entryId) => {
        await get().actions.updateEntry(entryId, { compressed: false });
      },
      
      evict: async (strategy = 'lru') => {
        const { entries } = get();
        
        if (entries.length === 0) return;
        
        let entryToEvict: CacheEntry;
        
        switch (strategy) {
          case 'lru':
            entryToEvict = entries.reduce((oldest, entry) => 
              entry.lastAccessed < oldest.lastAccessed ? entry : oldest
            );
            break;
          case 'lfu':
            entryToEvict = entries.reduce((least, entry) => 
              entry.accessCount < least.accessCount ? entry : least
            );
            break;
          default:
            entryToEvict = entries[0];
        }
        
        await get().actions.deleteEntry(entryToEvict.id);
      },
      
      prefetch: async (keys) => {
        for (const key of keys) {
          // Simulate prefetch
        }
      },
      
      // Configuration
      updateConfig: async (updates) => {
        set(state => ({
          config: {
            ...state.config,
            ...updates
          }
        }));
      },
      
      resetConfig: async () => {
        set(state => ({
          config: {
            global: {
              enabled: true,
              defaultTtl: 3600000,
              maxMemory: 1073741824,
              compressionEnabled: true,
              encryptionEnabled: false,
              monitoringEnabled: true
            },
            replication: {
              enabled: true,
              factor: 2,
              strategy: 'async',
              conflictResolution: 'timestamp'
            },
            invalidation: {
              enabled: true,
              strategy: 'immediate',
              batchSize: 100,
              interval: 60000
            },
            optimization: {
              autoEviction: true,
              prefetching: true,
              compression: true,
              deduplication: true
            }
          }
        }));
      },
      
      exportConfig: () => {
        const { config } = get();
        return JSON.stringify(config, null, 2);
      },
      
      importConfig: async (configStr) => {
        try {
          const config = JSON.parse(configStr);
          await get().actions.updateConfig(config);
        } catch (error) {
          set({ error: 'Failed to import configuration' });
        }
      },
      
      // Analytics
      refreshStats: async () => {
        const { entries, nodes, operations } = get();
        
        const totalEntries = entries.length;
        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
        const totalOperations = operations.length;
        const successfulOperations = operations.filter(op => op.success).length;
        const hitOperations = operations.filter(op => op.metadata.hitType === 'hit').length;
        
        const stats: CacheStats = {
          totalEntries,
          totalSize,
          hitRate: totalOperations > 0 ? hitOperations / totalOperations : 0,
          missRate: totalOperations > 0 ? (totalOperations - hitOperations) / totalOperations : 0,
          evictionRate: 0.05,
          compressionRatio: 0.7,
          memoryUsage: totalSize / (1024 * 1024 * 1024), // GB
          networkTraffic: operations.reduce((sum, op) => sum + (op.size || 0), 0),
          operationsPerSecond: operations.filter(op => 
            Date.now() - op.timestamp.getTime() < 1000
          ).length,
          averageLatency: operations.length > 0 ? 
            operations.reduce((sum, op) => sum + op.duration, 0) / operations.length : 0,
          errorRate: totalOperations > 0 ? (totalOperations - successfulOperations) / totalOperations : 0,
          isHealthy: true,
          systemHealth: 0,
          recommendations: []
        };
        
        stats.systemHealth = calculateCacheHealth(stats);
        stats.isHealthy = stats.systemHealth > 70;
        stats.recommendations = generateCacheRecommendations(stats, get().config);
        
        set({ stats });
        
        // Update computed state
        const computed = {
          totalEntries,
          totalNodes: nodes.length,
          activeNodes: nodes.filter(node => node.status === 'online').length,
          totalSize,
          averageLatency: stats.averageLatency,
          systemLoad: stats.memoryUsage,
          recentOperations: operations.slice(0, 10),
          topEntries: entries
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 10),
          healthyNodes: nodes.filter(node => node.status === 'online'),
          criticalEntries: entries.filter(entry => entry.priority === 'critical')
        };
        
        set({ computed });
      },
      
      refreshMetrics: async () => {
        // Simulate metrics refresh
        const { stats } = get();
        
        const metrics: CacheMetrics = {
          performance: {
            throughput: stats.operationsPerSecond,
            latency: stats.averageLatency,
            errorRate: stats.errorRate,
            availability: 0.999
          },
          storage: {
            utilization: stats.memoryUsage,
            fragmentation: 0.1,
            compressionRatio: stats.compressionRatio,
            growthRate: 0.05
          },
          network: {
            bandwidth: 1000000000,
            latency: 10,
            packetLoss: 0.001,
            connections: 100
          },
          efficiency: {
            hitRatio: stats.hitRate,
            evictionRatio: stats.evictionRate,
            replicationEfficiency: 0.95,
            costPerOperation: 0.001
          }
        };
        
        set({ metrics });
      },
      
      generateReport: async () => {
        const { stats, metrics, entries, nodes } = get();
        
        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            totalEntries: stats.totalEntries,
            totalSize: formatCacheSize(stats.totalSize),
            hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
            systemHealth: `${stats.systemHealth.toFixed(1)}%`
          },
          performance: metrics.performance,
          recommendations: stats.recommendations
        };
        
        return JSON.stringify(report, null, 2);
      },
      
      // System
      refresh: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await get().actions.refreshStats();
          await get().actions.refreshMetrics();
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to refresh cache data', isLoading: false });
        }
      },
      
      reset: async () => {
        set({
          entries: [],
          nodes: [],
          strategies: [],
          operations: [],
          selectedEntryId: null,
          selectedNodeId: null,
          selectedStrategyId: null,
          error: null
        });
        
        await get().actions.refreshStats();
      },
      
      backup: async () => {
        const { entries, nodes, strategies, config } = get();
        
        const backup = {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          data: {
            entries,
            nodes,
            strategies,
            config
          }
        };
        
        return JSON.stringify(backup, null, 2);
      },
      
      restore: async (backupStr) => {
        try {
          const backup = JSON.parse(backupStr);
          
          set({
            entries: backup.data.entries || [],
            nodes: backup.data.nodes || [],
            strategies: backup.data.strategies || [],
            config: backup.data.config || get().config
          });
          
          await get().actions.refreshStats();
        } catch (error) {
          set({ error: 'Failed to restore from backup' });
        }
      }
    },
    
    // Setters
    setSelectedEntry: (id) => set({ selectedEntryId: id }),
    setSelectedNode: (id) => set({ selectedNodeId: id }),
    setSelectedStrategy: (id) => set({ selectedStrategyId: id }),
    setError: (error) => set({ error })
  }))

// Cache Manager Class
export class DistributedCacheManager {
  private store = useDistributedCacheStore;
  
  // Public API methods
  async get(key: string, options?: { nodeId?: string; consistency?: string }) {
    return this.store.getState().actions.get(key, options);
  }
  
  async set(key: string, value: any, options?: { ttl?: number; tags?: string[]; priority?: string }) {
    return this.store.getState().actions.set(key, value, options);
  }
  
  async delete(key: string) {
    return this.store.getState().actions.delete(key);
  }
  
  async clear(pattern?: string) {
    return this.store.getState().actions.clear(pattern);
  }
  
  async exists(key: string) {
    return this.store.getState().actions.exists(key);
  }
  
  async invalidateByTag(tag: string) {
    return this.store.getState().actions.invalidateByTag(tag);
  }
  
  async optimize() {
    return this.store.getState().actions.optimize();
  }
  
  getStats() {
    return this.store.getState().stats;
  }
  
  getMetrics() {
    return this.store.getState().metrics;
  }
  
  async generateReport() {
    return this.store.getState().actions.generateReport();
  }
}

// Global instance
export const distributedCacheManager = new DistributedCacheManager();
