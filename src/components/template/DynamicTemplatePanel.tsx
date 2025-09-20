import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Zap,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Save,
  Share2,
  Star,
  Eye,
  Grid,
  List,
  Layers,
  Type,
  Image,
  Video,
  Square,
  BarChart3,
  Table,
  MousePointer,
  Palette,
  Layout,
  Smartphone,
  Monitor,
  Printer,
  Globe,
  Sparkles,
  Brain,
  Wand2,
  Target,
  Lightbulb,
  Gauge,
  Activity,
  Database,
  Cloud,
  Shield,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Maximize2,
  Minimize2,
  MoreHorizontal
} from 'lucide-react';
import { useDynamicTemplate, useTemplateProgress } from '@/hooks/useDynamicTemplate';
import { DynamicTemplate, TemplateInstance, TemplateComponent, TemplateVariable } from '@/services/dynamicTemplateService';

interface DynamicTemplatePanelProps {
  className?: string;
}

const DynamicTemplatePanel: React.FC<DynamicTemplatePanelProps> = ({ className }) => {
  // Hooks
  const {
    // State
    templates,
    instances,
    categories,
    currentTemplate,
    currentInstance,
    selectedComponents,
    config,
    stats,
    metrics,
    isLoading,
    error,
    searchQuery,
    selectedCategory,
    selectedFormat,
    sortBy,
    viewMode,
    editorMode,
    zoom,
    showGrid,
    showGuides,
    
    // Computed
    filteredTemplates,
    filteredInstances,
    totalComponents,
    totalVariables,
    averageRating,
    hasSelection,
    canPaste,
    
    // Actions
    createTemplate: addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    createInstance,
    updateInstance,
    deleteInstance,
    publishInstance,
    addComponent,
    updateComponent,
    deleteComponent,
    duplicateComponent,
    addVariable,
    updateVariable,
    deleteVariable,
    selectComponent,
    clearSelection,
    copyComponents,
    pasteComponents,
    setEditorMode,
    setZoom,
    toggleGrid,
    toggleGuides,
    generateTemplate,
    optimizeTemplate,
    generateContent,
    exportTemplate,
    importTemplate,
    updateConfig,
    setSearchQuery,
    setSelectedCategory,
    setSelectedFormat,
    setSortBy,
    setViewMode,
    refreshStats,
    refreshMetrics,
    
    // Quick actions
    quickCreateTemplate,
    quickAddTextComponent,
    quickAddImageComponent,
    quickCreateVariable
  } = useDynamicTemplate();
  
  const { progress, isProcessing, currentStep, startProgress, updateProgress, completeProgress } = useTemplateProgress();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<'template' | 'instance' | 'component' | 'variable'>('template');
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
      refreshMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshStats, refreshMetrics]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Templates',
      value: templates.length.toString(),
      change: '+12%',
      trend: 'up',
      icon: Layout,
      color: 'blue'
    },
    {
      title: 'Active Instances',
      value: instances.filter(i => i.status === 'published').length.toString(),
      change: '+8%',
      trend: 'up',
      icon: Play,
      color: 'green'
    },
    {
      title: 'Components',
      value: totalComponents.toString(),
      change: '+15%',
      trend: 'up',
      icon: Layers,
      color: 'purple'
    },
    {
      title: 'Avg Rating',
      value: averageRating.toFixed(1),
      change: '+0.3',
      trend: 'up',
      icon: Star,
      color: 'yellow'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'instances', label: 'Instances', icon: Play },
    { id: 'components', label: 'Components', icon: Layers },
    { id: 'variables', label: 'Variables', icon: Database },
    { id: 'editor', label: 'Editor', icon: Edit },
    { id: 'ai', label: 'AI Features', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return Clock;
      case 'published': return CheckCircle;
      case 'archived': return AlertCircle;
      default: return Clock;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'yellow';
      case 'published': return 'green';
      case 'archived': return 'gray';
      default: return 'gray';
    }
  };
  
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'video': return Video;
      case 'shape': return Square;
      case 'chart': return BarChart3;
      case 'table': return Table;
      case 'button': return MousePointer;
      default: return Square;
    }
  };
  
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'web': return Globe;
      case 'mobile': return Smartphone;
      case 'print': return Printer;
      case 'video': return Video;
      case 'presentation': return Monitor;
      default: return Globe;
    }
  };
  
  const formatTime = (date: Date) => {
    return new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };
  
  const handleQuickAction = async (action: string, ...args: any[]) => {
    try {
      startProgress(`Executing ${action}...`);
      updateProgress(25);
      
      let success = false;
      
      switch (action) {
        case 'createTemplate':
          success = await quickCreateTemplate(args[0], args[1]);
          break;
        case 'addTextComponent':
          success = quickAddTextComponent(args[0], args[1], args[2]);
          break;
        case 'addImageComponent':
          success = quickAddImageComponent(args[0], args[1], args[2]);
          break;
        case 'createVariable':
          success = quickCreateVariable(args[0], args[1], args[2]);
          break;
        default:
          success = false;
      }
      
      updateProgress(75);
      
      if (success) {
        updateProgress(100, 'Completed successfully!');
        setTimeout(completeProgress, 500);
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      completeProgress();
    }
  };
  
  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };
  
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };
  
  const openCreateDialog = (type: 'template' | 'instance' | 'component' | 'variable') => {
    setCreateDialogType(type);
    setShowCreateDialog(true);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dynamic Templates</h2>
          <p className="text-muted-foreground">
            Create and manage dynamic templates with AI-powered features
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshStats()}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => openCreateDialog('template')}>
                <Layout className="h-4 w-4 mr-2" />
                New Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateDialog('instance')}>
                <Play className="h-4 w-4 mr-2" />
                New Instance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateDialog('component')}>
                <Layers className="h-4 w-4 mr-2" />
                Add Component
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateDialog('variable')}>
                <Database className="h-4 w-4 mr-2" />
                Add Variable
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 text-${card.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`text-${card.trend === 'up' ? 'green' : 'red'}-600`}>
                    {card.change}
                  </span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates, instances, components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="print">Print</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Recent Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Recent Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTemplates.slice(0, 5).map((template) => {
                    const FormatIcon = getFormatIcon(template.metadata.format);
                    return (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FormatIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.category}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {template.analytics.usageCount}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Active Instances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Active Instances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredInstances.slice(0, 5).map((instance) => {
                    const StatusIcon = getStatusIcon(instance.status);
                    return (
                      <div key={instance.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{instance.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(instance.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(instance.status) as any}>
                          {instance.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('createTemplate', 'New Template', 'general')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('addTextComponent', 'Sample Text')}
                    disabled={!currentTemplate}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Add Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction('addImageComponent', '/placeholder.jpg')}
                    disabled={!currentTemplate}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => generateTemplate('Create a modern landing page', 'web')}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredTemplates.map((template) => {
              const FormatIcon = getFormatIcon(template.metadata.format);
              const isExpanded = expandedCards.has(template.id);
              
              return (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FormatIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => updateTemplate(template.id, { name: template.name + ' (Edited)' })}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateTemplate(template.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportTemplate(template.id, 'json')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Components: {template.components.length}</span>
                        <span>Variables: {template.variables.length}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge variant="outline">{template.metadata.format}</Badge>
                        {template.aiFeatures.autoLayout && (
                          <Badge variant="outline" className="bg-purple-50">
                            <Brain className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Rating: {template.analytics.rating.toFixed(1)}</span>
                        <span>Used: {template.analytics.usageCount} times</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createInstance(template.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCardExpansion(template.id)}
                        >
                          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <div className="text-sm">
                            <strong>Author:</strong> {template.author}
                          </div>
                          <div className="text-sm">
                            <strong>Version:</strong> {template.version}
                          </div>
                          <div className="text-sm">
                            <strong>Created:</strong> {formatTime(template.createdAt)}
                          </div>
                          <div className="text-sm">
                            <strong>Tags:</strong> {template.tags.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Editor Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Editor Settings</CardTitle>
                <CardDescription>Configure the template editor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid-size">Grid Size</Label>
                  <div className="w-32">
                    <Slider
                      id="grid-size"
                      min={5}
                      max={50}
                      step={5}
                      value={[config.editor.gridSize]}
                      onValueChange={([value]) => updateConfig({
                        editor: { ...config.editor, gridSize: value }
                      })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="snap-to-grid">Snap to Grid</Label>
                  <Switch
                    id="snap-to-grid"
                    checked={config.editor.snapToGrid}
                    onCheckedChange={(checked) => updateConfig({
                      editor: { ...config.editor, snapToGrid: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-guides">Show Guides</Label>
                  <Switch
                    id="show-guides"
                    checked={config.editor.showGuides}
                    onCheckedChange={(checked) => updateConfig({
                      editor: { ...config.editor, showGuides: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">Auto Save</Label>
                  <Switch
                    id="auto-save"
                    checked={config.editor.autoSave}
                    onCheckedChange={(checked) => updateConfig({
                      editor: { ...config.editor, autoSave: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* AI Settings */}
            <Card>
              <CardHeader>
                <CardTitle>AI Features</CardTitle>
                <CardDescription>Configure AI-powered features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-suggestions">Smart Suggestions</Label>
                  <Switch
                    id="ai-suggestions"
                    checked={config.ai.enableSuggestions}
                    onCheckedChange={(checked) => updateConfig({
                      ai: { ...config.ai, enableSuggestions: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-optimize">Auto Optimize</Label>
                  <Switch
                    id="auto-optimize"
                    checked={config.ai.autoOptimize}
                    onCheckedChange={(checked) => updateConfig({
                      ai: { ...config.ai, autoOptimize: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="content-generation">Content Generation</Label>
                  <Switch
                    id="content-generation"
                    checked={config.ai.contentGeneration}
                    onCheckedChange={(checked) => updateConfig({
                      ai: { ...config.ai, contentGeneration: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="style-recommendations">Style Recommendations</Label>
                  <Switch
                    id="style-recommendations"
                    checked={config.ai.styleRecommendations}
                    onCheckedChange={(checked) => updateConfig({
                      ai: { ...config.ai, styleRecommendations: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Rendering Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Rendering</CardTitle>
                <CardDescription>Configure rendering quality and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Select
                    value={config.rendering.quality}
                    onValueChange={(value: any) => updateConfig({
                      rendering: { ...config.rendering, quality: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Enable Animations</Label>
                  <Switch
                    id="animations"
                    checked={config.rendering.enableAnimations}
                    onCheckedChange={(checked) => updateConfig({
                      rendering: { ...config.rendering, enableAnimations: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="effects">Enable Effects</Label>
                  <Switch
                    id="effects"
                    checked={config.rendering.enableEffects}
                    onCheckedChange={(checked) => updateConfig({
                      rendering: { ...config.rendering, enableEffects: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Export Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Export</CardTitle>
                <CardDescription>Configure export options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-format">Default Format</Label>
                  <Select
                    value={config.export.defaultFormat}
                    onValueChange={(value) => updateConfig({
                      export: { ...config.export, defaultFormat: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-metadata">Include Metadata</Label>
                  <Switch
                    id="include-metadata"
                    checked={config.export.includeMetadata}
                    onCheckedChange={(checked) => updateConfig({
                      export: { ...config.export, includeMetadata: checked }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="optimize-web">Optimize for Web</Label>
                  <Switch
                    id="optimize-web"
                    checked={config.export.optimizeForWeb}
                    onCheckedChange={(checked) => updateConfig({
                      export: { ...config.export, optimizeForWeb: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Create New {createDialogType.charAt(0).toUpperCase() + createDialogType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              {createDialogType === 'template' && 'Create a new dynamic template'}
              {createDialogType === 'instance' && 'Create a new template instance'}
              {createDialogType === 'component' && 'Add a new component to the current template'}
              {createDialogType === 'variable' && 'Add a new variable to the current template'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {createDialogType === 'template' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" className="col-span-3" placeholder="Template name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea id="description" className="col-span-3" placeholder="Template description" />
                </div>
              </>
            )}
            
            {createDialogType === 'component' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select component type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="shape">Shape</SelectItem>
                      <SelectItem value="chart">Chart</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="button">Button</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comp-name" className="text-right">
                    Name
                  </Label>
                  <Input id="comp-name" className="col-span-3" placeholder="Component name" />
                </div>
              </>
            )}
            
            {createDialogType === 'variable' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="var-name" className="text-right">
                    Name
                  </Label>
                  <Input id="var-name" className="col-span-3" placeholder="Variable name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="var-type" className="text-right">
                    Type
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select variable type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="default-value" className="text-right">
                    Default
                  </Label>
                  <Input id="default-value" className="col-span-3" placeholder="Default value" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setShowCreateDialog(false)}>
              Create {createDialogType.charAt(0).toUpperCase() + createDialogType.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DynamicTemplatePanel;