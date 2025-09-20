import * as THREE from 'three';
import { EventEmitter } from 'events';

export interface PhysicsBody {
  id: string;
  mesh: THREE.Object3D;
  type: 'static' | 'dynamic' | 'kinematic';
  shape: CollisionShape;
  mass: number;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  friction: number;
  restitution: number;
  constraints: Constraint[];
  collisionGroup: number;
  collisionMask: number;
  onCollision?: (other: PhysicsBody, contact: Contact) => void;
}

export interface CollisionShape {
  type: 'box' | 'sphere' | 'capsule' | 'mesh' | 'convex' | 'plane';
  parameters: any;
  boundingBox?: THREE.Box3;
  boundingSphere?: THREE.Sphere;
}

export interface Contact {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  depth: number;
  impulse: number;
}

export interface Constraint {
  id: string;
  type: 'fixed' | 'hinge' | 'ball' | 'slider' | 'spring' | 'distance';
  bodyA: string;
  bodyB?: string;
  pivotA: THREE.Vector3;
  pivotB?: THREE.Vector3;
  axis?: THREE.Vector3;
  limits?: {
    min: number;
    max: number;
  };
  stiffness?: number;
  damping?: number;
}

export interface RaycastResult {
  hit: boolean;
  body?: PhysicsBody;
  point?: THREE.Vector3;
  normal?: THREE.Vector3;
  distance?: number;
}

export interface ForceField {
  id: string;
  type: 'gravity' | 'wind' | 'magnetic' | 'turbulence' | 'vortex';
  position: THREE.Vector3;
  direction: THREE.Vector3;
  strength: number;
  range: number;
  falloff: 'linear' | 'quadratic' | 'exponential';
}

class PhysicsSystem extends EventEmitter {
  private static instance: PhysicsSystem;
  private bodies: Map<string, PhysicsBody>;
  private constraints: Map<string, Constraint>;
  private forceFields: Map<string, ForceField>;
  private gravity: THREE.Vector3;
  private timeStep: number;
  private substeps: number;
  private broadphase: BroadPhase;
  private narrowphase: NarrowPhase;
  private solver: ConstraintSolver;
  private contacts: Contact[];
  private staticBodies: Set<string>;
  private sleepingBodies: Set<string>;
  private raycaster: THREE.Raycaster;

  private constructor() {
    super();
    this.bodies = new Map();
    this.constraints = new Map();
    this.forceFields = new Map();
    this.gravity = new THREE.Vector3(0, -9.81, 0);
    this.timeStep = 1 / 60;
    this.substeps = 2;
    this.broadphase = new BroadPhase();
    this.narrowphase = new NarrowPhase();
    this.solver = new ConstraintSolver();
    this.contacts = [];
    this.staticBodies = new Set();
    this.sleepingBodies = new Set();
    this.raycaster = new THREE.Raycaster();
  }

  public static getInstance(): PhysicsSystem {
    if (!PhysicsSystem.instance) {
      PhysicsSystem.instance = new PhysicsSystem();
    }
    return PhysicsSystem.instance;
  }

  public createBody(config: Partial<PhysicsBody>): PhysicsBody {
    const body: PhysicsBody = {
      id: config.id || `body_${Date.now()}`,
      mesh: config.mesh || new THREE.Object3D(),
      type: config.type || 'dynamic',
      shape: config.shape || this.createBoxShape(1, 1, 1),
      mass: config.mass !== undefined ? config.mass : 1,
      velocity: config.velocity || new THREE.Vector3(),
      acceleration: config.acceleration || new THREE.Vector3(),
      angularVelocity: config.angularVelocity || new THREE.Vector3(),
      friction: config.friction !== undefined ? config.friction : 0.5,
      restitution: config.restitution !== undefined ? config.restitution : 0.3,
      constraints: config.constraints || [],
      collisionGroup: config.collisionGroup || 0x0001,
      collisionMask: config.collisionMask || 0xFFFF,
      onCollision: config.onCollision
    };

    // Calcular bounding volumes
    this.updateBoundingVolumes(body);

    this.bodies.set(body.id, body);

    if (body.type === 'static') {
      this.staticBodies.add(body.id);
    }

    this.emit('bodyAdded', body);
    return body;
  }

  public removeBody(bodyId: string): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      // Remover constraints associadas
      body.constraints.forEach(constraint => {
        this.removeConstraint(constraint.id);
      });

      this.bodies.delete(bodyId);
      this.staticBodies.delete(bodyId);
      this.sleepingBodies.delete(bodyId);

      this.emit('bodyRemoved', body);
    }
  }

  public createBoxShape(width: number, height: number, depth: number): CollisionShape {
    return {
      type: 'box',
      parameters: { width, height, depth },
      boundingBox: new THREE.Box3(
        new THREE.Vector3(-width/2, -height/2, -depth/2),
        new THREE.Vector3(width/2, height/2, depth/2)
      )
    };
  }

  public createSphereShape(radius: number): CollisionShape {
    return {
      type: 'sphere',
      parameters: { radius },
      boundingSphere: new THREE.Sphere(new THREE.Vector3(), radius)
    };
  }

  public createCapsuleShape(radius: number, height: number): CollisionShape {
    return {
      type: 'capsule',
      parameters: { radius, height },
      boundingBox: new THREE.Box3(
        new THREE.Vector3(-radius, -height/2 - radius, -radius),
        new THREE.Vector3(radius, height/2 + radius, radius)
      )
    };
  }

  public createMeshShape(mesh: THREE.Mesh): CollisionShape {
    const geometry = mesh.geometry;
    geometry.computeBoundingBox();
    
    return {
      type: 'mesh',
      parameters: { geometry },
      boundingBox: geometry.boundingBox?.clone()
    };
  }

  public addConstraint(constraint: Constraint): void {
    this.constraints.set(constraint.id, constraint);
    
    // Adicionar referência às bodies
    const bodyA = this.bodies.get(constraint.bodyA);
    if (bodyA) {
      bodyA.constraints.push(constraint);
    }
    
    if (constraint.bodyB) {
      const bodyB = this.bodies.get(constraint.bodyB);
      if (bodyB) {
        bodyB.constraints.push(constraint);
      }
    }

    this.emit('constraintAdded', constraint);
  }

  public removeConstraint(constraintId: string): void {
    const constraint = this.constraints.get(constraintId);
    if (constraint) {
      // Remover referências das bodies
      const bodyA = this.bodies.get(constraint.bodyA);
      if (bodyA) {
        bodyA.constraints = bodyA.constraints.filter(c => c.id !== constraintId);
      }
      
      if (constraint.bodyB) {
        const bodyB = this.bodies.get(constraint.bodyB);
        if (bodyB) {
          bodyB.constraints = bodyB.constraints.filter(c => c.id !== constraintId);
        }
      }

      this.constraints.delete(constraintId);
      this.emit('constraintRemoved', constraint);
    }
  }

  public addForceField(field: ForceField): void {
    this.forceFields.set(field.id, field);
    this.emit('forceFieldAdded', field);
  }

  public removeForceField(fieldId: string): void {
    const field = this.forceFields.get(fieldId);
    if (field) {
      this.forceFields.delete(fieldId);
      this.emit('forceFieldRemoved', field);
    }
  }

  public setGravity(gravity: THREE.Vector3): void {
    this.gravity.copy(gravity);
  }

  public step(deltaTime?: number): void {
    const dt = deltaTime || this.timeStep;
    const substepDt = dt / this.substeps;

    for (let i = 0; i < this.substeps; i++) {
      this.integrateForces(substepDt);
      this.detectCollisions();
      this.resolveCollisions();
      this.solveConstraints(substepDt);
      this.integrateVelocities(substepDt);
      this.updateSleepStates();
    }

    this.updateMeshPositions();
  }

  private integrateForces(dt: number): void {
    this.bodies.forEach(body => {
      if (body.type === 'static' || this.sleepingBodies.has(body.id)) return;

      // Aplicar gravidade
      if (body.mass > 0) {
        const gravityForce = this.gravity.clone().multiplyScalar(body.mass);
        body.acceleration.add(gravityForce.divideScalar(body.mass));
      }

      // Aplicar campos de força
      this.forceFields.forEach(field => {
        const force = this.calculateForceFieldEffect(body, field);
        if (force) {
          body.acceleration.add(force.divideScalar(body.mass));
        }
      });

      // Integrar aceleração para velocidade
      body.velocity.add(body.acceleration.clone().multiplyScalar(dt));

      // Aplicar amortecimento
      const damping = 0.98;
      body.velocity.multiplyScalar(Math.pow(damping, dt));
      body.angularVelocity.multiplyScalar(Math.pow(damping, dt));

      // Resetar aceleração
      body.acceleration.set(0, 0, 0);
    });
  }

  private calculateForceFieldEffect(body: PhysicsBody, field: ForceField): THREE.Vector3 | null {
    const distance = body.mesh.position.distanceTo(field.position);
    
    if (distance > field.range) return null;

    let strength = field.strength;
    
    // Aplicar falloff
    switch (field.falloff) {
      case 'linear':
        strength *= (1 - distance / field.range);
        break;
      case 'quadratic':
        strength *= Math.pow(1 - distance / field.range, 2);
        break;
      case 'exponential':
        strength *= Math.exp(-distance / field.range * 3);
        break;
    }

    const force = new THREE.Vector3();

    switch (field.type) {
      case 'gravity':
        const direction = field.position.clone().sub(body.mesh.position).normalize();
        force.copy(direction).multiplyScalar(strength);
        break;
        
      case 'wind':
        force.copy(field.direction).multiplyScalar(strength);
        break;
        
      case 'vortex':
        const toCenter = field.position.clone().sub(body.mesh.position);
        const tangent = new THREE.Vector3().crossVectors(field.direction, toCenter).normalize();
        force.copy(tangent).multiplyScalar(strength);
        break;
        
      case 'turbulence':
        force.set(
          (Math.random() - 0.5) * strength,
          (Math.random() - 0.5) * strength,
          (Math.random() - 0.5) * strength
        );
        break;
    }

    return force;
  }

  private detectCollisions(): void {
    this.contacts = [];
    
    // Broad phase - encontrar pares potenciais
    const pairs = this.broadphase.findPairs(this.bodies);
    
    // Narrow phase - teste detalhado de colisão
    pairs.forEach(pair => {
      const contact = this.narrowphase.testPair(pair[0], pair[1]);
      if (contact) {
        this.contacts.push(contact);
        
        // Callback de colisão
        if (pair[0].onCollision) {
          pair[0].onCollision(pair[1], contact);
        }
        if (pair[1].onCollision) {
          pair[1].onCollision(pair[0], contact);
        }
        
        this.emit('collision', { bodyA: pair[0], bodyB: pair[1], contact });
      }
    });
  }

  private resolveCollisions(): void {
    this.contacts.forEach(contact => {
      // Resolver colisões usando impulsos
      // Simplified collision resolution
      const separation = contact.normal.clone().multiplyScalar(contact.depth * 0.5);
      
      // Separar objetos
      // Em produção, isso consideraria massa e tipo de body
      // Por simplicidade, apenas separamos igualmente
    });
  }

  private solveConstraints(dt: number): void {
    this.constraints.forEach(constraint => {
      this.solver.solve(constraint, this.bodies, dt);
    });
  }

  private integrateVelocities(dt: number): void {
    this.bodies.forEach(body => {
      if (body.type === 'static' || this.sleepingBodies.has(body.id)) return;

      // Integrar velocidade para posição
      body.mesh.position.add(body.velocity.clone().multiplyScalar(dt));

      // Integrar velocidade angular para rotação
      const angularDelta = body.angularVelocity.clone().multiplyScalar(dt);
      body.mesh.rotation.x += angularDelta.x;
      body.mesh.rotation.y += angularDelta.y;
      body.mesh.rotation.z += angularDelta.z;
    });
  }

  private updateSleepStates(): void {
    const sleepThreshold = 0.01;
    const wakeThreshold = 0.1;

    this.bodies.forEach(body => {
      if (body.type === 'static') return;

      const speed = body.velocity.length();
      const angularSpeed = body.angularVelocity.length();

      if (this.sleepingBodies.has(body.id)) {
        // Acordar se necessário
        if (speed > wakeThreshold || angularSpeed > wakeThreshold) {
          this.sleepingBodies.delete(body.id);
          this.emit('bodyWoke', body);
        }
      } else {
        // Dormir se necessário
        if (speed < sleepThreshold && angularSpeed < sleepThreshold) {
          this.sleepingBodies.add(body.id);
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          this.emit('bodySlept', body);
        }
      }
    });
  }

  private updateMeshPositions(): void {
    // As posições já foram atualizadas em integrateVelocities
    // Esta função pode ser usada para sincronização adicional se necessário
  }

  private updateBoundingVolumes(body: PhysicsBody): void {
    const worldMatrix = body.mesh.matrixWorld;
    
    if (body.shape.boundingBox) {
      body.shape.boundingBox.applyMatrix4(worldMatrix);
    }
    
    if (body.shape.boundingSphere) {
      body.shape.boundingSphere.applyMatrix4(worldMatrix);
    }
  }

  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance?: number): RaycastResult {
    this.raycaster.set(origin, direction);
    this.raycaster.far = maxDistance || Infinity;

    let closestHit: RaycastResult = { hit: false };
    let minDistance = Infinity;

    this.bodies.forEach(body => {
      const intersects = this.raycaster.intersectObject(body.mesh, true);
      
      if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.distance < minDistance) {
          minDistance = hit.distance;
          closestHit = {
            hit: true,
            body,
            point: hit.point,
            normal: hit.face?.normal || new THREE.Vector3(),
            distance: hit.distance
          };
        }
      }
    });

    return closestHit;
  }

  public applyImpulse(bodyId: string, impulse: THREE.Vector3, point?: THREE.Vector3): void {
    const body = this.bodies.get(bodyId);
    if (!body || body.type === 'static') return;

    // Aplicar impulso linear
    body.velocity.add(impulse.clone().divideScalar(body.mass));

    // Aplicar impulso angular se ponto especificado
    if (point) {
      const r = point.clone().sub(body.mesh.position);
      const torque = new THREE.Vector3().crossVectors(r, impulse);
      body.angularVelocity.add(torque.divideScalar(body.mass));
    }

    // Acordar o corpo se estiver dormindo
    if (this.sleepingBodies.has(bodyId)) {
      this.sleepingBodies.delete(bodyId);
    }
  }

  public applyForce(bodyId: string, force: THREE.Vector3, point?: THREE.Vector3): void {
    const body = this.bodies.get(bodyId);
    if (!body || body.type === 'static') return;

    // Aplicar força como aceleração
    body.acceleration.add(force.clone().divideScalar(body.mass));

    // Aplicar torque se ponto especificado
    if (point) {
      const r = point.clone().sub(body.mesh.position);
      const torque = new THREE.Vector3().crossVectors(r, force);
      // Adicionar à aceleração angular (simplificado)
      body.angularVelocity.add(torque.divideScalar(body.mass * this.timeStep));
    }
  }

  public setBodyPosition(bodyId: string, position: THREE.Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.mesh.position.copy(position);
      this.updateBoundingVolumes(body);
    }
  }

  public setBodyRotation(bodyId: string, rotation: THREE.Euler): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.mesh.rotation.copy(rotation);
      this.updateBoundingVolumes(body);
    }
  }

  public setBodyVelocity(bodyId: string, velocity: THREE.Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body && body.type !== 'static') {
      body.velocity.copy(velocity);
      
      // Acordar se necessário
      if (this.sleepingBodies.has(bodyId)) {
        this.sleepingBodies.delete(bodyId);
      }
    }
  }

  public getBody(bodyId: string): PhysicsBody | undefined {
    return this.bodies.get(bodyId);
  }

  public getAllBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  public clear(): void {
    this.bodies.clear();
    this.constraints.clear();
    this.forceFields.clear();
    this.staticBodies.clear();
    this.sleepingBodies.clear();
    this.contacts = [];
  }
}

