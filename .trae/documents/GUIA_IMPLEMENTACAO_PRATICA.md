# 🚀 GUIA DE IMPLEMENTAÇÃO PRÁTICA
## Estúdio IA de Vídeos - Manual de Execução Imediata

> **GUIA EXECUTIVO:** Manual prático para implementação imediata de todas as fases do projeto com comandos, configurações e checklists prontos para uso.

---

## 1. Setup Inicial do Projeto

### **1.1 Preparação do Ambiente**

#### **Pré-requisitos do Sistema**
```bash
# Verificar versões necessárias
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
git --version   # >= 2.30.0

# Instalar dependências globais
npm install -g @vercel/cli
npm install -g typescript
npm install -g @supabase/cli
```

#### **Configuração do Projeto Base**
```bash
# 1. Criar projeto Next.js 14
npx create-next-app@latest estudio-ia-videos \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd estudio-ia-videos

# 2. Instalar dependências principais
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install fabric konva react-konva
npm install three @react-three/fiber @react-three/drei
npm install gsap framer-motion
npm install @ffmpeg/ffmpeg @ffmpeg/util
npm install openai elevenlabs
npm install sharp pptxgenjs
npm install zustand @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react class-variance-authority clsx tailwind-merge

# 3. Dependências de desenvolvimento
npm install -D @types/three @types/fabric
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D eslint-config-prettier prettier
npm install -D @storybook/nextjs storybook
```

### **1.2 Configuração de Variáveis de Ambiente**

#### **Arquivo .env.local**
```env
# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS Services
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=estudio-ia-assets
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key
ANTHROPIC_API_KEY=your-anthropic-key

# Stock Media
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key

# 3D Services
METAHUMAN_API_KEY=your-metahuman-key
READYPLAYERME_APP_ID=your-rpm-app-id

# Monitoring
SENTRY_DSN=your-sentry-dsn

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379
```

### **1.3 Estrutura de Diretórios**

```bash
# Criar estrutura de pastas
mkdir -p app/{api,components,hooks,lib,types,styles}
mkdir -p app/api/{v1/{pptx,tts,avatars,render,ai},auth}
mkdir -p app/components/{ui,layout,auth,dashboard,pptx,avatars,tts,effects,render,ai,mobile,blockchain}
mkdir -p app/hooks
mkdir -p app/lib/{utils,api,auth,canvas,ffmpeg,three,ai,blockchain}
mkdir -p public/{avatars,templates,assets}
mkdir -p docs/{api,user-guide,technical}
mkdir -p tests/{unit,integration,e2e}
```

## 2. FASE 1: Implementação PPTX Module

### **2.1 Setup Database Supabase**

#### **Inicializar Supabase**
```bash
# Inicializar projeto Supabase
supabase init
supabase start

# Criar migrations
supabase migration new create_initial_tables
```

#### **SQL para Tabelas Principais**
```sql
-- supabase/migrations/001_create_initial_tables.sql

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    usage_count INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('pptx', 'talking_photo', 'avatar_3d', 'custom')),
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenes table
CREATE TABLE public.scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    content JSONB DEFAULT '{}',
    animations JSONB DEFAULT '{}',
    duration FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Elements table
CREATE TABLE public.elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'image', 'video', 'avatar', 'shape', 'effect')),
    properties JSONB DEFAULT '{}',
    transform JSONB DEFAULT '{}',
    style JSONB DEFAULT '{}',
    z_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_scenes_project_id ON public.scenes(project_id);
CREATE INDEX idx_elements_scene_id ON public.elements(scene_id);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own data" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access scenes from their projects" ON public.scenes
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM public.projects WHERE id = scenes.project_id
    ));

CREATE POLICY "Users can only access elements from their scenes" ON public.elements
    FOR ALL USING (auth.uid() IN (
        SELECT p.user_id FROM public.projects p 
        JOIN public.scenes s ON p.id = s.project_id 
        WHERE s.id = elements.scene_id
    ));
```

#### **Aplicar Migrations**
```bash
# Aplicar migrations
supabase db push

# Verificar status
supabase status
```

