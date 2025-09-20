import { create } from 'zustand';

export interface WorkerTask {
  id: string;
  type: 'video_processing' | 'audio_processing' | 'image_processing' | 'encoding' | 'analysis' | 'effects';
  data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  workerId?: string;
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface WorkerInfo {
  id: string;
  type: 'video' | 'audio' | 'image' | 'general';
  status: 'idle' | 'busy' | 'error';
  currentTask?: WorkerTask;
  tasksCompleted: number;
  totalProcessingTime: number;
  averageTaskTime: number;
  lastActivity: number;
  capabilities: string[];
}

export interface WorkerPool {
  workers: WorkerInfo[];
  maxWorkers: number;
  activeWorkers: number;
  queuedTasks: WorkerTask[];
  completedTasks: WorkerTask[];
  failedTasks: WorkerTask[];
  totalTasks: number;
  averageWaitTime: number;
  throughput: number;
}

export interface WebWorkerState {
  pool: WorkerPool;
  isInitialized: boolean;
  supportedFeatures: string[];
  performanceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    taskThroughput: number;
    averageResponseTime: number;
  };
  
  // Actions
  initializeWorkers: () => Promise<void>;
  addTask: (task: Omit<WorkerTask, 'id' | 'status' | 'progress'>) => string;
  cancelTask: (taskId: string) => void;
  getTaskStatus: (taskId: string) => WorkerTask | null;
  getWorkerStats: () => WorkerPool;
  optimizeWorkerCount: () => void;
  terminateWorkers: () => void;
  processVideoChunk: (chunk: ArrayBuffer, options: any) => Promise<ArrayBuffer>;
  processAudioChunk: (chunk: ArrayBuffer, options: any) => Promise<ArrayBuffer>;
  applyImageFilter: (imageData: ImageData, filter: string, params: any) => Promise<ImageData>;
  analyzeVideoFrame: (frameData: ImageData) => Promise<any>;
  encodeVideo: (frames: ImageData[], options: any) => Promise<ArrayBuffer>;
}

