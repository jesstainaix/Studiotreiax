// FASE 5 - Video Compositor for Final Rendering
// Combines slides.json + scene_config.json + scene_layers.json + audio to generate final videos

import * as fs from 'fs/promises';
import * as path from 'path';
import { create } from 'zustand';

export interface CompositorConfig {
  projectPath: string;
  outputPath: string;
  quality: '1080p' | '4K';
  fps: number;
  bitrate: string;
  format: 'mp4' | 'webm' | 'both';
}

export interface SceneRenderJob {
  sceneId: string;
  slideId: number;
  duration: number;
  audioPath?: string;
  layers: any[];
  avatarConfig: any;
  outputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface CompositorState {
  isInitialized: boolean;
  isProcessing: boolean;
  currentJob: string | null;
  scenes: SceneRenderJob[];
  progress: {
    totalScenes: number;
    completedScenes: number;
    currentScene: number;
    overallProgress: number;
    estimatedTimeRemaining: number;
    startTime: number;
  };
  finalOutput: {
    mp4Path?: string;
    webmPath?: string;
    srtPath?: string;
    metadata: {
      duration: number;
      fileSize: number;
      resolution: string;
      bitrate: string;
    };
  };
}

class VideoCompositor {
  private config: CompositorConfig;
  private projectData: {
    slides: any[];
    sceneConfig: any;
    sceneLayers: any;
  } = {
    slides: [],
    sceneConfig: null,
    sceneLayers: null
  };

  constructor(config: CompositorConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('[VideoCompositor] Initializing compositor...');
    
    // Load project data files
    await this.loadProjectData();
    
    // Prepare scene render jobs
    await this.prepareSceneJobs();
    
    // Initialize output directories
    await this.setupOutputDirectories();
    
    useCompositorStore.getState().setInitialized(true);
    console.log('[VideoCompositor] Compositor initialized successfully');
  }

  private async loadProjectData(): Promise<void> {
    try {
      const dataPath = path.join(this.config.projectPath, 'data');
      
      // Load slides.json
      const slidesPath = path.join(dataPath, 'slides.json');
      const slidesData = await fs.readFile(slidesPath, 'utf8');
      this.projectData.slides = JSON.parse(slidesData).slides || [];
      
      // Load scene_config.json
      const sceneConfigPath = path.join(dataPath, 'scene_config.json');
      const sceneConfigData = await fs.readFile(sceneConfigPath, 'utf8');
      this.projectData.sceneConfig = JSON.parse(sceneConfigData);
      
      // Load scene_layers.json
      const sceneLayersPath = path.join(dataPath, 'scene_layers.json');
      const sceneLayersData = await fs.readFile(sceneLayersPath, 'utf8');
      this.projectData.sceneLayers = JSON.parse(sceneLayersData);
      
      console.log(`[VideoCompositor] Loaded ${this.projectData.slides.length} slides`);
    } catch (error) {
      console.error('[VideoCompositor] Error loading project data:', error);
      throw new Error(`Failed to load project data: ${error.message}`);
    }
  }

  private async prepareSceneJobs(): Promise<void> {
    const scenes: SceneRenderJob[] = [];
    
    for (const slide of this.projectData.slides) {
      // Find corresponding scene config
      const sceneConfig = this.projectData.sceneConfig.scenes.find(
        (s: any) => s.slide_id === slide.id
      );
      
      // Find corresponding scene layers
      const sceneLayers = this.projectData.sceneLayers.scenes.find(
        (s: any) => s.slide_id === slide.id
      );
      
      if (!sceneConfig || !sceneLayers) {
        console.warn(`[VideoCompositor] Missing config for slide ${slide.id}`);
        continue;
      }
      
      const scene: SceneRenderJob = {
        sceneId: `scene_${slide.id}`,
        slideId: slide.id,
        duration: slide.suggestedDurationSec || 8,
        audioPath: sceneConfig.audio,
        layers: sceneLayers.layers || [],
        avatarConfig: sceneConfig,
        outputPath: path.join(this.config.outputPath, `scene_${slide.id}.mp4`),
        status: 'pending',
        progress: 0
      };
      
      scenes.push(scene);
    }
    
    useCompositorStore.getState().setScenes(scenes);
    console.log(`[VideoCompositor] Prepared ${scenes.length} scene render jobs`);
  }

