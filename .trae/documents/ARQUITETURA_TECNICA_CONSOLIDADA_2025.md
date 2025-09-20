# 🏗️ ARQUITETURA TÉCNICA CONSOLIDADA 2025
## Estúdio IA de Vídeos - Especificações Técnicas Completas

> **DOCUMENTO TÉCNICO:** Arquitetura completa, stack tecnológico e especificações de implementação para o sistema de criação de vídeos com IA.

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Arquitetura de Alto Nível

```mermaid
graph TB
    subgraph "🌐 Frontend Layer"
        A[React Dashboard] --> B[Editor Canvas]
        A --> C[PPTX Upload]
        A --> D[Template Gallery]
        B --> E[Timeline Engine]
        B --> F[3D Avatar System]
        B --> G[VFX Engine]
        B --> H[Preview System]
    end
    
    subgraph "🔌 API Gateway Layer"
        I[Next.js API Routes]
        J[Authentication Middleware]
        K[Rate Limiting]
        L[Request Validation]
        M[Response Caching]
    end
    
    subgraph "🤖 AI Services Layer"
        N[OpenAI GPT-4 Vision]
        O[ElevenLabs TTS]
        P[Azure Cognitive Services]
        Q[Google Cloud AI]
        R[Computer Vision API]
        S[NR Detection Engine]
    end
    
    subgraph "🎬 Media Processing Layer"
        T[Three.js 3D Renderer]
        U[Ready Player Me SDK]
        V[MetaHuman Integration]
        W[GSAP Animation Engine]
        X[FFmpeg Video Processing]
        Y[Canvas Fabric.js]
    end
    
    subgraph "☁️ Cloud Infrastructure"
        Z[AWS EC2 Render Farm]
        AA[AWS S3 Storage]
        BB[CloudFront CDN]
        CC[Redis Cache Cluster]
        DD[Load Balancers]
        EE[Auto Scaling Groups]
    end
    
    subgraph "💾 Data Layer"
        FF[Supabase PostgreSQL]
        GG[IPFS Distributed Storage]
        HH[Vector Database (Pinecone)]
        II[Time Series DB (InfluxDB)]
    end
    
    subgraph "📊 Monitoring & Analytics"
        JJ[Prometheus Metrics]
        KK[Grafana Dashboards]
        LL[Sentry Error Tracking]
        MM[DataDog APM]
        NN[Custom Analytics]
    end
    
    A --> I
    I --> J
    I --> K
    I --> L
    I --> M
    
    I --> N
    I --> O
    I --> P
    I --> Q
    I --> R
    I --> S
    
    B --> T
    F --> U
    F --> V
    G --> W
    C --> X
    B --> Y
    
    I --> Z
    I --> AA
    I --> BB
    I --> CC
    I --> DD
    I --> EE
    
    I --> FF
    I --> GG
    I --> HH
    I --> II
    
    I --> JJ
    I --> KK
    I --> LL
    I --> MM
    I --> NN
```

### 1.2 Princípios Arquiteturais

| Princípio | Descrição | Implementação |
|-----------|-----------|---------------|
| **Microserviços** | Serviços independentes e escaláveis | APIs modulares, containers Docker |
| **Event-Driven** | Comunicação assíncrona entre serviços | Redis Pub/Sub, WebSockets |
| **Cloud-Native** | Arquitetura otimizada para nuvem | AWS services, auto-scaling |
| **API-First** | APIs como cidadãos de primeira classe | OpenAPI 3.0, documentação automática |
| **Security by Design** | Segurança integrada desde o início | OAuth 2.0, RBAC, encryption |
| **Performance-Oriented** | Otimização contínua de performance | Caching, CDN, lazy loading |
| **Observability** | Monitoramento e logging completos | Metrics, traces, logs |

---

## 2. STACK TECNOLÓGICO DETALHADO

### 2.1 Frontend Stack

```typescript
// Core Frontend Technologies
interface FrontendStack {
  framework: 'React 18.2.0'
  language: 'TypeScript 5.0+'
  bundler: 'Vite 5.0+'
  styling: 'Tailwind CSS 3.4+'
  uiLibrary: 'Shadcn/UI + Radix UI'
  stateManagement: 'Zustand 4.4+'
  routing: 'React Router 6.8+'
  dataFetching: 'TanStack Query 5.0+'
  forms: 'React Hook Form 7.45+'
  validation: 'Zod 3.22+'
  testing: 'Vitest + Testing Library'
  e2etesting: 'Playwright'
}

// 3D and Media Libraries
interface MediaStack {
  threejs: 'Three.js r158+'
  fabricjs: 'Fabric.js 5.3+'
  gsap: 'GSAP 3.12+ (Professional License)'
  lottie: 'Lottie React 2.4+'
  videojs: 'Video.js 8.5+'
  wavesurfer: 'WaveSurfer.js 7.3+'
  konva: 'Konva 9.2+ (Canvas 2D)'
}

// Avatar and 3D Integration
interface Avatar3DStack {
  readyPlayerMe: 'Ready Player Me SDK 2.0+'
  metahuman: 'MetaHuman Creator Integration'
  mixamo: 'Adobe Mixamo API'
  mediapipe: 'MediaPipe Face Mesh'
  tensorflow: 'TensorFlow.js 4.10+'
}
```

### 2.2 Backend Stack

