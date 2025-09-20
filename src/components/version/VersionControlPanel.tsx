import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  History,
  FileText,
  Users,
  Clock,
  Activity,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  Info,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  useVersionControl,
  useVersionControlStats,
  useVersionControlConfig,
  useVersionSearch,
  useBranchManagement,
  useCommitHistory,
  useMergeRequests,
  useDiffViewer,
  useVersionControlRealtime
} from '../../hooks/useVersionControl';
import { FileVersion, Branch, Commit, MergeRequest, FileDiff } from '../../services/versionControlService';

interface VersionControlPanelProps {
  className?: string;
}

export const VersionControlPanel: React.FC<VersionControlPanelProps> = ({ className }) => {
  // Hooks
  const versionControl = useVersionControl();
  const stats = useVersionControlStats();
  const { config, updateSetting } = useVersionControlConfig();
  const search = useVersionSearch();
  const branchManagement = useBranchManagement();
  const commitHistory = useCommitHistory();
  const mergeRequests = useMergeRequests();
  const diffViewer = useDiffViewer();
  const realtime = useVersionControlRealtime();
  
  // Local state
  const [activeTab, setActiveTab] = useState('versions');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'version' | 'branch' | 'commit' | 'merge-request'>('version');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'timeline'>('list');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh demo data
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        versionControl.refreshData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, versionControl]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Versions',
      value: stats.totalVersions.toLocaleString(),
      change: `+${stats.versionsToday}`,
      changeType: 'positive' as const,
      icon: History,
      color: 'blue'
    },
    {
      title: 'Active Branches',
      value: branchManagement.branchHealth.active.toString(),
      change: `${branchManagement.branchHealth.stale} stale`,
      changeType: branchManagement.branchHealth.stale > 0 ? 'negative' as const : 'neutral' as const,
      icon: GitBranch,
      color: 'green'
    },
    {
      title: 'Recent Commits',
      value: commitHistory.recentCommits.length.toString(),
      change: `${stats.commitsToday} today`,
      changeType: 'positive' as const,
      icon: GitCommit,
      color: 'purple'
    },
    {
      title: 'Open MRs',
      value: mergeRequests.openMergeRequests.length.toString(),
      change: `${mergeRequests.pendingReviews.length} pending`,
      changeType: mergeRequests.pendingReviews.length > 0 ? 'warning' as const : 'neutral' as const,
      icon: GitPullRequest,
      color: 'orange'
    }
  ];
  
  // Tab configuration
  const tabs = [
    {
      id: 'versions',
      label: 'Versions',
      icon: History,
      count: versionControl.filteredVersions.length
    },
    {
      id: 'branches',
      label: 'Branches',
      icon: GitBranch,
      count: branchManagement.branches.length
    },
    {
      id: 'commits',
      label: 'Commits',
      icon: GitCommit,
      count: commitHistory.filteredCommits.length
    },
    {
      id: 'merge-requests',
      label: 'Merge Requests',
      icon: GitPullRequest,
      count: mergeRequests.filteredMergeRequests.length
    },
    {
      id: 'diff',
      label: 'Diff Viewer',
      icon: FileText,
      count: diffViewer.diffs.length
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      count: 0
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      count: 0
    }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'open': case 'approved': return <Check className="h-4 w-4 text-green-500" />;
      case 'merged': case 'completed': return <GitMerge className="h-4 w-4 text-blue-500" />;
      case 'closed': case 'rejected': return <X className="h-4 w-4 text-red-500" />;
      case 'pending': case 'draft': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'stale': case 'inactive': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'open': case 'approved': return 'bg-green-100 text-green-800';
      case 'merged': case 'completed': return 'bg-blue-100 text-blue-800';
      case 'closed': case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'stale': case 'inactive': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  const handleQuickAction = async (action: string, id?: string) => {
    try {
      switch (action) {
        case 'refresh':
          await versionControl.refreshData();
          break;
        case 'optimize':
          await versionControl.optimizeStorage();
          break;
        case 'export':
          await versionControl.exportHistory('json');
          break;
        case 'connect':
          await realtime.connect();
          break;
        case 'disconnect':
          realtime.disconnect();
          break;
        case 'sync':
          await realtime.forceSync();
          break;
        default:
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
    }
  };
  
  if (versionControl.isLoading && !versionControl.versions.length) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading version control data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Version Control</h2>
          <p className="text-gray-600">Manage versions, branches, and collaboration</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {realtime.connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {realtime.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('refresh')}
            disabled={versionControl.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${versionControl.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {realtime.connectionStatus === 'connected' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('disconnect')}
            >
              <Pause className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('connect')}
            >
              <Play className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('sync')}
            disabled={realtime.connectionStatus !== 'connected'}
          >
            <Target className="h-4 w-4 mr-2" />
            Force Sync
          </Button>
        </div>
      </div>
      
      {/* Error Alert */}
      {versionControl.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {versionControl.error}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Processing Progress */}
      {versionControl.isProcessing && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <div>{versionControl.processingMessage}</div>
              <Progress value={versionControl.progress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className={`text-xs ${
                      card.changeType === 'positive' ? 'text-green-600' :
                      card.changeType === 'negative' ? 'text-red-600' :
                      card.changeType === 'warning' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {card.change}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg bg-${card.color}-100`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search versions, commits, branches..."
                  value={search.searchQuery}
                  onChange={(e) => search.setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={search.authorFilter || ''} onValueChange={search.setAuthorFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Author" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Authors</SelectItem>
                  {versionControl.uniqueAuthors.map(author => (
                    <SelectItem key={author} value={author}>{author}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={search.branchFilter || ''} onValueChange={search.setBranchFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Branches</SelectItem>
                  {versionControl.uniqueBranches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={viewMode} onValueChange={(value: 'list' | 'tree' | 'timeline') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="tree">Tree</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>
              
              {search.hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={search.clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">File Versions</h3>
            <Button
              onClick={() => {
                setCreateType('version');
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Version
            </Button>
          </div>
          
          <div className="space-y-2">
            {versionControl.filteredVersions.map((version: FileVersion) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{version.fileName}</span>
                        <Badge className={getStatusColor('active')}>v{version.version}</Badge>
                        <Badge variant="outline">{version.branch}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{version.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{version.author.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(version.timestamp)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span>{version.metadata.linesAdded}+ {version.metadata.linesRemoved}-</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => diffViewer.viewDiff({
                          id: `diff-${version.id}`,
                          fileName: version.fileName,
                          oldContent: '',
                          newContent: version.content,
                          chunks: [],
                          stats: { additions: version.metadata.linesAdded, deletions: version.metadata.linesRemoved, changes: version.metadata.linesModified }
                        })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => versionControl.restoreVersion(version.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => versionControl.deleteVersion(version.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Branches</h3>
            <Button
              onClick={() => {
                setCreateType('branch');
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Branch
            </Button>
          </div>
          
          <div className="space-y-2">
            {branchManagement.branches.map((branch: Branch) => (
              <Card key={branch.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <GitBranch className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{branch.name}</span>
                        {branch.isDefault && <Badge className="bg-blue-100 text-blue-800">Default</Badge>}
                        {branch.isProtected && <Badge className="bg-red-100 text-red-800">Protected</Badge>}
                        {getStatusIcon(branch.isDefault ? 'active' : 'open')}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{branch.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{branch.author.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(branch.updatedAt)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <GitCommit className="h-3 w-3" />
                          <span>{branch.commitCount} commits</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {branchManagement.currentBranch !== branch.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => branchManagement.switchBranch(branch.id)}
                        >
                          <GitBranch className="h-4 w-4 mr-2" />
                          Switch
                        </Button>
                      )}
                      {!branch.isDefault && !branch.isProtected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => branchManagement.deleteBranch(branch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Commits Tab */}
        <TabsContent value="commits" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Commit History</h3>
            <Button
              onClick={() => {
                setCreateType('commit');
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Commit
            </Button>
          </div>
          
          <div className="space-y-2">
            {commitHistory.filteredCommits.map((commit: Commit) => (
              <Card key={commit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <GitCommit className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{commit.message}</span>
                        <Badge variant="outline">{commit.branch}</Badge>
                        <Badge className="bg-gray-100 text-gray-800 font-mono text-xs">
                          {commit.hash.substring(0, 7)}
                        </Badge>
                      </div>
                      {commit.description && (
                        <p className="text-sm text-gray-600 mt-1">{commit.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{commit.author.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(commit.timestamp)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{commit.files.length} files</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => commitHistory.revertCommit(commit.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(commit.hash)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Merge Requests Tab */}
        <TabsContent value="merge-requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Merge Requests</h3>
            <Button
              onClick={() => {
                setCreateType('merge-request');
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create MR
            </Button>
          </div>
          
          <div className="space-y-2">
            {mergeRequests.filteredMergeRequests.map((mr: MergeRequest) => (
              <Card key={mr.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <GitPullRequest className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{mr.title}</span>
                        <Badge className={getStatusColor(mr.status)}>{mr.status}</Badge>
                        {getStatusIcon(mr.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{mr.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{mr.author.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(mr.createdAt)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <GitBranch className="h-3 w-3" />
                          <span>{mr.sourceBranch} → {mr.targetBranch}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {mr.status === 'open' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => mergeRequests.reviewMergeRequest(mr.id, 'approved')}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => mergeRequests.mergeMergeRequest(mr.id)}
                          >
                            <GitMerge className="h-4 w-4 mr-2" />
                            Merge
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mergeRequests.closeMergeRequest(mr.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Diff Viewer Tab */}
        <TabsContent value="diff" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Diff Viewer</h3>
            <div className="flex items-center space-x-2">
              <Select value={diffViewer.diffViewMode} onValueChange={diffViewer.setDiffViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="side-by-side">Side by Side</SelectItem>
                  <SelectItem value="unified">Unified</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {diffViewer.selectedDiff ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{diffViewer.selectedDiff.fileName}</span>
                  <Badge className="bg-green-100 text-green-800">
                    +{diffViewer.selectedDiff.stats.additions}
                  </Badge>
                  <Badge className="bg-red-100 text-red-800">
                    -{diffViewer.selectedDiff.stats.deletions}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {diffViewer.selectedDiff.chunks.map((chunk, index) => (
                      <div key={index} className="border rounded-lg">
                        <div className="bg-gray-50 px-3 py-2 text-sm font-mono text-gray-600">
                          @@ -{chunk.oldStart},{chunk.oldLines} +{chunk.newStart},{chunk.newLines} @@
                        </div>
                        <div className="divide-y">
                          {chunk.lines.map((line, lineIndex) => (
                            <div
                              key={lineIndex}
                              className={`px-3 py-1 font-mono text-sm ${
                                line.type === 'added' ? 'bg-green-50 text-green-800' :
                                line.type === 'removed' ? 'bg-red-50 text-red-800' :
                                'bg-white text-gray-800'
                              }`}
                            >
                              <span className="inline-block w-8 text-gray-400 text-right mr-4">
                                {line.oldLineNumber || line.newLineNumber}
                              </span>
                              <span className="inline-block w-4 text-center">
                                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                              </span>
                              <span>{line.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Select a version or commit to view diff</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Analytics &amp; Insights</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Activity Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Versions Today</span>
                    <span className="font-semibold">{versionControl.recentActivity.versionsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Commits This Week</span>
                    <span className="font-semibold">{versionControl.recentActivity.commitsThisWeek}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Contributors</span>
                    <span className="font-semibold">{versionControl.uniqueAuthors.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Branch Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Branch Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Branches</span>
                    <span className="font-semibold text-green-600">{branchManagement.branchHealth.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stale Branches</span>
                    <span className="font-semibold text-orange-600">{branchManagement.branchHealth.stale}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Protected Branches</span>
                    <span className="font-semibold text-blue-600">{branchManagement.branchHealth.protected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Merge Request Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Merge Request Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Open MRs</span>
                    <span className="font-semibold text-orange-600">{mergeRequests.mergeRequestMetrics.open}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Merged MRs</span>
                    <span className="font-semibold text-green-600">{mergeRequests.mergeRequestMetrics.merged}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Review Time</span>
                    <span className="font-semibold">{mergeRequests.mergeRequestMetrics.averageReviewTime.toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Top Contributors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commitHistory.commitsByAuthor.slice(0, 5).map((contributor, index) => (
                    <div key={contributor.author} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{contributor.author}</span>
                      </div>
                      <span className="text-sm text-gray-600">{contributor.count} commits</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-semibold">Version Control Settings</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure general version control behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">Auto-save versions</Label>
                  <Switch
                    id="auto-save"
                    checked={config.autoSave}
                    onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Auto-save interval (minutes)</Label>
                  <Slider
                    value={[config.autoSaveInterval / 60000]}
                    onValueChange={([value]) => updateSetting('autoSaveInterval', value * 60000)}
                    max={60}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600">
                    Current: {config.autoSaveInterval / 60000} minutes
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Maximum versions per file</Label>
                  <Slider
                    value={[config.maxVersionsPerFile]}
                    onValueChange={([value]) => updateSetting('maxVersionsPerFile', value)}
                    max={1000}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600">
                    Current: {config.maxVersionsPerFile} versions
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Diff Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Diff Settings</CardTitle>
                <CardDescription>Configure diff viewer preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-whitespace">Show whitespace changes</Label>
                  <Switch
                    id="show-whitespace"
                    checked={config.showWhitespaceInDiff}
                    onCheckedChange={(checked) => updateSetting('showWhitespaceInDiff', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="word-wrap">Word wrap in diff</Label>
                  <Switch
                    id="word-wrap"
                    checked={config.wordWrapInDiff}
                    onCheckedChange={(checked) => updateSetting('wordWrapInDiff', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Context lines</Label>
                  <Slider
                    value={[config.contextLines]}
                    onValueChange={([value]) => updateSetting('contextLines', value)}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600">
                    Current: {config.contextLines} lines
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Collaboration Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Settings</CardTitle>
                <CardDescription>Configure team collaboration features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-review">Require review for merges</Label>
                  <Switch
                    id="require-review"
                    checked={config.requireReviewForMerge}
                    onCheckedChange={(checked) => updateSetting('requireReviewForMerge', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-merge">Auto-merge approved MRs</Label>
                  <Switch
                    id="auto-merge"
                    checked={config.autoMergeApproved}
                    onCheckedChange={(checked) => updateSetting('autoMergeApproved', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-changes">Notify on changes</Label>
                  <Switch
                    id="notify-changes"
                    checked={config.notifyOnChanges}
                    onCheckedChange={(checked) => updateSetting('notifyOnChanges', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Storage Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Settings</CardTitle>
                <CardDescription>Manage storage and cleanup options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compress-old">Compress old versions</Label>
                  <Switch
                    id="compress-old"
                    checked={config.compressOldVersions}
                    onCheckedChange={(checked) => updateSetting('compressOldVersions', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cleanup after (days)</Label>
                  <Slider
                    value={[config.cleanupAfterDays]}
                    onValueChange={([value]) => updateSetting('cleanupAfterDays', value)}
                    max={365}
                    min={7}
                    step={7}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600">
                    Current: {config.cleanupAfterDays} days
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAction('optimize')}
                    className="flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Storage
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAction('export')}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create {createType === 'merge-request' ? 'Merge Request' : createType.charAt(0).toUpperCase() + createType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              {createType === 'version' && 'Create a new version of the selected file'}
              {createType === 'branch' && 'Create a new branch for development'}
              {createType === 'commit' && 'Commit your current changes'}
              {createType === 'merge-request' && 'Create a new merge request'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {createType === 'version' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="file-id">File</Label>
                  <Input id="file-id" placeholder="Enter file ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version-message">Message</Label>
                  <Input id="version-message" placeholder="Describe the changes" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version-content">Content</Label>
                  <Textarea id="version-content" placeholder="File content" rows={4} />
                </div>
              </>
            )}
            
            {createType === 'branch' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Branch Name</Label>
                  <Input id="branch-name" placeholder="feature/new-feature" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch-description">Description</Label>
                  <Textarea id="branch-description" placeholder="Describe the branch purpose" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-branch">From Branch</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select base branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchManagement.branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {createType === 'commit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="commit-message">Commit Message</Label>
                  <Input id="commit-message" placeholder="Add new feature" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commit-description">Description (optional)</Label>
                  <Textarea id="commit-description" placeholder="Detailed description" rows={3} />
                </div>
              </>
            )}
            
            {createType === 'merge-request' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mr-title">Title</Label>
                  <Input id="mr-title" placeholder="Add new feature" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mr-description">Description</Label>
                  <Textarea id="mr-description" placeholder="Describe the changes" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source-branch">Source Branch</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchManagement.branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-branch">Target Branch</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchManagement.branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle creation logic here
              setShowCreateDialog(false);
            }}>
              Create {createType === 'merge-request' ? 'MR' : createType.charAt(0).toUpperCase() + createType.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VersionControlPanel;