  private async setupOutputDirectories(): Promise<void> {
    const dirs = [
      this.config.outputPath,
      path.join(this.config.outputPath, 'scenes'),
      path.join(this.config.outputPath, 'temp'),
      path.join(this.config.outputPath, 'frames')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async renderAllScenes(): Promise<void> {
    const state = useCompositorStore.getState();
    const scenes = state.scenes;
    
    if (scenes.length === 0) {
      throw new Error('No scenes to render');
    }
    
    state.setProcessing(true);
    state.setProgress({
      totalScenes: scenes.length,
      completedScenes: 0,
      currentScene: 0,
      overallProgress: 0,
      estimatedTimeRemaining: 0,
      startTime: Date.now()
    });
    
    console.log(`[VideoCompositor] Starting render of ${scenes.length} scenes`);
    
    try {
      // Process scenes in parallel (configurable concurrency)
      const maxConcurrency = 2; // Prevent memory overflow
      for (let i = 0; i < scenes.length; i += maxConcurrency) {
        const batch = scenes.slice(i, i + maxConcurrency);
        const promises = batch.map(scene => this.renderScene(scene));
        await Promise.all(promises);
        
        // Update progress
        const completed = i + batch.length;
        const progress = (completed / scenes.length) * 100;
        state.updateProgress({
          completedScenes: completed,
          currentScene: completed,
          overallProgress: progress,
          estimatedTimeRemaining: this.calculateETA(completed, scenes.length, state.progress.startTime)
        });
      }
      
      console.log('[VideoCompositor] All scenes rendered successfully');
    } catch (error) {
      console.error('[VideoCompositor] Scene rendering failed:', error);
      throw error;
    }
  }

  private async renderScene(scene: SceneRenderJob): Promise<void> {
    console.log(`[VideoCompositor] Rendering scene ${scene.sceneId}`);
    
    try {
      // Update scene status
      useCompositorStore.getState().updateSceneStatus(scene.sceneId, 'processing', 0);
      
      // Build FFmpeg command for this scene
      const ffmpegCommand = await this.buildSceneRenderCommand(scene);
      
      // Execute rendering
      await this.executeFFmpegCommand(ffmpegCommand, scene);
      
      // Verify output
      await this.verifySceneOutput(scene);
      
      useCompositorStore.getState().updateSceneStatus(scene.sceneId, 'completed', 100);
      console.log(`[VideoCompositor] Scene ${scene.sceneId} completed successfully`);
      
    } catch (error) {
      console.error(`[VideoCompositor] Scene ${scene.sceneId} failed:`, error);
      useCompositorStore.getState().updateSceneStatus(
        scene.sceneId, 
        'failed', 
        0, 
        error.message
      );
      throw error;
    }
  }

  private async buildSceneRenderCommand(scene: SceneRenderJob): Promise<string[]> {
    const command: string[] = [];
    
    // Input sources
    const inputs: string[] = [];
    
    // Add slide image as base layer
    const slideImagePath = this.findSlideImagePath(scene.slideId);
    if (slideImagePath) {
      inputs.push('-i', slideImagePath);
    }
    
    // Add avatar video if available
    const avatarVideoPath = await this.getAvatarVideoPath(scene);
    if (avatarVideoPath) {
      inputs.push('-i', avatarVideoPath);
    }
    
    // Add audio if available
    if (scene.audioPath) {
      const fullAudioPath = path.join(this.config.projectPath, 'data', scene.audioPath);
      inputs.push('-i', fullAudioPath);
    }
    
    command.push(...inputs);
    
    // Build filter complex for layer composition
    const filterComplex = this.buildFilterComplex(scene, inputs.length / 2);
    command.push('-filter_complex', filterComplex);
    
    // Output settings
    command.push(
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', this.config.fps.toString(),
      '-t', scene.duration.toString()
    );
    
    // Add audio settings if audio present
    if (scene.audioPath) {
      command.push('-c:a', 'aac', '-b:a', '128k');
    }
    
    // Resolution
    if (this.config.quality === '1080p') {
      command.push('-s', '1920x1080');
    } else if (this.config.quality === '4K') {
      command.push('-s', '3840x2160');
    }
    
    command.push('-y', scene.outputPath);
    
    return command;
  }

  private buildFilterComplex(scene: SceneRenderJob, inputCount: number): string {
    const filters: string[] = [];
    let currentFilter = '[0:v]';
    
    // Base slide scaling
    filters.push(`${currentFilter}scale=1920:1080,setsar=1[base]`);
    currentFilter = '[base]';
    
    // Add avatar overlay if available
    if (inputCount > 1) {
      const { x, y, scale } = scene.avatarConfig.avatarPlacement;
      const avatarX = Math.floor(1920 * x);
      const avatarY = Math.floor(1080 * y);
      const avatarW = Math.floor(400 * scale);
      const avatarH = Math.floor(400 * scale);
      
      filters.push(`[1:v]scale=${avatarW}:${avatarH}[avatar]`);
      filters.push(`${currentFilter}[avatar]overlay=${avatarX}:${avatarY}[output]`);
      currentFilter = '[output]';
    }
    
    // Add text layers from scene_layers.json
    scene.layers.forEach((layer, index) => {
      if (layer.type === 'text' && layer.visible) {
        const textFilter = this.buildTextFilter(layer, index);
        if (textFilter) {
          filters.push(textFilter);
          const overlayFilter = `${currentFilter}[text${index}]overlay=${Math.floor(1920 * layer.x)}:${Math.floor(1080 * layer.y)}[out${index}]`;
          filters.push(overlayFilter);
          currentFilter = `[out${index}]`;
        }
      }
    });
    
    return filters.join(';');
  }

  private buildTextFilter(layer: any, index: number): string | null {
    if (!layer.value || !layer.style) return null;
    
    const fontSize = parseInt(layer.style.fontSize) || 24;
    const color = layer.style.color || '#ffffff';
    const fontFamily = layer.style.fontFamily || 'Arial';
    
    // Escape text for FFmpeg
    const escapedText = layer.value.replace(/'/g, "\\'").replace(/:/g, "\\:");
    
    return `drawtext=text='${escapedText}':fontfile='/System/Library/Fonts/Arial.ttf':fontsize=${fontSize}:fontcolor=${color}:x=0:y=0[text${index}]`;
  }

  private findSlideImagePath(slideId: number): string | null {
    const slide = this.projectData.slides.find(s => s.id === slideId);
    if (!slide || !slide.image) return null;
    
    return path.join(this.config.projectPath, 'data', slide.image);
  }

  private async getAvatarVideoPath(scene: SceneRenderJob): Promise<string | null> {
    // Check if we have generated avatar video for this scene
    const avatarPath = path.join(
      this.config.projectPath,
      'data',
      'avatars',
      `avatar_${scene.slideId}.mp4`
    );
    
    try {
      await fs.access(avatarPath);
      return avatarPath;
    } catch {
      return null; // No avatar video available
    }
  }

  private async executeFFmpegCommand(command: string[], scene: SceneRenderJob): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      console.log(`[VideoCompositor] Executing FFmpeg for scene ${scene.sceneId}:`, command.join(' '));
      
      const process = spawn('ffmpeg', command);
      let stderr = '';
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        
        // Parse progress from stderr
        const progressMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (progressMatch) {
          const [, hours, minutes, seconds] = progressMatch;
          const currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
          const progress = Math.min((currentTime / scene.duration) * 100, 100);
          
          useCompositorStore.getState().updateSceneStatus(
            scene.sceneId,
            'processing',
            progress
          );
        }
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

  private async verifySceneOutput(scene: SceneRenderJob): Promise<void> {
    try {
      const stats = await fs.stat(scene.outputPath);
      if (stats.size === 0) {
        throw new Error('Output file is empty');
      }
      console.log(`[VideoCompositor] Scene ${scene.sceneId} output verified: ${stats.size} bytes`);
    } catch (error) {
      throw new Error(`Output verification failed: ${error.message}`);
    }
  }

  private calculateETA(completed: number, total: number, startTime: number): number {
    if (completed === 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const avgTimePerScene = elapsed / completed;
    const remaining = total - completed;
    
    return Math.floor((remaining * avgTimePerScene) / 1000); // Return in seconds
  }

  async mergeScenesToFinalVideo(): Promise<void> {
    console.log('[VideoCompositor] Merging scenes to final video');
    
    const state = useCompositorStore.getState();
    const completedScenes = state.scenes.filter(s => s.status === 'completed');
    
    if (completedScenes.length === 0) {
      throw new Error('No completed scenes to merge');
    }
    
    // Create file list for FFmpeg concat
    const fileListPath = path.join(this.config.outputPath, 'temp', 'file_list.txt');
    const fileListContent = completedScenes
      .map(scene => `file '${path.resolve(scene.outputPath)}'`)
      .join('\n');
    
    await fs.writeFile(fileListPath, fileListContent, 'utf8');
    
    // Generate final outputs
    const outputs = [];
    
    if (this.config.format === 'mp4' || this.config.format === 'both') {
      outputs.push(this.generateFinalMP4(fileListPath));
    }
    
    if (this.config.format === 'webm' || this.config.format === 'both') {
      outputs.push(this.generateFinalWebM(fileListPath));
    }
    
    await Promise.all(outputs);
    
    // Generate metadata
    await this.generateMetadata();
    
    console.log('[VideoCompositor] Final video merge completed');
  }

  private async generateFinalMP4(fileListPath: string): Promise<void> {
    const outputPath = path.join(this.config.outputPath, 'final_video.mp4');
    
    const command = [
      '-f', 'concat',
      '-safe', '0',
      '-i', fileListPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      '-y', outputPath
    ];
    
    await this.executeFFmpegCommand(command, {
      sceneId: 'final_merge',
      slideId: 0,
      duration: 0,
      layers: [],
      avatarConfig: {},
      outputPath,
      status: 'processing',
      progress: 0
    } as SceneRenderJob);
    
    useCompositorStore.getState().setFinalOutput({
      mp4Path: outputPath
    });
  }

  private async generateFinalWebM(fileListPath: string): Promise<void> {
    const outputPath = path.join(this.config.outputPath, 'final_video.webm');
    
    const command = [
      '-f', 'concat',
      '-safe', '0',
      '-i', fileListPath,
      '-c:v', 'libvpx-vp9',
      '-b:v', '8M',
      '-c:a', 'libvorbis',
      '-b:a', '128k',
      '-y', outputPath
    ];
    
    await this.executeFFmpegCommand(command, {
      sceneId: 'final_webm',
      slideId: 0,
      duration: 0,
      layers: [],
      avatarConfig: {},
      outputPath,
      status: 'processing',
      progress: 0
    } as SceneRenderJob);
    
    useCompositorStore.getState().setFinalOutput({
      webmPath: outputPath
    });
  }

  private async generateMetadata(): Promise<void> {
    const state = useCompositorStore.getState();
    const mp4Path = state.finalOutput.mp4Path;
    
    if (mp4Path) {
      try {
        const stats = await fs.stat(mp4Path);
        const totalDuration = state.scenes.reduce((sum, scene) => sum + scene.duration, 0);
        
        useCompositorStore.getState().setFinalOutput({
          metadata: {
            duration: totalDuration,
            fileSize: stats.size,
            resolution: this.config.quality === '1080p' ? '1920x1080' : '3840x2160',
            bitrate: this.config.bitrate
          }
        });
      } catch (error) {
        console.error('[VideoCompositor] Error generating metadata:', error);
      }
    }
  }
}

// Zustand store for compositor state management
export const useCompositorStore = create<CompositorState & {
  setInitialized: (initialized: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setScenes: (scenes: SceneRenderJob[]) => void;
  updateSceneStatus: (sceneId: string, status: SceneRenderJob['status'], progress: number, error?: string) => void;
  setProgress: (progress: Partial<CompositorState['progress']>) => void;
  updateProgress: (update: Partial<CompositorState['progress']>) => void;
  setFinalOutput: (output: Partial<CompositorState['finalOutput']>) => void;
}>((set, get) => ({
  isInitialized: false,
  isProcessing: false,
  currentJob: null,
  scenes: [],
  progress: {
    totalScenes: 0,
    completedScenes: 0,
    currentScene: 0,
    overallProgress: 0,
    estimatedTimeRemaining: 0,
    startTime: 0
  },
  finalOutput: {
    metadata: {
      duration: 0,
      fileSize: 0,
      resolution: '',
      bitrate: ''
    }
  },
  
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setScenes: (scenes) => set({ scenes }),
  
  updateSceneStatus: (sceneId, status, progress, error) => {
    set((state) => ({
      scenes: state.scenes.map(scene =>
        scene.sceneId === sceneId
          ? { ...scene, status, progress, error }
          : scene
      )
    }));
  },
  
  setProgress: (progress) => {
    set((state) => ({
      progress: { ...state.progress, ...progress }
    }));
  },
  
  updateProgress: (update) => {
    set((state) => ({
      progress: { ...state.progress, ...update }
    }));
  },
  
  setFinalOutput: (output) => {
    set((state) => ({
      finalOutput: { ...state.finalOutput, ...output }
    }));
  }
}));

export { VideoCompositor };