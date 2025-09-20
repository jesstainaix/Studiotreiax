import { VFXEffect, VFXKeyframe } from './AdvancedVFXEngine';

export interface Particle {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
  size: number;
  color: { r: number; g: number; b: number; a: number };
  rotation: number;
  rotationSpeed: number;
  mass: number;
  active: boolean;
}

export interface ParticleEmitter {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  spread: number;
  rate: number;
  maxParticles: number;
  particleLife: { min: number; max: number };
  particleSize: { min: number; max: number };
  particleSpeed: { min: number; max: number };
  gravity: { x: number; y: number; z: number };
  wind: { x: number; y: number; z: number };
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };
  texture?: string;
  blendMode: string;
  active: boolean;
  burst: boolean;
  burstCount: number;
  shape: 'point' | 'circle' | 'sphere' | 'box' | 'cone';
  shapeSize: { x: number; y: number; z: number };
}

export interface ParticleForce {
  id: string;
  name: string;
  type: 'gravity' | 'wind' | 'vortex' | 'attractor' | 'repulsor' | 'turbulence';
  position: { x: number; y: number; z: number };
  strength: number;
  radius: number;
  falloff: 'linear' | 'quadratic' | 'cubic';
  active: boolean;
}

export interface ParticleSystemConfig {
  maxParticles: number;
  enableCollisions: boolean;
  enablePhysics: boolean;
  enableGPUAcceleration: boolean;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  renderMode: '2d' | '3d';
  sortParticles: boolean;
  enableLighting: boolean;
  enableShadows: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private emitters: ParticleEmitter[] = [];
  private forces: ParticleForce[] = [];
  private config: ParticleSystemConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private webglCanvas?: HTMLCanvasElement;
  private gl?: WebGLRenderingContext;
  private isRunning = false;
  private lastTime = 0;
  private particlePool: Particle[] = [];
  private textures: Map<string, HTMLImageElement> = new Map();
  private shaderProgram?: WebGLProgram;
  private vertexBuffer?: WebGLBuffer;
  private indexBuffer?: WebGLBuffer;

  constructor(canvas: HTMLCanvasElement, webglCanvas?: HTMLCanvasElement, config?: Partial<ParticleSystemConfig>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.webglCanvas = webglCanvas;
    
    if (webglCanvas) {
      this.gl = webglCanvas.getContext('webgl')!;
      this.initWebGL();
    }

    this.config = {
      maxParticles: 10000,
      enableCollisions: false,
      enablePhysics: true,
      enableGPUAcceleration: !!webglCanvas,
      qualityLevel: 'high',
      renderMode: webglCanvas ? '3d' : '2d',
      sortParticles: true,
      enableLighting: false,
      enableShadows: false,
      ...config
    };

    this.initParticlePool();
  }

  private initParticlePool(): void {
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return {
      id: Math.random().toString(36).substr(2, 9),
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      life: 0,
      maxLife: 1,
      size: 1,
      color: { r: 255, g: 255, b: 255, a: 1 },
      rotation: 0,
      rotationSpeed: 0,
      mass: 1,
      active: false
    };
  }

  private initWebGL(): void {
    if (!this.gl) return;

    const vertexShaderSource = `
      attribute vec3 a_position;
      attribute vec4 a_color;
      attribute float a_size;
      attribute float a_rotation;
      
      uniform mat4 u_projection;
      uniform mat4 u_view;
      
      varying vec4 v_color;
      varying float v_size;
      varying float v_rotation;
      
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 1.0);
        gl_PointSize = a_size;
        v_color = a_color;
        v_size = a_size;
        v_rotation = a_rotation;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec4 v_color;
      varying float v_size;
      varying float v_rotation;
      
      uniform sampler2D u_texture;
      uniform bool u_useTexture;
      
      void main() {
        vec2 coord = gl_PointCoord;
        
        if (u_useTexture) {
          // Aplicar rotação
          float cos_r = cos(v_rotation);
          float sin_r = sin(v_rotation);
          mat2 rotation = mat2(cos_r, -sin_r, sin_r, cos_r);
          coord = (coord - 0.5) * rotation + 0.5;
          
          vec4 texColor = texture2D(u_texture, coord);
          gl_FragColor = texColor * v_color;
        } else {
          // Partícula circular simples
          float dist = distance(coord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - (dist * 2.0);
          gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
        }
      }
    `;

    this.shaderProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    this.createBuffers();
  }

  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | undefined {
    if (!this.gl) return;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return;

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Erro ao linkar shader program:', this.gl.getProgramInfoLog(program));
      return;
    }

    return program;
  }

  private createShader(type: number, source: string): WebGLShader | undefined {
    if (!this.gl) return;

    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Erro ao compilar shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return;
    }

    return shader;
  }

  private createBuffers(): void {
    if (!this.gl) return;

    this.vertexBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();
  }

  public addEmitter(emitter: ParticleEmitter): void {
    this.emitters.push(emitter);
  }

  public removeEmitter(emitterId: string): void {
    this.emitters = this.emitters.filter(e => e.id !== emitterId);
  }

  public updateEmitter(emitterId: string, updates: Partial<ParticleEmitter>): void {
    const emitter = this.emitters.find(e => e.id === emitterId);
    if (emitter) {
      Object.assign(emitter, updates);
    }
  }

  public addForce(force: ParticleForce): void {
    this.forces.push(force);
  }

  public removeForce(forceId: string): void {
    this.forces = this.forces.filter(f => f.id !== forceId);
  }

  public updateForce(forceId: string, updates: Partial<ParticleForce>): void {
    const force = this.forces.find(f => f.id === forceId);
    if (force) {
      Object.assign(force, updates);
    }
  }

  public start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.update();
  }

  public stop(): void {
    this.isRunning = false;
  }

  public reset(): void {
    this.particles.forEach(particle => {
      particle.active = false;
      this.particlePool.push(particle);
    });
    this.particles = [];
  }

  private update(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Emitir novas partículas
    this.emitParticles(deltaTime);

    // Atualizar partículas existentes
    this.updateParticles(deltaTime);

    // Aplicar forças
    this.applyForces(deltaTime);

    // Renderizar
    this.render();

    requestAnimationFrame(() => this.update());
  }

  private emitParticles(deltaTime: number): void {
    this.emitters.forEach(emitter => {
      if (!emitter.active) return;

      if (emitter.burst) {
        // Emissão em rajada
        for (let i = 0; i < emitter.burstCount; i++) {
          this.createParticleFromEmitter(emitter);
        }
        emitter.active = false; // Desativar após rajada
      } else {
        // Emissão contínua
        const particlesToEmit = emitter.rate * deltaTime;
        const wholeParticles = Math.floor(particlesToEmit);
        const fractionalPart = particlesToEmit - wholeParticles;

        for (let i = 0; i < wholeParticles; i++) {
          this.createParticleFromEmitter(emitter);
        }

        // Chance de emitir partícula adicional baseada na parte fracionária
        if (Math.random() < fractionalPart) {
          this.createParticleFromEmitter(emitter);
        }
      }
    });
  }

  private createParticleFromEmitter(emitter: ParticleEmitter): void {
    if (this.particles.length >= this.config.maxParticles) return;
    if (this.particlePool.length === 0) return;

    const particle = this.particlePool.pop()!;
    
    // Posição inicial baseada na forma do emissor
    const position = this.getEmitterPosition(emitter);
    particle.position = { ...position };

    // Direção e velocidade
    const direction = this.getEmitterDirection(emitter);
    const speed = this.randomBetween(emitter.particleSpeed.min, emitter.particleSpeed.max);
    
    particle.velocity = {
      x: direction.x * speed,
      y: direction.y * speed,
      z: direction.z * speed
    };

    // Propriedades da partícula
    particle.life = 0;
    particle.maxLife = this.randomBetween(emitter.particleLife.min, emitter.particleLife.max);
    particle.size = this.randomBetween(emitter.particleSize.min, emitter.particleSize.max);
    particle.color = { ...emitter.colorStart };
    particle.rotation = Math.random() * Math.PI * 2;
    particle.rotationSpeed = (Math.random() - 0.5) * 4;
    particle.mass = 1;
    particle.active = true;

    // Aplicar gravidade e vento iniciais
    particle.acceleration = {
      x: emitter.gravity.x + emitter.wind.x,
      y: emitter.gravity.y + emitter.wind.y,
      z: emitter.gravity.z + emitter.wind.z
    };

    this.particles.push(particle);
  }

  private getEmitterPosition(emitter: ParticleEmitter): { x: number; y: number; z: number } {
    const { position, shape, shapeSize } = emitter;
    
    switch (shape) {
      case 'point':
        return { ...position };
        
      case 'circle': {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * shapeSize.x;
        return {
          x: position.x + Math.cos(angle) * radius,
          y: position.y + Math.sin(angle) * radius,
          z: position.z
        };
      }
      
      case 'sphere': {
        const phi = Math.random() * Math.PI * 2;
        const cosTheta = Math.random() * 2 - 1;
        const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
        const radius = Math.random() * shapeSize.x;
        
        return {
          x: position.x + radius * sinTheta * Math.cos(phi),
          y: position.y + radius * sinTheta * Math.sin(phi),
          z: position.z + radius * cosTheta
        };
      }
      
      case 'box':
        return {
          x: position.x + (Math.random() - 0.5) * shapeSize.x,
          y: position.y + (Math.random() - 0.5) * shapeSize.y,
          z: position.z + (Math.random() - 0.5) * shapeSize.z
        };
        
      case 'cone': {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * shapeSize.x;
        const height = Math.random() * shapeSize.y;
        
        return {
          x: position.x + Math.cos(angle) * radius * (1 - height / shapeSize.y),
          y: position.y + height,
          z: position.z + Math.sin(angle) * radius * (1 - height / shapeSize.y)
        };
      }
      
      default:
        return { ...position };
    }
  }

  private getEmitterDirection(emitter: ParticleEmitter): { x: number; y: number; z: number } {
    const { direction, spread } = emitter;
    
    // Adicionar variação baseada no spread
    const spreadAngle = (Math.random() - 0.5) * spread;
    const spreadAngle2 = (Math.random() - 0.5) * spread;
    
    // Normalizar direção base
    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    const normalizedDir = {
      x: direction.x / length,
      y: direction.y / length,
      z: direction.z / length
    };
    
    // Aplicar rotação para spread
    const cosSpread = Math.cos(spreadAngle);
    const sinSpread = Math.sin(spreadAngle);
    
    return {
      x: normalizedDir.x * cosSpread - normalizedDir.y * sinSpread,
      y: normalizedDir.x * sinSpread + normalizedDir.y * cosSpread,
      z: normalizedDir.z + spreadAngle2 * 0.1
    };
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (!particle.active) {
        this.particles.splice(i, 1);
        this.particlePool.push(particle);
        continue;
      }

      // Atualizar vida
      particle.life += deltaTime;
      if (particle.life >= particle.maxLife) {
        particle.active = false;
        continue;
      }

      // Atualizar física
      if (this.config.enablePhysics) {
        // Atualizar velocidade com aceleração
        particle.velocity.x += particle.acceleration.x * deltaTime;
        particle.velocity.y += particle.acceleration.y * deltaTime;
        particle.velocity.z += particle.acceleration.z * deltaTime;
        
        // Atualizar posição com velocidade
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        
        // Atualizar rotação
        particle.rotation += particle.rotationSpeed * deltaTime;
      }

      // Interpolação de cor ao longo da vida
      const lifeRatio = particle.life / particle.maxLife;
      const emitter = this.emitters[0]; // Simplificado - usar primeiro emissor
      if (emitter) {
        particle.color = {
          r: this.lerp(emitter.colorStart.r, emitter.colorEnd.r, lifeRatio),
          g: this.lerp(emitter.colorStart.g, emitter.colorEnd.g, lifeRatio),
          b: this.lerp(emitter.colorStart.b, emitter.colorEnd.b, lifeRatio),
          a: this.lerp(emitter.colorStart.a, emitter.colorEnd.a, lifeRatio)
        };
      }

      // Reset aceleração para próximo frame
      particle.acceleration = { x: 0, y: 0, z: 0 };
    }
  }

  private applyForces(deltaTime: number): void {
    this.forces.forEach(force => {
      if (!force.active) return;

      this.particles.forEach(particle => {
        if (!particle.active) return;

        const dx = force.position.x - particle.position.x;
        const dy = force.position.y - particle.position.y;
        const dz = force.position.z - particle.position.z;
        const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);

        if (distance > force.radius) return;

        let strength = force.strength;
        
        // Aplicar falloff
        const normalizedDistance = distance / force.radius;
        switch (force.falloff) {
          case 'linear':
            strength *= (1 - normalizedDistance);
            break;
          case 'quadratic':
            strength *= (1 - normalizedDistance ** 2);
            break;
          case 'cubic':
            strength *= (1 - normalizedDistance ** 3);
            break;
        }

        switch (force.type) {
          case 'gravity':
          case 'attractor': {
            const forceX = (dx / distance) * strength / particle.mass;
            const forceY = (dy / distance) * strength / particle.mass;
            const forceZ = (dz / distance) * strength / particle.mass;
            
            particle.acceleration.x += forceX;
            particle.acceleration.y += forceY;
            particle.acceleration.z += forceZ;
            break;
          }
          
          case 'repulsor': {
            const forceX = -(dx / distance) * strength / particle.mass;
            const forceY = -(dy / distance) * strength / particle.mass;
            const forceZ = -(dz / distance) * strength / particle.mass;
            
            particle.acceleration.x += forceX;
            particle.acceleration.y += forceY;
            particle.acceleration.z += forceZ;
            break;
          }
          
          case 'vortex': {
            const forceX = -dy * strength / particle.mass;
            const forceY = dx * strength / particle.mass;
            
            particle.acceleration.x += forceX;
            particle.acceleration.y += forceY;
            break;
          }
          
          case 'wind': {
            particle.acceleration.x += strength;
            break;
          }
          
          case 'turbulence': {
            const noise = this.noise(particle.position.x * 0.01, particle.position.y * 0.01, performance.now() * 0.001);
            particle.acceleration.x += noise * strength;
            particle.acceleration.y += noise * strength * 0.5;
            break;
          }
        }
      });
    });
  }

  private render(): void {
    if (this.config.enableGPUAcceleration && this.gl && this.shaderProgram) {
      this.renderWebGL();
    } else {
      this.render2D();
    }
  }

  private render2D(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Ordenar partículas por profundidade se necessário
    if (this.config.sortParticles) {
      this.particles.sort((a, b) => b.position.z - a.position.z);
    }

    this.particles.forEach(particle => {
      if (!particle.active) return;

      this.ctx.save();
      
      // Aplicar transformações
      this.ctx.translate(particle.position.x, particle.position.y);
      this.ctx.rotate(particle.rotation);
      this.ctx.scale(particle.size, particle.size);
      
      // Aplicar cor e alpha
      this.ctx.globalAlpha = particle.color.a;
      this.ctx.fillStyle = `rgb(${particle.color.r}, ${particle.color.g}, ${particle.color.b})`;
      
      // Desenhar partícula
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 1, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }

  private renderWebGL(): void {
    if (!this.gl || !this.shaderProgram) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.useProgram(this.shaderProgram);

    // Preparar dados das partículas
    const vertexData = new Float32Array(this.particles.length * 9); // position(3) + color(4) + size(1) + rotation(1)
    
    this.particles.forEach((particle, index) => {
      const offset = index * 9;
      
      // Posição
      vertexData[offset] = particle.position.x;
      vertexData[offset + 1] = particle.position.y;
      vertexData[offset + 2] = particle.position.z;
      
      // Cor
      vertexData[offset + 3] = particle.color.r / 255;
      vertexData[offset + 4] = particle.color.g / 255;
      vertexData[offset + 5] = particle.color.b / 255;
      vertexData[offset + 6] = particle.color.a;
      
      // Tamanho
      vertexData[offset + 7] = particle.size;
      
      // Rotação
      vertexData[offset + 8] = particle.rotation;
    });

    // Upload dados para GPU
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer!);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.DYNAMIC_DRAW);

    // Configurar atributos
    const positionLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
    const colorLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_color');
    const sizeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_size');
    const rotationLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_rotation');

    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.enableVertexAttribArray(sizeLocation);
    this.gl.enableVertexAttribArray(rotationLocation);

    this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 36, 0);
    this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, 36, 12);
    this.gl.vertexAttribPointer(sizeLocation, 1, this.gl.FLOAT, false, 36, 28);
    this.gl.vertexAttribPointer(rotationLocation, 1, this.gl.FLOAT, false, 36, 32);

    // Desenhar partículas
    this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length);
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  private noise(x: number, y: number, z: number): number {
    // Implementação simples de ruído Perlin
    const p = Math.floor;
    const f = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const mix = (a: number, b: number, t: number) => a + t * (b - a);
    
    const X = p(x) & 255;
    const Y = p(y) & 255;
    const Z = p(z) & 255;
    
    x -= p(x);
    y -= p(y);
    z -= p(z);
    
    const u = f(x);
    const v = f(y);
    const w = f(z);
    
    // Simplificado para demonstração
    return mix(
      mix(
        mix(Math.sin(X + Y + Z), Math.sin(X + Y + Z + 1), u),
        mix(Math.sin(X + Y + Z + 256), Math.sin(X + Y + Z + 257), u),
        v
      ),
      mix(
        mix(Math.sin(X + Y + Z + 512), Math.sin(X + Y + Z + 513), u),
        mix(Math.sin(X + Y + Z + 768), Math.sin(X + Y + Z + 769), u),
        v
      ),
      w
    );
  }

  public getParticleCount(): number {
    return this.particles.filter(p => p.active).length;
  }

  public getEmitters(): ParticleEmitter[] {
    return [...this.emitters];
  }

  public getForces(): ParticleForce[] {
    return [...this.forces];
  }

  public dispose(): void {
    this.stop();
    this.reset();
    
    if (this.gl) {
      this.gl.deleteProgram(this.shaderProgram!);
      this.gl.deleteBuffer(this.vertexBuffer!);
      this.gl.deleteBuffer(this.indexBuffer!);
    }
  }
}

// Factory para criar emissores pré-configurados
export class ParticleEmitterFactory {
  static createFireEmitter(position: { x: number; y: number; z: number }): ParticleEmitter {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Fire Emitter',
      position,
      direction: { x: 0, y: -1, z: 0 },
      spread: Math.PI / 4,
      rate: 50,
      maxParticles: 200,
      particleLife: { min: 0.5, max: 2.0 },
      particleSize: { min: 2, max: 8 },
      particleSpeed: { min: 20, max: 60 },
      gravity: { x: 0, y: -50, z: 0 },
      wind: { x: 0, y: 0, z: 0 },
      colorStart: { r: 255, g: 100, b: 0, a: 1 },
      colorEnd: { r: 255, g: 0, b: 0, a: 0 },
      blendMode: 'additive',
      active: true,
      burst: false,
      burstCount: 0,
      shape: 'circle',
      shapeSize: { x: 10, y: 10, z: 10 }
    };
  }

  static createSmokeEmitter(position: { x: number; y: number; z: number }): ParticleEmitter {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Smoke Emitter',
      position,
      direction: { x: 0, y: -1, z: 0 },
      spread: Math.PI / 6,
      rate: 20,
      maxParticles: 100,
      particleLife: { min: 2.0, max: 5.0 },
      particleSize: { min: 5, max: 20 },
      particleSpeed: { min: 10, max: 30 },
      gravity: { x: 0, y: -20, z: 0 },
      wind: { x: 5, y: 0, z: 0 },
      colorStart: { r: 100, g: 100, b: 100, a: 0.8 },
      colorEnd: { r: 200, g: 200, b: 200, a: 0 },
      blendMode: 'normal',
      active: true,
      burst: false,
      burstCount: 0,
      shape: 'circle',
      shapeSize: { x: 15, y: 15, z: 15 }
    };
  }

  static createExplosionEmitter(position: { x: number; y: number; z: number }): ParticleEmitter {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Explosion Emitter',
      position,
      direction: { x: 0, y: 0, z: 0 },
      spread: Math.PI * 2,
      rate: 0,
      maxParticles: 500,
      particleLife: { min: 0.5, max: 3.0 },
      particleSize: { min: 1, max: 10 },
      particleSpeed: { min: 50, max: 200 },
      gravity: { x: 0, y: 100, z: 0 },
      wind: { x: 0, y: 0, z: 0 },
      colorStart: { r: 255, g: 255, b: 0, a: 1 },
      colorEnd: { r: 255, g: 0, b: 0, a: 0 },
      blendMode: 'additive',
      active: true,
      burst: true,
      burstCount: 300,
      shape: 'sphere',
      shapeSize: { x: 5, y: 5, z: 5 }
    };
  }

  static createSparkleEmitter(position: { x: number; y: number; z: number }): ParticleEmitter {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Sparkle Emitter',
      position,
      direction: { x: 0, y: -1, z: 0 },
      spread: Math.PI,
      rate: 30,
      maxParticles: 150,
      particleLife: { min: 1.0, max: 3.0 },
      particleSize: { min: 1, max: 4 },
      particleSpeed: { min: 20, max: 80 },
      gravity: { x: 0, y: 50, z: 0 },
      wind: { x: 0, y: 0, z: 0 },
      colorStart: { r: 255, g: 255, b: 255, a: 1 },
      colorEnd: { r: 255, g: 255, b: 0, a: 0 },
      blendMode: 'additive',
      active: true,
      burst: false,
      burstCount: 0,
      shape: 'point',
      shapeSize: { x: 0, y: 0, z: 0 }
    };
  }
}

// Factory para criar forças pré-configuradas
export class ParticleForceFactory {
  static createGravityForce(position: { x: number; y: number; z: number }, strength: number = 100): ParticleForce {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Gravity Force',
      type: 'gravity',
      position,
      strength,
      radius: 200,
      falloff: 'quadratic',
      active: true
    };
  }

  static createWindForce(strength: number = 50): ParticleForce {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Wind Force',
      type: 'wind',
      position: { x: 0, y: 0, z: 0 },
      strength,
      radius: 1000,
      falloff: 'linear',
      active: true
    };
  }

  static createVortexForce(position: { x: number; y: number; z: number }, strength: number = 80): ParticleForce {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Vortex Force',
      type: 'vortex',
      position,
      strength,
      radius: 150,
      falloff: 'linear',
      active: true
    };
  }

  static createTurbulenceForce(strength: number = 30): ParticleForce {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Turbulence Force',
      type: 'turbulence',
      position: { x: 0, y: 0, z: 0 },
      strength,
      radius: 500,
      falloff: 'linear',
      active: true
    };
  }
}