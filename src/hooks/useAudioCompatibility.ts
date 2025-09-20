import { useCallback, useState, useRef } from 'react';

interface AudioFormat {
  mimeType: string;
  extension: string;
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

interface ConversionOptions {
  targetFormat: AudioFormat;
  quality?: number; // 0-1
  normalize?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

interface CompatibilityResult {
  isSupported: boolean;
  canPlay: boolean;
  canRecord: boolean;
  needsConversion: boolean;
  recommendedFormat?: AudioFormat;
}

const SUPPORTED_FORMATS: AudioFormat[] = [
  { mimeType: 'audio/wav', extension: 'wav', codec: 'pcm' },
  { mimeType: 'audio/mp3', extension: 'mp3', codec: 'mp3' },
  { mimeType: 'audio/mp4', extension: 'm4a', codec: 'aac' },
  { mimeType: 'audio/ogg', extension: 'ogg', codec: 'vorbis' },
  { mimeType: 'audio/webm', extension: 'webm', codec: 'opus' },
  { mimeType: 'audio/flac', extension: 'flac', codec: 'flac' },
  { mimeType: 'audio/aac', extension: 'aac', codec: 'aac' },
  { mimeType: 'audio/x-aiff', extension: 'aiff', codec: 'pcm' }
];

const OPTIMAL_FORMATS: AudioFormat[] = [
  { mimeType: 'audio/wav', extension: 'wav', codec: 'pcm', sampleRate: 44100, channels: 2 },
  { mimeType: 'audio/mp3', extension: 'mp3', codec: 'mp3', bitrate: 320, sampleRate: 44100, channels: 2 },
  { mimeType: 'audio/webm', extension: 'webm', codec: 'opus', sampleRate: 48000, channels: 2 }
];

export const useAudioCompatibility = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [compatibilityCache, setCompatibilityCache] = useState<Map<string, CompatibilityResult>>(new Map());
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Check if a specific audio format is supported
  const checkFormatSupport = useCallback((format: AudioFormat): CompatibilityResult => {
    const cacheKey = `${format.mimeType}_${format.codec}`;
    
    if (compatibilityCache.has(cacheKey)) {
      return compatibilityCache.get(cacheKey)!;
    }

    const result: CompatibilityResult = {
      isSupported: false,
      canPlay: false,
      canRecord: false,
      needsConversion: false
    };

    try {
      // Check playback support
      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement('audio');
      }
      
      const canPlayType = audioElementRef.current.canPlayType(format.mimeType);
      result.canPlay = canPlayType === 'probably' || canPlayType === 'maybe';

      // Check recording support
      if (typeof MediaRecorder !== 'undefined') {
        const fullMimeType = format.codec ? 
          `${format.mimeType};codecs=${format.codec}` : 
          format.mimeType;
        result.canRecord = MediaRecorder.isTypeSupported(fullMimeType);
      }

      result.isSupported = result.canPlay || result.canRecord;
      result.needsConversion = !result.isSupported;

      // Recommend optimal format if current is not supported
      if (!result.isSupported) {
        result.recommendedFormat = findOptimalFormat();
      }

      compatibilityCache.set(cacheKey, result);
      setCompatibilityCache(new Map(compatibilityCache));

      return result;
    } catch (error) {
      console.error('Error checking format support:', error);
      return result;
    }
  }, [compatibilityCache]);

  // Find the best supported format for the current browser
  const findOptimalFormat = useCallback((): AudioFormat => {
    for (const format of OPTIMAL_FORMATS) {
      const support = checkFormatSupport(format);
      if (support.isSupported) {
        return format;
      }
    }
    
    // Fallback to basic WAV if nothing else works
    return SUPPORTED_FORMATS[0];
  }, [checkFormatSupport]);

