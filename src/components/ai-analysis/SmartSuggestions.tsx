import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, Music, Type, Image, Wand2, ThumbsUp, Clock, 
  Palette, Volume2, Eye, TrendingUp, Star, Play, Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ContentAnalysis {
  mood: 'energetic' | 'calm' | 'dramatic' | 'romantic' | 'corporate' | 'fun' | 'mysterious';
  dominantColors: string[];
  brightness: number;
  contrast: number;
  motionLevel: 'low' | 'medium' | 'high';
  audioTempo: number;
  sceneChanges: number;
  faceCount: number;
  objectTypes: string[];
  textPresent: boolean;
  duration: number;
  aspectRatio: string;
  qualityScore: number;
}

interface EffectSuggestion {
  id: string;
  name: string;
  type: 'filter' | 'transition' | 'overlay' | 'animation';
  confidence: number;
  reason: string;
  preview: string;
  parameters: Record<string, any>;
  category: string;
}

interface MusicSuggestion {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  tempo: number;
  duration: number;
  confidence: number;
  reason: string;
  preview: string;
  tags: string[];
}

interface TextSuggestion {
  id: string;
  type: 'title' | 'subtitle' | 'caption' | 'watermark';
  text: string;
  position: { x: number; y: number };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    animation?: string;
  };
  confidence: number;
  reason: string;
}

interface ThumbnailSuggestion {
  id: string;
  timestamp: number;
  score: number;
  reason: string;
  preview: string;
  features: {
    hasText: boolean;
    hasFaces: boolean;
    colorfulness: number;
    contrast: number;
    composition: number;
  };
}

interface SmartSuggestionsProps {
  videoElement?: HTMLVideoElement;
  contentAnalysis?: ContentAnalysis;
  onEffectApply?: (effect: EffectSuggestion) => void;
  onMusicSelect?: (music: MusicSuggestion) => void;
  onTextAdd?: (text: TextSuggestion) => void;
  onThumbnailSelect?: (thumbnail: ThumbnailSuggestion) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  videoElement,
  contentAnalysis,
  onEffectApply,
  onMusicSelect,
  onTextAdd,
  onThumbnailSelect
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [effectSuggestions, setEffectSuggestions] = useState<EffectSuggestion[]>([]);
  const [musicSuggestions, setMusicSuggestions] = useState<MusicSuggestion[]>([]);
  const [textSuggestions, setTextSuggestions] = useState<TextSuggestion[]>([]);
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<ThumbnailSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [engagementPrediction, setEngagementPrediction] = useState<any>(null);

  // Algoritmo de análise de mood baseado em características visuais e de áudio
  const analyzeMood = useCallback((analysis: ContentAnalysis): string => {
    const { brightness, contrast, motionLevel, audioTempo, dominantColors } = analysis;
    
    // Análise de cores dominantes
    const warmColors = dominantColors.filter(color => {
      const rgb = hexToRgb(color);
      return rgb && (rgb.r > rgb.b && rgb.r > 100);
    }).length;
    
    const coolColors = dominantColors.filter(color => {
      const rgb = hexToRgb(color);
      return rgb && (rgb.b > rgb.r && rgb.b > 100);
    }).length;
    
    // Score de energia baseado em múltiplos fatores
    let energyScore = 0;
    energyScore += motionLevel === 'high' ? 30 : motionLevel === 'medium' ? 15 : 0;
    energyScore += audioTempo > 120 ? 25 : audioTempo > 80 ? 10 : 0;
    energyScore += contrast > 50 ? 20 : 10;
    energyScore += warmColors > coolColors ? 15 : 0;
    energyScore += brightness > 60 ? 10 : 0;
    
    // Determinar mood baseado no score
    if (energyScore > 70) return 'energetic';
    if (energyScore > 50) return 'fun';
    if (energyScore < 20 && coolColors > warmColors) return 'calm';
    if (contrast > 70 && brightness < 40) return 'dramatic';
    if (warmColors > 2 && brightness > 50) return 'romantic';
    if (brightness > 70 && contrast < 30) return 'corporate';
    return 'mysterious';
  }, []);

