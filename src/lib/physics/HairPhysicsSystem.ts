// Sistema de Física de Cabelo Hiper-Realista
// Simulação física avançada para cabelos dinâmicos

import * as THREE from 'three';

export interface HairStrand {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  thickness: number;
  segments: HairSegment[];
  physics: {
    mass: number;
    stiffness: number;
    damping: number;
    gravity: number;
    windForce: THREE.Vector3;
  };
}

export interface HairSegment {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  force: THREE.Vector3;
  mass: number;
  radius: number;
  constraints: HairConstraint[];
}

export interface HairConstraint {
  type: 'distance' | 'angle' | 'collision';
  target?: THREE.Vector3;
  strength: number;
  restLength?: number;
  restAngle?: number;
}

export interface HairStyle {
  id: string;
  name: string;
  strandCount: number;
  strandLength: number;
  curliness: number;
  volume: number;
  stiffness: number;
  texture: string;
}

export interface WindForce {
  direction: THREE.Vector3;
  strength: number;
  turbulence: number;
  frequency: number;
}

export class HairPhysicsSystem {
  private static instance: HairPhysicsSystem;
  private hairStrands: Map<string, HairStrand> = new Map();
  private hairMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private windForces: WindForce[] = [];
  private collisionObjects: THREE.Object3D[] = [];
  private isSimulating = false;
  private simulationSpeed = 1.0;
  private gravity = new THREE.Vector3(0, -9.81, 0);

  // Configurações de performance
  private maxStrands = 1000;
  private maxSegmentsPerStrand = 20;
  private simulationSteps = 5;
  private timeStep = 1 / 60; // 60 FPS

  constructor() {
    this.initializeDefaultWind();
  }

  static getInstance(): HairPhysicsSystem {
    if (!HairPhysicsSystem.instance) {
      HairPhysicsSystem.instance = new HairPhysicsSystem();
    }
    return HairPhysicsSystem.instance;
  }

  private initializeDefaultWind(): void {
    // Vento ambiente sutil
    this.windForces.push({
      direction: new THREE.Vector3(0.5, 0.1, 0.3).normalize(),
      strength: 0.1,
      turbulence: 0.05,
      frequency: 0.5
    });
  }

  // Criar sistema de cabelo para um avatar
  async createHairSystem(
    avatarId: string,
    headPosition: THREE.Vector3,
    hairStyle: HairStyle
  ): Promise<string> {

    const hairId = `hair_${avatarId}_${Date.now()}`;

    try {
      // Criar geometria do cabelo
      const hairGeometry = this.createHairGeometry(hairStyle);

      // Criar material do cabelo
      const hairMaterial = this.createHairMaterial(hairStyle);

      // Criar mesh instanciada para performance
      const hairMesh = new THREE.InstancedMesh(
        hairGeometry,
        hairMaterial,
        hairStyle.strandCount
      );

      hairMesh.frustumCulled = false;
      hairMesh.name = `hair_${avatarId}`;

      // Criar strands de cabelo
      const strands = this.generateHairStrands(
        headPosition,
        hairStyle,
        hairMesh
      );

      // Registrar sistema
      this.hairMeshes.set(hairId, hairMesh);
      strands.forEach(strand => {
        this.hairStrands.set(strand.id, strand);
      });
      return hairId;

    } catch (error) {
      console.error(`Erro ao criar sistema de cabelo:`, error);
      throw error;
    }
  }

  private createHairGeometry(hairStyle: HairStyle): THREE.BufferGeometry {
    // Geometria para um segmento de cabelo
    const geometry = new THREE.CylinderGeometry(
      hairStyle.strandLength * 0.001, // Raio base
      hairStyle.strandLength * 0.0005, // Raio topo
      hairStyle.strandLength, // Altura
      6, // Segmentos radiais
      this.maxSegmentsPerStrand // Segmentos longitudinais
    );

    return geometry;
  }

