// Sistema Avançado de Materiais Hiper-Realistas
// Suporte para PBR, subsurface scattering, e efeitos avançados

import * as THREE from 'three';

export interface PBRMaterialConfig {
  baseColor: THREE.Color;
  metallic: number;
  roughness: number;
  subsurface: number;
  subsurfaceColor: THREE.Color;
  subsurfaceRadius: number;
  specular: number;
  specularTint: number;
  anisotropic: number;
  sheen: number;
  sheenTint: THREE.Color;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

export interface SkinMaterialConfig extends PBRMaterialConfig {
  oiliness: number;
  poreDetail: number;
  wrinkleIntensity: number;
  bloodFlow: number;
  melanin: number;
  hemoglobin: number;
}

export interface HairMaterialConfig extends PBRMaterialConfig {
  cuticleScale: number;
  roughnessVariation: number;
  melanin: number;
  pheomelanin: number;
  eumelanin: number;
  glossiness: number;
}

export interface EyeMaterialConfig {
  scleraColor: THREE.Color;
  irisColor: THREE.Color;
  pupilSize: number;
  corneaIOR: number;
  corneaRoughness: number;
  limbalRing: number;
  bloodVessels: number;
}

export class AdvancedMaterials {
  private static instance: AdvancedMaterials;
  private materialCache = new Map<string, THREE.Material>();

  static getInstance(): AdvancedMaterials {
    if (!AdvancedMaterials.instance) {
      AdvancedMaterials.instance = new AdvancedMaterials();
    }
    return AdvancedMaterials.instance;
  }

  // Material PBR Avançado com Subsurface Scattering
  createAdvancedPBRMaterial(config: PBRMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      color: config.baseColor,
      metalness: config.metallic,
      roughness: config.roughness,
      transmission: config.transmission,
      thickness: config.thickness,
      ior: config.ior,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      clearcoat: config.clearcoat,
      clearcoatRoughness: config.clearcoatRoughness,
      specularIntensity: config.specular,
      specularColor: new THREE.Color().setHSL(0, 0, config.specularTint),
      sheen: config.sheen,
      sheenColor: config.sheenTint,
      anisotropy: config.anisotropic,
    });

    // Configurar subsurface scattering
    if (config.subsurface > 0) {
      this.applySubsurfaceScattering(material, config);
    }

    return material;
  }

  // Material de Pele Hiper-Realista
  createSkinMaterial(config: SkinMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = this.createAdvancedPBRMaterial(config);

    // Configurações específicas da pele
    material.color = this.calculateSkinColor(config);
    material.roughness = this.calculateSkinRoughness(config);
    material.normalScale = new THREE.Vector2(0.5, 0.5);

    // Aplicar mapas específicos da pele
    this.applySkinTextures(material, config);

    return material;
  }

  // Material de Cabelo Hiper-Realista
  createHairMaterial(config: HairMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = this.createAdvancedPBRMaterial(config);

    // Configurações específicas do cabelo
    material.color = this.calculateHairColor(config);
    material.roughness = this.calculateHairRoughness(config);
    material.anisotropy = config.cuticleScale;

    // Aplicar mapas específicos do cabelo
    this.applyHairTextures(material, config);

    return material;
  }

  // Material de Olhos Hiper-Realista
  createEyeMaterial(config: EyeMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      color: config.scleraColor,
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      ior: config.corneaIOR,
      specularIntensity: 0.8,
      specularColor: new THREE.Color(1, 1, 1),
    });

    // Aplicar mapas específicos dos olhos
    this.applyEyeTextures(material, config);

    return material;
  }

  // Subsurface Scattering Implementation
  private applySubsurfaceScattering(material: THREE.MeshPhysicalMaterial, config: PBRMaterialConfig): void {
    // Simular subsurface scattering através de transmissão e espessura
    material.transmission = config.subsurface;
    material.thickness = config.subsurfaceRadius;
    material.attenuationColor = config.subsurfaceColor;
    material.attenuationDistance = config.subsurfaceRadius;
  }

  // Cálculo de cor da pele baseado em parâmetros científicos
  private calculateSkinColor(config: SkinMaterialConfig): THREE.Color {
    // Modelo simplificado baseado em melanina e fluxo sanguíneo
    const melaninColor = new THREE.Color(0.4, 0.3, 0.2);
    const bloodColor = new THREE.Color(0.8, 0.2, 0.2);

    const baseColor = new THREE.Color(0.9, 0.7, 0.6); // Tom de pele base

    // Misturar baseado em melanina
    baseColor.lerp(melaninColor, config.melanin / 100);

    // Adicionar efeito de fluxo sanguíneo
    baseColor.lerp(bloodColor, config.bloodFlow / 100 * 0.1);

    return baseColor;
  }

  // Cálculo de rugosidade da pele
  private calculateSkinRoughness(config: SkinMaterialConfig): number {
    // Rugosidade base da pele
    let roughness = 0.4;

    // Aumentar com oleosidade (pele mais brilhante = menos rugosa)
    roughness -= config.oiliness / 100 * 0.2;

    // Aumentar com rugas
    roughness += config.wrinkleIntensity / 100 * 0.3;

    // Aumentar com poros
    roughness += config.poreDetail / 100 * 0.1;

    return Math.max(0.1, Math.min(1.0, roughness));
  }

  // Cálculo de cor do cabelo
  private calculateHairColor(config: HairMaterialConfig): THREE.Color {
    // Modelo baseado em eumelanina e feomelanina
    const eumelaninColor = new THREE.Color(0.1, 0.05, 0.02); // Preto
    const pheomelaninColor = new THREE.Color(0.8, 0.4, 0.1); // Vermelho

    const baseColor = new THREE.Color(0.3, 0.2, 0.1);

    // Misturar eumelanina (escuro)
    baseColor.lerp(eumelaninColor, config.eumelanin / 100);

    // Misturar feomelanina (vermelho)
    baseColor.lerp(pheomelaninColor, config.pheomelanin / 100);

    return baseColor;
  }

  // Cálculo de rugosidade do cabelo
  private calculateHairRoughness(config: HairMaterialConfig): number {
    let roughness = 0.3;

    // Aumentar com variação de rugosidade
    roughness += config.roughnessVariation / 100 * 0.4;

    // Diminuir com brilho
    roughness -= config.glossiness / 100 * 0.2;

    return Math.max(0.1, Math.min(1.0, roughness));
  }

  // Aplicar texturas específicas da pele
  private applySkinTextures(material: THREE.MeshPhysicalMaterial, config: SkinMaterialConfig): void {
    // Em produção, carregar texturas reais
    // Por enquanto, configurar parâmetros

    // Normal map para detalhes da pele
    material.normalScale = new THREE.Vector2(0.5, 0.5);

    // Roughness map para variação de oleosidade
    // material.roughnessMap = this.loadTexture('skin_roughness.jpg');

    // Subsurface scattering mais pronunciado
    material.transmission = 0.1;
    material.thickness = 0.5;
  }

  // Aplicar texturas específicas do cabelo
  private applyHairTextures(material: THREE.MeshPhysicalMaterial, config: HairMaterialConfig): void {
    // Anisotropy map para cutículas
    // material.anisotropyMap = this.loadTexture('hair_anisotropy.jpg');

    // Alpha map para transparência
    // material.alphaMap = this.loadTexture('hair_alpha.jpg');
    material.transparent = true;
  }

  // Aplicar texturas específicas dos olhos
  private applyEyeTextures(material: THREE.MeshPhysicalMaterial, config: EyeMaterialConfig): void {
    // Iris texture
    // material.map = this.loadTexture('iris_texture.jpg');

    // Normal map para córnea
    material.normalScale = new THREE.Vector2(0.1, 0.1);

    // Bump map para vasos sanguíneos
    // material.bumpMap = this.loadTexture('eye_blood_vessels.jpg');
    // material.bumpScale = config.bloodVessels / 100;
  }

  // Sistema de cache para materiais
  getCachedMaterial(key: string): THREE.Material | null {
    return this.materialCache.get(key) || null;
  }

  cacheMaterial(key: string, material: THREE.Material): void {
    this.materialCache.set(key, material);
  }

  clearCache(): void {
    this.materialCache.forEach(material => {
      material.dispose();
    });
    this.materialCache.clear();
  }

  // Utilitários para carregamento de texturas
  private loadTexture(url: string): THREE.Texture | null {
    try {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(url);

      // Configurações de textura para qualidade
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;

      return texture;
    } catch (error) {
      console.warn(`Erro ao carregar textura ${url}:`, error);
      return null;
    }
  }

  // Método para atualizar materiais em tempo real
  updateMaterial(material: THREE.MeshPhysicalMaterial, updates: Partial<PBRMaterialConfig>): void {
    if (updates.baseColor) material.color = updates.baseColor;
    if (updates.metallic !== undefined) material.metalness = updates.metallic;
    if (updates.roughness !== undefined) material.roughness = updates.roughness;
    if (updates.emissive) material.emissive = updates.emissive;
    if (updates.emissiveIntensity !== undefined) material.emissiveIntensity = updates.emissiveIntensity;

    material.needsUpdate = true;
  }

  // Otimização de materiais para performance
  optimizeMaterial(material: THREE.MeshPhysicalMaterial): void {
    // Reduzir complexidade para dispositivos móveis
    material.roughness = Math.max(material.roughness, 0.3);
    material.metalness = Math.min(material.metalness, 0.7);

    // Desabilitar recursos pesados se necessário
    if (this.isLowEndDevice()) {
      material.transmission = 0;
      material.clearcoat = 0;
      material.anisotropy = 0;
    }

    material.needsUpdate = true;
  }

  private isLowEndDevice(): boolean {
    // Detecção simples de dispositivo de baixo desempenho
    return navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 2 : false;
  }
}

