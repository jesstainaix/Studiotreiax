import React, { useState } from 'react';
import { Save, Bell, Shield, Palette, Globe, Database, Key, Trash2, Download, Upload, Eye, EyeOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import TTSConfigPanel from '@/components/tts/TTSConfigPanel';

interface UserSettings {
  // Geral
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  
  // Notificações
  emailNotifications: boolean;
  pushNotifications: boolean;
  exportNotifications: boolean;
  weeklyReports: boolean;
  
  // Privacidade
  profileVisibility: 'public' | 'private';
  shareAnalytics: boolean;
  cookieConsent: boolean;
  
  // Exportação
  defaultFormat: string;
  defaultQuality: string;
  autoSaveProjects: boolean;
  
  // Integrações
  googleDriveEnabled: boolean;
  dropboxEnabled: boolean;
  oneDriveEnabled: boolean;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<UserSettings>({
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
    exportNotifications: true,
    weeklyReports: false,
    profileVisibility: 'private',
    shareAnalytics: true,
    cookieConsent: true,
    defaultFormat: 'mp4',
    defaultQuality: 'high',
    autoSaveProjects: true,
    googleDriveEnabled: false,
    dropboxEnabled: false,
    oneDriveEnabled: false
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState('sk-1234567890abcdef...');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Configurações salvas com sucesso!');
    setIsSaving(false);
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estudio-ia-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Configurações exportadas!');
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...settings, ...importedSettings });
        toast.success('Configurações importadas com sucesso!');
      } catch (error) {
        toast.error('Erro ao importar configurações. Verifique o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.')) {
      setSettings({
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
        exportNotifications: true,
        weeklyReports: false,
        profileVisibility: 'private',
        shareAnalytics: true,
        cookieConsent: true,
        defaultFormat: 'mp4',
        defaultQuality: 'high',
        autoSaveProjects: true,
        googleDriveEnabled: false,
        dropboxEnabled: false,
        oneDriveEnabled: false
      });
      toast.success('Configurações restauradas para o padrão!');
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie suas preferências e configurações da conta</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
          <TabsTrigger value="export">Exportação</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="tts">TTS</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Configurações Gerais
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                <div className="flex gap-2">
                  {[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'auto', label: 'Automático' }].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateSetting('theme', theme.value)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        settings.theme === theme.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Gerenciamento de Dados
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Importar Configurações</h3>
                  <p className="text-sm text-gray-600">Restaurar configurações de um arquivo backup</p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                    id="import-settings"
                  />
                  <label htmlFor="import-settings">
                    <Button variant="outline" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar
                    </Button>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Restaurar Padrões</h3>
                  <p className="text-sm text-gray-600">Voltar às configurações originais do sistema</p>
                </div>
                <Button variant="outline" onClick={handleResetSettings} className="text-red-600 border-red-300 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Restaurar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Preferências de Notificação
            </h2>
            
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Notificações por Email', description: 'Receber atualizações importantes por email' },
                { key: 'pushNotifications', label: 'Notificações Push', description: 'Notificações em tempo real no navegador' },
                { key: 'exportNotifications', label: 'Notificações de Exportação', description: 'Avisar quando a exportação de vídeos for concluída' },
                { key: 'weeklyReports', label: 'Relatórios Semanais', description: 'Resumo semanal de atividades e estatísticas' }
              ].map((notification) => (
                <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{notification.label}</h3>
                    <p className="text-sm text-gray-600">{notification.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[notification.key as keyof UserSettings] as boolean}
                      onChange={(e) => updateSetting(notification.key as keyof UserSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Configurações de Privacidade
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Visibilidade do Perfil</h3>
                  <Badge variant={settings.profileVisibility === 'public' ? 'success' : 'secondary'}>
                    {settings.profileVisibility === 'public' ? 'Público' : 'Privado'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">Controle quem pode ver seu perfil e projetos</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSetting('profileVisibility', 'private')}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      settings.profileVisibility === 'private'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Privado
                  </button>
                  <button
                    onClick={() => updateSetting('profileVisibility', 'public')}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      settings.profileVisibility === 'public'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Público
                  </button>
                </div>
              </div>

              {[
                { key: 'shareAnalytics', label: 'Compartilhar Dados de Uso', description: 'Ajudar a melhorar o produto compartilhando dados anônimos de uso' },
                { key: 'cookieConsent', label: 'Aceitar Cookies', description: 'Permitir cookies para melhorar a experiência do usuário' }
              ].map((privacy) => (
                <div key={privacy.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{privacy.label}</h3>
                    <p className="text-sm text-gray-600">{privacy.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[privacy.key as keyof UserSettings] as boolean}
                      onChange={(e) => updateSetting(privacy.key as keyof UserSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Chave da API
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Chave de Acesso da API</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast.success('Chave copiada para a área de transferência!');
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Use esta chave para acessar a API do Estúdio IA. Mantenha-a segura e não a compartilhe.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Configurações de Exportação
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formato Padrão</label>
                <select
                  value={settings.defaultFormat}
                  onChange={(e) => updateSetting('defaultFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mp4">MP4</option>
                  <option value="avi">AVI</option>
                  <option value="mov">MOV</option>
                  <option value="webm">WebM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualidade Padrão</label>
                <select
                  value={settings.defaultQuality}
                  onChange={(e) => updateSetting('defaultQuality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Salvamento Automático</h3>
                  <p className="text-sm text-gray-600">Salvar projetos automaticamente durante a edição</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSaveProjects}
                    onChange={(e) => updateSetting('autoSaveProjects', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Integrações de Armazenamento
            </h2>
            
            <div className="space-y-4">
              {[
                { key: 'googleDriveEnabled', label: 'Google Drive', description: 'Sincronizar projetos com o Google Drive', icon: '🔵' },
                { key: 'dropboxEnabled', label: 'Dropbox', description: 'Backup automático no Dropbox', icon: '📦' },
                { key: 'oneDriveEnabled', label: 'OneDrive', description: 'Integração com Microsoft OneDrive', icon: '☁️' }
              ].map((integration) => (
                <div key={integration.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{integration.label}</h3>
                      <p className="text-sm text-gray-600">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings[integration.key as keyof UserSettings] && (
                      <Badge variant="success">Conectado</Badge>
                    )}
                    <Button
                      variant={settings[integration.key as keyof UserSettings] ? 'outline' : 'default'}
                      onClick={() => updateSetting(integration.key as keyof UserSettings, !settings[integration.key as keyof UserSettings])}
                    >
                      {settings[integration.key as keyof UserSettings] ? 'Desconectar' : 'Conectar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">💡 Dica</h3>
            <p className="text-sm text-blue-800">
              As integrações permitem sincronizar automaticamente seus projetos com serviços de armazenamento em nuvem, 
              garantindo backup e acesso de qualquer dispositivo.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="tts" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              Configurações de Text-to-Speech
            </h2>
            <TTSConfigPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;