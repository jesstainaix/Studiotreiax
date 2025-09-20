import React, { useState, useEffect, useRef } from 'react';
import { useAdvancedUI, UITheme, UIComponent, UILayout, UIAnimation } from '../../hooks/useAdvancedUI';
import {
  Settings,
  Palette,
  Layout,
  Zap,
  Eye,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Copy,
  Move,
  Square,
  Circle,
  Triangle,
  Type,
  Image,
  Video,
  Music,
  File,
  Layers,
  Grid,
  Smartphone,
  Tablet,
  Monitor,
  Tv
} from 'lucide-react';

const AdvancedUIManager: React.FC = () => {
  const {
    themes,
    currentTheme,
    components,
    layouts,
    animations,
    preferences,
    metrics,
    isLoading,
    error,
    initialized,
    config,
    setTheme,
    addTheme,
    updateTheme,
    removeTheme,
    getCurrentTheme,
    addComponent,
    updateComponent,
    removeComponent,
    addLayout,
    updateLayout,
    removeLayout,
    addAnimation,
    updateAnimation,
    removeAnimation,
    updatePreferences,
    updateConfig,
    undo,
    redo,
    exportData,
    importData
  } = useAdvancedUI();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTheme, setSelectedTheme] = useState<UITheme | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<UIComponent | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<UILayout | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<UIAnimation | null>(null);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showComponentEditor, setShowComponentEditor] = useState(false);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [showAnimationEditor, setShowAnimationEditor] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger re-render to update metrics
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success) {
          alert('Data imported successfully!');
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle file export
  const handleFileExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio-treiax-ui-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Create new theme
  const handleCreateTheme = () => {
    const newTheme: UITheme = {
      id: `theme-${Date.now()}`,
      name: 'New Theme',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#8b5cf6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    };
    
    addTheme(newTheme);
    setSelectedTheme(newTheme);
    setShowThemeEditor(true);
  };

  // Create new component
  const handleCreateComponent = () => {
    const newComponent: UIComponent = {
      id: `component-${Date.now()}`,
      name: 'New Component',
      type: 'button',
      variant: 'primary',
      props: {},
      styles: {},
      animations: [],
      responsive: {
        breakpoints: {
          sm: {},
          md: {},
          lg: {},
          xl: {}
        },
        hiddenOn: [],
        visibleOn: []
      },
      accessibility: {
        focusable: true,
        keyboardNavigation: true,
        highContrast: false,
        reducedMotion: false
      },
      interactions: {
        hover: {
          enabled: true,
          effects: []
        },
        focus: {
          enabled: true,
          effects: []
        },
        click: {
          enabled: true,
          effects: []
        },
        drag: {
          enabled: false
        },
        resize: {
          enabled: false,
          handles: []
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    addComponent(newComponent);
    setSelectedComponent(newComponent);
    setShowComponentEditor(true);
  };

  // Filter components
  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || component.type === filterType;
    return matchesSearch && matchesType;
  });

  // Filter layouts
  const filteredLayouts = layouts.filter(layout => {
    const matchesSearch = layout.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || layout.type === filterType;
    return matchesSearch && matchesType;
  });

  // Filter animations
  const filteredAnimations = animations.filter(animation => {
    const matchesSearch = animation.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || animation.type === filterType;
    return matchesSearch && matchesType;
  });

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Initializing Advanced UI System...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Palette className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced UI Manager</h1>
            <p className="text-gray-600">Design system and component management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Undo"
          >
            <Undo className="h-5 w-5" />
          </button>
          <button
            onClick={redo}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Redo"
          >
            <Redo className="h-5 w-5" />
          </button>
          <button
            onClick={handleFileExport}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Export Data"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Import Data"
          >
            <Upload className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Processing...</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Eye },
            { id: 'themes', label: 'Themes', icon: Palette },
            { id: 'components', label: 'Components', icon: Square },
            { id: 'layouts', label: 'Layouts', icon: Layout },
            { id: 'animations', label: 'Animations', icon: Zap },
            { id: 'preview', label: 'Preview', icon: Monitor },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Themes</p>
                    <p className="text-2xl font-bold text-blue-900">{metrics.totalComponents}</p>
                  </div>
                  <Palette className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Components</p>
                    <p className="text-2xl font-bold text-green-900">{metrics.totalComponents}</p>
                  </div>
                  <Square className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Layouts</p>
                    <p className="text-2xl font-bold text-purple-900">{metrics.totalLayouts}</p>
                  </div>
                  <Layout className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Animations</p>
                    <p className="text-2xl font-bold text-orange-900">{metrics.totalAnimations}</p>
                  </div>
                  <Zap className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Current Theme Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Theme</h3>
              {getCurrentTheme() ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{getCurrentTheme()?.name}</span>
                    <div className="flex space-x-2">
                      {Object.entries(getCurrentTheme()?.colors || {}).slice(0, 6).map(([key, color]) => (
                        <div
                          key={key}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                          title={`${key}: ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Font: {getCurrentTheme()?.typography.fontFamily}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No theme selected</p>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Render Time</p>
                  <p className="text-lg font-semibold">{metrics.renderTime.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Memory Usage</p>
                  <p className="text-lg font-semibold">{(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Animations</p>
                  <p className="text-lg font-semibold">{metrics.activeAnimations}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Themes</h2>
              <button
                onClick={handleCreateTheme}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Theme</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map(theme => (
                <div
                  key={theme.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    currentTheme === theme.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setTheme(theme.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{theme.name}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTheme(theme);
                          setShowThemeEditor(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this theme?')) {
                            removeTheme(theme.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 mb-2">
                    {Object.entries(theme.colors).slice(0, 8).map(([key, color]) => (
                      <div
                        key={key}
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                        title={`${key}: ${color}`}
                      />
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-500">{theme.typography.fontFamily}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Components</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search components..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="button">Button</option>
                    <option value="input">Input</option>
                    <option value="card">Card</option>
                    <option value="modal">Modal</option>
                    <option value="tooltip">Tooltip</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateComponent}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Component</span>
                </button>
              </div>
            </div>

            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredComponents.map(component => (
                <div
                  key={component.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{component.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{component.type} • {component.variant}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedComponent(component);
                          setShowComponentEditor(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this component?')) {
                            removeComponent(component.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Created: {component.createdAt.toLocaleDateString()}
                  </div>
                  
                  {component.animations.length > 0 && (
                    <div className="mt-2 flex items-center space-x-1">
                      <Zap className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600">{component.animations.length} animations</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            
            {/* General Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">General</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto Save</label>
                    <p className="text-xs text-gray-500">Automatically save changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoSave}
                    onChange={(e) => updateConfig({ autoSave: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable Animations</label>
                    <p className="text-xs text-gray-500">Enable UI animations and transitions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableAnimations}
                    onChange={(e) => updateConfig({ enableAnimations: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Snap to Grid</label>
                    <p className="text-xs text-gray-500">Snap elements to grid when positioning</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.snapToGrid}
                    onChange={(e) => updateConfig({ snapToGrid: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grid Size</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.gridSize}
                    onChange={(e) => updateConfig({ gridSize: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="ml-2 text-sm text-gray-500">pixels</span>
                </div>
              </div>
            </div>
            
            {/* Accessibility Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Accessibility</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reduced Motion</label>
                    <p className="text-xs text-gray-500">Reduce animations for accessibility</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.reducedMotion}
                    onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">High Contrast</label>
                    <p className="text-xs text-gray-500">Use high contrast colors</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.highContrast}
                    onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Keyboard Navigation</label>
                    <p className="text-xs text-gray-500">Enable keyboard navigation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.keyboardNavigation}
                    onChange={(e) => updatePreferences({ keyboardNavigation: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                  <select
                    value={preferences.fontSize}
                    onChange={(e) => updatePreferences({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Performance Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Performance Mode</label>
                    <p className="text-xs text-gray-500">Optimize for performance over visual effects</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.performanceMode}
                    onChange={(e) => updateConfig({ performanceMode: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Debug Mode</label>
                    <p className="text-xs text-gray-500">Show debug information and guides</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.debugMode}
                    onChange={(e) => updateConfig({ debugMode: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Undo Steps</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={config.maxUndoSteps}
                    onChange={(e) => updateConfig({ maxUndoSteps: parseInt(e.target.value) })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Save Configuration */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Configuration is auto-saved
                  alert('Configuration saved successfully!');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedUIManager;