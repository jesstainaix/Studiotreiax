import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import NaturalLanguageInput from './NaturalLanguageInput'
import ConversationalAI from './ConversationalAI'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Sparkles, 
  Video, 
  FileText, 
  Play, 
  TrendingUp,
  Clock,
  Users,
  Zap,
  Target,
  ArrowRight,
  Upload,
  Eye
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { MessageAction } from './ConversationalAI'

interface AIHubProps {
  className?: string
}

interface QuickStat {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}

export default function AIHub({ className }: AIHubProps) {
  const navigate = useNavigate()
  const [showConversation, setShowConversation] = useState(false)
  const [conversationKey, setConversationKey] = useState(0)

  // Stats rápidas para mostrar no hub
  const quickStats: QuickStat[] = [
    {
      label: 'Projetos Ativos',
      value: '3',
      icon: <Video className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Templates Disponíveis', 
      value: '34',
      icon: <FileText className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Vídeos Criados',
      value: '18',
      icon: <Play className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Tempo Total',
      value: '4h 32m',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ]

  // Ações rápidas disponíveis
  const quickActions = [
    {
      id: 'upload',
      label: 'Upload PowerPoint',
      description: 'Transforme sua apresentação em vídeo',
      icon: <Upload className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => navigate('/upload')
    },
    {
      id: 'templates',
      label: 'Explorar Templates',
      description: 'Navegue por templates profissionais',
      icon: <Eye className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => navigate('/templates')
    },
    {
      id: 'projects',
      label: 'Meus Projetos',
      description: 'Continue seus projetos em andamento',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => navigate('/projects')
    }
  ]

  // Processar input do usuário
  const handleUserInput = useCallback((input: string) => {
    setShowConversation(true)
    // O ConversationalAI processará o input automaticamente
  }, [])

  // Processar ações do AI
  const handleAIAction = useCallback((action: MessageAction) => {
    switch (action.type) {
      case 'create_video':
        if (action.data?.template) {
          navigate(`/editor?template=${action.data.template}&category=${action.data.category}`)
        } else {
          navigate('/editor')
        }
        break
        
      case 'view_template':
        if (action.data?.category) {
          navigate(`/templates?category=${action.data.category}`)
        } else {
          navigate('/templates')
        }
        break
        
      case 'open_project':
        if (action.data?.projectId) {
          navigate(`/editor?project=${action.data.projectId}`)
        } else {
          navigate('/projects')
        }
        break
        
      case 'preview':
        if (action.data?.url) {
          window.open(action.data.url, '_blank')
        }
        break
        
      case 'download':
        if (action.data?.downloadUrl) {
          const link = document.createElement('a')
          link.href = action.data.downloadUrl
          link.download = action.data.filename || 'video.mp4'
          link.click()
        }
        break
        
      default:
        break
    }
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Hub
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Seu assistente inteligente para criação de vídeos. Descreva o que você quer criar e deixe a IA te ajudar.
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg bg-gray-100 dark:bg-gray-800', stat.color)}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Input de linguagem natural */}
      {!showConversation && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">O que você quer criar hoje?</h2>
            </div>
            <NaturalLanguageInput 
              onSubmit={handleUserInput}
              placeholder="Ex: Criar um vídeo de apresentação sobre vendas com template corporativo..."
            />
          </div>
        </Card>
      )}

      {/* Conversação com IA */}
      {showConversation && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Assistente IA</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowConversation(false)
                setConversationKey(prev => prev + 1)
              }}
            >
              Nova Conversa
            </Button>
          </div>
          <ConversationalAI 
            key={conversationKey}
            onAction={handleAIAction}
          />
        </Card>
      )}

      {/* Ações rápidas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Ações Rápidas
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card key={action.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={action.action}>
              <div className="space-y-4">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white', action.color)}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{action.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Projetos recentes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Projetos Recentes
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
            Ver Todos
          </Button>
        </div>
        <div className="space-y-3">
          {/* Placeholder para projetos recentes */}
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Nenhum projeto recente</p>
          </div>
        </div>
      </Card>
    </div>
  )
}