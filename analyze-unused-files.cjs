const fs = require('fs');
const path = require('path');

// Função para encontrar todos os arquivos .ts/.tsx/.js/.jsx
function findAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pular node_modules, .git, dist, build
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Função para extrair imports de um arquivo
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Regex para diferentes tipos de import
    const importPatterns = [
      /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      /import\s*\(['"]([^'"]+)['"]\)/g,
      /require\s*\(['"]([^'"]+)['"]\)/g,
      /import\s+['"]([^'"]+)['"]/g
    ];
    
    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }
    
    return imports;
  } catch (error) {
    console.warn(`Erro ao ler arquivo ${filePath}:`, error.message);
    return [];
  }
}

// Função para resolver caminho relativo
function resolveImportPath(importPath, fromFile) {
  if (importPath.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    let resolved = path.resolve(fromDir, importPath);
    
    // Tentar diferentes extensões
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    
    for (const ext of extensions) {
      const fullPath = resolved + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // Se é um diretório, tentar index
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      for (const ext of ['/index.ts', '/index.tsx', '/index.js', '/index.jsx']) {
        const indexPath = resolved + ext;
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
  }
  
  return null;
}

// Função principal
function analyzeUnusedFiles() {
  console.log('🔍 Analisando arquivos não utilizados...');
  
  const srcDir = path.join(__dirname, 'src');
  const allFiles = findAllFiles(srcDir);
  
  console.log(`📁 Encontrados ${allFiles.length} arquivos para análise`);
  
  // Mapear todos os imports
  const importMap = new Map();
  const referencedFiles = new Set();
  
  // Arquivos de entrada (sempre considerados utilizados)
  const entryPoints = [
    path.join(srcDir, 'main.tsx'),
    path.join(srcDir, 'App.tsx'),
    path.join(__dirname, 'index.html')
  ];
  
  for (const file of allFiles) {
    const imports = extractImports(file);
    importMap.set(file, imports);
    
    // Resolver imports relativos
    for (const importPath of imports) {
      const resolved = resolveImportPath(importPath, file);
      if (resolved && allFiles.includes(resolved)) {
        referencedFiles.add(resolved);
      }
    }
  }
  
  // Marcar entry points como utilizados
  for (const entry of entryPoints) {
    if (fs.existsSync(entry)) {
      referencedFiles.add(entry);
    }
  }
  
  // Encontrar arquivos não referenciados
  const unusedFiles = allFiles.filter(file => !referencedFiles.has(file));
  
  // Filtrar arquivos que podem ser falsos positivos
  const filteredUnused = unusedFiles.filter(file => {
    const fileName = path.basename(file);
    const relativePath = path.relative(srcDir, file);
    
    // Manter arquivos de configuração, tipos, testes
    if (fileName.includes('.test.') || 
        fileName.includes('.spec.') ||
        fileName.includes('.d.ts') ||
        fileName === 'vite-env.d.ts' ||
        fileName === 'setupTests.ts' ||
        relativePath.includes('__tests__') ||
        relativePath.includes('test') ||
        relativePath.includes('types')) {
      return false;
    }
    
    return true;
  });
  
  // Gerar relatório
  console.log('\n📊 RELATÓRIO DE ARQUIVOS NÃO UTILIZADOS');
  console.log('=' .repeat(50));
  console.log(`Total de arquivos analisados: ${allFiles.length}`);
  console.log(`Arquivos referenciados: ${referencedFiles.size}`);
  console.log(`Arquivos potencialmente não utilizados: ${filteredUnused.length}`);
  
  if (filteredUnused.length > 0) {
    console.log('\n🗑️  ARQUIVOS CANDIDATOS À REMOÇÃO:');
    console.log('-'.repeat(40));
    
    const byCategory = {};
    
    for (const file of filteredUnused) {
      const relativePath = path.relative(srcDir, file);
      const category = relativePath.split(path.sep)[0] || 'root';
      
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(relativePath);
    }
    
    for (const [category, files] of Object.entries(byCategory)) {
      console.log(`\n📂 ${category.toUpperCase()}:`);
      files.forEach(file => console.log(`   - ${file}`));
    }
  } else {
    console.log('\n✅ Nenhum arquivo não utilizado encontrado!');
  }
  
  // Salvar relatório em arquivo
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: allFiles.length,
    referencedFiles: referencedFiles.size,
    unusedFiles: filteredUnused.map(f => path.relative(srcDir, f)),
    analysis: {
      entryPoints: entryPoints.filter(f => fs.existsSync(f)).map(f => path.relative(__dirname, f)),
      categories: Object.keys(filteredUnused.reduce((acc, file) => {
        const category = path.relative(srcDir, file).split(path.sep)[0] || 'root';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}))
    }
  };
  
  fs.writeFileSync('unused-files-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Relatório salvo em: unused-files-report.json');
  
  return filteredUnused;
}

// Executar análise
if (require.main === module) {
  analyzeUnusedFiles();
}

module.exports = { analyzeUnusedFiles };