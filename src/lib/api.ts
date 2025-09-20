// API configuration for frontend-backend communication

// Backend server URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    google: '/api/auth/google',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me'
  },
  projects: {
    list: '/api/projects',
    save: '/api/projects/save',
    delete: '/api/projects'
  },
  templates: {
    list: '/api/templates'
  },
  upload: {
    file: '/api/upload/file',
    multiple: '/api/upload/multiple',
    pptx: '/api/upload/pptx',
    files: '/api/upload/files'
  },
  pipeline: {
    start: '/api/pipeline/start',
    status: '/api/pipeline/status',
    jobs: '/api/pipeline/jobs'
  },
  videos: {
    list: '/api/videos',
    export: '/api/export/video'
  }
}

// Helper function to make API calls with proper URL, timeout and retry logic
export const apiCall = async (endpoint: string, options: RequestInit = {}, maxRetries: number = 3) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Add default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Add auth token if available
  const token = localStorage.getItem('authToken')
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // Se a resposta for bem-sucedida ou erro do cliente (4xx), não retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }
      
      // Para erros de servidor (5xx), tentar novamente
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Backoff exponencial: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error('Erro desconhecido')
      
      // Se for o último attempt ou erro de rede, lançar erro
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Aguardar antes de tentar novamente
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Falha na requisição após múltiplas tentativas')
}

export const uploadAPI = {
  pptx: async (file: File, additionalData?: { title?: string; nrCategory?: string }) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData?.title) {
      formData.append('title', additionalData.title)
    }
    if (additionalData?.nrCategory) {
      formData.append('nrCategory', additionalData.nrCategory)
    }
    
    return apiCall(API_ENDPOINTS.upload.pptx, {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData
    })
  },
  
  files: async () => {
    return apiCall(API_ENDPOINTS.upload.files)
  }
}

export const videosAPI = {
  list: async () => {
    return apiCall(API_ENDPOINTS.videos.list)
  },
  
  export: async (videoData: any) => {
    return apiCall(API_ENDPOINTS.videos.export, {
      method: 'POST',
      body: JSON.stringify(videoData)
    })
  }
}