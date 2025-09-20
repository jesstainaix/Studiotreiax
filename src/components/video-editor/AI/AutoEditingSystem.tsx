import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Pause,
  Square,
  Scissors,
  Wand2,
  Palette,
  Volume2,
  Brain,
  Settings,
  Download,
  Upload,
  Trash2,
  Check,
  X,
  Clock,
  BarChart3,
  Zap,
  FileVideo,
  Sparkles,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAutoEditing } from '@/hooks/useAutoEditing';
import { SmartCut, SceneTransition, AIEditingSuggestion, BatchProcessingJob } from '@/types/autoEditing';

interface AutoEditingSystemProps {
  videoElement?: HTMLVideoElement;
  audioData?: AudioBuffer;
  onApplyEdit?: (editData: any) => void;
  className?: string;
}

export function AutoEditingSystem({ 
  videoElement, 
  audioData, 
  onApplyEdit,
  className = '' 
}: AutoEditingSystemProps) {
  const {
    isAnalyzing,
    isProcessing,
    currentSession,
    suggestions,
    smartCuts,
    transitions,
    colorGrading,
    audioLeveling,
    contentAnalysis,
    batchJobs,
    metrics,
    error,
    startAnalysis,
    stopAnalysis,
    applySuggestion,
    rejectSuggestion,
    applySmartCut,
    applyTransition,
    applyColorGrading,
    applyAudioLeveling,
    startBatchProcessing,
    cancelBatchJob,
    updateConfig,
    updateUserPreferences,
    getRealTimeSuggestions,
    exportSession,
    importSession,
    clearSession
  } = useAutoEditing();

  const [activeTab, setActiveTab] = useState('analysis');
  const [batchFiles, setBatchFiles] = useState<string[]>([]);
  const [batchSettings, setBatchSettings] = useState({
    autocut: true,
    colorGrading: true,
    audioLeveling: true,
    transitions: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-start analysis when video is available
  useEffect(() => {
    if (videoElement && !currentSession && !isAnalyzing) {
      handleStartAnalysis();
    }
  }, [videoElement]);

  const handleStartAnalysis = async () => {
    if (!videoElement) {
      alert('Nenhum vídeo carregado para análise');
      return;
    }
    await startAnalysis(videoElement, audioData);
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    await applySuggestion(suggestionId);
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion && onApplyEdit) {
      onApplyEdit({
        type: 'suggestion',
        data: suggestion
      });
    }
  };

  const handleApplySmartCut = async (cutId: string) => {
    await applySmartCut(cutId);
    const cut = smartCuts.find(c => c.id === cutId);
    if (cut && onApplyEdit) {
      onApplyEdit({
        type: 'cut',
        data: cut
      });
    }
  };

  const handleApplyTransition = async (transitionId: string) => {
    await applyTransition(transitionId);
    const transition = transitions.find(t => t.id === transitionId);
    if (transition && onApplyEdit) {
      onApplyEdit({
        type: 'transition',
        data: transition
      });
    }
  };

  const handleColorGrading = async () => {
    await applyColorGrading();
    if (colorGrading && onApplyEdit) {
      onApplyEdit({
        type: 'colorGrading',
        data: colorGrading
      });
    }
  };

  const handleAudioLeveling = async () => {
    await applyAudioLeveling();
    if (audioLeveling.length > 0 && onApplyEdit) {
      onApplyEdit({
        type: 'audioLeveling',
        data: audioLeveling
      });
    }
  };

  const handleBatchProcessing = async () => {
    if (batchFiles.length === 0) {
      alert('Selecione arquivos para processamento em lote');
      return;
    }
    await startBatchProcessing(batchFiles, batchSettings);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setBatchFiles(files.map(f => f.name));
  };

  const handleExportSession = () => {
    const sessionData = exportSession();
    const blob = new Blob([sessionData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auto-editing-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importSession(content);
      };
      reader.readAsText(file);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Auto-Edição com IA</h1>
            <p className="text-gray-600">Edição inteligente automatizada para seus vídeos</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || !videoElement}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Iniciar Análise IA
              </>
            )}
          </Button>
          
          {currentSession && (
            <Button variant="outline" onClick={clearSession}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isAnalyzing && currentSession && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso da Análise</span>
                <span className="text-sm text-gray-600">{currentSession.progress}%</span>
              </div>
              <Progress value={currentSession.progress} className="w-full" />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando com IA...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Análise</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Sugestões</span>
          </TabsTrigger>
          <TabsTrigger value="cuts" className="flex items-center space-x-2">
            <Scissors className="h-4 w-4" />
            <span>Cortes</span>
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center space-x-2">
            <Wand2 className="h-4 w-4" />
            <span>Efeitos</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center space-x-2">
            <FileVideo className="h-4 w-4" />
            <span>Lote</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Content Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Análise de Conteúdo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentAnalysis ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tipo de Conteúdo:</span>
                      <Badge variant="secondary">{contentAnalysis.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confiança:</span>
                      <span className={`text-sm font-medium ${getConfidenceColor(contentAnalysis.confidence)}`}>
                        {(contentAnalysis.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Características:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Fala: {(contentAnalysis.characteristics.speechRatio * 100).toFixed(1)}%</div>
                        <div>Música: {(contentAnalysis.characteristics.musicRatio * 100).toFixed(1)}%</div>
                        <div>Silêncio: {(contentAnalysis.characteristics.silenceRatio * 100).toFixed(1)}%</div>
                        <div>Mudanças: {contentAnalysis.characteristics.sceneChanges}</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recomendações:</h4>
                      <ul className="text-xs space-y-1">
                        {contentAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Execute a análise para ver os resultados</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Métricas da Sessão</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{metrics.totalSuggestions}</div>
                        <div className="text-xs text-gray-600">Total de Sugestões</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{metrics.acceptedSuggestions}</div>
                        <div className="text-xs text-gray-600">Aceitas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{metrics.rejectedSuggestions}</div>
                        <div className="text-xs text-gray-600">Rejeitadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(metrics.averageConfidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Confiança Média</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        Tempo de Processamento: {(metrics.processingTime / 1000).toFixed(1)}s
                      </div>
                      {metrics.userSatisfaction && (
                        <div className="text-sm text-gray-600 mt-1">
                          Satisfação: {(metrics.userSatisfaction * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Métricas aparecerão após a análise</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Sugestões da IA ({suggestions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">{suggestion.type}</Badge>
                              <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                {(suggestion.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
                            <div className="text-xs text-gray-500">
                              Tempo: {suggestion.timestamp.toFixed(2)}s
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApplySuggestion(suggestion.id)}
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectSuggestion(suggestion.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma sugestão disponível</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Cuts Tab */}
        <TabsContent value="cuts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Smart Cuts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scissors className="h-5 w-5" />
                  <span>Cortes Inteligentes ({smartCuts.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {smartCuts.length > 0 ? (
                    <div className="space-y-3">
                      {smartCuts.map((cut) => (
                        <div key={cut.id} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary">{cut.type}</Badge>
                            <span className={`text-sm ${getConfidenceColor(cut.confidence)}`}>
                              {(cut.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            Tempo: {cut.timestamp.toFixed(2)}s
                          </div>
                          {cut.metadata && (
                            <div className="text-xs text-gray-500 mb-2">
                              {cut.metadata.audioLevel && `Áudio: ${cut.metadata.audioLevel.toFixed(1)}`}
                              {cut.metadata.motionIntensity && ` | Movimento: ${cut.metadata.motionIntensity.toFixed(1)}`}
                              {cut.metadata.sceneComplexity && ` | Complexidade: ${cut.metadata.sceneComplexity.toFixed(1)}`}
                            </div>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleApplySmartCut(cut.id)}
                            disabled={isProcessing}
                            className="w-full"
                          >
                            Aplicar Corte
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Scissors className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum corte detectado</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Scene Transitions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5" />
                  <span>Transições ({transitions.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {transitions.length > 0 ? (
                    <div className="space-y-3">
                      {transitions.map((transition) => (
                        <div key={transition.id} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{transition.type}</Badge>
                            <span className={`text-sm ${getConfidenceColor(transition.confidence)}`}>
                              {(transition.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            Duração: {transition.duration}s
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {transition.suggestedReason}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApplyTransition(transition.id)}
                            disabled={isProcessing}
                            className="w-full"
                          >
                            Aplicar Transição
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma transição sugerida</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Color Grading */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Correção de Cor Automática</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {colorGrading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>Brilho: {colorGrading.brightness > 0 ? '+' : ''}{colorGrading.brightness}</div>
                      <div>Contraste: {colorGrading.contrast > 0 ? '+' : ''}{colorGrading.contrast}</div>
                      <div>Saturação: {colorGrading.saturation > 0 ? '+' : ''}{colorGrading.saturation}</div>
                      <div>Temperatura: {colorGrading.temperature > 0 ? '+' : ''}{colorGrading.temperature}K</div>
                      <div>Matiz: {colorGrading.tint > 0 ? '+' : ''}{colorGrading.tint}</div>
                      <div>Confiança: {(colorGrading.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <Button
                      onClick={handleColorGrading}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Aplicar Correção de Cor
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Execute a análise para gerar perfil de cor</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Leveling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5" />
                  <span>Nivelamento de Áudio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {audioLeveling.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      {audioLeveling.length} segmentos de áudio analisados
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Nível médio original:</span>
                        <span>{(audioLeveling.reduce((sum, a) => sum + a.originalLevel, 0) / audioLeveling.length).toFixed(1)} dB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Nível sugerido:</span>
                        <span>{(audioLeveling.reduce((sum, a) => sum + a.suggestedLevel, 0) / audioLeveling.length).toFixed(1)} dB</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleAudioLeveling}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Aplicar Nivelamento
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Execute a análise para nivelar áudio</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Batch Processing Tab */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileVideo className="h-5 w-5" />
                <span>Processamento em Lote</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Selection */}
              <div>
                <Label htmlFor="batch-files">Selecionar Arquivos</Label>
                <Input
                  id="batch-files"
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
                {batchFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {batchFiles.length} arquivo(s) selecionado(s)
                  </div>
                )}
              </div>

              {/* Batch Settings */}
              <div className="space-y-3">
                <Label>Configurações do Lote</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={batchSettings.autocut}
                      onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, autocut: checked }))}
                    />
                    <Label>Cortes Automáticos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={batchSettings.colorGrading}
                      onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, colorGrading: checked }))}
                    />
                    <Label>Correção de Cor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={batchSettings.audioLeveling}
                      onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, audioLeveling: checked }))}
                    />
                    <Label>Nivelamento de Áudio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={batchSettings.transitions}
                      onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, transitions: checked }))}
                    />
                    <Label>Transições</Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBatchProcessing}
                disabled={batchFiles.length === 0}
                className="w-full"
              >
                <FileVideo className="h-4 w-4 mr-2" />
                Iniciar Processamento em Lote
              </Button>

              {/* Batch Jobs */}
              {batchJobs.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <Label>Jobs em Andamento</Label>
                  <ScrollArea className="h-40">
                    {batchJobs.map((job) => (
                      <div key={job.id} className="p-3 border rounded-lg mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{job.name}</span>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(job.status)}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelBatchJob(job.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={job.progress} className="mb-2" />
                        <div className="text-xs text-gray-600">
                          {job.files.length} arquivo(s) • {job.progress}% concluído
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Export/Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Sessão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleExportSession}
                  disabled={!currentSession}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Sessão
                </Button>
                
                <div>
                  <Label htmlFor="import-session">Importar Sessão</Label>
                  <Input
                    id="import-session"
                    type="file"
                    accept=".json"
                    onChange={handleImportSession}
                  />
                </div>
                
                <Button
                  onClick={clearSession}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Sessão
                </Button>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações da IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sensibilidade de Cortes</Label>
                  <Slider
                    defaultValue={[0.7]}
                    max={1}
                    min={0.1}
                    step={0.1}
                    onValueChange={(value) => updateConfig({
                      smartCutDetection: {
                        ...defaultConfig.smartCutDetection,
                        sensitivity: value[0]
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Label>Limite de Confiança</Label>
                  <Slider
                    defaultValue={[0.7]}
                    max={1}
                    min={0.1}
                    step={0.1}
                    onValueChange={(value) => updateConfig({
                      realTimeSuggestions: {
                        ...defaultConfig.realTimeSuggestions,
                        confidenceThreshold: value[0]
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Label>Máximo de Sugestões</Label>
                  <Slider
                    defaultValue={[5]}
                    max={10}
                    min={1}
                    step={1}
                    onValueChange={(value) => updateConfig({
                      realTimeSuggestions: {
                        ...defaultConfig.realTimeSuggestions,
                        maxSuggestions: value[0]
                      }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}