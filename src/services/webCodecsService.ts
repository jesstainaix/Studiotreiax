import { create } from 'zustand';

export interface VideoEncoderConfig {
  codec: string;
  width: number;
  height: number;
  bitrate?: number;
  framerate?: number;
  keyFrameIntervalCount?: number;
  latencyMode?: 'quality' | 'realtime';
}

export interface VideoDecoderConfig {
  codec: string;
  description?: BufferSource;
  codedWidth?: number;
  codedHeight?: number;
  displayAspectWidth?: number;
  displayAspectHeight?: number;
  colorSpace?: VideoColorSpaceInit;
  hardwareAcceleration?: HardwareAcceleration;
  optimizeForLatency?: boolean;
}

export interface WebCodecsState {
  isSupported: boolean;
  encoder: VideoEncoder | null;
  decoder: VideoDecoder | null;
  isEncoding: boolean;
  isDecoding: boolean;
  createEncoder: (config: VideoEncoderConfig, onChunk: (chunk: EncodedVideoChunk) => void, onError?: (error: Error) => void) => VideoEncoder;
  createDecoder: (config: VideoDecoderConfig, onFrame: (frame: VideoFrame) => void, onError?: (error: Error) => void) => VideoDecoder;
  encodeFrame: (frame: VideoFrame, keyFrame?: boolean) => Promise<void>;
  decodeChunk: (chunk: EncodedVideoChunk) => Promise<void>;
  reset: () => void;
}

class WebCodecsService {
  private encoder: VideoEncoder | null = null;
  private decoder: VideoDecoder | null = null;
  private encoderConfig: VideoEncoderConfig | null = null;
  private decoderConfig: VideoDecoderConfig | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    const isSupported = typeof VideoEncoder !== 'undefined' && 
                       typeof VideoDecoder !== 'undefined' &&
                       typeof VideoFrame !== 'undefined' &&
                       typeof EncodedVideoChunk !== 'undefined';
    
    if (!isSupported) {
      console.warn('WebCodecs API is not supported in this browser');
    }
    
