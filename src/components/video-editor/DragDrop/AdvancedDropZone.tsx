import React, { useEffect, useState, useRef } from 'react';
import { Upload, FileVideo, FileAudio, FileImage, AlertCircle, CheckCircle, X, Zap } from 'lucide-react';
import DragDropService from '../../../services/dragDropService';
import { toast } from 'sonner';

interface AdvancedDropZoneProps {
  id: string;
  acceptedTypes: string[];
  maxFileSize: number;
  maxFiles: number;
  onFilesSelected: (files: File[]) => void;
  className?: string;
  children?: React.ReactNode;
  showPreview?: boolean;
  enableDirectoryUpload?: boolean;
  customMessages?: {
    dropText?: string;
    browseText?: string;
    dragActiveText?: string;
    errorText?: string;
  };
}

const AdvancedDropZone: React.FC<AdvancedDropZoneProps> = ({
  id,
  acceptedTypes,
  maxFileSize,
  maxFiles,
  onFilesSelected,
  className = '',
  children,
  showPreview = true,
  enableDirectoryUpload = false,
  customMessages = {}
}) => {
  const dragDropService = DragDropService.getInstance();
  const [dropState, setDropState] = useState(dragDropService.getState());
  const [isRegistered, setIsRegistered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const messages = {
    dropText: 'Arraste arquivos aqui ou clique para selecionar',
    browseText: 'Selecionar Arquivos',
    dragActiveText: 'Solte os arquivos aqui',
    errorText: 'Arquivos inválidos detectados',
    ...customMessages
  };

  // Register drop zone on mount
  useEffect(() => {
    dragDropService.registerDropZone(id, {
      acceptedTypes,
      maxFileSize,
      maxFiles,
      enableMultipleFiles: maxFiles > 1,
      enableDirectoryUpload,
      onDrop: (files) => {
        onFilesSelected(files);
      }
    });
    setIsRegistered(true);

    return () => {
      dragDropService.unregisterDropZone(id);
    };
  }, [id, acceptedTypes, maxFileSize, maxFiles, enableDirectoryUpload, onFilesSelected]);

  // Subscribe to drag state changes for better performance
  useEffect(() => {
    const unsubscribe = dragDropService.subscribe((newState) => {
      // Only update if relevant to this drop zone
      if (newState.dragOverTarget === id || 
          newState.isDragOver !== dropState.isDragOver) {
        setDropState(newState);
      }
    });

    return unsubscribe;
  }, [id, dropState.isDragOver]);

  // Create drag handlers
  const dragHandlers = isRegistered ? dragDropService.createDragHandlers(id) : null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validation = dragDropService.validateFiles(files, id);
      if (validation.isValid) {
        onFilesSelected(files);
      } else {
        validation.errors.forEach(error => toast.error(error));
      }
    }
    // Reset input
    e.target.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return <FileVideo className="w-8 h-8 text-blue-500" />;
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension || '')) {
      return <FileAudio className="w-8 h-8 text-green-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <FileImage className="w-8 h-8 text-purple-500" />;
    }
    return <Upload className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isDragActive = dropState.isDragOver && dropState.dragOverTarget === id;
  const hasErrors = dropState.validationErrors.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        {...(enableDirectoryUpload ? { webkitdirectory: 'true' } : {})}
      />

      {/* Main drop zone */}
      <div
        ref={dropZoneRef}
        {...(dragHandlers || {})}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive 
            ? hasErrors 
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
              : 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${hasErrors ? 'shake' : ''}
        `}
      >
        {/* Main content */}
        {children || (
          <div className="space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              {isDragActive ? (
                hasErrors ? (
                  <AlertCircle className="w-16 h-16 text-red-500" />
                ) : (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                )
              ) : (
                <Upload className="w-16 h-16 text-gray-400" />
              )}
            </div>

            {/* Text */}
            <div>
              <p className={`text-lg font-medium ${
                isDragActive 
                  ? hasErrors ? 'text-red-600' : 'text-blue-600'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {isDragActive 
                  ? hasErrors ? messages.errorText : messages.dragActiveText
                  : messages.dropText
                }
              </p>
              
              {!isDragActive && (
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {messages.browseText}
                </button>
              )}
            </div>

            {/* File constraints */}
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>Tipos aceitos: {acceptedTypes.join(', ')}</p>
              <p>Tamanho máximo: {formatFileSize(maxFileSize)}</p>
              {maxFiles > 1 && <p>Máximo {maxFiles} arquivos</p>}
            </div>
          </div>
        )}

        {/* Drag overlay */}
        {isDragActive && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className={`text-center p-8 rounded-lg ${
              hasErrors 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {hasErrors ? (
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              ) : (
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              )}
              <p className={`font-medium ${
                hasErrors ? 'text-red-600' : 'text-blue-600'
              }`}>
                {hasErrors ? messages.errorText : messages.dragActiveText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File preview */}
      {showPreview && dropState.previewFiles.length > 0 && isDragActive && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Prévia dos Arquivos ({dropState.previewFiles.length})
            </h4>
            {hasErrors && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {dropState.previewFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Validation errors */}
          {hasErrors && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="space-y-1">
                {dropState.validationErrors.map((error, index) => (
                  <p key={index} className="text-xs text-red-600 flex items-center">
                    <X className="w-3 h-3 mr-1" />
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing indicator */}
      {isDragActive && !hasErrors && (
        <div className="absolute top-2 right-2">
          <Zap className="w-6 h-6 text-blue-500 animate-pulse" />
        </div>
      )}
    </div>
  );
};

// Add shake animation to global styles
const style = document.createElement('style');
style.textContent = `
  .shake {
    animation: shake 0.5s;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

export default AdvancedDropZone;