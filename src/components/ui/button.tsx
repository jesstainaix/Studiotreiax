import * as React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:translate-y-[-1px] active:translate-y-[1px]';
    
    const variants = {
      default: 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg',
      destructive: 'bg-danger-500 text-white hover:bg-danger-600 shadow-md hover:shadow-lg',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 shadow-sm hover:shadow-md',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 shadow-md hover:shadow-lg',
      ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      link: 'text-primary-500 underline-offset-4 hover:underline hover:text-primary-600',
      success: 'bg-success-500 text-white hover:bg-success-600 shadow-md hover:shadow-lg'
    };
    
    const sizes = {
      default: 'h-10 py-2 px-4',
      sm: 'h-8 px-3 text-xs rounded-md',
      lg: 'h-11 px-8 rounded-md text-base',
      xl: 'h-12 px-10 rounded-md text-lg',
      icon: 'h-10 w-10 p-2'
    };
    
    // Loading spinner component
    const LoadingSpinner = () => (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          isLoading && 'opacity-80 pointer-events-none',
          className
        )}
        disabled={isLoading || props.disabled}
        ref={ref}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };