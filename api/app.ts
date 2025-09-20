import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Request, Response, NextFunction } from 'express';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core routes
import projectsRoutes from './routes/projects.js';
import templatesRoutes from './routes/templates.js';
import uploadRoutes from './routes/upload.js';
import videosRoutes from './routes/videos.js';
import usersRoutes from './routes/users.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import errorsRoutes from './routes/errors.js';
import performanceRoutes from './routes/performance.js';

// Pipeline PPTX→Vídeo routes
import pipelineRoutes from './routes/pipeline.js';

// Additional routes (using createRequire for CommonJS modules)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const load = (p) => { console.log('[require-route]', p); return require(p); };
// Temporarily commented for debugging - one of these contains require('../server')
// const videoPipelineRoutes = load('./routes/videoPipeline');
// const qualityMetricsRoutes = load('./routes/qualityMetrics');
// const aiConfigRoutes = load('./routes/aiConfig');
// const optimizedPromptsRoutes = load('./routes/optimizedPrompts');
// const contentImprovementRoutes = load('./routes/contentImprovement');
// const captionGenerationRoutes = load('./routes/captionGeneration');
// const captionsTranscriptionsRoutes = load('./routes/captionsTranscriptions');
// const contentOptimizationRoutes = load('./routes/contentOptimization');

// Middleware
// import { errorHandler } from './middleware/errorHandler.js';
// import metricsCollector from './middleware/metricsCollector.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de coleta de métricas (temporariamente desabilitado para debug)
// app.use(metricsCollector.collectMetrics.bind(metricsCollector));
// app.use(metricsCollector.trackEngagement.bind(metricsCollector));

// Routes
// Core application routes
app.use('/api/projects', projectsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/errors', errorsRoutes);
app.use('/api/performance', performanceRoutes);

// Specialized routes - temporarily commented for debugging
// app.use('/api/quality-metrics', qualityMetricsRoutes);
// app.use('/api/video-pipeline', videoPipelineRoutes);
// app.use('/api/ai-config', aiConfigRoutes);

// AI-specific routes (organized by functionality) - enabled for GPT-4 Vision integration
const aiConfigRoutes = load('./routes/aiConfig');
const promptTemplatesRoutes = load('./routes/promptTemplates');
const contentOptimizationRoutes = load('./routes/contentOptimization');
const captionGenerationRoutes = load('./routes/captionGeneration');
const captionsTranscriptionsRoutes = load('./routes/captionsTranscriptions');

app.use('/api/ai', aiConfigRoutes);
app.use('/api/ai/templates', promptTemplatesRoutes);
app.use('/api/ai/optimization', contentOptimizationRoutes);
app.use('/api/ai/captions', captionGenerationRoutes);
app.use('/api/ai/transcriptions', captionsTranscriptionsRoutes);

// Pipeline PPTX→Vídeo routes
app.use('/api/pipeline', pipelineRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;