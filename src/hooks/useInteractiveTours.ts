import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'scroll' | 'wait';
  actionDelay?: number;
  skippable?: boolean;
  required?: boolean;
  validation?: () => boolean;
  onBeforeStep?: () => void;
  onAfterStep?: () => void;
  metadata?: Record<string, any>;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced' | 'troubleshooting';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: TourStep[];
  prerequisites?: string[];
  tags: string[];
  enabled: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  completionRate: number;
  averageRating: number;
  metadata?: Record<string, any>;
}

export interface TourProgress {
  tourId: string;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  interactions: TourInteraction[];
  rating?: number;
  feedback?: string;
  metadata?: Record<string, any>;
}

export interface TourInteraction {
  id: string;
  stepId: string;
  type: 'view' | 'click' | 'skip' | 'back' | 'complete' | 'error';
  timestamp: Date;
  duration: number;
  data?: Record<string, any>;
}

export interface TourMetrics {
  totalTours: number;
  completedTours: number;
  averageCompletionTime: number;
  popularTours: string[];
  dropoffPoints: { stepId: string; count: number }[];
  userSatisfaction: number;
  conversionRate: number;
}

export interface TourConfig {
  autoStart: boolean;
  showProgress: boolean;
  allowSkipping: boolean;
  highlightTarget: boolean;
  overlayOpacity: number;
  animationDuration: number;
  keyboardNavigation: boolean;
  mobileOptimized: boolean;
  analytics: boolean;
  persistence: boolean;
  maxConcurrentTours: number;
  retryAttempts: number;
}

export interface InteractiveToursState {
  tours: Tour[];
  activeTour: Tour | null;
  currentStep: number;
  progress: TourProgress[];
  metrics: TourMetrics;
  config: TourConfig;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  logs: TourInteraction[];
}

// Interactive Tours Engine
class InteractiveToursEngine {
  private tours: Map<string, Tour> = new Map();
  private progress: Map<string, TourProgress> = new Map();
  private activeTour: Tour | null = null;
  private currentStep: number = 0;
  private overlay: HTMLElement | null = null;
  private highlight: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private config: TourConfig;
  private listeners: Map<string, Function[]> = new Map();
  private stepTimer: NodeJS.Timeout | null = null;
  private interactionTimer: NodeJS.Timeout | null = null;

  constructor(config: TourConfig) {
    this.config = config;
    this.initializeDOM();
    this.setupEventListeners();
  }

