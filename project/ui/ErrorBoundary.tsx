// Error Boundary for Avatar Management System
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class AvatarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AvatarErrorBoundary] Component error:', error);
    console.error('[AvatarErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `${this.props.componentName || 'AvatarComponent'}: ${error.message}`,
        fatal: false
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              Erro no Sistema de Avatares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-red-700 mb-2">
                Ocorreu um erro no componente {this.props.componentName || 'de avatares'}:
              </p>
              <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                {this.state.error?.message || 'Erro desconhecido'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={this.handleReset}
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer font-medium">
                  Detalhes do Erro (Dev)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for easy wrapping
export function withAvatarErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedWithErrorBoundary = (props: P) => (
    <AvatarErrorBoundary componentName={componentName}>
      <WrappedComponent {...props} />
    </AvatarErrorBoundary>
  );

  WrappedWithErrorBoundary.displayName = `withAvatarErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WrappedWithErrorBoundary;
}

export default AvatarErrorBoundary;