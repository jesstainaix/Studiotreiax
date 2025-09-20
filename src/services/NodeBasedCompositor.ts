import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter';
import { PerformanceOptimizer, PerformanceMonitor, OptimizationConfig } from './PerformanceOptimizer';
import { AdvancedCacheSystem, CacheConfig } from './AdvancedCacheSystem';
import { 
  ParticleSystemProcessor, 
  DistortionProcessor, 
  AdvancedLightingProcessor, 
  FluidSimulationProcessor 
} from './AdvancedEffectProcessors';
import { TemporalContextManager, temporalContextManager, NodeExpressionProperties, SpatialTransform, TransformUtils } from './TemporalContextManager';
import { ExpressionEngine, expressionEngine } from './ExpressionEngine';

// Tipos de nós disponíveis
export type NodeType = 
  | 'input' | 'output' | 'blend' | 'transform' | 'filter' | 'color' 
  | 'particle' | 'volumetric' | 'mask' | 'distortion' | 'lighting' 
  | 'texture' | 'generator' | 'math' | 'conditional' | 'effect';

// Interface para conexões entre nós
export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  sourceSocket: string;
  targetNodeId: string;
  targetSocket: string;
  dataType: 'image' | 'color' | 'number' | 'vector' | 'boolean';
}

// Interface para sockets de entrada e saída
export interface NodeSocket {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: 'image' | 'color' | 'number' | 'vector' | 'boolean';
  value?: any;
  connected: boolean;
  connectionId?: string;
}

// Interface base para nós
export interface CompositorNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  inputs: NodeSocket[];
  outputs: NodeSocket[];
  parameters: Record<string, any>;
  enabled: boolean;
  processing: boolean;
  error?: string;
  // Propriedades para expressões
  transform?: SpatialTransform;
  expressions?: Record<string, string>;
  animatableProperties?: Record<string, any>;
}

// Interface para resultado de processamento
export interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

// Classe base para processadores de nós
export abstract class NodeProcessor {
  protected node: CompositorNode;
  protected context: CanvasRenderingContext2D | WebGLRenderingContext;
  
  constructor(node: CompositorNode, context: CanvasRenderingContext2D | WebGLRenderingContext) {
    this.node = node;
    this.context = context;
  }
  
  abstract process(inputs: Record<string, any>): ProcessingResult;
  
  protected validateInputs(inputs: Record<string, any>, required: string[]): boolean {
    return required.every(input => inputs[input] !== undefined);
  }
  
  protected createImageData(width: number, height: number): ImageData {
    if (this.context instanceof CanvasRenderingContext2D) {
      return this.context.createImageData(width, height);
    }
    // Para WebGL, criar ImageData manualmente
    return new ImageData(width, height);
  }
}

// Processador para nó de blend
export class BlendNodeProcessor extends NodeProcessor {
  process(inputs: Record<string, any>): ProcessingResult {
    const startTime = performance.now();
    
    if (!this.validateInputs(inputs, ['imageA', 'imageB'])) {
      return {
        success: false,
        error: 'Missing required inputs: imageA, imageB',
        processingTime: performance.now() - startTime
      };
    }
    
    const imageA = inputs.imageA as ImageData;
    const imageB = inputs.imageB as ImageData;
    const blendMode = this.node.parameters.blendMode || 'normal';
    const opacity = this.node.parameters.opacity || 1.0;
    
    const result = this.blendImages(imageA, imageB, blendMode, opacity);
    
    return {
      success: true,
      data: result,
      processingTime: performance.now() - startTime
    };
  }
  
  private blendImages(imageA: ImageData, imageB: ImageData, mode: string, opacity: number): ImageData {
    const width = Math.min(imageA.width, imageB.width);
    const height = Math.min(imageA.height, imageB.height);
    const result = this.createImageData(width, height);
    
    for (let i = 0; i < result.data.length; i += 4) {
      const r1 = imageA.data[i];
      const g1 = imageA.data[i + 1];
      const b1 = imageA.data[i + 2];
      const a1 = imageA.data[i + 3];
      
      const r2 = imageB.data[i];
      const g2 = imageB.data[i + 1];
      const b2 = imageB.data[i + 2];
      const a2 = imageB.data[i + 3];
      
      let [r, g, b, a] = this.applyBlendMode([r1, g1, b1, a1], [r2, g2, b2, a2], mode);
      
      // Aplicar opacidade
      r = r1 + (r - r1) * opacity;
      g = g1 + (g - g1) * opacity;
      b = b1 + (b - b1) * opacity;
      a = a1 + (a - a1) * opacity;
      
      result.data[i] = r;
      result.data[i + 1] = g;
      result.data[i + 2] = b;
      result.data[i + 3] = a;
    }
    
    return result;
  }
  
  private applyBlendMode(colorA: number[], colorB: number[], mode: string): number[] {
    const [r1, g1, b1, a1] = colorA.map(c => c / 255);
    const [r2, g2, b2, a2] = colorB.map(c => c / 255);
    
    let r, g, b, a;
    
    switch (mode) {
      case 'multiply':
        r = r1 * r2;
        g = g1 * g2;
        b = b1 * b2;
        break;
      case 'screen':
        r = 1 - (1 - r1) * (1 - r2);
        g = 1 - (1 - g1) * (1 - g2);
        b = 1 - (1 - b1) * (1 - b2);
        break;
      case 'overlay':
        r = r1 < 0.5 ? 2 * r1 * r2 : 1 - 2 * (1 - r1) * (1 - r2);
        g = g1 < 0.5 ? 2 * g1 * g2 : 1 - 2 * (1 - g1) * (1 - g2);
        b = b1 < 0.5 ? 2 * b1 * b2 : 1 - 2 * (1 - b1) * (1 - b2);
        break;
      case 'add':
        r = Math.min(1, r1 + r2);
        g = Math.min(1, g1 + g2);
        b = Math.min(1, b1 + b2);
        break;
      case 'subtract':
        r = Math.max(0, r1 - r2);
        g = Math.max(0, g1 - g2);
        b = Math.max(0, b1 - b2);
        break;
      default: // normal
        r = r2;
        g = g2;
        b = b2;
    }
    
    a = Math.max(a1, a2);
    
    return [r * 255, g * 255, b * 255, a * 255];
  }
}

// Processador para nó de filtro
export class FilterNodeProcessor extends NodeProcessor {
  process(inputs: Record<string, any>): ProcessingResult {
    const startTime = performance.now();
    
    if (!this.validateInputs(inputs, ['image'])) {
      return {
        success: false,
        error: 'Missing required input: image',
        processingTime: performance.now() - startTime
      };
    }
    
    const image = inputs.image as ImageData;
    const filterType = this.node.parameters.filterType || 'blur';
    const intensity = this.node.parameters.intensity || 1.0;
    
    const result = this.applyFilter(image, filterType, intensity);
    
    return {
      success: true,
      data: result,
      processingTime: performance.now() - startTime
    };
  }
  
  private applyFilter(image: ImageData, filterType: string, intensity: number): ImageData {
    const result = this.createImageData(image.width, image.height);
    result.data.set(image.data);
    
    switch (filterType) {
      case 'blur':
        return this.applyBlur(result, intensity);
      case 'sharpen':
        return this.applySharpen(result, intensity);
      case 'edge':
        return this.applyEdgeDetection(result, intensity);
      case 'emboss':
        return this.applyEmboss(result, intensity);
      default:
        return result;
    }
  }
  
  private applyBlur(image: ImageData, radius: number): ImageData {
    // Implementação simplificada de blur gaussiano
    const result = this.createImageData(image.width, image.height);
    const { width, height } = image;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const idx = (ny * width + nx) * 4;
            
            r += image.data[idx];
            g += image.data[idx + 1];
            b += image.data[idx + 2];
            a += image.data[idx + 3];
            count++;
          }
        }
        
        const idx = (y * width + x) * 4;
        result.data[idx] = r / count;
        result.data[idx + 1] = g / count;
        result.data[idx + 2] = b / count;
        result.data[idx + 3] = a / count;
      }
    }
    
    return result;
  }
  
  private applySharpen(image: ImageData, intensity: number): ImageData {
    const kernel = [
      0, -intensity, 0,
      -intensity, 1 + 4 * intensity, -intensity,
      0, -intensity, 0
    ];
    
    return this.applyConvolution(image, kernel, 3);
  }
  
  private applyEdgeDetection(image: ImageData, intensity: number): ImageData {
    const kernel = [
      -intensity, -intensity, -intensity,
      -intensity, 8 * intensity, -intensity,
      -intensity, -intensity, -intensity
    ];
    
    return this.applyConvolution(image, kernel, 3);
  }
  
  private applyEmboss(image: ImageData, intensity: number): ImageData {
    const kernel = [
      -2 * intensity, -intensity, 0,
      -intensity, 1, intensity,
      0, intensity, 2 * intensity
    ];
    
    return this.applyConvolution(image, kernel, 3);
  }
  
  private applyConvolution(image: ImageData, kernel: number[], kernelSize: number): ImageData {
    const result = this.createImageData(image.width, image.height);
    const { width, height } = image;
    const half = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const nx = Math.max(0, Math.min(width - 1, x + kx - half));
            const ny = Math.max(0, Math.min(height - 1, y + ky - half));
            const idx = (ny * width + nx) * 4;
            const weight = kernel[ky * kernelSize + kx];
            
            r += image.data[idx] * weight;
            g += image.data[idx + 1] * weight;
            b += image.data[idx + 2] * weight;
          }
        }
        
        const idx = (y * width + x) * 4;
        result.data[idx] = Math.max(0, Math.min(255, r));
        result.data[idx + 1] = Math.max(0, Math.min(255, g));
        result.data[idx + 2] = Math.max(0, Math.min(255, b));
        result.data[idx + 3] = image.data[idx + 3]; // Preservar alpha
      }
    }
    
    return result;
  }
}

// Processador para nó de cor
export class ColorNodeProcessor extends NodeProcessor {
  process(inputs: Record<string, any>): ProcessingResult {
    const startTime = performance.now();
    
    if (!this.validateInputs(inputs, ['image'])) {
      return {
        success: false,
        error: 'Missing required input: image',
        processingTime: performance.now() - startTime
      };
    }
    
    const image = inputs.image as ImageData;
    const operation = this.node.parameters.operation || 'brightness';
    const value = this.node.parameters.value || 0;
    
    const result = this.applyColorOperation(image, operation, value);
    
    return {
      success: true,
      data: result,
      processingTime: performance.now() - startTime
    };
  }
  
  private applyColorOperation(image: ImageData, operation: string, value: number): ImageData {
    const result = this.createImageData(image.width, image.height);
    
    for (let i = 0; i < image.data.length; i += 4) {
      let r = image.data[i];
      let g = image.data[i + 1];
      let b = image.data[i + 2];
      const a = image.data[i + 3];
      
      switch (operation) {
        case 'brightness':
          r = Math.max(0, Math.min(255, r + value));
          g = Math.max(0, Math.min(255, g + value));
          b = Math.max(0, Math.min(255, b + value));
          break;
        case 'contrast':
          const factor = (259 * (value + 255)) / (255 * (259 - value));
          r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
          g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
          b = Math.max(0, Math.min(255, factor * (b - 128) + 128));
          break;
        case 'saturation':
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = Math.max(0, Math.min(255, gray + (r - gray) * value));
          g = Math.max(0, Math.min(255, gray + (g - gray) * value));
          b = Math.max(0, Math.min(255, gray + (b - gray) * value));
          break;
        case 'hue':
          [r, g, b] = this.adjustHue([r, g, b], value);
          break;
      }
      
      result.data[i] = r;
      result.data[i + 1] = g;
      result.data[i + 2] = b;
      result.data[i + 3] = a;
    }
    
    return result;
  }
  
  private adjustHue(rgb: number[], hueShift: number): number[] {
    const [r, g, b] = rgb.map(c => c / 255);
    
    // Converter RGB para HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = (h * 60 + hueShift) % 360;
    if (h < 0) h += 360;
    
    const l = (max + min) / 2;
    const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
    
    // Converter HSL de volta para RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let rNew, gNew, bNew;
    if (h < 60) [rNew, gNew, bNew] = [c, x, 0];
    else if (h < 120) [rNew, gNew, bNew] = [x, c, 0];
    else if (h < 180) [rNew, gNew, bNew] = [0, c, x];
    else if (h < 240) [rNew, gNew, bNew] = [0, x, c];
    else if (h < 300) [rNew, gNew, bNew] = [x, 0, c];
    else [rNew, gNew, bNew] = [c, 0, x];
    
    return [
      Math.round((rNew + m) * 255),
      Math.round((gNew + m) * 255),
      Math.round((bNew + m) * 255)
    ];
  }
}

// Compositor principal
export class NodeBasedCompositor extends EventEmitter {
  private nodes: Map<string, CompositorNode> = new Map();
  private connections: Map<string, NodeConnection> = new Map();
  private processors: Map<string, NodeProcessor> = new Map();
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private processingOrder: string[] = [];
  private isProcessing: boolean = false;
  private performanceOptimizer: PerformanceOptimizer;
  private performanceMonitor: PerformanceMonitor;
  private cacheSystem: AdvancedCacheSystem;
  
  constructor(
    canvas: HTMLCanvasElement,
    private temporalManager: TemporalContextManager = temporalContextManager,
    private expressionEngine: ExpressionEngine = expressionEngine,
    optimizationConfig?: Partial<OptimizationConfig>
  ) {
    super();
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    
    // Inicializar sistema de otimização
    this.performanceOptimizer = new PerformanceOptimizer(optimizationConfig);
    this.performanceMonitor = new PerformanceMonitor(this.performanceOptimizer);
    
    // Configurar sistema de cache avançado
    const cacheConfig: Partial<CacheConfig> = {
      maxMemoryMB: 512,
      compressionEnabled: true,
      persistentCache: true,
      cacheStrategy: 'adaptive',
      preloadStrategy: 'predictive'
    };
    this.cacheSystem = new AdvancedCacheSystem(cacheConfig);
    
    // Configurar eventos do gerenciador temporal
    this.setupTemporalEvents();
    this.startPerformanceMonitoring();
  }
  
  // Configurar eventos do gerenciador temporal
  private setupTemporalEvents(): void {
    this.temporalManager.on('timeUpdate', (time: number) => {
      this.evaluateAllNodeExpressions();
    });
  }
  
  // Registrar nó no gerenciador temporal
  private registerNodeWithTemporalManager(node: CompositorNode): void {
    if (node.expressions && Object.keys(node.expressions).length > 0) {
      const properties: NodeExpressionProperties = {
        nodeId: node.id,
        expressions: node.expressions,
        transform: node.transform || TransformUtils.createDefaultTransform(),
        animatableProperties: node.animatableProperties || {}
      };
      
      this.temporalManager.registerNode(node.id, properties);
    }
  }
  
  // Avaliar expressões de todos os nós
  private evaluateAllNodeExpressions(): void {
    this.nodes.forEach((node, nodeId) => {
      if (node.expressions && Object.keys(node.expressions).length > 0) {
        const context = this.temporalManager.getNodeContext(nodeId);
        if (context) {
          // Avaliar cada expressão e atualizar propriedades do nó
          Object.entries(node.expressions).forEach(([property, expression]) => {
            try {
              const result = this.expressionEngine.evaluate(expression, context);
              if (node.animatableProperties) {
                node.animatableProperties[property] = result;
              }
              
              // Atualizar parâmetros do nó se aplicável
              if (node.parameters && property in node.parameters) {
                node.parameters[property] = result;
              }
            } catch (error) {
              console.warn(`Erro ao avaliar expressão '${expression}' para propriedade '${property}' do nó ${nodeId}:`, error);
            }
          });
        }
      }
    });
  }
  
  // Adicionar nó
  public addNode(node: CompositorNode): void {
    // Inicializar propriedades de expressão se não existirem
    if (!node.transform) {
      node.transform = TransformUtils.createDefaultTransform();
    }
    if (!node.expressions) {
      node.expressions = {};
    }
    if (!node.animatableProperties) {
      node.animatableProperties = {};
    }

    this.nodes.set(node.id, node);
    this.createProcessor(node);
    
    // Registrar nó no gerenciador temporal
    this.registerNodeWithTemporalManager(node);
    
    this.updateProcessingOrder();
  }
  
