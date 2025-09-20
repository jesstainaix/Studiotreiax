import React, { useState, useCallback } from 'react';
import { Download, X, FileVideo, Film, Video, Smartphone, Monitor, Globe, Image } from 'lucide-react';
// import PresetSelector from './PresetSelector'; // Not used currently

interface LocalExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ReactNode;
  description: string;
  codecs: string[];
}

interface LocalPlatformPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  format: string;
  resolution: string;
  frameRate: number;
  bitrate: string;
  aspectRatio: string;
  maxDuration?: string;
}

interface LocalExportSettings {
  format: string;
  resolution: string;
  frameRate: number;
  quality: string;
  codec: string;
  bitrate: string;
  audioFormat: string;
  audioBitrate: string;
  includeWatermark: boolean;
  watermarkText: string;
  watermarkPosition: string;
}

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: LocalExportSettings) => void;
  projectDuration: number;
  estimatedFileSize?: string;
}

const exportFormats: LocalExportFormat[] = [
  {
    id: 'mp4',
    name: 'MP4',
    extension: '.mp4',
    icon: <FileVideo className="w-5 h-5" />,
    description: 'Formato universal, compatível com todas as plataformas',
    codecs: ['H.264', 'H.265']
  },
  {
    id: 'mov',
    name: 'MOV',
    extension: '.mov',
    icon: <Film className="w-5 h-5" />,
    description: 'Formato Apple QuickTime, alta qualidade',
    codecs: ['H.264', 'ProRes']
  },
  {
    id: 'avi',
    name: 'AVI',
    extension: '.avi',
    icon: <Video className="w-5 h-5" />,
    description: 'Formato clássico, sem compressão',
    codecs: ['H.264', 'MJPEG']
  },
  {
    id: 'webm',
    name: 'WebM',
    extension: '.webm',
    icon: <Globe className="w-5 h-5" />,
    description: 'Formato web otimizado, código aberto',
    codecs: ['VP9', 'VP8']
  },
  {
    id: 'gif',
    name: 'GIF',
    extension: '.gif',
    icon: <Image className="w-5 h-5" />,
    description: 'Animação para web e redes sociais',
    codecs: ['GIF']
  }
];

const platformPresets: LocalPlatformPreset[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: <Monitor className="w-5 h-5" />,
    format: 'mp4',
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: '8000k',
    aspectRatio: '16:9'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Smartphone className="w-5 h-5" />,
    format: 'mp4',
    resolution: '1080x1080',
    frameRate: 30,
    bitrate: '3500k',
    aspectRatio: '1:1',
    maxDuration: '60s'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <Smartphone className="w-5 h-5" />,
    format: 'mp4',
    resolution: '1080x1920',
    frameRate: 30,
    bitrate: '2000k',
    aspectRatio: '9:16',
    maxDuration: '180s'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Globe className="w-5 h-5" />,
    format: 'mp4',
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: '4000k',
    aspectRatio: '16:9'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Monitor className="w-5 h-5" />,
    format: 'mp4',
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: '5000k',
    aspectRatio: '16:9',
    maxDuration: '600s'
  }
];

const resolutionOptions = [
  { value: '3840x2160', label: '4K (3840x2160)' },
  { value: '2560x1440', label: '2K (2560x1440)' },
  { value: '1920x1080', label: 'Full HD (1920x1080)' },
  { value: '1280x720', label: 'HD (1280x720)' },
  { value: '854x480', label: 'SD (854x480)' },
  { value: '1080x1080', label: 'Quadrado (1080x1080)' },
  { value: '1080x1920', label: 'Vertical (1080x1920)' }
];

const qualityOptions = [
  { value: 'ultra', label: 'Ultra (Melhor qualidade)', bitrate: '50000k' },
  { value: 'high', label: 'Alta', bitrate: '25000k' },
  { value: 'medium', label: 'Média', bitrate: '8000k' },
  { value: 'low', label: 'Baixa (Menor arquivo)', bitrate: '2000k' }
];

