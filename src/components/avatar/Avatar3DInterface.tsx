// Interface avançada para sistema de avatares 3D
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Avatar3DSystem, 
  AvatarConfig, 
  AvatarCustomization, 
  AnimationConfig, 
  VoiceConfig, 
  ExpressionConfig 
} from '../../services/Avatar3DSystem';
import { Play, Pause, Square, Volume2, VolumeX, Settings, Download, Upload, Save, Eye, EyeOff } from 'lucide-react';

interface Avatar3DInterfaceProps {
  onAvatarCreated?: (avatarId: string) => void;
  onAnimationPlayed?: (avatarId: string, animationId: string) => void;
  onSpeechGenerated?: (avatarId: string, text: string, voiceId: string) => void;
}

interface AvatarState {
  id: string;
  config: AvatarConfig;
  isVisible: boolean;
  currentAnimation?: string;
  currentExpression?: string;
  isSpeaking: boolean;
}

const Avatar3DInterface: React.FC<Avatar3DInterfaceProps> = ({
  onAvatarCreated,
  onAnimationPlayed,
  onSpeechGenerated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarSystemRef = useRef<Avatar3DSystem | null>(null);
  const animationFrameRef = useRef<number>();

  // Estados
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'customize' | 'animate' | 'voice'>('create');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<Map<string, AvatarState>>(new Map());
  const [avatarLibrary, setAvatarLibrary] = useState<AvatarConfig[]>([]);
  const [animationLibrary, setAnimationLibrary] = useState<AnimationConfig[]>([]);
  const [voiceLibrary, setVoiceLibrary] = useState<VoiceConfig[]>([]);
  const [expressionLibrary, setExpressionLibrary] = useState<ExpressionConfig[]>([]);

  // Estados de criação/customização
  const [newAvatarConfig, setNewAvatarConfig] = useState<Partial<AvatarConfig>>({
    name: '',
    gender: 'male',
    ethnicity: 'mixed',
    ageRange: 'adult',
    bodyType: 'average',
    height: 1.70
  });

  // Estados de animação e voz
  const [selectedAnimation, setSelectedAnimation] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speechText, setSpeechText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Estados de customização
  const [customization, setCustomization] = useState<Partial<AvatarCustomization>>({
    face: {
      shape: 'oval',
      skinTone: '#D4A574',
      eyeColor: '#8B4513',
      eyeShape: 'almond',
      eyebrowStyle: 'natural',
      noseShape: 'straight',
      lipShape: 'full',
      lipColor: '#CD5C5C',
      cheekbones: 'prominent',
      jawline: 'sharp',
      wrinkles: 10,
      freckles: 0,
      scars: [],
      tattoos: []
    },
    hair: {
      style: 'short-wavy',
      color: '#2C1810',
      length: 'short',
      texture: 'wavy',
      thickness: 'thick',
      highlights: []
    },
    body: {
      muscleMass: 50,
      bodyFat: 20,
      posture: 'confident',
      skinTexture: 'smooth',
      birthmarks: []
    },
    clothing: {
      outfit: 'business-casual',
      style: 'business',
      colors: ['#2C3E50', '#FFFFFF'],
      accessories: []
    }
  });

  // Inicialização
  useEffect(() => {
    initializeAvatarSystem();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (avatarSystemRef.current) {
        avatarSystemRef.current.dispose();
      }
    };
  }, []);

  // Loop de renderização
  useEffect(() => {
    if (isInitialized && avatarSystemRef.current) {
      const animate = () => {
        avatarSystemRef.current?.render();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    }
  }, [isInitialized]);

  const initializeAvatarSystem = async () => {
    if (!canvasRef.current) return;

    try {
      setIsLoading(true);
      
      const avatarSystem = new Avatar3DSystem(canvasRef.current);
      await avatarSystem.initialize();
      
      avatarSystemRef.current = avatarSystem;
      
      // Carregar bibliotecas
      setAvatarLibrary(avatarSystem.getAvatarLibrary());
      setAnimationLibrary(avatarSystem.getAnimationLibrary());
      setVoiceLibrary(avatarSystem.getVoiceLibrary());
      setExpressionLibrary(avatarSystem.getExpressionLibrary());
      
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Erro ao inicializar sistema de avatares:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAvatar = async () => {
    if (!avatarSystemRef.current || !newAvatarConfig.name) return;

    try {
      setIsLoading(true);
      
      const avatarId = `avatar-${Date.now()}`;
      const fullConfig: AvatarConfig = {
        id: avatarId,
        name: newAvatarConfig.name!,
        gender: newAvatarConfig.gender || 'male',
        ethnicity: newAvatarConfig.ethnicity || 'mixed',
        ageRange: newAvatarConfig.ageRange || 'adult',
        bodyType: newAvatarConfig.bodyType || 'average',
        height: newAvatarConfig.height || 1.70,
        customization: customization as AvatarCustomization
      };
      
      await avatarSystemRef.current.createAvatar(fullConfig);
      
      const newAvatarState: AvatarState = {
        id: avatarId,
        config: fullConfig,
        isVisible: true,
        isSpeaking: false
      };
      
      setAvatars(prev => new Map(prev.set(avatarId, newAvatarState)));
      setSelectedAvatar(avatarId);
      
      onAvatarCreated?.(avatarId);
      
    } catch (error) {
      console.error('Erro ao criar avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPresetAvatar = async (presetConfig: AvatarConfig) => {
    if (!avatarSystemRef.current) return;

    try {
      setIsLoading(true);
      
      const avatarId = `preset-${Date.now()}`;
      const config = { ...presetConfig, id: avatarId };
      
      await avatarSystemRef.current.createAvatar(config);
      
      const newAvatarState: AvatarState = {
        id: avatarId,
        config,
        isVisible: true,
        isSpeaking: false
      };
      
      setAvatars(prev => new Map(prev.set(avatarId, newAvatarState)));
      setSelectedAvatar(avatarId);
      
      onAvatarCreated?.(avatarId);
      
    } catch (error) {
      console.error('Erro ao carregar avatar preset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAnimation = (animationId: string) => {
    if (!selectedAvatar || !avatarSystemRef.current) return;

    try {
      avatarSystemRef.current.playAnimation(selectedAvatar, animationId);
      
      setAvatars(prev => {
        const updated = new Map(prev);
        const avatar = updated.get(selectedAvatar);
        if (avatar) {
          avatar.currentAnimation = animationId;
          updated.set(selectedAvatar, avatar);
        }
        return updated;
      });
      
      onAnimationPlayed?.(selectedAvatar, animationId);
      
    } catch (error) {
      console.error('Erro ao reproduzir animação:', error);
    }
  };

  const handleSetExpression = (expressionId: string, intensity: number = 1.0) => {
    if (!selectedAvatar || !avatarSystemRef.current) return;

    try {
      avatarSystemRef.current.setExpression(selectedAvatar, expressionId, intensity);
      
      setAvatars(prev => {
        const updated = new Map(prev);
        const avatar = updated.get(selectedAvatar);
        if (avatar) {
          avatar.currentExpression = expressionId;
          updated.set(selectedAvatar, avatar);
        }
        return updated;
      });
      
    } catch (error) {
      console.error('Erro ao definir expressão:', error);
    }
  };

  const handleSpeak = async () => {
    if (!selectedAvatar || !avatarSystemRef.current || !speechText || !selectedVoice) return;

    try {
      setIsLoading(true);
      
      await avatarSystemRef.current.speakText(
        selectedAvatar,
        speechText,
        selectedVoice
      );
      
      setAvatars(prev => {
        const updated = new Map(prev);
        const avatar = updated.get(selectedAvatar);
        if (avatar) {
          avatar.isSpeaking = true;
          updated.set(selectedAvatar, avatar);
        }
        return updated;
      });
      
      onSpeechGenerated?.(selectedAvatar, speechText, selectedVoice);
      
      // Simular fim da fala
      setTimeout(() => {
        setAvatars(prev => {
          const updated = new Map(prev);
          const avatar = updated.get(selectedAvatar);
          if (avatar) {
            avatar.isSpeaking = false;
            updated.set(selectedAvatar, avatar);
          }
          return updated;
        });
      }, speechText.length * 100);
      
    } catch (error) {
      console.error('Erro ao gerar fala:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvatarVisibility = (avatarId: string) => {
    setAvatars(prev => {
      const updated = new Map(prev);
      const avatar = updated.get(avatarId);
      if (avatar) {
        avatar.isVisible = !avatar.isVisible;
        updated.set(avatarId, avatar);
      }
      return updated;
    });
  };

  const handleRemoveAvatar = (avatarId: string) => {
    if (avatarSystemRef.current) {
      avatarSystemRef.current.removeAvatar(avatarId);
    }
    
    setAvatars(prev => {
      const updated = new Map(prev);
      updated.delete(avatarId);
      return updated;
    });
    
    if (selectedAvatar === avatarId) {
      setSelectedAvatar(null);
    }
  };

  const renderCreateTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Avatar</label>
          <input
            type="text"
            value={newAvatarConfig.name || ''}
            onChange={(e) => setNewAvatarConfig(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o nome..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Gênero</label>
          <select
            value={newAvatarConfig.gender || 'male'}
            onChange={(e) => setNewAvatarConfig(prev => ({ ...prev, gender: e.target.value as any }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="neutral">Neutro</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Etnia</label>
          <select
            value={newAvatarConfig.ethnicity || 'mixed'}
            onChange={(e) => setNewAvatarConfig(prev => ({ ...prev, ethnicity: e.target.value as any }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="caucasian">Caucasiano</option>
            <option value="african">Africano</option>
            <option value="asian">Asiático</option>
            <option value="hispanic">Hispânico</option>
            <option value="mixed">Misto</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Faixa Etária</label>
          <select
            value={newAvatarConfig.ageRange || 'adult'}
            onChange={(e) => setNewAvatarConfig(prev => ({ ...prev, ageRange: e.target.value as any }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="child">Criança</option>
            <option value="teen">Adolescente</option>
            <option value="young_adult">Jovem Adulto</option>
            <option value="adult">Adulto</option>
            <option value="senior">Idoso</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Tipo Corporal</label>
          <select
            value={newAvatarConfig.bodyType || 'average'}
            onChange={(e) => setNewAvatarConfig(prev => ({ ...prev, bodyType: e.target.value as any }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="slim">Magro</option>
            <option value="athletic">Atlético</option>
            <option value="average">Médio</option>
            <option value="heavy">Pesado</option>
            <option value="muscular">Musculoso</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Altura (m)</label>
          <input
            type="number"
            min="1.0"
            max="2.5"
            step="0.01"
            value={newAvatarConfig.height || 1.70}
            onChange={(e) => setNewAvatarConfig(prev => ({ ...prev, height: parseFloat(e.target.value) }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <button
        onClick={handleCreateAvatar}
        disabled={!newAvatarConfig.name || isLoading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Criando Avatar...' : 'Criar Avatar'}
      </button>
    </div>
  );

  const renderLibraryTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Avatares Pré-definidos</h3>
      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
        {avatarLibrary.map((avatar) => (
          <div key={avatar.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{avatar.name}</h4>
                <p className="text-sm text-gray-600">
                  {avatar.gender === 'male' ? 'Masculino' : avatar.gender === 'female' ? 'Feminino' : 'Neutro'} • 
                  {avatar.ageRange === 'adult' ? 'Adulto' : avatar.ageRange} • 
                  {avatar.ethnicity === 'mixed' ? 'Misto' : avatar.ethnicity}
                </p>
                <p className="text-xs text-gray-500">{avatar.height}m • {avatar.bodyType}</p>
              </div>
              <button
                onClick={() => handleLoadPresetAvatar(avatar)}
                disabled={isLoading}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Carregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnimateTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Animações</h3>
        <div className="grid grid-cols-2 gap-2">
          {animationLibrary.map((animation) => (
            <button
              key={animation.id}
              onClick={() => handlePlayAnimation(animation.id)}
              disabled={!selectedAvatar || isLoading}
              className="p-3 border rounded-lg text-left hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-sm">{animation.name}</div>
              <div className="text-xs text-gray-600">
                {animation.type} • {animation.duration}s
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Expressões</h3>
        <div className="grid grid-cols-3 gap-2">
          {expressionLibrary.map((expression) => (
            <button
              key={expression.id}
              onClick={() => handleSetExpression(expression.id)}
              disabled={!selectedAvatar || isLoading}
              className="p-2 border rounded-lg text-center hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-medium">{expression.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVoiceTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Selecionar Voz</label>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Escolha uma voz...</option>
          {voiceLibrary.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name} ({voice.gender === 'male' ? 'Masculino' : 'Feminino'})
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Texto para Fala</label>
        <textarea
          value={speechText}
          onChange={(e) => setSpeechText(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Digite o texto que o avatar deve falar..."
        />
      </div>
      
      <button
        onClick={handleSpeak}
        disabled={!selectedAvatar || !speechText || !selectedVoice || isLoading}
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Volume2 className="w-4 h-4" />
        {isLoading ? 'Gerando Fala...' : 'Falar Texto'}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Canvas 3D */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-gradient-to-b from-blue-100 to-blue-200"
        />
        
        {/* Overlay de loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-center">Processando...</p>
            </div>
          </div>
        )}
        
        {/* Lista de avatares */}
        {avatars.size > 0 && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <h3 className="font-semibold mb-2">Avatares na Cena</h3>
            <div className="space-y-2">
              {Array.from(avatars.values()).map((avatar) => (
                <div key={avatar.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAvatarVisibility(avatar.id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {avatar.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <span 
                      className={`text-sm cursor-pointer ${
                        selectedAvatar === avatar.id ? 'font-bold text-blue-600' : ''
                      }`}
                      onClick={() => setSelectedAvatar(avatar.id)}
                    >
                      {avatar.config.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAvatar(avatar.id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Painel lateral */}
      <div className="w-96 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Sistema de Avatares 3D</h2>
          <p className="text-sm text-gray-600">
            {selectedAvatar ? `Avatar selecionado: ${avatars.get(selectedAvatar)?.config.name}` : 'Nenhum avatar selecionado'}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'create', label: 'Criar', icon: '🎭' },
            { id: 'library', label: 'Biblioteca', icon: '📚' },
            { id: 'animate', label: 'Animar', icon: '🎬' },
            { id: 'voice', label: 'Voz', icon: '🎤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 p-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Conteúdo das tabs */}
        <div className="flex-1 p-4 overflow-y-auto">
          {!isInitialized ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Inicializando sistema...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'create' && renderCreateTab()}
              {activeTab === 'library' && renderLibraryTab()}
              {activeTab === 'animate' && renderAnimateTab()}
              {activeTab === 'voice' && renderVoiceTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Avatar3DInterface;