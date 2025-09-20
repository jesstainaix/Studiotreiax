import * as THREE from 'three';
import { EventEmitter } from 'events';

export interface Environment3DConfig {
  id: string;
  name: string;
  type: 'indoor' | 'outdoor' | 'studio' | 'custom';
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  terrain?: TerrainConfig;
  lighting?: LightingConfig;
  weather?: WeatherConfig;
  objects?: SceneObject[];
  physics?: PhysicsConfig;
  atmosphere?: AtmosphereConfig;
}

export interface TerrainConfig {
  type: 'flat' | 'hills' | 'mountains' | 'valley' | 'beach' | 'forest';
  heightMap?: Float32Array;
  texture?: string;
  vegetation?: VegetationConfig;
  water?: WaterConfig;
  roughness?: number;
  detail?: number;
}

export interface VegetationConfig {
  density: number;
  types: Array<{
    model: string;
    probability: number;
    minScale: number;
    maxScale: number;
    windEffect?: boolean;
  }>;
}

export interface WaterConfig {
  level: number;
  color: string;
  transparency: number;
  waveHeight: number;
  waveSpeed: number;
  reflectivity: number;
}

export interface LightingConfig {
  ambient: {
    color: string;
    intensity: number;
  };
  sun?: {
    position: THREE.Vector3;
    color: string;
    intensity: number;
    castShadows: boolean;
  };
  pointLights?: Array<{
    position: THREE.Vector3;
    color: string;
    intensity: number;
    distance: number;
  }>;
  fog?: {
    color: string;
    near: number;
    far: number;
  };
  volumetric?: boolean;
}

export interface WeatherConfig {
  type: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';
  intensity: number;
  windSpeed: number;
  windDirection: THREE.Vector3;
  precipitation?: {
    rate: number;
    size: number;
    color: string;
  };
  clouds?: {
    coverage: number;
    height: number;
    speed: number;
  };
  lightning?: {
    frequency: number;
    intensity: number;
  };
}

export interface PhysicsConfig {
  gravity: THREE.Vector3;
  airDensity: number;
  friction: number;
  restitution: number;
  constraints?: PhysicsConstraint[];
}

export interface PhysicsConstraint {
  type: 'fixed' | 'hinge' | 'ball' | 'slider';
  objectA: string;
  objectB?: string;
  parameters: any;
}

export interface AtmosphereConfig {
  temperature: number;
  humidity: number;
  pressure: number;
  visibility: number;
  soundPropagation?: number;
}

export interface SceneObject {
  id: string;
  type: 'mesh' | 'model' | 'particle' | 'fluid' | 'cloth';
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  physics?: {
    mass: number;
    isDynamic: boolean;
    collisionShape?: 'box' | 'sphere' | 'mesh' | 'convex';
    constraints?: string[];
  };
  interactions?: ObjectInteraction[];
}

export interface ObjectInteraction {
  type: 'clickable' | 'draggable' | 'breakable' | 'consumable';
  action: () => void;
  conditions?: string[];
}

class Custom3DEnvironments extends EventEmitter {
  private static instance: Custom3DEnvironments;
  private scene: THREE.Scene;
  private environments: Map<string, Environment3DConfig>;
  private activeEnvironment: Environment3DConfig | null;
  private physicsWorld: any; // Would integrate with physics library
  private terrainMesh: THREE.Mesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private vegetationInstances: THREE.InstancedMesh[] = [];
  private particleSystems: Map<string, THREE.Points> = new Map();
  private lightSources: Map<string, THREE.Light> = new Map();
  private dynamicObjects: Map<string, THREE.Object3D> = new Map();
  private clock: THREE.Clock;

  private constructor() {
    super();
    this.scene = new THREE.Scene();
    this.environments = new Map();
    this.activeEnvironment = null;
    this.clock = new THREE.Clock();
    this.initializeDefaults();
  }

  public static getInstance(): Custom3DEnvironments {
    if (!Custom3DEnvironments.instance) {
      Custom3DEnvironments.instance = new Custom3DEnvironments();
    }
    return Custom3DEnvironments.instance;
  }

  private initializeDefaults(): void {
    // Criar ambientes padrão
    this.createDefaultEnvironments();
  }

