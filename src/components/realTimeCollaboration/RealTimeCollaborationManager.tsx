import React, { useState, useEffect, useMemo } from 'react';
import {
  useRealTimeCollaboration,
  useCollaborationStats,
  useCollaborationSessions,
  useCollaborationUsers,
  useCollaborationOperations,
  useCollaborationConflicts,
  useCollaborationMessages,
  useCollaborationEvents,
  useCollaborationDebug,
  useCollaborationMetrics
} from '../../hooks/useRealTimeCollaboration';
import {
  CollaborationUser,
  CollaborationOperation,
  CollaborationConflict,
  CollaborationSession,
  CollaborationMessage,
  formatDuration,
  getConflictTypeColor,
  getOperationTypeColor,
  getUserStatusColor,
  getNetworkStatusIcon
} from '../../utils/realTimeCollaboration';
import {
  Users,
  Activity,
  MessageSquare,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Zap,
  Shield,
  Globe,
  Video,
  Mic,
  MicOff,
  VideoOff,
  UserPlus,
  UserMinus,
  GitMerge,
  GitBranch,
  Database,
  Server,
  Monitor,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Gauge
} from 'lucide-react';

const RealTimeCollaborationManager: React.FC = () => {
  const collaboration = useRealTimeCollaboration();
  const stats = useCollaborationStats();
  const sessions = useCollaborationSessions();
  const users = useCollaborationUsers();
  const operations = useCollaborationOperations();
  const conflicts = useCollaborationConflicts();
  const messages = useCollaborationMessages();
  const events = useCollaborationEvents();
  const debug = useCollaborationDebug();
  const metrics = useCollaborationMetrics();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSession, setSelectedSession] = useState<CollaborationSession | null>(null);
  const [selectedUser, setSelectedUser] = useState<CollaborationUser | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<CollaborationConflict | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'user'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDebugMode, setShowDebugMode] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        collaboration.actions.syncState();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, collaboration.actions]);

  // Demo data generation effect
  useEffect(() => {
    if (sessions.sessions.length === 0) {
      const generateDemoData = async () => {
        try {
          // Generate demo sessions
          for (let i = 0; i < 3; i++) {
            const sessionId = await sessions.actions.create(
              `project-${i + 1}`,
              `Demo Session ${i + 1}`,
              {
                autoSave: true,
                conflictResolution: i % 2 === 0 ? 'automatic' : 'manual',
                maxParticipants: 5 + i
              }
            );

            // Add demo users to each session
            await sessions.actions.join(sessionId, {
              name: `User ${i * 2 + 1}`,
              email: `user${i * 2 + 1}@example.com`,
              color: ['#FF6B6B', '#4ECDC4', '#45B7D1'][i],
              permissions: { read: true, write: true, admin: i === 0 }
            });

            await sessions.actions.join(sessionId, {
              name: `User ${i * 2 + 2}`,
              email: `user${i * 2 + 2}@example.com`,
              color: ['#96CEB4', '#FFEAA7', '#DDA0DD'][i],
              permissions: { read: true, write: true, admin: false }
            });
          }

          // Generate demo operations
          const operationTypes: CollaborationOperation['type'][] = ['insert', 'delete', 'update', 'move', 'format'];
          for (let i = 0; i < 10; i++) {
            await operations.actions.apply({
              type: operationTypes[i % operationTypes.length],
              userId: `user-${(i % 6) + 1}`,
              position: Math.floor(Math.random() * 100),
              content: `Demo content ${i + 1}`,
              length: Math.floor(Math.random() * 20) + 1
            });
          }

          // Generate demo messages
          const messageContents = [
            'Welcome to the collaboration session!',
            'Great work everyone! 🎉',
            'Let\'s resolve this conflict together',
            'The latest changes look good',
            'Anyone available for a quick sync?'
          ];
          for (let i = 0; i < messageContents.length; i++) {
            await messages.actions.send(messageContents[i], i === 0 ? 'system' : 'chat');
          }

          collaboration.debug.log('info', 'sync', 'Demo collaboration data generated successfully');
        } catch (error) {
          collaboration.debug.log('error', 'sync', 'Failed to generate demo data', error);
        }
      };

      const timeout = setTimeout(generateDemoData, 1000);
      return () => clearTimeout(timeout);
    }
  }, [sessions.sessions.length]);

  // Filter and sort functions
  const filteredConflicts = useMemo(() => {
    let filtered = conflicts.conflicts;

    if (filterType === 'active') {
      filtered = filtered.filter(c => !c.resolved);
    } else if (filterType === 'resolved') {
      filtered = filtered.filter(c => c.resolved);
    }

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [conflicts.conflicts, filterType, searchTerm, sortBy, sortOrder]);

  const filteredOperations = useMemo(() => {
    return operations.operations
      .filter(op => 
        searchTerm === '' || 
        op.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.userId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
  }, [operations.operations, searchTerm, sortOrder]);

  // Status cards data
  const statusCards = [
    {
      title: 'Active Sessions',
      value: sessions.activeSessions.length,
      total: sessions.totalSessions,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Online Users',
      value: users.activeUsers.length,
      total: users.totalUsers,
      icon: Globe,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      change: '+8%'
    },
    {
      title: 'Operations/min',
      value: Math.round(stats.operationsPerSecond * 60),
      total: operations.totalOperations,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      change: '+15%'
    },
    {
      title: 'Sync Health',
      value: Math.round(stats.syncHealth),
      total: 100,
      icon: stats.syncHealth > 80 ? CheckCircle : AlertTriangle,
      color: stats.syncHealth > 80 ? 'text-green-500' : 'text-yellow-500',
      bgColor: stats.syncHealth > 80 ? 'bg-green-50' : 'bg-yellow-50',
      change: stats.syncHealth > 80 ? '+5%' : '-2%'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'sessions', label: 'Sessions', icon: Users },
    { id: 'operations', label: 'Operations', icon: Activity },
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Zap }
  ];

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900">Real-Time Collaboration</h1>
            </div>
            <div className="flex items-center space-x-2">
              {collaboration.isConnected ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">
                {getNetworkStatusIcon(collaboration.computed.networkStatus)} {collaboration.computed.networkStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            
            <button
              onClick={() => collaboration.actions.syncState()}
              disabled={collaboration.isSyncing}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Manual sync"
            >
              <RefreshCw className={`h-4 w-4 ${collaboration.isSyncing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowDebugMode(!showDebugMode)}
              className={`p-2 rounded-lg transition-colors ${
                showDebugMode ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle debug mode"
            >
              {showDebugMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                      {card.total && (
                        <p className="text-sm text-gray-500">/ {card.total}</p>
                      )}
                    </div>
                    <p className="text-xs text-green-600 font-medium">{card.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
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
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-6 py-6 overflow-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{Math.round(stats.collaborationScore)}%</div>
                  <div className="text-sm text-gray-600">Collaboration Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{Math.round(stats.syncHealth)}%</div>
                  <div className="text-sm text-gray-600">Sync Health</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.networkLatency}ms</div>
                  <div className="text-sm text-gray-600">Network Latency</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => collaboration.quickActions.startCollaboration()}
                  disabled={collaboration.isConnected}
                  className="flex items-center justify-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>Start</span>
                </button>
                <button
                  onClick={() => collaboration.quickActions.stopCollaboration()}
                  disabled={!collaboration.isConnected}
                  className="flex items-center justify-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" />
                  <span>Stop</span>
                </button>
                <button
                  onClick={() => collaboration.quickActions.resolveAllConflicts()}
                  disabled={conflicts.unresolvedConflicts === 0}
                  className="flex items-center justify-center space-x-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
                >
                  <GitMerge className="h-4 w-4" />
                  <span>Resolve</span>
                </button>
                <button
                  onClick={() => {
                    const data = collaboration.quickActions.exportSession();
                    if (data.success) {
                      const blob = new Blob([data.data || ''], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'collaboration-session.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="flex items-center justify-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h3>
              <div className="space-y-3">
                {events.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'error' ? 'bg-red-500' :
                      event.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.severity === 'error' ? 'bg-red-100 text-red-700' :
                      event.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Collaboration Sessions</h3>
                <button
                  onClick={async () => {
                    try {
                      await sessions.actions.create(
                        'new-project',
                        `New Session ${sessions.totalSessions + 1}`
                      );
                    } catch (error) {
                      console.error('Failed to create session:', error);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Session</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {sessions.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{session.name}</h4>
                        <p className="text-sm text-gray-600">Project: {session.projectId}</p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {session.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {session.participants.length} participants
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Operations</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search operations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {filteredOperations.map((operation) => (
                  <div key={operation.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      operation.applied ? 'bg-green-500' : 
                      operation.conflicted ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getOperationTypeColor(operation.type)}`}>
                          {operation.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">by {operation.userId}</span>
                        <span className="text-xs text-gray-500">
                          at position {operation.position}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(operation.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        operation.applied ? 'bg-green-100 text-green-700' :
                        operation.conflicted ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {operation.applied ? 'Applied' : operation.conflicted ? 'Conflicted' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {['conflicts', 'messages', 'performance', 'events', 'settings', 'debug'].includes(activeTab) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'conflicts' && `${conflicts.unresolvedConflicts} unresolved conflicts`}
              {activeTab === 'messages' && `${messages.totalMessages} total messages`}
              {activeTab === 'performance' && `Performance score: ${Math.round(metrics.performanceScore)}%`}
              {activeTab === 'events' && `${events.totalEvents} total events`}
              {activeTab === 'settings' && 'Collaboration settings and configuration'}
              {activeTab === 'debug' && `${debug.totalLogs} debug logs available`}
            </p>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{selectedSession.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Project ID</label>
                <p className="text-sm text-gray-900">{selectedSession.projectId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Participants</label>
                <div className="space-y-2">
                  {selectedSession.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="text-sm text-gray-900">{participant.name}</span>
                      <span className={`text-xs ${getUserStatusColor(participant.status)}`}>
                        {participant.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Settings</label>
                <div className="text-sm text-gray-900">
                  <p>Auto-save: {selectedSession.settings.autoSave ? 'Enabled' : 'Disabled'}</p>
                  <p>Conflict Resolution: {selectedSession.settings.conflictResolution}</p>
                  <p>Max Participants: {selectedSession.settings.maxParticipants}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && collaboration.lastError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-red-900">Error</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">{collaboration.lastError}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  collaboration.system.reconnect();
                  setShowErrorModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeCollaborationManager;