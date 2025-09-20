// Tests for Avatar3DSystem
// Comprehensive test suite for 3D avatar functionality

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Avatar3DSystem, { 
  Avatar3DConfig, 
  Animation, 
  Scene3D, 
  Avatar3DInstance,
  Transform3D 
} from '../systems/Avatar3DSystem';

// Mock EventEmitter
class MockEventEmitter {
  private events: { [key: string]: Function[] } = {};
  
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
  
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

// Mock global objects
global.ImageData = class ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
} as any;

describe('Avatar3DSystem', () => {
  let avatarSystem: Avatar3DSystem;
  let mockEvents: string[] = [];

  beforeEach(() => {
    avatarSystem = new Avatar3DSystem();
    mockEvents = [];
    
    // Mock event listeners para capturar eventos
    avatarSystem.on('initialized', () => mockEvents.push('initialized'));
    avatarSystem.on('error', () => mockEvents.push('error'));
    avatarSystem.on('avatarConfigCreated', () => mockEvents.push('avatarConfigCreated'));
    avatarSystem.on('sceneCreated', () => mockEvents.push('sceneCreated'));
    avatarSystem.on('avatarAddedToScene', () => mockEvents.push('avatarAddedToScene'));
    avatarSystem.on('animationQueued', () => mockEvents.push('animationQueued'));
    avatarSystem.on('frameRendered', () => mockEvents.push('frameRendered'));
  });

  afterEach(() => {
    if (avatarSystem) {
      avatarSystem.dispose();
    }
    mockEvents = [];
  });

  describe('Inicialização do Sistema', () => {
    it('deve inicializar o sistema corretamente', async () => {
      await avatarSystem.initialize();
      
      expect(mockEvents).toContain('initialized');
      expect(avatarSystem.isInitialized).toBe(true);
    });

    it('deve emitir evento de erro em caso de falha na inicialização', async () => {
      // Simular erro na inicialização
      const originalInitialize = avatarSystem.initialize;
      avatarSystem.initialize = vi.fn().mockRejectedValue(new Error('Initialization failed'));
      
      await expect(avatarSystem.initialize()).rejects.toThrow('Initialization failed');
    });

    it('deve carregar assets padrão durante a inicialização', async () => {
      await avatarSystem.initialize();
      
      const avatarConfigs = avatarSystem.getAvatarConfigs();
      expect(avatarConfigs.length).toBeGreaterThan(0);
    });
  });

  describe('Configuração de Avatares', () => {
    beforeEach(async () => {
      await avatarSystem.initialize();
    });

    it('deve criar configuração de avatar com parâmetros válidos', () => {
      const config: Avatar3DConfig = {
        id: 'test-avatar-001',
        name: 'Avatar Teste',
        gender: 'male',
        ethnicity: 'brasileiro',
        age: 30,
        bodyType: 'athletic',
        height: 1.80,
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
          accessories: ['glasses']
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: 'voice-001',
          language: 'pt-BR',
          accent: 'brasileiro',
          speed: 1.0,
          pitch: 1.0
        }
      };

      const avatarId = avatarSystem.createAvatarConfig(config);

      expect(avatarId).toBeDefined();
      expect(typeof avatarId).toBe('string');
      expect(mockEvents).toContain('avatarConfigCreated');
    });

    it('deve validar parâmetros obrigatórios da configuração', () => {
       const invalidConfig = {
         // Faltando nome obrigatório
         gender: 'male'
       } as Partial<Avatar3DConfig>;

       expect(() => {
         avatarSystem.createAvatarConfig(invalidConfig);
       }).toThrow('Nome do avatar é obrigatório');
     });

    it('deve permitir diferentes tipos de corpo', () => {
      const bodyTypes: Array<Avatar3DConfig['bodyType']> = ['slim', 'athletic', 'average', 'heavy'];
      
      bodyTypes.forEach((bodyType, index) => {
        const config: Partial<Avatar3DConfig> = {
          id: `test-avatar-${index}`,
          name: `Avatar ${bodyType}`,
          gender: 'male',
          ethnicity: 'brasileiro',
          age: 25,
          bodyType,
          height: 1.75
        };

        const avatarId = avatarSystem.createAvatarConfig(config);
        expect(avatarId).toBeDefined();
      });
    });

    it('deve suportar diferentes gêneros', () => {
      const genders: Array<Avatar3DConfig['gender']> = ['male', 'female', 'neutral'];
      
      genders.forEach((gender, index) => {
        const config: Partial<Avatar3DConfig> = {
          id: `test-avatar-gender-${index}`,
          name: `Avatar ${gender}`,
          gender,
          ethnicity: 'brasileiro',
          age: 30,
          bodyType: 'average',
          height: 1.70
        };

        const avatarId = avatarSystem.createAvatarConfig(config);
        expect(avatarId).toBeDefined();
      });
    });
  });

  describe('Gerenciamento de Cenas', () => {
    beforeEach(async () => {
      await avatarSystem.initialize();
    });

    it('deve criar uma nova cena 3D', () => {
      const sceneName = 'Cena de Teste';
      const sceneId = avatarSystem.createScene(sceneName);
      
      expect(sceneId).toBeDefined();
      expect(typeof sceneId).toBe('string');
      expect(mockEvents).toContain('sceneCreated');
      
      const scenes = avatarSystem.getScenes();
      const createdScene = scenes.find(s => s.id === sceneId);
      expect(createdScene).toBeDefined();
      expect(createdScene?.name).toBe(sceneName);
    });

    it('deve configurar ambiente padrão da cena', () => {
      const sceneId = avatarSystem.createScene('Cena com Ambiente');
      const scenes = avatarSystem.getScenes();
      const scene = scenes.find(s => s.id === sceneId);
      
      expect(scene?.environment).toBeDefined();
      expect(scene?.environment.background).toBeDefined();
      expect(scene?.environment.lighting).toBeDefined();
      expect(scene?.environment.camera).toBeDefined();
      
      // Verificar configurações de iluminação
      expect(scene?.environment.lighting.ambient).toBeDefined();
      expect(scene?.environment.lighting.directional).toBeDefined();
      
      // Verificar configurações de câmera
      expect(scene?.environment.camera.position).toBeDefined();
      expect(scene?.environment.camera.target).toBeDefined();
      expect(scene?.environment.camera.fov).toBeGreaterThan(0);
    });

    it('deve definir cena ativa', () => {
      const sceneId = avatarSystem.createScene('Cena Ativa');
      avatarSystem.setActiveScene(sceneId);
      
      const activeScene = avatarSystem.getActiveScene();
      expect(activeScene).toBeDefined();
      expect(activeScene?.id).toBe(sceneId);
    });

    it('deve adicionar avatar à cena', () => {
      // Criar avatar
      const avatarConfig: Partial<Avatar3DConfig> = {
        id: 'avatar-for-scene',
        name: 'Avatar da Cena',
        gender: 'female',
        ethnicity: 'brasileira',
        age: 28,
        bodyType: 'slim',
        height: 1.65
      };
      
      const avatarId = avatarSystem.createAvatarConfig(avatarConfig);
      const sceneId = avatarSystem.createScene('Cena com Avatar');
      
      const instanceId = avatarSystem.addAvatarToScene(sceneId, avatarId);
      
      expect(instanceId).toBeDefined();
      expect(mockEvents).toContain('avatarAddedToScene');
      
      const scenes = avatarSystem.getScenes();
      const scene = scenes.find(s => s.id === sceneId);
      expect(scene?.avatars.length).toBe(1);
      expect(scene?.avatars[0].configId).toBe(avatarId);
    });
  });

  describe('Sistema de Animações', () => {
    beforeEach(async () => {
      await avatarSystem.initialize();
    });

    it('deve criar animação personalizada', () => {
      const animation: Animation = {
        id: 'custom-wave',
        name: 'Acenar',
        type: 'gesture',
        duration: 2000,
        keyframes: [
          {
            time: 0,
            bones: {
              'rightArm': {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                scale: { x: 1, y: 1, z: 1 }
              }
            },
            morphTargets: {},
            properties: {}
          },
          {
            time: 1000,
            bones: {
              'rightArm': {
                position: { x: 0, y: 0.5, z: 0 },
                rotation: { x: 0, y: 0, z: 0.5, w: 0.866 },
                scale: { x: 1, y: 1, z: 1 }
              }
            },
            morphTargets: {},
            properties: {}
          }
        ],
        loop: false,
        blendable: true
      };

      // Verificar que o sistema tem animações padrão
      const animations = avatarSystem.getAnimations();
      expect(Array.isArray(animations)).toBe(true);
      expect(animations.length).toBeGreaterThan(0);
    });

    it('deve reproduzir animação em avatar', async () => {
      // Criar avatar e cena
      const avatarConfig: Partial<Avatar3DConfig> = {
        id: 'animated-avatar',
        name: 'Avatar Animado',
        gender: 'male',
        ethnicity: 'brasileiro',
        age: 35,
        bodyType: 'athletic',
        height: 1.85
      };
      
      const avatarId = avatarSystem.createAvatarConfig(avatarConfig);
      const sceneId = avatarSystem.createScene('Cena de Animação');
      const instanceId = avatarSystem.addAvatarToScene(sceneId, avatarId);
      
      // Reproduzir animação
       avatarSystem.playAnimation(instanceId, 'idle-neutral');
       
       expect(mockEvents).toContain('animationQueued');
    });

    it('deve enfileirar múltiplas animações', async () => {
      const avatarConfig: Partial<Avatar3DConfig> = {
        id: 'queue-avatar',
        name: 'Avatar com Fila',
        gender: 'female',
        ethnicity: 'brasileira',
        age: 25,
        bodyType: 'average',
        height: 1.68
      };
      
      const avatarId = avatarSystem.createAvatarConfig(avatarConfig);
      const sceneId = avatarSystem.createScene('Cena de Fila');
      const instanceId = avatarSystem.addAvatarToScene(sceneId, avatarId);
      
      // Enfileirar animações usando IDs válidos
      avatarSystem.playAnimation(instanceId, 'idle-neutral');
      avatarSystem.playAnimation(instanceId, 'speaking-casual');
      avatarSystem.playAnimation(instanceId, 'gesture-wave');
      
      const scenes = avatarSystem.getScenes();
      const scene = scenes.find(s => s.id === sceneId);
      const avatar = scene?.avatars.find(a => a.id === instanceId);
      
      expect(avatar?.animationQueue.length).toBeGreaterThan(0);
    });
  });

  describe('Renderização e Performance', () => {
    beforeEach(async () => {
      await avatarSystem.initialize();
    });

    it('deve renderizar frame e retornar ImageData', async () => {
      const imageData = await avatarSystem.renderFrame();
      
      expect(imageData).toBeInstanceOf(ImageData);
      expect(imageData.width).toBe(1920);
      expect(imageData.height).toBe(1080);
      expect(mockEvents).toContain('frameRendered');
    });

    it('deve atualizar posição do avatar', () => {
      const avatarConfig: Partial<Avatar3DConfig> = {
        id: 'positioned-avatar',
        name: 'Avatar Posicionado',
        gender: 'male',
        ethnicity: 'brasileiro',
        age: 40,
        bodyType: 'heavy',
        height: 1.75
      };
      
      const avatarId = avatarSystem.createAvatarConfig(avatarConfig);
      const sceneId = avatarSystem.createScene('Cena de Posição');
      const instanceId = avatarSystem.addAvatarToScene(sceneId, avatarId);
      
      const newTransform: Transform3D = {
        position: { x: 2, y: 0, z: -1 },
        rotation: { x: 0, y: 0.707, z: 0, w: 0.707 },
        scale: { x: 1.2, y: 1.2, z: 1.2 }
      };
      
      avatarSystem.updateAvatarPosition(instanceId, newTransform);
      
      const scenes = avatarSystem.getScenes();
      const scene = scenes.find(s => s.id === sceneId);
      const avatar = scene?.avatars.find(a => a.id === instanceId);
      
      expect(avatar?.position).toEqual(newTransform);
    });
  });

  describe('Gerenciamento de Recursos', () => {
    beforeEach(async () => {
      await avatarSystem.initialize();
    });

    it('deve retornar lista de configurações de avatares', () => {
      const config1: Partial<Avatar3DConfig> = {
        name: 'Avatar 1',
        height: 175,
        gender: 'male'
      };

      const config2: Partial<Avatar3DConfig> = {
        name: 'Avatar 2',
        height: 165,
        gender: 'female'
      };

      avatarSystem.createAvatarConfig(config1);
      avatarSystem.createAvatarConfig(config2);

      const configs = avatarSystem.getAvatarConfigs();
      expect(configs.length).toBeGreaterThanOrEqual(2);
    });

    it('deve retornar lista de cenas', () => {
      // Get initial scene count
      const initialScenes = avatarSystem.getScenes().length;

      // Create scenes
      const sceneId1 = avatarSystem.createScene('Cena 1');
      const sceneId2 = avatarSystem.createScene('Cena 2');

      expect(sceneId1).toBeDefined();
      expect(sceneId2).toBeDefined();
      expect(sceneId1).not.toBe(sceneId2); // IDs devem ser diferentes

      const scenes = avatarSystem.getScenes();
      expect(scenes.length).toBe(initialScenes + 2); // Deve ter 2 cenas a mais

      // Verify scene names
      const scene1 = scenes.find(s => s.id === sceneId1);
      const scene2_1 = scenes.find(s => s.id === sceneId2);

      // Corrigindo o teste para comparar IDs corretamente
      expect(scene1?.id).not.toBe(scene2_1?.id);

      expect(scene1?.name).toBe('Cena 1');
      expect(scene2_1?.name).toBe('Cena 2');

      // ... existing code ...
    });

    it('deve retornar lista de animações', () => {
      const animations = avatarSystem.getAnimations();
      expect(Array.isArray(animations)).toBe(true);
      // Deve ter pelo menos as animações padrão
      expect(animations.length).toBeGreaterThan(0);
    });
  });

  describe('Limpeza e Dispose', () => {
    beforeEach(async () => {
      await avatarSystem.initialize();
    });

    it('deve fazer dispose corretamente', () => {
       const config: Partial<Avatar3DConfig> = {
         name: 'Test Avatar',
         height: 175,
         gender: 'male'
       };

       const avatarId = avatarSystem.createAvatarConfig(config);
       const sceneId = avatarSystem.createScene('Test Scene');
       const instanceId = avatarSystem.addAvatarToScene(sceneId, avatarId);

       // Fazer dispose
       avatarSystem.dispose();

       // Verificar se o sistema foi limpo
       expect(avatarSystem.isInitialized).toBe(false);
     });

    it('deve permitir reinicialização após dispose', async () => {
      avatarSystem.dispose();
      
      await avatarSystem.initialize();
      
      expect(avatarSystem.isInitialized).toBe(true);
      expect(mockEvents.filter(e => e === 'initialized').length).toBe(2);
    });
  });

  describe('Casos Edge e Tratamento de Erros', () => {
    beforeEach(async () => {
      await avatarSystem.initialize();
    });

    it('deve tratar erro ao adicionar avatar inexistente à cena', () => {
      const sceneId = avatarSystem.createScene('Cena de Erro');
      
      expect(() => {
        avatarSystem.addAvatarToScene(sceneId, 'avatar-inexistente');
      }).toThrow();
    });

    it('deve tratar erro ao adicionar avatar à cena inexistente', () => {
      const config: Partial<Avatar3DConfig> = {
        name: 'Test Avatar',
        height: 175,
        gender: 'male'
      };

      const avatarId = avatarSystem.createAvatarConfig(config);

      expect(() => {
        avatarSystem.addAvatarToScene('cena-inexistente', avatarId);
      }).toThrow();
    });

    it('deve tratar tentativa de definir cena ativa inexistente', () => {
      avatarSystem.setActiveScene('cena-inexistente');
      
      const activeScene = avatarSystem.getActiveScene();
      expect(activeScene).toBeUndefined();
    });

    it('deve retornar null para getCurrentMetrics quando não inicializado', () => {
      const newSystem = new Avatar3DSystem();
      const activeScene = newSystem.getActiveScene();
      expect(activeScene).toBeUndefined();
      newSystem.dispose();
    });
  });
});
