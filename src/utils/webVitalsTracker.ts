import { getCLS, getFID, getFCP, getLCP, getTTFB, type CLSMetric, type FIDMetric, type FCPMetric, type LCPMetric, type TTFBMetric } from 'web-vitals';

export interface WebVitalsData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
  id: string;
  navigationType: string;
}

export interface WebVitalsConfig {
  enableReporting: boolean;
  enableLogging: boolean;
  reportInterval: number;
  thresholds: {
    lcp: { good: number; poor: number };
    fid: { good: number; poor: number };
    cls: { good: number; poor: number };
    fcp: { good: number; poor: number };
    ttfb: { good: number; poor: number };
  };
}

export interface WebVitalsMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  timestamp: number;
}

class WebVitalsTracker {
  private metrics: WebVitalsMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    timestamp: Date.now()
  };

  private listeners: Array<(metrics: WebVitalsMetrics) => void> = [];
  private config: WebVitalsConfig;
  private isInitialized = false;

  constructor(config: Partial<WebVitalsConfig> = {}) {
    this.config = {
      enableReporting: true,
      enableLogging: false,
      reportInterval: 30000, // 30 seconds
      thresholds: {
        lcp: { good: 2500, poor: 4000 },
        fid: { good: 100, poor: 300 },
        cls: { good: 0.1, poor: 0.25 },
        fcp: { good: 1800, poor: 3000 },
        ttfb: { good: 800, poor: 1800 }
      },
      ...config
    };
  }

  public init(): void {
    if (this.isInitialized) return;

    // Track Largest Contentful Paint
    getLCP((metric: LCPMetric) => {
      this.updateMetric('lcp', metric.value);
      this.log('LCP', metric);
    });

    // Track First Input Delay
    getFID((metric: FIDMetric) => {
      this.updateMetric('fid', metric.value);
      this.log('FID', metric);
    });

    // Track Cumulative Layout Shift
    getCLS((metric: CLSMetric) => {
      this.updateMetric('cls', metric.value);
      this.log('CLS', metric);
    });

    // Track First Contentful Paint
    getFCP((metric: FCPMetric) => {
      this.updateMetric('fcp', metric.value);
      this.log('FCP', metric);
    });

    // Track Time to First Byte
    getTTFB((metric: TTFBMetric) => {
      this.updateMetric('ttfb', metric.value);
      this.log('TTFB', metric);
    });

    this.isInitialized = true;

    if (this.config.enableReporting) {
      this.startPeriodicReporting();
    }
  }

  private updateMetric(name: keyof Omit<WebVitalsMetrics, 'timestamp'>, value: number): void {
    this.metrics[name] = value;
    this.metrics.timestamp = Date.now();
    this.notifyListeners();
  }

  private log(name: string, metric: any): void {
    if (!this.config.enableLogging) return;

    const rating = this.getRating(name.toLowerCase() as keyof WebVitalsMetrics, metric.value);
    console.group(`🔍 Web Vitals: ${name}`);
    console.groupEnd();
  }

  private getRating(metric: keyof Omit<WebVitalsMetrics, 'timestamp'>, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.config.thresholds[metric];
    if (!thresholds) return 'good';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.metrics });
      } catch (error) {
        console.error('Error in WebVitals listener:', error);
      }
    });
  }

  private startPeriodicReporting(): void {
    setInterval(() => {
      if (this.hasCompleteMetrics()) {
        this.reportMetrics();
      }
    }, this.config.reportInterval);
  }

  private hasCompleteMetrics(): boolean {
    return Object.values(this.metrics).every(value => value !== null || typeof value === 'number');
  }

  private reportMetrics(): void {
    // Send metrics to analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      
      Object.entries(this.metrics).forEach(([name, value]) => {
        if (name !== 'timestamp' && value !== null) {
          gtag('event', name.toUpperCase(), {
            event_category: 'Web Vitals',
            value: Math.round(value),
            custom_parameter_1: this.getRating(name as keyof Omit<WebVitalsMetrics, 'timestamp'>, value)
          });
        }
      });
    }

    // Custom reporting logic can be added here
    this.dispatchCustomEvent();
  }

  private dispatchCustomEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webvitals:report', {
        detail: { ...this.metrics }
      }));
    }
  }

  public subscribe(listener: (metrics: WebVitalsMetrics) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  public getMetricRatings(): Record<string, 'good' | 'needs-improvement' | 'poor'> {
    const ratings: Record<string, 'good' | 'needs-improvement' | 'poor'> = {};
    
    Object.entries(this.metrics).forEach(([name, value]) => {
      if (name !== 'timestamp' && value !== null) {
        ratings[name] = this.getRating(name as keyof Omit<WebVitalsMetrics, 'timestamp'>, value);
      }
    });

    return ratings;
  }

  public exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      ratings: this.getMetricRatings(),
      config: this.config,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  public reset(): void {
    this.metrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      timestamp: Date.now()
    };
    this.notifyListeners();
  }

  public updateConfig(newConfig: Partial<WebVitalsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public destroy(): void {
    this.listeners = [];
    this.isInitialized = false;
  }
}

// Global instance
export const webVitalsTracker = new WebVitalsTracker();

// Convenience functions
export const initWebVitals = (config?: Partial<WebVitalsConfig>) => {
  if (config) {
    webVitalsTracker.updateConfig(config);
  }
  webVitalsTracker.init();
};

export const getWebVitalsMetrics = () => webVitalsTracker.getMetrics();

export const subscribeToWebVitals = (listener: (metrics: WebVitalsMetrics) => void) => 
  webVitalsTracker.subscribe(listener);

export { WebVitalsTracker };