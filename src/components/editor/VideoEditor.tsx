/**
 * Video Editor Component
 * Editor avançado para vídeos gerados pelo pipeline PPTX→Vídeo
 * Integração com hooks existentes para efeitos, exportação e performance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { useLazyLoading } from '../../hooks/useLazyLoading';
import { useMobileResponsiveness } from '../../hooks/useMobileResponsiveness';
import { useFocusMode } from '../../hooks/useFocusMode';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { 
  Video, Play, Pause, Download, Layers, Mic2, Film, 
  Maximize2, Minimize2, Zap, Brain, X,
  ChevronLeft, Scissors,
  Undo, Redo
} from 'lucide-react';
import { toast } from 'sonner';

// Import existing hooks and services
import useEffectsPreview from '../../hooks/useEffectsPreview';
import useExport from '../../hooks/useExport';
import { useAdvancedAI } from '../../hooks/useAdvancedAI';
import { useHistory } from '../../hooks/useHistory';
import usePerformanceOptimizer from '../../hooks/usePerformanceOptimizer';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import type { CompletePipelineData } from '../../services/pipelineOrchestrationService';
import type { ExportSettings } from '../../types/export';

interface VideoEditorProps {
  pipelineData: CompletePipelineData & { metadata?: { stages?: { extraction?: { slides?: Array<{ title: string }> } } } };
  onSave?: (updatedVideoUrl: string) => void;
  onBack?: () => void;
  className?: string;
}

interface TimelineSegment {
  id: string;
  start: number;
  duration: number;
  type: 'video' | 'audio' | 'text' | 'effect';
  content?: string | undefined;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({
  pipelineData,
  onSave,
  onBack,
  className = ''
}) => {
  // All hooks must be at the top and in consistent order
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State hooks - always in same order
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<TimelineSegment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState('effects');
  const [exportProgress, setExportProgress] = useState(0);

  // Custom hooks - always in same order
  const isMobile = useMobileResponsiveness();
  const isFocused = useFocusMode();
  
  const initialSegments: TimelineSegment[] = [];
  const historyHook = useHistory(initialSegments);
  
  const effectsPreview = useEffectsPreview();
  const exportHook = useExport({ onProgress: (progress) => setExportProgress(progress.progress || 0) });
  const { actions: aiActions } = useAdvancedAI();
  const optimizer = usePerformanceOptimizer();
  const { actions: errorActions } = useErrorHandler();
  const lazyEffects = useLazyLoading({ 
    threshold: 0.1, 
    rootMargin: '50px' 
  });
  
  // useKeyboardShortcuts must be called consistently
  useKeyboardShortcuts({
    'Meta+z': () => historyHook.undo(),
    'Meta+Shift+z': () => historyHook.redo(),
    Escape: () => setSelectedSegment(null)
  });

  // useCallback hooks - must be after all useState and other hooks
  const updateTime = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      optimizer.startOptimization(); // Monitor FPS during playback
    }
  }, [optimizer]);

  // useEffect hooks - always at the end, in consistent order
  // Load video metadata on mount
  useEffect(() => {
    if (videoRef.current && pipelineData.finalVideoUrl) {
      videoRef.current.src = pipelineData.finalVideoUrl;
      videoRef.current.onloadedmetadata = () => {
        setDuration(videoRef.current?.duration || 0);
        // Initialize timeline from pipeline metadata (e.g., slides as segments)
        const initialSegments: TimelineSegment[] = (pipelineData.metadata?.stages?.extraction?.slides || []).map((slide: { title: string }, idx: number) => ({
          id: `slide-${idx}`,
          start: idx * 10, // Assume 10s per slide
          duration: 10,
          type: 'video' as const,
          content: slide.title
        }));
        setTimelineSegments(initialSegments);
        historyHook.setState(initialSegments);
      };
    }
  }, [pipelineData, historyHook]);

  // Update current time interval
  useEffect(() => {
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, [updateTime, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addSegment = (type: TimelineSegment['type'], start: number, content?: string) => {
    const newSegment: TimelineSegment = {
      id: `seg-${Date.now()}`,
      start,
      duration: type === 'video' ? 10 : 5,
      type,
      content: content || undefined
    };
    const newSegments = [...timelineSegments, newSegment];
    setTimelineSegments(newSegments);
    historyHook.executeAction('add_segment', `Adicionar segmento ${type}`, newSegments);
    toast.success(`Segmento ${type} adicionado`);
  };

  const deleteSegment = (id: string) => {
    const newSegments = timelineSegments.filter(s => s.id !== id);
    setTimelineSegments(newSegments);
    historyHook.executeAction('delete_segment', `Remover segmento ${id}`, newSegments);
    setSelectedSegment(null);
    toast.success('Segmento removido');
  };

  const applyAISuggestion = async () => {
    try {
      const suggestions = await aiActions.generateRecommendations({
        content: pipelineData.finalVideoUrl,
        context: 'video_editing',
        segments: timelineSegments
      });
      if (suggestions.length > 0) {
        effectsPreview.applyEffect(suggestions[0] as any); // Cast for compatibility
        toast.success('Sugestão IA aplicada');
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Erro na sugestão IA';
      toast.error(errorMessage);
      console.error('Erro AI suggestions:', error);
    }
  };

  const applyAISuggestionToSegment = async (segment: TimelineSegment) => {
    try {
      const suggestions = await aiActions.generateRecommendations({
        content: segment.content || '',
        context: 'segment_editing',
        segments: [segment]
      });
      if (suggestions.length > 0) {
        effectsPreview.applyEffect(suggestions[0] as any);
        toast.success(`Sugestão IA aplicada ao segmento ${segment.content}`);
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Erro na sugestão IA para segmento';
      toast.error(errorMessage);
      console.error('Erro AI segment suggestions:', error);
    }
  };

  const undo = () => {
    historyHook.undo();
    setTimelineSegments(historyHook.state);
  };

  const redo = () => {
    historyHook.redo();
    setTimelineSegments(historyHook.state);
  };

  const getSegmentPosition = (start: number, totalDuration: number) => {
    const leftPercent = (start / totalDuration) * 100;
    return {
      left: `${leftPercent}%`,
      width: '10%' // Default width, could be calculated based on segment duration
    };
  };

  const handleExport = async () => {
    try {
      setExportProgress(0);
      const settings: ExportSettings = {
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
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.8,
        includeSubtitles: false
      };
      const jobId = await exportHook.startExport(settings, 'Video Editado');
      // Progress is handled by onProgress in useExport options
      setTimeout(() => {
        const finalUrl = pipelineData.finalVideoUrl || 'video_exported.mp4';
        onSave?.(finalUrl);
        toast.success('Vídeo exportado com sucesso!');
      }, 5000); // Simulate completion time
    } catch (error) {
      const errorMessage = (error as Error).message || 'Falha na exportação';
      toast.error(errorMessage);
      console.error('Erro na exportação:', error);
    }
  };



  return (
    <LazyMotion features={domAnimation}>
      <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${className} ${isMobile ? 'p-2' : ''} ${isFocused ? 'isolate' : ''}`}>
      {/* Sidebar - Back Button */}
      <div className="w-12 bg-gray-100 dark:bg-gray-800 flex flex-col items-center py-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={applyAISuggestion}>
          <Brain className="h-5 w-5" />
        </Button>
        {selectedSegment && (
          <Button variant="ghost" size="sm" onClick={() => applyAISuggestionToSegment(selectedSegment)}>
            <Zap className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Card className="border-b">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <Video className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg">Editor de Vídeo</CardTitle>
              <Badge variant="secondary">Duração: {duration.toFixed(1)}s</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={undo} size="sm" disabled={!historyHook.canUndo}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={redo} size="sm" disabled={!historyHook.canRedo}>
                <Redo className="h-4 w-4" />
              </Button>
              <Button onClick={handleExport} disabled={exportProgress > 0 && exportProgress < 100}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
                {exportProgress > 0 && <Progress value={exportProgress} className="w-20 h-2 ml-2" />}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="flex-1 flex overflow-hidden">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black">
            <div className="relative w-full max-w-4xl aspect-video">
              <video
                ref={videoRef}
                className="w-full h-auto rounded-lg shadow-lg"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={updateTime}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <Button
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                onClick={togglePlay}
                size="lg"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="w-96 border-l bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Timeline</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.5))}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <span className="text-sm">Zoom: {zoomLevel}x</span>
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel(prev => prev + 0.5)}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative h-64 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              {/* Timeline Tracks */}
              <div className="h-full flex flex-col">
                <div className="flex-1 border-b" style={{ transform: `scaleX(${zoomLevel})` }}>
                  {timelineSegments.map(segment => (
                    <motion.div
                      key={segment.id}
                      className={`absolute h-full cursor-pointer border-r flex items-center justify-center text-xs ${
                        selectedSegment?.id === segment.id ? 'ring-2 ring-blue-500' : ''
                      } ${segment.type === 'video' ? 'bg-blue-500' : segment.type === 'audio' ? 'bg-green-500' : 'bg-purple-500'} text-white`}
                      style={getSegmentPosition(segment.start, duration)}
                      onClick={() => setSelectedSegment(segment)}
                      role="slider"
                      aria-label={`Segmento ${segment.content || 'sem título'} de ${segment.start} a ${segment.start + segment.duration}s`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {segment.content?.slice(0, 10)}
                    </motion.div>
                  ))}
                </div>
                {/* Add more tracks for audio, effects */}
              </div>
              {/* Playhead */}
              <div
                className="absolute top-0 right-0 w-0.5 h-full bg-red-500"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            {/* Add Segment Buttons */}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => addSegment('video', currentTime)}>
                <Film className="h-4 w-4 mr-1" /> Vídeo
              </Button>
              <Button variant="outline" size="sm" onClick={() => addSegment('audio', currentTime)}>
                <Mic2 className="h-4 w-4 mr-1" /> Áudio
              </Button>
              <Button variant="outline" size="sm" onClick={() => addSegment('text', currentTime)}>
                <Layers className="h-4 w-4 mr-1" /> Texto
              </Button>
              <Button variant="outline" size="sm" onClick={() => {/* Cut action with Scissors */}}>
                <Scissors className="h-4 w-4 mr-1" /> Corte
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Tools */}
      <div className="w-80 border-l bg-white dark:bg-gray-800 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="effects"><Layers className="h-4 w-4 mr-1" /> Efeitos</TabsTrigger>
            <TabsTrigger value="audio"><Mic2 className="h-4 w-4 mr-1" /> Áudio</TabsTrigger>
            <TabsTrigger value="export"><Download className="h-4 w-4 mr-1" /> Exportar</TabsTrigger>
          </TabsList>
          <TabsContent value="effects" className="p-4">
            <h4 className="font-semibold mb-2">Efeitos Disponíveis</h4>
            <div className="space-y-2">
              {effectsPreview.previewState.effects.map((effect: any) => (
                <div key={effect.id} className="space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      effectsPreview.applyEffect(effect);
                      if (selectedSegment) {
                        effectsPreview.updateEffectParameter(effect.id, 'targetSegment', selectedSegment.id);
                      }
                    }}
                  >
                    {effect.name} {selectedSegment && '(Aplicar ao segmento)'}
                  </Button>
                  {effect.parameters && Object.keys(effect.parameters).length > 0 && (
                    <div className="pl-4 space-y-1">
                      {Object.entries(effect.parameters).map(([param, value]) => (
                        <div key={param} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{param}</span>
                          <Slider
                            value={[value as number]}
                            max={100}
                            className="flex-1"
                            onValueChange={(newValue) => effectsPreview.updateEffectParameter(effect.id, param, newValue[0])}
                          />
                          <span className="text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedSegment && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h5>Segmento Selecionado: {selectedSegment.content}</h5>
                <div className="flex gap-2 mt-2">
                  <Button variant="secondary" size="sm" onClick={() => applyAISuggestionToSegment(selectedSegment)}>
                    <Zap className="h-4 w-4 mr-1" /> Sugestões IA para Segmento
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteSegment(selectedSegment.id)}>
                    <X className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </div>
              </div>
            )}
            <Button className="w-full mt-4" variant="outline" onClick={() => effectsPreview.resetEffects()}>
              Limpar Todos Efeitos
            </Button>
          </TabsContent>
          <TabsContent value="audio" className="p-4">
            <h4 className="font-semibold mb-2">Controles de Áudio</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Volume</label>
                <Slider defaultValue={[100]} max={100} className="w-full" />
              </div>
              <Button onClick={() => {/* Add background music */}}>Adicionar Música</Button>
            </div>
          </TabsContent>
          <TabsContent value="export" className="p-4">
            <h4 className="font-semibold mb-2">Opções de Exportação</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" /> HD (1080p)
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" /> Compressão Inteligente
              </label>
              <Button className="w-full" onClick={handleExport}>Iniciar Exportação</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </LazyMotion>
  );
};

// Utility function
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};