  private initializeDOM(): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'tour-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, ${this.config.overlayOpacity});
      z-index: 9998;
      pointer-events: none;
      opacity: 0;
      transition: opacity ${this.config.animationDuration}ms ease;
    `;

    // Create highlight
    this.highlight = document.createElement('div');
    this.highlight.className = 'tour-highlight';
    this.highlight.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      border-radius: 4px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: all ${this.config.animationDuration}ms ease;
    `;

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tour-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      padding: 20px;
      max-width: 320px;
      z-index: 10000;
      opacity: 0;
      transform: scale(0.9);
      transition: all ${this.config.animationDuration}ms ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
  }

  private setupEventListeners(): void {
    if (this.config.keyboardNavigation) {
      document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    window.addEventListener('resize', this.handleResize.bind(this));
    document.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.activeTour) return;

    switch (event.key) {
      case 'Escape':
        this.stopTour();
        break;
      case 'ArrowRight':
      case 'Space':
        event.preventDefault();
        this.nextStep();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousStep();
        break;
    }
  }

  private handleResize(): void {
    if (this.activeTour) {
      this.updateStepPosition();
    }
  }

  private handleScroll(): void {
    if (this.activeTour) {
      this.updateStepPosition();
    }
  }

  public addTour(tour: Tour): void {
    this.tours.set(tour.id, tour);
    this.emit('tourAdded', tour);
  }

  public removeTour(tourId: string): void {
    this.tours.delete(tourId);
    this.emit('tourRemoved', tourId);
  }

  public startTour(tourId: string): boolean {
    const tour = this.tours.get(tourId);
    if (!tour || !tour.enabled) return false;

    // Check prerequisites
    if (tour.prerequisites) {
      const unmetPrereqs = tour.prerequisites.filter(prereq => 
        !this.progress.has(prereq) || !this.progress.get(prereq)?.completedAt
      );
      if (unmetPrereqs.length > 0) {
        this.emit('prerequisitesNotMet', unmetPrereqs);
        return false;
      }
    }

    this.activeTour = tour;
    this.currentStep = 0;

    // Initialize progress
    const progress: TourProgress = {
      tourId: tour.id,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      startedAt: new Date(),
      timeSpent: 0,
      interactions: [],
    };
    this.progress.set(tour.id, progress);

    this.showOverlay();
    this.showStep(0);
    this.emit('tourStarted', tour);
    return true;
  }

  public stopTour(): void {
    if (!this.activeTour) return;

    const progress = this.progress.get(this.activeTour.id);
    if (progress) {
      progress.timeSpent = Date.now() - progress.startedAt.getTime();
    }

    this.hideOverlay();
    this.hideHighlight();
    this.hideTooltip();
    
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }

    this.emit('tourStopped', this.activeTour);
    this.activeTour = null;
    this.currentStep = 0;
  }

  public nextStep(): void {
    if (!this.activeTour) return;

    const currentStepData = this.activeTour.steps[this.currentStep];
    if (currentStepData?.validation && !currentStepData.validation()) {
      this.emit('stepValidationFailed', currentStepData);
      return;
    }

    this.recordInteraction('complete', currentStepData?.id);
    
    if (currentStepData?.onAfterStep) {
      currentStepData.onAfterStep();
    }

    if (this.currentStep < this.activeTour.steps.length - 1) {
      this.currentStep++;
      this.showStep(this.currentStep);
    } else {
      this.completeTour();
    }
  }

  public previousStep(): void {
    if (!this.activeTour || this.currentStep <= 0) return;

    this.currentStep--;
    this.showStep(this.currentStep);
    this.recordInteraction('back', this.activeTour.steps[this.currentStep]?.id);
  }

  public skipStep(): void {
    if (!this.activeTour) return;

    const currentStepData = this.activeTour.steps[this.currentStep];
    if (currentStepData?.required) {
      this.emit('stepRequired', currentStepData);
      return;
    }

    const progress = this.progress.get(this.activeTour.id);
    if (progress && currentStepData) {
      progress.skippedSteps.push(currentStepData.id);
    }

    this.recordInteraction('skip', currentStepData?.id);
    this.nextStep();
  }

  private showStep(stepIndex: number): void {
    if (!this.activeTour) return;

    const step = this.activeTour.steps[stepIndex];
    if (!step) return;

    if (step.onBeforeStep) {
      step.onBeforeStep();
    }

    const target = document.querySelector(step.target) as HTMLElement;
    if (!target) {
      this.emit('targetNotFound', step);
      return;
    }

    this.highlightElement(target);
    this.showTooltip(step, target);
    this.recordInteraction('view', step.id);

    // Handle step action
    if (step.action && step.actionDelay) {
      this.stepTimer = setTimeout(() => {
        this.performStepAction(step, target);
      }, step.actionDelay);
    }

    this.emit('stepShown', step);
  }

  private performStepAction(step: TourStep, target: HTMLElement): void {
    switch (step.action) {
      case 'click':
        target.click();
        break;
      case 'hover':
        target.dispatchEvent(new MouseEvent('mouseenter'));
        break;
      case 'focus':
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          target.focus();
        }
        break;
      case 'scroll':
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'wait':
        // Just wait, no action needed
        break;
    }
  }

  private highlightElement(element: HTMLElement): void {
    if (!this.highlight || !this.config.highlightTarget) return;

    const rect = element.getBoundingClientRect();
    this.highlight.style.left = `${rect.left - 4}px`;
    this.highlight.style.top = `${rect.top - 4}px`;
    this.highlight.style.width = `${rect.width + 8}px`;
    this.highlight.style.height = `${rect.height + 8}px`;
    this.highlight.style.opacity = '1';

    if (!document.body.contains(this.highlight)) {
      document.body.appendChild(this.highlight);
    }
  }

  private showTooltip(step: TourStep, target: HTMLElement): void {
    if (!this.tooltip) return;

    const rect = target.getBoundingClientRect();
    const tooltipContent = this.createTooltipContent(step);
    this.tooltip.innerHTML = tooltipContent;

    // Position tooltip
    const position = this.calculateTooltipPosition(step.position, rect);
    this.tooltip.style.left = `${position.x}px`;
    this.tooltip.style.top = `${position.y}px`;
    this.tooltip.style.opacity = '1';
    this.tooltip.style.transform = 'scale(1)';

    if (!document.body.contains(this.tooltip)) {
      document.body.appendChild(this.tooltip);
    }
  }

  private createTooltipContent(step: TourStep): string {
    const progress = this.activeTour ? 
      `${this.currentStep + 1} / ${this.activeTour.steps.length}` : '';

    return `
      <div class="tour-tooltip-header">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          ${step.title}
        </h3>
        ${this.config.showProgress ? `
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
            Step ${progress}
          </div>
        ` : ''}
      </div>
      <div class="tour-tooltip-content" style="margin-bottom: 16px; color: #374151; line-height: 1.5;">
        ${step.content}
      </div>
      <div class="tour-tooltip-actions" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          ${this.currentStep > 0 ? `
            <button onclick="window.tourEngine?.previousStep()" 
                    style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer; margin-right: 8px;">
              Back
            </button>
          ` : ''}
          ${step.skippable !== false && this.config.allowSkipping ? `
            <button onclick="window.tourEngine?.skipStep()" 
                    style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer;">
              Skip
            </button>
          ` : ''}
        </div>
        <div>
          <button onclick="window.tourEngine?.stopTour()" 
                  style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer; margin-right: 8px;">
            Exit
          </button>
          <button onclick="window.tourEngine?.nextStep()" 
                  style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
            ${this.currentStep === (this.activeTour?.steps.length || 0) - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    `;
  }

  private calculateTooltipPosition(position: string, targetRect: DOMRect): { x: number; y: number } {
    const tooltipRect = this.tooltip?.getBoundingClientRect() || { width: 320, height: 200 };
    const margin = 12;

    switch (position) {
      case 'top':
        return {
          x: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
          y: targetRect.top - tooltipRect.height - margin
        };
      case 'bottom':
        return {
          x: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
          y: targetRect.bottom + margin
        };
      case 'left':
        return {
          x: targetRect.left - tooltipRect.width - margin,
          y: targetRect.top + (targetRect.height - tooltipRect.height) / 2
        };
      case 'right':
        return {
          x: targetRect.right + margin,
          y: targetRect.top + (targetRect.height - tooltipRect.height) / 2
        };
      case 'center':
      default:
        return {
          x: (window.innerWidth - tooltipRect.width) / 2,
          y: (window.innerHeight - tooltipRect.height) / 2
        };
    }
  }

  private updateStepPosition(): void {
    if (!this.activeTour) return;

    const step = this.activeTour.steps[this.currentStep];
    if (!step) return;

    const target = document.querySelector(step.target) as HTMLElement;
    if (target) {
      this.highlightElement(target);
      this.showTooltip(step, target);
    }
  }

  private showOverlay(): void {
    if (!this.overlay) return;

    this.overlay.style.opacity = '1';
    if (!document.body.contains(this.overlay)) {
      document.body.appendChild(this.overlay);
    }
  }

  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        if (this.overlay && document.body.contains(this.overlay)) {
          document.body.removeChild(this.overlay);
        }
      }, this.config.animationDuration);
    }
  }

  private hideHighlight(): void {
    if (this.highlight) {
      this.highlight.style.opacity = '0';
      setTimeout(() => {
        if (this.highlight && document.body.contains(this.highlight)) {
          document.body.removeChild(this.highlight);
        }
      }, this.config.animationDuration);
    }
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.style.opacity = '0';
      this.tooltip.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (this.tooltip && document.body.contains(this.tooltip)) {
          document.body.removeChild(this.tooltip);
        }
      }, this.config.animationDuration);
    }
  }

  private completeTour(): void {
    if (!this.activeTour) return;

    const progress = this.progress.get(this.activeTour.id);
    if (progress) {
      progress.completedAt = new Date();
      progress.timeSpent = Date.now() - progress.startedAt.getTime();
      progress.completedSteps = this.activeTour.steps.map(step => step.id);
    }

    this.emit('tourCompleted', this.activeTour);
    this.stopTour();
  }

  private recordInteraction(type: TourInteraction['type'], stepId?: string): void {
    if (!this.activeTour || !stepId) return;

    const interaction: TourInteraction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stepId,
      type,
      timestamp: new Date(),
      duration: 0
    };

    const progress = this.progress.get(this.activeTour.id);
    if (progress) {
      progress.interactions.push(interaction);
    }

    this.emit('interactionRecorded', interaction);
  }

  public getMetrics(): TourMetrics {
    const allProgress = Array.from(this.progress.values());
    const completedTours = allProgress.filter(p => p.completedAt).length;
    const totalTime = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    
    return {
      totalTours: this.tours.size,
      completedTours,
      averageCompletionTime: completedTours > 0 ? totalTime / completedTours : 0,
      popularTours: this.getPopularTours(),
      dropoffPoints: this.getDropoffPoints(),
      userSatisfaction: this.calculateUserSatisfaction(),
      conversionRate: this.tours.size > 0 ? (completedTours / this.tours.size) * 100 : 0
    };
  }

  private getPopularTours(): string[] {
    const tourCounts = new Map<string, number>();
    
    Array.from(this.progress.values()).forEach(progress => {
      const count = tourCounts.get(progress.tourId) || 0;
      tourCounts.set(progress.tourId, count + 1);
    });

    return Array.from(tourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tourId]) => tourId);
  }

  private getDropoffPoints(): { stepId: string; count: number }[] {
    const dropoffs = new Map<string, number>();
    
    Array.from(this.progress.values()).forEach(progress => {
      if (!progress.completedAt && progress.interactions.length > 0) {
        const lastInteraction = progress.interactions[progress.interactions.length - 1];
        const count = dropoffs.get(lastInteraction.stepId) || 0;
        dropoffs.set(lastInteraction.stepId, count + 1);
      }
    });

    return Array.from(dropoffs.entries())
      .map(([stepId, count]) => ({ stepId, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateUserSatisfaction(): number {
    const ratings = Array.from(this.progress.values())
      .map(p => p.rating)
      .filter(rating => rating !== undefined) as number[];
    
    return ratings.length > 0 ? 
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  }

  public exportData(): string {
    return JSON.stringify({
      tours: Array.from(this.tours.values()),
      progress: Array.from(this.progress.values()),
      config: this.config,
      metrics: this.getMetrics(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  public importData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.tours) {
        parsed.tours.forEach((tour: Tour) => this.addTour(tour));
      }
      
      if (parsed.progress) {
        parsed.progress.forEach((progress: TourProgress) => {
          this.progress.set(progress.tourId, progress);
        });
      }
      
      if (parsed.config) {
        this.config = { ...this.config, ...parsed.config };
      }
      
      this.emit('dataImported', parsed);
    } catch (error) {
      this.emit('importError', error);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  public on(event: string, listener: Function): void {
    const listeners = this.listeners.get(event) || [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.listeners.set(event, listeners);
    }
  }

  public destroy(): void {
    this.stopTour();
    this.listeners.clear();
    
    if (this.overlay && document.body.contains(this.overlay)) {
      document.body.removeChild(this.overlay);
    }
    if (this.highlight && document.body.contains(this.highlight)) {
      document.body.removeChild(this.highlight);
    }
    if (this.tooltip && document.body.contains(this.tooltip)) {
      document.body.removeChild(this.tooltip);
    }

    document.removeEventListener('keydown', this.handleKeydown.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('scroll', this.handleScroll.bind(this));
  }
}

// Default configuration
const defaultConfig: TourConfig = {
  autoStart: false,
  showProgress: true,
  allowSkipping: true,
  highlightTarget: true,
  overlayOpacity: 0.5,
  animationDuration: 300,
  keyboardNavigation: true,
  mobileOptimized: true,
  analytics: true,
  persistence: true,
  maxConcurrentTours: 1,
  retryAttempts: 3
};

// Hook
export const useInteractiveTours = () => {
  const [state, setState] = useState<InteractiveToursState>({
    tours: [],
    activeTour: null,
    currentStep: 0,
    progress: [],
    metrics: {
      totalTours: 0,
      completedTours: 0,
      averageCompletionTime: 0,
      popularTours: [],
      dropoffPoints: [],
      userSatisfaction: 0,
      conversionRate: 0
    },
    config: defaultConfig,
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    error: null,
    logs: []
  });

  const engineRef = useRef<InteractiveToursEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    engineRef.current = new InteractiveToursEngine(state.config);
    
    // Expose to window for tooltip buttons
    (window as any).tourEngine = engineRef.current;

    // Setup event listeners
    const engine = engineRef.current;
    
    engine.on('tourStarted', (tour: Tour) => {
      setState(prev => ({ 
        ...prev, 
        activeTour: tour, 
        isPlaying: true, 
        currentStep: 0 
      }));
    });

    engine.on('tourStopped', () => {
      setState(prev => ({ 
        ...prev, 
        activeTour: null, 
        isPlaying: false, 
        currentStep: 0 
      }));
    });

    engine.on('tourCompleted', () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false 
      }));
      updateMetrics();
    });

    engine.on('stepShown', () => {
      setState(prev => ({ 
        ...prev, 
        currentStep: engineRef.current?.currentStep || 0 
      }));
    });

    engine.on('interactionRecorded', (interaction: TourInteraction) => {
      setState(prev => ({ 
        ...prev, 
        logs: [...prev.logs, interaction].slice(-1000) 
      }));
    });

    return () => {
      engine.destroy();
      delete (window as any).tourEngine;
    };
  }, []);

  // Update metrics
  const updateMetrics = useCallback(() => {
    if (engineRef.current) {
      const metrics = engineRef.current.getMetrics();
      setState(prev => ({ ...prev, metrics }));
    }
  }, []);

  // Actions
  const addTour = useCallback((tour: Tour) => {
    if (engineRef.current) {
      engineRef.current.addTour(tour);
      setState(prev => ({ 
        ...prev, 
        tours: [...prev.tours, tour] 
      }));
    }
  }, []);

  const removeTour = useCallback((tourId: string) => {
    if (engineRef.current) {
      engineRef.current.removeTour(tourId);
      setState(prev => ({ 
        ...prev, 
        tours: prev.tours.filter(t => t.id !== tourId) 
      }));
    }
  }, []);

  const startTour = useCallback((tourId: string) => {
    if (engineRef.current) {
      const success = engineRef.current.startTour(tourId);
      if (!success) {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to start tour. Check prerequisites and tour availability.' 
        }));
      }
      return success;
    }
    return false;
  }, []);

  const stopTour = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stopTour();
    }
  }, []);

  const nextStep = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.nextStep();
    }
  }, []);

  const previousStep = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.previousStep();
    }
  }, []);

  const skipStep = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.skipStep();
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<TourConfig>) => {
    setState(prev => ({ 
      ...prev, 
      config: { ...prev.config, ...newConfig } 
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setState(prev => ({ ...prev, logs: [] }));
  }, []);

  const exportData = useCallback(() => {
    if (engineRef.current) {
      return engineRef.current.exportData();
    }
    return '';
  }, []);

  const importData = useCallback((data: string) => {
    if (engineRef.current) {
      try {
        engineRef.current.importData(data);
        setState(prev => ({ ...prev, error: null }));
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Import failed' 
        }));
      }
    }
  }, []);

  return {
    ...state,
    actions: {
      addTour,
      removeTour,
      startTour,
      stopTour,
      nextStep,
      previousStep,
      skipStep,
      updateConfig,
      updateMetrics,
      clearLogs,
      exportData,
      importData
    }
  };
};

export default useInteractiveTours;