// Configurações padrão para diferentes tipos de material
export const DEFAULT_SKIN_CONFIG: SkinMaterialConfig = {
  baseColor: new THREE.Color(0.9, 0.7, 0.6),
  metallic: 0.0,
  roughness: 0.4,
  subsurface: 0.1,
  subsurfaceColor: new THREE.Color(0.8, 0.4, 0.3),
  subsurfaceRadius: 0.5,
  specular: 0.5,
  specularTint: 0.8,
  anisotropic: 0.0,
  sheen: 0.0,
  sheenTint: new THREE.Color(1, 1, 1),
  clearcoat: 0.0,
  clearcoatRoughness: 0.0,
  transmission: 0.1,
  thickness: 0.5,
  ior: 1.4,
  emissive: new THREE.Color(0, 0, 0),
  emissiveIntensity: 0.0,
  oiliness: 50,
  poreDetail: 30,
  wrinkleIntensity: 20,
  bloodFlow: 40,
  melanin: 30,
  hemoglobin: 50
};

export const DEFAULT_HAIR_CONFIG: HairMaterialConfig = {
  baseColor: new THREE.Color(0.2, 0.1, 0.05),
  metallic: 0.0,
  roughness: 0.3,
  subsurface: 0.0,
  subsurfaceColor: new THREE.Color(0.1, 0.05, 0.02),
  subsurfaceRadius: 0.1,
  specular: 0.8,
  specularTint: 0.9,
  anisotropic: 0.8,
  sheen: 0.2,
  sheenTint: new THREE.Color(1, 1, 1),
  clearcoat: 0.0,
  clearcoatRoughness: 0.0,
  transmission: 0.0,
  thickness: 0.1,
  ior: 1.55,
  emissive: new THREE.Color(0, 0, 0),
  emissiveIntensity: 0.0,
  cuticleScale: 0.8,
  roughnessVariation: 20,
  melanin: 80,
  pheomelanin: 10,
  eumelanin: 70,
  glossiness: 70
};

export const DEFAULT_EYE_CONFIG: EyeMaterialConfig = {
  scleraColor: new THREE.Color(0.95, 0.95, 0.98),
  irisColor: new THREE.Color(0.3, 0.5, 0.7),
  pupilSize: 0.3,
  corneaIOR: 1.376,
  corneaRoughness: 0.01,
  limbalRing: 0.8,
  bloodVessels: 0.2
};
