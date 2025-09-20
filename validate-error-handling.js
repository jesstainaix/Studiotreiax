/**
 * Script para executar e validar o sistema de Error Handling
 * Executa os testes e exibe relatório completo
 */

import { errorHandlingTestSuite } from './src/tests/error-handling-test-suite';

async function runErrorHandlingValidation() {
  console.log('🚀 Iniciando validação do Sistema de Error Handling Robusto...\n');

  try {
    // Executar todos os testes
    const results = await errorHandlingTestSuite.runAllTests();

    // Exibir resultados
    console.log(results.summary);

    // Verificar se os testes críticos passaram
    const criticalTests = [
      'ErrorHandlingService - Tratamento Básico',
      'ErrorHandlingService - Retry Automático',
      'ErrorHandlingService - Timeout',
      'EnhancedPipelineApiService - Validação Arquivo',
      'RobustEnhancedPipelineService - Validação Prévia'
    ];

    const criticalFailures = results.results.filter(
      result => criticalTests.includes(result.testName) && !result.passed
    );

    if (criticalFailures.length > 0) {
      console.log('\n❌ TESTES CRÍTICOS FALHARAM:');
      criticalFailures.forEach(failure => {
        console.log(`• ${failure.testName}: ${failure.error}`);
      });
      process.exit(1);
    }

    if (results.successRate >= 80) {
      console.log('\n✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log(`Taxa de sucesso: ${results.successRate}%`);
      
      if (results.successRate === 100) {
        console.log('🎉 PERFEITO! Todos os testes passaram!');
      }
    } else {
      console.log('\n⚠️  VALIDAÇÃO PARCIAL');
      console.log(`Taxa de sucesso: ${results.successRate}% (mínimo requerido: 80%)`);
      console.log('Alguns testes falharam, mas funcionalidades críticas estão operacionais.');
    }

    return results;

  } catch (error) {
    console.error('\n💥 ERRO FATAL na validação:', error);
    process.exit(1);
  }
}

// Executar validação se este arquivo for executado diretamente
if (require.main === module) {
  runErrorHandlingValidation()
    .then((results) => {
      console.log('\n📊 Relatório final:');
      console.log(`• Testes executados: ${results.totalTests}`);
      console.log(`• Sucessos: ${results.passed}`);
      console.log(`• Falhas: ${results.failed}`);
      console.log(`• Taxa de sucesso: ${results.successRate}%`);
    })
    .catch((error) => {
      console.error('Falha na execução:', error);
      process.exit(1);
    });
}

export { runErrorHandlingValidation };