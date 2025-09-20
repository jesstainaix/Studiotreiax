// React Hook for Narration Generation
import { useState, useCallback } from 'react';
import { NarrationService } from '../services/narration';
import { TTSGenerationResult, NarrationJob } from '../providers/tts/types';

export interface UseGenerateNarrationReturn {
  // State
  isGenerating: boolean;
  progress: {
    total: number;
    completed: number;
    failed: number;
    current?: string;
  } | null;
  error: string | null;
  lastJob: NarrationJob | null;
  
  // Actions
  generateDeckNarration: (
    deck_id?: string,
    voiceConfig?: { [sceneId: number]: { voice?: string; style?: string } }
  ) => Promise<NarrationJob>;
  
  regenerateSceneNarration: (
    scene_id: number,
    updatedSlide: any,
    voice?: string,
    style?: string
  ) => Promise<TTSGenerationResult>;
  
  getNarrationStatus: (deck_id?: string) => Promise<{
    deck_id: string;
    total_scenes: number;
    scenes_with_audio: number;
    audio_files: TTSGenerationResult[];
  }>;
  
  clearError: () => void;
  reset: () => void;
}

export const useGenerateNarration = (): UseGenerateNarrationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    current?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<NarrationJob | null>(null);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    setError(null);
    setLastJob(null);
  }, []);
  
  const generateDeckNarration = useCallback(async (
    deck_id?: string,
    voiceConfig?: { [sceneId: number]: { voice?: string; style?: string } }
  ): Promise<NarrationJob> => {
    console.log(`[useGenerateNarration] Starting deck narration for deck: ${deck_id || 'default'}`);
    
    setIsGenerating(true);
    setError(null);
    setProgress({ total: 0, completed: 0, failed: 0 });
    
    try {
      // Start narration generation with progress tracking
      const job = await NarrationService.generateDeckNarration(deck_id, voiceConfig);
      
      // Update scene configuration with audio references
      const audioResults: TTSGenerationResult[] = [];
      
      // We need to get the generated audio results to update the scene config
      // This is a simplified approach - in production you might want more sophisticated tracking
      const narrationStatus = await NarrationService.getNarrationStatus(deck_id);
      
      if (narrationStatus.audio_files.length > 0) {
        await NarrationService.updateSceneConfigWithAudio(narrationStatus.audio_files);
      }
      
      setLastJob(job);
      setProgress({
        total: job.progress?.total_scenes || 0,
        completed: job.progress?.completed_scenes || 0,
        failed: job.progress?.failed_scenes || 0
      });
      
      console.log(`[useGenerateNarration] Deck narration completed successfully`);
      return job;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`[useGenerateNarration] Deck narration failed:`, errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  const regenerateSceneNarration = useCallback(async (
    scene_id: number,
    updatedSlide: any,
    voice?: string,
    style?: string
  ): Promise<TTSGenerationResult> => {
    console.log(`[useGenerateNarration] Regenerating scene ${scene_id}`);
    
    setIsGenerating(true);
    setError(null);
    setProgress({ total: 1, completed: 0, failed: 0, current: `Scene ${scene_id}` });
    
    try {
      const result = await NarrationService.regenerateSceneNarration(
        scene_id,
        updatedSlide,
        voice,
        style
      );
      
      // Update scene configuration with new audio reference
      await NarrationService.updateSceneConfigWithAudio([result]);
      
      setProgress({ total: 1, completed: 1, failed: 0 });
      
      console.log(`[useGenerateNarration] Scene ${scene_id} regeneration completed successfully`);
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`[useGenerateNarration] Scene regeneration failed:`, errorMessage);
      setError(errorMessage);
      setProgress({ total: 1, completed: 0, failed: 1 });
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  const getNarrationStatus = useCallback(async (deck_id?: string) => {
    console.log(`[useGenerateNarration] Getting narration status for deck: ${deck_id || 'default'}`);
    
    try {
      return await NarrationService.getNarrationStatus(deck_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get narration status';
      console.error(`[useGenerateNarration] Status check failed:`, errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  return {
    // State
    isGenerating,
    progress,
    error,
    lastJob,
    
    // Actions
    generateDeckNarration,
    regenerateSceneNarration,
    getNarrationStatus,
    clearError,
    reset
  };
};