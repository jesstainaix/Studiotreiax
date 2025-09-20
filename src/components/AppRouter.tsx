import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/dashboard';
import Templates from '../pages/templates';
import PPTXStudio from '../pages/PPTXStudio';
import VideoEditor from '../pages/VideoEditor';
import PerformanceOptimizer from '../pages/PerformanceOptimizer';
import Avatars from '../pages/Avatars';
import AIGenerative from '../pages/AIGenerative';
import VideoAnalytics from '../pages/VideoAnalytics';
import Settings from '../pages/Settings';
import StudioMainInterface from './StudioMainInterface';
import VideoEditorDashboard from './video-editor/VideoEditorDashboard';
import VFXStudioPage from '../pages/VFXStudioPage';

// Componente de loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
  </div>
);

const AppRouter: React.FC = () => {

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Rota raiz - redireciona para dashboard */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />

        {/* Rotas principais */}
        <Route 
          path="/dashboard" 
          element={<Dashboard />} 
        />
        <Route 
          path="/editor" 
          element={<VideoEditorDashboard />} 
        />
        <Route 
          path="/video-editor/*" 
          element={<VideoEditorDashboard />} 
        />
        <Route 
          path="/projects" 
          element={<StudioMainInterface />} 
        />
        <Route 
          path="/templates" 
          element={<Templates />} 
        />
        <Route 
          path="/upload" 
          element={<StudioMainInterface />} 
        />
        
        {/* Rotas de módulos específicos */}
        <Route 
          path="/avatars" 
          element={<Avatars />} 
        />
        <Route 
          path="/vfx-studio" 
          element={<VFXStudioPage />} 
        />
        <Route 
          path="/pptx-studio" 
          element={<PPTXStudio />} 
        />
        <Route 
          path="/video-editor" 
          element={<VideoEditor />} 
        />
        <Route 
          path="/performance-optimizer" 
          element={<PerformanceOptimizer />} 
        />
        <Route 
          path="/ai-generative" 
          element={<AIGenerative />} 
        />
        <Route 
          path="/video-analytics" 
          element={<VideoAnalytics />} 
        />
        <Route 
          path="/performance-dashboard" 
          element={<StudioMainInterface />} 
        />
        <Route 
          path="/settings" 
          element={<Settings />} 
        />

        {/* Rota catch-all para páginas não encontradas */}
        <Route 
          path="*" 
          element={<NotFound />} 
        />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;