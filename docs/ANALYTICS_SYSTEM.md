# Sistema de Analytics - Documentação

## Visão Geral

O sistema de analytics foi implementado com uma arquitetura completa frontend-backend, fornecendo métricas em tempo real, relatórios de compliance e análises executivas para o sistema de treinamento corporativo.

## Arquitetura

### Backend (Node.js/Express)

#### Estrutura de Arquivos
```
api/
├── controllers/
│   └── analyticsController.js    # Controller principal de analytics
├── services/
│   └── analyticsService.js        # Serviço de dados e lógica de negócio
└── routes/
    └── analytics.js               # Rotas da API
```

#### Endpoints Principais

- **GET /api/analytics/dashboard** - Métricas gerais do dashboard
- **GET /api/analytics/engagement/metrics** - Métricas de engajamento
- **GET /api/analytics/compliance/reporting** - Relatórios de compliance
- **GET /api/analytics/templates/popular** - Templates mais populares
- **GET /api/analytics/system/overview** - Visão geral do sistema
- **GET /api/analytics/realtime/metrics** - Métricas em tempo real

#### Funcionalidades do Backend

1. **Métricas de Dashboard**
   - Total de projetos
   - Usuários ativos
   - Treinamentos completados
   - Taxa de compliance
   - Crescimento mensal

2. **Analytics de Engajamento**
   - Tempo médio de visualização
   - Taxa de conclusão
   - Interações por usuário
   - Sessões ativas

3. **Relatórios de Compliance**
   - Status por NR (Norma Regulamentadora)
   - Certificações pendentes
   - Histórico de auditorias
   - Relatórios por departamento

4. **Métricas em Tempo Real**
   - Usuários online
   - Status do sistema
   - Performance de APIs
   - WebSocket para atualizações live

### Frontend (React/TypeScript)

#### Estrutura de Arquivos
```
src/
├── pages/
│   └── Analytics.tsx              # Página principal de analytics
├── hooks/
│   └── useAnalytics.ts            # Hook personalizado para analytics
├── services/
│   └── analyticsApi.js            # Cliente da API de analytics
└── components/analytics/
    ├── RealTimeMetrics.tsx        # Componente de métricas em tempo real
    ├── ComplianceReports.tsx      # Relatórios de compliance
    ├── ExecutiveDashboard.tsx     # Dashboard executivo
    ├── ROIAnalysis.tsx            # Análise de ROI
    └── SecurityAnalysis.tsx       # Análise de segurança
```

#### Hook useAnalytics

O hook personalizado `useAnalytics` fornece:

- **useDashboard()** - Dados do dashboard principal
- **useEngagementMetrics()** - Métricas de engajamento
- **useComplianceReporting()** - Relatórios de compliance
- **useSystemOverview()** - Visão geral do sistema
- **useRealTimeMetrics()** - Métricas em tempo real

Cada hook retorna:
```typescript
{
  data: any,           // Dados da API
  loading: boolean,    // Estado de carregamento
  error: string | null, // Mensagem de erro
  refetch: () => Promise<void> // Função para recarregar
}
```

#### Componentes de Analytics

1. **Analytics.tsx** - Página principal com tabs:
   - Engajamento
   - Compliance
   - Executivo
   - ROI
   - Segurança

2. **RealTimeMetrics.tsx** - Métricas atualizadas em tempo real
3. **ComplianceReports.tsx** - Relatórios detalhados de compliance
4. **ExecutiveDashboard.tsx** - Visão executiva consolidada

## Configuração e Uso

### Configuração do Backend

1. O serviço `AnalyticsService` inicializa dados mock para desenvolvimento
2. O controller `AnalyticsController` gerencia as requisições e respostas
3. As rotas estão configuradas em `/api/analytics/*`

### Configuração do Frontend

1. Importe o hook: `import { useAnalytics } from '@/hooks/useAnalytics'`
2. Use os hooks específicos: `const dashboard = analytics.useDashboard()`
3. Acesse os dados: `dashboard.data`, `dashboard.loading`, `dashboard.error`

### Exemplo de Uso

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const MyComponent = () => {
  const analytics = useAnalytics();
  const dashboard = analytics.useDashboard();
  
  if (dashboard.loading) return <div>Carregando...</div>;
  if (dashboard.error) return <div>Erro: {dashboard.error}</div>;
  
  return (
    <div>
      <h1>Total de Projetos: {dashboard.data?.totalProjects}</h1>
      <h2>Usuários Ativos: {dashboard.data?.activeUsers}</h2>
    </div>
  );
};
```

## Funcionalidades Implementadas

### ✅ Concluído

- [x] API Backend completa com endpoints de analytics
- [x] Serviço de dados com mock data para desenvolvimento
- [x] Controller com tratamento de erros e autenticação
- [x] Cliente API frontend com interceptadores
- [x] Hook personalizado useAnalytics
- [x] Página Analytics com interface completa
- [x] Integração frontend-backend funcionando
- [x] Tratamento de estados de loading e erro
- [x] Suporte a métricas em tempo real
- [x] Exportação de relatórios

### 🔄 Melhorias Futuras

- [ ] Implementar cache de dados
- [ ] Adicionar filtros avançados
- [ ] Implementar notificações push
- [ ] Adicionar mais tipos de gráficos
- [ ] Implementar dashboard personalizável
- [ ] Adicionar exportação em PDF
- [ ] Implementar analytics offline

## Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- ES6 Modules
- WebSocket (para tempo real)

### Frontend
- React 18
- TypeScript
- Custom Hooks
- Recharts (para gráficos)
- Tailwind CSS
- Lucide React (ícones)

## Estrutura de Dados

### Dashboard Analytics
```json
{
  "totalProjects": 156,
  "activeUsers": 42,
  "completedTrainings": 89,
  "complianceRate": 94.5,
  "monthlyGrowth": 12.3,
  "weeklyActiveUsers": 156,
  "monthlyActiveUsers": 342,
  "avgSessionTime": 25.4
}
```

### Engagement Metrics
```json
{
  "averageViewTime": 15.5,
  "completionRate": 87.3,
  "interactionsPerUser": 12.8,
  "activeSessions": 45,
  "bounceRate": 23.1
}
```

### Compliance Reporting
```json
{
  "overallCompliance": 94.5,
  "nrCompliance": {
    "NR-10": 98.2,
    "NR-35": 91.7,
    "NR-33": 89.4
  },
  "pendingCertifications": 12,
  "expiringSoon": 8
}
```

## Monitoramento e Logs

- Logs de erro são capturados no console do servidor
- Estados de loading são gerenciados automaticamente
- Erros de API são tratados graciosamente
- Métricas de performance são coletadas

## Segurança

- Autenticação via Bearer Token (quando disponível)
- CORS configurado para localhost:5173
- Validação de parâmetros de entrada
- Tratamento seguro de erros sem exposição de dados sensíveis

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0.0
**Status:** Produção