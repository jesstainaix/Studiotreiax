import { useState, useEffect, useCallback } from 'react';
import { aiTemplateService, PPTXContent, TemplateRecommendation } from '../services/aiTemplateService';

interface UseAITemplateRecommendationsProps {
  content?: PPTXContent;
  autoAnalyze?: boolean;
  realTimeMode?: boolean;
}

interface UseAITemplateRecommendationsReturn {
  recommendations: TemplateRecommendation[];
  isAnalyzing: boolean;
  error: string | null;
  analyzeContent: (content: PPTXContent) => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  isInitialized: boolean;
}

export function useAITemplateRecommendations({
  content,
  autoAnalyze = false,
  realTimeMode = false
}: UseAITemplateRecommendationsProps = {}): UseAITemplateRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize AI service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await aiTemplateService.initialize();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize AI service');
        setIsInitialized(false);
      }
    };

    initializeService();
  }, []);

  // Analyze content function
  const analyzeContent = useCallback(async (contentToAnalyze: PPTXContent) => {
    if (!isInitialized) {
      setError('AI service not initialized');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let results: TemplateRecommendation[];
      
      if (realTimeMode) {
        // Use faster real-time analysis
        results = await aiTemplateService.getRealtimeRecommendations(contentToAnalyze);
      } else {
        // Use full AI analysis
        results = await aiTemplateService.analyzePPTXContent(contentToAnalyze);
      }

      setRecommendations(results);
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ai_template_analysis', {
          event_category: 'AI',
          event_label: realTimeMode ? 'realtime' : 'full',
          value: results.length
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      console.error('AI template analysis failed:', err);
      
      // Track error
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ai_analysis_error', {
          event_category: 'Error',
          event_label: errorMessage
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [isInitialized, realTimeMode]);

  // Auto-analyze when content changes
  useEffect(() => {
    if (autoAnalyze && content && isInitialized && !isAnalyzing) {
      analyzeContent(content);
    }
  }, [content, autoAnalyze, isInitialized, analyzeContent, isAnalyzing]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    if (content) {
      await analyzeContent(content);
    }
  }, [content, analyzeContent]);

  // Real-time mode: periodically refresh recommendations
  useEffect(() => {
    if (realTimeMode && content && isInitialized) {
      const interval = setInterval(() => {
        if (!isAnalyzing) {
          analyzeContent(content);
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeMode, content, isInitialized, isAnalyzing, analyzeContent]);

  return {
    recommendations,
    isAnalyzing,
    error,
    analyzeContent,
    refreshRecommendations,
    isInitialized
  };
}

// Helper hook for extracting PPTX content
export function usePPTXContentExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractContent = useCallback(async (file: File): Promise<PPTXContent | null> => {
    setIsExtracting(true);
    setError(null);

    try {
      // This would integrate with your existing PPTX processing service
      // For now, return mock data based on file analysis
      const mockContent: PPTXContent = {
        slides: [
          {
            title: 'Introduction',
            content: 'Welcome to our presentation about...',
            images: 1,
            charts: 0,
            tables: 0
          },
          {
            title: 'Main Content',
            content: 'Here we discuss the main topics...',
            images: 2,
            charts: 1,
            tables: 1
          }
        ],
        totalSlides: Math.floor(Math.random() * 20) + 5, // 5-25 slides
        estimatedDuration: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
        topics: ['business', 'strategy', 'growth'],
        complexity: Math.random() > 0.6 ? 'advanced' : Math.random() > 0.3 ? 'intermediate' : 'basic'
      };

      return mockContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Content extraction failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return {
    extractContent,
    isExtracting,
    error
  };
}

// Helper function to create sample PPTX content for testing
export function createSamplePPTXContent(): PPTXContent {
  return {
    slides: [
      {
        title: 'Estratégia de Crescimento 2025',
        content: 'Apresentação dos principais objetivos e metas para o próximo ano fiscal, incluindo análise de mercado e oportunidades de expansão.',
        images: 2,
        charts: 1,
        tables: 0
      },
      {
        title: 'Análise de Mercado',
        content: 'Dados atualizados sobre tendências do setor, comportamento do consumidor e análise competitiva detalhada.',
        images: 1,
        charts: 3,
        tables: 2
      },
      {
        title: 'Resultados Financeiros',
        content: 'Demonstrativo de resultados do último trimestre com projeções para os próximos períodos.',
        images: 0,
        charts: 4,
        tables: 3
      },
      {
        title: 'Plano de Ação',
        content: 'Cronograma detalhado das ações estratégicas, responsáveis e marcos importantes para implementação.',
        images: 1,
        charts: 1,
        tables: 1
      }
    ],
    totalSlides: 15,
    estimatedDuration: 25,
    topics: ['business', 'strategy', 'finance', 'growth'],
    complexity: 'intermediate'
  };
}