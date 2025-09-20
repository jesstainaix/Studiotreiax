export type UserTier = 'free' | 'premium' | 'enterprise' | 'admin'

export interface UserLimits {
  maxFileSize: number // em bytes
  maxFilesPerDay: number
  maxFilesPerMonth: number
  allowedFormats: string[]
  maxProcessingTime: number // em segundos
  priorityQueue: boolean
  advancedFeatures: {
    aiAnalysis: boolean
    batchProcessing: boolean
    customTemplates: boolean
    apiAccess: boolean
    webhooks: boolean
  }
  storage: {
    maxStorageSize: number // em bytes
    retentionDays: number
  }
}

export interface UserQuota {
  filesUploadedToday: number
  filesUploadedThisMonth: number
  storageUsed: number
  lastResetDate: string
}

const USER_LIMITS: Record<UserTier, UserLimits> = {
  free: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerDay: 5,
    maxFilesPerMonth: 50,
    allowedFormats: ['.pptx', '.ppt'],
    maxProcessingTime: 300, // 5 minutos
    priorityQueue: false,
    advancedFeatures: {
      aiAnalysis: false,
      batchProcessing: false,
      customTemplates: false,
      apiAccess: false,
      webhooks: false
    },
    storage: {
      maxStorageSize: 100 * 1024 * 1024, // 100MB
      retentionDays: 7
    }
  },
  premium: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFilesPerDay: 25,
    maxFilesPerMonth: 500,
    allowedFormats: ['.pptx', '.ppt', '.odp'],
    maxProcessingTime: 600, // 10 minutos
    priorityQueue: true,
    advancedFeatures: {
      aiAnalysis: true,
      batchProcessing: false,
      customTemplates: true,
      apiAccess: false,
      webhooks: false
    },
    storage: {
      maxStorageSize: 1024 * 1024 * 1024, // 1GB
      retentionDays: 30
    }
  },
  enterprise: {
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxFilesPerDay: 100,
    maxFilesPerMonth: 2000,
    allowedFormats: ['.pptx', '.ppt', '.odp', '.key'],
    maxProcessingTime: 1800, // 30 minutos
    priorityQueue: true,
    advancedFeatures: {
      aiAnalysis: true,
      batchProcessing: true,
      customTemplates: true,
      apiAccess: true,
      webhooks: true
    },
    storage: {
      maxStorageSize: 10 * 1024 * 1024 * 1024, // 10GB
      retentionDays: 365
    }
  },
  admin: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxFilesPerDay: Infinity,
    maxFilesPerMonth: Infinity,
    allowedFormats: ['.pptx', '.ppt', '.odp', '.key', '.pdf'],
    maxProcessingTime: 3600, // 1 hora
    priorityQueue: true,
    advancedFeatures: {
      aiAnalysis: true,
      batchProcessing: true,
      customTemplates: true,
      apiAccess: true,
      webhooks: true
    },
    storage: {
      maxStorageSize: Infinity,
      retentionDays: Infinity
    }
  }
}

class UserLimitsService {
  private static instance: UserLimitsService
  private quotaCache = new Map<string, UserQuota>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  static getInstance(): UserLimitsService {
    if (!UserLimitsService.instance) {
      UserLimitsService.instance = new UserLimitsService()
    }
    return UserLimitsService.instance
  }

  /**
   * Obtém os limites para um tipo de usuário
   */
  getLimitsForTier(tier: UserTier): UserLimits {
    return { ...USER_LIMITS[tier] }
  }

  /**
   * Obtém os limites para um usuário específico
   */
  async getLimitsForUser(userId: string): Promise<UserLimits> {
    try {
      // Buscar tier do usuário (simulado - substituir por chamada real à API)
      const userTier = await this.getUserTier(userId)
      return this.getLimitsForTier(userTier)
    } catch (error) {
      console.error('Erro ao obter limites do usuário:', error)
      // Fallback para tier free em caso de erro
      return this.getLimitsForTier('free')
    }
  }

