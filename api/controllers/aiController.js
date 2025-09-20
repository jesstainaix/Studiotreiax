const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class AIController {
  // Script Generation
  async generateScript(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { topic, duration, audience, nrFocus, tone, includeQuiz, include3D } = req.body;
      const userId = req.user.id;

      // Generate script using AI service
      const scriptData = await aiService.generateScript({
        topic,
        duration,
        audience,
        nrFocus,
        tone,
        includeQuiz,
        include3D,
        userId
      });

      // Save to database
      const scriptId = uuidv4();
      const script = {
        id: scriptId,
        userId,
        topic,
        content: scriptData.script,
        metadata: scriptData.metadata,
        suggestions: scriptData.suggestions,
        resources: scriptData.resources,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Mock database save
      await this.saveToMockDB('scripts', script);

      res.json({
        success: true,
        data: {
          id: scriptId,
          script: scriptData.script,
          metadata: scriptData.metadata,
          suggestions: scriptData.suggestions,
          resources: scriptData.resources
        }
      });
    } catch (error) {
      console.error('Error generating script:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate script',
        error: error.message
      });
    }
  }

  async getScriptTemplates(req, res) {
    try {
      const { nr } = req.query;
      const templates = await aiService.getScriptTemplates(nr);

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching script templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch script templates',
        error: error.message
      });
    }
  }

  async optimizeScript(req, res) {
    try {
      const { scriptId } = req.params;
      const { optimizationGoals } = req.body;
      const userId = req.user.id;

      const optimizedScript = await aiService.optimizeScript(scriptId, optimizationGoals, userId);

      res.json({
        success: true,
        data: optimizedScript
      });
    } catch (error) {
      console.error('Error optimizing script:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize script',
        error: error.message
      });
    }
  }

  // Compliance Analysis
  async analyzeCompliance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { content, nrReferences, analysisType, industry } = req.body;
      const userId = req.user.id;

      const analysis = await aiService.analyzeCompliance({
        content,
        nrReferences,
        analysisType,
        industry,
        userId
      });

      // Save analysis to database
      const analysisId = uuidv4();
      const complianceAnalysis = {
        id: analysisId,
        userId,
        content,
        analysis,
        createdAt: new Date().toISOString()
      };

      await this.saveToMockDB('compliance_analyses', complianceAnalysis);

      res.json({
        success: true,
        data: {
          id: analysisId,
          score: analysis.score,
          issues: analysis.issues,
          recommendations: analysis.recommendations,
          nrCompliance: analysis.nrCompliance,
          summary: analysis.summary,
          detailedReport: analysis.detailedReport
        }
      });
    } catch (error) {
      console.error('Error analyzing compliance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze compliance',
        error: error.message
      });
    }
  }

  async getComplianceRules(req, res) {
    try {
      const { nrType } = req.params;
      const rules = await aiService.getComplianceRules(nrType);

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Error fetching compliance rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch compliance rules',
        error: error.message
      });
    }
  }

  async validateProjectCompliance(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const validation = await aiService.validateProjectCompliance(projectId, userId);

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error validating project compliance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate project compliance',
        error: error.message
      });
    }
  }

  // Content Optimization
  async optimizeContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { content, targetAudience, objectives, constraints } = req.body;
      const userId = req.user.id;

      const optimization = await aiService.optimizeContent({
        content,
        targetAudience,
        objectives,
        constraints,
        userId
      });

      res.json({
        success: true,
        data: optimization
      });
    } catch (error) {
      console.error('Error optimizing content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize content',
        error: error.message
      });
    }
  }

  async analyzeContentEngagement(req, res) {
    try {
      const { content } = req.body;
      const userId = req.user.id;

      const engagement = await aiService.analyzeContentEngagement(content, userId);

      res.json({
        success: true,
        data: engagement
      });
    } catch (error) {
      console.error('Error analyzing content engagement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze content engagement',
        error: error.message
      });
    }
  }

  async suggestImprovements(req, res) {
    try {
      const { content, context } = req.body;
      const userId = req.user.id;

      const suggestions = await aiService.suggestImprovements(content, context, userId);

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suggest improvements',
        error: error.message
      });
    }
  }

  // Narrative Generation
  async generateNarrative(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { script, voice, settings } = req.body;
      const userId = req.user.id;

      const narrativeJob = await aiService.generateNarrative({
        script,
        voice,
        settings,
        userId
      });

      res.json({
        success: true,
        data: narrativeJob
      });
    } catch (error) {
      console.error('Error generating narrative:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate narrative',
        error: error.message
      });
    }
  }

  async getNarrativeStatus(req, res) {
    try {
      const { id } = req.params;
      const status = await aiService.getNarrativeStatus(id);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error fetching narrative status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch narrative status',
        error: error.message
      });
    }
  }

  async getAvailableVoices(req, res) {
    try {
      const voices = await aiService.getAvailableVoices();

      res.json({
        success: true,
        data: voices
      });
    } catch (error) {
      console.error('Error fetching available voices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available voices',
        error: error.message
      });
    }
  }

  // AI Insights
  async getInsights(req, res) {
    try {
      const { projectId, timeRange } = req.query;
      const userId = req.user.id;

      const insights = await aiService.getInsights(userId, projectId, timeRange);

      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Error fetching insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch insights',
        error: error.message
      });
    }
  }

  async generateInsight(req, res) {
    try {
      const data = req.body;
      const userId = req.user.id;

      const insight = await aiService.generateInsight({ ...data, userId });

      res.json({
        success: true,
        data: insight
      });
    } catch (error) {
      console.error('Error generating insight:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate insight',
        error: error.message
      });
    }
  }

  async getInsightTrends(req, res) {
    try {
      const { timeRange } = req.query;
      const userId = req.user.id;

      const trends = await aiService.getInsightTrends(userId, timeRange);

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Error fetching insight trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch insight trends',
        error: error.message
      });
    }
  }

  // 3D Content Generation
  async generate3DScenario(req, res) {
    try {
      const { description, nrType } = req.body;
      const userId = req.user.id;

      const scenario = await aiService.generate3DScenario(description, nrType, userId);

      res.json({
        success: true,
        data: scenario
      });
    } catch (error) {
      console.error('Error generating 3D scenario:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate 3D scenario',
        error: error.message
      });
    }
  }

  async get3DAssets(req, res) {
    try {
      const { category } = req.query;
      const assets = await aiService.get3DAssets(category);

      res.json({
        success: true,
        data: assets
      });
    } catch (error) {
      console.error('Error fetching 3D assets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch 3D assets',
        error: error.message
      });
    }
  }

  async generate3DAvatar(req, res) {
    try {
      const { specifications } = req.body;
      const userId = req.user.id;

      const avatar = await aiService.generate3DAvatar(specifications, userId);

      res.json({
        success: true,
        data: avatar
      });
    } catch (error) {
      console.error('Error generating 3D avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate 3D avatar',
        error: error.message
      });
    }
  }

  // Quiz Generation
  async generateQuiz(req, res) {
    try {
      const { content, difficulty, questionCount } = req.body;
      const userId = req.user.id;

      const quiz = await aiService.generateQuiz(content, difficulty, questionCount, userId);

      res.json({
        success: true,
        data: quiz
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate quiz',
        error: error.message
      });
    }
  }

  async validateQuizAnswers(req, res) {
    try {
      const { quizId, answers } = req.body;
      const userId = req.user.id;

      const validation = await aiService.validateQuizAnswers(quizId, answers, userId);

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error validating quiz answers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate quiz answers',
        error: error.message
      });
    }
  }

  // Learning Path Optimization
  async optimizeLearningPath(req, res) {
    try {
      const { userProfile, objectives } = req.body;
      const userId = req.user.id;

      const optimizedPath = await aiService.optimizeLearningPath(userProfile, objectives, userId);

      res.json({
        success: true,
        data: optimizedPath
      });
    } catch (error) {
      console.error('Error optimizing learning path:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize learning path',
        error: error.message
      });
    }
  }

  async getLearningRecommendations(req, res) {
    try {
      const { userId: targetUserId } = req.params;
      const userId = req.user.id;

      const recommendations = await aiService.getLearningRecommendations(targetUserId, userId);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Error fetching learning recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch learning recommendations',
        error: error.message
      });
    }
  }

  // Real-time Processing
  async startRealtimeProcessing(req, res) {
    try {
      const { sessionId, config } = req.body;
      const userId = req.user.id;

      const session = await aiService.startRealtimeProcessing(sessionId, config, userId);

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Error starting realtime processing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start realtime processing',
        error: error.message
      });
    }
  }

  async getRealtimeStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const status = await aiService.getRealtimeStatus(sessionId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error fetching realtime status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch realtime status',
        error: error.message
      });
    }
  }

  async stopRealtimeProcessing(req, res) {
    try {
      const { sessionId } = req.body;
      const result = await aiService.stopRealtimeProcessing(sessionId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error stopping realtime processing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop realtime processing',
        error: error.message
      });
    }
  }

  // Batch Processing
  async submitBatchJob(req, res) {
    try {
      const { jobType, data } = req.body;
      const userId = req.user.id;

      const job = await aiService.submitBatchJob(jobType, data, userId);

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('Error submitting batch job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit batch job',
        error: error.message
      });
    }
  }

  async getBatchJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      const status = await aiService.getBatchJobStatus(jobId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error fetching batch job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch job status',
        error: error.message
      });
    }
  }

  async getBatchJobResult(req, res) {
    try {
      const { jobId } = req.params;
      const result = await aiService.getBatchJobResult(jobId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching batch job result:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch job result',
        error: error.message
      });
    }
  }

  async getUserBatchJobs(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit, offset } = req.query;

      const jobs = await aiService.getUserBatchJobs(userId, { status, limit, offset });

      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      console.error('Error fetching user batch jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user batch jobs',
        error: error.message
      });
    }
  }

  // Model Management
  async getAvailableModels(req, res) {
    try {
      const models = await aiService.getAvailableModels();

      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      console.error('Error fetching available models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available models',
        error: error.message
      });
    }
  }

  async updateModelConfig(req, res) {
    try {
      const { modelId } = req.params;
      const config = req.body;
      const userId = req.user.id;

      const result = await aiService.updateModelConfig(modelId, config, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error updating model config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update model config',
        error: error.message
      });
    }
  }

  async getModelPerformance(req, res) {
    try {
      const { modelId } = req.params;
      const { timeRange } = req.query;

      const performance = await aiService.getModelPerformance(modelId, timeRange);

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Error fetching model performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch model performance',
        error: error.message
      });
    }
  }

  // Performance Metrics
  async getPerformanceMetrics(req, res) {
    try {
      const { timeRange } = req.query;
      const userId = req.user.id;

      const metrics = await aiService.getPerformanceMetrics(userId, timeRange);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance metrics',
        error: error.message
      });
    }
  }

  async getUsageMetrics(req, res) {
    try {
      const { timeRange } = req.query;
      const userId = req.user.id;

      const usage = await aiService.getUsageMetrics(userId, timeRange);

      res.json({
        success: true,
        data: usage
      });
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage metrics',
        error: error.message
      });
    }
  }

  async getQualityMetrics(req, res) {
    try {
      const { timeRange } = req.query;
      const userId = req.user.id;

      const quality = await aiService.getQualityMetrics(userId, timeRange);

      res.json({
        success: true,
        data: quality
      });
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quality metrics',
        error: error.message
      });
    }
  }

  // Content Analysis
  async analyzeReadability(req, res) {
    try {
      const { content } = req.body;
      const analysis = await aiService.analyzeReadability(content);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error analyzing readability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze readability',
        error: error.message
      });
    }
  }

  async analyzeSentiment(req, res) {
    try {
      const { content } = req.body;
      const sentiment = await aiService.analyzeSentiment(content);

      res.json({
        success: true,
        data: sentiment
      });
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze sentiment',
        error: error.message
      });
    }
  }

  async extractKeywords(req, res) {
    try {
      const { content } = req.body;
      const keywords = await aiService.extractKeywords(content);

      res.json({
        success: true,
        data: keywords
      });
    } catch (error) {
      console.error('Error extracting keywords:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to extract keywords',
        error: error.message
      });
    }
  }

  // Translation
  async translateContent(req, res) {
    try {
      const { content, targetLanguage } = req.body;
      const translation = await aiService.translateContent(content, targetLanguage);

      res.json({
        success: true,
        data: translation
      });
    } catch (error) {
      console.error('Error translating content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to translate content',
        error: error.message
      });
    }
  }

  async getSupportedLanguages(req, res) {
    try {
      const languages = await aiService.getSupportedLanguages();

      res.json({
        success: true,
        data: languages
      });
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supported languages',
        error: error.message
      });
    }
  }

  // Accessibility
  async generateAltText(req, res) {
    try {
      const { imageUrl } = req.body;
      const altText = await aiService.generateAltText(imageUrl);

      res.json({
        success: true,
        data: altText
      });
    } catch (error) {
      console.error('Error generating alt text:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate alt text',
        error: error.message
      });
    }
  }

  async generateCaptions(req, res) {
    try {
      const { videoUrl } = req.body;
      const captions = await aiService.generateCaptions(videoUrl);

      res.json({
        success: true,
        data: captions
      });
    } catch (error) {
      console.error('Error generating captions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate captions',
        error: error.message
      });
    }
  }

  // Custom Workflows
  async createCustomWorkflow(req, res) {
    try {
      const { name, steps } = req.body;
      const userId = req.user.id;

      const workflow = await aiService.createCustomWorkflow(name, steps, userId);

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      console.error('Error creating custom workflow:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create custom workflow',
        error: error.message
      });
    }
  }

  async executeCustomWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await aiService.executeCustomWorkflow(workflowId, data, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error executing custom workflow:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute custom workflow',
        error: error.message
      });
    }
  }

  async getUserWorkflows(req, res) {
    try {
      const userId = req.user.id;
      const workflows = await aiService.getUserWorkflows(userId);

      res.json({
        success: true,
        data: workflows
      });
    } catch (error) {
      console.error('Error fetching user workflows:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user workflows',
        error: error.message
      });
    }
  }

  // Helper method to save to mock database
  async saveToMockDB(collection, data) {
    try {
      const dbPath = path.join(__dirname, '..', 'data', 'mock');
      await fs.mkdir(dbPath, { recursive: true });
      
      const filePath = path.join(dbPath, `${collection}.json`);
      let existingData = [];
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist, start with empty array
      }
      
      existingData.push(data);
      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('Error saving to mock DB:', error);
    }
  }
}

module.exports = new AIController();