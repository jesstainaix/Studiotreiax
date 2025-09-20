import {
  OptimizationSettings,
  PerformanceMetrics,
  HardwareInfo,
  Bottleneck,
  PerformanceRecommendation,
  PerformanceProfile,
  PerformanceConfig
} from '../types/performance';
import { PerformanceEngine } from './performanceEngine';

interface OptimizationRule {
  id: string;
  name: string;
  condition: (metrics: PerformanceMetrics, hardware: HardwareInfo) => boolean;
  apply: (currentSettings: OptimizationSettings) => Partial<OptimizationSettings>;
  priority: number;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

interface OptimizationResult {
  applied: boolean;
  changes: Partial<OptimizationSettings>;
  reason: string;
  estimatedImprovement: number;
  rules: string[];
}

class AutoOptimizer {
  private static instance: AutoOptimizer;
  private performanceEngine: PerformanceEngine;
  private optimizationRules: OptimizationRule[];
  private profiles: PerformanceProfile[];
  private isEnabled = true;
  private lastOptimization = 0;
  private optimizationCooldown = 30000; // 30 seconds

  constructor() {
    this.performanceEngine = PerformanceEngine.getInstance();
    this.initializeOptimizationRules();
    this.initializeProfiles();
  }

  static getInstance(): AutoOptimizer {
    if (!AutoOptimizer.instance) {
      AutoOptimizer.instance = new AutoOptimizer();
    }
    return AutoOptimizer.instance;
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      // CPU Optimization Rules
      {
        id: 'high-cpu-reduce-quality',
        name: 'Reduce Quality on High CPU',
        condition: (metrics, hardware) => metrics.cpu.usage > 80,
        apply: (settings) => ({
          quality: this.downgradeQuality(settings.quality),
          renderSettings: {
            ...settings.renderSettings,
            fps: Math.max(24, settings.renderSettings.fps - 6)
          }
        }),
        priority: 8,
        impact: 'high',
        description: 'Reduces video quality and FPS to lower CPU usage'
      },
      {
        id: 'cpu-cache-optimization',
        name: 'Optimize Cache for CPU',
        condition: (metrics, hardware) => metrics.cpu.usage > 70 && hardware.cpu.cores < 4,
        apply: (settings) => ({
          cacheSettings: {
            ...settings.cacheSettings,
            enabled: true,
            preloadFrames: Math.max(5, settings.cacheSettings.preloadFrames - 5)
          }
        }),
        priority: 6,
        impact: 'medium',
        description: 'Optimizes cache settings for low-core CPUs'
      },

      // Memory Optimization Rules
      {
        id: 'high-memory-clear-cache',
        name: 'Clear Cache on High Memory',
        condition: (metrics, hardware) => metrics.memory.percentage > 85,
        apply: (settings) => ({
          cacheSettings: {
            ...settings.cacheSettings,
            maxSize: Math.max(50 * 1024 * 1024, settings.cacheSettings.maxSize * 0.7),
            preloadFrames: Math.max(3, Math.floor(settings.cacheSettings.preloadFrames * 0.6))
          },
          memorySettings: {
            ...settings.memorySettings,
            garbageCollection: true,
            maxUsage: Math.max(60, settings.memorySettings.maxUsage - 10)
          }
        }),
        priority: 9,
        impact: 'high',
        description: 'Reduces cache size and enables aggressive garbage collection'
      },
      {
        id: 'memory-buffer-optimization',
        name: 'Optimize Memory Buffers',
        condition: (metrics, hardware) => metrics.memory.percentage > 70,
        apply: (settings) => ({
          memorySettings: {
            ...settings.memorySettings,
            bufferSize: Math.max(1024 * 1024, settings.memorySettings.bufferSize * 0.8)
          }
        }),
        priority: 5,
        impact: 'medium',
        description: 'Reduces buffer sizes to save memory'
      },

      // FPS/Render Optimization Rules
      {
        id: 'low-fps-optimization',
        name: 'Optimize for Low FPS',
        condition: (metrics, hardware) => metrics.render.fps < 25,
        apply: (settings) => ({
          renderSettings: {
            ...settings.renderSettings,
            resolution: this.downgradeResolution(settings.renderSettings.resolution),
            bitrate: Math.max(1000000, settings.renderSettings.bitrate * 0.8)
          },
          quality: this.downgradeQuality(settings.quality)
        }),
        priority: 10,
        impact: 'high',
        description: 'Reduces resolution and bitrate to improve FPS'
      },
      {
        id: 'frame-dropping-optimization',
        name: 'Handle Frame Dropping',
        condition: (metrics, hardware) => metrics.render.droppedFrames > 5,
        apply: (settings) => ({
          renderSettings: {
            ...settings.renderSettings,
            fps: Math.max(24, settings.renderSettings.fps - 6)
          },
          cacheSettings: {
            ...settings.cacheSettings,
            preloadFrames: Math.min(20, settings.cacheSettings.preloadFrames + 3)
          }
        }),
        priority: 7,
        impact: 'medium',
        description: 'Adjusts FPS and preload settings to reduce frame drops'
      },

      // Hardware-Specific Optimizations
      {
        id: 'low-end-hardware-optimization',
        name: 'Low-End Hardware Profile',
        condition: (metrics, hardware) => 
          hardware.cpu.cores <= 2 || hardware.memory.total < 4 * 1024 * 1024 * 1024,
        apply: (settings) => ({
          quality: 'low',
          performance: 'performance',
          renderSettings: {
            ...settings.renderSettings,
            resolution: '1280x720',
            fps: 24,
            bitrate: 2000000
          },
          cacheSettings: {
            ...settings.cacheSettings,
            maxSize: 25 * 1024 * 1024,
            preloadFrames: 3
          }
        }),
        priority: 4,
        impact: 'high',
        description: 'Applies low-end hardware optimizations'
      },
      {
        id: 'high-end-hardware-optimization',
        name: 'High-End Hardware Profile',
        condition: (metrics, hardware) => 
          hardware.cpu.cores >= 8 && hardware.memory.total >= 16 * 1024 * 1024 * 1024,
        apply: (settings) => ({
          quality: 'ultra',
          performance: 'balanced',
          renderSettings: {
            ...settings.renderSettings,
            resolution: '3840x2160',
            fps: 60,
            bitrate: 20000000
          },
          cacheSettings: {
            ...settings.cacheSettings,
            maxSize: 500 * 1024 * 1024,
            preloadFrames: 15
          }
        }),
        priority: 2,
        impact: 'medium',
        description: 'Enables high-quality settings for powerful hardware'
      },

      // Battery/Power Optimizations
      {
        id: 'battery-optimization',
        name: 'Battery Saving Mode',
        condition: (metrics, hardware) => {
          // Check if on battery (if available)
          const battery = (navigator as any).getBattery?.();
          return battery?.charging === false && battery?.level < 0.3;
        },
        apply: (settings) => ({
          performance: 'battery',
          quality: this.downgradeQuality(settings.quality),
          renderSettings: {
            ...settings.renderSettings,
            fps: Math.max(24, settings.renderSettings.fps - 12)
          }
        }),
        priority: 3,
        impact: 'medium',
        description: 'Optimizes settings for battery conservation'
      }
    ];

    // Sort rules by priority (higher priority first)
    this.optimizationRules.sort((a, b) => b.priority - a.priority);
  }

  private initializeProfiles(): void {
    this.profiles = [
      {
        id: 'performance',
        name: 'Performance',
        description: 'Optimized for maximum performance',
        settings: {
          autoOptimize: true,
          quality: 'medium',
          performance: 'performance',
          renderSettings: {
            resolution: '1920x1080',
            bitrate: 8000000,
            fps: 30,
            codec: 'h264'
          },
          cacheSettings: {
            enabled: true,
            maxSize: 100 * 1024 * 1024,
            preloadFrames: 5
          },
          memorySettings: {
            maxUsage: 70,
            garbageCollection: true,
            bufferSize: 2 * 1024 * 1024
          }
        },
        hardwareRequirements: {
          minCpu: 2,
          minMemory: 4 * 1024 * 1024 * 1024
        },
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'quality',
        name: 'Quality',
        description: 'Optimized for maximum quality',
        settings: {
          autoOptimize: true,
          quality: 'ultra',
          performance: 'balanced',
          renderSettings: {
            resolution: '3840x2160',
            bitrate: 25000000,
            fps: 60,
            codec: 'h265'
          },
          cacheSettings: {
            enabled: true,
            maxSize: 500 * 1024 * 1024,
            preloadFrames: 15
          },
          memorySettings: {
            maxUsage: 85,
            garbageCollection: false,
            bufferSize: 8 * 1024 * 1024
          }
        },
        hardwareRequirements: {
          minCpu: 8,
          minMemory: 16 * 1024 * 1024 * 1024
        },
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'balanced',
        name: 'Balanced',
        description: 'Balanced performance and quality',
        settings: {
          autoOptimize: true,
          quality: 'high',
          performance: 'balanced',
          renderSettings: {
            resolution: '1920x1080',
            bitrate: 12000000,
            fps: 30,
            codec: 'h264'
          },
          cacheSettings: {
            enabled: true,
            maxSize: 200 * 1024 * 1024,
            preloadFrames: 10
          },
          memorySettings: {
            maxUsage: 75,
            garbageCollection: true,
            bufferSize: 4 * 1024 * 1024
          }
        },
        hardwareRequirements: {
          minCpu: 4,
          minMemory: 8 * 1024 * 1024 * 1024
        },
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
  }

  // Main optimization method
  async optimize(currentSettings: OptimizationSettings): Promise<OptimizationResult> {
    if (!this.isEnabled) {
      return {
        applied: false,
        changes: {},
        reason: 'Auto-optimization is disabled',
        estimatedImprovement: 0,
        rules: []
      };
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastOptimization < this.optimizationCooldown) {
      return {
        applied: false,
        changes: {},
        reason: 'Optimization cooldown active',
        estimatedImprovement: 0,
        rules: []
      };
    }

    const metrics = this.performanceEngine.getCurrentMetrics();
    const hardware = this.performanceEngine.getHardwareInfo();

    if (!metrics || !hardware) {
      return {
        applied: false,
        changes: {},
        reason: 'Performance data not available',
        estimatedImprovement: 0,
        rules: []
      };
    }

    // Find applicable rules
    const applicableRules = this.optimizationRules.filter(rule => 
      rule.condition(metrics, hardware)
    );

    if (applicableRules.length === 0) {
      return {
        applied: false,
        changes: {},
        reason: 'No optimization rules applicable',
        estimatedImprovement: 0,
        rules: []
      };
    }

    // Apply rules in priority order
    let optimizedSettings = { ...currentSettings };
    const appliedRules: string[] = [];
    let totalImprovement = 0;

    for (const rule of applicableRules) {
      const changes = rule.apply(optimizedSettings);
      optimizedSettings = { ...optimizedSettings, ...changes };
      appliedRules.push(rule.name);
      
      // Estimate improvement based on rule impact
      const improvement = this.estimateImprovement(rule, metrics);
      totalImprovement += improvement;
    }

    this.lastOptimization = now;

    return {
      applied: true,
      changes: this.getChanges(currentSettings, optimizedSettings),
      reason: `Applied ${appliedRules.length} optimization rules`,
      estimatedImprovement: Math.min(100, totalImprovement),
      rules: appliedRules
    };
  }

  // Generate recommendations without applying them
  generateRecommendations(currentSettings: OptimizationSettings): PerformanceRecommendation[] {
    const metrics = this.performanceEngine.getCurrentMetrics();
    const hardware = this.performanceEngine.getHardwareInfo();

    if (!metrics || !hardware) return [];

    const recommendations: PerformanceRecommendation[] = [];

    // Check each rule and generate recommendations
    this.optimizationRules.forEach(rule => {
      if (rule.condition(metrics, hardware)) {
        const changes = rule.apply(currentSettings);
        const improvement = this.estimateImprovement(rule, metrics);

        recommendations.push({
          id: rule.id,
          category: this.getCategoryFromRule(rule),
          title: rule.name,
          description: rule.description,
          impact: rule.impact,
          difficulty: 'easy',
          settings: changes,
          estimatedImprovement: improvement
        });
      }
    });

    return recommendations.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
  }

  // Profile management
  getOptimalProfile(hardware: HardwareInfo): PerformanceProfile {
    // Find the best profile based on hardware capabilities
    const suitableProfiles = this.profiles.filter(profile => 
      hardware.cpu.cores >= profile.hardwareRequirements.minCpu &&
      hardware.memory.total >= profile.hardwareRequirements.minMemory
    );

    if (suitableProfiles.length === 0) {
      return this.profiles.find(p => p.id === 'performance') || this.profiles[0];
    }

    // Return the highest quality profile that meets requirements
    return suitableProfiles.reduce((best, current) => {
      const bestScore = this.calculateProfileScore(best, hardware);
      const currentScore = this.calculateProfileScore(current, hardware);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateProfileScore(profile: PerformanceProfile, hardware: HardwareInfo): number {
    let score = 0;
    
    // Quality bonus
    const qualityScores = { low: 1, medium: 2, high: 3, ultra: 4 };
    score += qualityScores[profile.settings.quality] * 10;
    
    // Hardware utilization efficiency
    const cpuRatio = profile.hardwareRequirements.minCpu / hardware.cpu.cores;
    const memoryRatio = profile.hardwareRequirements.minMemory / hardware.memory.total;
    
    // Prefer profiles that use hardware efficiently but don't exceed it
    if (cpuRatio <= 1 && memoryRatio <= 1) {
      score += (1 - Math.max(cpuRatio, memoryRatio)) * 20;
    }
    
    return score;
  }

  // Utility methods
  private downgradeQuality(current: string): 'low' | 'medium' | 'high' | 'ultra' {
    const qualities = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualities.indexOf(current);
    return qualities[Math.max(0, currentIndex - 1)] as any;
  }

  private downgradeResolution(current: string): string {
    const resolutions = ['640x360', '854x480', '1280x720', '1920x1080', '2560x1440', '3840x2160'];
    const currentIndex = resolutions.indexOf(current);
    return resolutions[Math.max(0, currentIndex - 1)] || '1280x720';
  }

  private estimateImprovement(rule: OptimizationRule, metrics: PerformanceMetrics): number {
    // Estimate improvement based on rule type and current metrics
    const impactMultipliers = { low: 5, medium: 15, high: 30 };
    const baseImprovement = impactMultipliers[rule.impact];
    
    // Adjust based on current performance issues
    let multiplier = 1;
    if (rule.id.includes('cpu') && metrics.cpu.usage > 80) multiplier = 1.5;
    if (rule.id.includes('memory') && metrics.memory.percentage > 85) multiplier = 1.5;
    if (rule.id.includes('fps') && metrics.render.fps < 30) multiplier = 1.3;
    
    return Math.min(50, baseImprovement * multiplier);
  }

  private getCategoryFromRule(rule: OptimizationRule): 'quality' | 'performance' | 'memory' | 'cache' | 'render' {
    if (rule.id.includes('quality')) return 'quality';
    if (rule.id.includes('memory')) return 'memory';
    if (rule.id.includes('cache')) return 'cache';
    if (rule.id.includes('fps') || rule.id.includes('render')) return 'render';
    return 'performance';
  }

  private getChanges(original: OptimizationSettings, optimized: OptimizationSettings): Partial<OptimizationSettings> {
    const changes: Partial<OptimizationSettings> = {};
    
    if (original.quality !== optimized.quality) {
      changes.quality = optimized.quality;
    }
    
    if (original.performance !== optimized.performance) {
      changes.performance = optimized.performance;
    }
    
    // Compare render settings
    if (JSON.stringify(original.renderSettings) !== JSON.stringify(optimized.renderSettings)) {
      changes.renderSettings = optimized.renderSettings;
    }
    
    // Compare cache settings
    if (JSON.stringify(original.cacheSettings) !== JSON.stringify(optimized.cacheSettings)) {
      changes.cacheSettings = optimized.cacheSettings;
    }
    
    // Compare memory settings
    if (JSON.stringify(original.memorySettings) !== JSON.stringify(optimized.memorySettings)) {
      changes.memorySettings = optimized.memorySettings;
    }
    
    return changes;
  }

  // Public API
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isOptimizationEnabled(): boolean {
    return this.isEnabled;
  }

  getProfiles(): PerformanceProfile[] {
    return [...this.profiles];
  }

  addProfile(profile: PerformanceProfile): void {
    this.profiles.push(profile);
  }

  updateProfile(id: string, updates: Partial<PerformanceProfile>): void {
    const index = this.profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.profiles[index] = { ...this.profiles[index], ...updates, updatedAt: Date.now() };
    }
  }

  deleteProfile(id: string): void {
    this.profiles = this.profiles.filter(p => p.id !== id);
  }

  setCooldown(milliseconds: number): void {
    this.optimizationCooldown = milliseconds;
  }
}

export default AutoOptimizer;
export { AutoOptimizer, type OptimizationResult };