  /**
   * Obtém a cota atual do usuário
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    // Verificar cache
    const cached = this.quotaCache.get(userId)
    const cacheExpiry = this.cacheExpiry.get(userId)
    
    if (cached && cacheExpiry && Date.now() < cacheExpiry) {
      return cached
    }

    try {
      // Buscar cota da API (simulado)
      const quota = await this.fetchUserQuotaFromAPI(userId)
      
      // Atualizar cache
      this.quotaCache.set(userId, quota)
      this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION)
      
      return quota
    } catch (error) {
      console.error('Erro ao obter cota do usuário:', error)
      // Retornar cota padrão em caso de erro
      return {
        filesUploadedToday: 0,
        filesUploadedThisMonth: 0,
        storageUsed: 0,
        lastResetDate: new Date().toISOString()
      }
    }
  }

  /**
   * Verifica se o usuário pode fazer upload de um arquivo
   */
  async canUploadFile(
    userId: string, 
    fileSize: number, 
    fileFormat: string
  ): Promise<{
    allowed: boolean
    reason?: string
    limits: UserLimits
    quota: UserQuota
  }> {
    const [limits, quota] = await Promise.all([
      this.getLimitsForUser(userId),
      this.getUserQuota(userId)
    ])

    // Verificar tamanho do arquivo
    if (fileSize > limits.maxFileSize) {
      return {
        allowed: false,
        reason: `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(limits.maxFileSize)}`,
        limits,
        quota
      }
    }

    // Verificar formato do arquivo
    const isFormatAllowed = limits.allowedFormats.some(format => 
      fileFormat.toLowerCase().endsWith(format.toLowerCase())
    )
    
    if (!isFormatAllowed) {
      return {
        allowed: false,
        reason: `Formato não permitido. Formatos aceitos: ${limits.allowedFormats.join(', ')}`,
        limits,
        quota
      }
    }

    // Verificar limite diário
    if (quota.filesUploadedToday >= limits.maxFilesPerDay) {
      return {
        allowed: false,
        reason: `Limite diário atingido (${limits.maxFilesPerDay} arquivos por dia)`,
        limits,
        quota
      }
    }

    // Verificar limite mensal
    if (quota.filesUploadedThisMonth >= limits.maxFilesPerMonth) {
      return {
        allowed: false,
        reason: `Limite mensal atingido (${limits.maxFilesPerMonth} arquivos por mês)`,
        limits,
        quota
      }
    }

    // Verificar espaço de armazenamento
    if (quota.storageUsed + fileSize > limits.storage.maxStorageSize) {
      const availableSpace = limits.storage.maxStorageSize - quota.storageUsed
      return {
        allowed: false,
        reason: `Espaço insuficiente. Disponível: ${this.formatFileSize(availableSpace)}`,
        limits,
        quota
      }
    }

    return {
      allowed: true,
      limits,
      quota
    }
  }

  /**
   * Registra um upload realizado
   */
  async recordUpload(userId: string, fileSize: number): Promise<void> {
    try {
      // Atualizar cota na API (simulado)
      await this.updateUserQuotaInAPI(userId, fileSize)
      
      // Invalidar cache
      this.quotaCache.delete(userId)
      this.cacheExpiry.delete(userId)
    } catch (error) {
      console.error('Erro ao registrar upload:', error)
    }
  }

  /**
   * Obtém informações de upgrade para o usuário
   */
  getUpgradeInfo(currentTier: UserTier): {
    nextTier: UserTier | null
    benefits: string[]
    comparison: {
      current: UserLimits
      next: UserLimits | null
    }
  } {
    const tierOrder: UserTier[] = ['free', 'premium', 'enterprise', 'admin']
    const currentIndex = tierOrder.indexOf(currentTier)
    const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null
    
    const currentLimits = this.getLimitsForTier(currentTier)
    const nextLimits = nextTier ? this.getLimitsForTier(nextTier) : null
    
    const benefits: string[] = []
    
    if (nextLimits) {
      if (nextLimits.maxFileSize > currentLimits.maxFileSize) {
        benefits.push(`Arquivos até ${this.formatFileSize(nextLimits.maxFileSize)}`)
      }
      
      if (nextLimits.maxFilesPerDay > currentLimits.maxFilesPerDay) {
        benefits.push(`${nextLimits.maxFilesPerDay} uploads por dia`)
      }
      
      if (nextLimits.advancedFeatures.aiAnalysis && !currentLimits.advancedFeatures.aiAnalysis) {
        benefits.push('Análise com IA')
      }
      
      if (nextLimits.advancedFeatures.batchProcessing && !currentLimits.advancedFeatures.batchProcessing) {
        benefits.push('Processamento em lote')
      }
      
      if (nextLimits.priorityQueue && !currentLimits.priorityQueue) {
        benefits.push('Fila prioritária')
      }
    }
    
    return {
      nextTier,
      benefits,
      comparison: {
        current: currentLimits,
        next: nextLimits
      }
    }
  }

  /**
   * Formata tamanho de arquivo para exibição
   */
  formatFileSize(bytes: number): string {
    if (bytes === Infinity) return 'Ilimitado'
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  /**
   * Limpa o cache de cotas
   */
  clearCache(): void {
    this.quotaCache.clear()
    this.cacheExpiry.clear()
  }

  // Métodos privados para simulação de API
  private async getUserTier(userId: string): Promise<UserTier> {
    // Simulação - substituir por chamada real à API
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Lógica simulada baseada no ID do usuário
    if (userId.includes('admin')) return 'admin'
    if (userId.includes('enterprise')) return 'enterprise'
    if (userId.includes('premium')) return 'premium'
    return 'free'
  }

  private async fetchUserQuotaFromAPI(userId: string): Promise<UserQuota> {
    // Simulação - substituir por chamada real à API
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      filesUploadedToday: Math.floor(Math.random() * 5),
      filesUploadedThisMonth: Math.floor(Math.random() * 50),
      storageUsed: Math.floor(Math.random() * 50 * 1024 * 1024), // até 50MB
      lastResetDate: new Date().toISOString()
    }
  }

  private async updateUserQuotaInAPI(userId: string, fileSize: number): Promise<void> {
    // Simulação - substituir por chamada real à API
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Aqui você faria a atualização real da cota do usuário
    console.log(`Atualizando cota do usuário ${userId} com arquivo de ${fileSize} bytes`)
  }
}

export default userLimitsService