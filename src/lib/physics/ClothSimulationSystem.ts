// Sistema de Simulação de Tecido Hiper-Realista
// Simulação física avançada para roupas dinâmicas

import * as THREE from 'three';

export interface ClothParticle {
  id: string;
  position: THREE.Vector3;
  previousPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
  isFixed: boolean;
  constraints: ClothConstraint[];
}

export interface ClothConstraint {
  type: 'distance' | 'bend' | 'collision';
  particleA: number;
  particleB: number;
  restLength: number;
  stiffness: number;
  damping: number;
}

export interface ClothMaterial {
  id: string;
  name: string;
  density: number; // kg/m²
  thickness: number; // metros
  stiffness: number; // rigidez
  damping: number; // amortecimento
  friction: number; // atrito
  elasticity: number; // elasticidade
  tearResistance: number; // resistência à ruptura
  windResistance: number; // resistência ao vento
}

export interface ClothGarment {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  particles: ClothParticle[];
  constraints: ClothConstraint[];
  material: ClothMaterial;
  attachmentPoints: Map<string, number>; // nome do ponto -> índice da partícula
  collisionObjects: THREE.Object3D[];
}

export interface WindForce {
  direction: THREE.Vector3;
  strength: number;
  turbulence: number;
  frequency: number;
}

export class ClothSimulationSystem {
  private static instance: ClothSimulationSystem;
  private garments: Map<string, ClothGarment> = new Map();
  private windForces: WindForce[] = [];
  private gravity = new THREE.Vector3(0, -9.81, 0);
  private isSimulating = false;
  private simulationSpeed = 1.0;
  private timeStep = 1 / 60; // 60 FPS
  private maxIterations = 10;
  private collisionObjects: THREE.Object3D[] = [];

  // Configurações de performance
  private maxParticles = 10000;
  private maxConstraints = 50000;

  constructor() {
    this.initializeDefaultWind();
  }

  static getInstance(): ClothSimulationSystem {
    if (!ClothSimulationSystem.instance) {
      ClothSimulationSystem.instance = new ClothSimulationSystem();
    }
    return ClothSimulationSystem.instance;
  }

  private initializeDefaultWind(): void {
    // Vento ambiente sutil
    this.windForces.push({
      direction: new THREE.Vector3(0.3, 0.1, 0.4).normalize(),
      strength: 0.05,
      turbulence: 0.02,
      frequency: 0.3
    });
  }

  // Criar uma peça de roupa simulada
  async createGarment(
    avatarId: string,
    garmentType: 'shirt' | 'pants' | 'skirt' | 'dress' | 'jacket',
    material: ClothMaterial,
    attachmentPoints: Map<string, THREE.Vector3>
  ): Promise<string> {

    const garmentId = `garment_${avatarId}_${garmentType}_${Date.now()}`;

    try {
      // Criar geometria baseada no tipo de roupa
      const geometry = this.createGarmentGeometry(garmentType, material);

      // Criar material da roupa
      const clothMaterial = this.createClothMaterial(material);

      // Criar mesh
      const mesh = new THREE.Mesh(geometry, clothMaterial);
      mesh.name = `${garmentType}_${avatarId}`;

      // Criar sistema de partículas
      const particles = this.createClothParticles(geometry, material, attachmentPoints);

      // Criar constraints
      const constraints = this.createClothConstraints(particles, geometry, material);

      // Criar objeto garment
      const garment: ClothGarment = {
        id: garmentId,
        name: `${garmentType}_${avatarId}`,
        mesh: mesh,
        particles: particles,
        constraints: constraints,
        material: material,
        attachmentPoints: new Map(),
        collisionObjects: []
      };

      // Configurar pontos de fixação
      this.setupAttachmentPoints(garment, attachmentPoints);

      // Registrar garment
      this.garments.set(garmentId, garment);
      return garmentId;

    } catch (error) {
      console.error(`Erro ao criar peça de roupa:`, error);
      throw error;
    }
  }

