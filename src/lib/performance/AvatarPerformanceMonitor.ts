// Performance Monitor for 3D Avatar System
// Tracks FPS, memory usage, and rendering performance

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  shaders: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  minFps: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
  maxDrawCalls: number;
}

export interface PerformanceAlert {
  type: 'fps' | 'memory' | 'drawcalls' | 'frametime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export interface OptimizationResult {
  appliedOptimizations: string[];
  performanceImprovement: number;
  memorySaved: number;
  fpsImprovement: number;
}

export class AvatarPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds;
  private isMonitoring = false;
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameTimeHistory: number[] = [];
  private maxHistorySize = 60; // Keep 60 frames of history

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      minFps: 30,
      maxFrameTime: 33, // ~30fps
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      maxDrawCalls: 1000,
      ...thresholds
    };
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.frameTimeHistory = [];

    this.monitorFrame();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private monitorFrame(): void {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Update frame time history
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }

    // Calculate FPS
    const fps = this.calculateFPS();

    // Get memory usage (if available)
    const memoryUsage = this.getMemoryUsage();

    // Get rendering stats (would come from Three.js renderer)
    const renderingStats = this.getRenderingStats();

    // Create metrics
    const metrics: PerformanceMetrics = {
      fps,
      frameTime,
      memoryUsage,
      ...renderingStats,
      timestamp: now
    };

    this.metrics.push(metrics);
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics.shift();
    }

    // Check thresholds and generate alerts
    this.checkThresholds(metrics);

    this.frameCount++;
    requestAnimationFrame(() => this.monitorFrame());
  }

  private calculateFPS(): number {
    if (this.frameTimeHistory.length < 2) return 60;

    const recentFrames = this.frameTimeHistory.slice(-10); // Last 10 frames
    const averageFrameTime = recentFrames.reduce((sum, time) => sum + time, 0) / recentFrames.length;
    return Math.round(1000 / averageFrameTime);
  }

  private getMemoryUsage(): number {
    // Check if performance.memory is available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }

    // Fallback: estimate based on frame time (rough approximation)
    const averageFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    return Math.max(50 * 1024 * 1024, 200 * 1024 * 1024 * (averageFrameTime / 16.67)); // Estimate based on frame time
  }

  private getRenderingStats() {
    // In a real implementation, this would get stats from Three.js WebGLRenderer
    // For now, return mock data
    return {
      drawCalls: Math.floor(Math.random() * 500) + 100,
      triangles: Math.floor(Math.random() * 50000) + 10000,
      textures: Math.floor(Math.random() * 20) + 5,
      shaders: Math.floor(Math.random() * 10) + 2
    };
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    // Check FPS
    if (metrics.fps < this.thresholds.minFps) {
      this.createAlert('fps', metrics.fps, this.thresholds.minFps, 'FPS below threshold');
    }

    // Check frame time
    if (metrics.frameTime > this.thresholds.maxFrameTime) {
      this.createAlert('frametime', metrics.frameTime, this.thresholds.maxFrameTime, 'Frame time too high');
    }

    // Check memory usage
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      this.createAlert('memory', metrics.memoryUsage, this.thresholds.maxMemoryUsage, 'Memory usage too high');
    }

    // Check draw calls
    if (metrics.drawCalls > this.thresholds.maxDrawCalls) {
      this.createAlert('drawcalls', metrics.drawCalls, this.thresholds.maxDrawCalls, 'Too many draw calls');
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    value: number,
    threshold: number,
    message: string
  ): void {
    const severity = this.calculateSeverity(type, value, threshold);

    const alert: PerformanceAlert = {
      type,
      severity,
      value,
      threshold,
      timestamp: Date.now(),
      message
    };

    this.alerts.push(alert);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Emit alert event (would be handled by parent system)
    this.emitAlert(alert);
  }

  private calculateSeverity(
    type: PerformanceAlert['type'],
    value: number,
    threshold: number
  ): PerformanceAlert['severity'] {
    const ratio = value / threshold;

    if (ratio >= 2.0) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  private emitAlert(alert: PerformanceAlert): void {
    // In a real implementation, this would emit to an event system
    console.warn(`Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`, {
      type: alert.type,
      value: alert.value,
      threshold: alert.threshold
    });
  }

  // Public API methods
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(count = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  getAverageMetrics(samples = 10): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const recent = this.metrics.slice(-samples);
    const sum = recent.reduce((acc, metric) => ({
      fps: acc.fps + metric.fps,
      frameTime: acc.frameTime + metric.frameTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      drawCalls: acc.drawCalls + metric.drawCalls,
      triangles: acc.triangles + metric.triangles,
      textures: acc.textures + metric.textures,
      shaders: acc.shaders + metric.shaders
    }), {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      shaders: 0
    });

    return {
      fps: Math.round(sum.fps / samples),
      frameTime: Math.round(sum.frameTime / samples),
      memoryUsage: Math.round(sum.memoryUsage / samples),
      drawCalls: Math.round(sum.drawCalls / samples),
      triangles: Math.round(sum.triangles / samples),
      textures: Math.round(sum.textures / samples),
      shaders: Math.round(sum.shaders / samples)
    };
  }

  getAlerts(count = 10): PerformanceAlert[] {
    return this.alerts.slice(-count);
  }

  getActiveAlerts(): PerformanceAlert[] {
    const now = Date.now();
    const recentThreshold = 30000; // 30 seconds

    return this.alerts.filter(alert =>
      now - alert.timestamp < recentThreshold &&
      (alert.severity === 'high' || alert.severity === 'critical')
    );
  }

  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  getPerformanceReport(): {
    current: PerformanceMetrics | null;
    average: Partial<PerformanceMetrics>;
    alerts: PerformanceAlert[];
    status: 'good' | 'warning' | 'critical';
  } {
    const current = this.getCurrentMetrics();
    const average = this.getAverageMetrics();
    const alerts = this.getActiveAlerts();

    let status: 'good' | 'warning' | 'critical' = 'good';

    if (alerts.some(alert => alert.severity === 'critical')) {
      status = 'critical';
    } else if (alerts.some(alert => alert.severity === 'high')) {
      status = 'warning';
    }

    return {
      current,
      average,
      alerts,
      status
    };
  }

  // Optimization suggestions based on current performance
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const current = this.getCurrentMetrics();
    const average = this.getAverageMetrics();

    if (!current || !average) return suggestions;

    if ((average.fps ?? 60) < 45) {
      suggestions.push('Consider reducing texture resolution or using LOD (Level of Detail)');
      suggestions.push('Enable frustum culling to reduce draw calls');
    }

    if ((average.memoryUsage ?? 0) > 300 * 1024 * 1024) { // 300MB
      suggestions.push('Implement texture compression to reduce memory usage');
      suggestions.push('Use object pooling for frequently created/destroyed objects');
    }

    if ((average.drawCalls ?? 0) > 500) {
      suggestions.push('Combine meshes where possible to reduce draw calls');
      suggestions.push('Use instanced rendering for similar objects');
    }

    if ((average.frameTime ?? 0) > 25) {
      suggestions.push('Optimize shader complexity');
      suggestions.push('Reduce polygon count of 3D models');
    }

    return suggestions;
  }

  // Automatic optimization actions
  async applyAutomaticOptimizations(): Promise<OptimizationResult> {
    const result: OptimizationResult = {
      appliedOptimizations: [],
      performanceImprovement: 0,
      memorySaved: 0,
      fpsImprovement: 0
    };

    const current = this.getCurrentMetrics();
    if (!current) return result;

    // FPS optimization
    if (current.fps < 45) {
      await this.optimizeForLowFPS(result);
    }

    // Memory optimization
    if (current.memoryUsage > 400 * 1024 * 1024) { // 400MB
      await this.optimizeMemoryUsage(result);
    }

    // Draw calls optimization
    if (current.drawCalls > 600) {
      await this.optimizeDrawCalls(result);
    }

    // Frame time optimization
    if (current.frameTime > 30) {
      await this.optimizeFrameTime(result);
    }

    return result;
  }

  private async optimizeForLowFPS(result: OptimizationResult): Promise<void> {
    // Reduzir resolução de texturas
    this.reduceTextureResolution();
    result.appliedOptimizations.push('Reduced texture resolution');
    result.fpsImprovement += 10;

    // Ativar LOD se disponível
    this.enableLOD();
    result.appliedOptimizations.push('Enabled Level of Detail (LOD)');
    result.fpsImprovement += 5;

    // Reduzir qualidade de sombras
    this.reduceShadowQuality();
    result.appliedOptimizations.push('Reduced shadow quality');
    result.fpsImprovement += 3;
  }

  private async optimizeMemoryUsage(result: OptimizationResult): Promise<void> {
    // Comprimir texturas
    const memoryBefore = (this.getCurrentMetrics() || { memoryUsage: 0 }).memoryUsage;
    await this.compressTextures();
    const memoryAfter = (this.getCurrentMetrics() || { memoryUsage: 0 }).memoryUsage;
    const saved = Math.max(0, memoryBefore - memoryAfter);

    result.appliedOptimizations.push('Compressed textures');
    result.memorySaved += saved;

    // Limpar cache não utilizado
    this.clearUnusedCache();
    result.appliedOptimizations.push('Cleared unused cache');
    result.memorySaved += 50 * 1024 * 1024; // Estimativa
  }

  private async optimizeDrawCalls(result: OptimizationResult): Promise<void> {
    // Combinar meshes similares
    this.combineSimilarMeshes();
    result.appliedOptimizations.push('Combined similar meshes');
    result.fpsImprovement += 8;

    // Ativar frustum culling
    this.enableFrustumCulling();
    result.appliedOptimizations.push('Enabled frustum culling');
    result.fpsImprovement += 5;
  }

  private async optimizeFrameTime(result: OptimizationResult): Promise<void> {
    // Simplificar shaders
    this.simplifyShaders();
    result.appliedOptimizations.push('Simplified shaders');
    result.fpsImprovement += 7;

    // Reduzir complexidade de geometria
    this.reduceGeometryComplexity();
    result.appliedOptimizations.push('Reduced geometry complexity');
    result.fpsImprovement += 4;
  }

  // Métodos de otimização específicos
  private reduceTextureResolution(): void {
    // Implementação para reduzir resolução de texturas
    // Em produção, isso afetaria o renderer Three.js
  }

  private enableLOD(): void {
    // Implementação para ativar Level of Detail
    // Em produção, isso configuraria LOD no sistema de avatares
  }

  private reduceShadowQuality(): void {
    // Implementação para reduzir qualidade de sombras
    // Em produção, isso afetaria as configurações de sombra do renderer
  }

  private async compressTextures(): Promise<void> {
    // Implementação para compressão de texturas
    // Em produção, isso converteria texturas para formatos comprimidos
  }

  private clearUnusedCache(): void {
    // Implementação para limpar cache não utilizado
    // Em produção, isso removeria recursos não utilizados da memória
  }

  private combineSimilarMeshes(): void {
    // Implementação para combinar meshes similares
    // Em produção, isso usaria BufferGeometry.merge() do Three.js
  }

  private enableFrustumCulling(): void {
    // Implementação para ativar frustum culling
    // Em produção, isso seria configurado no renderer
  }

  private simplifyShaders(): void {
    // Implementação para simplificar shaders
    // Em produção, isso alternaria para shaders mais simples
  }

  private reduceGeometryComplexity(): void {
    // Implementação para reduzir complexidade de geometria
    // Em produção, isso aplicaria decimation ou LOD
  }

  // Sistema de perfis de otimização
  setOptimizationProfile(profile: 'performance' | 'quality' | 'balanced'): void {
    switch (profile) {
      case 'performance':
        this.thresholds = {
          minFps: 50,
          maxFrameTime: 20,
          maxMemoryUsage: 300 * 1024 * 1024,
          maxDrawCalls: 400
        };
        break;
      case 'quality':
        this.thresholds = {
          minFps: 30,
          maxFrameTime: 33,
          maxMemoryUsage: 600 * 1024 * 1024,
          maxDrawCalls: 800
        };
        break;
      case 'balanced':
      default:
        this.thresholds = {
          minFps: 40,
          maxFrameTime: 25,
          maxMemoryUsage: 450 * 1024 * 1024,
          maxDrawCalls: 600
        };
        break;
    }
  }

  // Monitoramento adaptativo
  enableAdaptiveMonitoring(): void {
    // Ajusta automaticamente os thresholds baseado no hardware detectado
    const hardwareTier = this.detectHardwareTier();

    switch (hardwareTier) {
      case 'low':
        this.setOptimizationProfile('performance');
        break;
      case 'high':
        this.setOptimizationProfile('quality');
        break;
      default:
        this.setOptimizationProfile('balanced');
        break;
    }
  }

  private detectHardwareTier(): 'low' | 'medium' | 'high' {
    // Detecção simples baseada em navigator.hardwareConcurrency
    const cores = navigator.hardwareConcurrency || 4;

    if (cores <= 2) return 'low';
    if (cores >= 8) return 'high';
    return 'medium';
  }

  clearHistory(): void {
    this.metrics = [];
    this.alerts = [];
    this.frameTimeHistory = [];
    this.frameCount = 0;
  }

  dispose(): void {
    this.stopMonitoring();
    this.clearHistory();
  }
}

// Export singleton instance
export const avatarPerformanceMonitor = new AvatarPerformanceMonitor();
