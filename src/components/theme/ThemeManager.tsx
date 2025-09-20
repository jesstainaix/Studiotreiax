import React, { useState, useEffect } from 'react';
import {
  useTheme,
  useAutoTheme,
  useThemePerformance,
  useThemeStats,
  useThemeConfig,
  useThemePresets,
  useThemeDebug
} from '../../hooks/useTheme';
import { ThemeConfig, ThemePreset } from '../../utils/themeManager';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Settings,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Copy,
  RotateCcw,
  Zap,
  BarChart3,
  Activity,
  Check,
  X,
  Eye,
  EyeOff,
  Sliders,
  Save,
  FileText,
  Layers,
  Paintbrush,
  Sparkles,
  Target,
  Gauge
} from 'lucide-react';

const ThemeManager: React.FC = () => {
  // Hooks
  const theme = useTheme();
  const autoTheme = useAutoTheme();
  const performance = useThemePerformance();
  const stats = useThemeStats();
  const config = useThemeConfig();
  const presets = useThemePresets();
  const debug = useThemeDebug();
  
  // State
  const [activeTab, setActiveTab] = useState('themes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'light' | 'dark' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'created'>('name');
  
  // Demo Functions
  const generateDemoThemes = () => {
    const demoThemes = [
      {
        name: 'Ocean Blue',
        type: 'light' as const,
        colors: {
          primary: '#0ea5e9',
          secondary: '#64748b',
          accent: '#06b6d4',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#0f172a',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        },
        shadows: theme.currentTheme.shadows,
        borderRadius: theme.currentTheme.borderRadius,
        spacing: theme.currentTheme.spacing,
        typography: theme.currentTheme.typography,
        animations: theme.currentTheme.animations
      },
      {
        name: 'Forest Green',
        type: 'dark' as const,
        colors: {
          primary: '#22c55e',
          secondary: '#6b7280',
          accent: '#84cc16',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
          border: '#334155',
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          info: '#3b82f6'
        },
        shadows: theme.currentTheme.shadows,
        borderRadius: theme.currentTheme.borderRadius,
        spacing: theme.currentTheme.spacing,
        typography: theme.currentTheme.typography,
        animations: theme.currentTheme.animations
      },
      {
        name: 'Purple Haze',
        type: 'dark' as const,
        colors: {
          primary: '#8b5cf6',
          secondary: '#6b7280',
          accent: '#a855f7',
          background: '#1e1b4b',
          surface: '#312e81',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
          border: '#4c1d95',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        },
        shadows: theme.currentTheme.shadows,
        borderRadius: theme.currentTheme.borderRadius,
        spacing: theme.currentTheme.spacing,
        typography: theme.currentTheme.typography,
        animations: theme.currentTheme.animations
      }
    ];
    
    demoThemes.forEach(demoTheme => {
      theme.createTheme(demoTheme);
    });
  };
  
  const generateDemoPresets = () => {
    presets.loadDefaultPresets();
  };
  
  // Filter and Sort
  const filteredThemes = theme.availableThemes
    .filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || 
        (filterType === 'custom' ? theme.customThemes.some(ct => ct.id === t.id) : t.type === filterType);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'type': return a.type.localeCompare(b.type);
        case 'created': return a.id.localeCompare(b.id);
        default: return 0;
      }
    });
  
  // Tabs
  const tabs = [
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'presets', label: 'Presets', icon: Layers },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'debug', label: 'Debug', icon: Activity }
  ];
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Theme Manager</h1>
              <p className="text-gray-600">Manage themes, presets, and appearance settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={theme.toggleTheme}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              {theme.isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>Toggle Theme</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Theme</span>
            </button>
          </div>
        </div>
        
        {/* Current Theme Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: theme.currentTheme.colors.primary }}
              />
              <div>
                <h3 className="font-semibold text-gray-900">{theme.currentTheme.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{theme.currentTheme.type} theme</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {theme.isTransitioning && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Transitioning...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
        
        <div className="p-6">
          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search themes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="custom">Custom</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="type">Sort by Type</option>
                  <option value="created">Sort by Created</option>
                </select>
                <button
                  onClick={generateDemoThemes}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Demo Themes</span>
                </button>
              </div>
              
              {/* Theme Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredThemes.map(themeItem => (
                  <div
                    key={themeItem.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      theme.currentTheme.id === themeItem.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: themeItem.colors.primary }}
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{themeItem.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{themeItem.type}</p>
                        </div>
                      </div>
                      {theme.currentTheme.id === themeItem.id && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    {/* Color Palette */}
                    <div className="grid grid-cols-6 gap-1 mb-3">
                      {Object.entries(themeItem.colors).slice(0, 6).map(([key, color]) => (
                        <div
                          key={key}
                          className="w-full h-6 rounded border border-gray-200"
                          style={{ backgroundColor: color }}
                          title={`${key}: ${color}`}
                        />
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => theme.setTheme(themeItem.id)}
                        disabled={theme.currentTheme.id === themeItem.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedTheme(themeItem);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => theme.duplicateTheme(themeItem.id, `${themeItem.name} Copy`)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        {theme.customThemes.some(ct => ct.id === themeItem.id) && (
                          <button
                            onClick={() => theme.deleteTheme(themeItem.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Theme Presets</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={generateDemoPresets}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Load Defaults</span>
                  </button>
                  <button
                    onClick={() => setShowPresetModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Preset</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presets.presets.map(preset => (
                  <div key={preset.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{preset.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{preset.category}</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {preset.themes.length} themes
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {preset.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => presets.loadPreset(preset.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Load Preset
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedPreset(preset);
                            setShowPresetModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => presets.deletePreset(preset.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Theme Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto Detect System Theme</label>
                        <p className="text-xs text-gray-500">Automatically switch based on system preference</p>
                      </div>
                      <button
                        onClick={config.toggleAutoDetect}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.config.autoDetectSystem ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.config.autoDetectSystem ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Transitions</label>
                        <p className="text-xs text-gray-500">Smooth transitions when switching themes</p>
                      </div>
                      <button
                        onClick={config.toggleTransitions}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.config.enableTransitions ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.config.enableTransitions ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Performance Monitoring</label>
                        <p className="text-xs text-gray-500">Monitor theme switching performance</p>
                      </div>
                      <button
                        onClick={config.togglePerformanceMonitoring}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.config.enablePerformanceMonitoring ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.config.enablePerformanceMonitoring ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Accessibility Features</label>
                        <p className="text-xs text-gray-500">Enhanced accessibility support</p>
                      </div>
                      <button
                        onClick={config.toggleAccessibility}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.config.enableAccessibility ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.config.enableAccessibility ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Advanced Settings */}
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transition Duration (ms)
                      </label>
                      <input
                        type="number"
                        value={config.config.transitionDuration}
                        onChange={(e) => config.updateConfig({ transitionDuration: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="2000"
                        step="50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Cached Themes
                      </label>
                      <input
                        type="number"
                        value={config.config.maxCachedThemes}
                        onChange={(e) => config.updateConfig({ maxCachedThemes: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Import/Export */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Import/Export</h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      const data = theme.exportThemes();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'themes.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Themes</span>
                  </button>
                  
                  <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Import Themes</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const data = event.target?.result as string;
                            theme.importThemes(data);
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                  
                  <button
                    onClick={theme.resetToDefault}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset to Default</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Theme Statistics</h3>
                <button
                  onClick={stats.clearStats}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Stats</span>
                </button>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Themes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.stats.totalThemes}</p>
                    </div>
                    <Palette className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Custom Themes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.stats.customThemes}</p>
                    </div>
                    <Paintbrush className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Theme Switches</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.stats.switchCount}</p>
                    </div>
                    <RotateCcw className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Switch Time</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.stats.averageSwitchTime.toFixed(1)}ms</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              {/* Popular Themes */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Popular Themes</h4>
                <div className="space-y-3">
                  {stats.stats.popularThemes.slice(0, 5).map((item, index) => {
                    const themeItem = theme.availableThemes.find(t => t.id === item.id);
                    if (!themeItem) return null;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: themeItem.colors.primary }}
                          />
                          <span className="font-medium text-gray-900">{themeItem.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">{item.count} uses</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={performance.measurePerformance}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Activity className="h-4 w-4" />
                    <span>Measure Now</span>
                  </button>
                  <button
                    onClick={performance.clearPerformanceData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear Data</span>
                  </button>
                </div>
              </div>
              
              {/* Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Switch Time</p>
                      <p className="text-2xl font-bold text-gray-900">{performance.performance.switchTime.toFixed(1)}ms</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{(performance.performance.memoryUsage / 1024 / 1024).toFixed(1)}MB</p>
                    </div>
                    <Activity className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">CSS Size</p>
                      <p className="text-2xl font-bold text-gray-900">{performance.performance.cssSize}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cache Hits</p>
                      <p className="text-2xl font-bold text-gray-900">{performance.performance.cacheHits}</p>
                    </div>
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cache Misses</p>
                      <p className="text-2xl font-bold text-gray-900">{performance.performance.cacheMisses}</p>
                    </div>
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Render Time</p>
                      <p className="text-2xl font-bold text-gray-900">{performance.performance.renderTime.toFixed(1)}ms</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Debug Information</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={debug.logDebugInfo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Activity className="h-4 w-4" />
                    <span>Log to Console</span>
                  </button>
                  <button
                    onClick={() => {
                      const data = debug.exportDebugInfo();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'theme-debug.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Debug</span>
                  </button>
                </div>
              </div>
              
              {/* Debug Info */}
              <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm">
                <pre className="whitespace-pre-wrap">{debug.exportDebugInfo()}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;