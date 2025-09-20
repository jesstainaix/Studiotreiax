// ElevenLabs TTS Provider
import { TTSProvider, TTSGenerationRequest, TTSGenerationResult, TTSProviderError } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class ElevenLabsTTSProvider implements TTSProvider {
  private readonly providerId = 'elevenlabs';
  private readonly providerName = 'ElevenLabs TTS';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';
  
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey && process.env.NODE_ENV !== 'development') {
      console.warn('[ElevenLabsTTS] API key not found. Provider will be disabled.');
    }
  }
  
  async generateAudio(request: TTSGenerationRequest): Promise<TTSGenerationResult> {
    if (!this.apiKey) {
      throw new TTSProviderError('ElevenLabs API key not configured', 'API_KEY_MISSING');
    }
    
    console.log(`[ElevenLabsTTS] Generating audio for scene ${request.scene_id}`);
    
    const startTime = Date.now();
    const sceneId = request.scene_id || Date.now();
    const audioId = `elevenlabs_${sceneId}_${startTime}`;
    const audioPath = `audio/scene_${sceneId}.mp3`;
    const markersPath = `audio/scene_${sceneId}.markers.json`;
    
    try {
      // Map our voice IDs to ElevenLabs voice IDs
      const voiceId = this.mapVoiceId(request.voice || 'br-female-adult-1');
      
      // Prepare ElevenLabs API request
      const payload = {
        text: request.text,
        model_id: 'eleven_multilingual_v2', // Supports Portuguese
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: this.mapVoiceStyle(request.style),
          use_speaker_boost: true
        }
      };
      
      // Call ElevenLabs API
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new TTSProviderError(
          `ElevenLabs API error: ${response.status} - ${errorText}`,
          'API_ERROR'
        );
      }
      
      // Save audio file
      const audioBuffer = await response.arrayBuffer();
      const fullAudioPath = path.join(process.cwd(), 'project', 'data', audioPath);
      
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(fullAudioPath), { recursive: true });
      await fs.promises.writeFile(fullAudioPath, Buffer.from(audioBuffer));
      
      // Generate timing markers (ElevenLabs doesn't provide detailed timing by default)
      const markers = this.generateApproximateMarkers(request.text);
      const fullMarkersPath = path.join(process.cwd(), 'project', 'data', markersPath);
      await fs.promises.writeFile(fullMarkersPath, JSON.stringify(markers, null, 2));
      
      const processingTime = Date.now() - startTime;
      const fileStats = await fs.promises.stat(fullAudioPath);
      
      // Estimate duration based on text length and speech rate
      const wordCount = request.text.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60; // 150 words per minute
      
      const result: TTSGenerationResult = {
        audio_id: audioId,
        scene_id: request.scene_id,
        status: 'completed',
        providerId: this.providerId,
        metadata: {
          generated_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          text_length: request.text.length,
          language: request.language || 'pt-BR',
          voice: request.voice || 'br-female-adult-1',
          duration_sec: estimatedDuration,
          file_size_bytes: fileStats.size,
          model_version: 'eleven_multilingual_v2',
          quality: request.quality || 'medium'
        },
        assets: {
          audio_url: audioPath,
          markers_url: markersPath
        },
        markers
      };
      
      console.log(`[ElevenLabsTTS] Successfully generated audio for scene ${sceneId} in ${processingTime}ms`);
      return result;
      
    } catch (error) {
      console.error(`[ElevenLabsTTS] Failed to generate audio:`, error);
      
      if (error instanceof TTSProviderError) {
        throw error;
      }
      
      throw new TTSProviderError(
        `Audio generation failed: ${error.message}`,
        'GENERATION_FAILED',
        error
      );
    }
  }
  
  async getAudioStatus(audio_id: string): Promise<TTSGenerationResult> {
    // ElevenLabs generates audio synchronously, so we just check if file exists
    const sceneIdMatch = audio_id.match(/elevenlabs_(\d+)_/);
    if (!sceneIdMatch) {
      throw new TTSProviderError('Invalid audio ID format', 'INVALID_AUDIO_ID');
    }
    
    const sceneId = sceneIdMatch[1];
    const audioPath = path.join(process.cwd(), 'project', 'data', `audio/scene_${sceneId}.mp3`);
    
    try {
      const stats = await fs.promises.stat(audioPath);
      
      return {
        audio_id,
        scene_id: sceneId,
        status: 'completed',
        providerId: this.providerId,
        metadata: {
          generated_at: stats.birthtime.toISOString(),
          processing_time_ms: 0, // Historical data not available
          text_length: 0, // Historical data not available
          language: 'pt-BR',
          voice: 'br-female-adult-1',
          file_size_bytes: stats.size,
          model_version: 'eleven_multilingual_v2',
          quality: 'medium'
        },
        assets: {
          audio_url: `audio/scene_${sceneId}.mp3`,
          markers_url: `audio/scene_${sceneId}.markers.json`
        }
      };
    } catch (error) {
      throw new TTSProviderError('Audio file not found', 'AUDIO_NOT_FOUND');
    }
  }
  
  async deleteAudio(audio_id: string): Promise<void> {
    const sceneIdMatch = audio_id.match(/elevenlabs_(\d+)_/);
    if (!sceneIdMatch) {
      throw new TTSProviderError('Invalid audio ID format', 'INVALID_AUDIO_ID');
    }
    
    const sceneId = sceneIdMatch[1];
    const audioPath = path.join(process.cwd(), 'project', 'data', `audio/scene_${sceneId}.mp3`);
    const markersPath = path.join(process.cwd(), 'project', 'data', `audio/scene_${sceneId}.markers.json`);
    
    try {
      await fs.promises.unlink(audioPath);
      await fs.promises.unlink(markersPath);
      console.log(`[ElevenLabsTTS] Deleted audio files for scene ${sceneId}`);
    } catch (error) {
      console.warn(`[ElevenLabsTTS] Failed to delete files:`, error.message);
      // Don't throw error if files don't exist
    }
  }
  
  async listAudios(deck_id?: string): Promise<TTSGenerationResult[]> {
    // Read audio directory and return existing ElevenLabs audio files
    const audioDir = path.join(process.cwd(), 'project', 'data', 'audio');
    
    try {
      const files = await fs.promises.readdir(audioDir);
      const mp3Files = files.filter(f => f.endsWith('.mp3') && f.startsWith('scene_'));
      
      const audios: TTSGenerationResult[] = [];
      
      for (const file of mp3Files) {
        const sceneIdMatch = file.match(/scene_(\d+)\.mp3/);
        if (sceneIdMatch) {
          const sceneId = sceneIdMatch[1];
          const filePath = path.join(audioDir, file);
          const stats = await fs.promises.stat(filePath);
          
          audios.push({
            audio_id: `elevenlabs_${sceneId}_${stats.birthtime.getTime()}`,
            scene_id: sceneId,
            status: 'completed',
            providerId: this.providerId,
            metadata: {
              generated_at: stats.birthtime.toISOString(),
              processing_time_ms: 0,
              text_length: 0,
              language: 'pt-BR',
              voice: 'br-female-adult-1',
              file_size_bytes: stats.size,
              model_version: 'eleven_multilingual_v2',
              quality: 'medium'
            },
            assets: {
              audio_url: `audio/scene_${sceneId}.mp3`,
              markers_url: `audio/scene_${sceneId}.markers.json`
            }
          });
        }
      }
      
      return audios;
    } catch (error) {
      console.warn(`[ElevenLabsTTS] Failed to list audios:`, error.message);
      return [];
    }
  }
  
  async isHealthy(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      // Test ElevenLabs API with voices endpoint
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      
      return response.ok;
    } catch (error) {
      console.warn('[ElevenLabsTTS] Health check failed:', error.message);
      return false;
    }
  }
  
  getProviderInfo() {
    return {
      id: this.providerId,
      name: this.providerName,
      version: '1.0.0',
      capabilities: ['text_to_speech', 'multilingual', 'voice_cloning', 'pt_br_support'],
      supported_languages: ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
      supported_voices: [
        { id: 'br-female-adult-1', name: 'Rachel (Brasileira)', language: 'pt-BR', gender: 'female', style: 'neutral' },
        { id: 'br-male-adult-1', name: 'Adam (Brasileiro)', language: 'pt-BR', gender: 'male', style: 'neutral' },
        { id: 'br-female-young-1', name: 'Bella (Jovem)', language: 'pt-BR', gender: 'female', style: 'friendly' },
        { id: 'br-male-corporate-1', name: 'Josh (Corporativo)', language: 'pt-BR', gender: 'male', style: 'serious' }
      ],
      limits: {
        max_text_length: 5000,
        max_daily_requests: 10000, // Depends on plan
        max_file_size_mb: 100,
        supported_formats: ['mp3']
      }
    };
  }
  
  private mapVoiceId(voiceId: string): string {
    // Map our internal voice IDs to ElevenLabs voice IDs
    const voiceMap: { [key: string]: string } = {
      'br-female-adult-1': 'EXAVITQu4vr4xnSDxMaL', // Rachel
      'br-male-adult-1': 'pNInz6obpgDQGcFmaJgB', // Adam
      'br-female-young-1': 'EXAVITQu4vr4xnSDxMaL', // Bella (fallback to Rachel)
      'br-male-corporate-1': 'TxGEqnHWrfWFTfGW9XjX' // Josh
    };
    
    return voiceMap[voiceId] || voiceMap['br-female-adult-1'];
  }
  
  private mapVoiceStyle(style?: string): number {
    // Map style to ElevenLabs style parameter (0.0 to 1.0)
    const styleMap: { [key: string]: number } = {
      'neutral': 0.0,
      'serious': 0.1,
      'friendly': 0.3,
      'enthusiastic': 0.6
    };
    
    return styleMap[style || 'neutral'] || 0.0;
  }
  
  private generateApproximateMarkers(text: string) {
    // Generate approximate timing markers since ElevenLabs doesn't provide detailed timing
    const words = text.split(/\s+/).filter(w => w.trim());
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    let currentTime = 0;
    const avgWordsPerMinute = 150;
    const avgWordDuration = 60 / avgWordsPerMinute;
    
    const wordTimings = words.map(word => {
      const timing = {
        word: word.trim(),
        start_time: currentTime,
        end_time: currentTime + avgWordDuration,
        confidence: 0.8 // Lower confidence since it's estimated
      };
      currentTime += avgWordDuration + 0.05; // Small pause between words
      return timing;
    });
    
    // Generate sentence timings
    currentTime = 0;
    const sentenceTimings = sentences.map(sentence => {
      const wordCount = sentence.split(/\s+/).length;
      const duration = (wordCount / avgWordsPerMinute) * 60;
      
      const timing = {
        text: sentence.trim(),
        start_time: currentTime,
        end_time: currentTime + duration
      };
      
      currentTime += duration + 0.3; // Pause between sentences
      return timing;
    });
    
    return {
      words: wordTimings,
      sentences: sentenceTimings,
      phonemes: [] // ElevenLabs doesn't provide phoneme timing by default
    };
  }
}