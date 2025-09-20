// FASE 5 - Final Export System
// Handles MP4/WebM export with metadata optimization and quality control

import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExportConfig {
  projectPath: string;
  outputPath: string;
  quality: '1080p' | '4K';
  format: 'mp4' | 'webm' | 'both';
  bitrate: {
    video: string; // e.g., '8M' for 8 Mbps
    audio: string; // e.g., '128k'
  };
  fps: number;
  metadata: {
    title?: string;
    description?: string;
    author?: string;
    copyright?: string;
    created_at?: string;
  };
}

export interface ExportResult {
  success: boolean;
  outputs: {
    mp4Path?: string;
    webmPath?: string;
    srtPath?: string;
  };
  metadata: {
    duration: number;
    fileSize: {
      mp4?: number;
      webm?: number;
    };
    quality: {
      resolution: string;
      fps: number;
      bitrate: string;
    };
    processing: {
      startTime: number;
      endTime: number;
      processingTime: number;
    };
  };
  error?: string;
}

class FinalExporter {
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  async exportFinalVideo(sceneFiles: string[], subtitlePath?: string): Promise<ExportResult> {
    console.log('[FinalExporter] Starting final video export...');
    
    const startTime = Date.now();
    const result: ExportResult = {
      success: false,
      outputs: {},
      metadata: {
        duration: 0,
        fileSize: {},
        quality: {
          resolution: this.config.quality === '1080p' ? '1920x1080' : '3840x2160',
          fps: this.config.fps,
          bitrate: this.config.bitrate.video
        },
        processing: {
          startTime,
          endTime: 0,
          processingTime: 0
        }
      }
    };

    try {
      // Create concatenation file list
      const concatFilePath = await this.createConcatFile(sceneFiles);
      
      // Export MP4 if requested
      if (this.config.format === 'mp4' || this.config.format === 'both') {
        result.outputs.mp4Path = await this.exportMP4(concatFilePath, subtitlePath);
        result.metadata.fileSize.mp4 = await this.getFileSize(result.outputs.mp4Path);
      }

      // Export WebM if requested
      if (this.config.format === 'webm' || this.config.format === 'both') {
        result.outputs.webmPath = await this.exportWebM(concatFilePath, subtitlePath);
        result.metadata.fileSize.webm = await this.getFileSize(result.outputs.webmPath);
      }

      // Copy subtitle file to output
      if (subtitlePath) {
        const srtOutputPath = path.join(this.config.outputPath, 'captions.srt');
        await fs.copyFile(subtitlePath, srtOutputPath);
        result.outputs.srtPath = srtOutputPath;
      }

      // Get video duration
      if (result.outputs.mp4Path) {
        result.metadata.duration = await this.getVideoDuration(result.outputs.mp4Path);
      } else if (result.outputs.webmPath) {
        result.metadata.duration = await this.getVideoDuration(result.outputs.webmPath);
      }

      // Cleanup temporary files
      await this.cleanup(concatFilePath);

      const endTime = Date.now();
      result.metadata.processing.endTime = endTime;
      result.metadata.processing.processingTime = endTime - startTime;
      result.success = true;

      console.log('[FinalExporter] Export completed successfully');
      return result;

    } catch (error) {
      console.error('[FinalExporter] Export failed:', error);
      result.error = error.message;
      result.metadata.processing.endTime = Date.now();
      result.metadata.processing.processingTime = Date.now() - startTime;
      return result;
    }
  }

  private async createConcatFile(sceneFiles: string[]): Promise<string> {
    const concatFilePath = path.join(this.config.outputPath, 'temp', 'concat_list.txt');
    
    // Ensure temp directory exists
    await fs.mkdir(path.dirname(concatFilePath), { recursive: true });
    
    // Create file list with absolute paths
    const fileList = sceneFiles
      .filter(file => file && file.trim().length > 0)
      .map(file => `file '${path.resolve(file)}'`)
      .join('\n');
    
    await fs.writeFile(concatFilePath, fileList, 'utf8');
    
    console.log(`[FinalExporter] Created concat file with ${sceneFiles.length} scenes`);
    return concatFilePath;
  }

  private async exportMP4(concatFilePath: string, subtitlePath?: string): Promise<string> {
    const outputPath = path.join(this.config.outputPath, 'final_video.mp4');
    
    const command = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath
    ];

