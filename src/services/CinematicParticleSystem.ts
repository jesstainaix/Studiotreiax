import * as THREE from 'three';

// Interface para configuração de partículas cinematográficas
export interface CinematicParticleConfig {
  count: number;
  lifetime: number;
  emissionRate: number;
  startVelocity: THREE.Vector3;
  startSize: number;
  endSize: number;
  startColor: THREE.Color;
  endColor: THREE.Color;
  gravity: THREE.Vector3;
  turbulence: number;
  fadeIn: number;
  fadeOut: number;
  texture?: THREE.Texture;
  blendMode: THREE.BlendingMode;
  emitterShape: 'point' | 'sphere' | 'box' | 'cone';
  emitterSize: THREE.Vector3;
}

// Interface para sistema de forças
export interface ParticleForce {
  type: 'gravity' | 'wind' | 'vortex' | 'attractor' | 'repulsor';
  strength: number;
  position?: THREE.Vector3;
  direction?: THREE.Vector3;
  radius?: number;
  falloff?: number;
}

// Classe para partícula individual
class CinematicParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  startSize: number;
  endSize: number;
  color: THREE.Color;
  startColor: THREE.Color;
  endColor: THREE.Color;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;

  constructor(config: CinematicParticleConfig, position: THREE.Vector3) {
    this.position = position.clone();
    this.velocity = config.startVelocity.clone();
    this.acceleration = new THREE.Vector3();
    this.life = 0;
    this.maxLife = config.lifetime;
    this.startSize = config.startSize;
    this.endSize = config.endSize;
    this.size = config.startSize;
    this.startColor = config.startColor.clone();
    this.endColor = config.endColor.clone();
    this.color = config.startColor.clone();
    this.alpha = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.active = true;
  }

  update(deltaTime: number, forces: ParticleForce[], config: CinematicParticleConfig): void {
    if (!this.active) return;

    // Atualizar tempo de vida
    this.life += deltaTime;
    const lifeRatio = this.life / this.maxLife;

    if (lifeRatio >= 1) {
      this.active = false;
      return;
    }

    // Reset acceleration
    this.acceleration.set(0, 0, 0);

    // Aplicar forças
    forces.forEach(force => this.applyForce(force));

    // Aplicar gravidade global
    this.acceleration.add(config.gravity);

    // Aplicar turbulência
    if (config.turbulence > 0) {
      const turbulence = new THREE.Vector3(
        (Math.random() - 0.5) * config.turbulence,
        (Math.random() - 0.5) * config.turbulence,
        (Math.random() - 0.5) * config.turbulence
      );
      this.acceleration.add(turbulence);
    }

    // Atualizar física
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Atualizar propriedades visuais
    this.updateVisualProperties(lifeRatio, config);
  }

  private applyForce(force: ParticleForce): void {
    switch (force.type) {
      case 'gravity':
        if (force.direction) {
          this.acceleration.add(force.direction.clone().multiplyScalar(force.strength));
        }
        break;
      case 'wind':
        if (force.direction) {
          this.acceleration.add(force.direction.clone().multiplyScalar(force.strength));
        }
        break;
      case 'vortex':
        if (force.position) {
          const toCenter = force.position.clone().sub(this.position);
          const distance = toCenter.length();
          if (distance > 0) {
            const vortexForce = new THREE.Vector3(-toCenter.z, 0, toCenter.x).normalize();
            vortexForce.multiplyScalar(force.strength / (distance + 1));
            this.acceleration.add(vortexForce);
          }
        }
        break;
      case 'attractor':
        if (force.position) {
          const toAttractor = force.position.clone().sub(this.position);
          const distance = toAttractor.length();
          if (distance > 0) {
            const attractorForce = toAttractor.normalize().multiplyScalar(force.strength / (distance * distance + 1));
            this.acceleration.add(attractorForce);
          }
        }
        break;
      case 'repulsor':
        if (force.position) {
          const fromRepulsor = this.position.clone().sub(force.position);
          const distance = fromRepulsor.length();
          if (distance > 0 && distance < (force.radius || 10)) {
            const repulsorForce = fromRepulsor.normalize().multiplyScalar(force.strength / (distance * distance + 1));
            this.acceleration.add(repulsorForce);
          }
        }
        break;
    }
  }

  private updateVisualProperties(lifeRatio: number, config: CinematicParticleConfig): void {
    // Interpolar tamanho
    this.size = THREE.MathUtils.lerp(this.startSize, this.endSize, lifeRatio);

    // Interpolar cor
    this.color.lerpColors(this.startColor, this.endColor, lifeRatio);

    // Calcular alpha com fade in/out
    let alpha = 1;
    if (lifeRatio < config.fadeIn) {
      alpha = lifeRatio / config.fadeIn;
    } else if (lifeRatio > (1 - config.fadeOut)) {
      alpha = (1 - lifeRatio) / config.fadeOut;
    }
    this.alpha = Math.max(0, Math.min(1, alpha));

    // Atualizar rotação
    this.rotation += this.rotationSpeed;
  }
}

