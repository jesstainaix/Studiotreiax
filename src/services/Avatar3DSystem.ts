// Sistema de avatares 3D hiper-realistas com suporte GLTF/VRM
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

interface AvatarConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  ethnicity: 'caucasian' | 'african' | 'asian' | 'hispanic' | 'mixed';
  ageRange: 'child' | 'teen' | 'young_adult' | 'adult' | 'senior';
  bodyType: 'slim' | 'athletic' | 'average' | 'heavy' | 'muscular';
  height: number; // em metros
  customization: AvatarCustomization;
}

interface AvatarCustomization {
  face: {
    shape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
    skinTone: string; // hex color
    eyeColor: string;
    eyeShape: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned';
    eyebrowStyle: 'natural' | 'arched' | 'straight' | 'thick' | 'thin';
    noseShape: 'straight' | 'button' | 'roman' | 'aquiline' | 'snub';
    lipShape: 'full' | 'thin' | 'bow' | 'wide' | 'heart';
    lipColor: string;
    cheekbones: 'high' | 'low' | 'prominent' | 'subtle';
    jawline: 'sharp' | 'soft' | 'square' | 'round';
    wrinkles: number; // 0-100
    freckles: number; // 0-100
    scars: ScarConfig[];
    tattoos: TattooConfig[];
  };
  hair: {
    style: string;
    color: string;
    length: 'bald' | 'buzz' | 'short' | 'medium' | 'long' | 'very_long';
    texture: 'straight' | 'wavy' | 'curly' | 'coily';
    thickness: 'thin' | 'medium' | 'thick';
    highlights: string[];
  };
  body: {
    muscleMass: number; // 0-100
    bodyFat: number; // 0-100
    posture: 'straight' | 'slouched' | 'confident' | 'relaxed';
    skinTexture: 'smooth' | 'rough' | 'aged' | 'scarred';
    birthmarks: BirthmarkConfig[];
  };
  clothing: {
    outfit: string;
    style: 'casual' | 'formal' | 'business' | 'sporty' | 'alternative';
    colors: string[];
    accessories: AccessoryConfig[];
  };
}

interface ScarConfig {
  id: string;
  type: 'cut' | 'burn' | 'surgical' | 'acne';
  position: THREE.Vector3;
  size: number;
  intensity: number;
}

interface TattooConfig {
  id: string;
  design: string;
  position: THREE.Vector3;
  size: number;
  color: string;
  style: 'traditional' | 'realistic' | 'tribal' | 'geometric';
}

interface BirthmarkConfig {
  id: string;
  type: 'mole' | 'port_wine' | 'cafe_au_lait' | 'mongolian_spot';
  position: THREE.Vector3;
  size: number;
  color: string;
}

interface AccessoryConfig {
  id: string;
  type: 'glasses' | 'jewelry' | 'hat' | 'watch' | 'bag';
  model: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
}

interface AnimationConfig {
  id: string;
  name: string;
  type: 'idle' | 'walk' | 'run' | 'gesture' | 'emotion' | 'speech';
  duration: number;
  loop: boolean;
  blendMode: 'replace' | 'additive' | 'multiply';
  weight: number;
  speed: number;
}

interface VoiceConfig {
  id: string;
  name: string;
  language: 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR';
  gender: 'male' | 'female';
  age: 'child' | 'young' | 'adult' | 'elderly';
  accent: string;
  pitch: number; // -50 to 50
  speed: number; // 0.5 to 2.0
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm';
  provider: 'azure' | 'google' | 'amazon' | 'elevenlabs';
}

interface ExpressionConfig {
  id: string;
  name: string;
  type: 'emotion' | 'phoneme' | 'custom';
  blendShapes: Map<string, number>;
  duration: number;
  intensity: number;
}

