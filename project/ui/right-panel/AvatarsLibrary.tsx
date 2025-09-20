// Avatar Library Component for Right Panel
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Upload, 
  User, 
  Users, 
  Camera, 
  Heart, 
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Play,
  Volume2
} from 'lucide-react';
import { avatarManager } from '../../providers/avatars';
import { AvatarGenerationRequest, AvatarGenerationResult } from '../../providers/avatars/types';

interface AvatarsLibraryProps {
  onAvatarSelect?: (avatar: AvatarGenerationResult) => void;
  onAvatarDragStart?: (avatar: AvatarGenerationResult, event: React.DragEvent) => void;
  selectedAvatarId?: string;
  className?: string;
}

const AvatarsLibrary: React.FC<AvatarsLibraryProps> = ({
  onAvatarSelect,
  onAvatarDragStart,
  selectedAvatarId,
  className = ''
}) => {
  // State management
  const [avatars, setAvatars] = useState<AvatarGenerationResult[]>([]);
  const [filteredAvatars, setFilteredAvatars] = useState<AvatarGenerationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Configuration
  const ITEMS_PER_PAGE = 8;
  const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
  const MAX_FILE_SIZE_MB = 10;

  // Load avatars on component mount
  useEffect(() => {
    loadAvatars();
  }, []);

  // Filter avatars based on search and filters
  useEffect(() => {
    filterAvatars();
  }, [avatars, searchTerm, selectedCategory, selectedGender]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredAvatars]);

  const loadAvatars = async () => {
    try {
      setIsLoading(true);
      const avatarList = await avatarManager.listAvatars();
      setAvatars(avatarList);
      
      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('avatar_favorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    } catch (error) {
      console.error('[AvatarsLibrary] Failed to load avatars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAvatars = useCallback(() => {
    let filtered = [...avatars];

    // Text search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(avatar => 
        avatar.avatarId.toLowerCase().includes(search) ||
        (avatar.metadata.tags && avatar.metadata.tags.some(tag => 
          tag.toLowerCase().includes(search)
        ))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(avatar => 
        avatar.metadata.tags?.includes(selectedCategory)
      );
    }

    // Gender filter  
    if (selectedGender !== 'all') {
      filtered = filtered.filter(avatar => 
        avatar.metadata.tags?.includes(selectedGender)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => 
      new Date(b.metadata.generated_at).getTime() - new Date(a.metadata.generated_at).getTime()
    );

    setFilteredAvatars(filtered);
  }, [avatars, searchTerm, selectedCategory, selectedGender]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      alert(`Formato não suportado. Use: ${SUPPORTED_FORMATS.join(', ')}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Generate avatar
      const request: AvatarGenerationRequest = {
        photoBase64: base64,
        quality: 'medium',
        style: 'realistic',
        tags: ['custom', 'uploaded']
      };

      const result = await avatarManager.generateAvatar(request);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to avatars list
      setAvatars(prev => [result, ...prev]);
      
      // Auto-select the new avatar
      if (onAvatarSelect) {
        onAvatarSelect(result);
      }

      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);

    } catch (error) {
      console.error('[AvatarsLibrary] Upload failed:', error);
      alert('Erro ao gerar avatar. Tente novamente.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAvatarClick = (avatar: AvatarGenerationResult) => {
    if (onAvatarSelect) {
      onAvatarSelect(avatar);
    }
  };

  const handleDragStart = (avatar: AvatarGenerationResult, event: React.DragEvent) => {
    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'avatar',
      avatarId: avatar.avatarId,
      avatar: avatar
    }));
    
    // Set drag effect
    event.dataTransfer.effectAllowed = 'copy';
    
    if (onAvatarDragStart) {
      onAvatarDragStart(avatar, event);
    }
  };

  const toggleFavorite = (avatarId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(avatarId)) {
      newFavorites.delete(avatarId);
    } else {
      newFavorites.add(avatarId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('avatar_favorites', JSON.stringify([...newFavorites]));
  };

  // Pagination
  const totalPages = Math.ceil(filteredAvatars.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAvatars = filteredAvatars.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getAvatarDisplayName = (avatar: AvatarGenerationResult): string => {
    if (avatar.avatarId.startsWith('avatar_custom_')) {
      const parts = avatar.avatarId.split('_');
      const userId = parts[2] || 'Usuario';
      return `Avatar de ${userId}`;
    }
    
    const nameMap: { [key: string]: string } = {
      'avatar_corporativo_1': 'Avatar Corporativo',
      'avatar_educacao_1': 'Avatar Educação',
      'brazilian-male-1': 'João Silva',
      'brazilian-female-1': 'Maria Santos'
    };
    
    return nameMap[avatar.avatarId] || avatar.avatarId;
  };

  const getCategoryBadgeColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'business': 'bg-blue-100 text-blue-800',
      'education': 'bg-green-100 text-green-800',
      'healthcare': 'bg-red-100 text-red-800',
      'technology': 'bg-purple-100 text-purple-800',
      'custom': 'bg-orange-100 text-orange-800'
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Carregando avatares...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Biblioteca de Avatares</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredAvatars.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Upload Button */}
        <div className="flex-shrink-0">
          <label className="block">
            <input
              type="file"
              accept={SUPPORTED_FORMATS.map(f => `.${f}`).join(',')}
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button 
              className="w-full" 
              disabled={isUploading}
              asChild
            >
              <span className="flex items-center gap-2 cursor-pointer">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Upload Foto → Gerar Avatar</span>
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>

        {/* Search */}
        <div className="flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar avatares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="business">Negócios</SelectItem>
              <SelectItem value="education">Educação</SelectItem>
              <SelectItem value="healthcare">Saúde</SelectItem>
              <SelectItem value="technology">Tecnologia</SelectItem>
              <SelectItem value="custom">Personalizados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Avatar Grid */}
        <div className="flex-1 overflow-y-auto">
          {paginatedAvatars.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {paginatedAvatars.map((avatar) => (
                <div
                  key={avatar.avatarId}
                  className={`relative group cursor-pointer rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedAvatarId === avatar.avatarId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAvatarClick(avatar)}
                  draggable
                  onDragStart={(e) => handleDragStart(avatar, e)}
                >
                  <div className="p-3">
                    {/* Avatar Image */}
                    <div className="relative mb-2">
                      <Avatar className="w-full aspect-square">
                        <AvatarImage 
                          src={avatar.assets.thumbnail} 
                          alt={getAvatarDisplayName(avatar)}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gray-100">
                          <User className="w-6 h-6 text-gray-400" />
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Favorite Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 w-6 h-6 p-0 rounded-full bg-white/80 hover:bg-white shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(avatar.avatarId);
                        }}
                      >
                        <Heart 
                          className={`w-3 h-3 ${
                            favorites.has(avatar.avatarId) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </Button>

                      {/* Status Indicator */}
                      <div className="absolute bottom-1 left-1">
                        {avatar.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
                        )}
                        {avatar.status === 'processing' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin bg-white rounded-full" />
                        )}
                        {avatar.status === 'failed' && (
                          <AlertCircle className="w-4 h-4 text-red-500 bg-white rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* Avatar Info */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-xs truncate">
                        {getAvatarDisplayName(avatar)}
                      </h4>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {avatar.metadata.tags?.slice(0, 2).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className={`text-xs px-1 py-0 ${getCategoryBadgeColor(tag)}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          {avatar.assets.model_3d && (
                            <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                              <ImageIcon className="w-3 h-3" />
                            </Button>
                          )}
                          {avatar.voice_profiles.length > 0 && (
                            <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs h-5 px-2">
                          Usar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Users className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Nenhum avatar encontrado</p>
              <p className="text-xs text-gray-500">Ajuste os filtros ou faça upload de uma foto</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-xs text-gray-600">
              {currentPage} de {totalPages}
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvatarsLibrary;