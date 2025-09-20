// Mock TTS Provider for Local Development
import { TTSProvider, TTSGenerationRequest, TTSGenerationResult, TTSProviderError } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class MockTTSProvider implements TTSProvider {
  private readonly providerId = 'mock';
  private readonly providerName = 'Mock TTS Provider';
  
  async generateAudio(request: TTSGenerationRequest): Promise<TTSGenerationResult> {
    console.log(`[MockTTSProvider] Generating audio for request:`, {
      text_length: request.text.length,
      language: request.language,
      voice: request.voice,
      scene_id: request.scene_id
    });
    
    // Simulate API processing delay
    await this.simulateDelay(1000 + Math.random() * 2000);
    
    // Create audio file path
    const timestamp = Date.now();
    const sceneId = request.scene_id || timestamp;
    const audioId = `audio_${sceneId}_${timestamp}`;
    const audioPath = `audio/scene_${sceneId}.mp3`;
    const markersPath = `audio/scene_${sceneId}.markers.json`;
    
    // Create mock audio file (empty MP3 for now)
    const fullAudioPath = path.join(process.cwd(), 'project', 'data', audioPath);
    const fullMarkersPath = path.join(process.cwd(), 'project', 'data', markersPath);
    
    try {
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(fullAudioPath), { recursive: true });
      
      // Create mock audio file (minimal MP3 header)
      const mockAudioData = Buffer.from([
        0xFF, 0xFB, 0x90, 0x00, // MP3 header
        ...Array(100).fill(0x00) // Minimal audio data
      ]);
      await fs.promises.writeFile(fullAudioPath, mockAudioData);
      
      // Create mock markers file
      const mockMarkers = {
        phonemes: this.generateMockPhonemes(request.text),
        words: this.generateMockWords(request.text),
        sentences: this.generateMockSentences(request.text)
      };
      await fs.promises.writeFile(fullMarkersPath, JSON.stringify(mockMarkers, null, 2));
      
    } catch (error) {
      console.warn('[MockTTSProvider] Failed to create mock files:', error.message);
    }
    
    // Calculate mock duration based on text length (average 150 words per minute)
    const wordCount = request.text.split(/\s+/).length;
    const estimatedDuration = Math.max(2, (wordCount / 150) * 60); // Minimum 2 seconds
    
    const mockResult: TTSGenerationResult = {
      audio_id: audioId,
      scene_id: request.scene_id,
      status: 'completed',
      providerId: this.providerId,
      metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: 1000 + Math.random() * 2000,
        text_length: request.text.length,
        language: request.language || 'pt-BR',
        voice: request.voice || 'br-female-adult-1',
        duration_sec: estimatedDuration,
        file_size_bytes: 1024 * Math.ceil(estimatedDuration * 8), // Rough estimate
        model_version: 'mock-v1.0',
        quality: request.quality || 'medium'
      },
      assets: {
        audio_url: audioPath,
        markers_url: markersPath
      },
      markers: {
        phonemes: this.generateMockPhonemes(request.text),
        words: this.generateMockWords(request.text),
        sentences: this.generateMockSentences(request.text)
      }
    };
    
    console.log(`[MockTTSProvider] Audio generated successfully for scene ${sceneId}`);
    return mockResult;
  }
  
  async getAudioStatus(audio_id: string): Promise<TTSGenerationResult> {
    console.log(`[MockTTSProvider] Getting status for audio: ${audio_id}`);
    
    // Extract scene_id from audio_id
    const sceneIdMatch = audio_id.match(/audio_(\d+)_/);
    const sceneId = sceneIdMatch ? sceneIdMatch[1] : '1';
    
    return {
      audio_id,
      scene_id: sceneId,
      status: 'completed',
      providerId: this.providerId,
      metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: 2500,
        text_length: 100,
        language: 'pt-BR',
        voice: 'br-female-adult-1',
        duration_sec: 8.5,
        file_size_bytes: 68600,
        model_version: 'mock-v1.0',
        quality: 'medium'
      },
      assets: {
        audio_url: `audio/scene_${sceneId}.mp3`,
        markers_url: `audio/scene_${sceneId}.markers.json`
      }
    };
  }
  
  async deleteAudio(audio_id: string): Promise<void> {
    console.log(`[MockTTSProvider] Deleting audio: ${audio_id}`);
    
    // Extract scene_id and attempt to delete files
    const sceneIdMatch = audio_id.match(/audio_(\d+)_/);
    if (sceneIdMatch) {
      const sceneId = sceneIdMatch[1];
      const audioPath = path.join(process.cwd(), 'project', 'data', `audio/scene_${sceneId}.mp3`);
      const markersPath = path.join(process.cwd(), 'project', 'data', `audio/scene_${sceneId}.markers.json`);
      
      try {
        await fs.promises.unlink(audioPath);
        await fs.promises.unlink(markersPath);
        console.log(`[MockTTSProvider] Deleted files for scene ${sceneId}`);
      } catch (error) {
        console.warn(`[MockTTSProvider] Failed to delete files:`, error.message);
      }
    }
    
    await this.simulateDelay(200);
  }
  
  async listAudios(deck_id?: string): Promise<TTSGenerationResult[]> {
    console.log(`[MockTTSProvider] Listing audios for deck: ${deck_id || 'all'}`);
    
    // Return mock existing audios
    const mockAudios: TTSGenerationResult[] = [
      {
        audio_id: 'audio_1_1758386000000',
        scene_id: 1,
        status: 'completed',
        providerId: this.providerId,
        metadata: {
          generated_at: '2025-09-20T10:00:00Z',
          processing_time_ms: 2200,
          text_length: 85,
          language: 'pt-BR',
          voice: 'br-female-adult-1',
          duration_sec: 7.2,
          file_size_bytes: 57600,
          model_version: 'mock-v1.0',
          quality: 'medium'
        },
        assets: {
          audio_url: 'audio/scene_1.mp3',
          markers_url: 'audio/scene_1.markers.json'
        }
      },
      {
        audio_id: 'audio_2_1758386000001',
        scene_id: 2,
        status: 'completed',
        providerId: this.providerId,
        metadata: {
          generated_at: '2025-09-20T10:01:00Z',
          processing_time_ms: 3100,
          text_length: 120,
          language: 'pt-BR',
          voice: 'br-male-adult-1',
          duration_sec: 10.5,
          file_size_bytes: 84000,
          model_version: 'mock-v1.0',
          quality: 'medium'
        },
        assets: {
          audio_url: 'audio/scene_2.mp3',
          markers_url: 'audio/scene_2.markers.json'
        }
      }
    ];
    
    return mockAudios;
  }
  
  isHealthy(): Promise<boolean> {
    return Promise.resolve(true);
  }
  
  getProviderInfo() {
    return {
      id: this.providerId,
      name: this.providerName,
      version: '1.0.0',
      capabilities: ['text_to_speech', 'pt_br_support', 'phoneme_timing', 'word_timing'],
      supported_languages: ['pt-BR', 'en-US', 'es-ES'],
      supported_voices: [
        { id: 'br-female-adult-1', name: 'Ana (Adulta)', language: 'pt-BR', gender: 'female', style: 'neutral' },
        { id: 'br-male-adult-1', name: 'Carlos (Adulto)', language: 'pt-BR', gender: 'male', style: 'neutral' },
        { id: 'br-female-young-1', name: 'Sofia (Jovem)', language: 'pt-BR', gender: 'female', style: 'friendly' },
        { id: 'br-male-corporate-1', name: 'Roberto (Corporativo)', language: 'pt-BR', gender: 'male', style: 'serious' }
      ],
      limits: {
        max_text_length: 5000,
        max_daily_requests: 10000,
        max_file_size_mb: 50,
        supported_formats: ['mp3', 'wav']
      }
    };
  }
  
  private generateMockPhonemes(text: string) {
    // Generate mock phoneme timing
    const phonemes = [];
    let currentTime = 0;
    const avgPhonemeLength = 0.08; // 80ms per phoneme average
    
    for (let i = 0; i < text.length; i += 2) {
      const phoneme = text.substring(i, i + 2);
      phonemes.push({
        phoneme: phoneme.toLowerCase(),
        start_time: currentTime,
        end_time: currentTime + avgPhonemeLength
      });
      currentTime += avgPhonemeLength;
    }
    
    return phonemes;
  }
  
  private generateMockWords(text: string) {
    const words = text.split(/\s+/);
    const wordTimings = [];
    let currentTime = 0;
    const avgWordsPerMinute = 150;
    const avgWordDuration = 60 / avgWordsPerMinute; // seconds per word
    
    for (const word of words) {
      if (word.trim()) {
        wordTimings.push({
          word: word.trim(),
          start_time: currentTime,
          end_time: currentTime + avgWordDuration,
          confidence: 0.95
        });
        currentTime += avgWordDuration + 0.1; // Small pause between words
      }
    }
    
    return wordTimings;
  }
  
  private generateMockSentences(text: string) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const sentenceTimings = [];
    let currentTime = 0;
    const avgWordsPerMinute = 150;
    
    for (const sentence of sentences) {
      if (sentence.trim()) {
        const wordCount = sentence.split(/\s+/).length;
        const duration = (wordCount / avgWordsPerMinute) * 60;
        
        sentenceTimings.push({
          text: sentence.trim(),
          start_time: currentTime,
          end_time: currentTime + duration
        });
        
        currentTime += duration + 0.5; // Pause between sentences
      }
    }
    
    return sentenceTimings;
  }
  
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}