### **2.2 Implementação Upload PPTX**

#### **API Route para Upload**
```typescript
// app/api/v1/pptx/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import PptxGenJS from 'pptxgenjs'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectName = formData.get('projectName') as string
    
    if (!file || !projectName) {
      return NextResponse.json({ error: 'Missing file or project name' }, { status: 400 })
    }

    // Validate file type and size
    if (!file.name.endsWith('.pptx')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Upload to S3
    const fileKey = `uploads/${user.id}/${uuidv4()}-${file.name}`
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    })
    
    await s3Client.send(uploadCommand)

    // Create project in database
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: projectName,
        type: 'pptx',
        metadata: {
          originalFileName: file.name,
          fileSize: file.size,
          s3Key: fileKey,
        },
        status: 'processing'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Start background processing
    await processPPTX(project.id, fileKey)

    return NextResponse.json({ 
      projectId: project.id,
      status: 'processing',
      message: 'Upload successful, processing started'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processPPTX(projectId: string, s3Key: string) {
  // Background processing logic
  // This would typically be handled by a queue system
  console.log(`Processing PPTX for project ${projectId} from ${s3Key}`)
}
```

#### **Component de Upload**
```typescript
// app/components/pptx/PPTXUploadReal.tsx
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PPTXUploadProps {
  onUploadComplete: (projectId: string) => void
}

export function PPTXUploadReal({ onUploadComplete }: PPTXUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [projectName, setProjectName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.name.endsWith('.pptx')) {
      setSelectedFile(file)
      if (!projectName) {
        setProjectName(file.name.replace('.pptx', ''))
      }
    } else {
      toast.error('Por favor, selecione um arquivo PPTX válido')
    }
  }, [projectName])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false
  })

  const handleUpload = async () => {
    if (!selectedFile || !projectName.trim()) {
      toast.error('Por favor, selecione um arquivo e digite um nome para o projeto')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('projectName', projectName.trim())

      const response = await fetch('/api/v1/pptx/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro no upload')
      }

      const result = await response.json()
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Poll for processing completion
      const pollStatus = async () => {
        const statusResponse = await fetch(`/api/v1/pptx/status/${result.projectId}`)
        const status = await statusResponse.json()
        
        if (status.status === 'completed') {
          setProgress(100)
          toast.success('Upload e processamento concluídos!')
          onUploadComplete(result.projectId)
        } else if (status.status === 'error') {
          throw new Error('Erro no processamento do arquivo')
        } else {
          setTimeout(pollStatus, 2000)
        }
      }

      setTimeout(pollStatus, 1000)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro no upload')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload de Apresentação PPTX</h2>
        <p className="text-muted-foreground">
          Faça upload do seu arquivo PowerPoint para começar a criar seu vídeo
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nome do Projeto
          </label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Digite o nome do seu projeto"
            disabled={uploading}
          />
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="h-12 w-12 mx-auto text-primary" />
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste seu arquivo PPTX aqui'}
              </p>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar (máximo 100MB)
              </p>
            </div>
          )}
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processando...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !projectName.trim() || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Processando...' : 'Iniciar Processamento'}
        </Button>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Formatos suportados:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Arquivos .pptx (PowerPoint 2016+)</li>
              <li>Tamanho máximo: 100MB</li>
              <li>Texto, imagens e layouts serão extraídos automaticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **2.3 Canvas Editor com Fabric.js**

#### **Hook para Canvas**
```typescript
// app/hooks/usePPTXCanvas.ts
import { useRef, useEffect, useState } from 'react'
import { fabric } from 'fabric'

interface CanvasState {
  canvas: fabric.Canvas | null
  history: string[]
  historyIndex: number
}

