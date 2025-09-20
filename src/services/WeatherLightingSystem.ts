import * as THREE from 'three';
import { EventEmitter } from 'events';

export interface WeatherState {
  type: WeatherType;
  intensity: number;
  transitionDuration: number;
  windSpeed: number;
  windDirection: THREE.Vector3;
  temperature: number;
  humidity: number;
  visibility: number;
}

export enum WeatherType {
  CLEAR = 'clear',
  PARTLY_CLOUDY = 'partly_cloudy',
  CLOUDY = 'cloudy',
  OVERCAST = 'overcast',
  FOG = 'fog',
  RAIN = 'rain',
  HEAVY_RAIN = 'heavy_rain',
  STORM = 'storm',
  SNOW = 'snow',
  BLIZZARD = 'blizzard',
  SANDSTORM = 'sandstorm',
  HAIL = 'hail'
}

export interface LightingState {
  timeOfDay: number; // 0-24 hours
  sunPosition: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  moonPosition: THREE.Vector3;
  moonColor: THREE.Color;
  moonIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  fogColor: THREE.Color;
  fogDensity: number;
  shadowStrength: number;
  indoorLighting?: IndoorLightingConfig;
}

export interface IndoorLightingConfig {
  ceilingLights: CeilingLight[];
  wallLights: WallLight[];
  spotlights: Spotlight[];
  emissiveObjects: EmissiveObject[];
}

export interface CeilingLight {
  position: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  radius: number;
}

export interface WallLight {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  angle: number;
}

export interface Spotlight {
  position: THREE.Vector3;
  target: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  angle: number;
  penumbra: number;
}

export interface EmissiveObject {
  mesh: THREE.Mesh;
  color: THREE.Color;
  intensity: number;
}

export interface CloudSystem {
  layers: CloudLayer[];
  coverage: number;
  speed: number;
  direction: THREE.Vector2;
}

export interface CloudLayer {
  altitude: number;
  density: number;
  type: 'cumulus' | 'stratus' | 'cirrus' | 'cumulonimbus';
  particles: THREE.Points;
}

export interface PrecipitationSystem {
  type: 'rain' | 'snow' | 'hail' | 'sleet';
  rate: number;
  particleSize: number;
  velocity: THREE.Vector3;
  splashEffect: boolean;
  accumulation: boolean;
}

export interface LightningSystem {
  frequency: number;
  intensity: number;
  duration: number;
  branches: number;
  color: THREE.Color;
}

export interface EnvironmentalEffects {
  volumetricFog: boolean;
  godRays: boolean;
  rainbowEffect: boolean;
  lensFlare: boolean;
  atmosphericScattering: boolean;
  auroras: boolean;
}

class WeatherLightingSystem extends EventEmitter {
  private static instance: WeatherLightingSystem;
  private scene: THREE.Scene;
  private weatherState: WeatherState;
  private lightingState: LightingState;
  private cloudSystem: CloudSystem | null = null;
  private precipitationSystem: PrecipitationSystem | null = null;
  private lightningSystem: LightningSystem | null = null;
  private environmentalEffects: EnvironmentalEffects;
  
  private sunLight: THREE.DirectionalLight;
  private moonLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemisphereLight: THREE.HemisphereLight;
  
  private particleSystems: Map<string, THREE.Points> = new Map();
  private lights: Map<string, THREE.Light> = new Map();
  private clock: THREE.Clock;
  private transitions: Map<string, any> = new Map();

  private weatherPresets: Map<WeatherType, Partial<WeatherState>> = new Map();
  private dayNightCycle: boolean = false;
  private dayDuration: number = 600; // seconds for full day cycle