class Avatar3DSystem {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private avatars: Map<string, THREE.Group> = new Map();
  private animations: Map<string, THREE.AnimationMixer> = new Map();
  private expressions: Map<string, ExpressionConfig> = new Map();
  private voices: Map<string, VoiceConfig> = new Map();
  private isInitialized = false;
  private avatarLibrary: Map<string, AvatarConfig> = new Map();
  private animationLibrary: Map<string, AnimationConfig> = new Map();
  private clothingLibrary: Map<string, any> = new Map();
  private hairLibrary: Map<string, any> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    // Inicializar Three.js
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true
    });
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    
    this.setupRenderer();
    this.setupLighting();
    this.setupCamera();
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  private setupLighting(): void {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // Luz direcional principal
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Luz de preenchimento
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    // Luz de contorno
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 5, -10);
    this.scene.add(rimLight);
  }

  private setupCamera(): void {
    this.camera.position.set(0, 1.6, 3);
    this.camera.lookAt(0, 1.6, 0);
  }

  async initialize(): Promise<void> {
    try {
      // Carregar biblioteca de avatares
      await this.loadAvatarLibrary();
      
      // Carregar biblioteca de animações
      await this.loadAnimationLibrary();
      
      // Carregar biblioteca de roupas
      await this.loadClothingLibrary();
      
      // Carregar biblioteca de cabelos
      await this.loadHairLibrary();
      
      // Carregar vozes brasileiras
      await this.loadBrazilianVoices();
      
      // Carregar expressões faciais
      await this.loadFacialExpressions();
      
      this.isInitialized = true;
      
    } catch (error) {
      throw new Error(`Erro ao inicializar sistema de avatares: ${error}`);
    }
  }

  private async loadAvatarLibrary(): Promise<void> {
    // Biblioteca de avatares pré-definidos
    const avatars: AvatarConfig[] = [
      {
        id: 'brazilian-male-1',
        name: 'João Silva',
        gender: 'male',
        ethnicity: 'mixed',
        ageRange: 'adult',
        bodyType: 'athletic',
        height: 1.75,
        customization: {
          face: {
            shape: 'oval',
            skinTone: '#D4A574',
            eyeColor: '#8B4513',
            eyeShape: 'almond',
            eyebrowStyle: 'natural',
            noseShape: 'straight',
            lipShape: 'full',
            lipColor: '#CD5C5C',
            cheekbones: 'prominent',
            jawline: 'sharp',
            wrinkles: 10,
            freckles: 0,
            scars: [],
            tattoos: []
          },
          hair: {
            style: 'short-wavy',
            color: '#2C1810',
            length: 'short',
            texture: 'wavy',
            thickness: 'thick',
            highlights: []
          },
          body: {
            muscleMass: 70,
            bodyFat: 15,
            posture: 'confident',
            skinTexture: 'smooth',
            birthmarks: []
          },
          clothing: {
            outfit: 'business-casual',
            style: 'business',
            colors: ['#2C3E50', '#FFFFFF'],
            accessories: []
          }
        }
      },
      {
        id: 'brazilian-female-1',
        name: 'Maria Santos',
        gender: 'female',
        ethnicity: 'mixed',
        ageRange: 'adult',
        bodyType: 'average',
        height: 1.65,
        customization: {
          face: {
            shape: 'heart',
            skinTone: '#E8B896',
            eyeColor: '#654321',
            eyeShape: 'almond',
            eyebrowStyle: 'arched',
            noseShape: 'button',
            lipShape: 'bow',
            lipColor: '#DC143C',
            cheekbones: 'high',
            jawline: 'soft',
            wrinkles: 5,
            freckles: 15,
            scars: [],
            tattoos: []
          },
          hair: {
            style: 'long-curly',
            color: '#4A2C17',
            length: 'long',
            texture: 'curly',
            thickness: 'thick',
            highlights: ['#8B4513']
          },
          body: {
            muscleMass: 40,
            bodyFat: 25,
            posture: 'confident',
            skinTexture: 'smooth',
            birthmarks: []
          },
          clothing: {
            outfit: 'professional',
            style: 'business',
            colors: ['#8B0000', '#FFFFFF'],
            accessories: []
          }
        }
      }
    ];

    avatars.forEach(avatar => {
      this.avatarLibrary.set(avatar.id, avatar);
    });
  }

  private async loadAnimationLibrary(): Promise<void> {
    const animations: AnimationConfig[] = [
      {
        id: 'idle-neutral',
        name: 'Parado Neutro',
        type: 'idle',
        duration: 5.0,
        loop: true,
        blendMode: 'replace',
        weight: 1.0,
        speed: 1.0
      },
      {
        id: 'walk-casual',
        name: 'Caminhada Casual',
        type: 'walk',
        duration: 2.0,
        loop: true,
        blendMode: 'replace',
        weight: 1.0,
        speed: 1.0
      },
      {
        id: 'gesture-hello',
        name: 'Acenar Olá',
        type: 'gesture',
        duration: 3.0,
        loop: false,
        blendMode: 'additive',
        weight: 0.8,
        speed: 1.0
      },
      {
        id: 'emotion-happy',
        name: 'Feliz',
        type: 'emotion',
        duration: 2.0,
        loop: false,
        blendMode: 'additive',
        weight: 0.6,
        speed: 1.0
      },
      {
        id: 'speech-talking',
        name: 'Falando',
        type: 'speech',
        duration: 1.0,
        loop: true,
        blendMode: 'additive',
        weight: 0.5,
        speed: 1.0
      }
    ];

    animations.forEach(animation => {
      this.animationLibrary.set(animation.id, animation);
    });
  }

  private async loadClothingLibrary(): Promise<void> {
    // Simular carregamento de roupas
    const clothing = [
      { id: 'business-suit', name: 'Terno Executivo', category: 'formal' },
      { id: 'casual-shirt', name: 'Camisa Casual', category: 'casual' },
      { id: 'dress-formal', name: 'Vestido Formal', category: 'formal' },
      { id: 'jeans-tshirt', name: 'Jeans e Camiseta', category: 'casual' },
      { id: 'lab-coat', name: 'Jaleco Médico', category: 'professional' }
    ];

    clothing.forEach(item => {
      this.clothingLibrary.set(item.id, item);
    });
  }

  private async loadHairLibrary(): Promise<void> {
    // Simular carregamento de cabelos
    const hairstyles = [
      { id: 'short-straight', name: 'Curto Liso', gender: 'unisex' },
      { id: 'long-wavy', name: 'Longo Ondulado', gender: 'female' },
      { id: 'buzz-cut', name: 'Raspado', gender: 'male' },
      { id: 'afro-curly', name: 'Afro Cacheado', gender: 'unisex' },
      { id: 'bob-cut', name: 'Chanel', gender: 'female' }
    ];

    hairstyles.forEach(style => {
      this.hairLibrary.set(style.id, style);
    });
  }

  private async loadBrazilianVoices(): Promise<void> {
    const voices: VoiceConfig[] = [
      {
        id: 'br-male-adult-1',
        name: 'Carlos (Paulista)',
        language: 'pt-BR',
        gender: 'male',
        age: 'adult',
        accent: 'paulista',
        pitch: 0,
        speed: 1.0,
        emotion: 'neutral',
        provider: 'azure'
      },
      {
        id: 'br-female-adult-1',
        name: 'Ana (Carioca)',
        language: 'pt-BR',
        gender: 'female',
        age: 'adult',
        accent: 'carioca',
        pitch: 5,
        speed: 1.0,
        emotion: 'neutral',
        provider: 'azure'
      },
      {
        id: 'br-male-young-1',
        name: 'Pedro (Mineiro)',
        language: 'pt-BR',
        gender: 'male',
        age: 'young',
        accent: 'mineiro',
        pitch: 10,
        speed: 1.1,
        emotion: 'neutral',
        provider: 'google'
      },
      {
        id: 'br-female-elderly-1',
        name: 'Dona Rosa (Nordestina)',
        language: 'pt-BR',
        gender: 'female',
        age: 'elderly',
        accent: 'nordestino',
        pitch: -5,
        speed: 0.9,
        emotion: 'calm',
        provider: 'amazon'
      }
    ];

    voices.forEach(voice => {
      this.voices.set(voice.id, voice);
    });
  }

  private async loadFacialExpressions(): Promise<void> {
    const expressions: ExpressionConfig[] = [
      {
        id: 'happy',
        name: 'Feliz',
        type: 'emotion',
        blendShapes: new Map([
          ['mouthSmile', 0.8],
          ['eyeSquintLeft', 0.3],
          ['eyeSquintRight', 0.3],
          ['cheekPuff', 0.2]
        ]),
        duration: 1.0,
        intensity: 1.0
      },
      {
        id: 'sad',
        name: 'Triste',
        type: 'emotion',
        blendShapes: new Map([
          ['mouthFrown', 0.7],
          ['browDownLeft', 0.5],
          ['browDownRight', 0.5],
          ['eyeWideLeft', -0.3],
          ['eyeWideRight', -0.3]
        ]),
        duration: 1.0,
        intensity: 1.0
      },
      {
        id: 'surprised',
        name: 'Surpreso',
        type: 'emotion',
        blendShapes: new Map([
          ['mouthOpen', 0.6],
          ['eyeWideLeft', 0.8],
          ['eyeWideRight', 0.8],
          ['browUpLeft', 0.7],
          ['browUpRight', 0.7]
        ]),
        duration: 0.5,
        intensity: 1.0
      }
    ];

    expressions.forEach(expression => {
      this.expressions.set(expression.id, expression);
    });
  }

  async createAvatar(config: AvatarConfig): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Sistema não inicializado');
    }

    try {
      // Carregar modelo base
      const baseModel = await this.loadBaseModel(config);
      
      // Aplicar customizações
      await this.applyCustomizations(baseModel, config.customization);
      
      // Configurar animações
      const mixer = new THREE.AnimationMixer(baseModel);
      this.animations.set(config.id, mixer);
      
      // Adicionar à cena
      this.scene.add(baseModel);
      this.avatars.set(config.id, baseModel);
      
      return config.id;
      
    } catch (error) {
      throw new Error(`Erro ao criar avatar: ${error}`);
    }
  }

  private async loadBaseModel(config: AvatarConfig): Promise<THREE.Group> {
    try {
      // Tentar carregar modelo GLTF/VRM primeiro
      const modelUrl = this.getModelUrlForConfig(config);
      if (modelUrl) {
        return await this.loadGLTFModel(modelUrl, config);
      }

      // Fallback para modelo procedural se não houver GLTF
      return await this.createProceduralModel(config);
    } catch (error) {
      console.warn('Erro ao carregar modelo GLTF, usando fallback procedural:', error);
      return await this.createProceduralModel(config);
    }
  }

  private getModelUrlForConfig(config: AvatarConfig): string | null {
    // Mapeamento de configurações para URLs de modelos
    const modelMap: { [key: string]: string } = {
      'brazilian-male-1': '/models/avatars/brazilian-male-1.glb',
      'brazilian-female-1': '/models/avatars/brazilian-female-1.glb',
      // Adicionar mais mapeamentos conforme necessário
    };

    return modelMap[config.id] || null;
  }

  private async loadGLTFModel(modelUrl: string, config: AvatarConfig): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      // Configurar Draco loader para compressão
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);

      // Configurar KTX2 loader para texturas comprimidas
      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('/basis/');
      loader.setKTX2Loader(ktx2Loader);

      loader.load(
        modelUrl,
        (gltf: any) => {
          const model = gltf.scene;

          // Aplicar transformações básicas
          model.scale.setScalar(1.0);
          model.position.set(0, 0, 0);

          // Configurar sombras
          model.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              // Aplicar material personalizado se necessário
              if (child.material instanceof THREE.MeshStandardMaterial) {
                // Manter materiais originais mas ajustar tons de pele
                if (child.name.includes('head') || child.name.includes('face')) {
                  child.material.color.setHex(parseInt(config.customization.face.skinTone.replace('#', ''), 16));
                }
              }
            }
          });

          // Configurar animações se disponíveis
          if (gltf.animations && gltf.animations.length > 0) {
            // Animações serão configuradas no método createAvatar
          }

          resolve(model);
        },
        (progress: any) => {
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  private async createProceduralModel(config: AvatarConfig): Promise<THREE.Group> {
    const group = new THREE.Group();

    // Corpo principal com geometria melhorada
    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1.2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: config.customization.clothing.colors[0] || '#4A90E2',
      roughness: 0.8,
      metalness: 0.1
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabeça com geometria mais detalhada
    const headGeometry = new THREE.SphereGeometry(0.18, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: config.customization.face.skinTone,
      roughness: 0.7,
      metalness: 0.0
    });

    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Olhos
    const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: config.customization.face.eyeColor,
      roughness: 0.1,
      metalness: 0.0
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.06, 1.45, 0.15);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.06, 1.45, 0.15);
    group.add(rightEye);

    // Braços
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 6, 12);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: config.customization.face.skinTone,
      roughness: 0.8,
      metalness: 0.1
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.8, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.8, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Pernas
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8, 8, 16);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: '#2C3E50',
      roughness: 0.9,
      metalness: 0.0
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, -0.4, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, -0.4, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return group;
  }

  private async applyCustomizations(
    model: THREE.Group, 
    customization: AvatarCustomization
  ): Promise<void> {
    // Aplicar customizações faciais
    await this.applyFacialCustomizations(model, customization.face);
    
    // Aplicar cabelo
    await this.applyHair(model, customization.hair);
    
    // Aplicar roupas
    await this.applyClothing(model, customization.clothing);
    
    // Aplicar modificações corporais
    await this.applyBodyCustomizations(model, customization.body);
  }

  private async applyFacialCustomizations(
    model: THREE.Group, 
    face: AvatarCustomization['face']
  ): Promise<void> {
    // Encontrar mesh da cabeça
    const head = model.children.find(child => 
      child.position.y > 0.8
    ) as THREE.Mesh;
    
    if (head && head.material instanceof THREE.MeshStandardMaterial) {
      head.material.color.setHex(parseInt(face.skinTone.replace('#', ''), 16));
    }
    
    // Aplicar cicatrizes
    face.scars.forEach(scar => {
      this.applyScar(model, scar);
    });
    
    // Aplicar tatuagens
    face.tattoos.forEach(tattoo => {
      this.applyTattoo(model, tattoo);
    });
  }

  private async applyHair(
    model: THREE.Group, 
    hair: AvatarCustomization['hair']
  ): Promise<void> {
    // Simular aplicação de cabelo
    const hairGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const hairMaterial = new THREE.MeshStandardMaterial({ 
      color: hair.color 
    });
    const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
    hairMesh.position.y = 0.9;
    hairMesh.castShadow = true;
    
    model.add(hairMesh);
  }

  private async applyClothing(
    model: THREE.Group, 
    clothing: AvatarCustomization['clothing']
  ): Promise<void> {
    // Simular aplicação de roupas
    const body = model.children[0] as THREE.Mesh;
    if (body && body.material instanceof THREE.MeshStandardMaterial) {
      body.material.color.setHex(
        parseInt(clothing.colors[0]?.replace('#', '') || 'FFFFFF', 16)
      );
    }
  }

  private async applyBodyCustomizations(
    model: THREE.Group, 
    body: AvatarCustomization['body']
  ): Promise<void> {
    // Aplicar modificações corporais baseadas na configuração
    const bodyMesh = model.children[0];
    if (bodyMesh) {
      // Ajustar escala baseada na massa muscular
      const scale = 1 + (body.muscleMass / 100) * 0.2;
      bodyMesh.scale.x = scale;
      bodyMesh.scale.z = scale;
    }
  }

  private applyScar(model: THREE.Group, scar: ScarConfig): void {
    // Simular aplicação de cicatriz
    const scarGeometry = new THREE.PlaneGeometry(scar.size * 0.01, scar.size * 0.005);
    const scarMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8B4513,
      transparent: true,
      opacity: scar.intensity / 100
    });
    const scarMesh = new THREE.Mesh(scarGeometry, scarMaterial);
    scarMesh.position.copy(scar.position);
    
    model.add(scarMesh);
  }

  private applyTattoo(model: THREE.Group, tattoo: TattooConfig): void {
    // Simular aplicação de tatuagem
    const tattooGeometry = new THREE.PlaneGeometry(tattoo.size * 0.01, tattoo.size * 0.01);
    const tattooMaterial = new THREE.MeshBasicMaterial({ 
      color: tattoo.color,
      transparent: true,
      opacity: 0.8
    });
    const tattooMesh = new THREE.Mesh(tattooGeometry, tattooMaterial);
    tattooMesh.position.copy(tattoo.position);
    
    model.add(tattooMesh);
  }

  playAnimation(avatarId: string, animationId: string): void {
    const mixer = this.animations.get(avatarId);
    const avatar = this.avatars.get(avatarId);
    const animConfig = this.animationLibrary.get(animationId);

    if (!mixer || !avatar || !animConfig) {
      throw new Error('Avatar, mixer ou animação não encontrados');
    }

    try {
      // Parar animações atuais se necessário
      this.stopCurrentAnimations(avatarId, animConfig.blendMode);

      // Criar ou obter clipes de animação
      const clips = this.getAnimationClips(avatar, animationId);

      if (clips.length > 0) {
        // Reproduzir clipes GLTF/Three.js
        clips.forEach(clip => {
          const action = mixer.clipAction(clip);
          this.configureAnimationAction(action, animConfig);
          action.play();
        });
      } else {
        // Fallback para animações procedurais
        this.playProceduralAnimation(avatarId, animationId, animConfig);
      }

    } catch (error) {
      console.error(`Erro ao reproduzir animação ${animationId}:`, error);
      // Fallback para animação procedural
      this.playProceduralAnimation(avatarId, animationId, animConfig);
    }
  }

  private stopCurrentAnimations(avatarId: string, blendMode: string): void {
    const mixer = this.animations.get(avatarId);
    if (!mixer) return;

    if (blendMode === 'replace') {
      // Parar todas as animações atuais
      mixer.stopAllAction();
    }
    // Para blendMode 'additive' ou 'multiply', manter animações existentes
  }

  private getAnimationClips(avatar: THREE.Group, animationId: string): THREE.AnimationClip[] {
    // Tentar encontrar animações no modelo GLTF carregado
    const gltfData = (avatar as any).userData?.gltf;
    if (gltfData?.animations) {
      // Mapear animationId para clipes específicos
      const clipMap: { [key: string]: string[] } = {
        'idle-neutral': ['idle', 'Idle', 'idle_01'],
        'walk-casual': ['walk', 'Walk', 'walking'],
        'gesture-hello': ['wave', 'Wave', 'hello'],
        'emotion-happy': ['happy', 'Happy', 'smile'],
        'speech-talking': ['talk', 'Talk', 'speaking']
      };

      const possibleNames = clipMap[animationId] || [animationId];
      return gltfData.animations.filter((clip: THREE.AnimationClip) =>
        possibleNames.some(name =>
          clip.name.toLowerCase().includes(name.toLowerCase())
        )
      );
    }

    return [];
  }

  private configureAnimationAction(action: THREE.AnimationAction, config: AnimationConfig): void {
    // Configurar propriedades da animação
    action.setLoop(config.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.timeScale = config.speed;
    action.weight = config.weight;
    action.clampWhenFinished = !config.loop;

    // Configurar blend mode
    switch (config.blendMode) {
      case 'additive':
        action.blendMode = THREE.AdditiveAnimationBlendMode;
        break;
      case 'multiply':
        action.blendMode = THREE.NormalAnimationBlendMode; // Three.js não tem multiply built-in
        break;
      default:
        action.blendMode = THREE.NormalAnimationBlendMode;
    }

    // Configurar duração se especificada
    if (config.duration > 0) {
      action.setDuration(config.duration);
    }
  }

  private playProceduralAnimation(
    avatarId: string,
    animationId: string,
    config: AnimationConfig
  ): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    // Criar animações procedurais usando Tween.js ou animações manuais
    switch (animationId) {
      case 'idle-neutral':
        this.createIdleAnimation(avatar, config);
        break;
      case 'walk-casual':
        this.createWalkAnimation(avatar, config);
        break;
      case 'gesture-hello':
        this.createHelloAnimation(avatar, config);
        break;
      case 'emotion-happy':
        this.createHappyAnimation(avatar, config);
        break;
      case 'speech-talking':
        this.createTalkingAnimation(avatar, config);
        break;
      default:
        console.warn(`Animação procedural não implementada: ${animationId}`);
    }
  }

  private createIdleAnimation(avatar: THREE.Group, config: AnimationConfig): void {
    // Animação sutil de respiração
    const head = avatar.children.find(child => child.position.y > 1.3);
    if (head) {
      const originalY = head.position.y;
      let time = 0;

      const animate = () => {
        if (!avatar.parent) return; // Avatar removido

        time += 0.016;
        const breath = Math.sin(time * 2) * 0.005;
        head.position.y = originalY + breath;

        if (config.loop) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }

  private createWalkAnimation(avatar: THREE.Group, config: AnimationConfig): void {
    // Animação de caminhada básica
    const body = avatar.children[0];
    const leftLeg = avatar.children.find(child =>
      child.position.x < -0.1 && child.position.y < 0
    );
    const rightLeg = avatar.children.find(child =>
      child.position.x > 0.1 && child.position.y < 0
    );

    if (body && leftLeg && rightLeg) {
      let time = 0;

      const animate = () => {
        if (!avatar.parent) return;

        time += 0.016 * config.speed;
        const walkCycle = Math.sin(time * 8);

        // Movimento das pernas
        leftLeg.rotation.x = walkCycle * 0.5;
        rightLeg.rotation.x = -walkCycle * 0.5;

        // Movimento do corpo
        body.position.y = 0.6 + Math.abs(walkCycle) * 0.02;

        if (config.loop) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }

  private createHelloAnimation(avatar: THREE.Group, config: AnimationConfig): void {
    // Animação de acenar
    const rightArm = avatar.children.find(child =>
      child.position.x > 0.4 && child.position.y > 0.5
    );

    if (rightArm) {
      let time = 0;
      const duration = config.duration || 3.0;

      const animate = () => {
        if (!avatar.parent) return;

        time += 0.016;
        const progress = Math.min(time / duration, 1.0);

        // Movimento de aceno (vai e volta)
        const wave = Math.sin(progress * Math.PI * 4) * 0.8;
        rightArm.rotation.z = wave;

        if (progress < 1.0) {
          requestAnimationFrame(animate);
        } else {
          rightArm.rotation.z = 0; // Reset
        }
      };

      animate();
    }
  }

  private createHappyAnimation(avatar: THREE.Group, config: AnimationConfig): void {
    // Animação de felicidade
    const head = avatar.children.find(child => child.position.y > 1.3);

    if (head) {
      let time = 0;
      const duration = config.duration || 2.0;

      const animate = () => {
        if (!avatar.parent) return;

        time += 0.016;
        const progress = Math.min(time / duration, 1.0);

        // Movimento de cabeça feliz
        const bounce = Math.sin(progress * Math.PI * 6) * 0.05;
        head.position.y = 1.4 + bounce;

        // Pequeno movimento lateral
        const sway = Math.sin(progress * Math.PI * 3) * 0.02;
        head.position.x = sway;

        if (progress < 1.0) {
          requestAnimationFrame(animate);
        } else {
          head.position.set(0, 1.4, 0); // Reset
        }
      };

      animate();
    }
  }

  private createTalkingAnimation(avatar: THREE.Group, config: AnimationConfig): void {
    // Animação de fala com movimento labial
    const head = avatar.children.find(child => child.position.y > 1.3);

    if (head) {
      let time = 0;

      const animate = () => {
        if (!avatar.parent) return;

        time += 0.016;
        const talkCycle = Math.sin(time * 12) * 0.03;

        // Movimento da boca simulando fala
        if (head.scale) {
          head.scale.y = 1.0 + talkCycle;
        }

        if (config.loop) {
          requestAnimationFrame(animate);
        } else {
          if (head.scale) head.scale.y = 1.0; // Reset
        }
      };

      animate();
    }
  }

  setExpression(avatarId: string, expressionId: string, intensity: number = 1.0): void {
    const avatar = this.avatars.get(avatarId);
    const expression = this.expressions.get(expressionId);
    
    if (!avatar || !expression) {
      throw new Error('Avatar ou expressão não encontrados');
    }
    
    // Aplicar blend shapes da expressão
    expression.blendShapes.forEach((value, shapeName) => {
      // Simular aplicação de blend shape
    });
  }

  async speakText(
    avatarId: string, 
    text: string, 
    voiceId: string,
    options?: {
      speed?: number;
      pitch?: number;
      emotion?: string;
    }
  ): Promise<void> {
    const voice = this.voices.get(voiceId);
    if (!voice) {
      throw new Error('Voz não encontrada');
    }
    
    // Simular síntese de fala
    
    // Aplicar animação de fala
    this.playAnimation(avatarId, 'speech-talking');
    
    // Simular movimento labial
    this.animateLipSync(avatarId, text);
  }

  private animateLipSync(avatarId: string, text: string): void {
    // Simular animação de sincronização labial
    const phonemes = this.textToPhonemes(text);
    
    phonemes.forEach((phoneme, index) => {
      setTimeout(() => {
        this.applyPhonemeExpression(avatarId, phoneme);
      }, index * 100);
    });
  }

  private textToPhonemes(text: string): string[] {
    // Conversão simplificada de texto para fonemas
    return text.toLowerCase().split('').filter(char => /[aeiou]/.test(char));
  }

  private applyPhonemeExpression(avatarId: string, phoneme: string): void {
    // Aplicar expressão facial baseada no fonema
    const phonemeMap: { [key: string]: string } = {
      'a': 'mouth-a',
      'e': 'mouth-e',
      'i': 'mouth-i',
      'o': 'mouth-o',
      'u': 'mouth-u'
    };
    
    const expression = phonemeMap[phoneme];
    if (expression) {
    }
  }

  updateAvatar(avatarId: string, updates: Partial<AvatarCustomization>): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) {
      throw new Error('Avatar não encontrado');
    }
    
    // Aplicar atualizações
    if (updates.face) {
      this.applyFacialCustomizations(avatar, updates.face);
    }
    
    if (updates.hair) {
      this.applyHair(avatar, updates.hair);
    }
    
    if (updates.clothing) {
      this.applyClothing(avatar, updates.clothing);
    }
  }

  removeAvatar(avatarId: string): void {
    const avatar = this.avatars.get(avatarId);
    if (avatar) {
      this.scene.remove(avatar);
      this.avatars.delete(avatarId);
      
      const mixer = this.animations.get(avatarId);
      if (mixer) {
        mixer.stopAllAction();
        this.animations.delete(avatarId);
      }
    }
  }

  render(): void {
    // Atualizar animações
    const delta = 0.016; // 60 FPS
    this.animations.forEach(mixer => {
      mixer.update(delta);
    });
    
    // Renderizar cena
    this.renderer.render(this.scene, this.camera);
  }

  // Métodos de consulta
  getAvatarLibrary(): AvatarConfig[] {
    return Array.from(this.avatarLibrary.values());
  }

  getAnimationLibrary(): AnimationConfig[] {
    return Array.from(this.animationLibrary.values());
  }

  getVoiceLibrary(): VoiceConfig[] {
    return Array.from(this.voices.values());
  }

  getExpressionLibrary(): ExpressionConfig[] {
    return Array.from(this.expressions.values());
  }

  dispose(): void {
    // Limpar recursos
    this.avatars.forEach(avatar => {
      this.scene.remove(avatar);
    });
    
    this.animations.forEach(mixer => {
      mixer.stopAllAction();
    });
    
    this.avatars.clear();
    this.animations.clear();
    this.renderer.dispose();
  }
}

export {
  Avatar3DSystem,
  type AvatarConfig,
  type AvatarCustomization,
  type AnimationConfig,
  type VoiceConfig,
  type ExpressionConfig
};
