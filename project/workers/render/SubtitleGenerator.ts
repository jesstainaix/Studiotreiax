// FASE 5 - SRT Subtitle Generation System
// Generates synchronized subtitles from slide text and audio timing

import * as fs from 'fs/promises';
import * as path from 'path';

export interface SubtitleEntry {
  index: number;
  startTime: string; // Format: HH:MM:SS,mmm
  endTime: string;   // Format: HH:MM:SS,mmm
  text: string;
}

export interface SubtitleGenerationConfig {
  projectPath: string;
  outputPath: string;
  language: 'pt-BR' | 'en-US';
  maxCharsPerLine: number;
  maxLinesPerSubtitle: number;
  minDuration: number; // seconds
  maxDuration: number; // seconds
}

export interface SceneSubtitleData {
  sceneId: string;
  slideId: number;
  text: string;
  startTime: number; // seconds from video start
  duration: number;   // scene duration in seconds
  audioMarkers?: {
    words?: Array<{
      word: string;
      start_time: number;
      end_time: number;
    }>;
    sentences?: Array<{
      text: string;
      start_time: number;
      end_time: number;
    }>;
  };
}

class SubtitleGenerator {
  private config: SubtitleGenerationConfig;
  private projectData: {
    slides: any[];
    sceneConfig: any;
    sceneLayers: any;
  } = {
    slides: [],
    sceneConfig: null,
    sceneLayers: null
  };

  constructor(config: SubtitleGenerationConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('[SubtitleGenerator] Initializing subtitle generator...');
    
    await this.loadProjectData();
    console.log('[SubtitleGenerator] Subtitle generator initialized');
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
    } catch (error) {
      console.error('[SubtitleGenerator] Error loading project data:', error);
      throw new Error(`Failed to load project data: ${error.message}`);
    }
  }

  async generateSubtitles(): Promise<string> {
    console.log('[SubtitleGenerator] Generating subtitles...');
    
    // Collect subtitle data from all scenes
    const sceneSubtitles = await this.collectSceneSubtitleData();
    
    // Generate SRT entries
    const srtEntries = await this.generateSRTEntries(sceneSubtitles);
    
    // Format as SRT content
    const srtContent = this.formatSRTContent(srtEntries);
    
    // Save to file
    const srtPath = path.join(this.config.outputPath, 'captions.srt');
    await fs.writeFile(srtPath, srtContent, 'utf8');
    
    console.log(`[SubtitleGenerator] Subtitles generated: ${srtPath}`);
    return srtPath;
  }

  private async collectSceneSubtitleData(): Promise<SceneSubtitleData[]> {
    const sceneSubtitles: SceneSubtitleData[] = [];
    let currentTime = 0;
    
    for (const slide of this.projectData.slides) {
      const sceneConfig = this.projectData.sceneConfig.scenes.find(
        (s: any) => s.slide_id === slide.id
      );
      
      const sceneLayers = this.projectData.sceneLayers.scenes.find(
        (s: any) => s.slide_id === slide.id
      );
      
      if (!sceneConfig || !sceneLayers) {
        console.warn(`[SubtitleGenerator] Missing config for slide ${slide.id}`);
        continue;
      }
      
      // Extract text content from slide and layers
      const textContent = this.extractTextContent(slide, sceneLayers);
      
      if (!textContent || textContent.trim().length === 0) {
        console.warn(`[SubtitleGenerator] No text content for slide ${slide.id}`);
        currentTime += slide.suggestedDurationSec || 8;
        continue;
      }
      
      // Load audio markers if available
      const audioMarkers = await this.loadAudioMarkers(sceneConfig, slide.id);
      
      const sceneSubtitle: SceneSubtitleData = {
        sceneId: `scene_${slide.id}`,
        slideId: slide.id,
        text: textContent,
        startTime: currentTime,
        duration: slide.suggestedDurationSec || 8,
        audioMarkers
      };
      
      sceneSubtitles.push(sceneSubtitle);
      currentTime += sceneSubtitle.duration;
    }
    
    return sceneSubtitles;
  }

  private extractTextContent(slide: any, sceneLayers: any): string {
    const textParts: string[] = [];
    
    // Add slide title if available
    if (slide.title && slide.title.trim()) {
      textParts.push(slide.title.trim());
    }
    
    // Add slide text content
    if (slide.text && slide.text.trim()) {
      textParts.push(slide.text.trim());
    }
    
    // Add slide notes if available
    if (slide.notes && slide.notes.trim()) {
      textParts.push(slide.notes.trim());
    }
    
    // Extract text from layers
    if (sceneLayers && sceneLayers.layers) {
      for (const layer of sceneLayers.layers) {
        if (layer.type === 'text' && layer.visible && layer.value) {
          textParts.push(layer.value.trim());
        }
      }
    }
    
    return textParts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private async loadAudioMarkers(sceneConfig: any, slideId: number): Promise<any> {
    if (!sceneConfig.markers) {
      return null;
    }
    
    try {
      const markersPath = path.join(
        this.config.projectPath,
        'data',
        sceneConfig.markers
      );
      
      const markersData = await fs.readFile(markersPath, 'utf8');
      return JSON.parse(markersData);
    } catch (error) {
      console.warn(`[SubtitleGenerator] Could not load markers for slide ${slideId}:`, error.message);
      return null;
    }
  }

  private async generateSRTEntries(sceneSubtitles: SceneSubtitleData[]): Promise<SubtitleEntry[]> {
    const srtEntries: SubtitleEntry[] = [];
    let entryIndex = 1;
    
    for (const scene of sceneSubtitles) {
      if (scene.audioMarkers && scene.audioMarkers.sentences) {
        // Use sentence-level timing from audio markers
        const sentences = scene.audioMarkers.sentences;
        
        for (const sentence of sentences) {
          const startTime = scene.startTime + sentence.start_time;
          const endTime = scene.startTime + sentence.end_time;
          
          const chunks = this.splitTextIntoChunks(sentence.text);
          
          for (const chunk of chunks) {
            const chunkDuration = (endTime - startTime) / chunks.length;
            const chunkStart = startTime + (chunks.indexOf(chunk) * chunkDuration);
            const chunkEnd = chunkStart + chunkDuration;
            
            srtEntries.push({
              index: entryIndex++,
              startTime: this.formatSRTTime(chunkStart),
              endTime: this.formatSRTTime(chunkEnd),
              text: chunk
            });
          }
        }
      } else {
        // Use scene-based timing without detailed markers
        const chunks = this.splitTextIntoChunks(scene.text);
        const chunkDuration = scene.duration / chunks.length;
        
        for (let i = 0; i < chunks.length; i++) {
          const chunkStart = scene.startTime + (i * chunkDuration);
          const chunkEnd = chunkStart + chunkDuration;
          
          // Ensure minimum and maximum duration
          const adjustedDuration = Math.max(
            this.config.minDuration,
            Math.min(this.config.maxDuration, chunkDuration)
          );
          
          srtEntries.push({
            index: entryIndex++,
            startTime: this.formatSRTTime(chunkStart),
            endTime: this.formatSRTTime(chunkStart + adjustedDuration),
            text: chunks[i]
          });
        }
      }
    }
    
    return srtEntries;
  }

  private splitTextIntoChunks(text: string): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk = '';
    let lineCount = 0;
    
    for (const word of words) {
      const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
      const lines = testChunk.split('\n');
      const lastLine = lines[lines.length - 1];
      
      // Check if adding this word would exceed line length or line count limits
      if (lastLine.length > this.config.maxCharsPerLine || 
          lines.length > this.config.maxLinesPerSubtitle) {
        
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = word;
          lineCount = 1;
        } else {
          // Word itself is too long, split it
          chunks.push(word);
          currentChunk = '';
          lineCount = 0;
        }
      } else {
        currentChunk = testChunk;
        lineCount = lines.length;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  private formatSRTContent(entries: SubtitleEntry[]): string {
    return entries.map(entry => 
      `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`
    ).join('\n');
  }

  async generatePerSceneSubtitles(): Promise<string[]> {
    console.log('[SubtitleGenerator] Generating per-scene subtitles...');
    
    const sceneSubtitles = await this.collectSceneSubtitleData();
    const srtPaths: string[] = [];
    
    for (const scene of sceneSubtitles) {
      const srtEntries = await this.generateSRTEntries([scene]);
      const srtContent = this.formatSRTContent(srtEntries);
      
      const srtPath = path.join(
        this.config.outputPath,
        'scenes',
        `scene_${scene.slideId}_captions.srt`
      );
      
      await fs.mkdir(path.dirname(srtPath), { recursive: true });
      await fs.writeFile(srtPath, srtContent, 'utf8');
      srtPaths.push(srtPath);
    }
    
    console.log(`[SubtitleGenerator] Generated ${srtPaths.length} scene subtitle files`);
    return srtPaths;
  }

  async validateSubtitles(srtPath: string): Promise<{
    isValid: boolean;
    errors: string[];
    statistics: {
      totalEntries: number;
      totalDuration: number;
      avgDuration: number;
      maxCharsPerLine: number;
      maxLines: number;
    };
  }> {
    try {
      const srtContent = await fs.readFile(srtPath, 'utf8');
      const entries = this.parseSRTContent(srtContent);
      
      const errors: string[] = [];
      let maxCharsPerLine = 0;
      let maxLines = 0;
      let totalDuration = 0;
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        // Check index sequence
        if (entry.index !== i + 1) {
          errors.push(`Entry ${i + 1}: Invalid index ${entry.index}`);
        }
        
        // Check timing
        const startSeconds = this.parseSRTTime(entry.startTime);
        const endSeconds = this.parseSRTTime(entry.endTime);
        
        if (endSeconds <= startSeconds) {
          errors.push(`Entry ${entry.index}: End time must be after start time`);
        }
        
        totalDuration += (endSeconds - startSeconds);
        
        // Check text formatting
        const lines = entry.text.split('\n');
        maxLines = Math.max(maxLines, lines.length);
        
        for (const line of lines) {
          maxCharsPerLine = Math.max(maxCharsPerLine, line.length);
          
          if (line.length > this.config.maxCharsPerLine) {
            errors.push(`Entry ${entry.index}: Line too long (${line.length} chars)`);
          }
        }
        
        if (lines.length > this.config.maxLinesPerSubtitle) {
          errors.push(`Entry ${entry.index}: Too many lines (${lines.length})`);
        }
        
        // Check overlapping with next entry
        if (i < entries.length - 1) {
          const nextStartSeconds = this.parseSRTTime(entries[i + 1].startTime);
          if (nextStartSeconds < endSeconds) {
            errors.push(`Entry ${entry.index}: Overlaps with next entry`);
          }
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        statistics: {
          totalEntries: entries.length,
          totalDuration,
          avgDuration: entries.length > 0 ? totalDuration / entries.length : 0,
          maxCharsPerLine,
          maxLines
        }
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate SRT: ${error.message}`],
        statistics: {
          totalEntries: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxCharsPerLine: 0,
          maxLines: 0
        }
      };
    }
  }

  private parseSRTContent(content: string): SubtitleEntry[] {
    const entries: SubtitleEntry[] = [];
    const blocks = content.trim().split(/\n\s*\n/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;
      
      const index = parseInt(lines[0]);
      const timeLine = lines[1];
      const text = lines.slice(2).join('\n');
      
      const [startTime, endTime] = timeLine.split(' --> ');
      
      entries.push({
        index,
        startTime,
        endTime,
        text
      });
    }
    
    return entries;
  }

  private parseSRTTime(timeStr: string): number {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
  }
}

export { SubtitleGenerator };