// Sistema de partículas cinematográfico principal
export class CinematicParticleSystem {
  private particles: CinematicParticle[] = [];
  private config: CinematicParticleConfig;
  private forces: ParticleForce[] = [];
  private emissionTimer: number = 0;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private scene: THREE.Scene;
  private isActive: boolean = true;

  // Shaders para renderização GPU
  private static vertexShader = `
    attribute float size;
    attribute vec3 customColor;
    attribute float alpha;
    attribute float rotation;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vRotation;
    
    void main() {
      vColor = customColor;
      vAlpha = alpha;
      vRotation = rotation;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  private static fragmentShader = `
    uniform sampler2D pointTexture;
    uniform float time;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vRotation;
    
    void main() {
      vec2 coords = gl_PointCoord;
      
      // Aplicar rotação
      float cos_factor = cos(vRotation);
      float sin_factor = sin(vRotation);
      coords = vec2(
        cos_factor * (coords.x - 0.5) + sin_factor * (coords.y - 0.5) + 0.5,
        cos_factor * (coords.y - 0.5) - sin_factor * (coords.x - 0.5) + 0.5
      );
      
      vec4 textureColor = texture2D(pointTexture, coords);
      
      // Aplicar cor e alpha
      gl_FragColor = vec4(vColor * textureColor.rgb, textureColor.a * vAlpha);
      
      // Descartar pixels transparentes
      if (gl_FragColor.a < 0.01) discard;
    }
  `;

  constructor(scene: THREE.Scene, config: CinematicParticleConfig) {
    this.scene = scene;
    this.config = { ...config };
    this.initializeGeometry();
    this.initializeMaterial();
    this.initializePoints();
  }

  private initializeGeometry(): void {
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.config.count * 3);
    const colors = new Float32Array(this.config.count * 3);
    const sizes = new Float32Array(this.config.count);
    const alphas = new Float32Array(this.config.count);
    const rotations = new Float32Array(this.config.count);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    this.geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
  }

  private initializeMaterial(): void {
    // Criar textura padrão se não fornecida
    let texture = this.config.texture;
    if (!texture) {
      texture = this.createDefaultTexture();
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
        time: { value: 0 }
      },
      vertexShader: CinematicParticleSystem.vertexShader,
      fragmentShader: CinematicParticleSystem.fragmentShader,
      blending: this.config.blendMode,
      depthTest: false,
      transparent: true,
      vertexColors: true
    });
  }

  private initializePoints(): void {
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  private createDefaultTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Criar gradiente radial
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    // Emitir novas partículas
    this.emitParticles(deltaTime);

    // Atualizar partículas existentes
    this.particles.forEach(particle => {
      particle.update(deltaTime, this.forces, this.config);
    });

    // Remover partículas mortas
    this.particles = this.particles.filter(particle => particle.active);

    // Atualizar buffers GPU
    this.updateBuffers();

    // Atualizar uniforms do shader
    this.material.uniforms.time.value += deltaTime;
  }

  private emitParticles(deltaTime: number): void {
    this.emissionTimer += deltaTime;
    const emissionInterval = 1 / this.config.emissionRate;

    while (this.emissionTimer >= emissionInterval && this.particles.length < this.config.count) {
      const position = this.generateEmissionPosition();
      const particle = new CinematicParticle(this.config, position);
      this.particles.push(particle);
      this.emissionTimer -= emissionInterval;
    }
  }

  private generateEmissionPosition(): THREE.Vector3 {
    const position = new THREE.Vector3();

    switch (this.config.emitterShape) {
      case 'point':
        // Emitir do ponto central
        break;
      case 'sphere':
        const radius = this.config.emitterSize.x;
        const phi = Math.random() * Math.PI * 2;
        const costheta = Math.random() * 2 - 1;
        const theta = Math.acos(costheta);
        position.set(
          radius * Math.sin(theta) * Math.cos(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(theta)
        );
        break;
      case 'box':
        position.set(
          (Math.random() - 0.5) * this.config.emitterSize.x,
          (Math.random() - 0.5) * this.config.emitterSize.y,
          (Math.random() - 0.5) * this.config.emitterSize.z
        );
        break;
      case 'cone':
        const coneRadius = Math.random() * this.config.emitterSize.x;
        const coneAngle = Math.random() * Math.PI * 2;
        const coneHeight = Math.random() * this.config.emitterSize.y;
        position.set(
          coneRadius * Math.cos(coneAngle),
          coneHeight,
          coneRadius * Math.sin(coneAngle)
        );
        break;
    }

    return position;
  }

  private updateBuffers(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.customColor.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;
    const alphas = this.geometry.attributes.alpha.array as Float32Array;
    const rotations = this.geometry.attributes.rotation.array as Float32Array;

    // Limpar arrays
    positions.fill(0);
    colors.fill(0);
    sizes.fill(0);
    alphas.fill(0);
    rotations.fill(0);

    // Preencher com dados das partículas ativas
    this.particles.forEach((particle, index) => {
      if (index >= this.config.count) return;

      const i3 = index * 3;
      
      // Posição
      positions[i3] = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;

      // Cor
      colors[i3] = particle.color.r;
      colors[i3 + 1] = particle.color.g;
      colors[i3 + 2] = particle.color.b;

      // Tamanho, alpha e rotação
      sizes[index] = particle.size;
      alphas[index] = particle.alpha;
      rotations[index] = particle.rotation;
    });

    // Marcar para atualização
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.customColor.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
    this.geometry.attributes.rotation.needsUpdate = true;
  }

  // Métodos públicos para controle
  public addForce(force: ParticleForce): void {
    this.forces.push(force);
  }

  public removeForce(index: number): void {
    this.forces.splice(index, 1);
  }

  public clearForces(): void {
    this.forces = [];
  }

  public setConfig(config: Partial<CinematicParticleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public start(): void {
    this.isActive = true;
  }

  public stop(): void {
    this.isActive = false;
  }

  public reset(): void {
    this.particles = [];
    this.emissionTimer = 0;
  }

  public dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    if (this.config.texture) {
      this.config.texture.dispose();
    }
  }

  // Getters
  public get particleCount(): number {
    return this.particles.length;
  }

  public get activeParticleCount(): number {
    return this.particles.filter(p => p.active).length;
  }
}

// Factory para criar configurações pré-definidas
export class ParticlePresets {
  static createFireEffect(): CinematicParticleConfig {
    return {
      count: 200,
      lifetime: 2,
      emissionRate: 50,
      startVelocity: new THREE.Vector3(0, 5, 0),
      startSize: 2,
      endSize: 8,
      startColor: new THREE.Color(1, 0.8, 0),
      endColor: new THREE.Color(1, 0, 0),
      gravity: new THREE.Vector3(0, -2, 0),
      turbulence: 2,
      fadeIn: 0.1,
      fadeOut: 0.3,
      blendMode: THREE.AdditiveBlending,
      emitterShape: 'cone',
      emitterSize: new THREE.Vector3(2, 0, 2)
    };
  }

  static createSmokeEffect(): CinematicParticleConfig {
    return {
      count: 100,
      lifetime: 4,
      emissionRate: 25,
      startVelocity: new THREE.Vector3(0, 3, 0),
      startSize: 3,
      endSize: 12,
      startColor: new THREE.Color(0.8, 0.8, 0.8),
      endColor: new THREE.Color(0.3, 0.3, 0.3),
      gravity: new THREE.Vector3(0, 1, 0),
      turbulence: 1,
      fadeIn: 0.2,
      fadeOut: 0.5,
      blendMode: THREE.NormalBlending,
      emitterShape: 'sphere',
      emitterSize: new THREE.Vector3(1, 1, 1)
    };
  }

  static createExplosionEffect(): CinematicParticleConfig {
    return {
      count: 500,
      lifetime: 1.5,
      emissionRate: 1000,
      startVelocity: new THREE.Vector3(0, 0, 0),
      startSize: 1,
      endSize: 0.1,
      startColor: new THREE.Color(1, 1, 0.5),
      endColor: new THREE.Color(1, 0.2, 0),
      gravity: new THREE.Vector3(0, -5, 0),
      turbulence: 5,
      fadeIn: 0.05,
      fadeOut: 0.2,
      blendMode: THREE.AdditiveBlending,
      emitterShape: 'sphere',
      emitterSize: new THREE.Vector3(0.5, 0.5, 0.5)
    };
  }

  static createMagicSparkles(): CinematicParticleConfig {
    return {
      count: 150,
      lifetime: 3,
      emissionRate: 30,
      startVelocity: new THREE.Vector3(0, 2, 0),
      startSize: 1,
      endSize: 3,
      startColor: new THREE.Color(0.5, 0.8, 1),
      endColor: new THREE.Color(1, 1, 1),
      gravity: new THREE.Vector3(0, 0, 0),
      turbulence: 3,
      fadeIn: 0.1,
      fadeOut: 0.4,
      blendMode: THREE.AdditiveBlending,
      emitterShape: 'sphere',
      emitterSize: new THREE.Vector3(3, 3, 3)
    };
  }
}