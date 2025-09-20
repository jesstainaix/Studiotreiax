import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Video, 
  FileText, 
  Play, 
  Download, 
  Eye,
  Loader2,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { cn } from '../../lib/utils'
import NRVideoCreator from './NRVideoCreator'
import NaturalLanguageInput from './NaturalLanguageInput'

interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
  actions?: MessageAction[]
  status?: 'processing' | 'completed' | 'error'
}

interface MessageAction {
  id: string
  type: 'create_video' | 'view_template' | 'open_project' | 'preview'
  label: string
  icon?: React.ReactNode
  data?: any
}

interface ConversationalAIProps {
  onAction: (action: MessageAction) => void
  onMessage?: (message: string) => void
  className?: string
}

export default function ConversationalAI({ onAction, onMessage, className }: ConversationalAIProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showVideoCreator, setShowVideoCreator] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Processar mensagem do usuário
  const processMessage = useCallback(async (userMessage: string) => {
    setIsProcessing(true)
    
    // Adicionar mensagem do usuário
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      type: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    
    // Simular processamento de IA
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Gerar resposta da IA baseada no input
    let aiResponse: Message
    
    if (userMessage.toLowerCase().includes('vídeo') || userMessage.toLowerCase().includes('criar') || userMessage.toLowerCase().includes('treinamento')) {
      // Mostrar o criador de vídeos
      setShowVideoCreator(true)
      aiResponse = {
        id: (Date.now() + 1).toString(),
        content: 'Perfeito! Vou abrir nossa interface de criação de vídeos com IA. Você pode descrever exatamente o que precisa e eu criarei um vídeo profissional para você.',
        type: 'ai',
        timestamp: new Date()
      }
    } else if (userMessage.toLowerCase().includes('template') || userMessage.toLowerCase().includes('modelo')) {
      aiResponse = {
        id: (Date.now() + 1).toString(),
        content: 'Temos diversos templates disponíveis organizados por categoria. Qual área de segurança você está interessado?',
        type: 'ai',
        timestamp: new Date(),
        actions: [
          {
            id: 'template_epi',
            type: 'view_template',
            label: 'Templates EPI',
            data: { category: 'epi' }
          },
          {
            id: 'template_eletrica',
            type: 'view_template',
            label: 'Templates Elétrica',
            data: { category: 'eletrica' }
          },
          {
            id: 'template_altura',
            type: 'view_template',
            label: 'Templates Altura',
            data: { category: 'altura' }
          }
        ]
      }
    } else if (userMessage.toLowerCase().includes('projeto')) {
      aiResponse = {
        id: (Date.now() + 1).toString(),
        content: 'Vou mostrar seus projetos em andamento. Você pode continuar editando ou visualizar os vídeos prontos.',
        type: 'ai',
        timestamp: new Date(),
        actions: [
          {
            id: 'open_project',
            type: 'open_project',
            label: 'Abrir Projeto',
            data: { projectId: 'proj_123' }
          },
          {
            id: 'preview_video',
            type: 'preview',
            label: 'Visualizar Vídeo',
            data: { url: '/preview/video_123' }
          }
        ]
      }
    } else {
      aiResponse = {
        id: (Date.now() + 1).toString(),
        content: 'Entendi! Posso ajudá-lo com criação de vídeos, templates ou gerenciamento de projetos. O que você gostaria de fazer?',
        type: 'ai',
        timestamp: new Date(),
        actions: [
          {
            id: 'create_new_video',
            type: 'create_video',
            label: 'Criar Novo Vídeo',
            data: {}
          },
          {
            id: 'explore_templates',
            type: 'view_template',
            label: 'Explorar Templates',
            data: {}
          },
          {
            id: 'my_projects',
            type: 'open_project',
            label: 'Meus Projetos',
            data: {}
          }
        ]
      }
    }
    
    setMessages(prev => [...prev, aiResponse])
    setIsProcessing(false)
  }, [])

  // Simulação de resposta da IA (substituir por integração real)
  const simulateAIResponse = async (input: string): Promise<{content: string, actions: MessageAction[]}> => {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500))

    const lowerInput = input.toLowerCase()
    
    // Análise de intenção baseada em palavras-chave
    if (lowerInput.includes('criar') || lowerInput.includes('vídeo') || lowerInput.includes('treinamento')) {
      if (lowerInput.includes('nr-10') || lowerInput.includes('elétric')) {
        return {
          content: `Perfeito! Vou te ajudar a criar um vídeo de treinamento sobre NR-10 (Segurança em Instalações Elétricas). 

Identifiquei que você precisa de:
• Conteúdo sobre segurança elétrica
• Foco em eletricistas
• Formato de treinamento profissional

Tenho templates específicos para NR-10 que incluem:
✅ Conceitos fundamentais de eletricidade
✅ Riscos e medidas de proteção
✅ Procedimentos de segurança
✅ Uso correto de EPIs

Você gostaria de começar com um template pronto ou prefere fazer upload de uma apresentação PowerPoint?`,
          actions: [
            {
              id: 'template_nr10',
              type: 'view_template',
              label: 'Ver Templates NR-10',
              icon: <FileText className="w-4 h-4" />,
              data: { category: 'NR-10' }
            },
            {
              id: 'create_nr10',
              type: 'create_video',
              label: 'Criar Vídeo Agora',
              icon: <Video className="w-4 h-4" />,
              data: { template: 'nr10-basic', category: 'NR-10' }
            }
          ]
        }
      } else if (lowerInput.includes('nr-35') || lowerInput.includes('altura')) {
        return {
          content: `Ótima escolha! Vou te ajudar com um treinamento sobre NR-35 (Trabalho em Altura).

Para trabalho em altura, é essencial abordar:
• Análise de riscos
• Sistemas de proteção
• Equipamentos de segurança
• Procedimentos de emergência

Tenho templates específicos que cobrem todos esses pontos de forma didática e visual.`,
          actions: [
            {
              id: 'template_nr35',
              type: 'view_template', 
              label: 'Ver Templates NR-35',
              icon: <FileText className="w-4 h-4" />,
              data: { category: 'NR-35' }
            },
            {
              id: 'create_nr35',
              type: 'create_video',
              label: 'Começar Criação',
              icon: <Video className="w-4 h-4" />,
              data: { template: 'nr35-height', category: 'NR-35' }
            }
          ]
        }
      } else if (lowerInput.includes('epi')) {
        return {
          content: `Vou te ajudar a criar um treinamento sobre EPIs (Equipamentos de Proteção Individual)!

Um bom treinamento de EPI deve incluir:
• Tipos de EPIs e suas aplicações
• Inspeção e manutenção
• Uso correto e armazenamento
• Responsabilidades legais

Posso criar um vídeo rápido e eficiente para você.`,
          actions: [
            {
              id: 'template_epi',
              type: 'view_template',
              label: 'Templates de EPI',
              icon: <FileText className="w-4 h-4" />,
              data: { category: 'NR-06' }
            },
            {
              id: 'create_epi',
              type: 'create_video',
              label: 'Criar Vídeo de EPI',
              icon: <Video className="w-4 h-4" />,
              data: { template: 'epi-basic', category: 'NR-06' }
            }
          ]
        }
      }
    } else if (lowerInput.includes('template') || lowerInput.includes('modelo')) {
      return {
        content: `Temos uma biblioteca completa de templates profissionais organizados por Norma Regulamentadora:

🔹 **NR-10**: Segurança Elétrica (12 templates)
🔹 **NR-12**: Máquinas e Equipamentos (8 templates) 
🔹 **NR-35**: Trabalho em Altura (15 templates)
🔹 **NR-33**: Espaços Confinados (6 templates)
🔹 **NR-06**: EPIs (10 templates)

Todos os templates incluem narração profissional, animações e são totalmente personalizáveis.`,
        actions: [
          {
            id: 'view_all_templates',
            type: 'view_template',
            label: 'Ver Todos os Templates',
            icon: <FileText className="w-4 h-4" />
          }
        ]
      }
    } else if (lowerInput.includes('projeto') || lowerInput.includes('continuar')) {
      return {
        content: `Vou mostrar seus projetos em andamento:

📋 **Projetos Recentes:**
• Segurança em Altura - 75% concluído
• EPI Básico - 25% concluído
• NR-12 Máquinas - Rascunho

Qual projeto você gostaria de continuar?`,
        actions: [
          {
            id: 'view_projects',
            type: 'open_project',
            label: 'Ver Meus Projetos',
            icon: <Play className="w-4 h-4" />
          }
        ]
      }
    } else if (lowerInput.includes('diferença') || lowerInput.includes('nr-33') || lowerInput.includes('nr-35')) {
      return {
        content: `Ótima pergunta! Vou explicar a diferença entre NR-33 e NR-35:

**NR-33 (Espaços Confinados):**
• Ambientes fechados ou parcialmente fechados
• Ventilação deficiente
• Não projetados para ocupação humana contínua
• Ex: tanques, silos, poços, túneis

**NR-35 (Trabalho em Altura):**
• Atividades acima de 2 metros do nível inferior
• Risco de queda
• Ambientes abertos ou fechados
• Ex: telhados, torres, andaimes

Precisa de treinamento específico para alguma dessas normas?`,
        actions: [
          {
            id: 'template_nr33',
            type: 'view_template',
            label: 'Templates NR-33',
            icon: <FileText className="w-4 h-4" />,
            data: { category: 'NR-33' }
          },
          {
            id: 'template_nr35_compare',
            type: 'view_template',
            label: 'Templates NR-35',
            icon: <FileText className="w-4 h-4" />,
            data: { category: 'NR-35' }
          }
        ]
      }
    }

    // Resposta padrão
    return {
      content: `Entendi sua solicitação! Sou especializado em ajudar você a criar vídeos de treinamento em segurança do trabalho.

Posso te ajudar com:
• Criação de vídeos a partir de PowerPoint
• Templates profissionais por NR
• Orientação sobre conteúdo de treinamento
• Gerenciamento de projetos

Poderia ser mais específico sobre o que você precisa? Por exemplo:
- Qual norma regulamentadora?
- Tipo de treinamento?
- Público-alvo?`,
      actions: [
        {
          id: 'view_templates_general',
          type: 'view_template',
          label: 'Ver Templates',
          icon: <FileText className="w-4 h-4" />
        },
        {
          id: 'create_general',
          type: 'create_video',
          label: 'Criar Vídeo',
          icon: <Video className="w-4 h-4" />
        }
      ]
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'processing': return <Loader2 className="w-4 h-4 text-yellow-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <CheckCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6', className)}>
      {/* Input de linguagem natural */}
      <NaturalLanguageInput 
        onSubmit={(input) => {
          processMessage(input)
          if (onMessage) onMessage(input)
        }}
        placeholder="Descreva o vídeo de treinamento que você precisa..."
      />
      
      {showVideoCreator ? (
        <NRVideoCreator 
          onClose={() => setShowVideoCreator(false)}
          onVideoCreated={(video) => {
            setShowVideoCreator(false)
            const successMsg: Message = {
              id: Date.now().toString(),
              content: `Vídeo criado com sucesso! "${video.title}" está pronto para uso.`,
              type: 'ai',
              timestamp: new Date(),
              status: 'completed',
              actions: [
                {
                  id: 'preview_created',
                  type: 'preview',
                  label: 'Visualizar Vídeo',
                  icon: <Eye className="w-4 h-4" />,
                  data: { videoId: video.id }
                },
                {
                  id: 'download_created',
                  type: 'preview',
                  label: 'Download',
                  icon: <Download className="w-4 h-4" />,
                  data: { videoId: video.id, action: 'download' }
                }
              ]
            }
            setMessages(prev => [...prev, successMsg])
          }}
        />
      ) : (
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            {/* Área de mensagens */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium mb-2">Olá! Sou seu assistente de IA</p>
                  <p className="text-sm">Descreva o vídeo de treinamento que você precisa e eu te ajudo a criar!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3 p-4 rounded-lg',
                      message.type === 'user' 
                        ? 'bg-blue-50 ml-8' 
                        : 'bg-gray-50 mr-8'
                    )}
                  >
                    <div className="flex-shrink-0">
                      {message.type === 'user' ? (
                        <User className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Bot className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {message.type === 'user' ? 'Você' : 'IA Assistant'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        {getStatusIcon(message.status)}
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.actions.map((action) => (
                            <Button
                              key={action.id}
                              variant="outline"
                              size="sm"
                              onClick={() => onAction(action)}
                              className="flex items-center gap-2"
                            >
                              {action.icon}
                              {action.label}
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {isProcessing && (
                <div className="flex gap-3 p-4 rounded-lg bg-gray-50 mr-8">
                  <Bot className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">IA Assistant</span>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                    <p className="text-gray-600">Processando sua solicitação...</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Exportar função para uso externo
export { type Message, type MessageAction }