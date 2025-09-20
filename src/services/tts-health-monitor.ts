import { EnhancedTTSService, EnhancedTTSConfig } from './enhanced-tts-service';

interface ProviderHealth {
  provider: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  successCount: number;
  uptime: number;
  lastError?: string;
}

interface HealthCheckResult {
  provider: string;
  success: boolean;
  responseTime: number;
  error?: string;
}

interface TTSHealthMonitorConfig {
  checkInterval: number; // milliseconds
  maxRetries: number;
  timeoutMs: number;
  failureThreshold: number; // number of consecutive failures before marking unhealthy
  recoveryThreshold: number; // number of consecutive successes before marking healthy
}

export class TTSHealthMonitor {
  private config: TTSHealthMonitorConfig;
  private ttsService: EnhancedTTSService;
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private listeners: Array<(health: Map<string, ProviderHealth>) => void> = [];

  constructor(ttsService: EnhancedTTSService, config?: Partial<TTSHealthMonitorConfig>) {
    this.ttsService = ttsService;
    this.config = {
      checkInterval: 60000, // 1 minute
      maxRetries: 3,
      timeoutMs: 10000, // 10 seconds
      failureThreshold: 3,
      recoveryThreshold: 2,
      ...config
    };

    // Initialize provider health status
    this.initializeProviderHealth();
  }

  private initializeProviderHealth(): void {
    const providers = ['elevenlabs', 'azure', 'google'];
    
    providers.forEach(provider => {
      this.providerHealth.set(provider, {
        provider,
        isHealthy: true,
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        successCount: 0,
        uptime: 100
      });
    });
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Health monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    
    // Initial health check
    this.performHealthCheck();
    
    // Set up periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  public async performHealthCheck(): Promise<void> {
    const providers = Array.from(this.providerHealth.keys());
    const healthCheckPromises = providers.map(provider => 
      this.checkProviderHealth(provider)
    );

    try {
      const results = await Promise.allSettled(healthCheckPromises);
      
      results.forEach((result, index) => {
        const provider = providers[index];
        
        if (result.status === 'fulfilled') {
          this.updateProviderHealth(provider, result.value);
        } else {
          this.updateProviderHealth(provider, {
            provider,
            success: false,
            responseTime: this.config.timeoutMs,
            error: result.reason?.message || 'Health check failed'
          });
        }
      });
      
      // Notify listeners
      this.notifyListeners();
      
    } catch (error) {
      console.error('Health check batch failed:', error);
    }
  }

  private async checkProviderHealth(provider: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const testText = 'Health check test';
    
    try {
      // Use a timeout wrapper for the health check
      const healthCheckPromise = this.ttsService.synthesizeWithSpecificProvider(
        provider,
        testText,
        this.getDefaultVoiceForProvider(provider),
        'pt-BR',
        { speed: 1.0 }
      );
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), this.config.timeoutMs);
      });
      
      const result = await Promise.race([healthCheckPromise, timeoutPromise]);
      const responseTime = Date.now() - startTime;
      
      return {
        provider,
        success: result.success,
        responseTime,
        error: result.error
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        provider,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getDefaultVoiceForProvider(provider: string): string {
    switch (provider) {
      case 'elevenlabs':
        return 'pNInz6obpgDQGcFmaJgB'; // Adam
      case 'azure':
        return 'pt-BR-FranciscaNeural';
      case 'google':
        return 'pt-BR-Wavenet-A';
      default:
        return 'default';
    }
  }

  private updateProviderHealth(provider: string, result: HealthCheckResult): void {
    const health = this.providerHealth.get(provider);
    if (!health) return;

    const now = new Date();
    health.lastCheck = now;
    health.responseTime = result.responseTime;

    if (result.success) {
      health.successCount++;
      health.errorCount = 0; // Reset error count on success
      
      // Mark as healthy if it reaches recovery threshold
      if (!health.isHealthy && health.successCount >= this.config.recoveryThreshold) {
        health.isHealthy = true;
      }
    } else {
      health.errorCount++;
      health.successCount = 0; // Reset success count on failure
      health.lastError = result.error;
      
      // Mark as unhealthy if it reaches failure threshold
      if (health.isHealthy && health.errorCount >= this.config.failureThreshold) {
        health.isHealthy = false;
        console.warn(`Provider ${provider} marked as unhealthy after ${health.errorCount} failures`);
      }
    }

    // Calculate uptime percentage
    const totalChecks = health.successCount + health.errorCount;
    if (totalChecks > 0) {
      health.uptime = (health.successCount / totalChecks) * 100;
    }

    this.providerHealth.set(provider, health);
  }

  public getHealthyProviders(): string[] {
    return Array.from(this.providerHealth.entries())
      .filter(([_, health]) => health.isHealthy)
      .map(([provider, _]) => provider)
      .sort((a, b) => {
        const healthA = this.providerHealth.get(a)!;
        const healthB = this.providerHealth.get(b)!;
        // Sort by response time (faster first)
        return healthA.responseTime - healthB.responseTime;
      });
  }

  public getBestProvider(): string | null {
    const healthyProviders = this.getHealthyProviders();
    return healthyProviders.length > 0 ? healthyProviders[0] : null;
  }

  public getProviderHealth(provider: string): ProviderHealth | null {
    return this.providerHealth.get(provider) || null;
  }

  public getAllProviderHealth(): Map<string, ProviderHealth> {
    return new Map(this.providerHealth);
  }

  public getHealthSummary(): {
    totalProviders: number;
    healthyProviders: number;
    unhealthyProviders: number;
    averageResponseTime: number;
    overallUptime: number;
  } {
    const providers = Array.from(this.providerHealth.values());
    const healthyCount = providers.filter(p => p.isHealthy).length;
    const totalResponseTime = providers.reduce((sum, p) => sum + p.responseTime, 0);
    const totalUptime = providers.reduce((sum, p) => sum + p.uptime, 0);

    return {
      totalProviders: providers.length,
      healthyProviders: healthyCount,
      unhealthyProviders: providers.length - healthyCount,
      averageResponseTime: providers.length > 0 ? totalResponseTime / providers.length : 0,
      overallUptime: providers.length > 0 ? totalUptime / providers.length : 0
    };
  }

  public onHealthChange(callback: (health: Map<string, ProviderHealth>) => void): void {
    this.listeners.push(callback);
  }

  public removeHealthChangeListener(callback: (health: Map<string, ProviderHealth>) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(new Map(this.providerHealth));
      } catch (error) {
        console.error('Error in health change listener:', error);
      }
    });
  }

  public async forceHealthCheck(provider?: string): Promise<void> {
    if (provider) {
      const result = await this.checkProviderHealth(provider);
      this.updateProviderHealth(provider, result);
    } else {
      await this.performHealthCheck();
    }
    this.notifyListeners();
  }

  public resetProviderStats(provider: string): void {
    const health = this.providerHealth.get(provider);
    if (health) {
      health.errorCount = 0;
      health.successCount = 0;
      health.uptime = 100;
      health.isHealthy = true;
      this.providerHealth.set(provider, health);
      this.notifyListeners();
    }
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public getConfig(): TTSHealthMonitorConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TTSHealthMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new config if currently running
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
}

// Enhanced TTS Service with automatic failover
export class EnhancedTTSServiceWithFailover extends EnhancedTTSService {
  private healthMonitor: TTSHealthMonitor;

  constructor(config: EnhancedTTSConfig, monitorConfig?: Partial<TTSHealthMonitorConfig>) {
    super(config);
    this.healthMonitor = new TTSHealthMonitor(this, monitorConfig);
    this.healthMonitor.startMonitoring();
  }

  public async synthesizeWithAutoFailover(
    text: string,
    options: any = {}
  ): Promise<any> {
    const healthyProviders = this.healthMonitor.getHealthyProviders();
    
    if (healthyProviders.length === 0) {
      throw new Error('No healthy TTS providers available');
    }

    // Try providers in order of health (best first)
    for (const provider of healthyProviders) {
      try {
        const result = await this.synthesizeWithSpecificProvider(
          provider,
          text,
          options.voice || this.getDefaultVoiceForProvider(provider),
          options.language || 'pt-BR',
          options
        );
        
        if (result.success) {
          return { ...result, provider };
        }
      } catch (error) {
        console.warn(`Provider ${provider} failed, trying next:`, error);
        continue;
      }
    }
    
    throw new Error('All healthy providers failed');
  }

  private getDefaultVoiceForProvider(provider: string): string {
    switch (provider) {
      case 'elevenlabs':
        return 'pNInz6obpgDQGcFmaJgB';
      case 'azure':
        return 'pt-BR-FranciscaNeural';
      case 'google':
        return 'pt-BR-Wavenet-A';
      default:
        return 'default';
    }
  }

  public getHealthMonitor(): TTSHealthMonitor {
    return this.healthMonitor;
  }

  public getHealthSummary() {
    return this.healthMonitor.getHealthSummary();
  }

  public destroy(): void {
    this.healthMonitor.stopMonitoring();
  }
}