import { useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  useDistributedCacheStore,
  CacheEntry,
  CacheNode,
  CacheStrategy,
  CacheOperation,
  CacheConfig,
  CacheStats,
  CacheMetrics
} from '../services/distributedCacheService';

// Utility Hooks
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecRef = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastExecRef.current > delay) {
      lastExecRef.current = now;
      return func(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecRef.current = Date.now();
        func(...args);
      }, delay - (now - lastExecRef.current));
    }
  }, [func, delay]) as T;
};

export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]) as T;
};

// Progress Tracking Hook
export const useDistributedCacheProgress = () => {
  const isLoading = useDistributedCacheStore(state => state.isLoading);
  const error = useDistributedCacheStore(state => state.error);
  const stats = useDistributedCacheStore(state => state.stats);
  
  const progress = useMemo(() => {
    if (isLoading) return { status: 'loading', percentage: 0 };
    if (error) return { status: 'error', percentage: 0 };
    
    const healthPercentage = stats.systemHealth;
    
    if (healthPercentage >= 90) return { status: 'excellent', percentage: healthPercentage };
    if (healthPercentage >= 70) return { status: 'good', percentage: healthPercentage };
    if (healthPercentage >= 50) return { status: 'warning', percentage: healthPercentage };
    return { status: 'critical', percentage: healthPercentage };
  }, [isLoading, error, stats.systemHealth]);
  
  return {
    isLoading,
    error,
    progress,
    isHealthy: stats.isHealthy,
    systemHealth: stats.systemHealth
  };
};

