// Narration Service - Text extraction and TTS generation
import { ttsManager } from '../providers/tts';
import { TTSGenerationRequest, TTSGenerationResult, NarrationJob } from '../providers/tts/types';
import * as fs from 'fs';
import * as path from 'path';

export interface SlideData {
  id: number;
  image: string;
  title: string;
  text: string;
  notes: string;
  suggestedDurationSec: number;
}

export interface DeckData {
  deck_id: string;
  source_file: string;
  slides: SlideData[];
}

export interface SceneNarrationConfig {
  scene_id: number;
  text_source: string; // Extracted text for TTS
  voice?: string;
  style?: string;
}

export class NarrationService {
  
  /**
   * Extract text for TTS from slide data following priority: notes > text > title
   */
  static extractTextForTTS(slide: SlideData): string {
    // Priority 1: Notes (if available and not empty)
    if (slide.notes && slide.notes.trim() !== '') {
      console.log(`[NarrationService] Using notes for slide ${slide.id}: "${slide.notes.substring(0, 50)}..."`);
      return slide.notes.trim();
    }
    
    // Priority 2: Text content (if available and not empty)
    if (slide.text && slide.text.trim() !== '') {
      console.log(`[NarrationService] Using text for slide ${slide.id}: "${slide.text.substring(0, 50)}..."`);
      return slide.text.trim();
    }
    
    // Priority 3: Title (fallback)
    if (slide.title && slide.title.trim() !== '') {
      console.log(`[NarrationService] Using title for slide ${slide.id}: "${slide.title}"`);
      return slide.title.trim();
    }
    
    // Fallback: Generate generic text
    console.warn(`[NarrationService] No text content found for slide ${slide.id}, using fallback`);
    return `Slide ${slide.id}`;
  }
  
  /**
   * Load deck data from the project data structure
   */
  static async loadDeckData(deck_id?: string): Promise<DeckData> {
    const slidesPath = path.join(process.cwd(), 'project', 'project', 'data', 'slides.json');
    
    try {
      const slidesContent = await fs.promises.readFile(slidesPath, 'utf-8');
      const deckData: DeckData = JSON.parse(slidesContent);
      
      console.log(`[NarrationService] Loaded deck data: ${deckData.slides.length} slides`);
      return deckData;
    } catch (error) {
      throw new Error(`Failed to load deck data: ${error.message}`);
    }
  }
  
  /**
   * Prepare scenes for narration generation
   */
  static prepareNarrationScenes(deckData: DeckData, voiceConfig?: { [sceneId: number]: { voice?: string; style?: string } }): SceneNarrationConfig[] {
    return deckData.slides.map(slide => {
      const sceneConfig = voiceConfig?.[slide.id] || {};
      
      return {
        scene_id: slide.id,
        text_source: this.extractTextForTTS(slide),
        voice: sceneConfig.voice,
        style: sceneConfig.style
      };
    });
  }
  
  /**
   * Generate audio narration for a single scene
   */
  static async generateSceneNarration(
    sceneConfig: SceneNarrationConfig, 
    options?: Partial<TTSGenerationRequest>
  ): Promise<TTSGenerationResult> {
    const request: TTSGenerationRequest = {
      text: sceneConfig.text_source,
      scene_id: sceneConfig.scene_id,
      language: 'pt-BR',
      voice: sceneConfig.voice || 'br-female-adult-1',
      style: sceneConfig.style || 'neutral',
      quality: 'medium',
      format: 'mp3',
      ...options
    };
    
    console.log(`[NarrationService] Generating narration for scene ${sceneConfig.scene_id}`);
    console.log(`[NarrationService] Text: "${request.text.substring(0, 100)}..."`);
    
    try {
      const result = await ttsManager.generateAudio(request);
      console.log(`[NarrationService] Successfully generated narration for scene ${sceneConfig.scene_id}`);
      return result;
    } catch (error) {
      console.error(`[NarrationService] Failed to generate narration for scene ${sceneConfig.scene_id}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate audio narration for all scenes in a deck (batch processing)
   */
  static async generateDeckNarration(
    deck_id?: string,
    voiceConfig?: { [sceneId: number]: { voice?: string; style?: string } },
    options?: Partial<TTSGenerationRequest>
  ): Promise<NarrationJob> {
    console.log(`[NarrationService] Starting deck narration generation for deck: ${deck_id || 'default'}`);
    
    const job: NarrationJob = {
      deck_id: deck_id || 'default',
      scenes: [],
      config: {
        language: 'pt-BR',
        default_voice: 'br-female-adult-1',
        default_style: 'neutral',
        quality: 'medium'
      },
      status: 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: {
        total_scenes: 0,
        completed_scenes: 0,
        failed_scenes: 0
      }
    };
    
    try {
      // Load deck data
      const deckData = await this.loadDeckData(deck_id);
      
      // Prepare scenes for narration
      const scenes = this.prepareNarrationScenes(deckData, voiceConfig);
      job.scenes = scenes;
      job.progress!.total_scenes = scenes.length;
      
      console.log(`[NarrationService] Processing ${scenes.length} scenes for narration`);
      
      // Generate narration for each scene
      const results: TTSGenerationResult[] = [];
      const errors: Array<{ scene_id: number; error: string }> = [];
      
      for (const scene of scenes) {
        try {
          const result = await this.generateSceneNarration(scene, options);
          results.push(result);
          job.progress!.completed_scenes++;
          
          console.log(`[NarrationService] Progress: ${job.progress!.completed_scenes}/${job.progress!.total_scenes} scenes completed`);
          
        } catch (error) {
          job.progress!.failed_scenes++;
          errors.push({
            scene_id: scene.scene_id,
            error: error.message
          });
          
          console.error(`[NarrationService] Failed to generate scene ${scene.scene_id}: ${error.message}`);
        }
      }
      
      // Update job status
      job.status = job.progress!.failed_scenes === 0 ? 'completed' : 'failed';
      job.updated_at = new Date().toISOString();
      
      console.log(`[NarrationService] Deck narration completed:`);
      console.log(`  - Total scenes: ${job.progress!.total_scenes}`);
      console.log(`  - Completed: ${job.progress!.completed_scenes}`);
      console.log(`  - Failed: ${job.progress!.failed_scenes}`);
      
      if (errors.length > 0) {
        console.warn(`[NarrationService] Errors encountered:`, errors);
      }
      
      return job;
      
    } catch (error) {
      job.status = 'failed';
      job.updated_at = new Date().toISOString();
      
      console.error(`[NarrationService] Failed to generate deck narration:`, error);
      throw error;
    }
  }
  
  /**
   * Regenerate narration for a specific scene (when text is edited)
   */
  static async regenerateSceneNarration(
    scene_id: number,
    updatedSlide: SlideData,
    voice?: string,
    style?: string,
    options?: Partial<TTSGenerationRequest>
  ): Promise<TTSGenerationResult> {
    console.log(`[NarrationService] Regenerating narration for scene ${scene_id}`);
    
    // Delete existing audio files if they exist
    try {
      await ttsManager.deleteAudio(`*_${scene_id}_*`);
      console.log(`[NarrationService] Deleted existing audio for scene ${scene_id}`);
    } catch (error) {
      console.warn(`[NarrationService] Could not delete existing audio for scene ${scene_id}:`, error.message);
    }
    
    // Extract new text and generate narration
    const sceneConfig: SceneNarrationConfig = {
      scene_id,
      text_source: this.extractTextForTTS(updatedSlide),
      voice,
      style
    };
    
    return await this.generateSceneNarration(sceneConfig, options);
  }
  
  /**
   * Update scene configuration with audio references
   */
  static async updateSceneConfigWithAudio(results: TTSGenerationResult[]): Promise<void> {
    const sceneConfigPath = path.join(process.cwd(), 'project', 'data', 'scene_config.json');
    
    try {
      // Load existing scene configuration
      const configContent = await fs.promises.readFile(sceneConfigPath, 'utf-8');
      const sceneConfig = JSON.parse(configContent);
      
      // Update scenes with audio references
      for (const result of results) {
        const sceneIndex = sceneConfig.scenes.findIndex((scene: any) => scene.slide_id === result.scene_id);
        
        if (sceneIndex !== -1) {
          sceneConfig.scenes[sceneIndex] = {
            ...sceneConfig.scenes[sceneIndex],
            audio: result.assets.audio_url,
            audio_duration: result.metadata.duration_sec,
            markers: result.assets.markers_url,
            generated_at: result.metadata.generated_at,
            voice_used: result.metadata.voice
          };
        }
      }
      
      // Update timestamp
      sceneConfig.updated_at = new Date().toISOString();
      
      // Save updated configuration
      await fs.promises.writeFile(sceneConfigPath, JSON.stringify(sceneConfig, null, 2));
      
      console.log(`[NarrationService] Updated scene configuration with ${results.length} audio references`);
      
    } catch (error) {
      console.error(`[NarrationService] Failed to update scene configuration:`, error);
      throw error;
    }
  }
  
  /**
   * Get narration status for a deck
   */
  static async getNarrationStatus(deck_id?: string): Promise<{
    deck_id: string;
    total_scenes: number;
    scenes_with_audio: number;
    audio_files: TTSGenerationResult[];
  }> {
    try {
      const deckData = await this.loadDeckData(deck_id);
      const audioFiles = await ttsManager.listAudios(deck_id);
      
      return {
        deck_id: deck_id || 'default',
        total_scenes: deckData.slides.length,
        scenes_with_audio: audioFiles.length,
        audio_files: audioFiles
      };
    } catch (error) {
      console.error(`[NarrationService] Failed to get narration status:`, error);
      throw error;
    }
  }
}