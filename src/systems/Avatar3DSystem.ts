// Sistema de Avatar 3D - Engine para criação e animação de avatares
import { EventEmitter } from '../utils/EventEmitter';
import { assetLoader } from '../lib/asset-loader/AssetLoader';
import { avatarPerformanceMonitor } from '../lib/performance/AvatarPerformanceMonitor';

export interface Avatar3DConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  ethnicity: string;
  age: number;
  bodyType: 'slim' | 'athletic' | 'average' | 'heavy';
  height: number;
  features: {
    faceShape: string;
    eyeColor: string;
    hairColor: string;
    hairStyle: string;
    skinTone: string;
    facialHair?: string;
  };
  clothing: {
    style: string;
    colors: string[];
    accessories: string[];
  };
  voice: {
    provider: 'elevenlabs' | 'azure' | 'aws' | 'google';
    voiceId: string;
    language: string;
    accent: string;
    speed: number;
    pitch: number;
  };
}

export interface Animation {
  id: string;
  name: string;
  type: 'gesture' | 'expression' | 'movement' | 'idle' | 'speaking';
  duration: number;
  keyframes: Keyframe3D[];
  loop: boolean;
  blendable: boolean;
}

export interface Keyframe3D {
  time: number;
  bones: { [boneName: string]: Transform3D };
  morphTargets: { [targetName: string]: number };
  properties: { [property: string]: any };
}

export interface Transform3D {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
}

export interface Scene3D {
  id: string;
  name: string;
  avatars: Avatar3DInstance[];
  environment: {
    background: string;
    lighting: LightingSetup;
    camera: CameraSetup;
  };
  animations: Animation[];
}

export interface Avatar3DInstance {
  id: string;
  configId: string;
  position: Transform3D;
  currentAnimation?: string;
  animationQueue: string[];
  isVisible: boolean;
  isLoaded: boolean;
}

export interface LightingSetup {
  ambient: { color: string; intensity: number };
  directional: {
    color: string;
    intensity: number;
    direction: { x: number; y: number; z: number };
  };
  point: {
    color: string;
    intensity: number;
    position: { x: number; y: number; z: number };
  }[];
}

export interface CameraSetup {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
}