export const ExportPanel: React.FC<ExportPanelProps> = ({
  isOpen,
  onClose,
  onExport,
  projectDuration,
  estimatedFileSize
}) => {
  const [selectedTab, setSelectedTab] = useState<'formats' | 'presets' | 'advanced'>('presets');
  // const [showAdvanced, setShowAdvanced] = useState(false); // Not used currently
  const [showPresets, setShowPresets] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [settings, setSettings] = useState<LocalExportSettings>({
    format: 'mp4',
    resolution: '1920x1080',
    frameRate: 30,
    quality: 'high',
    codec: 'H.264',
    bitrate: '8000k',
    audioFormat: 'AAC',
    audioBitrate: '320k',
    includeWatermark: false,
    watermarkText: '',
    watermarkPosition: 'bottom-right'
  });

  const handlePresetSelect = useCallback((preset: LocalPlatformPreset) => {
    setSelectedPreset(preset.id);
    setSettings(prev => ({
      ...prev,
      format: preset.format,
      resolution: preset.resolution,
      frameRate: preset.frameRate,
      bitrate: preset.bitrate
    }));
  }, []);

  const handleFormatSelect = useCallback((format: LocalExportFormat) => {
    setSelectedFormat(format.id);
    setSettings(prev => ({
      ...prev,
      format: format.id,
      codec: format.codecs[0] || 'H.264'
    }));
  }, []);

  const handleSettingChange = useCallback((key: keyof LocalExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback(() => {
    onExport(settings);
  }, [settings, onExport]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Exportar Vídeo</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                showPresets ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Presets
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <div className="p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedTab('presets')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedTab === 'presets'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Presets de Plataforma
                </button>
                <button
                  onClick={() => setSelectedTab('formats')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedTab === 'formats'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Formatos
                </button>
                <button
                  onClick={() => setSelectedTab('advanced')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedTab === 'advanced'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Configurações Avançadas
                </button>
              </div>
            </div>

            {/* Project Info */}
            <div className="p-4 border-t">
              <h3 className="font-medium text-gray-900 mb-2">Informações do Projeto</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Duração: {formatDuration(projectDuration)}</div>
                {estimatedFileSize && (
                  <div>Tamanho estimado: {estimatedFileSize}</div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Preset Selector will be rendered in presets tab */}
              {selectedTab === 'presets' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Presets para Plataformas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platformPresets.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPreset === preset.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          {preset.icon}
                          <h4 className="font-medium">{preset.name}</h4>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Resolução: {preset.resolution}</div>
                          <div>Taxa de quadros: {preset.frameRate} fps</div>
                          <div>Proporção: {preset.aspectRatio}</div>
                          {preset.maxDuration && (
                            <div>Duração máxima: {preset.maxDuration}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'formats' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Formatos de Exportação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exportFormats.map((format) => (
                      <div
                        key={format.id}
                        onClick={() => handleFormatSelect(format)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          {format.icon}
                          <h4 className="font-medium">{format.name}</h4>
                          <span className="text-sm text-gray-500">{format.extension}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                        <div className="text-sm text-gray-500">
                          Codecs: {format.codecs.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'advanced' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Configurações Avançadas</h3>
                  
                  {/* Video Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Configurações de Vídeo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resolução
                        </label>
                        <select
                          value={settings.resolution}
                          onChange={(e) => handleSettingChange('resolution', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {resolutionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Taxa de Quadros
                        </label>
                        <select
                          value={settings.frameRate}
                          onChange={(e) => handleSettingChange('frameRate', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={24}>24 fps</option>
                          <option value={30}>30 fps</option>
                          <option value={60}>60 fps</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Qualidade
                        </label>
                        <select
                          value={settings.quality}
                          onChange={(e) => handleSettingChange('quality', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {qualityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Codec
                        </label>
                        <select
                          value={settings.codec}
                          onChange={(e) => handleSettingChange('codec', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="H.264">H.264</option>
                          <option value="H.265">H.265 (HEVC)</option>
                          <option value="VP9">VP9</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Audio Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Configurações de Áudio</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Formato de Áudio
                        </label>
                        <select
                          value={settings.audioFormat}
                          onChange={(e) => handleSettingChange('audioFormat', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AAC">AAC</option>
                          <option value="MP3">MP3</option>
                          <option value="WAV">WAV</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bitrate de Áudio
                        </label>
                        <select
                          value={settings.audioBitrate}
                          onChange={(e) => handleSettingChange('audioBitrate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="128k">128 kbps</option>
                          <option value="192k">192 kbps</option>
                          <option value="256k">256 kbps</option>
                          <option value="320k">320 kbps</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Watermark Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Marca d'Água</h4>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="watermark"
                          checked={settings.includeWatermark}
                          onChange={(e) => handleSettingChange('includeWatermark', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="watermark" className="text-sm font-medium text-gray-700">
                          Incluir marca d'água
                        </label>
                      </div>
                      
                      {settings.includeWatermark && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Texto da Marca d'Água
                            </label>
                            <input
                              type="text"
                              value={settings.watermarkText}
                              onChange={(e) => handleSettingChange('watermarkText', e.target.value)}
                              placeholder="Digite o texto da marca d'água"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Posição
                            </label>
                            <select
                              value={settings.watermarkPosition}
                              onChange={(e) => handleSettingChange('watermarkPosition', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="top-left">Superior Esquerda</option>
                              <option value="top-right">Superior Direita</option>
                              <option value="bottom-left">Inferior Esquerda</option>
                              <option value="bottom-right">Inferior Direita</option>
                              <option value="center">Centro</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Configurações atuais: {settings.format.toUpperCase()} • {settings.resolution} • {settings.frameRate}fps
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;