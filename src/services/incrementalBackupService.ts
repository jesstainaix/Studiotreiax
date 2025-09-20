import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface BackupFile {
  id: string;
  path: string;
  name: string;
  size: number;
  hash: string;
  lastModified: Date;
  type: 'file' | 'directory';
  mimeType?: string;
  isDeleted: boolean;
  parentId?: string;
  metadata: {
    encoding?: string;
    permissions?: string;
    owner?: string;
    group?: string;
    attributes?: Record<string, any>;
  };
}

export interface BackupSnapshot {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'differential';
  description: string;
  files: BackupFile[];
  changes: BackupChange[];
  size: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  parentSnapshotId?: string;
  tags: string[];
  metadata: {
    version: string;
    environment: string;
    user: string;
    machine: string;
    checksum: string;
  };
}

export interface BackupChange {
  id: string;
  type: 'created' | 'modified' | 'deleted' | 'moved' | 'renamed';
  fileId: string;
  filePath: string;
  oldPath?: string;
  timestamp: Date;
  size: number;
  hash: string;
  oldHash?: string;
  details: {
    bytesChanged?: number;
    linesAdded?: number;
    linesRemoved?: number;
    permissions?: string;
    attributes?: Record<string, any>;
  };
}

export interface BackupPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: {
    frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    time?: string;
    days?: number[];
    timezone: string;
  };
  retention: {
    maxSnapshots: number;
    maxAge: number; // days
    keepDaily: number;
    keepWeekly: number;
    keepMonthly: number;
    keepYearly: number;
  };
  filters: {
    includePaths: string[];
    excludePaths: string[];
    includeExtensions: string[];
    excludeExtensions: string[];
    maxFileSize: number;
    followSymlinks: boolean;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'bzip2' | 'lzma' | 'zstd';
    level: number;
  };
  encryption: {
    enabled: boolean;
    algorithm: 'aes256' | 'chacha20';
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
  };
}

export interface BackupDestination {
  id: string;
  name: string;
  type: 'local' | 'cloud' | 'network' | 'remote';
  enabled: boolean;
  config: {
    path?: string;
    url?: string;
    credentials?: {
      username?: string;
      password?: string;
      token?: string;
      keyFile?: string;
    };
    options?: Record<string, any>;
  };
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date;
  capacity: {
    total: number;
    used: number;
    available: number;
  };
  performance: {
    uploadSpeed: number;
    downloadSpeed: number;
    latency: number;
  };
}

export interface RestoreOperation {
  id: string;
  snapshotId: string;
  targetPath: string;
  files: string[];
  options: {
    overwrite: boolean;
    preservePermissions: boolean;
    preserveTimestamps: boolean;
    createDirectories: boolean;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  restoredFiles: number;
  totalFiles: number;
  restoredSize: number;
  totalSize: number;
}

export interface BackupConfig {
  general: {
    autoStart: boolean;
    showNotifications: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    maxLogSize: number;
    tempDirectory: string;
    maxConcurrentOperations: number;
  };
  monitoring: {
    enableHealthCheck: boolean;
    healthCheckInterval: number;
    alertThresholds: {
      failureRate: number;
      diskUsage: number;
      responseTime: number;
    };
  };
  performance: {
    chunkSize: number;
    bufferSize: number;
    maxMemoryUsage: number;
    enableDeduplication: boolean;
    enableDeltaCompression: boolean;
  };
  security: {
    enableIntegrityCheck: boolean;
    enableEncryption: boolean;
    keyRotationInterval: number;
    auditLog: boolean;
  };
}

export interface BackupStats {
  totalSnapshots: number;
  totalSize: number;
  compressedSize: number;
  deduplicationSavings: number;
  lastBackupTime: Date;
  nextScheduledBackup: Date;
  averageBackupTime: number;
  successRate: number;
  failureCount: number;
  storageEfficiency: number;
}

export interface BackupMetrics {
  performance: {
    backupSpeed: number;
    restoreSpeed: number;
    compressionRatio: number;
    deduplicationRatio: number;
    cpuUsage: number;
    memoryUsage: number;
    diskIo: number;
    networkIo: number;
  };
  reliability: {
    uptime: number;
    errorRate: number;
    recoveryTime: number;
    dataIntegrity: number;
  };
  storage: {
    totalCapacity: number;
    usedSpace: number;
    availableSpace: number;
    growthRate: number;
    retentionCompliance: number;
  };
}

// Zustand Store
interface IncrementalBackupStore {
  // State
  snapshots: BackupSnapshot[];
  policies: BackupPolicy[];
  destinations: BackupDestination[];
  restoreOperations: RestoreOperation[];
  currentSnapshot: BackupSnapshot | null;
  currentRestore: RestoreOperation | null;
  selectedFiles: BackupFile[];
  config: BackupConfig;
  stats: BackupStats;
  metrics: BackupMetrics;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedPolicy: string;
  selectedDestination: string;
  sortBy: string;
  viewMode: 'list' | 'tree' | 'timeline';
  
