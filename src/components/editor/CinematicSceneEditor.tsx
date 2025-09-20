import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, PivotControls, Grid, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { DragDropService, DragDropConfig } from '@/services/dragDropService';
import { AvatarCommunicationSystem, ConversationConfig, DialogueLine } from '@/services/AvatarCommunicationSystem';
import { Avatar3DSystem } from '@/services/Avatar3DSystem';
import { GestureEmotionLibrary } from '@/services/GestureEmotionLibrary';
import { HyperRealisticAvatarSystem } from '@/lib/rendering/HyperRealisticAvatarSystem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Camera, Move, RotateCw, Maximize, Grid3x3, Sun, Cloud, Users,
  Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock, Play, Pause,
  SkipBack, SkipForward, Film, Layers, Settings, Save, Download
} from 'lucide-react';

interface SceneObject {
  id: string;
  type: 'avatar' | 'prop' | 'light' | 'camera' | 'text' | 'effect';
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  locked: boolean;
  data?: any;
}

interface CameraKeyframe {
  time: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

interface SceneConfiguration {
  id: string;
  name: string;
  objects: SceneObject[];
  environment: 'studio' | 'outdoor' | 'office' | 'classroom' | 'stage' | 'custom';
  lighting: 'natural' | 'studio' | 'dramatic' | 'soft' | 'neon';
  cameraKeyframes: CameraKeyframe[];
  duration: number;
  backgroundColor: string;
  fog?: { color: string; near: number; far: number };
  postProcessing?: {
    bloom?: boolean;
    depthOfField?: boolean;
    motionBlur?: boolean;
    colorGrading?: string;
  };
}

export const CinematicSceneEditor: React.FC = () => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sceneConfig, setSceneConfig] = useState<SceneConfiguration>({
    id: `scene_${Date.now()}`,
    name: 'Nova Cena',
    objects: [],
    environment: 'studio',
    lighting: 'natural',
    cameraKeyframes: [],
    duration: 10,
    backgroundColor: '#1a1a2e'
  });

  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showHelpers, setShowHelpers] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const dragDropService = useRef(DragDropService.getInstance());
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const avatarSystemRef = useRef<Avatar3DSystem>();
  const communicationSystemRef = useRef<AvatarCommunicationSystem>();
  const gestureLibraryRef = useRef<GestureEmotionLibrary>();
  const hyperRealisticSystemRef = useRef<HyperRealisticAvatarSystem>();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const objectURLsRef = useRef<Set<string>>(new Set());

  // Configurar drag and drop
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const dropConfig: DragDropConfig = {
      acceptedTypes: ['.glb', '.gltf', '.fbx', '.obj', 'image/*', 'video/*'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
      enableMultipleFiles: true,
      enableDirectoryUpload: false,
      onDrop: handleFileDrop,
      onPreview: handleFilePreview
    };

    dragDropService.current.registerDropZone('scene-editor', dropConfig);

    return () => {
      dragDropService.current.unregisterDropZone('scene-editor');
      // Limpar Object URLs ao desmontar
      objectURLsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectURLsRef.current.clear();
    };
  }, []);

  // Auto-save
  useEffect(() => {
    if (autoSave) {
      const saveTimer = setTimeout(() => {
        saveSceneToLocalStorage();
      }, 2000);
      return () => clearTimeout(saveTimer);
    }
  }, [sceneConfig, autoSave]);

  const handleFileDrop = async (files: File[]) => {
    for (const file of files) {
      const fileType = file.type;
      const fileName = file.name;

      if (fileType.startsWith('image/')) {
        // Adicionar como textura ou plano de imagem
        addImageToScene(file);
      } else if (fileType.startsWith('video/')) {
        // Adicionar como plano de vídeo
        addVideoToScene(file);
      } else if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
        // Adicionar modelo 3D
        add3DModelToScene(file);
      }
    }
  };

  const handleFilePreview = (files: File[]) => {
    // Mostrar preview dos arquivos antes de adicionar
    console.log('Preview files:', files);
  };

  const addAvatarToScene = async () => {
    if (!avatarSystemRef.current) {
      toast.error('Sistema de avatares não inicializado');
      return;
    }

    try {
      // Criar avatar usando o sistema real
      const avatarConfig = {
        id: `avatar_${Date.now()}`,
        name: `Avatar ${sceneConfig.objects.filter(o => o.type === 'avatar').length + 1}`,
        gender: Math.random() > 0.5 ? 'male' : 'female' as 'male' | 'female',
        ethnicity: 'mixed' as const,
        ageRange: 'adult' as const,
        bodyType: 'average' as const,
        height: 1.75,
        customization: {
          face: {
            shape: 'oval' as const,
            skinTone: '#D4A574',
            eyeColor: '#8B4513',
            eyeShape: 'almond' as const,
            eyebrowStyle: 'natural' as const,
            noseShape: 'straight' as const,
            lipShape: 'full' as const,
            lipColor: '#CD5C5C',
            cheekbones: 'prominent' as const,
            jawline: 'sharp' as const,
            wrinkles: 10,
            freckles: 0,
            scars: [],
            tattoos: []
          },
          hair: {
            style: 'short-wavy',
            color: '#2C1810',
            length: 'short' as const,
            texture: 'wavy' as const,
            thickness: 'thick' as const,
            highlights: []
          },
          body: {
            muscleMass: 50,
            bodyFat: 20,
            posture: 'confident' as const,
            skinTexture: 'smooth' as const,
            birthmarks: []
          },
          clothing: {
            outfit: 'business-casual',
            style: 'business' as const,
            colors: ['#2C3E50', '#FFFFFF'],
            accessories: []
          }
        }
      };

      const avatarId = await avatarSystemRef.current.createAvatar(avatarConfig);
      const newAvatar: SceneObject = {
        id: avatarId,
        type: 'avatar',
        name: avatarConfig.name,
        position: [Math.random() * 4 - 2, 0, Math.random() * 4 - 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
        data: {
          avatarConfig,
          animation: 'idle'
        }
      };

      setSceneConfig(prev => ({
        ...prev,
        objects: [...prev.objects, newAvatar]
      }));

      toast.success('Avatar adicionado à cena');
    } catch (error) {
      console.error('Erro ao criar avatar:', error);
      toast.error('Erro ao adicionar avatar');
    }
  };

  const addPropToScene = (propType: string) => {
    const props = {
      'cube': { geometry: 'box', size: [1, 1, 1] },
      'sphere': { geometry: 'sphere', radius: 0.5 },
      'cylinder': { geometry: 'cylinder', radius: 0.5, height: 1 },
      'plane': { geometry: 'plane', size: [2, 2] }
    };

    const propData = props[propType as keyof typeof props] || props.cube;

    const newProp: SceneObject = {
      id: `prop_${Date.now()}`,
      type: 'prop',
      name: `${propType} ${sceneConfig.objects.filter(o => o.type === 'prop').length + 1}`,
      position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      data: propData
    };

    setSceneConfig(prev => ({
      ...prev,
      objects: [...prev.objects, newProp]
    }));
  };

  const addLightToScene = (lightType: 'point' | 'spot' | 'directional') => {
    const newLight: SceneObject = {
      id: `light_${Date.now()}`,
      type: 'light',
      name: `${lightType} Light`,
      position: lightType === 'directional' ? [5, 5, 5] : [0, 3, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      data: {
        lightType,
        color: '#ffffff',
        intensity: 1,
        castShadow: true
      }
    };

    setSceneConfig(prev => ({
      ...prev,
      objects: [...prev.objects, newLight]
    }));
  };

  const addCameraKeyframe = () => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const newKeyframe: CameraKeyframe = {
      time: currentTime,
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [0, 0, 0], // Será atualizado com o alvo real
      fov: camera.fov,
      easing: 'easeInOut'
    };

    setSceneConfig(prev => ({
      ...prev,
      cameraKeyframes: [...prev.cameraKeyframes, newKeyframe].sort((a, b) => a.time - b.time)
    }));

    toast.success(`Keyframe adicionado em ${currentTime}s`);
  };

  const startDemoConversation = async () => {
    if (!communicationSystemRef.current) {
      toast.error('Sistema de comunicação não inicializado');
      return;
    }

    // Verificar se há pelo menos 2 avatares na cena
    const avatars = sceneConfig.objects.filter(o => o.type === 'avatar');
    if (avatars.length < 2) {
      toast.error('Adicione pelo menos 2 avatares para iniciar uma conversa');
      return;
    }

    try {
      // Criar conversa de demonstração
      const conversationConfig: ConversationConfig = {
        id: `demo_conv_${Date.now()}`,
        name: 'Conversa de Demonstração',
        avatars: avatars.slice(0, 2).map(a => a.id),
        dialogues: [
          {
            id: 'd1',
            avatarId: avatars[0].id,
            text: 'Olá! Como você está hoje?',
            emotion: 'happy',
            gesture: 'br_aceno',
            interactionType: 'greeting'
          } as DialogueLine,
          {
            id: 'd2',
            avatarId: avatars[1].id,
            text: 'Oi! Estou muito bem, obrigado por perguntar!',
            emotion: 'happy',
            gesture: 'br_joia',
            interactionType: 'response',
            responseToId: 'd1'
          } as DialogueLine,
          {
            id: 'd3',
            avatarId: avatars[0].id,
            text: 'Que bom! Vamos conversar sobre nosso projeto?',
            emotion: 'excited',
            gesture: 'br_tudo_certo',
            interactionType: 'question'
          } as DialogueLine,
          {
            id: 'd4',
            avatarId: avatars[1].id,
            text: 'Claro! Tenho algumas ideias interessantes para compartilhar.',
            emotion: 'excited',
            gesture: 'br_vai_dar_certo',
            interactionType: 'response',
            responseToId: 'd3'
          } as DialogueLine
        ]
      };

      const conversationId = await communicationSystemRef.current.createConversation(conversationConfig);
      setActiveConversationId(conversationId);
      
      // Iniciar reprodução da conversa
      await communicationSystemRef.current.playConversation(conversationId);
      
      toast.success('Conversa iniciada com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Erro ao iniciar conversa de demonstração');
    }
  };

  const stopConversation = () => {
    if (communicationSystemRef.current && activeConversationId) {
      communicationSystemRef.current.stopConversation();
      setActiveConversationId(null);
      toast.info('Conversa interrompida');
    }
  };

  const deleteObject = (objectId: string) => {
    setSceneConfig(prev => ({
      ...prev,
      objects: prev.objects.filter(o => o.id !== objectId)
    }));
    setSelectedObject(null);
  };

  const duplicateObject = (objectId: string) => {
    const object = sceneConfig.objects.find(o => o.id === objectId);
    if (!object) return;

    const newObject: SceneObject = {
      ...object,
      id: `${object.type}_${Date.now()}`,
      name: `${object.name} (Cópia)`,
      position: [
        object.position[0] + 1,
        object.position[1],
        object.position[2] + 1
      ]
    };

    setSceneConfig(prev => ({
      ...prev,
      objects: [...prev.objects, newObject]
    }));
  };

  const toggleObjectVisibility = (objectId: string) => {
    setSceneConfig(prev => ({
      ...prev,
      objects: prev.objects.map(o =>
        o.id === objectId ? { ...o, visible: !o.visible } : o
      )
    }));
  };

  const toggleObjectLock = (objectId: string) => {
    setSceneConfig(prev => ({
      ...prev,
      objects: prev.objects.map(o =>
        o.id === objectId ? { ...o, locked: !o.locked } : o
      )
    }));
  };

  const updateObjectTransform = (objectId: string, transform: Partial<SceneObject>) => {
    setSceneConfig(prev => ({
      ...prev,
      objects: prev.objects.map(o =>
        o.id === objectId ? { ...o, ...transform } : o
      )
    }));
  };

  const saveSceneToLocalStorage = () => {
    localStorage.setItem('cinematicScene', JSON.stringify(sceneConfig));
    console.log('Cena salva automaticamente');
  };

  const exportScene = () => {
    const dataStr = JSON.stringify(sceneConfig, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${sceneConfig.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Cena exportada com sucesso');
  };

  const addImageToScene = async (file: File) => {
    const url = URL.createObjectURL(file);
    objectURLsRef.current.add(url); // Rastrear URL para limpeza
    
    const newImage: SceneObject = {
      id: `image_${Date.now()}`,
      type: 'prop',
      name: file.name,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [2, 2, 1],
      visible: true,
      locked: false,
      data: {
        geometry: 'plane',
        texture: url,
        transparent: true
      }
    };

    setSceneConfig(prev => ({
      ...prev,
      objects: [...prev.objects, newImage]
    }));
  };

  const addVideoToScene = async (file: File) => {
    const url = URL.createObjectURL(file);
    objectURLsRef.current.add(url); // Rastrear URL para limpeza
    
    const newVideo: SceneObject = {
      id: `video_${Date.now()}`,
      type: 'prop',
      name: file.name,
      position: [0, 1, -3],
      rotation: [0, 0, 0],
      scale: [4, 2.25, 1],
      visible: true,
      locked: false,
      data: {
        geometry: 'plane',
        video: url,
        autoplay: true,
        loop: true
      }
    };

    setSceneConfig(prev => ({
      ...prev,
      objects: [...prev.objects, newVideo]
    }));
  };

  const add3DModelToScene = async (file: File) => {
    const url = URL.createObjectURL(file);
    objectURLsRef.current.add(url); // Rastrear URL para limpeza
    
    const newModel: SceneObject = {
      id: `model_${Date.now()}`,
      type: 'prop',
      name: file.name,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      data: {
        modelUrl: url
      }
    };

    setSceneConfig(prev => ({
      ...prev,
      objects: [...prev.objects, newModel]
    }));
  };

  const SceneObject3D: React.FC<{ object: SceneObject }> = ({ object }) => {
    const meshRef = useRef<THREE.Mesh>();

    useFrame(() => {
      if (meshRef.current && object.type === 'avatar' && object.data?.animation === 'idle') {
        meshRef.current.rotation.y += 0.001;
      }
    });

    if (!object.visible) return null;

    const renderObjectByType = () => {
      switch (object.type) {
        case 'avatar':
          return (
            <mesh
              ref={meshRef}
              position={object.position}
              rotation={object.rotation}
              scale={object.scale}
            >
              <capsuleGeometry args={[0.35, 1.2, 8, 16]} />
              <meshStandardMaterial color="#4A90E2" />
              {/* Cabeça */}
              <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.18, 32, 32]} />
                <meshStandardMaterial color="#FFB896" />
              </mesh>
            </mesh>
          );

        case 'prop':
          const { geometry, ...props } = object.data || {};
          
          const getGeometry = () => {
            switch (geometry) {
              case 'box':
                return <boxGeometry args={props.size || [1, 1, 1]} />;
              case 'sphere':
                return <sphereGeometry args={[props.radius || 0.5, 32, 32]} />;
              case 'cylinder':
                return <cylinderGeometry args={[props.radius || 0.5, props.radius || 0.5, props.height || 1, 32]} />;
              case 'plane':
                return <planeGeometry args={props.size || [2, 2]} />;
              default:
                return <boxGeometry args={[1, 1, 1]} />;
            }
          };

          return (
            <mesh
              position={object.position}
              rotation={object.rotation}
              scale={object.scale}
              castShadow
              receiveShadow
            >
              {getGeometry()}
              <meshStandardMaterial 
                color={props.color || '#808080'}
                map={props.texture ? null : undefined}
                transparent={props.transparent}
              />
            </mesh>
          );

        case 'light':
          const lightProps = object.data || {};
          
          switch (lightProps.lightType) {
            case 'point':
              return (
                <pointLight
                  position={object.position}
                  intensity={lightProps.intensity}
                  color={lightProps.color}
                  castShadow={lightProps.castShadow}
                />
              );
            case 'spot':
              return (
                <spotLight
                  position={object.position}
                  intensity={lightProps.intensity}
                  color={lightProps.color}
                  castShadow={lightProps.castShadow}
                  angle={Math.PI / 4}
                />
              );
            case 'directional':
              return (
                <directionalLight
                  position={object.position}
                  intensity={lightProps.intensity}
                  color={lightProps.color}
                  castShadow={lightProps.castShadow}
                />
              );
            default:
              return null;
          }

        default:
          return null;
      }
    };

    return (
      <group>
        {renderObjectByType()}
        {selectedObject === object.id && !object.locked && (
          <TransformControls
            mode={transformMode}
            object={meshRef.current}
            onObjectChange={() => {
              if (meshRef.current) {
                updateObjectTransform(object.id, {
                  position: [
                    meshRef.current.position.x,
                    meshRef.current.position.y,
                    meshRef.current.position.z
                  ],
                  rotation: [
                    meshRef.current.rotation.x,
                    meshRef.current.rotation.y,
                    meshRef.current.rotation.z
                  ],
                  scale: [
                    meshRef.current.scale.x,
                    meshRef.current.scale.y,
                    meshRef.current.scale.z
                  ]
                });
              }
            }}
          />
        )}
      </group>
    );
  };

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Sidebar Esquerda - Biblioteca de Objetos */}
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <h3 className="text-white font-bold mb-4">Biblioteca de Objetos</h3>
        
        <div className="space-y-4">
          {/* Avatares */}
          <Card className="bg-gray-700 p-3">
            <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <Users size={16} />
              Avatares
            </h4>
            <Button
              onClick={addAvatarToScene}
              size="sm"
              className="w-full"
              variant="secondary"
            >
              <Plus size={16} className="mr-2" />
              Adicionar Avatar
            </Button>
          </Card>

          {/* Props */}
          <Card className="bg-gray-700 p-3">
            <h4 className="text-white text-sm font-semibold mb-2">Props Básicos</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => addPropToScene('cube')}>
                Cubo
              </Button>
              <Button size="sm" variant="secondary" onClick={() => addPropToScene('sphere')}>
                Esfera
              </Button>
              <Button size="sm" variant="secondary" onClick={() => addPropToScene('cylinder')}>
                Cilindro
              </Button>
              <Button size="sm" variant="secondary" onClick={() => addPropToScene('plane')}>
                Plano
              </Button>
            </div>
          </Card>

          {/* Luzes */}
          <Card className="bg-gray-700 p-3">
            <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <Sun size={16} />
              Iluminação
            </h4>
            <div className="space-y-2">
              <Button size="sm" variant="secondary" className="w-full" onClick={() => addLightToScene('point')}>
                Luz Pontual
              </Button>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => addLightToScene('spot')}>
                Spot
              </Button>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => addLightToScene('directional')}>
                Direcional
              </Button>
            </div>
          </Card>

          {/* Ambientes */}
          <Card className="bg-gray-700 p-3">
            <h4 className="text-white text-sm font-semibold mb-2">Ambiente</h4>
            <Select
              value={sceneConfig.environment}
              onValueChange={(value: any) => 
                setSceneConfig(prev => ({ ...prev, environment: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Estúdio</SelectItem>
                <SelectItem value="outdoor">Externo</SelectItem>
                <SelectItem value="office">Escritório</SelectItem>
                <SelectItem value="classroom">Sala de Aula</SelectItem>
                <SelectItem value="stage">Palco</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </div>
      </div>

      {/* Área Principal - Canvas 3D */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative" 
        {...dragDropService.current.createDragHandlers('scene-editor')}
      >
        <Canvas
          shadows
          camera={{ position: [5, 5, 5], fov: 50 }}
          onCreated={({ scene, camera, gl }) => {
            sceneRef.current = scene;
            cameraRef.current = camera as THREE.PerspectiveCamera;
            rendererRef.current = gl;
            
            // Inicializar sistemas
            try {
              const canvas = gl.domElement;
              avatarSystemRef.current = new Avatar3DSystem(canvas);
              avatarSystemRef.current.initialize();
              
              communicationSystemRef.current = AvatarCommunicationSystem.getInstance(
                scene,
                camera,
                gl,
                avatarSystemRef.current
              );
              
              gestureLibraryRef.current = GestureEmotionLibrary.getInstance();
              
              hyperRealisticSystemRef.current = HyperRealisticAvatarSystem.getInstance(
                scene,
                gl,
                camera
              );
              
              console.log('Sistemas 3D inicializados com sucesso');
            } catch (error) {
              console.error('Erro ao inicializar sistemas:', error);
              toast.error('Erro ao inicializar sistemas 3D');
            }
          }}
        >
          {/* Iluminação */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.6} castShadow />
          
          {/* Grid */}
          {showGrid && (
            <Grid
              args={[20, 20]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#6e6e6e"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#9d9d9d"
              fadeDistance={30}
              fadeStrength={1}
            />
          )}
          
          {/* Ambiente */}
          {sceneConfig.environment !== 'custom' && (
            <Environment preset={sceneConfig.environment as any} />
          )}
          
          {/* Objetos da Cena */}
          {sceneConfig.objects.map(object => (
            <SceneObject3D key={object.id} object={object} />
          ))}
          
          {/* Controles */}
          <OrbitControls makeDefault />
        </Canvas>

        {/* Toolbar Superior */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={transformMode === 'translate' ? 'default' : 'secondary'}
              onClick={() => setTransformMode('translate')}
            >
              <Move size={16} />
            </Button>
            <Button
              size="sm"
              variant={transformMode === 'rotate' ? 'default' : 'secondary'}
              onClick={() => setTransformMode('rotate')}
            >
              <RotateCw size={16} />
            </Button>
            <Button
              size="sm"
              variant={transformMode === 'scale' ? 'default' : 'secondary'}
              onClick={() => setTransformMode('scale')}
            >
              <Maximize size={16} />
            </Button>
            <Button
              size="sm"
              variant={showGrid ? 'default' : 'secondary'}
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3x3 size={16} />
            </Button>
          </div>

          <div className="flex gap-2">
            {!activeConversationId ? (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={startDemoConversation}
                disabled={sceneConfig.objects.filter(o => o.type === 'avatar').length < 2}
              >
                <Users size={16} className="mr-2" />
                Demo Conversa
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={stopConversation}
              >
                <Pause size={16} className="mr-2" />
                Parar Conversa
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={addCameraKeyframe}>
              <Camera size={16} className="mr-2" />
              Add Keyframe
            </Button>
            <Button size="sm" variant="secondary" onClick={saveSceneToLocalStorage}>
              <Save size={16} className="mr-2" />
              Salvar
            </Button>
            <Button size="sm" variant="secondary" onClick={exportScene}>
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Timeline Inferior */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 p-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">
                <SkipBack size={16} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button size="sm" variant="secondary">
                <SkipForward size={16} />
              </Button>
            </div>

            <div className="flex-1">
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => setCurrentTime(value)}
                max={sceneConfig.duration}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{currentTime.toFixed(1)}s</span>
                <span>{sceneConfig.duration}s</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="auto-save" className="text-white text-sm">
                Auto-save
              </Label>
              <Switch
                id="auto-save"
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Direita - Propriedades */}
      <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
        <Tabs defaultValue="scene" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scene">Cena</TabsTrigger>
            <TabsTrigger value="objects">Objetos</TabsTrigger>
            <TabsTrigger value="camera">Câmera</TabsTrigger>
          </TabsList>

          <TabsContent value="scene" className="space-y-4">
            <Card className="bg-gray-700 p-3">
              <Label className="text-white">Nome da Cena</Label>
              <input
                type="text"
                value={sceneConfig.name}
                onChange={(e) => setSceneConfig(prev => ({ ...prev, name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-gray-600 text-white rounded"
              />
            </Card>

            <Card className="bg-gray-700 p-3">
              <Label className="text-white">Duração (segundos)</Label>
              <Slider
                value={[sceneConfig.duration]}
                onValueChange={([value]) => setSceneConfig(prev => ({ ...prev, duration: value }))}
                min={1}
                max={60}
                step={1}
                className="mt-2"
              />
            </Card>

            <Card className="bg-gray-700 p-3">
              <Label className="text-white">Iluminação</Label>
              <Select
                value={sceneConfig.lighting}
                onValueChange={(value: any) => 
                  setSceneConfig(prev => ({ ...prev, lighting: value }))
                }
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="studio">Estúdio</SelectItem>
                  <SelectItem value="dramatic">Dramática</SelectItem>
                  <SelectItem value="soft">Suave</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                </SelectContent>
              </Select>
            </Card>
          </TabsContent>

          <TabsContent value="objects" className="space-y-2">
            {sceneConfig.objects.map(object => (
              <Card key={object.id} className={`bg-gray-700 p-2 ${selectedObject === object.id ? 'ring-2 ring-blue-500' : ''}`}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedObject(object.id)}
                >
                  <span className="text-white text-sm flex items-center gap-2">
                    {object.type === 'avatar' && <Users size={14} />}
                    {object.type === 'light' && <Sun size={14} />}
                    {object.type === 'prop' && <Layers size={14} />}
                    {object.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleObjectVisibility(object.id);
                      }}
                    >
                      {object.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleObjectLock(object.id);
                      }}
                    >
                      {object.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateObject(object.id);
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteObject(object.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <Card className="bg-gray-700 p-3">
              <h4 className="text-white text-sm font-semibold mb-2">Keyframes de Câmera</h4>
              {sceneConfig.cameraKeyframes.map((keyframe, index) => (
                <div key={index} className="text-white text-xs mb-1">
                  {keyframe.time}s - Posição: [{keyframe.position.map(p => p.toFixed(1)).join(', ')}]
                </div>
              ))}
              {sceneConfig.cameraKeyframes.length === 0 && (
                <p className="text-gray-400 text-xs">Nenhum keyframe adicionado</p>
              )}
            </Card>

            <Card className="bg-gray-700 p-3">
              <Label className="text-white">Field of View</Label>
              <Slider
                value={[cameraRef.current?.fov || 50]}
                onValueChange={([value]) => {
                  if (cameraRef.current) {
                    cameraRef.current.fov = value;
                    cameraRef.current.updateProjectionMatrix();
                  }
                }}
                min={20}
                max={120}
                step={1}
                className="mt-2"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CinematicSceneEditor;