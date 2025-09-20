import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  useDynamicTemplates,
  useDynamicTemplatesStats,
  useDynamicTemplatesConfig,
  useDynamicTemplatesSearch,
  useDynamicTemplatesEditor,
  useDynamicTemplatesCategories,
  useDynamicTemplatesCollections,
  useDynamicTemplatesRealTime,
} from '../../hooks/useDynamicTemplates';
import {
  DynamicTemplate,
  TemplateElement,
  TemplateCategory,
  TemplateCollection,
  formatTemplateSize,
  getTemplateComplexity,
  getTemplateStatusColor,
  getTemplateStatusIcon,
  getCategoryIcon,
  formatTemplateRating,
  formatTemplateDownloads,
  generateTemplateRecommendations,
} from '../../services/dynamicTemplatesService';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Download,
  Star,
  Copy,
  Edit,
  Trash2,
  Upload,
  Settings,
  Folder,
  Tag,
  Users,
  TrendingUp,
  Clock,
  Zap,
  Palette,
  Layout,
  MousePointer,
  Layers,
  RotateCcw,
  RotateCw,
  Save,
  Share2,
  Globe,
  Lock,
  Heart,
  MoreHorizontal,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

const DynamicTemplatesManager: React.FC = () => {
  // Hooks
  const {
    templates,
    categories,
    collections,
    currentTemplate,
    isLoading,
    error,
    viewMode,
    showFilters,
    filteredTemplates,
    actions,
    quickActions,
    setViewMode,
    toggleFilters,
    setCurrentTemplate,
    progress,
    isProgressActive,
  } = useDynamicTemplates();
  
  const { stats, templateStats, categoryStats, currentTemplateStats } = useDynamicTemplatesStats();
  const { config, updateConfig } = useDynamicTemplatesConfig();
  const { searchQuery, filters, setSearchQuery, setFilters, clearFilters } = useDynamicTemplatesSearch();
  const { selectedElements, historyStats, undo, redo } = useDynamicTemplatesEditor();
  const { isConnected, lastSync, syncStatus } = useDynamicTemplatesRealTime();
  
  // Local State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<DynamicTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', category: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6' });
  const [newCollection, setNewCollection] = useState({ name: '', description: '', isPublic: false });
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Status Cards Data
  const statusCards = [
    {
      title: 'Total Templates',
      value: templateStats.total.toString(),
      description: `${templateStats.public} public, ${templateStats.private} private`,
      icon: Layout,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Categories',
      value: categories.length.toString(),
      description: 'Template categories',
      icon: Folder,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Collections',
      value: collections.length.toString(),
      description: 'Template collections',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Featured',
      value: templateStats.featured.toString(),
      description: 'Featured templates',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];
  
  // Tab Configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'templates', label: 'Templates', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Edit },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'collections', label: 'Collections', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  
  // Helper Functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'public': return Globe;
      case 'private': return Lock;
      case 'featured': return Star;
      default: return Layout;
    }
  };
  
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'complex': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  };
  
  const handleCreateTemplate = async () => {
    try {
      await actions.createTemplate(newTemplate);
      setShowCreateDialog(false);
      setNewTemplate({ name: '', description: '', category: '' });
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };
  
  const handleQuickAction = async (action: string, templateId?: string) => {
    try {
      switch (action) {
        case 'create':
          setShowCreateDialog(true);
          break;
        case 'duplicate':
          if (templateId) await quickActions.quickDuplicate(templateId);
          break;
        case 'publish':
          if (templateId) await quickActions.quickPublish(templateId);
          break;
        case 'unpublish':
          if (templateId) await quickActions.quickUnpublish(templateId);
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };
  
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dynamic Templates
              </h1>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Disconnected</span>
                </div>
              )}
              
              <Badge variant={syncStatus === 'synced' ? 'default' : 'secondary'}>
                {syncStatus === 'synced' ? 'Synced' : 'Pending'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <Button
              onClick={() => handleQuickAction('create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowCategoryDialog(true)}>
                  <Folder className="h-4 w-4 mr-2" />
                  New Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCollectionDialog(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  New Collection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isProgressActive && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert className="mx-6 mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {card.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content */}
      <div className="px-6 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent Templates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.slice(0, 5).map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={template.thumbnail || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=template%20placeholder&image_size=square'}
                            alt={template.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatTemplateSize(template.elements)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {getTemplateComplexity(template)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCurrentTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Downloads</span>
                      <span className="font-semibold">
                        {formatTemplateDownloads(templates.reduce((sum, t) => sum + t.downloads, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Average Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">
                          {formatTemplateRating(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
                      <span className="font-semibold">{formatTime(lastSync)}</span>
                    </div>
                    {currentTemplate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Current Template</span>
                        <span className="font-semibold">{currentTemplate.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={toggleFilters}
                      className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                    
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Advanced Filters */}
                {showFilters && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={filters.category[0] || ''}
                          onValueChange={(value) => setFilters({ category: value ? [value] : [] })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All categories</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Rating</Label>
                        <Select
                          value={filters.rating.toString()}
                          onValueChange={(value) => setFilters({ rating: parseFloat(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Any rating</SelectItem>
                            <SelectItem value="4">4+ stars</SelectItem>
                            <SelectItem value="3">3+ stars</SelectItem>
                            <SelectItem value="2">2+ stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={filters.isPublic === null ? '' : filters.isPublic.toString()}
                          onValueChange={(value) => setFilters({ isPublic: value === '' ? null : value === 'true' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any status</SelectItem>
                            <SelectItem value="true">Public</SelectItem>
                            <SelectItem value="false">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Templates Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              {filteredTemplates.map((template) => {
                const StatusIcon = getStatusIcon(template.isPublic ? 'public' : 'private');
                const complexity = getTemplateComplexity(template);
                
                if (viewMode === 'grid') {
                  return (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="relative">
                        <img
                          src={template.thumbnail || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=template%20placeholder&image_size=landscape_4_3'}
                          alt={template.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {template.isFeatured && (
                            <Badge className="bg-yellow-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge variant={template.isPublic ? 'default' : 'secondary'}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {template.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                        
                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <Button size="sm" onClick={() => setCurrentTemplate(template)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleQuickAction('duplicate', template.id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {template.name}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">
                                {formatTemplateRating(template.rating)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {template.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getComplexityColor(complexity)}>
                                {complexity}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatTemplateSize(template.elements)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Download className="h-4 w-4" />
                              <span className="text-xs">
                                {formatTemplateDownloads(template.downloads)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else {
                  return (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <img
                            src={template.thumbnail || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=template%20placeholder&image_size=square'}
                            alt={template.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {template.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">
                                    {formatTemplateRating(template.rating)}
                                  </span>
                                </div>
                                <Badge variant={template.isPublic ? 'default' : 'secondary'}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {template.isPublic ? 'Public' : 'Private'}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                              {template.description}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-4">
                                <Badge variant="outline" className={getComplexityColor(complexity)}>
                                  {complexity}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatTemplateSize(template.elements)}
                                </span>
                                <div className="flex items-center space-x-1 text-gray-500">
                                  <Download className="h-4 w-4" />
                                  <span className="text-xs">
                                    {formatTemplateDownloads(template.downloads)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button size="sm" onClick={() => setCurrentTemplate(template)}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleQuickAction('duplicate', template.id)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    {template.isPublic ? (
                                      <DropdownMenuItem onClick={() => handleQuickAction('unpublish', template.id)}>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Make Private
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handleQuickAction('publish', template.id)}>
                                        <Globe className="h-4 w-4 mr-2" />
                                        Make Public
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              })}
            </div>
            
            {filteredTemplates.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No templates found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your search criteria or create a new template.
                  </p>
                  <Button onClick={() => handleQuickAction('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-6">
            {currentTemplate ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Info */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Template Info</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={undo}
                          disabled={!historyStats.canUndo}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={redo}
                          disabled={!historyStats.canRedo}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={currentTemplate.name} readOnly />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea value={currentTemplate.description} readOnly rows={3} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Elements</Label>
                        <p className="text-2xl font-bold text-blue-600">
                          {currentTemplate.elements.length}
                        </p>
                      </div>
                      <div>
                        <Label>Selected</Label>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedElements.length}
                        </p>
                      </div>
                    </div>
                    
                    {currentTemplateStats && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Animations</span>
                          <span className="text-sm font-medium">{currentTemplateStats.animationCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Interactions</span>
                          <span className="text-sm font-medium">{currentTemplateStats.interactionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Variables</span>
                          <span className="text-sm font-medium">{currentTemplateStats.variableCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Complexity</span>
                          <Badge variant="outline" className={getComplexityColor(currentTemplateStats.complexity)}>
                            {currentTemplateStats.complexity}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Canvas Preview */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Canvas</span>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Zap className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm">
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96 flex items-center justify-center">
                      <div className="text-center">
                        <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Template canvas will be rendered here
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {currentTemplate.elements.length} elements
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No template selected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select a template from the Templates tab to start editing.
                  </p>
                  <Button onClick={() => setActiveTab('templates')}>
                    <Palette className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.name.toLowerCase());
                const categoryTemplateCount = templates.filter(t => t.category === category.id).length;
                
                return (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="p-3 rounded-full"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {categoryTemplateCount} templates
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {category.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">
                          {categoryTemplateCount} templates
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Templates
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Add Category Card */}
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => setShowCategoryDialog(true)}>
                <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Add New Category
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {collection.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {collection.templates.length} templates
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {collection.isPublic ? (
                          <Badge variant="default">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {collection.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Created {formatTime(collection.createdAt)}
                      </div>
                      <Button size="sm" variant="outline">
                        View Collection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add Collection Card */}
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => setShowCollectionDialog(true)}>
                <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Add New Collection
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usage Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Usage Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Templates</span>
                      <span className="text-2xl font-bold text-blue-600">{templateStats.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Public Templates</span>
                      <span className="text-2xl font-bold text-green-600">{templateStats.public}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Private Templates</span>
                      <span className="text-2xl font-bold text-gray-600">{templateStats.private}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Featured Templates</span>
                      <span className="text-2xl font-bold text-yellow-600">{templateStats.featured}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Load Time</span>
                        <span className="text-sm font-medium">1.2s</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Render Time</span>
                        <span className="text-sm font-medium">0.8s</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                        <span className="text-sm font-medium">45MB</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>
                  Configure your template management preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Save</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically save changes to templates
                      </p>
                    </div>
                    <Switch
                      checked={config.autoSave}
                      onCheckedChange={(checked) => updateConfig({ autoSave: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create automatic backups of templates
                      </p>
                    </div>
                    <Switch
                      checked={config.autoBackup}
                      onCheckedChange={(checked) => updateConfig({ autoBackup: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Collaboration</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allow real-time collaboration on templates
                      </p>
                    </div>
                    <Switch
                      checked={config.enableCollaboration}
                      onCheckedChange={(checked) => updateConfig({ enableCollaboration: checked })}
                    />
                  </div>
                </div>
                
                {/* Performance Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Performance</h3>
                  
                  <div className="space-y-2">
                    <Label>Preview Quality</Label>
                    <Select
                      value={config.previewQuality}
                      onValueChange={(value: 'low' | 'medium' | 'high') => updateConfig({ previewQuality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Versions</Label>
                    <Input
                      type="number"
                      value={config.maxVersions}
                      onChange={(e) => updateConfig({ maxVersions: parseInt(e.target.value) })}
                      min={1}
                      max={50}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cache Size (MB)</Label>
                    <Input
                      type="number"
                      value={config.cacheSize}
                      onChange={(e) => updateConfig({ cacheSize: parseInt(e.target.value) })}
                      min={10}
                      max={1000}
                    />
                  </div>
                </div>
                
                {/* Analytics Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Analytics</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Analytics</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track template usage and performance metrics
                      </p>
                    </div>
                    <Switch
                      checked={config.enableAnalytics}
                      onCheckedChange={(checked) => updateConfig({ enableAnalytics: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Versioning</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Keep track of template version history
                      </p>
                    </div>
                    <Switch
                      checked={config.enableVersioning}
                      onCheckedChange={(checked) => updateConfig({ enableVersioning: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new template to start building your design.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Enter template description"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Category</Label>
              <Select
                value={newTemplate.category}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
              >
                <SelectTrigger>
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
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplate.name}>
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your templates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              await actions.createCategory(newCategory);
              setShowCategoryDialog(false);
              setNewCategory({ name: '', description: '', color: '#3B82F6' });
            }} disabled={!newCategory.name}>
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Collection Dialog */}
      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to group related templates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newCollection.name}
                onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                placeholder="Enter collection name"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={newCollection.description}
                onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                placeholder="Enter collection description"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={newCollection.isPublic}
                onCheckedChange={(checked) => setNewCollection({ ...newCollection, isPublic: checked })}
              />
              <Label>Make collection public</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCollectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              await actions.createCollection(newCollection);
              setShowCollectionDialog(false);
              setNewCollection({ name: '', description: '', isPublic: false });
            }} disabled={!newCollection.name}>
              Create Collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DynamicTemplatesManager;