// Teste manual de compliance para Templates NR
// Este arquivo testa as funcionalidades de compliance implementadas

import { NRTemplateSystem } from './src/services/NRTemplateSystem.ts';

// Função para testar compliance dos templates NR
function testNRCompliance() {
  console.log('=== TESTE DE COMPLIANCE DOS TEMPLATES NR ===\n');
  
  const templateSystem = new NRTemplateSystem();
  const templates = templateSystem.getAllTemplates();
  
  console.log(`Total de templates encontrados: ${templates.length}\n`);
  
  // Testar templates específicos das normas
  const nrTemplates = templates.filter(t => 
    t.norma && ['NR-6', 'NR-10', 'NR-12', 'NR-35'].includes(t.norma)
  );
  
  console.log(`Templates NR encontrados: ${nrTemplates.length}\n`);
  
  // Validar compliance de cada template
  const complianceResults = [];
  
  nrTemplates.forEach(template => {
    console.log(`\n--- Testando Template: ${template.name} (${template.norma}) ---`);
    
    try {
      const validation = templateSystem.validateCompliance(template.id);
      
      console.log(`✓ Template ID: ${template.id}`);
      console.log(`✓ Norma: ${validation.norma}`);
      console.log(`✓ Status: ${validation.isCompliant ? 'CONFORME' : 'NÃO CONFORME'}`);
      console.log(`✓ Regras validadas: ${validation.results.length}`);
      
      if (validation.recommendations.length > 0) {
        console.log(`⚠️  Recomendações:`);
        validation.recommendations.forEach(rec => {
          console.log(`   - ${rec}`);
        });
      }
      
      complianceResults.push({
        template: template.name,
        norma: template.norma,
        compliant: validation.isCompliant,
        issues: validation.results.filter(r => !r.passed).length
      });
      
    } catch (error) {
      console.error(`❌ Erro ao validar template ${template.name}:`, error.message);
      complianceResults.push({
        template: template.name,
        norma: template.norma,
        compliant: false,
        error: error.message
      });
    }
  });
  
  // Resumo dos resultados
  console.log('\n\n=== RESUMO DOS RESULTADOS ===');
  console.log(`Total testado: ${complianceResults.length}`);
  console.log(`Conformes: ${complianceResults.filter(r => r.compliant).length}`);
  console.log(`Não conformes: ${complianceResults.filter(r => !r.compliant).length}`);
  console.log(`Com erros: ${complianceResults.filter(r => r.error).length}`);
  
  // Detalhes por norma
  console.log('\n--- Detalhes por Norma ---');
  ['NR-6', 'NR-10', 'NR-12', 'NR-35'].forEach(norma => {
    const normaResults = complianceResults.filter(r => r.norma === norma);
    if (normaResults.length > 0) {
      const compliant = normaResults.filter(r => r.compliant).length;
      console.log(`${norma}: ${compliant}/${normaResults.length} conformes`);
    } else {
      console.log(`${norma}: ❌ Nenhum template encontrado`);
    }
  });
  
  return complianceResults;
}

// Função para testar funcionalidades específicas
function testSpecificFeatures() {
  console.log('\n\n=== TESTE DE FUNCIONALIDADES ESPECÍFICAS ===\n');
  
  const templateSystem = new NRTemplateSystem();
  
  // Teste 1: Busca por categoria
  console.log('1. Teste de busca por categoria NR-10:');
  try {
    const nr10Templates = templateSystem.getTemplatesByCategory('NR-10');
    console.log(`   ✓ Encontrados ${nr10Templates.length} templates NR-10`);
    nr10Templates.forEach(t => {
      console.log(`   - ${t.name}`);
    });
  } catch (error) {
    console.error(`   ❌ Erro na busca: ${error.message}`);
  }
  
  // Teste 2: Validação de template específico
  console.log('\n2. Teste de validação de template específico:');
  try {
    const templates = templateSystem.getAllTemplates();
    if (templates.length > 0) {
      const firstTemplate = templates[0];
      const validation = templateSystem.validateCompliance(firstTemplate.id);
      console.log(`   ✓ Template: ${firstTemplate.name}`);
      console.log(`   ✓ Compliance: ${validation.isCompliant ? 'SIM' : 'NÃO'}`);
    }
  } catch (error) {
    console.error(`   ❌ Erro na validação: ${error.message}`);
  }
  
  // Teste 3: Criação de projeto
  console.log('\n3. Teste de criação de projeto:');
  try {
    const templates = templateSystem.getAllTemplates();
    if (templates.length > 0) {
      const project = templateSystem.createProject(templates[0].id, {
        title: 'Projeto Teste Compliance',
        description: 'Teste de criação de projeto'
      });
      console.log(`   ✓ Projeto criado: ${project.title}`);
      console.log(`   ✓ Layers: ${project.layers.length}`);
    }
  } catch (error) {
    console.error(`   ❌ Erro na criação: ${error.message}`);
  }
}

// Executar testes
if (typeof window !== 'undefined') {
  // Executar no browser
  window.testNRCompliance = testNRCompliance;
  window.testSpecificFeatures = testSpecificFeatures;
  console.log('Funções de teste disponíveis: testNRCompliance(), testSpecificFeatures()');
} else {
  // Executar no Node.js
  testNRCompliance();
  testSpecificFeatures();
}

export { testNRCompliance, testSpecificFeatures };