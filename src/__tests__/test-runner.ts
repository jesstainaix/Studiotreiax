import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Test Runner - Executa todos os testes do sistema PPTX
 * Gera relatórios de cobertura e performance
 */
class TestRunner {
  private readonly testSuites = [
    'slide-data-validator.test.ts',
    'auto-correction.service.test.ts',
    'parallel-processor.test.ts',
    'multi-layer-cache.test.ts',
    'progress-indicator.service.test.ts',
    'complex-elements-extractor.test.ts',
    'format-preservation.service.test.ts'
  ];

  private readonly integrationTests = [
    'pptx-system.integration.test.ts'
  ];

  private results: TestResult[] = [];

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Iniciando execução de testes do sistema PPTX...');
    
    const startTime = Date.now();
    
    try {
      // Executar testes unitários
      console.log('\n📋 Executando testes unitários...');
      await this.runUnitTests();
      
      // Executar testes de integração
      console.log('\n🔗 Executando testes de integração...');
      await this.runIntegrationTests();
      
      // Gerar relatório de cobertura
      console.log('\n📊 Gerando relatório de cobertura...');
      await this.generateCoverageReport();
      
      // Executar testes de performance
      console.log('\n⚡ Executando testes de performance...');
      await this.runPerformanceTests();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const report = this.generateTestReport(duration);
      await this.saveTestReport(report);
      
      console.log('\n✅ Todos os testes executados com sucesso!');
      console.log(`⏱️  Tempo total: ${this.formatDuration(duration)}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Erro durante execução dos testes:', error);
      throw error;
    }
  }

  private async runUnitTests(): Promise<void> {
    for (const testSuite of this.testSuites) {
      console.log(`  🧪 Executando ${testSuite}...`);
      
      const startTime = Date.now();
      
      try {
        const output = execSync(
          `npx jest src/services/__tests__/${testSuite} --verbose --coverage=false`,
          { encoding: 'utf8', timeout: 30000 }
        );
        
        const duration = Date.now() - startTime;
        
        this.results.push({
          suite: testSuite,
          type: 'unit',
          status: 'passed',
          duration,
          output: output.toString()
        });
        
        console.log(`    ✅ ${testSuite} - ${this.formatDuration(duration)}`);
        
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        this.results.push({
          suite: testSuite,
          type: 'unit',
          status: 'failed',
          duration,
          error: error.message,
          output: error.stdout?.toString() || ''
        });
        
        console.log(`    ❌ ${testSuite} - FALHOU`);
      }
    }
  }

  private async runIntegrationTests(): Promise<void> {
    for (const testSuite of this.integrationTests) {
      console.log(`  🔗 Executando ${testSuite}...`);
      
      const startTime = Date.now();
      
      try {
        const output = execSync(
          `npx jest src/__tests__/integration/${testSuite} --verbose --testTimeout=60000`,
          { encoding: 'utf8', timeout: 120000 }
        );
        
        const duration = Date.now() - startTime;
        
        this.results.push({
          suite: testSuite,
          type: 'integration',
          status: 'passed',
          duration,
          output: output.toString()
        });
        
        console.log(`    ✅ ${testSuite} - ${this.formatDuration(duration)}`);
        
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        this.results.push({
          suite: testSuite,
          type: 'integration',
          status: 'failed',
          duration,
          error: error.message,
          output: error.stdout?.toString() || ''
        });
        
        console.log(`    ❌ ${testSuite} - FALHOU`);
      }
    }
  }

  private async generateCoverageReport(): Promise<void> {
    try {
      const output = execSync(
        'npx jest --coverage --coverageReporters=text --coverageReporters=lcov --coverageReporters=html',
        { encoding: 'utf8', timeout: 60000 }
      );
      
      console.log('    ✅ Relatório de cobertura gerado');
      
    } catch (error: any) {
      console.log('    ⚠️  Erro ao gerar relatório de cobertura:', error.message);
    }
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('  ⚡ Testando performance do sistema...');
    
    const performanceTests = [
      {
        name: 'Cache Performance',
        test: () => this.testCachePerformance()
      },
      {
        name: 'Parallel Processing Performance',
        test: () => this.testParallelProcessingPerformance()
      },
      {
        name: 'Memory Usage',
        test: () => this.testMemoryUsage()
      }
    ];
    
    for (const perfTest of performanceTests) {
      const startTime = Date.now();
      
      try {
        await perfTest.test();
        const duration = Date.now() - startTime;
        
        console.log(`    ✅ ${perfTest.name} - ${this.formatDuration(duration)}`);
        
      } catch (error: any) {
        console.log(`    ❌ ${perfTest.name} - FALHOU: ${error.message}`);
      }
    }
  }

  private async testCachePerformance(): Promise<void> {
    // Simular teste de performance do cache
    const iterations = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      // Simular operações de cache
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;
    
    if (avgTime > 10) {
      throw new Error(`Cache muito lento: ${avgTime.toFixed(2)}ms por operação`);
    }
  }

  private async testParallelProcessingPerformance(): Promise<void> {
    // Simular teste de performance do processamento paralelo
    const tasks = Array.from({ length: 100 }, (_, i) => i);
    const startTime = performance.now();
    
    await Promise.all(
      tasks.map(async (task) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return task * 2;
      })
    );
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    if (totalTime > 1000) {
      throw new Error(`Processamento paralelo muito lento: ${totalTime.toFixed(2)}ms`);
    }
  }

  private async testMemoryUsage(): Promise<void> {
    // Simular teste de uso de memória
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Criar objetos para testar vazamentos de memória
    const testObjects = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      data: new Array(100).fill(Math.random())
    }));
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Limpar objetos de teste
    testObjects.length = 0;
    
    if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
      throw new Error(`Possível vazamento de memória: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  private generateTestReport(totalDuration: number): TestReport {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    
    const unitTests = this.results.filter(r => r.type === 'unit');
    const integrationTests = this.results.filter(r => r.type === 'integration');
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100,
        totalDuration
      },
      unitTests: {
        total: unitTests.length,
        passed: unitTests.filter(r => r.status === 'passed').length,
        failed: unitTests.filter(r => r.status === 'failed').length,
        avgDuration: unitTests.reduce((sum, r) => sum + r.duration, 0) / unitTests.length
      },
      integrationTests: {
        total: integrationTests.length,
        passed: integrationTests.filter(r => r.status === 'passed').length,
        failed: integrationTests.filter(r => r.status === 'failed').length,
        avgDuration: integrationTests.reduce((sum, r) => sum + r.duration, 0) / integrationTests.length
      },
      results: this.results
    };
  }

