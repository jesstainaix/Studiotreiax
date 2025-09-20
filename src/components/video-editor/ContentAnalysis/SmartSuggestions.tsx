import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, 
  Music, 
  Type, 
  Zap, 
  TrendingUp, 
  Clock, 
  Eye, 
  Heart,
  Share2,
  Play,
  Pause,
  Download,
  RefreshCw,
  Star,
  ThumbsUp,
  MessageCircle,
  BarChart3,
  Lightbulb,
  Wand2,
  Filter,
  Volume2,
  Image,
  Video
} from 'lucide-react';

// Interfaces para sugestões inteligentes
interface EffectSuggestion {
  id: string;
  name: string;
  category: 'transition' | 'filter' | 'overlay' | 'animation';
  confidence: number;
  reason: string;
  preview: string;
  parameters: Record<string, any>;
  estimatedImpact: {
    engagement: number;
    retention: number;
    appeal: number;
  };
}

interface MusicSuggestion {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  duration: number;
  bpm: number;
  confidence: number;
  reason: string;
  preview: string;
  tags: string[];
  suitability: {
    contentMatch: number;
    paceMatch: number;
    moodMatch: number;
  };
}

interface TextSuggestion {
  id: string;
  type: 'title' | 'subtitle' | 'caption' | 'cta';
  text: string;
  style: {
    font: string;
    size: number;
    color: string;
    animation: string;
  };
  position: {
    x: number;
    y: number;
    timing: number;
  };
  confidence: number;
  reason: string;
  engagement: {
    clickthrough: number;
    retention: number;
    shareability: number;
  };
}

interface EngagementPrediction {
  overall: number;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    retention: number;
  };
  factors: {
    contentQuality: number;
    pacing: number;
    visualAppeal: number;
    audioQuality: number;
    trending: number;
  };
  recommendations: string[];
  targetAudience: {
    ageGroup: string;
    interests: string[];
    platform: string;
  };
}

interface SmartSuggestionsProps {
  videoElement?: HTMLVideoElement;
  contentAnalysis?: any;
  onApplySuggestion?: (suggestion: any) => void;
  className?: string;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  videoElement,
  contentAnalysis,
  onApplySuggestion,
  className = ''
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [effectSuggestions, setEffectSuggestions] = useState<EffectSuggestion[]>([]);
  const [musicSuggestions, setMusicSuggestions] = useState<MusicSuggestion[]>([]);
  const [textSuggestions, setTextSuggestions] = useState<TextSuggestion[]>([]);
  const [engagementPrediction, setEngagementPrediction] = useState<EngagementPrediction | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [autoApply, setAutoApply] = useState(false);

  // Gerar sugestões inteligentes baseadas no conteúdo
  const generateSuggestions = async () => {
    if (!videoElement) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simular análise de conteúdo e geração de sugestões
      await simulateContentAnalysis();
      
      // Gerar sugestões de efeitos
      setAnalysisProgress(25);
      const effects = await generateEffectSuggestions();
      setEffectSuggestions(effects);
      
      // Gerar sugestões de música
      setAnalysisProgress(50);
      const music = await generateMusicSuggestions();
      setMusicSuggestions(music);
      
      // Gerar sugestões de texto
      setAnalysisProgress(75);
      const text = await generateTextSuggestions();
      setTextSuggestions(text);
      
      // Gerar predição de engajamento
      setAnalysisProgress(90);
      const engagement = await generateEngagementPrediction();
      setEngagementPrediction(engagement);
      
      setAnalysisProgress(100);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simulações de algoritmos de IA
  const simulateContentAnalysis = (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  };

  const generateEffectSuggestions = (): Promise<EffectSuggestion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions: EffectSuggestion[] = [
          {
            id: 'cinematic-lut',
            name: 'LUT Cinematográfico',
            category: 'filter',
            confidence: 92,
            reason: 'Detectado conteúdo com iluminação natural, ideal para correção cinematográfica',
            preview: '/api/effects/cinematic-lut/preview',
            parameters: { intensity: 0.8, warmth: 0.3 },
            estimatedImpact: {
              engagement: 15,
              retention: 12,
              appeal: 18
            }
          },
          {
            id: 'smooth-transition',
            name: 'Transição Suave',
            category: 'transition',
            confidence: 87,
            reason: 'Detectados cortes abruptos que podem ser suavizados',
            preview: '/api/effects/smooth-transition/preview',
            parameters: { duration: 0.5, easing: 'ease-in-out' },
            estimatedImpact: {
              engagement: 8,
              retention: 22,
              appeal: 10
            }
          },
          {
            id: 'motion-blur',
            name: 'Motion Blur Dinâmico',
            category: 'animation',
            confidence: 78,
            reason: 'Movimento rápido detectado, motion blur pode adicionar fluidez',
            preview: '/api/effects/motion-blur/preview',
            parameters: { strength: 0.6, threshold: 0.4 },
            estimatedImpact: {
              engagement: 12,
              retention: 8,
              appeal: 14
            }
          },
          {
            id: 'particle-overlay',
            name: 'Partículas Brilhantes',
            category: 'overlay',
            confidence: 71,
            reason: 'Conteúdo celebrativo detectado, partículas podem realçar o momento',
            preview: '/api/effects/particle-overlay/preview',
            parameters: { density: 0.3, sparkle: true },
            estimatedImpact: {
              engagement: 20,
              retention: 5,
              appeal: 25
            }
          }
        ];
        resolve(suggestions);
      }, 1500);
    });
  };

  const generateMusicSuggestions = (): Promise<MusicSuggestion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions: MusicSuggestion[] = [
          {
            id: 'upbeat-electronic',
            title: 'Digital Dreams',
            artist: 'SynthWave Studio',
            genre: 'Electronic',
            mood: 'Energetic',
            duration: 180,
            bpm: 128,
            confidence: 94,
            reason: 'Ritmo e energia combinam perfeitamente com o conteúdo dinâmico',
            preview: '/api/music/digital-dreams/preview',
            tags: ['upbeat', 'modern', 'tech', 'motivational'],
            suitability: {
              contentMatch: 94,
              paceMatch: 89,
              moodMatch: 91
            }
          },
          {
            id: 'ambient-chill',
            title: 'Peaceful Moments',
            artist: 'Ambient Collective',
            genre: 'Ambient',
            mood: 'Calm',
            duration: 240,
            bpm: 72,
            confidence: 86,
            reason: 'Momentos contemplativos detectados, música ambiente realça a atmosfera',
            preview: '/api/music/peaceful-moments/preview',
            tags: ['calm', 'atmospheric', 'meditation', 'peaceful'],
            suitability: {
              contentMatch: 86,
              paceMatch: 92,
              moodMatch: 88
            }
          },
          {
            id: 'corporate-inspiring',
            title: 'Success Journey',
            artist: 'Corporate Sounds',
            genre: 'Corporate',
            mood: 'Inspiring',
            duration: 150,
            bpm: 110,
            confidence: 82,
            reason: 'Conteúdo profissional detectado, música corporativa inspiradora é ideal',
            preview: '/api/music/success-journey/preview',
            tags: ['corporate', 'inspiring', 'professional', 'achievement'],
            suitability: {
              contentMatch: 88,
              paceMatch: 78,
              moodMatch: 85
            }
          }
        ];
        resolve(suggestions);
      }, 1200);
    });
  };

  const generateTextSuggestions = (): Promise<TextSuggestion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions: TextSuggestion[] = [
          {
            id: 'main-title',
            type: 'title',
            text: 'Transforme Sua Visão em Realidade',
            style: {
              font: 'Montserrat Bold',
              size: 48,
              color: '#ffffff',
              animation: 'fadeInUp'
            },
            position: {
              x: 50,
              y: 30,
              timing: 2
            },
            confidence: 91,
            reason: 'Título impactante baseado no conteúdo motivacional detectado',
            engagement: {
              clickthrough: 23,
              retention: 18,
              shareability: 31
            }
          },
          {
            id: 'call-to-action',
            type: 'cta',
            text: 'Descubra Como →',
            style: {
              font: 'Open Sans Semibold',
              size: 24,
              color: '#ff6b35',
              animation: 'pulse'
            },
            position: {
              x: 50,
              y: 80,
              timing: 8
            },
            confidence: 88,
            reason: 'CTA otimizado para maximizar conversões baseado em padrões de sucesso',
            engagement: {
              clickthrough: 42,
              retention: 15,
              shareability: 12
            }
          },
          {
            id: 'subtitle-info',
            type: 'subtitle',
            text: 'Tecnologia Avançada • Resultados Garantidos',
            style: {
              font: 'Roboto Regular',
              size: 18,
              color: '#cccccc',
              animation: 'slideInLeft'
            },
            position: {
              x: 50,
              y: 45,
              timing: 4
            },
            confidence: 79,
            reason: 'Subtítulo informativo que complementa o título principal',
            engagement: {
              clickthrough: 8,
              retention: 25,
              shareability: 14
            }
          }
        ];
        resolve(suggestions);
      }, 1000);
    });
  };

  const generateEngagementPrediction = (): Promise<EngagementPrediction> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const prediction: EngagementPrediction = {
          overall: 87,
          metrics: {
            views: 15420,
            likes: 1234,
            shares: 89,
            comments: 156,
            retention: 78
          },
          factors: {
            contentQuality: 92,
            pacing: 84,
            visualAppeal: 89,
            audioQuality: 81,
            trending: 76
          },
          recommendations: [
            'Adicionar mais momentos de suspense nos primeiros 15 segundos',
            'Incluir call-to-action mais cedo no vídeo',
            'Melhorar a qualidade do áudio em algumas seções',
            'Considerar hashtags trending para maior alcance'
          ],
          targetAudience: {
            ageGroup: '25-34',
            interests: ['tecnologia', 'inovação', 'produtividade'],
            platform: 'YouTube'
          }
        };
        resolve(prediction);
      }, 800);
    });
  };

  const applySuggestion = (suggestion: any) => {
    onApplySuggestion?.(suggestion);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 90) return 'default';
    if (confidence >= 80) return 'secondary';
    return 'outline';
  };

  const filteredEffectSuggestions = effectSuggestions.filter(s => 
    s.confidence >= confidenceThreshold && 
    (selectedCategory === 'all' || s.category === selectedCategory)
  );

  const filteredMusicSuggestions = musicSuggestions.filter(s => 
    s.confidence >= confidenceThreshold
  );

  const filteredTextSuggestions = textSuggestions.filter(s => 
    s.confidence >= confidenceThreshold
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Sugestões Inteligentes com IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={generateSuggestions}
                disabled={!videoElement || isAnalyzing}
                size="sm"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? 'Analisando...' : 'Gerar Sugestões'}
              </Button>
            </div>
          </div>
          {isAnalyzing && (
            <div className="mt-4">
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Analisando conteúdo e gerando sugestões personalizadas...
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isAnalyzing && (effectSuggestions.length > 0 || musicSuggestions.length > 0 || textSuggestions.length > 0) ? (
            <div className="space-y-6">
              {/* Controles de Filtro */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Confiança mínima:</span>
                  <div className="w-32">
                    <Slider
                      value={[confidenceThreshold]}
                      onValueChange={([value]) => setConfidenceThreshold(value)}
                      min={50}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <span className="text-sm font-medium">{confidenceThreshold}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Auto-aplicar:</span>
                  <Switch 
                    checked={autoApply}
                    onCheckedChange={setAutoApply}
                  />
                </div>
              </div>

              <Tabs defaultValue="effects" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="effects" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Efeitos ({filteredEffectSuggestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="music" className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Música ({filteredMusicSuggestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Texto ({filteredTextSuggestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="engagement" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Engajamento
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="effects" className="mt-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {filteredEffectSuggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{suggestion.name}</h4>
                                <Badge variant={getConfidenceBadgeVariant(suggestion.confidence)}>
                                  {suggestion.confidence}%
                                </Badge>
                                <Badge variant="outline">
                                  {suggestion.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {suggestion.reason}
                              </p>
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Engajamento:</span>
                                  <p className="font-medium">+{suggestion.estimatedImpact.engagement}%</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Retenção:</span>
                                  <p className="font-medium">+{suggestion.estimatedImpact.retention}%</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Apelo:</span>
                                  <p className="font-medium">+{suggestion.estimatedImpact.appeal}%</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button 
                                size="sm" 
                                onClick={() => applySuggestion(suggestion)}
                              >
                                Aplicar
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="music" className="mt-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {filteredMusicSuggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Music className="h-4 w-4" />
                                <h4 className="font-medium">{suggestion.title}</h4>
                                <Badge variant={getConfidenceBadgeVariant(suggestion.confidence)}>
                                  {suggestion.confidence}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {suggestion.artist} • {suggestion.genre} • {suggestion.mood}
                              </p>
                              <p className="text-sm text-muted-foreground mb-3">
                                {suggestion.reason}
                              </p>
                              <div className="flex items-center gap-4 text-xs mb-3">
                                <span>⏱️ {Math.floor(suggestion.duration / 60)}:{(suggestion.duration % 60).toString().padStart(2, '0')}</span>
                                <span>🎵 {suggestion.bpm} BPM</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Conteúdo:</span>
                                  <p className="font-medium">{suggestion.suitability.contentMatch}%</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Ritmo:</span>
                                  <p className="font-medium">{suggestion.suitability.paceMatch}%</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Humor:</span>
                                  <p className="font-medium">{suggestion.suitability.moodMatch}%</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button 
                                size="sm" 
                                onClick={() => applySuggestion(suggestion)}
                              >
                                Aplicar
                              </Button>
                              <Button size="sm" variant="outline">
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="text" className="mt-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {filteredTextSuggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Type className="h-4 w-4" />
                                <h4 className="font-medium">{suggestion.type.toUpperCase()}</h4>
                                <Badge variant={getConfidenceBadgeVariant(suggestion.confidence)}>
                                  {suggestion.confidence}%
                                </Badge>
                              </div>
                              <div className="bg-muted/50 p-3 rounded mb-3">
                                <p className="font-medium" style={{ 
                                  fontFamily: suggestion.style.font,
                                  fontSize: `${Math.min(suggestion.style.size / 2, 18)}px`,
                                  color: suggestion.style.color
                                }}>
                                  {suggestion.text}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {suggestion.reason}
                              </p>
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">CTR:</span>
                                  <p className="font-medium">+{suggestion.engagement.clickthrough}%</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Retenção:</span>
                                  <p className="font-medium">+{suggestion.engagement.retention}%</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Shares:</span>
                                  <p className="font-medium">+{suggestion.engagement.shareability}%</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button 
                                size="sm" 
                                onClick={() => applySuggestion(suggestion)}
                              >
                                Aplicar
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="engagement" className="mt-4">
                  {engagementPrediction && (
                    <div className="space-y-6">
                      {/* Score Geral */}
                      <Card className="p-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">
                            {engagementPrediction.overall}%
                          </div>
                          <p className="text-muted-foreground">Score de Engajamento Previsto</p>
                        </div>
                      </Card>

                      {/* Métricas Previstas */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Métricas Previstas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                              <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold">{engagementPrediction.metrics.views.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">Visualizações</p>
                            </div>
                            <div className="text-center">
                              <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold">{engagementPrediction.metrics.likes.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">Curtidas</p>
                            </div>
                            <div className="text-center">
                              <Share2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold">{engagementPrediction.metrics.shares}</p>
                              <p className="text-sm text-muted-foreground">Compartilhamentos</p>
                            </div>
                            <div className="text-center">
                              <MessageCircle className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold">{engagementPrediction.metrics.comments}</p>
                              <p className="text-sm text-muted-foreground">Comentários</p>
                            </div>
                            <div className="text-center">
                              <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold">{engagementPrediction.metrics.retention}%</p>
                              <p className="text-sm text-muted-foreground">Retenção</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Fatores de Influência */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Fatores de Influência
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {Object.entries(engagementPrediction.factors).map(([factor, score]) => (
                              <div key={factor} className="flex items-center justify-between">
                                <span className="capitalize">
                                  {factor.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Progress value={score} className="w-24 h-2" />
                                  <span className="text-sm font-medium w-12">{score}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recomendações */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Recomendações para Melhorar
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {engagementPrediction.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Público-Alvo */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Público-Alvo Recomendado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Faixa Etária:</span>
                              <p className="font-medium">{engagementPrediction.targetAudience.ageGroup}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Interesses:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {engagementPrediction.targetAudience.interests.map((interest, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Plataforma:</span>
                              <p className="font-medium">{engagementPrediction.targetAudience.platform}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : !isAnalyzing ? (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Sugestões Inteligentes</h3>
              <p className="text-muted-foreground mb-6">
                Carregue um vídeo e clique em "Gerar Sugestões" para receber recomendações personalizadas baseadas em IA
              </p>
              <Button 
                onClick={generateSuggestions}
                disabled={!videoElement}
                size="lg"
              >
                <Wand2 className="h-5 w-5 mr-2" />
                Começar Análise
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartSuggestions;