/**
 * Exemplo de Integração do Sistema de Áudio Avançado
 * 
 * Demonstra como usar o sistema de processamento de áudio 
 * em diferentes cenários práticos
 */

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Play, 
  Headphones, 
  Mic, 
  FileAudio, 
  Waveform,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { AudioProcessorInterface } from '../audio/AudioProcessorInterface';
import { AudioProcessingEngine, AudioPresets } from '../../lib/audio/AudioProcessingEngine';

interface AudioExampleProps {
  onComplete?: (processedAudio: Blob) => void;
}

export const AudioSystemExample: React.FC<AudioExampleProps> = ({ onComplete }) => {
  const [activeExample, setActiveExample] = useState<'podcast' | 'music' | 'speech' | 'custom'>('podcast');
  const [processingResults, setProcessingResults] = useState<{
    originalSize?: number;
    processedSize?: number;
    lufsImprovement?: number;
    processingTime?: number;
  }>({});

  const examples = {
    podcast: {
      title: 'Processamento de Podcast',
      description: 'Otimização para voz falada com redução de ruído e normalização',
      icon: Mic,
      preset: 'podcast',
      color: 'bg-blue-500'
    },
    music: {
      title: 'Masterização Musical',
      description: 'Equalização balanceada e compressão suave para música',
      icon: Headphones,
      preset: 'music',
      color: 'bg-green-500'
    },
    speech: {
      title: 'Narração Educativa',
      description: 'Clareza vocal para apresentações e cursos online',
      icon: FileAudio,
      preset: 'speech',
      color: 'bg-purple-500'
    },
    custom: {
      title: 'Configuração Personalizada',
      description: 'Controle total sobre todos os parâmetros de áudio',
      icon: Waveform,
      preset: 'custom',
      color: 'bg-orange-500'
    }
  };

  const handleAudioProcessed = (audioBlob: Blob) => {
    setProcessingResults(prev => ({
      ...prev,
      processedSize: audioBlob.size,
      processingTime: Date.now() - (prev.processingTime || Date.now())
    }));
    
    onComplete?.(audioBlob);
  };

  const getPresetConfiguration = (preset: string) => {
    switch (preset) {
      case 'podcast':
        return {
          equalizer: AudioPresets.getEqualizerPreset('podcast'),
          compressor: AudioPresets.getCompressorPreset('broadcast'),
          effects: {
            reverb: false,
            delay: false,
            normalize: true,
            targetLUFS: -16
          }
        };
      case 'music':
        return {
          equalizer: AudioPresets.getEqualizerPreset('music'),
          compressor: AudioPresets.getCompressorPreset('gentle'),
          effects: {
            reverb: true,
            reverbType: 'hall',
            delay: true,
            delayTime: 0.2,
            normalize: true,
            targetLUFS: -14
          }
        };
      case 'speech':
        return {
          equalizer: AudioPresets.getEqualizerPreset('speech'),
          compressor: AudioPresets.getCompressorPreset('broadcast'),
          effects: {
            reverb: false,
            delay: false,
            normalize: true,
            targetLUFS: -18
          }
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sistema de Áudio Profissional</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Engine completo de processamento de áudio com equalização, compressão, 
            efeitos e análise em tempo real. Otimizado para diferentes tipos de conteúdo.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              ✅ Web Audio API
            </Badge>
            <Badge variant="secondary" className="text-sm">
              ✅ Processamento em Tempo Real
            </Badge>
            <Badge variant="secondary" className="text-sm">
              ✅ Análise Espectral
            </Badge>
            <Badge variant="secondary" className="text-sm">
              ✅ Exportação WAV/MP3
            </Badge>
          </div>
        </div>
      </Card>

      {/* Example Selection */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Exemplos de Uso</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(examples).map(([key, example]) => {
            const Icon = example.icon;
            const isActive = activeExample === key;
            
            return (
              <Card 
                key={key}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveExample(key as any)}
              >
                <div className="text-center space-y-3">
                  <div className={`w-12 h-12 ${example.color} rounded-lg flex items-center justify-center mx-auto`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{example.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{example.description}</p>
                  </div>
                  {isActive && (
                    <CheckCircle className="w-5 h-5 text-blue-500 mx-auto" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Preset Configuration Display */}
        {activeExample !== 'custom' && (
          <Card className="p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Configuração do Preset "{examples[activeExample].title}"</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Equalização</h4>
                <ul className="space-y-1 text-gray-600">
                  {activeExample === 'podcast' && (
                    <>
                      <li>• Corte em graves (-6dB em 31Hz)</li>
                      <li>• Realce em médios (+4dB em 1kHz)</li>
                      <li>• Clareza vocal otimizada</li>
                    </>
                  )}
                  {activeExample === 'music' && (
                    <>
                      <li>• Realce em graves (+2dB em 31Hz)</li>
                      <li>• Brilho em agudos (+2dB em 4kHz)</li>
                      <li>• Balanço tonal natural</li>
                    </>
                  )}
                  {activeExample === 'speech' && (
                    <>
                      <li>• Corte em baixas (-6dB abaixo 125Hz)</li>
                      <li>• Presença vocal (+3dB em 1-2kHz)</li>
                      <li>• Inteligibilidade máxima</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Compressão</h4>
                <ul className="space-y-1 text-gray-600">
                  {activeExample === 'podcast' && (
                    <>
                      <li>• Threshold: -15dB</li>
                      <li>• Ratio: 4:1 (broadcast)</li>
                      <li>• Controle de dinâmica consistente</li>
                    </>
                  )}
                  {activeExample === 'music' && (
                    <>
                      <li>• Threshold: -18dB</li>
                      <li>• Ratio: 3:1 (suave)</li>
                      <li>• Preservação da dinâmica musical</li>
                    </>
                  )}
                  {activeExample === 'speech' && (
                    <>
                      <li>• Threshold: -15dB</li>
                      <li>• Ratio: 4:1 (broadcast)</li>
                      <li>• Volume consistente</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Efeitos</h4>
                <ul className="space-y-1 text-gray-600">
                  {activeExample === 'podcast' && (
                    <>
                      <li>• Normalização para -16 LUFS</li>
                      <li>• Sem reverb ou delay</li>
                      <li>• Foco na clareza vocal</li>
                    </>
                  )}
                  {activeExample === 'music' && (
                    <>
                      <li>• Reverb Hall sutil</li>
                      <li>• Delay 200ms (baixo mix)</li>
                      <li>• Normalização para -14 LUFS</li>
                    </>
                  )}
                  {activeExample === 'speech' && (
                    <>
                      <li>• Normalização para -18 LUFS</li>
                      <li>• Processamento limpo</li>
                      <li>• Otimização para fala</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Audio Processor Interface */}
      <AudioProcessorInterface
        onAudioProcessed={handleAudioProcessed}
        onAnalysisUpdate={(analysis) => {
          // Update real-time metrics display if needed
        }}
        initialConfig={{
          enableRealTimeProcessing: true,
          bufferSize: 2048
        }}
      />

      {/* Processing Results */}
      {Object.keys(processingResults).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            Resultados do Processamento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {processingResults.originalSize && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(processingResults.originalSize / (1024 * 1024)).toFixed(1)}MB
                </div>
                <div className="text-sm text-gray-600">Tamanho Original</div>
              </div>
            )}
            
            {processingResults.processedSize && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(processingResults.processedSize / (1024 * 1024)).toFixed(1)}MB
                </div>
                <div className="text-sm text-gray-600">Tamanho Processado</div>
              </div>
            )}
            
            {processingResults.lufsImprovement && (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {processingResults.lufsImprovement > 0 ? '+' : ''}{processingResults.lufsImprovement.toFixed(1)}dB
                </div>
                <div className="text-sm text-gray-600">Melhoria LUFS</div>
              </div>
            )}
            
            {processingResults.processingTime && (
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(processingResults.processingTime / 1000).toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Tempo de Processamento</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Technical Specifications */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Especificações Técnicas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Capacidades de Processamento</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Equalização paramétrica de 10 bandas
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Compressor dinâmico com controle total
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Efeitos de reverb e delay profissionais
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Normalização automática por LUFS
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Análise espectral em tempo real
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Formatos e Compatibilidade</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Suporte a WAV, MP3, OGG, M4A
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Sample rates: 44.1kHz, 48kHz, 96kHz
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Mono e Stereo (até 32 canais)
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Processamento de arquivos até 500MB
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Exportação em alta qualidade (24-bit)
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Usage Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-blue-800">
          <AlertCircle className="w-5 h-5 mr-2" />
          Dicas de Uso Profissional
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Para Podcasts:</h3>
            <ul className="space-y-1 text-blue-700">
              <li>• Use o preset "Podcast" como ponto de partida</li>
              <li>• Monitore o nível LUFS para consistência</li>
              <li>• Evite over-compression para manter naturalidade</li>
              <li>• Normalize para -16 LUFS (padrão streaming)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Para Música:</h3>
            <ul className="space-y-1 text-blue-700">
              <li>• Use compressão suave para preservar dinâmica</li>
              <li>• Ajuste EQ conforme o gênero musical</li>
              <li>• Reverb sutil pode adicionar profundidade</li>
              <li>• Target LUFS entre -14 e -16 para streaming</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};