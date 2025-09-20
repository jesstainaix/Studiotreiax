import * as THREE from 'three';

// Interface para configuração de efeitos volumétricos
export interface VolumetricEffectConfig {
  type: 'fire' | 'smoke' | 'explosion' | 'cloud' | 'steam';
  intensity: number;
  scale: THREE.Vector3;
  color: THREE.Color;
  secondaryColor?: THREE.Color;
  density: number;
  turbulence: number;
  speed: number;
  direction: THREE.Vector3;
  noiseScale: number;
  noiseSpeed: number;
  fadeDistance: number;
  temperature?: number; // Para efeitos de fogo
  opacity: number;
  animated: boolean;
  textureResolution: number;
}

// Classe para efeitos volumétricos
export class VolumetricEffect {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BoxGeometry;
  private config: VolumetricEffectConfig;
  private time: number = 0;
  private noiseTexture: THREE.DataTexture;

  // Shader vertex para efeitos volumétricos
  private static vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vNormal = normal;
      vUv = uv;
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Shader fragment para fogo
  private static fireFragmentShader = `
    uniform float time;
    uniform float intensity;
    uniform vec3 color;
    uniform vec3 secondaryColor;
    uniform float density;
    uniform float turbulence;
    uniform float speed;
    uniform vec3 direction;
    uniform float noiseScale;
    uniform float noiseSpeed;
    uniform float temperature;
    uniform float opacity;
    uniform sampler2D noiseTexture;
    
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    // Função de ruído 3D
    float noise3D(vec3 p) {
      return texture2D(noiseTexture, p.xy * 0.1 + time * 0.01).r;
    }
    
    // Função de ruído turbulento
    float turbulentNoise(vec3 p) {
      float n = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      
      for (int i = 0; i < 4; i++) {
        n += amplitude * noise3D(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return n;
    }
    
    void main() {
      vec3 pos = vPosition * noiseScale;
      
      // Animação baseada no tempo
      pos.y += time * speed;
      pos += direction * time * speed * 0.5;
      
      // Ruído turbulento para movimento do fogo
      float noise = turbulentNoise(pos + time * noiseSpeed);
      noise += turbulentNoise(pos * 2.0 + time * noiseSpeed * 1.5) * 0.5;
      noise += turbulentNoise(pos * 4.0 + time * noiseSpeed * 2.0) * 0.25;
      
      // Gradiente vertical para simular chamas
      float heightGradient = 1.0 - smoothstep(0.0, 1.0, vUv.y);
      
      // Forma das chamas
      float flameShape = heightGradient * (1.0 + noise * turbulence);
      flameShape = smoothstep(0.2, 0.8, flameShape);
      
      // Temperatura baseada na altura
      float temp = temperature * heightGradient;
      
      // Interpolação de cor baseada na temperatura
      vec3 finalColor = mix(secondaryColor, color, temp);
      finalColor = mix(finalColor, vec3(1.0, 1.0, 0.8), temp * 0.5);
      
      // Alpha baseado na densidade e forma
      float alpha = flameShape * density * intensity * opacity;
      alpha *= (1.0 - vUv.y * 0.3); // Fade no topo
      
      gl_FragColor = vec4(finalColor, alpha);
      
      // Descartar pixels muito transparentes
      if (alpha < 0.01) discard;
    }
  `;

  // Shader fragment para fumaça
  private static smokeFragmentShader = `
    uniform float time;
    uniform float intensity;
    uniform vec3 color;
    uniform float density;
    uniform float turbulence;
    uniform float speed;
    uniform vec3 direction;
    uniform float noiseScale;
    uniform float noiseSpeed;
    uniform float opacity;
    uniform sampler2D noiseTexture;
    
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    float noise3D(vec3 p) {
      return texture2D(noiseTexture, p.xy * 0.1 + time * 0.005).r;
    }
    
    float turbulentNoise(vec3 p) {
      float n = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      
      for (int i = 0; i < 6; i++) {
        n += amplitude * noise3D(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return n;
    }
    
    void main() {
      vec3 pos = vPosition * noiseScale;
      
      // Movimento da fumaça
      pos.y += time * speed * 0.3;
      pos += direction * time * speed * 0.2;
      
      // Ruído para turbulência
      float noise = turbulentNoise(pos + time * noiseSpeed * 0.5);
      
      // Dispersão da fumaça
      float dispersion = 1.0 - length(vUv - 0.5) * 2.0;
      dispersion = smoothstep(0.0, 1.0, dispersion);
      
      // Densidade variável
      float smokeDensity = noise * dispersion * density;
      smokeDensity *= (1.0 - vUv.y * 0.5); // Fade gradual
      
      // Cor da fumaça com variação
      vec3 smokeColor = color + (noise - 0.5) * 0.2;
      
      float alpha = smokeDensity * intensity * opacity;
      
      gl_FragColor = vec4(smokeColor, alpha);
      
      if (alpha < 0.01) discard;
    }
  `;

  // Shader fragment para explosão
  private static explosionFragmentShader = `
    uniform float time;
    uniform float intensity;
    uniform vec3 color;
    uniform vec3 secondaryColor;
    uniform float density;
    uniform float turbulence;
    uniform float speed;
    uniform float noiseScale;
    uniform float opacity;
    uniform sampler2D noiseTexture;
    
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    float noise3D(vec3 p) {
      return texture2D(noiseTexture, p.xy * 0.1 + time * 0.02).r;
    }
    
    float turbulentNoise(vec3 p) {
      float n = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      
      for (int i = 0; i < 5; i++) {
        n += amplitude * abs(noise3D(p * frequency) * 2.0 - 1.0);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return n;
    }
    
    void main() {
      vec3 pos = vPosition * noiseScale;
      
      // Centro da explosão
      float distanceFromCenter = length(vUv - 0.5) * 2.0;
      
      // Expansão da explosão
      float expansion = time * speed;
      float explosionRadius = 0.3 + expansion;
      
      // Forma da explosão
      float explosionShape = 1.0 - smoothstep(0.0, explosionRadius, distanceFromCenter);
      
      // Ruído para detalhes
      float noise = turbulentNoise(pos + time * speed);
      
      // Intensidade baseada na distância e ruído
      float explosionIntensity = explosionShape * (0.5 + noise * 0.5);
      
      // Cor da explosão (quente no centro, mais fria nas bordas)
      float heatGradient = 1.0 - distanceFromCenter;
      vec3 explosionColor = mix(secondaryColor, color, heatGradient);
      explosionColor = mix(explosionColor, vec3(1.0, 1.0, 0.9), heatGradient * 0.7);
      
      // Alpha com fade temporal
      float temporalFade = 1.0 - smoothstep(0.0, 2.0, time);
      float alpha = explosionIntensity * density * intensity * opacity * temporalFade;
      
      gl_FragColor = vec4(explosionColor, alpha);
      
      if (alpha < 0.01) discard;
    }
  `;

  constructor(config: VolumetricEffectConfig) {
    this.config = { ...config };
    this.createNoiseTexture();
    this.createGeometry();
    this.createMaterial();
    this.createMesh();
  }

  private createNoiseTexture(): void {
    const size = this.config.textureResolution || 256;
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < size * size; i++) {
      const x = (i % size) / size;
      const y = Math.floor(i / size) / size;
      
      // Gerar ruído Perlin simplificado
      let noise = 0;
      let amplitude = 1;
      let frequency = 1;
      
      for (let octave = 0; octave < 4; octave++) {
        noise += amplitude * (Math.sin(x * frequency * Math.PI * 2) * Math.cos(y * frequency * Math.PI * 2));
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      noise = (noise + 1) * 0.5; // Normalizar para 0-1
      
      const index = i * 4;
      data[index] = noise * 255;     // R
      data[index + 1] = noise * 255; // G
      data[index + 2] = noise * 255; // B
      data[index + 3] = 255;         // A
    }

    this.noiseTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    this.noiseTexture.wrapS = THREE.RepeatWrapping;
    this.noiseTexture.wrapT = THREE.RepeatWrapping;
    this.noiseTexture.needsUpdate = true;
  }

  private createGeometry(): void {
    this.geometry = new THREE.BoxGeometry(
      this.config.scale.x,
      this.config.scale.y,
      this.config.scale.z,
      32, 32, 32 // Subdivisões para melhor qualidade
    );
  }

  private createMaterial(): void {
    let fragmentShader: string;
    
    switch (this.config.type) {
      case 'fire':
        fragmentShader = VolumetricEffect.fireFragmentShader;
        break;
      case 'smoke':
      case 'steam':
        fragmentShader = VolumetricEffect.smokeFragmentShader;
        break;
      case 'explosion':
        fragmentShader = VolumetricEffect.explosionFragmentShader;
        break;
      default:
        fragmentShader = VolumetricEffect.smokeFragmentShader;
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: this.config.intensity },
        color: { value: this.config.color },
        secondaryColor: { value: this.config.secondaryColor || new THREE.Color(1, 0.5, 0) },
        density: { value: this.config.density },
        turbulence: { value: this.config.turbulence },
        speed: { value: this.config.speed },
        direction: { value: this.config.direction },
        noiseScale: { value: this.config.noiseScale },
        noiseSpeed: { value: this.config.noiseSpeed },
        temperature: { value: this.config.temperature || 1.0 },
        opacity: { value: this.config.opacity },
        noiseTexture: { value: this.noiseTexture }
      },
      vertexShader: VolumetricEffect.vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: this.getBlendingMode(),
      side: THREE.DoubleSide
    });
  }

  private getBlendingMode(): THREE.Blending {
    switch (this.config.type) {
      case 'fire':
      case 'explosion':
        return THREE.AdditiveBlending;
      case 'smoke':
      case 'steam':
      case 'cloud':
        return THREE.NormalBlending;
      default:
        return THREE.NormalBlending;
    }
  }

  private createMesh(): void {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false; // Evitar culling prematuro
  }

  public update(deltaTime: number): void {
    if (this.config.animated) {
      this.time += deltaTime;
      this.material.uniforms.time.value = this.time;
    }
  }

  public setIntensity(intensity: number): void {
    this.config.intensity = intensity;
    this.material.uniforms.intensity.value = intensity;
  }

  public setColor(color: THREE.Color): void {
    this.config.color = color;
    this.material.uniforms.color.value = color;
  }

  public setDensity(density: number): void {
    this.config.density = density;
    this.material.uniforms.density.value = density;
  }

  public setSpeed(speed: number): void {
    this.config.speed = speed;
    this.material.uniforms.speed.value = speed;
  }

  public setDirection(direction: THREE.Vector3): void {
    this.config.direction = direction;
    this.material.uniforms.direction.value = direction;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.noiseTexture.dispose();
  }
}