class WebWorkerService {
  private workers: Map<string, Worker> = new Map();
  private workerScripts: Map<string, string> = new Map();
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private maxWorkers: number;
  private workerIndex = 0;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.maxWorkers = Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 8));
    this.performanceMonitor = new PerformanceMonitor();
    this.initializeWorkerScripts();
  }

  private initializeWorkerScripts() {
    // Video processing worker script
    const videoWorkerScript = `
      importScripts('https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js');
      
      let ffmpeg;
      
      self.onmessage = async function(e) {
        const { taskId, type, data } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'video_processing':
              result = await processVideo(data);
              break;
            case 'encoding':
              result = await encodeVideo(data);
              break;
            case 'analysis':
              result = await analyzeVideo(data);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({
            taskId,
            status: 'completed',
            result,
            progress: 100
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            status: 'failed',
            error: error.message,
            progress: 0
          });
        }
      };
      
      async function processVideo(data) {
        const { chunk, options } = data;
        
        // Initialize FFmpeg if not already done
        if (!ffmpeg) {
          ffmpeg = new FFmpeg();
          await ffmpeg.load();
        }
        
        // Process video chunk
        const inputName = 'input.mp4';
        const outputName = 'output.mp4';
        
        await ffmpeg.writeFile(inputName, new Uint8Array(chunk));
        
        // Build FFmpeg command based on options
        const command = buildProcessingCommand(inputName, outputName, options);
        await ffmpeg.exec(command);
        
        const output = await ffmpeg.readFile(outputName);
        return output.buffer;
      }
      
      async function encodeVideo(data) {
        const { frames, options } = data;
        
        // Encode frames to video
        // This is a simplified implementation
        return new ArrayBuffer(0);
      }
      
      async function analyzeVideo(data) {
        const { frameData } = data;
        
        // Analyze video frame for motion, objects, etc.
        return {
          motion: detectMotion(frameData),
          objects: detectObjects(frameData),
          brightness: calculateBrightness(frameData),
          contrast: calculateContrast(frameData)
        };
      }
      
      function buildProcessingCommand(input, output, options) {
        const command = ['-i', input];
        
        if (options.resize) {
          command.push('-vf', \`scale=\${options.resize.width}:\${options.resize.height}\`);
        }
        
        if (options.filter) {
          command.push('-vf', options.filter);
        }
        
        if (options.codec) {
          command.push('-c:v', options.codec);
        }
        
        command.push('-y', output);
        return command;
      }
      
      function detectMotion(frameData) {
        // Simple motion detection algorithm
        return Math.random() * 100; // Placeholder
      }
      
      function detectObjects(frameData) {
        // Object detection placeholder
        return [];
      }
      
      function calculateBrightness(frameData) {
        const data = frameData.data;
        let sum = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        
        return sum / (data.length / 4);
      }
      
      function calculateContrast(frameData) {
        const data = frameData.data;
        const brightness = calculateBrightness(frameData);
        let variance = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const pixelBrightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          variance += Math.pow(pixelBrightness - brightness, 2);
        }
        
        return Math.sqrt(variance / (data.length / 4));
      }
    `;

    // Audio processing worker script
    const audioWorkerScript = `
      self.onmessage = async function(e) {
        const { taskId, type, data } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'audio_processing':
              result = await processAudio(data);
              break;
            case 'analysis':
              result = await analyzeAudio(data);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({
            taskId,
            status: 'completed',
            result,
            progress: 100
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            status: 'failed',
            error: error.message,
            progress: 0
          });
        }
      };
      
      async function processAudio(data) {
        const { chunk, options } = data;
        
        // Process audio chunk
        const audioBuffer = new Float32Array(chunk);
        
        if (options.normalize) {
          normalizeAudio(audioBuffer);
        }
        
        if (options.filter) {
          applyAudioFilter(audioBuffer, options.filter);
        }
        
        return audioBuffer.buffer;
      }
      
      async function analyzeAudio(data) {
        const { chunk } = data;
        const audioBuffer = new Float32Array(chunk);
        
        return {
          volume: calculateVolume(audioBuffer),
          frequency: analyzeFrequency(audioBuffer),
          silence: detectSilence(audioBuffer)
        };
      }
      
      function normalizeAudio(buffer) {
        let max = 0;
        for (let i = 0; i < buffer.length; i++) {
          max = Math.max(max, Math.abs(buffer[i]));
        }
        
        if (max > 0) {
          const scale = 1.0 / max;
          for (let i = 0; i < buffer.length; i++) {
            buffer[i] *= scale;
          }
        }
      }
      
      function applyAudioFilter(buffer, filter) {
        // Apply audio filter (placeholder)
        switch (filter.type) {
          case 'lowpass':
            // Low-pass filter implementation
            break;
          case 'highpass':
            // High-pass filter implementation
            break;
        }
      }
      
      function calculateVolume(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
      }
      
      function analyzeFrequency(buffer) {
        // FFT analysis placeholder
        return [];
      }
      
      function detectSilence(buffer, threshold = 0.01) {
        const volume = calculateVolume(buffer);
        return volume < threshold;
      }
    `;

    // Image processing worker script
    const imageWorkerScript = `
      self.onmessage = async function(e) {
        const { taskId, type, data } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'image_processing':
              result = await processImage(data);
              break;
            case 'effects':
              result = await applyImageEffect(data);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({
            taskId,
            status: 'completed',
            result,
            progress: 100
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            status: 'failed',
            error: error.message,
            progress: 0
          });
        }
      };
      
      async function processImage(data) {
        const { imageData, options } = data;
        
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext('2d');
        
        ctx.putImageData(imageData, 0, 0);
        
        if (options.resize) {
          const resizedCanvas = new OffscreenCanvas(options.resize.width, options.resize.height);
          const resizedCtx = resizedCanvas.getContext('2d');
          resizedCtx.drawImage(canvas, 0, 0, options.resize.width, options.resize.height);
          return resizedCtx.getImageData(0, 0, options.resize.width, options.resize.height);
        }
        
        return imageData;
      }
      
      async function applyImageEffect(data) {
        const { imageData, filter, params } = data;
        const pixels = imageData.data;
        
        switch (filter) {
          case 'brightness':
            applyBrightness(pixels, params.value);
            break;
          case 'contrast':
            applyContrast(pixels, params.value);
            break;
          case 'saturation':
            applySaturation(pixels, params.value);
            break;
          case 'blur':
            applyBlur(imageData, params.radius);
            break;
          case 'sharpen':
            applySharpen(imageData);
            break;
        }
        
        return imageData;
      }
      
      function applyBrightness(pixels, value) {
        for (let i = 0; i < pixels.length; i += 4) {
          pixels[i] = Math.min(255, Math.max(0, pixels[i] + value));
          pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + value));
          pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + value));
        }
      }
      
      function applyContrast(pixels, value) {
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < pixels.length; i += 4) {
          pixels[i] = Math.min(255, Math.max(0, factor * (pixels[i] - 128) + 128));
          pixels[i + 1] = Math.min(255, Math.max(0, factor * (pixels[i + 1] - 128) + 128));
          pixels[i + 2] = Math.min(255, Math.max(0, factor * (pixels[i + 2] - 128) + 128));
        }
      }
      
      function applySaturation(pixels, value) {
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          
          pixels[i] = Math.min(255, Math.max(0, gray + value * (pixels[i] - gray)));
          pixels[i + 1] = Math.min(255, Math.max(0, gray + value * (pixels[i + 1] - gray)));
          pixels[i + 2] = Math.min(255, Math.max(0, gray + value * (pixels[i + 2] - gray)));
        }
      }
      
      function applyBlur(imageData, radius) {
        // Simple box blur implementation
        const { width, height, data } = imageData;
        const output = new Uint8ClampedArray(data);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, count = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const idx = (ny * width + nx) * 4;
                  r += data[idx];
                  g += data[idx + 1];
                  b += data[idx + 2];
                  count++;
                }
              }
            }
            
            const idx = (y * width + x) * 4;
            output[idx] = r / count;
            output[idx + 1] = g / count;
            output[idx + 2] = b / count;
          }
        }
        
        data.set(output);
      }
      
      function applySharpen(imageData) {
        const { width, height, data } = imageData;
        const output = new Uint8ClampedArray(data);
        
        const kernel = [
          0, -1, 0,
          -1, 5, -1,
          0, -1, 0
        ];
        
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            let r = 0, g = 0, b = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4;
                const weight = kernel[(ky + 1) * 3 + (kx + 1)];
                
                r += data[idx] * weight;
                g += data[idx + 1] * weight;
                b += data[idx + 2] * weight;
              }
            }
            
            const idx = (y * width + x) * 4;
            output[idx] = Math.min(255, Math.max(0, r));
            output[idx + 1] = Math.min(255, Math.max(0, g));
            output[idx + 2] = Math.min(255, Math.max(0, b));
          }
        }
        
        data.set(output);
      }
    `;

    this.workerScripts.set('video', videoWorkerScript);
    this.workerScripts.set('audio', audioWorkerScript);
    this.workerScripts.set('image', imageWorkerScript);
  }

  async initializeWorkers(): Promise<void> {
    const workerTypes = ['video', 'audio', 'image'];
    const workersPerType = Math.ceil(this.maxWorkers / workerTypes.length);

    for (const type of workerTypes) {
      for (let i = 0; i < workersPerType; i++) {
        await this.createWorker(type);
      }
    }

    useWebWorker.setState({ isInitialized: true });
    this.performanceMonitor.start();
  }

  private async createWorker(type: string): Promise<string> {
    const workerId = `${type}-${this.workerIndex++}`;
    const script = this.workerScripts.get(type);
    
    if (!script) {
      throw new Error(`No script found for worker type: ${type}`);
    }

    const blob = new Blob([script], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => this.handleWorkerMessage(workerId, e.data);
    worker.onerror = (error) => this.handleWorkerError(workerId, error);

    this.workers.set(workerId, worker);

    const workerInfo: WorkerInfo = {
      id: workerId,
      type: type as any,
      status: 'idle',
      tasksCompleted: 0,
      totalProcessingTime: 0,
      averageTaskTime: 0,
      lastActivity: Date.now(),
      capabilities: this.getWorkerCapabilities(type)
    };

    useWebWorker.setState(state => ({
      pool: {
        ...state.pool,
        workers: [...state.pool.workers, workerInfo],
        activeWorkers: state.pool.activeWorkers + 1
      }
    }));

    return workerId;
  }

  private getWorkerCapabilities(type: string): string[] {
    switch (type) {
      case 'video':
        return ['video_processing', 'encoding', 'analysis', 'effects'];
      case 'audio':
        return ['audio_processing', 'analysis'];
      case 'image':
        return ['image_processing', 'effects'];
      default:
        return [];
    }
  }

  private handleWorkerMessage(workerId: string, data: any) {
    const { taskId, status, result, error, progress } = data;
    const task = this.activeTasks.get(taskId);
    
    if (!task) return;

    task.status = status;
    task.progress = progress || 0;
    
    if (status === 'completed') {
      task.result = result;
      task.endTime = Date.now();
      task.actualDuration = task.endTime - (task.startTime || task.endTime);
      
      this.activeTasks.delete(taskId);
      this.updateWorkerStats(workerId, task);
      
      useWebWorker.setState(state => ({
        pool: {
          ...state.pool,
          completedTasks: [...state.pool.completedTasks, task]
        }
      }));
      
    } else if (status === 'failed') {
      task.error = error;
      task.endTime = Date.now();
      
      this.activeTasks.delete(taskId);
      
      useWebWorker.setState(state => ({
        pool: {
          ...state.pool,
          failedTasks: [...state.pool.failedTasks, task]
        }
      }));
    }
    
    // Process next task in queue
    this.processNextTask();
  }

  private handleWorkerError(workerId: string, error: ErrorEvent) {
    console.error(`Worker ${workerId} error:`, error);
    
    useWebWorker.setState(state => ({
      pool: {
        ...state.pool,
        workers: state.pool.workers.map(w => 
          w.id === workerId ? { ...w, status: 'error' } : w
        )
      }
    }));
  }

  private updateWorkerStats(workerId: string, task: WorkerTask) {
    useWebWorker.setState(state => ({
      pool: {
        ...state.pool,
        workers: state.pool.workers.map(w => {
          if (w.id === workerId) {
            const newTasksCompleted = w.tasksCompleted + 1;
            const newTotalTime = w.totalProcessingTime + (task.actualDuration || 0);
            
            return {
              ...w,
              status: 'idle',
              currentTask: undefined,
              tasksCompleted: newTasksCompleted,
              totalProcessingTime: newTotalTime,
              averageTaskTime: newTotalTime / newTasksCompleted,
              lastActivity: Date.now()
            };
          }
          return w;
        })
      }
    }));
  }

  addTask(taskData: Omit<WorkerTask, 'id' | 'status' | 'progress'>): string {
    const task: WorkerTask = {
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    };

    this.taskQueue.push(task);
    
    useWebWorker.setState(state => ({
      pool: {
        ...state.pool,
        queuedTasks: [...state.pool.queuedTasks, task],
        totalTasks: state.pool.totalTasks + 1
      }
    }));

    this.processNextTask();
    return task.id;
  }

  private processNextTask() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.findAvailableWorker();
    if (!availableWorker) return;

    const task = this.taskQueue.shift()!;
    task.status = 'processing';
    task.startTime = Date.now();
    task.workerId = availableWorker.id;

    this.activeTasks.set(task.id, task);

    const worker = this.workers.get(availableWorker.id);
    if (worker) {
      worker.postMessage({
        taskId: task.id,
        type: task.type,
        data: task.data
      });
    }

    useWebWorker.setState(state => ({
      pool: {
        ...state.pool,
        queuedTasks: state.pool.queuedTasks.filter(t => t.id !== task.id),
        workers: state.pool.workers.map(w => 
          w.id === availableWorker.id 
            ? { ...w, status: 'busy', currentTask: task }
            : w
        )
      }
    }));
  }

  private findAvailableWorker(): WorkerInfo | null {
    const { pool } = useWebWorker.getState();
    
    return pool.workers.find(worker => 
      worker.status === 'idle' && 
      worker.capabilities.includes(this.taskQueue[0]?.type)
    ) || null;
  }

  cancelTask(taskId: string): void {
    const task = this.activeTasks.get(taskId) || 
                 this.taskQueue.find(t => t.id === taskId);
    
    if (!task) return;

    task.status = 'cancelled';
    
    if (this.activeTasks.has(taskId)) {
      this.activeTasks.delete(taskId);
      
      // Free up the worker
      if (task.workerId) {
        useWebWorker.setState(state => ({
          pool: {
            ...state.pool,
            workers: state.pool.workers.map(w => 
              w.id === task.workerId 
                ? { ...w, status: 'idle', currentTask: undefined }
                : w
            )
          }
        }));
      }
    } else {
      // Remove from queue
      const index = this.taskQueue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.taskQueue.splice(index, 1);
      }
    }

    useWebWorker.setState(state => ({
      pool: {
        ...state.pool,
        queuedTasks: state.pool.queuedTasks.filter(t => t.id !== taskId)
      }
    }));
  }

  getTaskStatus(taskId: string): WorkerTask | null {
    return this.activeTasks.get(taskId) || 
           this.taskQueue.find(t => t.id === taskId) || 
           null;
  }

  optimizeWorkerCount(): void {
    const { pool } = useWebWorker.getState();
    const queueLength = pool.queuedTasks.length;
    const activeWorkers = pool.workers.filter(w => w.status === 'busy').length;
    const idleWorkers = pool.workers.filter(w => w.status === 'idle').length;

    // Add workers if queue is backing up
    if (queueLength > activeWorkers * 2 && pool.workers.length < this.maxWorkers) {
      this.createWorker('general');
    }
    
    // Remove idle workers if not needed
    if (idleWorkers > 2 && queueLength === 0) {
      const workerToRemove = pool.workers.find(w => w.status === 'idle');
      if (workerToRemove) {
        this.terminateWorker(workerToRemove.id);
      }
    }
  }

  private terminateWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
    }

    useWebWorker.setState(state => ({
      pool: {
        ...state.pool,
        workers: state.pool.workers.filter(w => w.id !== workerId),
        activeWorkers: state.pool.activeWorkers - 1
      }
    }));
  }

  terminateWorkers(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.taskQueue = [];
    this.activeTasks.clear();
    this.performanceMonitor.stop();

    useWebWorker.setState({
      pool: {
        workers: [],
        maxWorkers: this.maxWorkers,
        activeWorkers: 0,
        queuedTasks: [],
        completedTasks: [],
        failedTasks: [],
        totalTasks: 0,
        averageWaitTime: 0,
        throughput: 0
      },
      isInitialized: false
    });
  }

  // High-level processing methods
  async processVideoChunk(chunk: ArrayBuffer, options: any): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const taskId = this.addTask({
        type: 'video_processing',
        data: { chunk, options },
        priority: 'normal'
      });

      const checkStatus = () => {
        const task = this.getTaskStatus(taskId);
        if (!task) {
          reject(new Error('Task not found'));
          return;
        }

        if (task.status === 'completed') {
          resolve(task.result);
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Processing failed'));
        } else {
          setTimeout(checkStatus, 100);
        }
      };

      checkStatus();
    });
  }

  async processAudioChunk(chunk: ArrayBuffer, options: any): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const taskId = this.addTask({
        type: 'audio_processing',
        data: { chunk, options },
        priority: 'normal'
      });

      const checkStatus = () => {
        const task = this.getTaskStatus(taskId);
        if (!task) {
          reject(new Error('Task not found'));
          return;
        }

        if (task.status === 'completed') {
          resolve(task.result);
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Processing failed'));
        } else {
          setTimeout(checkStatus, 100);
        }
      };

      checkStatus();
    });
  }

  async applyImageFilter(imageData: ImageData, filter: string, params: any): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const taskId = this.addTask({
        type: 'effects',
        data: { imageData, filter, params },
        priority: 'normal'
      });

      const checkStatus = () => {
        const task = this.getTaskStatus(taskId);
        if (!task) {
          reject(new Error('Task not found'));
          return;
        }

        if (task.status === 'completed') {
          resolve(task.result);
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Processing failed'));
        } else {
          setTimeout(checkStatus, 100);
        }
      };

      checkStatus();
    });
  }

  async analyzeVideoFrame(frameData: ImageData): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = this.addTask({
        type: 'analysis',
        data: { frameData },
        priority: 'low'
      });

      const checkStatus = () => {
        const task = this.getTaskStatus(taskId);
        if (!task) {
          reject(new Error('Task not found'));
          return;
        }

        if (task.status === 'completed') {
          resolve(task.result);
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Analysis failed'));
        } else {
          setTimeout(checkStatus, 100);
        }
      };

      checkStatus();
    });
  }

  async encodeVideo(frames: ImageData[], options: any): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const taskId = this.addTask({
        type: 'encoding',
        data: { frames, options },
        priority: 'high'
      });

      const checkStatus = () => {
        const task = this.getTaskStatus(taskId);
        if (!task) {
          reject(new Error('Task not found'));
          return;
        }

        if (task.status === 'completed') {
          resolve(task.result);
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Encoding failed'));
        } else {
          setTimeout(checkStatus, 100);
        }
      };

      checkStatus();
    });
  }
}

class PerformanceMonitor {
  private interval: number | null = null;
  private startTime = 0;
  private taskCount = 0;

  start() {
    this.startTime = Date.now();
    this.interval = window.setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private updateMetrics() {
    const { pool } = useWebWorker.getState();
    const runtime = (Date.now() - this.startTime) / 1000;
    const throughput = pool.completedTasks.length / runtime;
    
    const averageResponseTime = pool.completedTasks.reduce((sum, task) => 
      sum + (task.actualDuration || 0), 0
    ) / Math.max(1, pool.completedTasks.length);

    useWebWorker.setState(state => ({
      performanceMetrics: {
        cpuUsage: this.estimateCpuUsage(),
        memoryUsage: this.estimateMemoryUsage(),
        taskThroughput: throughput,
        averageResponseTime
      }
    }));
  }

  private estimateCpuUsage(): number {
    const { pool } = useWebWorker.getState();
    const busyWorkers = pool.workers.filter(w => w.status === 'busy').length;
    return (busyWorkers / Math.max(1, pool.workers.length)) * 100;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on active tasks and worker count
    const { pool } = useWebWorker.getState();
    const baseMemory = pool.workers.length * 10; // 10MB per worker
    const taskMemory = pool.queuedTasks.length * 5; // 5MB per queued task
    return baseMemory + taskMemory;
  }
}

// Create singleton instance
const webWorkerService = new WebWorkerService();

// Zustand store for web worker state
export const useWebWorker = create<WebWorkerState>((set, get) => ({
  pool: {
    workers: [],
    maxWorkers: Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 8)),
    activeWorkers: 0,
    queuedTasks: [],
    completedTasks: [],
    failedTasks: [],
    totalTasks: 0,
    averageWaitTime: 0,
    throughput: 0
  },
  isInitialized: false,
  supportedFeatures: [
    'video_processing',
    'audio_processing', 
    'image_processing',
    'encoding',
    'analysis',
    'effects'
  ],
  performanceMetrics: {
    cpuUsage: 0,
    memoryUsage: 0,
    taskThroughput: 0,
    averageResponseTime: 0
  },

  initializeWorkers: () => webWorkerService.initializeWorkers(),
  addTask: (task) => webWorkerService.addTask(task),
  cancelTask: (taskId) => webWorkerService.cancelTask(taskId),
  getTaskStatus: (taskId) => webWorkerService.getTaskStatus(taskId),
  getWorkerStats: () => get().pool,
  optimizeWorkerCount: () => webWorkerService.optimizeWorkerCount(),
  terminateWorkers: () => webWorkerService.terminateWorkers(),
  processVideoChunk: (chunk, options) => webWorkerService.processVideoChunk(chunk, options),
  processAudioChunk: (chunk, options) => webWorkerService.processAudioChunk(chunk, options),
  applyImageFilter: (imageData, filter, params) => webWorkerService.applyImageFilter(imageData, filter, params),
  analyzeVideoFrame: (frameData) => webWorkerService.analyzeVideoFrame(frameData),
  encodeVideo: (frames, options) => webWorkerService.encodeVideo(frames, options)
}));

export default webWorkerService;