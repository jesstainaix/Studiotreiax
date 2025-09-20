import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Settings,
  Zap,
  Save,
  RotateCcw,
  Download,
  Upload,
  Cpu,
  HardDrive,
  Monitor,
  Gauge,
  Target,
  Sliders,
  Palette,
  Clock,
  Database,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { usePerformance } from '@/hooks/usePerformance';
import {
  OptimizationSettings,
  PerformanceProfile,
  PerformanceRecommendation,
  HardwareInfo
} from '@/types/performance';

interface OptimizationPanelProps {
  className?: string;
  onClose?: () => void;
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  className = '',
  onClose
}) => {
  const {
    settings,
    hardwareInfo,
    profiles,
    activeProfile,
    recommendations,
    currentMetrics,
    updateSettings,
    resetSettings,
    applyProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    applyRecommendation,
    optimizeSettings
  } = usePerformance();

  const [localSettings, setLocalSettings] = useState<OptimizationSettings>(settings);
  const [activeTab, setActiveTab] = useState('general');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasUnsavedChanges(hasChanges);
  }, [localSettings, settings]);

  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Handle settings update
  const handleSettingsUpdate = (updates: Partial<OptimizationSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  // Apply settings
  const handleApplySettings = () => {
    updateSettings(localSettings);
    setHasUnsavedChanges(false);
  };

  // Reset to defaults
  const handleReset = () => {
    resetSettings();
    setHasUnsavedChanges(false);
  };

  // Auto-optimize
  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    try {
      await optimizeSettings();
    } catch (error) {
      console.error('Auto-optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Create new profile
  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      createProfile({
        name: newProfileName.trim(),
        description: `Custom profile created on ${new Date().toLocaleDateString()}`,
        settings: localSettings,
        isCustom: true,
        hardwareRequirements: hardwareInfo ? {
          minCpuCores: Math.max(1, hardwareInfo.cpu.cores - 2),
          minMemoryGB: Math.max(2, Math.floor(hardwareInfo.memory.total / (1024 * 1024 * 1024)) - 2),
          minGpuMemoryMB: 512
        } : undefined
      });
      setNewProfileName('');
      setShowCreateProfile(false);
    }
  };

  // Export settings
  const handleExportSettings = () => {
    const exportData = {
      settings: localSettings,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimization-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import settings
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.settings) {
            setLocalSettings(data.settings);
          }
        } catch (error) {
          console.error('Failed to import settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Get performance impact color
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Render quality selector
  const QualitySelector: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low - Better Performance</SelectItem>
          <SelectItem value="medium">Medium - Balanced</SelectItem>
          <SelectItem value="high">High - Better Quality</SelectItem>
          <SelectItem value="ultra">Ultra - Best Quality</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Render slider control
  const SliderControl: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    description?: string;
  }> = ({ label, value, onChange, min, max, step = 1, unit = '', description }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium">{value}{unit}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6" />
              <div>
                <CardTitle>Optimization Settings</CardTitle>
                <p className="text-sm text-gray-600">
                  Fine-tune performance and quality settings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoOptimize}
                disabled={isOptimizing}
                className="flex items-center space-x-2"
              >
                {isOptimizing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Auto Optimize</span>
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span>Performance Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map(rec => (
                <Alert key={rec.id} className="border-blue-200 bg-blue-50">
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    {rec.title}
                    <Button
                      size="sm"
                      onClick={() => applyRecommendation(rec)}
                      className="h-6 text-xs"
                    >
                      Apply
                    </Button>
                  </AlertTitle>
                  <AlertDescription>
                    {rec.description}
                    <Badge className={`ml-2 text-xs ${getImpactColor(rec.impact)}`}>
                      {rec.impact} Impact
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="render">Render</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sliders className="w-5 h-5" />
                <span>General Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Optimization</Label>
                  <p className="text-sm text-gray-600">Automatically optimize settings based on performance</p>
                </div>
                <Switch
                  checked={localSettings.autoOptimize}
                  onCheckedChange={(checked) => 
                    handleSettingsUpdate({ autoOptimize: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QualitySelector
                  label="Overall Quality"
                  value={localSettings.quality}
                  onChange={(quality) => 
                    handleSettingsUpdate({ quality: quality as any })
                  }
                />
                
                <QualitySelector
                  label="Performance Priority"
                  value={localSettings.performance}
                  onChange={(performance) => 
                    handleSettingsUpdate({ performance: performance as any })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="render" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Render Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select
                    value={localSettings.renderSettings.resolution}
                    onValueChange={(resolution) => 
                      handleSettingsUpdate({
                        renderSettings: { ...localSettings.renderSettings, resolution }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1280x720">720p HD</SelectItem>
                      <SelectItem value="1920x1080">1080p Full HD</SelectItem>
                      <SelectItem value="2560x1440">1440p QHD</SelectItem>
                      <SelectItem value="3840x2160">4K UHD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Codec</Label>
                  <Select
                    value={localSettings.renderSettings.codec}
                    onValueChange={(codec) => 
                      handleSettingsUpdate({
                        renderSettings: { ...localSettings.renderSettings, codec }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h264">H.264 (Balanced)</SelectItem>
                      <SelectItem value="h265">H.265 (Efficient)</SelectItem>
                      <SelectItem value="vp9">VP9 (Web Optimized)</SelectItem>
                      <SelectItem value="av1">AV1 (Future-proof)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SliderControl
                label="Frame Rate (FPS)"
                value={localSettings.renderSettings.fps}
                onChange={(fps) => 
                  handleSettingsUpdate({
                    renderSettings: { ...localSettings.renderSettings, fps }
                  })
                }
                min={24}
                max={120}
                step={1}
                description="Higher frame rates provide smoother motion but require more processing power"
              />

              <SliderControl
                label="Bitrate"
                value={localSettings.renderSettings.bitrate / 1000000}
                onChange={(bitrate) => 
                  handleSettingsUpdate({
                    renderSettings: { ...localSettings.renderSettings, bitrate: bitrate * 1000000 }
                  })
                }
                min={1}
                max={50}
                step={0.5}
                unit=" Mbps"
                description="Higher bitrates provide better quality but larger file sizes"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Cache Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Caching</Label>
                  <p className="text-sm text-gray-600">Cache processed frames for faster playback</p>
                </div>
                <Switch
                  checked={localSettings.cacheSettings.enabled}
                  onCheckedChange={(enabled) => 
                    handleSettingsUpdate({
                      cacheSettings: { ...localSettings.cacheSettings, enabled }
                    })
                  }
                />
              </div>

              {localSettings.cacheSettings.enabled && (
                <>
                  <SliderControl
                    label="Max Cache Size"
                    value={localSettings.cacheSettings.maxSize / (1024 * 1024)}
                    onChange={(size) => 
                      handleSettingsUpdate({
                        cacheSettings: { 
                          ...localSettings.cacheSettings, 
                          maxSize: size * 1024 * 1024 
                        }
                      })
                    }
                    min={50}
                    max={2000}
                    step={50}
                    unit=" MB"
                    description="Maximum amount of disk space to use for caching"
                  />

                  <SliderControl
                    label="Preload Frames"
                    value={localSettings.cacheSettings.preloadFrames}
                    onChange={(frames) => 
                      handleSettingsUpdate({
                        cacheSettings: { ...localSettings.cacheSettings, preloadFrames: frames }
                      })
                    }
                    min={5}
                    max={60}
                    step={5}
                    description="Number of frames to preload for smoother playback"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <span>Memory Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderControl
                label="Max Memory Usage"
                value={localSettings.memorySettings.maxUsage}
                onChange={(usage) => 
                  handleSettingsUpdate({
                    memorySettings: { ...localSettings.memorySettings, maxUsage: usage }
                  })
                }
                min={50}
                max={95}
                step={5}
                unit="%"
                description="Maximum percentage of system memory to use"
              />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatic Garbage Collection</Label>
                  <p className="text-sm text-gray-600">Automatically free unused memory</p>
                </div>
                <Switch
                  checked={localSettings.memorySettings.garbageCollection}
                  onCheckedChange={(enabled) => 
                    handleSettingsUpdate({
                      memorySettings: { ...localSettings.memorySettings, garbageCollection: enabled }
                    })
                  }
                />
              </div>

              <SliderControl
                label="Buffer Size"
                value={localSettings.memorySettings.bufferSize / (1024 * 1024)}
                onChange={(size) => 
                  handleSettingsUpdate({
                    memorySettings: { 
                      ...localSettings.memorySettings, 
                      bufferSize: size * 1024 * 1024 
                    }
                  })
                }
                min={1}
                max={32}
                step={1}
                unit=" MB"
                description="Size of memory buffer for video processing"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Performance Profiles</span>
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowCreateProfile(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Profile</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showCreateProfile && (
                <Card className="mb-4 border-dashed">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Input
                        placeholder="Profile name"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleCreateProfile}>
                          Create
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setShowCreateProfile(false);
                            setNewProfileName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {profiles.map(profile => (
                    <Card 
                      key={profile.id} 
                      className={`cursor-pointer transition-colors ${
                        activeProfile?.id === profile.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => applyProfile(profile.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{profile.name}</h4>
                              {activeProfile?.id === profile.id && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              {!profile.isCustom && (
                                <Badge variant="outline" className="text-xs">
                                  Built-in
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {profile.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Quality: {profile.settings.quality}</span>
                              <span>Performance: {profile.settings.performance}</span>
                            </div>
                          </div>
                          {profile.isCustom && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProfile(profile.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                onClick={handleApplySettings}
                disabled={!hasUnsavedChanges}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Apply Settings</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSettings}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Performance Info */}
      {currentMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gauge className="w-5 h-5" />
              <span>Current Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentMetrics.cpu.usage.toFixed(1)}%
                </div>
                <div className="text-gray-600">CPU Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentMetrics.memory.percentage.toFixed(1)}%
                </div>
                <div className="text-gray-600">Memory Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentMetrics.render.fps}
                </div>
                <div className="text-gray-600">FPS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentMetrics.render.averageTime.toFixed(1)}ms
                </div>
                <div className="text-gray-600">Render Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OptimizationPanel;