  private createDefaultEnvironments(): void {
    // Estúdio de Gravação
    const studio: Environment3DConfig = {
      id: 'studio_default',
      name: 'Estúdio Profissional',
      type: 'studio',
      dimensions: { width: 20, height: 5, depth: 15 },
      lighting: {
        ambient: { color: '#ffffff', intensity: 0.4 },
        sun: {
          position: new THREE.Vector3(5, 10, 5),
          color: '#ffffff',
          intensity: 0.8,
          castShadows: true
        },
        pointLights: [
          { position: new THREE.Vector3(-5, 4, 0), color: '#ff9900', intensity: 0.5, distance: 10 },
          { position: new THREE.Vector3(5, 4, 0), color: '#0099ff', intensity: 0.5, distance: 10 }
        ],
        volumetric: true
      },
      physics: {
        gravity: new THREE.Vector3(0, -9.81, 0),
        airDensity: 1.2,
        friction: 0.8,
        restitution: 0.2
      }
    };

    // Praia Tropical Brasileira
    const beach: Environment3DConfig = {
      id: 'beach_brazil',
      name: 'Praia Tropical',
      type: 'outdoor',
      dimensions: { width: 100, height: 30, depth: 100 },
      terrain: {
        type: 'beach',
        roughness: 0.3,
        detail: 128,
        water: {
          level: 0,
          color: '#006994',
          transparency: 0.7,
          waveHeight: 0.5,
          waveSpeed: 1.0,
          reflectivity: 0.8
        },
        vegetation: {
          density: 0.3,
          types: [
            { model: 'palm_tree', probability: 0.7, minScale: 0.8, maxScale: 1.2, windEffect: true },
            { model: 'coconut_tree', probability: 0.3, minScale: 0.9, maxScale: 1.1, windEffect: true }
          ]
        }
      },
      weather: {
        type: 'clear',
        intensity: 0.8,
        windSpeed: 5,
        windDirection: new THREE.Vector3(1, 0, 0.5).normalize()
      },
      lighting: {
        ambient: { color: '#87CEEB', intensity: 0.6 },
        sun: {
          position: new THREE.Vector3(50, 60, 30),
          color: '#FDB813',
          intensity: 1.0,
          castShadows: true
        },
        fog: { color: '#E0F6FF', near: 50, far: 200 }
      },
      atmosphere: {
        temperature: 28,
        humidity: 75,
        pressure: 1013,
        visibility: 10000,
        soundPropagation: 1.0
      }
    };

    // Escritório Moderno
    const office: Environment3DConfig = {
      id: 'office_modern',
      name: 'Escritório Corporativo',
      type: 'indoor',
      dimensions: { width: 30, height: 4, depth: 20 },
      lighting: {
        ambient: { color: '#f0f0f0', intensity: 0.5 },
        pointLights: [
          { position: new THREE.Vector3(0, 3.5, 0), color: '#ffffff', intensity: 0.8, distance: 15 },
          { position: new THREE.Vector3(-10, 3.5, -5), color: '#ffffff', intensity: 0.6, distance: 10 },
          { position: new THREE.Vector3(10, 3.5, 5), color: '#ffffff', intensity: 0.6, distance: 10 }
        ]
      },
      physics: {
        gravity: new THREE.Vector3(0, -9.81, 0),
        airDensity: 1.2,
        friction: 0.9,
        restitution: 0.1
      },
      atmosphere: {
        temperature: 22,
        humidity: 45,
        pressure: 1013,
        visibility: 100,
        soundPropagation: 0.8
      }
    };

    // Floresta Amazônica
    const rainforest: Environment3DConfig = {
      id: 'amazon_forest',
      name: 'Floresta Amazônica',
      type: 'outdoor',
      dimensions: { width: 150, height: 50, depth: 150 },
      terrain: {
        type: 'forest',
        roughness: 0.7,
        detail: 256,
        vegetation: {
          density: 0.9,
          types: [
            { model: 'tree_tall', probability: 0.4, minScale: 1.0, maxScale: 1.5, windEffect: true },
            { model: 'tree_medium', probability: 0.3, minScale: 0.7, maxScale: 1.0, windEffect: true },
            { model: 'bush', probability: 0.2, minScale: 0.5, maxScale: 0.8, windEffect: false },
            { model: 'fern', probability: 0.1, minScale: 0.3, maxScale: 0.6, windEffect: false }
          ]
        }
      },
      weather: {
        type: 'cloudy',
        intensity: 0.7,
        windSpeed: 2,
        windDirection: new THREE.Vector3(0.5, 0, 1).normalize(),
        clouds: { coverage: 0.6, height: 40, speed: 0.5 }
      },
      lighting: {
        ambient: { color: '#4a5a4a', intensity: 0.4 },
        sun: {
          position: new THREE.Vector3(30, 80, 20),
          color: '#ffffcc',
          intensity: 0.6,
          castShadows: true
        },
        fog: { color: '#7a8a7a', near: 10, far: 100 }
      },
      atmosphere: {
        temperature: 32,
        humidity: 85,
        pressure: 1010,
        visibility: 50,
        soundPropagation: 0.7
      }
    };

    this.environments.set(studio.id, studio);
    this.environments.set(beach.id, beach);
    this.environments.set(office.id, office);
    this.environments.set(rainforest.id, rainforest);
  }