  private createGarmentGeometry(
    type: string,
    material: ClothMaterial
  ): THREE.PlaneGeometry {
    // Dimensões baseadas no tipo de roupa
    const dimensions = this.getGarmentDimensions(type);

    // Criar geometria de tecido
    const geometry = new THREE.PlaneGeometry(
      dimensions.width,
      dimensions.height,
      dimensions.segmentsX,
      dimensions.segmentsY
    );

    return geometry;
  }

  private getGarmentDimensions(type: string): {
    width: number;
    height: number;
    segmentsX: number;
    segmentsY: number;
  } {
    const dimensions = {
      shirt: { width: 0.8, height: 1.0, segmentsX: 20, segmentsY: 25 },
      pants: { width: 0.6, height: 1.2, segmentsX: 15, segmentsY: 30 },
      skirt: { width: 0.7, height: 0.8, segmentsX: 18, segmentsY: 20 },
      dress: { width: 0.9, height: 1.5, segmentsX: 22, segmentsY: 35 },
      jacket: { width: 0.85, height: 1.1, segmentsX: 20, segmentsY: 28 }
    };

    return dimensions[type as keyof typeof dimensions] ||
           { width: 0.8, height: 1.0, segmentsX: 20, segmentsY: 25 };
  }

  private createClothMaterial(material: ClothMaterial): THREE.Material {
    // Material PBR para tecido
    const clothMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.8, 0.8, 0.9),
      metalness: 0.0,
      roughness: 0.8,
      transmission: 0.0,
      thickness: material.thickness,
      transparent: false,
      side: THREE.DoubleSide,
      alphaTest: 0.5
    });

    return clothMaterial;
  }

  private createClothParticles(
    geometry: THREE.PlaneGeometry,
    material: ClothMaterial,
    attachmentPoints: Map<string, THREE.Vector3>
  ): ClothParticle[] {
    const particles: ClothParticle[] = [];
    const positions = geometry.attributes.position;

    if (!positions) return particles;

    for (let i = 0; i < positions.count; i++) {
      const position = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );

      const particle: ClothParticle = {
        id: `particle_${i}`,
        position: position.clone(),
        previousPosition: position.clone(),
        velocity: new THREE.Vector3(),
        acceleration: new THREE.Vector3(),
        mass: material.density * 0.01, // Massa baseada na densidade
        isFixed: false,
        constraints: []
      };

      // Verificar se é um ponto de fixação
      for (const [name, attachPos] of attachmentPoints) {
        if (position.distanceTo(attachPos) < 0.05) {
          particle.isFixed = true;
          break;
        }
      }

      particles.push(particle);
    }

    return particles;
  }

  private createClothConstraints(
    particles: ClothParticle[],
    geometry: THREE.PlaneGeometry,
    material: ClothMaterial
  ): ClothConstraint[] {
    const constraints: ClothConstraint[] = [];
    const indices = geometry.index;
    const positions = geometry.attributes.position;

    if (!indices || !positions) return constraints;

    // Constraints estruturais (arestas)
    for (let i = 0; i < indices.count; i += 3) {
      const a = indices.getX(i);
      const b = indices.getX(i + 1);
      const c = indices.getX(i + 2);

      // Adicionar constraints para cada aresta do triângulo
      this.addDistanceConstraint(constraints, particles, a, b, material);
      this.addDistanceConstraint(constraints, particles, b, c, material);
      this.addDistanceConstraint(constraints, particles, c, a, material);
    }

    // Constraints de flexão (diagonais)
    const segmentsX = Math.sqrt(positions.count);
    const segmentsY = segmentsX;

    for (let y = 0; y < segmentsY; y++) {
      for (let x = 0; x < segmentsX; x++) {
        const current = y * segmentsX + x;

        // Diagonal inferior direita
        if (x < segmentsX - 1 && y < segmentsY - 1) {
          const diagonal = (y + 1) * segmentsX + (x + 1);
          this.addBendConstraint(constraints, particles, current, diagonal, material);
        }

        // Diagonal inferior esquerda
        if (x > 0 && y < segmentsY - 1) {
          const diagonal = (y + 1) * segmentsX + (x - 1);
          this.addBendConstraint(constraints, particles, current, diagonal, material);
        }
      }
    }

    return constraints;
  }

  private addDistanceConstraint(
    constraints: ClothConstraint[],
    particles: ClothParticle[],
    indexA: number,
    indexB: number,
    material: ClothMaterial
  ): void {
    if (indexA >= particles.length || indexB >= particles.length) return;

    const particleA = particles[indexA];
    const particleB = particles[indexB];
    const restLength = particleA.position.distanceTo(particleB.position);

    const constraint: ClothConstraint = {
      type: 'distance',
      particleA: indexA,
      particleB: indexB,
      restLength: restLength,
      stiffness: material.stiffness,
      damping: material.damping
    };

    constraints.push(constraint);
    particleA.constraints.push(constraint);
    particleB.constraints.push(constraint);
  }

  private addBendConstraint(
    constraints: ClothConstraint[],
    particles: ClothParticle[],
    indexA: number,
    indexB: number,
    material: ClothMaterial
  ): void {
    if (indexA >= particles.length || indexB >= particles.length) return;

    const particleA = particles[indexA];
    const particleB = particles[indexB];
    const restLength = particleA.position.distanceTo(particleB.position);

    const constraint: ClothConstraint = {
      type: 'bend',
      particleA: indexA,
      particleB: indexB,
      restLength: restLength,
      stiffness: material.stiffness * 0.1, // Menos rígido para dobras
      damping: material.damping * 0.5
    };

    constraints.push(constraint);
  }

  private setupAttachmentPoints(
    garment: ClothGarment,
    attachmentPoints: Map<string, THREE.Vector3>
  ): void {
      // Mapear pontos de fixação para índices de partículas
      attachmentPoints.forEach((position, name) => {
        let closestIndex = -1;
        let closestDistance = Infinity;

        for (let index = 0; index < garment.particles.length; index++) {
          const particle = garment.particles[index];
          const distance = particle.position.distanceTo(position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        }

        if (closestIndex >= 0) {
          garment.particles[closestIndex].isFixed = true;
          garment.attachmentPoints.set(name, closestIndex);
        }
      });
  }

  // Simulação física principal
  update(deltaTime: number): void {
    if (!this.isSimulating) return;

    const dt = Math.min(deltaTime * this.simulationSpeed, this.timeStep);

    // Atualizar forças
    this.updateForces();

    // Resolver constraints
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      this.solveConstraints();
    }

    // Integrar movimento
    this.integrateMotion(dt);

    // Verificar colisões
    this.handleCollisions();

    // Atualizar geometria
    this.updateGeometry();
  }

  private updateForces(): void {
    this.garments.forEach(garment => {
      garment.particles.forEach(particle => {
        if (particle.isFixed) return;

        // Resetar aceleração
        particle.acceleration.set(0, 0, 0);

        // Gravidade
        particle.acceleration.add(
          this.gravity.clone().multiplyScalar(1 / particle.mass)
        );

        // Amortecimento
        particle.acceleration.add(
          particle.velocity.clone().multiplyScalar(-garment.material.damping)
        );

        // Vento
        this.windForces.forEach(wind => {
          const windForce = this.calculateWindForce(particle.position, wind, garment.material);
          particle.acceleration.add(windForce.multiplyScalar(1 / particle.mass));
        });
      });
    });
  }

  private calculateWindForce(
    position: THREE.Vector3,
    wind: WindForce,
    material: ClothMaterial
  ): THREE.Vector3 {
    // Calcular força do vento baseada na resistência do material
    const time = Date.now() * 0.001;
    const turbulence = new THREE.Vector3(
      Math.sin(position.x * 0.05 + time * wind.frequency) * wind.turbulence,
      Math.cos(position.y * 0.05 + time * wind.frequency) * wind.turbulence,
      Math.sin(position.z * 0.05 + time * wind.frequency) * wind.turbulence
    );

    const windForce = wind.direction.clone()
      .multiplyScalar(wind.strength)
      .add(turbulence);

    return windForce.multiplyScalar(material.windResistance);
  }

  private solveConstraints(): void {
    this.garments.forEach(garment => {
      garment.constraints.forEach(constraint => {
        switch (constraint.type) {
          case 'distance':
            this.solveDistanceConstraint(garment, constraint);
            break;
          case 'bend':
            this.solveBendConstraint(garment, constraint);
            break;
          case 'collision':
            this.solveCollisionConstraint(garment, constraint);
            break;
        }
      });
    });
  }

  private solveDistanceConstraint(garment: ClothGarment, constraint: ClothConstraint): void {
    const particleA = garment.particles[constraint.particleA];
    const particleB = garment.particles[constraint.particleB];

    if (!particleA || !particleB || particleA.isFixed && particleB.isFixed) return;

    const direction = particleA.position.clone().sub(particleB.position);
    const distance = direction.length();

    if (distance === 0) return;

    const correction = direction.normalize().multiplyScalar(
      (distance - constraint.restLength) * constraint.stiffness * 0.5
    );

    if (!particleA.isFixed) {
      particleA.position.sub(correction);
    }
    if (!particleB.isFixed) {
      particleB.position.add(correction);
    }
  }

  private solveBendConstraint(garment: ClothGarment, constraint: ClothConstraint): void {
    // Constraints de flexão são resolvidos de forma similar aos de distância
    // mas com rigidez reduzida
    this.solveDistanceConstraint(garment, constraint);
  }

  private solveCollisionConstraint(garment: ClothGarment, constraint: ClothConstraint): void {
    // Resolver colisões com objetos
    const particleA = garment.particles[constraint.particleA];
    const particleB = garment.particles[constraint.particleB];

    if (!particleA || !particleB) return;

    [...this.collisionObjects, ...garment.collisionObjects].forEach(obj => {
      if (!obj) return;

      [particleA, particleB].forEach(particle => {
        if (!particle || particle.isFixed) return;

        const distance = particle.position.distanceTo(obj.position);
        const radius = 0.05; // Raio de colisão

        if (distance < radius) {
          const direction = particle.position.clone().sub(obj.position).normalize();
          particle.position.add(direction.multiplyScalar(radius - distance));
          particle.velocity.reflect(direction).multiplyScalar(0.3);
        }
      });
    });
  }

  private integrateMotion(dt: number): void {
    this.garments.forEach(garment => {
      garment.particles.forEach(particle => {
        if (particle.isFixed) return;

        // Integração de Verlet
        const temp = particle.position.clone();
        particle.position.add(
          particle.position.clone().sub(particle.previousPosition)
        ).add(particle.acceleration.clone().multiplyScalar(dt * dt));

        particle.previousPosition.copy(temp);

        // Atualizar velocidade
        particle.velocity.copy(
          particle.position.clone().sub(particle.previousPosition)
        ).divideScalar(dt);
      });
    });
  }

  private handleCollisions(): void {
    this.garments.forEach(garment => {
      garment.particles.forEach(particle => {
        if (particle.isFixed) return;

        // Colisão com o chão
        if (particle.position.y < 0) {
          particle.position.y = 0;
          particle.velocity.y *= -0.2;
        }

        // Colisão com limites do mundo
        const bounds = 5;
        if (Math.abs(particle.position.x) > bounds) {
          particle.position.x = Math.sign(particle.position.x) * bounds;
          particle.velocity.x *= -0.5;
        }
        if (Math.abs(particle.position.z) > bounds) {
          particle.position.z = Math.sign(particle.position.z) * bounds;
          particle.velocity.z *= -0.5;
        }
      });
    });
  }

  private updateGeometry(): void {
    this.garments.forEach(garment => {
      const geometry = garment.mesh.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;

      if (!positions) return;

      garment.particles.forEach((particle, index) => {
        positions.setXYZ(index, particle.position.x, particle.position.y, particle.position.z);
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    });
  }

  // Métodos de controle
  startSimulation(): void {
    this.isSimulating = true;
  }

  stopSimulation(): void {
    this.isSimulating = false;
  }

  addWindForce(wind: WindForce): void {
    this.windForces.push(wind);
  }

  removeWindForce(index: number): void {
    if (index >= 0 && index < this.windForces.length) {
      this.windForces.splice(index, 1);
    }
  }

  addCollisionObject(object: THREE.Object3D): void {
    this.collisionObjects.push(object);
  }

  removeCollisionObject(object: THREE.Object3D): void {
    const index = this.collisionObjects.indexOf(object);
    if (index > -1) {
      this.collisionObjects.splice(index, 1);
    }
  }

  // Métodos de configuração
  setSimulationSpeed(speed: number): void {
    this.simulationSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  setGravity(gravity: THREE.Vector3): void {
    this.gravity.copy(gravity);
  }

  // Métodos de consulta
  getGarment(garmentId: string): ClothGarment | null {
    return this.garments.get(garmentId) || null;
  }

  getGarmentMesh(garmentId: string): THREE.Mesh | null {
    const garment = this.garments.get(garmentId);
    return garment ? garment.mesh : null;
  }

  getSimulationStats(): {
    totalGarments: number;
    totalParticles: number;
    totalConstraints: number;
    isSimulating: boolean;
    simulationSpeed: number;
  } {
    let totalParticles = 0;
    let totalConstraints = 0;

    this.garments.forEach(garment => {
      totalParticles += garment.particles.length;
      totalConstraints += garment.constraints.length;
    });

    return {
      totalGarments: this.garments.size,
      totalParticles,
      totalConstraints,
      isSimulating: this.isSimulating,
      simulationSpeed: this.simulationSpeed
    };
  }

  // Presets de materiais de tecido
  static getClothMaterialPresets(): { [key: string]: ClothMaterial } {
    return {
      cotton: {
        id: 'cotton',
        name: 'Algodão',
        density: 0.15,
        thickness: 0.0005,
        stiffness: 0.8,
        damping: 0.9,
        friction: 0.4,
        elasticity: 0.7,
        tearResistance: 0.6,
        windResistance: 0.8
      },
      silk: {
        id: 'silk',
        name: 'Seda',
        density: 0.08,
        thickness: 0.0001,
        stiffness: 0.3,
        damping: 0.95,
        friction: 0.2,
        elasticity: 0.9,
        tearResistance: 0.3,
        windResistance: 0.9
      },
      denim: {
        id: 'denim',
        name: 'Denim',
        density: 0.4,
        thickness: 0.001,
        stiffness: 0.95,
        damping: 0.8,
        friction: 0.6,
        elasticity: 0.5,
        tearResistance: 0.9,
        windResistance: 0.6
      },
      leather: {
        id: 'leather',
        name: 'Couro',
        density: 0.6,
        thickness: 0.002,
        stiffness: 0.98,
        damping: 0.7,
        friction: 0.8,
        elasticity: 0.3,
        tearResistance: 0.95,
        windResistance: 0.4
      },
      wool: {
        id: 'wool',
        name: 'Lã',
        density: 0.2,
        thickness: 0.0008,
        stiffness: 0.6,
        damping: 0.85,
        friction: 0.5,
        elasticity: 0.8,
        tearResistance: 0.7,
        windResistance: 0.7
      }
    };
  }

  // Limpeza
  dispose(): void {
    this.stopSimulation();

    this.garments.forEach(garment => {
      garment.mesh.geometry.dispose();
      if (Array.isArray(garment.mesh.material)) {
        garment.mesh.material.forEach(material => material.dispose());
      } else {
        garment.mesh.material.dispose();
      }
    });

    this.garments.clear();
    this.windForces = [];
    this.collisionObjects = [];
  }
}

// Função utilitária para criar roupa rapidamente
export async function createClothingForAvatar(
  system: ClothSimulationSystem,
  avatarId: string,
  garmentType: 'shirt' | 'pants' | 'skirt' | 'dress' | 'jacket',
  materialName: string = 'cotton',
  attachmentPoints: Map<string, THREE.Vector3>
): Promise<string> {
  const presets = ClothSimulationSystem.getClothMaterialPresets();
  const material = presets[materialName];

  if (!material) {
    throw new Error(`Material de tecido não encontrado: ${materialName}`);
  }

  return await system.createGarment(avatarId, garmentType, material, attachmentPoints);
}
