import React from 'react';

// Lazy loaded components
const AIConfigurationModal = React.lazy(() => import('../components/modals/AIConfigurationModal'));
const OptimizedPromptsModal = React.lazy(() => import('../components/modals/OptimizedPromptsModal'));
const ContentImprovementModal = React.lazy(() => import('../components/modals/ContentImprovementModal'));
const AdvancedSettingsModal = React.lazy(() => import('../components/modals/AdvancedSettingsModal'));
const ExportOptionsModal = React.lazy(() => import('../components/modals/ExportOptionsModal'));
const ProjectSettingsModal = React.lazy(() => import('../components/modals/ProjectSettingsModal'));
const CollaborationModal = React.lazy(() => import('../components/modals/CollaborationModal'));
const TemplateLibraryModal = React.lazy(() => import('../components/modals/TemplateLibraryModal'));
const AssetManagerModal = React.lazy(() => import('../components/modals/AssetManagerModal'));
const PerformanceAnalyticsModal = React.lazy(() => import('../components/modals/PerformanceAnalyticsModal'));
const QualityAssuranceModal = React.lazy(() => import('../components/modals/QualityAssuranceModal'));
const SmartSuggestionsModal = React.lazy(() => import('../components/modals/SmartSuggestionsModal'));
const ContentAnalyzerModal = React.lazy(() => import('../components/modals/ContentAnalyzerModal'));
const AutoOptimizerModal = React.lazy(() => import('../components/modals/AutoOptimizerModal'));

// Loading fallback component
const ModalLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Carregando...</span>
  </div>
);

// Hook for lazy modal loading
export const useLazyModal = (modalName: string) => {
  const ModalComponent = LAZY_MODALS[modalName as keyof typeof LAZY_MODALS];
  
  if (!ModalComponent) {
    console.warn(`Modal "${modalName}" not found in lazy modals registry`);
    return null;
  }
  
  return ModalComponent;
};

// Wrapper component for lazy loading
export const LazyModalWrapper: React.FC<{ modalName: string; [key: string]: any }> = ({ modalName, ...props }) => {
  const ModalComponent = useLazyModal(modalName);
  
  if (!ModalComponent) {
    return null;
  }
  
  return (
    <React.Suspense fallback={<ModalLoadingFallback />}>
      <ModalComponent {...props} />
    </React.Suspense>
  );
};

// Modal registry
export const LAZY_MODALS = {
  aiConfiguration: AIConfigurationModal,
  optimizedPrompts: OptimizedPromptsModal,
  contentImprovement: ContentImprovementModal,
  advancedSettings: AdvancedSettingsModal,
  exportOptions: ExportOptionsModal,
  projectSettings: ProjectSettingsModal,
  collaboration: CollaborationModal,
  templateLibrary: TemplateLibraryModal,
  assetManager: AssetManagerModal,
  performanceAnalytics: PerformanceAnalyticsModal,
  qualityAssurance: QualityAssuranceModal,
  smartSuggestions: SmartSuggestionsModal,
  contentAnalyzer: ContentAnalyzerModal,
  autoOptimizer: AutoOptimizerModal
} as const;

// Modal types
export type ModalName = keyof typeof LAZY_MODALS;

export type LazyModalProps = {
  modalName: ModalName;
  isOpen: boolean;
  onClose: () => void;
  [key: string]: any;
};

// Export loading fallback
export { ModalLoadingFallback };

// Export lazy components
export {
  AIConfigurationModal,
  OptimizedPromptsModal,
  ContentImprovementModal,
  AdvancedSettingsModal,
  ExportOptionsModal,
  ProjectSettingsModal,
  CollaborationModal,
  TemplateLibraryModal,
  AssetManagerModal,
  PerformanceAnalyticsModal,
  QualityAssuranceModal,
  SmartSuggestionsModal,
  ContentAnalyzerModal,
  AutoOptimizerModal
};