    // Add subtitle track if available
    if (subtitlePath) {
      command.push('-i', subtitlePath);
    }

    // Video encoding settings - optimized for quality and compatibility
    command.push(
      '-c:v', 'libx264',
      '-preset', 'medium',        // Balance between speed and compression
      '-crf', '23',               // High quality (lower = better quality)
      '-pix_fmt', 'yuv420p',      // Compatibility with all players
      '-profile:v', 'high',       // H.264 High Profile
      '-level', '4.1',            // H.264 Level 4.1 (supports 1080p)
      '-r', this.config.fps.toString(),
      '-b:v', this.config.bitrate.video,
      '-maxrate', this.getMaxBitrate(this.config.bitrate.video),
      '-bufsize', this.getBufferSize(this.config.bitrate.video)
    );

    // Audio encoding settings
    command.push(
      '-c:a', 'aac',
      '-b:a', this.config.bitrate.audio,
      '-ar', '48000',             // Sample rate
      '-ac', '2'                  // Stereo
    );

    // Resolution settings
    if (this.config.quality === '1080p') {
      command.push('-s', '1920x1080');
    } else if (this.config.quality === '4K') {
      command.push('-s', '3840x2160');
    }

    // Subtitle settings (if available)
    if (subtitlePath) {
      command.push(
        '-c:s', 'mov_text',        // Subtitle codec for MP4
        '-metadata:s:s:0', 'language=por'
      );
    }

    // Metadata
    command.push(...this.buildMetadataArgs());

    // Output optimization
    command.push(
      '-movflags', '+faststart',  // Optimize for web streaming
      '-avoid_negative_ts', 'make_zero',
      '-map', '0:v',
      '-map', '0:a'
    );

    if (subtitlePath) {
      command.push('-map', '1:s');
    }

    command.push('-y', outputPath);

    await this.executeFFmpegCommand(command);
    