  // Computed
  filteredSnapshots: BackupSnapshot[];
  filteredPolicies: BackupPolicy[];
  activeDestinations: BackupDestination[];
  totalBackupSize: number;
  compressionSavings: number;
  hasActiveBackup: boolean;
  hasActiveRestore: boolean;
  
  // Actions
  createSnapshot: (type: 'full' | 'incremental' | 'differential', description?: string) => Promise<boolean>;
  deleteSnapshot: (snapshotId: string) => boolean;
  restoreSnapshot: (snapshotId: string, targetPath: string, files?: string[]) => Promise<boolean>;
  cancelOperation: (operationId: string) => boolean;
  createPolicy: (policy: Omit<BackupPolicy, 'id'>) => boolean;
  updatePolicy: (policyId: string, updates: Partial<BackupPolicy>) => boolean;
  deletePolicy: (policyId: string) => boolean;
  enablePolicy: (policyId: string, enabled: boolean) => boolean;
  addDestination: (destination: Omit<BackupDestination, 'id'>) => boolean;
  updateDestination: (destinationId: string, updates: Partial<BackupDestination>) => boolean;
  removeDestination: (destinationId: string) => boolean;
  testDestination: (destinationId: string) => Promise<boolean>;
  syncDestination: (destinationId: string) => Promise<boolean>;
  verifySnapshot: (snapshotId: string) => Promise<boolean>;
  repairSnapshot: (snapshotId: string) => Promise<boolean>;
  optimizeStorage: () => Promise<boolean>;
  cleanupOldSnapshots: () => Promise<boolean>;
  exportSnapshot: (snapshotId: string, format: 'zip' | 'tar' | 'json') => Promise<boolean>;
  importSnapshot: (file: File) => Promise<boolean>;
  updateConfig: (updates: Partial<BackupConfig>) => void;
  refreshStats: () => void;
  refreshMetrics: () => void;
  
  // Search and Filter
  setSearchQuery: (query: string) => void;
  setSelectedPolicy: (policyId: string) => void;
  setSelectedDestination: (destinationId: string) => void;
  setSortBy: (sortBy: string) => void;
  setViewMode: (mode: 'list' | 'tree' | 'timeline') => void;
  
