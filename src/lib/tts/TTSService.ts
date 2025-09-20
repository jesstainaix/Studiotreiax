/**
 * Text-to-Speech Service for Brazilian Portuguese Safety Training
 * Supports multiple providers: ElevenLabs, Google Cloud TTS, Azure Cognitive Services
 */

export interface TTSProvider {
  id: string;
  name: string;
  supportedLanguages: string[];
  maxCharacters: number;
  quality: 'standard' | 'premium' | 'neural';
  pricing: 'free' | 'paid' | 'freemium';
}

export interface TTSVoice {
  id: string;
  name: string;
  provider: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'adult' | 'senior';
  style: 'professional' | 'casual' | 'authoritative' | 'friendly';
  sample?: string;
  characteristics: string[];
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  provider: string;
  options?: {
    speed?: number; // 0.5 to 2.0
    pitch?: number; // -20 to 20 semitones
    stability?: number; // 0 to 1 (ElevenLabs)
    clarityBoost?: number; // 0 to 1 (ElevenLabs)
    style?: number; // 0 to 1 (ElevenLabs)
    useEnhancedModel?: boolean;
  };
  outputFormat?: 'mp3' | 'wav' | 'ogg';
  ssmlEnabled?: boolean;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBuffer?: ArrayBuffer;
  duration?: number; // in seconds
  characterCount: number;
  provider: string;
  voiceId: string;
  error?: string;
  lipSyncData?: LipSyncFrame[];
}

export interface LipSyncFrame {
  timestamp: number; // in milliseconds
  phoneme: string;
  confidence: number;
  viseme: string; // For 3D avatar mouth shapes
}

export interface ProcessedText {
  originalText: string;
  processedText: string;
  ssmlText?: string;
  pronunciations: Record<string, string>;
  emphasis: Array<{
    start: number;
    end: number;
    type: 'strong' | 'moderate';
  }>;
  pauses: Array<{
    position: number;
    duration: number; // in milliseconds
  }>;
}

/**
 * Brazilian Portuguese Text Processor for Safety Training Content
 */
export class BrazilianPortugueseProcessor {
  private technicalTerms: Record<string, string> = {
    // NR-specific terms with proper pronunciation
    'EPI': 'É-Pê-I',
    'EPIs': 'É-Pês-Is',
    'CIPA': 'Ci-pa',
    'SESMT': 'Ses-M-T',
    'LTCAT': 'L-T-Cat',
    'PPRA': 'Pê-Pê-Êr-A',
    'PCMSO': 'Pê-Cê-Êm-Es-Ô',
    'CAT': 'Cat',
    'CNAE': 'C-N-A-E',
    'NR': 'Ên-Êrr',
    'NRs': 'Ên-Êrrs',
    'ABNT': 'A-B-Ên-T',
    'ISO': 'I-Es-Ô',
    'OHSAS': 'Ô-Á-Saz',
    'DDS': 'Dê-Dê-És',
    'ASO': 'A-És-Ô',
    'PCMAT': 'Pê-Cê-Mat',
    'PCA': 'Pê-Cê-A'
  };

  private commonAbbreviations: Record<string, string> = {
    'Dr.': 'Doutor',
    'Dra.': 'Doutora',
    'Sr.': 'Senhor',
    'Sra.': 'Senhora',
    'Eng.': 'Engenheiro',
    'Engª': 'Engenheira',
    'Prof.': 'Professor',
    'Profª': 'Professora'
  };

  /**
   * Process text for Brazilian Portuguese TTS with safety training optimizations
   */
  processText(text: string): ProcessedText {
    let processedText = text;
    const pronunciations: Record<string, string> = {};
    const emphasis: Array<{start: number; end: number; type: 'strong' | 'moderate'}> = [];
    const pauses: Array<{position: number; duration: number}> = [];

    // Replace technical terms with pronunciations
    Object.entries(this.technicalTerms).forEach(([term, pronunciation]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (processedText.match(regex)) {
        pronunciations[term] = pronunciation;
        processedText = processedText.replace(regex, pronunciation);
      }
    });

    // Replace common abbreviations
    Object.entries(this.commonAbbreviations).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev}`, 'g');
      processedText = processedText.replace(regex, full);
    });

    // Add emphasis for safety warnings
    const warningPatterns = [
      /\b(perigo|atenção|cuidado|importante|obrigatório|proibido)\b/gi,
      /\b(risco|acidente|morte|ferimento|lesão)\b/gi
    ];

    warningPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(processedText)) !== null) {
        emphasis.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'strong'
        });
      }
    });

    // Add pauses after sentences and important punctuation
    const pausePatterns = [
      /\.\s+/g, // After periods
      /;\s+/g,  // After semicolons
      /:\s+/g   // After colons (for lists)
    ];

    pausePatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(processedText)) !== null) {
        pauses.push({
          position: match.index + match[0].length - 1,
          duration: index === 0 ? 800 : 400 // Longer pause after periods
        });
      }
    });

    // Generate SSML for enhanced speech
    const ssmlText = this.generateSSML(processedText, emphasis, pauses);

    return {
      originalText: text,
      processedText,
      ssmlText,
      pronunciations,
      emphasis,
      pauses
    };
  }

  private generateSSML(text: string, emphasis: any[], pauses: any[]): string {
    let ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">`;

