// Scene Configuration Manager
import { SceneConfiguration, SceneAvatarConfig } from '../providers/avatars/types';

export class SceneManager {
  private static instance: SceneManager;
  private sceneConfig: SceneConfiguration | null = null;
  private configPath = '/project/data/scene_config.json';

  constructor() {
    this.loadConfiguration();
  }

  static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  async loadConfiguration(): Promise<SceneConfiguration> {
    try {
      // In a real implementation, this would fetch from the backend
      // For now, we'll simulate loading the config
      const response = await fetch('/api/scene-config');
      if (response.ok) {
        const config = await response.json();
        this.sceneConfig = config;
      } else {
        // Create default configuration if none exists
        this.sceneConfig = this.createDefaultConfiguration();
      }
    } catch (error) {
      console.warn('[SceneManager] Failed to load configuration, using default:', error);
      this.sceneConfig = this.createDefaultConfiguration();
    }
    return this.sceneConfig;
  }

  private createDefaultConfiguration(): SceneConfiguration {
    return {
      deck_id: `deck_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scenes: [],
      defaultSettings: {
        avatarPlacement: {
          x: 0.75,
          y: 0.65,
          scale: 0.9
        },
        avatarPose: 'neutral',
        avatarConfig: {
          voice: 'br-female-adult-1',
          expression: 'neutral',
          animation: 'idle-neutral'
        }
      }
    };
  }

  async saveConfiguration(): Promise<void> {
    if (!this.sceneConfig) return;

    try {
      this.sceneConfig.updated_at = new Date().toISOString();
      
      // In a real implementation, this would save to the backend
      const response = await fetch('/api/scene-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.sceneConfig)
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status}`);
      }

      console.log('[SceneManager] Configuration saved successfully');
    } catch (error) {
      console.error('[SceneManager] Failed to save configuration:', error);
      
      // Fallback: save to localStorage for development
      try {
        localStorage.setItem('scene_config', JSON.stringify(this.sceneConfig));
        console.log('[SceneManager] Configuration saved to localStorage as fallback');
      } catch (storageError) {
        console.error('[SceneManager] Failed to save to localStorage:', storageError);
      }
    }
  }

  getConfiguration(): SceneConfiguration | null {
    return this.sceneConfig;
  }

  getSceneBySlideId(slideId: number): SceneAvatarConfig | null {
    if (!this.sceneConfig) return null;
    return this.sceneConfig.scenes.find(scene => scene.slide_id === slideId) || null;
  }

  async assignAvatarToScene(
    slideId: number, 
    avatarId: string, 
    placement?: { x: number; y: number; scale: number },
    pose?: string,
    config?: { voice: string; expression: string; animation: string }
  ): Promise<void> {
    if (!this.sceneConfig) {
      await this.loadConfiguration();
    }

    if (!this.sceneConfig) {
      throw new Error('Failed to load scene configuration');
    }

    // Find existing scene or create new one
    const existingSceneIndex = this.sceneConfig.scenes.findIndex(
      scene => scene.slide_id === slideId
    );

    const sceneConfig: SceneAvatarConfig = {
      slide_id: slideId,
      avatarId,
      avatarPose: pose || this.sceneConfig.defaultSettings.avatarPose,
      avatarPlacement: placement || { ...this.sceneConfig.defaultSettings.avatarPlacement },
      avatarConfig: config || { ...this.sceneConfig.defaultSettings.avatarConfig }
    };

    if (existingSceneIndex >= 0) {
      // Update existing scene
      this.sceneConfig.scenes[existingSceneIndex] = sceneConfig;
    } else {
      // Add new scene
      this.sceneConfig.scenes.push(sceneConfig);
    }

    // Sort scenes by slide_id
    this.sceneConfig.scenes.sort((a, b) => a.slide_id - b.slide_id);

    await this.saveConfiguration();
  }

  async removeAvatarFromScene(slideId: number): Promise<void> {
    if (!this.sceneConfig) return;

    this.sceneConfig.scenes = this.sceneConfig.scenes.filter(
      scene => scene.slide_id !== slideId
    );

    await this.saveConfiguration();
  }

  async updateAvatarPlacement(
    slideId: number, 
    placement: { x: number; y: number; scale: number }
  ): Promise<void> {
    if (!this.sceneConfig) return;

    const scene = this.sceneConfig.scenes.find(scene => scene.slide_id === slideId);
    if (scene) {
      scene.avatarPlacement = placement;
      await this.saveConfiguration();
    }
  }

  async updateAvatarPose(slideId: number, pose: string): Promise<void> {
    if (!this.sceneConfig) return;

    const scene = this.sceneConfig.scenes.find(scene => scene.slide_id === slideId);
    if (scene) {
      scene.avatarPose = pose;
      await this.saveConfiguration();
    }
  }

  async updateAvatarConfig(
    slideId: number, 
    config: { voice?: string; expression?: string; animation?: string }
  ): Promise<void> {
    if (!this.sceneConfig) return;

    const scene = this.sceneConfig.scenes.find(scene => scene.slide_id === slideId);
    if (scene && scene.avatarConfig) {
      scene.avatarConfig = { ...scene.avatarConfig, ...config };
      await this.saveConfiguration();
    }
  }

  getAllScenesWithAvatars(): SceneAvatarConfig[] {
    return this.sceneConfig?.scenes || [];
  }

  getSceneCount(): number {
    return this.sceneConfig?.scenes.length || 0;
  }

  async duplicateScene(fromSlideId: number, toSlideId: number): Promise<void> {
    const sourceScene = this.getSceneBySlideId(fromSlideId);
    if (!sourceScene) return;

    await this.assignAvatarToScene(
      toSlideId,
      sourceScene.avatarId,
      { ...sourceScene.avatarPlacement },
      sourceScene.avatarPose,
      sourceScene.avatarConfig ? { ...sourceScene.avatarConfig } : undefined
    );
  }

  getUsedAvatarIds(): string[] {
    if (!this.sceneConfig) return [];
    return [...new Set(this.sceneConfig.scenes.map(scene => scene.avatarId))];
  }

  // Event system for components to subscribe to changes
  private listeners: ((config: SceneConfiguration) => void)[] = [];

  subscribe(listener: (config: SceneConfiguration) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    if (this.sceneConfig) {
      this.listeners.forEach(listener => listener(this.sceneConfig!));
    }
  }

  // Override save to notify listeners
  async saveConfigurationWithNotification(): Promise<void> {
    await this.saveConfiguration();
    this.notifyListeners();
  }
}

// Export singleton instance
export const sceneManager = SceneManager.getInstance();