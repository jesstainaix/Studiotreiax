# Studio Treiax - Guia de Início Rápido

## Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- TypeScript 4.5+
- React 18+

### Dependências Necessárias

```bash
# Instalar dependências principais
npm install zustand lucide-react

# Dependências de desenvolvimento
npm install -D @types/react @types/node
```

### Configuração Inicial

1. **Importar os hooks principais:**

```typescript
// src/App.tsx
import { useAdvancedUI, useWebWorkers, useRealTimeCollaboration } from './hooks';
import AdvancedUIManager from './components/ui/AdvancedUIManager';
import WebWorkerManager from './components/webWorker/WebWorkerManager';
import RealTimeCollaborationManager from './components/collaboration/RealTimeCollaborationManager';
```

2. **Configurar o layout principal:**

```typescript
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <h1 className="text-2xl font-bold p-4">Studio Treiax</h1>
      </header>
      
      <main className="container mx-auto p-4">
        {/* Seus componentes aqui */}
      </main>
    </div>
  );
}
```

## Uso Básico

### 1. Gerenciamento de UI Avançada

```typescript
import { useAdvancedUI } from '@/hooks/useAdvancedUI';
import AdvancedUIManager from '@/components/ui/AdvancedUIManager';

function UIExample() {
  const { components, quickActions } = useAdvancedUI();
  
  const createModal = () => {
    quickActions.createComponent({
      name: 'Modal de Exemplo',
      type: 'modal',
      config: { size: 'large', closable: true }
    });
  };
  
  return (
    <div>
      <button onClick={createModal} className="btn-primary">
        Criar Modal
      </button>
      <AdvancedUIManager className="mt-4" />
    </div>
  );
}
```

### 2. Processamento com Web Workers

```typescript
import { useWebWorkers } from '@/hooks/useWebWorkers';
import WebWorkerManager from '@/components/webWorker/WebWorkerManager';

function WorkerExample() {
  const { tasks, quickActions } = useWebWorkers();
  
  const processVideo = async (file: File) => {
    const task = await quickActions.createTask({
      name: `Processar ${file.name}`,
      type: 'video_processing',
      priority: 'high',
      data: { file }
    });
    
    console.log('Task criada:', task.id);
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="video/*"
        onChange={(e) => processVideo(e.target.files[0])}
      />
      <WebWorkerManager className="mt-4" />
    </div>
  );
}
```

### 3. Colaboração em Tempo Real

```typescript
import { useRealTimeCollaboration } from '@/hooks/useRealTimeCollaboration';
import RealTimeCollaborationManager from '@/components/collaboration/RealTimeCollaborationManager';

function CollaborationExample() {
  const { sessions, users, quickActions } = useRealTimeCollaboration();
  
  const startSession = () => {
    quickActions.createSession({
      name: 'Sessão de Edição',
      type: 'editing'
    });
  };
  
  const inviteUser = () => {
    quickActions.inviteUser({
      name: 'João Silva',
      email: 'joao@exemplo.com',
      role: 'editor'
    });
  };
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={startSession} className="btn-primary">
          Iniciar Sessão
        </button>
        <button onClick={inviteUser} className="btn-secondary">
          Convidar Usuário
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3>Sessões Ativas: {sessions.length}</h3>
        </div>
        <div>
          <h3>Usuários Online: {users.filter(u => u.status === 'online').length}</h3>
        </div>
      </div>
      
      <RealTimeCollaborationManager />
    </div>
  );
}
```

## Exemplos de Integração

### Dashboard Completo

