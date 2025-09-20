import React from 'react';
import { cn } from '../../lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  type = 'info',
  onClose,
  className
}) => {
  const typeStyles = {
    success: {
      container: 'bg-success-50 border-success-200 text-success-800',
      icon: CheckCircle,
      iconColor: 'text-success-500'
    },
    error: {
      container: 'bg-danger-50 border-danger-200 text-danger-800',
      icon: AlertCircle,
      iconColor: 'text-danger-500'
    },
    warning: {
      container: 'bg-accent-50 border-accent-200 text-accent-800',
      icon: AlertTriangle,
      iconColor: 'text-accent-500'
    },
    info: {
      container: 'bg-primary-50 border-primary-200 text-primary-800',
      icon: Info,
      iconColor: 'text-primary-500'
    }
  };

  const config = typeStyles[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-sm animate-slide-up',
        config.container,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-heading font-semibold mb-1">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-sm font-body">
            {description}
          </p>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors',
            config.iconColor
          )}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastProps[];
  className?: string;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, className }) => {
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full',
        className
      )}
    >
      {toasts.map((toast, index) => (
        <Toast key={toast.id || index} {...toast} />
      ))}
    </div>
  );
};

export { Toast, ToastContainer };