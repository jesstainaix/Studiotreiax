/**
 * TTS Synchronization System with Lip-Sync
 * Sistema avançado para sincronização precisa entre áudio TTS e slides com suporte a lip-sync
 */

import type { PPTXSlide } from '../pptx/content-extractor';
import type { AudioTrack } from '../video/enhanced-video-generator';

export interface TTSSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
  words: WordTiming[];
  phonemes: PhonemeTiming[];
  emotions: EmotionMarker[];
  emphasis: EmphasisMarker[];
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  syllables: SyllableTiming[];
}

export interface SyllableTiming {
  syllable: string;
  startTime: number;
  endTime: number;
  stress: number; // 0-1, where 1 is primary stress
}

export interface PhonemeTiming {
  phoneme: string;
  startTime: number;
  endTime: number;
  intensity: number;
  pitch: number;
}

export interface EmotionMarker {
  emotion: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'urgent';
  intensity: number; // 0-1
  startTime: number;
  endTime: number;
}

export interface EmphasisMarker {
  type: 'stress' | 'pause' | 'speed' | 'pitch';
  intensity: number;
  startTime: number;
  endTime: number;
}

export interface LipSyncData {
  visemes: VisemeFrame[];
  mouthShapes: MouthShape[];
  facialExpressions: FacialExpression[];
}

export interface VisemeFrame {
  viseme: string; // Phoneme-based mouth shape
  startTime: number;
  endTime: number;
  intensity: number;
  mouthOpenness: number; // 0-1
  lipRounding: number; // 0-1
  tonguePosition: { x: number; y: number; z: number };
}

export interface MouthShape {
  shape: 'A' | 'E' | 'I' | 'O' | 'U' | 'M' | 'B' | 'P' | 'F' | 'V' | 'TH' | 'S' | 'SH' | 'R' | 'L' | 'closed';
  startTime: number;
  endTime: number;
  transition: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface FacialExpression {
  type: 'eyebrow_raise' | 'eyebrow_furrow' | 'eye_blink' | 'smile' | 'frown' | 'surprise';
  intensity: number;
  startTime: number;
  endTime: number;
}

export interface SyncConfiguration {
  ttsProvider: 'azure' | 'google' | 'amazon' | 'elevenlabs' | 'local';
  voice: {
    name: string;
    gender: 'male' | 'female' | 'neutral';
    age: 'child' | 'young' | 'adult' | 'elderly';
    accent: string;
    speed: number; // 0.5-2.0
    pitch: number; // -50 to +50
    volume: number; // 0-100
  };
  lipSync: {
    enabled: boolean;
    accuracy: 'low' | 'medium' | 'high' | 'ultra';
    smoothing: number; // 0-1
    anticipation: number; // ms to start mouth movement before sound
  };
  timing: {
    pauseBetweenSlides: number; // ms
    pauseBetweenSentences: number; // ms
    pauseBetweenWords: number; // ms
    readingSpeed: number; // words per minute
  };
  effects: {
    breathingPauses: boolean;
    naturalHesitations: boolean;
    emotionalVariation: boolean;
    stressEmphasis: boolean;
  };
}

export interface SyncResult {
  success: boolean;
  audioUrl: string;
  duration: number;
  segments: TTSSegment[];
  lipSyncData: LipSyncData;
  slideTimings: SlideTimingData[];
  metadata: {
    totalWords: number;
    averageWPM: number;
    pauseCount: number;
    emotionChanges: number;
    lipSyncFrames: number;
    generationTime: number;
  };
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

export interface SlideTimingData {
  slideId: string;
  startTime: number;
  endTime: number;
  duration: number;
  segments: TTSSegment[];
  transitions: {
    fadeIn: number;
    fadeOut: number;
    slideChange: number;
  };
}

export class TTSSyncSystem {
  private config: SyncConfiguration;
  private cache: Map<string, SyncResult> = new Map();

  constructor(config: SyncConfiguration) {
    this.config = config;
  }

  /**
   * Generate synchronized TTS audio with lip-sync data for slides
   */
  async generateSyncedAudio(
    slides: PPTXSlide[],
    onProgress?: (progress: { stage: string; progress: number; message: string }) => void
  ): Promise<SyncResult> {
    const startTime = performance.now();

    try {
      // Stage 1: Text Analysis and Preprocessing
      onProgress?.({
        stage: 'analysis',
        progress: 10,
        message: 'Analisando texto e preparando para síntese...'
      });

      const processedText = await this.preprocessText(slides);
      const scriptSegments = await this.createScriptSegments(processedText);

      // Stage 2: TTS Generation with Timing
      onProgress?.({
        stage: 'tts_generation',
        progress: 30,
        message: 'Gerando áudio TTS com marcadores de tempo...'
      });

      const ttsResult = await this.generateTTSWithTiming(scriptSegments);

      // Stage 3: Word-Level Alignment
      onProgress?.({
        stage: 'alignment',
        progress: 50,
        message: 'Alinhando palavras com áudio...'
      });

      const alignedSegments = await this.performWordAlignment(ttsResult.audio, scriptSegments);

      // Stage 4: Phoneme Analysis
      onProgress?.({
        stage: 'phoneme_analysis',
        progress: 70,
        message: 'Analisando fonemas para lip-sync...'
      });

      const phonemeData = await this.analyzePhonemes(alignedSegments);

      // Stage 5: Lip-Sync Generation
      onProgress?.({
        stage: 'lipsync_generation',
        progress: 85,
        message: 'Gerando dados de lip-sync...'
      });

      const lipSyncData = await this.generateLipSyncData(phonemeData);

      // Stage 6: Slide Timing Calculation
      onProgress?.({
        stage: 'slide_timing',
        progress: 95,
        message: 'Calculando timings dos slides...'
      });

      const slideTimings = await this.calculateSlideTimings(slides, alignedSegments);

      const result: SyncResult = {
        success: true,
        audioUrl: ttsResult.audioUrl,
        duration: ttsResult.duration,
        segments: alignedSegments,
        lipSyncData,
        slideTimings,
        metadata: {
          totalWords: this.countWords(scriptSegments),
          averageWPM: this.calculateAverageWPM(alignedSegments),
          pauseCount: this.countPauses(alignedSegments),
          emotionChanges: this.countEmotionChanges(alignedSegments),
          lipSyncFrames: lipSyncData.visemes.length,
          generationTime: performance.now() - startTime
        }
      };

      // Cache result for future use
      const cacheKey = this.generateCacheKey(slides);
      this.cache.set(cacheKey, result);

      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: 'Sincronização TTS concluída com sucesso!'
      });

      return result;

    } catch (error) {
      console.error('❌ TTS Sync generation failed:', error);
      return {
        success: false,
        audioUrl: '',
        duration: 0,
        segments: [],
        lipSyncData: { visemes: [], mouthShapes: [], facialExpressions: [] },
        slideTimings: [],
        metadata: {
          totalWords: 0,
          averageWPM: 0,
          pauseCount: 0,
          emotionChanges: 0,
          lipSyncFrames: 0,
          generationTime: performance.now() - startTime
        },
        error: {
          code: 'SYNC_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack || '' : ''
        }
      };
    }
  }

  /**
   * Preprocess text for optimal TTS generation
   */
  private async preprocessText(slides: PPTXSlide[]): Promise<string[]> {
    const processedTexts: string[] = [];

    for (const slide of slides) {
      let text = '';
      
      // Add title with emphasis
      if (slide.title) {
        text += `<emphasis level="strong">${slide.title}</emphasis>. `;
      }

      // Add content with natural pauses
      if (slide.content) {
        const sentences = slide.content.split(/[.!?]+/).filter(s => s.trim());
        text += sentences.map(sentence => {
          const trimmed = sentence.trim();
          if (trimmed) {
            return `${trimmed}.`;
          }
          return '';
        }).join(' <break time="500ms"/> ');
      }

      // Add slide transition pause
      text += ' <break time="1s"/>';

      processedTexts.push(text);
    }

    return processedTexts;
  }

