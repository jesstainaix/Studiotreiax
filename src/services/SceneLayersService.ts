// Scene Layers Service - Backend integration for scene elements persistence
import { SceneLayer, SceneLayersData, LayerUpdateAction } from '../types/SceneLayers';

export class SceneLayersService {
  private static instance: SceneLayersService;
  private baseUrl: string;
  private cache = new Map<string, SceneLayer[]>();

  private constructor() {
    this.baseUrl = '/api'; // Use relative path for better dev/prod compatibility
  }

  static getInstance(): SceneLayersService {
    if (!SceneLayersService.instance) {
      SceneLayersService.instance = new SceneLayersService();
    }
    return SceneLayersService.instance;
  }

  // Load layers for a specific scene
  async loadSceneLayers(sceneId: string): Promise<SceneLayer[]> {
    try {
      // Check cache first
      if (this.cache.has(sceneId)) {
        return this.cache.get(sceneId)!;
      }

      // Try to load from backend
      const response = await fetch(`${this.baseUrl}/scene-layers/${sceneId}`);
      
      if (response.ok) {
        const layers: SceneLayer[] = await response.json();
        this.cache.set(sceneId, layers);
        return layers;
      } else if (response.status === 404) {
        // No layers found, return empty array
        return [];
      } else {
        throw new Error(`Failed to load scene layers: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading scene layers:', error);
      
      // Fallback to localStorage
      const fallbackData = localStorage.getItem(`scene_layers_${sceneId}`);
      if (fallbackData) {
        try {
          const layers = JSON.parse(fallbackData);
          return Array.isArray(layers) ? layers : [];
        } catch (parseError) {
          console.error('Error parsing fallback data:', parseError);
        }
      }
      
      return [];
    }
  }

  // Save layers for a specific scene
  async saveSceneLayers(sceneId: string, layers: SceneLayer[]): Promise<void> {
    try {
      // Update cache
      this.cache.set(sceneId, layers);

      // Save to localStorage immediately
      localStorage.setItem(`scene_layers_${sceneId}`, JSON.stringify(layers));

      // Save to backend
      const response = await fetch(`${this.baseUrl}/scene-layers/${sceneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(layers)
      });

      if (!response.ok) {
        console.warn('Failed to save to backend, using localStorage only');
      }
    } catch (error) {
      console.error('Error saving scene layers:', error);
      // At least save to localStorage
      localStorage.setItem(`scene_layers_${sceneId}`, JSON.stringify(layers));
    }
  }

  // Add a new layer to a scene
  async addLayerToScene(sceneId: string, layer: Omit<SceneLayer, 'id'>): Promise<SceneLayer> {
    const newLayer: SceneLayer = {
      ...layer,
      id: this.generateLayerId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentLayers = await this.loadSceneLayers(sceneId);
    const updatedLayers = [...currentLayers, newLayer];
    
    await this.saveSceneLayers(sceneId, updatedLayers);
    return newLayer;
  }

  // Update an existing layer
  async updateLayerInScene(
    sceneId: string, 
    layerId: string, 
    updates: Partial<SceneLayer>
  ): Promise<void> {
    const currentLayers = await this.loadSceneLayers(sceneId);
    const updatedLayers = currentLayers.map(layer =>
      layer.id === layerId
        ? { ...layer, ...updates, updatedAt: new Date().toISOString() }
        : layer
    );
    
    await this.saveSceneLayers(sceneId, updatedLayers);
  }

  // Delete a layer from a scene
  async deleteLayerFromScene(sceneId: string, layerId: string): Promise<void> {
    const currentLayers = await this.loadSceneLayers(sceneId);
    const updatedLayers = currentLayers.filter(layer => layer.id !== layerId);
    
    await this.saveSceneLayers(sceneId, updatedLayers);
  }

  // Reorder layers in a scene
  async reorderLayersInScene(sceneId: string, layerIds: string[]): Promise<void> {
    const currentLayers = await this.loadSceneLayers(sceneId);
    const reorderedLayers = layerIds
      .map(id => currentLayers.find(layer => layer.id === id))
      .filter(Boolean) as SceneLayer[];

    // Update z_index based on new order
    const updatedLayers = reorderedLayers.map((layer, index) => ({
      ...layer,
      z_index: index + 1,
      updatedAt: new Date().toISOString()
    }));

    await this.saveSceneLayers(sceneId, updatedLayers);
  }

  // Duplicate a layer
  async duplicateLayerInScene(sceneId: string, layerId: string): Promise<SceneLayer> {
    const currentLayers = await this.loadSceneLayers(sceneId);
    const originalLayer = currentLayers.find(layer => layer.id === layerId);
    
    if (!originalLayer) {
      throw new Error(`Layer ${layerId} not found in scene ${sceneId}`);
    }

    const duplicatedLayer: SceneLayer = {
      ...originalLayer,
      id: this.generateLayerId(),
      name: `${originalLayer.name} (Cópia)`,
      x: Math.min(0.95, originalLayer.x + 0.05),
      y: Math.min(0.95, originalLayer.y + 0.05),
      z_index: Math.max(...currentLayers.map(l => l.z_index || 0)) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedLayers = [...currentLayers, duplicatedLayer];
    await this.saveSceneLayers(sceneId, updatedLayers);
    
    return duplicatedLayer;
  }

  // Load complete scene layers data file
  async loadCompleteLayersData(): Promise<SceneLayersData | null> {
    try {
      const response = await fetch('/project/data/scene_layers.json');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error loading complete layers data:', error);
      return null;
    }
  }

  // Export scene layers to JSON
  async exportSceneLayers(sceneId: string): Promise<string> {
    const layers = await this.loadSceneLayers(sceneId);
    return JSON.stringify(layers, null, 2);
  }

  // Import scene layers from JSON
  async importSceneLayers(sceneId: string, jsonData: string): Promise<void> {
    try {
      const layers: SceneLayer[] = JSON.parse(jsonData);
      
      // Validate the imported data
      if (!Array.isArray(layers)) {
        throw new Error('Invalid JSON format: expected array of layers');
      }

      // Ensure all layers have required fields
      const validatedLayers = layers.map(layer => ({
        ...layer,
        id: layer.id || this.generateLayerId(),
        createdAt: layer.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      await this.saveSceneLayers(sceneId, validatedLayers);
    } catch (error) {
      throw new Error(`Failed to import layers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check - verify backend connectivity
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Clear cache for a specific scene
  clearSceneCache(sceneId: string): void {
    this.cache.delete(sceneId);
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear();
  }

  // Generate unique layer ID
  private generateLayerId(): string {
    return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Batch operations for performance
  async batchUpdateLayers(
    sceneId: string, 
    operations: Array<{
      type: 'add' | 'update' | 'delete';
      layer?: Omit<SceneLayer, 'id'>;
      layerId?: string;
      updates?: Partial<SceneLayer>;
    }>
  ): Promise<SceneLayer[]> {
    let currentLayers = await this.loadSceneLayers(sceneId);

    for (const operation of operations) {
      switch (operation.type) {
        case 'add':
          if (operation.layer) {
            const newLayer: SceneLayer = {
              ...operation.layer,
              id: this.generateLayerId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            currentLayers.push(newLayer);
          }
          break;

        case 'update':
          if (operation.layerId && operation.updates) {
            currentLayers = currentLayers.map(layer =>
              layer.id === operation.layerId
                ? { ...layer, ...operation.updates, updatedAt: new Date().toISOString() }
                : layer
            );
          }
          break;

        case 'delete':
          if (operation.layerId) {
            currentLayers = currentLayers.filter(layer => layer.id !== operation.layerId);
          }
          break;
      }
    }

    await this.saveSceneLayers(sceneId, currentLayers);
    return currentLayers;
  }
}

// Export singleton instance
export const sceneLayersService = SceneLayersService.getInstance();