```typescript
// Backend Core
interface BackendStack {
  runtime: 'Node.js 20.x LTS'
  framework: 'Next.js 14.0+ (App Router)'
  language: 'TypeScript 5.0+'
  database: 'Supabase (PostgreSQL 15+)'
  orm: 'Prisma 5.5+'
  cache: 'Redis 7.2+'
  queue: 'Bull Queue + Redis'
  storage: 'AWS S3 + CloudFront'
  cdn: 'CloudFront + Custom Edge Functions'
}

// AI and ML Services
interface AIStack {
  openai: 'OpenAI GPT-4 Vision + GPT-4 Turbo'
  elevenlabs: 'ElevenLabs TTS API v1'
  azure: 'Azure Cognitive Services'
  google: 'Google Cloud AI Platform'
  anthropic: 'Claude 3 Opus'
  stability: 'Stability AI (Image Generation)'
  replicate: 'Replicate ML Models'
}

// Media Processing
interface MediaProcessingStack {
  ffmpeg: 'FFmpeg 6.0+ (with GPU acceleration)'
  sharp: 'Sharp 0.32+ (Image processing)'
  canvas: 'Node Canvas 2.11+'
  puppeteer: 'Puppeteer 21.0+ (PDF/Screenshot)'
  imagemagick: 'ImageMagick 7.1+'
}
```

### 2.3 Infrastructure Stack

```typescript
// Cloud Infrastructure
interface InfrastructureStack {
  cloud: 'AWS (Primary) + Vercel (Frontend)'
  compute: 'EC2 (t3.large - c5.4xlarge)'
  containers: 'Docker + ECS Fargate'
  orchestration: 'AWS ECS + Application Load Balancer'
  storage: 'S3 (Standard + IA + Glacier)'
  database: 'RDS PostgreSQL + Read Replicas'
  cache: 'ElastiCache Redis Cluster'
  cdn: 'CloudFront + Edge Locations'
  monitoring: 'CloudWatch + DataDog'
  logging: 'CloudWatch Logs + Sentry'
}

// DevOps and CI/CD
interface DevOpsStack {
  versionControl: 'Git + GitHub'
  cicd: 'GitHub Actions + AWS CodePipeline'
  infrastructure: 'Terraform + AWS CDK'
  secrets: 'AWS Secrets Manager'
  security: 'AWS WAF + Shield'
  backup: 'AWS Backup + Cross-Region Replication'
  disaster: 'Multi-AZ Deployment + RTO < 1h'
}
```

---

## 3. ARQUITETURA DE COMPONENTES

### 3.1 Frontend Architecture

```typescript
// Component Architecture
interface ComponentArchitecture {
  // Layout Components
  layouts: {
    MainLayout: 'Main application layout with navigation'
    AuthLayout: 'Authentication pages layout'
    EditorLayout: 'Full-screen editor layout'
    DashboardLayout: 'Dashboard with sidebar'
  }
  
  // Page Components
  pages: {
    Dashboard: 'Main dashboard with project overview'
    Editor: 'Video editor with timeline and canvas'
    Projects: 'Project management and gallery'
    Templates: 'Template library and customization'
    Analytics: 'Usage analytics and insights'
    Settings: 'User preferences and configuration'
  }
  
  // Feature Components
  features: {
    PPTXUpload: 'Intelligent PPTX processing'
    Avatar3DViewer: '3D avatar display and interaction'
    TimelineEditor: 'Advanced timeline with tracks'
    VFXStudio: 'Visual effects library and editor'
    TTSGenerator: 'Text-to-speech with voice selection'
    RenderQueue: 'Render job management'
  }
  
  // Shared Components
  shared: {
    Button: 'Reusable button with variants'
    Modal: 'Modal dialog with animations'
    Tooltip: 'Contextual help tooltips'
    LoadingSpinner: 'Loading states and skeletons'
    ErrorBoundary: 'Error handling and recovery'
    Toast: 'Notification system'
  }
}

// State Management Architecture
interface StateArchitecture {
  // Global State (Zustand)
  global: {
    auth: 'User authentication and session'
    ui: 'UI state and preferences'
    notifications: 'Toast notifications queue'
  }
  
  // Feature State
  features: {
    editor: 'Editor canvas and timeline state'
    projects: 'Project data and metadata'
    render: 'Render queue and progress'
    tts: 'TTS generation and voice cache'
  }
  
  // Server State (TanStack Query)
  server: {
    projects: 'Project CRUD operations'
    assets: 'Media assets and uploads'
    templates: 'Template library'
    analytics: 'Usage metrics and insights'
  }
}
```

### 3.2 Backend Architecture

```typescript
// API Route Structure
interface APIArchitecture {
  // Authentication Routes
  auth: {
    'POST /api/auth/login': 'User login with credentials'
    'POST /api/auth/register': 'User registration'
    'POST /api/auth/refresh': 'Token refresh'
    'POST /api/auth/logout': 'User logout'
    'GET /api/auth/me': 'Current user profile'
  }
  
  // Project Management
  projects: {
    'GET /api/projects': 'List user projects'
    'POST /api/projects': 'Create new project'
    'GET /api/projects/:id': 'Get project details'
    'PUT /api/projects/:id': 'Update project'
    'DELETE /api/projects/:id': 'Delete project'
    'POST /api/projects/:id/duplicate': 'Duplicate project'
  }
  
  // PPTX Processing
  pptx: {
    'POST /api/pptx/upload': 'Upload and process PPTX'
    'GET /api/pptx/status/:id': 'Processing status'
    'POST /api/pptx/nr-detection': 'NR detection from content'
    'GET /api/pptx/templates/suggest': 'Template suggestions'
  }
  
  // TTS Services
  tts: {
    'POST /api/tts/generate': 'Generate speech from text'
    'GET /api/tts/voices': 'Available voices list'
    'POST /api/tts/clone': 'Voice cloning (premium)'
    'GET /api/tts/status/:id': 'Generation status'
  }
  
  // Avatar System
  avatars: {
    'GET /api/avatars': 'Available avatars list'
    'POST /api/avatars/customize': 'Customize avatar appearance'
    'POST /api/avatars/animate': 'Generate avatar animation'
    'GET /api/avatars/:id/expressions': 'Facial expressions'
  }
  
  // Rendering
  render: {
    'POST /api/render/start': 'Start render job'
    'GET /api/render/status/:id': 'Render progress'
    'GET /api/render/queue': 'Render queue status'
    'POST /api/render/cancel/:id': 'Cancel render job'
  }
  
  // Assets Management
  assets: {
    'POST /api/assets/upload': 'Upload media assets'
    'GET /api/assets': 'List user assets'
    'DELETE /api/assets/:id': 'Delete asset'
    'POST /api/assets/optimize': 'Optimize asset'
  }
}

// Service Layer Architecture
interface ServiceArchitecture {
  // Core Services
  core: {
    AuthService: 'Authentication and authorization'
    ProjectService: 'Project CRUD operations'
    UserService: 'User management'
    NotificationService: 'Email and push notifications'
  }
  
  // AI Services
  ai: {
    OpenAIService: 'GPT-4 integration'
    ElevenLabsService: 'TTS generation'
    AzureAIService: 'Azure Cognitive Services'
    GoogleAIService: 'Google Cloud AI'
    NRDetectionService: 'Custom NR detection'
  }
  
  // Media Services
  media: {
    PPTXProcessingService: 'PPTX parsing and conversion'
    VideoRenderingService: 'Video generation and rendering'
    ImageProcessingService: 'Image optimization'
    AudioProcessingService: 'Audio manipulation'
    Avatar3DService: '3D avatar management'
  }
  
  // Infrastructure Services
  infrastructure: {
    StorageService: 'File storage and CDN'
    CacheService: 'Redis caching'
    QueueService: 'Background job processing'
    MetricsService: 'Performance monitoring'
    LoggingService: 'Centralized logging'
  }
}
```

---

## 4. ESPECIFICAÇÕES DE BANCO DE DADOS

### 4.1 Schema Principal (PostgreSQL)

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    usage_limits JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- NR-10, NR-12, etc.
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    scenes JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Collaborators
CREATE TABLE project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, user_id)
);

-- Assets (Images, Videos, Audio)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- image, video, audio, 3d_model
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    dimensions JSONB, -- {width, height, duration}
    metadata JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- NR category
    thumbnail_url TEXT,
    preview_url TEXT,
    template_data JSONB NOT NULL,
    tags TEXT[],
    is_premium BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TTS Jobs and Cache
CREATE TABLE tts_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    voice_config JSONB NOT NULL,
    provider VARCHAR(50) NOT NULL, -- elevenlabs, azure, google
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    audio_url TEXT,
    duration_seconds DECIMAL(10,3),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Render Jobs
CREATE TABLE render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    render_config JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_time_seconds INTEGER,
    output_url TEXT,
    file_size BIGINT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and Usage Tracking
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- project_created, video_rendered, etc.
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NR Detection Cache
CREATE TABLE nr_detection_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of content
    detected_nrs TEXT[] NOT NULL,
    confidence_scores JSONB NOT NULL,
    suggested_templates UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Índices de Performance

```sql
-- Performance Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);

CREATE INDEX idx_tts_jobs_user_id ON tts_jobs(user_id);
CREATE INDEX idx_tts_jobs_status ON tts_jobs(status);
CREATE INDEX idx_tts_jobs_created_at ON tts_jobs(created_at DESC);

CREATE INDEX idx_render_jobs_user_id ON render_jobs(user_id);
CREATE INDEX idx_render_jobs_status ON render_jobs(status);
CREATE INDEX idx_render_jobs_created_at ON render_jobs(created_at DESC);

CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_event_type ON usage_analytics(event_type);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics(created_at DESC);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_premium ON templates(is_premium);
CREATE INDEX idx_templates_rating ON templates(rating DESC);

-- Full-text search indexes
CREATE INDEX idx_projects_search ON projects USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_templates_search ON templates USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));
```

### 4.3 Triggers e Funções

```sql
-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usage analytics trigger
CREATE OR REPLACE FUNCTION track_project_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO usage_analytics (user_id, project_id, event_type, event_data)
        VALUES (NEW.user_id, NEW.id, 'project_created', json_build_object('name', NEW.name, 'category', NEW.category));
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO usage_analytics (user_id, project_id, event_type, event_data)
        VALUES (NEW.user_id, NEW.id, 'project_status_changed', json_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER track_project_usage_trigger
    AFTER INSERT OR UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION track_project_usage();
```

---

## 5. APIS E INTEGRAÇÕES

### 5.1 API de Autenticação

```typescript
// Authentication API Specification
interface AuthAPI {
  // Login
  'POST /api/auth/login': {
    request: {
      email: string
      password: string
      rememberMe?: boolean
    }
    response: {
      token: string
      refreshToken: string
      user: User
      expiresIn: number
    }
  }
  
  // Register
  'POST /api/auth/register': {
    request: {
      email: string
      password: string
      name: string
      company?: string
      acceptTerms: boolean
    }
    response: {
      user: User
      verificationSent: boolean
    }
  }
  
  // Refresh Token
  'POST /api/auth/refresh': {
    request: {
      refreshToken: string
    }
    response: {
      token: string
      expiresIn: number
    }
  }
  
  // Password Reset
  'POST /api/auth/forgot-password': {
    request: {
      email: string
    }
    response: {
      message: string
      resetSent: boolean
    }
  }
}

// Implementation Example
export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json()
    
    // Validate input
    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    // Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Generate tokens
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      process.env.JWT_SECRET!,
      { expiresIn: rememberMe ? '30d' : '24h' }
    )
    
    const refreshToken = jwt.sign(
      { userId: data.user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '90d' }
    )
    
    // Track login analytics
    await trackEvent({
      userId: data.user.id,
      event: 'user_login',
      metadata: { rememberMe, userAgent: request.headers.get('user-agent') }
    })
    
    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name
      },
      expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 5.2 API de Processamento PPTX

```typescript
// PPTX Processing API
interface PPTXAPI {
  // Upload and Process
  'POST /api/pptx/upload': {
    request: FormData // file + options
    response: {
      id: string
      status: 'processing' | 'completed' | 'failed'
      progress: number
      estimatedTime: number
    }
  }
  
