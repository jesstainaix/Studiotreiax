/**
 * Interface Avançada de Processamento de Áudio
 * 
 * Componente React completo para controle de áudio com:
 * - Equalização visual com sliders
 * - Controles de compressão
 * - Efeitos de áudio
 * - Análise em tempo real
 * - Presets profissionais
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { Progress } from '../../ui/progress';
import { 
  AudioLines, 
  Play, 
  Pause, 
  Square, 
  Upload,
  Download,
  Settings,
  BarChart3,
  Waveform,
  Volume2,
  Mic,
  Headphones
} from 'lucide-react';

import { 
  AudioProcessingEngine, 
  AudioProcessorConfig,
  EqualizerBand,
  CompressorSettings,
  AudioAnalysis,
  AudioPresets
} from '../../lib/audio/AudioProcessingEngine';

interface AudioProcessorInterfaceProps {
  onAudioProcessed?: (audioBlob: Blob) => void;
  onAnalysisUpdate?: (analysis: AudioAnalysis) => void;
  initialConfig?: Partial<AudioProcessorConfig>;
}

export const AudioProcessorInterface: React.FC<AudioProcessorInterfaceProps> = ({
  onAudioProcessed,
  onAnalysisUpdate,
  initialConfig = {}
}) => {
  // Audio engine instance
  const engineRef = useRef<AudioProcessingEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Component state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'equalizer' | 'compressor' | 'effects' | 'analysis'>('equalizer');
  
  // Audio settings state
  const [equalizerBands, setEqualizerBands] = useState<EqualizerBand[]>([]);
  const [compressorSettings, setCompressorSettings] = useState<CompressorSettings>({
    threshold: -18,
    ratio: 3,
    attack: 0.01,
    release: 0.1,
    knee: 6,
    makeupGain: 2
  });
  
  const [effectsSettings, setEffectsSettings] = useState({
    reverbEnabled: false,
    reverbType: 'hall' as 'hall' | 'room' | 'plate' | 'spring' | 'cathedral',
    delayEnabled: false,
    delayTime: 0.3,
    delayFeedback: 0.3,
    delayWetness: 0.2,
    masterVolume: 1.0,
    normalizeEnabled: true,
    targetLUFS: -23
  });
  
  // Real-time analysis data
  const [analysisData, setAnalysisData] = useState<AudioAnalysis>({
    rms: 0,
    peak: 0,
    lufs: 0,
    frequency: new Float32Array(1024),
    spectrum: new Float32Array(1024),
    dynamicRange: 0,
    spectralCentroid: 0
  });

  // Initialize audio engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        engineRef.current = new AudioProcessingEngine(initialConfig);
        
        // Initialize with speech preset
        const speechEQ = AudioPresets.getEqualizerPreset('speech');
        setEqualizerBands(speechEQ);
        
        setIsInitialized(true);
        console.log('AudioProcessingEngine initialized');
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
      }
    };

    initializeEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, [initialConfig]);

  // Real-time analysis updates
  useEffect(() => {
    if (!isProcessing || !engineRef.current) return;

    const updateAnalysis = () => {
      if (engineRef.current) {
        const newData = engineRef.current.getAnalysisData();
        setAnalysisData(newData);
        onAnalysisUpdate?.(newData);
      }
    };

    const intervalId = setInterval(updateAnalysis, 100); // Update 10 times per second

    return () => clearInterval(intervalId);
  }, [isProcessing, onAnalysisUpdate]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !engineRef.current) return;

    try {
      await engineRef.current.loadAudioFile(file);
      setCurrentFile(file);
      console.log('Audio file loaded successfully');
    } catch (error) {
      console.error('Error loading audio file:', error);
      alert(`Erro ao carregar arquivo: ${error.message}`);
    }
  }, []);

  const startProcessing = useCallback(() => {
    if (!engineRef.current || !currentFile) return;

    try {
      // Apply current settings
      engineRef.current.setEqualizer(equalizerBands);
      engineRef.current.setCompressor(compressorSettings);
      
      if (effectsSettings.reverbEnabled) {
        engineRef.current.setReverb(effectsSettings.reverbType);
      }
      
      if (effectsSettings.delayEnabled) {
        engineRef.current.setDelay(
          effectsSettings.delayTime,
          effectsSettings.delayFeedback,
          effectsSettings.delayWetness
        );
      }

      engineRef.current.startProcessing();
      setIsProcessing(true);
      
      if (effectsSettings.normalizeEnabled) {
        setTimeout(() => {
          engineRef.current?.normalizeAudio(effectsSettings.targetLUFS);
        }, 1000); // Apply normalization after 1 second
      }
      
    } catch (error) {
      console.error('Error starting processing:', error);
      alert(`Erro ao iniciar processamento: ${error.message}`);
    }
  }, [currentFile, equalizerBands, compressorSettings, effectsSettings]);

  const stopProcessing = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stopProcessing();
      setIsProcessing(false);
    }
  }, []);

  const exportAudio = useCallback(async () => {
    if (!engineRef.current) return;

    try {
      const audioBlob = await engineRef.current.exportProcessedAudio('wav');
      onAudioProcessed?.(audioBlob);
      
      // Create download link
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed_${currentFile?.name || 'audio'}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert(`Erro ao exportar áudio: ${error.message}`);
    }
  }, [currentFile, onAudioProcessed]);

  const applyPreset = useCallback((type: 'equalizer' | 'compressor', preset: string) => {
    if (type === 'equalizer') {
      const presetBands = AudioPresets.getEqualizerPreset(preset as any);
      setEqualizerBands(presetBands);
      if (engineRef.current) {
        engineRef.current.setEqualizer(presetBands);
      }
    } else if (type === 'compressor') {
      const presetSettings = AudioPresets.getCompressorPreset(preset as any);
      setCompressorSettings(presetSettings);
      if (engineRef.current) {
        engineRef.current.setCompressor(presetSettings);
      }
    }
  }, []);

  const updateEqualizerBand = useCallback((index: number, gain: number) => {
    const newBands = [...equalizerBands];
    if (newBands[index]) {
      newBands[index].gain = gain;
      setEqualizerBands(newBands);
      
      if (engineRef.current && isProcessing) {
        engineRef.current.setEqualizer(newBands);
      }
    }
  }, [equalizerBands, isProcessing]);

  const updateCompressorSetting = useCallback((key: keyof CompressorSettings, value: number) => {
    const newSettings = { ...compressorSettings, [key]: value };
    setCompressorSettings(newSettings);
    
    if (engineRef.current && isProcessing) {
      engineRef.current.setCompressor(newSettings);
    }
  }, [compressorSettings, isProcessing]);

  if (!isInitialized) {
    return (
      <Card className="p-6 text-center">
        <AudioLines className="w-8 h-8 mx-auto mb-4 animate-pulse" />
        <p>Inicializando sistema de áudio...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AudioLines className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Processamento de Áudio Avançado</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {analysisData.lufs && (
              <div className="text-xs text-gray-600 mr-4">
                LUFS: {analysisData.lufs.toFixed(1)} | Peak: {(analysisData.peak * 100).toFixed(1)}%
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="w-4 h-4 mr-2" />
              Carregar Áudio
            </Button>
            <Button
              variant={isProcessing ? "destructive" : "default"}
              size="sm"
              onClick={isProcessing ? stopProcessing : startProcessing}
              disabled={!currentFile}
            >
              {isProcessing ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Processar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAudio}
              disabled={!currentFile}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {currentFile && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium">{currentFile.name}</p>
            <p className="text-xs text-gray-600">
              Tamanho: {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Card>

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'equalizer', label: 'Equalização', icon: BarChart3 },
            { id: 'compressor', label: 'Compressor', icon: Volume2 },
            { id: 'effects', label: 'Efeitos', icon: Settings },
            { id: 'analysis', label: 'Análise', icon: Waveform }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Equalizer Tab */}
        {activeTab === 'equalizer' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">Equalização (10 Bandas)</h3>
              <Select onValueChange={(value) => applyPreset('equalizer', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vocal">Vocal</SelectItem>
                  <SelectItem value="music">Música</SelectItem>
                  <SelectItem value="speech">Fala</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="bass-boost">Bass Boost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
              {equalizerBands.map((band, index) => (
                <div key={index} className="text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <Slider
                      value={[band.gain]}
                      onValueChange={([value]) => updateEqualizerBand(index, value)}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-full"
                    />
                  </div>
                  <div className="text-xs font-medium">{band.frequency}Hz</div>
                  <div className="text-xs text-gray-600">{band.gain.toFixed(1)}dB</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compressor Tab */}
        {activeTab === 'compressor' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">Compressor Dinâmico</h3>
              <Select onValueChange={(value) => applyPreset('compressor', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gentle">Suave</SelectItem>
                  <SelectItem value="aggressive">Agressivo</SelectItem>
                  <SelectItem value="limiting">Limitador</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Threshold: {compressorSettings.threshold}dB</Label>
                  <Slider
                    value={[compressorSettings.threshold]}
                    onValueChange={([value]) => updateCompressorSetting('threshold', value)}
                    min={-40}
                    max={0}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Ratio: {compressorSettings.ratio}:1</Label>
                  <Slider
                    value={[compressorSettings.ratio]}
                    onValueChange={([value]) => updateCompressorSetting('ratio', value)}
                    min={1}
                    max={20}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Attack: {(compressorSettings.attack * 1000).toFixed(1)}ms</Label>
                  <Slider
                    value={[compressorSettings.attack]}
                    onValueChange={([value]) => updateCompressorSetting('attack', value)}
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Release: {(compressorSettings.release * 1000).toFixed(0)}ms</Label>
                  <Slider
                    value={[compressorSettings.release]}
                    onValueChange={([value]) => updateCompressorSetting('release', value)}
                    min={0.01}
                    max={1}
                    step={0.01}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Knee: {compressorSettings.knee}dB</Label>
                  <Slider
                    value={[compressorSettings.knee]}
                    onValueChange={([value]) => updateCompressorSetting('knee', value)}
                    min={0}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Makeup Gain: {compressorSettings.makeupGain}dB</Label>
                  <Slider
                    value={[compressorSettings.makeupGain]}
                    onValueChange={([value]) => updateCompressorSetting('makeupGain', value)}
                    min={0}
                    max={12}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div className="space-y-6">
            <h3 className="text-md font-medium">Efeitos de Áudio</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reverb */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Reverb</Label>
                  <Switch
                    checked={effectsSettings.reverbEnabled}
                    onCheckedChange={(checked) => 
                      setEffectsSettings(prev => ({ ...prev, reverbEnabled: checked }))
                    }
                  />
                </div>
                
                {effectsSettings.reverbEnabled && (
                  <Select
                    value={effectsSettings.reverbType}
                    onValueChange={(value: any) => 
                      setEffectsSettings(prev => ({ ...prev, reverbType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hall">Hall</SelectItem>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="plate">Plate</SelectItem>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="cathedral">Cathedral</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </Card>

              {/* Delay */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Delay/Echo</Label>
                  <Switch
                    checked={effectsSettings.delayEnabled}
                    onCheckedChange={(checked) => 
                      setEffectsSettings(prev => ({ ...prev, delayEnabled: checked }))
                    }
                  />
                </div>
                
                {effectsSettings.delayEnabled && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Tempo: {effectsSettings.delayTime}s</Label>
                      <Slider
                        value={[effectsSettings.delayTime]}
                        onValueChange={([value]) => 
                          setEffectsSettings(prev => ({ ...prev, delayTime: value }))
                        }
                        min={0.01}
                        max={1}
                        step={0.01}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Feedback: {effectsSettings.delayFeedback}</Label>
                      <Slider
                        value={[effectsSettings.delayFeedback]}
                        onValueChange={([value]) => 
                          setEffectsSettings(prev => ({ ...prev, delayFeedback: value }))
                        }
                        min={0}
                        max={0.95}
                        step={0.05}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Mix: {effectsSettings.delayWetness}</Label>
                      <Slider
                        value={[effectsSettings.delayWetness]}
                        onValueChange={([value]) => 
                          setEffectsSettings(prev => ({ ...prev, delayWetness: value }))
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Master Volume */}
              <Card className="p-4">
                <Label>Volume Master: {(effectsSettings.masterVolume * 100).toFixed(0)}%</Label>
                <Slider
                  value={[effectsSettings.masterVolume]}
                  onValueChange={([value]) => 
                    setEffectsSettings(prev => ({ ...prev, masterVolume: value }))
                  }
                  min={0}
                  max={2}
                  step={0.1}
                  className="mt-2"
                />
              </Card>

              {/* Normalization */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Normalização</Label>
                  <Switch
                    checked={effectsSettings.normalizeEnabled}
                    onCheckedChange={(checked) => 
                      setEffectsSettings(prev => ({ ...prev, normalizeEnabled: checked }))
                    }
                  />
                </div>
                
                {effectsSettings.normalizeEnabled && (
                  <div>
                    <Label className="text-xs">Target LUFS: {effectsSettings.targetLUFS}</Label>
                    <Slider
                      value={[effectsSettings.targetLUFS]}
                      onValueChange={([value]) => 
                        setEffectsSettings(prev => ({ ...prev, targetLUFS: value }))
                      }
                      min={-30}
                      max={-12}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <h3 className="text-md font-medium">Análise em Tempo Real</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Level Meters */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Níveis de Áudio</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>RMS</span>
                      <span>{(analysisData.rms * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={analysisData.rms * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Peak</span>
                      <span>{(analysisData.peak * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={analysisData.peak * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>LUFS</span>
                      <span>{analysisData.lufs.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.max(0, Math.min(100, (analysisData.lufs + 60) * 100 / 60))}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Spectrum Analysis */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Análise Espectral</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Centroide Espectral: </span>
                    <span>{(analysisData.spectralCentroid / 1000).toFixed(1)} kHz</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Faixa Dinâmica: </span>
                    <span>{analysisData.dynamicRange.toFixed(1)} dB</span>
                  </div>
                  
                  {/* Simple spectrum visualization */}
                  <div className="h-20 bg-gray-100 rounded flex items-end justify-center p-2">
                    {Array.from({ length: 20 }, (_, i) => {
                      const value = analysisData.spectrum[i * 25] || 0;
                      const height = Math.max(2, value * 100);
                      return (
                        <div
                          key={i}
                          className="bg-blue-500 mx-px rounded-t"
                          style={{ 
                            height: `${height}%`, 
                            width: '4px',
                            minHeight: '2px'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};