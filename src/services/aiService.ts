import { apiClient } from '../lib/api';
import { ttsService, TTSRequest, TTSResponse } from './ttsService';

// Interfaces para requests e responses
export interface ScriptGenerationRequest {
  topic: string;
  duration: number;
  targetAudience: string;
  tone: 'formal' | 'casual' | 'educational' | 'entertaining';
  language: string;
  includeVisuals?: boolean;
  customInstructions?: string;
}

export interface ScriptGenerationResponse {
  script: string;
  scenes: Array<{
    id: string;
    content: string;
    duration: number;
    visualSuggestions?: string[];
    audioNotes?: string;
  }>;
  metadata: {
    totalDuration: number;
    wordCount: number;
    estimatedReadingTime: number;
    complexity: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface ComplianceAnalysisRequest {
  content: string;
  nrReferences?: string[];
  analysisType: 'full' | 'quick' | 'specific';
  industry?: string;
}

export interface ComplianceAnalysisResponse {
  id: string;
  score: number;
  issues: ComplianceIssue[];
  recommendations: string[];
  nrCompliance: NRCompliance[];
  summary: string;
  detailedReport: string;
}

export interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  nrReference?: string;
  location?: {
    line: number;
    column: number;
    context: string;
  };
}

export interface NRCompliance {
  nr: string;
  name: string;
  compliance: number;
  requirements: string[];
  status: 'compliant' | 'partial' | 'non-compliant';
  gaps: string[];
  recommendations: string[];
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'improvement' | 'warning' | 'success';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ContentOptimizationRequest {
  content: string;
  targetAudience: string;
  objectives: string[];
  constraints?: {
    maxDuration?: number;
    readabilityLevel?: string;
    complianceRequirements?: string[];
  };
}

export interface ContentOptimizationResponse {
  optimizedContent: string;
  improvements: {
    type: string;
    description: string;
    impact: string;
  }[];
  metrics: {
    readabilityImprovement: number;
    engagementScore: number;
    complianceScore: number;
  };
}

export interface NarrativeGenerationRequest {
  script: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  emotion?: string;
  style?: 'narration' | 'dialogue' | 'presentation';
  generateAudio?: boolean;
  ttsProvider?: string;
}

export interface NarrativeGenerationResponse {
  id: string;
  script: string;
  audioUrl?: string;
  audioBuffer?: ArrayBuffer;
  audioDuration?: number;
  transcript?: string;
  ttsProvider?: string;
  ttsError?: string;
  ttsMetadata?: {
    charactersUsed: number;
    cost?: number;
    processingTime: number;
  };
  metadata: {
    voice?: string;
    language?: string;
    processingTime: number;
    fileSize?: number;
  };
  timestamps?: {
    text: string;
    start: number;
    end: number;
  }[];
}

class AIService {
  private baseUrl = '/api/ai';

  // Script Generation
  async generateScript(request: ScriptGenerationRequest): Promise<ScriptGenerationResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/generate-script`, request);
      return response.data;
    } catch (error) {
      console.error('Error generating script:', error);
      throw new Error('Failed to generate script');
    }
  }

  async getScriptTemplates(nrType?: string): Promise<any[]> {
    try {
      const params = nrType ? { nr: nrType } : {};
      const response = await apiClient.get(`${this.baseUrl}/script-templates`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching script templates:', error);
      throw new Error('Failed to fetch script templates');
    }
  }

  // Compliance Analysis
  async analyzeCompliance(request: ComplianceAnalysisRequest): Promise<ComplianceAnalysisResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/analyze-compliance`, request);
      return response.data;
    } catch (error) {
      console.error('Error analyzing compliance:', error);
      throw new Error('Failed to analyze compliance');
    }
  }

  async getComplianceRules(nrType: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/compliance-rules/${nrType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching compliance rules:', error);
      throw new Error('Failed to fetch compliance rules');
    }
  }

  // Content Optimization
  async optimizeContent(request: ContentOptimizationRequest): Promise<ContentOptimizationResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/optimize-content`, request);
      return response.data;
    } catch (error) {
      console.error('Error optimizing content:', error);
      throw new Error('Failed to optimize content');
    }
  }

  // Narrative Generation
  async generateNarrative(request: NarrativeGenerationRequest): Promise<NarrativeGenerationResponse> {
    try {
      // Generate script content first
      const response = await apiClient.post(`${this.baseUrl}/generate-narrative`, request);
      const narrativeData = response.data;
      
      // Generate audio using TTS service if requested
      if (request.generateAudio && narrativeData.script) {
        const ttsRequest: TTSRequest = {
          text: narrativeData.script,
          voice: request.voice || 'default',
          language: request.language || 'pt-BR',
          provider: request.ttsProvider,
          speed: request.speed || 1.0,
          pitch: request.pitch || 0.0,
          format: 'mp3'
        };
        
        try {
          const ttsResponse: TTSResponse = await ttsService.synthesizeSpeech(ttsRequest);
          
          if (ttsResponse.success) {
            narrativeData.audioUrl = ttsResponse.audioUrl;
            narrativeData.audioBuffer = ttsResponse.audioBuffer;
            narrativeData.audioDuration = ttsResponse.duration;
            narrativeData.ttsProvider = ttsResponse.provider;
            narrativeData.ttsMetadata = ttsResponse.metadata;
          } else {
            console.warn('TTS generation failed:', ttsResponse.error);
            narrativeData.ttsError = ttsResponse.error;
          }
        } catch (ttsError) {
          console.error('TTS service error:', ttsError);
          narrativeData.ttsError = (ttsError as Error).message;
        }
      }
      
      return narrativeData;
    } catch (error) {
      console.error('Error generating narrative:', error);
      throw new Error('Failed to generate narrative');
    }
  }

  async getNarrativeStatus(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/narrative-status/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching narrative status:', error);
      throw new Error('Failed to fetch narrative status');
    }
  }

  // AI Insights
  async getInsights(projectId?: string, timeRange?: string): Promise<AIInsight[]> {
    try {
      const params: any = {};
      if (projectId) params.projectId = projectId;
      if (timeRange) params.timeRange = timeRange;
      
      const response = await apiClient.get(`${this.baseUrl}/insights`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      throw new Error('Failed to fetch AI insights');
    }
  }

  async generateInsight(data: any): Promise<AIInsight> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/generate-insight`, data);
      return response.data;
    } catch (error) {
      console.error('Error generating insight:', error);
      throw new Error('Failed to generate insight');
    }
  }

  // Content Analysis
  async analyzeContentEngagement(content: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/analyze-engagement`, { content });
      return response.data;
    } catch (error) {
      console.error('Error analyzing content engagement:', error);
      throw new Error('Failed to analyze content engagement');
    }
  }

  async suggestImprovements(content: string, context: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/suggest-improvements`, {
        content,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      throw new Error('Failed to suggest improvements');
    }
  }

  // 3D Content Generation
  async generate3DScenario(description: string, nrType: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/generate-3d-scenario`, {
        description,
        nrType
      });
      return response.data;
    } catch (error) {
      console.error('Error generating 3D scenario:', error);
      throw new Error('Failed to generate 3D scenario');
    }
  }

  async get3DAssets(category?: string): Promise<any[]> {
    try {
      const params = category ? { category } : {};
      const response = await apiClient.get(`${this.baseUrl}/3d-assets`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching 3D assets:', error);
      throw new Error('Failed to fetch 3D assets');
    }
  }

  // Quiz Generation
  async generateQuiz(content: string, difficulty: string, questionCount: number): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/generate-quiz`, {
        content,
        difficulty,
        questionCount
      });
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  // Learning Path Optimization
  async optimizeLearningPath(userProfile: any, objectives: string[]): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/optimize-learning-path`, {
        userProfile,
        objectives
      });
      return response.data;
    } catch (error) {
      console.error('Error optimizing learning path:', error);
      throw new Error('Failed to optimize learning path');
    }
  }

  // Real-time Processing
  async startRealtimeProcessing(sessionId: string, config: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/realtime/start`, {
        sessionId,
        config
      });
      return response.data;
    } catch (error) {
      console.error('Error starting realtime processing:', error);
      throw new Error('Failed to start realtime processing');
    }
  }

  async getRealtimeStatus(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/realtime/status/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching realtime status:', error);
      throw new Error('Failed to fetch realtime status');
    }
  }

  async stopRealtimeProcessing(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/realtime/stop`, { sessionId });
      return response.data;
    } catch (error) {
      console.error('Error stopping realtime processing:', error);
      throw new Error('Failed to stop realtime processing');
    }
  }

  // Batch Processing
  async submitBatchJob(jobType: string, data: any): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/batch/submit`, {
        jobType,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting batch job:', error);
      throw new Error('Failed to submit batch job');
    }
  }

  async getBatchJobStatus(jobId: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/batch/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch job status:', error);
      throw new Error('Failed to fetch batch job status');
    }
  }

  async getBatchJobResult(jobId: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/batch/result/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch job result:', error);
      throw new Error('Failed to fetch batch job result');
    }
  }

  // Model Management
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/models`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw new Error('Failed to fetch available models');
    }
  }

  async updateModelConfig(modelId: string, config: any): Promise<any> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/models/${modelId}/config`, config);
      return response.data;
    } catch (error) {
      console.error('Error updating model config:', error);
      throw new Error('Failed to update model config');
    }
  }

  // Performance Metrics
  async getPerformanceMetrics(timeRange?: string): Promise<any> {
    try {
      const params = timeRange ? { timeRange } : {};
      const response = await apiClient.get(`${this.baseUrl}/metrics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }
}

export const aiService = new AIService();
export default aiService;