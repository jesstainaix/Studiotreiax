const fs = require('fs');
const path = require('path');

// Lista de console.logs que devem ser mantidos (essenciais para debugging)
const keepPatterns = [
  /console\.error\(/,
  /console\.warn\(/,
  // Manter logs de teste
  /\/\*\*.*test.*\*\//i,
  /describe\(/,
  /it\(/,
  /test\(/,
  // Manter logs em arquivos de teste
  /\.test\./,
  /\.spec\./,
  /setupTests/,
  /global-setup/,
  /global-teardown/,
  /test-runner/
];

// Padrões de console.log que devem ser removidos
const removePatterns = [
  /console\.log\(/,
  /console\.debug\(/,
  /console\.info\(/
];

// Arquivos que devem ser ignorados (manter todos os logs)
const ignoreFiles = [
  'setupTests.ts',
  'global-setup.ts', 
  'global-teardown.ts',
  'test-runner.ts',
  'IntegrationTests.ts',
  'error-handling-test-suite.ts',
  'PipelineIntegration.test.ts',
  'tts-integration.test.ts',
  'pptx-validation-flow.test.ts',
  'useAdvancedUI.test.ts',
  'pipelineE2ETest.ts',
  'simple-test.test.ts',
  'app.spec.ts',
  'PPTXUploadTest.test.tsx',
  'test-ai-component.tsx'
];

function shouldKeepFile(filePath) {
  const fileName = path.basename(filePath);
  return ignoreFiles.includes(fileName) || 
         fileName.includes('.test.') || 
         fileName.includes('.spec.') ||
         filePath.includes('__tests__') ||
         filePath.includes('/test/') ||
         filePath.includes('/tests/');
}

function shouldKeepLine(line, filePath) {
  // Manter arquivos de teste
  if (shouldKeepFile(filePath)) {
    return true;
  }
  
  // Manter console.error e console.warn
  if (keepPatterns.some(pattern => pattern.test(line))) {
    return true;
  }
  
  // Remover console.log, console.debug, console.info
  return !removePatterns.some(pattern => pattern.test(line));
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let modified = false;
    const newLines = lines.filter(line => {
      if (!shouldKeepLine(line, filePath)) {
        console.log(`Removendo: ${line.trim()} em ${filePath}`);
        modified = true;
        return false;
      }
      return true;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      console.log(`✅ Processado: ${filePath}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dirPath) {
  let processedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processedCount += processDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
        processedCount += processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dirPath}:`, error.message);
  }
  
  return processedCount;
}

// Lista de arquivos específicos para processar baseado na busca regex
const specificFiles = [
  'src/utils/performanceBudgets.ts',
  'src/systems/PerformanceAnalyzer.ts', 
  'src/services/VideoRenderer.ts',
  'src/services/preview.service.ts',
  'src/services/PPTXAnalysisSystem.ts',
  'src/utils/EventEmitter.ts',
  'src/utils/assetCache.ts',
  'src/services/gpt4-vision-service.ts',
  'src/utils/cloudBackup.ts',
  'src/services/realtimeCommentsService.ts',
  'src/services/tts-logger.ts',
  'src/utils/realTimeAnalytics.ts',
  'src/services/PremiumTTSService.ts',
  'src/services/parallel-processor.ts',
  'src/services/projectService.ts',
  'src/services/ParticleSystem.ts',
  'src/utils/assetCompression.ts',
  'src/services/user-limits.service.ts'
];

console.log('🧹 Iniciando remoção de console.logs desnecessários...');
console.log('📋 Mantendo console.error, console.warn e logs de teste');
console.log('🗑️  Removendo console.log, console.debug, console.info\n');

let totalProcessed = 0;

// Processar arquivos específicos primeiro
for (const file of specificFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    totalProcessed += processFile(fullPath);
  }
}

console.log(`\n✅ Processamento concluído!`);
console.log(`📊 Total de arquivos modificados: ${totalProcessed}`);
console.log('🎯 Console.logs de produção removidos, mantendo logs essenciais de debugging');