    // Create sorted markers with proper types preserved
    const allMarkers = [
      ...emphasis.map(e => ({
        start: e.start,
        end: e.end,
        type: 'emphasis',
        level: e.type // Preserve original emphasis level (strong/moderate)
      })),
      ...pauses.map(p => ({
        position: p.position,
        type: 'pause',
        duration: p.duration
      }))
    ].sort((a, b) => {
      const posA = a.start !== undefined ? a.start : a.position || 0;
      const posB = b.start !== undefined ? b.start : b.position || 0;
      return posB - posA; // Sort in reverse order for proper insertion
    });

    // Apply SSML tags from end to start to avoid index shifting
    let processedSSML = text;
    allMarkers.forEach(marker => {
      if (marker.type === 'emphasis') {
        const before = processedSSML.substring(0, marker.start);
        const emphasisText = processedSSML.substring(marker.start, marker.end);
        const after = processedSSML.substring(marker.end);
        processedSSML = `${before}<emphasis level="${marker.level}">${emphasisText}</emphasis>${after}`;
      } else if (marker.type === 'pause') {
        const before = processedSSML.substring(0, marker.position);
        const after = processedSSML.substring(marker.position);
        processedSSML = `${before}<break time="${marker.duration}ms"/>${after}`;
      }
    });

    ssml += processedSSML;
    ssml += '</speak>';
    
    return ssml;
  }
}

/**
 * NOTE: TTS Provider classes moved to backend for security
 * These should only be instantiated on the server side with proper API key management
 * Client-side synthesis should use TTSBackendService instead
 */

/**
 * Main TTS Service Manager
 */
export class TTSService {
  private providers: Map<string, any> = new Map();
  private textProcessor = new BrazilianPortugueseProcessor();
  private voiceLibrary: TTSVoice[] = [];

  constructor() {
    this.initializeVoiceLibrary();
  }

  /**
   * Register TTS provider
   */
  registerProvider(providerId: string, provider: any) {
    this.providers.set(providerId, provider);
  }

  /**
   * Initialize Brazilian Portuguese voice library
   */
  private initializeVoiceLibrary() {
    this.voiceLibrary = [
      {
        id: 'elevenlabs-ana',
        name: 'Ana (Profissional)',
        provider: 'elevenlabs',
        language: 'pt-BR',
        gender: 'female',
        age: 'adult',
        style: 'professional',
        characteristics: ['clara', 'autoritativa', 'confiável']
      },
      {
        id: 'elevenlabs-carlos',
        name: 'Carlos (Executivo)',
        provider: 'elevenlabs',
        language: 'pt-BR',
        gender: 'male',
        age: 'adult',
        style: 'authoritative',
        characteristics: ['grave', 'experiente', 'técnico']
      },
      {
        id: 'google-wavenet-A',
        name: 'WaveNet Feminina A',
        provider: 'google',
        language: 'pt-BR',
        gender: 'female',
        age: 'adult',
        style: 'friendly',
        characteristics: ['natural', 'clara', 'versátil']
      },
      {
        id: 'google-wavenet-B',
        name: 'WaveNet Masculina B',
        provider: 'google',
        language: 'pt-BR',
        gender: 'male',
        age: 'adult',
        style: 'professional',
        characteristics: ['estável', 'didático', 'neutro']
      }
    ];
  }

  /**
   * Get available voices
   */
  getVoices(provider?: string): TTSVoice[] {
    if (provider) {
      return this.voiceLibrary.filter(voice => voice.provider === provider);
    }
    return this.voiceLibrary;
  }

  /**
   * Synthesize speech with automatic text processing
   * Uses backend service for secure API key management
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    // Import backend service dynamically to avoid circular dependencies
    const { ttsBackendService } = await import('./TTSBackendService');
    
    // Process text for Brazilian Portuguese
    const processedText = this.textProcessor.processText(request.text);
    
    // Use SSML if supported and enabled
    const enhancedRequest = {
      ...request,
      text: request.ssmlEnabled ? processedText.ssmlText! : processedText.processedText
    };

    const response = await ttsBackendService.synthesize(enhancedRequest);
    
    // Add processed text information to response
    if (response.success) {
      (response as any).processedText = processedText;
    }

    return response;
  }

  /**
   * Generate lip-sync data for avatar animation
   */
  async generateLipSync(audioUrl: string): Promise<LipSyncFrame[]> {
    // This would integrate with phoneme detection services
    // For now, return mock data structure
    return [
      { timestamp: 0, phoneme: 'silence', confidence: 1.0, viseme: 'sil' },
      { timestamp: 100, phoneme: 'a', confidence: 0.9, viseme: 'PP' },
      { timestamp: 200, phoneme: 'o', confidence: 0.85, viseme: 'O' }
    ];
  }

  /**
   * Preview voice with sample text
   */
  async previewVoice(voiceId: string, sampleText?: string): Promise<TTSResponse> {
    const defaultSample = "Olá, eu sou um assistente de treinamento em segurança do trabalho. Vamos aprender sobre as normas regulamentadoras.";
    
    const voice = this.voiceLibrary.find(v => v.id === voiceId);
    if (!voice) {
      throw new Error('Voice not found');
    }

    return this.synthesize({
      text: sampleText || defaultSample,
      voiceId,
      provider: voice.provider,
      outputFormat: 'mp3'
    });
  }
}

// Export the service instance
export const ttsService = new TTSService();