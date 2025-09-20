import React, { useState, useMemo } from 'react';
import { PlatformPreset } from '../../types/export';
import { platformPresets, availablePlatforms, availableCategories } from '../../data/platformPresets';
import { Monitor, Smartphone, Square, Film, Search, Filter } from 'lucide-react';

interface PresetSelectorProps {
  selectedPreset?: PlatformPreset;
  onPresetSelect: (preset: PlatformPreset) => void;
  className?: string;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPreset,
  onPresetSelect,
  className = ''
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar presets baseado nos filtros selecionados
  const filteredPresets = useMemo(() => {
    return platformPresets.filter(preset => {
      const matchesPlatform = selectedPlatform === 'all' || preset.platform === selectedPlatform;
      const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
      const matchesSearch = searchTerm === '' || 
        preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preset.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesPlatform && matchesCategory && matchesSearch;
    });
  }, [selectedPlatform, selectedCategory, searchTerm]);

  // Ícones para categorias
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'video': return <Monitor className="w-4 h-4" />;
      case 'vertical': return <Smartphone className="w-4 h-4" />;
      case 'square': return <Square className="w-4 h-4" />;
      case 'animation': return <Film className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // Cores para plataformas
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'YouTube': return 'bg-red-500';
      case 'Instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'TikTok': return 'bg-black';
      case 'Facebook': return 'bg-blue-600';
      case 'LinkedIn': return 'bg-blue-700';
      case 'Web': return 'bg-green-500';
      case 'Universal': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header com filtros */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Presets de Plataforma</h3>
        
        {/* Barra de pesquisa */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar presets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {/* Filtro de Plataforma */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Plataformas</option>
              {availablePlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Categoria */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Categorias</option>
              <option value="video">Vídeo Horizontal</option>
              <option value="vertical">Vídeo Vertical</option>
              <option value="square">Formato Quadrado</option>
              <option value="animation">Animação</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de presets */}
      <div className="p-4">
        {filteredPresets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Film className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum preset encontrado</p>
            <p className="text-sm">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPresets.map(preset => (
              <div
                key={preset.id}
                onClick={() => onPresetSelect(preset)}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                  ${
                    selectedPreset?.id === preset.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {/* Badge da plataforma */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{preset.icon}</span>
                    <div className={`w-2 h-2 rounded-full ${getPlatformColor(preset.platform)}`}></div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    {getCategoryIcon(preset.category)}
                  </div>
                </div>

                {/* Nome e plataforma */}
                <h4 className="font-semibold text-gray-900 mb-1">{preset.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{preset.platform}</p>
                
                {/* Descrição */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{preset.description}</p>
                
                {/* Especificações técnicas */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Resolução:</span>
                    <span>{preset.settings.resolution.width}x{preset.settings.resolution.height}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>FPS:</span>
                    <span>{preset.settings.frameRate}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Formato:</span>
                    <span className="uppercase">{preset.settings.format}</span>
                  </div>
                  {preset.settings.videoBitrate > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Bitrate:</span>
                      <span>{preset.settings.videoBitrate}k</span>
                    </div>
                  )}
                </div>

                {/* Indicador de seleção */}
                {selectedPreset?.id === preset.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações do preset selecionado */}
      {selectedPreset && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Configurações Selecionadas</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Formato:</span>
              <p className="font-medium uppercase">{selectedPreset.settings.format}</p>
            </div>
            <div>
              <span className="text-gray-600">Resolução:</span>
              <p className="font-medium">
                {selectedPreset.settings.resolution.width}x{selectedPreset.settings.resolution.height}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Taxa de Quadros:</span>
              <p className="font-medium">{selectedPreset.settings.frameRate} fps</p>
            </div>
            <div>
              <span className="text-gray-600">Qualidade:</span>
              <p className="font-medium capitalize">{selectedPreset.settings.quality}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetSelector;