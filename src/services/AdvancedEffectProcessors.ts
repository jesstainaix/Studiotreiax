/**
 * Processadores de efeitos avançados para o VFX Engine
 * Implementa efeitos complexos como partículas, distorções, e simulações físicas
 */

import { NodeProcessor, ProcessingResult } from './NodeBasedCompositor';

export interface ParticleSystemConfig {
  particleCount: number;
  emissionRate: number;
  lifetime: number;
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  size: { min: number; max: number };
  color: { start: string; end: string };
  opacity: { start: number; end: number };
  texture?: string;
  blendMode: 'normal' | 'additive' | 'multiply' | 'screen';
}

export interface DistortionConfig {
  type: 'wave' | 'ripple' | 'twist' | 'bulge' | 'fisheye';
  strength: number;
  frequency: number;
  amplitude: number;
  center: { x: number; y: number };
  radius: number;
  animated: boolean;
  speed: number;
}

export interface LightingConfig {
  type: 'directional' | 'point' | 'spot' | 'ambient';
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  color: string;
  intensity: number;
  range: number;
  falloff: number;
  shadows: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
}

export interface FluidSimulationConfig {
  viscosity: number;
  density: number;
  pressure: number;
  temperature: number;
  gravity: { x: number; y: number };
  boundaries: 'wrap' | 'bounce' | 'absorb';
  resolution: number;
  timeStep: number;
}

/**
 * Processador de sistema de partículas
 */
export class ParticleSystemProcessor implements NodeProcessor {
  private particles: Particle[] = [];
  private emissionTimer: number = 0;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D | WebGLRenderingContext;
  private useWebGL: boolean = true;
  
  async process(inputs: Record<string, any>, properties: Record<string, any>): Promise<ProcessingResult> {
    try {
      const config = this.parseConfig(properties);
      const deltaTime = inputs.deltaTime || 16.67; // 60fps default
      
      // Inicializar canvas se necessário
      if (!this.canvas) {
        this.initializeCanvas(inputs.width || 1920, inputs.height || 1080);
      }
      
      // Atualizar sistema de partículas
      this.updateParticles(config, deltaTime);
      this.emitParticles(config, deltaTime);
      
      // Renderizar partículas
      const result = this.useWebGL ? 
        await this.renderWebGL(config) : 
        await this.renderCanvas2D(config);
      
      return {
        success: true,
        data: result,
        metadata: {
          particleCount: this.particles.length,
          renderTime: performance.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }
  
  private parseConfig(properties: Record<string, any>): ParticleSystemConfig {
    return {
      particleCount: properties.particleCount || 1000,
      emissionRate: properties.emissionRate || 60,
      lifetime: properties.lifetime || 2000,
      velocity: properties.velocity || { x: 0, y: -100, z: 0 },
      acceleration: properties.acceleration || { x: 0, y: 98, z: 0 },
      size: properties.size || { min: 2, max: 8 },
      color: properties.color || { start: '#ffffff', end: '#000000' },
      opacity: properties.opacity || { start: 1, end: 0 },
      texture: properties.texture,
      blendMode: properties.blendMode || 'normal'
    };
  }
  
  private initializeCanvas(width: number, height: number): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.useWebGL) {
      this.context = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
      if (!this.context) {
        this.useWebGL = false;
        this.context = this.canvas.getContext('2d');
      }
    } else {
      this.context = this.canvas.getContext('2d');
    }
  }
  
  private updateParticles(config: ParticleSystemConfig, deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update lifetime
      particle.age += deltaTime;
      if (particle.age >= particle.lifetime) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update physics
      particle.velocity.x += config.acceleration.x * dt;
      particle.velocity.y += config.acceleration.y * dt;
      particle.velocity.z += config.acceleration.z * dt;
      
      particle.position.x += particle.velocity.x * dt;
      particle.position.y += particle.velocity.y * dt;
      particle.position.z += particle.velocity.z * dt;
      
      // Update visual properties
      const lifeRatio = particle.age / particle.lifetime;
      particle.size = this.lerp(config.size.min, config.size.max, 1 - lifeRatio);
      particle.opacity = this.lerp(config.opacity.start, config.opacity.end, lifeRatio);
      particle.color = this.lerpColor(config.color.start, config.color.end, lifeRatio);
    }
  }
  
  private emitParticles(config: ParticleSystemConfig, deltaTime: number): void {
    this.emissionTimer += deltaTime;
    const emissionInterval = 1000 / config.emissionRate; // ms per particle
    
    while (this.emissionTimer >= emissionInterval && this.particles.length < config.particleCount) {
      this.emissionTimer -= emissionInterval;
      
      const particle: Particle = {
        position: { x: 0, y: 0, z: 0 },
        velocity: {
          x: config.velocity.x + (Math.random() - 0.5) * 50,
          y: config.velocity.y + (Math.random() - 0.5) * 50,
          z: config.velocity.z + (Math.random() - 0.5) * 50
        },
        age: 0,
        lifetime: config.lifetime + (Math.random() - 0.5) * config.lifetime * 0.5,
        size: config.size.min,
        opacity: config.opacity.start,
        color: config.color.start
      };
      
      this.particles.push(particle);
    }
  }
  
  private async renderCanvas2D(config: ParticleSystemConfig): Promise<HTMLCanvasElement> {
    const ctx = this.context as CanvasRenderingContext2D;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    
    // Set blend mode
    ctx.globalCompositeOperation = config.blendMode;
    
    // Render particles
    for (const particle of this.particles) {
      ctx.save();
      
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    return this.canvas!;
  }
  
  private async renderWebGL(config: ParticleSystemConfig): Promise<HTMLCanvasElement> {
    // Implementação WebGL para melhor performance
    // Por simplicidade, usar Canvas2D por enquanto
    return this.renderCanvas2D(config);
  }
  
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  private lerpColor(start: string, end: string, t: number): string {
    // Implementação simplificada de interpolação de cor
    return t < 0.5 ? start : end;
  }
}

/**
 * Processador de distorção
 */
export class DistortionProcessor implements NodeProcessor {
  private shader?: WebGLProgram;
  private gl?: WebGLRenderingContext;
  
  async process(inputs: Record<string, any>, properties: Record<string, any>): Promise<ProcessingResult> {
    try {
      const config = this.parseDistortionConfig(properties);
      const sourceImage = inputs.image as HTMLCanvasElement | ImageData;
      
      if (!sourceImage) {
        throw new Error('No source image provided');
      }
      
      const result = await this.applyDistortion(sourceImage, config);
      
      return {
        success: true,
        data: result,
        metadata: {
          distortionType: config.type,
          strength: config.strength
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }
  
  private parseDistortionConfig(properties: Record<string, any>): DistortionConfig {
    return {
      type: properties.type || 'wave',
      strength: properties.strength || 0.1,
      frequency: properties.frequency || 1.0,
      amplitude: properties.amplitude || 10.0,
      center: properties.center || { x: 0.5, y: 0.5 },
      radius: properties.radius || 0.5,
      animated: properties.animated || false,
      speed: properties.speed || 1.0
    };
  }
  
  private async applyDistortion(source: HTMLCanvasElement | ImageData, config: DistortionConfig): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    if (source instanceof HTMLCanvasElement) {
      canvas.width = source.width;
      canvas.height = source.height;
    } else {
      canvas.width = source.width;
      canvas.height = source.height;
    }
    
    // Implementar diferentes tipos de distorção
    switch (config.type) {
      case 'wave':
        return this.applyWaveDistortion(source, config, canvas, ctx);
      case 'ripple':
        return this.applyRippleDistortion(source, config, canvas, ctx);
      case 'twist':
        return this.applyTwistDistortion(source, config, canvas, ctx);
      case 'bulge':
        return this.applyBulgeDistortion(source, config, canvas, ctx);
      case 'fisheye':
        return this.applyFisheyeDistortion(source, config, canvas, ctx);
      default:
        ctx.drawImage(source as HTMLCanvasElement, 0, 0);
        return canvas;
    }
  }
  
  private applyWaveDistortion(
    source: HTMLCanvasElement | ImageData, 
    config: DistortionConfig, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D
  ): HTMLCanvasElement {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const sourceData = source instanceof HTMLCanvasElement ? 
      ctx.getImageData(0, 0, source.width, source.height) : source;
    
    const time = config.animated ? Date.now() * 0.001 * config.speed : 0;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const normalizedX = x / canvas.width;
        const normalizedY = y / canvas.height;
        
        // Aplicar distorção de onda
        const waveOffset = Math.sin((normalizedY * config.frequency + time) * Math.PI * 2) * config.amplitude * config.strength;
        const sourceX = Math.floor(x + waveOffset);
        const sourceY = y;
        
        if (sourceX >= 0 && sourceX < canvas.width && sourceY >= 0 && sourceY < canvas.height) {
          const sourceIndex = (sourceY * canvas.width + sourceX) * 4;
          const targetIndex = (y * canvas.width + x) * 4;
          
          imageData.data[targetIndex] = sourceData.data[sourceIndex];
          imageData.data[targetIndex + 1] = sourceData.data[sourceIndex + 1];
          imageData.data[targetIndex + 2] = sourceData.data[sourceIndex + 2];
          imageData.data[targetIndex + 3] = sourceData.data[sourceIndex + 3];
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  private applyRippleDistortion(
    source: HTMLCanvasElement | ImageData, 
    config: DistortionConfig, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D
  ): HTMLCanvasElement {
    // Implementação de distorção de ondulação
    ctx.drawImage(source as HTMLCanvasElement, 0, 0);
    return canvas;
  }
  
  private applyTwistDistortion(
    source: HTMLCanvasElement | ImageData, 
    config: DistortionConfig, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D
  ): HTMLCanvasElement {
    // Implementação de distorção de torção
    ctx.drawImage(source as HTMLCanvasElement, 0, 0);
    return canvas;
  }
  
  private applyBulgeDistortion(
    source: HTMLCanvasElement | ImageData, 
    config: DistortionConfig, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D
  ): HTMLCanvasElement {
    // Implementação de distorção de protuberância
    ctx.drawImage(source as HTMLCanvasElement, 0, 0);
    return canvas;
  }
  
  private applyFisheyeDistortion(
    source: HTMLCanvasElement | ImageData, 
    config: DistortionConfig, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D
  ): HTMLCanvasElement {
    // Implementação de distorção olho de peixe
    ctx.drawImage(source as HTMLCanvasElement, 0, 0);
    return canvas;
  }
}

/**
 * Processador de iluminação avançada
 */
export class AdvancedLightingProcessor implements NodeProcessor {
  async process(inputs: Record<string, any>, properties: Record<string, any>): Promise<ProcessingResult> {
    try {
      const config = this.parseLightingConfig(properties);
      const sourceImage = inputs.image as HTMLCanvasElement;
      
      if (!sourceImage) {
        throw new Error('No source image provided');
      }
      
      const result = await this.applyLighting(sourceImage, config);
      
      return {
        success: true,
        data: result,
        metadata: {
          lightType: config.type,
          intensity: config.intensity
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }
  
  private parseLightingConfig(properties: Record<string, any>): LightingConfig {
    return {
      type: properties.type || 'directional',
      position: properties.position || { x: 0, y: 0, z: 100 },
      direction: properties.direction || { x: 0, y: 0, z: -1 },
      color: properties.color || '#ffffff',
      intensity: properties.intensity || 1.0,
      range: properties.range || 1000,
      falloff: properties.falloff || 1.0,
      shadows: properties.shadows || false,
      shadowQuality: properties.shadowQuality || 'medium'
    };
  }
  
  private async applyLighting(source: HTMLCanvasElement, config: LightingConfig): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = source.width;
    canvas.height = source.height;
    
    // Desenhar imagem base
    ctx.drawImage(source, 0, 0);
    
    // Aplicar iluminação baseada no tipo
    switch (config.type) {
      case 'directional':
        this.applyDirectionalLight(ctx, canvas, config);
        break;
      case 'point':
        this.applyPointLight(ctx, canvas, config);
        break;
      case 'spot':
        this.applySpotLight(ctx, canvas, config);
        break;
      case 'ambient':
        this.applyAmbientLight(ctx, canvas, config);
        break;
    }
    
    return canvas;
  }
  
  private applyDirectionalLight(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: LightingConfig): void {
    // Implementação de luz direcional
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${config.intensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  
  private applyPointLight(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: LightingConfig): void {
    // Implementação de luz pontual
    const centerX = (config.position.x + 1) * canvas.width / 2;
    const centerY = (config.position.y + 1) * canvas.height / 2;
    const radius = config.range;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${config.intensity})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  
  private applySpotLight(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: LightingConfig): void {
    // Implementação de luz spot
    this.applyPointLight(ctx, canvas, config); // Simplificado
  }
  
  private applyAmbientLight(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: LightingConfig): void {
    // Implementação de luz ambiente
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(255, 255, 255, ${config.intensity * 0.2})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Processador de simulação de fluidos
 */
export class FluidSimulationProcessor implements NodeProcessor {
  private grid?: FluidGrid;
  
  async process(inputs: Record<string, any>, properties: Record<string, any>): Promise<ProcessingResult> {
    try {
      const config = this.parseFluidConfig(properties);
      
      // Inicializar grid se necessário
      if (!this.grid) {
        this.grid = new FluidGrid(config.resolution, config.resolution, config);
      }
      
      // Atualizar simulação
      const deltaTime = inputs.deltaTime || 16.67;
      this.grid.update(deltaTime / 1000, config);
      
      // Renderizar resultado
      const result = await this.renderFluid(this.grid, inputs.width || 512, inputs.height || 512);
      
      return {
        success: true,
        data: result,
        metadata: {
          resolution: config.resolution,
          viscosity: config.viscosity
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }
  
  private parseFluidConfig(properties: Record<string, any>): FluidSimulationConfig {
    return {
      viscosity: properties.viscosity || 0.1,
      density: properties.density || 1.0,
      pressure: properties.pressure || 1.0,
      temperature: properties.temperature || 20.0,
      gravity: properties.gravity || { x: 0, y: -9.8 },
      boundaries: properties.boundaries || 'bounce',
      resolution: properties.resolution || 64,
      timeStep: properties.timeStep || 0.016
    };
  }
  
  private async renderFluid(grid: FluidGrid, width: number, height: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = width;
    canvas.height = height;
    
    const imageData = ctx.createImageData(width, height);
    
    // Renderizar densidade do fluido como cor
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gridX = Math.floor(x * grid.width / width);
        const gridY = Math.floor(y * grid.height / height);
        
        const density = grid.getDensity(gridX, gridY);
        const velocity = grid.getVelocity(gridX, gridY);
        
        const index = (y * width + x) * 4;
        
        // Mapear densidade para cor azul
        imageData.data[index] = 0; // R
        imageData.data[index + 1] = Math.floor(velocity.x * 128 + 128); // G
        imageData.data[index + 2] = Math.floor(density * 255); // B
        imageData.data[index + 3] = 255; // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}

// Interfaces auxiliares
interface Particle {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  age: number;
  lifetime: number;
  size: number;
  opacity: number;
  color: string;
}

class FluidGrid {
  public width: number;
  public height: number;
  private density: Float32Array;
  private velocityX: Float32Array;
  private velocityY: Float32Array;
  private pressure: Float32Array;
  
  constructor(width: number, height: number, config: FluidSimulationConfig) {
    this.width = width;
    this.height = height;
    
    const size = width * height;
    this.density = new Float32Array(size);
    this.velocityX = new Float32Array(size);
    this.velocityY = new Float32Array(size);
    this.pressure = new Float32Array(size);
    
    // Inicializar com valores padrão
    this.density.fill(config.density);
  }
  
  update(deltaTime: number, config: FluidSimulationConfig): void {
    // Implementação simplificada da simulação de fluidos
    // Em uma implementação real, usaria Navier-Stokes
    
    for (let i = 0; i < this.density.length; i++) {
      // Aplicar gravidade
      this.velocityY[i] += config.gravity.y * deltaTime;
      
      // Aplicar viscosidade (simplificado)
      this.velocityX[i] *= (1 - config.viscosity * deltaTime);
      this.velocityY[i] *= (1 - config.viscosity * deltaTime);
    }
  }
  
  getDensity(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return 0;
    }
    return this.density[y * this.width + x];
  }
  
  getVelocity(x: number, y: number): { x: number; y: number } {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return { x: 0, y: 0 };
    }
    const index = y * this.width + x;
    return {
      x: this.velocityX[index],
      y: this.velocityY[index]
    };
  }
}