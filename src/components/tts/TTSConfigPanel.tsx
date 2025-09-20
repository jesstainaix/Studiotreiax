import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Play, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ttsService, TTSProvider, TTSVoice, TTSRequest, TTSResponse } from '../../services/ttsService';
import { toast } from 'sonner';

interface TTSConfigPanelProps {
  onConfigChange?: (config: any) => void;
}

export const TTSConfigPanel: React.FC<TTSConfigPanelProps> = ({ onConfigChange }) => {
  const [providers, setProviders] = useState<TTSProvider[]>([]);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [testText, setTestText] = useState('Olá, este é um teste do sistema de síntese de voz.');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string; duration?: number }>>({});
  const [config, setConfig] = useState({
    elevenlabs: { apiKey: '', enabled: false },
    google: { apiKey: '', projectId: '', enabled: false },
    azure: { apiKey: '', region: 'eastus', enabled: false },
    browser: { enabled: true }
  });

  useEffect(() => {
    loadProviders();
    loadConfig();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      const providerVoices = ttsService.getVoicesForProvider(selectedProvider);
      setVoices(providerVoices);
      if (providerVoices.length > 0) {
        setSelectedVoice(providerVoices[0].id);
      }
    }
  }, [selectedProvider]);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      await ttsService.refreshProviders();
      const availableProviders = ttsService.getAvailableProviders();
      setProviders(availableProviders);
      
      if (availableProviders.length > 0) {
        setSelectedProvider(availableProviders[0].name);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Erro ao carregar provedores TTS');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfig = () => {
    const currentConfig = ttsService.getConfig();
    setConfig({
      elevenlabs: {
        apiKey: currentConfig.providers.elevenlabs.apiKey || '',
        enabled: currentConfig.providers.elevenlabs.enabled
      },
      google: {
        apiKey: currentConfig.providers.google.apiKey || '',
        projectId: currentConfig.providers.google.projectId || '',
        enabled: currentConfig.providers.google.enabled
      },
      azure: {
        apiKey: currentConfig.providers.azure.apiKey || '',
        region: currentConfig.providers.azure.region || 'eastus',
        enabled: currentConfig.providers.azure.enabled
      },
      browser: {
        enabled: currentConfig.providers.browser.enabled
      }
    });
  };

  const updateConfig = (provider: string, field: string, value: any) => {
    const newConfig = {
      ...config,
      [provider]: {
        ...config[provider as keyof typeof config],
        [field]: value
      }
    };
    setConfig(newConfig);
    
    // Update TTS service config
    ttsService.updateConfig({
      providers: {
        elevenlabs: {
          apiKey: newConfig.elevenlabs.apiKey,
          enabled: newConfig.elevenlabs.enabled,
          voices: []
        },
        google: {
          apiKey: newConfig.google.apiKey,
          projectId: newConfig.google.projectId,
          enabled: newConfig.google.enabled
        },
        azure: {
          apiKey: newConfig.azure.apiKey,
          region: newConfig.azure.region,
          enabled: newConfig.azure.enabled
        },
        browser: {
          enabled: newConfig.browser.enabled
        }
      }
    });
    
    onConfigChange?.(newConfig);
  };

  const testProvider = async (providerName: string) => {
    setIsTesting(true);
    const startTime = Date.now();
    
    try {
      const request: TTSRequest = {
        text: testText,
        voice: selectedVoice,
        provider: providerName
      };
      
      const result: TTSResponse = await ttsService.synthesizeSpeech(request);
      const duration = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [providerName]: {
          success: result.success,
          error: result.error,
          duration
        }
      }));
      
      if (result.success) {
        toast.success(`Teste do ${providerName} concluído com sucesso!`);
        
        // Play the audio if available
        if (result.audioUrl) {
          const audio = new Audio(result.audioUrl);
          audio.addEventListener('error', (e) => {
            console.error('Erro ao carregar áudio de teste:', e);
            toast.error('Erro ao reproduzir áudio de teste');
          });
          audio.addEventListener('canplay', () => {
          });
          audio.play().catch(error => {
            console.error('Erro ao reproduzir áudio de teste:', error);
            toast.error('Não foi possível reproduzir o áudio de teste');
          });
        }
      } else {
        toast.error(`Teste do ${providerName} falhou: ${result.error}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [providerName]: {
          success: false,
          error: (error as Error).message,
          duration
        }
      }));
      toast.error(`Erro no teste do ${providerName}: ${(error as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testAllProviders = async () => {
    setIsTesting(true);
    setTestResults({});
    
    for (const provider of providers.filter(p => p.isAvailable)) {
      await testProvider(provider.name);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsTesting(false);
  };

  const checkProviderHealth = async (providerName: string) => {
    try {
      const isHealthy = await ttsService.checkProviderHealth(providerName);
      toast.success(`${providerName}: ${isHealthy ? 'Saudável' : 'Indisponível'}`);
      loadProviders(); // Refresh provider status
    } catch (error) {
      toast.error(`Erro ao verificar ${providerName}: ${(error as Error).message}`);
    }
  };

  const getStatusIcon = (provider: TTSProvider) => {
    if (!provider.isAvailable) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getTestResultIcon = (result: { success: boolean; error?: string }) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações TTS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração do Sistema TTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="providers">Provedores</TabsTrigger>
              <TabsTrigger value="test">Teste</TabsTrigger>
              <TabsTrigger value="config">Configuração</TabsTrigger>
            </TabsList>
            
            <TabsContent value="providers" className="space-y-4">
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Status dos Provedores</h3>
                {providers.map((provider) => (
                  <Card key={provider.name}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(provider)}
                          <div>
                            <h4 className="font-medium">{provider.displayName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Prioridade: {provider.priority} | 
                              Status: {provider.isAvailable ? 'Disponível' : 'Indisponível'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkProviderHealth(provider.name)}
                          >
                            Verificar
                          </Button>
                          {testResults[provider.name] && (
                            <Badge variant={testResults[provider.name].success ? 'default' : 'destructive'}>
                              {testResults[provider.name].success ? 'OK' : 'Erro'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider-select">Provedor</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um provedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.filter(p => p.isAvailable).map((provider) => (
                          <SelectItem key={provider.name} value={provider.name}>
                            {provider.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="voice-select">Voz</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma voz" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} ({voice.language})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="test-text">Texto para Teste</Label>
                  <Textarea
                    id="test-text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Digite o texto para testar a síntese de voz..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => testProvider(selectedProvider)}
                    disabled={isTesting || !selectedProvider || !testText}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Testar Provedor
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={testAllProviders}
                    disabled={isTesting || !testText}
                  >
                    Testar Todos
                  </Button>
                </div>
                
                {Object.keys(testResults).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Resultados dos Testes</h4>
                    {Object.entries(testResults).map(([providerName, result]) => (
                      <Alert key={providerName}>
                        <div className="flex items-center gap-2">
                          {getTestResultIcon(result)}
                          <AlertDescription>
                            <strong>{providerName}</strong>: 
                            {result.success ? (
                              `Sucesso (${result.duration}ms)`
                            ) : (
                              `Falha - ${result.error}`
                            )}
                          </AlertDescription>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="config" className="space-y-4">
              <div className="space-y-6">
                {/* ElevenLabs Config */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ElevenLabs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="elevenlabs-enabled"
                        checked={config.elevenlabs.enabled}
                        onChange={(e) => updateConfig('elevenlabs', 'enabled', e.target.checked)}
                      />
                      <Label htmlFor="elevenlabs-enabled">Habilitado</Label>
                    </div>
                    <div>
                      <Label htmlFor="elevenlabs-key">API Key</Label>
                      <Input
                        id="elevenlabs-key"
                        type="password"
                        value={config.elevenlabs.apiKey}
                        onChange={(e) => updateConfig('elevenlabs', 'apiKey', e.target.value)}
                        placeholder="sk-..."
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Google Cloud Config */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Google Cloud TTS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="google-enabled"
                        checked={config.google.enabled}
                        onChange={(e) => updateConfig('google', 'enabled', e.target.checked)}
                      />
                      <Label htmlFor="google-enabled">Habilitado</Label>
                    </div>
                    <div>
                      <Label htmlFor="google-key">API Key</Label>
                      <Input
                        id="google-key"
                        type="password"
                        value={config.google.apiKey}
                        onChange={(e) => updateConfig('google', 'apiKey', e.target.value)}
                        placeholder="AIza..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="google-project">Project ID</Label>
                      <Input
                        id="google-project"
                        value={config.google.projectId}
                        onChange={(e) => updateConfig('google', 'projectId', e.target.value)}
                        placeholder="my-project-id"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Azure Config */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Azure Speech Services</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="azure-enabled"
                        checked={config.azure.enabled}
                        onChange={(e) => updateConfig('azure', 'enabled', e.target.checked)}
                      />
                      <Label htmlFor="azure-enabled">Habilitado</Label>
                    </div>
                    <div>
                      <Label htmlFor="azure-key">Subscription Key</Label>
                      <Input
                        id="azure-key"
                        type="password"
                        value={config.azure.apiKey}
                        onChange={(e) => updateConfig('azure', 'apiKey', e.target.value)}
                        placeholder="Your Azure subscription key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="azure-region">Região</Label>
                      <Select
                        value={config.azure.region}
                        onValueChange={(value) => updateConfig('azure', 'region', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eastus">East US</SelectItem>
                          <SelectItem value="westus">West US</SelectItem>
                          <SelectItem value="westus2">West US 2</SelectItem>
                          <SelectItem value="eastus2">East US 2</SelectItem>
                          <SelectItem value="southcentralus">South Central US</SelectItem>
                          <SelectItem value="westeurope">West Europe</SelectItem>
                          <SelectItem value="northeurope">North Europe</SelectItem>
                          <SelectItem value="southeastasia">Southeast Asia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Browser Config */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Browser Speech Synthesis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="browser-enabled"
                        checked={config.browser.enabled}
                        onChange={(e) => updateConfig('browser', 'enabled', e.target.checked)}
                      />
                      <Label htmlFor="browser-enabled">Habilitado</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Usa a API nativa do navegador. Sempre disponível, mas com qualidade limitada.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TTSConfigPanel;