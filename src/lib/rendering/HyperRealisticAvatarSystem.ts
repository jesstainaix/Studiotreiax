// Sistema Integrado de Avatares Hiper-Realistas
// Integração completa de todos os subsistemas avançados

import * as THREE from 'three';
import { AdvancedMaterials, DEFAULT_SKIN_CONFIG, DEFAULT_HAIR_CONFIG, DEFAULT_EYE_CONFIG } from './AdvancedMaterials';
import { TextureManager, DEFAULT_TEXTURE_CONFIGS } from './TextureManager';
import { AdvancedLighting, LIGHT_PRESETS } from './AdvancedLighting';
import { FacialAnimationSystem, FACIAL_ANIMATION_PRESETS } from '../animation/FacialAnimationSystem';
import { AvatarPerformanceMonitor } from '../performance/AvatarPerformanceMonitor';
import { HairPhysicsSystem } from '../physics/HairPhysicsSystem';
import { ClothSimulationSystem } from '../physics/ClothSimulationSystem';

export interface HyperRealisticAvatarConfig {
  // Configurações básicas
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  ethnicity: 'caucasian' | 'african' | 'asian' | 'hispanic' | 'mixed';

  // Configurações físicas
  age: number;
  height: number; // metros
  bodyType: 'slim' | 'athletic' | 'average' | 'heavy';

  // Configurações visuais
  quality: 'low' | 'medium' | 'high' | 'ultra';
  enableRayTracing: boolean;
  enableGlobalIllumination: boolean;
  enableSubsurfaceScattering: boolean;
  enableAdvancedLighting: boolean;

  // Configurações de performance
  lodLevels: number;
  textureResolution: 'low' | 'medium' | 'high' | 'ultra';
  shadowQuality: 'off' | 'low' | 'medium' | 'high' | 'ultra';

  // Configurações de animação
  enableFacialAnimation: boolean;
  enableLipSync: boolean;
  enableMicroExpressions: boolean;
  enableMotionCapture: boolean;
}

export interface AvatarComponent {
  name: string;
  mesh: THREE.Object3D;
  material: THREE.Material;
  textures: string[];
  animations: string[];
  lodLevels: THREE.Mesh[];
}

export class HyperRealisticAvatarSystem {
  private static instance: HyperRealisticAvatarSystem;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;

  // Subsistemas
  private materials!: AdvancedMaterials;
  private textures!: TextureManager;
  private lighting!: AdvancedLighting;
  private facialAnimation!: FacialAnimationSystem;
  private performanceMonitor!: AvatarPerformanceMonitor;
  private hairPhysics!: HairPhysicsSystem;
  private clothPhysics!: ClothSimulationSystem;

  // Avatares ativos
  private avatars: Map<string, THREE.Group> = new Map();
  private avatarComponents: Map<string, AvatarComponent[]> = new Map();
  private avatarConfigs: Map<string, HyperRealisticAvatarConfig> = new Map();

  // Estado do sistema
  private isInitialized = false;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;
  private qualitySettings = {
    textureResolution: 'high' as 'low' | 'medium' | 'high' | 'ultra',
    shadowQuality: 'high' as 'off' | 'low' | 'medium' | 'high' | 'ultra',
    lodDistance: 50,
    maxAvatars: 10
  };

  // Cache para otimização
  private componentCache = new Map<string, AvatarComponent>();
  private textureCache = new Map<string, THREE.Texture>();
  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private materialCache = new Map<string, THREE.Material>();

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;

    // Inicialização assíncrona para não bloquear
    this.initializeSubsystems().catch(console.error);
  }

  static getInstance(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera): HyperRealisticAvatarSystem {
    if (!HyperRealisticAvatarSystem.instance) {
      HyperRealisticAvatarSystem.instance = new HyperRealisticAvatarSystem(scene, renderer, camera);
    }
    return HyperRealisticAvatarSystem.instance;
  }

  private async initializeSubsystems(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      return this.initializationPromise || Promise.resolve();
    }

    this.isInitializing = true;

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      // Fase 1: Inicializar componentes críticos
      this.materials = AdvancedMaterials.getInstance();
      this.textures = TextureManager.getInstance();
      
      // Fase 2: Inicializar iluminação (pode ser pesado)
      this.lighting = AdvancedLighting.getInstance(this.scene, this.renderer);
      this.lighting.applyLightingPreset('studio');
      
      // Fase 3: Inicializar componentes de animação
      this.facialAnimation = FacialAnimationSystem.getInstance();
      this.performanceMonitor = new AvatarPerformanceMonitor();
      
      // Fase 4: Inicializar física (em background)
      setTimeout(() => {
        this.initializePhysicsInBackground();
      }, 100);
      
      // Iniciar monitoramento de performance
      this.performanceMonitor.startMonitoring();
      
      this.isInitialized = true;
      this.isInitializing = false;
      
    } catch (error) {
      this.isInitializing = false;
      console.error('Erro na inicialização do sistema de avatares:', error);
      throw error;
    }
  }

  private async initializePhysicsInBackground(): Promise<void> {
    try {
      this.hairPhysics = HairPhysicsSystem.getInstance();
      this.clothPhysics = ClothSimulationSystem.getInstance();
      
      // Iniciar simulações físicas com delay
      await new Promise(resolve => setTimeout(resolve, 500));
      this.hairPhysics.startSimulation();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      this.clothPhysics.startSimulation();
    } catch (error) {
      console.warn('Erro ao inicializar física em background:', error);
    }
  }

  // Criar avatar hiper-realista com cache
  async createHyperRealisticAvatar(config: HyperRealisticAvatarConfig): Promise<string> {
    // Garantir que sistema está inicializado
    await this.initializeSubsystems();

    try {
      // Verificar cache primeiro
      const cacheKey = this.generateCacheKey(config);
      const cachedAvatar = this.avatars.get(cacheKey);
      
      if (cachedAvatar) {
        return cacheKey;
      }

      // Criar grupo principal do avatar
      const avatarGroup = new THREE.Group();
      avatarGroup.name = `avatar_${config.id}`;

      // Criar componentes do avatar com carregamento progressivo
      const components = await this.createAvatarComponentsProgressive(config);

      // Adicionar componentes ao grupo
      components.forEach(component => {
        avatarGroup.add(component.mesh);
      });

      // Configurar LOD se habilitado
      if (config.lodLevels > 1) {
        this.setupLODSystem(avatarGroup, config);
      }

      // Configurar animação facial
      if (config.enableFacialAnimation) {
        this.facialAnimation.setAvatar(avatarGroup);
        this.facialAnimation.updateConfig(FACIAL_ANIMATION_PRESETS.realistic);
      }

      // Adicionar à cena
      this.scene.add(avatarGroup);

      // Registrar avatar com cache
      this.avatars.set(config.id, avatarGroup);
      this.avatarComponents.set(config.id, components);
      this.avatarConfigs.set(config.id, config);
      return config.id;

    } catch (error) {
      console.error(`Erro ao criar avatar ${config.name}:`, error);
      throw error;
    }
  }

  private generateCacheKey(config: HyperRealisticAvatarConfig): string {
    return `${config.gender}_${config.ethnicity}_${config.age}_${config.quality}`;
  }

  private async createAvatarComponentsProgressive(config: HyperRealisticAvatarConfig): Promise<AvatarComponent[]> {
    const components: AvatarComponent[] = [];

    // Carregamento progressivo: componentes essenciais primeiro
    
    // Componente da cabeça (essencial)
    const headComponent = await this.createHeadComponentCached(config);
    components.push(headComponent);

    // Componente dos olhos (essencial)
    const eyesComponent = await this.createEyesComponentCached(config);
    components.push(eyesComponent);

    // Componentes secundários em background
    setTimeout(async () => {
      try {
        
        // Componente do corpo
        const bodyComponent = await this.createBodyComponentCached(config);
        components.push(bodyComponent);

        // Componente da roupa
        const clothingComponent = await this.createClothingComponentCached(config);
        components.push(clothingComponent);

        // Componente dos cabelos (só em qualidade média+)
        if (config.quality !== 'low') {
          const hairComponent = await this.createHairComponentCached(config);
          components.push(hairComponent);
        }
      } catch (error) {
        console.warn('Erro ao carregar componentes secundários:', error);
      }
    }, 100);

    return components;
  }

  private async createHeadComponentCached(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    const cacheKey = `head_${this.generateCacheKey(config)}`;
    
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }

    const component = await this.createHeadComponent(config);
    this.componentCache.set(cacheKey, component);
    return component;
  }

  private async createEyesComponentCached(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    const cacheKey = `eyes_${this.generateCacheKey(config)}`;
    
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }

    const component = await this.createEyesComponent(config);
    this.componentCache.set(cacheKey, component);
    return component;
  }

  private async createBodyComponentCached(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    const cacheKey = `body_${this.generateCacheKey(config)}`;
    
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }

    const component = await this.createBodyComponent(config);
    this.componentCache.set(cacheKey, component);
    return component;
  }

  private async createHairComponentCached(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    const cacheKey = `hair_${this.generateCacheKey(config)}`;
    
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }

    const component = await this.createHairComponent(config);
    this.componentCache.set(cacheKey, component);
    return component;
  }

  private async createClothingComponentCached(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    const cacheKey = `clothing_${this.generateCacheKey(config)}`;
    
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }

    const component = await this.createClothingComponent(config);
    this.componentCache.set(cacheKey, component);
    return component;
  }

  private async createHeadComponent(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    // Criar geometria da cabeça
    const headGeometry = new THREE.SphereGeometry(0.18, 64, 64);

    // Configurar material da pele
    const skinConfig = { ...DEFAULT_SKIN_CONFIG };
    skinConfig.metallic = 0.0;
    skinConfig.roughness = 0.4;
    skinConfig.subsurface = 0.8;
    skinConfig.subsurfaceColor = new THREE.Color(0.8, 0.4, 0.3);

    // Ajustar baseado na etnia
    this.adjustSkinForEthnicity(skinConfig, config.ethnicity);

    const skinMaterial = this.materials.createSkinMaterial(skinConfig);

    // Carregar texturas da pele
    const textureSet = await this.textures.loadTextureSet(`skin_${config.id}`, [
      { ...DEFAULT_TEXTURE_CONFIGS.skin.albedo, url: `/textures/skin/${config.ethnicity}_albedo.jpg` },
      { ...DEFAULT_TEXTURE_CONFIGS.skin.normal, url: `/textures/skin/${config.ethnicity}_normal.jpg` },
      { ...DEFAULT_TEXTURE_CONFIGS.skin.roughness, url: `/textures/skin/${config.ethnicity}_roughness.jpg` }
    ]);

    // Aplicar texturas ao material
    if (textureSet.albedo) skinMaterial.map = textureSet.albedo;
    if (textureSet.normal) skinMaterial.normalMap = textureSet.normal;
    if (textureSet.roughness) skinMaterial.roughnessMap = textureSet.roughness;

    // Criar mesh da cabeça
    const headMesh = new THREE.Mesh(headGeometry, skinMaterial);
    headMesh.position.set(0, 1.4, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headMesh.name = 'head';

    return {
      name: 'head',
      mesh: headMesh,
      material: skinMaterial,
      textures: ['albedo', 'normal', 'roughness'],
      animations: ['facial_expressions', 'lip_sync'],
      lodLevels: []
    };
  }

  private async createBodyComponent(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    // Criar geometria do corpo
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1.2, 16, 32);

    // Material do corpo (pele)
    const bodyConfig = { ...DEFAULT_SKIN_CONFIG };
    this.adjustSkinForEthnicity(bodyConfig, config.ethnicity);
    const bodyMaterial = this.materials.createSkinMaterial(bodyConfig);

    // Criar mesh do corpo
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0.6, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.name = 'body';

    return {
      name: 'body',
      mesh: bodyMesh,
      material: bodyMaterial,
      textures: ['albedo', 'normal'],
      animations: ['body_pose', 'gestures'],
      lodLevels: []
    };
  }

  private async createHairComponent(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    // Geometria do cabelo (simplificada)
    const hairGeometry = new THREE.SphereGeometry(0.19, 32, 32);

    // Material do cabelo
    const hairConfig = { ...DEFAULT_HAIR_CONFIG };
    hairConfig.metallic = 0.0;
    hairConfig.roughness = 0.3;
    hairConfig.anisotropic = 0.8;

    const hairMaterial = this.materials.createHairMaterial(hairConfig);

    // Carregar texturas do cabelo
    const textureSet = await this.textures.loadTextureSet(`hair_${config.id}`, [
      { ...DEFAULT_TEXTURE_CONFIGS.hair.albedo, url: '/textures/hair/default_albedo.jpg' },
      { ...DEFAULT_TEXTURE_CONFIGS.hair.normal, url: '/textures/hair/default_normal.jpg' }
    ]);

    if (textureSet.albedo) hairMaterial.map = textureSet.albedo;
    if (textureSet.normal) hairMaterial.normalMap = textureSet.normal;

    // Mesh do cabelo
    const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
    hairMesh.position.set(0, 1.45, 0);
    hairMesh.castShadow = true;
    hairMesh.name = 'hair';

    return {
      name: 'hair',
      mesh: hairMesh,
      material: hairMaterial,
      textures: ['albedo', 'normal'],
      animations: ['hair_physics'],
      lodLevels: []
    };
  }

  private async createEyesComponent(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    const eyesGroup = new THREE.Group();

    // Configuração dos olhos
    const eyeConfig = { ...DEFAULT_EYE_CONFIG };
    const eyeMaterial = this.materials.createEyeMaterial(eyeConfig);

    // Carregar texturas dos olhos
    const textureSet = await this.textures.loadTextureSet(`eyes_${config.id}`, [
      { ...DEFAULT_TEXTURE_CONFIGS.eyes.albedo, url: '/textures/eyes/iris_albedo.jpg' },
      { ...DEFAULT_TEXTURE_CONFIGS.eyes.normal, url: '/textures/eyes/cornea_normal.jpg' }
    ]);

    if (textureSet.albedo) eyeMaterial.map = textureSet.albedo;
    if (textureSet.normal) eyeMaterial.normalMap = textureSet.normal;

    // Olho esquerdo
    const leftEyeGeometry = new THREE.SphereGeometry(0.025, 16, 16);
    const leftEye = new THREE.Mesh(leftEyeGeometry, eyeMaterial);
    leftEye.position.set(-0.06, 1.45, 0.15);
    eyesGroup.add(leftEye);

    // Olho direito
    const rightEyeGeometry = new THREE.SphereGeometry(0.025, 16, 16);
    const rightEye = new THREE.Mesh(rightEyeGeometry, eyeMaterial);
    rightEye.position.set(0.06, 1.45, 0.15);
    eyesGroup.add(rightEye);

    eyesGroup.name = 'eyes';

    return {
      name: 'eyes',
      mesh: eyesGroup,
      material: eyeMaterial,
      textures: ['albedo', 'normal'],
      animations: ['eye_tracking', 'blinking'],
      lodLevels: []
    };
  }

  private async createClothingComponent(config: HyperRealisticAvatarConfig): Promise<AvatarComponent> {
    // Geometria da roupa (simplificada)
    const clothingGeometry = new THREE.CapsuleGeometry(0.38, 1.3, 16, 32);

    // Material da roupa
    const clothingMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x4A90E2),
      metalness: 0.0,
      roughness: 0.8,
      transparent: false
    });

    // Mesh da roupa
    const clothingMesh = new THREE.Mesh(clothingGeometry, clothingMaterial);
    clothingMesh.position.set(0, 0.6, 0);
    clothingMesh.castShadow = true;
    clothingMesh.receiveShadow = true;
    clothingMesh.name = 'clothing';

    return {
      name: 'clothing',
      mesh: clothingMesh,
      material: clothingMaterial,
      textures: ['albedo'],
      animations: ['cloth_physics'],
      lodLevels: []
    };
  }

  private adjustSkinForEthnicity(skinConfig: any, ethnicity: string): void {
    // Ajustes baseados na etnia para realismo
    const ethnicityAdjustments = {
      caucasian: { melanin: 20, hemoglobin: 60 },
      african: { melanin: 80, hemoglobin: 70 },
      asian: { melanin: 40, hemoglobin: 50 },
      hispanic: { melanin: 35, hemoglobin: 55 },
      mixed: { melanin: 30, hemoglobin: 60 }
    };

    const adjustment = ethnicityAdjustments[ethnicity as keyof typeof ethnicityAdjustments];
    if (adjustment) {
      skinConfig.melanin = adjustment.melanin;
      skinConfig.hemoglobin = adjustment.hemoglobin;
    }
  }

  private setupLODSystem(avatarGroup: THREE.Group, config: HyperRealisticAvatarConfig): void {
    // Sistema de Level of Detail
    // Em produção, seria implementado com LOD objects do Three.js
  }

  // Sistema de animação facial
  playFacialExpression(avatarId: string, expression: string): void {
    if (!this.avatarConfigs.get(avatarId)?.enableFacialAnimation) return;

    this.facialAnimation.playExpression(expression);
  }

  playLipSync(avatarId: string, text: string, audioDuration: number): void {
    if (!this.avatarConfigs.get(avatarId)?.enableLipSync) return;

    this.facialAnimation.playLipSync(text, audioDuration);
  }

  // Sistema de iluminação adaptativa
  updateLightingForAvatar(avatarId: string): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    // Atualizar iluminação baseada na posição do avatar
    this.lighting.updateAdaptiveLighting(this.camera);
  }

  // Sistema de performance
  optimizeForPerformance(): void {

    // Otimizar materiais
    this.materials.optimizeMaterial = this.materials.optimizeMaterial.bind(this.materials);

    // Otimizar texturas
    this.textures.optimizeForPerformance();

    // Otimizar iluminação
    this.lighting.optimizeForPerformance();

    // Ajustar configurações de qualidade
    this.qualitySettings.textureResolution = 'medium';
    this.qualitySettings.shadowQuality = 'medium';
  }

  optimizeForQuality(): void {

    // Aumentar qualidade de materiais
    // Aumentar resolução de texturas
    this.textures.optimizeForQuality();

    // Melhorar iluminação
    this.lighting.optimizeForQuality();

    // Configurações de ultra qualidade
    this.qualitySettings.textureResolution = 'ultra';
    this.qualitySettings.shadowQuality = 'ultra';
  }

  // Método principal de atualização
  update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // Atualizar animações faciais
    this.facialAnimation.update(deltaTime);

    // Atualizar física de cabelo
    this.hairPhysics.update(deltaTime);

    // Atualizar física de tecido
    this.clothPhysics.update(deltaTime);

    // Atualizar iluminação adaptativa
    this.lighting.updateAdaptiveLighting(this.camera);

    // Atualizar texturas (streaming) - extrair meshes dos avatares
    const allMeshes: THREE.Mesh[] = [];
    this.avatars.forEach(avatarGroup => {
      avatarGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          allMeshes.push(child);
        }
      });
    });
    this.textures.updateStreaming(this.camera, allMeshes);

    // Monitorar performance
    const performanceReport = this.performanceMonitor.getPerformanceReport();

    // Auto-otimização baseada na performance
    if (performanceReport.status === 'critical') {
      this.optimizeForPerformance();
    }
  }

  // Métodos de consulta
  getAvatar(avatarId: string): THREE.Group | null {
    return this.avatars.get(avatarId) || null;
  }

  getAvatarConfig(avatarId: string): HyperRealisticAvatarConfig | null {
    return this.avatarConfigs.get(avatarId) || null;
  }

  getPerformanceReport(): any {
    return this.performanceMonitor.getPerformanceReport();
  }

  // Métodos de controle
  setAvatarPosition(avatarId: string, position: THREE.Vector3): void {
    const avatar = this.avatars.get(avatarId);
    if (avatar) {
      avatar.position.copy(position);
    }
  }

  setAvatarRotation(avatarId: string, rotation: THREE.Euler): void {
    const avatar = this.avatars.get(avatarId);
    if (avatar) {
      avatar.rotation.copy(rotation);
    }
  }

  // Sistema de presets
  createAvatarFromPreset(preset: 'professional' | 'casual' | 'fantasy' | 'realistic'): Promise<string> {
    const presets = {
      professional: {
        id: `avatar_${Date.now()}`,
        name: 'Profissional',
        gender: 'neutral' as const,
        ethnicity: 'mixed' as const,
        age: 30,
        height: 1.75,
        bodyType: 'athletic' as const,
        quality: 'high' as const,
        enableRayTracing: true,
        enableGlobalIllumination: true,
        enableSubsurfaceScattering: true,
        enableAdvancedLighting: true,
        lodLevels: 3,
        textureResolution: 'high' as const,
        shadowQuality: 'high' as const,
        enableFacialAnimation: true,
        enableLipSync: true,
        enableMicroExpressions: true,
        enableMotionCapture: false
      },
      casual: {
        id: `avatar_${Date.now()}`,
        name: 'Casual',
        gender: 'neutral' as const,
        ethnicity: 'caucasian' as const,
        age: 25,
        height: 1.70,
        bodyType: 'average' as const,
        quality: 'medium' as const,
        enableRayTracing: false,
        enableGlobalIllumination: true,
        enableSubsurfaceScattering: true,
        enableAdvancedLighting: true,
        lodLevels: 2,
        textureResolution: 'medium' as const,
        shadowQuality: 'medium' as const,
        enableFacialAnimation: true,
        enableLipSync: true,
        enableMicroExpressions: false,
        enableMotionCapture: false
      },
      fantasy: {
        id: `avatar_${Date.now()}`,
        name: 'Fantasia',
        gender: 'neutral' as const,
        ethnicity: 'mixed' as const,
        age: 100,
        height: 1.80,
        bodyType: 'athletic' as const,
        quality: 'ultra' as const,
        enableRayTracing: true,
        enableGlobalIllumination: true,
        enableSubsurfaceScattering: true,
        enableAdvancedLighting: true,
        lodLevels: 4,
        textureResolution: 'ultra' as const,
        shadowQuality: 'ultra' as const,
        enableFacialAnimation: true,
        enableLipSync: true,
        enableMicroExpressions: true,
        enableMotionCapture: true
      },
      realistic: {
        id: `avatar_${Date.now()}`,
        name: 'Realista',
        gender: 'neutral' as const,
        ethnicity: 'mixed' as const,
        age: 28,
        height: 1.72,
        bodyType: 'average' as const,
        quality: 'ultra' as const,
        enableRayTracing: true,
        enableGlobalIllumination: true,
        enableSubsurfaceScattering: true,
        enableAdvancedLighting: true,
        lodLevels: 3,
        textureResolution: 'ultra' as const,
        shadowQuality: 'ultra' as const,
        enableFacialAnimation: true,
        enableLipSync: true,
        enableMicroExpressions: true,
        enableMotionCapture: false
      }
    };

    const config = presets[preset];
    return this.createHyperRealisticAvatar(config);
  }

  // Limpeza e gerenciamento de recursos
  removeAvatar(avatarId: string): void {
    const avatar = this.avatars.get(avatarId);
    if (avatar) {
      this.scene.remove(avatar);

      // Limpar componentes
      const components = this.avatarComponents.get(avatarId);
      if (components) {
        components.forEach(component => {
          if (component.material) {
            component.material.dispose();
          }
          if (component.mesh instanceof THREE.Mesh && component.mesh.geometry) {
            component.mesh.geometry.dispose();
          }
        });
      }

      // Remover registros
      this.avatars.delete(avatarId);
      this.avatarComponents.delete(avatarId);
      this.avatarConfigs.delete(avatarId);
    }
  }

  clearAllAvatars(): void {
    const avatarIds = Array.from(this.avatars.keys());
    avatarIds.forEach(id => this.removeAvatar(id));
  }

  // Estatísticas e debug
  getStats(): {
    totalAvatars: number;
    totalMaterials: number;
    totalTextures: number;
    memoryUsage: number;
    performanceStatus: string;
  } {
    const performanceReport = this.performanceMonitor.getPerformanceReport();

    return {
      totalAvatars: this.avatars.size,
      totalMaterials: this.materials ? 1 : 0, // Simplificado
      totalTextures: this.textures.getCacheSize(),
      memoryUsage: this.textures.getMemoryUsage(),
      performanceStatus: performanceReport.status
    };
  }

  // Limpeza completa
  dispose(): void {
    this.clearAllAvatars();

    // Limpar subsistemas
    this.materials.clearCache();
    this.textures.dispose();
    this.lighting.dispose();
    this.facialAnimation.dispose();
    this.hairPhysics.dispose();
    this.clothPhysics.dispose();
    this.performanceMonitor.dispose();

    this.isInitialized = false;
  }
}

// Função utilitária para criar avatar rapidamente
export async function createQuickAvatar(
  system: HyperRealisticAvatarSystem,
  name: string,
  preset: 'professional' | 'casual' | 'fantasy' | 'realistic' = 'realistic'
): Promise<string> {
  return await system.createAvatarFromPreset(preset);
}

// Função de teste para verificar a criação de avatares
export async function testAvatarCreation(): Promise<void> {

  try {
    // Criar uma cena Three.js básica para teste
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    // Inicializar sistema
    const avatarSystem = HyperRealisticAvatarSystem.getInstance(scene, renderer, camera);

    // Criar avatar de teste
    const avatarId = await createQuickAvatar(avatarSystem, 'Avatar Teste', 'realistic');

    // Verificar se o avatar foi criado
    const avatar = avatarSystem.getAvatar(avatarId);
    if (avatar) {
    }

    // Obter estatísticas
    const stats = avatarSystem.getStats();

  } catch (error) {
    console.error('Erro durante o teste de criação de avatar:', error);
  }
}
