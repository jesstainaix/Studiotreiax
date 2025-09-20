import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Heart, 
  Play, 
  Settings, 
  Upload, 
  Download,
  Sparkles,
  User,
  Users,
  Mic,
  Volume2,
  Palette,
  Shirt,
  Eye,
  Star,
  Video,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import ttsService from '@/services/ttsService';

interface AIAvatar {
  id: string;
  name: string;
  type: 'instructor' | 'worker' | 'supervisor' | 'engineer' | 'custom';
  gender: 'male' | 'female' | 'neutral';
  ethnicity: string;
  age: 'young' | 'adult' | 'senior';
  thumbnail: string;
  modelUrl: string;
  voiceId: string;
  animations: string[];
  compliance: string[];
  isCustom: boolean;
  isFavorite: boolean;
  rating: number;
  description: string;
  tags: string[];
}

interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  accent: string;
  sample?: string;
}

const AvatarManager: React.FC = () => {
  const [avatars, setAvatars] = useState<AIAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<AIAvatar | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [showCustomization, setShowCustomization] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isTestingAvatar, setIsTestingAvatar] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [currentTestStep, setCurrentTestStep] = useState<string>('');
  const [isAvatarAnimating, setIsAvatarAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  // TTS service já está inicializado como singleton
  const [customization, setCustomization] = useState({
    skinTone: 50,
    hairColor: '#8B4513',
    eyeColor: '#654321',
    clothing: 'professional',
    accessories: [] as string[]
  });

  // Mock data para demonstração
  useEffect(() => {
    const mockAvatars: AIAvatar[] = [
      {
        id: 'avatar-001',
        name: 'Carlos Silva',
        type: 'instructor',
        gender: 'male',
        ethnicity: 'brasileiro',
        age: 'adult',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20instructor%20avatar%20realistic%203D%20model&image_size=square',
        modelUrl: '/models/avatars/carlos-silva.glb',
        voiceId: 'carlos-voice-pt-br',
        animations: ['presenting', 'pointing', 'explaining', 'greeting'],
        compliance: ['NR-12', 'NR-10', 'NR-35'],
        isCustom: false,
        isFavorite: true,
        rating: 4.8,
        description: 'Instrutor especializado em segurança do trabalho',
        tags: ['segurança', 'treinamento', 'NR']
      },
      {
        id: 'avatar-002',
        name: 'Maria Santos',
        type: 'supervisor',
        gender: 'female',
        ethnicity: 'brasileira',
        age: 'adult',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20supervisor%20avatar%20realistic%203D%20model&image_size=square',
        modelUrl: '/models/avatars/maria-santos.glb',
        voiceId: 'maria-voice-pt-br',
        animations: ['supervising', 'checking', 'approving', 'directing'],
        compliance: ['NR-12', 'NR-18', 'NR-35'],
        isCustom: false,
        isFavorite: false,
        rating: 4.6,
        description: 'Supervisora experiente em gestão de equipes',
        tags: ['supervisão', 'gestão', 'liderança']
      },
      {
        id: 'avatar-003',
        name: 'João Oliveira',
        type: 'engineer',
        gender: 'male',
        ethnicity: 'brasileiro',
        age: 'adult',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20engineer%20avatar%20realistic%203D%20model&image_size=square',
        modelUrl: '/models/avatars/joao-oliveira.glb',
        voiceId: 'joao-voice-pt-br',
        animations: ['calculating', 'designing', 'analyzing', 'presenting'],
        compliance: ['NR-10', 'NR-13', 'NR-33'],
        isCustom: false,
        isFavorite: true,
        rating: 4.9,
        description: 'Engenheiro especialista em sistemas industriais',
        tags: ['engenharia', 'técnico', 'industrial']
      },
      {
        id: 'avatar-004',
        name: 'Ana Costa',
        type: 'worker',
        gender: 'female',
        ethnicity: 'brasileira',
        age: 'young',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20worker%20avatar%20realistic%203D%20model&image_size=square',
        modelUrl: '/models/avatars/ana-costa.glb',
        voiceId: 'ana-voice-pt-br',
        animations: ['working', 'operating', 'checking', 'reporting'],
        compliance: ['NR-06', 'NR-12', 'NR-17'],
        isCustom: false,
        isFavorite: false,
        rating: 4.4,
        description: 'Operadora qualificada em processos industriais',
        tags: ['operação', 'produção', 'qualidade']
      }
    ];

    const mockVoices: VoiceOption[] = [
      { id: 'carlos-voice-pt-br', name: 'Carlos (Masculino)', language: 'pt-BR', gender: 'male', accent: 'brasileiro' },
      { id: 'maria-voice-pt-br', name: 'Maria (Feminino)', language: 'pt-BR', gender: 'female', accent: 'brasileiro' },
      { id: 'joao-voice-pt-br', name: 'João (Masculino)', language: 'pt-BR', gender: 'male', accent: 'brasileiro' },
      { id: 'ana-voice-pt-br', name: 'Ana (Feminino)', language: 'pt-BR', gender: 'female', accent: 'brasileiro' }
    ];

    setTimeout(() => {
      setAvatars(mockAvatars);
      setVoices(mockVoices);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredAvatars = avatars.filter(avatar => {
    const matchesSearch = avatar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avatar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avatar.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || avatar.type === filterType;
    const matchesGender = filterGender === 'all' || avatar.gender === filterGender;
    return matchesSearch && matchesType && matchesGender;
  });

  const handleAvatarSelect = (avatar: AIAvatar) => {
    setSelectedAvatar(avatar);
    setShowCustomization(false);
  };

  const handleFavoriteToggle = (avatarId: string) => {
    setAvatars(prev => prev.map(avatar => 
      avatar.id === avatarId 
        ? { ...avatar, isFavorite: !avatar.isFavorite }
        : avatar
    ));
  };

  const handleCustomizationChange = (key: string, value: any) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
  };

  const handleTestAvatar = async () => {
    if (!selectedAvatar) return;
    
    setIsTestingAvatar(true);
    setTestResult(null);
    setCurrentTestStep('');
    setIsAvatarAnimating(false);
    setCurrentAnimation('');
    setIsSpeaking(false);
    
    try {
      // Etapa 1: Carregando modelo 3D
      setCurrentTestStep('Carregando modelo 3D...');
      setIsAvatarAnimating(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Etapa 2: Testando animações
      setCurrentTestStep('Testando animações...');
      for (const animation of selectedAvatar.animations) {
        setCurrentAnimation(animation);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Etapa 3: Preparando síntese de voz
      setCurrentTestStep('Preparando síntese de voz...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Etapa 4: Testando voz com TTS avançado
      setCurrentTestStep('Testando voz...');
      setIsSpeaking(true);
      
      const testMessages = [
        `Olá! Eu sou ${selectedAvatar.name}.`,
        `${selectedAvatar.description}`,
        'Estou pronto para ajudar em seus treinamentos de segurança!',
        'Posso demonstrar procedimentos e explicar normas técnicas.'
      ];
      
      // Usar TTS Service se disponível, senão fallback para Web Speech API
      for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        setCurrentAnimation(selectedAvatar.animations[i % selectedAvatar.animations.length]);
        
        try {
          // Tentar usar o TTS Service avançado
          const ttsResponse = await ttsService.synthesizeSpeech({
            text: message,
            voice: selectedAvatar.voiceId,
            provider: 'browser',
            language: 'pt-BR',
            speed: 0.9,
            pitch: 0
          });
          
          if (ttsResponse.success && ttsResponse.audioUrl) {
            // Reproduzir áudio gerado pelo TTS Service
            const audio = new Audio(ttsResponse.audioUrl);
            await new Promise((resolve, reject) => {
              audio.onended = resolve;
              audio.onerror = reject;
              audio.play();
            });
          } else {
            throw new Error('TTS Service failed');
          }
        } catch (error) {
          // Fallback para Web Speech API
          if ('speechSynthesis' in window) {
            await new Promise((resolve) => {
              const utterance = new SpeechSynthesisUtterance(message);
              utterance.lang = 'pt-BR';
              utterance.rate = 0.9;
              utterance.pitch = selectedAvatar.gender === 'female' ? 1.2 : 0.8;
              utterance.volume = 0.8;
              
              utterance.onend = () => resolve(undefined);
              utterance.onerror = () => resolve(undefined);
              
              speechSynthesis.speak(utterance);
            });
          }
        }
        
        // Pausa entre mensagens
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Etapa 5: Finalizando teste
      setCurrentTestStep('Finalizando teste...');
      setCurrentAnimation('greeting');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestResult('✅ Teste realizado com sucesso! Avatar, voz e animações funcionando perfeitamente.');
      
      // Limpa o resultado após 8 segundos
      setTimeout(() => {
        setTestResult(null);
        setCurrentTestStep('');
      }, 8000);
      
    } catch (error) {
      console.error('Erro no teste do avatar:', error);
      setTestResult('❌ Erro ao testar avatar. Verifique a conexão e tente novamente.');
      setTimeout(() => {
        setTestResult(null);
        setCurrentTestStep('');
      }, 5000);
    } finally {
      setIsTestingAvatar(false);
      setIsAvatarAnimating(false);
      setCurrentAnimation('');
      setIsSpeaking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando avatares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <style>{`
        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes avatarTalk {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.1); }
        }
        
        @keyframes avatarGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
        }
        
        @keyframes speakingIndicator {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        .avatar-animating {
          animation: avatarPulse 2s ease-in-out infinite;
        }
        
        .avatar-speaking {
          animation: avatarTalk 0.5s ease-in-out infinite, avatarGlow 2s ease-in-out infinite;
        }
        
        .speaking-indicator {
          animation: speakingIndicator 1s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciador de Avatares AI</h1>
              <p className="text-gray-600">Selecione e customize avatares para seus vídeos de treinamento</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Avatar
              </Button>
              <Button className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Criar Avatar IA
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtros e Lista de Avatares */}
          <div className="lg:col-span-2">
            {/* Filtros */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Nome, descrição ou tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="instructor">Instrutor</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="engineer">Engenheiro</SelectItem>
                        <SelectItem value="worker">Operador</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={filterGender} onValueChange={setFilterGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="neutral">Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid de Avatares */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvatars.map((avatar) => (
                <Card 
                  key={avatar.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedAvatar?.id === avatar.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={avatar.thumbnail} alt={avatar.name} />
                          <AvatarFallback>
                            <User className="w-8 h-8" />
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-white shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteToggle(avatar.id);
                          }}
                        >
                          <Heart 
                            className={`w-3 h-3 ${
                              avatar.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                            }`} 
                          />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{avatar.name}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-gray-600">{avatar.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{avatar.description}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {avatar.type === 'instructor' ? 'Instrutor' :
                             avatar.type === 'supervisor' ? 'Supervisor' :
                             avatar.type === 'engineer' ? 'Engenheiro' :
                             avatar.type === 'worker' ? 'Operador' : 'Personalizado'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {avatar.gender === 'male' ? 'Masculino' :
                             avatar.gender === 'female' ? 'Feminino' : 'Neutro'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {avatar.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {avatar.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{avatar.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAvatars.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum avatar encontrado</h3>
                  <p className="text-gray-600">Tente ajustar os filtros ou criar um novo avatar personalizado.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview e Customização */}
          <div className="lg:col-span-1">
            {selectedAvatar ? (
              <div className="space-y-6">
                {/* Preview do Avatar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Preview</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCustomization(!showCustomization)}
                        className="flex items-center gap-2"
                      >
                        <Palette className="w-4 h-4" />
                        Customizar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="relative">
                        <Avatar className={`w-24 h-24 mx-auto mb-4 transition-all duration-300 ${
                          isAvatarAnimating ? 'avatar-animating' : ''
                        } ${
                          isSpeaking ? 'avatar-speaking' : ''
                        }`}>
                          <AvatarImage src={selectedAvatar.thumbnail} alt={selectedAvatar.name} />
                          <AvatarFallback>
                            <User className="w-12 h-12" />
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Indicador de fala */}
                        {isSpeaking && (
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs speaking-indicator">
                              <Volume2 className="w-3 h-3" />
                              Falando
                            </div>
                          </div>
                        )}
                        
                        {/* Indicador de animação atual */}
                        {currentAnimation && (
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <Badge variant="secondary" className="text-xs">
                              {currentAnimation}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg">{selectedAvatar.name}</h3>
                      <p className="text-gray-600 text-sm">{selectedAvatar.description}</p>
                      
                      {/* Status do teste */}
                      {currentTestStep && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-700 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {currentTestStep}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tipo:</span>
                        <Badge>
                          {selectedAvatar.type === 'instructor' ? 'Instrutor' :
                           selectedAvatar.type === 'supervisor' ? 'Supervisor' :
                           selectedAvatar.type === 'engineer' ? 'Engenheiro' :
                           selectedAvatar.type === 'worker' ? 'Operador' : 'Personalizado'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Gênero:</span>
                        <span className="text-sm text-gray-600">
                          {selectedAvatar.gender === 'male' ? 'Masculino' :
                           selectedAvatar.gender === 'female' ? 'Feminino' : 'Neutro'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Avaliação:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{selectedAvatar.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Animações Disponíveis:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedAvatar.animations.map((animation) => (
                          <Badge key={animation} variant="outline" className="text-xs">
                            {animation}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Conformidade:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedAvatar.compliance.map((norm) => (
                          <Badge key={norm} variant="secondary" className="text-xs">
                            {norm}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Button 
                        className={`w-full flex items-center gap-2 transition-all duration-300 ${
                          isTestingAvatar ? 'bg-blue-600 hover:bg-blue-700' : ''
                        }`}
                        onClick={handleTestAvatar}
                        disabled={isTestingAvatar}
                      >
                        {isTestingAvatar ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        {isTestingAvatar ? (
                          currentTestStep || 'Iniciando teste...'
                        ) : (
                          'Testar Avatar Hiper-Realista'
                        )}
                      </Button>
                      
                      <Button variant="outline" className="w-full flex items-center gap-2" disabled={isTestingAvatar}>
                        <Video className="w-4 h-4" />
                        Usar no Projeto
                      </Button>
                      
                      {/* Resultado do teste com ícones */}
                      {testResult && (
                        <div className={`mt-3 p-3 rounded-lg text-sm border transition-all duration-300 ${
                          testResult.includes('✅') 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            {testResult.includes('✅') ? (
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            )}
                            <span>{testResult}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Progresso detalhado durante o teste */}
                      {isTestingAvatar && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Progresso do Teste</span>
                              <span>{isSpeaking ? 'Falando...' : 'Processando...'}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`bg-blue-500 h-2 rounded-full transition-all duration-500 ${
                                currentTestStep.includes('Carregando') ? 'w-1/5' :
                                currentTestStep.includes('animações') ? 'w-2/5' :
                                currentTestStep.includes('Preparando') ? 'w-3/5' :
                                currentTestStep.includes('Testando voz') ? 'w-4/5' :
                                currentTestStep.includes('Finalizando') ? 'w-full' : 'w-0'
                              }`}></div>
                            </div>
                            {currentAnimation && (
                              <div className="text-xs text-gray-600">
                                Animação atual: <span className="font-medium">{currentAnimation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Customização */}
                {showCustomization && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Customização
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="appearance" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="appearance">Aparência</TabsTrigger>
                          <TabsTrigger value="voice">Voz</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="appearance" className="space-y-4">
                          <div>
                            <Label>Tom de Pele</Label>
                            <Slider
                              value={[customization.skinTone]}
                              onValueChange={(value) => handleCustomizationChange('skinTone', value[0])}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                          </div>
                          
                          <div>
                            <Label>Cor do Cabelo</Label>
                            <Input
                              type="color"
                              value={customization.hairColor}
                              onChange={(e) => handleCustomizationChange('hairColor', e.target.value)}
                              className="mt-2 h-10"
                            />
                          </div>
                          
                          <div>
                            <Label>Cor dos Olhos</Label>
                            <Input
                              type="color"
                              value={customization.eyeColor}
                              onChange={(e) => handleCustomizationChange('eyeColor', e.target.value)}
                              className="mt-2 h-10"
                            />
                          </div>
                          
                          <div>
                            <Label>Vestimenta</Label>
                            <Select 
                              value={customization.clothing} 
                              onValueChange={(value) => handleCustomizationChange('clothing', value)}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Profissional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="safety">Segurança</SelectItem>
                                <SelectItem value="formal">Formal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="voice" className="space-y-4">
                          <div>
                            <Label>Voz do Avatar</Label>
                            <Select defaultValue={selectedAvatar.voiceId}>
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {voices.map((voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name} - {voice.accent}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button variant="outline" className="w-full flex items-center gap-2">
                            <Mic className="w-4 h-4" />
                            Testar Voz
                          </Button>
                        </TabsContent>
                      </Tabs>
                      
                      <div className="mt-6 pt-4 border-t space-y-2">
                        <Button className="w-full">
                          Salvar Customização
                        </Button>
                        <Button variant="outline" className="w-full">
                          Resetar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione um Avatar</h3>
                  <p className="text-gray-600">Clique em um avatar para ver o preview e opções de customização.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarManager;