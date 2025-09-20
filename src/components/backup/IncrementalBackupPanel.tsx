import React, { useState, useEffect, useMemo } from 'react';
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
  DialogFooter,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Database,
  PlusCircle,
  Delta,
  Archive,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  HardDrive,
  Cloud,
  Network,
  Server,
  Shield,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  Copy,
  FileText,
  Calendar,
  Users,
  Globe
} from 'lucide-react';
import { useIncrementalBackup, useBackupProgress } from '../../hooks/useIncrementalBackup';
import {
  BackupSnapshot,
  BackupPolicy,
  BackupDestination,
  formatBackupSize,
  formatBackupDuration,
  getBackupStatusColor,
  getBackupTypeIcon
} from '../../services/incrementalBackupService';

const IncrementalBackupPanel: React.FC = () => {
  // Hooks
  const backup = useIncrementalBackup();
  const progress = useBackupProgress();
  
  // Local state
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'snapshot' | 'policy' | 'destination'>('snapshot');
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        backup.throttledRefresh();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [backup.throttledRefresh]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Total Backups',
      value: backup.totalBackups.toString(),
      description: `${backup.successfulBackups} successful`,
      icon: Database,
      color: 'blue',
      trend: backup.backupTrend
    },
    {
      title: 'Storage Used',
      value: formatBackupSize(backup.totalStorageUsed),
      description: `${backup.compressionRatio.toFixed(1)}% compression`,
      icon: HardDrive,
      color: 'green',
      trend: backup.storageTrend
    },
    {
      title: 'Active Policies',
      value: backup.activePolicies.toString(),
      description: `${backup.totalPolicies} total policies`,
      icon: Settings,
      color: 'purple',
      trend: 'stable' as const
    },
    {
      title: 'System Health',
      value: `${backup.systemHealth.toFixed(1)}%`,
      description: backup.systemHealth > 95 ? 'Excellent' : backup.systemHealth > 85 ? 'Good' : 'Needs attention',
      icon: Activity,
      color: backup.systemHealth > 95 ? 'green' : backup.systemHealth > 85 ? 'yellow' : 'red',
      trend: backup.performanceTrend
    }
  ], [backup]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'snapshots', label: 'Snapshots', icon: Database },
    { id: 'policies', label: 'Policies', icon: Settings },
    { id: 'destinations', label: 'Destinations', icon: Cloud },
    { id: 'restore', label: 'Restore', icon: Download },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: BackupSnapshot['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Clock;
      case 'failed': return XCircle;
      case 'cancelled': return Square;
      case 'pending': return Clock;
      default: return Clock;
    }
  };
  
  const getStatusColor = (status: BackupSnapshot['status']) => {
    return getBackupStatusColor(status);
  };
  
  const getTypeIcon = (type: BackupSnapshot['type']) => {
    switch (type) {
      case 'full': return Database;
      case 'incremental': return PlusCircle;
      case 'differential': return Delta;
      default: return Archive;
    }
  };
  
  const getDestinationIcon = (type: BackupDestination['type']) => {
    switch (type) {
      case 'local': return HardDrive;
      case 'cloud': return Cloud;
      case 'network': return Network;
      case 'remote': return Server;
      default: return Archive;
    }
  };
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      case 'stable': return Minus;
      default: return Minus;
    }
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const handleQuickAction = async (action: string, id?: string) => {
    try {
      switch (action) {
        case 'quick-backup':
          progress.startProgress();
          await backup.quickBackup('incremental');
          progress.stopProgress();
          break;
        case 'quick-restore':
          if (id) {
            progress.startProgress();
            await backup.quickRestore(id);
            progress.stopProgress();
          }
          break;
        case 'quick-cleanup':
          progress.startProgress();
          await backup.quickCleanup();
          progress.stopProgress();
          break;
        case 'quick-optimize':
          progress.startProgress();
          await backup.quickOptimize();
          progress.stopProgress();
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
      progress.resetProgress();
    }
  };
  
  const handleCardExpand = (cardId: string) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };
  
  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const CreateDialog = () => {
    const [formData, setFormData] = useState<any>({});
    
    const handleCreate = async () => {
      try {
        switch (createType) {
          case 'snapshot':
            await backup.createSnapshot(
              formData.type || 'incremental',
              formData.description || 'Manual backup'
            );
            break;
          case 'policy':
            await backup.createPolicy({
              name: formData.name || 'New Policy',
              description: formData.description || '',
              enabled: formData.enabled || true,
              schedule: {
                frequency: formData.frequency || 'daily',
                interval: formData.interval || 1,
                timezone: 'UTC'
              },
              retention: {
                maxSnapshots: formData.maxSnapshots || 30,
                maxAge: formData.maxAge || 90,
                keepDaily: 7,
                keepWeekly: 4,
                keepMonthly: 12,
                keepYearly: 5
              },
              filters: {
                includePaths: [],
                excludePaths: [],
                includeExtensions: [],
                excludeExtensions: [],
                maxFileSize: 1024 * 1024 * 100,
                followSymlinks: false
              },
              compression: {
                enabled: true,
                algorithm: 'zstd',
                level: 3
              },
              encryption: {
                enabled: false,
                algorithm: 'aes256',
                keyDerivation: 'pbkdf2'
              }
            });
            break;
          case 'destination':
            await backup.addDestination({
              name: formData.name || 'New Destination',
              type: formData.type || 'local',
              enabled: formData.enabled || true,
              config: {
                path: formData.path || '/backup'
              },
              status: 'disconnected',
              lastSync: new Date(),
              capacity: {
                total: 0,
                used: 0,
                available: 0
              },
              performance: {
                uploadSpeed: 0,
                downloadSpeed: 0,
                latency: 0
              }
            });
            break;
        }
        setShowCreateDialog(false);
        setFormData({});
      } catch (error) {
        console.error('Create failed:', error);
      }
    };
    
    return (
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create {createType === 'snapshot' ? 'Backup' : createType === 'policy' ? 'Policy' : 'Destination'}
            </DialogTitle>
            <DialogDescription>
              {createType === 'snapshot' && 'Create a new backup snapshot'}
              {createType === 'policy' && 'Create a new backup policy'}
              {createType === 'destination' && 'Add a new backup destination'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {createType === 'snapshot' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="type">Backup Type</Label>
                  <Select value={formData.type || 'incremental'} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Backup</SelectItem>
                      <SelectItem value="incremental">Incremental Backup</SelectItem>
                      <SelectItem value="differential">Differential Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Backup description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </>
            )}
            
            {createType === 'policy' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Policy Name</Label>
                  <Input
                    id="name"
                    placeholder="Policy name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency || 'daily'} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled || true}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable Policy</Label>
                </div>
              </>
            )}
            
            {createType === 'destination' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Destination Name</Label>
                  <Input
                    id="name"
                    placeholder="Destination name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type || 'local'} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="network">Network Storage</SelectItem>
                      <SelectItem value="remote">Remote Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="path">Path/URL</Label>
                  <Input
                    id="path"
                    placeholder="/backup or https://..."
                    value={formData.path || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incremental Backup</h2>
          <p className="text-muted-foreground">
            Automated backup system with intelligent incremental snapshots
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => backup.throttledRefresh()}
            disabled={backup.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${backup.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setCreateType('snapshot'); setShowCreateDialog(true); }}>
                <Database className="h-4 w-4 mr-2" />
                Backup Snapshot
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setCreateType('policy'); setShowCreateDialog(true); }}>
                <Settings className="h-4 w-4 mr-2" />
                Backup Policy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setCreateType('destination'); setShowCreateDialog(true); }}>
                <Cloud className="h-4 w-4 mr-2" />
                Destination
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Error Alert */}
      {backup.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{backup.error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading Progress */}
      {(backup.isLoading || progress.isActive) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{Math.round(progress.progress)}%</span>
              </div>
              <Progress value={progress.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card, index) => {
          const IconComponent = card.icon;
          const TrendIcon = getTrendIcon(card.trend);
          
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardExpand(`status-${index}`)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <TrendIcon className={`h-3 w-3 ${
                    card.trend === 'up' ? 'text-green-500' : 
                    card.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`} />
                  <IconComponent className={`h-4 w-4 text-${card.color}-500`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search backups, policies, destinations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    backup.debouncedSearch(e.target.value);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={backup.selectedPolicy} onValueChange={backup.setSelectedPolicy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Policies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Policies</SelectItem>
                {backup.policies.map(policy => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={backup.sortBy} onValueChange={backup.setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Date</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('quick-backup')}
              disabled={backup.hasActiveBackup}
            >
              <Play className="h-4 w-4 mr-2" />
              Quick Backup
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Snapshots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Recent Snapshots</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backup.recentSnapshots.map(snapshot => {
                    const StatusIcon = getStatusIcon(snapshot.status);
                    const TypeIcon = getTypeIcon(snapshot.type);
                    
                    return (
                      <div key={snapshot.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <TypeIcon className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium">{snapshot.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(snapshot.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={`text-${getStatusColor(snapshot.status)}-600`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {snapshot.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatBackupSize(snapshot.size)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleQuickAction('quick-backup')}
                    disabled={backup.hasActiveBackup}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Incremental Backup
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleQuickAction('quick-cleanup')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Old Snapshots
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleQuickAction('quick-optimize')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Optimize Storage
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => backup.refreshStats()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Statistics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Backup Speed</span>
                    <span className="text-sm text-muted-foreground">
                      {backup.averageBackupSpeed.toFixed(1)} MB/s
                    </span>
                  </div>
                  <Progress value={Math.min(backup.averageBackupSpeed, 100)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Restore Speed</span>
                    <span className="text-sm text-muted-foreground">
                      {backup.averageRestoreSpeed.toFixed(1)} MB/s
                    </span>
                  </div>
                  <Progress value={Math.min(backup.averageRestoreSpeed, 100)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Compression Ratio</span>
                    <span className="text-sm text-muted-foreground">
                      {backup.compressionRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={backup.compressionRatio} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Snapshots Tab */}
        <TabsContent value="snapshots" className="space-y-4">
          <div className="grid gap-4">
            {backup.filteredSnapshots.map(snapshot => {
              const StatusIcon = getStatusIcon(snapshot.status);
              const TypeIcon = getTypeIcon(snapshot.type);
              const isExpanded = expandedCards.includes(snapshot.id);
              
              return (
                <Card key={snapshot.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardExpand(snapshot.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TypeIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <CardTitle className="text-lg">{snapshot.description}</CardTitle>
                          <CardDescription>
                            {formatTime(snapshot.timestamp)} • {formatBackupDuration(snapshot.duration)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-${getStatusColor(snapshot.status)}-600`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {snapshot.status}
                        </Badge>
                        <Badge variant="secondary">{snapshot.type}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleQuickAction('quick-restore', snapshot.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => backup.verifySnapshot(snapshot.id)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Verify
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => backup.exportSnapshot(snapshot.id, 'zip')}>
                              <Upload className="h-4 w-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => backup.deleteSnapshot(snapshot.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="font-medium">Backup Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span>{formatBackupSize(snapshot.size)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Compressed:</span>
                              <span>{formatBackupSize(snapshot.compressedSize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Compression:</span>
                              <span>{(snapshot.compressionRatio * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Files:</span>
                              <span>{snapshot.files.length}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Metadata</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Version:</span>
                              <span>{snapshot.metadata.version}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Environment:</span>
                              <span>{snapshot.metadata.environment}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>User:</span>
                              <span>{snapshot.metadata.user}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Machine:</span>
                              <span>{snapshot.metadata.machine}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {snapshot.tags.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {snapshot.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general backup system behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Start</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start backup service
                    </p>
                  </div>
                  <Switch
                    checked={backup.config.general.autoStart}
                    onCheckedChange={(checked) => 
                      backup.updateConfig({
                        general: { ...backup.config.general, autoStart: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Display backup status notifications
                    </p>
                  </div>
                  <Switch
                    checked={backup.config.general.showNotifications}
                    onCheckedChange={(checked) => 
                      backup.updateConfig({
                        general: { ...backup.config.general, showNotifications: checked }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select 
                    value={backup.config.general.logLevel} 
                    onValueChange={(value) => 
                      backup.updateConfig({
                        general: { ...backup.config.general, logLevel: value as any }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Settings</CardTitle>
                <CardDescription>
                  Optimize backup performance and resource usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Deduplication</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove duplicate data to save space
                    </p>
                  </div>
                  <Switch
                    checked={backup.config.performance.enableDeduplication}
                    onCheckedChange={(checked) => 
                      backup.updateConfig({
                        performance: { ...backup.config.performance, enableDeduplication: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Delta Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Use delta compression for incremental backups
                    </p>
                  </div>
                  <Switch
                    checked={backup.config.performance.enableDeltaCompression}
                    onCheckedChange={(checked) => 
                      backup.updateConfig({
                        performance: { ...backup.config.performance, enableDeltaCompression: checked }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Concurrent Operations</Label>
                  <Input
                    type="number"
                    value={backup.config.general.maxConcurrentOperations}
                    onChange={(e) => 
                      backup.updateConfig({
                        general: { ...backup.config.general, maxConcurrentOperations: parseInt(e.target.value) }
                      })
                    }
                    min={1}
                    max={10}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Dialog */}
      <CreateDialog />
    </div>
  );
};

export default IncrementalBackupPanel;