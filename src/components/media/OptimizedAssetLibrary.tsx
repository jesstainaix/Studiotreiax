'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Search, Upload, Filter, Grid, List, Download, Star, Share2, History, Settings, Plus, Folder, Tag, Eye, Edit3, Trash2, Copy, Move, RefreshCw } from 'lucide-react';
import { FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window';
import debounce from 'lodash/debounce';
import { toast } from 'sonner';

// Cache para assets
class AssetCache {
  private cache = new Map<string, any>();
  private maxSize = 1000;
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(key, value);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): any {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessOrder.set(key, ++this.accessCounter);
    }
    return value;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;
    
    for (const [key, access] of this.accessOrder) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }
}

// Cache global para assets
const assetCache = new AssetCache();

// Cache para thumbnails
const thumbnailCache = new Map<string, string>();

// Intersection Observer para lazy loading
const useIntersectionObserver = (ref: React.RefObject<Element>, options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};

// Hook para lazy loading de imagens
const useLazyImage = (src: string | undefined) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // Verificar cache primeiro
    if (thumbnailCache.has(src)) {
      setImageSrc(thumbnailCache.get(src));
      return;
    }

    setIsLoading(true);
    setError(false);

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      thumbnailCache.set(src, src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  return { imageSrc, isLoading, error };
};

interface AssetItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'text' | 'template' | 'collection';
  thumbnailUrl?: string;
  filePath?: string;
  size: number;
  duration?: number;
  tags: string[];
  categories: string[];
  createdAt: Date;
  lastModified: Date;
  isShared: boolean;
  isFavorite: boolean;
  metadata: any;
}

interface AssetLibraryProps {
  onAssetSelect?: (asset: AssetItem, targetComponent: 'timeline' | 'canvas' | 'tts') => void;
  onAssetImport?: (result: any) => void;
  allowedTypes?: string[];
  maxSelections?: number;
  showIntegrationButtons?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type' | 'relevance';
type FilterTab = 'all' | 'images' | 'videos' | 'audio' | 'templates' | 'shared' | 'favorites';

// Componente de thumbnail otimizado com lazy loading
const LazyThumbnail = memo(({ asset, className }: { asset: AssetItem; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin: '50px' });
  const { imageSrc, isLoading, error } = useLazyImage(isVisible ? asset.thumbnailUrl : undefined);

  return (
    <div ref={ref} className={`relative bg-gray-100 dark:bg-gray-800 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {imageSrc && !error ? (
        <img
          src={imageSrc}
          alt={asset.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          {asset.type === 'image' && <Eye className="w-8 h-8" />}
          {asset.type === 'video' && <Eye className="w-8 h-8" />}
          {asset.type === 'audio' && <Eye className="w-8 h-8" />}
          {asset.type === 'text' && <Edit3 className="w-8 h-8" />}
          {asset.type === 'template' && <Folder className="w-8 h-8" />}
        </div>
      )}
    </div>
  );
});

LazyThumbnail.displayName = 'LazyThumbnail';

// Componente de card de asset otimizado
const AssetCard = memo(({ 
  asset, 
  isSelected, 
  viewMode, 
  onSelect, 
  onPreview, 
  onToggleFavorite, 
  onDuplicate 
}: {
  asset: AssetItem;
  isSelected: boolean;
  viewMode: ViewMode;
  onSelect: (asset: AssetItem) => void;
  onPreview: (asset: AssetItem) => void;
  onToggleFavorite: (assetId: string) => void;
  onDuplicate: (assetId: string) => void;
}) => {
  const handleClick = useCallback(() => onSelect(asset), [asset, onSelect]);
  const handlePreview = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(asset);
  }, [asset, onPreview]);
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(asset.id);
  }, [asset.id, onToggleFavorite]);
  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(asset.id);
  }, [asset.id, onDuplicate]);

  if (viewMode === 'list') {
    return (
      <div
        className={`
          flex items-center p-3 cursor-pointer rounded-lg border transition-all duration-200
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
        onClick={handleClick}
      >
        <LazyThumbnail asset={asset} className="w-12 h-12 rounded mr-3 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{asset.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {asset.type} • {(asset.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handlePreview} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={handleToggleFavorite} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Star className={`w-4 h-4 ${asset.isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
          </button>
          <button onClick={handleDuplicate} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative group cursor-pointer rounded-lg border-2 transition-all duration-200 aspect-square
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
      onClick={handleClick}
    >
      <LazyThumbnail asset={asset} className="w-full h-32 rounded-t-lg overflow-hidden" />
      
      {/* Overlay de ações */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button onClick={handlePreview} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
          <Eye className="w-4 h-4 text-white" />
        </button>
        <button onClick={handleToggleFavorite} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
          <Star className={`w-4 h-4 ${asset.isFavorite ? 'text-yellow-400 fill-current' : 'text-white'}`} />
        </button>
        <button onClick={handleDuplicate} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
          <Copy className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* Informações do asset */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate mb-1">{asset.name}</h3>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="capitalize">{asset.type}</span>
          <span>{(asset.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
        
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
            {asset.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                +{asset.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Indicadores */}
      <div className="absolute top-2 right-2 flex gap-1">
        {asset.isFavorite && (
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
            <Star className="w-3 h-3 text-white fill-current" />
          </div>
        )}
        {asset.isShared && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Share2 className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
});

AssetCard.displayName = 'AssetCard';

export default function OptimizedAssetLibrary({
  onAssetSelect,
  onAssetImport,
  allowedTypes = ['image', 'video', 'audio', 'text'],
  maxSelections = 1,
  showIntegrationButtons = true,
  className = ''
}: AssetLibraryProps) {
  // Estados principais
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Estados de filtros
  const [filters, setFilters] = useState({
    types: [] as string[],
    categories: [] as string[],
    tags: [] as string[],
    dateRange: null as { start: Date; end: Date } | null,
    sizeRange: { min: 0, max: Infinity },
    quality: [] as string[]
  });

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
      setPage(0);
    }, 300),
    []
  );

  // Filtrar e ordenar assets com memoização
  const filteredAssets = useMemo(() => {
    const cacheKey = `filtered_${JSON.stringify({ searchQuery, activeTab, filters, sortBy, allowedTypes })}`;
    
    if (assetCache.has(cacheKey)) {
      return assetCache.get(cacheKey);
    }

    let filtered = [...assets];

    // Filtro por aba ativa
    switch (activeTab) {
      case 'images':
        filtered = filtered.filter(asset => asset.type === 'image');
        break;
      case 'videos':
        filtered = filtered.filter(asset => asset.type === 'video');
        break;
      case 'audio':
        filtered = filtered.filter(asset => asset.type === 'audio');
        break;
      case 'templates':
        filtered = filtered.filter(asset => asset.type === 'template');
        break;
      case 'shared':
        filtered = filtered.filter(asset => asset.isShared);
        break;
      case 'favorites':
        filtered = filtered.filter(asset => asset.isFavorite);
        break;
    }

    // Filtro por tipos permitidos
    if (allowedTypes.length > 0) {
      filtered = filtered.filter(asset => allowedTypes.includes(asset.type));
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query)) ||
        asset.categories.some(cat => cat.toLowerCase().includes(query))
      );
    }

    // Filtros avançados
    if (filters.types.length > 0) {
      filtered = filtered.filter(asset => filters.types.includes(asset.type));
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(asset => 
        asset.categories.some(cat => filters.categories.includes(cat))
      );
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(asset => 
        asset.tags.some(tag => filters.tags.includes(tag))
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(asset => 
        asset.createdAt >= filters.dateRange!.start &&
        asset.createdAt <= filters.dateRange!.end
      );
    }

    filtered = filtered.filter(asset => 
      asset.size >= filters.sizeRange.min &&
      asset.size <= filters.sizeRange.max
    );

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'size':
          return b.size - a.size;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    assetCache.set(cacheKey, filtered);
    return filtered;
  }, [assets, searchQuery, activeTab, filters, sortBy, allowedTypes]);

  // Carregar assets com paginação
  const loadAssets = useCallback(async (pageNum = 0, append = false) => {
    setIsLoading(true);
    try {
      // Simular carregamento de assets
      const mockAssets: AssetItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `asset_${pageNum}_${i}`,
        name: `Asset ${pageNum * 20 + i + 1}`,
        type: ['image', 'video', 'audio', 'text', 'template'][Math.floor(Math.random() * 5)] as AssetItem['type'],
        thumbnailUrl: `https://picsum.photos/200/200?random=${pageNum * 20 + i}`,
        size: Math.floor(Math.random() * 10000000),
        tags: ['tag1', 'tag2', 'tag3'].slice(0, Math.floor(Math.random() * 3) + 1),
        categories: ['category1', 'category2'],
        createdAt: new Date(Date.now() - Math.random() * 10000000000),
        lastModified: new Date(),
        isShared: Math.random() > 0.8,
        isFavorite: Math.random() > 0.9,
        metadata: {}
      }));

      if (append) {
        setAssets(prev => [...prev, ...mockAssets]);
      } else {
        setAssets(mockAssets);
      }
      
      setHasMore(pageNum < 5); // Simular fim dos dados
    } catch (error) {
      console.error('Erro ao carregar assets:', error);
      toast.error('Erro ao carregar assets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar mais assets
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadAssets(nextPage, true);
    }
  }, [page, isLoading, hasMore, loadAssets]);

  // Carregar assets iniciais
  useEffect(() => {
    loadAssets(0, false);
  }, [loadAssets]);

  // Limpar cache quando necessário
  useEffect(() => {
    return () => {
      assetCache.clear();
    };
  }, []);

  const handleAssetSelect = useCallback((asset: AssetItem) => {
    if (maxSelections === 1) {
      setSelectedAssets(new Set([asset.id]));
      onAssetSelect?.(asset, 'timeline');
    } else {
      setSelectedAssets(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(asset.id)) {
          newSelection.delete(asset.id);
        } else if (newSelection.size < maxSelections) {
          newSelection.add(asset.id);
        }
        return newSelection;
      });
    }
  }, [maxSelections, onAssetSelect]);

  const handlePreview = useCallback((asset: AssetItem) => {
    setPreviewAsset(asset);
  }, []);

  const handleToggleFavorite = useCallback((assetId: string) => {
    setAssets(prev => prev.map(asset => 
      asset.id === assetId 
        ? { ...asset, isFavorite: !asset.isFavorite }
        : asset
    ));
    assetCache.clear(); // Limpar cache após mudança
  }, []);

  const handleDuplicateAsset = useCallback((assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      const duplicated = {
        ...asset,
        id: `${asset.id}_copy_${Date.now()}`,
        name: `${asset.name} (Cópia)`,
        createdAt: new Date()
      };
      setAssets(prev => [duplicated, ...prev]);
      assetCache.clear(); // Limpar cache após mudança
    }
  }, [assets]);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Asset Library</h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => loadAssets(0, false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar assets..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'images', label: 'Imagens' },
          { key: 'videos', label: 'Vídeos' },
          { key: 'audio', label: 'Áudio' },
          { key: 'templates', label: 'Templates' },
          { key: 'favorites', label: 'Favoritos' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FilterTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assets Grid/List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && assets.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-2'}>
              {filteredAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssets.has(asset.id)}
                  viewMode={viewMode}
                  onSelect={handleAssetSelect}
                  onPreview={handlePreview}
                  onToggleFavorite={handleToggleFavorite}
                  onDuplicate={handleDuplicateAsset}
                />
              ))}
            </div>
            
            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Carregando...' : 'Carregar Mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}