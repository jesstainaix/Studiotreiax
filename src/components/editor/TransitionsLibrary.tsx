import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Zap, ArrowRight, ArrowDown, ZoomIn, Eye } from 'lucide-react';

export interface Transition {
  id: string;
  name: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'special';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  preview: string;
  description: string;
}

export interface TransitionsLibraryProps {
  onTransitionSelect: (transition: Transition) => void;
  onPreview: (transition: Transition) => void;
  selectedTransition?: Transition;
}

const TRANSITIONS: Transition[] = [
  // Fade Transitions
  {
    id: 'fade-in',
    name: 'Fade In',
    type: 'fade',
    duration: 1000,
    easing: 'ease-in-out',
    preview: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
    description: 'Gradual appearance from transparent to opaque'
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    type: 'fade',
    duration: 1000,
    easing: 'ease-in-out',
    preview: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
    description: 'Gradual disappearance from opaque to transparent'
  },
  {
    id: 'cross-fade',
    name: 'Cross Fade',
    type: 'dissolve',
    duration: 1500,
    easing: 'ease-in-out',
    preview: 'linear-gradient(45deg, rgba(0,0,0,0.8) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.8) 75%)',
    description: 'Smooth blend between two clips'
  },
  
  // Wipe Transitions
  {
    id: 'wipe-left',
    name: 'Wipe Left',
    type: 'wipe',
    duration: 800,
    direction: 'left',
    easing: 'ease-out',
    preview: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.8) 50%, transparent 50%)',
    description: 'Reveals content from right to left'
  },
  {
    id: 'wipe-right',
    name: 'Wipe Right',
    type: 'wipe',
    duration: 800,
    direction: 'right',
    easing: 'ease-out',
    preview: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.8) 100%)',
    description: 'Reveals content from left to right'
  },
  {
    id: 'wipe-up',
    name: 'Wipe Up',
    type: 'wipe',
    duration: 800,
    direction: 'up',
    easing: 'ease-out',
    preview: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.8) 50%, transparent 50%)',
    description: 'Reveals content from bottom to top'
  },
  {
    id: 'wipe-down',
    name: 'Wipe Down',
    type: 'wipe',
    duration: 800,
    direction: 'down',
    easing: 'ease-out',
    preview: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.8) 100%)',
    description: 'Reveals content from top to bottom'
  },
  
  // Slide Transitions
  {
    id: 'slide-left',
    name: 'Slide Left',
    type: 'slide',
    duration: 600,
    direction: 'left',
    easing: 'ease-in-out',
    preview: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.8) 30%, rgba(59,130,246,0.8) 70%, transparent 100%)',
    description: 'Slides content from right to left'
  },
  {
    id: 'slide-right',
    name: 'Slide Right',
    type: 'slide',
    duration: 600,
    direction: 'right',
    easing: 'ease-in-out',
    preview: 'linear-gradient(270deg, transparent 0%, rgba(59,130,246,0.8) 30%, rgba(59,130,246,0.8) 70%, transparent 100%)',
    description: 'Slides content from left to right'
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    type: 'slide',
    duration: 600,
    direction: 'up',
    easing: 'ease-in-out',
    preview: 'linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.8) 30%, rgba(59,130,246,0.8) 70%, transparent 100%)',
    description: 'Slides content from bottom to top'
  },
  {
    id: 'slide-down',
    name: 'Slide Down',
    type: 'slide',
    duration: 600,
    direction: 'down',
    easing: 'ease-in-out',
    preview: 'linear-gradient(0deg, transparent 0%, rgba(59,130,246,0.8) 30%, rgba(59,130,246,0.8) 70%, transparent 100%)',
    description: 'Slides content from top to bottom'
  },
  
  // Zoom Transitions
  {
    id: 'zoom-in',
    name: 'Zoom In',
    type: 'zoom',
    duration: 1000,
    direction: 'in',
    easing: 'ease-out',
    preview: 'radial-gradient(circle, transparent 30%, rgba(34,197,94,0.8) 70%)',
    description: 'Zooms content from small to large'
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    type: 'zoom',
    duration: 1000,
    direction: 'out',
    easing: 'ease-in',
    preview: 'radial-gradient(circle, rgba(34,197,94,0.8) 30%, transparent 70%)',
    description: 'Zooms content from large to small'
  },
  
  // Special Transitions
  {
    id: 'flash',
    name: 'Flash',
    type: 'special',
    duration: 300,
    easing: 'ease-in-out',
    preview: 'linear-gradient(45deg, rgba(255,255,255,0.9) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.9) 75%)',
    description: 'Quick bright flash effect'
  },
  {
    id: 'dissolve-noise',
    name: 'Dissolve Noise',
    type: 'dissolve',
    duration: 1200,
    easing: 'linear',
    preview: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 2px, transparent 2px, transparent 4px)',
    description: 'Dissolve with noise pattern'
  }
];

const TransitionsLibrary: React.FC<TransitionsLibraryProps> = ({
  onTransitionSelect,
  onPreview,
  selectedTransition
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const filteredTransitions = TRANSITIONS.filter(transition => {
    const matchesType = filterType === 'all' || transition.type === filterType;
    const matchesSearch = transition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transition.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handlePreview = (transition: Transition) => {
    setPreviewingId(transition.id);
    onPreview(transition);
    setTimeout(() => setPreviewingId(null), transition.duration + 200);
  };

  const getTransitionIcon = (type: string) => {
    switch (type) {
      case 'fade':
      case 'dissolve':
        return <Eye className="w-4 h-4" />;
      case 'wipe':
        return <ArrowRight className="w-4 h-4" />;
      case 'slide':
        return <ArrowDown className="w-4 h-4" />;
      case 'zoom':
        return <ZoomIn className="w-4 h-4" />;
      case 'special':
        return <Zap className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Transições</h3>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Buscar transições..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1">
          {['all', 'fade', 'dissolve', 'wipe', 'slide', 'zoom', 'special'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type === 'all' ? 'Todas' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transitions Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredTransitions.map((transition) => (
            <div
              key={transition.id}
              className={`group relative bg-gray-800 rounded-lg border-2 transition-all cursor-pointer ${
                selectedTransition?.id === transition.id
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onTransitionSelect(transition)}
            >
              {/* Preview Area */}
              <div className="relative h-20 rounded-t-lg overflow-hidden">
                <div
                  className="w-full h-full opacity-60"
                  style={{ background: transition.preview }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  {getTransitionIcon(transition.type)}
                </div>
                
                {/* Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(transition);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  disabled={previewingId === transition.id}
                >
                  {previewingId === transition.id ? (
                    <Pause className="w-3 h-3 text-white" />
                  ) : (
                    <Play className="w-3 h-3 text-white" />
                  )}
                </button>
              </div>
              
              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-white truncate">
                    {transition.name}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {transition.duration}ms
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {transition.description}
                </p>
                
                {/* Direction & Easing */}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  {transition.direction && (
                    <span className="capitalize">{transition.direction}</span>
                  )}
                  <span className="capitalize">{transition.easing}</span>
                </div>
              </div>
              
              {/* Selection Indicator */}
              {selectedTransition?.id === transition.id && (
                <div className="absolute top-2 left-2 w-3 h-3 bg-blue-500 rounded-full" />
              )}
            </div>
          ))}
        </div>
        
        {filteredTransitions.length === 0 && (
          <div className="text-center py-8">
            <RotateCcw className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">Nenhuma transição encontrada</p>
            <p className="text-sm text-gray-500 mt-1">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransitionsLibrary;
export { TRANSITIONS };