// Video Processor Worker
// Handles video processing tasks in background

class VideoProcessor {
  constructor() {
    this.ffmpeg = null;
    this.isLoaded = false;
  }

  async loadFFmpeg() {
    try {
      // Import FFmpeg dynamically to avoid blocking main thread
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      
      this.ffmpeg = new FFmpeg();
      this.fetchFile = fetchFile;
      
      // Load FFmpeg core
      await this.ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
      });
      
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      return false;
    }
  }

  async processVideo(file, options = {}) {
    if (!this.isLoaded) {
      const loaded = await this.loadFFmpeg();
      if (!loaded) {
        throw new Error('Failed to load FFmpeg');
      }
    }

    try {
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';
      
      // Write input file
      await this.ffmpeg.writeFile(inputName, await this.fetchFile(file));
      
      // Build FFmpeg command
      const command = this.buildCommand(inputName, outputName, options);
      
      // Execute FFmpeg command
      await this.ffmpeg.exec(command);
      
      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      
      return new Uint8Array(data);
    } catch (error) {
      throw new Error(`Video processing failed: ${error.message}`);
    }
  }

  buildCommand(input, output, options) {
    const cmd = ['-i', input];
    
    if (options.format) {
      cmd.push('-f', options.format);
    }
    
    if (options.codec) {
      cmd.push('-c:v', options.codec);
    }
    
    if (options.bitrate) {
      cmd.push('-b:v', options.bitrate);
    }
    
    if (options.resolution) {
      cmd.push('-s', options.resolution);
    }
    
    cmd.push(output);
    return cmd;
  }
}

const processor = new VideoProcessor();

self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'init':
        const loaded = await processor.loadFFmpeg();
        self.postMessage({ type: 'init', success: loaded, id });
        break;
        
      case 'process':
        const result = await processor.processVideo(data.file, data.options);
        self.postMessage({ type: 'process', result, id });
        break;
        
      case 'cancel':
        // Handle cancellation
        self.postMessage({ type: 'cancelled', id });
        break;
        
      default:
        throw new Error(`Unknown command: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message, 
      id 
    });
  }
};

// Handle worker errors
self.onerror = function(error) {
  self.postMessage({ 
    type: 'error', 
    error: `Worker error: ${error.message}` 
  });
};