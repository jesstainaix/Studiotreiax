import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs/promises';
import path from 'path';

// Configurar caminho do FFmpeg estático
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Real Video Renderer usando FFmpeg
 * Gera MP4s válidos com frames PNG + áudio WAV
 */
export class RealVideoRenderer {
  constructor() {
    this.frameRate = 30; // FPS
    this.resolution = { width: 1280, height: 720 }; // HD
    this.format = 'mp4';
    this.validateFFmpeg();
  }

  /**
   * Validar FFmpeg disponível
   */
  async validateFFmpeg() {
    try {
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input('testsrc=duration=1:size=320x240:rate=1')
          .inputFormat('lavfi')
          .output('-')
          .outputOptions(['-f', 'null'])
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
      console.log('✅ FFmpeg validado e funcionando');
      return true;
    } catch (error) {
      console.warn('⚠️ FFmpeg validação falhou:', error.message);
      return false;
    }
  }

  /**
   * Renderizar vídeo real com FFmpeg
   */
  async renderVideo(slides, audioPath, outputPath, options = {}) {
    try {
      console.log(`🎬 Iniciando renderização MP4 REAL: ${outputPath}`);
      
      // Validar inputs
      if (!slides || slides.length === 0) {
        throw new Error('Nenhum slide fornecido para renderização');
      }
      
      if (!audioPath) {
        throw new Error('Caminho de áudio não fornecido');
      }
      
      const {
        frameDuration = 5, // segundos por slide
        resolution = this.resolution,
        frameRate = this.frameRate
      } = options;

      // 1. Gerar frame sequence para image2 demuxer (architect's approach)
      const jobId = path.basename(outputPath, path.extname(outputPath));
      const frameDir = path.join(path.dirname(outputPath), `frames_${jobId}_${Date.now()}`);
      await fs.mkdir(frameDir, { recursive: true });
      
      const frameInfo = await this.generateSlideFrames(slides, frameDir, frameDuration, resolution);
      
      // 2. Renderizar MP4 com image2 demuxer (no frame list needed)
      await this.renderWithImage2(frameDir, audioPath, outputPath, {
        totalFrames: frameInfo.totalFrames,
        frameRate: frameInfo.frameRate,
        resolution
      });
      
      // 4. Cleanup frames temporários
      await this.cleanupFrames(frameDir);
      
      console.log(`✅ MP4 REAL criado: ${outputPath}`);
      
      // 5. Verificar arquivo gerado
      const stats = await fs.stat(outputPath);
      return {
        path: outputPath,
        size: stats.size,
        duration: slides.length * frameDuration,
        resolution,
        frameRate,
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac'
      };
      
    } catch (error) {
      console.error('❌ Erro na renderização MP4:', error.message);
      throw new Error(`Falha no video render: ${error.message}`);
    }
  }

  /**
   * Gerar frame sequence para image2 demuxer (architect's recommended approach)
   */
  async generateSlideFrames(slides, frameDir, frameDuration, resolution) {
    const frameRate = 30; // Fixed frame rate for image2 demuxer
    let frameNumber = 0;
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const framesForSlide = Math.ceil(frameDuration * frameRate);
      
      // Create one PNG for this slide
      const slidePath = path.join(frameDir, `slide_${i.toString().padStart(3, '0')}.png`);
      await this.generateSlidePNG(slide, slidePath, resolution, i);
      
      // Duplicate PNG to create frame sequence (N copies for duration)
      for (let f = 0; f < framesForSlide; f++) {
        const framePath = path.join(frameDir, `frame_${frameNumber.toString().padStart(6, '0')}.png`);
        await fs.copyFile(slidePath, framePath);
        frameNumber++;
      }
      
      console.log(`🎬 Slide ${i + 1}: ${framesForSlide} frames gerados (${frameDuration}s @ ${frameRate}fps)`);
    }
    