// Main Hook
export const useDistributedCache = () => {
  const store = useDistributedCacheStore();
  const { actions } = store;
  
  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      actions.refreshStats();
      actions.refreshMetrics();
    }, 30000); // Refresh every 30 seconds
    
    // Initial load
    actions.refresh();
    
    return () => clearInterval(interval);
  }, [actions]);
  
  // Memoized actions
  const memoizedActions = useMemo(() => ({
    // Entry Management
    createEntry: actions.createEntry,
    updateEntry: actions.updateEntry,
    deleteEntry: actions.deleteEntry,
    getEntry: actions.getEntry,
    setEntry: actions.setEntry,
    invalidateEntry: actions.invalidateEntry,
    invalidateByTag: actions.invalidateByTag,
    
    // Node Management
    addNode: actions.addNode,
    updateNode: actions.updateNode,
    removeNode: actions.removeNode,
    syncNode: actions.syncNode,
    syncAllNodes: actions.syncAllNodes,
    
    // Strategy Management
    createStrategy: actions.createStrategy,
    updateStrategy: actions.updateStrategy,
    deleteStrategy: actions.deleteStrategy,
    applyStrategy: actions.applyStrategy,
    
    // Cache Operations
    get: actions.get,
    set: actions.set,
    delete: actions.delete,
    clear: actions.clear,
    exists: actions.exists,
    
    // Optimization
    optimize: actions.optimize,
    compress: actions.compress,
    decompress: actions.decompress,
    evict: actions.evict,
    prefetch: actions.prefetch,
    
    // Configuration
    updateConfig: actions.updateConfig,
    resetConfig: actions.resetConfig,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig,
    
    // Analytics
    refreshStats: actions.refreshStats,
    refreshMetrics: actions.refreshMetrics,
    generateReport: actions.generateReport,
    
    // System
    refresh: actions.refresh,
    reset: actions.reset,
    backup: actions.backup,
    restore: actions.restore
  }), [actions]);
  
  // Quick actions with error handling
  const quickActions = useMemo(() => ({
    quickGet: async (key: string) => {
      try {
        return await memoizedActions.get(key);
      } catch (error) {
        console.error('Quick get failed:', error);
        return null;
      }
    },
    
    quickSet: async (key: string, value: any, ttl?: number) => {
      try {
        await memoizedActions.set(key, value, { ttl });
        return true;
      } catch (error) {
        console.error('Quick set failed:', error);
        return false;
      }
    },
    
    quickDelete: async (key: string) => {
      try {
        await memoizedActions.delete(key);
        return true;
      } catch (error) {
        console.error('Quick delete failed:', error);
        return false;
      }
    },
    
    quickOptimize: async () => {
      try {
        await memoizedActions.optimize();
        return true;
      } catch (error) {
        console.error('Quick optimize failed:', error);
        return false;
      }
    },
    
    quickSync: async () => {
      try {
        await memoizedActions.syncAllNodes();
        return true;
      } catch (error) {
        console.error('Quick sync failed:', error);
        return false;
      }
    }
  }), [memoizedActions]);
  
  // Throttled actions
  const throttledRefresh = useThrottle(memoizedActions.refresh, 5000);
  const throttledOptimize = useThrottle(memoizedActions.optimize, 10000);
  
  // Debounced actions
  const debouncedSearch = useDebounce((query: string) => {
    // Implement search logic
  }, 300);
  
  // Enhanced computed values
  const enhancedComputed = useMemo(() => {
    const { computed, stats, metrics } = store;
    
    return {
      ...computed,
      
      // Performance indicators
      performanceScore: calculatePerformanceScore(stats, metrics),
      efficiencyRating: calculateEfficiencyRating(stats),
      healthStatus: getHealthStatus(stats.systemHealth),
      
      // Capacity planning
      capacityUtilization: stats.memoryUsage,
      projectedGrowth: calculateProjectedGrowth(store.entries),
      recommendedActions: stats.recommendations,
      
      // Network insights
      networkEfficiency: calculateNetworkEfficiency(metrics),
      replicationHealth: calculateReplicationHealth(store.nodes),
      
      // Cost analysis
      operationalCost: calculateOperationalCost(metrics),
      costOptimization: generateCostOptimizations(stats, metrics)
    };
  }, [store]);
  
  // Filtered data
  const filteredData = useMemo(() => {
    const { entries, nodes, operations } = store;
    
    return {
      // Recent entries
      recentEntries: entries
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20),
      
      // Active nodes
      activeNodes: nodes.filter(node => node.status === 'online'),
      
      // Failed operations
      failedOperations: operations.filter(op => !op.success),
      
      // High-priority entries
      priorityEntries: entries.filter(entry => 
        entry.priority === 'high' || entry.priority === 'critical'
      ),
      
      // Large entries
      largeEntries: entries
        .filter(entry => entry.size > 1024 * 1024) // > 1MB
        .sort((a, b) => b.size - a.size),
      
      // Frequently accessed
      popularEntries: entries
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10),
      
      // Stale entries
      staleEntries: entries.filter(entry => {
        const now = Date.now();
        const age = now - entry.lastAccessed.getTime();
        return age > entry.ttl;
      })
    };
  }, [store.entries, store.nodes, store.operations]);
  
  return {
    // State
    ...store,
    
    // Enhanced computed
    computed: enhancedComputed,
    
    // Filtered data
    filtered: filteredData,
    
    // Actions
    actions: memoizedActions,
    quickActions,
    
    // Throttled/Debounced
    throttledRefresh,
    throttledOptimize,
    debouncedSearch,
    
    // Utilities
    complexity: calculateCacheComplexity(store.entries, store.nodes),
    recommendations: generateSmartRecommendations(store)
  };
};

