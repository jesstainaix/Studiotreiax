import React, { useState, useCallback } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { 
  Image, 
  Video, 
  Music, 
  Upload, 
  Search, 
  Filter, 
  Play,
  Download,
  Star,
  Folder,
  Grid,
  List
} from 'lucide-react'

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'audio'
  src: string
  thumbnail?: string
  duration?: number
  size: number
  tags: string[]
  category: string
  createdAt: Date
}

interface MediaLibraryProps {
  onSelectMedia: (media: MediaItem) => void
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectMedia
}) => {
  const [activeTab, setActiveTab] = useState('stock')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Stock media for safety training
  const stockImages: MediaItem[] = [
    {
      id: 'stock-img-1',
      name: 'Safety Equipment',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=500',
      size: 1024000,
      tags: ['safety', 'equipment', 'helmet', 'protection'],
      category: 'safety-equipment',
      createdAt: new Date()
    },
    {
      id: 'stock-img-2',
      name: 'Construction Site',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500',
      size: 856000,
      tags: ['construction', 'building', 'workers', 'site'],
      category: 'workplace',
      createdAt: new Date()
    },
    {
      id: 'stock-img-3',
      name: 'Industrial Equipment',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500',
      size: 923000,
      tags: ['industrial', 'machinery', 'factory', 'equipment'],
      category: 'industrial',
      createdAt: new Date()
    },
    {
      id: 'stock-img-4',
      name: 'Warning Signs',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=500',
      size: 678000,
      tags: ['warning', 'signs', 'caution', 'danger'],
      category: 'signage',
      createdAt: new Date()
    },
    {
      id: 'stock-img-5',
      name: 'Office Environment',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500',
      size: 1156000,
      tags: ['office', 'workplace', 'professional', 'business'],
      category: 'office',
      createdAt: new Date()
    },
    {
      id: 'stock-img-6',
      name: 'Laboratory',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500',
      size: 945000,
      tags: ['laboratory', 'science', 'research', 'medical'],
      category: 'medical',
      createdAt: new Date()
    }
  ]

  const stockVideos: MediaItem[] = [
    {
      id: 'stock-vid-1',
      name: 'Safety Training Demo',
      type: 'video',
      src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=300',
      duration: 30,
      size: 10240000,
      tags: ['safety', 'training', 'demonstration', 'workers'],
      category: 'training',
      createdAt: new Date()
    },
    {
      id: 'stock-vid-2',
      name: 'Equipment Operation',
      type: 'video',
      src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300',
      duration: 45,
      size: 20480000,
      tags: ['equipment', 'operation', 'machinery', 'procedure'],
      category: 'procedures',
      createdAt: new Date()
    }
  ]

  const stockAudio: MediaItem[] = [
    {
      id: 'stock-audio-1',
      name: 'Corporate Background Music',
      type: 'audio',
      src: 'https://www.soundjay.com/misc/sounds/corporate-music.mp3',
      duration: 120,
      size: 5120000,
      tags: ['corporate', 'background', 'professional', 'calm'],
      category: 'background-music',
      createdAt: new Date()
    },
    {
      id: 'stock-audio-2',
      name: 'Alert Sound Effect',
      type: 'audio',
      src: 'https://www.soundjay.com/misc/sounds/alert-sound.mp3',
      duration: 3,
      size: 256000,
      tags: ['alert', 'warning', 'notification', 'attention'],
      category: 'sound-effects',
      createdAt: new Date()
    },
    {
      id: 'stock-audio-3',
      name: 'Success Notification',
      type: 'audio',
      src: 'https://www.soundjay.com/misc/sounds/success-sound.mp3',
      duration: 2,
      size: 128000,
      tags: ['success', 'positive', 'completion', 'achievement'],
      category: 'sound-effects',
      createdAt: new Date()
    }
  ]

  const categories = {
    'all': 'Todos',
    'safety-equipment': 'Equipamentos de Segurança',
    'workplace': 'Ambiente de Trabalho',
    'industrial': 'Industrial',
    'signage': 'Sinalização',
    'office': 'Escritório',
    'medical': 'Médico/Laboratório',
    'training': 'Treinamento',
    'procedures': 'Procedimentos',
    'background-music': 'Música de Fundo',
    'sound-effects': 'Efeitos Sonoros'
  }

  // Filter media based on search and category
  const filterMedia = useCallback((mediaList: MediaItem[]) => {
    return mediaList.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderMediaGrid = (mediaList: MediaItem[]) => {
    const filteredMedia = filterMedia(mediaList)

    if (viewMode === 'list') {
      return (
        <div className="space-y-2">
          {filteredMedia.map(item => (
            <div
              key={item.id}
              className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
              onClick={() => onSelectMedia(item)}
            >
              <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center mr-3">
                {item.type === 'image' && <Image className="w-6 h-6 text-gray-400" />}
                {item.type === 'video' && <Video className="w-6 h-6 text-gray-400" />}
                {item.type === 'audio' && <Music className="w-6 h-6 text-gray-400" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{item.name}</div>
                <div className="text-xs text-gray-400">
                  {formatFileSize(item.size)}
                  {item.duration && ` • ${formatDuration(item.duration)}`}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {item.type === 'video' && (
                  <Button variant="ghost" size="sm" className="p-1">
                    <Play className="w-3 h-3" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="p-1">
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {filteredMedia.map(item => (
          <div
            key={item.id}
            className="relative group cursor-pointer bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors"
            onClick={() => onSelectMedia(item)}
          >
            <div className="aspect-video bg-gray-600 flex items-center justify-center">
              {item.type === 'image' && item.src ? (
                <img
                  src={item.src}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : item.type === 'video' && item.thumbnail ? (
                <div className="relative w-full h-full">
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white opacity-80" />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {item.type === 'image' && <Image className="w-8 h-8 text-gray-400 mx-auto mb-1" />}
                  {item.type === 'video' && <Video className="w-8 h-8 text-gray-400 mx-auto mb-1" />}
                  {item.type === 'audio' && <Music className="w-8 h-8 text-gray-400 mx-auto mb-1" />}
                  <div className="text-xs text-gray-400">{item.type.toUpperCase()}</div>
                </div>
              )}
            </div>

            <div className="p-2">
              <div className="text-xs font-medium text-white truncate">{item.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {formatFileSize(item.size)}
                {item.duration && ` • ${formatDuration(item.duration)}`}
              </div>
            </div>

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-2">
                {item.type === 'video' && (
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                  <Star className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="media-library h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Biblioteca de Mídia</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-1 text-gray-400 hover:text-white"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar mídia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white text-sm"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          {Object.entries(categories).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-gray-700 mx-4 mt-2">
            <TabsTrigger value="stock" className="text-xs">Stock</TabsTrigger>
            <TabsTrigger value="uploads" className="text-xs">Uploads</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">IA</TabsTrigger>
            <TabsTrigger value="pptx" className="text-xs">PPTX</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="stock" className="mt-0 h-full">
              <Tabs defaultValue="images" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-gray-600 mb-4">
                  <TabsTrigger value="images" className="text-xs">
                    <Image className="w-3 h-3 mr-1" />
                    Imagens
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="text-xs">
                    <Video className="w-3 h-3 mr-1" />
                    Vídeos
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="text-xs">
                    <Music className="w-3 h-3 mr-1" />
                    Áudio
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="images" className="flex-1 mt-0">
                  {renderMediaGrid(stockImages)}
                </TabsContent>

                <TabsContent value="videos" className="flex-1 mt-0">
                  {renderMediaGrid(stockVideos)}
                </TabsContent>

                <TabsContent value="audio" className="flex-1 mt-0">
                  {renderMediaGrid(stockAudio)}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="uploads" className="mt-0">
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-400 mb-4">Faça upload dos seus arquivos</p>
                <Button variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Upload
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-400 mb-4">Gere mídia com IA</p>
                <Button variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-700">
                  <Star className="w-4 h-4 mr-2" />
                  Gerar com IA
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pptx" className="mt-0">
              <div className="text-center py-8">
                <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-400 mb-4">Mídia extraída do PPTX</p>
                <p className="text-xs text-gray-500">
                  Imagens e vídeos da apresentação aparecerão aqui
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}