// Engine de Composição - Sistema para composição de layers e efeitos
import { EventEmitter } from '../utils/EventEmitter';

export interface CompositeLayer {
  id: string;
  name: string;
  type: 'video' | 'image' | 'text' | 'effect' | 'mask';
  source: string;
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    opacity: number;
  };
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
  visible: boolean;
  locked: boolean;
  effects: string[];
  mask?: string;
  keyframes: Keyframe[];
}

export interface Keyframe {
  time: number;
  property: string;
  value: any;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface CompositeProject {
  id: string;
  name: string;
  width: number;
  height: number;
  frameRate: number;
  duration: number;
  layers: CompositeLayer[];
  settings: {
    backgroundColor: string;
    quality: 'draft' | 'preview' | 'final';
    colorSpace: 'sRGB' | 'Rec709' | 'Rec2020';
  };
}

class CompositingEngine extends EventEmitter {
  private projects: Map<string, CompositeProject> = new Map();
  private activeProject: string | null = null;
  private renderContext: any = null;
  private isInitialized = false;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    try {
      this.renderContext = this.createRenderContext();
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private createRenderContext(): any {
    return {
      canvas: null,
      context: null,
      buffers: new Map(),
      textures: new Map()
    };
  }

  createProject(config: Partial<CompositeProject>): string {
    const projectId = `project-${Date.now()}`;
    const project: CompositeProject = {
      id: projectId,
      name: config.name || 'Novo Projeto',
      width: config.width || 1920,
      height: config.height || 1080,
      frameRate: config.frameRate || 30,
      duration: config.duration || 10,
      layers: config.layers || [],
      settings: config.settings || {
        backgroundColor: '#000000',
        quality: 'preview',
        colorSpace: 'sRGB'
      }
    };

    this.projects.set(projectId, project);
    this.emit('projectCreated', project);
    return projectId;
  }

  addLayer(projectId: string, layerConfig: Partial<CompositeLayer>): string {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Projeto não encontrado');

    const layerId = `layer-${Date.now()}`;
    const layer: CompositeLayer = {
      id: layerId,
      name: layerConfig.name || 'Nova Layer',
      type: layerConfig.type || 'video',
      source: layerConfig.source || '',
      transform: layerConfig.transform || {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1
      },
      blendMode: layerConfig.blendMode || 'normal',
      visible: layerConfig.visible !== false,
      locked: layerConfig.locked || false,
      effects: layerConfig.effects || [],
      keyframes: layerConfig.keyframes || []
    };

    project.layers.push(layer);
    this.emit('layerAdded', { projectId, layer });
    return layerId;
  }

  addKeyframe(projectId: string, layerId: string, keyframe: Keyframe): void {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Projeto não encontrado');

    const layer = project.layers.find(l => l.id === layerId);
    if (!layer) throw new Error('Layer não encontrada');

    layer.keyframes.push(keyframe);
    layer.keyframes.sort((a, b) => a.time - b.time);
    
    this.emit('keyframeAdded', { projectId, layerId, keyframe });
  }

  renderFrame(projectId: string, time: number): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      try {
        const project = this.projects.get(projectId);
        if (!project) throw new Error('Projeto não encontrado');

        // Simular renderização de frame
        const imageData = new ImageData(project.width, project.height);
        
        // Processar layers visíveis
        const visibleLayers = project.layers.filter(layer => layer.visible);
        
        setTimeout(() => {
          this.emit('frameRendered', { projectId, time, layerCount: visibleLayers.length });
          resolve(imageData);
        }, 33); // Simular tempo de renderização
      } catch (error) {
        reject(error);
      }
    });
  }

  exportProject(projectId: string, settings: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const project = this.projects.get(projectId);
        if (!project) throw new Error('Projeto não encontrado');

        // Simular exportação
        const outputPath = `exports/${project.name}_${Date.now()}.mp4`;
        
        setTimeout(() => {
          this.emit('exportCompleted', { projectId, outputPath });
          resolve(outputPath);
        }, 5000); // Simular tempo de exportação
      } catch (error) {
        reject(error);
      }
    });
  }

  getProjects(): CompositeProject[] {
    return Array.from(this.projects.values());
  }

  getProject(projectId: string): CompositeProject | undefined {
    return this.projects.get(projectId);
  }

  setActiveProject(projectId: string): void {
    if (this.projects.has(projectId)) {
      this.activeProject = projectId;
      this.emit('activeProjectChanged', projectId);
    }
  }

  dispose(): void {
    this.projects.clear();
    this.renderContext = null;
    this.activeProject = null;
    this.isInitialized = false;
    this.emit('disposed');
  }
}

export default CompositingEngine;