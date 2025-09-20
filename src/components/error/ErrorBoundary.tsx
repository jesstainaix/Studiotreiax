import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'sonner';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log do erro
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Reportar erro
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }

    // Toast de notificação
    toast.error('Ocorreu um erro inesperado. Tente recarregar a página.', {
      duration: 5000,
      action: {
        label: 'Tentar novamente',
        onClick: () => this.handleRetry(),
      },
    });
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.props.level || 'component',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId,
      };

      // Aqui você pode enviar para seu serviço de monitoramento
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      toast.error('Número máximo de tentativas excedido. Recarregue a página.');
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Delay antes de tentar novamente
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, this.retryDelay);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private renderErrorDetails = () => {
    if (!this.props.showDetails || !this.state.error) {
      return null;
    }

    return (
      <details className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
          Detalhes técnicos
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <h4 className="font-medium text-gray-700">Erro:</h4>
            <pre className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {this.state.error.message}
            </pre>
          </div>
          {this.state.error.stack && (
            <div>
              <h4 className="font-medium text-gray-700">Stack Trace:</h4>
              <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {this.state.error.stack}
              </pre>
            </div>
          )}
          {this.state.errorInfo?.componentStack && (
            <div>
              <h4 className="font-medium text-gray-700">Component Stack:</h4>
              <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-700">Error ID:</h4>
            <code className="mt-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {this.state.errorId}
            </code>
          </div>
        </div>
      </details>
    );
  };

  private renderFallbackUI = () => {
    const { level = 'component' } = this.props;
    
    // UI diferente baseada no nível
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mt-4 text-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Oops! Algo deu errado
              </h1>
              <p className="mt-2 text-gray-600">
                Ocorreu um erro inesperado nesta página. Tente recarregar ou volte à página inicial.
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= this.maxRetries}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente ({this.maxRetries - this.state.retryCount})
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Página inicial
              </button>
            </div>
            {this.renderErrorDetails()}
          </div>
        </div>
      );
    }

    if (level === 'section') {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Erro nesta seção
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Esta seção não pôde ser carregada. Tente recarregar.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= this.maxRetries}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
          {this.renderErrorDetails()}
        </div>
      );
    }

    // Nível de componente (padrão)
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start">
          <Bug className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="ml-2 flex-1">
            <p className="text-sm text-yellow-800">
              Este componente encontrou um erro.
            </p>
            <button
              onClick={this.handleRetry}
              disabled={this.state.retryCount >= this.maxRetries}
              className="mt-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
        {this.renderErrorDetails()}
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderizar UI padrão baseada no nível
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// HOC para facilitar o uso
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook para usar dentro de componentes funcionais
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};