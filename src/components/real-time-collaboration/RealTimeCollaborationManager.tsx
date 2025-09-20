import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  MessageSquare, 
  Lock, 
  Unlock, 
  Eye, 
  Edit3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Upload, 
  Settings, 
  Activity, 
  Wifi, 
  WifiOff,
  UserPlus,
  UserMinus,
  MousePointer,
  Type,
  GitMerge,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import useRealTimeCollaboration, { 
  User, 
  EditOperation, 
  Comment, 
  Lock as LockType, 
  ConflictResolution,
  CollaborationConfig 
} from '../../hooks/useRealTimeCollaboration';

interface RealTimeCollaborationManagerProps {
  className?: string;
  config?: Partial<CollaborationConfig>;
}

const RealTimeCollaborationManager: React.FC<RealTimeCollaborationManagerProps> = ({
  className = '',
  config = {}
}) => {
  const {
    isConnected,
    currentUser,
    users,
    events,
    operations,
    comments,
    locks,
    conflicts,
    metrics,
    config: collaborationConfig,
    error,
    lastSync,
    actions
  } = useRealTimeCollaboration(config);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<EditOperation | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [selectedLock, setSelectedLock] = useState<LockType | null>(null);
  const [connectionUrl, setConnectionUrl] = useState('ws://localhost:8080');
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    status: 'online'
  });

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger refresh if needed
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter functions
  const filteredUsers = users.filter(user => {
    if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && user.status !== filterType) {
      return false;
    }
    return true;
  });

  const filteredOperations = operations.filter(operation => {
    if (searchTerm && !operation.type.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !operation.elementId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredComments = comments.filter(comment => {
    if (searchTerm && !comment.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Helper functions
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'away': return 'text-yellow-600';
      case 'busy': return 'text-red-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'insert': return <Type className="w-4 h-4" />;
      case 'delete': return <Edit3 className="w-4 h-4" />;
      case 'replace': return <GitMerge className="w-4 h-4" />;
      case 'move': return <MousePointer className="w-4 h-4" />;
      case 'format': return <Zap className="w-4 h-4" />;
      default: return <Edit3 className="w-4 h-4" />;
    }
  };

  // Action handlers
  const handleConnect = async () => {
    if (!newUser.name || !newUser.email) {
      alert('Please provide name and email');
      return;
    }

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      status: newUser.status as 'online' | 'away' | 'busy' | 'offline',
      lastSeen: new Date()
    };

    try {
      await actions.connect(connectionUrl, user);
      setShowModal(null);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = () => {
    actions.disconnect();
  };

  const handleAddComment = () => {
    if (!selectedComment?.content) return;

    actions.addComment({
      userId: currentUser?.id || '',
      elementId: selectedComment.elementId,
      content: selectedComment.content,
      resolved: false,
      mentions: []
    });

    setShowModal(null);
    setSelectedComment(null);
  };

  const handleAcquireLock = (elementId: string, type: 'edit' | 'view' | 'exclusive') => {
    const success = actions.acquireLock(elementId, type);
    if (!success) {
      alert('Failed to acquire lock');
    }
  };

  const handleReleaseLock = (lockId: string) => {
    actions.releaseLock(lockId);
  };

  const handleExportData = () => {
    const data = actions.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collaboration-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      actions.importData(data);
    };
    reader.readAsText(file);
  };

  // Render functions
  const renderStatusBar = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {metrics.activeUsers} active users
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {metrics.operationsPerSecond} ops/sec
            </span>
          </div>
          
          {lastSync && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Last sync: {formatTimestamp(lastSync)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => setShowModal('connect')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
            >
              Connect
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Operations/sec</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.operationsPerSecond}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conflict Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(metrics.conflictRate * 100).toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(metrics.averageLatency)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {events.slice(-5).map((event) => (
              <div key={event.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {event.type === 'cursor' && <MousePointer className="w-4 h-4 text-blue-600" />}
                  {event.type === 'selection' && <Type className="w-4 h-4 text-green-600" />}
                  {event.type === 'edit' && <Edit3 className="w-4 h-4 text-purple-600" />}
                  {event.type === 'comment' && <MessageSquare className="w-4 h-4 text-yellow-600" />}
                  {event.type === 'lock' && <Lock className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {event.type} by {users.find(u => u.id === event.userId)?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'online' ? 'bg-green-100 text-green-800' :
                      user.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'busy' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(user.lastSeen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {user.cursor && (
                        <MousePointer className="w-4 h-4 text-blue-600" title="Active cursor" />
                      )}
                      {user.selection && (
                        <Type className="w-4 h-4 text-green-600" title="Text selected" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal('user-details');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOperations = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Operations</h3>
            <input
              type="text"
              placeholder="Search operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Element
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOperations.map((operation) => (
                <tr key={operation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getOperationIcon(operation.type)}
                      <span className="text-sm font-medium text-gray-900">
                        {operation.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {operation.elementId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {users.find(u => u.id === operation.userId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(operation.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      operation.applied ? 'bg-green-100 text-green-800' :
                      operation.conflicted ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {operation.applied ? 'Applied' :
                       operation.conflicted ? 'Conflicted' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOperation(operation);
                        setShowModal('operation-details');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderComments = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Comments</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => setShowModal('add-comment')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {filteredComments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {users.find(u => u.id === comment.userId)?.name || 'Unknown'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                    {comment.resolved && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{comment.content}</p>
                  <div className="text-sm text-gray-500">
                    Element: {comment.elementId}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!comment.resolved && (
                    <button
                      onClick={() => actions.resolveComment(comment.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Resolve comment"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedComment(comment);
                      setShowModal('comment-details');
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLocks = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Locks</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Element
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acquired
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locks.map((lock) => (
                <tr key={lock.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lock.elementId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lock.type === 'exclusive' ? 'bg-red-100 text-red-800' :
                      lock.type === 'edit' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lock.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {users.find(u => u.id === lock.userId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(lock.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(lock.expiresAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {lock.userId === currentUser?.id && (
                      <button
                        onClick={() => handleReleaseLock(lock.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderConflicts = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Conflict Resolutions</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-gray-900">
                      Conflict Resolution
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      conflict.strategy === 'merge' ? 'bg-green-100 text-green-800' :
                      conflict.strategy === 'override' ? 'bg-yellow-100 text-yellow-800' :
                      conflict.strategy === 'manual' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {conflict.strategy}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Operations: {conflict.operationIds.join(', ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Resolved by {users.find(u => u.id === conflict.resolvedBy)?.name || 'Unknown'} 
                    at {formatTimestamp(conflict.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Collaboration Settings</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* General Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">General</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Enable Collaboration</label>
                <input
                  type="checkbox"
                  checked={collaborationConfig.enabled}
                  onChange={(e) => actions.updateConfig({ enabled: e.target.checked })}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Max Users</label>
                <input
                  type="number"
                  value={collaborationConfig.maxUsers}
                  onChange={(e) => actions.updateConfig({ maxUsers: parseInt(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Sync Interval (ms)</label>
                <input
                  type="number"
                  value={collaborationConfig.syncInterval}
                  onChange={(e) => actions.updateConfig({ syncInterval: parseInt(e.target.value) })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Presence Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Presence</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Cursor Tracking</label>
                <input
                  type="checkbox"
                  checked={collaborationConfig.presence.cursorTracking}
                  onChange={(e) => actions.updateConfig({
                    presence: { ...collaborationConfig.presence, cursorTracking: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Selection Tracking</label>
                <input
                  type="checkbox"
                  checked={collaborationConfig.presence.selectionTracking}
                  onChange={(e) => actions.updateConfig({
                    presence: { ...collaborationConfig.presence, selectionTracking: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Typing Indicators</label>
                <input
                  type="checkbox"
                  checked={collaborationConfig.presence.typingIndicators}
                  onChange={(e) => actions.updateConfig({
                    presence: { ...collaborationConfig.presence, typingIndicators: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Locking Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Locking</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Enable Locking</label>
                <input
                  type="checkbox"
                  checked={collaborationConfig.locking.enabled}
                  onChange={(e) => actions.updateConfig({
                    locking: { ...collaborationConfig.locking, enabled: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Lock Timeout (ms)</label>
                <input
                  type="number"
                  value={collaborationConfig.locking.timeout}
                  onChange={(e) => actions.updateConfig({
                    locking: { ...collaborationConfig.locking, timeout: parseInt(e.target.value) }
                  })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Auto Release</label>
                <input
                  type="checkbox"
                  checked={collaborationConfig.locking.autoRelease}
                  onChange={(e) => actions.updateConfig({
                    locking: { ...collaborationConfig.locking, autoRelease: e.target.checked }
                  })}
                  className="rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Data Management */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Data Management</h4>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
              
              <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Modals
  const ConnectModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Connect to Collaboration Server</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Server URL
            </label>
            <input
              type="text"
              value={connectionUrl}
              onChange={(e) => setConnectionUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="ws://localhost:8080"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={newUser.status}
              onChange={(e) => setNewUser({ ...newUser, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="busy">Busy</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowModal(null)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );

  const AddCommentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Element ID
            </label>
            <input
              type="text"
              value={selectedComment?.elementId || ''}
              onChange={(e) => setSelectedComment({ 
                ...selectedComment, 
                elementId: e.target.value 
              } as Comment)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter element ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              value={selectedComment?.content || ''}
              onChange={(e) => setSelectedComment({ 
                ...selectedComment, 
                content: e.target.value 
              } as Comment)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Enter your comment"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowModal(null);
              setSelectedComment(null);
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Collaboration</h1>
          <p className="text-gray-600">Manage collaborative editing and real-time synchronization</p>
        </div>
        
        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'operations', label: 'Operations', icon: Edit3 },
              { id: 'comments', label: 'Comments', icon: MessageSquare },
              { id: 'locks', label: 'Locks', icon: Lock },
              { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Status Bar */}
      {renderStatusBar()}
      
      {/* Content */}
      <div className="flex-1">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'operations' && renderOperations()}
        {activeTab === 'comments' && renderComments()}
        {activeTab === 'locks' && renderLocks()}
        {activeTab === 'conflicts' && renderConflicts()}
        {activeTab === 'settings' && renderSettings()}
      </div>
      
      {/* Modals */}
      {showModal === 'connect' && <ConnectModal />}
      {showModal === 'add-comment' && <AddCommentModal />}
    </div>
  );
};

export default RealTimeCollaborationManager;