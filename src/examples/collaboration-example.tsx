/**
 * Exemplo Completo do Sistema de Colaboração
 * Demonstra funcionalidades em tempo real, comentários e awareness
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Play, 
  Square, 
  MessageCircle, 
  Mouse,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import CollaborationInterface from '../components/ui/CollaborationInterface';
import CollaborationManager, { 
  CollaborationUser, 
  CollaborationSession 
} from '../lib/collaboration/CollaborationManager';

const CollaborationExample: React.FC = () => {
  const [collaborationManager] = useState(() => new CollaborationManager());
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [currentUser, setCurrentUser] = useState<CollaborationUser>({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Demo User',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    role: 'editor',
    isOnline: true
  });

  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState('demo-session-2024');
  const [demoStage, setDemoStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  // Estados para simulação
  const [slideContent, setSlideContent] = useState('Bem-vindos ao sistema de colaboração!');
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<CollaborationUser[]>([currentUser]);
  const [cursorPositions, setCursorPositions] = useState<Map<string, {x: number, y: number}>>(new Map());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setupCollaborationListeners();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      collaborationManager.destroy();
    };
  }, []);

  const setupCollaborationListeners = () => {
    collaborationManager.on('sessionInitialized', (session: CollaborationSession) => {
      setSession(session);
      setIsConnected(true);
      addLog(`✅ Sessão "${session.id}" inicializada com sucesso`);
    });

    collaborationManager.on('userJoined', (user: CollaborationUser) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      addLog(`👤 ${user.name} entrou na sessão`);
    });

    collaborationManager.on('userLeft', (userId: string) => {
      const user = users.find(u => u.id === userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      addLog(`👋 ${user?.name || userId} saiu da sessão`);
    });

    collaborationManager.on('operationReceived', (operation: any) => {
      addLog(`🔄 Operação recebida: ${operation.operation.type} em ${operation.operation.elementId}`);
      
      // Simular atualização do conteúdo
      if (operation.operation.type === 'update' && operation.operation.elementId === 'slide-title') {
        setSlideContent(operation.operation.data.text || slideContent);
      }
    });

    collaborationManager.on('userAwarenessUpdate', ({ user, message }: any) => {
      if (message.type === 'cursor') {
        setCursorPositions(prev => new Map(prev.set(user.id, message.data)));
        addLog(`🖱️ ${user.name} moveu o cursor para (${message.data.x}, ${message.data.y})`);
      }
    });

    collaborationManager.on('conflictDetected', ({ operation, conflicts }: any) => {
      addLog(`⚠️ Conflito detectado! ${conflicts.length} operações conflitantes`);
    });
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const connectToSession = async () => {
    try {
      addLog(`🔌 Conectando à sessão "${sessionId}"...`);
      await collaborationManager.initializeSession(sessionId, currentUser);
    } catch (error) {
      addLog(`❌ Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const simulateUserJoin = async () => {
    const newUser: CollaborationUser = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      name: `Usuário ${Math.floor(Math.random() * 100)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      role: Math.random() > 0.5 ? 'editor' : 'viewer',
      isOnline: true
    };

    try {
      await collaborationManager.joinSession(sessionId, newUser);
    } catch (error) {
      addLog(`❌ Erro ao simular entrada de usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const simulateOperation = async () => {
    if (!isConnected) return;

    const operations = [
      {
        type: 'update' as const,
        elementId: 'slide-title',
        data: { text: `Atualizado às ${new Date().toLocaleTimeString()}` }
      },
      {
        type: 'insert' as const,
        elementId: 'slide-content',
        data: { text: 'Novo conteúdo inserido' },
        position: 0
      },
      {
        type: 'update' as const,
        elementId: 'slide-background',
        data: { color: `#${Math.floor(Math.random()*16777215).toString(16)}` }
      }
    ];

    const randomOperation = operations[Math.floor(Math.random() * operations.length)];
    
    try {
      const result = await collaborationManager.executeOperation(randomOperation);
      if (result.success) {
        addLog(`✅ Operação executada: ${randomOperation.type} em ${randomOperation.elementId}`);
      } else {
        addLog(`❌ Falha na operação: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Erro na operação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const simulateComment = async () => {
    if (!isConnected) return;

    const commentTexts = [
      'Ótimo trabalho neste slide!',
      'Podemos ajustar a cor de fundo?',
      'Acho que falta uma imagem aqui',
      'Excelente apresentação! 👏',
      'Sugestão: adicionar mais detalhes'
    ];

    const randomText = commentTexts[Math.floor(Math.random() * commentTexts.length)];

    try {
      const comment = await collaborationManager.addComment({
        userId: currentUser.id,
        content: randomText,
        status: 'open',
        mentions: []
      });
      
      setComments(prev => [...prev, comment]);
      addLog(`💬 Comentário adicionado: "${randomText}"`);
    } catch (error) {
      addLog(`❌ Erro ao adicionar comentário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const simulateCursorMovement = () => {
    if (!isConnected) return;

    const x = Math.random() * 400;
    const y = Math.random() * 300;
    
    collaborationManager.updateCursor({ x, y, elementId: 'demo-canvas' });
  };

  const runAutomatedDemo = () => {
    if (isRunningDemo) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunningDemo(false);
      addLog('🛑 Demo automatizada interrompida');
      return;
    }

    setIsRunningDemo(true);
    addLog('🚀 Iniciando demo automatizada...');

    intervalRef.current = setInterval(async () => {
      const actions = [
        simulateOperation,
        simulateComment,
        simulateCursorMovement,
        simulateUserJoin
      ];

      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      await randomAction();
    }, 3000);
  };

  const createVersion = async () => {
    if (!isConnected) return;

    try {
      const documentState = {
        title: slideContent,
        slides: [
          { id: 'slide-1', content: slideContent, comments: comments.length }
        ],
        users: users.length
      };

      const version = await collaborationManager.createVersion(
        documentState,
        `Versão criada em ${new Date().toLocaleString()}`
      );

      addLog(`📝 Versão criada: ${version.description}`);
    } catch (error) {
      addLog(`❌ Erro ao criar versão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const updateSlideContent = (newContent: string) => {
    setSlideContent(newContent);
    
    if (isConnected) {
      collaborationManager.executeOperation({
        type: 'update',
        elementId: 'slide-title',
        data: { text: newContent }
      });
    }
  };

  // Renderizar cursores dos usuários no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar cursores
    cursorPositions.forEach((position, userId) => {
      const user = users.find(u => u.id === userId);
      if (!user || userId === currentUser.id) return;

      ctx.fillStyle = user.color;
      ctx.beginPath();
      ctx.moveTo(position.x, position.y);
      ctx.lineTo(position.x + 10, position.y + 10);
      ctx.lineTo(position.x + 5, position.y + 12);
      ctx.lineTo(position.x + 2, position.y + 15);
      ctx.closePath();
      ctx.fill();

      // Nome do usuário
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(user.name, position.x + 15, position.y + 10);
    });
  }, [cursorPositions, users, currentUser.id]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sistema de Colaboração em Tempo Real</h1>
        <p className="text-muted-foreground">
          Demonstração completa com WebRTC, operações síncronas, comentários e awareness
        </p>
      </div>

      {/* Status e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Controles da Demo
          </CardTitle>
          <CardDescription>
            Gerencie a sessão de colaboração e teste funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="ID da Sessão"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="max-w-xs"
            />
            <Button 
              onClick={connectToSession}
              disabled={isConnected}
            >
              {isConnected ? 'Conectado' : 'Conectar'}
            </Button>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {isConnected && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={simulateUserJoin} variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Simular Usuário
              </Button>
              <Button onClick={simulateOperation} variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Operação
              </Button>
              <Button onClick={simulateComment} variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Comentário
              </Button>
              <Button onClick={simulateCursorMovement} variant="outline" size="sm">
                <Mouse className="w-4 h-4 mr-2" />
                Mover Cursor
              </Button>
              <Button onClick={createVersion} variant="outline" size="sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Criar Versão
              </Button>
              <Button 
                onClick={runAutomatedDemo} 
                variant={isRunningDemo ? "destructive" : "default"} 
                size="sm"
              >
                {isRunningDemo ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Parar Demo
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Demo Auto
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Colaborativo Simulado */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editor Colaborativo</CardTitle>
              <CardDescription>
                Simula um editor com awareness em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Título do slide..."
                value={slideContent}
                onChange={(e) => updateSlideContent(e.target.value)}
                onMouseMove={(e) => {
                  if (isConnected) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    collaborationManager.updateCursor({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      elementId: 'slide-title'
                    });
                  }
                }}
              />

              {/* Canvas para visualizar cursores */}
              <div className="relative border rounded-lg p-4" style={{ height: '300px' }}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="absolute inset-4 border rounded bg-gray-50"
                  onMouseMove={(e) => {
                    if (isConnected) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      collaborationManager.updateCursor({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        elementId: 'demo-canvas'
                      });
                    }
                  }}
                />
                <div className="absolute bottom-2 left-2 text-xs text-gray-500">
                  Mova o mouse para ver cursores dos outros usuários
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{users.length} usuários</Badge>
                <Badge variant="outline">{comments.length} comentários</Badge>
                <Badge variant="outline">{cursorPositions.size} cursores ativos</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Logs de Atividade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Log de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 overflow-y-auto space-y-1 text-sm font-mono bg-gray-50 p-3 rounded">
                {logs.length === 0 ? (
                  <p className="text-gray-500">Nenhuma atividade ainda...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-xs">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interface de Colaboração */}
        <div className="space-y-6">
          {isConnected ? (
            <CollaborationInterface
              sessionId={sessionId}
              currentUser={currentUser}
              onSessionChange={(session) => setSession(session)}
              onUserUpdate={(user) => setCurrentUser(user)}
              className="h-[600px]"
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Sistema Desconectado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Conecte-se a uma sessão para usar as funcionalidades de colaboração
                </p>
                <Button onClick={connectToSession}>
                  Conectar Agora
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Métricas da Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Usuários Online:</span>
                <Badge>{users.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Comentários:</span>
                <Badge>{comments.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cursores Ativos:</span>
                <Badge>{cursorPositions.size}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Demo Auto:</span>
                <Badge variant={isRunningDemo ? 'default' : 'secondary'}>
                  {isRunningDemo ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Implementados</CardTitle>
          <CardDescription>
            Funcionalidades completas do sistema de colaboração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="features">Funcionalidades</TabsTrigger>
              <TabsTrigger value="tech">Tecnologias</TabsTrigger>
              <TabsTrigger value="architecture">Arquitetura</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-3">
              <h4 className="font-semibold">Funcionalidades Principais:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✅ Conexões WebRTC peer-to-peer</li>
                <li>✅ Operational Transformation para sincronização</li>
                <li>✅ Sistema de awareness com cursores e seleções</li>
                <li>✅ Comentários com menções e respostas</li>
                <li>✅ Detecção e resolução de conflitos</li>
                <li>✅ Bloqueio de elementos para edição</li>
                <li>✅ Versionamento e controle de histórico</li>
                <li>✅ Compressão de dados para performance</li>
                <li>✅ Rate limiting para operações</li>
                <li>✅ Eventos em tempo real</li>
              </ul>
            </TabsContent>

            <TabsContent value="tech" className="space-y-3">
              <h4 className="font-semibold">Tecnologias Utilizadas:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• WebRTC para comunicação P2P</li>
                <li>• WebSockets para sinalização</li>
                <li>• TypeScript para tipagem segura</li>
                <li>• React para interface responsiva</li>
                <li>• EventEmitter para eventos</li>
                <li>• LZ-string para compressão</li>
                <li>• Vector clocks para ordenação</li>
                <li>• UUID para identificadores únicos</li>
              </ul>
            </TabsContent>

            <TabsContent value="architecture" className="space-y-3">
              <h4 className="font-semibold">Arquitetura do Sistema:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Padrão Observer para eventos</li>
                <li>• Operational Transformation para conflitos</li>
                <li>• Peer-to-peer descentralizado</li>
                <li>• State management reativo</li>
                <li>• Modular e extensível</li>
                <li>• Error handling robusto</li>
                <li>• Performance otimizada</li>
                <li>• Type-safe em TypeScript</li>
              </ul>
            </TabsContent>

            <TabsContent value="performance" className="space-y-3">
              <h4 className="font-semibold">Otimizações de Performance:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Compressão automática de payloads grandes</li>
                <li>• Rate limiting para evitar spam</li>
                <li>• Debouncing para awareness updates</li>
                <li>• Lazy loading de recursos</li>
                <li>• Cleanup automático de recursos</li>
                <li>• Batching de operações</li>
                <li>• Connection pooling</li>
                <li>• Memory management eficiente</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborationExample;