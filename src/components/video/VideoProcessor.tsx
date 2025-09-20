import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Download, Scissors, Zap, Image } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useVideoWorker } from '../../hooks/useVideoWorker';
import { toast } from 'sonner';

interface VideoProcessorProps {
  className?: string;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ className }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<ArrayBuffer | null>(null);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [processedVideo, setProcessedVideo] = useState<ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isProcessing,
    progress,
    error,
    result,
    metadata,
    processVideo,
    compressVideo,
    extractFrames,
    applyEffects,
    cancelOperation,
    resetState,
    isWorkerAvailable
  } = useVideoWorker({
    onProgress: (progress) => {
    },
    onComplete: (result, metadata) => {
      toast.success('Processamento concluído com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro no processamento: ${error}`);
    }
  });

  // Função para selecionar arquivo
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione um arquivo de vídeo válido.');
      return;
    }

    setSelectedFile(file);
    resetState();
    setExtractedFrames([]);
    setProcessedVideo(null);

    // Converter arquivo para ArrayBuffer
    try {
      const arrayBuffer = await file.arrayBuffer();
      setVideoData(arrayBuffer);
      toast.success('Vídeo carregado com sucesso!');
    } catch (error) {
      toast.error('Erro ao carregar o vídeo.');
      console.error('Erro ao converter arquivo:', error);
    }
  };

  // Função para processar vídeo
  const handleProcessVideo = async () => {
    if (!videoData) {
      toast.error('Nenhum vídeo selecionado.');
      return;
    }

    try {
      const response = await processVideo(videoData, {
        quality: 0.8,
        format: 'mp4',
        width: 1280,
        height: 720
      });
      
      if (response.payload.result instanceof ArrayBuffer) {
        setProcessedVideo(response.payload.result);
      }
    } catch (error) {
      console.error('Erro ao processar vídeo:', error);
    }
  };

  // Função para comprimir vídeo
  const handleCompressVideo = async () => {
    if (!videoData) {
      toast.error('Nenhum vídeo selecionado.');
      return;
    }

    try {
      const response = await compressVideo(videoData, {
        quality: 0.6,
        format: 'mp4'
      });
      
      if (response.payload.result instanceof ArrayBuffer) {
        setProcessedVideo(response.payload.result);
      }
    } catch (error) {
      console.error('Erro ao comprimir vídeo:', error);
    }
  };

  // Função para extrair frames
  const handleExtractFrames = async () => {
    if (!videoData) {
      toast.error('Nenhum vídeo selecionado.');
      return;
    }

    try {
      const response = await extractFrames(videoData, 12);
      
      if (Array.isArray(response.payload.result)) {
        setExtractedFrames(response.payload.result);
      }
    } catch (error) {
      console.error('Erro ao extrair frames:', error);
    }
  };

  // Função para aplicar efeitos
  const handleApplyEffects = async () => {
    if (!videoData) {
      toast.error('Nenhum vídeo selecionado.');
      return;
    }

    try {
      const response = await applyEffects(videoData, ['blur', 'brightness', 'contrast']);
      
      if (response.payload.result instanceof ArrayBuffer) {
        setProcessedVideo(response.payload.result);
      }
    } catch (error) {
      console.error('Erro ao aplicar efeitos:', error);
    }
  };

  // Função para download do vídeo processado
  const handleDownload = () => {
    if (!processedVideo) {
      toast.error('Nenhum vídeo processado disponível.');
      return;
    }

    const blob = new Blob([processedVideo], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${selectedFile?.name || 'video.mp4'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Download iniciado!');
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isWorkerAvailable) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Web Workers não estão disponíveis neste navegador.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Processador de Vídeo Avançado
          <Badge variant="secondary">Web Worker</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload de arquivo */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Selecionar Vídeo
            </Button>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedFile.name}</span>
                <Badge variant="outline">
                  {formatFileSize(selectedFile.size)}
                </Badge>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Progresso */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processando...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <Button
              onClick={cancelOperation}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Metadata */}
        {metadata && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Informações do Vídeo</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {metadata.size && (
                <div>
                  <span className="text-muted-foreground">Tamanho:</span>
                  <span className="ml-2">{formatFileSize(metadata.size)}</span>
                </div>
              )}
              {metadata.format && (
                <div>
                  <span className="text-muted-foreground">Formato:</span>
                  <span className="ml-2">{metadata.format}</span>
                </div>
              )}
              {metadata.dimensions && (
                <div>
                  <span className="text-muted-foreground">Dimensões:</span>
                  <span className="ml-2">
                    {metadata.dimensions.width}x{metadata.dimensions.height}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controles de processamento */}
        {videoData && !isProcessing && (
          <Tabs defaultValue="process" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="process">Processar</TabsTrigger>
              <TabsTrigger value="compress">Comprimir</TabsTrigger>
              <TabsTrigger value="frames">Frames</TabsTrigger>
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="process" className="space-y-4">
              <Button
                onClick={handleProcessVideo}
                className="w-full flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Processar Vídeo
              </Button>
            </TabsContent>
            
            <TabsContent value="compress" className="space-y-4">
              <Button
                onClick={handleCompressVideo}
                className="w-full flex items-center gap-2"
              >
                <Scissors className="h-4 w-4" />
                Comprimir Vídeo
              </Button>
            </TabsContent>
            
            <TabsContent value="frames" className="space-y-4">
              <Button
                onClick={handleExtractFrames}
                className="w-full flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Extrair Frames
              </Button>
              
              {extractedFrames.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {extractedFrames.map((frame, index) => (
                    <img
                      key={index}
                      src={frame}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="effects" className="space-y-4">
              <Button
                onClick={handleApplyEffects}
                className="w-full flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Aplicar Efeitos
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {/* Download */}
        {processedVideo && (
          <Button
            onClick={handleDownload}
            className="w-full flex items-center gap-2"
            variant="default"
          >
            <Download className="h-4 w-4" />
            Download Vídeo Processado
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoProcessor;