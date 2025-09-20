const fs = require('fs');
const path = require('path');

// Arquivos que devem manter console.logs (testes e desenvolvimento)
const KEEP_CONSOLE_LOGS = [
  'test', 'spec', 'debug', 'dev', 'setupTests', 'global-setup', 'global-teardown'
];

// Tipos de console que devem ser removidos em produção
const CONSOLE_TYPES_TO_REMOVE = ['log', 'debug', 'info'];

// Tipos de console que devem ser mantidos (erros e warnings)
const CONSOLE_TYPES_TO_KEEP = ['warn', 'error'];

function shouldKeepFile(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  return KEEP_CONSOLE_LOGS.some(pattern => fileName.includes(pattern));
}

function removeConsoleLogs(content, filePath) {
  if (shouldKeepFile(filePath)) {
    return content;
  }

  let modifiedContent = content;
  let removedCount = 0;

  // Remove console.log, console.debug, console.info
  CONSOLE_TYPES_TO_REMOVE.forEach(type => {
    const regex = new RegExp(`\\s*console\\.${type}\\([^;]*\\);?`, 'g');
    const matches = modifiedContent.match(regex);
    if (matches) {
      removedCount += matches.length;
      modifiedContent = modifiedContent.replace(regex, '');
    }
  });

  // Remove linhas vazias extras
  modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  return { content: modifiedContent, removedCount };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = removeConsoleLogs(content, filePath);
    
    if (typeof result === 'object' && result.removedCount > 0) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${result.removedCount} console.logs removidos`);
      return result.removedCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dirPath) {
  let totalRemoved = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pular node_modules e outras pastas desnecessárias
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          totalRemoved += processDirectory(fullPath);
        }
      } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
        totalRemoved += processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dirPath}:`, error.message);
  }
  
  return totalRemoved;
}

console.log('🧹 Iniciando remoção de console.logs desnecessários...');
console.log('📋 Mantendo console.logs em arquivos de teste e desenvolvimento');
console.log('⚠️  Mantendo console.warn e console.error para debugging');
console.log('');

const srcPath = path.join(process.cwd(), 'src');
const totalRemoved = processDirectory(srcPath);

console.log('');
console.log('📊 RESUMO:');
console.log(`✅ Total de console.logs removidos: ${totalRemoved}`);
console.log('🎯 Otimização de produção concluída!');

if (totalRemoved > 0) {
  console.log('');
  console.log('💡 Benefícios:');
  console.log('   - Bundle menor');
  console.log('   - Melhor performance');
  console.log('   - Console mais limpo');
  console.log('   - Código mais profissional');
}