// Classes auxiliares simplificadas

class BroadPhase {
  findPairs(bodies: Map<string, PhysicsBody>): [PhysicsBody, PhysicsBody][] {
    const pairs: [PhysicsBody, PhysicsBody][] = [];
    const bodiesArray = Array.from(bodies.values());

    // Simples teste O(n²) - em produção usaria spatial hashing ou BVH
    for (let i = 0; i < bodiesArray.length; i++) {
      for (let j = i + 1; j < bodiesArray.length; j++) {
        const bodyA = bodiesArray[i];
        const bodyB = bodiesArray[j];

        // Verificar máscaras de colisão
        if ((bodyA.collisionGroup & bodyB.collisionMask) === 0 ||
            (bodyB.collisionGroup & bodyA.collisionMask) === 0) {
          continue;
        }

        // Teste AABB simples
        if (this.testAABB(bodyA, bodyB)) {
          pairs.push([bodyA, bodyB]);
        }
      }
    }

    return pairs;
  }

  private testAABB(bodyA: PhysicsBody, bodyB: PhysicsBody): boolean {
    // Simplified AABB test
    const distanceSquared = bodyA.mesh.position.distanceToSquared(bodyB.mesh.position);
    const maxDistance = 10; // Simplified - should use actual bounding volumes
    return distanceSquared < maxDistance * maxDistance;
  }
}

