import * as THREE from 'three';
import { VFXComposition, VFXLayer } from '../types/vfx';
import { AdvancedVFXEngine } from './AdvancedVFXEngine';

// Configurações de renderização otimizada
export interface RenderConfig {
  antialias: boolean;
  alpha: boolean;
  preserveDrawingBuffer: boolean;
  powerPreference: 'default' | 'high-performance' | 'low-power';
  precision: 'highp' | 'mediump' | 'lowp';
  stencil: boolean;
  depth: boolean;
  logarithmicDepthBuffer: boolean;
  physicallyCorrectLights: boolean;
  shadowMapEnabled: boolean;
  shadowMapType: THREE.ShadowMapType;
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
  outputEncoding: THREE.TextureEncoding;
}

// Sistema de LOD (Level of Detail)
export interface LODConfig {
  enabled: boolean;
  distances: number[];
  qualityLevels: ('low' | 'medium' | 'high')[];
  particleCountMultipliers: number[];
  effectIntensityMultipliers: number[];
}

// Configurações de performance
export interface PerformanceConfig {
  targetFPS: number;
  adaptiveQuality: boolean;
  frustumCulling: boolean;
  occlusionCulling: boolean;
  instancedRendering: boolean;
  batchRendering: boolean;
  textureCompression: boolean;
  mipmapGeneration: boolean;
  geometryMerging: boolean;
}

// Métricas de performance
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  memoryUsage: {
    geometries: number;
    textures: number;
    total: number;
  };
  gpuTime: number;
  cpuTime: number;
}

// Sistema de cache para otimização
class RenderCache {
  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private materialCache = new Map<string, THREE.Material>();
  private textureCache = new Map<string, THREE.Texture>();
  private shaderCache = new Map<string, THREE.Shader>();
  
  getGeometry(key: string): THREE.BufferGeometry | undefined {
    return this.geometryCache.get(key);
  }
  
  setGeometry(key: string, geometry: THREE.BufferGeometry): void {
    this.geometryCache.set(key, geometry);
  }
  
  getMaterial(key: string): THREE.Material | undefined {
    return this.materialCache.get(key);
  }
  
  setMaterial(key: string, material: THREE.Material): void {
    this.materialCache.set(key, material);
  }
  
  getTexture(key: string): THREE.Texture | undefined {
    return this.textureCache.get(key);
  }
  
  setTexture(key: string, texture: THREE.Texture): void {
    this.textureCache.set(key, texture);
  }
  
  getShader(key: string): THREE.Shader | undefined {
    return this.shaderCache.get(key);
  }
  
  setShader(key: string, shader: THREE.Shader): void {
    this.shaderCache.set(key, shader);
  }
  
  clear(): void {
    this.geometryCache.forEach(geometry => geometry.dispose());
    this.materialCache.forEach(material => material.dispose());
    this.textureCache.forEach(texture => texture.dispose());
    
    this.geometryCache.clear();
    this.materialCache.clear();
    this.textureCache.clear();
    this.shaderCache.clear();
  }
  
  getMemoryUsage(): { geometries: number; materials: number; textures: number; total: number } {
    return {
      geometries: this.geometryCache.size,
      materials: this.materialCache.size,
      textures: this.textureCache.size,
      total: this.geometryCache.size + this.materialCache.size + this.textureCache.size
    };
  }
}

// Sistema de culling otimizado
class CullingSystem {
  private frustum = new THREE.Frustum();
  private cameraMatrix = new THREE.Matrix4();
  
  updateFrustum(camera: THREE.Camera): void {
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }
  
  isVisible(object: THREE.Object3D): boolean {
    if (!object.geometry) return true;
    
    // Frustum culling
    const boundingSphere = object.geometry.boundingSphere;
    if (boundingSphere && !this.frustum.intersectsSphere(boundingSphere)) {
      return false;
    }
    
    // Distance culling
    const distance = object.position.distanceTo(object.parent?.position || new THREE.Vector3());
    if (distance > 1000) { // Configurável
      return false;
    }
    
    return true;
  }
  
  cullObjects(objects: THREE.Object3D[]): THREE.Object3D[] {
    return objects.filter(obj => this.isVisible(obj));
  }
}

// Sistema de batching para otimização
class BatchingSystem {
  private instancedMeshes = new Map<string, THREE.InstancedMesh>();
  private batchedGeometries = new Map<string, THREE.BufferGeometry>();
  
  createInstancedMesh(geometry: THREE.BufferGeometry, material: THREE.Material, count: number): THREE.InstancedMesh {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return instancedMesh;
  }
  
  updateInstancedMesh(mesh: THREE.InstancedMesh, transforms: THREE.Matrix4[]): void {
    for (let i = 0; i < transforms.length; i++) {
      mesh.setMatrixAt(i, transforms[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  
  batchGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const mergedGeometry = new THREE.BufferGeometry();
    
    // Implementar merge de geometrias
    // Simplificado para exemplo
    if (geometries.length > 0) {
      return geometries[0].clone();
    }
    
    return mergedGeometry;
  }
  
  dispose(): void {
    this.instancedMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    
    this.batchedGeometries.forEach(geometry => geometry.dispose());
    
    this.instancedMeshes.clear();
    this.batchedGeometries.clear();
  }
}

// Renderizador em tempo real otimizado
export class RealTimeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private config: RenderConfig;
  private performanceConfig: PerformanceConfig;
  private lodConfig: LODConfig;
  private cache: RenderCache;
  private cullingSystem: CullingSystem;
  private batchingSystem: BatchingSystem;
  private metrics: PerformanceMetrics;
  private frameCount = 0;
  private lastTime = 0;
  private adaptiveQualityLevel = 1;
  private renderTargets = new Map<string, THREE.WebGLRenderTarget>();
  
  constructor(
    canvas: HTMLCanvasElement,
    config: Partial<RenderConfig> = {},
    performanceConfig: Partial<PerformanceConfig> = {},
    lodConfig: Partial<LODConfig> = {}
  ) {
    // Configurações padrão otimizadas
    this.config = {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      precision: 'highp',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
      physicallyCorrectLights: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
      outputEncoding: THREE.sRGBEncoding,
      ...config
    };
    
    this.performanceConfig = {
      targetFPS: 60,
      adaptiveQuality: true,
      frustumCulling: true,
      occlusionCulling: false,
      instancedRendering: true,
      batchRendering: true,
      textureCompression: true,
      mipmapGeneration: true,
      geometryMerging: true,
      ...performanceConfig
    };
    
    this.lodConfig = {
      enabled: true,
      distances: [100, 500, 1000],
      qualityLevels: ['high', 'medium', 'low'],
      particleCountMultipliers: [1.0, 0.5, 0.25],
      effectIntensityMultipliers: [1.0, 0.7, 0.4],
      ...lodConfig
    };
    
    this.initializeRenderer(canvas);
    this.cache = new RenderCache();
    this.cullingSystem = new CullingSystem();
    this.batchingSystem = new BatchingSystem();
    this.initializeMetrics();
  }
  
  private initializeRenderer(canvas: HTMLCanvasElement): void {
    // Criar renderer com configurações otimizadas
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.config.antialias,
      alpha: this.config.alpha,
      preserveDrawingBuffer: this.config.preserveDrawingBuffer,
      powerPreference: this.config.powerPreference,
      precision: this.config.precision,
      stencil: this.config.stencil,
      depth: this.config.depth,
      logarithmicDepthBuffer: this.config.logarithmicDepthBuffer
    });
    
    // Configurar renderer
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.physicallyCorrectLights = this.config.physicallyCorrectLights;
    this.renderer.toneMapping = this.config.toneMapping;
    this.renderer.toneMappingExposure = this.config.toneMappingExposure;
    this.renderer.outputEncoding = this.config.outputEncoding;
    
    // Configurar sombras
    if (this.config.shadowMapEnabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = this.config.shadowMapType;
    }
    
    // Otimizações do renderer
    this.renderer.sortObjects = true;
    this.renderer.autoClear = false;
    
    // Criar cena e câmera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 2000);
    this.camera.position.set(0, 0, 10);
  }
  
