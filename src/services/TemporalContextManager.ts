import * as THREE from 'three';
import { ExpressionContext, ExpressionEngine, expressionEngine } from './ExpressionEngine';

// Interface para configuração de timeline
export interface TimelineConfig {
  startTime: number;
  endTime: number;
  fps: number;
  currentTime: number;
  playbackRate: number;
  loop: boolean;
}

// Interface para transformações espaciais
export interface SpatialTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  pivot: THREE.Vector3;
  anchor: THREE.Vector2;
}

// Interface para propriedades de nó com expressões
export interface NodeExpressionProperties {
  nodeId: string;
  nodeType: string;
  transform: SpatialTransform;
  customProperties: Record<string, any>;
  expressions: Record<string, string>;
}

// Classe para gerenciar contexto temporal e espacial
export class TemporalContextManager {
  private timeline: TimelineConfig;
  private nodeProperties: Map<string, NodeExpressionProperties> = new Map();
  private globalVariables: Record<string, any> = {};
  private engine: ExpressionEngine;
  private animationFrameId?: number;
  private isPlaying: boolean = false;
  private lastUpdateTime: number = 0;
  
  constructor(engine: ExpressionEngine = expressionEngine) {
    this.engine = engine;
    this.timeline = {
      startTime: 0,
      endTime: 10,
      fps: 30,
      currentTime: 0,
      playbackRate: 1,
      loop: true
    };
    
    this.initializeGlobalVariables();
  }
  
  /**
   * Configura a timeline
   */
  setTimelineConfig(config: Partial<TimelineConfig>): void {
    this.timeline = { ...this.timeline, ...config };
    this.updateGlobalContext();
  }
  
  /**
   * Obtém a configuração atual da timeline
   */
  getTimelineConfig(): TimelineConfig {
    return { ...this.timeline };
  }
  
  /**
   * Define o tempo atual
   */
  setCurrentTime(time: number): void {
    this.timeline.currentTime = Math.max(this.timeline.startTime, 
                                        Math.min(this.timeline.endTime, time));
    this.updateGlobalContext();
  }
  
  /**
   * Obtém o tempo atual
   */
  getCurrentTime(): number {
    return this.timeline.currentTime;
  }
  
  /**
   * Obtém o frame atual
   */
  getCurrentFrame(): number {
    return Math.floor(this.timeline.currentTime * this.timeline.fps);
  }
  
  /**
   * Inicia a reprodução
   */
  play(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.lastUpdateTime = performance.now();
    this.animate();
  }
  
  /**
   * Pausa a reprodução
   */
  pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }
  
  /**
   * Para a reprodução e volta ao início
   */
  stop(): void {
    this.pause();
    this.setCurrentTime(this.timeline.startTime);
  }
  
  /**
   * Verifica se está reproduzindo
   */
  isPlayingAnimation(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Registra propriedades de um nó
   */
  registerNode(nodeId: string, properties: Partial<NodeExpressionProperties>): void {
    const existingProps = this.nodeProperties.get(nodeId);
    
    const nodeProps: NodeExpressionProperties = {
      nodeId,
      nodeType: properties.nodeType || 'unknown',
      transform: properties.transform || {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        pivot: new THREE.Vector3(0, 0, 0),
        anchor: new THREE.Vector2(0.5, 0.5)
      },
      customProperties: properties.customProperties || {},
      expressions: properties.expressions || {}
    };
    
    // Mesclar com propriedades existentes se houver
    if (existingProps) {
      nodeProps.transform = { ...existingProps.transform, ...nodeProps.transform };
      nodeProps.customProperties = { ...existingProps.customProperties, ...nodeProps.customProperties };
      nodeProps.expressions = { ...existingProps.expressions, ...nodeProps.expressions };
    }
    
    this.nodeProperties.set(nodeId, nodeProps);
    
    // Compilar expressões do nó
    this.compileNodeExpressions(nodeId);
  }
  
  /**
   * Remove um nó registrado
   */
  unregisterNode(nodeId: string): boolean {
    const nodeProps = this.nodeProperties.get(nodeId);
    if (nodeProps) {
      // Remover expressões compiladas
      Object.keys(nodeProps.expressions).forEach(propName => {
        this.engine.removeExpression(`${nodeId}_${propName}`);
      });
    }
    
    return this.nodeProperties.delete(nodeId);
  }
  
  /**
   * Atualiza uma propriedade de nó
   */
  updateNodeProperty(nodeId: string, propertyPath: string, value: any): void {
    const nodeProps = this.nodeProperties.get(nodeId);
    if (!nodeProps) return;
    
    // Navegar pelo caminho da propriedade
    const pathParts = propertyPath.split('.');
    let target: any = nodeProps;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!target[pathParts[i]]) {
        target[pathParts[i]] = {};
      }
      target = target[pathParts[i]];
    }
    
    target[pathParts[pathParts.length - 1]] = value;
  }
  
  /**
   * Define uma expressão para uma propriedade de nó
   */
  setNodeExpression(nodeId: string, propertyName: string, expression: string): boolean {
    const nodeProps = this.nodeProperties.get(nodeId);
    if (!nodeProps) return false;
    
    nodeProps.expressions[propertyName] = expression;
    
    // Compilar a expressão
    const expressionId = `${nodeId}_${propertyName}`;
    return this.engine.compileExpression(expressionId, expression);
  }
  
  /**
   * Remove uma expressão de uma propriedade de nó
   */
  removeNodeExpression(nodeId: string, propertyName: string): boolean {
    const nodeProps = this.nodeProperties.get(nodeId);
    if (!nodeProps) return false;
    
    delete nodeProps.expressions[propertyName];
    
    const expressionId = `${nodeId}_${propertyName}`;
    return this.engine.removeExpression(expressionId);
  }
  
  /**
   * Avalia todas as expressões de um nó
   */
  evaluateNodeExpressions(nodeId: string): Record<string, any> {
    const nodeProps = this.nodeProperties.get(nodeId);
    if (!nodeProps) return {};
    
    const context = this.createNodeContext(nodeId);
    const results: Record<string, any> = {};
    
    Object.entries(nodeProps.expressions).forEach(([propertyName, expression]) => {
      const expressionId = `${nodeId}_${propertyName}`;
      const result = this.engine.evaluateExpression(expressionId, context);
      
      if (result.success) {
        results[propertyName] = result.value;
        
        // Atualizar a propriedade no nó
        this.updateNodeProperty(nodeId, propertyName, result.value);
      } else {
        console.warn(`Erro ao avaliar expressão ${expressionId}:`, result.error);
      }
    });
    
    return results;
  }
  
  /**
   * Avalia todas as expressões de todos os nós
   */
  evaluateAllExpressions(): Record<string, Record<string, any>> {
    const allResults: Record<string, Record<string, any>> = {};
    
    this.nodeProperties.forEach((_, nodeId) => {
      allResults[nodeId] = this.evaluateNodeExpressions(nodeId);
    });
    
    return allResults;
  }
  
  /**
   * Obtém propriedades de um nó
   */
  getNodeProperties(nodeId: string): NodeExpressionProperties | null {
    return this.nodeProperties.get(nodeId) || null;
  }
  
  /**
   * Define variáveis globais
   */
  setGlobalVariables(variables: Record<string, any>): void {
    this.globalVariables = { ...this.globalVariables, ...variables };
    this.updateGlobalContext();
  }
  
  /**
   * Obtém uma variável global
   */
  getGlobalVariable(name: string): any {
    return this.globalVariables[name];
  }
  
  /**
   * Lista todos os nós registrados
   */
  listNodes(): string[] {
    return Array.from(this.nodeProperties.keys());
  }
  
  /**
   * Cria contexto específico para um nó
   */
  private createNodeContext(nodeId: string): ExpressionContext {
    const nodeProps = this.nodeProperties.get(nodeId);
    if (!nodeProps) {
      throw new Error(`Nó ${nodeId} não encontrado`);
    }
    
    return {
      // Variáveis de tempo
      time: this.timeline.currentTime,
      frame: this.getCurrentFrame(),
      fps: this.timeline.fps,
      duration: this.timeline.endTime - this.timeline.startTime,
      
      // Variáveis de transformação
      position: nodeProps.transform.position.clone(),
      rotation: nodeProps.transform.rotation.clone(),
      scale: nodeProps.transform.scale.clone(),
      pivot: nodeProps.transform.pivot.clone(),
      anchor: nodeProps.transform.anchor.clone(),
      
      // Variáveis do nó
      nodeId: nodeProps.nodeId,
      nodeType: nodeProps.nodeType,
      
      // Propriedades customizadas
      ...nodeProps.customProperties,
      
      // Variáveis globais
      ...this.globalVariables
    };
  }
  
  /**
   * Compila todas as expressões de um nó
   */
  private compileNodeExpressions(nodeId: string): void {
    const nodeProps = this.nodeProperties.get(nodeId);
    if (!nodeProps) return;
    
    Object.entries(nodeProps.expressions).forEach(([propertyName, expression]) => {
      const expressionId = `${nodeId}_${propertyName}`;
      this.engine.compileExpression(expressionId, expression);
    });
  }
  
  /**
   * Atualiza o contexto global do motor de expressões
   */
  private updateGlobalContext(): void {
    const globalContext: Partial<ExpressionContext> = {
      time: this.timeline.currentTime,
      frame: this.getCurrentFrame(),
      fps: this.timeline.fps,
      duration: this.timeline.endTime - this.timeline.startTime,
      ...this.globalVariables
    };
    
    this.engine.setGlobalContext(globalContext);
  }
  
  /**
   * Inicializa variáveis globais padrão
   */
  private initializeGlobalVariables(): void {
    this.globalVariables = {
      // Constantes matemáticas
      PI: Math.PI,
      E: Math.E,
      
      // Variáveis de viewport (podem ser atualizadas externamente)
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      
      // Variáveis de mouse/interação (podem ser atualizadas externamente)
      mouseX: 0,
      mouseY: 0,
      mousePressed: false,
      
      // Variáveis de sistema
      random: Math.random,
      
      // Funções utilitárias globais
      now: () => Date.now(),
      timestamp: () => performance.now()
    };
    
    this.updateGlobalContext();
  }
  
  /**
   * Loop de animação
   */
  private animate(): void {
    if (!this.isPlaying) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // em segundos
    this.lastUpdateTime = currentTime;
    
    // Atualizar tempo da timeline
    const newTime = this.timeline.currentTime + (deltaTime * this.timeline.playbackRate);
    
    if (newTime >= this.timeline.endTime) {
      if (this.timeline.loop) {
        this.setCurrentTime(this.timeline.startTime);
      } else {
        this.setCurrentTime(this.timeline.endTime);
        this.pause();
        return;
      }
    } else {
      this.setCurrentTime(newTime);
    }
    
    // Avaliar todas as expressões
    this.evaluateAllExpressions();
    
    // Continuar animação
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
  
  /**
   * Exporta o estado atual para serialização
   */
  exportState(): any {
    return {
      timeline: this.timeline,
      nodes: Array.from(this.nodeProperties.entries()).map(([id, props]) => ({
        id,
        ...props,
        transform: {
          position: props.transform.position.toArray(),
          rotation: [props.transform.rotation.x, props.transform.rotation.y, props.transform.rotation.z],
          scale: props.transform.scale.toArray(),
          pivot: props.transform.pivot.toArray(),
          anchor: props.transform.anchor.toArray()
        }
      })),
      globalVariables: this.globalVariables
    };
  }
  
  /**
   * Importa estado de serialização
   */
  importState(state: any): void {
    // Restaurar timeline
    if (state.timeline) {
      this.timeline = { ...this.timeline, ...state.timeline };
    }
    
    // Restaurar nós
    if (state.nodes) {
      this.nodeProperties.clear();
      
      state.nodes.forEach((nodeData: any) => {
        const props: NodeExpressionProperties = {
          nodeId: nodeData.id,
          nodeType: nodeData.nodeType,
          transform: {
            position: new THREE.Vector3().fromArray(nodeData.transform.position),
            rotation: new THREE.Euler().fromArray(nodeData.transform.rotation),
            scale: new THREE.Vector3().fromArray(nodeData.transform.scale),
            pivot: new THREE.Vector3().fromArray(nodeData.transform.pivot),
            anchor: new THREE.Vector2().fromArray(nodeData.transform.anchor)
          },
          customProperties: nodeData.customProperties || {},
          expressions: nodeData.expressions || {}
        };
        
        this.nodeProperties.set(nodeData.id, props);
        this.compileNodeExpressions(nodeData.id);
      });
    }
    
    // Restaurar variáveis globais
    if (state.globalVariables) {
      this.globalVariables = { ...this.globalVariables, ...state.globalVariables };
    }
    
    this.updateGlobalContext();
  }
}

