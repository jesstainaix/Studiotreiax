import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, Loader2, Upload, Download, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for feedback system
export interface FeedbackItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number;
  persistent?: boolean;
}

export interface ActionFeedback {
  id: string;
  action: 'save' | 'export' | 'upload' | 'delete' | 'sync' | 'generate';
  status: 'pending' | 'success' | 'error';
  progress?: number;
  message?: string;
}

// Feedback context
interface FeedbackContextType {
  items: FeedbackItem[];
  actions: ActionFeedback[];
  addFeedback: (item: Omit<FeedbackItem, 'id'>) => string;
  removeFeedback: (id: string) => void;
  updateFeedback: (id: string, updates: Partial<FeedbackItem>) => void;
  addActionFeedback: (action: Omit<ActionFeedback, 'id'>) => string;
  updateActionFeedback: (id: string, updates: Partial<ActionFeedback>) => void;
  removeActionFeedback: (id: string) => void;
}

const FeedbackContext = React.createContext<FeedbackContextType | null>(null);

// Feedback provider
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [actions, setActions] = useState<ActionFeedback[]>([]);

  const addFeedback = useCallback((item: Omit<FeedbackItem, 'id'>) => {
    const id = `feedback_${Date.now()}_${Math.random()}`;
    const newItem: FeedbackItem = {
      ...item,
      id,
      duration: item.duration ?? (item.type === 'loading' ? undefined : 5000)
    };

    setItems(prev => [...prev, newItem]);

    // Auto-remove non-persistent items
    if (!item.persistent && item.type !== 'loading' && newItem.duration) {
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== id));
      }, newItem.duration);
    }

    return id;
  }, []);

  const removeFeedback = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateFeedback = useCallback((id: string, updates: Partial<FeedbackItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const addActionFeedback = useCallback((action: Omit<ActionFeedback, 'id'>) => {
    const id = `action_${Date.now()}_${Math.random()}`;
    const newAction: ActionFeedback = { ...action, id };
    
    setActions(prev => [...prev, newAction]);
    return id;
  }, []);

  const updateActionFeedback = useCallback((id: string, updates: Partial<ActionFeedback>) => {
    setActions(prev => prev.map(action => 
      action.id === id ? { ...action, ...updates } : action
    ));
  }, []);

  const removeActionFeedback = useCallback((id: string) => {
    setActions(prev => prev.filter(action => action.id !== id));
  }, []);

  return (
    <FeedbackContext.Provider value={{
      items,
      actions,
      addFeedback,
      removeFeedback,
      updateFeedback,
      addActionFeedback,
      updateActionFeedback,
      removeActionFeedback
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

// Hook to use feedback
export function useFeedback() {
  const context = React.useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

// Toast notification component
export function FeedbackToast({ item, onRemove }: { item: FeedbackItem; onRemove: () => void }) {
  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (item.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
        getBgColor()
      )}
    >
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
        {item.message && (
          <p className="text-sm text-gray-600 mt-1">{item.message}</p>
        )}
        
        {item.progress !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{Math.round(item.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
        
        {item.action && (
          <button
            onClick={item.action.onClick}
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
          >
            {item.action.label}
          </button>
        )}
      </div>
      
      {!item.persistent && (
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

// Toast container
export function FeedbackToastContainer() {
  const { items, removeFeedback } = useFeedback();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {items.map(item => (
          <FeedbackToast
            key={item.id}
            item={item}
            onRemove={() => removeFeedback(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Action feedback component
export function ActionFeedbackIndicator({ action }: { action: ActionFeedback }) {
  const getIcon = () => {
    switch (action.action) {
      case 'save':
        return <Save className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'sync':
        return <Loader2 className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (action.status) {
      case 'pending':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border bg-white shadow-sm',
        getStatusColor()
      )}
    >
      <div className={cn(
        action.status === 'pending' && 'animate-spin'
      )}>
        {getIcon()}
      </div>
      
      <span className="text-sm font-medium capitalize">
        {action.action === 'sync' ? 'Sincronizando' : action.action}
      </span>
      
      {action.progress !== undefined && (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-1">
            <motion.div
              className="bg-current h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${action.progress}%` }}
            />
          </div>
          <span className="text-xs">{Math.round(action.progress)}%</span>
        </div>
      )}
    </motion.div>
  );
}

// Action feedback container
export function ActionFeedbackContainer() {
  const { actions } = useFeedback();

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-2">
      <AnimatePresence>
        {actions.map(action => (
          <ActionFeedbackIndicator key={action.id} action={action} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for action feedback
export function useActionFeedback() {
  const { addActionFeedback, updateActionFeedback, removeActionFeedback } = useFeedback();

  const trackAction = useCallback(async (
    action: ActionFeedback['action'],
    asyncFn: () => Promise<any>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      showProgress?: boolean;
    }
  ) => {
    const id = addActionFeedback({
      action,
      status: 'pending',
      progress: options?.showProgress ? 0 : undefined
    });

    try {
      const result = await asyncFn();
      
      updateActionFeedback(id, {
        status: 'success',
        progress: 100,
        message: options?.successMessage
      });

      // Remove after success
      setTimeout(() => removeActionFeedback(id), 2000);
      
      return result;
    } catch (error) {
      updateActionFeedback(id, {
        status: 'error',
        message: options?.errorMessage || 'Erro na operação'
      });

      // Remove after error
      setTimeout(() => removeActionFeedback(id), 5000);
      
      throw error;
    }
  }, [addActionFeedback, updateActionFeedback, removeActionFeedback]);

  const updateProgress = useCallback((id: string, progress: number) => {
    updateActionFeedback(id, { progress });
  }, [updateActionFeedback]);

  return { trackAction, updateProgress };
}