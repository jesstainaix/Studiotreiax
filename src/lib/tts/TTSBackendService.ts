/**
 * Backend TTS Service for secure API key management
 * Proxies TTS requests through backend to avoid exposing API keys
 */

import { TTSRequest, TTSResponse } from './TTSService';

export class TTSBackendService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Synthesize speech via backend proxy
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Backend TTS error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert base64 audio to blob URL for client use
      if (data.success && data.audioBase64) {
        const audioBuffer = Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBuffer], { type: `audio/${request.outputFormat || 'mp3'}` });
        data.audioUrl = URL.createObjectURL(audioBlob);
        data.audioBuffer = audioBuffer.buffer;
      }

      return data;
    } catch (error) {
      return {
        success: false,
        characterCount: request.text.length,
        provider: request.provider,
        voiceId: request.voiceId,
        error: error instanceof Error ? error.message : 'Backend connection failed'
      };
    }
  }

  /**
   * Get available voices via backend
   */
  async getVoices(provider?: string): Promise<any[]> {
    try {
      const url = provider 
        ? `${this.baseUrl}/api/tts/voices?provider=${provider}`
        : `${this.baseUrl}/api/tts/voices`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  /**
   * Health check for backend TTS service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tts/health`);
      return response.ok;
    } catch (error) {
      console.error('TTS backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ttsBackendService = new TTSBackendService();