  private createHairMaterial(hairStyle: HairStyle): THREE.Material {
    // Material PBR para cabelo
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.2, 0.1, 0.05),
      metalness: 0.0,
      roughness: 0.3,
      transmission: 0.1,
      thickness: 0.01,
      anisotropy: 0.8,
      anisotropyRotation: Math.PI / 4,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });

    // Carregar textura do cabelo se disponível
    if (hairStyle.texture) {
      // Em produção, carregar textura real
    }

    return material;
  }

  private generateHairStrands(
    headPosition: THREE.Vector3,
    hairStyle: HairStyle,
    hairMesh: THREE.InstancedMesh
  ): HairStrand[] {
    const strands: HairStrand[] = [];
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < hairStyle.strandCount; i++) {
      // Posição inicial na cabeça (distribuição esférica)
      const phi = Math.acos(2 * Math.random() - 1); // Distribuição uniforme na esfera
      const theta = 2 * Math.PI * Math.random();

      const radius = 0.15 + Math.random() * 0.05; // Raio da cabeça
      const x = headPosition.x + radius * Math.sin(phi) * Math.cos(theta);
      const y = headPosition.y + radius * Math.cos(phi);
      const z = headPosition.z + radius * Math.sin(phi) * Math.sin(theta);

      const strandPosition = new THREE.Vector3(x, y, z);

      // Direção inicial (para baixo com variação)
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        -1,
        (Math.random() - 0.5) * 0.3
      ).normalize();

      // Criar segmentos do strand
      const segments = this.createHairSegments(
        strandPosition,
        direction,
        hairStyle.strandLength,
        hairStyle.stiffness
      );

      // Criar strand
      const strand: HairStrand = {
        id: `strand_${i}`,
        position: strandPosition,
        direction: direction,
        length: hairStyle.strandLength,
        thickness: 0.001 + Math.random() * 0.001,
        segments: segments,
        physics: {
          mass: 0.001,
          stiffness: hairStyle.stiffness,
          damping: 0.98,
          gravity: 9.81,
          windForce: new THREE.Vector3()
        }
      };

      strands.push(strand);

      // Configurar matriz de transformação para instancing
      matrix.setPosition(strandPosition);
      matrix.lookAt(
        strandPosition,
        strandPosition.clone().add(direction),
        new THREE.Vector3(0, 1, 0)
      );
      matrix.scale(new THREE.Vector3(strand.thickness, strand.length, strand.thickness));

      hairMesh.setMatrixAt(i, matrix);
    }

    hairMesh.instanceMatrix.needsUpdate = true;
    return strands;
  }

  private createHairSegments(
    startPosition: THREE.Vector3,
    direction: THREE.Vector3,
    totalLength: number,
    stiffness: number
  ): HairSegment[] {
    const segments: HairSegment[] = [];
    const segmentLength = totalLength / this.maxSegmentsPerStrand;

    for (let i = 0; i < this.maxSegmentsPerStrand; i++) {
      const t = i / (this.maxSegmentsPerStrand - 1);
      const position = startPosition.clone().add(
        direction.clone().multiplyScalar(t * totalLength)
      );

      // Adicionar ondulação baseada no curliness
      const curlFactor = Math.sin(t * Math.PI * 4) * 0.02;
      position.add(new THREE.Vector3(
        Math.cos(t * Math.PI * 2) * curlFactor,
        0,
        Math.sin(t * Math.PI * 2) * curlFactor
      ));

      const segment: HairSegment = {
        position: position,
        velocity: new THREE.Vector3(),
        force: new THREE.Vector3(),
        mass: 0.001 / this.maxSegmentsPerStrand,
        radius: 0.0005,
        constraints: []
      };

      // Adicionar constraints
      if (i > 0) {
        // Constraint de distância com segmento anterior
        segment.constraints.push({
          type: 'distance',
          strength: stiffness,
          restLength: segmentLength
        });
      }

      segments.push(segment);
    }

    return segments;
  }

  // Simulação física principal
  update(deltaTime: number): void {
    if (!this.isSimulating) return;

    const dt = Math.min(deltaTime * this.simulationSpeed, this.timeStep);

    // Atualizar forças externas
    this.updateExternalForces();

    // Resolver constraints
    for (let step = 0; step < this.simulationSteps; step++) {
      this.solveConstraints();
      this.integrateForces(dt / this.simulationSteps);
      this.handleCollisions();
    }

    // Atualizar geometria
    this.updateHairGeometry();
  }

  private updateExternalForces(): void {
    this.hairStrands.forEach(strand => {
      strand.segments.forEach((segment, index) => {
        // Resetar forças
        segment.force.set(0, 0, 0);

        // Gravidade
        segment.force.add(
          this.gravity.clone().multiplyScalar(segment.mass * strand.physics.gravity)
        );

        // Amortecimento
        segment.force.add(
          segment.velocity.clone().multiplyScalar(-strand.physics.damping)
        );

        // Vento
        this.windForces.forEach(wind => {
          const windForce = this.calculateWindForce(segment.position, wind);
          segment.force.add(windForce.multiplyScalar(strand.physics.mass));
        });

        // Força de tensão (stiffness)
        if (index > 0 && strand.segments[index - 1]) {
          const prevSegment = strand.segments[index - 1];
          const direction = segment.position.clone().sub(prevSegment.position);
          const distance = direction.length();
          const restLength = strand.length / this.maxSegmentsPerStrand;

          if (distance > 0) {
            const force = direction.normalize().multiplyScalar(
              strand.physics.stiffness * (distance - restLength)
            );
            segment.force.add(force);
          }
        }
      });
    });
  }

  private calculateWindForce(position: THREE.Vector3, wind: WindForce): THREE.Vector3 {
    // Calcular força do vento com turbulência
    const time = Date.now() * 0.001;
    const turbulence = new THREE.Vector3(
      Math.sin(position.x * 0.1 + time * wind.frequency) * wind.turbulence,
      Math.cos(position.y * 0.1 + time * wind.frequency) * wind.turbulence,
      Math.sin(position.z * 0.1 + time * wind.frequency) * wind.turbulence
    );

    return wind.direction.clone()
      .multiplyScalar(wind.strength)
      .add(turbulence);
  }

  private solveConstraints(): void {
    this.hairStrands.forEach(strand => {
      strand.segments.forEach((segment, index) => {
        segment.constraints.forEach(constraint => {
          switch (constraint.type) {
            case 'distance':
              this.solveDistanceConstraint(strand, index, constraint);
              break;
            case 'angle':
              this.solveAngleConstraint(strand, index, constraint);
              break;
            case 'collision':
              this.solveCollisionConstraint(segment, constraint);
              break;
          }
        });
      });
    });
  }

  private solveDistanceConstraint(
    strand: HairStrand,
    segmentIndex: number,
    constraint: HairConstraint
  ): void {
    if (segmentIndex === 0 || !constraint.restLength) return;

    const currentSegment = strand.segments[segmentIndex];
    const prevSegment = strand.segments[segmentIndex - 1];

    if (!currentSegment || !prevSegment) return;

    const direction = currentSegment.position.clone().sub(prevSegment.position);
    const distance = direction.length();

    if (distance > 0) {
      const correction = direction.normalize().multiplyScalar(
        (distance - constraint.restLength) * constraint.strength * 0.5
      );

      currentSegment.position.sub(correction);
      prevSegment.position.add(correction);
    }
  }

  private solveAngleConstraint(
    strand: HairStrand,
    segmentIndex: number,
    constraint: HairConstraint
  ): void {
    // Implementar constraint de ângulo para manter forma do cabelo
    // Simplificado por enquanto
  }

  private solveCollisionConstraint(segment: HairSegment, constraint: HairConstraint): void {
    // Verificar colisões com objetos
    this.collisionObjects.forEach(obj => {
      const distance = segment.position.distanceTo(obj.position);
      if (distance < segment.radius + 0.05) { // Raio de colisão
        const direction = segment.position.clone().sub(obj.position).normalize();
        segment.position.add(direction.multiplyScalar(segment.radius + 0.05 - distance));
        segment.velocity.reflect(direction).multiplyScalar(0.5);
      }
    });
  }

  private integrateForces(dt: number): void {
    this.hairStrands.forEach(strand => {
      strand.segments.forEach(segment => {
        // Integração de Verlet simplificada
        const acceleration = segment.force.clone().divideScalar(segment.mass);
        segment.velocity.add(acceleration.multiplyScalar(dt));
        segment.position.add(segment.velocity.clone().multiplyScalar(dt));
      });
    });
  }

  private handleCollisions(): void {
    // Verificações adicionais de colisão
    this.hairStrands.forEach(strand => {
      strand.segments.forEach(segment => {
        // Colisão com o chão
        if (segment.position.y < 0) {
          segment.position.y = 0;
          segment.velocity.y *= -0.3; // Rebote amortecido
        }

        // Colisão com limites do mundo
        const bounds = 10;
        if (Math.abs(segment.position.x) > bounds) {
          segment.position.x = Math.sign(segment.position.x) * bounds;
          segment.velocity.x *= -0.5;
        }
        if (Math.abs(segment.position.z) > bounds) {
          segment.position.z = Math.sign(segment.position.z) * bounds;
          segment.velocity.z *= -0.5;
        }
      });
    });
  }

  private updateHairGeometry(): void {
    this.hairMeshes.forEach((hairMesh, hairId) => {
      const matrix = new THREE.Matrix4();

      // Atualizar posições dos strands
      let instanceIndex = 0;
      this.hairStrands.forEach(strand => {
        if (strand.id.startsWith(`strand_${hairId.split('_')[1]}`)) {
          // Calcular direção baseada nos segmentos
          const rootPos = strand.segments[0].position;
          const tipPos = strand.segments[strand.segments.length - 1].position;
          const direction = tipPos.clone().sub(rootPos).normalize();

          // Atualizar matriz de instancing
          matrix.setPosition(rootPos);
          matrix.lookAt(rootPos, rootPos.clone().add(direction), new THREE.Vector3(0, 1, 0));
          matrix.scale(new THREE.Vector3(strand.thickness, strand.length, strand.thickness));

          hairMesh.setMatrixAt(instanceIndex, matrix);
          instanceIndex++;
        }
      });

      hairMesh.instanceMatrix.needsUpdate = true;
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

  setMaxStrands(maxStrands: number): void {
    this.maxStrands = Math.max(100, Math.min(10000, maxStrands));
  }

  // Métodos de consulta
  getHairMesh(hairId: string): THREE.InstancedMesh | null {
    return this.hairMeshes.get(hairId) || null;
  }

  getHairStrands(hairId: string): HairStrand[] {
    const strands: HairStrand[] = [];
    this.hairStrands.forEach(strand => {
      if (strand.id.includes(hairId)) {
        strands.push(strand);
      }
    });
    return strands;
  }

  getSimulationStats(): {
    totalStrands: number;
    totalSegments: number;
    isSimulating: boolean;
    simulationSpeed: number;
  } {
    let totalSegments = 0;
    this.hairStrands.forEach(strand => {
      totalSegments += strand.segments.length;
    });

    return {
      totalStrands: this.hairStrands.size,
      totalSegments,
      isSimulating: this.isSimulating,
      simulationSpeed: this.simulationSpeed
    };
  }

  // Presets de estilos de cabelo
  static getHairStylePresets(): { [key: string]: HairStyle } {
    return {
      short_straight: {
        id: 'short_straight',
        name: 'Curto Liso',
        strandCount: 500,
        strandLength: 0.1,
        curliness: 0.1,
        volume: 0.8,
        stiffness: 0.9,
        texture: 'hair_short_straight.jpg'
      },
      long_wavy: {
        id: 'long_wavy',
        name: 'Longo Ondulado',
        strandCount: 800,
        strandLength: 0.4,
        curliness: 0.6,
        volume: 1.2,
        stiffness: 0.7,
        texture: 'hair_long_wavy.jpg'
      },
      curly_afro: {
        id: 'curly_afro',
        name: 'Cacheado Afro',
        strandCount: 1200,
        strandLength: 0.15,
        curliness: 0.9,
        volume: 1.5,
        stiffness: 0.8,
        texture: 'hair_curly_afro.jpg'
      },
      braided: {
        id: 'braided',
        name: 'Trançado',
        strandCount: 300,
        strandLength: 0.3,
        curliness: 0.3,
        volume: 0.9,
        stiffness: 0.95,
        texture: 'hair_braided.jpg'
      }
    };
  }

  // Limpeza
  dispose(): void {
    this.stopSimulation();

    this.hairMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose());
      } else {
        mesh.material.dispose();
      }
    });

    this.hairMeshes.clear();
    this.hairStrands.clear();
    this.windForces = [];
    this.collisionObjects = [];
  }
}

// Função utilitária para criar cabelo rapidamente
export async function createHairForAvatar(
  system: HairPhysicsSystem,
  avatarId: string,
  headPosition: THREE.Vector3,
  styleName: string = 'long_wavy'
): Promise<string> {
  const presets = HairPhysicsSystem.getHairStylePresets();
  const style = presets[styleName] || presets.long_wavy;

  return await system.createHairSystem(avatarId, headPosition, style);
}
