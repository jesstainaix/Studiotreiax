import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  FileText, Plus, Trash2, Copy, Save, Download, Upload,
  User, MessageSquare, Heart, Smile, Frown, Angry,
  Zap, Brain, Wand2, Clock, PlayCircle, PauseCircle,
  ChevronRight, ChevronDown, Settings, Sparkles, Volume2
} from 'lucide-react';
import { DialogueLine } from '@/services/AvatarCommunicationSystem';
import GestureEmotionLibrary from '@/services/GestureEmotionLibrary';

interface ScriptNode {
  id: string;
  type: 'dialogue' | 'action' | 'narration' | 'choice' | 'condition';
  character?: string;
  text: string;
  emotion?: string;
  gesture?: string;
  duration?: number;
  children?: ScriptNode[];
  conditions?: ScriptCondition[];
  metadata?: {
    notes?: string;
    tags?: string[];
    voiceSettings?: any;
  };
}

interface ScriptCondition {
  variable: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

interface Character {
  id: string;
  name: string;
  avatarId?: string;
  voice: string;
  personality: string;
  defaultEmotion: string;
  color: string;
}

interface ScriptProject {
  id: string;
  name: string;
  description: string;
  characters: Character[];
  scenes: ScriptScene[];
  variables: Map<string, any>;
  metadata: {
    genre: string;
    mood: string;
    targetAudience: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface ScriptScene {
  id: string;
  name: string;
  location: string;
  time: string;
  nodes: ScriptNode[];
  backgroundMusic?: string;
  ambientSound?: string;
}

interface AISuggestion {
  type: 'dialogue' | 'emotion' | 'gesture' | 'scene';
  content: string;
  confidence: number;
  reasoning: string;
}

export const SmartScriptEditor: React.FC = () => {
  const [project, setProject] = useState<ScriptProject>({
    id: `script_${Date.now()}`,
    name: 'Novo Roteiro',
    description: '',
    characters: [],
    scenes: [],
    variables: new Map(),
    metadata: {
      genre: 'drama',
      mood: 'neutral',
      targetAudience: 'general',
      language: 'pt-BR',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const gestureLibrary = useRef(GestureEmotionLibrary.getInstance());
  const [availableGestures, setAvailableGestures] = useState<any[]>([]);
  const [availableEmotions, setAvailableEmotions] = useState<any[]>([]);

  useEffect(() => {
    // Carregar gestos e emoções disponíveis
    setAvailableGestures(gestureLibrary.current.getAllGestures());
    setAvailableEmotions(gestureLibrary.current.getAllEmotions());
  }, []);

  // Adicionar novo personagem
  const addCharacter = () => {
    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: `Personagem ${project.characters.length + 1}`,
      voice: 'br-male-adult-1',
      personality: 'neutro',
      defaultEmotion: 'neutral',
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };

    setProject(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter]
    }));
  };

  // Adicionar nova cena
  const addScene = () => {
    const newScene: ScriptScene = {
      id: `scene_${Date.now()}`,
      name: `Cena ${project.scenes.length + 1}`,
      location: 'Interior - Escritório',
      time: 'Dia',
      nodes: []
    };

    setProject(prev => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));

    setSelectedScene(newScene.id);
  };

  // Adicionar nó ao script
  const addScriptNode = (type: ScriptNode['type']) => {
    if (!selectedScene) {
      toast.error('Selecione uma cena primeiro');
      return;
    }

    const newNode: ScriptNode = {
      id: `node_${Date.now()}`,
      type,
      text: '',
      emotion: 'neutral',
      metadata: {
        tags: []
      }
    };

    if (type === 'dialogue' && project.characters.length > 0) {
      newNode.character = project.characters[0].id;
    }

    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene => 
        scene.id === selectedScene
          ? { ...scene, nodes: [...scene.nodes, newNode] }
          : scene
      )
    }));

    setSelectedNode(newNode.id);
  };

  // Gerar sugestões com IA
  const generateAISuggestions = async () => {
    if (!selectedNode) return;
    
    setIsGeneratingAI(true);
    
    // Simular geração de sugestões com IA
    setTimeout(() => {
      const scene = project.scenes.find(s => s.id === selectedScene);
      const node = scene?.nodes.find(n => n.id === selectedNode);
      
      if (node && node.type === 'dialogue') {
        const suggestions: AISuggestion[] = [
          {
            type: 'emotion',
            content: detectEmotionFromText(node.text),
            confidence: 0.85,
            reasoning: 'Baseado no conteúdo emocional do texto'
          },
          {
            type: 'gesture',
            content: suggestGestureForContext(node.text),
            confidence: 0.75,
            reasoning: 'Gesto apropriado para o contexto da fala'
          },
          {
            type: 'dialogue',
            content: generateNextDialogue(node.text, node.character),
            confidence: 0.70,
            reasoning: 'Continuação natural da conversa'
          }
        ];
        
        setAiSuggestions(suggestions);
      }
      
      setIsGeneratingAI(false);
    }, 1500);
  };

  // Detectar emoção do texto
  const detectEmotionFromText = (text: string): string => {
    const emotions = {
      happy: ['feliz', 'alegre', 'contente', 'ótimo', 'maravilhoso'],
      sad: ['triste', 'infeliz', 'melancólico', 'deprimido'],
      angry: ['irritado', 'furioso', 'bravo', 'nervoso'],
      excited: ['empolgado', 'animado', 'entusiasmado'],
      confused: ['confuso', 'perdido', 'não entendo']
    };

    const lowerText = text.toLowerCase();
    
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return emotion;
      }
    }
    
    return 'neutral';
  };

  // Sugerir gesto para contexto
  const suggestGestureForContext = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('olá') || lowerText.includes('oi')) {
      return 'br_aceno';
    }
    if (lowerText.includes('obrigado') || lowerText.includes('valeu')) {
      return 'br_joia';
    }
    if (lowerText.includes('não') || lowerText.includes('discordo')) {
      return 'br_nao_nao';
    }
    if (lowerText.includes('tudo bem') || lowerText.includes('ok')) {
      return 'br_tudo_certo';
    }
    
    return 'thinking';
  };

  // Gerar próximo diálogo
  const generateNextDialogue = (previousText: string, characterId?: string): string => {
    const responses = [
      'Interessante, me conte mais sobre isso.',
      'Entendo seu ponto de vista.',
      'Vamos pensar em uma solução juntos.',
      'Isso faz sentido para mim.',
      'Precisamos considerar todas as opções.'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Aplicar sugestão de IA
  const applySuggestion = (suggestion: AISuggestion) => {
    if (!selectedNode || !selectedScene) return;
    
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene => 
        scene.id === selectedScene
          ? {
              ...scene,
              nodes: scene.nodes.map(node => 
                node.id === selectedNode
                  ? {
                      ...node,
                      [suggestion.type === 'dialogue' ? 'text' : suggestion.type]: suggestion.content
                    }
                  : node
              )
            }
          : scene
      )
    }));
    
    toast.success(`Sugestão aplicada: ${suggestion.type}`);
  };

  // Converter para formato de conversa
  const convertToConversation = (): DialogueLine[] => {
    const dialogues: DialogueLine[] = [];
    const currentScene = project.scenes.find(s => s.id === selectedScene);
    
    if (!currentScene) return dialogues;
    
    currentScene.nodes.forEach((node, index) => {
      if (node.type === 'dialogue' && node.character) {
        const character = project.characters.find(c => c.id === node.character);
        
        dialogues.push({
          id: node.id,
          avatarId: character?.avatarId || node.character,
          text: node.text,
          emotion: (node.emotion || 'neutral') as any,
          gesture: node.gesture,
          duration: node.duration,
          interactionType: index === 0 ? 'greeting' : 'statement'
        });
      }
    });
    
    return dialogues;
  };

  // Exportar script
  const exportScript = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${project.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Roteiro exportado com sucesso');
  };

  // Importar script
  const importScript = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setProject(imported);
        toast.success('Roteiro importado com sucesso');
      } catch (error) {
        toast.error('Erro ao importar roteiro');
      }
    };
    reader.readAsText(file);
  };

  // Renderizar nó do script
  const renderScriptNode = (node: ScriptNode, index: number) => {
    const character = project.characters.find(c => c.id === node.character);
    const isSelected = selectedNode === node.id;
    
    return (
      <Card
        key={node.id}
        className={`p-4 mb-3 cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 bg-gray-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => setSelectedNode(node.id)}
      >
        <div className="flex items-start gap-3">
          {/* Indicador de tipo */}
          <div className="mt-1">
            {node.type === 'dialogue' && <MessageSquare size={20} color={character?.color} />}
            {node.type === 'action' && <Zap size={20} className="text-purple-500" />}
            {node.type === 'narration' && <FileText size={20} className="text-gray-500" />}
            {node.type === 'choice' && <ChevronRight size={20} className="text-green-500" />}
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1">
            {node.type === 'dialogue' && character && (
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold" style={{ color: character.color }}>
                  {character.name}
                </span>
                {node.emotion && (
                  <Badge variant="secondary" className="text-xs">
                    {node.emotion}
                  </Badge>
                )}
                {node.gesture && (
                  <Badge variant="outline" className="text-xs">
                    {node.gesture}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="text-sm text-gray-700">
              {isSelected ? (
                <Textarea
                  value={node.text}
                  onChange={(e) => {
                    setProject(prev => ({
                      ...prev,
                      scenes: prev.scenes.map(scene => 
                        scene.id === selectedScene
                          ? {
                              ...scene,
                              nodes: scene.nodes.map(n => 
                                n.id === node.id
                                  ? { ...n, text: e.target.value }
                                  : n
                              )
                            }
                          : scene
                      )
                    }));
                  }}
                  className="w-full min-h-[60px]"
                  placeholder="Digite o texto aqui..."
                />
              ) : (
                <p>{node.text || <span className="text-gray-400">Clique para editar...</span>}</p>
              )}
            </div>
            
            {/* Tags */}
            {node.metadata?.tags && node.metadata.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {node.metadata.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Ações */}
          {isSelected && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Duplicar nó
                  const newNode = { ...node, id: `node_${Date.now()}` };
                  setProject(prev => ({
                    ...prev,
                    scenes: prev.scenes.map(scene => 
                      scene.id === selectedScene
                        ? {
                            ...scene,
                            nodes: [
                              ...scene.nodes.slice(0, index + 1),
                              newNode,
                              ...scene.nodes.slice(index + 1)
                            ]
                          }
                        : scene
                    )
                  }));
                }}
              >
                <Copy size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Remover nó
                  setProject(prev => ({
                    ...prev,
                    scenes: prev.scenes.map(scene => 
                      scene.id === selectedScene
                        ? {
                            ...scene,
                            nodes: scene.nodes.filter(n => n.id !== node.id)
                          }
                        : scene
                    )
                  }));
                  setSelectedNode(null);
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const currentScene = project.scenes.find(s => s.id === selectedScene);
  const currentNode = currentScene?.nodes.find(n => n.id === selectedNode);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar Esquerda - Personagens */}
      <div className="w-64 bg-white border-r p-4 overflow-y-auto">
        <div className="mb-4">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <User size={18} />
            Personagens
          </h3>
          <Button
            size="sm"
            className="w-full"
            onClick={addCharacter}
          >
            <Plus size={16} className="mr-2" />
            Adicionar Personagem
          </Button>
        </div>
        
        <div className="space-y-2">
          {project.characters.map(character => (
            <Card key={character.id} className="p-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: character.color }}
                />
                <Input
                  value={character.name}
                  onChange={(e) => {
                    setProject(prev => ({
                      ...prev,
                      characters: prev.characters.map(c =>
                        c.id === character.id
                          ? { ...c, name: e.target.value }
                          : c
                      )
                    }));
                  }}
                  className="flex-1 h-8"
                />
              </div>
              <div className="mt-2 space-y-1">
                <Select
                  value={character.voice}
                  onValueChange={(value) => {
                    setProject(prev => ({
                      ...prev,
                      characters: prev.characters.map(c =>
                        c.id === character.id
                          ? { ...c, voice: value }
                          : c
                      )
                    }));
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="br-male-adult-1">Masculina Adulta</SelectItem>
                    <SelectItem value="br-female-adult-1">Feminina Adulta</SelectItem>
                    <SelectItem value="br-male-young-1">Masculina Jovem</SelectItem>
                    <SelectItem value="br-female-elderly-1">Feminina Idosa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        {/* Cenas */}
        <div>
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <FileText size={18} />
            Cenas
          </h3>
          <Button
            size="sm"
            className="w-full mb-2"
            onClick={addScene}
          >
            <Plus size={16} className="mr-2" />
            Nova Cena
          </Button>
          
          <div className="space-y-1">
            {project.scenes.map(scene => (
              <Button
                key={scene.id}
                variant={selectedScene === scene.id ? 'default' : 'ghost'}
                className="w-full justify-start h-8"
                onClick={() => setSelectedScene(scene.id)}
              >
                {scene.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Área Principal - Editor de Script */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Input
                value={project.name}
                onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                className="font-bold text-lg w-64"
                placeholder="Nome do Roteiro"
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addScriptNode('dialogue')}
                  disabled={!selectedScene}
                >
                  <MessageSquare size={16} className="mr-2" />
                  Diálogo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addScriptNode('action')}
                  disabled={!selectedScene}
                >
                  <Zap size={16} className="mr-2" />
                  Ação
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addScriptNode('narration')}
                  disabled={!selectedScene}
                >
                  <FileText size={16} className="mr-2" />
                  Narração
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateAISuggestions}
                disabled={!selectedNode || isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <>
                    <Brain size={16} className="mr-2 animate-pulse" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    Sugestões IA
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
              </Button>
              
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={importScript}
                  className="hidden"
                />
                <Button size="sm" variant="outline" as="span">
                  <Upload size={16} className="mr-2" />
                  Importar
                </Button>
              </label>
              
              <Button size="sm" variant="outline" onClick={exportScript}>
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex">
          {/* Editor de Script */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentScene ? (
              <>
                {/* Informações da Cena */}
                <Card className="mb-4 p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Nome da Cena</Label>
                      <Input
                        value={currentScene.name}
                        onChange={(e) => {
                          setProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(s =>
                              s.id === currentScene.id
                                ? { ...s, name: e.target.value }
                                : s
                            )
                          }));
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Localização</Label>
                      <Input
                        value={currentScene.location}
                        onChange={(e) => {
                          setProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(s =>
                              s.id === currentScene.id
                                ? { ...s, location: e.target.value }
                                : s
                            )
                          }));
                        }}
                        className="mt-1"
                        placeholder="Ex: Interior - Escritório"
                      />
                    </div>
                    <div className="w-32">
                      <Label>Tempo</Label>
                      <Select
                        value={currentScene.time}
                        onValueChange={(value) => {
                          setProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(s =>
                              s.id === currentScene.id
                                ? { ...s, time: value }
                                : s
                            )
                          }));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dia">Dia</SelectItem>
                          <SelectItem value="Noite">Noite</SelectItem>
                          <SelectItem value="Amanhecer">Amanhecer</SelectItem>
                          <SelectItem value="Entardecer">Entardecer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Nós do Script */}
                <div>
                  {currentScene.nodes.map((node, index) => 
                    renderScriptNode(node, index)
                  )}
                  
                  {currentScene.nodes.length === 0 && (
                    <Card className="p-8 text-center text-gray-400">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Nenhum conteúdo nesta cena ainda.</p>
                      <p className="text-sm mt-2">Use os botões acima para adicionar diálogos, ações ou narrações.</p>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <Card className="p-8 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Selecione ou crie uma cena para começar</p>
              </Card>
            )}
          </div>

          {/* Sidebar Direita - Propriedades e Sugestões */}
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="properties">Propriedades</TabsTrigger>
                <TabsTrigger value="ai">IA</TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="space-y-4">
                {currentNode && (
                  <>
                    {/* Emoção */}
                    {currentNode.type === 'dialogue' && (
                      <div>
                        <Label>Emoção</Label>
                        <Select
                          value={currentNode.emotion || 'neutral'}
                          onValueChange={(value) => {
                            setProject(prev => ({
                              ...prev,
                              scenes: prev.scenes.map(scene => 
                                scene.id === selectedScene
                                  ? {
                                      ...scene,
                                      nodes: scene.nodes.map(n => 
                                        n.id === currentNode.id
                                          ? { ...n, emotion: value }
                                          : n
                                      )
                                    }
                                  : scene
                              )
                            }));
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="neutral">Neutro</SelectItem>
                            <SelectItem value="happy">Feliz</SelectItem>
                            <SelectItem value="sad">Triste</SelectItem>
                            <SelectItem value="angry">Irritado</SelectItem>
                            <SelectItem value="surprised">Surpreso</SelectItem>
                            <SelectItem value="confused">Confuso</SelectItem>
                            <SelectItem value="excited">Empolgado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Gesto */}
                    {currentNode.type === 'dialogue' && (
                      <div>
                        <Label>Gesto</Label>
                        <Select
                          value={currentNode.gesture || ''}
                          onValueChange={(value) => {
                            setProject(prev => ({
                              ...prev,
                              scenes: prev.scenes.map(scene => 
                                scene.id === selectedScene
                                  ? {
                                      ...scene,
                                      nodes: scene.nodes.map(n => 
                                        n.id === currentNode.id
                                          ? { ...n, gesture: value }
                                          : n
                                      )
                                    }
                                  : scene
                              )
                            }));
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um gesto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {availableGestures
                              .filter(g => g.culture === 'brazilian')
                              .map(gesture => (
                                <SelectItem key={gesture.id} value={gesture.id}>
                                  {gesture.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Duração */}
                    <div>
                      <Label>Duração (segundos)</Label>
                      <Input
                        type="number"
                        value={currentNode.duration || 3}
                        onChange={(e) => {
                          setProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(scene => 
                              scene.id === selectedScene
                                ? {
                                    ...scene,
                                    nodes: scene.nodes.map(n => 
                                      n.id === currentNode.id
                                        ? { ...n, duration: parseFloat(e.target.value) }
                                        : n
                                    )
                                  }
                                : scene
                            )
                          }));
                        }}
                        min="0.5"
                        max="30"
                        step="0.5"
                        className="mt-1"
                      />
                    </div>

                    {/* Notas */}
                    <div>
                      <Label>Notas</Label>
                      <Textarea
                        value={currentNode.metadata?.notes || ''}
                        onChange={(e) => {
                          setProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(scene => 
                              scene.id === selectedScene
                                ? {
                                    ...scene,
                                    nodes: scene.nodes.map(n => 
                                      n.id === currentNode.id
                                        ? { 
                                            ...n, 
                                            metadata: { 
                                              ...n.metadata, 
                                              notes: e.target.value 
                                            }
                                          }
                                        : n
                                    )
                                  }
                                : scene
                            )
                          }));
                        }}
                        className="mt-1 min-h-[80px]"
                        placeholder="Adicione notas ou direções..."
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                {aiSuggestions.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    {aiSuggestions.map((suggestion, index) => (
                      <Card key={index} className="p-3 mb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {Math.round(suggestion.confidence * 100)}% confiança
                              </span>
                            </div>
                            <p className="text-sm font-medium">{suggestion.content}</p>
                            <p className="text-xs text-gray-500 mt-1">{suggestion.reasoning}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            <Wand2 size={14} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Brain size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Selecione um nó e clique em "Sugestões IA"</p>
                    <p className="text-xs mt-2">A IA irá sugerir emoções, gestos e continuações</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartScriptEditor;