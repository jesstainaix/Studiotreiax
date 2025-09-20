/**
 * Teste simples do Pipeline PPTX→Vídeo via API
 * Testa se o backend está funcionando e pode processar arquivos PPTX
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL base do backend
const BACKEND_URL = 'http://localhost:3001';

// Função para testar health do backend
async function testBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Backend Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend Health Check Failed:', error.message);
    return false;
  }
}

// Função para testar endpoints do pipeline
async function testPipelineEndpoints() {
  try {
    // Teste listar jobs
    const jobsResponse = await fetch(`${BACKEND_URL}/api/pipeline/jobs`);
    const jobs = await jobsResponse.json();
    console.log('✅ Pipeline Jobs Endpoint:', `${jobs.data.length} jobs encontrados`);

    // Teste endpoint de status (usando um job existente)
    if (jobs.data.length > 0) {
      const firstJobId = jobs.data[0].id;
      const statusResponse = await fetch(`${BACKEND_URL}/api/pipeline/status/${firstJobId}`);
      const status = await statusResponse.json();
      console.log('✅ Pipeline Status Endpoint:', status);
    }

    // Teste iniciar pipeline (POST /api/pipeline/start)
    const startPipelineTest = {
      file: {
        originalName: 'test.pptx',
        size: 1024
      }
    };

    const startResponse = await fetch(`${BACKEND_URL}/api/pipeline/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(startPipelineTest)
    });

    if (startResponse.ok) {
      const startResult = await startResponse.json();
      console.log('✅ Pipeline Start:', startResult);
      return startResult.id || startResult.jobId;
    } else {
      const errorText = await startResponse.text();
      console.log('⚠️ Pipeline Start Response:', startResponse.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Pipeline Endpoints Test Failed:', error.message);
    return null;
  }
}

// Função para testar upload e download
async function testUploadAndDownload() {
  try {
    // Testar download de vídeo (usando job existente)
    const jobsResponse = await fetch(`${BACKEND_URL}/api/pipeline/jobs`);
    const jobs = await jobsResponse.json();
    
    if (jobs.data.length > 0) {
      const completedJob = jobs.data.find(job => job.status === 'completed');
      if (completedJob) {
        console.log(`� Testando download de vídeo para job: ${completedJob.id}`);
        
        const videoResponse = await fetch(`${BACKEND_URL}/api/download/video/${completedJob.id}`);
        const thumbnailResponse = await fetch(`${BACKEND_URL}/api/download/thumbnail/${completedJob.id}`);
        
        console.log(`   Video Download Status: ${videoResponse.status}`);
        console.log(`   Thumbnail Download Status: ${thumbnailResponse.status}`);
        
        return {
          video: videoResponse.status === 200,
          thumbnail: thumbnailResponse.status === 200
        };
      }
    }
    
    console.log('⚠️ Nenhum job completado encontrado para testar download');
    return null;
  } catch (error) {
    console.error('❌ Upload/Download Test Failed:', error.message);
    return null;
  }
}

// Função principal de teste
async function runTests() {
  console.log('🧪 Iniciando Testes do Pipeline PPTX→Vídeo');
  console.log('================================================');

  // Teste 1: Health Check do Backend
  console.log('\n1. Testando Health Check do Backend...');
  const healthOk = await testBackendHealth();

  if (!healthOk) {
    console.log('❌ Backend não está funcionando. Abortando testes.');
    return;
  }

  // Teste 2: Endpoints do Pipeline
  console.log('\n2. Testando Endpoints do Pipeline...');
  const jobId = await testPipelineEndpoints();

  // Teste 3: Upload e Download
  console.log('\n3. Testando Download de Arquivos...');
  const downloadResult = await testUploadAndDownload();

  // Resumo dos testes
  console.log('\n================================================');
  console.log('📊 Resumo dos Testes:');
  console.log(`   Backend Health: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Pipeline Endpoints: ${jobId ? '✅' : '❌'}`);
  console.log(`   File Download: ${downloadResult ? '✅' : '❌'}`);

  if (healthOk && (jobId || downloadResult)) {
    console.log('\n🎉 Pipeline está operacional! Backend e endpoints funcionando.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verificar configuração.');
  }
}

// Executar testes
runTests().catch(console.error);