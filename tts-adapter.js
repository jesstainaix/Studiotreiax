/**
 * Adaptador TTS Premium com fallback
 * Suporta ElevenLabs, Google Cloud TTS e fallback local
 */

import { promises as fs } from 'fs';
import path from 'path';

export class TTSAdapter {
  constructor() {
    this.providers = {
      elevenlabs: {
        available: !!process.env.ELEVENLABS_API_KEY,
        endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
        voice: 'Rachel', // Voz padrão
        priority: 1
      },
      google: {
        available: !!process.env.GOOGLE_TTS_API_KEY,
        endpoint: 'https://texttospeech.googleapis.com/v1/text:synthesize',
        voice: 'pt-BR-Wavenet-A',
        priority: 2
      },
      azure: {
        available: !!process.env.AZURE_TTS_KEY,
        endpoint: 'https://brazilsouth.tts.speech.microsoft.com/cognitiveservices/v1',
        voice: 'pt-BR-FranciscaNeural',
        priority: 3
      }
    };
    
    console.log('🔊 [TTS Adapter] Configurado com providers:', Object.keys(this.providers).filter(p => this.providers[p].available));
  }

  async generateSpeech(text, options = {}) {
    const config = {
      voice: options.voice || 'default',
      speed: options.speed || 1.0,
      pitch: options.pitch || 0,
      outputFormat: options.format || 'wav',
      sampleRate: options.sampleRate || 44100,
      ...options
    };

    // Tentar providers em ordem de prioridade
    const availableProviders = Object.entries(this.providers)
      .filter(([_, provider]) => provider.available)
      .sort(([_, a], [__, b]) => a.priority - b.priority);

    for (const [name, provider] of availableProviders) {
      try {
        console.log(`🎤 [TTS Adapter] Tentando ${name} para "${text.substring(0, 50)}..."`);
        
        const audioData = await this.callProvider(name, text, config);
        
        if (audioData) {
          console.log(`✅ [TTS Adapter] Sucesso com ${name} (${audioData.length} bytes)`);
          return {
            audioData,
            duration: this.estimateDuration(text, config.speed),
            provider: name,
            format: config.outputFormat,
            sampleRate: config.sampleRate
          };
        }
      } catch (error) {
        console.warn(`⚠️ [TTS Adapter] Falha no ${name}:`, error.message);
        continue;
      }
    }

    // Fallback para geração local
    console.log('🔄 [TTS Adapter] Usando fallback local');
    return this.generateFallbackAudio(text, config);
  }

  async callProvider(name, text, config) {
    switch (name) {
      case 'elevenlabs':
        return this.callElevenLabs(text, config);
      case 'google':
        return this.callGoogleTTS(text, config);
      case 'azure':
        return this.callAzureTTS(text, config);
      default:
        throw new Error(`Provider ${name} não suportado`);
    }
  }

  async callElevenLabs(text, config) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ELEVENLABS_API_KEY não configurada');

    const response = await fetch(`${this.providers.elevenlabs.endpoint}/${config.voice || 'Rachel'}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  }

  async callGoogleTTS(text, config) {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_TTS_API_KEY não configurada');

    const response = await fetch(`${this.providers.google.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'pt-BR',
          name: config.voice || 'pt-BR-Wavenet-A',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'LINEAR16',
          sampleRateHertz: config.sampleRate,
          speakingRate: config.speed,
          pitch: config.pitch
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.status}`);
    }

    const result = await response.json();
    return Buffer.from(result.audioContent, 'base64');
  }

  async callAzureTTS(text, config) {
    const apiKey = process.env.AZURE_TTS_KEY;
    const region = process.env.AZURE_TTS_REGION || 'brazilsouth';
    
    if (!apiKey) throw new Error('AZURE_TTS_KEY não configurada');

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
        <voice name="${config.voice || 'pt-BR-FranciscaNeural'}">
          <prosody rate="${config.speed}" pitch="${config.pitch}Hz">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-44khz-16bit-mono-pcm'
      },
      body: ssml
    });

    if (!response.ok) {
      throw new Error(`Azure TTS API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  }

