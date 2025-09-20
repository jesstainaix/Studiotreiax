import React, { useState, useEffect } from 'react'
import { transcriptionService } from '../../services/transcriptionService'
import { audioProcessingService } from '../../services/audioProcessingService'
import ttsIntegrationService, { type TTSVoice, type TTSJob, type TTSGenerationRequest } from '../../services/ttsIntegrationService'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  Play, 
  Download, 
  Mic2, 
  Settings, 
  Clock,
  FileAudio,
  User,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface TTSGenerationPanelProps {
  pptxContent?: any
  onAudioGenerated?: (audioData: TTSJob) => void
  className?: string
}

export const TTSGenerationPanel: React.FC<TTSGenerationPanelProps> = ({ 
  pptxContent, 
  onAudioGenerated,
  className = '' 
}) => {
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('pt-br-female-1')
  const [script, setScript] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentJob, setCurrentJob] = useState<TTSJob | null>(null)
  const [ttsSettings, setTTSSettings] = useState({
    speed: 0.9,
    pitch: 0.0,
    volume: 0.8,
    pauseLength: 1.0
  })
  const [isLoadingVoices, setIsLoadingVoices] = useState(true)

  useEffect(() => {
    loadAvailableVoices()
    if (pptxContent) {
      generateScriptFromPPTX()
    }
  }, [pptxContent])

  const loadAvailableVoices = async () => {
    try {
      setIsLoadingVoices(true)
      const voices = await ttsIntegrationService.getAvailableVoices()
      setAvailableVoices(voices)
    } catch (error) {
      console.error('Error loading voices:', error)
      toast.error('Erro ao carregar vozes disponíveis')
    } finally {
      setIsLoadingVoices(false)
    }
  }

  const generateScriptFromPPTX = () => {
    if (!pptxContent) return
    
    // Generate script from PPTX content
    const generatedScript = 'Script gerado automaticamente do conteúdo do PPTX...'
    setScript(generatedScript)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic2 className="w-5 h-5 mr-2" />
            Geração de Áudio TTS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            Configure as opções de texto para fala para gerar áudio do seu conteúdo.
          </div>
          
          {isLoadingVoices ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando vozes...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Voz Selecionada</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Script</label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Digite ou edite o script para conversão em áudio..."
                  rows={6}
                />
              </div>
              
              <Button 
                onClick={() => {}} 
                disabled={!script.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Áudio...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Gerar Áudio
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}