    console.log(`[FinalExporter] MP4 export completed: ${outputPath}`);
    return outputPath;
  }

  private async exportWebM(concatFilePath: string, subtitlePath?: string): Promise<string> {
    const outputPath = path.join(this.config.outputPath, 'final_video.webm');
    
    const command = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath
    ];

    // Add subtitle file for processing (WebM doesn't support embedded subtitles like MP4)
    if (subtitlePath) {
      command.push('-i', subtitlePath);
    }

    // Video encoding settings - VP9 for WebM
    command.push(
      '-c:v', 'libvpx-vp9',
      '-crf', '30',               // VP9 quality (lower = better)
      '-b:v', this.config.bitrate.video,
      '-maxrate', this.getMaxBitrate(this.config.bitrate.video),
      '-bufsize', this.getBufferSize(this.config.bitrate.video),
      '-r', this.config.fps.toString(),
      '-pix_fmt', 'yuv420p'
    );

    // VP9 specific optimizations
    command.push(
      '-speed', '1',              // Encoding speed vs quality (0 = slowest/best, 4 = fastest/worst)
      '-tile-columns', '2',       // Parallel processing
      '-frame-parallel', '1',     // Frame parallel processing
      '-auto-alt-ref', '1',       // Automatic alternate reference frames
      '-lag-in-frames', '25'      // Look ahead frames
    );

    // Audio encoding settings
    command.push(
      '-c:a', 'libvorbis',
      '-b:a', this.config.bitrate.audio,
      '-ar', '48000'
    );

    // Resolution settings
    if (this.config.quality === '1080p') {
      command.push('-s', '1920x1080');
    } else if (this.config.quality === '4K') {
      command.push('-s', '3840x2160');
    }

    // Metadata for WebM
    command.push(...this.buildMetadataArgs());

    command.push(
      '-map', '0:v',
      '-map', '0:a',
      '-y', outputPath
    );

    await this.executeFFmpegCommand(command);
    
    console.log(`[FinalExporter] WebM export completed: ${outputPath}`);
    return outputPath;
  }

  private buildMetadataArgs(): string[] {
    const args: string[] = [];
    
    if (this.config.metadata.title) {
      args.push('-metadata', `title=${this.config.metadata.title}`);
    }
    
    if (this.config.metadata.description) {
      args.push('-metadata', `description=${this.config.metadata.description}`);
    }
    
    if (this.config.metadata.author) {
      args.push('-metadata', `artist=${this.config.metadata.author}`);
    }
    
    if (this.config.metadata.copyright) {
      args.push('-metadata', `copyright=${this.config.metadata.copyright}`);
    }
    
    if (this.config.metadata.created_at) {
      args.push('-metadata', `date=${this.config.metadata.created_at}`);
    }

    // Add additional metadata
    args.push('-metadata', 'encoder=FASE5 Video Composer');
    args.push('-metadata', `creation_time=${new Date().toISOString()}`);
    
    return args;
  }

  private getMaxBitrate(bitrate: string): string {
    // Calculate max bitrate as 1.5x the target bitrate
    const bitrateNum = parseInt(bitrate);
    const unit = bitrate.slice(-1).toLowerCase();
    
    if (unit === 'k') {
      return `${Math.floor(bitrateNum * 1.5)}k`;
    } else if (unit === 'm') {
      return `${Math.floor(bitrateNum * 1.5)}M`;
    }
    
    return bitrate;
  }

  private getBufferSize(bitrate: string): string {
    // Buffer size typically 2x the target bitrate
    const bitrateNum = parseInt(bitrate);
    const unit = bitrate.slice(-1).toLowerCase();
    
    if (unit === 'k') {
      return `${bitrateNum * 2}k`;
    } else if (unit === 'm') {
      return `${bitrateNum * 2}M`;
    }
    
    return bitrate;
  }

  private async executeFFmpegCommand(command: string[]): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      console.log(`[FinalExporter] Executing FFmpeg:`, command.join(' '));
      
      const process = spawn('ffmpeg', command);
      let stderr = '';
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}. Error: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });
  }

  private async getFileSize(filePath?: string): Promise<number> {
    if (!filePath) return 0;
    
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      console.warn(`[FinalExporter] Could not get file size for ${filePath}:`, error.message);
      return 0;
    }
  }

  private async getVideoDuration(filePath: string): Promise<number> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const process = spawn('ffprobe', [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        filePath
      ]);
      
      let stdout = '';
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.on('close', () => {
        const duration = parseFloat(stdout.trim());
        resolve(isNaN(duration) ? 0 : duration);
      });
      
      process.on('error', () => {
        resolve(0);
      });
    });
  }

  private async cleanup(concatFilePath: string): Promise<void> {
    try {
      await fs.unlink(concatFilePath);
      console.log('[FinalExporter] Cleaned up temporary files');
    } catch (error) {
      console.warn('[FinalExporter] Could not cleanup temp files:', error.message);
    }
  }

  async validateOutput(filePath: string): Promise<{
    isValid: boolean;
    errors: string[];
    info: {
      duration: number;
      fileSize: number;
      resolution: string;
      bitrate: string;
      codec: string;
    };
  }> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const process = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ]);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          resolve({
            isValid: false,
            errors: [`FFprobe failed: ${stderr}`],
            info: {
              duration: 0,
              fileSize: 0,
              resolution: '',
              bitrate: '',
              codec: ''
            }
          });
          return;
        }
        
        try {
          const data = JSON.parse(stdout);
          const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
          const format = data.format;
          
          resolve({
            isValid: true,
            errors: [],
            info: {
              duration: parseFloat(format.duration) || 0,
              fileSize: parseInt(format.size) || 0,
              resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : '',
              bitrate: format.bit_rate ? `${Math.floor(parseInt(format.bit_rate) / 1000)}kbps` : '',
              codec: videoStream ? videoStream.codec_name : ''
            }
          });
        } catch (error) {
          resolve({
            isValid: false,
            errors: [`Failed to parse FFprobe output: ${error.message}`],
            info: {
              duration: 0,
              fileSize: 0,
              resolution: '',
              bitrate: '',
              codec: ''
            }
          });
        }
      });
      
      process.on('error', (error) => {
        resolve({
          isValid: false,
          errors: [`FFprobe error: ${error.message}`],
          info: {
            duration: 0,
            fileSize: 0,
            resolution: '',
            bitrate: '',
            codec: ''
          }
        });
      });
    });
  }
}

export { FinalExporter };
export default FinalExporter;