    console.log(`🎬 Frame sequence completa: ${frameNumber} frames totais`);
    return { totalFrames: frameNumber, frameRate };
  }

  /**
   * Gerar PNG diretamente para slide (sem SVG, mais robusto)
   */
  async generateSlidePNG(slide, pngPath, resolution, slideIndex) {
    // Usar FFmpeg para gerar PNG colorido diretamente (sem SVG dependency)
    const color = this.getSlideColor(slideIndex);
    const title = this.escapeText(slide.title || `Slide ${slideIndex + 1}`);
    const content = this.escapeText(slide.content || '').substring(0, 200); // Limitar texto
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(`color=${color}:s=${resolution.width}x${resolution.height}:d=1`)
        .inputFormat('lavfi')
        .outputOptions([
          '-frames:v', '1'
        ])
        .output(pngPath)
        .on('start', (cmd) => {
          console.log(`🎨 PNG FFmpeg CMD [slide ${slideIndex + 1}]:`, cmd);
        })
        .on('end', () => {
          console.log(`✅ PNG gerado: slide ${slideIndex + 1}`);
          resolve();
        })
        .on('error', (error) => {
          console.warn(`⚠️ Erro PNG slide ${slideIndex + 1}, usando fallback:`, error.message);
          this.createFallbackPNG(pngPath, slide, resolution, slideIndex).then(resolve).catch(reject);
        })
        .run();
    });
  }

  /**
   * Fallback PNG simples sem filtros complexos
   */
  async createFallbackPNG(pngPath, slide, resolution, slideIndex) {
    const color = this.getSlideColor(slideIndex);
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(`color=${color}:s=${resolution.width}x${resolution.height}:d=1`)
        .inputFormat('lavfi')
        .outputOptions(['-frames:v', '1'])
        .output(pngPath)
        .on('start', (cmd) => {
          console.log(`🎨 Fallback PNG FFmpeg CMD [slide ${slideIndex + 1}]:`, cmd);
        })
        .on('end', () => {
          console.log(`🎨 Fallback PNG criado: slide ${slideIndex + 1}`);
          resolve();
        })
        .on('error', reject)
        .run();
    });
  }

  /**
   * Cor para cada slide (formato FFmpeg-compatível)
   */
  getSlideColor(index) {
    const colors = ['0x1e3a8a', '0x7c3aed', '0xdc2626', '0x059669', '0xd97706'];
    return colors[index % colors.length];
  }

  /**
   * Escape text para FFmpeg drawtext
   */
  escapeText(text) {
    if (!text) return '';
    return text
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\n/g, ' ')
      .trim();
  }

  /**
   * Criar lista ffconcat válida para FFmpeg
   */
  async createFrameList(slidePaths, frameListPath, frameDuration) {
    if (slidePaths.length === 0) {
      throw new Error('Nenhum slide para processar');
    }
    
    let frameListContent = 'ffconcat version 1.0\n';
    
    for (let i = 0; i < slidePaths.length; i++) {
      const slide = slidePaths[i];
      frameListContent += `file '${slide.path}'\n`;
      frameListContent += `duration ${slide.duration}\n`;
    }
    
    // Repetir último arquivo sem duration (required by ffconcat)
    const lastSlide = slidePaths[slidePaths.length - 1];
    frameListContent += `file '${lastSlide.path}'\n`;
    
    await fs.writeFile(frameListPath, frameListContent);
    console.log(`📝 FFconcat list criado: ${slidePaths.length} slides`);
  }

  /**
   * Renderizar com image2 demuxer (architect's recommended approach)
   */
  async renderWithImage2(frameDir, audioPath, outputPath, options) {
    const { frameRate, totalFrames, resolution } = options;
    
    // Validate inputs before FFmpeg
    try {
      const audioStats = await fs.stat(audioPath);
      const framePattern = path.join(frameDir, 'frame_%06d.png');
      const firstFrame = path.join(frameDir, 'frame_000000.png');
      const lastFrame = path.join(frameDir, `frame_${(totalFrames - 1).toString().padStart(6, '0')}.png`);
      
      console.log(`🔍 Frame pattern: ${framePattern}`);
      console.log(`🔍 Total frames: ${totalFrames}`);
      console.log(`🔍 Frame rate: ${frameRate}fps`);
      console.log(`🔍 Audio file: ${audioPath} (${audioStats.size} bytes)`);
      
      // Verify first and last frames exist
      await fs.stat(firstFrame);
      await fs.stat(lastFrame);
      
    } catch (error) {
      throw new Error(`Image2 validation failed: ${error.message}`);
    }
    
    return new Promise((resolve, reject) => {
      const ffmpegCommand = ffmpeg()
        // Image2 demuxer input (architect's specification)
        .input(path.join(frameDir, 'frame_%06d.png'))
        .inputOptions(['-framerate', String(frameRate)])
        // Audio input
        .input(audioPath)
        .outputOptions([
          '-c:v', 'libx264',        // Video codec H.264
          '-preset', 'medium',       // Preset balanceado
          '-crf', '23',             // Qualidade constante
          '-c:a', 'aac',            // Audio codec AAC
          '-b:a', '128k',           // Audio bitrate
          '-pix_fmt', 'yuv420p',    // Pixel format (architect required)
          '-shortest'               // Stop when audio ends
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🎬 Image2 FFmpeg CMD:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`🎬 Progresso: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Renderização image2 concluída com sucesso');
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ FFmpeg erro:', error.message);
          reject(new Error(`ffmpeg exited with error: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * Renderizar com FFmpeg (legacy concat approach)
   */
  async renderWithFFmpeg(frameListPath, audioPath, outputPath, options) {
    const { frameRate, resolution } = options;
    
    // Validate inputs before FFmpeg
    try {
      const frameListStats = await fs.stat(frameListPath);
      const audioStats = await fs.stat(audioPath);
      const frameListContent = await fs.readFile(frameListPath, 'utf8');
      
      console.log(`🔍 Frame list: ${frameListPath} (${frameListStats.size} bytes)`);
      console.log(`🔍 Audio file: ${audioPath} (${audioStats.size} bytes)`);
      console.log(`🔍 Frame list content (first 200 chars): ${frameListContent.substring(0, 200)}`);
      
      if (frameListStats.size === 0) {
        throw new Error('Frame list está vazio');
      }
      if (audioStats.size === 0) {
        throw new Error('Arquivo de áudio está vazio');
      }
    } catch (error) {
      throw new Error(`Input validation failed: ${error.message}`);
    }
    
    return new Promise((resolve, reject) => {
      const ffmpegCommand = ffmpeg()
        // First input: frame list with concat format (proper scoping)
        .input(frameListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        // Second input: audio
        .input(audioPath)
        .outputOptions([
          '-c:v', 'libx264',        // Video codec H.264
          '-preset', 'medium',       // Preset balanceado
          '-crf', '23',             // Qualidade constante
          '-c:a', 'aac',            // Audio codec AAC
          '-b:a', '128k',           // Audio bitrate
          '-pix_fmt', 'yuv420p',    // Pixel format compatível
          '-r', frameRate.toString(), // Frame rate
          '-vsync', 'vfr',          // Variable frame rate
          '-shortest'               // Parar quando audio acabar
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🎬 FFmpeg CMD:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`🎬 Progresso: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ FFmpeg renderização completa');
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ FFmpeg erro:', error.message);
          reject(error);
        });
      
      ffmpegCommand.run();
    });
  }

  /**
   * Gerar thumbnail do vídeo
   */
  async generateThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '640x360'
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  /**
   * Cleanup frames temporários
   */
  async cleanupFrames(frameDir) {
    try {
      const files = await fs.readdir(frameDir);
      for (const file of files) {
        await fs.unlink(path.join(frameDir, file));
      }
      await fs.rmdir(frameDir);
      console.log('🧹 Frames temporários removidos');
    } catch (error) {
      console.warn('⚠️ Erro no cleanup:', error.message);
    }
  }

  /**
   * Escape XML para SVG
   */
  escapeXml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default RealVideoRenderer;