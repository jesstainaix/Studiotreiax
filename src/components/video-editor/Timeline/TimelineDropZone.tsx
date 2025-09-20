import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Video, Music, Image, Target, Clock } from 'lucide-react';
import DragDropService from '../../../services/dragDropService';
import { MediaAsset } from '../../../modules/video-editor/types/Media.types';
import { TimelineEngine } from '../../../modules/video-editor/core/TimelineEngine';
import { toast } from 'sonner';

interface TimelineDropZoneProps {
  engine: TimelineEngine;
  trackId: string;
  startTime: number;
  onAssetDropped: (asset: MediaAsset, trackId: string, startTime: number) => void;
  className?: string;
  children?: React.ReactNode;
}

export const TimelineDropZone: React.FC<TimelineDropZoneProps> = ({
  engine,
  trackId,
  startTime,
  onAssetDropped,
  className = '',
  children
}) => {
  const dragDropService = DragDropService.getInstance();
  const [dropState, setDropState] = useState(dragDropService.getState());
  const [isValidDrop, setIsValidDrop] = useState(false);
  const dropZoneId = `timeline_${trackId}_${startTime}`;

  // Register timeline-specific drop zone
  useEffect(() => {
    dragDropService.registerDropZone(dropZoneId, {
      acceptedTypes: ['.mp4', '.mov', '.avi', '.webm', '.mp3', '.wav', '.jpg', '.png', '.gif'],
      maxFileSize: 500 * 1024 * 1024, // 500MB
      maxFiles: 1, // Only one file at a time for timeline
      enableMultipleFiles: false,
      enableDirectoryUpload: false,
      onDrop: async (files) => {
        if (files.length > 0) {
          const file = files[0];
          try {
            // Convert file to MediaAsset
            const asset = await createAssetFromFile(file);
            onAssetDropped(asset, trackId, startTime);
            
            toast.success(`✅ ${file.name} adicionado à timeline`, {
              description: `Track: ${trackId} | Tempo: ${formatTime(startTime)}`
            });
          } catch (error) {
            toast.error('Erro ao adicionar arquivo à timeline');
            console.error('Timeline drop error:', error);
          }
        }
      }
    });

    return () => {
      dragDropService.unregisterDropZone(dropZoneId);
    };
  }, [dropZoneId, trackId, startTime, onAssetDropped]);

  // Monitor drag state
  useEffect(() => {
    const interval = setInterval(() => {
      const newState = dragDropService.getState();
      if (newState.dragOverTarget === dropZoneId || 
          dropState.isDragOver !== newState.isDragOver) {
        setDropState(newState);
        
        // Check if dragged files are valid for timeline
        if (newState.previewFiles.length > 0) {
          const validation = dragDropService.validateFiles(newState.previewFiles, dropZoneId);
          setIsValidDrop(validation.isValid && isValidTimelineFile(newState.previewFiles[0]));
        } else {
          setIsValidDrop(false);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [dropZoneId, dropState.isDragOver]);

  // Create drag handlers
  const dragHandlers = dragDropService.createDragHandlers(dropZoneId);

  // Convert File to MediaAsset
  const createAssetFromFile = async (file: File): Promise<MediaAsset> => {
    const fileType = getFileType(file);
    const fileId = `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create object URL for preview
    const url = URL.createObjectURL(file);
    
    const asset: MediaAsset = {
      id: fileId,
      name: file.name,
      type: fileType,
      url: url,
      fileSize: file.size,
      format: file.name.split('.').pop()?.toLowerCase() || '',
      uploadedAt: new Date(),
      tags: ['timeline-drop'],
      metadata: {
        originalFile: file.name,
        droppedToTimeline: true,
        trackId: trackId,
        startTime: startTime
      }
    };

    // Add type-specific properties
    if (fileType === 'video') {
      // Get video duration and dimensions
      const videoData = await getVideoMetadata(file);
      asset.duration = videoData.duration;
      asset.resolution = videoData.resolution;
      asset.frameRate = videoData.frameRate;
    } else if (fileType === 'audio') {
      // Get audio duration
      const audioData = await getAudioMetadata(file);
      asset.duration = audioData.duration;
    } else if (fileType === 'image') {
      // Get image dimensions
      const imageData = await getImageMetadata(file);
      asset.resolution = imageData.resolution;
      asset.duration = 5; // Default 5 seconds for images
    }

    return asset;
  };

  // Get file type from file
  const getFileType = (file: File): 'video' | 'audio' | 'image' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    
    // Fallback to extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension || '')) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
    
    return 'video'; // Default
  };

  // Check if file is valid for timeline
  const isValidTimelineFile = (file: File): boolean => {
    const type = getFileType(file);
    const track = engine.getState().tracks.find(t => t.id === trackId);
    
    if (!track) return false;
    
    // Check type compatibility with track
    if (track.type === 'video' && type !== 'video' && type !== 'image') return false;
    if (track.type === 'audio' && type !== 'audio') return false;
    
    return true;
  };

  // Get video metadata
  const getVideoMetadata = (file: File): Promise<{duration: number, resolution: {width: number, height: number}, frameRate: number}> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration || 0,
          resolution: {
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080
          },
          frameRate: 30 // Default, actual frame rate is harder to detect
        });
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        resolve({
          duration: 0,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30
        });
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Get audio metadata
  const getAudioMetadata = (file: File): Promise<{duration: number}> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        resolve({
          duration: audio.duration || 0
        });
        URL.revokeObjectURL(audio.src);
      };
      
      audio.onerror = () => {
        resolve({ duration: 0 });
        URL.revokeObjectURL(audio.src);
      };
      
      audio.src = URL.createObjectURL(file);
    });
  };

  // Get image metadata
  const getImageMetadata = (file: File): Promise<{resolution: {width: number, height: number}}> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      
      img.onload = () => {
        resolve({
          resolution: {
            width: img.naturalWidth || 1920,
            height: img.naturalHeight || 1080
          }
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        resolve({
          resolution: { width: 1920, height: 1080 }
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get appropriate icon based on file type
  const getDropIcon = () => {
    if (dropState.previewFiles.length > 0) {
      const type = getFileType(dropState.previewFiles[0]);
      switch (type) {
        case 'video': return <Video className="w-6 h-6" />;
        case 'audio': return <Music className="w-6 h-6" />;
        case 'image': return <Image className="w-6 h-6" />;
        default: return <Plus className="w-6 h-6" />;
      }
    }
    return <Plus className="w-6 h-6" />;
  };

  const isDragActive = dropState.isDragOver && dropState.dragOverTarget === dropZoneId;

  return (
    <div
      {...dragHandlers}
      className={`
        relative transition-all duration-200 ease-in-out
        ${isDragActive 
          ? isValidDrop
            ? 'bg-green-100 dark:bg-green-900/30 border-2 border-dashed border-green-400'
            : 'bg-red-100 dark:bg-red-900/30 border-2 border-dashed border-red-400'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
        ${className}
      `}
    >
      {children}
      
      {/* Drop indicator overlay */}
      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm
            ${isValidDrop 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
            }
          `}>
            {isValidDrop ? (
              <>
                <Target className="w-4 h-4" />
                <span>Soltar aqui</span>
                {getDropIcon()}
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Tipo incompatível</span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Timeline position indicator */}
      {isDragActive && isValidDrop && (
        <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br z-20">
          {formatTime(startTime)}
        </div>
      )}
    </div>
  );
};

export default TimelineDropZone;