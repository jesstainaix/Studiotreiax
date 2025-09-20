import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Pin, 
  MessageCircle, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Plus,
  X,
  Save,
  Palette,
  Move,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import { ProjectAnnotation } from '../../types/collaboration';
import { toast } from 'sonner';
import { VirtualizedList } from '../ui/VirtualizedList';

interface TimelineAnnotationsProps {
  projectId: string;
  timelinePosition: number;
  duration: number;
  zoom: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onSeekTo: (time: number) => void;
}

interface Annotation {
  id: string;
  content: string;
  timestamp: number;
  duration?: number; // Para anotações que se estendem por um período
  position: {
    x: number; // Posição horizontal no timeline (0-100%)
    y: number; // Posição vertical (0-100%)
  };
  color: string;
  type: 'point' | 'range' | 'marker';
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  isVisible: boolean;
  metadata?: {
    elementId?: string;
    layer?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

interface NewAnnotationData {
  content: string;
  timestamp: number;
  duration?: number;
  color: string;
  type: 'point' | 'range' | 'marker';
  position: { x: number; y: number };
}

const ANNOTATION_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280'  // gray
];

export function TimelineAnnotations({ 
  projectId, 
  timelinePosition, 
  duration, 
  zoom, 
  isVisible, 
  onToggleVisibility,
  onSeekTo 
}: TimelineAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState<Partial<NewAnnotationData>>({
    content: '',
    type: 'point',
    color: ANNOTATION_COLORS[0],
    timestamp: 0,
    position: { x: 50, y: 50 }
  });
  const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<'all' | 'point' | 'range' | 'marker'>('all');
  const [loading, setLoading] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const annotationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadAnnotations();
  }, [projectId]);

  useEffect(() => {
    if (showCreateModal) {
      setNewAnnotation(prev => ({
        ...prev,
        timestamp: timelinePosition
      }));
    }
  }, [showCreateModal, timelinePosition]);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      
      // Simular carregamento de anotações
      const mockAnnotations: Annotation[] = [
        {
          id: '1',
          content: 'Início da introdução',
          timestamp: 0,
          position: { x: 5, y: 20 },
          color: '#3b82f6',
          type: 'marker',
          author: {
            id: 'user1',
            name: 'Maria Silva'
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isVisible: true,
          metadata: {
            priority: 'high'
          }
        },
        {
          id: '2',
          content: 'Transição precisa ser ajustada',
          timestamp: 15.5,
          position: { x: 25, y: 60 },
          color: '#ef4444',
          type: 'point',
          author: {
            id: 'user2',
            name: 'João Santos'
          },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          isVisible: true,
          metadata: {
            priority: 'medium'
          }
        },
        {
          id: '3',
          content: 'Sequência de ação principal',
          timestamp: 30,
          duration: 25,
          position: { x: 40, y: 30 },
          color: '#22c55e',
          type: 'range',
          author: {
            id: 'user3',
            name: 'Pedro Costa'
          },
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          isVisible: true,
          metadata: {
            priority: 'high'
          }
        },
        {
          id: '4',
          content: 'Adicionar música de fundo',
          timestamp: 45,
          position: { x: 60, y: 80 },
          color: '#8b5cf6',
          type: 'point',
          author: {
            id: 'user1',
            name: 'Maria Silva'
          },
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
          isVisible: true,
          metadata: {
            priority: 'low'
          }
        }
      ];
      
      setAnnotations(mockAnnotations);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
      toast.error('Erro ao carregar anotações');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnotation = async () => {
    if (!newAnnotation.content?.trim()) {
      toast.error('Digite o conteúdo da anotação');
      return;
    }

    try {
      const annotationData: Annotation = {
        id: Date.now().toString(),
        content: newAnnotation.content.trim(),
        timestamp: newAnnotation.timestamp || timelinePosition,
        duration: newAnnotation.duration,
        position: newAnnotation.position || { x: 50, y: 50 },
        color: newAnnotation.color || ANNOTATION_COLORS[0],
        type: newAnnotation.type || 'point',
        author: {
          id: 'current-user',
          name: 'Você'
        },
        createdAt: new Date(),
        isVisible: true
      };

      setAnnotations(prev => [...prev, annotationData]);
      setShowCreateModal(false);
      setNewAnnotation({
        content: '',
        type: 'point',
        color: ANNOTATION_COLORS[0],
        timestamp: 0,
        position: { x: 50, y: 50 }
      });
      toast.success('Anotação criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar anotação:', error);
      toast.error('Erro ao criar anotação');
    }
  };

  const handleUpdateAnnotation = async (id: string, updates: Partial<Annotation>) => {
    try {
      setAnnotations(prev => prev.map(annotation => 
        annotation.id === id 
          ? { ...annotation, ...updates, updatedAt: new Date() }
          : annotation
      ));
      toast.success('Anotação atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar anotação:', error);
      toast.error('Erro ao atualizar anotação');
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;

    try {
      setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
      toast.success('Anotação excluída!');
    } catch (error) {
      console.error('Erro ao excluir anotação:', error);
      toast.error('Erro ao excluir anotação');
    }
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotation(annotation.id);
    onSeekTo(annotation.timestamp);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, annotationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation) return;

    setDraggedAnnotation(annotationId);
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDragOffset({
        x: x - annotation.position.x,
        y: y - annotation.position.y
      });
    }
  }, [annotations]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedAnnotation || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y));
    
    // Calcular novo timestamp baseado na posição X
    const newTimestamp = (x / 100) * duration;
    
    handleUpdateAnnotation(draggedAnnotation, {
      position: { x, y },
      timestamp: newTimestamp
    });
  }, [draggedAnnotation, dragOffset, duration]);

  const handleMouseUp = useCallback(() => {
    setDraggedAnnotation(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (draggedAnnotation) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedAnnotation, handleMouseMove, handleMouseUp]);

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnnotationIcon = (type: Annotation['type']) => {
    switch (type) {
      case 'point': return <MessageCircle className="w-3 h-3" />;
      case 'range': return <AlertCircle className="w-3 h-3" />;
      case 'marker': return <Pin className="w-3 h-3" />;
    }
  };

  const filteredAnnotations = annotations.filter(annotation => {
    if (!annotation.isVisible) return false;
    if (filter === 'all') return true;
    return annotation.type === filter;
  });

  const visibleAnnotations = filteredAnnotations.filter(annotation => {
    const startTime = Math.max(0, (timelinePosition - 30) / zoom);
    const endTime = Math.min(duration, (timelinePosition + 30) / zoom);
    
    if (annotation.type === 'range' && annotation.duration) {
      return annotation.timestamp < endTime && 
             (annotation.timestamp + annotation.duration) > startTime;
    }
    
    return annotation.timestamp >= startTime && annotation.timestamp <= endTime;
  });

  return (
    <div className="relative w-full h-full">
      {/* Controles */}
      <div className="absolute top-2 right-2 z-20 flex items-center space-x-2">
        {/* Filtros */}
        <div className="flex bg-white rounded-md shadow-sm border border-gray-200">
          {(['all', 'point', 'range', 'marker'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-2 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                filter === filterType
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {filterType === 'all' ? 'Todos' :
               filterType === 'point' ? 'Pontos' :
               filterType === 'range' ? 'Intervalos' : 'Marcadores'}
            </button>
          ))}
        </div>
        
        {/* Botão adicionar */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          title="Adicionar anotação"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        {/* Toggle visibilidade */}
        <button
          onClick={onToggleVisibility}
          className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          title={isVisible ? 'Ocultar anotações' : 'Mostrar anotações'}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Timeline com anotações */}
      {isVisible && (
        <div 
          ref={timelineRef}
          className="absolute inset-0 pointer-events-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {visibleAnnotations.map((annotation) => {
            const leftPosition = (annotation.timestamp / duration) * 100;
            const width = annotation.type === 'range' && annotation.duration 
              ? (annotation.duration / duration) * 100 
              : 0;

            return (
              <div key={annotation.id}>
                {/* Anotação principal */}
                <div
                  ref={el => annotationRefs.current[annotation.id] = el}
                  className={`absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10 ${
                    selectedAnnotation === annotation.id ? 'scale-110' : ''
                  } ${
                    draggedAnnotation === annotation.id ? 'z-20' : ''
                  }`}
                  style={{
                    left: `${leftPosition}%`,
                    top: `${annotation.position.y}%`,
                    backgroundColor: annotation.color
                  }}
                  onClick={() => handleAnnotationClick(annotation)}
                  onMouseDown={(e) => handleMouseDown(e, annotation.id)}
                  title={annotation.content}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                    {getAnnotationIcon(annotation.type)}
                  </div>
                  
                  {/* Tooltip */}
                  {selectedAnnotation === annotation.id && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30">
                      <div className="font-medium">{annotation.content}</div>
                      <div className="text-gray-300">
                        {formatTimestamp(annotation.timestamp)}
                        {annotation.duration && ` - ${formatTimestamp(annotation.timestamp + annotation.duration)}`}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                    </div>
                  )}
                </div>
                
                {/* Barra de intervalo para anotações do tipo 'range' */}
                {annotation.type === 'range' && annotation.duration && (
                  <div
                    className="absolute pointer-events-none h-1 opacity-50 z-5"
                    style={{
                      left: `${leftPosition}%`,
                      top: `${annotation.position.y}%`,
                      width: `${width}%`,
                      backgroundColor: annotation.color,
                      transform: 'translateY(-50%)'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-[90vw]">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Nova Anotação</h4>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <div className="flex space-x-2">
                  {(['point', 'range', 'marker'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewAnnotation(prev => ({ ...prev, type }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        newAnnotation.type === type
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getAnnotationIcon(type)}
                      <span>
                        {type === 'point' ? 'Ponto' :
                         type === 'range' ? 'Intervalo' : 'Marcador'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Conteúdo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={newAnnotation.content || ''}
                  onChange={(e) => setNewAnnotation(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo da anotação..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
              
              {/* Timestamp */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo (segundos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={newAnnotation.timestamp || 0}
                    onChange={(e) => setNewAnnotation(prev => ({ 
                      ...prev, 
                      timestamp: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {newAnnotation.type === 'range' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração (segundos)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={newAnnotation.duration || 1}
                      onChange={(e) => setNewAnnotation(prev => ({ 
                        ...prev, 
                        duration: parseFloat(e.target.value) || 1 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              
              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                </label>
                <div className="flex space-x-2">
                  {ANNOTATION_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewAnnotation(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newAnnotation.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAnnotation}
                disabled={!newAnnotation.content?.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Criar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de anotações (sidebar) */}
      {selectedAnnotation && (
        <div className="absolute top-0 right-0 w-64 h-full bg-white border-l border-gray-200 shadow-lg z-30 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Anotações</h4>
              <button
                onClick={() => setSelectedAnnotation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <VirtualizedList
              items={filteredAnnotations}
              itemHeight={120}
              containerHeight={400}
              keyExtractor={(annotation) => annotation.id}
              renderItem={(annotation) => (
                <div className="p-2">
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnnotation === annotation.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnnotationClick(annotation)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: annotation.color }}
                        />
                        {getAnnotationIcon(annotation.type)}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAnnotation(annotation.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnnotation(annotation.id);
                          }}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{annotation.content}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(annotation.timestamp)}</span>
                        {annotation.duration && (
                          <span>- {formatTimestamp(annotation.timestamp + annotation.duration)}</span>
                        )}
                      </span>
                      <span>{annotation.author.name}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}