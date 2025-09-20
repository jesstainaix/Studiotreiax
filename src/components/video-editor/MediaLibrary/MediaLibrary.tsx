import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { VirtualizedList } from '../../ui/VirtualizedList';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Play, 
  Download,
  Trash2,
  Eye,
  Tag,
  SortAsc,
  SortDesc,
  Video,
  Image,
  Music,
  FileText,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { MediaAsset, MediaLibraryState, UploadProgress } from '../../../modules/video-editor/types/Media.types';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';

interface MediaLibraryProps {
  engine: TimelineEngine;
  onAssetSelect?: (asset: MediaAsset) => void;
  onAssetPreview?: (asset: MediaAsset) => void;
  pptxProject?: any; // Optional PPTX project data for showing converted content
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  engine,
  onAssetSelect,
  onAssetPreview,
  pptxProject
}) => {
  const [libraryState, setLibraryState] = useState<MediaLibraryState>({
    assets: [],
    categories: [
      { id: 'all', name: 'Todos', count: 0 },
      { id: 'video', name: 'Videos', count: 0 },
      { id: 'audio', name: 'Audio', count: 0 },
      { id: 'image', name: 'Imagens', count: 0 },
      { id: 'pptx', name: 'PPTx', count: 0 }
    ],
    selectedCategory: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    uploadProgress: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar assets iniciais e do PPTX
  useEffect(() => {
    loadInitialAssets();
  }, []);
  
  // Carregar assets do PPTX quando fornecidos
  useEffect(() => {
    if (pptxProject) {
      loadPPTXAssets(pptxProject);
    }
  }, [pptxProject]);

  // Carregar assets do projeto PPTX
  const loadPPTXAssets = (project: any) => {
    try {
      
      const pptxAssets: MediaAsset[] = [];
      
      // Adicionar vídeo principal convertido
      if (project.conversionData?.result?.videoUrl) {
        pptxAssets.push({
          id: `pptx_video_${project.id}`,
          name: `${project.name} (Convertido).${project.conversionData.result.format}`,
          type: 'video',
          url: project.conversionData.result.videoUrl,
          thumbnailUrl: project.conversionData.result.thumbnailUrl,
          duration: project.totalDuration,
          fileSize: project.conversionData.result.fileSize * 1024 * 1024,
          format: project.conversionData.result.format,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          uploadedAt: project.createdAt,
          tags: ['pptx', 'convertido', ...project.metadata.tags],
          metadata: {
            source: 'pptx_conversion',
            originalFile: project.originalFileName,
            template: project.template?.name || 'Template Padrão',
            nrCompliant: project.metadata.nrCompliant,
            complianceScore: project.metadata.complianceScore
          }
        });
      }
      
      // Adicionar assets de cada slide
      project.slides?.forEach((slide: any, index: number) => {
        if (slide.imageUrl) {
          pptxAssets.push({
            id: `pptx_slide_${slide.id}`,
            name: `Slide ${slide.slideNumber} - ${project.name}`,
            type: 'image',
            url: slide.imageUrl,
            thumbnailUrl: slide.imageUrl,
            fileSize: 500000, // Estimativa
            format: 'png',
            resolution: { width: 1920, height: 1080 },
            uploadedAt: project.createdAt,
            tags: ['pptx', 'slide', `slide-${slide.slideNumber}`, ...project.metadata.tags],
            metadata: {
              source: 'pptx_slide',
              slideNumber: slide.slideNumber,
              slideText: slide.text,
              confidence: slide.ocrData?.confidence,
              startTime: slide.startTime,
              duration: slide.duration
            }
          });
        }
      });
      
      // Adicionar aos assets existentes
      setLibraryState(prev => {
        const allAssets = [...prev.assets, ...pptxAssets];
        return {
          ...prev,
          assets: allAssets,
          categories: prev.categories.map(cat => ({
            ...cat,
            count: cat.id === 'all' ? allAssets.length :
                   cat.id === 'pptx' ? pptxAssets.length :
                   allAssets.filter(asset => asset.type === cat.id).length
          }))
        };
      });
      
    } catch (error) {
      console.error('Error loading PPTX assets:', error);
    }
  };
  
  const loadInitialAssets = () => {
    const mockAssets: MediaAsset[] = [
      {
        id: 'asset_1',
        name: 'Video_Intro_NR10.mp4',
        type: 'video',
        url: '/demo/video1.mp4',
        thumbnailUrl: '/demo/thumb1.jpg',
        duration: 120,
        fileSize: 45000000,
        format: 'mp4',
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        uploadedAt: new Date('2024-01-15'),
        tags: ['nr10', 'segurança', 'eletricidade'],
        metadata: { bitrate: 5000 }
      },
      {
        id: 'asset_2', 
        name: 'Logo_Empresa.png',
        type: 'image',
        url: '/demo/logo.png',
        thumbnailUrl: '/demo/logo_thumb.png',
        fileSize: 850000,
        format: 'png',
        resolution: { width: 512, height: 512 },
        uploadedAt: new Date('2024-01-10'),
        tags: ['logo', 'branding'],
        metadata: {}
      },
      {
        id: 'asset_3',
        name: 'Narração_NR35.mp3',
        type: 'audio',
        url: '/demo/audio1.mp3',
        duration: 180,
        fileSize: 12000000,
        format: 'mp3',
        uploadedAt: new Date('2024-01-12'),
        tags: ['nr35', 'narração', 'altura'],
        metadata: { bitrate: 320 }
      }
    ];

    setLibraryState(prev => ({
      ...prev,
      assets: mockAssets,
      categories: prev.categories.map(cat => ({
        ...cat,
        count: cat.id === 'all' ? mockAssets.length : 
               mockAssets.filter(asset => cat.id === asset.type).length
      }))
    }));
  };

  // Filtrar e ordenar assets
  const filteredAssets = React.useMemo(() => {
    let filtered = libraryState.assets;

    // Filtrar por categoria
    if (libraryState.selectedCategory !== 'all') {
      if (libraryState.selectedCategory === 'pptx') {
        filtered = filtered.filter(asset => 
          asset.tags.includes('pptx') || 
          asset.metadata?.source === 'pptx_conversion' ||
          asset.metadata?.source === 'pptx_slide'
        );
      } else {
        filtered = filtered.filter(asset => asset.type === libraryState.selectedCategory);
      }
    }

    // Filtrar por busca
    if (libraryState.searchQuery) {
      const query = libraryState.searchQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      const order = libraryState.sortOrder === 'asc' ? 1 : -1;
      
      switch (libraryState.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * order;
        case 'date':
          return (a.uploadedAt.getTime() - b.uploadedAt.getTime()) * order;
        case 'size':
          return (a.fileSize - b.fileSize) * order;
        case 'duration':
          return ((a.duration || 0) - (b.duration || 0)) * order;
        default:
          return 0;
      }
    });

    return filtered;
  }, [libraryState.assets, libraryState.selectedCategory, libraryState.searchQuery, libraryState.sortBy, libraryState.sortOrder]);

  // Handlers de upload
  const handleFileSelect = useCallback(() => {
    try {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (error) {
      console.error('❌ Error opening file selector:', error);
    }
  }, []);

  const handleFilesSelected = useCallback((files: FileList) => {
    if (!files || files.length === 0) {
      return;
    }
    
    // Validar tipos de arquivo
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      if (isValidFileType(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      console.warn('⚠️ Invalid files detected:', invalidFiles.map(f => f.name));
      // TODO: Show user notification about invalid files
    }
    
    validFiles.forEach(file => processFile(file));
  }, []);

  // Validação de tipos de arquivo
  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      // Video formats
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      // Audio formats  
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm',
      // Image formats
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
    ];
    
    const isValidMimeType = validTypes.includes(file.type);
    const isValidExtension = /\.(mp4|mpeg|mov|avi|webm|mp3|wav|ogg|jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
    
    return isValidMimeType || isValidExtension;
  };

  const processFile = async (file: File) => {
    // Processing file
    
    // Validação adicional de tamanho
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      console.error(`❌ File too large: ${file.name} (${formatFileSize(file.size)})`);
      // TODO: Show user notification
      return;
    }
    
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Adicionar ao progresso de upload
    const uploadItem: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    };

    setLibraryState(prev => ({
      ...prev,
      uploadProgress: [...prev.uploadProgress, uploadItem]
    }));

    try {
      // Simular upload (em implementação real, faria upload para servidor)
      await simulateUpload(fileId, file);
      
      // Criar asset
      const asset = await createAssetFromFile(file, fileId);
      
      // Adicionar à biblioteca
      setLibraryState(prev => {
        const newAssets = [...prev.assets, asset];
        const updatedCategories = prev.categories.map(cat => ({
          ...cat,
          count: cat.id === 'all' ? newAssets.length :
                 cat.id === 'pptx' ? newAssets.filter(a => a.tags.includes('pptx')).length :
                 newAssets.filter(a => a.type === cat.id).length
        }));
        
        return {
          ...prev,
          assets: newAssets,
          categories: updatedCategories,
          uploadProgress: prev.uploadProgress.map(item => 
            item.fileId === fileId 
              ? { ...item, status: 'completed', progress: 100 }
              : item
          )
        };
      });

      // Remover progresso após 3 segundos para manter interface limpa
      setTimeout(() => {
        setLibraryState(prev => ({
          ...prev,
          uploadProgress: prev.uploadProgress.filter(item => item.fileId !== fileId)
        }));
      }, 3000);

    } catch (error) {
      console.error(`❌ Upload failed for ${file.name}:`, error);
      setLibraryState(prev => ({
        ...prev,
        uploadProgress: prev.uploadProgress.map(item => 
          item.fileId === fileId 
            ? { ...item, status: 'error', error: `Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }
            : item
        )
      }));
    }
  };

  const simulateUpload = (fileId: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // 5-20% increment
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Simular possível falha (5% chance)
          if (Math.random() < 0.05) {
            reject(new Error('Simulated network error'));
            return;
          }
          
          resolve();
        }
        
        setLibraryState(prev => ({
          ...prev,
          uploadProgress: prev.uploadProgress.map(item =>
            item.fileId === fileId ? { ...item, progress: Math.floor(progress) } : item
          )
        }));
      }, 100 + Math.random() * 200); // Random interval for realism
    });
  };

  const createAssetFromFile = async (file: File, id: string): Promise<MediaAsset> => {
    const type = getFileType(file);
    const url = URL.createObjectURL(file);
    
    // Gerar thumbnail
    const thumbnailUrl = type === 'image' ? url : await generateThumbnail(file, type);
    
    // Extrair metadados
    const metadata = await extractMetadata(file, type);
    
    // Gerar tags automáticas baseadas no nome do arquivo
    const autoTags = generateAutoTags(file.name, type);
    
    const asset: MediaAsset = {
      id,
      name: file.name,
      type,
      url,
      thumbnailUrl,
      duration: metadata.duration,
      fileSize: file.size,
      format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      resolution: metadata.resolution,
      frameRate: metadata.frameRate,
      uploadedAt: new Date(),
      tags: autoTags,
      metadata: {
        ...metadata,
        originalFile: file,
        uploadSource: 'user_upload'
      }
    };
    
    return asset;
  };

  const generateAutoTags = (fileName: string, type: string): string[] => {
    const tags = [type];
    
    // Tags baseadas no nome do arquivo
    const name = fileName.toLowerCase();
    if (name.includes('nr10')) tags.push('nr10', 'segurança', 'eletricidade');
    if (name.includes('nr35')) tags.push('nr35', 'altura', 'segurança');
    if (name.includes('nr12')) tags.push('nr12', 'segurança', 'trabalho');
    if (name.includes('logo')) tags.push('logo', 'branding');
    if (name.includes('intro')) tags.push('introdução');
    if (name.includes('narração') || name.includes('narracao')) tags.push('narração', 'áudio');
    
    return tags;
  };

  const getFileType = (file: File): 'video' | 'audio' | 'image' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'image'; // fallback
  };

  const generateThumbnail = async (file: File, type: string): Promise<string> => {
    try {
      if (type === 'video') {
        return await generateVideoThumbnail(file);
      } else if (type === 'audio') {
        return '/demo/audio_thumb.png'; // Default audio thumbnail
      }
    } catch (error) {
      console.warn('⚠️ Thumbnail generation failed, using default:', error);
    }
    
    return '/demo/default_thumb.png';
  };

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      video.onloadedmetadata = () => {
        // Seek to 10% of video duration or 2 seconds
        video.currentTime = Math.min(video.duration * 0.1, 2);
      };
      
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
        resolve(thumbnailUrl);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Video loading failed'));
      };
      
      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  const extractMetadata = async (file: File, type: string): Promise<Record<string, any>> => {
    try {
      if (type === 'video') {
        return await extractVideoMetadata(file);
      } else if (type === 'audio') {
        return await extractAudioMetadata(file);
      } else if (type === 'image') {
        return await extractImageMetadata(file);
      }
    } catch (error) {
      console.warn('⚠️ Metadata extraction failed, using defaults:', error);
    }
    
    // Default metadata
    return {
      duration: type === 'video' || type === 'audio' ? 60 : undefined,
      resolution: type === 'image' || type === 'video' ? { width: 1920, height: 1080 } : undefined,
      frameRate: type === 'video' ? 30 : undefined
    };
  };

  const extractVideoMetadata = (file: File): Promise<Record<string, any>> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          resolution: { width: video.videoWidth, height: video.videoHeight },
          frameRate: 30 // Default, real extraction would need more complex analysis
        };
        URL.revokeObjectURL(video.src);
        resolve(metadata);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Video metadata extraction failed'));
      };
      
      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  const extractAudioMetadata = (file: File): Promise<Record<string, any>> => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      
      audio.onloadedmetadata = () => {
        const metadata = {
          duration: audio.duration
        };
        URL.revokeObjectURL(audio.src);
        resolve(metadata);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        reject(new Error('Audio metadata extraction failed'));
      };
      
      audio.src = URL.createObjectURL(file);
      audio.load();
    });
  };

  const extractImageMetadata = (file: File): Promise<Record<string, any>> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const metadata = {
          resolution: { width: img.width, height: img.height }
        };
        URL.revokeObjectURL(img.src);
        resolve(metadata);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Image metadata extraction failed'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Drag & Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if leaving the main drop zone
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesSelected(files);
    }
  }, []);

  // Handlers de interação
  const handleAssetClick = (asset: MediaAsset, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-seleção
      setSelectedAssets(prev => 
        prev.includes(asset.id) 
          ? prev.filter(id => id !== asset.id)
          : [...prev, asset.id]
      );
    } else {
      setSelectedAssets([asset.id]);
      onAssetSelect?.(asset);
    }
  };

  const handleAssetDoubleClick = (asset: MediaAsset) => {
    // Adicionar à timeline
    const track = engine.getState().tracks.find(t => t.type === asset.type) || engine.getState().tracks[0];
    if (track) {
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: asset.type as any,
        name: asset.name,
        startTime: engine.getCurrentTime(),
        duration: asset.duration || 5,
        trackId: track.id,
        zIndex: 0,
        properties: {
          url: asset.url,
          volume: 1
        },
        metadata: asset.metadata
      };

      engine.dispatch({
        type: 'ADD_ITEM',
        payload: { item: newItem, trackId: track.id }
      });
    }
  };

  const handleDeleteAssets = () => {
    if (selectedAssets.length === 0) return;
    
    setLibraryState(prev => ({
      ...prev,
      assets: prev.assets.filter(asset => !selectedAssets.includes(asset.id))
    }));
    setSelectedAssets([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Biblioteca de Mídia</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFileSelect}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Busca e filtros */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou tags..."
              value={libraryState.searchQuery}
              onChange={(e) => setLibraryState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <select
            value={libraryState.sortBy}
            onChange={(e) => setLibraryState(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            <option value="date">Data</option>
            <option value="name">Nome</option>
            <option value="size">Tamanho</option>
            <option value="duration">Duração</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLibraryState(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            {libraryState.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>

        {/* Categorias */}
        <div className="flex space-x-2">
          {libraryState.categories.map(category => (
            <Button
              key={category.id}
              variant={libraryState.selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setLibraryState(prev => ({ ...prev, selectedCategory: category.id }))}
              className={libraryState.selectedCategory === category.id 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "text-white border-gray-600 hover:bg-gray-700"
              }
            >
              {getTypeIcon(category.id)}
              <span className="ml-2">{category.name}</span>
              <Badge variant="secondary" className="ml-2 bg-gray-700">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Upload Progress */}
      {libraryState.uploadProgress.length > 0 && (
        <div className="p-4 border-b border-gray-700 bg-gray-850">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-200 flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Uploads em Andamento
            </h4>
            <Badge variant="secondary" className="bg-blue-600 text-white">
              {libraryState.uploadProgress.filter(u => u.status === 'uploading').length}
            </Badge>
          </div>
          <div className="space-y-3">
            {libraryState.uploadProgress.map(upload => (
              <div key={upload.fileId} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getTypeIcon(getFileType({ name: upload.fileName } as File))}
                    <span className="text-sm text-white truncate font-medium">
                      {upload.fileName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {upload.status === 'uploading' && (
                      <div className="flex items-center text-blue-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-2"></div>
                        <span className="text-xs font-medium">{upload.progress.toFixed(0)}%</span>
                      </div>
                    )}
                    {upload.status === 'completed' && (
                      <div className="flex items-center text-green-400">
                        <Check className="w-3 h-3 mr-1" />
                        <span className="text-xs">Concluído</span>
                      </div>
                    )}
                    {upload.status === 'error' && (
                      <div className="flex items-center text-red-400">
                        <X className="w-3 h-3 mr-1" />
                        <span className="text-xs">Erro</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {upload.status === 'uploading' && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                )}
                
                {upload.status === 'error' && upload.error && (
                  <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{upload.error}</span>
                    </div>
                  </div>
                )}
                
                {upload.status === 'completed' && (
                  <div className="mt-2 text-xs text-gray-400">
                    Upload concluído com sucesso
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 overflow-auto p-4 relative transition-all duration-200 ${
          isDragOver ? 'bg-blue-900/20 border-2 border-dashed border-blue-400' : ''
        }`}
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center z-10 rounded-lg">
            <div className="bg-gray-800 border-2 border-dashed border-blue-400 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Solte seus arquivos aqui</h3>
              <p className="text-gray-300 text-sm">
                Suporte para vídeos, áudios, imagens e apresentações
              </p>
            </div>
          </div>
        )}
        {/* Actions Bar */}
        {selectedAssets.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-800 rounded">
            <span className="text-sm">{selectedAssets.length} item(s) selecionado(s)</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAssets}
                className="text-red-400 border-red-600 hover:bg-red-900"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Assets Grid/List */}
        {filteredAssets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {libraryState.selectedCategory === 'all' ? 'Nenhum arquivo na biblioteca' : 'Nenhum arquivo desta categoria'}
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                {libraryState.selectedCategory === 'all' 
                  ? 'Faça upload de vídeos, áudios, imagens ou apresentações para começar a editar'
                  : `Não há arquivos de ${libraryState.categories.find(c => c.id === libraryState.selectedCategory)?.name.toLowerCase()} na biblioteca`
                }
              </p>
              <Button
                onClick={handleFileSelect}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </Button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <VirtualizedList
            items={filteredAssets}
            itemHeight={220}
            containerHeight={600}
            keyExtractor={(asset) => asset.id}
            className="grid-virtualized"
            renderItem={(asset) => (
              <div
                className={`relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:bg-gray-700 ${
                  selectedAssets.includes(asset.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={(e) => handleAssetClick(asset, e)}
                onDoubleClick={() => handleAssetDoubleClick(asset)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-700 flex items-center justify-center">
                  {asset.thumbnailUrl ? (
                    <img 
                      src={asset.thumbnailUrl} 
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      {getTypeIcon(asset.type)}
                    </div>
                  )}
                  
                  {/* Play overlay para vídeos */}
                  {asset.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <div className="text-sm font-medium truncate" title={asset.name}>
                    {asset.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatFileSize(asset.fileSize)}
                    {asset.duration && ` • ${formatDuration(asset.duration)}`}
                  </div>
                  
                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {asset.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-700">
                          {tag}
                        </Badge>
                      ))}
                      {asset.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs bg-gray-700">
                          +{asset.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        ) : (
          <VirtualizedList
            items={filteredAssets}
            itemHeight={80}
            containerHeight={600}
            keyExtractor={(asset) => asset.id}
            className="list-virtualized"
            renderItem={(asset) => (
              <div
                className={`flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer transition-all hover:bg-gray-700 ${
                  selectedAssets.includes(asset.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={(e) => handleAssetClick(asset, e)}
                onDoubleClick={() => handleAssetDoubleClick(asset)}
              >
                <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center mr-3">
                  {getTypeIcon(asset.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{asset.name}</div>
                  <div className="text-xs text-gray-400">
                    {formatFileSize(asset.fileSize)}
                    {asset.duration && ` • ${formatDuration(asset.duration)}`}
                    {asset.resolution && ` • ${asset.resolution.width}x${asset.resolution.height}`}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssetPreview?.(asset);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
        className="hidden"
      />
    </Card>
  );
};