    return isSupported;
  }

  getSupport(): boolean {
    return this.isSupported;
  }

  async createEncoder(
    config: VideoEncoderConfig,
    onChunk: (chunk: EncodedVideoChunk) => void,
    onError?: (error: Error) => void
  ): Promise<VideoEncoder> {
    if (!this.isSupported) {
      throw new Error('WebCodecs is not supported');
    }

    try {
      // Check if codec is supported
      const support = await VideoEncoder.isConfigSupported(config);
      if (!support.supported) {
        throw new Error(`Codec ${config.codec} is not supported`);
      }

      this.encoder = new VideoEncoder({
        output: (chunk, metadata) => {
          onChunk(chunk);
        },
        error: (error) => {
          console.error('VideoEncoder error:', error);
          if (onError) onError(error);
        }
      });

      this.encoder.configure(config);
      this.encoderConfig = config;
      
      useWebCodecs.setState({ encoder: this.encoder });
      
      return this.encoder;
    } catch (error) {
      console.error('Failed to create VideoEncoder:', error);
      throw error;
    }
  }

  async createDecoder(
    config: VideoDecoderConfig,
    onFrame: (frame: VideoFrame) => void,
    onError?: (error: Error) => void
  ): Promise<VideoDecoder> {
    if (!this.isSupported) {
      throw new Error('WebCodecs is not supported');
    }

    try {
      // Check if codec is supported
      const support = await VideoDecoder.isConfigSupported(config);
      if (!support.supported) {
        throw new Error(`Codec ${config.codec} is not supported`);
      }

      this.decoder = new VideoDecoder({
        output: (frame) => {
          onFrame(frame);
        },
        error: (error) => {
          console.error('VideoDecoder error:', error);
          if (onError) onError(error);
        }
      });

      this.decoder.configure(config);
      this.decoderConfig = config;
      
      useWebCodecs.setState({ decoder: this.decoder });
      
      return this.decoder;
    } catch (error) {
      console.error('Failed to create VideoDecoder:', error);
      throw error;
    }
  }

  async encodeFrame(frame: VideoFrame, keyFrame: boolean = false): Promise<void> {
    try {
      if (!this.encoder) {
        throw new Error('Encoder not initialized');
      }

      this.encoder.encode(frame, { keyFrame });
    } catch (error) {
      console.error('Frame encoding failed:', error);
      throw error;
    }
  }

  async decodeChunk(chunk: EncodedVideoChunk): Promise<void> {
    try {
      if (!this.decoder) {
        throw new Error('Decoder not initialized');
      }

      this.decoder.decode(chunk);
      await this.decoder.flush();
    } catch (error) {
      console.error('Chunk decoding failed:', error);
      throw error;
    }
  }

  async createVideoFrameFromCanvas(canvas: HTMLCanvasElement, timestamp: number): Promise<VideoFrame> {
    if (!this.isSupported) {
      throw new Error('WebCodecs is not supported');
    }

    return new VideoFrame(canvas, {
      timestamp,
      duration: 33333 // 30fps default
    });
  }

  async createVideoFrameFromImageBitmap(bitmap: ImageBitmap, timestamp: number): Promise<VideoFrame> {
    if (!this.isSupported) {
      throw new Error('WebCodecs is not supported');
    }

    return new VideoFrame(bitmap, {
      timestamp,
      duration: 33333 // 30fps default
    });
  }

  async extractFrameFromVideo(video: HTMLVideoElement, timestamp: number): Promise<VideoFrame> {
    if (!this.isSupported) {
      throw new Error('WebCodecs is not supported');
    }

    // Seek to timestamp
    video.currentTime = timestamp / 1000000; // Convert microseconds to seconds
    
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        try {
          const frame = new VideoFrame(video, {
            timestamp,
            duration: 33333
          });
          video.removeEventListener('seeked', onSeeked);
          resolve(frame);
        } catch (error) {
          video.removeEventListener('seeked', onSeeked);
          reject(error);
        }
      };
      
      video.addEventListener('seeked', onSeeked);
    });
  }

  async processVideoStream(
    stream: MediaStream,
    processor: (frame: VideoFrame) => VideoFrame | Promise<VideoFrame>
  ): Promise<MediaStream> {
    if (!this.isSupported) {
      throw new Error('WebCodecs is not supported');
    }

    const track = stream.getVideoTracks()[0];
    if (!track) {
      throw new Error('No video track found in stream');
    }

    const reader = new MediaStreamTrackProcessor({ track }).readable.getReader();
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });
    const writer = generator.writable.getWriter();

    const processFrames = async () => {
      try {
        while (true) {
          const { done, value: frame } = await reader.read();
          if (done) break;

          try {
            const processedFrame = await processor(frame);
            await writer.write(processedFrame);
            frame.close();
            if (processedFrame !== frame) {
              processedFrame.close();
            }
          } catch (error) {
            console.error('Frame processing error:', error);
            frame.close();
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error);
      } finally {
        await writer.close();
      }
    };

    processFrames();

    return new MediaStream([generator]);
  }

  reset(): void {
    if (this.encoder) {
      this.encoder.close();
      this.encoder = null;
    }
    
    if (this.decoder) {
      this.decoder.close();
      this.decoder = null;
    }
    
    this.encoderConfig = null;
    this.decoderConfig = null;
  }

  // Utility methods for common codecs
  static getH264EncoderConfig(width: number, height: number, bitrate: number = 1000000): VideoEncoderConfig {
    return {
      codec: 'avc1.42E01E', // H.264 Baseline Profile
      width,
      height,
      bitrate,
      framerate: 30,
      keyFrameIntervalCount: 30,
      latencyMode: 'realtime'
    };
  }

  static getVP9EncoderConfig(width: number, height: number, bitrate: number = 1000000): VideoEncoderConfig {
    return {
      codec: 'vp09.00.10.08', // VP9 Profile 0
      width,
      height,
      bitrate,
      framerate: 30,
      keyFrameIntervalCount: 30,
      latencyMode: 'quality'
    };
  }

  static getAV1EncoderConfig(width: number, height: number, bitrate: number = 1000000): VideoEncoderConfig {
    return {
      codec: 'av01.0.04M.08', // AV1 Main Profile
      width,
      height,
      bitrate,
      framerate: 30,
      keyFrameIntervalCount: 30,
      latencyMode: 'quality'
    };
  }
}

// Zustand store for WebCodecs state
export const useWebCodecs = create<WebCodecsState>((set, get) => {
  let service: WebCodecsService | null = null;

  const getService = () => {
    if (!service) {
      service = new WebCodecsService();
    }
    return service;
  };

  return {
    isSupported: false,
    encoder: null,
    decoder: null,
    isEncoding: false,
    isDecoding: false,

    createEncoder: async (config, onChunk, onError) => {
      const svc = getService();
      set({ isSupported: svc.getSupport() });
      const encoder = await svc.createEncoder(config, onChunk, onError);
      set({ encoder, isEncoding: false });
      return encoder;
    },

    createDecoder: async (config, onFrame, onError) => {
      const svc = getService();
      set({ isSupported: svc.getSupport() });
      const decoder = await svc.createDecoder(config, onFrame, onError);
      set({ decoder, isDecoding: false });
      return decoder;
    },

    encodeFrame: async (frame, keyFrame) => {
      const svc = getService();
      set({ isEncoding: true });
      try {
        await svc.encodeFrame(frame, keyFrame);
        set({ isEncoding: false });
      } catch (error) {
        set({ isEncoding: false });
        throw error;
      }
    },

    decodeChunk: async (chunk) => {
      const svc = getService();
      set({ isDecoding: true });
      try {
        await svc.decodeChunk(chunk);
        set({ isDecoding: false });
      } catch (error) {
        set({ isDecoding: false });
        throw error;
      }
    },

    reset: () => {
      const svc = getService();
      svc.reset();
      set({
        encoder: null,
        decoder: null,
        isEncoding: false,
        isDecoding: false
      });
    }
  };
});

export default WebCodecsService;