export function usePPTXCanvas(canvasId: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<CanvasState>({
    canvas: null,
    history: [],
    historyIndex: -1
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1920,
      height: 1080,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    // Enable object controls
    canvas.on('object:modified', () => {
      saveState()
    })

    canvas.on('object:added', () => {
      saveState()
    })

    canvas.on('object:removed', () => {
      saveState()
    })

    setState(prev => ({ ...prev, canvas }))

    const saveState = () => {
      const json = canvas.toJSON()
      setState(prev => ({
        ...prev,
        history: [...prev.history.slice(0, prev.historyIndex + 1), JSON.stringify(json)],
        historyIndex: prev.historyIndex + 1
      }))
    }

    // Initial state
    saveState()

    return () => {
      canvas.dispose()
    }
  }, [canvasId])

  const addText = (text: string, options?: Partial<fabric.ITextOptions>) => {
    if (!state.canvas) return

    const textObj = new fabric.IText(text, {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#000000',
      ...options
    })

    state.canvas.add(textObj)
    state.canvas.setActiveObject(textObj)
    state.canvas.renderAll()
  }

  const addImage = async (imageUrl: string) => {
    if (!state.canvas) return

    return new Promise((resolve) => {
      fabric.Image.fromURL(imageUrl, (img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5
        })
        
        state.canvas!.add(img)
        state.canvas!.setActiveObject(img)
        state.canvas!.renderAll()
        resolve(img)
      })
    })
  }

  const undo = () => {
    if (state.historyIndex > 0) {
      const prevState = state.history[state.historyIndex - 1]
      state.canvas?.loadFromJSON(prevState, () => {
        state.canvas?.renderAll()
        setState(prev => ({ ...prev, historyIndex: prev.historyIndex - 1 }))
      })
    }
  }

  const redo = () => {
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1]
      state.canvas?.loadFromJSON(nextState, () => {
        state.canvas?.renderAll()
        setState(prev => ({ ...prev, historyIndex: prev.historyIndex + 1 }))
      })
    }
  }

  const exportToJSON = () => {
    return state.canvas?.toJSON()
  }

  const loadFromJSON = (json: any) => {
    state.canvas?.loadFromJSON(json, () => {
      state.canvas?.renderAll()
    })
  }

  return {
    canvasRef,
    canvas: state.canvas,
    addText,
    addImage,
    undo,
    redo,
    exportToJSON,
    loadFromJSON,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1
  }
}
```

## 3. Comandos de Deploy e Monitoramento

### **3.1 Deploy Vercel**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login e setup
vercel login
vercel

# Deploy de produção
vercel --prod

# Configurar domínio customizado
vercel domains add estudio-ia-videos.com
```

### **3.2 Configuração CI/CD**

#### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test
      - run: npm run build
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### **3.3 Monitoramento e Analytics**

#### **Setup Sentry**
```bash
# Instalar Sentry
npm install @sentry/nextjs

# Configurar
npx @sentry/wizard -i nextjs
```

#### **Configuração Sentry**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

## 4. Checklist de Implementação por Sprint

### **Sprint 14 Checklist**
- [ ] ✅ Setup projeto Next.js 14
- [ ] ✅ Configurar Supabase database
- [ ] ✅ Implementar autenticação
- [ ] ✅ Upload PPTX básico
- [ ] ✅ Parser PPTX funcional
- [ ] ✅ API de processamento
- [ ] ✅ Interface de upload
- [ ] ✅ Testes unitários
- [ ] ✅ Deploy staging

### **Sprint 15 Checklist**
- [ ] 🔄 Canvas editor Fabric.js
- [ ] 🔄 Sistema de layers
- [ ] 🔄 Edição de texto rica
- [ ] 🔄 Manipulação de imagens
- [ ] 🔄 Undo/Redo system
- [ ] 🔄 Snap e alinhamento
- [ ] 🔄 Zoom e pan
- [ ] 🔄 Persistência projetos
- [ ] 🔄 Testes integração

### **Sprint 16 Checklist**
- [ ] ⏳ Timeline component
- [ ] ⏳ Animações GSAP
- [ ] ⏳ Integração ElevenLabs
- [ ] ⏳ Seletor vozes TTS
- [ ] ⏳ Sincronização áudio
- [ ] ⏳ Preview animações
- [ ] ⏳ Export vídeo MVP
- [ ] ⏳ Testes end-to-end
- [ ] ⏳ Deploy produção

