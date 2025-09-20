import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Tipos para o sistema de tours
export interface TourStep {
  id: string;
  target: string; // Seletor CSS do elemento alvo
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'scroll' | 'wait';
  actionDuration?: number; // Duração em ms para ações automáticas
  validation?: () => boolean; // Função para validar se o passo foi completado
  onEnter?: () => void; // Callback ao entrar no passo
  onExit?: () => void; // Callback ao sair do passo
  skippable?: boolean;
  required?: boolean;
  highlight?: boolean;
  animation?: 'fade' | 'slide' | 'bounce' | 'pulse';
  delay?: number; // Delay antes de mostrar o passo
  autoAdvance?: boolean; // Avançar automaticamente após ação
  conditions?: {
    elementExists?: string; // Seletor que deve existir
    elementVisible?: string; // Seletor que deve estar visível
    customCondition?: () => boolean; // Condição customizada
  };
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
    alt?: string;
  };
  interactive?: {
    allowInteraction?: boolean; // Permitir interação com o elemento
    highlightInteraction?: boolean; // Destacar área interativa
  };
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced' | 'troubleshooting';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // Em minutos
  prerequisites?: string[]; // IDs de outros tours necessários
  steps: TourStep[];
  tags: string[];
  version: string;
  author: string;
  lastUpdated: Date;
  completionRate?: number; // Taxa de conclusão pelos usuários
  rating?: number; // Avaliação média
  isActive: boolean;
  autoStart?: boolean;
  repeatable?: boolean;
}

export interface TourProgress {
  tourId: string;
  currentStep: number;
  completedSteps: string[];
  startTime: Date;
  lastActivity: Date;
  isCompleted: boolean;
  timeSpent: number; // Em segundos
  interactions: {
    stepId: string;
    action: string;
    timestamp: Date;
    duration: number;
  }[];
  feedback?: {
    rating: number;
    comment: string;
    suggestions: string[];
  };
}

export interface TourState {
  activeTour: Tour | null;
  currentStep: number;
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  progress: Map<string, TourProgress>;
  availableTours: Tour[];
  completedTours: string[];
  userPreferences: {
    autoPlay: boolean;
    showHints: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
    skipIntro: boolean;
    soundEnabled: boolean;
    highlightStyle: 'subtle' | 'normal' | 'bold';
  };
  analytics: {
    totalToursStarted: number;
    totalToursCompleted: number;
    averageCompletionTime: number;
    mostPopularTours: string[];
    dropOffPoints: { [stepId: string]: number };
  };
}

export interface TourConfig {
  enableAnalytics?: boolean;
  enableKeyboardNavigation?: boolean;
  enableVoiceOver?: boolean;
  autoSave?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  customStyles?: {
    overlay?: React.CSSProperties;
    tooltip?: React.CSSProperties;
    highlight?: React.CSSProperties;
  };
  onTourStart?: (tour: Tour) => void;
  onTourComplete?: (tour: Tour, progress: TourProgress) => void;
  onStepChange?: (step: TourStep, stepIndex: number) => void;
  onUserInteraction?: (interaction: any) => void;
}

// Cache para otimização
class TourCache {
  private cache = new Map<string, any>();
  private maxSize: number;
  private ttl: number; // Time to live em ms

  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Seria calculado com métricas reais
    };
  }
}

// Gerenciador de posicionamento
class PositionManager {
  static calculatePosition(
    target: Element,
    tooltip: Element,
    position: TourStep['position']
  ): { top: number; left: number } {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 10;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 10;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 10;
        break;
      case 'center':
        top = (viewport.height - tooltipRect.height) / 2;
        left = (viewport.width - tooltipRect.width) / 2;
        break;
    }

    // Ajustar para manter dentro da viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > viewport.width - 10) {
      left = viewport.width - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > viewport.height - 10) {
      top = viewport.height - tooltipRect.height - 10;
    }

    return { top, left };
  }

  static scrollToElement(element: Element, behavior: ScrollBehavior = 'smooth'): Promise<void> {
    return new Promise((resolve) => {
      element.scrollIntoView({ behavior, block: 'center' });
      setTimeout(resolve, 500); // Aguardar animação de scroll
    });
  }
}

// Gerenciador de acessibilidade
class AccessibilityManager {
  private originalFocus: Element | null = null;
  private originalAriaHidden: Map<Element, string | null> = new Map();

  enableTourMode(tourContainer: Element): void {
    this.originalFocus = document.activeElement;
    
    // Esconder outros elementos para screen readers
    const allElements = document.querySelectorAll('body > *');
    allElements.forEach(element => {
      if (!element.contains(tourContainer)) {
        const currentAriaHidden = element.getAttribute('aria-hidden');
        this.originalAriaHidden.set(element, currentAriaHidden);
        element.setAttribute('aria-hidden', 'true');
      }
    });

    // Focar no container do tour
    if (tourContainer instanceof HTMLElement) {
      tourContainer.focus();
    }
  }

  disableTourMode(): void {
    // Restaurar aria-hidden
    this.originalAriaHidden.forEach((value, element) => {
      if (value === null) {
        element.removeAttribute('aria-hidden');
      } else {
        element.setAttribute('aria-hidden', value);
      }
    });
    this.originalAriaHidden.clear();

    // Restaurar foco
    if (this.originalFocus instanceof HTMLElement) {
      this.originalFocus.focus();
    }
  }

  announceStep(step: TourStep): void {
    const announcement = `Passo ${step.title}. ${step.content}`;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  }
}

// Hook principal
export const useInteractiveTour = (config: TourConfig = {}) => {
  const [state, setState] = useState<TourState>({
    activeTour: null,
    currentStep: 0,
    isPlaying: false,
    isPaused: false,
    isCompleted: false,
    progress: new Map(),
    availableTours: [],
    completedTours: [],
    userPreferences: {
      autoPlay: true,
      showHints: true,
      animationSpeed: 'normal',
      skipIntro: false,
      soundEnabled: false,
      highlightStyle: 'normal'
    },
    analytics: {
      totalToursStarted: 0,
      totalToursCompleted: 0,
      averageCompletionTime: 0,
      mostPopularTours: [],
      dropOffPoints: {}
    }
  });

  const cache = useRef(new TourCache());
  const positionManager = useRef(new PositionManager());
  const accessibilityManager = useRef(new AccessibilityManager());
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimeRef = useRef<number>(0);

  // Carregar dados salvos
  useEffect(() => {
    const savedData = localStorage.getItem('tour-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setState(prev => ({
          ...prev,
          progress: new Map(parsed.progress || []),
          completedTours: parsed.completedTours || [],
          userPreferences: { ...prev.userPreferences, ...parsed.userPreferences },
          analytics: { ...prev.analytics, ...parsed.analytics }
        }));
      } catch (error) {
        console.error('Erro ao carregar dados do tour:', error);
      }
    }
  }, []);

  // Salvar dados automaticamente
  useEffect(() => {
    if (config.autoSave !== false) {
      const dataToSave = {
        progress: Array.from(state.progress.entries()),
        completedTours: state.completedTours,
        userPreferences: state.userPreferences,
        analytics: state.analytics
      };
      localStorage.setItem('tour-data', JSON.stringify(dataToSave));
    }
  }, [state.progress, state.completedTours, state.userPreferences, state.analytics, config.autoSave]);

  // Navegação por teclado
  useEffect(() => {
    if (!config.enableKeyboardNavigation || !state.isPlaying) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'Space':
          event.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          previousStep();
          break;
        case 'Escape':
          event.preventDefault();
          stopTour();
          break;
        case 'Enter':
          event.preventDefault();
          if (state.isPaused) {
            resumeTour();
          } else {
            pauseTour();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config.enableKeyboardNavigation, state.isPlaying, state.isPaused]);

  // Função para iniciar tour
  const startTour = useCallback(async (tour: Tour) => {
    try {
      // Verificar pré-requisitos
      if (tour.prerequisites) {
        const missingPrereqs = tour.prerequisites.filter(
          prereq => !state.completedTours.includes(prereq)
        );
        if (missingPrereqs.length > 0) {
          toast.error(`Pré-requisitos não atendidos: ${missingPrereqs.join(', ')}`);
          return;
        }
      }

      // Verificar se o primeiro passo é válido
      const firstStep = tour.steps[0];
      if (firstStep && !await validateStep(firstStep)) {
        toast.error('Não é possível iniciar o tour no momento');
        return;
      }

      const progress: TourProgress = {
        tourId: tour.id,
        currentStep: 0,
        completedSteps: [],
        startTime: new Date(),
        lastActivity: new Date(),
        isCompleted: false,
        timeSpent: 0,
        interactions: []
      };

      setState(prev => ({
        ...prev,
        activeTour: tour,
        currentStep: 0,
        isPlaying: true,
        isPaused: false,
        isCompleted: false,
        progress: new Map(prev.progress).set(tour.id, progress),
        analytics: {
          ...prev.analytics,
          totalToursStarted: prev.analytics.totalToursStarted + 1
        }
      }));

      interactionTimeRef.current = Date.now();
      
      // Callback de início
      config.onTourStart?.(tour);
      
      // Habilitar modo de acessibilidade
      const tourContainer = document.querySelector('[data-tour-container]');
      if (tourContainer) {
        accessibilityManager.current.enableTourMode(tourContainer);
      }
      
      toast.success(`Tour "${tour.name}" iniciado`);
    } catch (error) {
      console.error('Erro ao iniciar tour:', error);
      toast.error('Erro ao iniciar tour');
    }
  }, [state.completedTours, config]);

  // Função para parar tour
  const stopTour = useCallback(() => {
    if (!state.activeTour) return;

    // Limpar timeouts
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }

    // Desabilitar modo de acessibilidade
    accessibilityManager.current.disableTourMode();

    // Atualizar progresso
    const currentProgress = state.progress.get(state.activeTour.id);
    if (currentProgress) {
      const timeSpent = (Date.now() - interactionTimeRef.current) / 1000;
      const updatedProgress = {
        ...currentProgress,
        timeSpent: currentProgress.timeSpent + timeSpent,
        lastActivity: new Date()
      };
      
      setState(prev => ({
        ...prev,
        activeTour: null,
        isPlaying: false,
        isPaused: false,
        progress: new Map(prev.progress).set(state.activeTour!.id, updatedProgress)
      }));
    } else {
      setState(prev => ({
        ...prev,
        activeTour: null,
        isPlaying: false,
        isPaused: false
      }));
    }

    toast.info('Tour interrompido');
  }, [state.activeTour, state.progress]);

  // Função para pausar tour
  const pauseTour = useCallback(() => {
    if (!state.isPlaying || state.isPaused) return;

    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isPaused: true }));
    toast.info('Tour pausado');
  }, [state.isPlaying, state.isPaused]);

  // Função para retomar tour
  const resumeTour = useCallback(() => {
    if (!state.isPaused) return;

    setState(prev => ({ ...prev, isPaused: false }));
    interactionTimeRef.current = Date.now();
    toast.info('Tour retomado');
  }, [state.isPaused]);

  // Função para validar passo
  const validateStep = useCallback(async (step: TourStep): Promise<boolean> => {
    try {
      // Verificar se elemento existe
      if (step.conditions?.elementExists) {
        const element = document.querySelector(step.conditions.elementExists);
        if (!element) return false;
      }

      // Verificar se elemento está visível
      if (step.conditions?.elementVisible) {
        const element = document.querySelector(step.conditions.elementVisible);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         rect.top >= 0 && rect.left >= 0 &&
                         rect.bottom <= window.innerHeight && 
                         rect.right <= window.innerWidth;
        if (!isVisible) return false;
      }

      // Verificar condição customizada
      if (step.conditions?.customCondition) {
        return step.conditions.customCondition();
      }

      // Verificar se validação do passo passou
      if (step.validation) {
        return step.validation();
      }

      return true;
    } catch (error) {
      console.error('Erro na validação do passo:', error);
      return false;
    }
  }, []);

  // Função para ir para próximo passo
  const nextStep = useCallback(async () => {
    if (!state.activeTour || state.isPaused) return;

    const currentStep = state.activeTour.steps[state.currentStep];
    if (!currentStep) return;

    // Executar callback de saída
    currentStep.onExit?.();

    // Registrar interação
    const timeSpent = (Date.now() - interactionTimeRef.current) / 1000;
    const interaction = {
      stepId: currentStep.id,
      action: 'next',
      timestamp: new Date(),
      duration: timeSpent
    };

    const nextStepIndex = state.currentStep + 1;
    const isLastStep = nextStepIndex >= state.activeTour.steps.length;

    if (isLastStep) {
      // Completar tour
      await completeTour();
      return;
    }

    const nextStep = state.activeTour.steps[nextStepIndex];
    
    // Validar próximo passo
    if (!await validateStep(nextStep)) {
      toast.error('Não é possível avançar para o próximo passo');
      return;
    }

    // Atualizar estado
    setState(prev => {
      const currentProgress = prev.progress.get(prev.activeTour!.id);
      if (currentProgress) {
        const updatedProgress = {
          ...currentProgress,
          currentStep: nextStepIndex,
          completedSteps: [...currentProgress.completedSteps, currentStep.id],
          lastActivity: new Date(),
          timeSpent: currentProgress.timeSpent + timeSpent,
          interactions: [...currentProgress.interactions, interaction]
        };
        
        return {
          ...prev,
          currentStep: nextStepIndex,
          progress: new Map(prev.progress).set(prev.activeTour!.id, updatedProgress)
        };
      }
      return { ...prev, currentStep: nextStepIndex };
    });

    // Executar callback de entrada
    nextStep.onEnter?.();
    
    // Anunciar passo para acessibilidade
    if (config.enableVoiceOver) {
      accessibilityManager.current.announceStep(nextStep);
    }
    
    // Callback de mudança de passo
    config.onStepChange?.(nextStep, nextStepIndex);
    
    interactionTimeRef.current = Date.now();
  }, [state.activeTour, state.currentStep, state.isPaused, config, validateStep]);

  // Função para ir para passo anterior
  const previousStep = useCallback(() => {
    if (!state.activeTour || state.currentStep <= 0 || state.isPaused) return;

    const currentStep = state.activeTour.steps[state.currentStep];
    currentStep?.onExit?.();

    const prevStepIndex = state.currentStep - 1;
    const prevStep = state.activeTour.steps[prevStepIndex];

    setState(prev => ({ ...prev, currentStep: prevStepIndex }));
    
    prevStep?.onEnter?.();
    
    if (config.enableVoiceOver) {
      accessibilityManager.current.announceStep(prevStep);
    }
    
    config.onStepChange?.(prevStep, prevStepIndex);
    interactionTimeRef.current = Date.now();
  }, [state.activeTour, state.currentStep, state.isPaused, config]);

  // Função para ir para passo específico
  const goToStep = useCallback(async (stepIndex: number) => {
    if (!state.activeTour || stepIndex < 0 || stepIndex >= state.activeTour.steps.length) return;

    const targetStep = state.activeTour.steps[stepIndex];
    if (!await validateStep(targetStep)) {
      toast.error('Não é possível ir para este passo');
      return;
    }

    const currentStep = state.activeTour.steps[state.currentStep];
    currentStep?.onExit?.();

    setState(prev => ({ ...prev, currentStep: stepIndex }));
    
    targetStep.onEnter?.();
    
    if (config.enableVoiceOver) {
      accessibilityManager.current.announceStep(targetStep);
    }
    
    config.onStepChange?.(targetStep, stepIndex);
    interactionTimeRef.current = Date.now();
  }, [state.activeTour, state.currentStep, config, validateStep]);

  // Função para completar tour
  const completeTour = useCallback(async () => {
    if (!state.activeTour) return;

    const timeSpent = (Date.now() - interactionTimeRef.current) / 1000;
    const currentProgress = state.progress.get(state.activeTour.id);
    
    if (currentProgress) {
      const completedProgress: TourProgress = {
        ...currentProgress,
        isCompleted: true,
        timeSpent: currentProgress.timeSpent + timeSpent,
        lastActivity: new Date()
      };

      setState(prev => ({
        ...prev,
        isCompleted: true,
        isPlaying: false,
        completedTours: [...prev.completedTours, state.activeTour!.id],
        progress: new Map(prev.progress).set(state.activeTour!.id, completedProgress),
        analytics: {
          ...prev.analytics,
          totalToursCompleted: prev.analytics.totalToursCompleted + 1,
          averageCompletionTime: (
            (prev.analytics.averageCompletionTime * prev.analytics.totalToursCompleted + completedProgress.timeSpent) /
            (prev.analytics.totalToursCompleted + 1)
          )
        }
      }));

      // Callback de conclusão
      config.onTourComplete?.(state.activeTour, completedProgress);
    }

    // Desabilitar modo de acessibilidade
    accessibilityManager.current.disableTourMode();
    
    toast.success(`Tour "${state.activeTour.name}" concluído!`);
  }, [state.activeTour, state.progress, config]);

  // Função para pular passo
  const skipStep = useCallback(() => {
    if (!state.activeTour) return;
    
    const currentStep = state.activeTour.steps[state.currentStep];
    if (currentStep?.skippable === false) {
      toast.error('Este passo não pode ser pulado');
      return;
    }

    nextStep();
  }, [state.activeTour, state.currentStep, nextStep]);

  // Função para adicionar tour
  const addTour = useCallback((tour: Tour) => {
    setState(prev => ({
      ...prev,
      availableTours: [...prev.availableTours, tour]
    }));
    
    cache.current.set(`tour_${tour.id}`, tour);
    toast.success(`Tour "${tour.name}" adicionado`);
  }, []);

  // Função para remover tour
  const removeTour = useCallback((tourId: string) => {
    setState(prev => ({
      ...prev,
      availableTours: prev.availableTours.filter(tour => tour.id !== tourId),
      progress: (() => {
        const newProgress = new Map(prev.progress);
        newProgress.delete(tourId);
        return newProgress;
      })()
    }));
    
    cache.current.clear();
    toast.success('Tour removido');
  }, []);

  // Função para atualizar preferências
  const updatePreferences = useCallback((preferences: Partial<TourState['userPreferences']>) => {
    setState(prev => ({
      ...prev,
      userPreferences: { ...prev.userPreferences, ...preferences }
    }));
    
    toast.success('Preferências atualizadas');
  }, []);

  // Função para obter tours recomendados
  const getRecommendedTours = useCallback((): Tour[] => {
    const { completedTours, userPreferences } = state;
    
    return state.availableTours
      .filter(tour => {
        // Filtrar tours já completados (se não for repetível)
        if (completedTours.includes(tour.id) && !tour.repeatable) {
          return false;
        }
        
        // Verificar pré-requisitos
        if (tour.prerequisites) {
          return tour.prerequisites.every(prereq => completedTours.includes(prereq));
        }
        
        return tour.isActive;
      })
      .sort((a, b) => {
        // Priorizar por categoria baseada nas preferências
        const categoryPriority = {
          'onboarding': 4,
          'feature': 3,
          'advanced': 2,
          'troubleshooting': 1
        };
        
        return (categoryPriority[b.category] || 0) - (categoryPriority[a.category] || 0);
      })
      .slice(0, 5); // Retornar apenas os 5 primeiros
  }, [state]);

  // Função para exportar dados
  const exportData = useCallback(() => {
    const data = {
      tours: state.availableTours,
      progress: Array.from(state.progress.entries()),
      completedTours: state.completedTours,
      userPreferences: state.userPreferences,
      analytics: state.analytics,
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }, [state]);

  // Função para importar dados
  const importData = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      setState(prev => ({
        ...prev,
        availableTours: data.tours || prev.availableTours,
        progress: new Map(data.progress || []),
        completedTours: data.completedTours || prev.completedTours,
        userPreferences: { ...prev.userPreferences, ...data.userPreferences },
        analytics: { ...prev.analytics, ...data.analytics }
      }));
      
      cache.current.clear();
      toast.success('Dados importados com sucesso');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      toast.error('Erro ao importar dados');
    }
  }, []);

  // Função para resetar progresso
  const resetProgress = useCallback((tourId?: string) => {
    if (tourId) {
      setState(prev => {
        const newProgress = new Map(prev.progress);
        newProgress.delete(tourId);
        return {
          ...prev,
          progress: newProgress,
          completedTours: prev.completedTours.filter(id => id !== tourId)
        };
      });
      toast.success('Progresso do tour resetado');
    } else {
      setState(prev => ({
        ...prev,
        progress: new Map(),
        completedTours: [],
        analytics: {
          totalToursStarted: 0,
          totalToursCompleted: 0,
          averageCompletionTime: 0,
          mostPopularTours: [],
          dropOffPoints: {}
        }
      }));
      toast.success('Todo o progresso foi resetado');
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
      accessibilityManager.current.disableTourMode();
    };
  }, []);

  return {
    state,
    actions: {
      startTour,
      stopTour,
      pauseTour,
      resumeTour,
      nextStep,
      previousStep,
      goToStep,
      skipStep,
      completeTour,
      addTour,
      removeTour,
      updatePreferences,
      resetProgress,
      exportData,
      importData
    },
    utils: {
      validateStep,
      getRecommendedTours,
      positionManager: positionManager.current,
      accessibilityManager: accessibilityManager.current
    },
    cache: cache.current
  };
};

export default useInteractiveTour;