  public createEnvironment(config: Environment3DConfig): void {
    this.environments.set(config.id, config);
    this.emit('environmentCreated', config);
  }

  public loadEnvironment(environmentId: string): void {
    const environment = this.environments.get(environmentId);
    if (!environment) {
      console.error(`Environment ${environmentId} not found`);
      return;
    }

    this.clearCurrentEnvironment();
    this.activeEnvironment = environment;

    // Construir ambiente
    if (environment.terrain) {
      this.createTerrain(environment.terrain);
    }

    if (environment.lighting) {
      this.setupLighting(environment.lighting);
    }

    if (environment.weather) {
      this.setupWeather(environment.weather);
    }

    if (environment.objects) {
      environment.objects.forEach(obj => this.addObject(obj));
    }

    if (environment.physics) {
      this.setupPhysics(environment.physics);
    }

    this.emit('environmentLoaded', environment);
  }

  private createTerrain(config: TerrainConfig): void {
    const geometry = this.generateTerrainGeometry(config);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a7c3a,
      roughness: config.roughness || 0.8,
      metalness: 0.1
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);

    // Adicionar água se configurado
    if (config.water) {
      this.createWater(config.water);
    }

    // Adicionar vegetação se configurado
    if (config.vegetation) {
      this.createVegetation(config.vegetation);
    }
  }

  private generateTerrainGeometry(config: TerrainConfig): THREE.BufferGeometry {
    const size = 100;
    const resolution = config.detail || 64;
    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);

    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    // Gerar heightmap procedural baseado no tipo
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      let height = 0;
      switch (config.type) {
        case 'hills':
          height = this.generateHills(vertex.x, vertex.y, size);
          break;
        case 'mountains':
          height = this.generateMountains(vertex.x, vertex.y, size);
          break;
        case 'valley':
          height = this.generateValley(vertex.x, vertex.y, size);
          break;
        case 'beach':
          height = this.generateBeach(vertex.x, vertex.y, size);
          break;
        case 'forest':
          height = this.generateForest(vertex.x, vertex.y, size);
          break;
        default:
          height = 0; // flat
      }

      positions.setZ(i, height);
    }

    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
  }

  private generateHills(x: number, y: number, size: number): number {
    const scale = 0.05;
    const height = 5;
    return Math.sin(x * scale) * Math.cos(y * scale) * height;
  }

  private generateMountains(x: number, y: number, size: number): number {
    const scale = 0.03;
    const height = 15;
    const base = Math.sin(x * scale) * Math.cos(y * scale) * height;
    const peaks = Math.sin(x * scale * 3) * Math.cos(y * scale * 3) * height * 0.3;
    return base + peaks;
  }

  private generateValley(x: number, y: number, size: number): number {
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = size / 2;
    const depth = -10;
    return (distance / maxDistance) * Math.abs(depth);
  }

  private generateBeach(x: number, y: number, size: number): number {
    const slope = x / size;
    const waves = Math.sin(y * 0.1) * 0.5;
    return slope * 2 + waves;
  }

  private generateForest(x: number, y: number, size: number): number {
    const scale = 0.08;
    const baseHeight = Math.sin(x * scale) * Math.cos(y * scale) * 2;
    const noise = (Math.random() - 0.5) * 0.5;
    return baseHeight + noise;
  }

  private createWater(config: WaterConfig): void {
    const geometry = new THREE.PlaneGeometry(200, 200, 128, 128);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.color),
      transparent: true,
      opacity: config.transparency,
      roughness: 0.1,
      metalness: 0.8
    });

    this.waterMesh = new THREE.Mesh(geometry, material);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = config.level;
    this.scene.add(this.waterMesh);

    // Animar ondas
    this.animateWater(config);
  }

  private animateWater(config: WaterConfig): void {
    if (!this.waterMesh) return;

    const geometry = this.waterMesh.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes.position;
    const time = this.clock.getElapsedTime();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const waveHeight = Math.sin(x * 0.1 + time * config.waveSpeed) * 
                        Math.cos(y * 0.1 + time * config.waveSpeed) * 
                        config.waveHeight;
      positions.setZ(i, waveHeight);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  private createVegetation(config: VegetationConfig): void {
    config.types.forEach(vegetationType => {
      const count = Math.floor(config.density * 100);
      const dummy = new THREE.Object3D();
      
      // Criar geometria baseada no tipo
      const geometry = this.getVegetationGeometry(vegetationType.model);
      const material = new THREE.MeshStandardMaterial({
        color: 0x2d5a2d,
        roughness: 0.8
      });

      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      // Posicionar vegetação aleatoriamente
      for (let i = 0; i < count; i++) {
        if (Math.random() > vegetationType.probability) continue;

        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        const y = this.getTerrainHeight(x, z);

        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        
        const scale = vegetationType.minScale + 
                     Math.random() * (vegetationType.maxScale - vegetationType.minScale);
        dummy.scale.setScalar(scale);

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }

      this.scene.add(instancedMesh);
      this.vegetationInstances.push(instancedMesh);
    });
  }

  private getVegetationGeometry(model: string): THREE.BufferGeometry {
    // Geometrias procedurais simples para diferentes tipos de vegetação
    switch (model) {
      case 'palm_tree':
      case 'coconut_tree':
        return new THREE.ConeGeometry(1, 8, 8);
      case 'tree_tall':
        return new THREE.CylinderGeometry(0.5, 1.5, 10, 8);
      case 'tree_medium':
        return new THREE.CylinderGeometry(0.4, 1.2, 7, 8);
      case 'bush':
        return new THREE.SphereGeometry(1.5, 8, 6);
      case 'fern':
        return new THREE.ConeGeometry(0.5, 2, 6);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  private getTerrainHeight(x: number, z: number): number {
    if (!this.terrainMesh) return 0;
    
    // Simplificado - em produção usaria raycasting
    return 0;
  }

  private setupLighting(config: LightingConfig): void {
    // Luz ambiente
    const ambient = new THREE.AmbientLight(
      new THREE.Color(config.ambient.color),
      config.ambient.intensity
    );
    this.scene.add(ambient);
    this.lightSources.set('ambient', ambient);

    // Sol/Luz direcional
    if (config.sun) {
      const sun = new THREE.DirectionalLight(
        new THREE.Color(config.sun.color),
        config.sun.intensity
      );
      sun.position.copy(config.sun.position);
      sun.castShadow = config.sun.castShadows;
      
      if (sun.castShadow) {
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 500;
        sun.shadow.camera.left = -50;
        sun.shadow.camera.right = 50;
        sun.shadow.camera.top = 50;
        sun.shadow.camera.bottom = -50;
      }
      
      this.scene.add(sun);
      this.lightSources.set('sun', sun);
    }

    // Luzes pontuais
    if (config.pointLights) {
      config.pointLights.forEach((lightConfig, index) => {
        const light = new THREE.PointLight(
          new THREE.Color(lightConfig.color),
          lightConfig.intensity,
          lightConfig.distance
        );
        light.position.copy(lightConfig.position);
        this.scene.add(light);
        this.lightSources.set(`point_${index}`, light);
      });
    }

    // Névoa
    if (config.fog) {
      this.scene.fog = new THREE.Fog(
        new THREE.Color(config.fog.color),
        config.fog.near,
        config.fog.far
      );
    }
  }

  private setupWeather(config: WeatherConfig): void {
    // Sistema de partículas para precipitação
    if (config.type === 'rainy' || config.type === 'snowy') {
      this.createPrecipitation(config);
    }

    // Sistema de nuvens
    if (config.clouds) {
      this.createClouds(config.clouds);
    }

    // Relâmpagos para tempestade
    if (config.lightning && config.type === 'stormy') {
      this.createLightning(config.lightning);
    }

    // Ajustar iluminação baseada no clima
    this.adjustLightingForWeather(config);
  }

  private createPrecipitation(config: WeatherConfig): void {
    if (!config.precipitation) return;

    const particleCount = config.precipitation.rate * 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      velocities[i3] = config.windDirection.x * config.windSpeed * 0.1;
      velocities[i3 + 1] = -2 - Math.random() * 3;
      velocities[i3 + 2] = config.windDirection.z * config.windSpeed * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(config.precipitation.color),
      size: config.precipitation.size,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, material);
    this.scene.add(particleSystem);
    this.particleSystems.set('precipitation', particleSystem);
  }

  private createClouds(cloudsConfig: any): void {
    const cloudCount = Math.floor(cloudsConfig.coverage * 10);
    
    for (let i = 0; i < cloudCount; i++) {
      const geometry = new THREE.SphereGeometry(
        10 + Math.random() * 20,
        8,
        6
      );
      
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        roughness: 1
      });

      const cloud = new THREE.Mesh(geometry, material);
      cloud.position.set(
        (Math.random() - 0.5) * 200,
        cloudsConfig.height + Math.random() * 10,
        (Math.random() - 0.5) * 200
      );
      cloud.scale.set(2, 0.6, 1.5);
      
      this.scene.add(cloud);
      this.dynamicObjects.set(`cloud_${i}`, cloud);
    }
  }

  private createLightning(lightningConfig: any): void {
    // Sistema de relâmpagos com flash de luz temporário
    setInterval(() => {
      if (Math.random() < lightningConfig.frequency) {
        const flash = new THREE.PointLight(
          0xffffff,
          lightningConfig.intensity,
          100
        );
        flash.position.set(
          (Math.random() - 0.5) * 100,
          50,
          (Math.random() - 0.5) * 100
        );
        
        this.scene.add(flash);
        
        setTimeout(() => {
          this.scene.remove(flash);
        }, 100);
        
        this.emit('lightning', flash.position);
      }
    }, 1000);
  }

  private adjustLightingForWeather(config: WeatherConfig): void {
    const sun = this.lightSources.get('sun');
    const ambient = this.lightSources.get('ambient');

    if (!sun || !ambient) return;

    switch (config.type) {
      case 'cloudy':
        (sun as THREE.DirectionalLight).intensity *= 0.5;
        (ambient as THREE.AmbientLight).intensity *= 0.7;
        break;
      case 'rainy':
      case 'stormy':
        (sun as THREE.DirectionalLight).intensity *= 0.2;
        (ambient as THREE.AmbientLight).intensity *= 0.5;
        (ambient as THREE.AmbientLight).color = new THREE.Color(0x808080);
        break;
      case 'foggy':
        (sun as THREE.DirectionalLight).intensity *= 0.3;
        (ambient as THREE.AmbientLight).intensity *= 0.6;
        break;
      case 'snowy':
        (sun as THREE.DirectionalLight).intensity *= 0.4;
        (ambient as THREE.AmbientLight).color = new THREE.Color(0xe0e0ff);
        break;
    }
  }

  private setupPhysics(config: PhysicsConfig): void {
    // Configurar mundo físico (integração com biblioteca de física)
    // Simplified for demonstration
    console.log('Physics configured:', config);
  }

  private addObject(object: SceneObject): void {
    let threeObject: THREE.Object3D;

    switch (object.type) {
      case 'mesh':
        if (object.geometry && object.material) {
          threeObject = new THREE.Mesh(object.geometry, object.material);
        } else {
          threeObject = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
          );
        }
        break;
      default:
        threeObject = new THREE.Object3D();
    }

    threeObject.position.copy(object.position);
    threeObject.rotation.copy(object.rotation);
    threeObject.scale.copy(object.scale);

    this.scene.add(threeObject);
    this.dynamicObjects.set(object.id, threeObject);

    // Configurar física se necessário
    if (object.physics && this.physicsWorld) {
      this.setupObjectPhysics(object, threeObject);
    }

    // Configurar interações
    if (object.interactions) {
      this.setupObjectInteractions(object, threeObject);
    }
  }

  private setupObjectPhysics(object: SceneObject, threeObject: THREE.Object3D): void {
    // Configurar corpo físico para o objeto
    console.log('Physics setup for object:', object.id);
  }

  private setupObjectInteractions(object: SceneObject, threeObject: THREE.Object3D): void {
    // Configurar interações do objeto
    object.interactions?.forEach(interaction => {
      threeObject.userData.interactions = threeObject.userData.interactions || [];
      threeObject.userData.interactions.push(interaction);
    });
  }

  private clearCurrentEnvironment(): void {
    // Limpar terreno
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
      this.terrainMesh = null;
    }

    // Limpar água
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
      this.waterMesh = null;
    }

    // Limpar vegetação
    this.vegetationInstances.forEach(instance => {
      this.scene.remove(instance);
      instance.geometry.dispose();
      (instance.material as THREE.Material).dispose();
    });
    this.vegetationInstances = [];

    // Limpar sistemas de partículas
    this.particleSystems.forEach(system => {
      this.scene.remove(system);
      system.geometry.dispose();
      (system.material as THREE.Material).dispose();
    });
    this.particleSystems.clear();

    // Limpar luzes
    this.lightSources.forEach(light => {
      this.scene.remove(light);
    });
    this.lightSources.clear();

    // Limpar objetos dinâmicos
    this.dynamicObjects.forEach(obj => {
      this.scene.remove(obj);
    });
    this.dynamicObjects.clear();

    // Limpar névoa
    this.scene.fog = null;
  }

  public update(deltaTime: number): void {
    // Atualizar água
    if (this.waterMesh && this.activeEnvironment?.terrain?.water) {
      this.animateWater(this.activeEnvironment.terrain.water);
    }

    // Atualizar sistemas de partículas
    this.updateParticleSystems(deltaTime);

    // Atualizar nuvens
    this.updateClouds(deltaTime);

    // Atualizar física
    if (this.physicsWorld) {
      // Update physics simulation
    }

    // Atualizar vegetação com vento
    this.updateVegetationWind(deltaTime);
  }

  private updateParticleSystems(deltaTime: number): void {
    const precipitation = this.particleSystems.get('precipitation');
    if (precipitation) {
      const positions = precipitation.geometry.attributes.position;
      const velocities = precipitation.geometry.attributes.velocity;

      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;
        
        positions.array[i3] += velocities.array[i3] * deltaTime;
        positions.array[i3 + 1] += velocities.array[i3 + 1] * deltaTime;
        positions.array[i3 + 2] += velocities.array[i3 + 2] * deltaTime;

        // Reset partícula quando sai da área
        if (positions.array[i3 + 1] < 0) {
          positions.array[i3 + 1] = 50;
          positions.array[i3] = (Math.random() - 0.5) * 100;
          positions.array[i3 + 2] = (Math.random() - 0.5) * 100;
        }
      }

      positions.needsUpdate = true;
    }
  }

  private updateClouds(deltaTime: number): void {
    const cloudSpeed = this.activeEnvironment?.weather?.clouds?.speed || 0;
    
    this.dynamicObjects.forEach((obj, key) => {
      if (key.startsWith('cloud_')) {
        obj.position.x += cloudSpeed * deltaTime;
        
        // Reset posição quando sai da área
        if (obj.position.x > 100) {
          obj.position.x = -100;
        }
      }
    });
  }

  private updateVegetationWind(deltaTime: number): void {
    if (!this.activeEnvironment?.weather) return;

    const windStrength = this.activeEnvironment.weather.windSpeed * 0.01;
    const time = this.clock.getElapsedTime();

    this.vegetationInstances.forEach(instance => {
      // Aplicar movimento de vento à vegetação
      const swayAmount = Math.sin(time * 2) * windStrength;
      instance.rotation.z = swayAmount;
    });
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getActiveEnvironment(): Environment3DConfig | null {
    return this.activeEnvironment;
  }

  public getAllEnvironments(): Environment3DConfig[] {
    return Array.from(this.environments.values());
  }

  public updateEnvironmentProperty(property: string, value: any): void {
    if (!this.activeEnvironment) return;

    // Atualizar propriedade dinamicamente
    const path = property.split('.');
    let target: any = this.activeEnvironment;
    
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]];
    }
    
    target[path[path.length - 1]] = value;

    // Recarregar partes afetadas
    if (property.startsWith('lighting')) {
      this.lightSources.forEach(light => this.scene.remove(light));
      this.lightSources.clear();
      if (this.activeEnvironment.lighting) {
        this.setupLighting(this.activeEnvironment.lighting);
      }
    } else if (property.startsWith('weather')) {
      // Reconfigurar clima
      if (this.activeEnvironment.weather) {
        this.setupWeather(this.activeEnvironment.weather);
      }
    }

    this.emit('environmentUpdated', { property, value });
  }

  public exportEnvironment(): string {
    if (!this.activeEnvironment) {
      throw new Error('No active environment to export');
    }

    return JSON.stringify(this.activeEnvironment, null, 2);
  }

  public importEnvironment(data: string): void {
    try {
      const environment = JSON.parse(data) as Environment3DConfig;
      this.createEnvironment(environment);
      this.loadEnvironment(environment.id);
    } catch (error) {
      console.error('Failed to import environment:', error);
      throw error;
    }
  }
}

export default Custom3DEnvironments;