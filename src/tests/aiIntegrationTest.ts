// Teste de Integração dos Serviços de IA
import { useContentAnalysis } from '../services/aiContentAnalysisService';
import { useSubtitleGeneration } from '../services/aiSubtitleService';
import { useVoiceTranscription } from '../services/aiVoiceTranscriptionService';
import { useSmartEditing } from '../services/aiSmartEditingService';

// Interface para resultados do teste
interface TestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  totalDuration: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
}

// Classe principal de testes
export class AIIntegrationTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  // Executar todos os testes
  async runAllTests(): Promise<TestSuite> {
    
    this.results = [];
    const testStartTime = Date.now();

    // Testes dos serviços
    await this.testContentAnalysisService();
    await this.testSubtitleService();
    await this.testVoiceTranscriptionService();
    await this.testSmartEditingService();
    
    // Testes de integração
    await this.testServiceIntegration();
    await this.testPerformance();
    await this.testErrorHandling();

    const totalDuration = Date.now() - testStartTime;
    
    const suite: TestSuite = {
      name: 'AI Services Integration Test',
      results: this.results,
      totalDuration,
      successCount: this.results.filter(r => r.status === 'success').length,
      errorCount: this.results.filter(r => r.status === 'error').length,
      warningCount: this.results.filter(r => r.status === 'warning').length
    };

    this.printResults(suite);
    return suite;
  }

  // Teste do serviço de análise de conteúdo
  private async testContentAnalysisService(): Promise<void> {
    const testStart = Date.now();
    
    try {
      
      // Simular dados de teste
      const mockVideoData = {
        id: 'test-video-1',
        url: 'test://video.mp4',
        duration: 120,
        metadata: {
          width: 1920,
          height: 1080,
          fps: 30
        }
      };

      // Teste básico de inicialização
      const contentAnalysis = useContentAnalysis.getState();
      
      if (typeof contentAnalysis.analyzeVideo === 'function') {
        this.addResult({
          service: 'Content Analysis',
          status: 'success',
          message: 'Serviço inicializado corretamente',
          duration: Date.now() - testStart
        });
      } else {
        throw new Error('Função analyzeVideo não encontrada');
      }

      // Teste de análise de vídeo
      await contentAnalysis.analyzeVideo(mockVideoData.id, mockVideoData.url);
      
      // Verificar se a análise foi armazenada
      const analysis = contentAnalysis.getAnalysis(mockVideoData.id);
      if (analysis) {
        this.addResult({
          service: 'Content Analysis - Video Analysis',
          status: 'success',
          message: 'Análise de vídeo executada com sucesso',
          duration: Date.now() - testStart,
          details: { analysisId: analysis.id }
        });
      } else {
        this.addResult({
          service: 'Content Analysis - Video Analysis',
          status: 'warning',
          message: 'Análise executada mas não armazenada',
          duration: Date.now() - testStart
        });
      }

    } catch (error) {
      this.addResult({
        service: 'Content Analysis',
        status: 'error',
        message: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - testStart
      });
    }
  }

  // Teste do serviço de legendas
  private async testSubtitleService(): Promise<void> {
    const testStart = Date.now();
    
    try {
      
      const subtitleService = useSubtitleGeneration.getState();
      
      // Teste de inicialização
      if (typeof subtitleService.generateSubtitles === 'function') {
        this.addResult({
          service: 'Subtitle Generation',
          status: 'success',
          message: 'Serviço inicializado corretamente',
          duration: Date.now() - testStart
        });
      } else {
        throw new Error('Função generateSubtitles não encontrada');
      }

      // Teste de geração de legendas
      const mockAudioData = {
        audioUrl: 'test://audio.mp3',
        language: 'pt-BR' as const,
        options: {
          speakerDetection: true,
          emotionAnalysis: true,
          autoSync: true
        }
      };

      await subtitleService.generateSubtitles(
        mockAudioData.audioUrl,
        mockAudioData.language,
        mockAudioData.options
      );

      this.addResult({
        service: 'Subtitle Generation - Generate',
        status: 'success',
        message: 'Geração de legendas executada com sucesso',
        duration: Date.now() - testStart
      });

    } catch (error) {
      this.addResult({
        service: 'Subtitle Generation',
        status: 'error',
        message: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - testStart
      });
    }
  }

  // Teste do serviço de transcrição de voz
  private async testVoiceTranscriptionService(): Promise<void> {
    const testStart = Date.now();
    
    try {
      
      const transcriptionService = useVoiceTranscription.getState();
      
      // Teste de inicialização
      if (typeof transcriptionService.startRecording === 'function') {
        this.addResult({
          service: 'Voice Transcription',
          status: 'success',
          message: 'Serviço inicializado corretamente',
          duration: Date.now() - testStart
        });
      } else {
        throw new Error('Função startRecording não encontrada');
      }

      // Teste de criação de sessão
      const sessionId = transcriptionService.createSession({
        name: 'Teste de Integração',
        language: 'pt-BR',
        options: {
          realTimeTranscription: true,
          speakerIdentification: true,
          emotionDetection: true
        }
      });

      if (sessionId) {
        this.addResult({
          service: 'Voice Transcription - Session',
          status: 'success',
          message: 'Sessão de transcrição criada com sucesso',
          duration: Date.now() - testStart,
          details: { sessionId }
        });
      } else {
        throw new Error('Falha ao criar sessão de transcrição');
      }

    } catch (error) {
      this.addResult({
        service: 'Voice Transcription',
        status: 'error',
        message: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - testStart
      });
    }
  }

  // Teste do serviço de edição inteligente
  private async testSmartEditingService(): Promise<void> {
    const testStart = Date.now();
    
    try {
      
      const smartEditingService = useSmartEditing.getState();
      
      // Teste de inicialização
      if (typeof smartEditingService.analyzeContent === 'function') {
        this.addResult({
          service: 'Smart Editing',
          status: 'success',
          message: 'Serviço inicializado corretamente',
          duration: Date.now() - testStart
        });
      } else {
        throw new Error('Função analyzeContent não encontrada');
      }

      // Teste de análise de conteúdo
      const mockClipIds = ['clip-1', 'clip-2'];
      await smartEditingService.analyzeContent(mockClipIds);

      // Teste de geração de sugestões
      await smartEditingService.refreshSuggestions(mockClipIds);

      const suggestions = smartEditingService.getFilteredSuggestions();
      
      this.addResult({
        service: 'Smart Editing - Suggestions',
        status: 'success',
        message: `Sugestões geradas com sucesso (${suggestions.length} sugestões)`,
        duration: Date.now() - testStart,
        details: { suggestionsCount: suggestions.length }
      });

    } catch (error) {
      this.addResult({
        service: 'Smart Editing',
        status: 'error',
        message: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - testStart
      });
    }
  }

  // Teste de integração entre serviços
  private async testServiceIntegration(): Promise<void> {
    const testStart = Date.now();
    
    try {
      
      // Simular fluxo completo: análise → transcrição → legendas → sugestões
      const contentAnalysis = useContentAnalysis.getState();
      const transcriptionService = useVoiceTranscription.getState();
      const subtitleService = useSubtitleGeneration.getState();
      const smartEditingService = useSmartEditing.getState();

      // 1. Análise de conteúdo
      await contentAnalysis.analyzeVideo('integration-test', 'test://video.mp4');
      
      // 2. Transcrição
      const sessionId = transcriptionService.createSession({
        name: 'Integração Test',
        language: 'pt-BR'
      });
      
      // 3. Geração de legendas
      await subtitleService.generateSubtitles('test://audio.mp3', 'pt-BR');
      
      // 4. Sugestões inteligentes
      await smartEditingService.analyzeContent(['integration-test']);

      this.addResult({
        service: 'Service Integration',
        status: 'success',
        message: 'Integração entre serviços funcionando corretamente',
        duration: Date.now() - testStart
      });

    } catch (error) {
      this.addResult({
        service: 'Service Integration',
        status: 'error',
        message: `Erro na integração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - testStart
      });
    }
  }

  // Teste de performance
  private async testPerformance(): Promise<void> {
    const testStart = Date.now();
    
    try {
      
      const performanceTests = [];
      
      // Teste de múltiplas análises simultâneas
      const contentAnalysis = useContentAnalysis.getState();
      
      const simultaneousAnalyses = Array.from({ length: 5 }, (_, i) => 
        contentAnalysis.analyzeVideo(`perf-test-${i}`, `test://video-${i}.mp4`)
      );
      
      const analysisStart = Date.now();
      await Promise.all(simultaneousAnalyses);
      const analysisTime = Date.now() - analysisStart;
      
      if (analysisTime < 10000) { // Menos de 10 segundos
        this.addResult({
          service: 'Performance - Concurrent Analysis',
          status: 'success',
          message: `Análises simultâneas completadas em ${analysisTime}ms`,
          duration: analysisTime
        });
      } else {
        this.addResult({
          service: 'Performance - Concurrent Analysis',
          status: 'warning',
          message: `Análises simultâneas lentas: ${analysisTime}ms`,
          duration: analysisTime
        });
      }

      // Teste de memória
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Executar operações que consomem memória
      const smartEditing = useSmartEditing.getState();
      await smartEditing.analyzeContent(Array.from({ length: 20 }, (_, i) => `memory-test-${i}`));
      
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      if (memoryIncrease < 50 * 1024 * 1024) { // Menos de 50MB
        this.addResult({
          service: 'Performance - Memory Usage',
          status: 'success',
          message: `Uso de memória controlado: +${Math.round(memoryIncrease / 1024 / 1024)}MB`,
          duration: Date.now() - testStart
        });
      } else {
        this.addResult({
          service: 'Performance - Memory Usage',
          status: 'warning',
          message: `Alto uso de memória: +${Math.round(memoryIncrease / 1024 / 1024)}MB`,
          duration: Date.now() - testStart
        });
      }

    } catch (error) {
      this.addResult({
        service: 'Performance',
        status: 'error',
        message: `Erro no teste de performance: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - testStart
      });
    }
  }

  // Teste de tratamento de erros
  private async testErrorHandling(): Promise<void> {
    const testStart = Date.now();
    
    try {
      
      const contentAnalysis = useContentAnalysis.getState();
      
      // Teste com URL inválida
      try {
        await contentAnalysis.analyzeVideo('error-test', 'invalid://url');
        this.addResult({
          service: 'Error Handling - Invalid URL',
          status: 'warning',
          message: 'Erro não foi capturado adequadamente',
          duration: Date.now() - testStart
        });
      } catch (error) {
        this.addResult({
          service: 'Error Handling - Invalid URL',
          status: 'success',
          message: 'Erro capturado corretamente para URL inválida',
          duration: Date.now() - testStart
        });
      }

      // Teste com dados malformados
      const subtitleService = useSubtitleGeneration.getState();
      
      try {
        await subtitleService.generateSubtitles('', 'invalid-lang' as any);
        this.addResult({
          service: 'Error Handling - Invalid Data',
          status: 'warning',
          message: 'Dados inválidos não foram rejeitados',
          duration: Date.now() - testStart
        });
      } catch (error) {
        this.addResult({
          service: 'Error Handling - Invalid Data',
          status: 'success',
          message: 'Dados inválidos rejeitados corretamente',
          duration: Date.now() - testStart
        });
      }

    } catch (error) {
      this.addResult({
        service: 'Error Handling',
        status: 'error',
        message: `Erro no teste de tratamento de erros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - testStart
      });
    }
  }

  // Adicionar resultado do teste
  private addResult(result: TestResult): void {
    this.results.push(result);
    
    const statusEmoji = {
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
  }

  // Imprimir resultados finais
  private printResults(suite: TestSuite): void {
    
    if (suite.errorCount > 0) {
      suite.results
        .filter(r => r.status === 'error')
        .forEach(r => console.error(`❌ ${r.message}`));
    }
    
    if (suite.warningCount > 0) {
      suite.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.warn(`⚠️ ${r.message}`));
    }
    
    // Recomendações
    if (suite.errorCount === 0 && suite.warningCount === 0) {
    } else if (suite.errorCount === 0) {
    } else {
    }
  }
}

// Função utilitária para executar testes
export const runAIIntegrationTests = async (): Promise<TestSuite> => {
  const tester = new AIIntegrationTester();
  return await tester.runAllTests();
};

// Função para executar testes específicos
export const runSpecificTest = async (testName: string): Promise<TestResult[]> => {
  const tester = new AIIntegrationTester();
  
  switch (testName) {
    case 'content-analysis':
      await (tester as any).testContentAnalysisService();
      break;
    case 'subtitle':
      await (tester as any).testSubtitleService();
      break;
    case 'transcription':
      await (tester as any).testVoiceTranscriptionService();
      break;
    case 'smart-editing':
      await (tester as any).testSmartEditingService();
      break;
    case 'integration':
      await (tester as any).testServiceIntegration();
      break;
    case 'performance':
      await (tester as any).testPerformance();
      break;
    case 'error-handling':
      await (tester as any).testErrorHandling();
      break;
    default:
      throw new Error(`Teste '${testName}' não encontrado`);
  }
  
  return (tester as any).results;
};

// Hook para usar os testes em componentes React
export const useAIIntegrationTests = () => {
  const [isRunning, setIsRunning] = React.useState(false);
  const [results, setResults] = React.useState<TestSuite | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const testResults = await runAIIntegrationTests();
      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsRunning(false);
    }
  };

  const runSpecificTestHook = async (testName: string) => {
    setIsRunning(true);
    setError(null);
    
    try {
      const testResults = await runSpecificTest(testName);
      // Converter para formato TestSuite
      const suite: TestSuite = {
        name: `Teste Específico: ${testName}`,
        results: testResults,
        totalDuration: testResults.reduce((sum, r) => sum + r.duration, 0),
        successCount: testResults.filter(r => r.status === 'success').length,
        errorCount: testResults.filter(r => r.status === 'error').length,
        warningCount: testResults.filter(r => r.status === 'warning').length
      };
      setResults(suite);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    results,
    error,
    runTests,
    runSpecificTest: runSpecificTestHook,
    clearResults: () => setResults(null),
    clearError: () => setError(null)
  };
};

// Exportar tipos para uso externo
export type { TestResult, TestSuite };