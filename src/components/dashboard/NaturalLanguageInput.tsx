import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  Send, 
  Sparkles, 
  Brain, 
  Zap,
  MessageSquare,
  Command,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'

interface NaturalLanguageInputProps {
  onCommand: (command: string) => void
}

interface AICommand {
  id: string
  text: string
  category: 'creation' | 'editing' | 'analysis' | 'automation'
  confidence: number
  suggestions?: string[]
}

interface CommandSuggestion {
  text: string
  category: string
  icon: React.ReactNode
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({ onCommand }) => {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentCommands, setRecentCommands] = useState<AICommand[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Sugestões predefinidas de comandos
  const commandSuggestions: CommandSuggestion[] = [
    {
      text: "Criar um vídeo sobre segurança no trabalho",
      category: "Criação",
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      text: "Analisar performance dos últimos projetos",
      category: "Análise",
      icon: <Brain className="h-4 w-4" />
    },
    {
      text: "Otimizar renderização dos vídeos",
      category: "Otimização",
      icon: <Zap className="h-4 w-4" />
    },
    {
      text: "Gerar relatório de uso de templates",
      category: "Relatórios",
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      text: "Configurar novo avatar 3D",
      category: "Configuração",
      icon: <Command className="h-4 w-4" />
    },
    {
      text: "Sugerir melhorias para o projeto atual",
      category: "Sugestões",
      icon: <Lightbulb className="h-4 w-4" />
    }
  ]

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'pt-BR'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        toast.error('Erro no reconhecimento de voz')
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Filtrar sugestões baseadas no input
  useEffect(() => {
    if (input.length > 2) {
      const filtered = commandSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(input.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions(commandSuggestions.slice(0, 3))
      setShowSuggestions(false)
    }
  }, [input])

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Reconhecimento de voz não suportado')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const processCommand = async (commandText: string) => {
    setIsProcessing(true)
    
    try {
      // Simular processamento de IA
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newCommand: AICommand = {
        id: Date.now().toString(),
        text: commandText,
        category: detectCommandCategory(commandText),
        confidence: Math.random() * 0.3 + 0.7, // 70-100%
        suggestions: generateSuggestions(commandText)
      }
      
      setRecentCommands(prev => [newCommand, ...prev.slice(0, 4)])
      onCommand(commandText)
      setInput('')
      setShowSuggestions(false)
      
      toast.success('Comando processado com sucesso!')
    } catch (error) {
      toast.error('Erro ao processar comando')
    } finally {
      setIsProcessing(false)
    }
  }

  const detectCommandCategory = (text: string): AICommand['category'] => {
    const lowerText = text.toLowerCase()
    if (lowerText.includes('criar') || lowerText.includes('gerar')) return 'creation'
    if (lowerText.includes('editar') || lowerText.includes('modificar')) return 'editing'
    if (lowerText.includes('analisar') || lowerText.includes('relatório')) return 'analysis'
    return 'automation'
  }

  const generateSuggestions = (text: string): string[] => {
    const suggestions = [
      'Adicionar legendas automáticas',
      'Incluir música de fundo',
      'Aplicar transições suaves',
      'Otimizar para redes sociais'
    ]
    return suggestions.slice(0, 2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isProcessing) {
      processCommand(input.trim())
    }
  }

  const handleSuggestionClick = (suggestion: CommandSuggestion) => {
    setInput(suggestion.text)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const getCategoryColor = (category: AICommand['category']) => {
    switch (category) {
      case 'creation': return 'bg-green-100 text-green-800'
      case 'editing': return 'bg-blue-100 text-blue-800'
      case 'analysis': return 'bg-purple-100 text-purple-800'
      case 'automation': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Input Principal */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Comando de IA Natural</h3>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite ou fale seu comando... Ex: 'Criar um vídeo sobre NR-10'"
                  className="pr-12"
                  disabled={isProcessing}
                />
                {input && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setInput('')}
                  >
                    ×
                  </Button>
                )}
              </div>
              
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                onClick={handleVoiceInput}
                disabled={isProcessing}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
              </Button>
              
              <Button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="min-w-[80px]"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>IA</span>
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sugestões */}
      {(showSuggestions || input.length === 0) && suggestions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Sugestões de Comandos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    {suggestion.icon}
                    <div>
                      <p className="text-sm font-medium">{suggestion.text}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {suggestion.category}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comandos Recentes */}
      {recentCommands.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Comandos Recentes</h4>
            <div className="space-y-2">
              {recentCommands.map((command) => (
                <div key={command.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{command.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(command.category)}>
                        {command.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Confiança: {Math.round(command.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput(command.text)}
                  >
                    Reutilizar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NaturalLanguageInput