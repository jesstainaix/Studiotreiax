import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Performance monitoring imports (lazy loaded)
const webVitals: any = null

// Get performance log level from environment
const PERF_LOG_LEVEL = import.meta.env.VITE_PERFORMANCE_LOG_LEVEL || 'warn'
const ENABLE_MONITORING = import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' && import.meta.env.PROD

// Debounce utility function
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Performance logger based on level
const perfLog = {
  error: (message: string, data?: any) => {
    if (['error', 'warn', 'info'].includes(PERF_LOG_LEVEL)) {
      console.error(message, data)
    }
  },
  warn: (message: string, data?: any) => {
    if (['warn', 'info'].includes(PERF_LOG_LEVEL)) {
      console.warn(message, data)
    }
  },
  info: (message: string, data?: any) => {
    if (PERF_LOG_LEVEL === 'info') {
      console.info(message, data)
    }
  }
}

// Performance debugging utilities
if (ENABLE_MONITORING) {
  ;(window as any).performanceDebug = {
    getMetrics: () => {
      try {
        return {
          navigation: performance.getEntriesByType('navigation')[0],
          resources: performance.getEntriesByType('resource'),
          marks: performance.getEntriesByType('mark'),
          measures: performance.getEntriesByType('measure'),
          memory: (performance as any).memory,
          connection: (navigator as any).connection,
        }
      } catch (e) {
        console.error('❌ Erro ao obter métricas de performance', e)
        return {}
      }
    },
    clearMetrics: () => {
      try {
        performance.clearMarks()
        performance.clearMeasures()
        performance.clearResourceTimings()
        perfLog.info('✅ Métricas de performance limpas')
      } catch (e) {
        perfLog.error('❌ Erro ao limpar métricas', e)
      }
    }
  }
}

// Initialize React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)