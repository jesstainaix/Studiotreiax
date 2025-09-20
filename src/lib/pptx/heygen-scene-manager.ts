import { PPTXContentExtractor, PPTXProject, PPTXSlide } from './content-extractor';

/**
 * HeyGen-style Scene Management System
 * Converts PPTX slides into structured scenes with metadata for video production
 */

export interface HeyGenScene {
  id: string;
  title: string;
  content: string;
  thumbnail?: string;
  duration: number;
  position: number;
  avatar?: {
    id: string;
    name: string;
    gender: 'male' | 'female';
    style: 'professional' | 'casual' | 'corporate';
    thumbnailUrl: string;
    modelPath?: string; // For 3D model integration
  };
  voice?: {
    id: string;
    name: string;
    language: 'pt-BR';
    gender: 'male' | 'female';
    sample: string;
    provider: 'elevenlabs' | 'heygen' | 'google' | 'azure';
  };
  slideData: {
    originalSlideIndex: number;
    extractedText: string;
    images: Array<{
      url: string;
      alt: string;
      position: { x: number; y: number; width: number; height: number };
    }>;
    layout: 'title' | 'content' | 'image' | 'mixed';
    animations?: Array<{
      type: string;
      duration: number;
      delay: number;
    }>;
  };
  videoSettings?: {
    backgroundType: 'slide' | 'custom' | 'green_screen';
    backgroundUrl?: string;
    cameraAngle: 'front' | 'side' | 'three_quarter';
    avatarPosition: 'left' | 'right' | 'center';
    textOverlay: boolean;
  };
  audioSettings?: {
    volumeLevel: number;
    backgroundMusic?: string;
    speechSpeed: number;
    pronunciation: Record<string, string>; // Custom pronunciations for technical terms
  };
}

export interface HeyGenProject {
  id: string;
  name: string;
  description: string;
  scenes: HeyGenScene[];
  totalDuration: number;
  status: 'draft' | 'processing' | 'ready' | 'rendering' | 'completed' | 'error';
  metadata: {
    originalFile: string;
    extractedAt: string;
    slideCount: number;
    processingTime: number;
    exportSettings?: {
      resolution: '1080p' | '4K';
      format: 'mp4' | 'webm';
      quality: 'standard' | 'high' | 'ultra';
      subtitles: boolean;
    };
  };
  settings: {
    theme: string;
    transitions: boolean;
    animations: boolean;
    defaultAvatar?: string;
    defaultVoice?: string;
  };
}

/**
 * Scene manager for HeyGen-style video production
 */
export class HeyGenSceneManager {
  private static instance: HeyGenSceneManager;
  
  static getInstance(): HeyGenSceneManager {
    if (!HeyGenSceneManager.instance) {
      HeyGenSceneManager.instance = new HeyGenSceneManager();
    }
    return HeyGenSceneManager.instance;
  }

  /**
   * Convert PPTX project to HeyGen-style project with scene structure
   */
  async convertPPTXToHeyGenProject(file: File): Promise<HeyGenProject> {
    try {
      const extractor = PPTXContentExtractor.getInstance();
      
      // Extract PPTX content
      const pptxProject = await extractor.extractContent(file, {
        enableAI: true,
        preserveFormatting: true,
        extractImages: true,
        onProgress: (progress, message) => {
          console.log(`Extraction progress: ${progress}% - ${message}`);
        }
      });

      // Convert slides to HeyGen scenes
      const scenes = await this.convertSlidesToScenes(pptxProject.slides);

      const heygenProject: HeyGenProject = {
        id: `heygen-${Date.now()}`,
        name: file.name.replace(/\.(pptx|ppt)$/i, ''),
        description: `Projeto de vídeo criado a partir de ${file.name}`,
        scenes,
        totalDuration: scenes.reduce((total, scene) => total + scene.duration, 0),
        status: 'draft',
        metadata: {
          originalFile: file.name,
          extractedAt: new Date().toISOString(),
          slideCount: scenes.length,
          processingTime: 0
        },
        settings: {
          theme: 'professional',
          transitions: true,
          animations: true
        }
      };

      return heygenProject;
    } catch (error) {
      console.error('Error converting PPTX to HeyGen project:', error);
      throw new Error(`Falha na conversão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Convert individual slides to HeyGen scenes
   */
  private async convertSlidesToScenes(slides: PPTXSlide[]): Promise<HeyGenScene[]> {
    const scenes: HeyGenScene[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      const scene: HeyGenScene = {
        id: `scene-${i}`,
        title: slide.title || `Cena ${i + 1}`,
        content: slide.content || slide.textContent?.join('\n') || '',
        duration: this.calculateSceneDuration(slide.content || ''),
        position: i,
        slideData: {
          originalSlideIndex: i,
          extractedText: slide.content || slide.textContent?.join('\n') || '',
          images: slide.images || [],
          layout: slide.layout,
          animations: slide.animations ? slide.animations.map(anim => ({
            type: anim.type || 'fade',
            duration: anim.duration || 500,
            delay: anim.delay || 0
          })) : []
        },
        videoSettings: {
          backgroundType: 'slide',
          cameraAngle: 'front',
          avatarPosition: 'right',
          textOverlay: true
        },
        audioSettings: {
          volumeLevel: 0.8,
          speechSpeed: 1.0,
          pronunciation: {}
        }
      };

      // Add thumbnail if available
      if (slide.imageUrl) {
        scene.thumbnail = slide.imageUrl;
      }

      scenes.push(scene);
    }

    return scenes;
  }

  /**
   * Calculate scene duration based on content length and complexity
   */
  private calculateSceneDuration(content: string): number {
    // Base calculation: ~150 words per minute for Portuguese narration
    const words = content.split(/\s+/).length;
    const baseTimePerWord = 0.4; // seconds per word
    const baseDuration = words * baseTimePerWord;
    
    // Minimum duration for visual comprehension
    const minDuration = 3;
    
    // Maximum duration to maintain engagement
    const maxDuration = 60;
    
    return Math.max(minDuration, Math.min(maxDuration, baseDuration));
  }

  /**
   * Update scene with avatar assignment
   */
  updateSceneAvatar(project: HeyGenProject, sceneId: string, avatar: HeyGenScene['avatar']): HeyGenProject {
    return {
      ...project,
      scenes: project.scenes.map(scene => 
        scene.id === sceneId 
          ? { ...scene, avatar }
          : scene
      )
    };
  }

  /**
   * Update scene with voice assignment
   */
  updateSceneVoice(project: HeyGenProject, sceneId: string, voice: HeyGenScene['voice']): HeyGenProject {
    return {
      ...project,
      scenes: project.scenes.map(scene => 
        scene.id === sceneId 
          ? { ...scene, voice }
          : scene
      )
    };
  }

  /**
   * Generate scene output JSON for video pipeline
   */
  generateSceneOutputJSON(scene: HeyGenScene): string {
    const sceneOutput = {
      scene_id: scene.id,
      scene_info: {
        title: scene.title,
        duration: scene.duration,
        position: scene.position
      },
      content: {
        text: scene.content,
        extracted_text: scene.slideData.extractedText,
        layout: scene.slideData.layout
      },
      assets: {
        images: scene.slideData.images,
        thumbnail: scene.thumbnail
      },
      avatar: scene.avatar ? {
        id: scene.avatar.id,
        name: scene.avatar.name,
        model_path: scene.avatar.modelPath,
        style: scene.avatar.style
      } : null,
      voice: scene.voice ? {
        id: scene.voice.id,
        name: scene.voice.name,
        provider: scene.voice.provider,
        language: scene.voice.language
      } : null,
      video_settings: scene.videoSettings,
      audio_settings: scene.audioSettings,
      animations: scene.slideData.animations
    };

    return JSON.stringify(sceneOutput, null, 2);
  }

  /**
   * Generate complete project output for video rendering pipeline
   */
  generateProjectOutputJSON(project: HeyGenProject): string {
    const projectOutput = {
      project_id: project.id,
      project_info: {
        name: project.name,
        description: project.description,
        total_duration: project.totalDuration,
        scene_count: project.scenes.length,
        status: project.status
      },
      metadata: project.metadata,
      settings: project.settings,
      scenes: project.scenes.map(scene => JSON.parse(this.generateSceneOutputJSON(scene))),
      render_config: {
        output_format: 'mp4',
        resolution: '1080p',
        fps: 30,
        quality: 'high',
        codec: 'h264'
      }
    };

    return JSON.stringify(projectOutput, null, 2);
  }

  /**
   * Validate project before rendering
   */
  validateProject(project: HeyGenProject): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if project has scenes
    if (!project.scenes || project.scenes.length === 0) {
      errors.push('Projeto deve ter pelo menos uma cena');
    }

    // Check each scene
    project.scenes.forEach((scene, index) => {
      if (!scene.content || scene.content.trim().length === 0) {
        warnings.push(`Cena ${index + 1} (${scene.title}) não tem conteúdo de texto`);
      }

      if (!scene.avatar) {
        warnings.push(`Cena ${index + 1} (${scene.title}) não tem avatar atribuído`);
      }

      if (!scene.voice) {
        warnings.push(`Cena ${index + 1} (${scene.title}) não tem voz atribuída`);
      }

      if (scene.duration < 1) {
        errors.push(`Cena ${index + 1} (${scene.title}) tem duração muito curta`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export types
export type { HeyGenScene, HeyGenProject };