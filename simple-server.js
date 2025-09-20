import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pptx', '.ppt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PowerPoint (.pptx, .ppt) são permitidos'));
    }
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' })); // Increased for PPTX processing
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// In-memory store for conversion jobs
const conversionJobs = new Map();

// Generate unique job ID
function generateJobId() {
  return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Simulate PPTX processing
async function processPPTX(filePath, originalName, jobId) {
  const job = conversionJobs.get(jobId);
  
  try {
    // Stage 1: File validation
    job.stage = 'validation';
    job.progress = 10;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Stage 2: Content extraction
    job.stage = 'extraction';
    job.progress = 30;
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Stage 3: AI analysis
    job.stage = 'ai_analysis';
    job.progress = 50;
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Stage 4: Video generation
    job.stage = 'video_generation';
    job.progress = 70;
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Stage 5: Finalization
    job.stage = 'finalization';
    job.progress = 90;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Complete
    job.status = 'completed';
    job.progress = 100;
    job.result = {
      videoUrl: `/api/video/${jobId}.mp4`,
      thumbnailUrl: `/api/thumbnail/${jobId}.jpg`,
      duration: 120, // seconds
      fileSize: 15.7, // MB
      format: 'mp4'
    };
    
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
  });
});

// PPTX Upload endpoint
app.post('/api/pptx/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado',
        success: false
      });
    }

    const jobId = generateJobId();
    const job = {
      id: jobId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      status: 'processing',
      stage: 'uploaded',
      progress: 0,
      createdAt: new Date().toISOString(),
      estimatedDuration: 180 // 3 minutes
    };

    conversionJobs.set(jobId, job);

    // Start processing asynchronously
    processPPTX(req.file.path, req.file.originalname, jobId);

    res.json({
      success: true,
      jobId: jobId,
      message: 'Arquivo enviado com sucesso. Processamento iniciado.',
      job: {
        id: job.id,
        originalName: job.originalName,
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        estimatedDuration: job.estimatedDuration
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      success: false
    });
  }
});

// Job status endpoint
app.get('/api/pptx/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = conversionJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job não encontrado',
      success: false
    });
  }

  res.json({
    success: true,
    job: {
      id: job.id,
      originalName: job.originalName,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      estimatedDuration: job.estimatedDuration
    }
  });
});

// List all jobs
app.get('/api/pptx/jobs', (req, res) => {
  const jobs = Array.from(conversionJobs.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(job => ({
      id: job.id,
      originalName: job.originalName,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      createdAt: job.createdAt,
      result: job.result
    }));

  res.json({
    success: true,
    jobs: jobs
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Performance Optimization Backend',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/info',
      '/api/pptx/upload',
      '/api/pptx/status/:jobId',
      '/api/pptx/jobs',
    ],
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Performance Optimization Backend',
    version: '1.0.0',
    documentation: '/api/info',
    health: '/api/health',
    message: 'Please use /api/info for API documentation'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;