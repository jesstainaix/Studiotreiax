import React, { useRef, useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useVirtualization, useElementMeasurement } from '../hooks/useVirtualization';
import { cn } from '../lib/utils';
import { Search, Filter, Grid, List, Upload, Folder, File, Image, Video, Music, FileText, Download, Trash2, Star, Eye, MoreHorizontal } from 'lucide-react';

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  size: number; // in bytes
  duration?: number; // for video/audio in seconds
  dimensions?: { width: number; height: number };
  thumbnail?: string;
  url: string;
  createdAt: Date;
  modifiedAt: Date;
  tags: string[];
  isFavorite: boolean;
  isSelected?: boolean;
  metadata?: {
    [key: string]: any;
  };
  folder?: string;
  extension: string;
  mimeType: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  fileCount: number;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface VirtualizedMediaLibraryProps {
  files: MediaFile[];
  folders: MediaFolder[];
  height: number;
  width?: number;
  itemSize?: number;
  viewMode?: 'grid' | 'list';
  onFileSelect?: (file: MediaFile) => void;
  onFileDoubleClick?: (file: MediaFile) => void;
  onFilesSelect?: (files: MediaFile[]) => void;
  onFileUpload?: (files: FileList) => void;
  onFileDelete?: (fileIds: string[]) => void;
  onFileFavorite?: (fileId: string, isFavorite: boolean) => void;
  onFolderSelect?: (folder: MediaFolder) => void;
  onFolderCreate?: (name: string, parentId?: string) => void;
  selectedFileIds?: string[];
  currentFolderId?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filterType?: string;
  onFilterChange?: (type: string) => void;
  sortBy?: 'name' | 'date' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: string) => void;
  className?: string;
  enableUpload?: boolean;
  enableBulkActions?: boolean;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  thumbnailSize?: 'small' | 'medium' | 'large';
  showFileInfo?: boolean;
  enablePreview?: boolean;
  onPreview?: (file: MediaFile) => void;
}

export interface VirtualizedMediaLibraryRef {
  scrollToFile: (fileId: string) => void;
  refreshThumbnails: () => void;
  clearCache: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedFiles: () => MediaFile[];
  uploadFiles: (files: FileList) => void;
}

interface ThumbnailCache {
  [fileId: string]: {
    url: string;
    timestamp: number;
    loading: boolean;
  };
}

const VirtualizedMediaLibrary = forwardRef<VirtualizedMediaLibraryRef, VirtualizedMediaLibraryProps>((
  {
    files,
    folders,
    height,
    width = '100%',
    itemSize = 200,
    viewMode = 'grid',
    onFileSelect,
    onFileDoubleClick,
    onFilesSelect,
    onFileUpload,
    onFileDelete,
    onFileFavorite,
    onFolderSelect,
    onFolderCreate,
    selectedFileIds = [],
    currentFolderId,
    searchQuery = '',
    onSearchChange,
    filterType = 'all',
    onFilterChange,
    sortBy = 'name',
    sortOrder = 'asc',
    onSortChange,
    className,
    enableUpload = true,
    enableBulkActions = true,
    enableInfiniteScroll = false,
    onLoadMore,
    hasMore = false,
    isLoading = false,
    thumbnailSize = 'medium',
    showFileInfo = true,
    enablePreview = true,
    onPreview
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [measureRef, containerDimensions] = useElementMeasurement();
  
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({});
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set(selectedFileIds));
  const [dragOver, setDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);

  // Update selected files when prop changes
  useEffect(() => {
    setSelectedFiles(new Set(selectedFileIds));
  }, [selectedFileIds]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let filtered = files;

    // Filter by current folder
    if (currentFolderId) {
      filtered = filtered.filter(file => file.folder === currentFolderId);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.tags.some(tag => tag.toLowerCase().includes(query)) ||
        file.extension.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(file => file.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'name':
        default:
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [files, currentFolderId, searchQuery, filterType, sortBy, sortOrder]);

  // Calculate grid dimensions
  const containerWidth = containerDimensions.width || (typeof width === 'number' ? width : 800);
  const actualItemSize = thumbnailSize === 'small' ? 120 : thumbnailSize === 'large' ? 280 : itemSize;
  const itemsPerRow = viewMode === 'grid' ? Math.max(1, Math.floor(containerWidth / (actualItemSize + 16))) : 1;
  const rowHeight = viewMode === 'grid' ? actualItemSize + 60 : 60;
  const totalRows = Math.ceil(filteredFiles.length / itemsPerRow);

  // Setup virtualization
  const [virtualState, virtualActions] = useVirtualization(totalRows, {
    itemHeight: rowHeight,
    containerHeight: height - 120, // Account for header
    overscan: 3,
    horizontal: false,
    getItemKey: (index: number) => `row-${index}`
  });

  // Generate thumbnail for file
  const generateThumbnail = useCallback(async (file: MediaFile) => {
    if (thumbnailCache[file.id] && !thumbnailCache[file.id].loading) {
      return thumbnailCache[file.id].url;
    }

    // Set loading state
    setThumbnailCache(prev => ({
      ...prev,
      [file.id]: {
        url: '',
        timestamp: Date.now(),
        loading: true
      }
    }));

    try {
      let thumbnailUrl = file.thumbnail;

      if (!thumbnailUrl) {
        // Generate thumbnail based on file type
        if (file.type === 'image') {
          thumbnailUrl = file.url; // Use original image
        } else {
          // Generate SVG thumbnail for other types
          const iconColor = {
            video: '#ef4444',
            audio: '#8b5cf6',
            document: '#3b82f6',
            other: '#6b7280'
          }[file.type];

          const iconSymbol = {
            video: '🎬',
            audio: '🎵',
            document: '📄',
            other: '📁'
          }[file.type];

          thumbnailUrl = `data:image/svg+xml;base64,${btoa(`
            <svg width="${actualItemSize}" height="${actualItemSize}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="${iconColor}" rx="8"/>
              <text x="50%" y="40%" text-anchor="middle" font-size="${actualItemSize * 0.3}" fill="white">
                ${iconSymbol}
              </text>
              <text x="50%" y="70%" text-anchor="middle" font-size="${actualItemSize * 0.08}" fill="rgba(255,255,255,0.9)" font-weight="bold">
                ${file.extension.toUpperCase()}
              </text>
            </svg>
          `)}`;
        }
      }

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

      setThumbnailCache(prev => ({
        ...prev,
        [file.id]: {
          url: thumbnailUrl || '',
          timestamp: Date.now(),
          loading: false
        }
      }));

      return thumbnailUrl;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      setThumbnailCache(prev => ({
        ...prev,
        [file.id]: {
          url: '',
          timestamp: Date.now(),
          loading: false
        }
      }));
      return '';
    }
  }, [thumbnailCache, actualItemSize]);

  // Handle file selection
  const handleFileSelect = useCallback((file: MediaFile, event?: React.MouseEvent) => {
    if (enableBulkActions && event?.ctrlKey) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
      onFilesSelect?.(filteredFiles.filter(f => newSelected.has(f.id)));
    } else if (enableBulkActions && event?.shiftKey && selectedFiles.size > 0) {
      // Range selection
      const lastSelected = Array.from(selectedFiles)[selectedFiles.size - 1];
      const lastIndex = filteredFiles.findIndex(f => f.id === lastSelected);
      const currentIndex = filteredFiles.findIndex(f => f.id === file.id);
      
      if (lastIndex >= 0 && currentIndex >= 0) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeFiles = filteredFiles.slice(start, end + 1);
        const newSelected = new Set([...selectedFiles, ...rangeFiles.map(f => f.id)]);
        setSelectedFiles(newSelected);
        onFilesSelect?.(filteredFiles.filter(f => newSelected.has(f.id)));
      }
    } else {
      setSelectedFiles(new Set([file.id]));
      onFileSelect?.(file);
    }
  }, [enableBulkActions, selectedFiles, filteredFiles, onFileSelect, onFilesSelect]);

  // Handle file double click
  const handleFileDoubleClick = useCallback((file: MediaFile) => {
    onFileDoubleClick?.(file);
  }, [onFileDoubleClick]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    if (enableUpload && event.dataTransfer.files.length > 0) {
      onFileUpload?.(event.dataTransfer.files);
    }
  }, [enableUpload, onFileUpload]);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Render file icon
  const renderFileIcon = useCallback((file: MediaFile, size: number = 24) => {
    const iconProps = { size, className: 'text-gray-600' };
    
    switch (file.type) {
      case 'image':
        return <Image {...iconProps} className="text-green-600" />;
      case 'video':
        return <Video {...iconProps} className="text-red-600" />;
      case 'audio':
        return <Music {...iconProps} className="text-purple-600" />;
      case 'document':
        return <FileText {...iconProps} className="text-blue-600" />;
      default:
        return <File {...iconProps} />;
    }
  }, []);

  // Render file card (grid mode)
  const renderFileCard = useCallback((file: MediaFile) => {
    const isSelected = selectedFiles.has(file.id);
    const thumbnailData = thumbnailCache[file.id];

    // Generate thumbnail if not cached
    if (!thumbnailData) {
      generateThumbnail(file);
    }

    return (
      <div
        key={file.id}
        className={cn(
          'relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer group',
          'hover:shadow-lg hover:border-blue-300',
          isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200'
        )}
        style={{ width: actualItemSize, height: actualItemSize + 60 }}
        onClick={(e) => handleFileSelect(file, e)}
        onDoubleClick={() => handleFileDoubleClick(file)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id });
        }}
      >
        {/* Thumbnail */}
        <div className="relative bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: actualItemSize }}>
          {thumbnailData?.loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : thumbnailData?.url ? (
            <img
              src={thumbnailData.url}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {renderFileIcon(file, actualItemSize * 0.3)}
            </div>
          )}

          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
              {enablePreview && (
                <button
                  className="bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.(file);
                  }}
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </button>
              )}
              <button
                className={cn(
                  'rounded-full p-2 transition-all',
                  file.isFavorite ? 'bg-red-500 text-white' : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onFileFavorite?.(file.id, !file.isFavorite);
                }}
              >
                <Star className={cn('w-4 h-4', file.isFavorite && 'fill-current')} />
              </button>
            </div>
          </div>

          {/* File type badge */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {file.extension.toUpperCase()}
          </div>

          {/* Duration badge for video/audio */}
          {file.duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {formatDuration(file.duration)}
            </div>
          )}
        </div>

        {/* File info */}
        <div className="p-2">
          <div className="font-medium text-sm text-gray-900 truncate mb-1">
            {file.name}
          </div>
          {showFileInfo && (
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>{formatFileSize(file.size)}</span>
              {file.dimensions && (
                <span>{file.dimensions.width}×{file.dimensions.height}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [actualItemSize, selectedFiles, thumbnailCache, generateThumbnail, handleFileSelect, handleFileDoubleClick, renderFileIcon, enablePreview, onPreview, onFileFavorite, showFileInfo, formatFileSize, formatDuration]);

  // Render file row (list mode)
  const renderFileRow = useCallback((file: MediaFile) => {
    const isSelected = selectedFiles.has(file.id);
    const thumbnailData = thumbnailCache[file.id];

    // Generate thumbnail if not cached
    if (!thumbnailData) {
      generateThumbnail(file);
    }

    return (
      <div
        key={file.id}
        className={cn(
          'flex items-center px-4 py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
          isSelected && 'bg-blue-50 border-blue-200'
        )}
        onClick={(e) => handleFileSelect(file, e)}
        onDoubleClick={() => handleFileDoubleClick(file)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id });
        }}
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-10 h-10 mr-3">
          {thumbnailData?.url ? (
            <img
              src={thumbnailData.url}
              alt={file.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded">
              {renderFileIcon(file, 20)}
            </div>
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {file.name}
          </div>
          <div className="text-xs text-gray-500">
            {file.type} • {formatFileSize(file.size)}
            {file.duration && ` • ${formatDuration(file.duration)}`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            className={cn(
              'p-1 rounded transition-colors',
              file.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onFileFavorite?.(file.id, !file.isFavorite);
            }}
          >
            <Star className={cn('w-4 h-4', file.isFavorite && 'fill-current')} />
          </button>
          <button className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }, [selectedFiles, thumbnailCache, generateThumbnail, handleFileSelect, handleFileDoubleClick, renderFileIcon, onFileFavorite, formatFileSize, formatDuration]);

  // Render row of files
  const renderRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * itemsPerRow;
    const endIndex = Math.min(startIndex + itemsPerRow, filteredFiles.length);
    const rowFiles = filteredFiles.slice(startIndex, endIndex);

    if (viewMode === 'list') {
      return (
        <div key={`row-${rowIndex}`}>
          {rowFiles.map(file => renderFileRow(file))}
        </div>
      );
    }

    return (
      <div key={`row-${rowIndex}`} className="flex gap-4 px-4" style={{ height: rowHeight }}>
        {rowFiles.map(file => renderFileCard(file))}
      </div>
    );
  }, [itemsPerRow, filteredFiles, viewMode, rowHeight, renderFileRow, renderFileCard]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToFile: (fileId: string) => {
      const fileIndex = filteredFiles.findIndex(f => f.id === fileId);
      if (fileIndex >= 0) {
        const rowIndex = Math.floor(fileIndex / itemsPerRow);
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
    selectAll: () => {
      const allIds = new Set(filteredFiles.map(f => f.id));
      setSelectedFiles(allIds);
      onFilesSelect?.(filteredFiles);
    },
    clearSelection: () => {
      setSelectedFiles(new Set());
      onFilesSelect?.([]);
    },
    getSelectedFiles: () => {
      return filteredFiles.filter(file => selectedFiles.has(file.id));
    },
    uploadFiles: (files: FileList) => {
      onFileUpload?.(files);
    }
  }), [filteredFiles, itemsPerRow, selectedFiles, virtualActions, onFilesSelect, onFileUpload]);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        measureRef.current = el;
      }}
      className={cn('flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden', className)}
      style={{ height, width }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        {/* Search and filters */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => onFilterChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              className={cn(
                'px-3 py-2 transition-colors',
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              onClick={() => onSortChange?.('grid', sortOrder)}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              className={cn(
                'px-3 py-2 transition-colors border-l border-gray-300',
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              onClick={() => onSortChange?.('list', sortOrder)}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {enableUpload && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          )}
        </div>

        {/* Stats and bulk actions */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {filteredFiles.length} files
            {selectedFiles.size > 0 && (
              <span className="ml-2 text-blue-600">
                ({selectedFiles.size} selected)
              </span>
            )}
          </div>
          {enableBulkActions && selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center space-x-1"
                onClick={() => onFileDelete?.(Array.from(selectedFiles))}
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
              <button
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                onClick={() => setSelectedFiles(new Set())}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File grid/list */}
      <div className="flex-1 overflow-hidden relative">
        {dragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-medium text-blue-700">Drop files here to upload</div>
            </div>
          </div>
        )}

        {filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📁</div>
              <div className="text-lg font-medium mb-2">No files found</div>
              <div className="text-sm">Upload files or adjust your search</div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div style={{ height: totalRows * rowHeight }}>
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
            
            {/* Infinite scroll loader */}
            {enableInfiniteScroll && hasMore && (
              <div className="flex items-center justify-center py-4">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                ) : (
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={onLoadMore}
                  >
                    Load More
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      {enableUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              onFileUpload?.(e.target.files);
            }
          }}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onBlur={() => setContextMenu(null)}
        >
          <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
            Preview
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
            Download
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
            Rename
          </button>
          <hr className="my-1" />
          <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600">
            Delete
          </button>
        </div>
      )}
    </div>
  );
});

VirtualizedMediaLibrary.displayName = 'VirtualizedMediaLibrary';

export default VirtualizedMediaLibrary;