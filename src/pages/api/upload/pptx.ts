import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuração para não usar o parser padrão do Next.js
export const config = {
  api: {
    bodyParser: false,
  },
}

interface ProcessedSlide {
  slideNumber: number
  title: string
  content: string
  notes: string
  imageUrl?: string
}

interface ProcessingResult {
  success: boolean
  projectId?: string
  slides?: ProcessedSlide[]
  error?: string
}

// Função para processar PPTX (simulação - em produção usaria biblioteca específica)
function processPPTX(filePath: string): ProcessedSlide[] {
  // Simulação do processamento de PPTX
  // Em produção, usaria bibliotecas como node-pptx ou similar
  const mockSlides: ProcessedSlide[] = [
    {
      slideNumber: 1,
      title: "Introdução à Segurança do Trabalho",
      content: "A segurança do trabalho é fundamental para prevenir acidentes e doenças ocupacionais.",
      notes: "Enfatizar a importância da prevenção e cultura de segurança."
    },
    {
      slideNumber: 2,
      title: "Normas Regulamentadoras",
      content: "As NRs estabelecem diretrizes obrigatórias para a segurança e saúde no trabalho.",
      notes: "Explicar o papel das NRs na legislação brasileira."
    },
    {
      slideNumber: 3,
      title: "Equipamentos de Proteção Individual",
      content: "EPIs são dispositivos de uso individual destinados à proteção contra riscos.",
      notes: "Demonstrar diferentes tipos de EPIs e sua aplicação."
    }
  ]
  
  return mockSlides
}

// Função para gerar conteúdo IA baseado nos slides
function generateAIContent(slides: ProcessedSlide[], nrCategory: string): ProcessedSlide[] {
  // Simulação da geração de conteúdo IA
  // Em produção, integraria com OpenAI ou similar
  return slides.map(slide => ({
    ...slide,
    content: `${slide.content} [Conteúdo expandido pela IA para ${nrCategory}]`,
    notes: `${slide.notes} [Notas geradas pela IA com foco em ${nrCategory}]`
  }))
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProcessingResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authConfig)
    if (!session?.user?.email) {
      return res.status(401).json({ success: false, error: 'Não autorizado' })
    }

    // Configurar formidable para upload
    const uploadDir = path.join(typeof process !== 'undefined' && process.cwd ? process.cwd() : '/tmp', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      filter: ({ mimetype }) => {
        return mimetype?.includes('presentation') || 
               mimetype?.includes('powerpoint') ||
               mimetype?.includes('officedocument')
      }
    })

    const [fields, files] = await form.parse(req)
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const nrCategory = Array.isArray(fields.nrCategory) ? fields.nrCategory[0] : fields.nrCategory
    const projectTitle = Array.isArray(fields.title) ? fields.title[0] : fields.title

    if (!file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' })
    }

    // Processar PPTX
    const slides = processPPTX(file.filepath)
    
    // Gerar conteúdo IA
    const enhancedSlides = generateAIContent(slides, nrCategory || 'Geral')

    // Salvar projeto no Supabase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: projectTitle || `Projeto ${new Date().toLocaleDateString('pt-BR')}`,
        description: `Projeto criado a partir de upload PPTX - ${nrCategory || 'Categoria Geral'}`,
        user_email: session.user.email,
        status: 'draft',
        category: nrCategory || 'geral',
        slides_data: enhancedSlides,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (projectError) {
      console.error('Erro ao salvar projeto:', projectError)
      return res.status(500).json({ success: false, error: 'Erro ao salvar projeto' })
    }

    // Upload do arquivo para Supabase Storage
    const fileBuffer = fs.readFileSync(file.filepath)
    const fileName = `${project.id}/${file.originalFilename || 'presentation.pptx'}`
    
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
    }

    // Limpar arquivo temporário
    fs.unlinkSync(file.filepath)

    return res.status(200).json({
      success: true,
      projectId: project.id,
      slides: enhancedSlides
    })

  } catch (error) {
    console.error('Erro no processamento:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    })
  }
}