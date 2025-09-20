// HeyGen TTS Provider
import { TTSProvider, TTSGenerationRequest, TTSGenerationResult, TTSProviderError } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class HeyGenTTSProvider implements TTSProvider {
  private readonly providerId = 'heygen';
  private readonly providerName = 'HeyGen Voice';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.heygen.com/v2';
  
  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || '';
    if (!this.apiKey && process.env.NODE_ENV !== 'development') {
      console.warn('[HeyGenTTS] API key not found. Provider will be disabled.');
    }
  }
  
  async generateAudio(request: TTSGenerationRequest): Promise<TTSGenerationResult> {
    if (!this.apiKey) {
      throw new TTSProviderError('HeyGen API key not configured', 'API_KEY_MISSING');
    }
    
    console.log(`[HeyGenTTS] Generating audio for scene ${request.scene_id}`);
    
    const startTime = Date.now();
    const sceneId = request.scene_id || Date.now();
    const audioId = `heygen_${sceneId}_${startTime}`;
    const audioPath = `audio/scene_${sceneId}.mp3`;
    const markersPath = `audio/scene_${sceneId}.markers.json`;
    
    try {
      // Map our voice IDs to HeyGen voice IDs
      const voiceId = this.mapVoiceId(request.voice || 'br-female-adult-1');
      
      // Step 1: Create TTS job
      const jobPayload = {
        text: request.text,
        voice_id: voiceId,
        language: this.mapLanguageCode(request.language || 'pt-BR'),
        quality: request.quality || 'medium',
        format: 'mp3',
        voice_settings: {
          speed: request.speed || 1.0,
          pitch: request.pitch || 0,
          style: request.style || 'neutral'
        }
      };
      
      const jobResponse = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(jobPayload)
      });
      
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        throw new TTSProviderError(
          `HeyGen TTS job creation failed: ${jobResponse.status} - ${errorText}`,
          'JOB_CREATION_FAILED'
        );
      }
      
      const jobData = await jobResponse.json();
      const jobId = jobData.job_id;
      
      // Step 2: Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2s = 1 minute max wait
      let jobStatus = 'processing';
      let audioUrl = '';
      
      while (attempts < maxAttempts && jobStatus === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const statusResponse = await fetch(`${this.baseUrl}/tts/${jobId}`, {
          headers: {
            'X-API-Key': this.apiKey
          }
        });
        
        if (!statusResponse.ok) {
          throw new TTSProviderError('Failed to check job status', 'STATUS_CHECK_FAILED');
        }
        
        const statusData = await statusResponse.json();
        jobStatus = statusData.status;
        audioUrl = statusData.audio_url;
        
        attempts++;
      }
      
      if (jobStatus !== 'completed') {
        throw new TTSProviderError(
          `TTS generation timed out or failed. Status: ${jobStatus}`,
          'GENERATION_TIMEOUT'
        );
      }
      
      // Step 3: Download audio file
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new TTSProviderError('Failed to download generated audio', 'DOWNLOAD_FAILED');
      }
      
      const audioBuffer = await audioResponse.arrayBuffer();
      const fullAudioPath = path.join(process.cwd(), 'project', 'data', audioPath);
      
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(fullAudioPath), { recursive: true });
      await fs.promises.writeFile(fullAudioPath, Buffer.from(audioBuffer));
      
      // Generate timing markers (HeyGen may provide timing data in future)
      const markers = this.generateApproximateMarkers(request.text);
      const fullMarkersPath = path.join(process.cwd(), 'project', 'data', markersPath);
      await fs.promises.writeFile(fullMarkersPath, JSON.stringify(markers, null, 2));
      
      const processingTime = Date.now() - startTime;
      const fileStats = await fs.promises.stat(fullAudioPath);
      
      // Estimate duration based on text length
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
          model_version: 'heygen-v2',
          quality: request.quality || 'medium'
        },
        assets: {
          audio_url: audioPath,
          markers_url: markersPath
        },
        markers
      };
      
      console.log(`[HeyGenTTS] Successfully generated audio for scene ${sceneId} in ${processingTime}ms`);
      return result;
      
    } catch (error) {
      console.error(`[HeyGenTTS] Failed to generate audio:`, error);
      
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
    const sceneIdMatch = audio_id.match(/heygen_(\d+)_/);
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
          processing_time_ms: 0,
          text_length: 0,
          language: 'pt-BR',
          voice: 'br-female-adult-1',
          file_size_bytes: stats.size,
          model_version: 'heygen-v2',
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
    const sceneIdMatch = audio_id.match(/heygen_(\d+)_/);
    if (!sceneIdMatch) {
      throw new TTSProviderError('Invalid audio ID format', 'INVALID_AUDIO_ID');
    }
    
    const sceneId = sceneIdMatch[1];
    const audioPath = path.join(process.cwd(), 'project', 'data', `audio/scene_${sceneId}.mp3`);
    const markersPath = path.join(process.cwd(), 'project', 'data', `audio/scene_${sceneId}.markers.json`);
    
    try {
      await fs.promises.unlink(audioPath);
      await fs.promises.unlink(markersPath);
      console.log(`[HeyGenTTS] Deleted audio files for scene ${sceneId}`);
    } catch (error) {
      console.warn(`[HeyGenTTS] Failed to delete files:`, error.message);
    }
  }
  
  async listAudios(deck_id?: string): Promise<TTSGenerationResult[]> {
    // Similar to ElevenLabs implementation
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
            audio_id: `heygen_${sceneId}_${stats.birthtime.getTime()}`,
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
              model_version: 'heygen-v2',
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
      console.warn(`[HeyGenTTS] Failed to list audios:`, error.message);
      return [];
    }
  }
  
  async isHealthy(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      // Test HeyGen API with a simple status endpoint
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      
      return response.ok;
    } catch (error) {
      console.warn('[HeyGenTTS] Health check failed:', error.message);
      return false;
    }
  }
  
  getProviderInfo() {
    return {
      id: this.providerId,
      name: this.providerName,
      version: '1.0.0',
      capabilities: ['text_to_speech', 'voice_cloning', 'multilingual', 'pt_br_support'],
      supported_languages: ['pt-BR', 'en-US', 'zh-CN', 'es-ES', 'fr-FR'],
      supported_voices: [
        { id: 'br-female-adult-1', name: 'Carla (Brasileira)', language: 'pt-BR', gender: 'female', style: 'neutral' },
        { id: 'br-male-adult-1', name: 'Bruno (Brasileiro)', language: 'pt-BR', gender: 'male', style: 'neutral' },
        { id: 'br-female-young-1', name: 'Luiza (Jovem)', language: 'pt-BR', gender: 'female', style: 'friendly' },
        { id: 'br-male-corporate-1', name: 'Ricardo (Corporativo)', language: 'pt-BR', gender: 'male', style: 'serious' }
      ],
      limits: {
        max_text_length: 8000,
        max_daily_requests: 5000,
        max_file_size_mb: 200,
        supported_formats: ['mp3', 'wav']
      }
    };
  }
  
  private mapVoiceId(voiceId: string): string {
    // Map our internal voice IDs to HeyGen voice IDs
    const voiceMap: { [key: string]: string } = {
      'br-female-adult-1': 'heygen_br_female_carla',
      'br-male-adult-1': 'heygen_br_male_bruno',
      'br-female-young-1': 'heygen_br_female_luiza',
      'br-male-corporate-1': 'heygen_br_male_ricardo'
    };
    
    return voiceMap[voiceId] || voiceMap['br-female-adult-1'];
  }
  
  private mapLanguageCode(language: string): string {
    const languageMap: { [key: string]: string } = {
      'pt-BR': 'portuguese-brazil',
      'en-US': 'english-us',
      'es-ES': 'spanish-spain',
      'fr-FR': 'french-france'
    };
    
    return languageMap[language] || 'portuguese-brazil';
  }
  
  private generateApproximateMarkers(text: string) {
    // Similar to ElevenLabs implementation
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
        confidence: 0.8
      };
      currentTime += avgWordDuration + 0.05;
      return timing;
    });
    
    currentTime = 0;
    const sentenceTimings = sentences.map(sentence => {
      const wordCount = sentence.split(/\s+/).length;
      const duration = (wordCount / avgWordsPerMinute) * 60;
      
      const timing = {
        text: sentence.trim(),
        start_time: currentTime,
        end_time: currentTime + duration
      };
      
      currentTime += duration + 0.3;
      return timing;
    });
    
    return {
      words: wordTimings,
      sentences: sentenceTimings,
      phonemes: []
    };
  }
}