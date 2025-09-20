import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import {
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  Settings,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Database,
  Globe,
  Zap
} from 'lucide-react';
import { useServiceWorker } from '../../utils/serviceWorker';

interface PWAManagerProps {
  className?: string;
}

interface CacheInfo {
  name: string;
  size: number;
  entries: number;
  lastUpdated: Date;
}

const PWAManager: React.FC<PWAManagerProps> = ({ className }) => {
  const {
    isRegistered,
    isOnline,
    updateAvailable,
    canInstall,
    isPWAMode,
    cacheStatus,
    register,
    unregister,
    update,
    skipWaiting,
    installPWA,
    clearCaches,
    getCacheStatus
  } = useServiceWorker({
    onUpdate: () => {
      toast.info('Nova atualização disponível!', {
        description: 'Clique em "Atualizar" para aplicar as mudanças.',
        action: {
          label: 'Atualizar',
          onClick: () => skipWaiting()
        }
      });
    },
    onOffline: () => {
      toast.warning('Você está offline', {
        description: 'Algumas funcionalidades podem estar limitadas.'
      });
    },
    onOnline: () => {
      toast.success('Conexão restaurada!', {
        description: 'Todas as funcionalidades estão disponíveis novamente.'
      });
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [installProgress, setInstallProgress] = useState(0);

  useEffect(() => {
    // Auto-register service worker on mount
    if (!isRegistered) {
      register().catch(console.error);
    }
  }, [isRegistered, register]);

  useEffect(() => {
    // Update cache info periodically
    const updateCacheInfo = async () => {
      await getCacheStatus();
      // Mock cache info for demonstration
      setCacheInfo([
        {
          name: 'static-v1',
          size: 2.5,
          entries: 15,
          lastUpdated: new Date()
        },
        {
          name: 'dynamic-v1',
          size: 1.8,
          entries: 8,
          lastUpdated: new Date(Date.now() - 300000)
        },
        {
          name: 'api-v1',
          size: 0.9,
          entries: 12,
          lastUpdated: new Date(Date.now() - 600000)
        }
      ]);
    };

    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 30000);
    return () => clearInterval(interval);
  }, [getCacheStatus]);

  const handleInstallPWA = async () => {
    setIsLoading(true);
    setInstallProgress(0);

    try {
      // Simulate installation progress
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const success = await installPWA();
      
      clearInterval(progressInterval);
      setInstallProgress(100);

      if (success) {
        toast.success('App instalado com sucesso!', {
          description: 'O Studio Treiax agora está disponível na sua tela inicial.'
        });
      } else {
        toast.error('Falha na instalação', {
          description: 'Não foi possível instalar o app. Tente novamente.'
        });
      }
    } catch (error) {
      toast.error('Erro na instalação', {
        description: 'Ocorreu um erro durante a instalação do app.'
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setInstallProgress(0), 2000);
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await update();
      skipWaiting();
      toast.success('App atualizado!', {
        description: 'A página será recarregada para aplicar as mudanças.'
      });
    } catch (error) {
      toast.error('Falha na atualização', {
        description: 'Não foi possível atualizar o app. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await clearCaches();
      toast.success('Cache limpo!', {
        description: 'Todos os dados em cache foram removidos.'
      });
      setCacheInfo([]);
    } catch (error) {
      toast.error('Falha ao limpar cache', {
        description: 'Não foi possível limpar o cache. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  const totalCacheSize = cacheInfo.reduce((total, cache) => total + cache.size, 0);
  const totalCacheEntries = cacheInfo.reduce((total, cache) => total + cache.entries, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status da conexão
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isPWAMode ? (
                <Smartphone className="h-5 w-5 text-blue-500" />
              ) : (
                <Monitor className="h-5 w-5 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isPWAMode ? 'PWA' : 'Browser'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Modo de execução
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isRegistered ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isRegistered ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Service Worker
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">
                  {formatBytes(totalCacheSize * 1024 * 1024)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cache total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {updateAvailable && (
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Nova atualização disponível para o app!</span>
            <Button size="sm" onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {canInstall && !isPWAMode && (
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Instale o app para uma melhor experiência!</span>
            <Button size="sm" onClick={handleInstallPWA} disabled={isLoading}>
              {isLoading ? 'Instalando...' : 'Instalar'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Installation Progress */}
      {installProgress > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Instalando app...</span>
                <span className="text-sm text-muted-foreground">{installProgress}%</span>
              </div>
              <Progress value={installProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Performance</span>
                </CardTitle>
                <CardDescription>
                  Métricas de performance do app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Tempo de carregamento</span>
                  <Badge variant="secondary">1.2s</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cache hit rate</span>
                  <Badge variant="secondary">87%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Recursos offline</span>
                  <Badge variant="secondary">{totalCacheEntries}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Conectividade</span>
                </CardTitle>
                <CardDescription>
                  Status da conexão e sincronização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={isOnline ? 'default' : 'destructive'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Última sincronização</span>
                  <Badge variant="secondary">2min atrás</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Dados pendentes</span>
                  <Badge variant="secondary">0</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gerenciamento de Cache</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
              </CardTitle>
              <CardDescription>
                Visualize e gerencie os dados em cache
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cacheInfo.map((cache, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{cache.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cache.entries} itens • Atualizado {formatTimeAgo(cache.lastUpdated)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatBytes(cache.size * 1024 * 1024)}</p>
                      <p className="text-sm text-muted-foreground">Tamanho</p>
                    </div>
                  </div>
                ))}
                
                {cacheInfo.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cache encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações PWA</span>
              </CardTitle>
              <CardDescription>
                Gerencie as configurações do Progressive Web App
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Service Worker</p>
                    <p className="text-sm text-muted-foreground">
                      Controle o service worker do app
                    </p>
                  </div>
                  <div className="space-x-2">
                    {!isRegistered ? (
                      <Button size="sm" onClick={register} disabled={isLoading}>
                        Registrar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={unregister} disabled={isLoading}>
                        Desregistrar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Instalação PWA</p>
                    <p className="text-sm text-muted-foreground">
                      Instale o app na tela inicial
                    </p>
                  </div>
                  <div>
                    {canInstall ? (
                      <Button size="sm" onClick={handleInstallPWA} disabled={isLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Instalar
                      </Button>
                    ) : (
                      <Badge variant={isPWAMode ? 'default' : 'secondary'}>
                        {isPWAMode ? 'Instalado' : 'Não disponível'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Atualizações</p>
                    <p className="text-sm text-muted-foreground">
                      Verifique e aplique atualizações
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" onClick={update} disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verificar
                    </Button>
                    {updateAvailable && (
                      <Button size="sm" onClick={handleUpdate} disabled={isLoading}>
                        Atualizar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Informações do Sistema</span>
              </CardTitle>
              <CardDescription>
                Detalhes técnicos sobre o PWA e Service Worker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Suporte do Navegador</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Service Worker:</span>
                      <Badge variant={('serviceWorker' in navigator) ? 'default' : 'destructive'}>
                        {('serviceWorker' in navigator) ? 'Suportado' : 'Não suportado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache API:</span>
                      <Badge variant={('caches' in window) ? 'default' : 'destructive'}>
                        {('caches' in window) ? 'Suportado' : 'Não suportado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Push API:</span>
                      <Badge variant={('PushManager' in window) ? 'default' : 'destructive'}>
                        {('PushManager' in window) ? 'Suportado' : 'Não suportado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Notifications:</span>
                      <Badge variant={('Notification' in window) ? 'default' : 'destructive'}>
                        {('Notification' in window) ? 'Suportado' : 'Não suportado'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Status Atual</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Modo de exibição:</span>
                      <Badge variant="secondary">
                        {isPWAMode ? 'Standalone' : 'Browser'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Conexão:</span>
                      <Badge variant={isOnline ? 'default' : 'destructive'}>
                        {isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Worker:</span>
                      <Badge variant={isRegistered ? 'default' : 'secondary'}>
                        {isRegistered ? 'Registrado' : 'Não registrado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Atualização:</span>
                      <Badge variant={updateAvailable ? 'default' : 'secondary'}>
                        {updateAvailable ? 'Disponível' : 'Atualizado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PWAManager;