  // Get Processing Status
  'GET /api/pptx/status/:id': {
    response: {
      id: string
      status: 'processing' | 'completed' | 'failed'
      progress: number
      result?: {
        scenes: Scene[]
        detectedNRs: string[]
        suggestedTemplate: string
        extractedAssets: Asset[]
      }
      error?: string
    }
  }
  
  // NR Detection
  'POST /api/pptx/nr-detection': {
    request: {
      content: string
      images?: string[]
    }
    response: {
      detectedNRs: string[]
      confidence: Record<string, number>
      suggestedTemplates: string[]
      reasoning: string
    }
  }
}

// PPTX Processing Service
class PPTXProcessingService {
  async processFile(file: File, options: PPTXProcessingOptions): Promise<string> {
    const jobId = generateId()
    
    // Store file in S3
    const fileUrl = await this.uploadToS3(file)
    
    // Queue processing job
    await this.queueService.add('pptx-processing', {
      jobId,
      fileUrl,
      options,
      userId: options.userId
    })
    
    return jobId
  }
  
  async processSlides(fileUrl: string, options: PPTXProcessingOptions) {
    try {
      // Extract slides using node-pptx
      const slides = await this.extractSlides(fileUrl)
      
      // Process each slide
      const scenes: Scene[] = []
      for (const slide of slides) {
        // Extract text content
        const textContent = this.extractTextFromSlide(slide)
        
        // Extract images
        const images = await this.extractImagesFromSlide(slide)
        
        // Detect NR if enabled
        let detectedNRs: string[] = []
        if (options.detectNR) {
          detectedNRs = await this.detectNRFromContent(textContent)
        }
        
        // Generate scene
        const scene: Scene = {
          id: generateId(),
          name: `Slide ${slide.index + 1}`,
          duration: options.defaultSlideDuration || 10,
          elements: await this.generateElementsFromSlide(slide, textContent, images),
          background: await this.generateBackground(detectedNRs[0]),
          metadata: {
            originalSlideIndex: slide.index,
            detectedNRs,
            extractedText: textContent
          }
        }
        
        scenes.push(scene)
      }
      
      // Generate narration if enabled
      if (options.autoNarration) {
        await this.generateNarrationForScenes(scenes)
      }
      
      return {
        scenes,
        detectedNRs: [...new Set(scenes.flatMap(s => s.metadata.detectedNRs))],
        suggestedTemplate: await this.suggestTemplate(scenes),
        extractedAssets: await this.getExtractedAssets(scenes)
      }
      
    } catch (error) {
      console.error('PPTX processing error:', error)
      throw new Error(`Failed to process PPTX: ${error.message}`)
    }
  }
  
  private async detectNRFromContent(content: string): Promise<string[]> {
    // Use OpenAI GPT-4 for NR detection
    const response = await this.openaiService.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em Normas Regulamentadoras (NR) brasileiras. 
                   Analise o conteúdo fornecido e identifique quais NRs são relevantes.
                   Responda apenas com os códigos das NRs (ex: NR-10, NR-12) separados por vírgula.`
        },
        {
          role: 'user',
          content: `Analise este conteúdo e identifique as NRs relevantes:\n\n${content}`
        }
      ],
      temperature: 0.1,
      max_tokens: 100
    })
    
    const detectedText = response.choices[0]?.message?.content || ''
    return detectedText.split(',').map(nr => nr.trim()).filter(nr => nr.startsWith('NR-'))
  }
}
```

### 5.3 API de TTS Multi-Provider

```typescript
// TTS API Specification
interface TTSAPI {
  // Generate Speech
  'POST /api/tts/generate': {
    request: {
      text: string
      voice: VoiceConfig
      settings: TTSSettings
      format: 'mp3' | 'wav' | 'ogg'
    }
    response: {
      id: string
      status: 'processing' | 'completed' | 'failed'
      audioUrl?: string
      duration?: number
      error?: string
    }
  }
  
  // List Available Voices
  'GET /api/tts/voices': {
    query: {
      provider?: 'elevenlabs' | 'azure' | 'google'
      language?: string
      gender?: 'male' | 'female'
    }
    response: {
      voices: Voice[]
    }
  }
  
  // Voice Cloning (Premium)
  'POST /api/tts/clone': {
    request: {
      name: string
      audioSamples: File[]
      description?: string
    }
    response: {
      voiceId: string
      status: 'training' | 'ready' | 'failed'
      estimatedTime: number
    }
  }
}

// Multi-Provider TTS Service
class TTSService {
  private providers: Map<string, TTSProvider> = new Map()
  
  constructor() {
    this.providers.set('elevenlabs', new ElevenLabsProvider())
    this.providers.set('azure', new AzureTTSProvider())
    this.providers.set('google', new GoogleTTSProvider())
  }
  
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const { text, voice, settings, format } = request
    
    // Validate text length
    if (text.length > 5000) {
      throw new Error('Text too long. Maximum 5000 characters.')
    }
    
    // Get provider
    const provider = this.providers.get(voice.provider)
    if (!provider) {
      throw new Error(`Provider ${voice.provider} not available`)
    }
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cached = await this.getCachedAudio(cacheKey)
      if (cached) {
        return cached
      }
      
      // Generate speech
      const result = await provider.synthesize({
        text,
        voice,
        settings,
        format
      })
      
      // Cache result
      await this.cacheAudio(cacheKey, result)
      
      // Track usage
      await this.trackUsage(request, result)
      
      return result
      
    } catch (error) {
      console.error(`TTS generation failed with ${voice.provider}:`, error)
      
      // Try fallback provider
      const fallbackProvider = this.getFallbackProvider(voice.provider)
      if (fallbackProvider) {
        console.log(`Trying fallback provider: ${fallbackProvider}`)
        return this.generateSpeech({
          ...request,
          voice: { ...voice, provider: fallbackProvider }
        })
      }
      
      throw error
    }
  }
  
  private getFallbackProvider(failedProvider: string): string | null {
    const fallbackChain = {
      'elevenlabs': 'azure',
      'azure': 'google',
      'google': 'elevenlabs'
    }
    return fallbackChain[failedProvider] || null
  }
}

// ElevenLabs Provider Implementation
class ElevenLabsProvider implements TTSProvider {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'
  
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY!
  }
  
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const { text, voice, settings } = request
    
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarityBoost,
          style: settings.style,
          use_speaker_boost: settings.speakerBoost
        }
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${error}`)
    }
    
    const audioBuffer = await response.arrayBuffer()
    
    // Upload to S3
    const audioUrl = await this.uploadAudioToS3(audioBuffer, 'mp3')
    
    // Get duration
    const duration = await this.getAudioDuration(audioBuffer)
    
    return {
      id: generateId(),
      status: 'completed',
      audioUrl,
      duration,
      provider: 'elevenlabs'
    }
  }
  
  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    })
    
    const data = await response.json()
    
    return data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      provider: 'elevenlabs',
      language: voice.labels?.language || 'en',
      gender: voice.labels?.gender || 'unknown',
      accent: voice.labels?.accent,
      description: voice.labels?.description,
      previewUrl: voice.preview_url
    }))
  }
}
```

---

## 6. SEGURANÇA E COMPLIANCE

### 6.1 Arquitetura de Segurança

```typescript
// Security Architecture
interface SecurityArchitecture {
  // Authentication & Authorization
  auth: {
    provider: 'Supabase Auth + Custom JWT'
    mfa: 'TOTP + SMS (optional)'
    oauth: 'Google + Microsoft + LinkedIn'
    sessionManagement: 'JWT + Refresh Tokens'
    passwordPolicy: 'Min 8 chars, complexity required'
  }
  
  // API Security
  api: {
    rateLimiting: 'Redis-based sliding window'
    cors: 'Strict origin validation'
    validation: 'Zod schema validation'
    sanitization: 'DOMPurify + SQL injection prevention'
    encryption: 'AES-256-GCM for sensitive data'
  }
  
  // Infrastructure Security
  infrastructure: {
    network: 'VPC + Private subnets'
    firewall: 'AWS WAF + Security Groups'
    ssl: 'TLS 1.3 + HSTS'
    secrets: 'AWS Secrets Manager'
    monitoring: 'CloudTrail + GuardDuty'
  }
  
  // Data Protection
  data: {
    encryption: 'At rest (AES-256) + In transit (TLS 1.3)'
    backup: 'Encrypted backups + Cross-region replication'
    retention: 'GDPR compliant data retention'
    anonymization: 'PII anonymization for analytics'
    access: 'Role-based access control (RBAC)'
  }
}

// Security Middleware
class SecurityMiddleware {
  // Rate Limiting
  static rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    })
  })
  
  // CORS Configuration
  static corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://estudio-ia-videos.com',
        'https://app.estudio-ia-videos.com',
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
      ]
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  }
  
  // Input Validation
  static validateInput(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validation = schema.safeParse(req.body)
        if (!validation.success) {
          return res.status(400).json({
            error: 'Validation failed',
            details: validation.error.errors
          })
        }
        req.body = validation.data
        next()
      } catch (error) {
        res.status(400).json({ error: 'Invalid input format' })
      }
    }
  }
  
  // Authentication
  static authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ error: 'No token provided' })
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
      
      // Check if user exists and is active
      const user = await getUserById(decoded.userId)
      if (!user || user.status !== 'active') {
        return res.status(401).json({ error: 'Invalid or inactive user' })
      }
      
      req.user = user
      next()
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' })
    }
  }
  
  // Authorization
  static authorize(permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const userPermissions = req.user?.permissions || []
      const hasPermission = permissions.some(p => userPermissions.includes(p))
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      
      next()
    }
  }
}
```

### 6.2 Compliance e Privacidade

```typescript
// GDPR Compliance
interface GDPRCompliance {
  // Data Subject Rights
  rights: {
    access: 'GET /api/gdpr/data-export'
    rectification: 'PUT /api/gdpr/data-update'
    erasure: 'DELETE /api/gdpr/data-delete'
    portability: 'GET /api/gdpr/data-export?format=json'
    objection: 'POST /api/gdpr/processing-objection'
    restriction: 'POST /api/gdpr/processing-restriction'
  }
  
  // Data Processing
  processing: {
    lawfulBasis: 'Consent + Legitimate Interest'
    dataMinimization: 'Collect only necessary data'
    purposeLimitation: 'Use data only for stated purposes'
    accuracyPrinciple: 'Keep data accurate and up-to-date'
    storageLimitation: 'Delete data after retention period'
    integrityConfidentiality: 'Secure data processing'
  }
  
  // Privacy by Design
  privacy: {
    defaultSettings: 'Privacy-friendly defaults'
    dataProtection: 'Built-in data protection'
    transparency: 'Clear privacy notices'
    userControl: 'Granular privacy controls'
    minimization: 'Minimal data collection'
  }
}