```typescript
import React, { useState } from 'react';
import { 
  useAdvancedUI, 
  useWebWorkers, 
  useRealTimeCollaboration 
} from '@/hooks';

function StudioDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const ui = useAdvancedUI();
  const workers = useWebWorkers();
  const collaboration = useRealTimeCollaboration();
  
  const systemHealth = Math.round(
    (ui.systemHealth + workers.systemHealth + collaboration.systemHealth) / 3
  );
  
  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'ui', label: 'Interface UI' },
    { id: 'workers', label: 'Web Workers' },
    { id: 'collaboration', label: 'Colaboração' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Studio Treiax
              </h1>
              <p className="text-sm text-gray-500">
                Sistema de Produção Avançado
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Saúde do Sistema
                </div>
                <div className={`text-lg font-bold ${
                  systemHealth >= 80 ? 'text-green-600' :
                  systemHealth >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {systemHealth}%
                </div>
              </div>
              
              <div className={`w-3 h-3 rounded-full ${
                systemHealth >= 80 ? 'bg-green-500' :
                systemHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Componentes UI
                </h3>
                <div className="text-3xl font-bold text-blue-600">
                  {ui.totalComponents}
                </div>
                <p className="text-sm text-gray-500">
                  {ui.components.filter(c => c.status === 'active').length} ativos
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Web Workers
                </h3>
                <div className="text-3xl font-bold text-green-600">
                  {workers.totalWorkers}
                </div>
                <p className="text-sm text-gray-500">
                  {workers.activeTasks} tasks ativas
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Colaboração
                </h3>
                <div className="text-3xl font-bold text-purple-600">
                  {collaboration.activeUsers}
                </div>
                <p className="text-sm text-gray-500">
                  {collaboration.totalSessions} sessões
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Atividade Recente
              </h3>
              <div className="space-y-3">
                {/* Atividades recentes aqui */}
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-600">
                    Novo componente modal criado
                  </span>
                  <span className="text-xs text-gray-400">há 2 min</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-600">
                    Task de processamento concluída
                  </span>
                  <span className="text-xs text-gray-400">há 5 min</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-sm text-gray-600">
                    Usuário João Silva entrou na sessão
                  </span>
                  <span className="text-xs text-gray-400">há 8 min</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'ui' && (
          <AdvancedUIManager className="bg-white rounded-lg shadow" />
        )}
        
        {activeTab === 'workers' && (
          <WebWorkerManager className="bg-white rounded-lg shadow" />
        )}
        
        {activeTab === 'collaboration' && (
          <RealTimeCollaborationManager className="bg-white rounded-lg shadow" />
        )}
      </main>
    </div>
  );
}

export default StudioDashboard;
```

## Configuração de Estilos

### Tailwind CSS Classes Utilizadas

```css
/* Adicione ao seu tailwind.config.js */
module.exports = {
  theme: {
    extend: {
      colors: {
        'studio': {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  }
}
```

### Classes CSS Customizadas

```css
/* src/styles/components.css */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
}

.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.status-indicator {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.status-active {
  @apply bg-green-100 text-green-800;
}

.status-inactive {
  @apply bg-gray-100 text-gray-800;
}

.status-loading {
  @apply bg-yellow-100 text-yellow-800;
}
```

## Troubleshooting

### Problemas Comuns

1. **Erro: "Hook não encontrado"**
   ```typescript
   // Certifique-se de que o caminho está correto
   import { useAdvancedUI } from '@/hooks/useAdvancedUI';
   // ou
   import { useAdvancedUI } from './hooks/useAdvancedUI';
   ```

2. **Erro: "Zustand store não inicializado"**
   ```typescript
   // Verifique se o hook está sendo usado dentro de um componente React
   function MyComponent() {
     const { actions } = useAdvancedUI(); // ✅ Correto
     // ...
   }
   
   // ❌ Incorreto - fora do componente
   const { actions } = useAdvancedUI();
   ```

3. **Performance lenta**
   ```typescript
   // Use versões throttled para ações frequentes
   const { throttledActions } = useAdvancedUI();
   
   // Em vez de actions.updateComponent
   throttledActions.updateComponent(componentData);
   ```

### Debug Mode

```typescript
// Habilite logs detalhados
const ui = useAdvancedUI();
console.log('UI Debug:', {
  components: ui.components,
  stats: ui.stats,
  health: ui.systemHealth
});
```

## Próximos Passos

1. **Leia a documentação completa:** [HOOKS_AND_COMPONENTS.md](./HOOKS_AND_COMPONENTS.md)
2. **Explore os exemplos:** Teste os componentes em diferentes cenários
3. **Customize:** Adapte os componentes às suas necessidades
4. **Contribua:** Reporte bugs e sugira melhorias

## Suporte

Para dúvidas e suporte:
- Consulte a documentação completa
- Verifique os exemplos de código
- Analise os logs de debug
- Teste em ambiente isolado

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2025