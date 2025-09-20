/**
 * Audio Export Service for Video Production Pipeline
 * Handles scene audio generation, synchronization, and export for final video rendering
 */

import { HeyGenProject, HeyGenScene } from '../pptx/heygen-scene-manager';
import { TTSService, TTSResponse } from './TTSService';

export interface AudioExportOptions {
  format: 'wav' | 'mp3' | 'aac';
  quality: 'standard' | 'high' | 'ultra';
  sampleRate: 8000 | 16000 | 22050 | 44100 | 48000;
  bitrate?: number; // For MP3/AAC
  normalizeAudio?: boolean;
  addSilence?: {
    start: number; // milliseconds
    end: number;   // milliseconds
  };
}

export interface SceneAudioData {
  sceneId: string;
  audioUrl: string;
  audioBuffer: ArrayBuffer;
  duration: number;
  startTime: number; // Position in final timeline
  endTime: number;
  fadeIn?: number;   // Fade in duration in ms
  fadeOut?: number;  // Fade out duration in ms
  volume: number;    // 0.0 to 1.0
  audioSettings?: {
    backgroundMusic?: string;
    backgroundMusicVolume?: number;
    speechVolume: number;
    effects?: Array<{
      type: 'reverb' | 'echo' | 'compressor';
      parameters: Record<string, number>;
    }>;
  };
}

export interface ProjectAudioExport {
  projectId: string;
  totalDuration: number;
  sceneAudios: SceneAudioData[];
  mixedAudioUrl?: string;
  exportedFiles: Array<{
    format: string;
    url: string;
    size: number;
  }>;
  lipSyncData?: Array<{
    sceneId: string;
    frames: Array<{
      timestamp: number;
      phoneme: string;
      viseme: string;
    }>;
  }>;
}

/**
 * Audio Export Service for Brazilian Safety Training Videos
 */
export class AudioExportService {
  private ttsService: TTSService;
  private audioContext: AudioContext | null = null;

  constructor(ttsService: TTSService) {
    this.ttsService = ttsService;
  }