// Manager para efeitos volumétricos
export class VolumetricEffectsManager {
  private effects: Map<string, VolumetricEffect> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createEffect(id: string, config: VolumetricEffectConfig, position?: THREE.Vector3): VolumetricEffect {
    const effect = new VolumetricEffect(config);
    
    if (position) {
      effect.getMesh().position.copy(position);
    }
    
    this.scene.add(effect.getMesh());
    this.effects.set(id, effect);
    
    return effect;
  }

  public removeEffect(id: string): void {
    const effect = this.effects.get(id);
    if (effect) {
      this.scene.remove(effect.getMesh());
      effect.dispose();
      this.effects.delete(id);
    }
  }

  public getEffect(id: string): VolumetricEffect | undefined {
    return this.effects.get(id);
  }

  public updateAll(deltaTime: number): void {
    this.effects.forEach(effect => {
      effect.update(deltaTime);
    });
  }

  public disposeAll(): void {
    this.effects.forEach(effect => {
      this.scene.remove(effect.getMesh());
      effect.dispose();
    });
    this.effects.clear();
  }

  public getAllEffects(): Map<string, VolumetricEffect> {
    return this.effects;
  }
}

// Presets para efeitos volumétricos
export class VolumetricPresets {
  static createFireEffect(): VolumetricEffectConfig {
    return {
      type: 'fire',
      intensity: 1.0,
      scale: new THREE.Vector3(2, 4, 2),
      color: new THREE.Color(1, 0.3, 0),
      secondaryColor: new THREE.Color(1, 0.8, 0),
      density: 0.8,
      turbulence: 1.5,
      speed: 2.0,
      direction: new THREE.Vector3(0, 1, 0),
      noiseScale: 1.0,
      noiseSpeed: 1.0,
      fadeDistance: 10.0,
      temperature: 1.0,
      opacity: 0.9,
      animated: true,
      textureResolution: 256
    };
  }

  static createSmokeEffect(): VolumetricEffectConfig {
    return {
      type: 'smoke',
      intensity: 0.7,
      scale: new THREE.Vector3(3, 6, 3),
      color: new THREE.Color(0.4, 0.4, 0.4),
      density: 0.6,
      turbulence: 2.0,
      speed: 1.0,
      direction: new THREE.Vector3(0.2, 1, 0.1),
      noiseScale: 0.8,
      noiseSpeed: 0.5,
      fadeDistance: 15.0,
      opacity: 0.7,
      animated: true,
      textureResolution: 256
    };
  }

  static createExplosionEffect(): VolumetricEffectConfig {
    return {
      type: 'explosion',
      intensity: 2.0,
      scale: new THREE.Vector3(5, 5, 5),
      color: new THREE.Color(1, 0.5, 0),
      secondaryColor: new THREE.Color(1, 1, 0.5),
      density: 1.0,
      turbulence: 3.0,
      speed: 5.0,
      direction: new THREE.Vector3(0, 0, 0),
      noiseScale: 2.0,
      noiseSpeed: 2.0,
      fadeDistance: 8.0,
      opacity: 1.0,
      animated: true,
      textureResolution: 512
    };
  }

  static createSteamEffect(): VolumetricEffectConfig {
    return {
      type: 'steam',
      intensity: 0.5,
      scale: new THREE.Vector3(2, 3, 2),
      color: new THREE.Color(0.9, 0.9, 1.0),
      density: 0.4,
      turbulence: 1.0,
      speed: 1.5,
      direction: new THREE.Vector3(0, 1, 0),
      noiseScale: 1.2,
      noiseSpeed: 0.8,
      fadeDistance: 12.0,
      opacity: 0.6,
      animated: true,
      textureResolution: 128
    };
  }

  static createCloudEffect(): VolumetricEffectConfig {
    return {
      type: 'cloud',
      intensity: 0.3,
      scale: new THREE.Vector3(10, 4, 8),
      color: new THREE.Color(0.9, 0.9, 0.9),
      density: 0.3,
      turbulence: 0.5,
      speed: 0.2,
      direction: new THREE.Vector3(1, 0, 0),
      noiseScale: 0.3,
      noiseSpeed: 0.1,
      fadeDistance: 50.0,
      opacity: 0.8,
      animated: true,
      textureResolution: 512
    };
  }
}