// LGPD (Brazilian Data Protection Law) Compliance
interface LGPDCompliance {
  // Legal Bases (Art. 7)
  legalBases: {
    consent: 'Explicit user consent'
    contractualCompliance: 'Contract execution'
    legalObligation: 'Legal compliance'
    legitimateInterest: 'Legitimate business interest'
    publicInterest: 'Public interest'
    creditProtection: 'Credit protection'
  }
  
  // Data Subject Rights (Art. 18)
  rights: {
    confirmation: 'Confirm data processing'
    access: 'Access personal data'
    correction: 'Correct incomplete data'
    anonymization: 'Anonymize data'
    portability: 'Data portability'
    deletion: 'Delete personal data'
    information: 'Processing information'
    objection: 'Object to processing'
  }
}

// Privacy Service Implementation
class PrivacyService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await this.getUserData(userId)
    const projects = await this.getUserProjects(userId)
    const assets = await this.getUserAssets(userId)
    const analytics = await this.getUserAnalytics(userId)
    
    return {
      user: this.anonymizeUserData(user),
      projects: projects.map(p => this.anonymizeProjectData(p)),
      assets: assets.map(a => this.anonymizeAssetData(a)),
      analytics: this.aggregateAnalytics(analytics),
      exportDate: new Date().toISOString(),
      format: 'GDPR-compliant JSON'
    }
  }
  
  async deleteUserData(userId: string, reason: string): Promise<void> {
    // Log deletion request
    await this.logDataDeletion(userId, reason)
    
    // Delete user data in order
    await this.deleteUserAnalytics(userId)
    await this.deleteUserAssets(userId)
    await this.deleteUserProjects(userId)
    await this.anonymizeUserAccount(userId)
    
    // Notify relevant services
    await this.notifyDataDeletion(userId)
  }
  
  async anonymizeUserData(userId: string): Promise<void> {
    // Replace PII with anonymized values
    await this.database.user.update({
      where: { id: userId },
      data: {
        email: `anonymized_${generateId()}@deleted.local`,
        name: 'Deleted User',
        avatar_url: null,
        preferences: {},
        deleted_at: new Date()
      }
    })
  }
}
```

---

## 7. MONITORAMENTO E OBSERVABILIDADE

### 7.1 Stack de Monitoramento

```typescript
// Monitoring Stack
interface MonitoringStack {
  // Metrics Collection
  metrics: {
    application: 'Prometheus + Custom metrics'
    infrastructure: 'CloudWatch + DataDog'
    business: 'Custom analytics + Mixpanel'
    performance: 'Web Vitals + Real User Monitoring'
  }
  
  // Logging
  logging: {
    application: 'Winston + CloudWatch Logs'
    access: 'Morgan + ELK Stack'
    security: 'AWS CloudTrail + GuardDuty'
    audit: 'Custom audit logs'
  }
  
  // Tracing
  tracing: {
    distributed: 'OpenTelemetry + Jaeger'
    performance: 'DataDog APM'
    errors: 'Sentry'
  }
  
  // Alerting
  alerting: {
    infrastructure: 'CloudWatch Alarms'
    application: 'PagerDuty + Slack'
    business: 'Custom webhooks'
    security: 'AWS Security Hub'
  }
}

// Custom Metrics Service
class MetricsService {
  private prometheus = require('prom-client')
  
  // Application Metrics
  private httpRequestDuration = new this.prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  })
  
  private activeUsers = new this.prometheus.Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
  })
  
  private renderJobs = new this.prometheus.Gauge({
    name: 'render_jobs_total',
    help: 'Number of render jobs by status',
    labelNames: ['status']
  })
  
  private ttsGeneration = new this.prometheus.Histogram({
    name: 'tts_generation_duration_seconds',
    help: 'Duration of TTS generation',
    labelNames: ['provider', 'voice_type']
  })
  
  // Business Metrics
  private videosCreated = new this.prometheus.Counter({
    name: 'videos_created_total',
    help: 'Total number of videos created',
    labelNames: ['template_category', 'user_plan']
  })
  
  private revenueGenerated = new this.prometheus.Counter({
    name: 'revenue_generated_total',
    help: 'Total revenue generated',
    labelNames: ['plan_type', 'billing_period']
  })
  
  // Track HTTP Request
  trackHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration)
  }
  
  // Track Business Events
  trackVideoCreation(templateCategory: string, userPlan: string) {
    this.videosCreated.labels(templateCategory, userPlan).inc()
  }
  
  trackTTSGeneration(provider: string, voiceType: string, duration: number) {
    this.ttsGeneration.labels(provider, voiceType).observe(duration)
  }
  
  // Update Gauges
  updateActiveUsers(count: number) {
    this.activeUsers.set(count)
  }
  
  updateRenderJobs(status: string, count: number) {
    this.renderJobs.labels(status).set(count)
  }
}

// Logging Service
class LoggingService {
  private logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'estudio-ia-videos' },
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  })
  
  // Structured Logging Methods
  logUserAction(userId: string, action: string, metadata: any = {}) {
    this.logger.info('User action', {
      userId,
      action,
      metadata,
      timestamp: new Date().toISOString()
    })
  }
  
  logAPIRequest(req: Request, res: Response, duration: number) {
    this.logger.info('API request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id
    })
  }
  
  logError(error: Error, context: any = {}) {
    this.logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }
  
  logBusinessEvent(event: string, data: any) {
    this.logger.info('Business event', {
      event,
      data,
      timestamp: new Date().toISOString()
    })
  }
}
```

### 7.2 Dashboards e Alertas

```typescript
// Dashboard Configuration
interface DashboardConfig {
  // System Health Dashboard
  systemHealth: {
    panels: [
      'API Response Time',
      'Error Rate',
      'Active Users',
      'System Uptime',
      'Database Performance',
      'Cache Hit Rate'
    ]
    refreshInterval: '30s'
    alertThresholds: {
      responseTime: '>2s'
      errorRate: '>1%'
      uptime: '<99.9%'
    }
  }
  
  // Business Metrics Dashboard
  business: {
    panels: [
      'Videos Created (Daily/Weekly/Monthly)',
      'User Registrations',
      'Revenue Metrics',
      'Feature Usage',
      'Conversion Funnel',
      'Customer Satisfaction'
    ]
    refreshInterval: '5m'
    alertThresholds: {
      dailyVideos: '<100'
      conversionRate: '<20%'
      nps: '<70'
    }
  }
  
  // Performance Dashboard
  performance: {
    panels: [
      'Page Load Times',
      'Editor Performance',
      'Render Queue Length',
      'TTS Generation Time',
      'PPTX Processing Time',
      'CDN Performance'
    ]
    refreshInterval: '1m'
    alertThresholds: {
      pageLoad: '>3s'
      renderQueue: '>50 jobs'
      ttsGeneration: '>10s'
    }
  }
}

// Alert Manager
class AlertManager {
  private alertChannels = {
    slack: process.env.SLACK_WEBHOOK_URL,
    pagerduty: process.env.PAGERDUTY_API_KEY,
    email: process.env.ALERT_EMAIL
  }
  
  async sendAlert(alert: Alert) {
    const { severity, title, message, metadata } = alert
    
    // Send to appropriate channels based on severity
    switch (severity) {
      case 'critical':
        await this.sendToPagerDuty(alert)
        await this.sendToSlack(alert)
        await this.sendEmail(alert)
        break
        
      case 'high':
        await this.sendToSlack(alert)
        await this.sendEmail(alert)
        break
        
      case 'medium':
        await this.sendToSlack(alert)
        break
        
      case 'low':
        // Log only
        console.log('Low severity alert:', alert)
        break
    }
  }
  
  private async sendToSlack(alert: Alert) {
    const payload = {
      text: `🚨 ${alert.title}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Service',
              value: alert.metadata.service || 'Unknown',
              short: true
            },
            {
              title: 'Message',
              value: alert.message,
              short: false
            }
          ],
          timestamp: Math.floor(Date.now() / 1000)
        }
      ]
    }
    
    await fetch(this.alertChannels.slack, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
  
  private getSeverityColor(severity: string): string {
    const colors = {
      critical: '#FF0000',
      high: '#FF8C00',
      medium: '#FFD700',
      low: '#32CD32'
    }
    return colors[severity] || '#808080'
  }
}
```

---

## 8. DEPLOYMENT E DEVOPS

### 8.1 Estratégia de Deployment

```typescript
// Deployment Strategy
interface DeploymentStrategy {
  // Environment Configuration
  environments: {
    development: {
      infrastructure: 'Local Docker + Supabase'
      deployment: 'Hot reload + Live debugging'
      database: 'Local PostgreSQL'
      storage: 'Local filesystem'
    }
    staging: {
      infrastructure: 'AWS ECS + RDS'
      deployment: 'Blue-Green deployment'
      database: 'PostgreSQL (smaller instance)'
      storage: 'S3 + CloudFront'
    }
    production: {
      infrastructure: 'AWS ECS + Multi-AZ RDS'
      deployment: 'Rolling deployment with health checks'
      database: 'PostgreSQL with read replicas'
      storage: 'S3 + CloudFront + Edge caching'
    }
  }
  
  // CI/CD Pipeline
  pipeline: {
    trigger: 'Git push to main/develop branches'
    stages: [
      'Code quality checks (ESLint, Prettier)',
      'Unit tests (Jest + Vitest)',
      'Integration tests (Playwright)',
      'Security scanning (Snyk)',
      'Build Docker images',
      'Deploy to staging',
      'E2E tests on staging',
      'Deploy to production (with approval)',
      'Post-deployment verification'
    ]
  }
}

// Docker Configuration
// Dockerfile.frontend
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

// Dockerfile.backend
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```
```

### 8.2 Infrastructure as Code

```typescript
// Terraform Configuration
// main.tf
```hcl
provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "estudio-ia-videos-vpc"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "Private Subnet ${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "Public Subnet ${count.index + 1}"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "estudio-ia-videos-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier = "estudio-ia-videos-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Name = "estudio-ia-videos-db-${var.environment}"
    Environment = var.environment
  }
}

# S3 Bucket for Assets
resource "aws_s3_bucket" "assets" {
  bucket = "estudio-ia-videos-assets-${var.environment}"
  
  tags = {
    Name = "Assets Bucket"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "assets" {
  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.assets.bucket}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets.cloudfront_access_identity_path
    }
  }
  
  enabled = true
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.assets.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name = "Assets CDN"
    Environment = var.environment
  }
}
```
```

### 8.3 Monitoramento de Produção

```typescript
// Production Monitoring Setup
interface ProductionMonitoring {
  // Health Checks
  healthChecks: {
    api: 'GET /api/health'
    database: 'SELECT 1 FROM users LIMIT 1'
    redis: 'PING command'
    s3: 'LIST bucket operation'
    external: 'TTS providers availability'
  }
  
  // SLA Monitoring
  sla: {
    uptime: '99.9% (8.76 hours downtime/year)'
    responseTime: '95th percentile < 2 seconds'
    errorRate: '< 0.1% of requests'
    renderSuccess: '> 99.5% success rate'
  }
  
  // Capacity Planning
  capacity: {
    users: 'Monitor concurrent users vs limits'
    storage: 'Track S3 usage and costs'
    compute: 'ECS task utilization'
    database: 'Connection pool and query performance'
  }
}

// Health Check Implementation
class HealthCheckService {
  async performHealthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkS3(),
      this.checkExternalServices()
    ])
    
    const results = {
      database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      redis: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      s3: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      external: checks[3].status === 'fulfilled' ? 'healthy' : 'unhealthy'
    }
    
    const overallStatus = Object.values(results).every(status => status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy'
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
      uptime: process.uptime(),
      version: process.env.APP_VERSION || 'unknown'
    }
  }
  