  /**
   * Initialize audio context for processing
   */
  private async initAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    return this.audioContext;
  }

  /**
   * Generate audio for all scenes in a project
   * All time units are in seconds for consistency
   */
  async generateProjectAudio(
    project: HeyGenProject,
    options: AudioExportOptions = {
      format: 'wav',
      quality: 'high',
      sampleRate: 44100,
      normalizeAudio: true
    },
    onProgress?: (sceneIndex: number, totalScenes: number, sceneName: string) => void
  ): Promise<ProjectAudioExport> {
    const sceneAudios: SceneAudioData[] = [];
    let currentTimeSeconds = 0;

    // Process each scene
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      
      onProgress?.(i + 1, project.scenes.length, scene.title);
      
      if (!scene.voice) {
        console.warn(`Scene ${scene.id} has no voice assigned, skipping audio generation`);
        continue;
      }

      try {
        // Generate TTS audio for scene
        const audioResponse = await this.generateSceneAudio(scene, options);
        
        if (audioResponse.success && audioResponse.audioUrl && audioResponse.audioBuffer) {
          const durationSeconds = audioResponse.duration || scene.duration;
          
          const sceneAudio: SceneAudioData = {
            sceneId: scene.id,
            audioUrl: audioResponse.audioUrl,
            audioBuffer: audioResponse.audioBuffer,
            duration: durationSeconds,
            startTime: currentTimeSeconds,
            endTime: currentTimeSeconds + durationSeconds,
            volume: scene.audioSettings?.speechVolume || 1.0,
            audioSettings: scene.audioSettings
          };

          // Add fade effects for smooth transitions (in milliseconds)
          if (i > 0) sceneAudio.fadeIn = 200; // 200ms fade in
          if (i < project.scenes.length - 1) sceneAudio.fadeOut = 200; // 200ms fade out

          sceneAudios.push(sceneAudio);
          currentTimeSeconds += durationSeconds;
        }
      } catch (error) {
        console.error(`Error generating audio for scene ${scene.id}:`, error);
        // Continue with other scenes
      }
    }

    return {
      projectId: project.id,
      totalDuration: currentTimeSeconds,
      sceneAudios,
      exportedFiles: []
    };
  }

  /**
   * Generate audio for a single scene
   */
  private async generateSceneAudio(
    scene: HeyGenScene,
    options: AudioExportOptions
  ): Promise<TTSResponse> {
    if (!scene.voice) {
      throw new Error('Scene has no voice assigned');
    }

    // Prepare TTS request with scene-specific settings
    const ttsRequest = {
      text: scene.content,
      voiceId: scene.voice.id,
      provider: scene.voice.provider,
      options: {
        speed: scene.audioSettings?.speechSpeed || 1.0,
        pitch: 0,
        useEnhancedModel: true,
        // Apply custom pronunciations for technical terms
        ...scene.audioSettings?.pronunciation
      },
      outputFormat: options.format === 'wav' ? 'wav' : 'mp3',
      ssmlEnabled: true
    };

    return await this.ttsService.synthesize(ttsRequest);
  }

  /**
   * Mix scene audios into a single timeline
   */
  async mixProjectAudio(
    sceneAudios: SceneAudioData[],
    options: AudioExportOptions
  ): Promise<string> {
    const audioContext = await this.initAudioContext();
    const totalDuration = Math.max(...sceneAudios.map(s => s.endTime));
    const sampleRate = options.sampleRate;
    
    // Create audio buffer for final mix
    const frameCount = Math.ceil(totalDuration * sampleRate);
    const mixBuffer = audioContext.createBuffer(2, frameCount, sampleRate); // Stereo
    
    // Mix each scene audio
    for (const sceneAudio of sceneAudios) {
      try {
        const audioBuffer = await this.decodeAudioData(sceneAudio.audioBuffer, audioContext);
        this.mixAudioBuffer(mixBuffer, audioBuffer, sceneAudio, sampleRate);
      } catch (error) {
        console.error(`Error mixing audio for scene ${sceneAudio.sceneId}:`, error);
      }
    }

    // Apply normalization if requested
    if (options.normalizeAudio) {
      this.normalizeAudioBuffer(mixBuffer);
    }

    // Export mixed audio
    return await this.exportAudioBuffer(mixBuffer, options);
  }

  /**
   * Decode audio data to AudioBuffer
   */
  private async decodeAudioData(audioBuffer: ArrayBuffer, audioContext: AudioContext): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      audioContext.decodeAudioData(
        audioBuffer.slice(0), // Clone the buffer
        resolve,
        reject
      );
    });
  }

  /**
   * Mix an audio buffer into the main timeline
   * sceneAudio.startTime is in seconds, fade times are in milliseconds
   */
  private mixAudioBuffer(
    mainBuffer: AudioBuffer,
    sceneBuffer: AudioBuffer,
    sceneAudio: SceneAudioData,
    sampleRate: number
  ) {
    const startFrame = Math.floor(sceneAudio.startTime * sampleRate); // startTime is in seconds
    const fadeInFrames = sceneAudio.fadeIn ? Math.floor(sceneAudio.fadeIn * sampleRate / 1000) : 0; // fadeIn is in ms
    const fadeOutFrames = sceneAudio.fadeOut ? Math.floor(sceneAudio.fadeOut * sampleRate / 1000) : 0; // fadeOut is in ms
    
    for (let channel = 0; channel < Math.min(mainBuffer.numberOfChannels, sceneBuffer.numberOfChannels); channel++) {
      const mainData = mainBuffer.getChannelData(channel);
      const sceneData = sceneBuffer.getChannelData(channel);
      
      for (let i = 0; i < sceneBuffer.length && startFrame + i < mainBuffer.length; i++) {
        let sample = sceneData[i] * sceneAudio.volume;
        
        // Apply fade in
        if (i < fadeInFrames) {
          sample *= i / fadeInFrames;
        }
        
        // Apply fade out
        if (i > sceneBuffer.length - fadeOutFrames) {
          sample *= (sceneBuffer.length - i) / fadeOutFrames;
        }
        
        // Mix with existing audio
        mainData[startFrame + i] += sample;
      }
    }
  }

  /**
   * Normalize audio buffer to prevent clipping
   */
  private normalizeAudioBuffer(audioBuffer: AudioBuffer) {
    let maxAmplitude = 0;
    
    // Find peak amplitude
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const data = audioBuffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
      }
    }
    
    // Normalize if needed (leave some headroom)
    if (maxAmplitude > 0.95) {
      const normalizationFactor = 0.95 / maxAmplitude;
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
          data[i] *= normalizationFactor;
        }
      }
    }
  }

  /**
   * Export audio buffer to file
   */
  private async exportAudioBuffer(audioBuffer: AudioBuffer, options: AudioExportOptions): Promise<string> {
    // For WAV export
    if (options.format === 'wav') {
      const wavBlob = this.audioBufferToWav(audioBuffer);
      return URL.createObjectURL(wavBlob);
    }
    
    // For MP3/AAC, we would need additional encoding libraries
    // For now, return WAV as fallback
    const wavBlob = this.audioBufferToWav(audioBuffer);
    return URL.createObjectURL(wavBlob);
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        const intSample = Math.floor(sample * 0x7FFF);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Generate lip-sync data for all scenes
   */
  async generateLipSyncData(sceneAudios: SceneAudioData[]): Promise<Array<{
    sceneId: string;
    frames: Array<{
      timestamp: number;
      phoneme: string;
      viseme: string;
    }>;
  }>> {
    const lipSyncData = [];
    
    for (const sceneAudio of sceneAudios) {
      try {
        const frames = await this.ttsService.generateLipSync(sceneAudio.audioUrl);
        lipSyncData.push({
          sceneId: sceneAudio.sceneId,
          frames: frames.map(frame => ({
            timestamp: frame.timestamp + sceneAudio.startTime,
            phoneme: frame.phoneme,
            viseme: frame.viseme
          }))
        });
      } catch (error) {
        console.error(`Error generating lip-sync for scene ${sceneAudio.sceneId}:`, error);
      }
    }
    
    return lipSyncData;
  }

  /**
   * Export complete project audio with all formats
   */
  async exportProjectAudio(
    project: HeyGenProject,
    formats: AudioExportOptions[],
    onProgress?: (step: string, progress: number) => void
  ): Promise<ProjectAudioExport> {
    onProgress?.('Generating scene audios...', 0);
    
    // Generate audio for all scenes
    const projectAudio = await this.generateProjectAudio(
      project,
      formats[0], // Use first format for generation
      (sceneIndex, totalScenes, sceneName) => {
        const progress = (sceneIndex / totalScenes) * 50; // 50% for scene generation
        onProgress?.(`Processing: ${sceneName}`, progress);
      }
    );

    onProgress?.('Mixing audio timeline...', 50);
    
    // Mix scenes into final timeline
    if (projectAudio.sceneAudios.length > 1) {
      projectAudio.mixedAudioUrl = await this.mixProjectAudio(projectAudio.sceneAudios, formats[0]);
    } else if (projectAudio.sceneAudios.length === 1) {
      projectAudio.mixedAudioUrl = projectAudio.sceneAudios[0].audioUrl;
    }

    onProgress?.('Generating lip-sync data...', 75);
    
    // Generate lip-sync data
    projectAudio.lipSyncData = await this.generateLipSyncData(projectAudio.sceneAudios);

    onProgress?.('Exporting formats...', 90);
    
    // Export in requested formats
    for (const format of formats) {
      if (projectAudio.mixedAudioUrl) {
        // For now, we'll use the mixed audio URL
        // In production, this would re-encode to different formats
        projectAudio.exportedFiles.push({
          format: format.format,
          url: projectAudio.mixedAudioUrl,
          size: 0 // Would be calculated from actual file
        });
      }
    }

    onProgress?.('Complete', 100);
    
    return projectAudio;
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Export service instance
export const audioExportService = new AudioExportService(new TTSService());