// Specialized Hooks
export const useDistributedCacheStats = () => {
  const stats = useDistributedCacheStore(state => state.stats);
  const metrics = useDistributedCacheStore(state => state.metrics);
  const refreshStats = useDistributedCacheStore(state => state.actions.refreshStats);
  const refreshMetrics = useDistributedCacheStore(state => state.actions.refreshMetrics);
  
  const enhancedStats = useMemo(() => ({
    ...stats,
    
    // Performance metrics
    throughputTrend: calculateThroughputTrend(metrics),
    latencyTrend: calculateLatencyTrend(metrics),
    errorTrend: calculateErrorTrend(metrics),
    
    // Efficiency metrics
    cacheEfficiency: calculateCacheEfficiency(stats),
    storageEfficiency: calculateStorageEfficiency(metrics),
    networkEfficiency: calculateNetworkEfficiency(metrics),
    
    // Health indicators
    overallHealth: stats.systemHealth,
    performanceHealth: calculatePerformanceHealth(metrics),
    storageHealth: calculateStorageHealth(metrics),
    networkHealth: calculateNetworkHealth(metrics)
  }), [stats, metrics]);
  
  return {
    stats: enhancedStats,
    metrics,
    refreshStats,
    refreshMetrics,
    isHealthy: stats.isHealthy,
    systemHealth: stats.systemHealth
  };
};

export const useDistributedCacheConfig = () => {
  const config = useDistributedCacheStore(state => state.config);
  const updateConfig = useDistributedCacheStore(state => state.actions.updateConfig);
  const resetConfig = useDistributedCacheStore(state => state.actions.resetConfig);
  const exportConfig = useDistributedCacheStore(state => state.actions.exportConfig);
  const importConfig = useDistributedCacheStore(state => state.actions.importConfig);
  
  const configValidation = useMemo(() => {
    const issues: string[] = [];
    
    if (config.global.maxMemory < 1024 * 1024) {
      issues.push('Memory limit is too low');
    }
    
    if (config.global.defaultTtl < 1000) {
      issues.push('Default TTL is too short');
    }
    
    if (config.replication.factor > 5) {
      issues.push('Replication factor is too high');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }, [config]);
  
  return {
    config,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    validation: configValidation
  };
};

export const useDistributedCacheSearch = (query: string = '', filters: any = {}) => {
  const entries = useDistributedCacheStore(state => state.entries);
  const nodes = useDistributedCacheStore(state => state.nodes);
  const operations = useDistributedCacheStore(state => state.operations);
  
  const searchResults = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    
    const filteredEntries = entries.filter(entry => {
      const matchesQuery = !query || 
        entry.key.toLowerCase().includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        switch (key) {
          case 'priority':
            return entry.priority === value;
          case 'compressed':
            return entry.compressed === value;
          case 'encrypted':
            return entry.encrypted === value;
          case 'minSize':
            return entry.size >= value;
          case 'maxSize':
            return entry.size <= value;
          default:
            return true;
        }
      });
      
      return matchesQuery && matchesFilters;
    });
    
    const filteredNodes = nodes.filter(node => {
      return !query || 
        node.name.toLowerCase().includes(lowerQuery) ||
        node.region.toLowerCase().includes(lowerQuery);
    });
    
    const filteredOperations = operations.filter(operation => {
      return !query || 
        operation.key.toLowerCase().includes(lowerQuery) ||
        operation.type.toLowerCase().includes(lowerQuery);
    });
    
    return {
      entries: filteredEntries,
      nodes: filteredNodes,
      operations: filteredOperations,
      total: filteredEntries.length + filteredNodes.length + filteredOperations.length
    };
  }, [entries, nodes, operations, query, filters]);
  
  return searchResults;
};

export const useCurrentCacheEntry = (entryId: string | null) => {
  const entries = useDistributedCacheStore(state => state.entries);
  const updateEntry = useDistributedCacheStore(state => state.actions.updateEntry);
  const deleteEntry = useDistributedCacheStore(state => state.actions.deleteEntry);
  
  const currentEntry = useMemo(() => {
    return entryId ? entries.find(entry => entry.id === entryId) : null;
  }, [entries, entryId]);
  
  const entryAnalytics = useMemo(() => {
    if (!currentEntry) return null;
    
    return {
      ageInMs: Date.now() - currentEntry.createdAt.getTime(),
      timeSinceLastAccess: Date.now() - currentEntry.lastAccessed.getTime(),
      accessFrequency: currentEntry.accessCount / Math.max(1, 
        (Date.now() - currentEntry.createdAt.getTime()) / (1000 * 60 * 60) // per hour
      ),
      sizeCategory: getSizeCategory(currentEntry.size),
      priorityScore: getPriorityScore(currentEntry.priority),
      isStale: Date.now() - currentEntry.lastAccessed.getTime() > currentEntry.ttl,
      compressionRatio: currentEntry.compressed ? 0.7 : 1.0
    };
  }, [currentEntry]);
  
  return {
    entry: currentEntry,
    analytics: entryAnalytics,
    updateEntry: (updates: Partial<CacheEntry>) => 
      entryId ? updateEntry(entryId, updates) : Promise.resolve(),
    deleteEntry: () => 
      entryId ? deleteEntry(entryId) : Promise.resolve()
  };
};

export const useCacheNodeMonitoring = () => {
  const nodes = useDistributedCacheStore(state => state.nodes);
  const updateNode = useDistributedCacheStore(state => state.actions.updateNode);
  const syncNode = useDistributedCacheStore(state => state.actions.syncNode);
  
  const nodeMetrics = useMemo(() => {
    const totalNodes = nodes.length;
    const onlineNodes = nodes.filter(node => node.status === 'online').length;
    const offlineNodes = nodes.filter(node => node.status === 'offline').length;
    const syncingNodes = nodes.filter(node => node.status === 'syncing').length;
    
    const averageLatency = nodes.length > 0 ? 
      nodes.reduce((sum, node) => sum + node.latency, 0) / nodes.length : 0;
    
    const averageLoad = nodes.length > 0 ? 
      nodes.reduce((sum, node) => sum + node.load, 0) / nodes.length : 0;
    
    const totalCapacity = nodes.reduce((sum, node) => sum + node.capacity, 0);
    const totalUsed = nodes.reduce((sum, node) => sum + node.used, 0);
    
    return {
      totalNodes,
      onlineNodes,
      offlineNodes,
      syncingNodes,
      availability: totalNodes > 0 ? onlineNodes / totalNodes : 0,
      averageLatency,
      averageLoad,
      totalCapacity,
      totalUsed,
      utilization: totalCapacity > 0 ? totalUsed / totalCapacity : 0,
      healthScore: calculateNodeHealthScore(nodes)
    };
  }, [nodes]);
  
  return {
    nodes,
    metrics: nodeMetrics,
    updateNode,
    syncNode,
    healthyNodes: nodes.filter(node => node.status === 'online'),
    unhealthyNodes: nodes.filter(node => node.status !== 'online')
  };
};