  // Check compatibility of an audio file
  const checkFileCompatibility = useCallback(async (file: File): Promise<CompatibilityResult> => {
    setIsChecking(true);
    
    try {
      const format: AudioFormat = {
        mimeType: file.type,
        extension: file.name.split('.').pop()?.toLowerCase() || '',
      };

      // Try to get more detailed format info
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        format.sampleRate = audioBuffer.sampleRate;
        format.channels = audioBuffer.numberOfChannels;
      } catch (decodeError) {
        console.warn('Could not decode audio for detailed analysis:', decodeError);
      } finally {
        audioContext.close();
      }

      const result = checkFormatSupport(format);
      return result;
    } catch (error) {
      console.error('Error checking file compatibility:', error);
      return {
        isSupported: false,
        canPlay: false,
        canRecord: false,
        needsConversion: true,
        recommendedFormat: findOptimalFormat()
      };
    } finally {
      setIsChecking(false);
    }
  }, [checkFormatSupport, findOptimalFormat]);

  // Convert audio file to compatible format
  const convertAudioFile = useCallback(async (
    file: File, 
    options: ConversionOptions
  ): Promise<Blob | null> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create offline context for conversion
      const offlineContext = new OfflineAudioContext(
        options.targetFormat.channels || audioBuffer.numberOfChannels,
        audioBuffer.length,
        options.targetFormat.sampleRate || audioBuffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      // Apply audio processing if needed
      let currentNode: AudioNode = source;

      // Normalize audio if requested
      if (options.normalize) {
        const gainNode = offlineContext.createGain();
        const maxAmplitude = getMaxAmplitude(audioBuffer);
        gainNode.gain.value = maxAmplitude > 0 ? 0.95 / maxAmplitude : 1;
        currentNode.connect(gainNode);
        currentNode = gainNode;
      }

      // Apply fade effects
      if (options.fadeIn || options.fadeOut) {
        const gainNode = offlineContext.createGain();
        
        if (options.fadeIn) {
          gainNode.gain.setValueAtTime(0, 0);
          gainNode.gain.linearRampToValueAtTime(1, options.fadeIn);
        }
        
        if (options.fadeOut) {
          const duration = audioBuffer.duration;
          gainNode.gain.setValueAtTime(1, duration - options.fadeOut);
          gainNode.gain.linearRampToValueAtTime(0, duration);
        }
        
        currentNode.connect(gainNode);
        currentNode = gainNode;
      }

      currentNode.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to target format
      const convertedBlob = await encodeAudioBuffer(renderedBuffer, options.targetFormat, options.quality);
      
      audioContext.close();
      return convertedBlob;
    } catch (error) {
      console.error('Audio conversion error:', error);
      return null;
    }
  }, []);

  // Encode audio buffer to specific format
  const encodeAudioBuffer = useCallback(async (
    audioBuffer: AudioBuffer,
    format: AudioFormat,
    quality: number = 0.8
  ): Promise<Blob> => {
    if (format.mimeType === 'audio/wav') {
      return encodeWAV(audioBuffer);
    }

    // For other formats, use MediaRecorder if available
    if (typeof MediaRecorder !== 'undefined') {
      return encodeWithMediaRecorder(audioBuffer, format, quality);
    }

    // Fallback to WAV
    return encodeWAV(audioBuffer);
  }, []);

  // Encode to WAV format
  const encodeWAV = useCallback((audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numberOfChannels * 2;
    
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }, []);

  // Encode using MediaRecorder
  const encodeWithMediaRecorder = useCallback(async (
    audioBuffer: AudioBuffer,
    format: AudioFormat,
    quality: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createBufferSource();
        const destination = audioContext.createMediaStreamDestination();
        
        source.buffer = audioBuffer;
        source.connect(destination);
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: format.mimeType,
          audioBitsPerSecond: format.bitrate || Math.floor(128000 * quality)
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: format.mimeType });
          audioContext.close();
          resolve(blob);
        };
        
        mediaRecorder.onerror = (error) => {
          audioContext.close();
          reject(error);
        };
        
        mediaRecorder.start();
        source.start();
        
        // Stop recording when audio ends
        setTimeout(() => {
          mediaRecorder.stop();
        }, (audioBuffer.duration * 1000) + 100);
        
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Get maximum amplitude from audio buffer
  const getMaxAmplitude = useCallback((audioBuffer: AudioBuffer): number => {
    let max = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        max = Math.max(max, Math.abs(channelData[i]));
      }
    }
    return max;
  }, []);

  // Get all supported formats
  const getSupportedFormats = useCallback((): AudioFormat[] => {
    return SUPPORTED_FORMATS.filter(format => {
      const support = checkFormatSupport(format);
      return support.isSupported;
    });
  }, [checkFormatSupport]);

  // Clear compatibility cache
  const clearCache = useCallback(() => {
    setCompatibilityCache(new Map());
  }, []);

  return {
    checkFormatSupport,
    checkFileCompatibility,
    convertAudioFile,
    findOptimalFormat,
    getSupportedFormats,
    clearCache,
    isChecking,
    supportedFormats: SUPPORTED_FORMATS
  };
};

export default useAudioCompatibility;