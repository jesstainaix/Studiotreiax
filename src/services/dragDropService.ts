import { toast } from 'sonner';

export interface DragDropConfig {
  acceptedTypes: string[];
  maxFileSize: number; // in bytes
  maxFiles: number;
  enableMultipleFiles: boolean;
  enableDirectoryUpload: boolean;
  onDragEnter?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (files: File[], dropTarget?: string) => void;
  onPreview?: (files: File[]) => void;
}

export interface DropZoneState {
  isDragOver: boolean;
  dragOverTarget: string | null;
  previewFiles: File[];
  validationErrors: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedFormat?: string;
}

type StateChangeListener = (state: DropZoneState) => void;

export class DragDropService {
  private static instance: DragDropService;
  private dropZones: Map<string, DragDropConfig> = new Map();
  private currentState: DropZoneState = {
    isDragOver: false,
    dragOverTarget: null,
    previewFiles: [],
    validationErrors: []
  };
  private listeners: Set<StateChangeListener> = new Set();

  static getInstance(): DragDropService {
    if (!DragDropService.instance) {
      DragDropService.instance = new DragDropService();
    }
    return DragDropService.instance;
  }

  // Register a drop zone with specific configuration
  registerDropZone(id: string, config: DragDropConfig): void {
    this.dropZones.set(id, config);
  }

  // Unregister a drop zone
  unregisterDropZone(id: string): void {
    this.dropZones.delete(id);
  }

  // Validate files based on drop zone configuration
  validateFiles(files: File[], dropZoneId: string): FileValidationResult {
    const config = this.dropZones.get(dropZoneId);
    if (!config) {
      return {
        isValid: false,
        errors: ['Drop zone não configurado'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file count
    if (files.length > config.maxFiles) {
      errors.push(`Máximo de ${config.maxFiles} arquivos permitidos (${files.length} selecionados)`);
    }

    for (const file of files) {
      // Check file size
      if (file.size > config.maxFileSize) {
        errors.push(`${file.name}: Arquivo muito grande (${this.formatFileSize(file.size)} > ${this.formatFileSize(config.maxFileSize)})`);
      }

      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAcceptedType = config.acceptedTypes.some(type => 
        type === '*' || 
        type === fileExtension ||
        file.type.startsWith(type.replace('*', ''))
      );

      if (!isAcceptedType) {
        errors.push(`${file.name}: Tipo de arquivo não suportado`);
        // Suggest conversion if possible
        this.suggestConversion(file, warnings);
      }

      // Security checks
      this.performSecurityChecks(file, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Enhanced drag handlers with visual feedback
  createDragHandlers(dropZoneId: string) {
    const config = this.dropZones.get(dropZoneId);
    if (!config) {
      throw new Error(`Drop zone ${dropZoneId} não está registrado`);
    }

    return {
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Extract files for preview
        const files = this.extractFilesFromDataTransfer(e.dataTransfer);
        
        // Validate files
        const validation = this.validateFiles(files, dropZoneId);
        
        // Update state and notify listeners
        this.updateState({
          isDragOver: true,
          dragOverTarget: dropZoneId,
          previewFiles: files,
          validationErrors: validation.errors
        });
        
        config.onDragEnter?.(e.nativeEvent);
      },

      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Show visual feedback based on validation
        if (this.currentState.validationErrors.length > 0) {
          e.dataTransfer.dropEffect = 'none';
        } else {
          e.dataTransfer.dropEffect = 'copy';
        }
      },

      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Only clear if actually leaving the drop zone
        const target = e.currentTarget as HTMLElement;
        if (!target.contains(e.relatedTarget as Node)) {
          this.updateState({
            isDragOver: false,
            dragOverTarget: null,
            previewFiles: [],
            validationErrors: []
          });
          
          config.onDragLeave?.(e.nativeEvent);
        }
      },

      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        this.updateState({
          isDragOver: false,
          dragOverTarget: null,
          previewFiles: [],
          validationErrors: []
        });
        
        const files = Array.from(e.dataTransfer.files);
        
        // Final validation
        const validation = this.validateFiles(files, dropZoneId);
        if (!validation.isValid) {
          validation.errors.forEach(error => toast.error(error));
          return;
        }

        // Show warnings if any
        validation.warnings.forEach(warning => toast.warning(warning));
        
        config.onDrop?.(files, dropZoneId);
        
        // Clear state
        this.currentState.previewFiles = [];
        this.currentState.validationErrors = [];
      }
    };
  }

  // Get current state for UI updates
  getState(): DropZoneState {
    return { ...this.currentState };
  }

  // Subscribe to state changes
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in drag drop state listener:', error);
      }
    });
  }

  // Update state and notify listeners
  private updateState(updates: Partial<DropZoneState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.notifyListeners();
  }

  // Process directory uploads (when supported)
  async processDirectory(directoryEntry: any): Promise<File[]> {
    const files: File[] = [];
    
    const processEntry = async (entry: any): Promise<void> => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
          entry.file(resolve, reject);
        });
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise<any[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        
        for (const subEntry of entries) {
          await processEntry(subEntry);
        }
      }
    };

    await processEntry(directoryEntry);
    return files;
  }

  // Extract files from DataTransfer with directory support
  private extractFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
    const files: File[] = [];
    
    // Try to get files from dataTransfer.files first
    for (let i = 0; i < dataTransfer.files.length; i++) {
      files.push(dataTransfer.files[i]);
    }
    
    return files;
  }

  // Format file size for display
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Suggest file format conversion
  private suggestConversion(file: File, warnings: string[]): void {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const conversions: Record<string, string> = {
      'mov': 'mp4',
      'avi': 'mp4',
      'wmv': 'mp4',
      'flv': 'mp4',
      'wav': 'mp3',
      'flac': 'mp3',
      'aac': 'mp3',
      'bmp': 'png',
      'tiff': 'png',
      'gif': 'png'
    };

    if (extension && conversions[extension]) {
      warnings.push(`${file.name}: Considere converter para ${conversions[extension]} para melhor compatibilidade`);
    }
  }

  // Perform basic security checks
  private performSecurityChecks(file: File, errors: string[], warnings: string[]): void {
    // Check for suspicious extensions
    const suspiciousExtensions = /\.(exe|scr|bat|cmd|com|pif|vbs|js|jar|msi|dll)$/i;
    if (suspiciousExtensions.test(file.name)) {
      errors.push(`${file.name}: Tipo de arquivo potencialmente perigoso`);
    }

    // Check for double extensions
    const doubleExtension = /\.\w+\.\w+$/;
    if (doubleExtension.test(file.name)) {
      warnings.push(`${file.name}: Nome de arquivo com extensão dupla detectado`);
    }

    // Check file name length
    if (file.name.length > 255) {
      errors.push(`${file.name}: Nome do arquivo muito longo (máximo 255 caracteres)`);
    }

    // Check for special characters
    if (/[<>:"|?*\\]/.test(file.name)) {
      warnings.push(`${file.name}: Nome contém caracteres especiais que podem causar problemas`);
    }
  }
}

export default DragDropService;