  // Função auxiliar para converter hex para RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Algoritmo de sugestão de efeitos baseado no conteúdo
  const generateEffectSuggestions = useCallback((analysis: ContentAnalysis): EffectSuggestion[] => {
    const suggestions: EffectSuggestion[] = [];
    const mood = analyzeMood(analysis);
    
    // Sugestões baseadas no mood
    const moodEffects = {
      energetic: [
        { name: 'Neon Glow', type: 'filter', category: 'Color', confidence: 85, reason: 'Conteúdo energético combina com efeitos vibrantes' },
        { name: 'Fast Zoom', type: 'animation', category: 'Motion', confidence: 80, reason: 'Alto nível de movimento detectado' },
        { name: 'Strobe Flash', type: 'overlay', category: 'Effects', confidence: 75, reason: 'Ritmo acelerado do áudio' }
      ],
      calm: [
        { name: 'Soft Blur', type: 'filter', category: 'Artistic', confidence: 90, reason: 'Atmosfera calma requer efeitos suaves' },
        { name: 'Fade Transition', type: 'transition', category: 'Transitions', confidence: 85, reason: 'Baixo movimento, ideal para transições suaves' },
        { name: 'Vintage Film', type: 'filter', category: 'Retro', confidence: 70, reason: 'Cores frias e baixo contraste' }
      ],
      dramatic: [
        { name: 'High Contrast', type: 'filter', category: 'Color', confidence: 95, reason: 'Alto contraste já presente, intensificar o drama' },
        { name: 'Vignette Dark', type: 'overlay', category: 'Cinematic', confidence: 88, reason: 'Baixo brilho ideal para vinheta escura' },
        { name: 'Slow Motion', type: 'animation', category: 'Time', confidence: 82, reason: 'Amplificar tensão dramática' }
      ],
      romantic: [
        { name: 'Warm Glow', type: 'filter', category: 'Color', confidence: 92, reason: 'Cores quentes dominantes detectadas' },
        { name: 'Heart Particles', type: 'overlay', category: 'Romantic', confidence: 78, reason: 'Mood romântico identificado' },
        { name: 'Soft Focus', type: 'filter', category: 'Artistic', confidence: 85, reason: 'Criar atmosfera romântica' }
      ],
      corporate: [
        { name: 'Clean Sharpen', type: 'filter', category: 'Professional', confidence: 88, reason: 'Conteúdo corporativo requer clareza' },
        { name: 'Lower Third', type: 'overlay', category: 'Text', confidence: 95, reason: 'Padrão para vídeos corporativos' },
        { name: 'Slide Transition', type: 'transition', category: 'Professional', confidence: 80, reason: 'Transições profissionais' }
      ],
      fun: [
        { name: 'Rainbow Filter', type: 'filter', category: 'Fun', confidence: 83, reason: 'Conteúdo divertido com boa energia' },
        { name: 'Bounce Animation', type: 'animation', category: 'Motion', confidence: 77, reason: 'Movimento médio, ideal para animações' },
        { name: 'Confetti Overlay', type: 'overlay', category: 'Celebration', confidence: 72, reason: 'Atmosfera alegre detectada' }
      ],
      mysterious: [
        { name: 'Dark Vignette', type: 'overlay', category: 'Cinematic', confidence: 87, reason: 'Baixo brilho cria mistério' },
        { name: 'Fog Effect', type: 'overlay', category: 'Atmospheric', confidence: 81, reason: 'Amplificar atmosfera misteriosa' },
        { name: 'Glitch Transition', type: 'transition', category: 'Digital', confidence: 75, reason: 'Efeito perturbador para mistério' }
      ]
    };
    
    // Adicionar efeitos baseados no mood
    const moodBasedEffects = moodEffects[mood] || [];
    moodBasedEffects.forEach((effect, index) => {
      suggestions.push({
        id: `mood-${index}`,
        name: effect.name,
        type: effect.type as any,
        confidence: effect.confidence,
        reason: effect.reason,
        preview: `/effects/${effect.name.toLowerCase().replace(' ', '-')}.jpg`,
        parameters: generateEffectParameters(effect.name),
        category: effect.category
      });
    });
    
    // Sugestões baseadas em características técnicas
    if (analysis.brightness < 30) {
      suggestions.push({
        id: 'brightness-boost',
        name: 'Brightness Boost',
        type: 'filter',
        confidence: 90,
        reason: 'Vídeo muito escuro, correção de brilho recomendada',
        preview: '/effects/brightness-boost.jpg',
        parameters: { brightness: 25, contrast: 10 },
        category: 'Correction'
      });
    }
    
    if (analysis.contrast < 20) {
      suggestions.push({
        id: 'contrast-enhance',
        name: 'Contrast Enhancement',
        type: 'filter',
        confidence: 85,
        reason: 'Baixo contraste detectado, melhoria recomendada',
        preview: '/effects/contrast-enhance.jpg',
        parameters: { contrast: 30, saturation: 15 },
        category: 'Correction'
      });
    }
    
    // Sugestões baseadas em objetos detectados
    if (analysis.faceCount > 0) {
      suggestions.push({
        id: 'face-beauty',
        name: 'Beauty Filter',
        type: 'filter',
        confidence: 88,
        reason: `${analysis.faceCount} face(s) detectada(s), filtro de beleza recomendado`,
        preview: '/effects/beauty-filter.jpg',
        parameters: { smoothing: 40, brightening: 20 },
        category: 'Portrait'
      });
    }
    
    if (analysis.objectTypes.includes('landscape')) {
      suggestions.push({
        id: 'landscape-enhance',
        name: 'Landscape Enhancement',
        type: 'filter',
        confidence: 82,
        reason: 'Paisagem detectada, realce de cores naturais',
        preview: '/effects/landscape-enhance.jpg',
        parameters: { saturation: 25, vibrance: 20, clarity: 15 },
        category: 'Nature'
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }, [analyzeMood]);

  // Gerar parâmetros específicos para cada efeito
  const generateEffectParameters = (effectName: string): Record<string, any> => {
    const parameterMap: Record<string, any> = {
      'Neon Glow': { intensity: 70, color: '#00ffff', blur: 5 },
      'Soft Blur': { radius: 3, opacity: 60 },
      'High Contrast': { contrast: 40, blacks: -20, whites: 20 },
      'Warm Glow': { temperature: 500, tint: 10, intensity: 50 },
      'Clean Sharpen': { amount: 80, radius: 1.2, threshold: 3 },
      'Rainbow Filter': { hue: 180, saturation: 50, lightness: 10 },
      'Dark Vignette': { size: 60, feather: 80, opacity: 70 }
    };
    
    return parameterMap[effectName] || {};
  };

  // Algoritmo de sugestão de música baseado no mood e características
  const generateMusicSuggestions = useCallback((analysis: ContentAnalysis): MusicSuggestion[] => {
    const mood = analyzeMood(analysis);
    const duration = analysis.duration;
    
    // Base de dados simulada de músicas por mood
    const musicDatabase = {
      energetic: [
        { title: 'Electric Dreams', artist: 'Synth Wave', genre: 'Electronic', tempo: 128, tags: ['upbeat', 'modern', 'dance'] },
        { title: 'Power Drive', artist: 'Rock Force', genre: 'Rock', tempo: 140, tags: ['energetic', 'guitar', 'powerful'] },
        { title: 'Neon Nights', artist: 'Cyber Punk', genre: 'Synthwave', tempo: 132, tags: ['futuristic', 'vibrant', 'electronic'] }
      ],
      calm: [
        { title: 'Peaceful Waters', artist: 'Nature Sounds', genre: 'Ambient', tempo: 60, tags: ['relaxing', 'nature', 'meditation'] },
        { title: 'Soft Whispers', artist: 'Acoustic Dreams', genre: 'Acoustic', tempo: 70, tags: ['gentle', 'acoustic', 'soothing'] },
        { title: 'Morning Mist', artist: 'Zen Garden', genre: 'New Age', tempo: 65, tags: ['peaceful', 'atmospheric', 'calm'] }
      ],
      dramatic: [
        { title: 'Epic Journey', artist: 'Orchestra Prime', genre: 'Orchestral', tempo: 90, tags: ['cinematic', 'epic', 'dramatic'] },
        { title: 'Dark Tension', artist: 'Film Score', genre: 'Cinematic', tempo: 85, tags: ['suspense', 'dark', 'intense'] },
        { title: 'Rising Storm', artist: 'Symphony X', genre: 'Classical', tempo: 95, tags: ['building', 'powerful', 'orchestral'] }
      ],
      romantic: [
        { title: 'Love Story', artist: 'Romantic Strings', genre: 'Classical', tempo: 75, tags: ['romantic', 'strings', 'emotional'] },
        { title: 'Tender Moments', artist: 'Piano Solo', genre: 'Piano', tempo: 68, tags: ['intimate', 'piano', 'gentle'] },
        { title: 'Sweet Serenade', artist: 'Jazz Quartet', genre: 'Jazz', tempo: 80, tags: ['smooth', 'jazz', 'romantic'] }
      ],
      corporate: [
        { title: 'Success Path', artist: 'Business Beat', genre: 'Corporate', tempo: 110, tags: ['professional', 'motivational', 'clean'] },
        { title: 'Innovation Drive', artist: 'Tech Sounds', genre: 'Electronic', tempo: 115, tags: ['modern', 'technology', 'progress'] },
        { title: 'Team Spirit', artist: 'Corporate Music', genre: 'Uplifting', tempo: 105, tags: ['teamwork', 'positive', 'corporate'] }
      ],
      fun: [
        { title: 'Happy Days', artist: 'Feel Good', genre: 'Pop', tempo: 120, tags: ['happy', 'upbeat', 'fun'] },
        { title: 'Celebration Time', artist: 'Party Mix', genre: 'Dance', tempo: 125, tags: ['party', 'celebration', 'energetic'] },
        { title: 'Sunny Vibes', artist: 'Good Mood', genre: 'Indie Pop', tempo: 115, tags: ['cheerful', 'bright', 'positive'] }
      ],
      mysterious: [
        { title: 'Shadow Games', artist: 'Dark Ambient', genre: 'Ambient', tempo: 70, tags: ['mysterious', 'dark', 'atmospheric'] },
        { title: 'Hidden Secrets', artist: 'Mystery Score', genre: 'Cinematic', tempo: 75, tags: ['suspense', 'intrigue', 'mysterious'] },
        { title: 'Midnight Whispers', artist: 'Noir Jazz', genre: 'Jazz', tempo: 65, tags: ['noir', 'mysterious', 'sophisticated'] }
      ]
    };
    
    const moodMusic = musicDatabase[mood] || [];
    
    return moodMusic.map((music, index) => {
      // Calcular confidence baseado na compatibilidade
      let confidence = 70;
      
      // Bonus por compatibilidade de tempo
      const tempoDiff = Math.abs(music.tempo - analysis.audioTempo);
      if (tempoDiff < 10) confidence += 20;
      else if (tempoDiff < 20) confidence += 10;
      
      // Bonus por duração apropriada
      if (duration > 60 && music.genre !== 'Ambient') confidence += 10;
      if (duration < 30 && music.tempo > 100) confidence += 15;
      
      return {
        id: `music-${mood}-${index}`,
        title: music.title,
        artist: music.artist,
        genre: music.genre,
        mood,
        tempo: music.tempo,
        duration: Math.min(duration, 180), // Máximo 3 minutos
        confidence,
        reason: `Mood ${mood} detectado, tempo compatível (${music.tempo} BPM)`,
        preview: `/music/${music.title.toLowerCase().replace(' ', '-')}.mp3`,
        tags: music.tags
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }, [analyzeMood]);

  // Algoritmo de sugestão de texto baseado no conteúdo
  const generateTextSuggestions = useCallback((analysis: ContentAnalysis): TextSuggestion[] => {
    const suggestions: TextSuggestion[] = [];
    const mood = analyzeMood(analysis);
    
    // Sugestões de título baseadas no mood
    const titleSuggestions = {
      energetic: ['ENERGIA MÁXIMA', 'ACELERE!', 'POWER UP', 'VAMOS NESSA!'],
      calm: ['Momentos de Paz', 'Tranquilidade', 'Serenidade', 'Relaxe'],
      dramatic: ['INTENSO', 'DRAMA', 'ÉPICO', 'IMPACTANTE'],
      romantic: ['Amor Verdadeiro', 'Momentos Especiais', 'Romance', 'Paixão'],
      corporate: ['Sucesso', 'Inovação', 'Excelência', 'Profissional'],
      fun: ['Diversão Garantida!', 'Alegria Total', 'Que Legal!', 'Super Fun'],
      mysterious: ['Mistério', 'Segredos', 'Enigma', 'Oculto']
    };
    
    const titles = titleSuggestions[mood] || ['Título Sugerido'];
    
    titles.forEach((title, index) => {
      suggestions.push({
        id: `title-${index}`,
        type: 'title',
        text: title,
        position: { x: 50, y: 20 }, // Centro superior
        style: {
          fontSize: 48,
          fontFamily: mood === 'corporate' ? 'Arial' : mood === 'dramatic' ? 'Impact' : 'Montserrat',
          color: getTextColorForMood(mood),
          backgroundColor: mood === 'dramatic' ? 'rgba(0,0,0,0.7)' : undefined,
          animation: mood === 'energetic' ? 'pulse' : mood === 'fun' ? 'bounce' : 'fadeIn'
        },
        confidence: 85 - (index * 5),
        reason: `Título ${mood} sugerido baseado na análise de conteúdo`
      });
    });
    
    // Sugestões de legenda se não há texto presente
    if (!analysis.textPresent) {
      const captionSuggestions = [
        'Assista até o final!',
        'Curta e compartilhe',
        'O que você achou?',
        'Deixe seu comentário'
      ];
      
      captionSuggestions.forEach((caption, index) => {
        suggestions.push({
          id: `caption-${index}`,
          type: 'caption',
          text: caption,
          position: { x: 50, y: 85 }, // Centro inferior
          style: {
            fontSize: 24,
            fontFamily: 'Open Sans',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            animation: 'slideUp'
          },
          confidence: 75 - (index * 3),
          reason: 'Nenhum texto detectado, legenda sugerida para engajamento'
        });
      });
    }
    
    // Sugestão de watermark
    suggestions.push({
      id: 'watermark',
      type: 'watermark',
      text: '@SeuCanal',
      position: { x: 90, y: 90 }, // Canto inferior direito
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: 'rgba(255,255,255,0.7)',
        animation: 'none'
      },
      confidence: 60,
      reason: 'Watermark para proteção de marca'
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }, [analyzeMood]);

  // Função auxiliar para cor do texto baseada no mood
  const getTextColorForMood = (mood: string): string => {
    const colorMap: Record<string, string> = {
      energetic: '#ff6b35',
      calm: '#4a90e2',
      dramatic: '#ff0000',
      romantic: '#ff69b4',
      corporate: '#2c3e50',
      fun: '#ffd700',
      mysterious: '#8a2be2'
    };
    return colorMap[mood] || '#ffffff';
  };

  // Algoritmo de sugestão de thumbnail baseado em análise de frames
  const generateThumbnailSuggestions = useCallback(async (videoElement: HTMLVideoElement): Promise<ThumbnailSuggestion[]> => {
    const suggestions: ThumbnailSuggestion[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return suggestions;
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const duration = videoElement.duration;
    const samplePoints = [0.1, 0.25, 0.5, 0.75, 0.9]; // Pontos de amostragem
    
    for (const point of samplePoints) {
      const timestamp = duration * point;
      
      // Simular captura de frame (em implementação real, seria necessário seek no vídeo)
      videoElement.currentTime = timestamp;
      
      await new Promise(resolve => {
        videoElement.addEventListener('seeked', resolve, { once: true });
      });
      
      ctx.drawImage(videoElement, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Analisar qualidades do frame
      const features = analyzeFrameForThumbnail(imageData);
      
      // Calcular score baseado em múltiplos fatores
      let score = 0;
      score += features.contrast * 0.3; // Contraste é importante
      score += features.colorfulness * 0.25; // Cores vibrantes atraem
      score += features.composition * 0.2; // Boa composição
      score += features.hasFaces ? 20 : 0; // Faces aumentam engajamento
      score += features.hasText ? 15 : 0; // Texto pode ser útil
      
      // Penalizar frames muito escuros ou claros
      const brightness = calculateBrightness(imageData);
      if (brightness < 20 || brightness > 240) score *= 0.7;
      
      suggestions.push({
        id: `thumb-${point}`,
        timestamp,
        score,
        reason: generateThumbnailReason(features, score),
        preview: canvas.toDataURL('image/jpeg', 0.8),
        features
      });
    }
    
    return suggestions.sort((a, b) => b.score - a.score);
  }, []);

  // Analisar frame para qualidades de thumbnail
  const analyzeFrameForThumbnail = (imageData: ImageData) => {
    const data = imageData.data;
    let colorfulness = 0;
    const contrast = 0;
    let edgeCount = 0;
    
    // Calcular colorfulness (variação de cores)
    const colorBuckets = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
      colorBuckets[gray]++;
    }
    
    // Calcular entropia das cores (medida de colorfulness)
    const totalPixels = data.length / 4;
    for (const count of colorBuckets) {
      if (count > 0) {
        const probability = count / totalPixels;
        colorfulness -= probability * Math.log2(probability);
      }
    }
    
    // Detectar bordas para composição
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const idx = (y * imageData.width + x) * 4;
        const rightIdx = (y * imageData.width + (x + 1)) * 4;
        const bottomIdx = ((y + 1) * imageData.width + x) * 4;
        
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
        const bottom = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
        
        const gradientX = Math.abs(right - current);
        const gradientY = Math.abs(bottom - current);
        const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        
        if (gradient > 30) edgeCount++;
      }
    }
    
    // Simular detecção de faces e texto (em implementação real, usaria ML)
    const hasFaces = Math.random() > 0.7; // 30% chance
    const hasText = Math.random() > 0.8; // 20% chance
    
    return {
      hasText,
      hasFaces,
      colorfulness: Math.min(100, colorfulness * 10),
      contrast: Math.min(100, (edgeCount / (imageData.width * imageData.height)) * 10000),
      composition: Math.min(100, (edgeCount / (imageData.width * imageData.height)) * 5000)
    };
  };

  // Calcular brilho médio
  const calculateBrightness = (imageData: ImageData): number => {
    const data = imageData.data;
    let total = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      total += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    
    return total / (data.length / 4);
  };

  // Gerar razão para sugestão de thumbnail
  const generateThumbnailReason = (features: any, score: number): string => {
    const reasons = [];
    
    if (features.hasFaces) reasons.push('faces detectadas');
    if (features.hasText) reasons.push('texto presente');
    if (features.colorfulness > 60) reasons.push('cores vibrantes');
    if (features.contrast > 50) reasons.push('bom contraste');
    if (features.composition > 40) reasons.push('boa composição');
    
    if (reasons.length === 0) {
      return score > 50 ? 'Frame com boa qualidade geral' : 'Frame adequado para thumbnail';
    }
    
    return `Recomendado por: ${reasons.join(', ')}`;
  };

  // Predição de engajamento baseada nas sugestões
  const predictEngagement = useCallback((analysis: ContentAnalysis) => {
    const mood = analyzeMood(analysis);
    
    // Fatores que influenciam engajamento
    let engagementScore = 50; // Base
    
    // Mood impact
    const moodMultipliers = {
      energetic: 1.3,
      fun: 1.25,
      dramatic: 1.2,
      romantic: 1.1,
      mysterious: 1.05,
      calm: 0.9,
      corporate: 0.8
    };
    
    engagementScore *= moodMultipliers[mood] || 1;
    
    // Qualidade técnica
    if (analysis.qualityScore > 80) engagementScore += 15;
    else if (analysis.qualityScore < 50) engagementScore -= 10;
    
    // Presença de faces
    if (analysis.faceCount > 0) engagementScore += 10;
    
    // Duração otimizada
    if (analysis.duration >= 15 && analysis.duration <= 60) engagementScore += 10;
    else if (analysis.duration > 120) engagementScore -= 5;
    
    // Movimento e dinamismo
    if (analysis.motionLevel === 'high') engagementScore += 8;
    else if (analysis.motionLevel === 'low') engagementScore -= 5;
    
    return {
      score: Math.max(0, Math.min(100, engagementScore)),
      factors: {
        mood: moodMultipliers[mood] || 1,
        quality: analysis.qualityScore,
        faces: analysis.faceCount,
        duration: analysis.duration,
        motion: analysis.motionLevel
      },
      recommendations: generateEngagementRecommendations(engagementScore, analysis)
    };
  }, [analyzeMood]);

  // Gerar recomendações para melhorar engajamento
  const generateEngagementRecommendations = (score: number, analysis: ContentAnalysis): string[] => {
    const recommendations = [];
    
    if (score < 60) {
      if (analysis.qualityScore < 70) recommendations.push('Melhorar qualidade técnica do vídeo');
      if (analysis.faceCount === 0) recommendations.push('Incluir pessoas ou faces no conteúdo');
      if (analysis.duration > 90) recommendations.push('Considerar reduzir a duração para 60-90 segundos');
      if (analysis.motionLevel === 'low') recommendations.push('Adicionar mais dinamismo e movimento');
    }
    
    if (analysis.textPresent === false) {
      recommendations.push('Adicionar texto ou legendas para maior acessibilidade');
    }
    
    if (analysis.sceneChanges < 3 && analysis.duration > 30) {
      recommendations.push('Incluir mais variações de cena para manter interesse');
    }
    
    return recommendations;
  };

  // Executar análise completa
  const performAnalysis = useCallback(async () => {
    if (!contentAnalysis || !videoElement) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Gerar sugestões de efeitos
      setAnalysisProgress(25);
      const effects = generateEffectSuggestions(contentAnalysis);
      setEffectSuggestions(effects);
      
      // Gerar sugestões de música
      setAnalysisProgress(50);
      const music = generateMusicSuggestions(contentAnalysis);
      setMusicSuggestions(music);
      
      // Gerar sugestões de texto
      setAnalysisProgress(75);
      const text = generateTextSuggestions(contentAnalysis);
      setTextSuggestions(text);
      
      // Gerar sugestões de thumbnail
      setAnalysisProgress(90);
      const thumbnails = await generateThumbnailSuggestions(videoElement);
      setThumbnailSuggestions(thumbnails);
      
      // Calcular predição de engajamento
      const engagement = predictEngagement(contentAnalysis);
      setEngagementPrediction(engagement);
      
      setAnalysisProgress(100);
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [contentAnalysis, videoElement, generateEffectSuggestions, generateMusicSuggestions, 
      generateTextSuggestions, generateThumbnailSuggestions, predictEngagement]);

  // Executar análise quando o conteúdo mudar
  useEffect(() => {
    if (contentAnalysis && videoElement) {
      performAnalysis();
    }
  }, [contentAnalysis, videoElement, performAnalysis]);

  // Filtrar sugestões por categoria
  const filteredEffects = useMemo(() => {
    if (selectedCategory === 'all') return effectSuggestions;
    return effectSuggestions.filter(effect => 
      effect.category.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [effectSuggestions, selectedCategory]);

  // Obter categorias únicas
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(effectSuggestions.map(e => e.category))];
    return cats;
  }, [effectSuggestions]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Sugestões Inteligentes com IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={performAnalysis} 
              disabled={isAnalyzing || !contentAnalysis}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? <Wand2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? 'Analisando...' : 'Gerar Sugestões'}
            </Button>
            
            {contentAnalysis && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Mood: {analyzeMood(contentAnalysis)}</Badge>
                <Badge variant="outline">Qualidade: {contentAnalysis.qualityScore}%</Badge>
                <Badge variant="outline">Duração: {Math.round(contentAnalysis.duration)}s</Badge>
              </div>
            )}
          </div>
          
          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">Analisando conteúdo: {analysisProgress}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {engagementPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predição de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {Math.round(engagementPrediction.score)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Score de Engajamento Previsto</div>
                  <Progress value={engagementPrediction.score} className="mt-2" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Fatores de Influência:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Mood: {(engagementPrediction.factors.mood * 100).toFixed(0)}%</div>
                    <div>Qualidade: {engagementPrediction.factors.quality}%</div>
                    <div>Faces: {engagementPrediction.factors.faces}</div>
                    <div>Duração: {Math.round(engagementPrediction.factors.duration)}s</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Recomendações para Melhorar:</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {engagementPrediction.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded flex items-start gap-2">
                        <Star className="h-4 w-4 mt-0.5 text-yellow-500" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="effects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="effects">Efeitos</TabsTrigger>
          <TabsTrigger value="music">Música</TabsTrigger>
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
        </TabsList>
        
        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Sugestões de Efeitos ({filteredEffects.length})
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEffects.map((effect) => (
                    <Card key={effect.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{effect.name}</h4>
                            <Badge variant="secondary">{effect.confidence}%</Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Badge variant="outline">{effect.type}</Badge>
                            <Badge variant="outline">{effect.category}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{effect.reason}</p>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => onEffectApply?.(effect)}
                              className="flex-1"
                            >
                              <Wand2 className="h-4 w-4 mr-1" />
                              Aplicar
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="music" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Sugestões de Música ({musicSuggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {musicSuggestions.map((music) => (
                    <Card key={music.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{music.title}</h4>
                            <p className="text-sm text-muted-foreground">{music.artist}</p>
                          </div>
                          <Badge variant="secondary">{music.confidence}%</Badge>
                        </div>
                        
                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline">{music.genre}</Badge>
                          <Badge variant="outline">{music.tempo} BPM</Badge>
                          <Badge variant="outline">{Math.round(music.duration)}s</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{music.reason}</p>
                        
                        <div className="flex gap-2 mb-3">
                          {music.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => onMusicSelect?.(music)}
                            className="flex-1"
                          >
                            <Music className="h-4 w-4 mr-1" />
                            Selecionar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Sugestões de Texto ({textSuggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {textSuggestions.map((text) => (
                    <Card key={text.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline">{text.type}</Badge>
                            <Badge variant="secondary">{text.confidence}%</Badge>
                          </div>
                          
                          <div 
                            className="p-3 rounded border text-center"
                            style={{
                              fontSize: `${text.style.fontSize / 3}px`,
                              fontFamily: text.style.fontFamily,
                              color: text.style.color,
                              backgroundColor: text.style.backgroundColor
                            }}
                          >
                            {text.text}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{text.reason}</p>
                          
                          <div className="text-xs text-muted-foreground">
                            Posição: {text.position.x}%, {text.position.y}%
                          </div>
                          
                          <Button 
                            size="sm" 
                            onClick={() => onTextAdd?.(text)}
                            className="w-full"
                          >
                            <Type className="h-4 w-4 mr-1" />
                            Adicionar Texto
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="thumbnails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Sugestões de Thumbnail ({thumbnailSuggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {thumbnailSuggestions.map((thumbnail) => (
                    <Card key={thumbnail.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="aspect-video bg-muted rounded overflow-hidden">
                            <img 
                              src={thumbnail.preview} 
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {Math.round(thumbnail.timestamp)}s
                            </div>
                            <Badge variant="secondary">{Math.round(thumbnail.score)}%</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{thumbnail.reason}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Contraste: {Math.round(thumbnail.features.contrast)}%</div>
                            <div>Cores: {Math.round(thumbnail.features.colorfulness)}%</div>
                            <div>Faces: {thumbnail.features.hasFaces ? 'Sim' : 'Não'}</div>
                            <div>Texto: {thumbnail.features.hasText ? 'Sim' : 'Não'}</div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            onClick={() => onThumbnailSelect?.(thumbnail)}
                            className="w-full"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Usar Thumbnail
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {!contentAnalysis && (
        <Alert>
          <AlertDescription>
            Execute a análise de conteúdo primeiro para gerar sugestões inteligentes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SmartSuggestions;