class NarrowPhase {
  testPair(bodyA: PhysicsBody, bodyB: PhysicsBody): Contact | null {
    // Simplified collision detection
    const distance = bodyA.mesh.position.distanceTo(bodyB.mesh.position);
    const combinedRadius = 2; // Simplified - should use actual shape data

    if (distance < combinedRadius) {
      const normal = bodyB.mesh.position.clone()
        .sub(bodyA.mesh.position)
        .normalize();

      return {
        point: bodyA.mesh.position.clone()
          .add(normal.clone().multiplyScalar(combinedRadius / 2)),
        normal,
        depth: combinedRadius - distance,
        impulse: 0
      };
    }

    return null;
  }
}

class ConstraintSolver {
  solve(constraint: Constraint, bodies: Map<string, PhysicsBody>, dt: number): void {
    const bodyA = bodies.get(constraint.bodyA);
    if (!bodyA) return;

    const bodyB = constraint.bodyB ? bodies.get(constraint.bodyB) : null;

    switch (constraint.type) {
      case 'fixed':
        this.solveFixed(bodyA, bodyB, constraint);
        break;
      case 'distance':
        this.solveDistance(bodyA, bodyB, constraint);
        break;
      case 'hinge':
        this.solveHinge(bodyA, bodyB, constraint);
        break;
      // Outros tipos...
    }
  }

  private solveFixed(bodyA: PhysicsBody, bodyB: PhysicsBody | null, constraint: Constraint): void {
    if (!bodyB) {
      // Fixar no mundo
      bodyA.mesh.position.copy(constraint.pivotA);
      bodyA.velocity.set(0, 0, 0);
    } else {
      // Fixar relativo a outro corpo
      const offset = constraint.pivotA.clone();
      bodyA.mesh.position.copy(bodyB.mesh.position).add(offset);
      bodyA.velocity.copy(bodyB.velocity);
    }
  }

  private solveDistance(bodyA: PhysicsBody, bodyB: PhysicsBody | null, constraint: Constraint): void {
    if (!bodyB) return;

    const currentDistance = bodyA.mesh.position.distanceTo(bodyB.mesh.position);
    const targetDistance = constraint.pivotA.length(); // Usando pivotA.length como distância
    
    if (Math.abs(currentDistance - targetDistance) > 0.01) {
      const correction = (targetDistance - currentDistance) * 0.5;
      const direction = bodyB.mesh.position.clone()
        .sub(bodyA.mesh.position)
        .normalize();
      
      const delta = direction.multiplyScalar(correction);
      
      if (bodyA.type !== 'static') {
        bodyA.mesh.position.sub(delta);
      }
      if (bodyB.type !== 'static') {
        bodyB.mesh.position.add(delta);
      }
    }
  }

  private solveHinge(bodyA: PhysicsBody, bodyB: PhysicsBody | null, constraint: Constraint): void {
    // Simplified hinge constraint
    // Em produção, isso seria muito mais complexo
    if (!bodyB || !constraint.axis) return;

    // Manter corpos conectados no ponto pivô
    this.solveDistance(bodyA, bodyB, constraint);
    
    // Limitar rotação ao eixo especificado
    // Simplified - apenas demonstração
  }
}

export default PhysicsSystem;