class Avatar3DSystem extends EventEmitter {
  private avatarConfigs: Map<string, Avatar3DConfig> = new Map();
  private scenes: Map<string, Scene3D> = new Map();
  private animations: Map<string, Animation> = new Map();
  private activeScene: string | null = null;
  private _isInitialized = false;
  private renderEngine: any = null;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    try {
      await this.initializeRenderEngine();
      await this.loadDefaultAssets();
      this._isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async initializeRenderEngine(): Promise<void> {
    // Simular inicialização do engine 3D (Three.js, Babylon.js, etc.)
    this.renderEngine = {
      scene: null,
      camera: null,
      renderer: null,
      loader: null,
      mixer: null
    };
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.emit('renderEngineInitialized');
  }

  private async loadDefaultAssets(): Promise<void> {
    // Carregar assets padrão (modelos, texturas, animações)
    const defaultAnimations: Animation[] = [
      {
        id: 'idle-neutral',
        name: 'Idle Neutro',
        type: 'idle',
        duration: 5.0,
        keyframes: [],
        loop: true,
        blendable: true
      },
      {
        id: 'speaking-casual',
        name: 'Falando Casual',
        type: 'speaking',
        duration: 2.0,
        keyframes: [],
        loop: true,
        blendable: true
      },
      {
        id: 'gesture-wave',
        name: 'Acenar',
        type: 'gesture',
        duration: 1.5,
        keyframes: [],
        loop: false,
        blendable: false
      },
      {
        id: 'expression-smile',
        name: 'Sorriso',
        type: 'expression',
        duration: 0.5,
        keyframes: [],
        loop: false,
        blendable: true
      }
    ];

    // Carregar configurações de avatar padrão
    const defaultAvatars: Avatar3DConfig[] = [
      {
        id: 'default-male',
        name: 'Avatar Masculino Padrão',
        gender: 'male',
        ethnicity: 'brasileiro',
        age: 30,
        bodyType: 'average',
        height: 1.75,
        features: {
          faceShape: 'oval',
          eyeColor: 'brown',
          hairColor: 'black',
          hairStyle: 'short',
          skinTone: '#D4A574'
        },
        clothing: {
          style: 'business',
          colors: ['#2C3E50', '#FFFFFF'],
          accessories: ['watch']
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: 'voice-male-br',
          language: 'pt-BR',
          accent: 'brasileiro',
          speed: 1.0,
          pitch: 1.0
        }
      },
      {
        id: 'default-female',
        name: 'Avatar Feminino Padrão',
        gender: 'female',
        ethnicity: 'brasileira',
        age: 28,
        bodyType: 'slim',
        height: 1.65,
        features: {
          faceShape: 'heart',
          eyeColor: 'green',
          hairColor: 'blonde',
          hairStyle: 'long',
          skinTone: '#F5DEB3'
        },
        clothing: {
          style: 'professional',
          colors: ['#8B4513', '#FFFFFF'],
          accessories: ['earrings']
        },
        voice: {
          provider: 'azure',
          voiceId: 'voice-female-br',
          language: 'pt-BR',
          accent: 'brasileiro',
          speed: 0.9,
          pitch: 1.1
        }
      }
    ];

    // Adicionar animações
    defaultAnimations.forEach(animation => {
      this.animations.set(animation.id, animation);
    });

    // Adicionar avatares padrão
    defaultAvatars.forEach(avatar => {
      this.avatarConfigs.set(avatar.id, avatar);
    });

    this.emit('defaultAssetsLoaded');
  }

  createAvatarConfig(config: Partial<Avatar3DConfig>): string {
    try {
      // Validate required parameters
      if (!config.name || config.name.trim().length === 0) {
        throw new Error('Nome do avatar é obrigatório');
      }

      if (!config.gender || !['male', 'female', 'neutral'].includes(config.gender)) {
        throw new Error('Gênero deve ser male, female ou neutral');
      }

      // Validate input parameters
      if (config.age !== undefined && (config.age < 0 || config.age > 120)) {
        throw new Error('Idade deve estar entre 0 e 120 anos');
      }

      // Handle height validation - accept both cm and meters
      if (config.height !== undefined) {
        let heightInCm = config.height;
        // If height is less than 10, assume it's in meters and convert to cm
        if (config.height < 10) {
          heightInCm = config.height * 100;
        }

        if (heightInCm < 50 || heightInCm > 250) {
          throw new Error('Altura deve estar entre 50cm e 250cm (ou 0.5m e 2.5m)');
        }
      }

      const avatarId = `avatar-${Date.now()}`;
      const avatarConfig: Avatar3DConfig = {
        id: avatarId,
        name: config.name,
        gender: config.gender,
        ethnicity: config.ethnicity || 'mixed',
        age: config.age || 25,
        bodyType: config.bodyType || 'average',
        height: config.height || 170,
        features: config.features || {
          faceShape: 'oval',
          eyeColor: 'brown',
          hairColor: 'brown',
          hairStyle: 'short',
          skinTone: 'medium'
        },
        clothing: config.clothing || {
          style: 'casual',
          colors: ['#333333', '#666666'],
          accessories: []
        },
        voice: config.voice || {
          provider: 'elevenlabs',
          voiceId: 'default-pt-br',
          language: 'pt-BR',
          accent: 'brazilian',
          speed: 1.0,
          pitch: 1.0
        }
      };

      this.avatarConfigs.set(avatarId, avatarConfig);
      this.emit('avatarConfigCreated', avatarConfig);
      return avatarId;
    } catch (error) {
      console.error('Erro ao criar configuração de avatar:', error);
      this.emit('error', { type: 'avatarConfigCreation', error });
      throw error;
    }
  }

  // Alias for createAvatarConfig for compatibility
  createAvatar(config: Avatar3DConfig): string {
    return this.createAvatarConfig(config);
  }

  // Create custom animation
  createAnimation(animation: Animation): string {
    const animationId = animation.id || `anim-${Date.now()}`;
    this.animations.set(animationId, animation);
    this.emit('animationCreated', animation);
    return animationId;
  }

  // Queue animation for avatar
  queueAnimation(instanceId: string, animationId: string): void {
    // Find avatar instance
    for (const scene of this.scenes.values()) {
      const avatar = scene.avatars.find(a => a.id === instanceId);
      if (avatar) {
        avatar.animationQueue.push(animationId);
        this.emit('animationQueued', { instanceId, animationId, immediate: false });
        break;
      }
    }
  }

  // Public getter for initialization status
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  createScene(name: string): string {
    const sceneId = `scene-${Date.now()}`;
    const scene: Scene3D = {
      id: sceneId,
      name,
      avatars: [],
      environment: {
        background: '#87CEEB', // Sky blue
        lighting: {
          ambient: { color: '#404040', intensity: 0.4 },
          directional: {
            color: '#ffffff',
            intensity: 1.0,
            direction: { x: -1, y: -1, z: -1 }
          },
          point: []
        },
        camera: {
          position: { x: 0, y: 1.6, z: 3 },
          target: { x: 0, y: 1.6, z: 0 },
          fov: 50,
          near: 0.1,
          far: 1000
        }
      },
      animations: []
    };

    this.scenes.set(sceneId, scene);
    this.emit('sceneCreated', scene);
    return sceneId;
  }

  addAvatarToScene(sceneId: string, avatarConfigId: string): string {
    const scene = this.scenes.get(sceneId);
    const avatarConfig = this.avatarConfigs.get(avatarConfigId);
    
    if (!scene || !avatarConfig) {
      throw new Error('Cena ou configuração de avatar não encontrada');
    }

    const instanceId = `instance-${Date.now()}`;
    const avatarInstance: Avatar3DInstance = {
      id: instanceId,
      configId: avatarConfigId,
      position: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 }
      },
      animationQueue: ['idle-neutral'],
      isVisible: true,
      isLoaded: false
    };

    scene.avatars.push(avatarInstance);
    this.emit('avatarAddedToScene', { sceneId, instanceId, avatarInstance });
    
    // Simular carregamento do avatar
    this.loadAvatarInstance(instanceId);
    
    return instanceId;
  }

  private async loadAvatarInstance(instanceId: string): Promise<void> {
    // Simular carregamento do modelo 3D
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Encontrar a instância e marcar como carregada
    for (const scene of this.scenes.values()) {
      const avatar = scene.avatars.find(a => a.id === instanceId);
      if (avatar) {
        avatar.isLoaded = true;
        this.emit('avatarLoaded', { instanceId, avatar });
        break;
      }
    }
  }

  playAnimation(instanceId: string, animationId: string, immediate = false): void {
    const animation = this.animations.get(animationId);
    if (!animation) {
      throw new Error('Animação não encontrada');
    }

    // Encontrar a instância do avatar
    for (const scene of this.scenes.values()) {
      const avatar = scene.avatars.find(a => a.id === instanceId);
      if (avatar) {
        if (immediate) {
          avatar.currentAnimation = animationId;
          avatar.animationQueue = [animationId];
        } else {
          avatar.animationQueue.push(animationId);
        }
        
        this.emit('animationQueued', { instanceId, animationId, immediate });
        break;
      }
    }
  }

  speakText(instanceId: string, text: string, options?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Encontrar configuração do avatar
        let avatarConfig: Avatar3DConfig | undefined;
        for (const scene of this.scenes.values()) {
          const avatar = scene.avatars.find(a => a.id === instanceId);
          if (avatar) {
            avatarConfig = this.avatarConfigs.get(avatar.configId);
            break;
          }
        }

        if (!avatarConfig) {
          throw new Error('Avatar não encontrado');
        }

        // Simular síntese de voz e animação labial
        this.playAnimation(instanceId, 'speaking-casual', true);
        
        const duration = text.length * 100; // 100ms por caractere
        
        setTimeout(() => {
          this.playAnimation(instanceId, 'idle-neutral', true);
          this.emit('speechCompleted', { instanceId, text });
          resolve();
        }, duration);
        
        this.emit('speechStarted', { instanceId, text, duration });
      } catch (error) {
        reject(error);
      }
    });
  }

  updateAvatarPosition(instanceId: string, transform: Transform3D): void {
    for (const scene of this.scenes.values()) {
      const avatar = scene.avatars.find(a => a.id === instanceId);
      if (avatar) {
        avatar.position = transform;
        this.emit('avatarPositionUpdated', { instanceId, transform });
        break;
      }
    }
  }

  setActiveScene(sceneId: string): void {
    if (this.scenes.has(sceneId)) {
      this.activeScene = sceneId;
      this.emit('activeSceneChanged', sceneId);
    }
  }

  renderFrame(): Promise<ImageData> {
    return new Promise((resolve) => {
      // Simular renderização de frame
      const imageData = new ImageData(1920, 1080);
      
      setTimeout(() => {
        this.emit('frameRendered');
        resolve(imageData);
      }, 16); // ~60fps
    });
  }

  getAvatarConfigs(): Avatar3DConfig[] {
    return Array.from(this.avatarConfigs.values());
  }

  getScenes(): Scene3D[] {
    return Array.from(this.scenes.values());
  }

  getAnimations(): Animation[] {
    return Array.from(this.animations.values());
  }

  getActiveScene(): Scene3D | undefined {
    return this.activeScene ? this.scenes.get(this.activeScene) : undefined;
  }

  dispose(): void {
    this.avatarConfigs.clear();
    this.scenes.clear();
    this.animations.clear();
    this.activeScene = null;
    this.renderEngine = null;
    this._isInitialized = false;
    this.emit('disposed');
  }
}

export default Avatar3DSystem;
