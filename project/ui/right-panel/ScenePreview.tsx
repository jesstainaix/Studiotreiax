// Scene Preview Component with Drop Zone for Avatar Assignment
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Monitor,
  User,
  Move,
  RotateCcw,
  Settings,
  Trash2,
  Play,
  Volume2,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { sceneManager } from '../SceneManager';
import { AvatarGenerationResult, SceneAvatarConfig } from '../../providers/avatars/types';

interface ScenePreviewProps {
  slideId: number;
  slideTitle?: string;
  className?: string;
  onAvatarAssigned?: (slideId: number, avatarId: string) => void;
  onAvatarRemoved?: (slideId: number) => void;
}

const ScenePreview: React.FC<ScenePreviewProps> = ({
  slideId,
  slideTitle = `Slide ${slideId}`,
  className = '',
  onAvatarAssigned,
  onAvatarRemoved
}) => {
  // State
  const [sceneConfig, setSceneConfig] = useState<SceneAvatarConfig | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarData, setAvatarData] = useState<AvatarGenerationResult | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Refs
  const previewRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Load scene configuration on mount
  useEffect(() => {
    loadSceneConfig();
  }, [slideId]);

  // Subscribe to scene manager changes
  useEffect(() => {
    const unsubscribe = sceneManager.subscribe(() => {
      loadSceneConfig();
    });
    return unsubscribe;
  }, [slideId]);

  const loadSceneConfig = async () => {
    try {
      const config = await sceneManager.loadConfiguration();
      const scene = sceneManager.getSceneBySlideId(slideId);
      setSceneConfig(scene);
      
      // Load avatar data if scene has an avatar
      if (scene) {
        // In a real implementation, fetch avatar data from provider
        // For now, we'll create mock data based on the avatarId
        const mockAvatarData: AvatarGenerationResult = {
          avatarId: scene.avatarId,
          status: 'completed',
          providerId: 'mock',
          metadata: {
            generated_at: new Date().toISOString(),
            processing_time_ms: 3000,
            source_photo: 'provided',
            model_version: 'mock-v1.0',
            quality: 'medium'
          },
          assets: {
            thumbnail: `/api/avatars/mock/${scene.avatarId}/thumbnail.jpg`,
            model_3d: `/api/avatars/mock/${scene.avatarId}/model.glb`,
            textures: []
          },
          animations: ['idle-neutral', 'presenting'],
          voice_profiles: [scene.avatarConfig?.voice || 'br-female-adult-1']
        };
        setAvatarData(mockAvatarData);
      } else {
        setAvatarData(null);
      }
    } catch (error) {
      console.error('[ScenePreview] Failed to load scene config:', error);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    setIsLoading(true);

    try {
      // Try multiple data formats for better compatibility
      let avatarId = null;
      let dragData = null;

      // Try JSON format first
      try {
        const jsonData = event.dataTransfer.getData('application/json');
        if (jsonData) {
          dragData = JSON.parse(jsonData);
          avatarId = dragData.avatarId;
        }
      } catch (jsonError) {
        console.warn('[ScenePreview] Failed to parse JSON drag data, trying alternatives');
      }

      // Fallback to text formats
      if (!avatarId) {
        avatarId = event.dataTransfer.getData('text/avatar-id') || 
                  event.dataTransfer.getData('text/plain');
      }

      if (avatarId && (dragData?.type === 'avatar' || !dragData)) {
        // Calculate drop position relative to preview area
        const rect = previewRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          
          // Clamp to reasonable bounds (0.1 to 0.9)
          const placement = {
            x: Math.max(0.1, Math.min(0.9, x)),
            y: Math.max(0.1, Math.min(0.9, y)),
            scale: 0.9
          };

          console.log('[ScenePreview] Assigning avatar to scene:', { slideId, avatarId, placement });

          // Assign avatar to scene
          await sceneManager.assignAvatarToScene(
            slideId,
            avatarId,
            placement
          );

          if (onAvatarAssigned) {
            onAvatarAssigned(slideId, avatarId);
          }
        }
      } else {
        console.warn('[ScenePreview] Invalid drop data - no avatarId found');
      }
    } catch (error) {
      console.error('[ScenePreview] Failed to handle drop:', error);
      // Add user-friendly error notification
      alert('Erro ao atribuir avatar à cena. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [slideId, onAvatarAssigned]);

  // Avatar manipulation handlers
  const handleAvatarDragStart = useCallback((event: React.DragEvent) => {
    if (!sceneConfig) return;
    
    const rect = previewRef.current?.getBoundingClientRect();
    if (rect) {
      const startX = event.clientX - rect.left;
      const startY = event.clientY - rect.top;
      setDragPosition({ x: startX, y: startY });
    }
  }, [sceneConfig]);

  const handleAvatarDrag = useCallback((event: React.DragEvent) => {
    if (!dragPosition || !previewRef.current || !sceneConfig) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      // Update position in real-time (debounced)
      sceneManager.updateAvatarPlacement(slideId, {
        ...sceneConfig.avatarPlacement,
        x: Math.max(0.1, Math.min(0.9, x)),
        y: Math.max(0.1, Math.min(0.9, y))
      });
    }
  }, [slideId, dragPosition, sceneConfig]);

  const handleAvatarDragEnd = useCallback(() => {
    setDragPosition(null);
  }, []);

  const handleRemoveAvatar = async () => {
    try {
      await sceneManager.removeAvatarFromScene(slideId);
      if (onAvatarRemoved) {
        onAvatarRemoved(slideId);
      }
    } catch (error) {
      console.error('[ScenePreview] Failed to remove avatar:', error);
    }
  };

  const handleScaleChange = (values: number[]) => {
    if (sceneConfig) {
      sceneManager.updateAvatarPlacement(slideId, {
        ...sceneConfig.avatarPlacement,
        scale: values[0]
      });
    }
  };

  const handlePoseChange = (pose: string) => {
    sceneManager.updateAvatarPose(slideId, pose);
  };

  const handleVoiceChange = (voice: string) => {
    if (sceneConfig?.avatarConfig) {
      sceneManager.updateAvatarConfig(slideId, { voice });
    }
  };

  const getAvatarDisplayName = (avatarId: string): string => {
    const nameMap: { [key: string]: string } = {
      'avatar_corporativo_1': 'Avatar Corporativo',
      'avatar_educacao_1': 'Avatar Educação',
      'brazilian-male-1': 'João Silva',
      'brazilian-female-1': 'Maria Santos'
    };
    
    if (avatarId.startsWith('avatar_custom_')) {
      const parts = avatarId.split('_');
      const userId = parts[2] || 'Usuario';
      return `Avatar de ${userId}`;
    }
    
    return nameMap[avatarId] || avatarId;
  };

  const availablePoses = [
    { value: 'neutral', label: 'Neutro' },
    { value: 'presenting', label: 'Apresentando' },
    { value: 'confident', label: 'Confiante' },
    { value: 'friendly', label: 'Amigável' },
    { value: 'professional', label: 'Profissional' }
  ];

  const availableVoices = [
    { value: 'br-female-adult-1', label: 'Ana (Feminina)' },
    { value: 'br-male-adult-1', label: 'Carlos (Masculino)' },
    { value: 'br-female-young-1', label: 'Sofia (Jovem)' },
    { value: 'br-male-young-1', label: 'Pedro (Jovem)' }
  ];

  return (
    <Card className={`${className} ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            <span>{slideTitle}</span>
            {sceneConfig && (
              <Badge variant="secondary" className="text-xs">
                Avatar Atribuído
              </Badge>
            )}
          </div>
          {sceneConfig && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowControls(!showControls)}
              className="h-6 w-6 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Preview Area */}
        <div
          ref={previewRef}
          className={`relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed transition-all ${
            isDragOver ? 'border-blue-400' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-600">Atribuindo avatar...</p>
              </div>
            </div>
          )}

          {!sceneConfig && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-center p-4">
              <div>
                <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {isDragOver ? 'Solte o avatar aqui' : 'Arraste um avatar para esta cena'}
                </p>
                <p className="text-xs text-gray-500">
                  O avatar aparecerá na posição onde você soltá-lo
                </p>
              </div>
            </div>
          )}

          {sceneConfig && avatarData && (
            <div
              ref={avatarRef}
              className="absolute cursor-move"
              style={{
                left: `${sceneConfig.avatarPlacement.x * 100}%`,
                top: `${sceneConfig.avatarPlacement.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${sceneConfig.avatarPlacement.scale})`,
              }}
              draggable
              onDragStart={handleAvatarDragStart}
              onDrag={handleAvatarDrag}
              onDragEnd={handleAvatarDragEnd}
            >
              <div className="relative group">
                <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                  <AvatarImage 
                    src={avatarData.assets.thumbnail} 
                    alt={getAvatarDisplayName(sceneConfig.avatarId)}
                  />
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                
                {/* Status indicator */}
                <div className="absolute -top-1 -right-1">
                  {avatarData.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
                  )}
                  {avatarData.status === 'failed' && (
                    <AlertCircle className="w-4 h-4 text-red-500 bg-white rounded-full" />
                  )}
                </div>

                {/* Quick actions */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1 bg-white rounded-md shadow-md p-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Move className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Info */}
        {sceneConfig && avatarData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {getAvatarDisplayName(sceneConfig.avatarId)}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                  <Play className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Testar Voz
                </Button>
              </div>
            </div>

            {/* Controls */}
            {showControls && (
              <div className="space-y-3 pt-2 border-t">
                {/* Scale Control */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Tamanho: {Math.round(sceneConfig.avatarPlacement.scale * 100)}%
                  </label>
                  <Slider
                    value={[sceneConfig.avatarPlacement.scale]}
                    onValueChange={handleScaleChange}
                    min={0.3}
                    max={1.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Pose Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Pose
                  </label>
                  <Select value={sceneConfig.avatarPose} onValueChange={handlePoseChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePoses.map(pose => (
                        <SelectItem key={pose.value} value={pose.value}>
                          {pose.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Voz
                  </label>
                  <Select 
                    value={sceneConfig.avatarConfig?.voice} 
                    onValueChange={handleVoiceChange}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map(voice => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScenePreview;