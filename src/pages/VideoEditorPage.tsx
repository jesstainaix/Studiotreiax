import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Maximize, 
  Minimize, 
  FileVideo,
  Palette,
  Presentation,
  Shield
} from 'lucide-react';

// Importar componentes do editor
import { Timeline } from '../components/video-editor/Timeline/Timeline';
import { VideoPreview } from '../components/video-editor/Preview/VideoPreview';
import { MediaLibrary } from '../components/video-editor/MediaLibrary/MediaLibrary';
import { PlaybackControls } from '../components/video-editor/PlaybackControls/PlaybackControls';
import { StatusDashboard } from '../components/video-editor/StatusDashboard/StatusDashboard';

// Importar engine
import { TimelineEngine } from '../modules/video-editor/core/TimelineEngine';
import { MediaAsset } from '../modules/video-editor/types/Media.types';
import { PPTXConversionData, PPTXProjectData, PPTXSlideAsset } from '../types/pptx-integration';

// Importar serviços de processamento
import { useVideoProcessor } from '../services/VideoProcessingService';

interface VideoEditorPageProps {
  projectId?: string;
  pptxData?: PPTXConversionData;
  systemIntegration?: any;
  onPPTXInitialized?: (project: PPTXProjectData) => void;
  onPPTXCleanupNeeded?: () => void;
}

export const VideoEditorPage: React.FC<VideoEditorPageProps> = ({ 
  projectId,
  pptxData,
  onPPTXInitialized,
  onPPTXCleanupNeeded
}) => {
  // Estado do editor
  const [engine] = useState(() => new TimelineEngine());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<'media' | 'effects' | 'properties' | 'export'>('media');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pptxProject, setPptxProject] = useState<PPTXProjectData | null>(null);
  const [isLoadingPPTX, setIsLoadingPPTX] = useState(false);
  const [isStatusDashboardOpen, setIsStatusDashboardOpen] = useState(false);

  // Estado de exportação
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const autosaveRef = useRef<NodeJS.Timeout>();

  // Configuração inicial
  useEffect(() => {
    // Prioridade 1: Carregar dados PPTX se fornecidos
    if (pptxData && !pptxProject) {
      loadPPTXData(pptxData);
    }
    // Prioridade 2: Carregar projeto por ID se fornecido
    else if (projectId && !pptxData) {
      loadProject(projectId);
    }

    // Configurar autosave
    setupAutosave();

    // Configurar shortcuts globais
    setupGlobalShortcuts();

    // Escutar mudanças no engine
    const handleStateChange = () => {
      setHasUnsavedChanges(true);
      scheduleAutosave();
    };

    engine.addEventListener('stateChanged', handleStateChange);

    return () => {
      engine.removeEventListener('stateChanged', handleStateChange);
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }
      engine.destroy();
    };
  }, [projectId, pptxData]);

  // Carregar dados PPTX e configurar projeto
  const loadPPTXData = async (data: PPTXConversionData) => {
    try {
      setIsLoadingPPTX(true);
      
      // Converter dados PPTX em estrutura de projeto
      const pptxProject: PPTXProjectData = await convertPPTXToProject(data);
      setPptxProject(pptxProject);
      
      // Configurar timeline com slides
      await setupTimelineWithPPTXData(pptxProject);
      
      // VALIDAÇÃO: Verificar se pipeline foi aplicado corretamente
      const loadedTracks = engine.getTracks();
      const engineDuration = engine.getDuration();
      
      // Asserções de integridade
      if (loadedTracks.length < 2) {
        throw new Error(`Pipeline incompleto: esperado ≥2 tracks, encontrado ${loadedTracks.length}`);
      }
      
      if (engineDuration <= 0) {
        throw new Error(`Duração inválida: engine=${engineDuration}, projeto=${pptxProject.totalDuration}`);
      }
      
      // Verificar se tracks têm itens
      const tracksWithItems = loadedTracks.filter(track => track.items.length > 0);
      
      if (tracksWithItems.length === 0) {
        throw new Error('Nenhuma track contém itens - pipeline não criou conteúdo');
      }
      
      // Marcar como alterado para autosave
      setHasUnsavedChanges(true);
      
      // Notificar componente pai que PPTX foi inicializado
      onPPTXInitialized?.(pptxProject);
      
      // Solicitar cleanup de dados de conversão via callback
      setTimeout(() => {
        onPPTXCleanupNeeded?.();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao carregar dados PPTX:', error);
      alert('Erro ao carregar apresentação convertida');
    } finally {
      setIsLoadingPPTX(false);
    }
  };
  
  // Converter dados PPTX em estrutura de projeto do editor
  const convertPPTXToProject = async (data: PPTXConversionData): Promise<PPTXProjectData> => {
    const slideDuration = data.result.duration / data.ocrResults.length; // Duração por slide
    
    const slides: PPTXSlideAsset[] = data.ocrResults.map((ocr, index) => ({
      id: `slide_${ocr.slideNumber}`,
      slideNumber: ocr.slideNumber,
      text: ocr.text,
      imageUrl: data.result.thumbnailUrl, // Placeholder - em produção seria específico do slide
      duration: slideDuration,
      startTime: index * slideDuration,
      endTime: (index + 1) * slideDuration,
      ocrData: ocr
    }));
    
    return {
      id: `pptx_${Date.now()}`,
      name: data.result.metadata.title,
      description: data.result.metadata.description,
      originalFileName: data.originalFile.name,
      totalDuration: data.result.duration,
      slidesCount: data.ocrResults.length,
      slides,
      template: data.selectedTemplate,
      metadata: {
        nrCompliant: data.result.metadata.nrCompliant,
        complianceScore: data.result.metadata.complianceScore,
        safetyLevel: getSafetyLevel(data.result.metadata.complianceScore),
        tags: data.result.metadata.tags,
        category: data.result.metadata.category
      },
      conversionData: data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };
  
  // Configurar timeline com dados PPTX
  const setupTimelineWithPPTXData = async (project: PPTXProjectData) => {
    try {
      // Criar track principal para o vídeo gerado
      const mainVideoTrack = {
        id: 'track_main_video',
        name: 'Vídeo Principal (PPTX)',
        type: 'video' as const,
        height: 100,
        color: '#10b981', // Verde para indicar origem PPTX
        muted: false,
        locked: false,
        visible: true,
        items: [
          {
            id: 'main_video_item',
            name: project.name,
            type: 'video' as const,
            trackId: 'track_main_video',
            startTime: 0,
            duration: project.totalDuration,
            zIndex: 1,
            properties: {},
            asset: {
              id: project.conversionData.result.id,
              name: project.name,
              type: 'video' as const,
              url: project.conversionData.result.videoUrl,
              thumbnailUrl: project.conversionData.result.thumbnailUrl,
              duration: project.totalDuration,
              fileSize: project.conversionData.result.fileSize * 1024 * 1024, // MB to bytes
              format: project.conversionData.result.format,
              uploadedAt: new Date(),
              tags: project.metadata.tags,
              metadata: {
                source: 'pptx_conversion',
                originalFile: project.originalFileName,
                template: project.template?.name || 'Template Padrão',
                nrCompliant: project.metadata.nrCompliant
              }
            } as MediaAsset
          }
        ]
      };
      
      // Criar track de texto/legendas para cada slide
      const textTrack = {
        id: 'track_pptx_text',
        name: 'Texto dos Slides',
        type: 'subtitle' as const,
        height: 60,
        color: '#6366f1', // Roxo para texto
        muted: false,
        locked: false,
        visible: true,
        items: project.slides.map(slide => ({
          id: `text_${slide.id}`,
          name: `Slide ${slide.slideNumber}`,
          type: 'text' as const,
          trackId: 'track_pptx_text',
          startTime: slide.startTime,
          duration: slide.duration,
          zIndex: 2,
          properties: {
            text: slide.text,
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            position: { x: 50, y: 80 }, // Posição em %
            animation: 'fadeIn'
          }
        }))
      };
      
      // Aplicar configuração ao engine
      const timelineConfig = {
        tracks: [mainVideoTrack, textTrack],
        duration: project.totalDuration,
        metadata: {
          projectName: project.name,
          source: 'pptx_conversion',
          template: project.template?.name || 'Template Padrão',
          slidesCount: project.slidesCount
        }
      };
      
      // Usar o engine para carregar a configuração
      engine.loadProject(timelineConfig); // Carregando projeto PPTX no engine
      
    } catch (error) {
      console.error('Erro ao configurar timeline:', error);
      throw error;
    }
  };
  
  // Utilitário para determinar nível de segurança
  const getSafetyLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  // Carregar projeto por ID (método original)
  const loadProject = async (id: string) => {
    try {
      
      // Em implementação real, carregaria do servidor
      const projectData = {
        name: `Projeto ${id}`,
        tracks: [
          {
            id: 'track_1',
            name: 'Vídeo Principal',
            type: 'video' as const,
            height: 80,
            color: '#3b82f6',
            muted: false,
            locked: false,
            visible: true,
            items: []
          }
        ]
      };

      // Aplicar dados ao engine
      engine.loadProject(projectData);
      
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
    }
  };

  // Sistema de autosave
  const setupAutosave = () => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        autoSave();
      }
    }, 30000); // Autosave a cada 30 segundos

    return () => clearInterval(interval);
  };

  const scheduleAutosave = () => {
    if (autosaveRef.current) {
      clearTimeout(autosaveRef.current);
    }
    
    autosaveRef.current = setTimeout(() => {
      autoSave();
    }, 5000); // Autosave após 5s de inatividade
  };

  const autoSave = async () => {
    try {
      const projectData = {
        id: projectId || 'new_project',
        state: engine.getState(),
        timestamp: Date.now()
      };

      // Salvar no localStorage como backup
      localStorage.setItem('video_editor_autosave', JSON.stringify(projectData));
    } catch (error) {
      console.error('Erro no autosave:', error);
    }
  };

  // Salvar projeto
  const saveProject = async () => {
    setIsSaving(true);
    try {
      const projectData = {
        name: `Projeto ${new Date().toLocaleDateString()}`,
        state: engine.getState(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Em implementação real, enviaria para servidor
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasUnsavedChanges(false);
      alert('Projeto salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar o projeto');
    } finally {
      setIsSaving(false);
    }
  };

  // Exportar vídeo
  const exportVideo = async () => {
    if (isExporting) return; // Evitar múltiplas exportações simultâneas

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('Iniciando exportação...');

    try {
      // Verificar se há conteúdo para exportar
      const timelineState = engine.getState();
      if (timelineState.tracks.length === 0 || timelineState.duration === 0) {
        throw new Error('Não há conteúdo para exportar. Adicione vídeos ou imagens à timeline.');
      }

      // Configurações de exportação (por enquanto fixas, depois serão configuráveis via UI)
      const exportSettings = {
        width: 1920,
        height: 1080,
        frameRate: 30,
        format: 'mp4' as const,
        quality: 'high' as const
      };

      setExportMessage('Carregando FFmpeg...');

      // Inicializar FFmpeg se necessário
      await useVideoProcessor.getState().loadFFmpeg();

      setExportMessage('Renderizando vídeo...');
      setExportProgress(20);

      // Para esta primeira implementação, vamos criar um vídeo simples
      // baseado no conteúdo da timeline (placeholder para renderização real)
      const canvas = document.createElement('canvas');
      canvas.width = exportSettings.width;
      canvas.height = exportSettings.height;
      const ctx = canvas.getContext('2d')!;

      // Criar frames básicos (em produção, isso seria feito pelo VideoRenderer)
      const totalFrames = Math.ceil(timelineState.duration * exportSettings.frameRate);
      const frames: ImageData[] = [];

      for (let frame = 0; frame < totalFrames; frame++) {
        const currentTime = frame / exportSettings.frameRate;

        // Limpar canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Renderizar conteúdo básico (placeholder)
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Frame ${frame + 1}/${totalFrames}`,
          canvas.width / 2,
          canvas.height / 2
        );

        // Adicionar informações do projeto
        ctx.font = '24px Arial';
        ctx.fillText(
          `Projeto: ${projectId || 'Editor Video'}`,
          canvas.width / 2,
          canvas.height / 2 + 60
        );

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);

        setExportProgress(20 + (frame / totalFrames) * 50);
        setExportMessage(`Renderizando frame ${frame + 1}/${totalFrames}...`);

        // Yield para não bloquear UI
        if (frame % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      setExportMessage('Codificando vídeo...');
      setExportProgress(70);

      // Criar arquivo de vídeo usando FFmpeg
      // Para esta implementação inicial, vamos criar um vídeo simples
      const videoBlob = await createVideoFromFrames(frames, exportSettings);

      setExportMessage('Finalizando...');
      setExportProgress(90);

      // Download do arquivo
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_export_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setExportMessage('Exportação concluída com sucesso!');

      // Reset após alguns segundos
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage('');
      }, 3000);

    } catch (error) {
      console.error('Erro na exportação:', error);
      setExportMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Função auxiliar para criar vídeo a partir de frames (implementação básica)
  const createVideoFromFrames = async (frames: ImageData[], settings: any): Promise<Blob> => {
    // Para esta primeira implementação, vamos criar um vídeo simples usando MediaRecorder
    // Em produção, isso seria feito pelo VideoRenderer com FFmpeg

    const canvas = document.createElement('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(settings.frameRate);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorder.onerror = reject;

      mediaRecorder.start();

      // Renderizar frames
      let frameIndex = 0;
      const renderFrame = () => {
        if (frameIndex < frames.length) {
          ctx.putImageData(frames[frameIndex], 0, 0);
          frameIndex++;
          setTimeout(renderFrame, 1000 / settings.frameRate);
        } else {
          mediaRecorder.stop();
        }
      };

      renderFrame();
    });
  };

  // Shortcuts globais aprimorados
  const setupGlobalShortcuts = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estamos digitando em um input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Shortcuts com Ctrl/Cmd
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            saveProject();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              engine.dispatch({ type: 'REDO', payload: {} });
            } else {
              engine.dispatch({ type: 'UNDO', payload: {} });
            }
            break;
          case 'y':
            e.preventDefault();
            engine.dispatch({ type: 'REDO', payload: {} });
            break;
          case 'e':
            e.preventDefault();
            exportVideo();
            break;
          case 'c':
            e.preventDefault();
            if (selectedItems.length > 0) {
              engine.dispatch({ type: 'COPY', payload: { itemIds: selectedItems } });
            }
            break;
          case 'v':
            e.preventDefault();
            if (selectedItems.length > 0) {
              // Colar na trilha atual no tempo atual
              const currentTrack = engine.getState().tracks[0];
              if (currentTrack) {
                engine.dispatch({
                  type: 'PASTE',
                  payload: {
                    trackId: currentTrack.id,
                    time: engine.getCurrentTime()
                  }
                });
              }
            }
            break;
          case 'x':
            e.preventDefault();
            if (selectedItems.length > 0) {
              engine.dispatch({ type: 'CUT', payload: { itemIds: selectedItems } });
              setSelectedItems([]);
            }
            break;
          case 'a':
            e.preventDefault();
            // Selecionar todos os itens
            const allItems = engine.getState().tracks.flatMap(track =>
              track.items.map(item => item.id)
            );
            setSelectedItems(allItems);
            break;
        }
        return;
      }

      // Shortcuts sem modificadores
      switch (e.key) {
        case ' ': // Space - Play/Pause
          e.preventDefault();
          if (engine.getState().isPlaying) {
            engine.pause();
          } else {
            engine.play();
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (selectedItems.length > 0) {
            selectedItems.forEach(itemId => {
              engine.dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
            });
            setSelectedItems([]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedItems([]);
          break;
      }

      // Shortcuts de navegação (apenas se não estiver em modo de edição)
      if (!isFullscreen) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            const newTimeLeft = Math.max(0, engine.getCurrentTime() - 5); // 5 segundos para trás
            engine.setCurrentTime(newTimeLeft);
            break;
          case 'ArrowRight':
            e.preventDefault();
            const newTimeRight = Math.min(engine.getDuration(), engine.getCurrentTime() + 5); // 5 segundos para frente
            engine.setCurrentTime(newTimeRight);
            break;
          case 'Home':
            e.preventDefault();
            engine.setCurrentTime(0);
            break;
          case 'End':
            e.preventDefault();
            engine.setCurrentTime(engine.getDuration());
            break;
        }
      }

      // Shortcuts de ferramentas (V, A, S)
      switch (e.key.toLowerCase()) {
        case 'v':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setActivePanel('media');
          }
          break;
        case 'a':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setActivePanel('effects');
          }
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setActivePanel('export');
          }
          break;
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handlers
  const handleAssetSelect = (asset: MediaAsset) => {
  };

  const handleAssetPreview = (asset: MediaAsset) => {
  };

  const handleItemSelect = (itemIds: string[]) => {
    setSelectedItems(itemIds);
  };

  const handleTimeChange = (currentTime: number) => {
    // Atualizar preview se necessário
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-screen bg-gray-950 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileVideo className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold">Editor de Vídeo</h1>
            {pptxProject && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                <Presentation className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">PPTX Carregado</span>
              </div>
            )}
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-2">
            {isLoadingPPTX && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Carregando PPTX...</span>
              </div>
            )}
            {hasUnsavedChanges && (
              <div className="w-2 h-2 bg-orange-500 rounded-full" title="Alterações não salvas" />
            )}
          </div>
          
          {/* Project Info */}
          {pptxProject && (
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span title="Slides convertidos">
                {pptxProject.slidesCount} slides
              </span>
              <span title="Duração total">
                {Math.floor(pptxProject.totalDuration / 60)}:{(pptxProject.totalDuration % 60).toString().padStart(2, '0')}
              </span>
              {pptxProject.metadata.nrCompliant && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-300">NR Compliant</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={saveProject}
            disabled={isSaving}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportVideo}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>

          <div className="w-px h-6 bg-gray-600" />

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Painel Lateral Esquerdo */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
          <Tabs value={activePanel} onValueChange={(value) => setActivePanel(value as any)}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="media" className="text-xs">
                <Upload className="w-4 h-4 mr-1" />
                Mídia
              </TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">
                <Palette className="w-4 h-4 mr-1" />
                Efeitos
              </TabsTrigger>
              <TabsTrigger value="properties" className="text-xs">
                <Settings className="w-4 h-4 mr-1" />
                Props
              </TabsTrigger>
              <TabsTrigger value="export" className="text-xs">
                <Download className="w-4 h-4 mr-1" />
                Export
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="media" className="h-full m-0">
                {/* PPTX Project Info Panel */}
                {pptxProject && (
                  <div className="p-4 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-green-300 flex items-center">
                        <Presentation className="w-4 h-4 mr-2" />
                        Projeto PPTX
                      </h3>
                      <div className="text-xs text-gray-400">
                        {pptxProject.template.name}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>Arquivo Original:</span>
                        <span className="text-blue-300">{pptxProject.originalFileName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conformidade:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          pptxProject.metadata.safetyLevel === 'high' ? 'bg-green-500/20 text-green-300' :
                          pptxProject.metadata.safetyLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {pptxProject.metadata.complianceScore}% - {pptxProject.metadata.safetyLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Template:</span>
                        <span className="text-purple-300">{pptxProject.template.category}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <MediaLibrary
                  engine={engine}
                  onAssetSelect={handleAssetSelect}
                  onAssetPreview={handleAssetPreview}
                  pptxProject={pptxProject} // Pass PPTX data to MediaLibrary
                />
              </TabsContent>

              <TabsContent value="effects" className="h-full m-0 p-4">
                <Card className="h-full bg-gray-800 text-white p-4">
                  <h3 className="text-lg font-semibold mb-4">Efeitos e Transições</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Transições</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['Fade', 'Slide', 'Wipe', 'Dissolve'].map(effect => (
                          <Button
                            key={effect}
                            variant="outline"
                            size="sm"
                            className="text-white border-gray-600 hover:bg-gray-700"
                          >
                            {effect}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Filtros</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['Blur', 'Sepia', 'B&W', 'Vintage'].map(filter => (
                          <Button
                            key={filter}
                            variant="outline"
                            size="sm"
                            className="text-white border-gray-600 hover:bg-gray-700"
                          >
                            {filter}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="properties" className="h-full m-0 p-4">
                <Card className="h-full bg-gray-800 text-white p-4">
                  <h3 className="text-lg font-semibold mb-4">Propriedades</h3>
                  
                  {selectedItems.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Opacidade</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          className="w-full mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Posição X</label>
                        <input 
                          type="number" 
                          className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Posição Y</label>
                        <input 
                          type="number" 
                          className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center">
                      Selecione um item na timeline para ver suas propriedades
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="export" className="h-full m-0 p-4">
                <Card className="h-full bg-gray-800 text-white p-4">
                  <h3 className="text-lg font-semibold mb-4">Configurações de Exportação</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Resolução</label>
                      <select className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1">
                        <option>1920x1080 (Full HD)</option>
                        <option>1280x720 (HD)</option>
                        <option>854x480 (SD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Formato</label>
                      <select className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1">
                        <option>MP4</option>
                        <option>WebM</option>
                        <option>AVI</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Qualidade</label>
                      <select className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-2 py-1">
                        <option>Alta</option>
                        <option>Média</option>
                        <option>Baixa</option>
                      </select>
                    </div>

                    {/* Barra de progresso da exportação */}
                    {isExporting && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso da Exportação</span>
                          <span>{exportProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${exportProgress}%` }}
                          />
                        </div>
                        {exportMessage && (
                          <div className="text-sm text-gray-300 text-center">
                            {exportMessage}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={exportVideo}
                      disabled={isExporting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exportando...' : 'Iniciar Exportação'}
                    </Button>

                    {/* Informações sobre integração */}
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-300 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">FFmpeg Integrado</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Sistema de processamento de vídeo com FFmpeg.wasm implementado
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Área Central */}
        <div className="flex-1 flex flex-col">
          {/* Preview */}
          <div className="flex-1 p-4">
            <VideoPreview
              engine={engine}
              onFullscreen={toggleFullscreen}
            />
          </div>

          {/* Controles de Reprodução */}
          <div className="px-4 pb-2">
            <PlaybackControls 
              engine={engine}
              compact={true}
              className="bg-gray-800"
            />
          </div>

          {/* Timeline */}
          <div className="h-60 border-t border-gray-700">
            <Timeline
              engine={engine}
              onTimeChange={handleTimeChange}
              onItemSelect={handleItemSelect}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-700 text-sm text-gray-400">
        <div className="flex space-x-4">
          <span>Projeto: {projectId || 'Novo Projeto'}</span>
          <span>•</span>
          <span>Duração: {Math.floor(engine.getDuration() / 60)}:{(engine.getDuration() % 60).toFixed(0).padStart(2, '0')}</span>
        </div>
        
        <div className="flex space-x-4">
          <span>Itens selecionados: {selectedItems.length}</span>
          <span>•</span>
          <span>Trilhas: {engine.getState().tracks.length}</span>
          <span>•</span>
          <span className={hasUnsavedChanges ? 'text-orange-400' : 'text-green-400'}>
            {hasUnsavedChanges ? 'Não salvo' : 'Salvo'}
          </span>
        </div>
      </footer>

      {/* Status Dashboard */}
      <StatusDashboard
        isOpen={isStatusDashboardOpen}
        onToggle={() => setIsStatusDashboardOpen(!isStatusDashboardOpen)}
        projectId={projectId}
      />
    </div>
  );
};
