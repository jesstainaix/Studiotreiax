/**
 * Exemplo Completo de Uso da API REST
 * Demonstra todas as funcionalidades com interface React
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Key, 
  FolderOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Server,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Settings
} from 'lucide-react';
import VideoEditorAPIClient, { 
  User as APIUser, 
  Project, 
  Template, 
  APIKey 
} from '../api/VideoEditorAPIClient';

const APIExample: React.FC = () => {
  const [client] = useState(() => new VideoEditorAPIClient('http://localhost:3001'));
  const [user, setUser] = useState<APIUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Estados de UI
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('auth');
  
  // Estados de formulários
  const [authForm, setAuthForm] = useState({
    email: 'demo@example.com',
    password: 'password123',
    name: 'Demo User'
  });
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    isPublic: false,
    tags: ''
  });
  const [apiKeyForm, setAPIKeyForm] = useState({
    name: '',
    permissions: ['read:projects', 'write:projects']
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAPIKey, setShowAPIKey] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  // Utilitários
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setLogs(prev => [`[${timestamp}] ${icon} ${message}`, ...prev.slice(0, 49)]);
  };

  const handleError = (error: any, context: string) => {
    const message = error instanceof Error ? error.message : error?.error || 'Erro desconhecido';
    addLog(`${context}: ${message}`, 'error');
  };

  // Verificar conexão com API
  const checkConnection = async () => {
    try {
      const response = await client.getHealth();
      if (response.success) {
        setIsConnected(true);
        addLog('Conectado à API com sucesso', 'success');
      } else {
        setIsConnected(false);
        addLog('Falha ao conectar com a API', 'error');
      }
    } catch (error) {
      setIsConnected(false);
      handleError(error, 'Erro de conexão');
    }
  };

  // Autenticação
  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const response = await client.register(authForm);
      if (response.success && response.data) {
        setUser(response.data.user);
        addLog(`Usuário registrado: ${response.data.user.name}`, 'success');
        setActiveTab('projects');
        await loadUserData();
      } else {
        handleError(response, 'Registro');
      }
    } catch (error) {
      handleError(error, 'Registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await client.login({
        email: authForm.email,
        password: authForm.password
      });
      if (response.success && response.data) {
        setUser(response.data.user);
        addLog(`Login realizado: ${response.data.user.name}`, 'success');
        setActiveTab('projects');
        await loadUserData();
      } else {
        handleError(response, 'Login');
      }
    } catch (error) {
      handleError(error, 'Login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await client.logout();
      setUser(null);
      setProjects([]);
      setTemplates([]);
      setApiKeys([]);
      client.clearAuth();
      addLog('Logout realizado com sucesso', 'success');
      setActiveTab('auth');
    } catch (error) {
      handleError(error, 'Logout');
    }
  };

  // Carregar dados do usuário
  const loadUserData = async () => {
    await Promise.all([
      loadProjects(),
      loadTemplates(),
      loadAPIKeys()
    ]);
  };

  // Projetos
  const loadProjects = async () => {
    try {
      const response = await client.getProjects();
      if (response.success && response.data) {
        setProjects(response.data.projects);
        addLog(`${response.data.projects.length} projetos carregados`, 'info');
      }
    } catch (error) {
      handleError(error, 'Carregar projetos');
    }
  };

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) return;

    setIsLoading(true);
    try {
      const projectData = {
        ...projectForm,
        tags: projectForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      
      const response = await client.createProject(projectData);
      if (response.success && response.data) {
        setProjects(prev => [response.data!.project, ...prev]);
        setProjectForm({ name: '', description: '', isPublic: false, tags: '' });
        addLog(`Projeto criado: ${response.data.project.name}`, 'success');
      } else {
        handleError(response, 'Criar projeto');
      }
    } catch (error) {
      handleError(error, 'Criar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (id: string, data: any) => {
    setIsLoading(true);
    try {
      const response = await client.updateProject(id, data);
      if (response.success && response.data) {
        setProjects(prev => prev.map(p => p.id === id ? response.data!.project : p));
        addLog(`Projeto atualizado: ${response.data.project.name}`, 'success');
      } else {
        handleError(response, 'Atualizar projeto');
      }
    } catch (error) {
      handleError(error, 'Atualizar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este projeto?')) return;

    setIsLoading(true);
    try {
      const response = await client.deleteProject(id);
      if (response.success) {
        setProjects(prev => prev.filter(p => p.id !== id));
        addLog('Projeto deletado com sucesso', 'success');
      } else {
        handleError(response, 'Deletar projeto');
      }
    } catch (error) {
      handleError(error, 'Deletar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  // Templates
  const loadTemplates = async () => {
    try {
      const response = await client.getTemplates();
      if (response.success && response.data) {
        setTemplates(response.data.templates);
        addLog(`${response.data.templates.length} templates carregados`, 'info');
      }
    } catch (error) {
      handleError(error, 'Carregar templates');
    }
  };

  // API Keys
  const loadAPIKeys = async () => {
    try {
      const response = await client.getAPIKeys();
      if (response.success && response.data) {
        setApiKeys(response.data.apiKeys);
        addLog(`${response.data.apiKeys.length} API keys carregadas`, 'info');
      }
    } catch (error) {
      handleError(error, 'Carregar API keys');
    }
  };

  const handleCreateAPIKey = async () => {
    if (!apiKeyForm.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await client.createAPIKey(apiKeyForm);
      if (response.success && response.data) {
        setApiKeys(prev => [response.data!.apiKey, ...prev]);
        setShowAPIKey(response.data.apiKey.key);
        setApiKeyForm({ name: '', permissions: ['read:projects', 'write:projects'] });
        addLog(`API Key criada: ${response.data.apiKey.name}`, 'success');
      } else {
        handleError(response, 'Criar API Key');
      }
    } catch (error) {
      handleError(error, 'Criar API Key');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addLog('Copiado para a área de transferência', 'success');
  };

  // Upload de arquivo (demonstração)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await client.uploadFile(file);
      if (response.success && response.data) {
        addLog(`Arquivo enviado: ${response.data.filename}`, 'success');
      } else {
        handleError(response, 'Upload de arquivo');
      }
    } catch (error) {
      handleError(error, 'Upload de arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">API REST Video Editor</h1>
        <p className="text-muted-foreground">
          Demonstração completa com autenticação, CRUD, upload e webhooks
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            <Server className="w-3 h-3 mr-1" />
            {isConnected ? 'API Online' : 'API Offline'}
          </Badge>
          
          {user && (
            <Badge variant="outline">
              <User className="w-3 h-3 mr-1" />
              {user.name}
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkConnection}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reconectar
          </Button>
        </div>
      </div>

      {/* Status da Conexão */}
      {!isConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível conectar à API. Verifique se o servidor está rodando em http://localhost:3001
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interface Principal */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="auth">
                <User className="w-4 h-4 mr-2" />
                Auth
              </TabsTrigger>
              <TabsTrigger value="projects" disabled={!user}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Projetos
              </TabsTrigger>
              <TabsTrigger value="templates" disabled={!user}>
                <Settings className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="api-keys" disabled={!user}>
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={!user}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
            </TabsList>

            {/* Autenticação */}
            <TabsContent value="auth" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Autenticação</CardTitle>
                  <CardDescription>
                    Faça login ou registre uma nova conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!user ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Email"
                          type="email"
                          value={authForm.email}
                          onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                        <Input
                          placeholder="Senha"
                          type="password"
                          value={authForm.password}
                          onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                        />
                        <Input
                          placeholder="Nome"
                          value={authForm.name}
                          onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleLogin} 
                          disabled={isLoading || !isConnected}
                          className="flex-1"
                        >
                          Login
                        </Button>
                        <Button 
                          onClick={handleRegister} 
                          variant="outline"
                          disabled={isLoading || !isConnected}
                          className="flex-1"
                        >
                          Registrar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                      <Button onClick={handleLogout} variant="outline">
                        Logout
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projetos */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Projetos
                    <Badge variant="outline">{projects.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Gerencie seus projetos de vídeo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Formulário de criação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <Input
                      placeholder="Nome do projeto"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Tags (separadas por vírgula)"
                      value={projectForm.tags}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, tags: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Descrição"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                      className="md:col-span-2"
                    />
                    <Button 
                      onClick={handleCreateProject}
                      disabled={isLoading || !projectForm.name.trim()}
                      className="md:col-span-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Projeto
                    </Button>
                  </div>

                  {/* Lista de projetos */}
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                            <div className="flex gap-1 mt-1">
                              {project.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                              {project.isPublic && <Badge variant="outline">Público</Badge>}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedProject(project)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {projects.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum projeto encontrado. Crie seu primeiro projeto!
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Templates</CardTitle>
                  <CardDescription>
                    Templates disponíveis para seus projetos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map(template => (
                        <div key={template.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{template.category}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  ⭐ {template.rating}/5 ({template.usageCount} usos)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys */}
            <TabsContent value="api-keys" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Gerencie suas chaves de API para integrações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Formulário de criação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <Input
                      placeholder="Nome da API Key"
                      value={apiKeyForm.name}
                      onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Button 
                      onClick={handleCreateAPIKey}
                      disabled={isLoading || !apiKeyForm.name.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar API Key
                    </Button>
                  </div>

                  {/* Mostrar nova API Key */}
                  {showAPIKey && (
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">Nova API Key criada!</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                              {showAPIKey}
                            </code>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(showAPIKey)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ⚠️ Guarde esta chave com segurança. Ela não será mostrada novamente.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowAPIKey(null)}
                          >
                            Fechar
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Lista de API Keys */}
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {apiKeys.map(apiKey => (
                        <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{apiKey.name}</h4>
                            <p className="text-sm text-muted-foreground font-mono">
                              {apiKey.key}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {apiKey.permissions.map(permission => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Criada em {new Date(apiKey.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                            {apiKey.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upload */}
            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivos</CardTitle>
                  <CardDescription>
                    Faça upload de arquivos para seus projetos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Selecione um arquivo para upload
                    </p>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={isLoading}
                    />
                    <Button asChild disabled={isLoading}>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Escolher Arquivo
                      </label>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Log de Atividades */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Log de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Nenhuma atividade ainda...
                    </p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono p-2 bg-gray-50 rounded">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Métricas */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Usuário:</span>
                <Badge variant={user ? 'default' : 'secondary'}>
                  {user ? 'Autenticado' : 'Anônimo'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Projetos:</span>
                <Badge variant="outline">{projects.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Templates:</span>
                <Badge variant="outline">{templates.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">API Keys:</span>
                <Badge variant="outline">{apiKeys.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recursos da API */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos Implementados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Autenticação JWT</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">CRUD Completo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Rate Limiting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Validação de Dados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Documentação Swagger</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Sistema de Webhooks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Upload de Arquivos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">SDK TypeScript</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Edição de Projeto */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Nome"
                value={selectedProject.name}
                onChange={(e) => setSelectedProject(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
              <Textarea
                placeholder="Descrição"
                value={selectedProject.description}
                onChange={(e) => setSelectedProject(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    handleUpdateProject(selectedProject.id, {
                      name: selectedProject.name,
                      description: selectedProject.description
                    });
                    setSelectedProject(null);
                  }}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedProject(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default APIExample;