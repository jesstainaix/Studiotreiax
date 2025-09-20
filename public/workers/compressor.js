// Compressor Worker
// Handles compression tasks in background

class Compressor {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    this.isInitialized = true;
    return true;
  }

  async compress(data, options = {}) {
    try {
      const { type, level = 6, format } = options;
      
      switch (type) {
        case 'text':
          return this.compressText(data, options);
        case 'json':
          return this.compressJSON(data, options);
        case 'image':
          return this.compressImage(data, options);
        case 'binary':
          return this.compressBinary(data, options);
        default:
          return this.compressGeneric(data, options);
      }
    } catch (error) {
      throw new Error(`Compression failed: ${error.message}`);
    }
  }

  async decompress(data, options = {}) {
    try {
      const { type, format } = options;
      
      switch (type) {
        case 'text':
          return this.decompressText(data, options);
        case 'json':
          return this.decompressJSON(data, options);
        case 'image':
          return this.decompressImage(data, options);
        case 'binary':
          return this.decompressBinary(data, options);
        default:
          return this.decompressGeneric(data, options);
      }
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }

  compressText(text, options) {
    const { algorithm = 'gzip' } = options;
    
    // Convert text to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    return this.compressBinary(data, { algorithm });
  }

  decompressText(compressedData, options) {
    const decompressed = this.decompressBinary(compressedData, options);
    
    // Convert back to text
    const decoder = new TextDecoder();
    return decoder.decode(decompressed);
  }

  compressJSON(obj, options) {
    const jsonString = JSON.stringify(obj);
    return this.compressText(jsonString, options);
  }

  decompressJSON(compressedData, options) {
    const jsonString = this.decompressText(compressedData, options);
    return JSON.parse(jsonString);
  }

  compressImage(imageData, options) {
    const { quality = 0.8, format = 'jpeg' } = options;
    
    // This is a simplified implementation
    // In a real scenario, you'd use proper image compression libraries
    if (format === 'jpeg' && quality < 1) {
      // Simulate JPEG compression by reducing data size
      const compressionRatio = quality;
      const compressedSize = Math.floor(imageData.length * compressionRatio);
      return imageData.slice(0, compressedSize);
    }
    
    return imageData;
  }

  decompressImage(compressedData, options) {
    // Simplified decompression - in reality, this would be much more complex
    return compressedData;
  }

  compressBinary(data, options) {
    const { algorithm = 'deflate' } = options;
    
    try {
      // Use CompressionStream if available (modern browsers)
      if (typeof CompressionStream !== 'undefined') {
        return this.compressWithStream(data, algorithm);
      }
      
      // Fallback to simple compression simulation
      return this.simulateCompression(data, options);
    } catch (error) {
      throw new Error(`Binary compression failed: ${error.message}`);
    }
  }

  decompressBinary(compressedData, options) {
    const { algorithm = 'deflate' } = options;
    
    try {
      // Use DecompressionStream if available (modern browsers)
      if (typeof DecompressionStream !== 'undefined') {
        return this.decompressWithStream(compressedData, algorithm);
      }
      
      // Fallback to simple decompression simulation
      return this.simulateDecompression(compressedData, options);
    } catch (error) {
      throw new Error(`Binary decompression failed: ${error.message}`);
    }
  }

  async compressWithStream(data, algorithm) {
    const stream = new CompressionStream(algorithm);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    // Write data to compression stream
    await writer.write(data);
    await writer.close();
    
    // Read compressed data
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  async decompressWithStream(compressedData, algorithm) {
    const stream = new DecompressionStream(algorithm);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    // Write compressed data to decompression stream
    await writer.write(compressedData);
    await writer.close();
    
    // Read decompressed data
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  simulateCompression(data, options) {
    const { level = 6 } = options;
    
    // Simple compression simulation using RLE (Run Length Encoding)
    const compressed = [];
    let i = 0;
    
    while (i < data.length) {
      let count = 1;
      const current = data[i];
      
      // Count consecutive identical bytes
      while (i + count < data.length && data[i + count] === current && count < 255) {
        count++;
      }
      
      if (count > 3 || current === 0) {
        // Use RLE for runs of 4+ or zeros
        compressed.push(0, count, current);
      } else {
        // Store literal bytes
        for (let j = 0; j < count; j++) {
          compressed.push(current);
        }
      }
      
      i += count;
    }
    
    return new Uint8Array(compressed);
  }

  simulateDecompression(compressedData, options) {
    const decompressed = [];
    let i = 0;
    
    while (i < compressedData.length) {
      if (compressedData[i] === 0 && i + 2 < compressedData.length) {
        // RLE sequence
        const count = compressedData[i + 1];
        const value = compressedData[i + 2];
        
        for (let j = 0; j < count; j++) {
          decompressed.push(value);
        }
        
        i += 3;
      } else {
        // Literal byte
        decompressed.push(compressedData[i]);
        i++;
      }
    }
    
    return new Uint8Array(decompressed);
  }

  compressGeneric(data, options) {
    // Convert any data type to binary and compress
    let binaryData;
    
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      binaryData = encoder.encode(data);
    } else if (data instanceof ArrayBuffer) {
      binaryData = new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      binaryData = data;
    } else {
      // Convert to JSON first
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      binaryData = encoder.encode(jsonString);
    }
    
    return this.compressBinary(binaryData, options);
  }

  decompressGeneric(compressedData, options) {
    return this.decompressBinary(compressedData, options);
  }

  getCompressionRatio(originalSize, compressedSize) {
    return originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;
  }

  estimateCompressionTime(dataSize, algorithm = 'deflate') {
    // Rough estimates in milliseconds
    const rates = {
      'deflate': 0.1, // 0.1ms per KB
      'gzip': 0.12,
      'brotli': 0.15
    };
    
    const rate = rates[algorithm] || rates.deflate;
    return Math.max(1, Math.floor(dataSize / 1024 * rate));
  }
}

const compressor = new Compressor();

self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'init':
        const initialized = compressor.init();
        self.postMessage({ type: 'init', success: initialized, id });
        break;
        
      case 'compress':
        const compressed = await compressor.compress(data.data, data.options);
        const originalSize = data.data.length || JSON.stringify(data.data).length;
        const compressedSize = compressed.length;
        const ratio = compressor.getCompressionRatio(originalSize, compressedSize);
        
        self.postMessage({ 
          type: 'compress', 
          result: compressed, 
          originalSize,
          compressedSize,
          ratio,
          id 
        });
        break;
        
      case 'decompress':
        const decompressed = await compressor.decompress(data.data, data.options);
        self.postMessage({ type: 'decompress', result: decompressed, id });
        break;
        
      case 'estimate':
        const estimate = compressor.estimateCompressionTime(data.size, data.algorithm);
        self.postMessage({ type: 'estimate', result: estimate, id });
        break;
        
      case 'cancel':
        self.postMessage({ type: 'cancelled', id });
        break;
        
      default:
        throw new Error(`Unknown command: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message, 
      id 
    });
  }
};

self.onerror = function(error) {
  self.postMessage({ 
    type: 'error', 
    error: `Worker error: ${error.message}` 
  });
};