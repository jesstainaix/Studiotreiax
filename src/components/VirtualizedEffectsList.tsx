import React, { useRef, useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useVirtualization, useElementMeasurement } from '../hooks/useVirtualization';
import { cn } from '../lib/utils';
import { Search, Filter, Star, Download, Play, Pause } from 'lucide-react';

export interface VideoEffect {
  id: string;
  name: string;
  category: string;
  description?: string;
  thumbnail?: string;
  previewVideo?: string;
  tags: string[];
  rating: number;
  downloads: number;
  isPremium: boolean;
  isInstalled: boolean;
  isFavorite: boolean;
  author?: string;
  version?: string;
  size?: number; // in MB
  compatibility: string[];
  parameters?: {
    [key: string]: {
      type: 'number' | 'boolean' | 'string' | 'color' | 'range';
      default: any;
      min?: number;
      max?: number;
      options?: string[];
    };
  };
}

export interface EffectCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count: number;
}

export interface VirtualizedEffectsListProps {
  effects: VideoEffect[];
  categories: EffectCategory[];
  height: number;
  width?: number;
  itemHeight?: number;
  itemsPerRow?: number;
  onEffectSelect?: (effect: VideoEffect) => void;
  onEffectApply?: (effect: VideoEffect) => void;
  onEffectPreview?: (effect: VideoEffect) => void;
  onEffectFavorite?: (effectId: string, isFavorite: boolean) => void;
  onEffectDownload?: (effectId: string) => void;
  selectedEffectId?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  sortBy?: 'name' | 'rating' | 'downloads' | 'recent';
  onSortChange?: (sortBy: string) => void;
  showOnlyInstalled?: boolean;
  showOnlyFavorites?: boolean;
  showOnlyFree?: boolean;
  className?: string;
  enablePreview?: boolean;
  enableBulkActions?: boolean;
  onBulkAction?: (action: string, effectIds: string[]) => void;
}

export interface VirtualizedEffectsListRef {
  scrollToEffect: (effectId: string) => void;
  refreshThumbnails: () => void;
  clearCache: () => void;
  getSelectedEffects: () => VideoEffect[];
  selectAll: () => void;
  clearSelection: () => void;
}

interface ThumbnailCache {
  [effectId: string]: {
    url: string;
    timestamp: number;
    loading: boolean;
  };
}

interface PreviewState {
  effectId: string | null;
  isPlaying: boolean;
  progress: number;
}

