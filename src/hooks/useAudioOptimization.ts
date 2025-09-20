import { useCallback, useMemo, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';

interface AudioOptimizationConfig {
  bufferSize?: number;
  sampleRate?: number;
  channels?: number;
  processingInterval?: number;
  enableWebWorker?: boolean;
}

interface AudioProcessingResult {
  processedBuffer: AudioBuffer | null;
  processingTime: number;
  cpuUsage: number;
}

export const useAudioOptimization = (config: AudioOptimizationConfig = {}) => {
  const {
    bufferSize = 4096,
    sampleRate = 44100,
    channels = 2,
    processingInterval = 16, // ~60fps
    enableWebWorker = true
  } = config;

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const processingQueueRef = useRef<AudioBuffer[]>([]);
  const performanceMetricsRef = useRef({
    lastProcessingTime: 0,
    averageProcessingTime: 0,
    cpuUsage: 0,
    frameDrops: 0
  });

  // Initialize optimized audio context
  const initializeAudioContext = useCallback(async () => {
    if (audioContextRef.current) return audioContextRef.current;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({
        sampleRate,
        latencyHint: 'interactive'
      });

      // Load audio worklet for better performance
      if (enableWebWorker && audioContextRef.current.audioWorklet) {
        try {
          await audioContextRef.current.audioWorklet.addModule('/audio-processor-worklet.js');
          workletNodeRef.current = new AudioWorkletNode(
            audioContextRef.current,
            'audio-processor'
          );
        } catch (error) {
          console.warn('AudioWorklet not supported, falling back to ScriptProcessorNode');
        }
      }

      return audioContextRef.current;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return null;
    }
  }, [sampleRate, enableWebWorker]);

  // Optimized audio processing with batching
  const processAudioBatch = useCallback(async (
    audioBuffers: AudioBuffer[]
  ): Promise<AudioProcessingResult[]> => {
    const startTime = performance.now();
    const results: AudioProcessingResult[] = [];

    try {
      if (enableWebWorker && workerRef.current) {
        // Process in web worker for better performance
        const workerPromises = audioBuffers.map(buffer => 
          new Promise<AudioProcessingResult>((resolve) => {
            const transferableBuffer = {
              sampleRate: buffer.sampleRate,
              length: buffer.length,
              numberOfChannels: buffer.numberOfChannels,
              channelData: Array.from({ length: buffer.numberOfChannels }, (_, i) => 
                buffer.getChannelData(i)
              )
            };

            workerRef.current!.postMessage({ type: 'process', buffer: transferableBuffer });
            
            const handleMessage = (event: MessageEvent) => {
              if (event.data.type === 'processed') {
                workerRef.current!.removeEventListener('message', handleMessage);
                resolve({
                  processedBuffer: event.data.buffer,
                  processingTime: event.data.processingTime,
                  cpuUsage: event.data.cpuUsage
                });
              }
            };

            workerRef.current!.addEventListener('message', handleMessage);
          })
        );

        const workerResults = await Promise.all(workerPromises);
        results.push(...workerResults);
      } else {
        // Fallback to main thread processing with optimization
        for (const buffer of audioBuffers) {
          const processedBuffer = await processAudioBuffer(buffer);
          results.push({
            processedBuffer,
            processingTime: performance.now() - startTime,
            cpuUsage: calculateCpuUsage()
          });
        }
      }

      // Update performance metrics
      const totalProcessingTime = performance.now() - startTime;
      updatePerformanceMetrics(totalProcessingTime);

      return results;
    } catch (error) {
      console.error('Audio processing error:', error);
      return [];
    }
  }, [enableWebWorker]);

  // Optimized audio buffer processing
  const processAudioBuffer = useCallback(async (buffer: AudioBuffer): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current) return null;

    try {
      const processedBuffer = audioContextRef.current.createBuffer(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
      );

      // Process each channel with SIMD-like operations where possible
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const inputData = buffer.getChannelData(channel);
        const outputData = processedBuffer.getChannelData(channel);
        
        // Vectorized processing for better performance
        const blockSize = 128; // Process in blocks for cache efficiency
        for (let i = 0; i < inputData.length; i += blockSize) {
          const end = Math.min(i + blockSize, inputData.length);
          for (let j = i; j < end; j++) {
            // Apply optimized audio processing here
            outputData[j] = inputData[j]; // Placeholder for actual processing
          }
        }
      }

      return processedBuffer;
    } catch (error) {
      console.error('Buffer processing error:', error);
      return null;
    }
  }, []);

  // Debounced processing for real-time updates
  const debouncedProcess = useMemo(
    () => debounce(async (buffers: AudioBuffer[]) => {
      if (buffers.length === 0) return;
      
      // Add to processing queue
      processingQueueRef.current.push(...buffers);
      
      // Process queue in batches
      if (processingQueueRef.current.length >= 4) {
        const batchToProcess = processingQueueRef.current.splice(0, 4);
        await processAudioBatch(batchToProcess);
      }
    }, processingInterval),
    [processAudioBatch, processingInterval]
  );

  // Calculate CPU usage estimation
  const calculateCpuUsage = useCallback((): number => {
    const metrics = performanceMetricsRef.current;
    const targetFrameTime = 1000 / 60; // 60fps target
    return Math.min((metrics.averageProcessingTime / targetFrameTime) * 100, 100);
  }, []);

  // Update performance metrics
  const updatePerformanceMetrics = useCallback((processingTime: number) => {
    const metrics = performanceMetricsRef.current;
    metrics.lastProcessingTime = processingTime;
    metrics.averageProcessingTime = (metrics.averageProcessingTime * 0.9) + (processingTime * 0.1);
    metrics.cpuUsage = calculateCpuUsage();
    
    // Track frame drops
    if (processingTime > 16.67) { // More than 60fps
      metrics.frameDrops++;
    }
  }, [calculateCpuUsage]);

  // Initialize web worker for audio processing
  useEffect(() => {
    if (enableWebWorker && !workerRef.current) {
      try {
        workerRef.current = new Worker('/audio-worker.js');
        workerRef.current.onerror = (error) => {
          console.error('Audio worker error:', error);
          workerRef.current = null;
        };
      } catch (error) {
        console.warn('Web Worker not supported:', error);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [enableWebWorker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
      }
      debouncedProcess.cancel();
    };
  }, [debouncedProcess]);

  // Memory management for audio buffers
  const optimizeMemoryUsage = useCallback(() => {
    // Clear processing queue if it gets too large
    if (processingQueueRef.current.length > 10) {
      processingQueueRef.current = processingQueueRef.current.slice(-5);
    }
    
    // Force garbage collection hint
    if ((window as any).gc) {
      (window as any).gc();
    }
  }, []);

  // Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    return { ...performanceMetricsRef.current };
  }, []);

  return {
    initializeAudioContext,
    processAudioBatch,
    processAudioBuffer,
    debouncedProcess,
    optimizeMemoryUsage,
    getPerformanceMetrics,
    isOptimized: enableWebWorker && !!workerRef.current
  };
};

export default useAudioOptimization;