  private initializeMetrics(): void {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      memoryUsage: {
        geometries: 0,
        textures: 0,
        total: 0
      },
      gpuTime: 0,
      cpuTime: 0
    };
  }
  
  public render(vfxEngine: AdvancedVFXEngine, composition: VFXComposition): void {
    const startTime = performance.now();
    
    // Atualizar métricas de FPS
    this.updateFPSMetrics(startTime);
    
    // Qualidade adaptativa
    if (this.performanceConfig.adaptiveQuality) {
      this.updateAdaptiveQuality();
    }
    
    // Atualizar sistema de culling
    if (this.performanceConfig.frustumCulling) {
      this.cullingSystem.updateFrustum(this.camera);
    }
    
    // Limpar buffers
    this.renderer.clear(true, true, true);
    
    // Renderizar layers em ordem otimizada
    this.renderLayers(vfxEngine, composition);
    
    // Renderizar efeitos pós-processamento
    this.renderPostProcessing(vfxEngine);
    
    // Atualizar métricas de performance
    this.updatePerformanceMetrics(startTime);
  }
  
  private renderLayers(vfxEngine: AdvancedVFXEngine, composition: VFXComposition): void {
    const sortedLayers = [...composition.layers].sort((a, b) => a.zIndex - b.zIndex);
    
    for (const layer of sortedLayers) {
      if (!layer.visible) continue;
      
      // Aplicar LOD baseado na distância
      const lodLevel = this.calculateLODLevel(layer);
      
      // Renderizar layer com otimizações
      this.renderLayerOptimized(vfxEngine, layer, lodLevel);
    }
  }
  
  private renderLayerOptimized(vfxEngine: AdvancedVFXEngine, layer: VFXLayer, lodLevel: number): void {
    switch (layer.type) {
      case 'particle':
        this.renderParticleLayerOptimized(vfxEngine, layer, lodLevel);
        break;
      case 'effect':
        this.renderEffectLayerOptimized(vfxEngine, layer, lodLevel);
        break;
      default:
        // Renderização padrão para outros tipos
        break;
    }
  }
  
  private renderParticleLayerOptimized(vfxEngine: AdvancedVFXEngine, layer: VFXLayer, lodLevel: number): void {
    const particleSystem = vfxEngine.getParticleSystem(layer.id);
    if (!particleSystem) return;
    
    // Aplicar multiplicador de LOD
    const particleMultiplier = this.lodConfig.particleCountMultipliers[lodLevel] || 1.0;
    
    // Usar instanced rendering se disponível
    if (this.performanceConfig.instancedRendering) {
      this.renderInstancedParticles(particleSystem, particleMultiplier);
    } else {
      this.renderBatchedParticles(particleSystem, particleMultiplier);
    }
  }
  
  private renderEffectLayerOptimized(vfxEngine: AdvancedVFXEngine, layer: VFXLayer, lodLevel: number): void {
    const intensityMultiplier = this.lodConfig.effectIntensityMultipliers[lodLevel] || 1.0;
    
    for (const effect of layer.effects) {
      if (!effect.enabled) continue;
      
      // Aplicar efeito com intensidade ajustada por LOD
      const adjustedEffect = {
        ...effect,
        intensity: effect.intensity * intensityMultiplier
      };
      
      this.renderEffectWithShader(adjustedEffect);
    }
  }
  
  private renderInstancedParticles(particleSystem: any, multiplier: number): void {
    // Implementar renderização instanciada de partículas
    // Simplificado para exemplo
  }
  
  private renderBatchedParticles(particleSystem: any, multiplier: number): void {
    // Implementar renderização em lote de partículas
    // Simplificado para exemplo
  }
  
  private renderEffectWithShader(effect: any): void {
    // Implementar renderização de efeitos com shaders otimizados
    // Simplificado para exemplo
  }
  
  private renderPostProcessing(vfxEngine: AdvancedVFXEngine): void {
    // Implementar pós-processamento otimizado
    // Bloom, tone mapping, etc.
  }
  
  private calculateLODLevel(layer: VFXLayer): number {
    if (!this.lodConfig.enabled) return 0;
    
    // Calcular distância da câmera
    const distance = this.camera.position.distanceTo(
      new THREE.Vector3(layer.transform.position.x, layer.transform.position.y, layer.transform.position.z)
    );
    
    // Determinar nível de LOD baseado na distância
    for (let i = 0; i < this.lodConfig.distances.length; i++) {
      if (distance < this.lodConfig.distances[i]) {
        return i;
      }
    }
    
    return this.lodConfig.distances.length - 1;
  }
  
  private updateFPSMetrics(currentTime: number): void {
    this.frameCount++;
    
    if (currentTime - this.lastTime >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
  
  private updateAdaptiveQuality(): void {
    const targetFrameTime = 1000 / this.performanceConfig.targetFPS;
    
    if (this.metrics.frameTime > targetFrameTime * 1.2) {
      // Diminuir qualidade
      this.adaptiveQualityLevel = Math.max(0.5, this.adaptiveQualityLevel - 0.1);
    } else if (this.metrics.frameTime < targetFrameTime * 0.8) {
      // Aumentar qualidade
      this.adaptiveQualityLevel = Math.min(1.0, this.adaptiveQualityLevel + 0.05);
    }
    
    // Aplicar nível de qualidade adaptativa
    this.renderer.setPixelRatio(window.devicePixelRatio * this.adaptiveQualityLevel);
  }
  
  private updatePerformanceMetrics(startTime: number): void {
    const endTime = performance.now();
    this.metrics.frameTime = endTime - startTime;
    this.metrics.cpuTime = this.metrics.frameTime;
    
    // Atualizar métricas do renderer
    const info = this.renderer.info;
    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;
    this.metrics.geometries = info.memory.geometries;
    this.metrics.textures = info.memory.textures;
    this.metrics.programs = info.programs?.length || 0;
    
    // Atualizar métricas de memória do cache
    const cacheUsage = this.cache.getMemoryUsage();
    this.metrics.memoryUsage = {
      geometries: cacheUsage.geometries,
      textures: cacheUsage.textures,
      total: cacheUsage.total
    };
  }
  
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  public getScene(): THREE.Scene {
    return this.scene;
  }
  
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
  
  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  public dispose(): void {
    this.cache.clear();
    this.batchingSystem.dispose();
    
    this.renderTargets.forEach(target => target.dispose());
    this.renderTargets.clear();
    
    this.renderer.dispose();
  }
}

// Presets de configuração para diferentes cenários
export class RenderPresets {
  static getHighQualityConfig(): RenderConfig {
    return {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      precision: 'highp',
      stencil: true,
      depth: true,
      logarithmicDepthBuffer: true,
      physicallyCorrectLights: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
      outputEncoding: THREE.sRGBEncoding
    };
  }
  
  static getPerformanceConfig(): RenderConfig {
    return {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      precision: 'mediump',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
      physicallyCorrectLights: false,
      shadowMapEnabled: false,
      shadowMapType: THREE.BasicShadowMap,
      toneMapping: THREE.LinearToneMapping,
      toneMappingExposure: 1.0,
      outputEncoding: THREE.LinearEncoding
    };
  }
  
  static getMobileConfig(): RenderConfig {
    return {
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
      precision: 'lowp',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
      physicallyCorrectLights: false,
      shadowMapEnabled: false,
      shadowMapType: THREE.BasicShadowMap,
      toneMapping: THREE.LinearToneMapping,
      toneMappingExposure: 1.0,
      outputEncoding: THREE.LinearEncoding
    };
  }
}