export const useDistributedCacheAnalytics = () => {
  const operations = useDistributedCacheStore(state => state.operations);
  const stats = useDistributedCacheStore(state => state.stats);
  const metrics = useDistributedCacheStore(state => state.metrics);
  const generateReport = useDistributedCacheStore(state => state.actions.generateReport);
  
  const analytics = useMemo(() => {
    const recentOps = operations.slice(0, 100);
    
    const operationsByType = recentOps.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const operationsByHour = recentOps.reduce((acc, op) => {
      const hour = new Date(op.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const averageResponseTime = recentOps.length > 0 ? 
      recentOps.reduce((sum, op) => sum + op.duration, 0) / recentOps.length : 0;
    
    const successRate = recentOps.length > 0 ? 
      recentOps.filter(op => op.success).length / recentOps.length : 0;
    
    return {
      operationsByType,
      operationsByHour,
      averageResponseTime,
      successRate,
      totalOperations: operations.length,
      recentOperations: recentOps.slice(0, 10),
      performanceTrend: calculatePerformanceTrend(recentOps),
      usagePattern: analyzeUsagePattern(recentOps)
    };
  }, [operations]);
  
  return {
    analytics,
    stats,
    metrics,
    generateReport,
    operations: operations.slice(0, 50) // Limit for performance
  };
};

// Utility Hooks
export const useThrottledCacheAction = <T extends (...args: any[]) => any>(
  action: T,
  delay: number = 1000
) => {
  return useThrottle(action, delay);
};

export const useDebouncedCacheAction = <T extends (...args: any[]) => any>(
  action: T,
  delay: number = 300
) => {
  return useDebounce(action, delay);
};

// Helper Functions
const calculateCacheComplexity = (entries: CacheEntry[], nodes: CacheNode[]): number => {
  const entryComplexity = entries.length * 0.1;
  const nodeComplexity = nodes.length * 0.2;
  const replicationComplexity = nodes.filter(n => n.status === 'online').length * 0.15;
  
  return Math.min(100, entryComplexity + nodeComplexity + replicationComplexity);
};

const calculatePerformanceScore = (stats: CacheStats, metrics: CacheMetrics): number => {
  const hitRateScore = stats.hitRate * 40;
  const latencyScore = Math.max(0, 30 - (stats.averageLatency / 10)) * 2;
  const errorScore = Math.max(0, 20 - (stats.errorRate * 100)) * 1.5;
  const throughputScore = Math.min(20, metrics.performance.throughput / 50);
  
  return Math.min(100, hitRateScore + latencyScore + errorScore + throughputScore);
};

const calculateEfficiencyRating = (stats: CacheStats): string => {
  const efficiency = (stats.hitRate * 0.4) + 
                    ((1 - stats.memoryUsage) * 0.3) + 
                    ((1 - stats.errorRate) * 0.3);
  
  if (efficiency >= 0.9) return 'Excellent';
  if (efficiency >= 0.7) return 'Good';
  if (efficiency >= 0.5) return 'Fair';
  return 'Poor';
};

const getHealthStatus = (health: number): string => {
  if (health >= 90) return 'Excellent';
  if (health >= 70) return 'Good';
  if (health >= 50) return 'Warning';
  return 'Critical';
};

const calculateProjectedGrowth = (entries: CacheEntry[]): number => {
  if (entries.length < 2) return 0;
  
  const now = Date.now();
  const recentEntries = entries.filter(entry => 
    now - entry.createdAt.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
  );
  
  return (recentEntries.length / entries.length) * 100;
};

const calculateNetworkEfficiency = (metrics: CacheMetrics): number => {
  const latencyScore = Math.max(0, 100 - metrics.network.latency);
  const packetLossScore = Math.max(0, 100 - (metrics.network.packetLoss * 10000));
  const bandwidthScore = Math.min(100, metrics.network.bandwidth / 10000000); // 10Mbps baseline
  
  return (latencyScore + packetLossScore + bandwidthScore) / 3;
};

const calculateReplicationHealth = (nodes: CacheNode[]): number => {
  const onlineNodes = nodes.filter(node => node.status === 'online');
  const totalNodes = nodes.length;
  
  if (totalNodes === 0) return 0;
  
  const availability = onlineNodes.length / totalNodes;
  const avgHealth = onlineNodes.reduce((sum, node) => {
    const nodeHealth = (node.health.cpu + node.health.memory + 
                      node.health.disk + node.health.network) / 4;
    return sum + nodeHealth;
  }, 0) / Math.max(1, onlineNodes.length);
  
  return (availability * 50) + (avgHealth * 50);
};

const calculateOperationalCost = (metrics: CacheMetrics): number => {
  return metrics.efficiency.costPerOperation * metrics.performance.throughput;
};

const generateCostOptimizations = (stats: CacheStats, metrics: CacheMetrics): string[] => {
  const optimizations: string[] = [];
  
  if (stats.memoryUsage > 0.8) {
    optimizations.push('Enable compression to reduce memory usage');
  }
  
  if (metrics.efficiency.hitRatio < 0.7) {
    optimizations.push('Optimize cache strategies to improve hit ratio');
  }
  
  if (metrics.performance.latency > 50) {
    optimizations.push('Add more cache nodes to reduce latency');
  }
  
  return optimizations;
};

const generateSmartRecommendations = (store: any): string[] => {
  const recommendations: string[] = [];
  const { stats, entries, nodes } = store;
  
  if (stats.hitRate < 0.8) {
    recommendations.push('Consider increasing cache TTL or size');
  }
  
  if (entries.length > 10000) {
    recommendations.push('Implement automatic cleanup for old entries');
  }
  
  if (nodes.filter((n: CacheNode) => n.status === 'online').length < 2) {
    recommendations.push('Add more nodes for better redundancy');
  }
  
  return recommendations;
};

const calculateThroughputTrend = (metrics: CacheMetrics): string => {
  // Simplified trend calculation
  return metrics.performance.throughput > 1000 ? 'increasing' : 'stable';
};

const calculateLatencyTrend = (metrics: CacheMetrics): string => {
  return metrics.performance.latency < 50 ? 'improving' : 'stable';
};

const calculateErrorTrend = (metrics: CacheMetrics): string => {
  return metrics.performance.errorRate < 0.01 ? 'improving' : 'stable';
};

const calculateCacheEfficiency = (stats: CacheStats): number => {
  return (stats.hitRate * 0.6) + ((1 - stats.evictionRate) * 0.4);
};

const calculateStorageEfficiency = (metrics: CacheMetrics): number => {
  return (1 - metrics.storage.fragmentation) * metrics.storage.compressionRatio;
};

const calculatePerformanceHealth = (metrics: CacheMetrics): number => {
  return (metrics.performance.availability * 100);
};

const calculateStorageHealth = (metrics: CacheMetrics): number => {
  return Math.max(0, 100 - (metrics.storage.utilization * 100));
};

const calculateNetworkHealth = (metrics: CacheMetrics): number => {
  return Math.max(0, 100 - metrics.network.latency);
};

const calculateNodeHealthScore = (nodes: CacheNode[]): number => {
  if (nodes.length === 0) return 0;
  
  const totalHealth = nodes.reduce((sum, node) => {
    const nodeHealth = (node.health.cpu + node.health.memory + 
                      node.health.disk + node.health.network) / 4;
    return sum + nodeHealth;
  }, 0);
  
  return totalHealth / nodes.length;
};

const getSizeCategory = (size: number): string => {
  if (size < 1024) return 'Small';
  if (size < 1024 * 1024) return 'Medium';
  if (size < 1024 * 1024 * 10) return 'Large';
  return 'Very Large';
};

const getPriorityScore = (priority: string): number => {
  switch (priority) {
    case 'critical': return 100;
    case 'high': return 75;
    case 'medium': return 50;
    case 'low': return 25;
    default: return 0;
  }
};

const calculatePerformanceTrend = (operations: CacheOperation[]): string => {
  if (operations.length < 10) return 'insufficient_data';
  
  const recent = operations.slice(0, 5);
  const older = operations.slice(5, 10);
  
  const recentAvg = recent.reduce((sum, op) => sum + op.duration, 0) / recent.length;
  const olderAvg = older.reduce((sum, op) => sum + op.duration, 0) / older.length;
  
  if (recentAvg < olderAvg * 0.9) return 'improving';
  if (recentAvg > olderAvg * 1.1) return 'degrading';
  return 'stable';
};

const analyzeUsagePattern = (operations: CacheOperation[]): string => {
  const hourCounts = operations.reduce((acc, op) => {
    const hour = new Date(op.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const maxHour = Object.entries(hourCounts)
    .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, 
            { hour: 0, count: 0 });
  
  if (maxHour.hour >= 9 && maxHour.hour <= 17) return 'business_hours';
  if (maxHour.hour >= 18 && maxHour.hour <= 23) return 'evening_peak';
  return 'distributed';
};