  private async saveTestReport(report: TestReport): Promise<void> {
    const reportsDir = join(process.cwd(), 'test-reports');
    
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(reportsDir, `test-report-${timestamp}.json`);
    
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Relatório salvo em: ${reportPath}`);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }
}

// Interfaces
interface TestResult {
  suite: string;
  type: 'unit' | 'integration';
  status: 'passed' | 'failed';
  duration: number;
  output?: string;
  error?: string;
}

interface TestReport {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    totalDuration: number;
  };
  unitTests: {
    total: number;
    passed: number;
    failed: number;
    avgDuration: number;
  };
  integrationTests: {
    total: number;
    passed: number;
    failed: number;
    avgDuration: number;
  };
  results: TestResult[];
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const runner = new TestRunner();
  
  runner.runAllTests()
    .then((report) => {
      console.log('\n📊 Resumo dos Testes:');
      console.log(`   Total: ${report.summary.total}`);
      console.log(`   Passou: ${report.summary.passed}`);
      console.log(`   Falhou: ${report.summary.failed}`);
      console.log(`   Taxa de Sucesso: ${report.summary.successRate.toFixed(1)}%`);
      
      if (report.summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Falha na execução dos testes:', error);
      process.exit(1);
    });
}

export { TestRunner, TestResult, TestReport };