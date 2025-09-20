const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = {
  images: path.join(__dirname, '../../uploads/images'),
  videos: path.join(__dirname, '../../uploads/videos'),
  audio: path.join(__dirname, '../../uploads/audio'),
  documents: path.join(__dirname, '../../uploads/documents'),
  models3d: path.join(__dirname, '../../uploads/models3d'),
  avatars: path.join(__dirname, '../../uploads/avatars'),
  thumbnails: path.join(__dirname, '../../uploads/thumbnails'),
  temp: path.join(__dirname, '../../uploads/temp')
};

// Ensure all directories exist
Object.values(uploadDirs).forEach(ensureDirectoryExists);

// File type configurations
const fileTypes = {
  images: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    maxSize: 10 * 1024 * 1024, // 10MB
    directory: uploadDirs.images
  },
  videos: {
    mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    extensions: ['.mp4', '.mpeg', '.mov', '.avi', '.webm'],
    maxSize: 500 * 1024 * 1024, // 500MB
    directory: uploadDirs.videos
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'],
    extensions: ['.mp3', '.wav', '.ogg'],
    maxSize: 50 * 1024 * 1024, // 50MB
    directory: uploadDirs.audio
  },
  documents: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ],
    extensions: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'],
    maxSize: 25 * 1024 * 1024, // 25MB
    directory: uploadDirs.documents
  },
  models3d: {
    mimeTypes: [
      'model/gltf+json',
      'model/gltf-binary',
      'application/octet-stream', // for .glb files
      'model/obj',
      'model/fbx'
    ],
    extensions: ['.gltf', '.glb', '.obj', '.fbx', '.dae'],
    maxSize: 100 * 1024 * 1024, // 100MB
    directory: uploadDirs.models3d
  },
  avatars: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    directory: uploadDirs.avatars
  }
};

// Generate unique filename
const generateFilename = (originalname, userId = null) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname).toLowerCase();
  const baseName = path.basename(originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
  
  const userPrefix = userId ? `${userId}_` : '';
  return `${userPrefix}${timestamp}_${randomString}_${baseName}${extension}`;
};

// Storage configuration
const createStorage = (uploadType) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const config = fileTypes[uploadType];
      if (!config) {
        return cb(new Error(`Invalid upload type: ${uploadType}`));
      }
      cb(null, config.directory);
    },
    filename: (req, file, cb) => {
      const userId = req.user?.id;
      const filename = generateFilename(file.originalname, userId);
      cb(null, filename);
    }
  });
};

// Memory storage for temporary processing
const memoryStorage = multer.memoryStorage();

// File filter function
const createFileFilter = (uploadType) => {
  return (req, file, cb) => {
    const config = fileTypes[uploadType];
    if (!config) {
      return cb(new Error(`Invalid upload type: ${uploadType}`), false);
    }

    // Check MIME type
    if (!config.mimeTypes.includes(file.mimetype)) {
      const error = new Error(`Invalid file type. Allowed types: ${config.mimeTypes.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!config.extensions.includes(extension)) {
      const error = new Error(`Invalid file extension. Allowed extensions: ${config.extensions.join(', ')}`);
      error.code = 'INVALID_FILE_EXTENSION';
      return cb(error, false);
    }

    cb(null, true);
  };
};

// Create upload middleware for different types
const createUploadMiddleware = (uploadType, options = {}) => {
  const config = fileTypes[uploadType];
  if (!config) {
    throw new Error(`Invalid upload type: ${uploadType}`);
  }

  const uploadOptions = {
    storage: options.useMemory ? memoryStorage : createStorage(uploadType),
    fileFilter: createFileFilter(uploadType),
    limits: {
      fileSize: options.maxSize || config.maxSize,
      files: options.maxFiles || 1
    }
  };

  return multer(uploadOptions);
};

// Specific upload middlewares
const uploadImage = createUploadMiddleware('images');
const uploadVideo = createUploadMiddleware('videos');
const uploadAudio = createUploadMiddleware('audio');
const uploadDocument = createUploadMiddleware('documents');
const uploadModel3D = createUploadMiddleware('models3d');
const uploadAvatar = createUploadMiddleware('avatars');

// Multiple files upload
const uploadMultipleImages = createUploadMiddleware('images', { maxFiles: 10 });
const uploadMultipleVideos = createUploadMiddleware('videos', { maxFiles: 5 });
const uploadMultipleDocuments = createUploadMiddleware('documents', { maxFiles: 10 });

// Memory uploads for processing
const uploadImageMemory = createUploadMiddleware('images', { useMemory: true });
const uploadVideoMemory = createUploadMiddleware('videos', { useMemory: true });

// Mixed upload middleware (different file types)
const uploadMixed = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 10
  },
  fileFilter: (req, file, cb) => {
    // Allow all configured file types
    const allMimeTypes = Object.values(fileTypes).flatMap(config => config.mimeTypes);
    
    if (!allMimeTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    
    cb(null, true);
  }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Upload error';
    let code = 'UPLOAD_ERROR';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Arquivo muito grande';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Muitos arquivos';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de arquivo inesperado';
        code = 'UNEXPECTED_FILE';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Muitas partes no upload';
        code = 'TOO_MANY_PARTS';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Nome do campo muito longo';
        code = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Valor do campo muito longo';
        code = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Muitos campos';
        code = 'TOO_MANY_FIELDS';
        break;
    }
    
    return res.status(400).json({
      success: false,
      error: message,
      code,
      details: error.message
    });
  }
  
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
  
  next(error);
};

// File validation middleware
const validateUploadedFiles = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum arquivo foi enviado',
      code: 'NO_FILE_UPLOADED'
    });
  }
  
  const files = req.files || [req.file];
  
  // Additional validation can be added here
  for (const file of files) {
    // Check if file is empty
    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo vazio não é permitido',
        code: 'EMPTY_FILE',
        filename: file.originalname
      });
    }
  }
  
  next();
};

// Clean up temporary files
const cleanupTempFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Clean up uploaded files if there was an error
    if (res.statusCode >= 400 && req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        }
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Get file info helper
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString()
  };
};

// File URL generator
const generateFileUrl = (filename, type) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Delete file helper
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return resolve(false); // File doesn't exist
    }
    
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

// Move file helper
const moveFile = (sourcePath, destinationPath) => {
  return new Promise((resolve, reject) => {
    // Ensure destination directory exists
    const destDir = path.dirname(destinationPath);
    ensureDirectoryExists(destDir);
    
    fs.rename(sourcePath, destinationPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

module.exports = {
  // Upload middlewares
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadDocument,
  uploadModel3D,
  uploadAvatar,
  
  // Multiple file uploads
  uploadMultipleImages,
  uploadMultipleVideos,
  uploadMultipleDocuments,
  
  // Memory uploads
  uploadImageMemory,
  uploadVideoMemory,
  uploadMixed,
  
  // Middleware functions
  handleUploadError,
  validateUploadedFiles,
  cleanupTempFiles,
  
  // Helper functions
  getFileInfo,
  generateFileUrl,
  deleteFile,
  moveFile,
  generateFilename,
  ensureDirectoryExists,
  
  // Configurations
  fileTypes,
  uploadDirs,
  
  // Factory functions
  createUploadMiddleware,
  createStorage,
  createFileFilter
};