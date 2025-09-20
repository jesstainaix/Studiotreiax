// Image Processor Worker
// Handles image processing tasks in background

class ImageProcessor {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;
  }

  init() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(1, 1);
      this.ctx = this.canvas.getContext('2d');
      this.isInitialized = true;
    } else {
      // Fallback for browsers without OffscreenCanvas
      this.isInitialized = false;
    }
    return this.isInitialized;
  }

  async processImage(imageData, options = {}) {
    if (!this.isInitialized) {
      this.init();
    }

    try {
      const { width, height, operation } = options;
      
      // Create ImageBitmap from image data
      const bitmap = await createImageBitmap(imageData);
      
      // Set canvas size
      this.canvas.width = width || bitmap.width;
      this.canvas.height = height || bitmap.height;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Apply processing based on operation
      switch (operation) {
        case 'resize':
          return this.resize(bitmap, width, height);
        case 'crop':
          return this.crop(bitmap, options);
        case 'filter':
          return this.applyFilter(bitmap, options.filter);
        case 'compress':
          return this.compress(bitmap, options.quality);
        default:
          return this.copy(bitmap);
      }
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  resize(bitmap, width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(bitmap, 0, 0, width, height);
    return this.canvas.transferToImageBitmap();
  }

  crop(bitmap, options) {
    const { x = 0, y = 0, width, height } = options;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
    return this.canvas.transferToImageBitmap();
  }

  applyFilter(bitmap, filter) {
    this.canvas.width = bitmap.width;
    this.canvas.height = bitmap.height;
    
    // Apply CSS filter
    this.ctx.filter = filter || 'none';
    this.ctx.drawImage(bitmap, 0, 0);
    
    return this.canvas.transferToImageBitmap();
  }

  compress(bitmap, quality = 0.8) {
    this.canvas.width = bitmap.width;
    this.canvas.height = bitmap.height;
    this.ctx.drawImage(bitmap, 0, 0);
    
    // Note: OffscreenCanvas doesn't support toBlob directly
    // This is a simplified version
    return this.canvas.transferToImageBitmap();
  }

  copy(bitmap) {
    this.canvas.width = bitmap.width;
    this.canvas.height = bitmap.height;
    this.ctx.drawImage(bitmap, 0, 0);
    return this.canvas.transferToImageBitmap();
  }
}

const processor = new ImageProcessor();

self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'init':
        const initialized = processor.init();
        self.postMessage({ type: 'init', success: initialized, id });
        break;
        
      case 'process':
        const result = await processor.processImage(data.imageData, data.options);
        self.postMessage({ type: 'process', result, id }, [result]);
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