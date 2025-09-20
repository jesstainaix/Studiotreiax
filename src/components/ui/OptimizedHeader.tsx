// Componente de Header otimizado com memoização
import React, { memo, useCallback, useMemo } from 'react';
import { Bell, FolderOpen, Settings, Plus, X } from 'lucide-react';

interface TabConfig {
  name: string;
  premium?: boolean;
  beta?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface ProjectItem {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'image';
  lastModified: Date;
  thumbnail?: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  performance: 'low' | 'medium' | 'high' | 'ultra';
  autoSave: boolean;
  notifications: boolean;
}

interface OptimizedHeaderProps {
  activeTabConfig: TabConfig | null;
  showProjects: boolean;
  setShowProjects: (show: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  projects: ProjectItem[];
  notifications: NotificationItem[];
  unreadNotifications: number;
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  createNewProject: (type: string) => void;
  clearAllNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  toggleFullscreen: () => void;
  fullscreen: boolean;
  notificationRef: React.RefObject<HTMLDivElement>;
  settingsRef: React.RefObject<HTMLDivElement>;
}

// Componente memoizado para badge de notificações
const NotificationBadge = memo<{ count: number }>(({ count }) => {
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

// Componente memoizado para card de projeto
const ProjectCard = memo<{ 
  project: ProjectItem; 
  onClick: () => void; 
}>(({ project, onClick }) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <div
      onClick={handleClick}
      className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 transition-colors"
    >
      <div className="flex items-center space-x-3">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-10 h-10 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-gray-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{project.title}</h4>
          <p className="text-sm text-gray-500">
            {project.lastModified.toLocaleDateString()}
          </p>
        </div>
        
        <div className={`w-2 h-2 rounded-full ${
          project.type === 'video' ? 'bg-blue-500' :
          project.type === 'audio' ? 'bg-green-500' :
          'bg-purple-500'
        }`} />
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

// Componente memoizado para item de notificação
const NotificationItem = memo<{
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
}>(({ notification, onMarkAsRead }) => {
  const handleClick = useCallback(() => {
    onMarkAsRead(notification.id);
  }, [notification.id, onMarkAsRead]);

  const handleActionClick = useCallback((action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    action();
  }, []);

  const typeColor = useMemo(() => {
    switch (notification.type) {
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  }, [notification.type]);

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${typeColor}`} />
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {notification.timestamp.toLocaleTimeString()}
          </p>
          
          {notification.actions && (
            <div className="flex space-x-2 mt-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => handleActionClick(action.action, e)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

// Componente memoizado para dropdown de projetos
const ProjectsDropdown = memo<{
  show: boolean;
  projects: ProjectItem[];
  onClose: () => void;
  onCreateNew: (type: string) => void;
  onProjectClick: (project: ProjectItem) => void;
}>(({ show, projects, onClose, onCreateNew, onProjectClick }) => {
  const handleCreateNew = useCallback(() => {
    onCreateNew('video');
  }, [onCreateNew]);

  const handleProjectClick = useCallback((project: ProjectItem) => {
    onClose();
    onProjectClick(project);
  }, [onClose, onProjectClick]);

  if (!show) return null;

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Projetos Recentes</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateNew}
              className="p-1 rounded hover:bg-gray-100"
              title="Novo Vídeo"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Nenhum projeto encontrado</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ProjectsDropdown.displayName = 'ProjectsDropdown';

// Componente memoizado para dropdown de notificações
const NotificationsDropdown = memo<{
  show: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
}>(({ show, notifications, onClose, onClearAll, onMarkAsRead }) => {
  if (!show) return null;

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Notificações</h3>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Limpar todas
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
});

NotificationsDropdown.displayName = 'NotificationsDropdown';

// Componente memoizado para toggle switch
const ToggleSwitch = memo<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}>(({ checked, onChange, label }) => {
  const handleToggle = useCallback(() => {
    onChange(!checked);
  }, [checked, onChange]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
});

ToggleSwitch.displayName = 'ToggleSwitch';

// Componente memoizado para dropdown de configurações
const SettingsDropdown = memo<{
  show: boolean;
  preferences: UserPreferences;
  onPreferencesChange: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onToggleFullscreen: () => void;
  fullscreen: boolean;
}>(({ show, preferences, onPreferencesChange, onToggleFullscreen, fullscreen }) => {
  const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onPreferencesChange(prev => ({ 
      ...prev, 
      theme: e.target.value as UserPreferences['theme']
    }));
  }, [onPreferencesChange]);

  const handlePerformanceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onPreferencesChange(prev => ({ 
      ...prev, 
      performance: e.target.value as UserPreferences['performance']
    }));
  }, [onPreferencesChange]);

  const handleAutoSaveChange = useCallback((checked: boolean) => {
    onPreferencesChange(prev => ({ ...prev, autoSave: checked }));
  }, [onPreferencesChange]);

  const handleNotificationsChange = useCallback((checked: boolean) => {
    onPreferencesChange(prev => ({ ...prev, notifications: checked }));
  }, [onPreferencesChange]);

  if (!show) return null;

  return (
    <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Configurações</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tema
            </label>
            <select
              value={preferences.theme}
              onChange={handleThemeChange}
              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="auto">Automático</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Performance
            </label>
            <select
              value={preferences.performance}
              onChange={handlePerformanceChange}
              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          
          <ToggleSwitch
            checked={preferences.autoSave}
            onChange={handleAutoSaveChange}
            label="Auto-salvar"
          />
          
          <ToggleSwitch
            checked={preferences.notifications}
            onChange={handleNotificationsChange}
            label="Notificações"
          />
          
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={onToggleFullscreen}
              className="w-full text-left text-sm text-gray-700 hover:text-gray-900 py-2"
            >
              {fullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

SettingsDropdown.displayName = 'SettingsDropdown';

// Componente principal do header otimizado
export const OptimizedHeader = memo<OptimizedHeaderProps>(({ 
  activeTabConfig,
  showProjects,
  setShowProjects,
  showNotifications,
  setShowNotifications,
  showSettings,
  setShowSettings,
  projects,
  notifications,
  unreadNotifications,
  preferences,
  setPreferences,
  createNewProject,
  clearAllNotifications,
  markNotificationAsRead,
  toggleFullscreen,
  fullscreen,
  notificationRef,
  settingsRef
}) => {
  // Memoizar handlers para evitar re-renders desnecessários
  const handleProjectsToggle = useCallback(() => {
    setShowProjects(!showProjects);
  }, [showProjects, setShowProjects]);

  const handleNotificationsToggle = useCallback(() => {
    setShowNotifications(!showNotifications);
  }, [showNotifications, setShowNotifications]);

  const handleSettingsToggle = useCallback(() => {
    setShowSettings(!showSettings);
  }, [showSettings, setShowSettings]);

  const handleProjectClick = useCallback((project: ProjectItem) => {
    // Lógica para abrir projeto
    console.log('Abrindo projeto:', project.id);
  }, []);

  // Memoizar badges e títulos
  const premiumBadge = useMemo(() => {
    if (!activeTabConfig?.premium) return null;
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
        PREMIUM
      </span>
    );
  }, [activeTabConfig?.premium]);

  const betaBadge = useMemo(() => {
    if (!activeTabConfig?.beta) return null;
    return (
      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
        BETA
      </span>
    );
  }, [activeTabConfig?.beta]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTabConfig?.name}
          </h2>
          {premiumBadge}
          {betaBadge}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Botão de Projetos */}
          <div className="relative">
            <button
              onClick={handleProjectsToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Projetos"
            >
              <FolderOpen className="w-5 h-5 text-gray-600" />
            </button>
            
            <ProjectsDropdown
              show={showProjects}
              projects={projects}
              onClose={() => setShowProjects(false)}
              onCreateNew={createNewProject}
              onProjectClick={handleProjectClick}
            />
          </div>
          
          {/* Notificações */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationsToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <NotificationBadge count={unreadNotifications} />
            </button>
            
            <NotificationsDropdown
              show={showNotifications}
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onClearAll={clearAllNotifications}
              onMarkAsRead={markNotificationAsRead}
            />
          </div>
          
          {/* Configurações */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={handleSettingsToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Configurações"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            
            <SettingsDropdown
              show={showSettings}
              preferences={preferences}
              onPreferencesChange={setPreferences}
              onToggleFullscreen={toggleFullscreen}
              fullscreen={fullscreen}
            />
          </div>
        </div>
      </div>
    </header>
  );
});

OptimizedHeader.displayName = 'OptimizedHeader';

export default OptimizedHeader;