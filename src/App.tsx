import { BrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import AppRouter from './components/AppRouter';
import './App.css';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        if (import.meta.env.PROD) {
          console.error('Erro:', error.message);
        }
      }}
    >
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="App">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          }>
            <AppRouter />
          </Suspense>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;