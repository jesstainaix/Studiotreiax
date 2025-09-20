import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Lightbulb, 
  Music, 
  Type, 
  Clock, 
  TrendingUp, 
  Star,
  Play,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { ContentAnalysisResult } from '../hooks/useContentAnalysis';

interface SmartSuggestionsProps {
  analysisResult: ContentAnalysisResult | null;
  onApplySuggestion: (suggestion: Suggestion) => void;
  onRefreshSuggestions: () => void;
  isLoading?: boolean;
}

interface Suggestion {
  id: string;
  type: 'effect' | 'music' | 'text' | 'duration' | 'engagement';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  preview?: string;
  parameters?: Record<string, any>;
  estimatedImprovement: number;
}

interface EffectSuggestion extends Suggestion {
  type: 'effect';
  effectType: 'color' | 'transition' | 'filter' | 'stabilization';
  previewUrl?: string;
}

interface MusicSuggestion extends Suggestion {
  type: 'music';
  genre: string;
  mood: string;
  tempo: number;
  duration: number;
  audioUrl?: string;
}

interface TextSuggestion extends Suggestion {
  type: 'text';
  textType: 'title' | 'subtitle' | 'caption' | 'overlay';
  content: string;
  style: Record<string, any>;
}

interface DurationSuggestion extends Suggestion {
  type: 'duration';
  recommendedDuration: number;
  currentDuration: number;
  segments: Array<{
    start: number;
    end: number;
    importance: number;
    reason: string;
  }>;
}

interface EngagementSuggestion extends Suggestion {
  type: 'engagement';
  metric: 'retention' | 'click_rate' | 'shares' | 'completion';
  currentScore: number;
  targetScore: number;
  strategies: string[];
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  analysisResult,
  onApplySuggestion,
  onRefreshSuggestions,
  isLoading = false
}) => {
  const [selectedTab, setSelectedTab] = useState('effects');
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [previewingSuggestion, setPreviewingSuggestion] = useState<string | null>(null);

  // Gerar sugestões baseadas na análise
  const suggestions = useMemo(() => {
    if (!analysisResult) return [];

    const allSuggestions: Suggestion[] = [];

    // Sugestões de efeitos baseadas na qualidade
    if (analysisResult.qualityAnalysis.overall < 70) {
      allSuggestions.push({
        id: 'color-correction',
        type: 'effect',
        title: 'Correção Automática de Cor',
        description: 'Melhore o balanço de cores e exposição automaticamente',
        confidence: 85,
        impact: 'high',
        category: 'Qualidade',
        estimatedImprovement: 15,
        parameters: {
          brightness: 10,
          contrast: 15,
          saturation: 5
        }
      } as EffectSuggestion);
    }

    if (analysisResult.qualityAnalysis.video.noise < 60) {
      allSuggestions.push({
        id: 'noise-reduction',
        type: 'effect',
        title: 'Redução de Ruído',
        description: 'Remova ruído visual para uma imagem mais limpa',
        confidence: 78,
        impact: 'medium',
        category: 'Qualidade',
        estimatedImprovement: 12,
        parameters: {
          strength: 0.7,
          preserveDetails: true
        }
      } as EffectSuggestion);
    }

    if (analysisResult.motionAnalysis.stability.overall < 60) {
      allSuggestions.push({
        id: 'stabilization',
        type: 'effect',
        title: 'Estabilização de Vídeo',
        description: 'Reduza tremores e movimentos indesejados da câmera',
        confidence: 82,
        impact: 'high',
        category: 'Movimento',
        estimatedImprovement: 20,
        parameters: {
          strength: 0.8,
          cropFactor: 0.1
        }
      } as EffectSuggestion);
    }

    // Sugestões de música baseadas no conteúdo
    const dominantColor = analysisResult.colorAnalysis.dominantColors[0];
    const colorTemp = analysisResult.colorAnalysis.temperature?.value || 5500;
    
    if (colorTemp > 6000) {
      allSuggestions.push({
        id: 'cool-music',
        type: 'music',
        title: 'Trilha Sonora Moderna',
        description: 'Música eletrônica que combina com as cores frias do vídeo',
        confidence: 72,
        impact: 'medium',
        category: 'Áudio',
        genre: 'Electronic',
        mood: 'Energetic',
        tempo: 128,
        duration: 180,
        estimatedImprovement: 18
      } as MusicSuggestion);
    } else if (colorTemp < 4500) {
      allSuggestions.push({
        id: 'warm-music',
        type: 'music',
        title: 'Trilha Sonora Aconchegante',
        description: 'Música acústica que complementa as cores quentes',
        confidence: 75,
        impact: 'medium',
        category: 'Áudio',
        genre: 'Acoustic',
        mood: 'Warm',
        tempo: 95,
        duration: 200,
        estimatedImprovement: 16
      } as MusicSuggestion);
    }

    // Sugestões de texto baseadas na composição
    if (analysisResult.compositionAnalysis.ruleOfThirds.score > 70) {
      allSuggestions.push({
        id: 'title-overlay',
        type: 'text',
        title: 'Título Bem Posicionado',
        description: 'Adicione um título aproveitando a boa composição',
        confidence: 68,
        impact: 'medium',
        category: 'Texto',
        textType: 'title',
        content: 'Seu Título Aqui',
        style: {
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        },
        estimatedImprovement: 10
      } as TextSuggestion);
    }

    // Sugestões de duração baseadas no movimento
    const hasLowMovement = analysisResult.motionAnalysis.objectMovement.count < 2;
    if (hasLowMovement) {
      allSuggestions.push({
        id: 'duration-optimize',
        type: 'duration',
        title: 'Otimizar Duração',
        description: 'Reduza a duração para manter o engajamento',
        confidence: 70,
        impact: 'high',
        category: 'Edição',
        recommendedDuration: 45,
        currentDuration: 60,
        segments: [
          { start: 0, end: 15, importance: 90, reason: 'Introdução forte' },
          { start: 15, end: 35, importance: 60, reason: 'Conteúdo principal' },
          { start: 35, end: 45, importance: 85, reason: 'Conclusão impactante' }
        ],
        estimatedImprovement: 25
      } as DurationSuggestion);
    }

    // Sugestões de engajamento
    allSuggestions.push({
      id: 'engagement-boost',
      type: 'engagement',
      title: 'Aumentar Retenção',
      description: 'Estratégias para manter a audiência engajada',
      confidence: 65,
      impact: 'high',
      category: 'Engajamento',
      metric: 'retention',
      currentScore: 60,
      targetScore: 80,
      strategies: [
        'Adicionar cortes dinâmicos a cada 3-5 segundos',
        'Usar zoom e movimento de câmera',
        'Incluir elementos visuais chamativos'
      ],
      estimatedImprovement: 30
    } as EngagementSuggestion);

    return allSuggestions;
  }, [analysisResult]);

  // Filtrar sugestões por tipo
  const effectSuggestions = suggestions.filter(s => s.type === 'effect');
  const musicSuggestions = suggestions.filter(s => s.type === 'music');
  const textSuggestions = suggestions.filter(s => s.type === 'text');
  const durationSuggestions = suggestions.filter(s => s.type === 'duration');
  const engagementSuggestions = suggestions.filter(s => s.type === 'engagement');

  const handleApplySuggestion = (suggestion: Suggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    onApplySuggestion(suggestion);
  };

  const handlePreviewSuggestion = (suggestionId: string) => {
    setPreviewingSuggestion(suggestionId);
    // Simular preview por 3 segundos
    setTimeout(() => {
      setPreviewingSuggestion(null);
    }, 3000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'effect': return <Zap className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'duration': return <Clock className="w-4 h-4" />;
      case 'engagement': return <TrendingUp className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const renderSuggestionCard = (suggestion: Suggestion) => {
    const isApplied = appliedSuggestions.has(suggestion.id);
    const isPreviewing = previewingSuggestion === suggestion.id;

    return (
      <Card key={suggestion.id} className={`transition-all duration-200 ${
        isPreviewing ? 'ring-2 ring-blue-500 shadow-lg' : ''
      } ${
        isApplied ? 'bg-green-50 border-green-200' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getTypeIcon(suggestion.type)}
              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getImpactColor(suggestion.impact)}>
                {suggestion.impact}
              </Badge>
              <Badge variant="outline">
                +{suggestion.estimatedImprovement}%
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{suggestion.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Confiança:</span>
              <div className="flex items-center gap-2">
                <Progress value={suggestion.confidence} className="w-20 h-2" />
                <span className="font-medium">{suggestion.confidence}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Categoria:</span>
              <Badge variant="secondary">{suggestion.category}</Badge>
            </div>

            {/* Detalhes específicos por tipo */}
            {suggestion.type === 'music' && (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Gênero:</span>
                  <span>{(suggestion as MusicSuggestion).genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Humor:</span>
                  <span>{(suggestion as MusicSuggestion).mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tempo:</span>
                  <span>{(suggestion as MusicSuggestion).tempo} BPM</span>
                </div>
              </div>
            )}

            {suggestion.type === 'duration' && (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Duração Atual:</span>
                  <span>{(suggestion as DurationSuggestion).currentDuration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recomendada:</span>
                  <span className="font-medium text-green-600">
                    {(suggestion as DurationSuggestion).recommendedDuration}s
                  </span>
                </div>
              </div>
            )}

            {suggestion.type === 'engagement' && (
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Score Atual:</span>
                  <span>{(suggestion as EngagementSuggestion).currentScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Meta:</span>
                  <span className="font-medium text-green-600">
                    {(suggestion as EngagementSuggestion).targetScore}%
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500 text-xs">Estratégias:</span>
                  <ul className="text-xs mt-1 space-y-1">
                    {(suggestion as EngagementSuggestion).strategies.slice(0, 2).map((strategy, idx) => (
                      <li key={idx} className="text-gray-600">• {strategy}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {!isApplied && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewSuggestion(suggestion.id)}
                    disabled={isPreviewing}
                    className="flex-1"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {isPreviewing ? 'Visualizando...' : 'Preview'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Aplicar
                  </Button>
                </>
              )}
              {isApplied && (
                <Button size="sm" variant="outline" disabled className="flex-1">
                  <Star className="w-3 h-3 mr-1" />
                  Aplicado
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!analysisResult) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Execute uma análise de conteúdo para ver sugestões inteligentes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Sugestões Inteligentes</h2>
          <Badge variant="secondary">{suggestions.length} sugestões</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshSuggestions}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="effects" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Efeitos ({effectSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="music" className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            Música ({musicSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-1">
            <Type className="w-3 h-3" />
            Texto ({textSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="duration" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Duração ({durationSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Engajamento ({engagementSuggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="effects" className="space-y-4">
          {effectSuggestions.length > 0 ? (
            <div className="grid gap-4">
              {effectSuggestions.map(renderSuggestionCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-500">Nenhuma sugestão de efeito disponível</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="music" className="space-y-4">
          {musicSuggestions.length > 0 ? (
            <div className="grid gap-4">
              {musicSuggestions.map(renderSuggestionCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-500">Nenhuma sugestão de música disponível</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          {textSuggestions.length > 0 ? (
            <div className="grid gap-4">
              {textSuggestions.map(renderSuggestionCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-500">Nenhuma sugestão de texto disponível</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="duration" className="space-y-4">
          {durationSuggestions.length > 0 ? (
            <div className="grid gap-4">
              {durationSuggestions.map(renderSuggestionCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-500">Nenhuma sugestão de duração disponível</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          {engagementSuggestions.length > 0 ? (
            <div className="grid gap-4">
              {engagementSuggestions.map(renderSuggestionCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-500">Nenhuma sugestão de engajamento disponível</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartSuggestions;
export type {
  SmartSuggestionsProps,
  Suggestion,
  EffectSuggestion,
  MusicSuggestion,
  TextSuggestion,
  DurationSuggestion,
  EngagementSuggestion
};