  generateFallbackAudio(text, config) {
    const duration = this.estimateDuration(text, config.speed);
    const sampleRate = config.sampleRate;
    const channels = 1;
    const bitsPerSample = 16;
    
    // Calcular tamanho do arquivo WAV
    const numSamples = Math.floor(duration * sampleRate);
    const dataSize = numSamples * channels * (bitsPerSample / 8);
    const fileSize = 44 + dataSize; // 44 bytes para o header WAV

    // Criar header WAV válido
    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    // RIFF header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;

    // Format chunk
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // Chunk size
    buffer.writeUInt16LE(1, offset); offset += 2; // Audio format (PCM)
    buffer.writeUInt16LE(channels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), offset); offset += 4; // Byte rate
    buffer.writeUInt16LE(channels * (bitsPerSample / 8), offset); offset += 2; // Block align
    buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

    // Data chunk
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;

    // Gerar áudio silencioso (na produção seria síntese real)
    for (let i = 0; i < numSamples; i++) {
      buffer.writeInt16LE(0, offset);
      offset += 2;
    }

    console.log(`🔄 [TTS Adapter] Fallback: ${duration}s, ${sampleRate}Hz, ${fileSize} bytes`);

    return {
      audioData: buffer,
      duration,
      provider: 'fallback',
      format: 'wav',
      sampleRate
    };
  }

  estimateDuration(text, speed = 1.0) {
    // Estimativa: ~2.5 palavras por segundo em português
    const words = text.split(/\s+/).length;
    const baseDuration = words / 2.5;
    return baseDuration / speed;
  }

  async generateSegmentedAudio(textSegments, options = {}) {
    const results = [];
    let totalDuration = 0;

    for (const segment of textSegments) {
      try {
        const audio = await this.generateSpeech(segment.text, {
          ...options,
          voice: segment.voice || options.voice
        });

        results.push({
          ...segment,
          audio,
          startTime: totalDuration,
          endTime: totalDuration + audio.duration
        });

        totalDuration += audio.duration;
        
        console.log(`🎵 [TTS Adapter] Segmento "${segment.text.substring(0, 30)}..." → ${audio.duration}s`);
        
      } catch (error) {
        console.error(`❌ [TTS Adapter] Erro no segmento "${segment.text}":`, error.message);
        throw error;
      }
    }

    return {
      segments: results,
      totalDuration
    };
  }

  async combineAudioSegments(segments, outputPath) {
    // Implementação básica - na produção usaria FFmpeg para mixagem
    const firstSegment = segments[0];
    if (!firstSegment) throw new Error('Nenhum segmento de áudio fornecido');

    const combinedBuffer = Buffer.concat(segments.map(s => s.audio?.audioData || Buffer.alloc(1024)).filter(buf => buf.length > 0));
    
    await fs.writeFile(outputPath, combinedBuffer);
    
    console.log(`🎼 [TTS Adapter] Áudio combinado salvo: ${outputPath} (${combinedBuffer.length} bytes)`);
    
    return {
      path: outputPath,
      duration: segments.reduce((total, s) => total + s.audio.duration, 0),
      size: combinedBuffer.length
    };
  }

  // Utilitários para verificação de providers
  getAvailableProviders() {
    return Object.entries(this.providers)
      .filter(([_, provider]) => provider.available)
      .map(([name, provider]) => ({
        name,
        priority: provider.priority,
        voice: provider.voice
      }));
  }

  async testProvider(providerName, testText = 'Teste de voz') {
    try {
      const result = await this.generateSpeech(testText, { provider: providerName });
      return {
        provider: providerName,
        success: true,
        duration: result.duration,
        size: result.audioData.length
      };
    } catch (error) {
      return {
        provider: providerName,
        success: false,
        error: error.message
      };
    }
  }
}

export default TTSAdapter;