interface PipelineStage {
  id: string
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  data?: any
  error?: string
  startTime?: number
  endTime?: number
}

interface CompletePipelineData {
  // Input
  pptxFile: File
  
  // OCR Stage
  ocrResults?: any
  
  // AI Analysis Stage
  gptVisionAnalysis?: any
  nrCompliance?: any
  
  // Template Stage
  selectedTemplate?: any
  recommendations?: any[]
  
  // TTS Stage
  ttsJob?: any
  audioUrl?: string
  
  // Video Editor Stage
  videoProject?: any
  timelineData?: any
  
  // Export Stage
  exportSettings?: any
  finalVideoUrl?: string
}

interface PipelineOrchestrationCallbacks {
  onStageUpdate?: (stage: PipelineStage) => void
  onPipelineComplete?: (data: CompletePipelineData) => void
  onPipelineError?: (error: string, stage: string) => void
  onProgressUpdate?: (overallProgress: number) => void
}

class PipelineOrchestrationService {
  private stages: PipelineStage[] = []
  private pipelineData: CompletePipelineData | null = null
  private callbacks: PipelineOrchestrationCallbacks = {}
  private isRunning = false
  private currentStageIndex = 0

  constructor() {
    this.initializeStages()
  }

  private initializeStages() {
    this.stages = [
      {
        id: 'upload',
        name: 'Upload PPTX',
        description: 'Carregando apresentação PowerPoint',
        status: 'pending',
        progress: 0
      },
      {
        id: 'ocr',
        name: 'OCR Processing',
        description: 'Extraindo texto e conteúdo dos slides',
        status: 'pending',
        progress: 0
      },
      {
        id: 'ai-analysis',
        name: 'AI Analysis',
        description: 'Analisando conteúdo com GPT-4 Vision e IA',
        status: 'pending',
        progress: 0
      },
      {
        id: 'nr-compliance',
        name: 'NR Compliance',
        description: 'Verificando conformidade com normas regulamentadoras',
        status: 'pending',
        progress: 0
      },
      {
        id: 'template-selection',
        name: 'Template Selection',
        description: 'Selecionando templates de vídeo otimizados',
        status: 'pending',
        progress: 0
      },
      {
        id: 'tts-generation',
        name: 'TTS Generation',
        description: 'Gerando narração em português brasileiro',
        status: 'pending',
        progress: 0
      },
      {
        id: 'video-editing',
        name: 'Video Editing',
        description: 'Montando timeline e configurando projeto',
        status: 'pending',
        progress: 0
      },
      {
        id: 'video-export',
        name: 'Video Export',
        description: 'Renderizando e exportando vídeo final',
        status: 'pending',
        progress: 0
      }
    ]
  }

  /**
   * Start the complete pipeline from PPTX to final video
   */
  async startCompletePipeline(
    pptxFile: File,
    callbacks: PipelineOrchestrationCallbacks = {}
  ): Promise<CompletePipelineData> {
    if (this.isRunning) {
      throw new Error('Pipeline já está em execução')
    }

    this.callbacks = callbacks
    this.isRunning = true
    this.currentStageIndex = 0
    this.pipelineData = { pptxFile }

    try {
      // Execute all stages sequentially
      for (const stage of this.stages) {
        await this.executeStage(stage)
      }

      this.callbacks.onPipelineComplete?.(this.pipelineData)
      return this.pipelineData
    } catch (error) {
      this.callbacks.onPipelineError?.(error instanceof Error ? error.message : 'Unknown error', this.stages[this.currentStageIndex]?.id || 'unknown')
      throw error
    } finally {
      this.isRunning = false
    }
  }

  private async executeStage(stage: PipelineStage): Promise<void> {
    this.updateStage(stage.id, { status: 'processing', startTime: Date.now() })

    // Simulate stage processing
    for (let i = 0; i <= 100; i += 10) {
      this.updateStage(stage.id, { progress: i })
      await this.delay(100)
    }

    this.updateStage(stage.id, { status: 'completed', endTime: Date.now(), progress: 100 })
  }

  private updateStage(stageId: string, updates: Partial<PipelineStage>): void {
    const stage = this.stages.find(s => s.id === stageId)
    if (stage) {
      Object.assign(stage, updates)
      this.callbacks.onStageUpdate?.(stage)
      this.updateOverallProgress()
    }
  }

  private updateOverallProgress(): void {
    const totalProgress = this.stages.reduce((sum, stage) => sum + stage.progress, 0)
    const overallProgress = totalProgress / this.stages.length
    this.callbacks.onProgressUpdate?.(overallProgress)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getStages(): PipelineStage[] {
    return [...this.stages]
  }

  getCurrentStage(): PipelineStage | null {
    return this.stages[this.currentStageIndex] || null
  }

  isRunning(): boolean {
    return this.isRunning
  }
}

const pipelineOrchestrationService = new PipelineOrchestrationService()

export { pipelineOrchestrationService }
export type { 
  PipelineStage, 
  CompletePipelineData, 
  PipelineOrchestrationCallbacks 
}