## 5. Scripts de Automação

### **5.1 Scripts Package.json**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:generate": "supabase gen types typescript --local > app/types/database.types.ts",
    "db:reset": "supabase db reset",
    "db:migrate": "supabase db push",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "analyze": "ANALYZE=true npm run build",
    "setup": "npm install && npm run db:migrate && npm run db:generate"
  }
}
```

### **5.2 Scripts de Setup Automático**

```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 Configurando Estúdio IA de Vídeos..."

# Verificar pré-requisitos
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado. Instale Git"
    exit 1
fi

echo "✅ Pré-requisitos verificados"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Configurar Supabase
echo "🗄️ Configurando database..."
supabase start
supabase db push
supabase gen types typescript --local > app/types/database.types.ts

# Configurar variáveis de ambiente
if [ ! -f .env.local ]; then
    echo "⚙️ Criando arquivo .env.local..."
    cp .env.example .env.local
    echo "📝 Configure as variáveis de ambiente em .env.local"
fi

# Build inicial
echo "🔨 Build inicial..."
npm run build

echo "🎉 Setup concluído! Execute 'npm run dev' para iniciar"
```

### **5.3 Scripts de Monitoramento**

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Verificando saúde do sistema..."

# Verificar Supabase
if supabase status | grep -q "API URL"; then
    echo "✅ Supabase: Online"
else
    echo "❌ Supabase: Offline"
fi

# Verificar build
if npm run build > /dev/null 2>&1; then
    echo "✅ Build: Sucesso"
else
    echo "❌ Build: Falha"
fi

# Verificar testes
if npm test > /dev/null 2>&1; then
    echo "✅ Testes: Passando"
else
    echo "❌ Testes: Falhando"
fi

echo "📊 Verificação concluída"
```

## 6. Troubleshooting Comum

### **6.1 Problemas de Performance**

```typescript
// Otimização Canvas
const optimizeCanvas = (canvas: fabric.Canvas) => {
  // Reduzir qualidade durante interação
  canvas.on('object:moving', () => {
    canvas.renderOnAddRemove = false
  })
  
  canvas.on('object:modified', () => {
    canvas.renderOnAddRemove = true
    canvas.renderAll()
  })
  
  // Limitar objetos
  if (canvas.getObjects().length > 100) {
    console.warn('Muitos objetos no canvas, considere otimizar')
  }
}
```

### **6.2 Problemas de Memória**

```typescript
// Cleanup de recursos
const cleanupResources = () => {
  // Limpar canvas
  if (canvas) {
    canvas.dispose()
  }
  
  // Limpar URLs de objeto
  objectUrls.forEach(url => URL.revokeObjectURL(url))
  
  // Limpar timers
  clearInterval(animationTimer)
}

// Usar no useEffect cleanup
useEffect(() => {
  return () => {
    cleanupResources()
  }
}, [])
```

### **6.3 Problemas de API**

```typescript
// Retry logic para APIs
const apiWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
}
```

## 7. Próximos Passos Imediatos

### **Semana 1 (Sprint 14)**
1. ✅ Executar script de setup
2. ✅ Configurar variáveis de ambiente
3. ✅ Implementar upload PPTX
4. ✅ Testar pipeline básico

### **Semana 2 (Sprint 14)**
1. 🔄 Implementar parser PPTX
2. 🔄 Criar API de processamento
3. 🔄 Desenvolver interface upload
4. 🔄 Escrever testes unitários

### **Semana 3 (Sprint 15)**
1. ⏳ Setup Canvas Fabric.js
2. ⏳ Implementar sistema layers
3. ⏳ Criar edição de texto
4. ⏳ Adicionar manipulação imagens

---

**Este guia fornece todos os comandos, configurações e códigos necessários para implementação imediata do projeto Estúdio IA de Vídeos.**

**Autor:** SOLO Document  
**Data:** Janeiro 2025  
**Versão:** 1.0 - Practical Implementation Guide  
**Status:** 🚀 **READY TO EXECUTE**