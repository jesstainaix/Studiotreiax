import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar3DViewer } from './Avatar3DViewer';
import { HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { 
  User, 
  Play, 
  Volume2, 
  Settings, 
  Eye,
  Shirt,
  Smile,
  Hand,
  Palette
} from 'lucide-react';

interface AvatarData {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: 'professional' | 'casual' | 'corporate';
  thumbnailUrl: string;
  modelPath?: string;
  description: string;
  clothingOptions?: string[];
  poses?: string[];
  expressions?: string[];
}

interface AvatarSelectionPanelProps {
  selectedScene?: HeyGenScene;
  avatarLibrary: AvatarData[];
  onAvatarSelect: (sceneId: string, avatarId: string) => void;
  onAvatarCustomize?: (avatarId: string, customization: AvatarCustomization) => void;
}

interface AvatarCustomization {
  pose: 'standing' | 'presenting' | 'sitting';
  expression: 'neutral' | 'smiling' | 'serious';
  clothing: string;
  position: 'left' | 'right' | 'center';
  cameraAngle: 'front' | 'side' | 'three_quarter';
}

export const AvatarSelectionPanel: React.FC<AvatarSelectionPanelProps> = ({
  selectedScene,
  avatarLibrary,
  onAvatarSelect,
  onAvatarCustomize
}) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [previewCustomization, setPreviewCustomization] = useState<AvatarCustomization>({
    pose: 'standing',
    expression: 'neutral',
    clothing: 'default',
    position: 'center',
    cameraAngle: 'front'
  });
  const [activeTab, setActiveTab] = useState('library');

  const selectedAvatar = avatarLibrary.find(a => a.id === selectedAvatarId);

  const handleAvatarSelect = (avatarId: string) => {
    if (!selectedScene) return;
    
    setSelectedAvatarId(avatarId);
    onAvatarSelect(selectedScene.id, avatarId);
  };

  const handleCustomizationChange = (key: keyof AvatarCustomization, value: string) => {
    const newCustomization = { ...previewCustomization, [key]: value };
    setPreviewCustomization(newCustomization);
    
    if (selectedAvatarId && onAvatarCustomize) {
      onAvatarCustomize(selectedAvatarId, newCustomization);
    }
  };

  const getAvatarsByCategory = (category: string) => {
    return avatarLibrary.filter(avatar => {
      switch (category) {
        case 'professional':
          return avatar.style === 'professional' || avatar.style === 'corporate';
        case 'casual':
          return avatar.style === 'casual';
        case 'male':
          return avatar.gender === 'male';
        case 'female':
          return avatar.gender === 'female';
        default:
          return true;
      }
    });
  };

  if (!selectedScene) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Avatares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            Selecione uma cena para escolher avatares
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Avatares - {selectedScene.title}
        </CardTitle>
        {selectedScene.avatar && (
          <Badge variant="secondary" className="w-fit">
            {selectedScene.avatar.name}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
            <TabsTrigger value="preview">Preview 3D</TabsTrigger>
            <TabsTrigger value="customize">Personalizar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="flex-1 overflow-auto">
            {/* Avatar Category Filters */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Categorias:</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer">Todos</Badge>
                <Badge variant="outline" className="cursor-pointer">Profissional</Badge>
                <Badge variant="outline" className="cursor-pointer">Casual</Badge>
                <Badge variant="outline" className="cursor-pointer">Masculino</Badge>
                <Badge variant="outline" className="cursor-pointer">Feminino</Badge>
              </div>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-1 gap-3">
              {avatarLibrary.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedScene.avatar?.id === avatar.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAvatarSelect(avatar.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar.thumbnailUrl}
                      alt={avatar.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{avatar.name}</h4>
                      <p className="text-xs text-gray-600 truncate">{avatar.description}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {avatar.style}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {avatar.gender}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1">
            {selectedAvatar ? (
              <div className="h-full">
                <Avatar3DViewer
                  avatarId={selectedAvatar.id}
                  modelPath={selectedAvatar.modelPath}
                  style={selectedAvatar.style}
                  pose={previewCustomization.pose}
                  expression={previewCustomization.expression}
                  className="h-64 mb-4"
                />
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">{selectedAvatar.name}</h4>
                    <p className="text-xs text-gray-600">{selectedAvatar.description}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Play className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Selecione um avatar para visualizar em 3D
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="customize" className="flex-1 overflow-auto">
            {selectedAvatar ? (
              <div className="space-y-4">
                {/* Pose Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hand className="w-4 h-4" />
                    <span className="text-sm font-medium">Pose</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['standing', 'presenting', 'sitting'].map((pose) => (
                      <Button
                        key={pose}
                        size="sm"
                        variant={previewCustomization.pose === pose ? 'default' : 'outline'}
                        onClick={() => handleCustomizationChange('pose', pose)}
                        className="justify-start"
                      >
                        {pose === 'standing' && 'Em pé'}
                        {pose === 'presenting' && 'Apresentando'}
                        {pose === 'sitting' && 'Sentado'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Expression Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Smile className="w-4 h-4" />
                    <span className="text-sm font-medium">Expressão</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['neutral', 'smiling', 'serious'].map((expression) => (
                      <Button
                        key={expression}
                        size="sm"
                        variant={previewCustomization.expression === expression ? 'default' : 'outline'}
                        onClick={() => handleCustomizationChange('expression', expression)}
                        className="justify-start"
                      >
                        {expression === 'neutral' && 'Neutro'}
                        {expression === 'smiling' && 'Sorrindo'}
                        {expression === 'serious' && 'Sério'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Position Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Posição na Tela</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map((position) => (
                      <Button
                        key={position}
                        size="sm"
                        variant={previewCustomization.position === position ? 'default' : 'outline'}
                        onClick={() => handleCustomizationChange('position', position)}
                        className="justify-center"
                      >
                        {position === 'left' && 'Esquerda'}
                        {position === 'center' && 'Centro'}
                        {position === 'right' && 'Direita'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Camera Angle */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4" />
                    <span className="text-sm font-medium">Ângulo da Câmera</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['front', 'three_quarter', 'side'].map((angle) => (
                      <Button
                        key={angle}
                        size="sm"
                        variant={previewCustomization.cameraAngle === angle ? 'default' : 'outline'}
                        onClick={() => handleCustomizationChange('cameraAngle', angle)}
                        className="justify-start"
                      >
                        {angle === 'front' && 'Frontal'}
                        {angle === 'three_quarter' && '3/4'}
                        {angle === 'side' && 'Lateral'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Clothing Options (if available) */}
                {selectedAvatar.clothingOptions && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shirt className="w-4 h-4" />
                      <span className="text-sm font-medium">Vestuário</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedAvatar.clothingOptions.map((clothing) => (
                        <Button
                          key={clothing}
                          size="sm"
                          variant={previewCustomization.clothing === clothing ? 'default' : 'outline'}
                          onClick={() => handleCustomizationChange('clothing', clothing)}
                          className="justify-start"
                        >
                          {clothing}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Selecione um avatar para personalizar
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AvatarSelectionPanel;