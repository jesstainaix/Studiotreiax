// FASE 5 - Real Render Pipeline API
// Express.js API endpoint for handling video render requests using TypeScript component bridge

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { RenderBridge } from '../adapters/render-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Storage for active render jobs and rendering system
let renderJobs = new Map();
let jobCounter = 1;

// Initialize render bridge
const renderBridge = new RenderBridge();

// Helper function to format file sizes
function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Real render job using TypeScript component bridge
async function createRealRenderJob(config, broadcastProgress) {
  const jobId = `render_job_${jobCounter++}_${Date.now()}`;
  
  const job = {
    id: jobId,
    name: config.jobName || 'Video Render',
    status: 'queued',
    progress: {
      phase: 'initialization',
      percentage: 0,
      message: 'Job queued for processing'
    },
    config,
    startTime: Date.now(),
    endTime: null,
    outputs: null,
    result: null,
    error: null,
    lastUpdate: Date.now()
  };

  renderJobs.set(jobId, job);
  
  console.log(`🚀 [Render API] Starting real render job: ${jobId}`);
  
  // Start the actual render process
  processRealRender(job, broadcastProgress);
  
  return jobId;
}

async function processRealRender(job, broadcastProgress) {
  try {
    // Update job status to processing
    job.status = 'processing';
    job.progress = {
      phase: 'initialization',
      percentage: 0,
      message: 'Starting render process...'
    };
    renderJobs.set(job.id, job);
    
    // Broadcast initial status
    if (broadcastProgress) {
      broadcastProgress(job.id, {
        jobId: job.id,
        status: 'processing',
        progress: job.progress
      });
    }
    
    // Execute the render pipeline using TypeScript bridge
    const result = await renderBridge.processRender({
      jobId: job.id,
      projectPath: job.config.projectPath,
      outputPath: job.config.outputPath,
      settings: job.config.settings,
      onProgress: (progressData) => {
        console.log(`📊 [Progress] Job ${job.id}:`, progressData);
        
        // Update job progress
        job.progress = progressData;
        job.lastUpdate = Date.now();
        renderJobs.set(job.id, job);
        
        // Broadcast progress via SSE to all connected clients
        if (broadcastProgress) {
          broadcastProgress(job.id, {
            jobId: job.id,
            status: job.status,
            progress: progressData
          });
        }
      }
    });
    
    // Update job with successful completion
    job.status = 'completed';
    job.endTime = Date.now();
    job.outputs = result.outputFiles;
    job.result = result;
    renderJobs.set(job.id, job);
    
    console.log(`✅ [Render] Job completed successfully: ${job.id}`);
    console.log(`📄 [Render] Output files:`, result.outputFiles);
    
    // Broadcast completion
    if (broadcastProgress) {
      broadcastProgress(job.id, {
        jobId: job.id,
        status: 'completed',
        progress: {
          phase: 'completed',
          percentage: 100,
          message: 'Render completed successfully!'
        },
        outputs: job.outputs,
        result: result
      });
    }
    
  } catch (error) {
    console.error(`❌ [Render] Job failed: ${job.id}`, error);
    
    // Update job with failure
    job.status = 'failed';
    job.endTime = Date.now();
    job.error = error.message;
    job.progress = {
      phase: 'failed',
      percentage: 0,
      message: `Render failed: ${error.message}`
    };
    renderJobs.set(job.id, job);
    
    // Broadcast failure
    if (broadcastProgress) {
      broadcastProgress(job.id, {
        jobId: job.id,
        status: 'failed',
        error: error.message,
        progress: job.progress
      });
    }
  }
}

// POST /api/render - Start a new render job
router.post('/', async (req, res) => {
  try {
    console.log('🎬 [Render API] Received render request:', req.body);

    const config = {
      jobName: req.body.jobName || 'Video Render',
      projectPath: req.body.projectPath || path.resolve('./project'),
      outputPath: req.body.outputPath || path.resolve('./project/data/renders'),
      settings: {
        quality: req.body.settings?.quality || '1080p',
        fps: req.body.settings?.fps || 30,
        format: req.body.settings?.format || 'both',
        bitrate: {
          video: req.body.settings?.bitrate?.video || '8M',
          audio: req.body.settings?.bitrate?.audio || '128k'
        },
        enableLipSync: req.body.settings?.enableLipSync !== false,
        enableSubtitles: req.body.settings?.enableSubtitles !== false,
        enableMarkers: req.body.settings?.enableMarkers !== false
      },
      metadata: req.body.metadata || {}
    };

    // Validate project structure using renderBridge
    try {
      await renderBridge.tsBridge.validateProjectStructure(config.projectPath);
      console.log(`✓ [Validation] Project structure validated`);
    } catch (error) {
      console.error(`❌ [Validation] Project validation failed:`, error.message);
      return res.status(400).json({
        success: false,
        error: `Project validation failed: ${error.message}`,
        hint: 'Please ensure slides.json, scene_config.json, and scene_layers.json exist'
      });
    }

    // Ensure output directory exists
    await fs.mkdir(config.outputPath, { recursive: true });
    console.log(`📁 [Setup] Output directory created: ${config.outputPath}`);

    // Create real render job using TypeScript bridge
    const jobId = await createRealRenderJob(config, req.app?.locals?.broadcastProgress);

    res.json({
      success: true,
      jobId,
      message: 'Real render job started successfully',
      statusUrl: `/api/render/${jobId}`,
      streamUrl: `/api/render/${jobId}/stream`,
      reportUrl: `/api/render/${jobId}/report`
    });

  } catch (error) {
    console.error('❌ [Render API] Error starting render job:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check server logs for detailed error information'
    });
  }
});

// GET /api/render/:jobId - Get render job status
router.get('/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = renderJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const response = {
      success: true,
      job: {
        id: job.id,
        name: job.name,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        processingTime: job.endTime ? job.endTime - job.startTime : Date.now() - job.startTime,
        lastUpdate: job.lastUpdate
      }
    };

    if (job.status === 'completed' && job.outputs) {
      response.job.outputs = job.outputs;
      response.job.result = job.result;
    }

    if (job.error) {
      response.job.error = job.error;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ [Render API] Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/render/:jobId/report - Get detailed build report
router.get('/:jobId/report', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = renderJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const processingTime = (job.endTime || Date.now()) - job.startTime;
    const minutes = Math.floor(processingTime / 60000);
    const seconds = Math.floor((processingTime % 60000) / 1000);

    const report = {
      jobId: job.id,
      jobName: job.name,
      status: job.status,
      configuration: job.config.settings,
      timeline: {
        startTime: new Date(job.startTime).toISOString(),
        endTime: job.endTime ? new Date(job.endTime).toISOString() : null,
        processingTime: {
          totalMs: processingTime,
          formatted: `${minutes}m ${seconds}s`
        }
      },
      currentStatus: {
        phase: job.progress.phase,
        percentage: job.progress.percentage,
        message: job.progress.message
      },
      generatedAt: new Date().toISOString(),
      version: '1.0.0-FASE5',
      pipeline: 'TypeScript Bridge Pipeline'
    };

    // Add output file information if available
    if (job.outputs) {
      const outputFiles = {};
      
      for (const [format, filePath] of Object.entries(job.outputs)) {
        try {
          const stats = await fs.stat(filePath);
          outputFiles[format] = {
            path: filePath,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            created: stats.birthtime.toISOString(),
            exists: true
          };
        } catch (error) {
          outputFiles[format] = {
            path: filePath,
            exists: false,
            error: 'File not accessible'
          };
        }
      }
      
      report.outputs = outputFiles;
    }

    // Add result details if available
    if (job.result) {
      report.renderDetails = job.result;
    }

    // Add error details if failed
    if (job.error) {
      report.error = {
        message: job.error,
        timestamp: job.endTime ? new Date(job.endTime).toISOString() : null
      };
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('❌ [Render API] Error getting build report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/render/:jobId - Cancel render job
router.delete('/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = renderJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed or failed job'
      });
    }

    job.status = 'cancelled';
    job.endTime = Date.now();
    job.progress.message = 'Job cancelled by user';

    console.log(`🛑 [Render API] Job cancelled: ${jobId}`);

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    console.error('❌ [Render API] Error cancelling job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/render - List all jobs
router.get('/', (req, res) => {
  try {
    const jobs = Array.from(renderJobs.values()).map(job => ({
      id: job.id,
      name: job.name,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      endTime: job.endTime,
      processingTime: job.endTime ? job.endTime - job.startTime : Date.now() - job.startTime
    }));

    res.json({
      success: true,
      jobs,
      total: jobs.length,
      pipeline: 'TypeScript Bridge Pipeline'
    });

  } catch (error) {
    console.error('❌ [Render API] Error listing jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;