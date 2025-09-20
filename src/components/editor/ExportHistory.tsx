import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, 
  Download, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  FileVideo, 
  HardDrive, 
  Settings,
  Star,
  StarOff,
  Share2,
  Copy,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ExportRecord {
  id: string;
  projectName: string;
  fileName: string;
  format: string;
  resolution: string;
  quality: string;
  codec: string;
  fileSize: number;
  duration: number;
  exportTime: number; // milliseconds
  createdAt: Date;
  status: 'completed' | 'failed' | 'cancelled';
  outputPath: string;
  settings: {
    bitrate: number;
    framerate: number;
    audioCodec: string;
    audioBitrate: number;
    watermark: boolean;
    platform?: string;
  };
  thumbnail?: string;
  favorite: boolean;
  tags: string[];
  notes?: string;
}

interface ExportHistoryProps {
  onReExport: (record: ExportRecord) => void;
  onClose: () => void;
}

const mockExportHistory: ExportRecord[] = [
  {
    id: '1',
    projectName: 'Vídeo Tutorial React',
    fileName: 'tutorial-react-final.mp4',
    format: 'MP4',
    resolution: '1920x1080',
    quality: 'Alta',
    codec: 'H.264',
    fileSize: 245760000, // 245MB
    duration: 600, // 10 minutes
    exportTime: 120000, // 2 minutes
    createdAt: new Date('2024-01-15T14:30:00'),
    status: 'completed',
    outputPath: '/exports/tutorial-react-final.mp4',
    settings: {
      bitrate: 8000,
      framerate: 30,
      audioCodec: 'AAC',
      audioBitrate: 192,
      watermark: true,
      platform: 'YouTube'
    },
    favorite: true,
    tags: ['tutorial', 'react', 'programação'],
    notes: 'Versão final para upload no YouTube'
  },
  {
    id: '2',
    projectName: 'Apresentação Empresa',
    fileName: 'apresentacao-q4.mov',
    format: 'MOV',
    resolution: '3840x2160',
    quality: 'Ultra',
    codec: 'H.265',
    fileSize: 1073741824, // 1GB
    duration: 900, // 15 minutes
    exportTime: 480000, // 8 minutes
    createdAt: new Date('2024-01-14T09:15:00'),
    status: 'completed',
    outputPath: '/exports/apresentacao-q4.mov',
    settings: {
      bitrate: 25000,
      framerate: 24,
      audioCodec: 'AAC',
      audioBitrate: 320,
      watermark: false
    },
    favorite: false,
    tags: ['apresentação', 'corporativo'],
    notes: 'Versão 4K para projeção'
  },
  {
    id: '3',
    projectName: 'Story Instagram',
    fileName: 'story-promocao.mp4',
    format: 'MP4',
    resolution: '1080x1920',
    quality: 'Média',
    codec: 'H.264',
    fileSize: 52428800, // 50MB
    duration: 15, // 15 seconds
    exportTime: 8000, // 8 seconds
    createdAt: new Date('2024-01-13T16:45:00'),
    status: 'completed',
    outputPath: '/exports/story-promocao.mp4',
    settings: {
      bitrate: 3500,
      framerate: 30,
      audioCodec: 'AAC',
      audioBitrate: 128,
      watermark: true,
      platform: 'Instagram Stories'
    },
    favorite: false,
    tags: ['instagram', 'stories', 'promoção']
  },
  {
    id: '4',
    projectName: 'Demo Produto',
    fileName: 'demo-produto-v2.webm',
    format: 'WebM',
    resolution: '1280x720',
    quality: 'Média',
    codec: 'VP9',
    fileSize: 89128960, // 85MB
    duration: 300, // 5 minutes
    exportTime: 95000, // 1m35s
    createdAt: new Date('2024-01-12T11:20:00'),
    status: 'failed',
    outputPath: '/exports/demo-produto-v2.webm',
    settings: {
      bitrate: 2000,
      framerate: 25,
      audioCodec: 'Opus',
      audioBitrate: 128,
      watermark: false
    },
    favorite: false,
    tags: ['demo', 'produto', 'web']
  }
];

const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const formatExportTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

const getStatusColor = (status: ExportRecord['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: ExportRecord['status']) => {
  switch (status) {
    case 'completed': return '✓';
    case 'failed': return '✗';
    case 'cancelled': return '⊘';
    default: return '?';
  }
};

export const ExportHistory: React.FC<ExportHistoryProps> = ({ onReExport, onClose }) => {
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>(mockExportHistory);
  const [filteredHistory, setFilteredHistory] = useState<ExportRecord[]>(mockExportHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [selectedRecord, setSelectedRecord] = useState<ExportRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load export history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('exportHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory).map((record: any) => ({
          ...record,
          createdAt: new Date(record.createdAt)
        }));
        setExportHistory(parsed);
        setFilteredHistory(parsed);
      } catch (error) {
        console.error('Error loading export history:', error);
      }
    }
  }, []);

  // Save export history to localStorage
  const saveHistory = (history: ExportRecord[]) => {
    localStorage.setItem('exportHistory', JSON.stringify(history));
  };

  // Filter and sort history
  useEffect(() => {
    const filtered = exportHistory.filter(record => {
      const matchesSearch = record.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesFormat = formatFilter === 'all' || record.format === formatFilter;
      
      return matchesSearch && matchesStatus && matchesFormat;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'name-asc':
          return a.projectName.localeCompare(b.projectName);
        case 'name-desc':
          return b.projectName.localeCompare(a.projectName);
        case 'size-desc':
          return b.fileSize - a.fileSize;
        case 'size-asc':
          return a.fileSize - b.fileSize;
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  }, [exportHistory, searchTerm, statusFilter, formatFilter, sortBy]);

  const toggleFavorite = (id: string) => {
    const updated = exportHistory.map(record => 
      record.id === id ? { ...record, favorite: !record.favorite } : record
    );
    setExportHistory(updated);
    saveHistory(updated);
  };

  const deleteRecord = (id: string) => {
    const updated = exportHistory.filter(record => record.id !== id);
    setExportHistory(updated);
    saveHistory(updated);
  };

  const clearHistory = () => {
    setExportHistory([]);
    setFilteredHistory([]);
    saveHistory([]);
  };

  const exportHistoryData = () => {
    const dataStr = JSON.stringify(exportHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export-history.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const copySettings = (record: ExportRecord) => {
    const settingsText = JSON.stringify(record.settings, null, 2);
    navigator.clipboard.writeText(settingsText);
  };

  const openFile = (record: ExportRecord) => {
    // In a real app, this would open the file or show its location
  };

  const shareRecord = (record: ExportRecord) => {
    // In a real app, this would share the export details
    const shareText = `Exportei "${record.projectName}" em ${record.format} (${record.resolution}) - ${formatFileSize(record.fileSize)}`;
    navigator.clipboard.writeText(shareText);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Histórico de Exportações</h2>
          <Badge variant="secondary">{filteredHistory.length} registros</Badge>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={exportHistoryData}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nome, arquivo, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Formato</Label>
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="MP4">MP4</SelectItem>
                  <SelectItem value="MOV">MOV</SelectItem>
                  <SelectItem value="AVI">AVI</SelectItem>
                  <SelectItem value="WebM">WebM</SelectItem>
                  <SelectItem value="GIF">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Data (Recente)</SelectItem>
                  <SelectItem value="date-asc">Data (Antigo)</SelectItem>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="size-desc">Tamanho (Maior)</SelectItem>
                  <SelectItem value="size-asc">Tamanho (Menor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export History List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <History className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma exportação encontrada</p>
                <p className="text-sm">Suas exportações aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredHistory.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Thumbnail/Icon */}
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {record.thumbnail ? (
                            <img src={record.thumbnail} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <FileVideo className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">{record.projectName}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(record.id)}
                              className="p-1 h-auto"
                            >
                              {record.favorite ? (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              ) : (
                                <StarOff className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate">{record.fileName}</p>
                          
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {record.createdAt.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDuration(record.duration)}
                            </span>
                            <span className="flex items-center">
                              <HardDrive className="w-3 h-3 mr-1" />
                              {formatFileSize(record.fileSize)}
                            </span>
                          </div>
                          
                          {/* Tags */}
                          {record.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {record.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {record.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{record.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Status and Format */}
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getStatusColor(record.status)}>
                              {getStatusIcon(record.status)} {record.status === 'completed' ? 'Concluído' : record.status === 'failed' ? 'Falhou' : 'Cancelado'}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            {record.format} • {record.resolution}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {record.codec} • {formatExportTime(record.exportTime)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detalhes
                        </Button>
                        
                        {record.status === 'completed' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onReExport(record)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Re-exportar
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openFile(record)}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Abrir arquivo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copySettings(record)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar configurações
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => shareRecord(record)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Compartilhar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteRecord(record.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Exportação</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
                <TabsTrigger value="notes">Notas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Projeto</Label>
                    <p className="text-sm font-medium">{selectedRecord.projectName}</p>
                  </div>
                  <div>
                    <Label>Nome do Arquivo</Label>
                    <p className="text-sm font-medium">{selectedRecord.fileName}</p>
                  </div>
                  <div>
                    <Label>Formato</Label>
                    <p className="text-sm">{selectedRecord.format}</p>
                  </div>
                  <div>
                    <Label>Resolução</Label>
                    <p className="text-sm">{selectedRecord.resolution}</p>
                  </div>
                  <div>
                    <Label>Codec</Label>
                    <p className="text-sm">{selectedRecord.codec}</p>
                  </div>
                  <div>
                    <Label>Qualidade</Label>
                    <p className="text-sm">{selectedRecord.quality}</p>
                  </div>
                  <div>
                    <Label>Tamanho do Arquivo</Label>
                    <p className="text-sm">{formatFileSize(selectedRecord.fileSize)}</p>
                  </div>
                  <div>
                    <Label>Duração</Label>
                    <p className="text-sm">{formatDuration(selectedRecord.duration)}</p>
                  </div>
                  <div>
                    <Label>Tempo de Exportação</Label>
                    <p className="text-sm">{formatExportTime(selectedRecord.exportTime)}</p>
                  </div>
                  <div>
                    <Label>Data de Criação</Label>
                    <p className="text-sm">{selectedRecord.createdAt.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Caminho do Arquivo</Label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedRecord.outputPath}</p>
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRecord.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bitrate de Vídeo</Label>
                    <p className="text-sm">{selectedRecord.settings.bitrate} kbps</p>
                  </div>
                  <div>
                    <Label>Taxa de Quadros</Label>
                    <p className="text-sm">{selectedRecord.settings.framerate} fps</p>
                  </div>
                  <div>
                    <Label>Codec de Áudio</Label>
                    <p className="text-sm">{selectedRecord.settings.audioCodec}</p>
                  </div>
                  <div>
                    <Label>Bitrate de Áudio</Label>
                    <p className="text-sm">{selectedRecord.settings.audioBitrate} kbps</p>
                  </div>
                  <div>
                    <Label>Watermark</Label>
                    <p className="text-sm">{selectedRecord.settings.watermark ? 'Sim' : 'Não'}</p>
                  </div>
                  {selectedRecord.settings.platform && (
                    <div>
                      <Label>Plataforma</Label>
                      <p className="text-sm">{selectedRecord.settings.platform}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label>Configurações Completas (JSON)</Label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedRecord.settings, null, 2)}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm mt-1">
                    {selectedRecord.notes || 'Nenhuma nota adicionada.'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            {selectedRecord?.status === 'completed' && (
              <Button onClick={() => {
                onReExport(selectedRecord);
                setShowDetails(false);
              }}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Re-exportar
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};