  // Remover nó
  public removeNode(nodeId: string): void {
    // Remover conexões relacionadas
    const connectionsToRemove: string[] = [];
    this.connections.forEach((connection, id) => {
      if (connection.sourceNodeId === nodeId || connection.targetNodeId === nodeId) {
        connectionsToRemove.push(id);
      }
    });
    
    connectionsToRemove.forEach(id => this.removeConnection(id));
    
    // Desregistrar nó do gerenciador temporal
    this.temporalManager.unregisterNode(nodeId);
    
    this.nodes.delete(nodeId);
    this.processors.delete(nodeId);
    this.updateProcessingOrder();
  }
  
  // Adicionar conexão
  public addConnection(connection: NodeConnection): boolean {
    const sourceNode = this.nodes.get(connection.sourceNodeId);
    const targetNode = this.nodes.get(connection.targetNodeId);
    
    if (!sourceNode || !targetNode) {
      return false;
    }
    
    // Verificar se os sockets existem e são compatíveis
    const sourceSocket = sourceNode.outputs.find(s => s.id === connection.sourceSocket);
    const targetSocket = targetNode.inputs.find(s => s.id === connection.targetSocket);
    
    if (!sourceSocket || !targetSocket || sourceSocket.dataType !== targetSocket.dataType) {
      return false;
    }
    
    // Verificar se não cria ciclo
    if (this.wouldCreateCycle(connection)) {
      return false;
    }
    
    this.connections.set(connection.id, connection);
    sourceSocket.connected = true;
    sourceSocket.connectionId = connection.id;
    targetSocket.connected = true;
    targetSocket.connectionId = connection.id;
    
    this.updateProcessingOrder();
    return true;
  }
  
  // Remover conexão
  public removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    const sourceNode = this.nodes.get(connection.sourceNodeId);
    const targetNode = this.nodes.get(connection.targetNodeId);
    
    if (sourceNode) {
      const socket = sourceNode.outputs.find(s => s.id === connection.sourceSocket);
      if (socket) {
        socket.connected = false;
        socket.connectionId = undefined;
      }
    }
    
    if (targetNode) {
      const socket = targetNode.inputs.find(s => s.id === connection.targetSocket);
      if (socket) {
        socket.connected = false;
        socket.connectionId = undefined;
      }
    }
    