  private constructor() {
    super();
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    
    this.weatherState = {
      type: WeatherType.CLEAR,
      intensity: 0,
      transitionDuration: 5,
      windSpeed: 1,
      windDirection: new THREE.Vector3(1, 0, 0).normalize(),
      temperature: 22,
      humidity: 50,
      visibility: 10000
    };
    
    this.lightingState = {
      timeOfDay: 12,
      sunPosition: new THREE.Vector3(100, 100, 0),
      sunColor: new THREE.Color(0xffffcc),
      sunIntensity: 1,
      moonPosition: new THREE.Vector3(-100, 50, 0),
      moonColor: new THREE.Color(0xaaaaff),
      moonIntensity: 0.1,
      ambientColor: new THREE.Color(0x404040),
      ambientIntensity: 0.5,
      fogColor: new THREE.Color(0xcccccc),
      fogDensity: 0.001,
      shadowStrength: 1
    };
    
    this.environmentalEffects = {
      volumetricFog: false,
      godRays: false,
      rainbowEffect: false,
      lensFlare: false,
      atmosphericScattering: false,
      auroras: false
    };
    
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.moonLight = new THREE.DirectionalLight(0xaaaaff, 0.1);
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.5);
    
    this.initializePresets();
    this.setupLighting();
  }

  public static getInstance(): WeatherLightingSystem {
    if (!WeatherLightingSystem.instance) {
      WeatherLightingSystem.instance = new WeatherLightingSystem();
    }
    return WeatherLightingSystem.instance;
  }

  private initializePresets(): void {
    // Preset para tempo limpo
    this.weatherPresets.set(WeatherType.CLEAR, {
      intensity: 0,
      windSpeed: 2,
      temperature: 25,
      humidity: 40,
      visibility: 10000
    });

    // Preset para chuva
    this.weatherPresets.set(WeatherType.RAIN, {
      intensity: 0.7,
      windSpeed: 5,
      temperature: 18,
      humidity: 85,
      visibility: 2000
    });

    // Preset para tempestade
    this.weatherPresets.set(WeatherType.STORM, {
      intensity: 1,
      windSpeed: 15,
      temperature: 15,
      humidity: 95,
      visibility: 500
    });

    // Preset para neve
    this.weatherPresets.set(WeatherType.SNOW, {
      intensity: 0.6,
      windSpeed: 3,
      temperature: -2,
      humidity: 70,
      visibility: 1000
    });

    // Preset para neblina
    this.weatherPresets.set(WeatherType.FOG, {
      intensity: 0.8,
      windSpeed: 1,
      temperature: 12,
      humidity: 95,
      visibility: 100
    });
  }

  private setupLighting(): void {
    // Configurar luz do sol
    this.sunLight.position.copy(this.lightingState.sunPosition);
    this.sunLight.color = this.lightingState.sunColor;
    this.sunLight.intensity = this.lightingState.sunIntensity;
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    
    // Configurar luz da lua
    this.moonLight.position.copy(this.lightingState.moonPosition);
    this.moonLight.color = this.lightingState.moonColor;
    this.moonLight.intensity = this.lightingState.moonIntensity;
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    
    // Adicionar luzes à cena
    this.scene.add(this.sunLight);
    this.scene.add(this.moonLight);
    this.scene.add(this.ambientLight);
    this.scene.add(this.hemisphereLight);
    
    this.lights.set('sun', this.sunLight);
    this.lights.set('moon', this.moonLight);
    this.lights.set('ambient', this.ambientLight);
    this.lights.set('hemisphere', this.hemisphereLight);
  }

  public setWeather(type: WeatherType, transition: boolean = true): void {
    const preset = this.weatherPresets.get(type);
    if (!preset) {
      console.warn(`Weather preset for ${type} not found`);
      return;
    }

    const newState = { ...this.weatherState, type, ...preset };

    if (transition) {
      this.transitionWeather(newState);
    } else {
      this.weatherState = newState;
      this.applyWeatherState();
    }

    this.emit('weatherChanged', this.weatherState);
  }

  private transitionWeather(targetState: WeatherState): void {
    const startState = { ...this.weatherState };
    const duration = targetState.transitionDuration * 1000;
    const startTime = Date.now();

    const transition = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);

      // Interpolar valores
      this.weatherState.intensity = this.lerp(startState.intensity, targetState.intensity, eased);
      this.weatherState.windSpeed = this.lerp(startState.windSpeed, targetState.windSpeed, eased);
      this.weatherState.temperature = this.lerp(startState.temperature, targetState.temperature, eased);
      this.weatherState.humidity = this.lerp(startState.humidity, targetState.humidity, eased);
      this.weatherState.visibility = this.lerp(startState.visibility, targetState.visibility, eased);

      if (progress >= 1) {
        this.weatherState = targetState;
        this.transitions.delete('weather');
      }

      this.applyWeatherState();

      if (progress < 1) {
        requestAnimationFrame(transition);
      }
    };

    this.transitions.set('weather', transition);
    transition();
  }

  private applyWeatherState(): void {
    // Atualizar névoa baseada na visibilidade
    this.scene.fog = new THREE.Fog(
      this.lightingState.fogColor,
      this.weatherState.visibility * 0.1,
      this.weatherState.visibility
    );

    // Ajustar iluminação baseada no clima
    this.adjustLightingForWeather();

    // Criar/atualizar sistemas de partículas
    if (this.weatherState.type === WeatherType.RAIN || 
        this.weatherState.type === WeatherType.HEAVY_RAIN ||
        this.weatherState.type === WeatherType.STORM) {
      this.createRainSystem();
    } else if (this.weatherState.type === WeatherType.SNOW ||
               this.weatherState.type === WeatherType.BLIZZARD) {
      this.createSnowSystem();
    } else {
      this.clearPrecipitation();
    }

    // Criar sistema de nuvens
    if (this.weatherState.type !== WeatherType.CLEAR) {
      this.createCloudSystem();
    }

    // Sistema de relâmpagos para tempestade
    if (this.weatherState.type === WeatherType.STORM) {
      this.createLightningSystem();
    }
  }

  private adjustLightingForWeather(): void {
    const weatherMultipliers: Record<WeatherType, number> = {
      [WeatherType.CLEAR]: 1,
      [WeatherType.PARTLY_CLOUDY]: 0.9,
      [WeatherType.CLOUDY]: 0.7,
      [WeatherType.OVERCAST]: 0.5,
      [WeatherType.FOG]: 0.6,
      [WeatherType.RAIN]: 0.6,
      [WeatherType.HEAVY_RAIN]: 0.4,
      [WeatherType.STORM]: 0.3,
      [WeatherType.SNOW]: 0.7,
      [WeatherType.BLIZZARD]: 0.4,
      [WeatherType.SANDSTORM]: 0.3,
      [WeatherType.HAIL]: 0.5
    };

    const multiplier = weatherMultipliers[this.weatherState.type] || 1;
    
    this.sunLight.intensity = this.lightingState.sunIntensity * multiplier;
    this.ambientLight.intensity = this.lightingState.ambientIntensity * (0.5 + multiplier * 0.5);
    
    // Ajustar cor da luz ambiente baseada no clima
    if (this.weatherState.type === WeatherType.STORM) {
      this.ambientLight.color = new THREE.Color(0x404060);
    } else if (this.weatherState.type === WeatherType.SNOW) {
      this.ambientLight.color = new THREE.Color(0xe0e0ff);
    } else if (this.weatherState.type === WeatherType.SANDSTORM) {
      this.ambientLight.color = new THREE.Color(0xccaa88);
    } else {
      this.ambientLight.color = this.lightingState.ambientColor;
    }
  }

  private createRainSystem(): void {
    if (this.precipitationSystem?.type === 'rain') {
      this.updateRainSystem();
      return;
    }

    this.clearPrecipitation();

    const particleCount = Math.floor(this.weatherState.intensity * 10000);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 200;
      positions[i3 + 1] = Math.random() * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 200;

      velocities[i3] = this.weatherState.windDirection.x * this.weatherState.windSpeed * 0.1;
      velocities[i3 + 1] = -5 - Math.random() * 10;
      velocities[i3 + 2] = this.weatherState.windDirection.z * this.weatherState.windSpeed * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0x6090ff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const rain = new THREE.Points(geometry, material);
    this.scene.add(rain);
    this.particleSystems.set('precipitation', rain);

    this.precipitationSystem = {
      type: 'rain',
      rate: this.weatherState.intensity,
      particleSize: 0.15,
      velocity: new THREE.Vector3(0, -10, 0),
      splashEffect: true,
      accumulation: false
    };
  }

  private updateRainSystem(): void {
    const rain = this.particleSystems.get('precipitation');
    if (!rain) return;

    const positions = rain.geometry.attributes.position;
    const velocities = rain.geometry.attributes.velocity;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      
      positions.array[i3] += velocities.array[i3] * 0.1;
      positions.array[i3 + 1] += velocities.array[i3 + 1] * 0.1;
      positions.array[i3 + 2] += velocities.array[i3 + 2] * 0.1;

      // Reset partícula quando atinge o chão
      if (positions.array[i3 + 1] < 0) {
        positions.array[i3] = (Math.random() - 0.5) * 200;
        positions.array[i3 + 1] = 100;
        positions.array[i3 + 2] = (Math.random() - 0.5) * 200;
      }
    }

    positions.needsUpdate = true;
  }

  private createSnowSystem(): void {
    if (this.precipitationSystem?.type === 'snow') {
      this.updateSnowSystem();
      return;
    }

    this.clearPrecipitation();

    const particleCount = Math.floor(this.weatherState.intensity * 5000);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 200;
      positions[i3 + 1] = Math.random() * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 200;

      velocities[i3] = this.weatherState.windDirection.x * this.weatherState.windSpeed * 0.05;
      velocities[i3 + 1] = -0.5 - Math.random() * 1;
      velocities[i3 + 2] = this.weatherState.windDirection.z * this.weatherState.windSpeed * 0.05;

      sizes[i] = 0.3 + Math.random() * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      map: this.createSnowflakeTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const snow = new THREE.Points(geometry, material);
    this.scene.add(snow);
    this.particleSystems.set('precipitation', snow);

    this.precipitationSystem = {
      type: 'snow',
      rate: this.weatherState.intensity,
      particleSize: 0.5,
      velocity: new THREE.Vector3(0, -1, 0),
      splashEffect: false,
      accumulation: true
    };
  }

  private updateSnowSystem(): void {
    const snow = this.particleSystems.get('precipitation');
    if (!snow) return;

    const positions = snow.geometry.attributes.position;
    const velocities = snow.geometry.attributes.velocity;
    const time = this.clock.getElapsedTime();

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      
      // Movimento de queda com oscilação
      positions.array[i3] += velocities.array[i3] * 0.1 + Math.sin(time + i) * 0.01;
      positions.array[i3 + 1] += velocities.array[i3 + 1] * 0.1;
      positions.array[i3 + 2] += velocities.array[i3 + 2] * 0.1 + Math.cos(time + i) * 0.01;

      // Reset partícula
      if (positions.array[i3 + 1] < 0) {
        positions.array[i3] = (Math.random() - 0.5) * 200;
        positions.array[i3 + 1] = 100;
        positions.array[i3 + 2] = (Math.random() - 0.5) * 200;
      }
    }

    positions.needsUpdate = true;
  }

  private createSnowflakeTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createCloudSystem(): void {
    if (this.cloudSystem) {
      this.updateCloudSystem();
      return;
    }

    const layers: CloudLayer[] = [];
    const coverage = this.weatherState.intensity;

    // Criar múltiplas camadas de nuvens
    for (let layer = 0; layer < 3; layer++) {
      const altitude = 20 + layer * 15;
      const cloudCount = Math.floor(coverage * 20);
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(cloudCount * 3);

      for (let i = 0; i < cloudCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 300;
        positions[i3 + 1] = altitude + (Math.random() - 0.5) * 5;
        positions[i3 + 2] = (Math.random() - 0.5) * 300;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 20,
        transparent: true,
        opacity: 0.5 - layer * 0.1,
        map: this.createCloudTexture(),
        blending: THREE.NormalBlending,
        depthWrite: false
      });

      const clouds = new THREE.Points(geometry, material);
      this.scene.add(clouds);
      this.particleSystems.set(`clouds_${layer}`, clouds);

      layers.push({
        altitude,
        density: coverage,
        type: 'cumulus',
        particles: clouds
      });
    }

    this.cloudSystem = {
      layers,
      coverage,
      speed: this.weatherState.windSpeed * 0.1,
      direction: new THREE.Vector2(this.weatherState.windDirection.x, this.weatherState.windDirection.z)
    };
  }

  private updateCloudSystem(): void {
    if (!this.cloudSystem) return;

    this.cloudSystem.layers.forEach((layer, index) => {
      const clouds = layer.particles;
      const positions = clouds.geometry.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;
        
        positions.array[i3] += this.cloudSystem!.direction.x * this.cloudSystem!.speed;
        positions.array[i3 + 2] += this.cloudSystem!.direction.y * this.cloudSystem!.speed;

        // Wrap around
        if (positions.array[i3] > 150) positions.array[i3] = -150;
        if (positions.array[i3] < -150) positions.array[i3] = 150;
        if (positions.array[i3 + 2] > 150) positions.array[i3 + 2] = -150;
        if (positions.array[i3 + 2] < -150) positions.array[i3 + 2] = 150;
      }

      positions.needsUpdate = true;
    });
  }

  private createCloudTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createLightningSystem(): void {
    if (this.lightningSystem) return;

    this.lightningSystem = {
      frequency: 0.1,
      intensity: 10,
      duration: 100,
      branches: 3,
      color: new THREE.Color(0xffffff)
    };

    this.scheduleLightningStrike();
  }

  private scheduleLightningStrike(): void {
    if (!this.lightningSystem || this.weatherState.type !== WeatherType.STORM) return;

    const delay = Math.random() * 10000 / this.lightningSystem.frequency;
    
    setTimeout(() => {
      this.triggerLightning();
      this.scheduleLightningStrike();
    }, delay);
  }

  private triggerLightning(): void {
    if (!this.lightningSystem) return;

    const flash = new THREE.PointLight(
      this.lightningSystem.color,
      this.lightningSystem.intensity,
      200
    );
    
    flash.position.set(
      (Math.random() - 0.5) * 200,
      50 + Math.random() * 50,
      (Math.random() - 0.5) * 200
    );
    
    this.scene.add(flash);
    
    // Criar geometria do relâmpago
    const lightningGeometry = this.generateLightningGeometry(
      flash.position,
      new THREE.Vector3(flash.position.x, 0, flash.position.z),
      this.lightningSystem.branches
    );
    
    const lightningMaterial = new THREE.LineBasicMaterial({
      color: this.lightningSystem.color,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    
    const lightning = new THREE.LineSegments(lightningGeometry, lightningMaterial);
    this.scene.add(lightning);
    
    // Remover após duração
    setTimeout(() => {
      this.scene.remove(flash);
      this.scene.remove(lightning);
      lightningGeometry.dispose();
      lightningMaterial.dispose();
    }, this.lightningSystem.duration);
    
    // Som do trovão (emitir evento)
    const thunderDelay = flash.position.length() / 340 * 1000; // velocidade do som
    setTimeout(() => {
      this.emit('thunder', { intensity: this.lightningSystem!.intensity });
    }, thunderDelay);
  }

  private generateLightningGeometry(start: THREE.Vector3, end: THREE.Vector3, branches: number): THREE.BufferGeometry {
    const points: THREE.Vector3[] = [];
    
    const subdivisions = 10;
    const offset = 5;
    
    points.push(start);
    
    for (let i = 1; i < subdivisions; i++) {
      const t = i / subdivisions;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      point.x += (Math.random() - 0.5) * offset;
      point.z += (Math.random() - 0.5) * offset;
      points.push(point);
      
      // Adicionar ramificações
      if (Math.random() < 0.3 && branches > 0) {
        const branchEnd = point.clone();
        branchEnd.x += (Math.random() - 0.5) * 20;
        branchEnd.y -= Math.random() * 10;
        branchEnd.z += (Math.random() - 0.5) * 20;
        
        const branchGeometry = this.generateLightningGeometry(point, branchEnd, branches - 1);
        // Adicionar pontos da ramificação
      }
    }
    
    points.push(end);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }

  public setTimeOfDay(hours: number): void {
    this.lightingState.timeOfDay = hours % 24;
    this.updateSunMoonPositions();
    this.updateLightingColors();
    this.emit('timeChanged', this.lightingState.timeOfDay);
  }

  private updateSunMoonPositions(): void {
    const time = this.lightingState.timeOfDay;
    const angle = (time / 24) * Math.PI * 2 - Math.PI / 2;
    
    // Posição do sol
    this.lightingState.sunPosition.set(
      Math.cos(angle) * 100,
      Math.sin(angle) * 100,
      0
    );
    
    // Posição da lua (oposta ao sol)
    this.lightingState.moonPosition.set(
      -Math.cos(angle) * 100,
      -Math.sin(angle) * 100,
      0
    );
    
    this.sunLight.position.copy(this.lightingState.sunPosition);
    this.moonLight.position.copy(this.lightingState.moonPosition);
    
    // Ajustar intensidades
    const sunHeight = Math.sin(angle);
    this.lightingState.sunIntensity = Math.max(0, sunHeight);
    this.lightingState.moonIntensity = Math.max(0, -sunHeight) * 0.3;
    
    this.sunLight.intensity = this.lightingState.sunIntensity;
    this.moonLight.intensity = this.lightingState.moonIntensity;
  }

  private updateLightingColors(): void {
    const time = this.lightingState.timeOfDay;
    
    // Cores baseadas na hora do dia
    if (time >= 5 && time < 7) {
      // Amanhecer
      this.lightingState.sunColor = new THREE.Color(0xff6b35);
      this.lightingState.ambientColor = new THREE.Color(0x4a4a6a);
      this.lightingState.fogColor = new THREE.Color(0xffc0a0);
    } else if (time >= 7 && time < 17) {
      // Dia
      this.lightingState.sunColor = new THREE.Color(0xffffcc);
      this.lightingState.ambientColor = new THREE.Color(0x606080);
      this.lightingState.fogColor = new THREE.Color(0xe0e0e0);
    } else if (time >= 17 && time < 19) {
      // Pôr do sol
      this.lightingState.sunColor = new THREE.Color(0xff8040);
      this.lightingState.ambientColor = new THREE.Color(0x505080);
      this.lightingState.fogColor = new THREE.Color(0xffaa80);
    } else {
      // Noite
      this.lightingState.sunColor = new THREE.Color(0x202040);
      this.lightingState.ambientColor = new THREE.Color(0x202040);
      this.lightingState.fogColor = new THREE.Color(0x101020);
    }
    
    this.sunLight.color = this.lightingState.sunColor;
    this.ambientLight.color = this.lightingState.ambientColor;
    
    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).color = this.lightingState.fogColor;
    }
  }

  public enableDayNightCycle(duration: number = 600): void {
    this.dayNightCycle = true;
    this.dayDuration = duration;
    this.emit('dayNightCycleEnabled', duration);
  }

  public disableDayNightCycle(): void {
    this.dayNightCycle = false;
    this.emit('dayNightCycleDisabled');
  }

  private clearPrecipitation(): void {
    const precipitation = this.particleSystems.get('precipitation');
    if (precipitation) {
      this.scene.remove(precipitation);
      precipitation.geometry.dispose();
      (precipitation.material as THREE.Material).dispose();
      this.particleSystems.delete('precipitation');
    }
    this.precipitationSystem = null;
  }

  public update(deltaTime: number): void {
    // Atualizar ciclo dia/noite
    if (this.dayNightCycle) {
      const hoursPerSecond = 24 / this.dayDuration;
      this.setTimeOfDay(this.lightingState.timeOfDay + deltaTime * hoursPerSecond);
    }
    
    // Atualizar sistemas de partículas
    if (this.precipitationSystem) {
      if (this.precipitationSystem.type === 'rain') {
        this.updateRainSystem();
      } else if (this.precipitationSystem.type === 'snow') {
        this.updateSnowSystem();
      }
    }
    
    // Atualizar nuvens
    if (this.cloudSystem) {
      this.updateCloudSystem();
    }
    
    // Atualizar transições
    this.transitions.forEach(transition => transition());
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getWeatherState(): WeatherState {
    return { ...this.weatherState };
  }

  public getLightingState(): LightingState {
    return { ...this.lightingState };
  }

  public setEnvironmentalEffect(effect: keyof EnvironmentalEffects, enabled: boolean): void {
    this.environmentalEffects[effect] = enabled;
    this.emit('effectToggled', { effect, enabled });
  }
}

export default WeatherLightingSystem;