// Instância singleton do gerenciador de contexto temporal
export const temporalContextManager = new TemporalContextManager();

// Utilitários para criação de transformações
export class TransformUtils {
  /**
   * Cria uma transformação padrão
   */
  static createDefaultTransform(): SpatialTransform {
    return {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      pivot: new THREE.Vector3(0, 0, 0),
      anchor: new THREE.Vector2(0.5, 0.5)
    };
  }
  
  /**
   * Clona uma transformação
   */
  static cloneTransform(transform: SpatialTransform): SpatialTransform {
    return {
      position: transform.position.clone(),
      rotation: transform.rotation.clone(),
      scale: transform.scale.clone(),
      pivot: transform.pivot.clone(),
      anchor: transform.anchor.clone()
    };
  }
  
  /**
   * Interpola entre duas transformações
   */
  static lerpTransforms(a: SpatialTransform, b: SpatialTransform, t: number): SpatialTransform {
    return {
      position: new THREE.Vector3().lerpVectors(a.position, b.position, t),
      rotation: new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromEuler(a.rotation).slerp(
          new THREE.Quaternion().setFromEuler(b.rotation), t
        )
      ),
      scale: new THREE.Vector3().lerpVectors(a.scale, b.scale, t),
      pivot: new THREE.Vector3().lerpVectors(a.pivot, b.pivot, t),
      anchor: new THREE.Vector2().lerpVectors(a.anchor, b.anchor, t)
    };
  }
  
  /**
   * Converte transformação para matriz 4x4
   */
  static transformToMatrix4(transform: SpatialTransform): THREE.Matrix4 {
    const matrix = new THREE.Matrix4();
    
    // Aplicar transformações na ordem: escala -> rotação -> translação
    matrix.makeScale(transform.scale.x, transform.scale.y, transform.scale.z);
    
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(transform.rotation);
    matrix.premultiply(rotationMatrix);
    
    const translationMatrix = new THREE.Matrix4().makeTranslation(
      transform.position.x, transform.position.y, transform.position.z
    );
    matrix.premultiply(translationMatrix);
    
    return matrix;
  }
}