  // System
  initialize: () => Promise<void>;
  cleanup: () => void;
  reset: () => void;
}

const useIncrementalBackupStore = create<IncrementalBackupStore>()(subscribeWithSelector((set, get) => ({
  // Initial State
  snapshots: [],
  policies: [],
  destinations: [],
  restoreOperations: [],
  currentSnapshot: null,
  currentRestore: null,
  selectedFiles: [],
  config: {
    general: {
      autoStart: true,
      showNotifications: true,
      logLevel: 'info',
      maxLogSize: 100,
      tempDirectory: '/tmp/backup',
      maxConcurrentOperations: 3
    },
    monitoring: {
      enableHealthCheck: true,
      healthCheckInterval: 300,
      alertThresholds: {
        failureRate: 0.1,
        diskUsage: 0.9,
        responseTime: 5000
      }
    },
    performance: {
      chunkSize: 1024 * 1024,
      bufferSize: 64 * 1024,
      maxMemoryUsage: 512 * 1024 * 1024,
      enableDeduplication: true,
      enableDeltaCompression: true
    },
    security: {
      enableIntegrityCheck: true,
      enableEncryption: false,
      keyRotationInterval: 90,
      auditLog: true
    }
  },
  stats: {
    totalSnapshots: 0,
    totalSize: 0,
    compressedSize: 0,
    deduplicationSavings: 0,
    lastBackupTime: new Date(),
    nextScheduledBackup: new Date(),
    averageBackupTime: 0,
    successRate: 0,
    failureCount: 0,
    storageEfficiency: 0
  },
  metrics: {
    performance: {
      backupSpeed: 0,
      restoreSpeed: 0,
      compressionRatio: 0,
      deduplicationRatio: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskIo: 0,
      networkIo: 0
    },
    reliability: {
      uptime: 0,
      errorRate: 0,
      recoveryTime: 0,
      dataIntegrity: 0
    },
    storage: {
      totalCapacity: 0,
      usedSpace: 0,
      availableSpace: 0,
      growthRate: 0,
      retentionCompliance: 0
    }
  },
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedPolicy: 'all',
  selectedDestination: 'all',
  sortBy: 'timestamp',
  viewMode: 'list',
  
  // Computed
  get filteredSnapshots() {
    const { snapshots, searchQuery, selectedPolicy, sortBy } = get();
    let filtered = snapshots;
    
    if (searchQuery) {
      filtered = filtered.filter(snapshot => 
        snapshot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snapshot.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedPolicy !== 'all') {
      filtered = filtered.filter(snapshot => snapshot.metadata.version === selectedPolicy);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'size':
          return b.size - a.size;
        case 'duration':
          return b.duration - a.duration;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  },
  
  get filteredPolicies() {
    const { policies, searchQuery } = get();
    if (!searchQuery) return policies;
    
    return policies.filter(policy => 
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },
  
  get activeDestinations() {
    return get().destinations.filter(dest => dest.enabled && dest.status === 'connected');
  },
  
  get totalBackupSize() {
    return get().snapshots.reduce((total, snapshot) => total + snapshot.size, 0);
  },
  
  get compressionSavings() {
    const { snapshots } = get();
    const totalSize = snapshots.reduce((total, snapshot) => total + snapshot.size, 0);
    const compressedSize = snapshots.reduce((total, snapshot) => total + snapshot.compressedSize, 0);
    return totalSize > 0 ? ((totalSize - compressedSize) / totalSize) * 100 : 0;
  },
  
  get hasActiveBackup() {
    return get().snapshots.some(snapshot => snapshot.status === 'running');
  },
  
  get hasActiveRestore() {
    return get().restoreOperations.some(restore => restore.status === 'running');
  },
  
  // Actions
  createSnapshot: async (type, description = '') => {
    try {
      set({ isLoading: true, error: null });
      
      const newSnapshot: BackupSnapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date(),
        type,
        description: description || `${type} backup`,
        files: [],
        changes: [],
        size: Math.floor(Math.random() * 1000000000),
        compressedSize: Math.floor(Math.random() * 500000000),
        compressionRatio: 0.5,
        duration: Math.floor(Math.random() * 300),
        status: 'completed',
        tags: [type, 'auto'],
        metadata: {
          version: '1.0',
          environment: 'production',
          user: 'system',
          machine: 'backup-server',
          checksum: 'sha256:' + Math.random().toString(36)
        }
      };
      
      set(state => ({
        snapshots: [newSnapshot, ...state.snapshots],
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to create snapshot', isLoading: false });
      return false;
    }
  },
  
  deleteSnapshot: (snapshotId) => {
    try {
      set(state => ({
        snapshots: state.snapshots.filter(s => s.id !== snapshotId)
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to delete snapshot' });
      return false;
    }
  },
  
  restoreSnapshot: async (snapshotId, targetPath, files = []) => {
    try {
      set({ isLoading: true, error: null });
      
      const snapshot = get().snapshots.find(s => s.id === snapshotId);
      if (!snapshot) {
        throw new Error('Snapshot not found');
      }
      
      const restoreOperation: RestoreOperation = {
        id: `restore_${Date.now()}`,
        snapshotId,
        targetPath,
        files,
        options: {
          overwrite: true,
          preservePermissions: true,
          preserveTimestamps: true,
          createDirectories: true
        },
        status: 'completed',
        progress: 100,
        startTime: new Date(),
        endTime: new Date(),
        restoredFiles: files.length || snapshot.files.length,
        totalFiles: files.length || snapshot.files.length,
        restoredSize: snapshot.size,
        totalSize: snapshot.size
      };
      
      set(state => ({
        restoreOperations: [restoreOperation, ...state.restoreOperations],
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to restore snapshot', isLoading: false });
      return false;
    }
  },
  
  cancelOperation: (operationId) => {
    try {
      set(state => ({
        snapshots: state.snapshots.map(s => 
          s.id === operationId ? { ...s, status: 'cancelled' as const } : s
        ),
        restoreOperations: state.restoreOperations.map(r => 
          r.id === operationId ? { ...r, status: 'cancelled' as const } : r
        )
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to cancel operation' });
      return false;
    }
  },
  
  createPolicy: (policy) => {
    try {
      const newPolicy: BackupPolicy = {
        ...policy,
        id: `policy_${Date.now()}`
      };
      
      set(state => ({
        policies: [...state.policies, newPolicy]
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to create policy' });
      return false;
    }
  },
  
  updatePolicy: (policyId, updates) => {
    try {
      set(state => ({
        policies: state.policies.map(p => 
          p.id === policyId ? { ...p, ...updates } : p
        )
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to update policy' });
      return false;
    }
  },
  
  deletePolicy: (policyId) => {
    try {
      set(state => ({
        policies: state.policies.filter(p => p.id !== policyId)
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to delete policy' });
      return false;
    }
  },
  
  enablePolicy: (policyId, enabled) => {
    try {
      set(state => ({
        policies: state.policies.map(p => 
          p.id === policyId ? { ...p, enabled } : p
        )
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to update policy status' });
      return false;
    }
  },
  
  addDestination: (destination) => {
    try {
      const newDestination: BackupDestination = {
        ...destination,
        id: `dest_${Date.now()}`
      };
      
      set(state => ({
        destinations: [...state.destinations, newDestination]
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to add destination' });
      return false;
    }
  },
  
  updateDestination: (destinationId, updates) => {
    try {
      set(state => ({
        destinations: state.destinations.map(d => 
          d.id === destinationId ? { ...d, ...updates } : d
        )
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to update destination' });
      return false;
    }
  },
  
  removeDestination: (destinationId) => {
    try {
      set(state => ({
        destinations: state.destinations.filter(d => d.id !== destinationId)
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to remove destination' });
      return false;
    }
  },
  
  testDestination: async (destinationId) => {
    try {
      set({ isLoading: true });
      
      // Simulate testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => ({
        destinations: state.destinations.map(d => 
          d.id === destinationId ? { ...d, status: 'connected' as const } : d
        ),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to test destination', isLoading: false });
      return false;
    }
  },
  
  syncDestination: async (destinationId) => {
    try {
      set({ isLoading: true });
      
      // Simulate syncing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set(state => ({
        destinations: state.destinations.map(d => 
          d.id === destinationId ? { ...d, lastSync: new Date() } : d
        ),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to sync destination', isLoading: false });
      return false;
    }
  },
  
  verifySnapshot: async (snapshotId) => {
    try {
      set({ isLoading: true });
      
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to verify snapshot', isLoading: false });
      return false;
    }
  },
  
  repairSnapshot: async (snapshotId) => {
    try {
      set({ isLoading: true });
      
      // Simulate repair
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to repair snapshot', isLoading: false });
      return false;
    }
  },
  
  optimizeStorage: async () => {
    try {
      set({ isLoading: true });
      
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to optimize storage', isLoading: false });
      return false;
    }
  },
  
  cleanupOldSnapshots: async () => {
    try {
      set({ isLoading: true });
      
      // Simulate cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      set(state => ({
        snapshots: state.snapshots.filter(s => s.timestamp > cutoffDate),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to cleanup snapshots', isLoading: false });
      return false;
    }
  },
  
  exportSnapshot: async (snapshotId, format) => {
    try {
      set({ isLoading: true });
      
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to export snapshot', isLoading: false });
      return false;
    }
  },
  
  importSnapshot: async (file) => {
    try {
      set({ isLoading: true });
      
      // Simulate import
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newSnapshot: BackupSnapshot = {
        id: `imported_${Date.now()}`,
        timestamp: new Date(),
        type: 'full',
        description: `Imported from ${file.name}`,
        files: [],
        changes: [],
        size: file.size,
        compressedSize: Math.floor(file.size * 0.7),
        compressionRatio: 0.7,
        duration: 0,
        status: 'completed',
        tags: ['imported'],
        metadata: {
          version: '1.0',
          environment: 'imported',
          user: 'system',
          machine: 'local',
          checksum: 'sha256:imported'
        }
      };
      
      set(state => ({
        snapshots: [newSnapshot, ...state.snapshots],
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      set({ error: 'Failed to import snapshot', isLoading: false });
      return false;
    }
  },
  
  updateConfig: (updates) => {
    set(state => ({
      config: { ...state.config, ...updates }
    }));
  },
  
  refreshStats: () => {
    const { snapshots } = get();
    const totalSnapshots = snapshots.length;
    const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0);
    const compressedSize = snapshots.reduce((sum, s) => sum + s.compressedSize, 0);
    const completedSnapshots = snapshots.filter(s => s.status === 'completed');
    const successRate = totalSnapshots > 0 ? (completedSnapshots.length / totalSnapshots) * 100 : 0;
    
    set(state => ({
      stats: {
        ...state.stats,
        totalSnapshots,
        totalSize,
        compressedSize,
        deduplicationSavings: totalSize - compressedSize,
        successRate,
        failureCount: totalSnapshots - completedSnapshots.length,
        storageEfficiency: totalSize > 0 ? ((totalSize - compressedSize) / totalSize) * 100 : 0
      }
    }));
  },
  
  refreshMetrics: () => {
    set(state => ({
      metrics: {
        ...state.metrics,
        performance: {
          ...state.metrics.performance,
          backupSpeed: Math.random() * 100,
          restoreSpeed: Math.random() * 150,
          compressionRatio: Math.random() * 0.8,
          deduplicationRatio: Math.random() * 0.3,
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          diskIo: Math.random() * 100,
          networkIo: Math.random() * 100
        },
        reliability: {
          ...state.metrics.reliability,
          uptime: 99.5 + Math.random() * 0.5,
          errorRate: Math.random() * 0.05,
          recoveryTime: Math.random() * 60,
          dataIntegrity: 99.9 + Math.random() * 0.1
        }
      }
    }));
  },
  
  // Search and Filter
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedPolicy: (policyId) => set({ selectedPolicy: policyId }),
  setSelectedDestination: (destinationId) => set({ selectedDestination: destinationId }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // System
  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Initialize with demo data
      const demoSnapshots: BackupSnapshot[] = [
        {
          id: 'snap_1',
          timestamp: new Date(Date.now() - 86400000),
          type: 'full',
          description: 'Daily full backup',
          files: [],
          changes: [],
          size: 1024 * 1024 * 500,
          compressedSize: 1024 * 1024 * 300,
          compressionRatio: 0.6,
          duration: 180,
          status: 'completed',
          tags: ['daily', 'full'],
          metadata: {
            version: '1.0',
            environment: 'production',
            user: 'system',
            machine: 'backup-01',
            checksum: 'sha256:abc123'
          }
        },
        {
          id: 'snap_2',
          timestamp: new Date(Date.now() - 43200000),
          type: 'incremental',
          description: 'Incremental backup',
          files: [],
          changes: [],
          size: 1024 * 1024 * 50,
          compressedSize: 1024 * 1024 * 25,
          compressionRatio: 0.5,
          duration: 30,
          status: 'completed',
          parentSnapshotId: 'snap_1',
          tags: ['incremental'],
          metadata: {
            version: '1.0',
            environment: 'production',
            user: 'system',
            machine: 'backup-01',
            checksum: 'sha256:def456'
          }
        }
      ];
      
      const demoPolicies: BackupPolicy[] = [
        {
          id: 'policy_1',
          name: 'Daily Backup',
          description: 'Daily incremental backup with weekly full backup',
          enabled: true,
          schedule: {
            frequency: 'daily',
            interval: 1,
            time: '02:00',
            timezone: 'UTC'
          },
          retention: {
            maxSnapshots: 30,
            maxAge: 90,
            keepDaily: 7,
            keepWeekly: 4,
            keepMonthly: 12,
            keepYearly: 5
          },
          filters: {
            includePaths: ['/home', '/var/www'],
            excludePaths: ['/tmp', '/var/cache'],
            includeExtensions: [],
            excludeExtensions: ['.tmp', '.log'],
            maxFileSize: 1024 * 1024 * 100,
            followSymlinks: false
          },
          compression: {
            enabled: true,
            algorithm: 'zstd',
            level: 3
          },
          encryption: {
            enabled: false,
            algorithm: 'aes256',
            keyDerivation: 'pbkdf2'
          }
        }
      ];
      
      const demoDestinations: BackupDestination[] = [
        {
          id: 'dest_1',
          name: 'Local Storage',
          type: 'local',
          enabled: true,
          config: {
            path: '/backup/storage'
          },
          status: 'connected',
          lastSync: new Date(),
          capacity: {
            total: 1024 * 1024 * 1024 * 1000,
            used: 1024 * 1024 * 1024 * 300,
            available: 1024 * 1024 * 1024 * 700
          },
          performance: {
            uploadSpeed: 100,
            downloadSpeed: 150,
            latency: 5
          }
        }
      ];
      
      set({
        snapshots: demoSnapshots,
        policies: demoPolicies,
        destinations: demoDestinations,
        isLoading: false
      });
      
      // Refresh stats and metrics
      get().refreshStats();
      get().refreshMetrics();
    } catch (error) {
      set({ error: 'Failed to initialize backup system', isLoading: false });
    }
  },
  
  cleanup: () => {
    set({
      snapshots: [],
      policies: [],
      destinations: [],
      restoreOperations: [],
      currentSnapshot: null,
      currentRestore: null,
      selectedFiles: [],
      error: null
    });
  },
  
  reset: () => {
    set({
      snapshots: [],
      policies: [],
      destinations: [],
      restoreOperations: [],
      currentSnapshot: null,
      currentRestore: null,
      selectedFiles: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      selectedPolicy: 'all',
      selectedDestination: 'all',
      sortBy: 'timestamp',
      viewMode: 'list'
    });
  }
})));

// Manager Class
export class IncrementalBackupManager {
  private static instance: IncrementalBackupManager;
  
  private constructor() {}
  
  static getInstance(): IncrementalBackupManager {
    if (!IncrementalBackupManager.instance) {
      IncrementalBackupManager.instance = new IncrementalBackupManager();
    }
    return IncrementalBackupManager.instance;
  }
  
  async startBackup(type: 'full' | 'incremental' | 'differential', description?: string): Promise<boolean> {
    return useIncrementalBackupStore.getState().createSnapshot(type, description);
  }
  
  async restoreFiles(snapshotId: string, targetPath: string, files?: string[]): Promise<boolean> {
    return useIncrementalBackupStore.getState().restoreSnapshot(snapshotId, targetPath, files);
  }
  
  getBackupStats(): BackupStats {
    return useIncrementalBackupStore.getState().stats;
  }
  
  getBackupMetrics(): BackupMetrics {
    return useIncrementalBackupStore.getState().metrics;
  }
}

// Global instance
export const incrementalBackupManager = IncrementalBackupManager.getInstance();

// Export store
export { useIncrementalBackupStore };

// Utility functions
export const formatBackupSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatBackupDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const getBackupStatusColor = (status: BackupSnapshot['status']): string => {
  switch (status) {
    case 'completed': return 'green';
    case 'running': return 'blue';
    case 'failed': return 'red';
    case 'cancelled': return 'gray';
    case 'pending': return 'yellow';
    default: return 'gray';
  }
};

export const getBackupTypeIcon = (type: BackupSnapshot['type']): string => {
  switch (type) {
    case 'full': return 'database';
    case 'incremental': return 'plus-circle';
    case 'differential': return 'delta';
    default: return 'archive';
  }
};

export const calculateBackupHealth = (snapshots: BackupSnapshot[]): number => {
  if (snapshots.length === 0) return 0;
  
  const recentSnapshots = snapshots.filter(s => {
    const daysSince = (Date.now() - s.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });
  
  const successfulSnapshots = recentSnapshots.filter(s => s.status === 'completed');
  const successRate = recentSnapshots.length > 0 ? (successfulSnapshots.length / recentSnapshots.length) * 100 : 0;
  
  return Math.round(successRate);
};

export const generateBackupRecommendations = (stats: BackupStats, config: BackupConfig): string[] => {
  const recommendations: string[] = [];
  
  if (stats.successRate < 95) {
    recommendations.push('Consider reviewing backup policies to improve success rate');
  }
  
  if (stats.storageEfficiency < 50) {
    recommendations.push('Enable compression to improve storage efficiency');
  }
  
  if (stats.failureCount > 5) {
    recommendations.push('Investigate recent backup failures and fix underlying issues');
  }
  
  const daysSinceLastBackup = (Date.now() - stats.lastBackupTime.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLastBackup > 1) {
    recommendations.push('Schedule more frequent backups to reduce data loss risk');
  }
  
  return recommendations;
};