import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Download, Search, Filter, Volume2, Clock, Tag, Star, Plus, Trash2 } from 'lucide-react';

interface SoundEffect {
  id: string;
  name: string;
  category: string;
  tags: string[];
  duration: number;
  url: string;
  preview_url: string;
  bpm?: number;
  key?: string;
  description: string;
  rating: number;
  downloads: number;
  size: number;
  format: string;
  license: 'free' | 'premium' | 'royalty-free';
  author: string;
  created_at: string;
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
  offset: number;
  duration: number;
}

interface AudioEffect {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

interface SoundEffectsLibraryProps {
  onAddToTrack: (effect: SoundEffect, trackId?: string) => void;
  audioTracks: AudioTrack[];
  currentTime: number;
}

const soundCategories = {
  ambient: { name: 'Ambiente', icon: '🌿', color: 'bg-green-600' },
  music: { name: 'Música', icon: '🎵', color: 'bg-blue-600' },
  sfx: { name: 'Efeitos Sonoros', icon: '💥', color: 'bg-red-600' },
  voice: { name: 'Voz', icon: '🎤', color: 'bg-purple-600' },
  nature: { name: 'Natureza', icon: '🌊', color: 'bg-teal-600' },
  urban: { name: 'Urbano', icon: '🏙️', color: 'bg-gray-600' },
  electronic: { name: 'Eletrônico', icon: '🔊', color: 'bg-pink-600' },
  cinematic: { name: 'Cinematográfico', icon: '🎬', color: 'bg-yellow-600' }
};

const mockSoundEffects: SoundEffect[] = [
  {
    id: '1',
    name: 'Rain on Window',
    category: 'ambient',
    tags: ['rain', 'window', 'peaceful', 'relaxing'],
    duration: 120,
    url: '/sounds/rain-window.mp3',
    preview_url: '/sounds/rain-window-preview.mp3',
    description: 'Gentle rain falling on a window, perfect for relaxing scenes',
    rating: 4.8,
    downloads: 1250,
    size: 2.4,
    format: 'MP3',
    license: 'royalty-free',
    author: 'SoundScape Studio',
    created_at: '2024-01-15'
  },
  {
    id: '2',
    name: 'Epic Orchestral Hit',
    category: 'cinematic',
    tags: ['epic', 'orchestral', 'dramatic', 'impact'],
    duration: 3,
    url: '/sounds/epic-hit.wav',
    preview_url: '/sounds/epic-hit-preview.mp3',
    bpm: 120,
    key: 'C',
    description: 'Powerful orchestral impact for dramatic moments',
    rating: 4.9,
    downloads: 3420,
    size: 0.8,
    format: 'WAV',
    license: 'premium',
    author: 'Epic Sounds Co.',
    created_at: '2024-01-10'
  },
  {
    id: '3',
    name: 'City Traffic',
    category: 'urban',
    tags: ['traffic', 'city', 'cars', 'urban'],
    duration: 180,
    url: '/sounds/city-traffic.mp3',
    preview_url: '/sounds/city-traffic-preview.mp3',
    description: 'Busy city street with traffic sounds',
    rating: 4.2,
    downloads: 890,
    size: 3.1,
    format: 'MP3',
    license: 'free',
    author: 'Urban Audio',
    created_at: '2024-01-08'
  },
  {
    id: '4',
    name: 'Synth Bass Loop',
    category: 'electronic',
    tags: ['synth', 'bass', 'loop', 'electronic'],
    duration: 8,
    url: '/sounds/synth-bass.wav',
    preview_url: '/sounds/synth-bass-preview.mp3',
    bpm: 128,
    key: 'Am',
    description: 'Deep synthesizer bass loop',
    rating: 4.6,
    downloads: 2100,
    size: 1.2,
    format: 'WAV',
    license: 'royalty-free',
    author: 'ElectroBeats',
    created_at: '2024-01-12'
  },
  {
    id: '5',
    name: 'Forest Birds',
    category: 'nature',
    tags: ['birds', 'forest', 'nature', 'peaceful'],
    duration: 240,
    url: '/sounds/forest-birds.mp3',
    preview_url: '/sounds/forest-birds-preview.mp3',
    description: 'Various bird songs in a peaceful forest setting',
    rating: 4.7,
    downloads: 1680,
    size: 4.2,
    format: 'MP3',
    license: 'free',
    author: 'Nature Sounds',
    created_at: '2024-01-05'
  }
];

export const SoundEffectsLibrary: React.FC<SoundEffectsLibraryProps> = ({
  onAddToTrack,
  audioTracks,
  currentTime
}) => {
  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>(mockSoundEffects);
  const [filteredEffects, setFilteredEffects] = useState<SoundEffect[]>(mockSoundEffects);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'duration'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [playingEffect, setPlayingEffect] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [licenseFilter, setLicenseFilter] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<{ min: number; max: number }>({ min: 0, max: 300 });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.7);

  // Get all unique tags
  const allTags = Array.from(new Set(soundEffects.flatMap(effect => effect.tags)));

  // Filter and sort effects
  useEffect(() => {
    let filtered = soundEffects;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(effect => effect.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(effect => 
        effect.name.toLowerCase().includes(query) ||
        effect.description.toLowerCase().includes(query) ||
        effect.tags.some(tag => tag.toLowerCase().includes(query)) ||
        effect.author.toLowerCase().includes(query)
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(effect => 
        selectedTags.every(tag => effect.tags.includes(tag))
      );
    }

    // License filter
    if (licenseFilter !== 'all') {
      filtered = filtered.filter(effect => effect.license === licenseFilter);
    }

    // Duration filter
    filtered = filtered.filter(effect => 
      effect.duration >= durationFilter.min && effect.duration <= durationFilter.max
    );

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEffects(filtered);
  }, [soundEffects, selectedCategory, searchQuery, selectedTags, licenseFilter, durationFilter, sortBy, sortOrder]);

  const playPreview = useCallback(async (effect: SoundEffect) => {
    if (playingEffect === effect.id) {
      // Stop current preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingEffect(null);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new audio element for preview
      const audio = new Audio(effect.preview_url);
      audio.volume = volume;
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setPlayingEffect(null);
      });

      audio.addEventListener('error', () => {
        console.error('Error playing preview:', effect.name);
        setPlayingEffect(null);
      });

      setPlayingEffect(effect.id);
      await audio.play();
    } catch (error) {
      console.error('Error playing preview:', error);
      setPlayingEffect(null);
    }
  }, [playingEffect, volume]);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingEffect(null);
  }, []);

  const toggleFavorite = useCallback((effectId: string) => {
    setFavorites(prev => 
      prev.includes(effectId)
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (mb: number): string => {
    return `${mb.toFixed(1)} MB`;
  };

  const getLicenseColor = (license: string): string => {
    switch (license) {
      case 'free': return 'text-green-400';
      case 'premium': return 'text-yellow-400';
      case 'royalty-free': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const SoundEffectCard: React.FC<{ effect: SoundEffect }> = ({ effect }) => {
    const category = soundCategories[effect.category as keyof typeof soundCategories];
    const isPlaying = playingEffect === effect.id;
    const isFavorite = favorites.includes(effect.id);

    return (
      <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{effect.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`px-2 py-1 rounded ${category.color} text-white`}>
                {category.icon} {category.name}
              </span>
              <span className={getLicenseColor(effect.license)}>
                {effect.license}
              </span>
            </div>
          </div>
          <button
            onClick={() => toggleFavorite(effect.id)}
            className={`p-1 rounded transition-colors ${
              isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{effect.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {effect.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-700 text-xs rounded">
              {tag}
            </span>
          ))}
          {effect.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-400">
              +{effect.tags.length - 3}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(effect.duration)}
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {effect.downloads}
          </div>
          {effect.bpm && (
            <div>BPM: {effect.bpm}</div>
          )}
          {effect.key && (
            <div>Key: {effect.key}</div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= effect.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {effect.rating.toFixed(1)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => playPreview(effect)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-colors ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Preview
              </>
            )}
          </button>
          
          <div className="relative">
            <button
              onClick={() => onAddToTrack(effect)}
              className="p-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              title="Adicionar ao projeto"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Author and size */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>by {effect.author}</span>
          <span>{formatFileSize(effect.size)} • {effect.format}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Biblioteca de Efeitos Sonoros</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded transition-colors ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          {playingEffect && (
            <button
              onClick={stopPreview}
              className="p-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
              title="Parar preview"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar efeitos sonoros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Todos
          </button>
          {Object.entries(soundCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedCategory === key
                  ? `${category.color} text-white`
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h4 className="text-sm font-medium mb-3">Filtros</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sort */}
            <div>
              <label className="block text-xs font-medium mb-1">Ordenar por:</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="rating-desc">Avaliação (maior)</option>
                <option value="rating-asc">Avaliação (menor)</option>
                <option value="downloads-desc">Downloads (maior)</option>
                <option value="downloads-asc">Downloads (menor)</option>
                <option value="duration-desc">Duração (maior)</option>
                <option value="duration-asc">Duração (menor)</option>
                <option value="name-asc">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
              </select>
            </div>

            {/* License */}
            <div>
              <label className="block text-xs font-medium mb-1">Licença:</label>
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="all">Todas</option>
                <option value="free">Gratuito</option>
                <option value="royalty-free">Royalty-free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium mb-1">Duração máxima:</label>
              <input
                type="range"
                min="1"
                max="300"
                value={durationFilter.max}
                onChange={(e) => setDurationFilter(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-400">{formatDuration(durationFilter.max)}</div>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-medium mb-2">Tags:</label>
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 20).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Tag className="w-3 h-3 mr-1 inline" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Volume Control */}
      <div className="mb-4 flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm text-gray-400 w-12">{Math.round(volume * 100)}%</span>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-400">
        {filteredEffects.length} efeito(s) encontrado(s)
        {selectedCategory !== 'all' && ` em ${soundCategories[selectedCategory as keyof typeof soundCategories].name}`}
      </div>

      {/* Effects Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredEffects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEffects.map(effect => (
              <SoundEffectCard key={effect.id} effect={effect} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum efeito encontrado</p>
            <p className="text-sm text-center">
              Tente ajustar os filtros ou usar termos de busca diferentes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundEffectsLibrary;