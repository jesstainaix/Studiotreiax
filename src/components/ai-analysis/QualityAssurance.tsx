import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Eye,
  Volume2,
  Film,
  Settings,
  Download,
  RefreshCw,
  Target,
  BarChart3,
  TrendingUp,
  Shield
} from 'lucide-react';
import { TimelineEngine } from '../../modules/video-editor/core/TimelineEngine';

// Interfaces para o sistema de qualidade
interface QualityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'video' | 'audio' | 'performance' | 'compatibility' | 'accessibility';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixAvailable: boolean;
  location?: {
    timestamp?: number;
    trackId?: string;
    elementId?: string;
  };
  suggestions: string[];
}

interface QualityMetrics {
  overallScore: number;
  videoQuality: number;
  audioQuality: number;
  performance: number;
  compatibility: number;
  accessibility: number;
  issues: QualityIssue[];
  passedChecks: number;
  totalChecks: number;
}

interface PlatformStandard {
  id: string;
  name: string;
  requirements: {
    resolution: { min: string; max: string; recommended: string };
    aspectRatio: string[];
    duration: { min: number; max: number };
    fileSize: { max: number };
    framerate: number[];
    audioSampleRate: number[];
    audioBitrate: { min: number; max: number };
    videoBitrate: { min: number; max: number };
  };
}

interface QualityAssuranceProps {
  engine: TimelineEngine;
  onIssueDetected: (issue: QualityIssue) => void;
  onFixApply: (fix: { issueId: string; action: string }) => void;
  autoFix?: boolean;
  className?: string;
}

export const QualityAssurance: React.FC<QualityAssuranceProps> = ({
  engine,
  onIssueDetected,
  onFixApply,
  autoFix = false,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<QualityMetrics>({
    overallScore: 0,
    videoQuality: 0,
    audioQuality: 0,
    performance: 0,
    compatibility: 0,
    accessibility: 0,
    issues: [],
    passedChecks: 0,
    totalChecks: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('youtube');
  const [autoFixEnabled, setAutoFixEnabled] = useState(autoFix);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Padrões de plataforma
  const platformStandards: PlatformStandard[] = [
    {
      id: 'youtube',
      name: 'YouTube',
      requirements: {
        resolution: { min: '426x240', max: '7680x4320', recommended: '1920x1080' },
        aspectRatio: ['16:9', '4:3', '1:1', '9:16'],
        duration: { min: 1, max: 43200 }, // 12 horas
        fileSize: { max: 256 * 1024 * 1024 * 1024 }, // 256GB
        framerate: [24, 25, 30, 48, 50, 60],
        audioSampleRate: [44100, 48000],
        audioBitrate: { min: 128, max: 384 },
        videoBitrate: { min: 1000, max: 68000 }
      }
    },
    {
      id: 'instagram',
      name: 'Instagram',
      requirements: {
        resolution: { min: '600x315', max: '1920x1080', recommended: '1080x1080' },
        aspectRatio: ['1:1', '4:5', '9:16'],
        duration: { min: 3, max: 60 },
        fileSize: { max: 4 * 1024 * 1024 * 1024 }, // 4GB
        framerate: [23, 25, 30, 48, 50, 60],
        audioSampleRate: [44100, 48000],
        audioBitrate: { min: 128, max: 320 },
        videoBitrate: { min: 3500, max: 10000 }
      }
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      requirements: {
        resolution: { min: '540x960', max: '1080x1920', recommended: '1080x1920' },
        aspectRatio: ['9:16'],
        duration: { min: 15, max: 180 },
        fileSize: { max: 287 * 1024 * 1024 }, // 287MB
        framerate: [25, 30],
        audioSampleRate: [44100, 48000],
        audioBitrate: { min: 128, max: 320 },
        videoBitrate: { min: 516, max: 10000 }
      }
    }
  ];

  // Análise de qualidade de vídeo
  const analyzeVideoQuality = useCallback(async (videoData: any): Promise<QualityIssue[]> => {
    const issues: QualityIssue[] = [];
    
    // Análise de resolução
    if (videoData.width < 720 || videoData.height < 480) {
      issues.push({
        id: `video_resolution_${Date.now()}`,
        type: 'warning',
        category: 'video',
        title: 'Resolução Baixa',
        description: `Resolução atual: ${videoData.width}x${videoData.height}. Recomendado: mínimo 720p`,
        severity: 'medium',
        autoFixAvailable: false,
        suggestions: [
          'Considere usar uma resolução maior para melhor qualidade',
          'Verifique se a fonte original tem resolução adequada',
          'Use upscaling com IA se necessário'
        ]
      });
    }

    // Análise de framerate
    if (videoData.framerate < 24) {
      issues.push({
        id: `video_framerate_${Date.now()}`,
        type: 'error',
        category: 'video',
        title: 'Framerate Muito Baixo',
        description: `Framerate atual: ${videoData.framerate}fps. Mínimo recomendado: 24fps`,
        severity: 'high',
        autoFixAvailable: true,
        suggestions: [
          'Ajustar framerate para 24fps ou superior',
          'Verificar configurações de captura',
          'Considerar interpolação de frames'
        ]
      });
    }

    // Análise de bitrate
    if (videoData.bitrate < 1000) {
      issues.push({
        id: `video_bitrate_${Date.now()}`,
        type: 'warning',
        category: 'video',
        title: 'Bitrate Baixo',
        description: `Bitrate atual: ${videoData.bitrate}kbps. Pode afetar a qualidade visual`,
        severity: 'medium',
        autoFixAvailable: true,
        suggestions: [
          'Aumentar bitrate para melhor qualidade',
          'Balancear qualidade vs tamanho do arquivo',
          'Considerar codificação em duas passadas'
        ]
      });
    }

    // Análise de estabilidade
    const stabilityScore = Math.random() * 100; // Simulação
    if (stabilityScore < 70) {
      issues.push({
        id: `video_stability_${Date.now()}`,
        type: 'warning',
        category: 'video',
        title: 'Vídeo Instável',
        description: `Score de estabilidade: ${stabilityScore.toFixed(1)}%. Detectado movimento excessivo`,
        severity: 'medium',
        autoFixAvailable: true,
        suggestions: [
          'Aplicar estabilização de vídeo',
          'Usar tripé ou gimbal na próxima gravação',
          'Considerar corte de bordas para estabilização'
        ]
      });
    }

    return issues;
  }, []);

  // Análise de qualidade de áudio
  const analyzeAudioQuality = useCallback(async (audioData: any): Promise<QualityIssue[]> => {
    const issues: QualityIssue[] = [];

    // Análise de volume
    if (audioData.averageVolume < -23) {
      issues.push({
        id: `audio_volume_low_${Date.now()}`,
        type: 'warning',
        category: 'audio',
        title: 'Volume Muito Baixo',
        description: `Volume médio: ${audioData.averageVolume}dB. Recomendado: -23dB a -18dB`,
        severity: 'medium',
        autoFixAvailable: true,
        suggestions: [
          'Normalizar áudio para -23dB',
          'Aplicar compressão dinâmica',
          'Verificar níveis de gravação'
        ]
      });
    }

    if (audioData.peakVolume > -3) {
      issues.push({
        id: `audio_volume_high_${Date.now()}`,
        type: 'error',
        category: 'audio',
        title: 'Risco de Clipping',
        description: `Pico de volume: ${audioData.peakVolume}dB. Risco de distorção`,
        severity: 'high',
        autoFixAvailable: true,
        suggestions: [
          'Reduzir volume para evitar clipping',
          'Aplicar limitador de áudio',
          'Regravar com níveis mais baixos'
        ]
      });
    }

    // Análise de ruído de fundo
    const noiseLevel = Math.random() * 100; // Simulação
    if (noiseLevel > 30) {
      issues.push({
        id: `audio_noise_${Date.now()}`,
        type: 'warning',
        category: 'audio',
        title: 'Ruído de Fundo Detectado',
        description: `Nível de ruído: ${noiseLevel.toFixed(1)}%. Pode afetar a clareza do áudio`,
        severity: 'medium',
        autoFixAvailable: true,
        suggestions: [
          'Aplicar redução de ruído',
          'Usar filtro passa-alta',
          'Melhorar isolamento acústico na gravação'
        ]
      });
    }

    // Análise de qualidade de sample rate
    if (audioData.sampleRate < 44100) {
      issues.push({
        id: `audio_samplerate_${Date.now()}`,
        type: 'warning',
        category: 'audio',
        title: 'Sample Rate Baixo',
        description: `Sample rate: ${audioData.sampleRate}Hz. Recomendado: 44.1kHz ou superior`,
        severity: 'low',
        autoFixAvailable: false,
        suggestions: [
          'Regravar com sample rate de 44.1kHz ou 48kHz',
          'Fazer upsampling (qualidade limitada)',
          'Verificar configurações de captura'
        ]
      });
    }

    return issues;
  }, []);

  // Análise de compatibilidade com plataforma
  const analyzePlatformCompatibility = useCallback(async (projectData: any, platform: PlatformStandard): Promise<QualityIssue[]> => {
    const issues: QualityIssue[] = [];
    const { requirements } = platform;

    // Verificar duração
    if (projectData.duration < requirements.duration.min) {
      issues.push({
        id: `platform_duration_min_${Date.now()}`,
        type: 'error',
        category: 'compatibility',
        title: 'Duração Muito Curta',
        description: `Duração: ${projectData.duration}s. Mínimo para ${platform.name}: ${requirements.duration.min}s`,
        severity: 'high',
        autoFixAvailable: false,
        suggestions: [
          'Adicionar mais conteúdo ao vídeo',
          'Estender duração com transições',
          'Considerar outra plataforma'
        ]
      });
    }

    if (projectData.duration > requirements.duration.max) {
      issues.push({
        id: `platform_duration_max_${Date.now()}`,
        type: 'error',
        category: 'compatibility',
        title: 'Duração Muito Longa',
        description: `Duração: ${projectData.duration}s. Máximo para ${platform.name}: ${requirements.duration.max}s`,
        severity: 'critical',
        autoFixAvailable: true,
        suggestions: [
          'Cortar vídeo para duração adequada',
          'Dividir em múltiplos vídeos',
          'Acelerar reprodução'
        ]
      });
    }

    // Verificar aspect ratio
    const currentRatio = `${projectData.width}:${projectData.height}`;
    if (!requirements.aspectRatio.includes(currentRatio)) {
      issues.push({
        id: `platform_aspect_${Date.now()}`,
        type: 'warning',
        category: 'compatibility',
        title: 'Aspect Ratio Não Suportado',
        description: `Ratio atual: ${currentRatio}. ${platform.name} suporta: ${requirements.aspectRatio.join(', ')}`,
        severity: 'medium',
        autoFixAvailable: true,
        suggestions: [
          'Ajustar para aspect ratio suportado',
          'Adicionar letterbox/pillarbox',
          'Recortar vídeo adequadamente'
        ]
      });
    }

    return issues;
  }, []);

  // Análise de performance
  const analyzePerformance = useCallback(async (projectData: any): Promise<QualityIssue[]> => {
    const issues: QualityIssue[] = [];

    // Análise de complexidade
    const effectsCount = projectData.effects?.length || 0;
    if (effectsCount > 20) {
      issues.push({
        id: `performance_effects_${Date.now()}`,
        type: 'warning',
        category: 'performance',
        title: 'Muitos Efeitos Aplicados',
        description: `${effectsCount} efeitos detectados. Pode impactar performance de renderização`,
        severity: 'medium',
        autoFixAvailable: false,
        suggestions: [
          'Considerar pré-renderizar alguns efeitos',
          'Otimizar ordem de aplicação dos efeitos',
          'Usar proxy de baixa resolução para edição'
        ]
      });
    }

    // Análise de tamanho de arquivo
    if (projectData.estimatedSize > 1024 * 1024 * 1024) { // 1GB
      issues.push({
        id: `performance_size_${Date.now()}`,
        type: 'info',
        category: 'performance',
        title: 'Arquivo Grande',
        description: `Tamanho estimado: ${(projectData.estimatedSize / (1024 * 1024 * 1024)).toFixed(2)}GB`,
        severity: 'low',
        autoFixAvailable: true,
        suggestions: [
          'Otimizar configurações de compressão',
          'Reduzir bitrate se possível',
          'Considerar formato mais eficiente'
        ]
      });
    }

    return issues;
  }, []);

  // Análise de acessibilidade
  const analyzeAccessibility = useCallback(async (projectData: any): Promise<QualityIssue[]> => {
    const issues: QualityIssue[] = [];

    // Verificar legendas
    if (!projectData.hasSubtitles) {
      issues.push({
        id: `accessibility_subtitles_${Date.now()}`,
        type: 'info',
        category: 'accessibility',
        title: 'Sem Legendas',
        description: 'Vídeo não possui legendas. Recomendado para acessibilidade',
        severity: 'low',
        autoFixAvailable: false,
        suggestions: [
          'Adicionar legendas manuais',
          'Usar geração automática de legendas',
          'Incluir transcrição na descrição'
        ]
      });
    }

    // Verificar contraste de texto
    const textElements = projectData.textElements || [];
    textElements.forEach((text: any, index: number) => {
      if (text.contrast < 4.5) {
        issues.push({
          id: `accessibility_contrast_${index}_${Date.now()}`,
          type: 'warning',
          category: 'accessibility',
          title: 'Contraste Insuficiente',
          description: `Elemento de texto ${index + 1} tem contraste ${text.contrast}:1. Mínimo recomendado: 4.5:1`,
          severity: 'medium',
          autoFixAvailable: true,
          location: {
            timestamp: text.timestamp,
            elementId: text.id
          },
          suggestions: [
            'Aumentar contraste do texto',
            'Adicionar contorno ou sombra',
            'Usar cores mais contrastantes'
          ]
        });
      }
    });

    return issues;
  }, []);

  // Executar análise completa
  const runQualityAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simular dados do projeto
      const projectData = {
        width: 1920,
        height: 1080,
        framerate: 30,
        bitrate: 5000,
        duration: 120,
        estimatedSize: 500 * 1024 * 1024,
        effects: Array(15).fill({}),
        hasSubtitles: false,
        textElements: [
          { id: 'text1', contrast: 3.2, timestamp: 10 },
          { id: 'text2', contrast: 6.1, timestamp: 45 }
        ]
      };

      const videoData = {
        width: projectData.width,
        height: projectData.height,
        framerate: projectData.framerate,
        bitrate: projectData.bitrate
      };

      const audioData = {
        averageVolume: -20,
        peakVolume: -6,
        sampleRate: 48000
      };

      const platform = platformStandards.find(p => p.id === selectedPlatform)!;

      // Executar análises
      setAnalysisProgress(20);
      const videoIssues = await analyzeVideoQuality(videoData);
      
      setAnalysisProgress(40);
      const audioIssues = await analyzeAudioQuality(audioData);
      
      setAnalysisProgress(60);
      const compatibilityIssues = await analyzePlatformCompatibility(projectData, platform);
      
      setAnalysisProgress(80);
      const performanceIssues = await analyzePerformance(projectData);
      
      setAnalysisProgress(90);
      const accessibilityIssues = await analyzeAccessibility(projectData);

      // Consolidar resultados
      const allIssues = [
        ...videoIssues,
        ...audioIssues,
        ...compatibilityIssues,
        ...performanceIssues,
        ...accessibilityIssues
      ];

      // Calcular métricas
      const totalChecks = 25; // Número total de verificações
      const passedChecks = totalChecks - allIssues.length;
      const overallScore = (passedChecks / totalChecks) * 100;

      const newMetrics: QualityMetrics = {
        overallScore,
        videoQuality: Math.max(0, 100 - (videoIssues.length * 15)),
        audioQuality: Math.max(0, 100 - (audioIssues.length * 20)),
        performance: Math.max(0, 100 - (performanceIssues.length * 25)),
        compatibility: Math.max(0, 100 - (compatibilityIssues.length * 30)),
        accessibility: Math.max(0, 100 - (accessibilityIssues.length * 10)),
        issues: allIssues,
        passedChecks,
        totalChecks
      };

      setMetrics(newMetrics);
      setAnalysisProgress(100);

      // Notificar sobre problemas encontrados
      allIssues.forEach(issue => {
        onIssueDetected(issue);
      });

      // Auto-fix se habilitado
      if (autoFixEnabled) {
        const autoFixableIssues = allIssues.filter(issue => issue.autoFixAvailable);
        for (const issue of autoFixableIssues) {
          await applyAutoFix(issue);
        }
      }

    } catch (error) {
      console.error('Erro na análise de qualidade:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedPlatform, autoFixEnabled, analyzeVideoQuality, analyzeAudioQuality, analyzePlatformCompatibility, analyzePerformance, analyzeAccessibility, onIssueDetected]);

  // Aplicar correção automática
  const applyAutoFix = useCallback(async (issue: QualityIssue) => {
    try {
      let action = '';
      
      switch (issue.id.split('_')[1]) {
        case 'framerate':
          action = 'adjust_framerate';
          break;
        case 'bitrate':
          action = 'optimize_bitrate';
          break;
        case 'stability':
          action = 'apply_stabilization';
          break;
        case 'volume':
          action = 'normalize_audio';
          break;
        case 'noise':
          action = 'reduce_noise';
          break;
        case 'duration':
          action = 'trim_duration';
          break;
        case 'aspect':
          action = 'adjust_aspect_ratio';
          break;
        case 'contrast':
          action = 'improve_contrast';
          break;
        default:
          action = 'generic_fix';
      }

      onFixApply({ issueId: issue.id, action });
      
      // Remover issue da lista após correção
      setMetrics(prev => ({
        ...prev,
        issues: prev.issues.filter(i => i.id !== issue.id)
      }));

    } catch (error) {
      console.error('Erro ao aplicar correção:', error);
    }
  }, [onFixApply]);

  // Aplicar correção manual
  const handleManualFix = useCallback((issue: QualityIssue) => {
    applyAutoFix(issue);
  }, [applyAutoFix]);

  // Gerar relatório de qualidade
  const generateQualityReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      platform: selectedPlatform,
      metrics,
      recommendations: metrics.issues.map(issue => ({
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        suggestions: issue.suggestions
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedPlatform, metrics]);

  // Executar análise inicial
  useEffect(() => {
    runQualityAnalysis();
  }, [selectedPlatform]);

  // Função para obter cor baseada na severidade
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // Função para obter ícone baseado no tipo
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`h-full flex flex-col bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Garantia de Qualidade</h2>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              {platformStandards.map(platform => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
            <Button
              onClick={runQualityAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              {isAnalyzing ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progresso da Análise</span>
              <span className="text-sm text-gray-400">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        {/* Overall Score */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Score Geral</p>
                  <p className="text-2xl font-bold text-green-500">
                    {metrics.overallScore.toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Verificações</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {metrics.passedChecks}/{metrics.totalChecks}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Problemas</p>
                  <p className="text-2xl font-bold text-red-500">
                    {metrics.issues.length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="issues">Problemas</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {/* Quality Metrics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Métricas de Qualidade</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Qualidade de Vídeo</span>
                        <span className="text-sm font-medium">{metrics.videoQuality.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.videoQuality} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Qualidade de Áudio</span>
                        <span className="text-sm font-medium">{metrics.audioQuality.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.audioQuality} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Performance</span>
                        <span className="text-sm font-medium">{metrics.performance.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.performance} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Compatibilidade</span>
                        <span className="text-sm font-medium">{metrics.compatibility.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.compatibility} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Requirements */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Requisitos da Plataforma - {platformStandards.find(p => p.id === selectedPlatform)?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Resolução Recomendada:</p>
                      <p className="font-medium">{platformStandards.find(p => p.id === selectedPlatform)?.requirements.resolution.recommended}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Aspect Ratios:</p>
                      <p className="font-medium">{platformStandards.find(p => p.id === selectedPlatform)?.requirements.aspectRatio.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Duração:</p>
                      <p className="font-medium">
                        {platformStandards.find(p => p.id === selectedPlatform)?.requirements.duration.min}s - 
                        {platformStandards.find(p => p.id === selectedPlatform)?.requirements.duration.max}s
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Framerates:</p>
                      <p className="font-medium">{platformStandards.find(p => p.id === selectedPlatform)?.requirements.framerate.join(', ')} fps</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {metrics.issues.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-500 mb-2">Nenhum Problema Encontrado!</h3>
                    <p className="text-gray-400">Seu projeto atende a todos os critérios de qualidade.</p>
                  </CardContent>
                </Card>
              ) : (
                metrics.issues.map((issue) => (
                  <Card key={issue.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{issue.title}</h4>
                              <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                              <Badge variant="outline" className="text-gray-400">
                                {issue.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{issue.description}</p>
                            
                            {/* Suggestions */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-300">Sugestões:</p>
                              <ul className="text-xs text-gray-400 space-y-1">
                                {issue.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start space-x-1">
                                    <span>•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        {/* Fix Button */}
                        {issue.autoFixAvailable && (
                          <Button
                            onClick={() => handleManualFix(issue)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Corrigir
                          </Button>
                        )}
                      </div>
                      
                      {/* Location Info */}
                      {issue.location && (
                        <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                          {issue.location.timestamp && (
                            <span>Tempo: {issue.location.timestamp}s</span>
                          )}
                          {issue.location.elementId && (
                            <span className="ml-3">Elemento: {issue.location.elementId}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Detailed Metrics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Métricas Detalhadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Qualidade de Vídeo', value: metrics.videoQuality, icon: Film },
                      { label: 'Qualidade de Áudio', value: metrics.audioQuality, icon: Volume2 },
                      { label: 'Performance', value: metrics.performance, icon: Zap },
                      { label: 'Compatibilidade', value: metrics.compatibility, icon: Target },
                      { label: 'Acessibilidade', value: metrics.accessibility, icon: Eye }
                    ].map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div key={metric.label} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{metric.label}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-32">
                              <Progress value={metric.value} className="h-2" />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {metric.value.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Issues by Category */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Problemas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['video', 'audio', 'performance', 'compatibility', 'accessibility'].map(category => {
                      const categoryIssues = metrics.issues.filter(issue => issue.category === category);
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category}</span>
                          <Badge variant="outline" className={categoryIssues.length > 0 ? 'text-red-400' : 'text-green-400'}>
                            {categoryIssues.length}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Configurações de Análise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Correção Automática</p>
                      <p className="text-sm text-gray-400">Aplicar correções automaticamente quando possível</p>
                    </div>
                    <Button
                      onClick={() => setAutoFixEnabled(!autoFixEnabled)}
                      variant={autoFixEnabled ? "default" : "outline"}
                      size="sm"
                    >
                      {autoFixEnabled ? 'Ativado' : 'Desativado'}
                    </Button>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <Button
                      onClick={generateQualityReport}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Relatório de Qualidade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QualityAssurance;