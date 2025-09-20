import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  MessageCircle, 
  Lightbulb,
  Zap,
  Video,
  FileText,
  Target,
  Clock
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface Suggestion {
  id: string
  text: string
  icon: React.ReactNode
  category: 'create' | 'help' | 'template' | 'project'
}

interface NaturalLanguageInputProps {
  onSubmit: (input: string, type: 'text' | 'voice') => void
  isProcessing?: boolean
  className?: string
}

export default function NaturalLanguageInput({ 
  onSubmit, 
  isProcessing = false, 
  className 
}: NaturalLanguageInputProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const suggestions: Suggestion[] = [
    {
      id: '1',
      text: 'Criar um vídeo de treinamento sobre NR-10 para eletricistas',
      icon: <Zap className="w-4 h-4" />,
      category: 'create'
    },
    {
      id: '2', 
      text: 'Como fazer um treinamento sobre trabalho em altura?',
      icon: <Lightbulb className="w-4 h-4" />,
      category: 'help'
    },
    {
      id: '3',
      text: 'Mostrar templates disponíveis para NR-35',
      icon: <FileText className="w-4 h-4" />,
      category: 'template'
    },
    {
      id: '4',
      text: 'Continuar meu projeto de segurança em máquinas',
      icon: <Target className="w-4 h-4" />,
      category: 'project'
    },
    {
      id: '5',
      text: 'Preciso de um vídeo rápido sobre uso de EPIs',
      icon: <Clock className="w-4 h-4" />,
      category: 'create'
    },
    {
      id: '6',
      text: 'Qual a diferença entre NR-33 e NR-35?',
      icon: <MessageCircle className="w-4 h-4" />,
      category: 'help'
    }
  ]

  useEffect(() => {
    // Configurar reconhecimento de voz se disponível
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'pt-BR'
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsListening(false)
        }
        
        recognitionRef.current.onerror = () => {
          setIsListening(false)
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isProcessing) {
      onSubmit(input.trim())
      setInput('')
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.text)
    setShowSuggestions(false)
    onSubmit(suggestion.text)
  }

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) return
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'create': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'help': return 'bg-green-100 text-green-700 border-green-200'
      case 'template': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'project': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Assistente IA para Treinamentos
          </h2>
        </div>
        <p className="text-gray-600 text-lg">
          Descreva o que você precisa em linguagem natural e eu te ajudo a criar vídeos de treinamento profissionais
        </p>
      </div>

      {/* Input Principal */}
      <Card className="mb-6 shadow-lg border-2 border-blue-100">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  adjustTextareaHeight()
                  setShowSuggestions(e.target.value.length === 0)
                }}
                onFocus={() => setShowSuggestions(input.length === 0)}
                placeholder="Ex: 'Preciso criar um treinamento sobre NR-10 para eletricistas iniciantes' ou 'Como fazer um vídeo sobre uso correto de EPIs?'"
                className="w-full min-h-[80px] max-h-[200px] p-4 pr-24 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={isProcessing || isListening}
              />
              
              {/* Botões de ação */}
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                {recognitionRef.current && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleVoiceRecognition}
                    disabled={isProcessing}
                    className={cn(
                      'w-10 h-10 rounded-full',
                      isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'hover:bg-gray-100'
                    )}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={!input.trim() || isProcessing || isListening}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {isListening && (
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Ouvindo...</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Sugestões */}
      {showSuggestions && !isProcessing && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              💡 Sugestões para começar
            </h3>
            <p className="text-gray-600 text-sm">
              Clique em uma das opções abaixo ou digite sua própria solicitação
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3">
            {suggestions.map((suggestion) => (
              <Card 
                key={suggestion.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 border hover:border-blue-300"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      getCategoryColor(suggestion.category)
                    )}>
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {suggestion.text}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={cn('mt-2 text-xs', getCategoryColor(suggestion.category))}
                      >
                        {suggestion.category === 'create' && 'Criar'}
                        {suggestion.category === 'help' && 'Ajuda'}
                        {suggestion.category === 'template' && 'Template'}
                        {suggestion.category === 'project' && 'Projeto'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Declarações de tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
    }
  }
}