  private async checkDatabase(): Promise<void> {
    await this.database.raw('SELECT 1')
  }
  
  private async checkRedis(): Promise<void> {
    await this.redis.ping()
  }
  
  private async checkS3(): Promise<void> {
    await this.s3.listObjectsV2({
      Bucket: process.env.S3_BUCKET_NAME!,
      MaxKeys: 1
    }).promise()
  }
  
  private async checkExternalServices(): Promise<void> {
    // Check critical external services
    const checks = [
      fetch('https://api.elevenlabs.io/v1/voices', { method: 'HEAD' }),
      fetch('https://api.openai.com/v1/models', { method: 'HEAD' })
    ]
    
    await Promise.all(checks)
  }
}
```

---

## 9. CONCLUSÃO E PRÓXIMOS PASSOS

### 9.1 Resumo da Arquitetura

Esta arquitetura técnica consolidada estabelece uma base sólida e escalável para o Estúdio IA de Vídeos, incorporando:

**🏗️ Arquitetura Moderna:**
- Microserviços com Next.js e React
- Cloud-native com AWS
- Event-driven architecture
- API-first design

**🚀 Performance Otimizada:**
- CDN global com CloudFront
- Cache distribuído com Redis
- Renderização GPU-acelerada
- Lazy loading e code splitting

**🔒 Segurança Robusta:**
- Autenticação multi-fator
- Criptografia end-to-end
- Compliance GDPR/LGPD
- Monitoramento de segurança

**📊 Observabilidade Completa:**
- Métricas em tempo real
- Distributed tracing
- Alertas inteligentes
- Dashboards executivos

### 9.2 Benefícios da Arquitetura

| Benefício | Implementação | Impacto |
|-----------|---------------|----------|
| **Escalabilidade** | Auto-scaling + Load balancing | Suporte a 1000+ usuários simultâneos |
| **Confiabilidade** | Multi-AZ + Backup automático | 99.9% uptime garantido |
| **Performance** | CDN + Cache + GPU | <2s carregamento, 60fps editor |
| **Segurança** | WAF + Encryption + Monitoring | Proteção enterprise-grade |
| **Manutenibilidade** | Microserviços + IaC + CI/CD | Deploy em minutos, rollback automático |
| **Observabilidade** | Metrics + Logs + Traces | Visibilidade completa do sistema |

### 9.3 Roadmap de Implementação

**Fase 1: Fundação (Semanas 1-6)**
- ✅ Setup da infraestrutura AWS
- ✅ Configuração do CI/CD pipeline
- ✅ Implementação da autenticação
- ✅ Dashboard básico funcional

**Fase 2: Core Features (Semanas 7-16)**
- 🔄 Editor avançado com timeline
- 🔄 Sistema de avatares 3D
- 🔄 TTS multi-provider
- 🔄 Processamento PPTX inteligente

**Fase 3: Advanced Features (Semanas 17-24)**
- ⏳ Engine VFX com GSAP
- ⏳ Renderização cloud distribuída
- ⏳ Sistema de colaboração
- ⏳ Analytics avançado

**Fase 4: Optimization (Semanas 25-32)**
- ⏳ Performance tuning
- ⏳ Security hardening
- ⏳ Monitoring enhancement
- ⏳ Load testing

**Fase 5: Launch (Semanas 33-40)**
- ⏳ Beta testing program
- ⏳ Production deployment
- ⏳ User onboarding
- ⏳ Support system

### 9.4 Métricas de Sucesso Técnico

**Performance Targets:**
- Dashboard load time: <2 segundos
- Editor responsiveness: 60fps constante
- TTS generation: <5 segundos
- Render queue processing: <2 minutos espera
- API response time: <500ms (95th percentile)

**Reliability Targets:**
- System uptime: >99.9%
- Error rate: <0.1%
- Data durability: 99.999999999% (11 9's)
- Backup recovery: <1 hora RTO
- Security incidents: Zero tolerance

**Scalability Targets:**
- Concurrent users: 1000+
- Daily video renders: 10,000+
- Storage capacity: Unlimited (S3)
- API throughput: 10,000 req/min
- Database connections: 1000+

### 9.5 Considerações Futuras

**Tecnologias Emergentes:**
- **WebGPU:** Para renderização 3D mais eficiente
- **WebAssembly:** Para processamento pesado no frontend
- **Edge Computing:** Para reduzir latência global
- **AI/ML Avançado:** Modelos próprios para NR detection
- **Blockchain:** Para certificação de treinamentos

**Expansão Internacional:**
- Multi-region deployment
- Localização de conteúdo
- Compliance regional
- CDN edge locations
- Suporte multilíngue

**Integrações Futuras:**
- LMS corporativos (Moodle, Blackboard)
- Sistemas de RH (SAP, Workday)
- Plataformas de vídeo (YouTube, Vimeo)
- Ferramentas de compliance
- APIs de terceiros

---

**Documento preparado por:** Equipe de Arquitetura Técnica  
**Data:** Janeiro 2025  
**Versão:** 1.0  
**Próxima revisão:** Março 2025  
**Status:** Aprovado para implementação

**Contatos:**
- **Tech Lead:** tech-lead@estudio-ia-videos.com
- **DevOps:** devops@estudio-ia-videos.com
- **Security:** security@estudio-ia-videos.com
- **Suporte:** support@estudio-ia-videos.com