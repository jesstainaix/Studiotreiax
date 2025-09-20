// Componente avançado para customização de tema
import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Zap,
  Eye,
  EyeOff,
  Type,
  Square,
  Download,
  Upload,
  RotateCcw,
  Settings,
  Sparkles,
  Contrast,
  Timer,
  Smartphone,
  Tablet,
  Laptop,
  Check,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  Play,
  Pause
} from 'lucide-react';
import { useTheme, useThemeAnimations, useThemeClasses } from '../../hooks/useTheme';
import { ThemeMode, ColorScheme, AnimationSpeed } from '../../utils/themeManager';

interface ThemeCustomizerProps {
  className?: string;
  showPreview?: boolean;
  compact?: boolean;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  className = '',
  showPreview = true,
  compact = false
}) => {
  const {
    mode,
    colorScheme,
    animationSpeed,
    isDark,
    isTransitioning,
    reducedMotion,
    highContrast,
    fontSize,
    borderRadius,
    colors,
    setMode,
    setColorScheme,
    setAnimationSpeed,
    toggleTheme,
    toggleReducedMotion,
    toggleHighContrast,
    setFontSize,
    setBorderRadius,
    getThemeValue,
    withTransition,
    previewTheme,
    exportTheme,
    importTheme,
    resetToDefaults
  } = useTheme();
  
  const { getDuration, createTransition } = useThemeAnimations();
  const { getThemeClasses, getBorderRadiusClass } = useThemeClasses();
  
  const [activeSection, setActiveSection] = useState<string>('appearance');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportedData, setExportedData] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Demonstrar animação
  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), getDuration(2));
  };
  
  // Exportar tema
  const handleExport = () => {
    const data = exportTheme();
    setExportedData(data);
    setShowExportModal(true);
  };
  
  // Importar tema
  const handleImport = () => {
    if (importData.trim()) {
      const success = importTheme(importData);
      if (success) {
        setShowImportModal(false);
        setImportData('');
      } else {
        alert('Erro ao importar tema. Verifique o formato dos dados.');
      }
    }
  };
  
  // Copiar dados exportados
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Feedback visual
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };
  
  const sections = [
    { id: 'appearance', label: 'Aparência', icon: <Palette className="w-4 h-4" /> },
    { id: 'animation', label: 'Animações', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'accessibility', label: 'Acessibilidade', icon: <Eye className="w-4 h-4" /> },
    { id: 'typography', label: 'Tipografia', icon: <Type className="w-4 h-4" /> },
    { id: 'layout', label: 'Layout', icon: <Square className="w-4 h-4" /> },
    { id: 'export', label: 'Exportar/Importar', icon: <Download className="w-4 h-4" /> }
  ];
  
  const colorSchemes: { value: ColorScheme; label: string; preview: string }[] = [
    { value: 'default', label: 'Padrão', preview: '#3b82f6' },
    { value: 'blue', label: 'Azul', preview: '#3b82f6' },
    { value: 'purple', label: 'Roxo', preview: '#8b5cf6' },
    { value: 'green', label: 'Verde', preview: '#22c55e' },
    { value: 'orange', label: 'Laranja', preview: '#f97316' },
    { value: 'red', label: 'Vermelho', preview: '#ef4444' }
  ];
  
  const animationSpeeds: { value: AnimationSpeed; label: string; description: string }[] = [
    { value: 'instant', label: 'Instantâneo', description: 'Sem animações' },
    { value: 'fast', label: 'Rápido', description: '150ms' },
    { value: 'normal', label: 'Normal', description: '300ms' },
    { value: 'slow', label: 'Lento', description: '500ms' }
  ];
  
  const fontSizes: { value: 'small' | 'medium' | 'large'; label: string; preview: string }[] = [
    { value: 'small', label: 'Pequeno', preview: '14px' },
    { value: 'medium', label: 'Médio', preview: '16px' },
    { value: 'large', label: 'Grande', preview: '18px' }
  ];
  
  const borderRadiusOptions: { value: 'none' | 'small' | 'medium' | 'large'; label: string; preview: string }[] = [
    { value: 'none', label: 'Nenhum', preview: '0px' },
    { value: 'small', label: 'Pequeno', preview: '4px' },
    { value: 'medium', label: 'Médio', preview: '8px' },
    { value: 'large', label: 'Grande', preview: '12px' }
  ];
  
  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            {/* Modo do Tema */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Modo do Tema
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light' as ThemeMode, label: 'Claro', icon: <Sun className="w-4 h-4" /> },
                  { value: 'dark' as ThemeMode, label: 'Escuro', icon: <Moon className="w-4 h-4" /> },
                  { value: 'auto' as ThemeMode, label: 'Auto', icon: <Monitor className="w-4 h-4" /> }
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => withTransition(() => setMode(value))}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                      mode === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {icon}
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Esquema de Cores */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Esquema de Cores
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {colorSchemes.map(({ value, label, preview }) => (
                  <button
                    key={value}
                    onClick={() => withTransition(() => setColorScheme(value))}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                      colorScheme === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preview }}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Toggle Rápido */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Alternar Tema
              </span>
              <button
                onClick={toggleTheme}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
        
      case 'animation':
        return (
          <div className="space-y-6">
            {/* Velocidade das Animações */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Velocidade das Animações
              </h4>
              <div className="space-y-2">
                {animationSpeeds.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => setAnimationSpeed(value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      animationSpeed === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-gray-500">{description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Demonstração de Animação */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Demonstração
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Teste as animações
                  </span>
                  <button
                    onClick={triggerAnimation}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div 
                    className={`h-2 bg-blue-500 rounded transition-all ${
                      isAnimating ? 'w-full' : 'w-1/4'
                    }`}
                    style={{ transitionDuration: `${getDuration()}ms` }}
                  />
                  <div 
                    className={`h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded transition-all ${
                      isAnimating ? 'scale-105 shadow-lg' : 'scale-100'
                    }`}
                    style={{ transitionDuration: `${getDuration()}ms` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Movimento Reduzido */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Movimento Reduzido
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reduz animações para acessibilidade
                </p>
              </div>
              <button
                onClick={toggleReducedMotion}
                className={`p-2 rounded-lg transition-colors ${
                  reducedMotion
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {reducedMotion ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
        
      case 'accessibility':
        return (
          <div className="space-y-6">
            {/* Alto Contraste */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Alto Contraste
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Aumenta o contraste para melhor legibilidade
                </p>
              </div>
              <button
                onClick={toggleHighContrast}
                className={`p-2 rounded-lg transition-colors ${
                  highContrast
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Contrast className="w-4 h-4" />
              </button>
            </div>
            
            {/* Indicadores de Estado */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Estado Atual
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm">Tema Escuro</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isDark ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm">Alto Contraste</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    highContrast ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {highContrast ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm">Movimento Reduzido</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    reducedMotion ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {reducedMotion ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'typography':
        return (
          <div className="space-y-6">
            {/* Tamanho da Fonte */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Tamanho da Fonte
              </h4>
              <div className="space-y-2">
                {fontSizes.map(({ value, label, preview }) => (
                  <button
                    key={value}
                    onClick={() => setFontSize(value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      fontSize === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-gray-500">{preview}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview de Tipografia */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Preview
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                <h1 className={`font-bold ${fontSize === 'small' ? 'text-xl' : fontSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
                  Título Principal
                </h1>
                <h2 className={`font-semibold ${fontSize === 'small' ? 'text-lg' : fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                  Subtítulo
                </h2>
                <p className={fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'}>
                  Este é um parágrafo de exemplo para demonstrar como o texto aparece com o tamanho de fonte selecionado.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'layout':
        return (
          <div className="space-y-6">
            {/* Border Radius */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Arredondamento das Bordas
              </h4>
              <div className="space-y-2">
                {borderRadiusOptions.map(({ value, label, preview }) => (
                  <button
                    key={value}
                    onClick={() => setBorderRadius(value)}
                    className={`w-full p-3 border-2 transition-all duration-200 text-left ${
                      borderRadius === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    } ${getBorderRadiusClass()}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-gray-500">{preview}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview de Layout */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Preview de Componentes
              </h4>
              <div className="space-y-3">
                <div className={`p-3 bg-blue-500 text-white ${getBorderRadiusClass()}`}>
                  Botão Primário
                </div>
                <div className={`p-3 border-2 border-gray-300 dark:border-gray-600 ${getBorderRadiusClass()}`}>
                  Card de Exemplo
                </div>
                <div className={`p-2 bg-gray-100 dark:bg-gray-700 ${getBorderRadiusClass('lg')}`}>
                  Input Field
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'export':
        return (
          <div className="space-y-6">
            {/* Ações */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Importar</span>
              </button>
            </div>
            
            {/* Reset */}
            <button
              onClick={resetToDefaults}
              className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Padrões</span>
            </button>
            
            {/* Informações */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Configuração Atual
              </h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Modo: {mode}</div>
                <div>Esquema: {colorScheme}</div>
                <div>Animação: {animationSpeed}</div>
                <div>Fonte: {fontSize}</div>
                <div>Bordas: {borderRadius}</div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customizador de Tema
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalize a aparência e comportamento
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Sidebar de Navegação */}
        {!compact && (
          <div className="w-48 border-r border-gray-200 dark:border-gray-600">
            <nav className="p-2">
              {sections.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full p-2 rounded-lg text-left transition-colors flex items-center space-x-2 ${
                    activeSection === id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
        
        {/* Conteúdo Principal */}
        <div className="flex-1 p-4">
          {renderSection()}
        </div>
      </div>
      
      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exportar Tema
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dados do Tema
                  </label>
                  <button
                    onClick={() => copyToClipboard(exportedData)}
                    className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                    title="Copiar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={exportedData}
                  readOnly
                  className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm font-mono"
                />
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Copie estes dados para compartilhar ou fazer backup do seu tema personalizado.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Importar Tema
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cole os dados do tema
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Cole aqui os dados JSON do tema..."
                  className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cole os dados JSON de um tema exportado anteriormente.
                </p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Importar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeCustomizer;