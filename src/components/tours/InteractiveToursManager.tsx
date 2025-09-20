import React, { useState, useCallback, useRef } from 'react';
import { useInteractiveTours, Tour, TourStep, TourConfig } from '../../hooks/useInteractiveTours';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Users,
  Clock,
  Star,
  Target,
  Map,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Upload,
  Copy,
  RefreshCw,
  Zap,
  TrendingUp,
  Award,
  MessageSquare,
  Navigation,
  Layers,
  Monitor
} from 'lucide-react';

interface InteractiveToursManagerProps {
  className?: string;
}

const InteractiveToursManager: React.FC<InteractiveToursManagerProps> = ({ className = '' }) => {
  const { state, config, actions } = useInteractiveTours();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tours' | 'analytics' | 'builder' | 'settings'>('dashboard');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newTour, setNewTour] = useState<Partial<Tour>>({});
  const [newStep, setNewStep] = useState<Partial<TourStep>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter tours
  const filteredTours = actions.getTours().filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tour.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Handle tour creation
  const handleCreateTour = useCallback(() => {
    if (!newTour.name || !newTour.description) return;
    
    const tour: Tour = {
      id: `tour-${Date.now()}`,
      name: newTour.name,
      description: newTour.description,
      category: newTour.category || 'custom',
      priority: newTour.priority || 'medium',
      autoStart: newTour.autoStart || false,
      showProgress: newTour.showProgress !== false,
      allowSkip: newTour.allowSkip !== false,
      restartable: newTour.restartable !== false,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: []
    };
    
    actions.addTour(tour);
    setNewTour({});
    setIsCreating(false);
    setSelectedTour(tour);
  }, [newTour, actions]);
  
  // Handle step creation
  const handleAddStep = useCallback(() => {
    if (!selectedTour || !newStep.title || !newStep.content || !newStep.target) return;
    
    const step: TourStep = {
      id: `step-${Date.now()}`,
      title: newStep.title,
      content: newStep.content,
      target: newStep.target,
      position: newStep.position || 'bottom',
      allowSkip: newStep.allowSkip !== false,
      highlightPadding: newStep.highlightPadding || 8
    };
    
    const updatedTour = {
      ...selectedTour,
      steps: [...selectedTour.steps, step],
      updatedAt: new Date()
    };
    
    actions.addTour(updatedTour);
    setSelectedTour(updatedTour);
    setNewStep({});
  }, [selectedTour, newStep, actions]);
  
  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  
  // Get category color
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'feature': return 'bg-green-100 text-green-800';
      case 'help': return 'bg-yellow-100 text-yellow-800';
      case 'update': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  const renderDashboard = () => {
    const metrics = actions.getMetrics();
    
    return (
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tours</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalTours}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(metrics.completionRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(metrics.averageCompletionTime)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.feedbackScore.toFixed(1)}/5
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Tour Status */}
        {state.activeTour && (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Tour</h3>
              <div className="flex items-center gap-2">
                {state.isPlaying ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Play className="w-4 h-4" />
                    <span className="text-sm font-medium">Playing</span>
                  </div>
                ) : state.isPaused ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Pause className="w-4 h-4" />
                    <span className="text-sm font-medium">Paused</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Square className="w-4 h-4" />
                    <span className="text-sm font-medium">Stopped</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Tour Name</p>
                <p className="text-lg font-semibold text-gray-900">{state.activeTour.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Current Step</p>
                <p className="text-lg font-semibold text-gray-900">
                  {state.currentStep + 1} of {state.activeTour.steps.length}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((state.currentStep + 1) / state.activeTour.steps.length) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(((state.currentStep + 1) / state.activeTour.steps.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={actions.previousStep}
                disabled={state.currentStep === 0}
                className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="w-4 h-4" />
                Previous
              </button>
              
              {state.isPlaying ? (
                <button
                  onClick={actions.pauseTour}
                  className="flex items-center gap-2 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={actions.resumeTour}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              
              <button
                onClick={actions.nextStep}
                disabled={state.currentStep >= state.activeTour.steps.length - 1}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Next
              </button>
              
              <button
                onClick={actions.stopTour}
                className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setIsCreating(true);
                setActiveTab('builder');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Tour
            </button>
            
            <button
              onClick={() => {
                const onboardingSteps = [
                  {
                    title: 'Welcome to Studio Treiax',
                    content: 'Let\'s take a quick tour of the main features',
                    target: 'body',
                    position: 'center' as const
                  },
                  {
                    title: 'Navigation Menu',
                    content: 'Use this menu to navigate between different sections',
                    target: 'nav',
                    position: 'right' as const
                  }
                ];
                
                const tour = actions.createOnboardingTour(onboardingSteps);
                actions.startTour(tour.id);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              Quick Onboarding
            </button>
            
            <button
              onClick={() => {
                const data = actions.exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tours-data.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
        
        {/* Popular Tours */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tours</h3>
          <div className="space-y-3">
            {metrics.popularTours.slice(0, 5).map((item, index) => {
              const tour = actions.getTour(item.tourId);
              if (!tour) return null;
              
              return (
                <div key={item.tourId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tour.name}</p>
                      <p className="text-sm text-gray-500">{tour.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{item.views} views</p>
                    <button
                      onClick={() => actions.startTour(tour.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Start Tour
                    </button>
                  </div>
                </div>
              );
            })}
            
            {metrics.popularTours.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tour data available yet</p>
                <p className="text-sm">Create and run tours to see analytics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderTours = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="onboarding">Onboarding</option>
            <option value="feature">Feature</option>
            <option value="help">Help</option>
            <option value="update">Update</option>
            <option value="custom">Custom</option>
          </select>
          
          <button
            onClick={() => {
              setIsCreating(true);
              setActiveTab('builder');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Tour
          </button>
        </div>
      </div>
      
      {/* Tours List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTours.map(tour => {
          const analytics = actions.getTourAnalytics(tour.id);
          
          return (
            <div key={tour.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{tour.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{tour.description}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tour.category)}`}>
                      {tour.category}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(tour.priority)}`}>
                      {tour.priority}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => actions.startTour(tour.id)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                    title="Start Tour"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedTour(tour);
                      setActiveTab('builder');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Edit Tour"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this tour?')) {
                        actions.removeTour(tour.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Delete Tour"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Steps:</span>
                  <span className="font-medium">{tour.steps.length}</span>
                </div>
                
                {analytics && (
                  <>
                    <div className="flex justify-between">
                      <span>Views:</span>
                      <span className="font-medium">{analytics.views}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-medium">
                        {analytics.views > 0 ? ((analytics.completions / analytics.views) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span>Auto Start:</span>
                  <span className={`font-medium ${
                    tour.autoStart ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {tour.autoStart ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredTours.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No tours found</h3>
          <p className="mb-4">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first interactive tour to get started'
            }
          </p>
          <button
            onClick={() => {
              setIsCreating(true);
              setActiveTab('builder');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Tour
          </button>
        </div>
      )}
    </div>
  );
  
  const renderAnalytics = () => {
    const metrics = actions.getMetrics();
    
    return (
      <div className="space-y-6">
        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-2">User Engagement</h4>
            <p className="text-2xl font-bold text-blue-600">
              {(metrics.userEngagement * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Overall engagement rate</p>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-2">Error Rate</h4>
            <p className="text-2xl font-bold text-red-600">
              {(metrics.errorRate * 100).toFixed(2)}%
            </p>
            <p className="text-sm text-gray-500">Tour execution errors</p>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-2">Active Tours</h4>
            <p className="text-2xl font-bold text-green-600">{metrics.activeTours}</p>
            <p className="text-sm text-gray-500">Currently running</p>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-2">Feedback Score</h4>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-yellow-600">
                {metrics.feedbackScore.toFixed(1)}
              </p>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-sm text-gray-500">Average user rating</p>
          </div>
        </div>
        
        {/* Tour Performance */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour Performance</h3>
          <div className="space-y-4">
            {actions.getTours().map(tour => {
              const analytics = actions.getTourAnalytics(tour.id);
              if (!analytics) return null;
              
              const completionRate = analytics.views > 0 ? (analytics.completions / analytics.views) * 100 : 0;
              
              return (
                <div key={tour.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{tour.name}</h4>
                      <p className="text-sm text-gray-500">{tour.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tour.category)}`}>
                      {tour.category}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Views</p>
                      <p className="font-semibold text-gray-900">{analytics.views}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Completions</p>
                      <p className="font-semibold text-green-600">{analytics.completions}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Completion Rate</p>
                      <p className="font-semibold text-blue-600">{completionRate.toFixed(1)}%</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Avg. Time</p>
                      <p className="font-semibold text-purple-600">
                        {formatDuration(analytics.averageTime)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Completion Rate</span>
                      <span>{completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* User Feedback */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
          <div className="space-y-3">
            {actions.getTours().flatMap(tour => {
              const analytics = actions.getTourAnalytics(tour.id);
              return analytics?.userFeedback.slice(-5) || [];
            }).slice(-10).map((feedback, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= feedback.rating
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {feedback.rating}/5
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {feedback.timestamp.toLocaleDateString()}
                  </span>
                </div>
                
                {feedback.comment && (
                  <p className="text-sm text-gray-700">{feedback.comment}</p>
                )}
              </div>
            ))}
            
            {actions.getTours().every(tour => {
              const analytics = actions.getTourAnalytics(tour.id);
              return !analytics || analytics.userFeedback.length === 0;
            }) && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No feedback available yet</p>
                <p className="text-sm">User feedback will appear here as tours are completed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderBuilder = () => (
    <div className="space-y-6">
      {isCreating ? (
        /* Tour Creation Form */
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Tour</h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTour({});
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tour Name *
              </label>
              <input
                type="text"
                value={newTour.name || ''}
                onChange={(e) => setNewTour(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tour name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={newTour.category || 'custom'}
                onChange={(e) => setNewTour(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="onboarding">Onboarding</option>
                <option value="feature">Feature</option>
                <option value="help">Help</option>
                <option value="update">Update</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={newTour.description || ''}
                onChange={(e) => setNewTour(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this tour covers"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newTour.priority || 'medium'}
                onChange={(e) => setNewTour(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTour.autoStart || false}
                  onChange={(e) => setNewTour(prev => ({ ...prev, autoStart: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Auto Start</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTour.allowSkip !== false}
                  onChange={(e) => setNewTour(prev => ({ ...prev, allowSkip: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Allow Skip</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTour({});
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleCreateTour}
              disabled={!newTour.name || !newTour.description}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Tour
            </button>
          </div>
        </div>
      ) : selectedTour ? (
        /* Tour Editor */
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Editing: {selectedTour.name}
              </h3>
              <button
                onClick={() => setSelectedTour(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Tour Steps */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Tour Steps ({selectedTour.steps.length})</h4>
              
              {selectedTour.steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <h5 className="font-medium text-gray-900">{step.title}</h5>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{step.content}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Target: {step.target}</span>
                        <span>Position: {step.position}</span>
                        {step.action && <span>Action: {step.action}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit Step"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          const updatedSteps = selectedTour.steps.filter(s => s.id !== step.id);
                          const updatedTour = {
                            ...selectedTour,
                            steps: updatedSteps,
                            updatedAt: new Date()
                          };
                          actions.addTour(updatedTour);
                          setSelectedTour(updatedTour);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete Step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Step Form */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Add New Step</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Step title"
                    value={newStep.title || ''}
                    onChange={(e) => setNewStep(prev => ({ ...prev, title: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <input
                    type="text"
                    placeholder="CSS selector (e.g., #button-id)"
                    value={newStep.target || ''}
                    onChange={(e) => setNewStep(prev => ({ ...prev, target: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <textarea
                    placeholder="Step content"
                    value={newStep.content || ''}
                    onChange={(e) => setNewStep(prev => ({ ...prev, content: e.target.value }))}
                    rows={2}
                    className="md:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <select
                    value={newStep.position || 'bottom'}
                    onChange={(e) => setNewStep(prev => ({ ...prev, position: e.target.value as any }))}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="center">Center</option>
                  </select>
                  
                  <button
                    onClick={handleAddStep}
                    disabled={!newStep.title || !newStep.content || !newStep.target}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Step
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Builder Home */
        <div className="text-center py-12">
          <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tour Builder</h3>
          <p className="text-gray-600 mb-6">
            Create new tours or edit existing ones to guide users through your application
          </p>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Tour
            </button>
            
            <button
              onClick={() => setActiveTab('tours')}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Edit Existing Tour
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">General</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableAnalytics}
                  onChange={(e) => actions.updateConfig({ enableAnalytics: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable Analytics</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableKeyboardNavigation}
                  onChange={(e) => actions.updateConfig({ enableKeyboardNavigation: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Keyboard Navigation</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableAutoProgress}
                  onChange={(e) => actions.updateConfig({ enableAutoProgress: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Auto Progress</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showProgress}
                  onChange={(e) => actions.updateConfig({ showProgress: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show Progress</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableA11y}
                  onChange={(e) => actions.updateConfig({ enableA11y: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Accessibility Features</span>
              </label>
            </div>
          </div>
          
          {/* Appearance Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Appearance</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Position
              </label>
              <select
                value={config.defaultPosition}
                onChange={(e) => actions.updateConfig({ defaultPosition: e.target.value as any })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Animation Duration ({config.animationDuration}ms)
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={config.animationDuration}
                onChange={(e) => actions.updateConfig({ animationDuration: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overlay Opacity ({(config.overlayOpacity * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.overlayOpacity}
                onChange={(e) => actions.updateConfig({ overlayOpacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Highlight Color
              </label>
              <input
                type="color"
                value={config.highlightColor}
                onChange={(e) => actions.updateConfig({ highlightColor: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* User Preferences */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.userPreferences.enableTours}
                onChange={(e) => actions.updateUserPreferences({ enableTours: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Enable Tours</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.userPreferences.autoStart}
                onChange={(e) => actions.updateUserPreferences({ autoStart: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Auto Start Tours</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.userPreferences.showHints}
                onChange={(e) => actions.updateUserPreferences({ showHints: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show Hints</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Speed
            </label>
            <select
              value={state.userPreferences.preferredSpeed}
              onChange={(e) => actions.updateUserPreferences({ preferredSpeed: e.target.value as any })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Data Management */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const data = actions.exportData();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'tours-backup.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target?.result as string);
                    actions.importData(data);
                    alert('Data imported successfully!');
                  } catch (error) {
                    alert('Failed to import data. Please check the file format.');
                  }
                };
                reader.readAsText(file);
              }
            }}
            className="hidden"
          />
          
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all settings to default?')) {
                actions.updateConfig({
                  enableAnalytics: true,
                  enableKeyboardNavigation: true,
                  enableAutoProgress: false,
                  defaultPosition: 'bottom',
                  animationDuration: 300,
                  highlightColor: '#3b82f6',
                  overlayOpacity: 0.5,
                  showDots: true,
                  showProgress: true,
                  allowClickOutside: false,
                  autoStartDelay: 1000,
                  maxConcurrentTours: 1,
                  persistProgress: true,
                  enableA11y: true
                });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interactive Tours Manager</h1>
        <p className="text-gray-600">
          Create, manage, and analyze interactive tours to guide users through your application
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Monitor },
            { id: 'tours', label: 'Tours', icon: Map },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'builder', label: 'Builder', icon: Navigation },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'tours' && renderTours()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'builder' && renderBuilder()}
      {activeTab === 'settings' && renderSettings()}
    </div>
  );
};

export default InteractiveToursManager;