  /**
   * Create script segments with metadata
   */
  private async createScriptSegments(texts: string[]): Promise<TTSSegment[]> {
    const segments: TTSSegment[] = [];
    let currentTime = 0;

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const estimatedDuration = this.estimateTextDuration(text);

      const segment: TTSSegment = {
        id: `segment_${i + 1}`,
        text,
        startTime: currentTime,
        endTime: currentTime + estimatedDuration,
        duration: estimatedDuration,
        words: [],
        phonemes: [],
        emotions: this.detectEmotions(text),
        emphasis: this.detectEmphasis(text)
      };

      segments.push(segment);
      currentTime += estimatedDuration + this.config.timing.pauseBetweenSlides;
    }

    return segments;
  }

  /**
   * Generate TTS audio with precise timing information
   */
  private async generateTTSWithTiming(segments: TTSSegment[]): Promise<{ audioUrl: string; duration: number }> {
    // Simulate TTS generation with timing
    const fullText = segments.map(s => s.text).join(' ');
    const duration = segments.reduce((total, segment) => total + segment.duration, 0);

    // In production, this would call the actual TTS service
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      audioUrl: `/tmp/tts_${Date.now()}.wav`,
      duration
    };
  }

  /**
   * Perform word-level alignment with audio
   */
  private async performWordAlignment(audioUrl: string, segments: TTSSegment[]): Promise<TTSSegment[]> {
    const alignedSegments: TTSSegment[] = [];

    for (const segment of segments) {
      const words = this.extractWords(segment.text);
      const wordTimings: WordTiming[] = [];
      
      let wordStartTime = segment.startTime;
      const avgWordDuration = segment.duration / words.length;

      for (const word of words) {
        const wordDuration = this.estimateWordDuration(word);
        const syllables = this.extractSyllables(word);
        
        const wordTiming: WordTiming = {
          word,
          startTime: wordStartTime,
          endTime: wordStartTime + wordDuration,
          confidence: 0.95, // Simulated confidence
          syllables: syllables.map((syllable, index) => ({
            syllable,
            startTime: wordStartTime + (index * wordDuration / syllables.length),
            endTime: wordStartTime + ((index + 1) * wordDuration / syllables.length),
            stress: this.calculateSyllableStress(syllable, index, syllables.length)
          }))
        };

        wordTimings.push(wordTiming);
        wordStartTime += wordDuration + this.config.timing.pauseBetweenWords;
      }

      alignedSegments.push({
        ...segment,
        words: wordTimings
      });
    }

    return alignedSegments;
  }

  /**
   * Analyze phonemes for lip-sync generation
   */
  private async analyzePhonemes(segments: TTSSegment[]): Promise<TTSSegment[]> {
    const phonemeSegments: TTSSegment[] = [];

    for (const segment of segments) {
      const phonemes: PhonemeTiming[] = [];

      for (const word of segment.words) {
        const wordPhonemes = this.convertToPhonemes(word.word);
        const phonemeDuration = (word.endTime - word.startTime) / wordPhonemes.length;

        for (let i = 0; i < wordPhonemes.length; i++) {
          const phoneme = wordPhonemes[i];
          const startTime = word.startTime + (i * phonemeDuration);
          
          phonemes.push({
            phoneme,
            startTime,
            endTime: startTime + phonemeDuration,
            intensity: this.calculatePhonemeIntensity(phoneme),
            pitch: this.calculatePhonemePitch(phoneme)
          });
        }
      }

      phonemeSegments.push({
        ...segment,
        phonemes
      });
    }

    return phonemeSegments;
  }

  /**
   * Generate lip-sync data from phoneme analysis
   */
  private async generateLipSyncData(segments: TTSSegment[]): Promise<LipSyncData> {
    const visemes: VisemeFrame[] = [];
    const mouthShapes: MouthShape[] = [];
    const facialExpressions: FacialExpression[] = [];

    for (const segment of segments) {
      for (const phoneme of segment.phonemes) {
        // Generate viseme frame
        const viseme: VisemeFrame = {
          viseme: this.phonemeToViseme(phoneme.phoneme),
          startTime: phoneme.startTime - this.config.lipSync.anticipation,
          endTime: phoneme.endTime,
          intensity: phoneme.intensity,
          mouthOpenness: this.calculateMouthOpenness(phoneme.phoneme),
          lipRounding: this.calculateLipRounding(phoneme.phoneme),
          tonguePosition: this.calculateTonguePosition(phoneme.phoneme)
        };

        visemes.push(viseme);

        // Generate mouth shape
        const mouthShape: MouthShape = {
          shape: this.phonemeToMouthShape(phoneme.phoneme),
          startTime: phoneme.startTime - this.config.lipSync.anticipation,
          endTime: phoneme.endTime,
          transition: 'ease-in-out'
        };

        mouthShapes.push(mouthShape);
      }

      // Generate facial expressions based on emotions
      for (const emotion of segment.emotions) {
        const expression: FacialExpression = {
          type: this.emotionToFacialExpression(emotion.emotion),
          intensity: emotion.intensity,
          startTime: emotion.startTime,
          endTime: emotion.endTime
        };

        facialExpressions.push(expression);
      }
    }

    return {
      visemes: this.smoothVisemes(visemes),
      mouthShapes: this.smoothMouthShapes(mouthShapes),
      facialExpressions
    };
  }

  /**
   * Calculate slide timings based on TTS segments
   */
  private async calculateSlideTimings(slides: PPTXSlide[], segments: TTSSegment[]): Promise<SlideTimingData[]> {
    const slideTimings: SlideTimingData[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const segment = segments[i];

      const slideTimingData: SlideTimingData = {
        slideId: slide.id,
        startTime: segment.startTime,
        endTime: segment.endTime,
        duration: segment.duration,
        segments: [segment],
        transitions: {
          fadeIn: 500, // 0.5s fade in
          fadeOut: 500, // 0.5s fade out
          slideChange: this.config.timing.pauseBetweenSlides
        }
      };

      slideTimings.push(slideTimingData);
    }

    return slideTimings;
  }

  // Helper methods
  private estimateTextDuration(text: string): number {
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0);
    const wpm = this.config.timing.readingSpeed;
    return (words.length / wpm) * 60 * 1000; // Convert to milliseconds
  }

  private detectEmotions(text: string): EmotionMarker[] {
    // Simple emotion detection based on punctuation and keywords
    const emotions: EmotionMarker[] = [];
    
    if (text.includes('!')) {
      emotions.push({
        emotion: 'excited',
        intensity: 0.7,
        startTime: 0,
        endTime: this.estimateTextDuration(text)
      });
    } else if (text.includes('?')) {
      emotions.push({
        emotion: 'neutral',
        intensity: 0.5,
        startTime: 0,
        endTime: this.estimateTextDuration(text)
      });
    } else {
      emotions.push({
        emotion: 'neutral',
        intensity: 0.3,
        startTime: 0,
        endTime: this.estimateTextDuration(text)
      });
    }

    return emotions;
  }

  private detectEmphasis(text: string): EmphasisMarker[] {
    const emphasis: EmphasisMarker[] = [];
    const duration = this.estimateTextDuration(text);

    // Detect emphasis tags
    const emphasisRegex = /<emphasis[^>]*>(.*?)<\/emphasis>/g;
    let match;
    
    while ((match = emphasisRegex.exec(text)) !== null) {
      emphasis.push({
        type: 'stress',
        intensity: 0.8,
        startTime: 0, // Would need more sophisticated positioning
        endTime: duration
      });
    }

    return emphasis;
  }

  private extractWords(text: string): string[] {
    return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0);
  }

  private estimateWordDuration(word: string): number {
    // Base duration on syllable count and word complexity
    const syllables = this.extractSyllables(word);
    const baseDuration = 200; // 200ms per syllable
    return syllables.length * baseDuration;
  }

  private extractSyllables(word: string): string[] {
    // Simple syllable extraction (in production, use a proper library)
    const vowels = 'aeiouAEIOU';
    const syllables: string[] = [];
    let currentSyllable = '';
    
    for (let i = 0; i < word.length; i++) {
      currentSyllable += word[i];
      if (vowels.includes(word[i]) && i < word.length - 1 && !vowels.includes(word[i + 1])) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    }
    
    if (currentSyllable) {
      syllables.push(currentSyllable);
    }
    
    return syllables.length > 0 ? syllables : [word];
  }

  private calculateSyllableStress(syllable: string, index: number, totalSyllables: number): number {
    // Simple stress calculation (first syllable usually stressed in English)
    return index === 0 ? 1 : 0.3;
  }

  private convertToPhonemes(word: string): string[] {
    // Simplified phoneme conversion (in production, use IPA dictionary)
    const phonemeMap: Record<string, string[]> = {
      'hello': ['h', 'ɛ', 'l', 'oʊ'],
      'world': ['w', 'ɜr', 'l', 'd'],
      'the': ['ð', 'ə'],
      'and': ['æ', 'n', 'd']
    };
    
    return phonemeMap[word.toLowerCase()] || word.split('');
  }

  private calculatePhonemeIntensity(phoneme: string): number {
    // Vowels are generally more intense than consonants
    const vowels = ['a', 'e', 'i', 'o', 'u', 'ɛ', 'ɜ', 'ə', 'oʊ', 'æ'];
    return vowels.includes(phoneme) ? 0.8 : 0.4;
  }

  private calculatePhonemePitch(phoneme: string): number {
    // Simplified pitch calculation
    return 100 + Math.random() * 50; // 100-150 Hz range
  }

  private phonemeToViseme(phoneme: string): string {
    const visemeMap: Record<string, string> = {
      'p': 'bilabial_stop',
      'b': 'bilabial_stop',
      'm': 'bilabial_nasal',
      'f': 'labiodental_fricative',
      'v': 'labiodental_fricative',
      'a': 'open_vowel',
      'e': 'mid_vowel',
      'i': 'close_vowel',
      'o': 'rounded_vowel',
      'u': 'close_rounded_vowel'
    };
    
    return visemeMap[phoneme] || 'neutral';
  }

  private calculateMouthOpenness(phoneme: string): number {
    const openness: Record<string, number> = {
      'a': 0.9,
      'e': 0.6,
      'i': 0.3,
      'o': 0.7,
      'u': 0.4,
      'p': 0.0,
      'b': 0.0,
      'm': 0.0
    };
    
    return openness[phoneme] || 0.5;
  }

  private calculateLipRounding(phoneme: string): number {
    const rounding: Record<string, number> = {
      'o': 0.8,
      'u': 0.9,
      'a': 0.1,
      'e': 0.2,
      'i': 0.1
    };
    
    return rounding[phoneme] || 0.3;
  }

  private calculateTonguePosition(phoneme: string): { x: number; y: number; z: number } {
    // Simplified tongue position (in production, use articulatory phonetics data)
    const positions: Record<string, { x: number; y: number; z: number }> = {
      'a': { x: 0, y: -0.5, z: 0 },
      'e': { x: 0, y: -0.2, z: 0.2 },
      'i': { x: 0, y: 0.3, z: 0.5 },
      'o': { x: 0, y: -0.3, z: -0.2 },
      'u': { x: 0, y: 0.2, z: -0.5 }
    };
    
    return positions[phoneme] || { x: 0, y: 0, z: 0 };
  }

  private phonemeToMouthShape(phoneme: string): MouthShape['shape'] {
    const shapeMap: Record<string, MouthShape['shape']> = {
      'a': 'A',
      'e': 'E',
      'i': 'I',
      'o': 'O',
      'u': 'U',
      'p': 'M',
      'b': 'B',
      'm': 'M',
      'f': 'F',
      'v': 'V',
      's': 'S',
      'r': 'R',
      'l': 'L'
    };
    
    return shapeMap[phoneme] || 'closed';
  }

  private emotionToFacialExpression(emotion: EmotionMarker['emotion']): FacialExpression['type'] {
    const expressionMap: Record<EmotionMarker['emotion'], FacialExpression['type']> = {
      'happy': 'smile',
      'sad': 'frown',
      'excited': 'eyebrow_raise',
      'surprised': 'surprise',
      'neutral': 'eye_blink',
      'calm': 'eye_blink',
      'urgent': 'eyebrow_furrow'
    };
    
    return expressionMap[emotion] || 'eye_blink';
  }

  private smoothVisemes(visemes: VisemeFrame[]): VisemeFrame[] {
    if (this.config.lipSync.smoothing === 0) return visemes;
    
    // Apply smoothing to reduce jitter
    return visemes.map((viseme, index) => {
      if (index === 0 || index === visemes.length - 1) return viseme;
      
      const prev = visemes[index - 1];
      const next = visemes[index + 1];
      const smoothing = this.config.lipSync.smoothing;
      
      return {
        ...viseme,
        mouthOpenness: (prev.mouthOpenness + viseme.mouthOpenness + next.mouthOpenness) / 3 * smoothing + viseme.mouthOpenness * (1 - smoothing),
        lipRounding: (prev.lipRounding + viseme.lipRounding + next.lipRounding) / 3 * smoothing + viseme.lipRounding * (1 - smoothing)
      };
    });
  }

  private smoothMouthShapes(mouthShapes: MouthShape[]): MouthShape[] {
    // Add transition smoothing between mouth shapes
    return mouthShapes;
  }

  private countWords(segments: TTSSegment[]): number {
    return segments.reduce((total, segment) => {
      return total + this.extractWords(segment.text).length;
    }, 0);
  }

  private calculateAverageWPM(segments: TTSSegment[]): number {
    const totalWords = this.countWords(segments);
    const totalDuration = segments.reduce((total, segment) => total + segment.duration, 0);
    return (totalWords / (totalDuration / 1000)) * 60; // Convert to words per minute
  }

  private countPauses(segments: TTSSegment[]): number {
    return segments.reduce((total, segment) => {
      return total + (segment.text.match(/<break/g) || []).length;
    }, 0);
  }

  private countEmotionChanges(segments: TTSSegment[]): number {
    return segments.reduce((total, segment) => total + segment.emotions.length, 0);
  }

  private generateCacheKey(slides: PPTXSlide[]): string {
    const content = slides.map(slide => `${slide.title}|${slide.content}`).join('||');
    return btoa(content).substring(0, 32);
  }
}

// Export singleton instance with default configuration
export const ttsSyncSystem = new TTSSyncSystem({
  ttsProvider: 'azure',
  voice: {
    name: 'pt-BR-AntonioNeural',
    gender: 'male',
    age: 'adult',
    accent: 'pt-BR',
    speed: 1.0,
    pitch: 0,
    volume: 80
  },
  lipSync: {
    enabled: true,
    accuracy: 'high',
    smoothing: 0.3,
    anticipation: 50
  },
  timing: {
    pauseBetweenSlides: 1000,
    pauseBetweenSentences: 500,
    pauseBetweenWords: 50,
    readingSpeed: 150
  },
  effects: {
    breathingPauses: true,
    naturalHesitations: false,
    emotionalVariation: true,
    stressEmphasis: true
  }
});