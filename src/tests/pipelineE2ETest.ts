/**
 * Teste End-to-End do Pipeline PPTX→Vídeo Otimizado
 * Validação completa do sistema com retry logic e monitoramento
 */

import { enhancedPipelineService } from '../services/enhancedPipelineOrchestrationService';
import { pipelineMonitor } from '../services/pipelineMonitoringService';
import { pipelineRetryService } from '../services/pipelineRetryService';

interface TestResult {
  success: boolean;
  duration: number;
  stages: string[];
  errors: string[];
  retries: number;
  metrics: any;
}

class PipelineE2ETest {
  private testResults: TestResult[] = [];

  /**
   * Executar teste completo do pipeline
   */
  async runCompleteTest(): Promise<TestResult> {
    
    const startTime = Date.now();
    const testFile = this.createTestPPTXFile();
    const stages: string[] = [];
    const errors: string[] = [];
    let retries = 0;

    try {
      const result = await enhancedPipelineService.startEnhancedPipeline(
        testFile,
        {
          onStageUpdate: (stage) => {
            stages.push(`${stage.id}: ${stage.status}`);
          },
          onPipelineError: (error, stage) => {
            errors.push(`${stage}: ${error}`);
            console.error(`❌ Pipeline error in ${stage}:`, error);
          },
          onRetry: (stage, attempt) => {
            retries++;
          },
          onProgressUpdate: (progress) => {
          }
        }
      );

      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        success: true,
        duration,
        stages,
        errors,
        retries,
        metrics: result.metrics
      };

      this.testResults.push(testResult);
      this.logTestResults(testResult);
      
      return testResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        success: false,
        duration,
        stages,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
        retries,
        metrics: null
      };

      this.testResults.push(testResult);
      console.error('❌ Teste E2E falhou:', error);
      this.logTestResults(testResult);
      
      throw testResult;
    }
  }

  /**
   * Teste de stress com múltiplos arquivos
   */
  async runStressTest(concurrentJobs: number = 3): Promise<TestResult[]> {
    
    const promises = Array(concurrentJobs).fill(null).map((_, index) => {
      return this.runSingleStressTest(index);
    });

    try {
      const results = await Promise.all(promises);
      this.logStressResults(results);
      return results;

    } catch (error) {
      console.error('❌ Teste de stress falhou:', error);
      throw error;
    }
  }

  /**
   * Teste individual de stress
   */
  private async runSingleStressTest(jobIndex: number): Promise<TestResult> {
    const testFile = this.createTestPPTXFile(`stress-test-${jobIndex}`);
    const startTime = Date.now();
    
    try {
      await enhancedPipelineService.startEnhancedPipeline(testFile);
      
      return {
        success: true,
        duration: Date.now() - startTime,
        stages: ['all-completed'],
        errors: [],
        retries: 0,
        metrics: null
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        stages: ['failed'],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        retries: 0,
        metrics: null
      };
    }
  }

  /**
   * Teste de recuperação de falhas
   */
  async runFailureRecoveryTest(): Promise<TestResult> {
    
    // Simular arquivo corrompido
    const corruptedFile = this.createCorruptedPPTXFile();
    
    try {
      await enhancedPipelineService.startEnhancedPipeline(corruptedFile);
      
      return {
        success: false, // Deveria falhar
        duration: 0,
        stages: [],
        errors: ['Test should have failed but succeeded'],
        retries: 0,
        metrics: null
      };

    } catch (error) {
      
      return {
        success: true, // Sucesso ao detectar falha
        duration: 0,
        stages: ['failure-detected'],
        errors: [],
        retries: 0,
        metrics: null
      };
    }
  }

  /**
   * Teste de performance
   */
  async runPerformanceTest(): Promise<{
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    successRate: number;
    totalRetries: number;
  }> {
    
    const testCount = 5;
    const results: TestResult[] = [];
    
    for (let i = 0; i < testCount; i++) {
      try {
        const result = await this.runCompleteTest();
        results.push(result);
      } catch (error) {
        if (error && typeof error === 'object' && 'duration' in error) {
          results.push(error as TestResult);
        }
      }
    }

    const durations = results.map(r => r.duration);
    const successes = results.filter(r => r.success).length;
    const totalRetries = results.reduce((sum, r) => sum + r.retries, 0);

    const performanceMetrics = {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      successRate: (successes / testCount) * 100,
      totalRetries
    };
    return performanceMetrics;
  }

  /**
   * Criar arquivo PPTX de teste
   */
  private createTestPPTXFile(name: string = 'test-presentation'): File {
    const content = new Blob(['Mock PPTX content for testing'], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
    
    return new File([content], `${name}.pptx`, {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      lastModified: Date.now()
    });
  }

  /**
   * Criar arquivo PPTX corrompido para teste de falha
   */
  private createCorruptedPPTXFile(): File {
    const content = new Blob(['Invalid content'], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
    
    return new File([content], 'corrupted.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      lastModified: Date.now()
    });
  }

  /**
   * Log resultados do teste
   */
  private logTestResults(result: TestResult) {
    
    if (result.errors.length > 0) {
      result.errors.forEach(error =>
    }
  }

  /**
   * Log resultados do teste de stress
   */
  private logStressResults(results: TestResult[]) {
    
    const successes = results.filter(r => r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / results.length;
  }

  /**
   * Obter métricas consolidadas
   */
  getConsolidatedMetrics() {
    return {
      testResults: this.testResults,
      systemMetrics: pipelineMonitor.getConsolidatedStats(),
      pipelineState: enhancedPipelineService.getCurrentState()
    };
  }

  /**
   * Executar suite completa de testes
   */
  async runCompleteTestSuite(): Promise<{
    e2e: TestResult;
    stress: TestResult[];
    failureRecovery: TestResult;
    performance: any;
    systemHealth: any;
  }> {
    
    try {
      // 1. Teste E2E básico
      const e2e = await this.runCompleteTest();
      
      // 2. Teste de recuperação de falhas
      const failureRecovery = await this.runFailureRecoveryTest();
      
      // 3. Teste de stress
      const stress = await this.runStressTest(2);
      
      // 4. Teste de performance
      const performance = await this.runPerformanceTest();
      
      // 5. Health check final
      const systemHealth = pipelineMonitor.generateHealthReport();
      
      return {
        e2e,
        stress,
        failureRecovery,
        performance,
        systemHealth
      };
      
    } catch (error) {
      console.error('\n❌ Suite de testes falhou:', error);
      throw error;
    }
  }
}

// Export instância para uso
export const pipelineE2ETest = new PipelineE2ETest();

export type { TestResult };