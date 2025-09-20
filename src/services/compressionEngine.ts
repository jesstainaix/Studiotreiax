import { ExportSettings, CompressionSettings, FileEstimate } from '../types/export';

// Interface para configurações de compressão
interface CompressionProfile {
  id: string;
  name: string;
  description: string;
  settings: CompressionSettings;
  targetSizeReduction: number; // Porcentagem de redução esperada
  qualityLoss: number; // Porcentagem de perda de qualidade esperada
}

// Perfis de compressão predefinidos
const compressionProfiles: CompressionProfile[] = [
  {
    id: 'lossless',
    name: 'Sem Compressão',
    description: 'Máxima qualidade, maior tamanho de arquivo',
    settings: {
      algorithm: 'lossless',
      compressionLevel: 0,
      targetBitrate: 0,
      twoPass: false,
      adaptiveBitrate: false
    },
    targetSizeReduction: 0,
    qualityLoss: 0
  },
  {
    id: 'high-quality',
    name: 'Alta Qualidade',
    description: 'Compressão mínima, qualidade excelente',
    settings: {
      algorithm: 'h264',
      compressionLevel: 1,
      targetBitrate: 0,
      twoPass: true,
      adaptiveBitrate: true
    },
    targetSizeReduction: 15,
    qualityLoss: 2
  },
  {
    id: 'balanced',
    name: 'Balanceado',
    description: 'Equilíbrio entre qualidade e tamanho',
    settings: {
      algorithm: 'h264',
      compressionLevel: 3,
      targetBitrate: 0,
      twoPass: true,
      adaptiveBitrate: true
    },
    targetSizeReduction: 35,
    qualityLoss: 8
  },
  {
    id: 'web-optimized',
    name: 'Otimizado para Web',
    description: 'Ideal para streaming e upload rápido',
    settings: {
      algorithm: 'h264',
      compressionLevel: 5,
      targetBitrate: 0,
      twoPass: true,
      adaptiveBitrate: true
    },
    targetSizeReduction: 50,
    qualityLoss: 15
  },
  {
    id: 'maximum',
    name: 'Compressão Máxima',
    description: 'Menor tamanho possível, qualidade reduzida',
    settings: {
      algorithm: 'h265',
      compressionLevel: 8,
      targetBitrate: 0,
      twoPass: true,
      adaptiveBitrate: true
    },
    targetSizeReduction: 70,
    qualityLoss: 25
  }
];

// Classe principal do engine de compressão
export class CompressionEngine {
  private profiles: Map<string, CompressionProfile> = new Map();

  constructor() {
    this.initializeProfiles();
  }

  private initializeProfiles(): void {
    compressionProfiles.forEach(profile => {
      this.profiles.set(profile.id, profile);
    });
  }

  // Estimar tamanho do arquivo baseado nas configurações
  public estimateFileSize(
    settings: ExportSettings,
    duration: number,
    compressionProfile?: string
  ): FileEstimate {
    const profile = compressionProfile ? this.profiles.get(compressionProfile) : null;
    
    // Cálculo base do tamanho
    const baseSize = this.calculateBaseSize(settings, duration);
    
    // Aplicar compressão se especificada
    let compressedSize = baseSize;
    let qualityScore = 100;
    
    if (profile) {
      const reductionFactor = profile.targetSizeReduction / 100;
      compressedSize = baseSize * (1 - reductionFactor);
      qualityScore = 100 - profile.qualityLoss;
    }
    
    // Calcular estimativas adicionais
    const downloadTime = this.estimateDownloadTime(compressedSize);
    const uploadTime = this.estimateUploadTime(compressedSize);
    
    return {
      originalSize: baseSize,
      compressedSize,
      compressionRatio: baseSize > 0 ? compressedSize / baseSize : 1,
      qualityScore,
      downloadTime,
      uploadTime,
      sizeReduction: baseSize - compressedSize,
      sizeReductionPercentage: baseSize > 0 ? ((baseSize - compressedSize) / baseSize) * 100 : 0
    };
  }

  private calculateBaseSize(settings: ExportSettings, duration: number): number {
    const { resolution, frameRate, videoBitrate, audioBitrate, format } = settings;
    
    // Tamanho do vídeo em bytes
    const videoSize = (videoBitrate * 1000 * duration) / 8;
    
    // Tamanho do áudio em bytes
    const audioSize = (audioBitrate * 1000 * duration) / 8;
    
    // Overhead do container (aproximadamente 2-5%)
    const containerOverhead = (videoSize + audioSize) * 0.03;
    
    let totalSize = videoSize + audioSize + containerOverhead;
    
    // Ajustes específicos por formato
    switch (format) {
      case 'gif':
        // GIF não tem áudio e tem overhead maior
        totalSize = videoSize * 1.2;
        break;
      case 'webm':
        // WebM é mais eficiente
        totalSize *= 0.85;
        break;
      case 'avi':
        // AVI tem overhead maior
        totalSize *= 1.15;
        break;
    }
    
    return Math.round(totalSize);
  }

  private estimateDownloadTime(sizeInBytes: number): number {
    // Assumir velocidade média de download de 50 Mbps
    const speedMbps = 50;
    const speedBytesPerSecond = (speedMbps * 1000000) / 8;
    return sizeInBytes / speedBytesPerSecond;
  }

  private estimateUploadTime(sizeInBytes: number): number {
    // Assumir velocidade média de upload de 10 Mbps
    const speedMbps = 10;
    const speedBytesPerSecond = (speedMbps * 1000000) / 8;
    return sizeInBytes / speedBytesPerSecond;
  }

  // Sugerir configurações de compressão baseadas no tamanho alvo
  public suggestCompressionSettings(
    currentSettings: ExportSettings,
    targetSizeMB: number,
    duration: number
  ): CompressionSettings {
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    const currentEstimate = this.estimateFileSize(currentSettings, duration);
    
    if (currentEstimate.originalSize <= targetSizeBytes) {
      // Já está dentro do tamanho alvo
      return this.profiles.get('high-quality')!.settings;
    }
    
    const requiredReduction = 1 - (targetSizeBytes / currentEstimate.originalSize);
    
    // Encontrar o perfil mais adequado
    let bestProfile = this.profiles.get('maximum')!;
    
    for (const profile of this.profiles.values()) {
      const profileReduction = profile.targetSizeReduction / 100;
      if (profileReduction >= requiredReduction && profile.qualityLoss < bestProfile.qualityLoss) {
        bestProfile = profile;
      }
    }
    
    return bestProfile.settings;
  }

  // Otimizar configurações para uma plataforma específica
  public optimizeForPlatform(
    settings: ExportSettings,
    platform: string,
    duration: number
  ): { settings: ExportSettings; compression: CompressionSettings } {
    const platformLimits = this.getPlatformLimits(platform);
    const optimizedSettings = { ...settings };
    let compressionProfile = 'balanced';
    
    // Ajustar resolução se necessário
    if (platformLimits.maxResolution) {
      const { width, height } = platformLimits.maxResolution;
      if (settings.resolution.width > width || settings.resolution.height > height) {
        const aspectRatio = settings.resolution.width / settings.resolution.height;
        if (aspectRatio > width / height) {
          optimizedSettings.resolution = { width, height: Math.round(width / aspectRatio) };
        } else {
          optimizedSettings.resolution = { width: Math.round(height * aspectRatio), height };
        }
      }
    }
    
    // Ajustar bitrate se necessário
    if (platformLimits.maxBitrate && settings.videoBitrate > platformLimits.maxBitrate) {
      optimizedSettings.videoBitrate = platformLimits.maxBitrate;
    }
    
    // Verificar limite de tamanho de arquivo
    if (platformLimits.maxFileSize) {
      const estimate = this.estimateFileSize(optimizedSettings, duration);
      if (estimate.originalSize > platformLimits.maxFileSize) {
        compressionProfile = 'web-optimized';
        
        // Se ainda estiver muito grande, usar compressão máxima
        const webEstimate = this.estimateFileSize(optimizedSettings, duration, compressionProfile);
        if (webEstimate.compressedSize > platformLimits.maxFileSize) {
          compressionProfile = 'maximum';
        }
      }
    }
    
    return {
      settings: optimizedSettings,
      compression: this.profiles.get(compressionProfile)!.settings
    };
  }

  private getPlatformLimits(platform: string) {
    const limits: Record<string, any> = {
      'YouTube': {
        maxFileSize: 128 * 1024 * 1024 * 1024, // 128GB
        maxBitrate: 68000,
        maxResolution: { width: 7680, height: 4320 } // 8K
      },
      'Instagram': {
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
        maxBitrate: 8000,
        maxResolution: { width: 1920, height: 1920 }
      },
      'TikTok': {
        maxFileSize: 287 * 1024 * 1024, // 287MB
        maxBitrate: 6000,
        maxResolution: { width: 1080, height: 1920 }
      },
      'Facebook': {
        maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
        maxBitrate: 8000,
        maxResolution: { width: 1920, height: 1080 }
      },
      'LinkedIn': {
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        maxBitrate: 5000,
        maxResolution: { width: 1920, height: 1080 }
      },
      'Twitter': {
        maxFileSize: 512 * 1024 * 1024, // 512MB
        maxBitrate: 4000,
        maxResolution: { width: 1920, height: 1200 }
      }
    };
    
    return limits[platform] || {
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB padrão
      maxBitrate: 8000,
      maxResolution: { width: 1920, height: 1080 }
    };
  }

  // Obter todos os perfis de compressão disponíveis
  public getCompressionProfiles(): CompressionProfile[] {
    return Array.from(this.profiles.values());
  }

  // Obter perfil específico
  public getProfile(id: string): CompressionProfile | undefined {
    return this.profiles.get(id);
  }

  // Calcular economia de largura de banda
  public calculateBandwidthSavings(
    originalSize: number,
    compressedSize: number,
    expectedViews: number
  ): {
    totalSavings: number;
    monthlySavings: number;
    costSavings: number; // Assumindo $0.12 por GB
  } {
    const savingsPerView = originalSize - compressedSize;
    const totalSavings = savingsPerView * expectedViews;
    const monthlySavings = totalSavings; // Assumindo que as views são mensais
    const costSavings = (totalSavings / (1024 * 1024 * 1024)) * 0.12; // $0.12 per GB
    
    return {
      totalSavings,
      monthlySavings,
      costSavings
    };
  }

  // Analisar qualidade vs tamanho
  public analyzeQualityVsSize(
    settings: ExportSettings,
    duration: number
  ): Array<{ profile: string; estimate: FileEstimate }> {
    return Array.from(this.profiles.entries()).map(([id, profile]) => ({
      profile: id,
      estimate: this.estimateFileSize(settings, duration, id)
    }));
  }
}

// Instância singleton do engine de compressão
export const compressionEngine = new CompressionEngine();

// Utilitários para formatação
export const CompressionUtils = {
  // Formatar tamanho de arquivo
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  // Formatar tempo
  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  },

  // Calcular taxa de compressão
  calculateCompressionRatio(originalSize: number, compressedSize: number): string {
    if (originalSize === 0) return '1:1';
    const ratio = originalSize / compressedSize;
    return `${ratio.toFixed(1)}:1`;
  },

  // Obter cor baseada na qualidade
  getQualityColor(qualityScore: number): string {
    if (qualityScore >= 90) return 'text-green-600';
    if (qualityScore >= 75) return 'text-yellow-600';
    if (qualityScore >= 60) return 'text-orange-600';
    return 'text-red-600';
  }
};