    this.connections.delete(connectionId);
    this.updateProcessingOrder();
  }
  
  // Processar composição
  public async process(): Promise<ProcessingResult> {
    if (this.isProcessing) {
      return {
        success: false,
        error: 'Already processing',
        processingTime: 0
      };
    }
    
    this.isProcessing = true;
    const startTime = performance.now();
    
    try {
      // Avaliar expressões antes do processamento
      this.evaluateAllNodeExpressions();
      
      const nodeResults = new Map<string, any>();
      
      // Processar nós na ordem correta
      for (const nodeId of this.processingOrder) {
        const node = this.nodes.get(nodeId);
        const processor = this.processors.get(nodeId);
        
        if (!node || !processor || !node.enabled) {
          continue;
        }
        
        node.processing = true;
        node.error = undefined;
        
        // Coletar inputs
        const inputs: Record<string, any> = {};
        for (const inputSocket of node.inputs) {
          if (inputSocket.connected && inputSocket.connectionId) {
            const connection = this.connections.get(inputSocket.connectionId);
            if (connection) {
              const sourceResult = nodeResults.get(connection.sourceNodeId);
              if (sourceResult) {
                inputs[inputSocket.name] = sourceResult;
              }
            }
          } else if (inputSocket.value !== undefined) {
            inputs[inputSocket.name] = inputSocket.value;
          }
        }
        
        // Gerar chave de cache baseada no nó e inputs
        const cacheKey = this.generateCacheKey(nodeId, inputs);
        
        // Tentar recuperar do cache primeiro
        const cachedResult = await this.cacheSystem.get(cacheKey);
        if (cachedResult) {
          nodeResults.set(nodeId, cachedResult.data);
          continue;
        }
        
        // Processar nó com otimizações de performance
        const result = await this.performanceOptimizer.optimizeNodeProcessing(
          nodeId,
          async () => processor.process(inputs),
          inputs,
          node.parameters
        );
        
        // Armazenar resultado no cache
        if (result.success) {
          const dependencies = this.getNodeDependencies(nodeId);
          await this.cacheSystem.set(cacheKey, result, dependencies, this.getNodePriority(nodeId));
        }
        
        if (result.success) {
          nodeResults.set(nodeId, result.data);
        } else {
          node.error = result.error;
          console.error(`Node ${nodeId} processing failed:`, result.error);
        }
        
        node.processing = false;
      }
      
      // Encontrar nó de saída
      const outputNode = Array.from(this.nodes.values()).find(n => n.type === 'output');
      const finalResult = outputNode ? nodeResults.get(outputNode.id) : null;
      
      return {
        success: true,
        data: finalResult,
        processingTime: performance.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: performance.now() - startTime
      };
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Criar processador para nó
  private createProcessor(node: CompositorNode): void {
    let processor: NodeProcessor;
    
    switch (node.type) {
      case 'blend':
        processor = new BlendNodeProcessor(node, this.context);
        break;
      case 'filter':
        processor = new FilterNodeProcessor(node, this.context);
        break;
      case 'color':
        processor = new ColorNodeProcessor(node, this.context);
        break;
      case 'transform':
        processor = new TransformNodeProcessor(node, this.context);
        break;
      case 'mask':
        processor = new MaskNodeProcessor(node, this.context);
        break;
      case 'generator':
        processor = new GeneratorNodeProcessor(node, this.context);
        break;
      case 'particles':
        processor = new ParticleSystemProcessor(node, this.context);
        break;
      case 'distortion':
        processor = new DistortionProcessor(node, this.context);
        break;
      case 'lighting':
        processor = new AdvancedLightingProcessor(node, this.context);
        break;
      case 'fluid':
        processor = new FluidSimulationProcessor(node, this.context);
        break;
      default:
        // Processador genérico para outros tipos
        processor = new (class extends NodeProcessor {
          process(inputs: Record<string, any>): ProcessingResult {
            return {
              success: true,
              data: inputs.image || null,
              processingTime: 0
            };
          }
        })(node, this.context);
    }
    
    this.processors.set(node.id, processor);
  }
  
  // Verificar se conexão criaria ciclo
  private wouldCreateCycle(newConnection: NodeConnection): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      // Verificar conexões existentes + nova conexão
      const connections = Array.from(this.connections.values());
      if (nodeId === newConnection.sourceNodeId) {
        connections.push(newConnection);
      }
      
      for (const connection of connections) {
        if (connection.sourceNodeId === nodeId) {
          if (hasCycle(connection.targetNodeId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    return hasCycle(newConnection.targetNodeId);
  }
  
  // Atualizar ordem de processamento usando ordenação topológica
  private updateProcessingOrder(): void {
    const visited = new Set<string>();
    const tempMark = new Set<string>();
    const order: string[] = [];
    
    const visit = (nodeId: string): void => {
      if (tempMark.has(nodeId)) {
        throw new Error('Cycle detected in node graph');
      }
      if (visited.has(nodeId)) return;
      
      tempMark.add(nodeId);
      
      // Visitar dependências (nós que fornecem entrada para este nó)
      this.connections.forEach(connection => {
        if (connection.targetNodeId === nodeId) {
          visit(connection.sourceNodeId);
        }
      });
      
      tempMark.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };
    
    try {
      this.nodes.forEach((_, nodeId) => {
        if (!visited.has(nodeId)) {
          visit(nodeId);
        }
      });
      
      this.processingOrder = order;
    } catch (error) {
      console.error('Failed to update processing order:', error);
      this.processingOrder = Array.from(this.nodes.keys());
    }
  }
  
  /**
   * Define uma expressão para uma propriedade de nó
   */
  setNodeExpression(nodeId: string, propertyName: string, expression: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      console.warn(`Nó ${nodeId} não encontrado`);
      return false;
    }

    if (!node.expressions) {
      node.expressions = {};
    }

    node.expressions[propertyName] = expression;
    
    // Atualizar no gerenciador temporal
    return this.temporalManager.setNodeExpression(nodeId, propertyName, expression);
  }

  /**
   * Remove uma expressão de uma propriedade de nó
   */
  removeNodeExpression(nodeId: string, propertyName: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node || !node.expressions) {
      return false;
    }

    delete node.expressions[propertyName];
    
    // Remover do gerenciador temporal
    return this.temporalManager.removeNodeExpression(nodeId, propertyName);
  }

  /**
   * Obtém todas as expressões de um nó
   */
  getNodeExpressions(nodeId: string): Record<string, string> | null {
    const node = this.nodes.get(nodeId);
    return node?.expressions || null;
  }

  /**
   * Atualiza uma propriedade animável de um nó
   */
  updateNodeAnimatableProperty(nodeId: string, propertyName: string, value: any): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    if (!node.animatableProperties) {
      node.animatableProperties = {};
    }

    node.animatableProperties[propertyName] = value;
    
    // Atualizar no gerenciador temporal
    this.temporalManager.updateNodeProperty(nodeId, `animatableProperties.${propertyName}`, value);
    
    return true;
  }

  /**
   * Obtém propriedades animáveis de um nó
   */
  getNodeAnimatableProperties(nodeId: string): Record<string, any> | null {
    const node = this.nodes.get(nodeId);
    return node?.animatableProperties || null;
  }

  /**
   * Atualiza a transformação de um nó
   */
  updateNodeTransform(nodeId: string, transform: Partial<SpatialTransform>): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    if (!node.transform) {
      node.transform = TransformUtils.createDefaultTransform();
    }

    // Atualizar propriedades da transformação
    Object.entries(transform).forEach(([key, value]) => {
      if (node.transform && key in node.transform) {
        (node.transform as any)[key] = value;
      }
    });

    // Atualizar no gerenciador temporal
    Object.entries(transform).forEach(([key, value]) => {
      this.temporalManager.updateNodeProperty(nodeId, `transform.${key}`, value);
    });

    return true;
  }

  /**
   * Obtém a transformação de um nó
   */
  getNodeTransform(nodeId: string): SpatialTransform | null {
    const node = this.nodes.get(nodeId);
    return node?.transform || null;
  }

  /**
   * Avalia expressões de um nó específico
   */
  evaluateNodeExpressions(nodeId: string): Record<string, any> {
    return this.temporalManager.evaluateNodeExpressions(nodeId);
  }

  /**
   * Obtém o contexto temporal atual
   */
  getTemporalContext(): TemporalContextManager {
    return this.temporalManager;
  }

  // Obter informações do grafo
  public getGraphInfo(): {
    nodeCount: number;
    connectionCount: number;
    processingOrder: string[];
    hasErrors: boolean;
    expressionNodes: number;
    temporalNodes: number;
  } {
    const hasErrors = Array.from(this.nodes.values()).some(node => node.error);
    const expressionNodes = Array.from(this.nodes.values())
      .filter(node => node.expressions && Object.keys(node.expressions).length > 0).length;
    
    return {
      nodeCount: this.nodes.size,
      connectionCount: this.connections.size,
      processingOrder: [...this.processingOrder],
      hasErrors,
      expressionNodes,
      temporalNodes: this.temporalManager.listNodes().length
    };
  }
  
  // Exportar grafo para JSON
  public exportGraph(): string {
    const graphData = {
      nodes: Array.from(this.nodes.values()),
      connections: Array.from(this.connections.values())
    };
    
    return JSON.stringify(graphData, null, 2);
  }
  
  // Importar grafo do JSON
  public importGraph(jsonData: string): boolean {
    try {
      const graphData = JSON.parse(jsonData);
      
      // Limpar grafo atual
      this.nodes.clear();
      this.connections.clear();
      this.processors.clear();
      
      // Adicionar nós
      for (const nodeData of graphData.nodes) {
        this.addNode(nodeData);
      }
      
      // Adicionar conexões
      for (const connectionData of graphData.connections) {
        this.addConnection(connectionData);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import graph:', error);
      return false;
    }
  }
  
  // Iniciar monitoramento de performance
  private startPerformanceMonitoring(): void {
    this.performanceMonitor.startMonitoring();
  }
  
  // Parar monitoramento de performance
  public stopPerformanceMonitoring(): void {
    this.performanceMonitor.stopMonitoring();
  }
  
  // Obter métricas de performance
  public getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }
  
  /**
   * Gera chave de cache para um nó e seus inputs
   */
  private generateCacheKey(nodeId: string, inputs: Record<string, any>): string {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return `${nodeId}_${JSON.stringify(inputs)}`;
    }
    
    // Incluir propriedades do nó que afetam o resultado
    const relevantProps = {
      type: node.type,
      parameters: node.parameters,
      inputs: inputs
    };
    
    // Criar hash simples da configuração
    const configString = JSON.stringify(relevantProps);
    return `node_${nodeId}_${this.simpleHash(configString)}`;
  }
  
  /**
   * Obtém dependências de um nó para invalidação de cache
   */
  private getNodeDependencies(nodeId: string): string[] {
    const dependencies: string[] = [];
    
    // Adicionar nós conectados como dependências
    this.connections.forEach(connection => {
      if (connection.targetNodeId === nodeId) {
        dependencies.push(`node_${connection.sourceNodeId}`);
      }
    });
    
    // Adicionar o próprio nó como dependência
    dependencies.push(`node_${nodeId}`);
    
    return dependencies;
  }
  
  /**
   * Determina prioridade do nó para cache
   */
  private getNodePriority(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return 1;
    }
    
    // Nós de saída têm prioridade mais alta
    if (node.type === 'output') {
      return 3;
    }
    
    // Nós de efeito têm prioridade média
    if (node.type === 'effect' || node.type === 'filter') {
      return 2;
    }
    
    // Nós de entrada têm prioridade baixa (são mais facilmente recalculados)
    return 1;
  }
  
  /**
   * Função hash simples para gerar chaves de cache
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Invalida cache quando nó é modificado
   */
  public async invalidateNodeCache(nodeId: string): Promise<void> {
    await this.cacheSystem.invalidate(`node_${nodeId}`);
  }
  
  /**
   * Obtém estatísticas do cache
   */
  public getCacheStats() {
    return this.cacheSystem.getStats();
  }
  
  /**
   * Pré-carrega cache para nós frequentemente usados
   */
  public async preloadCache(nodeIds: string[]): Promise<void> {
    const cacheKeys = nodeIds.map(id => `node_${id}`);
    await this.cacheSystem.preload(cacheKeys);
  }
  
  // Limpar grafo
  public clear(): void {
    this.nodes.clear();
    this.connections.clear();
    this.processors.clear();
    this.processingOrder = [];
    this.performanceOptimizer.clearCache();
    this.cacheSystem.clear();
  }
  
  // Obter nó por ID
  public getNode(nodeId: string): CompositorNode | undefined {
    return this.nodes.get(nodeId);
  }
  
  // Obter todos os nós
  public getAllNodes(): CompositorNode[] {
    return Array.from(this.nodes.values());
  }
  
  // Obter todas as conexões
  public getAllConnections(): NodeConnection[] {
    return Array.from(this.connections.values());
  }
  
  // Validar grafo
  public validateGraph(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar se há pelo menos um nó de entrada e um de saída
    const inputNodes = Array.from(this.nodes.values()).filter(n => n.type === 'input');
    const outputNodes = Array.from(this.nodes.values()).filter(n => n.type === 'output');
    
    if (inputNodes.length === 0) {
      errors.push('Graph must have at least one input node');
    }
    
    if (outputNodes.length === 0) {
      errors.push('Graph must have at least one output node');
    }
    
    // Verificar conexões válidas
    this.connections.forEach((connection, id) => {
      const sourceNode = this.nodes.get(connection.sourceNodeId);
      const targetNode = this.nodes.get(connection.targetNodeId);
      
      if (!sourceNode) {
        errors.push(`Connection ${id}: Source node ${connection.sourceNodeId} not found`);
      }
      
      if (!targetNode) {
        errors.push(`Connection ${id}: Target node ${connection.targetNodeId} not found`);
      }
      
      if (sourceNode && targetNode) {
        const sourceSocket = sourceNode.outputs.find(s => s.id === connection.sourceSocket);
        const targetSocket = targetNode.inputs.find(s => s.id === connection.targetSocket);
        
        if (!sourceSocket) {
          errors.push(`Connection ${id}: Source socket ${connection.sourceSocket} not found`);
        }
        
        if (!targetSocket) {
          errors.push(`Connection ${id}: Target socket ${connection.targetSocket} not found`);
        }
        
        if (sourceSocket && targetSocket && sourceSocket.dataType !== targetSocket.dataType) {
          errors.push(`Connection ${id}: Data type mismatch (${sourceSocket.dataType} -> ${targetSocket.dataType})`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Factory para criar nós pré-configurados
export class NodeFactory {
  private static nodeIdCounter = 0;
  
  private static generateId(): string {
    return `node_${++this.nodeIdCounter}_${Date.now()}`;
  }
  
  public static createInputNode(name: string = 'Input'): CompositorNode {
    return {
      id: this.generateId(),
      type: 'input',
      name,
      position: { x: 0, y: 0 },
      inputs: [],
      outputs: [
        {
          id: 'output',
          name: 'Image',
          type: 'output',
          dataType: 'image',
          connected: false
        }
      ],
      parameters: {
        source: 'file' // file, camera, canvas
      },
      enabled: true,
      processing: false
    };
  }
  
  public static createOutputNode(name: string = 'Output'): CompositorNode {
    return {
      id: this.generateId(),
      type: 'output',
      name,
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'input',
          name: 'Image',
          type: 'input',
          dataType: 'image',
          connected: false
        }
      ],
      outputs: [],
      parameters: {
        format: 'png', // png, jpg, webp
        quality: 1.0
      },
      enabled: true,
      processing: false
    };
  }
  
  public static createBlendNode(name: string = 'Blend'): CompositorNode {
    return {
      id: this.generateId(),
      type: 'blend',
      name,
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'imageA',
          name: 'Image A',
          type: 'input',
          dataType: 'image',
          connected: false
        },
        {
          id: 'imageB',
          name: 'Image B',
          type: 'input',
          dataType: 'image',
          connected: false
        },
        {
          id: 'opacity',
          name: 'Opacity',
          type: 'input',
          dataType: 'number',
          value: 1.0,
          connected: false
        }
      ],
      outputs: [
        {
          id: 'output',
          name: 'Result',
          type: 'output',
          dataType: 'image',
          connected: false
        }
      ],
      parameters: {
        blendMode: 'normal', // normal, multiply, screen, overlay, add, subtract
        opacity: 1.0
      },
      enabled: true,
      processing: false
    };
  }
  
  public static createFilterNode(name: string = 'Filter'): CompositorNode {
    return {
      id: this.generateId(),
      type: 'filter',
      name,
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'image',
          name: 'Image',
          type: 'input',
          dataType: 'image',
          connected: false
        },
        {
          id: 'intensity',
          name: 'Intensity',
          type: 'input',
          dataType: 'number',
          value: 1.0,
          connected: false
        }
      ],
      outputs: [
        {
          id: 'output',
          name: 'Result',
          type: 'output',
          dataType: 'image',
          connected: false
        }
      ],
      parameters: {
        filterType: 'blur', // blur, sharpen, edge, emboss
        intensity: 1.0
      },
      enabled: true,
      processing: false
    };
  }
  
  public static createColorNode(name: string = 'Color'): CompositorNode {
    return {
      id: this.generateId(),
      type: 'color',
      name,
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'image',
          name: 'Image',
          type: 'input',
          dataType: 'image',
          connected: false
        },
        {
          id: 'value',
          name: 'Value',
          type: 'input',
          dataType: 'number',
          value: 0,
          connected: false
        }
      ],
      outputs: [
        {
          id: 'output',
          name: 'Result',
          type: 'output',
          dataType: 'image',
          connected: false
        }
      ],
      parameters: {
        operation: 'brightness', // brightness, contrast, saturation, hue
        value: 0
      },
      enabled: true,
      processing: false
    };
  }
  
  public static createTransformNode(name: string = 'Transform'): CompositorNode {
    return {
      id: this.generateId(),
      type: 'transform',
      name,
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'image',
          name: 'Image',
          type: 'input',
          dataType: 'image',
          connected: false
        }
      ],
      outputs: [
        {
          id: 'output',
          name: 'Result',
          type: 'output',
          dataType: 'image',
          connected: false
        }
      ],
      parameters: {
        scale: { x: 1, y: 1 },
        rotation: 0,
        translation: { x: 0, y: 0 },
        anchor: { x: 0.5, y: 0.5 }
      },
      enabled: true,
      processing: false
    };
  }
}

// Integração com AdvancedVFXEngine
export interface VFXEngineIntegration {
  compositor: NodeBasedCompositor;
  canvas: HTMLCanvasElement;
  
  // Métodos de integração
  setupComposition(): void;
  renderFrame(time: number): Promise<void>;
  exportResult(): Promise<Blob | null>;
}

export class VFXCompositorIntegration implements VFXEngineIntegration {
  public compositor: NodeBasedCompositor;
  public canvas: HTMLCanvasElement;
  private animationId: number | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.compositor = new NodeBasedCompositor(canvas);
  }
  
  public setupComposition(): void {
    // Configuração básica com nós de entrada e saída
    const inputNode = NodeFactory.createInputNode('Video Input');
    const outputNode = NodeFactory.createOutputNode('Final Output');
    
    // Posicionar nós
    inputNode.position = { x: 100, y: 200 };
    outputNode.position = { x: 600, y: 200 };
    
    this.compositor.addNode(inputNode);
    this.compositor.addNode(outputNode);
    
    // Conectar entrada à saída (passthrough básico)
    const connection: NodeConnection = {
      id: 'basic_connection',
      sourceNodeId: inputNode.id,
      sourceSocket: 'output',
      targetNodeId: outputNode.id,
      targetSocket: 'input',
      dataType: 'image'
    };
    
    this.compositor.addConnection(connection);
  }
  
  public async renderFrame(time: number): Promise<void> {
    try {
      const result = await this.compositor.process();
      
      if (result.success && result.data) {
        // Renderizar resultado no canvas
        const ctx = this.canvas.getContext('2d')!;
        if (result.data instanceof ImageData) {
          ctx.putImageData(result.data, 0, 0);
        }
      } else {
        console.warn('Composition processing failed:', result.error);
      }
    } catch (error) {
      console.error('Frame rendering failed:', error);
    }
  }
  
  public async exportResult(): Promise<Blob | null> {
    try {
      const result = await this.compositor.process();
      
      if (result.success && result.data instanceof ImageData) {
        // Criar canvas temporário para exportação
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = result.data.width;
        tempCanvas.height = result.data.height;
        
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.putImageData(result.data, 0, 0);
        
        return new Promise((resolve) => {
          tempCanvas.toBlob(resolve, 'image/png');
        });
      }
      
      return null;
    } catch (error) {
      console.error('Export failed:', error);
      return null;
    }
  }
  
  public startRealTimeProcessing(): void {
    const processFrame = (time: number) => {
      this.renderFrame(time);
      this.animationId = requestAnimationFrame(processFrame);
    };
    
    this.animationId = requestAnimationFrame(processFrame);
  }
  
  public stopRealTimeProcessing(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  public destroy(): void {
    this.stopRealTimeProcessing();
    this.compositor.clear();
  }
}

// Processador para nó de transformação
export class TransformNodeProcessor extends NodeProcessor {
  process(inputs: Record<string, any>): ProcessingResult {
    const startTime = performance.now();
    
    if (!this.validateInputs(inputs, ['image'])) {
      return {
        success: false,
        error: 'Missing required input: image',
        processingTime: performance.now() - startTime
      };
    }
    
    const image = inputs.image as ImageData;
    const scale = this.node.parameters.scale || 1.0;
    const rotation = this.node.parameters.rotation || 0;
    const translateX = this.node.parameters.translateX || 0;
    const translateY = this.node.parameters.translateY || 0;
    
    const result = this.applyTransform(image, scale, rotation, translateX, translateY);
    
    return {
      success: true,
      data: result,
      processingTime: performance.now() - startTime
    };
  }
  
  private applyTransform(image: ImageData, scale: number, rotation: number, translateX: number, translateY: number): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Criar ImageData temporário
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.putImageData(image, 0, 0);
    
    // Aplicar transformações
    ctx.save();
    ctx.translate(canvas.width / 2 + translateX, canvas.height / 2 + translateY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(tempCanvas, -image.width / 2, -image.height / 2);
    ctx.restore();
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}

// Processador para nó de máscara
export class MaskNodeProcessor extends NodeProcessor {
  process(inputs: Record<string, any>): ProcessingResult {
    const startTime = performance.now();
    
    if (!this.validateInputs(inputs, ['image', 'mask'])) {
      return {
        success: false,
        error: 'Missing required inputs: image, mask',
        processingTime: performance.now() - startTime
      };
    }
    
    const image = inputs.image as ImageData;
    const mask = inputs.mask as ImageData;
    const invert = this.node.parameters.invert || false;
    
    const result = this.applyMask(image, mask, invert);
    
    return {
      success: true,
      data: result,
      processingTime: performance.now() - startTime
    };
  }
  
  private applyMask(image: ImageData, mask: ImageData, invert: boolean): ImageData {
    const result = this.createImageData(image.width, image.height);
    
    for (let i = 0; i < image.data.length; i += 4) {
      const maskValue = (mask.data[i] + mask.data[i + 1] + mask.data[i + 2]) / 3;
      const alpha = invert ? 255 - maskValue : maskValue;
      
      result.data[i] = image.data[i];
      result.data[i + 1] = image.data[i + 1];
      result.data[i + 2] = image.data[i + 2];
      result.data[i + 3] = (image.data[i + 3] * alpha) / 255;
    }
    
    return result;
  }
}

// Processador para nó gerador
export class GeneratorNodeProcessor extends NodeProcessor {
  process(inputs: Record<string, any>): ProcessingResult {
    const startTime = performance.now();
    
    const width = this.node.parameters.width || 512;
    const height = this.node.parameters.height || 512;
    const type = this.node.parameters.type || 'solid';
    const color = this.node.parameters.color || [255, 255, 255, 255];
    
    const result = this.generateImage(width, height, type, color);
    
    return {
      success: true,
      data: result,
      processingTime: performance.now() - startTime
    };
  }
  
  private generateImage(width: number, height: number, type: string, color: number[]): ImageData {
    const result = this.createImageData(width, height);
    
    switch (type) {
      case 'solid':
        for (let i = 0; i < result.data.length; i += 4) {
          result.data[i] = color[0];
          result.data[i + 1] = color[1];
          result.data[i + 2] = color[2];
          result.data[i + 3] = color[3];
        }
        break;
      case 'gradient':
        for (let y = 0; y < height; y++) {
          const factor = y / height;
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            result.data[idx] = color[0] * factor;
            result.data[idx + 1] = color[1] * factor;
            result.data[idx + 2] = color[2] * factor;
            result.data[idx + 3] = color[3];
          }
        }
        break;
      case 'noise':
        for (let i = 0; i < result.data.length; i += 4) {
          const noise = Math.random();
          result.data[i] = color[0] * noise;
          result.data[i + 1] = color[1] * noise;
          result.data[i + 2] = color[2] * noise;
          result.data[i + 3] = color[3];
        }
        break;
    }
    
    return result;
  }
}