import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  Settings, 
  BarChart3, 
  Users, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Star,
  Filter,
  Search,
  RefreshCw,
  Eye,
  TrendingUp,
  Award,
  BookOpen,
  Zap
} from 'lucide-react';
import { useInteractiveTours, Tour, TourStep, TourProgress, TourMetrics } from '../../hooks/useInteractiveTours';

const InteractiveToursManager: React.FC = () => {
  const {
    tours,
    activeTour,
    currentStep,
    progress,
    metrics,
    config,
    isPlaying,
    isPaused,
    isLoading,
    error,
    logs,
    actions
  } = useInteractiveTours();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<TourProgress | null>(null);

  // Auto-refresh metrics
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        actions.updateMetrics();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, actions]);

  // Filter tours
  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || tour.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || tour.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Helper functions
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'onboarding': return <Users className="w-4 h-4" />;
      case 'feature': return <Zap className="w-4 h-4" />;
      case 'advanced': return <Award className="w-4 h-4" />;
      case 'troubleshooting': return <AlertCircle className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getProgressPercentage = (tourProgress: TourProgress, tour: Tour) => {
    if (tourProgress.completedAt) return 100;
    return Math.round((tourProgress.completedSteps.length / tour.steps.length) * 100);
  };

  // Render dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isPlaying ? 'text-green-600' : 'text-gray-500'}`}>
              {isPlaying ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              <span className="font-medium">
                {isPlaying ? `Playing: ${activeTour?.name}` : 'No active tour'}
              </span>
            </div>
            {activeTour && (
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {activeTour.steps.length}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeTour && (
              <>
                <button
                  onClick={actions.previousStep}
                  disabled={currentStep === 0}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={actions.skipStep}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={actions.stopTour}
                  className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Square className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-md ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tours</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalTours}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.completedTours}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(metrics.averageCompletionTime)}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.userSatisfaction.toFixed(1)}/5</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Popular Tours */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Popular Tours</h3>
        </div>
        <div className="p-6">
          {metrics.popularTours.length > 0 ? (
            <div className="space-y-3">
              {metrics.popularTours.slice(0, 5).map((tourId, index) => {
                const tour = tours.find(t => t.id === tourId);
                if (!tour) return null;
                return (
                  <div key={tourId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{tour.name}</div>
                        <div className="text-sm text-gray-600">{tour.category}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => actions.startTour(tour.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Start
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No tour data available</p>
          )}
        </div>
      </div>
    </div>
  );

  // Render tours list
  const renderTours = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="onboarding">Onboarding</option>
              <option value="feature">Feature</option>
              <option value="advanced">Advanced</option>
              <option value="troubleshooting">Troubleshooting</option>
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tour</span>
          </button>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map(tour => {
          const tourProgress = progress.find(p => p.tourId === tour.id);
          const progressPercentage = tourProgress ? getProgressPercentage(tourProgress, tour) : 0;
          
          return (
            <div key={tour.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(tour.category)}
                    <h3 className="text-lg font-medium text-gray-900">{tour.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedTour(tour);
                        setShowEditModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => actions.removeTour(tour.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tour.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(tour.difficulty)}`}>
                    {tour.difficulty}
                  </span>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(tour.estimatedTime)}</span>
                  </div>
                </div>
                
                {tourProgress && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>{tour.steps.length} steps</span>
                  </div>
                  <button
                    onClick={() => actions.startTour(tour.id)}
                    disabled={!tour.enabled}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tourProgress?.completedAt ? 'Restart' : 'Start'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredTours.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tours found</h3>
          <p className="text-gray-600">Try adjusting your search or filters, or create a new tour.</p>
        </div>
      )}
    </div>
  );

  // Render progress
  const renderProgress = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tour Progress</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {progress.map(prog => {
                const tour = tours.find(t => t.id === prog.tourId);
                if (!tour) return null;
                
                const progressPercentage = getProgressPercentage(prog, tour);
                
                return (
                  <tr key={prog.tourId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getCategoryIcon(tour.category)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                          <div className="text-sm text-gray-500">{tour.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prog.startedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(prog.timeSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        prog.completedAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {prog.completedAt ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedProgress(prog);
                          setShowProgressModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => actions.startTour(tour.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {progress.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data</h3>
            <p className="text-gray-600">Start a tour to see progress tracking.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Conversion Rate */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Rate</h3>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{metrics.conversionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Tours completed vs started</div>
          </div>
        </div>
      </div>

      {/* Drop-off Points */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Drop-off Points</h3>
        </div>
        <div className="p-6">
          {metrics.dropoffPoints.length > 0 ? (
            <div className="space-y-3">
              {metrics.dropoffPoints.slice(0, 10).map((dropoff, index) => (
                <div key={dropoff.stepId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Step: {dropoff.stepId}</div>
                      <div className="text-sm text-gray-600">{dropoff.count} users dropped off</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-600">{dropoff.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No drop-off data available</p>
          )}
        </div>
      </div>
    </div>
  );

  // Render settings
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Tour Configuration</h3>
        
        <div className="space-y-6">
          {/* General Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">General</h4>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.autoStart}
                  onChange={(e) => actions.updateConfig({ autoStart: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Auto-start tours</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.showProgress}
                  onChange={(e) => actions.updateConfig({ showProgress: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show progress indicator</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.allowSkipping}
                  onChange={(e) => actions.updateConfig({ allowSkipping: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Allow step skipping</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.highlightTarget}
                  onChange={(e) => actions.updateConfig({ highlightTarget: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Highlight target elements</span>
              </label>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Appearance</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.overlayOpacity}
                  onChange={(e) => actions.updateConfig({ overlayOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{config.overlayOpacity}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Animation Duration (ms)</label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={config.animationDuration}
                  onChange={(e) => actions.updateConfig({ animationDuration: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Features</h4>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.keyboardNavigation}
                  onChange={(e) => actions.updateConfig({ keyboardNavigation: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Keyboard navigation</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.mobileOptimized}
                  onChange={(e) => actions.updateConfig({ mobileOptimized: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Mobile optimization</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.analytics}
                  onChange={(e) => actions.updateConfig({ analytics: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Analytics tracking</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.persistence}
                  onChange={(e) => actions.updateConfig({ persistence: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Persist progress</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Data Management</h3>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const data = actions.exportData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `tours-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          
          <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Data</span>
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
                    actions.importData(data);
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>
          
          <button
            onClick={actions.clearLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interactive Tours Manager</h1>
        <p className="text-gray-600">Create and manage guided tours for your application</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'tours', label: 'Tours', icon: BookOpen },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
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

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'tours' && renderTours()}
      {activeTab === 'progress' && renderProgress()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'settings' && renderSettings()}

      {/* Modals would be implemented here */}
      {/* CreateTourModal, EditTourModal, StepModal, ProgressModal, etc. */}
    </div>
  );
};

export default InteractiveToursManager;