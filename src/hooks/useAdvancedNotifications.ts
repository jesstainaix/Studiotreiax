import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Tipos para o sistema de notificações
export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  icon?: React.ReactNode;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'loading';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'user' | 'performance' | 'security' | 'update' | 'collaboration';
  timestamp: Date;
  duration?: number; // em ms, undefined = persistente
  persistent?: boolean;
  dismissible?: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  progress?: number; // 0-100 para notificações de progresso
  sound?: boolean;
  vibration?: boolean;
  desktop?: boolean; // notificação desktop
  groupId?: string; // para agrupar notificações relacionadas
  replaceId?: string; // para substituir notificação existente
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  animation?: 'slide' | 'fade' | 'bounce' | 'scale';
  theme?: 'light' | 'dark' | 'auto';
  richContent?: React.ReactNode;
  onShow?: () => void;
  onHide?: () => void;
  onClick?: () => void;
  onAction?: (actionId: string) => void;
}

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: NotificationData[];
  collapsed: boolean;
  priority: NotificationData['priority'];
  category: NotificationData['category'];
}

export interface NotificationFilter {
  types?: NotificationData['type'][];
  priorities?: NotificationData['priority'][];
  categories?: NotificationData['category'][];
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
  showDismissed?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  desktopEnabled: boolean;
  maxNotifications: number;
  defaultDuration: number;
  groupSimilar: boolean;
  showPreviews: boolean;
  position: NotificationData['position'];
  animation: NotificationData['animation'];
  theme: NotificationData['theme'];
  autoMarkAsRead: boolean;
  persistCritical: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  categorySettings: Record<NotificationData['category'], {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    priority: NotificationData['priority'];
  }>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationData['type'], number>;
  byCategory: Record<NotificationData['category'], number>;
  byPriority: Record<NotificationData['priority'], number>;
  dismissedToday: number;
  averageResponseTime: number;
  mostActiveCategory: NotificationData['category'];
  peakHours: string[];
}

export interface NotificationState {
  notifications: NotificationData[];
  groups: NotificationGroup[];
  dismissedNotifications: NotificationData[];
  settings: NotificationSettings;
  filter: NotificationFilter;
  stats: NotificationStats;
  isVisible: boolean;
  activeNotification: NotificationData | null;
  queue: NotificationData[];
  isProcessingQueue: boolean;
  permissionStatus: NotificationPermission;
  isOnline: boolean;
  lastSync: Date | null;
}

export interface NotificationConfig {
  maxNotifications?: number;
  defaultDuration?: number;
  enableGrouping?: boolean;
  enableDesktop?: boolean;
  enableSound?: boolean;
  enableVibration?: boolean;
  position?: NotificationData['position'];
  animation?: NotificationData['animation'];
  theme?: NotificationData['theme'];
  onNotificationClick?: (notification: NotificationData) => void;
  onNotificationDismiss?: (notification: NotificationData) => void;
  onPermissionChange?: (permission: NotificationPermission) => void;
}

// Cache para otimização
class NotificationCache {
  private cache = new Map<string, NotificationData>();
  private maxSize = 1000;

  set(key: string, notification: NotificationData): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, notification);
  }

  get(key: string): NotificationData | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Gerenciador de permissões
class PermissionManager {
  static async requestDesktopPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  static canShowDesktop(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  static canVibrate(): boolean {
    return 'vibrate' in navigator;
  }

  static canPlaySound(): boolean {
    return 'Audio' in window;
  }
}

// Gerenciador de som
class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();

  constructor() {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async loadSound(type: NotificationData['type']): Promise<void> {
    if (!this.audioContext) return;

    const soundUrls = {
      info: '/sounds/notification-info.mp3',
      success: '/sounds/notification-success.mp3',
      warning: '/sounds/notification-warning.mp3',
      error: '/sounds/notification-error.mp3',
      loading: '/sounds/notification-loading.mp3'
    };

    const url = soundUrls[type];
    if (!url || this.sounds.has(type)) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(type, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound for ${type}:`, error);
    }
  }

  playSound(type: NotificationData['type']): void {
    if (!this.audioContext || !this.sounds.has(type)) return;

    const audioBuffer = this.sounds.get(type)!;
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  async playBeep(frequency = 800, duration = 200): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }
}

// Hook principal
export const useAdvancedNotifications = (config: NotificationConfig = {}) => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    groups: [],
    dismissedNotifications: [],
    settings: {
      enabled: true,
      soundEnabled: config.enableSound ?? true,
      vibrationEnabled: config.enableVibration ?? true,
      desktopEnabled: config.enableDesktop ?? false,
      maxNotifications: config.maxNotifications ?? 10,
      defaultDuration: config.defaultDuration ?? 5000,
      groupSimilar: config.enableGrouping ?? true,
      showPreviews: true,
      position: config.position ?? 'top-right',
      animation: config.animation ?? 'slide',
      theme: config.theme ?? 'auto',
      autoMarkAsRead: true,
      persistCritical: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      categorySettings: {
        system: { enabled: true, sound: true, desktop: true, priority: 'medium' },
        user: { enabled: true, sound: true, desktop: false, priority: 'low' },
        performance: { enabled: true, sound: false, desktop: true, priority: 'high' },
        security: { enabled: true, sound: true, desktop: true, priority: 'critical' },
        update: { enabled: true, sound: false, desktop: false, priority: 'medium' },
        collaboration: { enabled: true, sound: true, desktop: false, priority: 'medium' }
      }
    },
    filter: {},
    stats: {
      total: 0,
      unread: 0,
      byType: { info: 0, success: 0, warning: 0, error: 0, loading: 0 },
      byCategory: { system: 0, user: 0, performance: 0, security: 0, update: 0, collaboration: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      dismissedToday: 0,
      averageResponseTime: 0,
      mostActiveCategory: 'system',
      peakHours: []
    },
    isVisible: false,
    activeNotification: null,
    queue: [],
    isProcessingQueue: false,
    permissionStatus: 'default',
    isOnline: navigator.onLine,
    lastSync: null
  });

  const cache = useRef(new NotificationCache());
  const soundManager = useRef(new SoundManager());
  const queueProcessor = useRef<NodeJS.Timeout | null>(null);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);

  // Verificar permissões na inicialização
  useEffect(() => {
    const checkPermissions = async () => {
      const permission = await PermissionManager.requestDesktopPermission();
      setState(prev => ({ ...prev, permissionStatus: permission }));
      config.onPermissionChange?.(permission);
    };

    checkPermissions();
  }, [config]);

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Processar fila de notificações
  const processQueue = useCallback(() => {
    setState(prev => {
      if (prev.queue.length === 0 || prev.isProcessingQueue) {
        return prev;
      }

      const notification = prev.queue[0];
      const remainingQueue = prev.queue.slice(1);

      // Verificar se deve mostrar a notificação
      const categorySettings = prev.settings.categorySettings[notification.category];
      if (!categorySettings.enabled) {
        return {
          ...prev,
          queue: remainingQueue,
          isProcessingQueue: false
        };
      }

      // Verificar horário silencioso
      if (prev.settings.quietHours.enabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const { start, end } = prev.settings.quietHours;
        
        if (currentTime >= start || currentTime <= end) {
          // Durante horário silencioso, só mostrar notificações críticas
          if (notification.priority !== 'critical') {
            return {
              ...prev,
              queue: remainingQueue,
              isProcessingQueue: false
            };
          }
        }
      }

      // Adicionar à lista de notificações
      const updatedNotifications = [...prev.notifications];
      
      // Verificar se deve substituir notificação existente
      if (notification.replaceId) {
        const replaceIndex = updatedNotifications.findIndex(n => n.id === notification.replaceId);
        if (replaceIndex !== -1) {
          updatedNotifications[replaceIndex] = notification;
        } else {
          updatedNotifications.push(notification);
        }
      } else {
        updatedNotifications.push(notification);
      }

      // Limitar número máximo de notificações
      while (updatedNotifications.length > prev.settings.maxNotifications) {
        const removed = updatedNotifications.shift();
        if (removed && !removed.persistent) {
          // Mover para dismissedNotifications se não for persistente
          prev.dismissedNotifications.push(removed);
        }
      }

      return {
        ...prev,
        notifications: updatedNotifications,
        queue: remainingQueue,
        isProcessingQueue: false,
        activeNotification: notification
      };
    });
  }, []);

  // Iniciar processamento da fila
  useEffect(() => {
    if (queueProcessor.current) {
      clearInterval(queueProcessor.current);
    }

    queueProcessor.current = setInterval(processQueue, 100);

    return () => {
      if (queueProcessor.current) {
        clearInterval(queueProcessor.current);
      }
    };
  }, [processQueue]);

  // Função para mostrar notificação
  const showNotification = useCallback((data: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const notification: NotificationData = {
      id: data.replaceId || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      duration: data.duration ?? state.settings.defaultDuration,
      dismissible: data.dismissible ?? true,
      sound: data.sound ?? state.settings.soundEnabled,
      vibration: data.vibration ?? state.settings.vibrationEnabled,
      desktop: data.desktop ?? state.settings.desktopEnabled,
      position: data.position ?? state.settings.position,
      animation: data.animation ?? state.settings.animation,
      theme: data.theme ?? state.settings.theme,
      ...data
    };

    // Adicionar à fila
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, notification]
    }));

    // Cache da notificação
    cache.current.set(notification.id, notification);

    // Tocar som se habilitado
    if (notification.sound && state.settings.soundEnabled) {
      soundManager.current.playSound(notification.type);
    }

    // Vibrar se habilitado
    if (notification.vibration && state.settings.vibrationEnabled && PermissionManager.canVibrate()) {
      const patterns = {
        info: [100],
        success: [100, 50, 100],
        warning: [200, 100, 200],
        error: [300, 100, 300, 100, 300],
        loading: [50, 50, 50]
      };
      navigator.vibrate(patterns[notification.type]);
    }

    // Notificação desktop se habilitada
    if (notification.desktop && state.settings.desktopEnabled && PermissionManager.canShowDesktop()) {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.groupId || notification.id,
        requireInteraction: notification.priority === 'critical'
      });

      desktopNotification.onclick = () => {
        notification.onClick?.();
        config.onNotificationClick?.(notification);
        desktopNotification.close();
      };

      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          desktopNotification.close();
        }, notification.duration);
      }
    }

    // Mostrar toast
    const toastOptions = {
      duration: notification.duration,
      position: notification.position,
      dismissible: notification.dismissible,
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: notification.actions[0].action
      } : undefined
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'error':
        toast.error(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      case 'loading':
        toast.loading(notification.title, toastOptions);
        break;
      default:
        toast(notification.title, toastOptions);
    }

    // Callback de exibição
    notification.onShow?.();

    return notification.id;
  }, [state.settings, config]);

  // Função para dispensar notificação
  const dismissNotification = useCallback((id: string) => {
    setState(prev => {
      const notification = prev.notifications.find(n => n.id === id);
      if (!notification) return prev;

      const updatedNotifications = prev.notifications.filter(n => n.id !== id);
      const updatedDismissed = [...prev.dismissedNotifications, notification];

      // Callback de ocultação
      notification.onHide?.();
      config.onNotificationDismiss?.(notification);

      return {
        ...prev,
        notifications: updatedNotifications,
        dismissedNotifications: updatedDismissed
      };
    });
  }, [config]);

  // Função para dispensar todas as notificações
  const dismissAll = useCallback(() => {
    setState(prev => {
      const updatedDismissed = [...prev.dismissedNotifications, ...prev.notifications];
      
      prev.notifications.forEach(notification => {
        notification.onHide?.();
        config.onNotificationDismiss?.(notification);
      });

      return {
        ...prev,
        notifications: [],
        dismissedNotifications: updatedDismissed
      };
    });
  }, [config]);

  // Função para marcar como lida
  const markAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === id ? { ...n, metadata: { ...n.metadata, read: true } } : n
      )
    }));
  }, []);

  // Função para marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({
        ...n,
        metadata: { ...n.metadata, read: true }
      }))
    }));
  }, []);

  // Função para atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  // Função para aplicar filtro
  const applyFilter = useCallback((filter: NotificationFilter) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  // Função para limpar filtro
  const clearFilter = useCallback(() => {
    setState(prev => ({ ...prev, filter: {} }));
  }, []);

  // Função para obter notificações filtradas
  const getFilteredNotifications = useCallback(() => {
    let filtered = state.notifications;

    if (state.filter.types?.length) {
      filtered = filtered.filter(n => state.filter.types!.includes(n.type));
    }

    if (state.filter.priorities?.length) {
      filtered = filtered.filter(n => state.filter.priorities!.includes(n.priority));
    }

    if (state.filter.categories?.length) {
      filtered = filtered.filter(n => state.filter.categories!.includes(n.category));
    }

    if (state.filter.dateRange) {
      const { start, end } = state.filter.dateRange;
      filtered = filtered.filter(n => 
        n.timestamp >= start && n.timestamp <= end
      );
    }

    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [state.notifications, state.filter]);

  // Função para agrupar notificações
  const groupNotifications = useCallback(() => {
    if (!state.settings.groupSimilar) {
      return [];
    }

    const groups = new Map<string, NotificationGroup>();
    
    state.notifications.forEach(notification => {
      const groupKey = notification.groupId || `${notification.category}_${notification.type}`;
      
      if (groups.has(groupKey)) {
        const group = groups.get(groupKey)!;
        group.notifications.push(notification);
        
        // Atualizar prioridade do grupo para a maior prioridade
        const priorities = ['low', 'medium', 'high', 'critical'];
        const currentPriorityIndex = priorities.indexOf(group.priority);
        const notificationPriorityIndex = priorities.indexOf(notification.priority);
        
        if (notificationPriorityIndex > currentPriorityIndex) {
          group.priority = notification.priority;
        }
      } else {
        groups.set(groupKey, {
          id: groupKey,
          title: notification.groupId ? `Grupo: ${notification.title}` : `${notification.category} - ${notification.type}`,
          notifications: [notification],
          collapsed: false,
          priority: notification.priority,
          category: notification.category
        });
      }
    });

    return Array.from(groups.values());
  }, [state.notifications, state.settings.groupSimilar]);

  // Função para calcular estatísticas
  const calculateStats = useCallback((): NotificationStats => {
    const total = state.notifications.length + state.dismissedNotifications.length;
    const unread = state.notifications.filter(n => !n.metadata?.read).length;
    
    const byType = { info: 0, success: 0, warning: 0, error: 0, loading: 0 };
    const byCategory = { system: 0, user: 0, performance: 0, security: 0, update: 0, collaboration: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };
    
    [...state.notifications, ...state.dismissedNotifications].forEach(n => {
      byType[n.type]++;
      byCategory[n.category]++;
      byPriority[n.priority]++;
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dismissedToday = state.dismissedNotifications.filter(n => 
      n.timestamp >= today
    ).length;
    
    const mostActiveCategory = Object.entries(byCategory)
      .reduce((a, b) => byCategory[a[0] as keyof typeof byCategory] > byCategory[b[0] as keyof typeof byCategory] ? a : b)[0] as NotificationData['category'];
    
    return {
      total,
      unread,
      byType,
      byCategory,
      byPriority,
      dismissedToday,
      averageResponseTime: 0, // Calcular baseado em métricas reais
      mostActiveCategory,
      peakHours: [] // Calcular baseado em histórico
    };
  }, [state.notifications, state.dismissedNotifications]);

  // Função para exportar dados
  const exportData = useCallback(() => {
    const data = {
      notifications: state.notifications,
      dismissedNotifications: state.dismissedNotifications,
      settings: state.settings,
      stats: calculateStats(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }, [state, calculateStats]);

  // Função para importar dados
  const importData = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      setState(prev => ({
        ...prev,
        notifications: data.notifications || [],
        dismissedNotifications: data.dismissedNotifications || [],
        settings: { ...prev.settings, ...data.settings },
        lastSync: new Date()
      }));
      
      showNotification({
        title: 'Dados Importados',
        message: 'Configurações e notificações foram importadas com sucesso',
        type: 'success',
        category: 'system',
        priority: 'medium'
      });
    } catch (error) {
      showNotification({
        title: 'Erro na Importação',
        message: 'Falha ao importar dados. Verifique o formato do arquivo.',
        type: 'error',
        category: 'system',
        priority: 'high'
      });
    }
  }, [showNotification]);

  // Função para limpar histórico
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      dismissedNotifications: []
    }));
  }, []);

  // Atualizar estatísticas
  useEffect(() => {
    const stats = calculateStats();
    setState(prev => ({ ...prev, stats }));
  }, [state.notifications, state.dismissedNotifications, calculateStats]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (queueProcessor.current) {
        clearInterval(queueProcessor.current);
      }
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, []);

  // Funções de conveniência
  const showInfo = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return showNotification({
      title,
      message,
      type: 'info',
      category: 'user',
      priority: 'low',
      ...options
    });
  }, [showNotification]);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return showNotification({
      title,
      message,
      type: 'success',
      category: 'user',
      priority: 'medium',
      ...options
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return showNotification({
      title,
      message,
      type: 'warning',
      category: 'system',
      priority: 'high',
      ...options
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return showNotification({
      title,
      message,
      type: 'error',
      category: 'system',
      priority: 'critical',
      ...options
    });
  }, [showNotification]);

  const showLoading = useCallback((title: string, message: string, options?: Partial<NotificationData>) => {
    return showNotification({
      title,
      message,
      type: 'loading',
      category: 'system',
      priority: 'medium',
      persistent: true,
      ...options
    });
  }, [showNotification]);

  return {
    state,
    actions: {
      showNotification,
      dismissNotification,
      dismissAll,
      markAsRead,
      markAllAsRead,
      updateSettings,
      applyFilter,
      clearFilter,
      exportData,
      importData,
      clearHistory,
      showInfo,
      showSuccess,
      showWarning,
      showError,
      showLoading
    },
    utils: {
      getFilteredNotifications,
      groupNotifications,
      calculateStats,
      canShowDesktop: PermissionManager.canShowDesktop,
      canVibrate: PermissionManager.canVibrate,
      canPlaySound: PermissionManager.canPlaySound
    }
  };
};

export default useAdvancedNotifications;