const VirtualizedEffectsList = forwardRef<VirtualizedEffectsListRef, VirtualizedEffectsListProps>((
  {
    effects,
    categories,
    height,
    width = '100%',
    itemHeight = 200,
    itemsPerRow = 3,
    onEffectSelect,
    onEffectApply,
    onEffectPreview,
    onEffectFavorite,
    onEffectDownload,
    selectedEffectId,
    searchQuery = '',
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    sortBy = 'name',
    onSortChange,
    showOnlyInstalled = false,
    showOnlyFavorites = false,
    showOnlyFree = false,
    className,
    enablePreview = true,
    enableBulkActions = false,
    onBulkAction
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measureRef, containerDimensions] = useElementMeasurement();
  
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({});
  const [selectedEffects, setSelectedEffects] = useState<Set<string>>(new Set());
  const [previewState, setPreviewState] = useState<PreviewState>({
    effectId: null,
    isPlaying: false,
    progress: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort effects
  const filteredEffects = useMemo(() => {
    let filtered = effects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(effect => 
        effect.name.toLowerCase().includes(query) ||
        effect.description?.toLowerCase().includes(query) ||
        effect.tags.some(tag => tag.toLowerCase().includes(query)) ||
        effect.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(effect => effect.category === selectedCategory);
    }

    // Apply other filters
    if (showOnlyInstalled) {
      filtered = filtered.filter(effect => effect.isInstalled);
    }
    if (showOnlyFavorites) {
      filtered = filtered.filter(effect => effect.isFavorite);
    }
    if (showOnlyFree) {
      filtered = filtered.filter(effect => !effect.isPremium);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'recent':
          return b.id.localeCompare(a.id); // Simplified recent sort
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [effects, searchQuery, selectedCategory, showOnlyInstalled, showOnlyFavorites, showOnlyFree, sortBy]);

  // Calculate grid dimensions
  const containerWidth = containerDimensions.width || (typeof width === 'number' ? width : 800);
  const actualItemsPerRow = Math.max(1, Math.floor(containerWidth / 250)); // Min 250px per item
  const itemWidth = Math.floor(containerWidth / actualItemsPerRow);
  const totalRows = Math.ceil(filteredEffects.length / actualItemsPerRow);

  // Setup virtualization
  const [virtualState, virtualActions] = useVirtualization(totalRows, {
    itemHeight,
    containerHeight: height - 120, // Account for header
    overscan: 2,
    horizontal: false,
    getItemKey: (index: number) => `row-${index}`
  });

  // Generate thumbnail for effect
  const generateThumbnail = useCallback(async (effect: VideoEffect) => {
    if (thumbnailCache[effect.id] && !thumbnailCache[effect.id].loading) {
      return thumbnailCache[effect.id].url;
    }

    // Set loading state
    setThumbnailCache(prev => ({
      ...prev,
      [effect.id]: {
        url: '',
        timestamp: Date.now(),
        loading: true
      }
    }));

    try {
      // Simulate thumbnail generation (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      const thumbnailUrl = effect.thumbnail || `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-${effect.id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="200" height="150" fill="url(#grad-${effect.id})"/>
          <text x="100" y="75" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
            ${effect.name}
          </text>
          <text x="100" y="95" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="10">
            ${effect.category}
          </text>
        </svg>
      `)}`;

      setThumbnailCache(prev => ({
        ...prev,
        [effect.id]: {
          url: thumbnailUrl,
          timestamp: Date.now(),
          loading: false
        }
      }));

      return thumbnailUrl;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      setThumbnailCache(prev => ({
        ...prev,
        [effect.id]: {
          url: '',
          timestamp: Date.now(),
          loading: false
        }
      }));
      return '';
    }
  }, [thumbnailCache]);

  // Handle effect selection
  const handleEffectSelect = useCallback((effect: VideoEffect, event?: React.MouseEvent) => {
    if (enableBulkActions && event?.ctrlKey) {
      setSelectedEffects(prev => {
        const newSet = new Set(prev);
        if (newSet.has(effect.id)) {
          newSet.delete(effect.id);
        } else {
          newSet.add(effect.id);
        }
        return newSet;
      });
    } else {
      setSelectedEffects(new Set([effect.id]));
    }
    
    onEffectSelect?.(effect);
  }, [enableBulkActions, onEffectSelect]);

  // Handle effect preview
  const handleEffectPreview = useCallback(async (effect: VideoEffect) => {
    if (!enablePreview) return;

    if (previewState.effectId === effect.id && previewState.isPlaying) {
      // Stop preview
      setPreviewState(prev => ({ ...prev, isPlaying: false }));
    } else {
      // Start preview
      setPreviewState({
        effectId: effect.id,
        isPlaying: true,
        progress: 0
      });

      // Simulate preview progress
      const duration = 3000; // 3 seconds
      const interval = 50;
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += interval;
        const progress = Math.min(elapsed / duration, 1);
        
        setPreviewState(prev => ({
          ...prev,
          progress: progress * 100
        }));

        if (progress >= 1) {
          clearInterval(timer);
          setPreviewState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
        }
      }, interval);
    }

    onEffectPreview?.(effect);
  }, [enablePreview, previewState, onEffectPreview]);

  // Render effect card
  const renderEffectCard = useCallback((effect: VideoEffect) => {
    const isSelected = selectedEffects.has(effect.id) || selectedEffectId === effect.id;
    const isPreviewing = previewState.effectId === effect.id && previewState.isPlaying;
    const thumbnailData = thumbnailCache[effect.id];

    // Generate thumbnail if not cached
    if (!thumbnailData) {
      generateThumbnail(effect);
    }

    return (
      <div
        key={effect.id}
        className={cn(
          'relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer group',
          'hover:shadow-lg hover:border-blue-300',
          isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200',
          effect.isPremium && 'ring-2 ring-yellow-400 ring-opacity-50'
        )}
        style={{ width: itemWidth - 8, height: itemHeight - 8 }}
        onClick={(e) => handleEffectSelect(effect, e)}
      >
        {/* Thumbnail */}
        <div className="relative h-32 bg-gray-100 rounded-t-lg overflow-hidden">
          {thumbnailData?.loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : thumbnailData?.url ? (
            <img
              src={thumbnailData.url}
              alt={effect.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-2xl mb-1">🎬</div>
                <div className="text-xs">No Preview</div>
              </div>
            </div>
          )}

          {/* Preview overlay */}
          {enablePreview && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <button
                className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-2 transition-all duration-200 hover:bg-opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEffectPreview(effect);
                }}
              >
                {isPreviewing ? (
                  <Pause className="w-4 h-4 text-gray-700" />
                ) : (
                  <Play className="w-4 h-4 text-gray-700" />
                )}
              </button>
            </div>
          )}

          {/* Preview progress */}
          {isPreviewing && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${previewState.progress}%` }}
              />
            </div>
          )}

          {/* Premium badge */}
          {effect.isPremium && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              PRO
            </div>
          )}

          {/* Favorite button */}
          <button
            className={cn(
              'absolute top-2 left-2 p-1 rounded-full transition-all duration-200',
              effect.isFavorite ? 'bg-red-500 text-white' : 'bg-white bg-opacity-70 text-gray-600 hover:bg-opacity-100'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onEffectFavorite?.(effect.id, !effect.isFavorite);
            }}
          >
            <Star className={cn('w-3 h-3', effect.isFavorite && 'fill-current')} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-sm text-gray-900 truncate flex-1 mr-2">
              {effect.name}
            </h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Star className="w-3 h-3 fill-current text-yellow-400" />
              <span>{effect.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-2 truncate">
            {effect.category}
          </div>

          {effect.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {effect.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {effect.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {!effect.isInstalled && (
                <button
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEffectDownload?.(effect.id);
                  }}
                >
                  <Download className="w-3 h-3 inline mr-1" />
                  Install
                </button>
              )}
              <button
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEffectApply?.(effect);
                }}
              >
                Apply
              </button>
            </div>
            <div className="text-xs text-gray-400">
              {effect.downloads.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  }, [itemWidth, itemHeight, selectedEffects, selectedEffectId, previewState, thumbnailCache, enablePreview, generateThumbnail, handleEffectSelect, handleEffectPreview, onEffectFavorite, onEffectDownload, onEffectApply]);

  // Render row of effects
  const renderRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * actualItemsPerRow;
    const endIndex = Math.min(startIndex + actualItemsPerRow, filteredEffects.length);
    const rowEffects = filteredEffects.slice(startIndex, endIndex);

    return (
      <div className="flex gap-2 px-2" style={{ height: itemHeight }}>
        {rowEffects.map(effect => renderEffectCard(effect))}
      </div>
    );
  }, [actualItemsPerRow, filteredEffects, itemHeight, renderEffectCard]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToEffect: (effectId: string) => {
      const effectIndex = filteredEffects.findIndex(e => e.id === effectId);
      if (effectIndex >= 0) {
        const rowIndex = Math.floor(effectIndex / actualItemsPerRow);
        virtualActions.scrollToIndex(rowIndex);
      }
    },
    refreshThumbnails: () => {
      setThumbnailCache({});
    },
    clearCache: () => {
      setThumbnailCache({});
      virtualActions.invalidateCache();
    },
    getSelectedEffects: () => {
      return filteredEffects.filter(effect => selectedEffects.has(effect.id));
    },
    selectAll: () => {
      setSelectedEffects(new Set(filteredEffects.map(e => e.id)));
    },
    clearSelection: () => {
      setSelectedEffects(new Set());
    }
  }), [filteredEffects, actualItemsPerRow, selectedEffects, virtualActions]);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        measureRef.current = el;
      }}
      className={cn('flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden', className)}
      style={{ height, width }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        {/* Search and filters */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search effects..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory || 'all'}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            <option value="downloads">Downloads</option>
            <option value="recent">Recent</option>
          </select>
        </div>

        {/* Stats and bulk actions */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredEffects.length} of {effects.length} effects
            {selectedEffects.size > 0 && (
              <span className="ml-2 text-blue-600">
                ({selectedEffects.size} selected)
              </span>
            )}
          </div>
          {enableBulkActions && selectedEffects.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => onBulkAction?.('apply', Array.from(selectedEffects))}
              >
                Apply Selected
              </button>
              <button
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                onClick={() => setSelectedEffects(new Set())}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Effects grid */}
      <div className="flex-1 overflow-hidden">
        {filteredEffects.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-lg font-medium mb-2">No effects found</div>
              <div className="text-sm">Try adjusting your search or filters</div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto" style={{ height: height - 120 }}>
            <div style={{ height: totalRows * itemHeight }}>
              {virtualState.items.map((virtualItem) => (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: virtualItem.start,
                    height: virtualItem.size,
                    width: '100%'
                  }}
                >
                  {renderRow(virtualItem.index)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

VirtualizedEffectsList.displayName = 'VirtualizedEffectsList';

export default VirtualizedEffectsList;