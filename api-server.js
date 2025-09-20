import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure trust proxy for production environment
if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import AI routes
import aiRoutes from './api/routes/ai.js';
import ttsRoutes from './api/routes/tts.js';
import authRoutes from './api/routes/auth.js';
import pptxRoutes from './api/routes/pptx.js';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'AI Backend Server is running successfully'
  });
});

// AI endpoints - the missing critical endpoints
app.use('/api/ai', aiRoutes);

// TTS endpoints
app.use('/api/tts', ttsRoutes);

// Auth endpoints
app.use('/api/auth', authRoutes);

// PPTX endpoints - Phase 1 Implementation
app.use('/api/pptx', pptxRoutes);

// Scene layers endpoints - Phase 4 Implementation
const sceneLayersRoutes = await import('./server/routes/scene-layers.js');
app.use('/api/scene-layers', sceneLayersRoutes.default);

// Pipeline endpoints - Mock implementations
app.post('/api/pipeline/start', (req, res) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.json({
    success: true,
    message: 'Pipeline iniciado com sucesso',
    data: {
      jobId: jobId,
      status: 'pending',
      progress: 0,
      currentStage: 'upload'
    }
  });
});

app.get('/api/pipeline/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  // Mock progressive status
  const mockProgress = Math.min(100, Math.floor(Math.random() * 100));
  const stages = ['upload', 'extraction', 'aiAnalysis', 'ttsGeneration', 'videoGeneration'];
  const currentStageIndex = Math.floor(mockProgress / 20);
  const currentStage = stages[currentStageIndex] || 'completed';
  
  res.json({
    success: true,
    data: {
      id: jobId,
      userId: 'mock_user',
      status: mockProgress >= 100 ? 'completed' : 'processing',
      progress: mockProgress,
      currentStage: currentStage,
      file: {
        id: 'mock_file_id',
        originalName: 'presentation.pptx',
        size: 1024000,
        mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      },
      stages: {
        upload: { status: 'completed', progress: 100 },
        extraction: { status: currentStageIndex >= 1 ? 'completed' : 'pending', progress: currentStageIndex >= 1 ? 100 : 0 },
        aiAnalysis: { status: currentStageIndex >= 2 ? 'completed' : 'pending', progress: currentStageIndex >= 2 ? 100 : 0 },
        ttsGeneration: { status: currentStageIndex >= 3 ? 'completed' : 'pending', progress: currentStageIndex >= 3 ? 100 : 0 },
        videoGeneration: { status: currentStageIndex >= 4 ? 'completed' : 'pending', progress: currentStageIndex >= 4 ? 100 : 0 }
      },
      result: mockProgress >= 100 ? {
        videoUrl: '/mock/video.mp4',
        thumbnailUrl: '/mock/thumbnail.jpg',
        duration: 120,
        fileSize: 5242880
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

app.get('/api/pipeline/jobs', (req, res) => {
  // Mock user jobs list
  const mockJobs = [
    {
      id: 'job_mock_1',
      userId: 'mock_user',
      status: 'completed',
      progress: 100,
      currentStage: 'completed',
      file: {
        id: 'file_1',
        originalName: 'safety-training.pptx',
        size: 2048000,
        mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      },
      result: {
        videoUrl: '/mock/safety-training.mp4',
        thumbnailUrl: '/mock/safety-training-thumb.jpg',
        duration: 180,
        fileSize: 7340032
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockJobs
  });
});

// Mock GPT-4 Vision endpoints until real backend is connected
app.get('/api/ai/models', (req, res) => {
  res.json({
    success: true,
    models: [
      { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision Preview', available: true },
      { id: 'gpt-4', name: 'GPT-4', available: true }
    ]
  });
});

app.post('/api/ai/analyze-compliance', (req, res) => {
  res.json({
    success: true,
    data: {
      contentAnalysis: {
        topics: ['safety', 'equipment', 'procedures'],
        complexity: 'intermediate',
        readabilityScore: 85,
        engagementScore: 78
      },
      nrCompliance: {
        detectedNRs: ['NR-12', 'NR-6'],
        complianceScore: 94,
        complianceLevel: 'high',
        safetyTerms: ['safety', 'equipment', 'procedures'],
        requiredElements: ['safety protocols', 'equipment guidelines'],
        missingElements: []
      },
      recommendations: ['Add interactive elements', 'Include visual aids'],
      visualElements: {
        hasCharts: true,
        hasImages: true,
        hasTables: false,
        hasInfographics: false,
        visualComplexity: 'medium'
      }
    }
  });
});

app.get('/api/ai/script/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'nr-safety-advanced',
        name: 'NR Safety Advanced (GPT-4 Vision)',
        description: 'Advanced safety training with GPT-4 Vision analysis and NR compliance optimization',
        category: 'safety',
        confidence: 98,
        reasons: [
          'GPT-4 Vision detected high safety keyword density',
          'NR-12 compliance terms analyzed by AI',
          'Industrial safety context recognized',
          'Backend AI optimized template structure'
        ],
        preview: 'AI-powered safety training with GPT-4 Vision content analysis, compliance validation, and optimized engagement',
        estimatedTime: 16,
        nrCompliance: {
          detectedNRs: ['NR-12', 'NR-6'],
          complianceScore: 98,
          requiredElements: ['safety protocols', 'equipment guidelines', 'emergency procedures'],
          missingElements: []
        }
      },
      {
        id: 'gpt-compliance-pro',
        name: 'GPT-4 Compliance Pro',
        description: 'Professional compliance training powered by GPT-4 Vision backend analysis',
        category: 'compliance',
        confidence: 96,
        reasons: [
          'GPT-4 Vision compliance analysis completed',
          'Backend AI detected regulatory patterns',
          'Advanced compliance scoring applied',
          'Professional template optimization'
        ],
        preview: 'Professional compliance training with GPT-4 Vision regulatory analysis and backend AI optimization',
        estimatedTime: 20,
        nrCompliance: {
          detectedNRs: ['NR-12', 'NR-10', 'NR-35'],
          complianceScore: 96,
          requiredElements: ['regulatory framework', 'compliance assessment', 'audit preparation'],
          missingElements: []
        }
      }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const server = app.listen(PORT, () => {
  console.log(`AI Backend Server ready on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`AI Models: http://localhost:${PORT}/api/ai/models`);
  console.log(`AI Templates: http://localhost:${PORT}/api/ai/script/templates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('AI Backend Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('AI Backend Server closed');
    process.exit(0);
  });
});

export default app;