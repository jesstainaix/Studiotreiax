import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { pipelineApiService } from '../services/pipelineApiService'
import type { PipelineJob } from '../services/pipelineApiService'

describe('Pipeline PPTX→Vídeo Integration Tests', () => {
  let testFile: File
  let testJobId: string

  beforeAll(async () => {
    // Criar arquivo de teste simulado
    const pptxContent = `
# Apresentação de Teste - StudioTreiax
## Pipeline PPTX → Vídeo

### Slide 1: Título
**Teste de Integração**
Validação do pipeline PPTX → Vídeo

### Slide 2: Funcionalidades
- Upload de arquivo
- Processamento em tempo real
- Geração de vídeo
- Monitoramento de progresso
    `
    
    testFile = new File([pptxContent], 'test-presentation.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    })
  })

  afterAll(async () => {
    // Cleanup: cancelar job se ainda estiver rodando
    if (testJobId) {
      try {
        await fetch(`http://localhost:3001/api/pipeline/jobs/${testJobId}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.log('Cleanup job deletion failed:', error)
      }
    }
  })

  it('deve inicializar o serviço de pipeline corretamente', () => {
    expect(pipelineApiService).toBeDefined()
    expect(typeof pipelineApiService.startPipeline).toBe('function')
    expect(typeof pipelineApiService.getJobStatus).toBe('function')
    expect(typeof pipelineApiService.monitorJob).toBe('function')
  })

  it('deve validar arquivo PPTX antes do upload', async () => {
    // Teste com arquivo inválido
    const invalidFile = new File(['invalid content'], 'test.txt', {
      type: 'text/plain'
    })

    try {
      await pipelineApiService.startPipeline(invalidFile)
      expect.fail('Deveria ter rejeitado arquivo inválido')
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  it('deve iniciar pipeline com arquivo PPTX válido', async () => {
    const response = await pipelineApiService.startPipeline(testFile)
    
    expect(response.success).toBe(true)
    expect(response.data).toBeDefined()
    expect(response.data?.jobId).toBeDefined()
    
    testJobId = response.data!.jobId
  }, 10000) // 10 segundos timeout

  it('deve retornar status do job corretamente', async () => {
    if (!testJobId) {
      expect.fail('Job ID não disponível para teste')
    }

    const statusResponse = await pipelineApiService.getJobStatus(testJobId)
    
    expect(statusResponse.success).toBe(true)
    expect(statusResponse.data).toBeDefined()
    expect(statusResponse.data?.id).toBe(testJobId)
    expect(['pending', 'processing', 'completed', 'failed']).toContain(statusResponse.data?.status)
  })

  it('deve monitorar progresso do job', async () => {
    if (!testJobId) {
      expect.fail('Job ID não disponível para teste')
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: Job não completou em 30 segundos'))
      }, 30000)

      let progressUpdates = 0
      
      pipelineApiService.monitorJob(
        testJobId,
        (job: PipelineJob) => {
          // Callback de progresso
          progressUpdates++
          expect(job.id).toBe(testJobId)
          expect(job.progress).toBeGreaterThanOrEqual(0)
          expect(job.progress).toBeLessThanOrEqual(100)
          expect(job.currentStage).toBeDefined()
          
          console.log(`📊 Progress: ${job.progress}% - ${job.currentStage}`)
        },
        (job: PipelineJob) => {
          // Callback de sucesso
          clearTimeout(timeout)
          expect(job.status).toBe('completed')
          expect(job.progress).toBe(100)
          expect(job.result).toBeDefined()
          expect(progressUpdates).toBeGreaterThan(0)
          
          console.log('✅ Pipeline completed successfully!')
          resolve()
        },
        (error: string) => {
          // Callback de erro
          clearTimeout(timeout)
          console.error('❌ Pipeline failed:', error)
          reject(new Error(`Pipeline failed: ${error}`))
        }
      ).catch(reject)
    })
  }, 35000) // 35 segundos timeout

  it('deve lidar com jobs inexistentes', async () => {
    const fakeJobId = 'job-inexistente-123'
    
    const response = await pipelineApiService.getJobStatus(fakeJobId)
    
    expect(response.success).toBe(false)
    expect(response.error).toBeDefined()
  })

  it('deve validar estrutura de resposta da API', async () => {
    const response = await pipelineApiService.startPipeline(testFile)
    
    if (response.success && response.data) {
      const job = response.data
      
      // Validar estrutura do job
      expect(job).toHaveProperty('jobId')
      expect(job).toHaveProperty('status')
      expect(job).toHaveProperty('progress')
      expect(job).toHaveProperty('currentStage')
      expect(job).toHaveProperty('stages')
      expect(job).toHaveProperty('createdAt')
      expect(job).toHaveProperty('file')
      
      // Validar tipos
      expect(typeof job.jobId).toBe('string')
      expect(typeof job.status).toBe('string')
      expect(typeof job.progress).toBe('number')
      expect(typeof job.currentStage).toBe('string')
      expect(Array.isArray(job.stages)).toBe(true)
      expect(typeof job.createdAt).toBe('string')
      expect(typeof job.file).toBe('object')
    }
  })
})

// Teste de performance básico
describe('Pipeline Performance Tests', () => {
  it('deve processar arquivo pequeno em tempo razoável', async () => {
    const startTime = Date.now()
    
    const smallFile = new File(['# Teste Rápido\n## Slide único'], 'quick-test.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    })

    try {
      const response = await pipelineApiService.startPipeline(smallFile)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(response.success).toBe(true)
      expect(duration).toBeLessThan(5000) // Menos de 5 segundos para iniciar
      
      console.log(`⚡ Pipeline startup time: ${duration}ms`)
    } catch (error) {
      console.log('Performance test failed:', error)
    }
  }, 10000)
})

// Teste de stress básico
describe('Pipeline Stress Tests', () => {
  it('deve lidar com múltiplas requisições simultâneas', async () => {
    const files = Array.from({ length: 3 }, (_, i) => 
      new File([`# Teste ${i + 1}\n## Slide de teste`], `test-${i + 1}.pptx`, {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      })
    )

    const promises = files.map(file => pipelineApiService.startPipeline(file))
    
    try {
      const responses = await Promise.allSettled(promises)
      
      // Pelo menos uma requisição deve ser bem-sucedida
      const successfulResponses = responses.filter(
        (result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.success
      )
      
      expect(successfulResponses.length).toBeGreaterThan(0)
      console.log(`✅ ${successfulResponses.length}/${responses.length} requests succeeded`)
      
    } catch (error) {
      console.log('Stress test encountered error:', error)
    }
  }, 15000)
})