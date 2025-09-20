import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, TestTube, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { LMSService } from '../../services/lmsService';
import { 
  LMSConfig, 
  LMSPlatform, 
  AuthMethod, 
  SSOConfig,
  LMSCredentials,
  LMSSettings 
} from '../../types/lms';

interface LMSConfigManagerProps {
  onConfigChange?: (configs: LMSConfig[]) => void;
}

interface ConfigFormData {
  name: string;
  platform: LMSPlatform;
  apiUrl: string;
  authMethod: AuthMethod;
  credentials: LMSCredentials;
  settings: LMSSettings;
  ssoConfig?: SSOConfig;
  isActive: boolean;
}

interface ConnectionTest {
  configId: string;
  status: 'testing' | 'success' | 'failed';
  message?: string;
  timestamp: Date;
}

const LMSConfigManager: React.FC<LMSConfigManagerProps> = ({ onConfigChange }) => {
  const [configs, setConfigs] = useState<LMSConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<LMSConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [connectionTests, setConnectionTests] = useState<Map<string, ConnectionTest>>(new Map());
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<ConfigFormData>({
    name: '',
    platform: 'moodle',
    apiUrl: '',
    authMethod: 'api_key',
    credentials: {
      apiKey: '',
      username: '',
      password: '',
      clientId: '',
      clientSecret: '',
      accessToken: '',
      refreshToken: ''
    },
    settings: {
      syncInterval: 300000, // 5 minutes
      batchSize: 50,
      retryAttempts: 3,
      enableRealTimeSync: true,
      enableOfflineMode: false,
      defaultCourseCategory: '',
      defaultEnrollmentMethod: 'manual'
    },
    isActive: true
  });

  const lmsService = new LMSService();

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    onConfigChange?.(configs);
  }, [configs, onConfigChange]);

  const loadConfigs = async () => {
    try {
      // Load from localStorage or API
      const savedConfigs = localStorage.getItem('lms_configs');
      if (savedConfigs) {
        setConfigs(JSON.parse(savedConfigs));
      }
    } catch (error) {
      console.error('Failed to load LMS configs:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const saveConfigs = (newConfigs: LMSConfig[]) => {
    try {
      localStorage.setItem('lms_configs', JSON.stringify(newConfigs));
      setConfigs(newConfigs);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Failed to save LMS configs:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleCreateConfig = () => {
    setIsEditing(false);
    setSelectedConfig(null);
    setFormData({
      name: '',
      platform: 'moodle',
      apiUrl: '',
      authMethod: 'api_key',
      credentials: {
        apiKey: '',
        username: '',
        password: '',
        clientId: '',
        clientSecret: '',
        accessToken: '',
        refreshToken: ''
      },
      settings: {
        syncInterval: 300000,
        batchSize: 50,
        retryAttempts: 3,
        enableRealTimeSync: true,
        enableOfflineMode: false,
        defaultCourseCategory: '',
        defaultEnrollmentMethod: 'manual'
      },
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleEditConfig = (config: LMSConfig) => {
    setIsEditing(true);
    setSelectedConfig(config);
    setFormData({
      name: config.name,
      platform: config.platform,
      apiUrl: config.apiUrl,
      authMethod: config.authMethod,
      credentials: { ...config.credentials },
      settings: { ...config.settings },
      ssoConfig: config.ssoConfig ? { ...config.ssoConfig } : undefined,
      isActive: config.isActive
    });
    setIsDialogOpen(true);
  };

  const handleSaveConfig = () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Nome da configuração é obrigatório');
        return;
      }
      if (!formData.apiUrl.trim()) {
        toast.error('URL da API é obrigatória');
        return;
      }

      const newConfig: LMSConfig = {
        id: isEditing ? selectedConfig!.id : generateId(),
        name: formData.name,
        platform: formData.platform,
        apiUrl: formData.apiUrl,
        authMethod: formData.authMethod,
        credentials: formData.credentials,
        settings: formData.settings,
        ssoConfig: formData.ssoConfig,
        isActive: formData.isActive,
        createdAt: isEditing ? selectedConfig!.createdAt : new Date(),
        updatedAt: new Date()
      };

      let newConfigs;
      if (isEditing) {
        newConfigs = configs.map(c => c.id === selectedConfig!.id ? newConfig : c);
      } else {
        newConfigs = [...configs, newConfig];
      }

      saveConfigs(newConfigs);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleDeleteConfig = (configId: string) => {
    const newConfigs = configs.filter(c => c.id !== configId);
    saveConfigs(newConfigs);
  };

  const handleTestConnection = async (config: LMSConfig) => {
    const testId = config.id;
    
    setConnectionTests(prev => new Map(prev.set(testId, {
      configId: testId,
      status: 'testing',
      timestamp: new Date()
    })));

    try {
      const result = await lmsService.testConnection(config);
      
      setConnectionTests(prev => new Map(prev.set(testId, {
        configId: testId,
        status: result.success ? 'success' : 'failed',
        message: result.message,
        timestamp: new Date()
      })));

      if (result.success) {
        toast.success('Conexão testada com sucesso!');
      } else {
        toast.error(`Falha na conexão: ${result.message}`);
      }
    } catch (error) {
      setConnectionTests(prev => new Map(prev.set(testId, {
        configId: testId,
        status: 'failed',
        message: error.message,
        timestamp: new Date()
      })));
      
      toast.error(`Erro no teste de conexão: ${error.message}`);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const generateId = () => {
    return 'lms_' + Math.random().toString(36).substr(2, 9);
  };

  const getPlatformIcon = (platform: LMSPlatform) => {
    const icons = {
      moodle: '🎓',
      canvas: '🎨',
      blackboard: '📚',
      brightspace: '💡',
      schoology: '🏫',
      google_classroom: '📖',
      microsoft_teams: '👥',
      generic: '🔗'
    };
    return icons[platform] || icons.generic;
  };

  const getConnectionStatus = (configId: string) => {
    const test = connectionTests.get(configId);
    if (!test) return null;
    
    switch (test.status) {
      case 'testing':
        return <Badge variant="secondary">Testando...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Conectado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falha</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configurações LMS</h2>
          <p className="text-muted-foreground">
            Gerencie suas conexões com plataformas de aprendizado
          </p>
        </div>
        <Button onClick={handleCreateConfig} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Configuração
        </Button>
      </div>

      {/* Configurations List */}
      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma configuração encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Adicione sua primeira configuração LMS para começar a integrar com plataformas de aprendizado.
              </p>
              <Button onClick={handleCreateConfig}>
                Criar Primeira Configuração
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id} className={`${config.isActive ? '' : 'opacity-60'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlatformIcon(config.platform)}</span>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                        {!config.isActive && <Badge variant="secondary">Inativo</Badge>}
                        {getConnectionStatus(config.id)}
                      </CardTitle>
                      <CardDescription>
                        {config.platform.charAt(0).toUpperCase() + config.platform.slice(1)} - {config.apiUrl}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(config)}
                      disabled={connectionTests.get(config.id)?.status === 'testing'}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditConfig(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteConfig(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Método de Auth:</span>
                    <p className="text-muted-foreground">{config.authMethod}</p>
                  </div>
                  <div>
                    <span className="font-medium">Sync Interval:</span>
                    <p className="text-muted-foreground">{config.settings.syncInterval / 1000}s</p>
                  </div>
                  <div>
                    <span className="font-medium">Batch Size:</span>
                    <p className="text-muted-foreground">{config.settings.batchSize}</p>
                  </div>
                  <div>
                    <span className="font-medium">Última Atualização:</span>
                    <p className="text-muted-foreground">{config.updatedAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Configuração LMS' : 'Nova Configuração LMS'}
            </DialogTitle>
            <DialogDescription>
              Configure a conexão com sua plataforma de aprendizado
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="auth">Autenticação</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="sso">SSO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="config-name">Nome da Configuração</Label>
                  <Input
                    id="config-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Moodle Produção"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value: LMSPlatform) => setFormData(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moodle">Moodle</SelectItem>
                      <SelectItem value="canvas">Canvas</SelectItem>
                      <SelectItem value="blackboard">Blackboard</SelectItem>
                      <SelectItem value="brightspace">Brightspace</SelectItem>
                      <SelectItem value="schoology">Schoology</SelectItem>
                      <SelectItem value="google_classroom">Google Classroom</SelectItem>
                      <SelectItem value="microsoft_teams">Microsoft Teams</SelectItem>
                      <SelectItem value="generic">Genérico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-url">URL da API</Label>
                <Input
                  id="api-url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="https://seu-lms.com/webservice/rest/server.php"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="is-active">Configuração Ativa</Label>
              </div>
            </TabsContent>

            <TabsContent value="auth" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-method">Método de Autenticação</Label>
                <Select
                  value={formData.authMethod}
                  onValueChange={(value: AuthMethod) => setFormData(prev => ({ ...prev, authMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    <SelectItem value="basic_auth">Basic Auth</SelectItem>
                    <SelectItem value="token">Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.authMethod === 'api_key' && (
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showPasswords.has('apiKey') ? 'text' : 'password'}
                      value={formData.credentials.apiKey || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials, apiKey: e.target.value }
                      }))}
                      placeholder="Sua API Key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility('apiKey')}
                    >
                      {showPasswords.has('apiKey') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {formData.authMethod === 'basic_auth' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <Input
                      id="username"
                      value={formData.credentials.username || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials, username: e.target.value }
                      }))}
                      placeholder="Usuário"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPasswords.has('password') ? 'text' : 'password'}
                        value={formData.credentials.password || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, password: e.target.value }
                        }))}
                        placeholder="Senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('password')}
                      >
                        {showPasswords.has('password') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {formData.authMethod === 'oauth' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-id">Client ID</Label>
                    <Input
                      id="client-id"
                      value={formData.credentials.clientId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials, clientId: e.target.value }
                      }))}
                      placeholder="Client ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-secret">Client Secret</Label>
                    <div className="relative">
                      <Input
                        id="client-secret"
                        type={showPasswords.has('clientSecret') ? 'text' : 'password'}
                        value={formData.credentials.clientSecret || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, clientSecret: e.target.value }
                        }))}
                        placeholder="Client Secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('clientSecret')}
                      >
                        {showPasswords.has('clientSecret') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Intervalo de Sincronização (segundos)</Label>
                  <Input
                    id="sync-interval"
                    type="number"
                    value={formData.settings.syncInterval / 1000}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, syncInterval: parseInt(e.target.value) * 1000 }
                    }))}
                    min="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Tamanho do Lote</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    value={formData.settings.batchSize}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, batchSize: parseInt(e.target.value) }
                    }))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Tentativas de Retry</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    value={formData.settings.retryAttempts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, retryAttempts: parseInt(e.target.value) }
                    }))}
                    min="0"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-category">Categoria Padrão do Curso</Label>
                  <Input
                    id="default-category"
                    value={formData.settings.defaultCourseCategory}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, defaultCourseCategory: e.target.value }
                    }))}
                    placeholder="Ex: Treinamentos"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="real-time-sync"
                    checked={formData.settings.enableRealTimeSync}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, enableRealTimeSync: checked }
                    }))}
                  />
                  <Label htmlFor="real-time-sync">Sincronização em Tempo Real</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="offline-mode"
                    checked={formData.settings.enableOfflineMode}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, enableOfflineMode: checked }
                    }))}
                  />
                  <Label htmlFor="offline-mode">Modo Offline</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sso" className="space-y-4">
              <div className="space-y-2">
                <Label>Configuração SSO (Opcional)</Label>
                <p className="text-sm text-muted-foreground">
                  Configure Single Sign-On para integração avançada
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sso-provider">Provedor SSO</Label>
                <Select
                  value={formData.ssoConfig?.provider || ''}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    ssoConfig: { ...prev.ssoConfig, provider: value as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saml">SAML</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                    <SelectItem value="oidc">OpenID Connect</SelectItem>
                    <SelectItem value="lti">LTI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.ssoConfig?.provider && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sso-endpoint">Endpoint SSO</Label>
                    <Input
                      id="sso-endpoint"
                      value={formData.ssoConfig?.endpoint || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ssoConfig: { ...prev.ssoConfig, endpoint: e.target.value }
                      }))}
                      placeholder="https://sso.exemplo.com/auth"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sso-config">Configuração Adicional (JSON)</Label>
                    <Textarea
                      id="sso-config"
                      value={JSON.stringify(formData.ssoConfig?.config || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const config = JSON.parse(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            ssoConfig: { ...prev.ssoConfig, config }
                          }));
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      placeholder='{"issuer": "exemplo.com", "cert": "..."}'
                      rows={6}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig}>
              {isEditing ? 'Atualizar' : 'Criar'} Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LMSConfigManager;