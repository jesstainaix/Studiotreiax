/**
 * PPTX Streaming System - Sistema de Processamento de Streaming
 * 
 * Este arquivo implementa um sistema avançado de streaming para processamento
 * de arquivos PPTX muito grandes (>100MB) com chunking inteligente,
 * processamento incremental e progress tracking em tempo real.
 * 
 * Funcionalidades principais:
 * - Chunking adaptativo baseado na disponibilidade de memória
 * - Processamento incremental com backpressure control
 * - Progress tracking detalhado em tempo real
 * - Otimização automática de chunk size
 * - Recuperação de falhas com resumo de processamento
 * - Streaming de resultados para evitar memory overflow
 * 
 * @version 1.0.0
 * @author PPTX Studio Team
 */

import { EventEmitter } from '../../utils/EventEmitter';
import {
  PPTXStreamingOptions,
  PPTXStreamingResult,
  PPTXChunk,
  StreamingProgressInfo,
  ChunkProcessingResult,
  StreamingMetrics,
  BackpressureInfo,
  StreamingState
} from './pptx-interfaces';

/**
 * Configuração padrão do sistema de streaming
 */
const DEFAULT_STREAMING_CONFIG: Required<PPTXStreamingOptions> = {
  chunkSize: 5 * 1024 * 1024, // 5MB inicial
  maxChunkSize: 50 * 1024 * 1024, // 50MB máximo
  minChunkSize: 1 * 1024 * 1024, // 1MB mínimo
  concurrentChunks: 3,
  memoryThreshold: 0.7, // 70% da memória disponível
  enableProgressTracking: true,
  enableBackpressureControl: true,
  enableAdaptiveChunking: true,
  retryAttempts: 3,
  retryDelay: 1000,
  enableMetrics: true,
  streamResults: true,
  enableRecovery: true,
  compressionLevel: 6,
  bufferSize: 64 * 1024 // 64KB
};

/**
 * Informações de chunk para processamento
 */
interface ChunkInfo {
  id: string;
  index: number;
  offset: number;
  size: number;
  data: ArrayBuffer;
  retryCount: number;
  processingStartTime?: number;
  processingEndTime?: number;
  dependencies: string[];
  metadata: Record<string, any>;
}

/**
 * Estado do processamento de streaming
 */
interface StreamingProcessingState {
  totalSize: number;
  processedSize: number;
  chunksTotal: number;
  chunksProcessed: number;
  chunksInProgress: number;
  chunksFailed: number;
  currentChunkSize: number;
  estimatedTimeRemaining: number;
  throughput: number; // bytes per second
  errorRate: number;
  isComplete: boolean;
  isPaused: boolean;
  lastProgressUpdate: number;
}

/**
 * Sistema de Streaming PPTX
 * 
 * Classe principal para processamento de streaming de arquivos PPTX grandes,
 * implementando chunking adaptativo e controle de backpressure.
 */
export class PPTXStreamingSystem extends EventEmitter {
  private readonly config: Required<PPTXStreamingOptions>;
  private readonly chunks: Map<string, ChunkInfo>;
  private readonly processingQueue: ChunkInfo[];
  private readonly results: Map<string, ChunkProcessingResult>;
  private readonly metrics: StreamingMetrics;
  private state: StreamingProcessingState;
  private readonly streamingState: StreamingState;
  private processingPromises: Map<string, Promise<ChunkProcessingResult>>;
  private abortController?: AbortController;
  private readonly performanceObserver: PerformanceObserver;

  /**
   * Construtor do sistema de streaming
   */
  constructor(options: Partial<PPTXStreamingOptions> = {}) {
    super();
    
    this.config = { ...DEFAULT_STREAMING_CONFIG, ...options };
    this.chunks = new Map();
    this.processingQueue = [];
    this.results = new Map();
    this.processingPromises = new Map();
    
    // Inicializar estado
    this.state = {
      totalSize: 0,
      processedSize: 0,
      chunksTotal: 0,
      chunksProcessed: 0,
      chunksInProgress: 0,
      chunksFailed: 0,
      currentChunkSize: this.config.chunkSize,
      estimatedTimeRemaining: 0,
      throughput: 0,
      errorRate: 0,
      isComplete: false,
      isPaused: false,
      lastProgressUpdate: Date.now()
    };

    this.streamingState = StreamingState.IDLE;

    // Inicializar métricas
    this.metrics = {
      totalBytesProcessed: 0,
      averageChunkProcessingTime: 0,
      peakMemoryUsage: 0,
      adaptiveChunkAdjustments: 0,
      backpressureEvents: 0,
      recoveryEvents: 0,
      throughputHistory: [],
      errorHistory: [],
      chunkSizeHistory: []
    };

    // Configurar performance observer
    this.performanceObserver = new PerformanceObserver((list) => {
      this.handlePerformanceEntries(list.getEntries());
    });

    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }

    this.log('PPTX Streaming System inicializado');
  }

  /**
   * Processamento principal de arquivo via streaming
   */
  public async processFileStream(
    file: File | ArrayBuffer,
    options: Partial<PPTXStreamingOptions> = {}
  ): Promise<PPTXStreamingResult> {
    this.log(`Iniciando streaming de arquivo: ${this.getFileInfo(file)}`);
    
    try {
      // Preparar para streaming
      await this.prepareStreaming(file, options);
      
      // Executar pipeline de streaming
      const result = await this.executeStreamingPipeline();
      
      this.log('Streaming concluído com sucesso');
      return result;
      
    } catch (error) {
      this.handleStreamingError(error as Error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Preparação para streaming
   */
  private async prepareStreaming(
    file: File | ArrayBuffer,
    options: Partial<PPTXStreamingOptions>
  ): Promise<void> {
    // Mesclar configurações
    Object.assign(this.config, options);
    
    // Obter dados do arquivo
    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
    const fileSize = arrayBuffer.byteLength;
    
    this.state.totalSize = fileSize;
    this.state.lastProgressUpdate = Date.now();
    
    // Calcular chunking inicial
    await this.calculateInitialChunking(arrayBuffer);
    
    // Configurar abort controller
    this.abortController = new AbortController();
    
    this.emit('streamingPrepared', {
      fileSize,
      chunksTotal: this.state.chunksTotal,
      estimatedChunkSize: this.state.currentChunkSize
    });
  }

  /**
   * Cálculo de chunking inicial
   */
  private async calculateInitialChunking(arrayBuffer: ArrayBuffer): Promise<void> {
    const fileSize = arrayBuffer.byteLength;
    
    // Ajustar chunk size baseado no tamanho do arquivo e memória disponível
    const availableMemory = this.getAvailableMemory();
    const optimalChunkSize = Math.min(
      Math.max(
        Math.floor(availableMemory * this.config.memoryThreshold / this.config.concurrentChunks),
        this.config.minChunkSize
      ),
      this.config.maxChunkSize
    );

    this.state.currentChunkSize = optimalChunkSize;
    this.state.chunksTotal = Math.ceil(fileSize / optimalChunkSize);
    
    // Criar chunks
    await this.createChunks(arrayBuffer);
    
    this.log(`Chunking calculado: ${this.state.chunksTotal} chunks de ~${this.formatBytes(optimalChunkSize)}`);
  }

  /**
   * Criação de chunks
   */
  private async createChunks(arrayBuffer: ArrayBuffer): Promise<void> {
    const fileSize = arrayBuffer.byteLength;
    let offset = 0;
    let chunkIndex = 0;

    while (offset < fileSize) {
      const chunkSize = Math.min(this.state.currentChunkSize, fileSize - offset);
      const chunkData = arrayBuffer.slice(offset, offset + chunkSize);
      
      const chunkInfo: ChunkInfo = {
        id: `chunk_${chunkIndex}`,
        index: chunkIndex,
        offset,
        size: chunkSize,
        data: chunkData,
        retryCount: 0,
        dependencies: this.calculateChunkDependencies(chunkIndex),
        metadata: await this.extractChunkMetadata(chunkData, offset)
      };

      this.chunks.set(chunkInfo.id, chunkInfo);
      this.processingQueue.push(chunkInfo);
      
      offset += chunkSize;
      chunkIndex++;
    }
  }

  /**
   * Pipeline de streaming principal
   */
  private async executeStreamingPipeline(): Promise<PPTXStreamingResult> {
    this.log('Executando pipeline de streaming...');
    
    // Iniciar processamento paralelo
    const processingPromise = this.processChunksParallel();
    
    // Iniciar monitoramento
    const monitoringPromise = this.startProgressMonitoring();
    
    // Aguardar conclusão
    await Promise.all([processingPromise, monitoringPromise]);
    
    // Consolidar resultados
    return await this.consolidateResults();
  }

  /**
   * Processamento paralelo de chunks
   */
  private async processChunksParallel(): Promise<void> {
    while (this.processingQueue.length > 0 || this.processingPromises.size > 0) {
      // Verificar se pode iniciar novos processamentos
      if (this.canStartNewProcessing()) {
        await this.startNextChunkProcessing();
      }
      
      // Aguardar conclusão de pelo menos um chunk
      if (this.processingPromises.size > 0) {
        await this.waitForAnyChunkCompletion();
      }
      
      // Verificar backpressure
      if (this.config.enableBackpressureControl) {
        await this.checkBackpressure();
      }
      
      // Pequena pausa para não monopolizar o event loop
      await this.sleep(10);
    }
  }

  /**
   * Verificação se pode iniciar novo processamento
   */
  private canStartNewProcessing(): boolean {
    return this.processingQueue.length > 0 &&
           this.processingPromises.size < this.config.concurrentChunks &&
           !this.state.isPaused &&
           this.getMemoryPressure() < this.config.memoryThreshold;
  }

  /**
   * Iniciar processamento do próximo chunk
   */
  private async startNextChunkProcessing(): Promise<void> {
    const chunk = this.getNextProcessableChunk();
    if (!chunk) return;

    // Remover da queue
    const queueIndex = this.processingQueue.indexOf(chunk);
    if (queueIndex > -1) {
      this.processingQueue.splice(queueIndex, 1);
    }

    // Iniciar processamento
    chunk.processingStartTime = performance.now();
    this.state.chunksInProgress++;
    
    const processingPromise = this.processChunk(chunk);
    this.processingPromises.set(chunk.id, processingPromise);
    
    this.emit('chunkProcessingStarted', {
      chunkId: chunk.id,
      chunkIndex: chunk.index,
      chunkSize: chunk.size
    });
  }

  /**
   * Obter próximo chunk processável
   */
  private getNextProcessableChunk(): ChunkInfo | null {
    // Encontrar chunk sem dependências pendentes
    for (const chunk of this.processingQueue) {
      if (this.areDependenciesResolved(chunk)) {
        return chunk;
      }
    }
    return this.processingQueue[0] || null; // Fallback para processamento simples
  }

  /**
   * Verificar se dependências estão resolvidas
   */
  private areDependenciesResolved(chunk: ChunkInfo): boolean {
    return chunk.dependencies.every(depId => this.results.has(depId));
  }

  /**
   * Processamento individual de chunk
   */
  private async processChunk(chunk: ChunkInfo): Promise<ChunkProcessingResult> {
    const startTime = performance.now();
    
    try {
      performance.mark(`chunk-${chunk.id}-start`);
      
      // Processamento do chunk (simulado aqui, seria implementado com lógica real)
      const result = await this.executeChunkProcessing(chunk);
      
      performance.mark(`chunk-${chunk.id}-end`);
      performance.measure(
        `chunk-${chunk.id}-processing`,
        `chunk-${chunk.id}-start`,
        `chunk-${chunk.id}-end`
      );
      
      // Atualizar estado
      chunk.processingEndTime = performance.now();
      this.state.chunksInProgress--;
      this.state.chunksProcessed++;
      this.state.processedSize += chunk.size;
      
      // Armazenar resultado
      this.results.set(chunk.id, result);
      
      // Emitir progresso
      this.emitProgress();
      
      // Ajustar chunk size se necessário
      if (this.config.enableAdaptiveChunking) {
        this.adjustChunkSize(performance.now() - startTime, chunk.size);
      }
      
      this.emit('chunkProcessingCompleted', {
        chunkId: chunk.id,
        processingTime: performance.now() - startTime,
        result
      });
      
      return result;
      
    } catch (error) {
      return await this.handleChunkError(chunk, error as Error);
    }
  }

  /**
   * Execução do processamento do chunk
   */
  private async executeChunkProcessing(chunk: ChunkInfo): Promise<ChunkProcessingResult> {
    // Aqui seria implementada a lógica real de processamento do chunk PPTX
    // Por enquanto, simulamos o processamento
    
    await this.sleep(Math.random() * 1000 + 500); // Simula processamento variável
    
    return {
      chunkId: chunk.id,
      success: true,
      data: {
        extractedText: `Texto extraído do chunk ${chunk.index}`,
        extractedImages: [],
        metadata: chunk.metadata
      },
      processingTime: performance.now() - (chunk.processingStartTime || 0),
      memoryUsed: this.estimateChunkMemoryUsage(chunk.size),
      errors: []
    };
  }

  /**
   * Tratamento de erro de chunk
   */
  private async handleChunkError(chunk: ChunkInfo, error: Error): Promise<ChunkProcessingResult> {
    chunk.retryCount++;
    this.state.chunksInProgress--;
    this.state.chunksFailed++;
    
    this.log(`Erro no chunk ${chunk.id}: ${error.message} (tentativa ${chunk.retryCount})`);
    
    if (chunk.retryCount <= this.config.retryAttempts) {
      // Reagendar para retry
      await this.sleep(this.config.retryDelay * chunk.retryCount);
      this.processingQueue.unshift(chunk); // Prioridade alta para retry
      this.state.chunksFailed--;
      
      this.emit('chunkRetry', {
        chunkId: chunk.id,
        retryCount: chunk.retryCount,
        error: error.message
      });
    }
    
    const errorResult: ChunkProcessingResult = {
      chunkId: chunk.id,
      success: false,
      data: null,
      processingTime: performance.now() - (chunk.processingStartTime || 0),
      memoryUsed: 0,
      errors: [error.message]
    };
    
    if (chunk.retryCount > this.config.retryAttempts) {
      this.results.set(chunk.id, errorResult);
      
      this.emit('chunkProcessingFailed', {
        chunkId: chunk.id,
        error: error.message,
        finalAttempt: true
      });
    }
    
    return errorResult;
  }

  /**
   * Aguardar conclusão de qualquer chunk
   */
  private async waitForAnyChunkCompletion(): Promise<void> {
    if (this.processingPromises.size === 0) return;
    
    const promises = Array.from(this.processingPromises.entries());
    const [completedChunkId] = await Promise.race(
      promises.map(async ([id, promise]) => {
        await promise;
        return [id, promise];
      })
    );
    
    this.processingPromises.delete(completedChunkId);
  }

  /**
   * Verificação de backpressure
   */
  private async checkBackpressure(): Promise<void> {
    const memoryPressure = this.getMemoryPressure();
    
    if (memoryPressure > this.config.memoryThreshold) {
      this.metrics.backpressureEvents++;
      
      this.emit('backpressureDetected', {
        memoryPressure,
        threshold: this.config.memoryThreshold
      });
      
      // Pausar processamento temporariamente
      this.state.isPaused = true;
      await this.waitForMemoryRelief();
      this.state.isPaused = false;
    }
  }

  /**
   * Aguardar alívio de memória
   */
  private async waitForMemoryRelief(): Promise<void> {
    while (this.getMemoryPressure() > this.config.memoryThreshold * 0.8) {
      await this.sleep(1000);
      
      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Ajuste adaptativo do chunk size
   */
  private adjustChunkSize(processingTime: number, chunkSize: number): void {
    const targetProcessingTime = 2000; // 2 segundos ideal
    const adjustment = targetProcessingTime / processingTime;
    
    let newChunkSize = Math.round(chunkSize * adjustment);
    newChunkSize = Math.max(this.config.minChunkSize, newChunkSize);
    newChunkSize = Math.min(this.config.maxChunkSize, newChunkSize);
    
    if (Math.abs(newChunkSize - this.state.currentChunkSize) > this.state.currentChunkSize * 0.1) {
      this.state.currentChunkSize = newChunkSize;
      this.metrics.adaptiveChunkAdjustments++;
      this.metrics.chunkSizeHistory.push({
        timestamp: Date.now(),
        size: newChunkSize,
        reason: 'performance_adjustment'
      });
      
      this.log(`Chunk size ajustado para ${this.formatBytes(newChunkSize)}`);
    }
  }

  /**
   * Monitoramento de progresso
   */
  private async startProgressMonitoring(): Promise<void> {
    while (!this.state.isComplete) {
      await this.sleep(1000); // Atualizar a cada segundo
      
      if (this.config.enableProgressTracking) {
        this.updateProgressMetrics();
        this.emitProgress();
      }
    }
  }

  /**
   * Atualização de métricas de progresso
   */
  private updateProgressMetrics(): void {
    const now = Date.now();
    const timeElapsed = now - this.state.lastProgressUpdate;
    
    if (timeElapsed > 0) {
      const bytesProcessedRecently = this.state.processedSize;
      this.state.throughput = (bytesProcessedRecently / timeElapsed) * 1000; // bytes/sec
      
      // Calcular tempo estimado
      const remainingBytes = this.state.totalSize - this.state.processedSize;
      this.state.estimatedTimeRemaining = remainingBytes / Math.max(this.state.throughput, 1);
      
      // Atualizar taxa de erro
      this.state.errorRate = this.state.chunksFailed / Math.max(this.state.chunksTotal, 1);
      
      this.metrics.throughputHistory.push({
        timestamp: now,
        value: this.state.throughput
      });
      
      // Manter apenas últimos 100 pontos
      if (this.metrics.throughputHistory.length > 100) {
        this.metrics.throughputHistory.shift();
      }
    }
  }

  /**
   * Emissão de progresso
   */
  private emitProgress(): void {
    const progressInfo: StreamingProgressInfo = {
      totalSize: this.state.totalSize,
      processedSize: this.state.processedSize,
      percentage: (this.state.processedSize / this.state.totalSize) * 100,
      chunksTotal: this.state.chunksTotal,
      chunksProcessed: this.state.chunksProcessed,
      chunksInProgress: this.state.chunksInProgress,
      chunksFailed: this.state.chunksFailed,
      throughput: this.state.throughput,
      estimatedTimeRemaining: this.state.estimatedTimeRemaining,
      currentChunkSize: this.state.currentChunkSize,
      memoryUsage: this.getMemoryPressure()
    };
    
    this.emit('progress', progressInfo);
  }

  /**
   * Consolidação de resultados
   */
  private async consolidateResults(): Promise<PPTXStreamingResult> {
    this.log('Consolidando resultados...');
    
    const successfulResults = Array.from(this.results.values()).filter(r => r.success);
    const failedResults = Array.from(this.results.values()).filter(r => !r.success);
    
    // Consolidar dados extraídos
    const consolidatedData = {
      extractedText: successfulResults.map(r => r.data?.extractedText).filter(Boolean).join('\n'),
      extractedImages: successfulResults.flatMap(r => r.data?.extractedImages || []),
      metadata: this.consolidateMetadata(successfulResults),
      processingStatistics: this.generateProcessingStatistics()
    };
    
    this.state.isComplete = true;
    
    const result: PPTXStreamingResult = {
      success: failedResults.length === 0,
      data: consolidatedData,
      metrics: this.metrics,
      processingInfo: {
        totalChunks: this.state.chunksTotal,
        successfulChunks: successfulResults.length,
        failedChunks: failedResults.length,
        totalProcessingTime: this.getTotalProcessingTime(),
        averageChunkSize: this.getAverageChunkSize(),
        peakThroughput: this.getPeakThroughput()
      },
      errors: failedResults.flatMap(r => r.errors)
    };
    
    this.emit('streamingCompleted', result);
    return result;
  }

  /**
   * Utilitários de cálculo
   */
  private getMemoryPressure(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
    return 0.5; // Valor padrão conservador
  }

  private getAvailableMemory(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize;
    }
    return 100 * 1024 * 1024; // 100MB default
  }

  private estimateChunkMemoryUsage(chunkSize: number): number {
    return chunkSize * 2.5; // Estimativa de overhead de processamento
  }

  private calculateChunkDependencies(chunkIndex: number): string[] {
    // Para arquivos PPTX, alguns chunks podem depender de outros
    // Por exemplo, slides podem depender de master slides
    if (chunkIndex === 0) return []; // Primeiro chunk não tem dependências
    if (chunkIndex % 10 === 0) return [`chunk_0`]; // A cada 10 chunks, depende do primeiro
    return [];
  }

  private async extractChunkMetadata(data: ArrayBuffer, offset: number): Promise<Record<string, any>> {
    // Extração de metadados específicos do chunk
    return {
      offset,
      size: data.byteLength,
      timestamp: Date.now(),
      checksum: this.calculateChecksum(data)
    };
  }

  private calculateChecksum(data: ArrayBuffer): string {
    // Checksum simples para validação de integridade
    const view = new Uint8Array(data);
    let checksum = 0;
    for (let i = 0; i < view.length; i += 100) { // Sample every 100 bytes
      checksum += view[i];
    }
    return checksum.toString(16);
  }

  private consolidateMetadata(results: ChunkProcessingResult[]): Record<string, any> {
    return {
      totalChunks: results.length,
      totalSize: this.state.totalSize,
      processingStartTime: this.state.lastProgressUpdate,
      processingEndTime: Date.now()
    };
  }

  private generateProcessingStatistics(): Record<string, any> {
    return {
      averageChunkProcessingTime: this.metrics.averageChunkProcessingTime,
      peakMemoryUsage: this.metrics.peakMemoryUsage,
      adaptiveChunkAdjustments: this.metrics.adaptiveChunkAdjustments,
      backpressureEvents: this.metrics.backpressureEvents,
      throughputHistory: this.metrics.throughputHistory
    };
  }

  private getTotalProcessingTime(): number {
    return Date.now() - this.state.lastProgressUpdate;
  }

  private getAverageChunkSize(): number {
    const chunks = Array.from(this.chunks.values());
    return chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length;
  }

  private getPeakThroughput(): number {
    return Math.max(...this.metrics.throughputHistory.map(h => h.value), 0);
  }

  private handlePerformanceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.name.includes('chunk') && entry.name.includes('processing')) {
        this.metrics.averageChunkProcessingTime = 
          (this.metrics.averageChunkProcessingTime + entry.duration) / 2;
      }
    });
  }

  private getFileInfo(file: File | ArrayBuffer): string {
    if (file instanceof File) {
      return `${file.name} (${this.formatBytes(file.size)})`;
    } else {
      return `ArrayBuffer (${this.formatBytes(file.byteLength)})`;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(message: string): void {
    console.log(`[PPTXStreaming] ${message}`);
  }

  /**
   * Limpeza de recursos
   */
  private async cleanup(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.chunks.clear();
    this.processingQueue.length = 0;
    this.results.clear();
    this.processingPromises.clear();
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.log('Limpeza de recursos concluída');
  }

  /**
   * API pública: Pausar processamento
   */
  public pause(): void {
    this.state.isPaused = true;
    this.emit('streamingPaused');
  }

  /**
   * API pública: Resumir processamento
   */
  public resume(): void {
    this.state.isPaused = false;
    this.emit('streamingResumed');
  }

  /**
   * API pública: Cancelar processamento
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.emit('streamingCancelled');
  }

  /**
   * API pública: Obter métricas atuais
   */
  public getCurrentMetrics(): StreamingMetrics {
    return { ...this.metrics };
  }

  /**
   * API pública: Obter estado atual
   */
  public getCurrentState(): StreamingProcessingState {
    return { ...this.state };
  }
}

/**
 * Factory function para criar instância de streaming
 */
export function createPPTXStreamingSystem(
  options?: Partial<PPTXStreamingOptions>
): PPTXStreamingSystem {
  return new PPTXStreamingSystem(options);
}

/**
 * API simplificada para streaming
 */
export async function streamProcessPPTXFile(
  file: File | ArrayBuffer,
  options?: Partial<PPTXStreamingOptions>
): Promise<PPTXStreamingResult> {
  const streamingSystem = createPPTXStreamingSystem(options);
  return await streamingSystem.processFileStream(file, options);
}

export default PPTXStreamingSystem;