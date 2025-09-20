import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  Target, 
  Settings, 
  BarChart3, 
  Clock, 
  Brain, 
  Zap, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Circle,
  Timer,
  Award,
  Calendar,
  Activity
} from 'lucide-react';
import { useFocusMode, useFocusSession, useFocusStats, useFocusGoals } from '../../hooks/useFocusMode';
import { FocusSession, FocusGoal, FocusTemplate, FocusSettings } from '../../services/focusModeService';

interface FocusModeManagerProps {
  className?: string;
}

export const FocusModeManager: React.FC<FocusModeManagerProps> = ({ className = '' }) => {
  const {
    sessions,
    settings,
    templates,
    goals,
    events,
    isLoading,
    error,
    filteredSessions,
    activeGoals,
    completedGoals,
    sessionStats,
    currentStatus,
    // Actions
    startSession,
    endSession,
    updateSettings,
    createGoal,
    createTemplate,
    refreshData,
    exportData,
    backup,
    restore,
    reset,
    generateReport,
    configHelpers,
    analyticsHelpers
  } = useFocusMode();
  
  const { session, break: currentBreak, actions } = useFocusSession();
  const { stats } = useFocusStats();
  const { activeGoals: goals_active, actions: goalActions } = useFocusGoals();
  
  // Local state
  const [activeTab, setActiveTab] = useState('focus');
  const [showSettings, setShowSettings] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);
  const [isMinimalist, setIsMinimalist] = useState(settings.minimalistMode);
  const [isZenMode, setIsZenMode] = useState(settings.zenMode);
  
  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStatus.isActive) {
        refreshData();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentStatus.isActive, refreshData]);
  
  // Generate demo data for testing
  useEffect(() => {
    if (sessions.length === 0) {
      const demoSessions: Partial<FocusSession>[] = [
        {
          name: 'Morning Deep Work',
          type: 'deep_work',
          startTime: Date.now() - 2 * 60 * 60 * 1000,
          endTime: Date.now() - 1.5 * 60 * 60 * 1000,
          duration: 30 * 60 * 1000,
          productivity: 85,
          distractions: 2
        },
        {
          name: 'Pomodoro Session',
          type: 'pomodoro',
          startTime: Date.now() - 1 * 60 * 60 * 1000,
          endTime: Date.now() - 35 * 60 * 1000,
          duration: 25 * 60 * 1000,
          productivity: 92,
          distractions: 1
        }
      ];
      
      // Add demo sessions (simplified)
      // In real implementation, this would use the proper action
    }
  }, [sessions.length]);
  
  // Filter and sort data
  const recentSessions = filteredSessions.slice(0, 10);
  const recentEvents = events.slice(0, 20);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Current Session',
      value: session ? session.name : 'No active session',
      subtitle: session ? `${Math.floor(currentStatus.progress)}% complete` : 'Ready to start',
      icon: currentStatus.isActive ? Play : Pause,
      color: currentStatus.isActive ? 'text-green-500' : 'text-gray-500',
      bgColor: currentStatus.isActive ? 'bg-green-50' : 'bg-gray-50'
    },
    {
      title: 'Today\'s Focus',
      value: `${Math.floor(stats.todayStats.focusTime / (60 * 1000))} min`,
      subtitle: `${stats.todayStats.sessions} sessions`,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Productivity',
      value: `${Math.round(stats.todayStats.productivity)}%`,
      subtitle: analyticsHelpers.getProductivityTrend(),
      icon: analyticsHelpers.getProductivityTrend() === 'improving' ? TrendingUp : 
            analyticsHelpers.getProductivityTrend() === 'declining' ? TrendingDown : Activity,
      color: stats.todayStats.productivity >= 80 ? 'text-green-500' : 
             stats.todayStats.productivity >= 60 ? 'text-yellow-500' : 'text-red-500',
      bgColor: stats.todayStats.productivity >= 80 ? 'bg-green-50' : 
               stats.todayStats.productivity >= 60 ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Streak',
      value: `${stats.streakDays} days`,
      subtitle: 'Keep it up!',
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'focus', label: 'Focus', icon: Brain },
    { id: 'sessions', label: 'Sessions', icon: Clock },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'templates', label: 'Templates', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Activity }
  ];
  
  // Render focus timer
  const renderFocusTimer = () => {
    const remainingMinutes = Math.floor(currentStatus.remainingTime / (60 * 1000));
    const remainingSeconds = Math.floor((currentStatus.remainingTime % (60 * 1000)) / 1000);
    
    return (
      <div className={`text-center ${isZenMode ? 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50' : ''}`}>
        {isZenMode && (
          <button
            onClick={() => setIsZenMode(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <EyeOff className="w-6 h-6" />
          </button>
        )}
        
        <div className={`${isZenMode ? 'text-white' : ''}`}>
          <div className={`${isZenMode ? 'text-8xl' : 'text-6xl'} font-mono font-bold mb-4`}>
            {remainingMinutes.toString().padStart(2, '0')}:{remainingSeconds.toString().padStart(2, '0')}
          </div>
          
          {session && (
            <div className="mb-6">
              <h3 className={`${isZenMode ? 'text-2xl' : 'text-xl'} font-semibold mb-2`}>
                {session.name}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${currentStatus.progress}%` }}
                />
              </div>
              <p className={`${isZenMode ? 'text-lg' : 'text-sm'} opacity-75`}>
                {Math.floor(currentStatus.progress)}% complete
              </p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            {!currentStatus.isActive ? (
              <>
                <button
                  onClick={() => actions.start('pomodoro')}
                  className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Pomodoro</span>
                </button>
                <button
                  onClick={() => actions.start('deep_work')}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Brain className="w-5 h-5" />
                  <span>Deep Work</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={actions.pause}
                  className="flex items-center space-x-2 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={actions.end}
                  className="flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Square className="w-5 h-5" />
                  <span>End</span>
                </button>
                <button
                  onClick={() => actions.startBreak('short')}
                  className="flex items-center space-x-2 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Coffee className="w-5 h-5" />
                  <span>Break</span>
                </button>
              </>
            )}
          </div>
          
          {!isZenMode && (
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => setIsZenMode(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <Eye className="w-4 h-4" />
                <span>Zen Mode</span>
              </button>
              <button
                onClick={() => actions.addDistraction()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <Minus className="w-4 h-4" />
                <span>Mark Distraction</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render sessions list
  const renderSessions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Sessions</h3>
        <button
          onClick={() => exportData('csv')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className="grid gap-4">
        {recentSessions.map((session) => (
          <div
            key={session.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedSession(session)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{session.name}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(session.startTime).toLocaleString()}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {session.type}
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.floor(session.duration / (60 * 1000))} min
                  </span>
                  <span className="text-sm text-gray-600">
                    {session.productivity}% productive
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`w-3 h-3 rounded-full ${
                  session.endTime ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render goals
  const renderGoals = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Focus Goals</h3>
        <button
          onClick={() => setShowGoalModal(true)}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>
      
      <div className="grid gap-4">
        {[...activeGoals, ...completedGoals].map((goal) => (
          <div
            key={goal.id}
            className={`bg-white border rounded-lg p-4 ${
              goal.completed ? 'opacity-75' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => goalActions.complete(goal.id)}
                  className={`mt-1 ${
                    goal.completed ? 'text-green-500' : 'text-gray-400'
                  }`}
                >
                  {goal.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <h4 className={`font-medium ${
                    goal.completed ? 'line-through text-gray-500' : ''
                  }`}>
                    {goal.title}
                  </h4>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(goal.current / goal.target) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => goalActions.delete(goal.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render templates
  const renderTemplates = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Focus Templates</h3>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>
      
      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {template.category}
                  </span>
                  <span className="text-sm text-gray-600">
                    {template.schedule.workDuration} min work
                  </span>
                  <span className="text-sm text-gray-600">
                    {template.schedule.breakDuration} min break
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => startSession(template.category as any, template)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render analytics
  const renderAnalytics = () => {
    const insights = analyticsHelpers.generateInsights();
    const report = generateReport();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-600">Total Sessions</h4>
            <p className="text-2xl font-bold">{report.summary.totalSessions}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-600">Focus Time</h4>
            <p className="text-2xl font-bold">{report.summary.totalFocusTime}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-600">Productivity</h4>
            <p className="text-2xl font-bold">{report.summary.averageProductivity}%</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-600">Streak</h4>
            <p className="text-2xl font-bold">{report.summary.currentStreak} days</p>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium mb-4">Insights</h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                {insight}
              </p>
            ))}
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium mb-4">Recommendations</h4>
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <span>Recommended Session Type:</span>
              <span className="font-medium">{report.recommendations.sessionType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Optimal Duration:</span>
              <span className="font-medium">{report.recommendations.optimalDuration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Focus Score:</span>
              <span className="font-medium">{Math.round(report.recommendations.focusScore)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render events
  const renderEvents = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Events</h3>
        <button
          onClick={() => refreshData()}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="space-y-2">
        {recentEvents.map((event) => (
          <div key={event.id} className="bg-white border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{event.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-600">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                event.metadata.severity === 'high' ? 'bg-red-100 text-red-800' :
                event.metadata.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.metadata.source}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  if (isZenMode && currentStatus.isActive) {
    return renderFocusTimer();
  }
  
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Brain className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Focus Mode</h1>
                <p className="text-sm text-gray-600">Enhance your productivity with focused work sessions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMinimalist(!isMinimalist)}
                className={`p-2 rounded-lg ${
                  isMinimalist ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isMinimalist ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-2 rounded-lg ${
                  settings.soundEnabled ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Cards */}
        {!isMinimalist && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statusCards.map((card, index) => (
              <div key={index} className={`${card.bgColor} rounded-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-sm text-gray-600">{card.subtitle}</p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Focus Timer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {renderFocusTimer()}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Today's Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Focus Time</span>
                    <span>{Math.floor(stats.todayStats.focusTime / (60 * 1000))} / 120 min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (stats.todayStats.focusTime / (120 * 60 * 1000)) * 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Sessions</span>
                    <span>{stats.todayStats.sessions} / 6</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (stats.todayStats.sessions / 6) * 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Productivity</span>
                    <span>{Math.round(stats.todayStats.productivity)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${stats.todayStats.productivity}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => configHelpers.presets.pomodoro()}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <Timer className="w-5 h-5 text-red-500" />
                  <span>Pomodoro (25 min)</span>
                </button>
                <button
                  onClick={() => configHelpers.presets.deepWork()}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <Brain className="w-5 h-5 text-blue-500" />
                  <span>Deep Work (90 min)</span>
                </button>
                <button
                  onClick={() => configHelpers.presets.study()}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <Calendar className="w-5 h-5 text-green-500" />
                  <span>Study Session (45 min)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        {!isMinimalist && (
          <div className="mt-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="mt-6">
              {activeTab === 'focus' && renderFocusTimer()}
              {activeTab === 'sessions' && renderSessions()}
              {activeTab === 'goals' && renderGoals()}
              {activeTab === 'templates' && renderTemplates()}
              {activeTab === 'analytics' && renderAnalytics()}
              {activeTab === 'events' && renderEvents()}
            </div>
          </div>
        )}
      </div>
      
      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Session Details</h3>
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
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900">{selectedSession.type}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <p className="text-sm text-gray-900">
                  {Math.floor(selectedSession.duration / (60 * 1000))} minutes
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Productivity</label>
                <p className="text-sm text-gray-900">{selectedSession.productivity}%</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Distractions</label>
                <p className="text-sm text-gray-900">{selectedSession.distractions}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Breaks</label>
                <p className="text-sm text-gray-900">{selectedSession.breaks?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusModeManager;