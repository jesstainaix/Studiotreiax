// Performance System Types

// Optimization Level
export enum OptimizationLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  ULTRA = 'ULTRA'
}

// Hardware Information
export interface HardwareInfo {
  cores: number;
  memory: number;
  gpu: {
    tier: number;
  };
}

// Performance Metrics
export interface PerformanceMetrics {
  fps: number;
  averageFPS: number;
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  };
  cpuUsage: number;
}

// Optimization Settings
export interface OptimizationSettings {
  level: OptimizationLevel;
  enableGPUAcceleration: boolean;
  maxTextureSize: number;
  enableLOD: boolean;
  cullingDistance: number;
}

// Bottleneck
export interface Bottleneck {
  type: 'memory' | 'render';
  severity: 'warning' | 'critical';
  value: number;
}