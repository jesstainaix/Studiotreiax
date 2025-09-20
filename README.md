# Sistema Avançado de Otimização de Performance

Um sistema completo de monitoramento, análise e otimização de performance para aplicações React, com Web Vitals, budgets, lazy loading, análise de bundle e A/B testing.

## ⚡ Quick Start

### Configuração Inicial

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas chaves de API
   ```

3. **Executar o projeto**:

   **Frontend (porta 3000)**:
   ```bash
   npm run dev
   ```

   **Backend API (porta 3001)**:
   ```bash
   node simple-server.js
   # ou para desenvolvimento com API completa:
   node api-server.js
   ```

### Status Atual
✅ **Frontend**: Vite + React + TypeScript (porta 3000)
✅ **Backend**: Express.js API server (porta 3001)
✅ **Health Check**: Disponível em `/api/health`
✅ **Dependências**: Todas instaladas com package-lock.json
✅ **Variáveis de Ambiente**: Arquivos .env e .env.example configurados

### Verificação de Saúde

```bash
curl http://localhost:3001/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "environment": "development",
  "uptime": 123.456
}
```

## 🚀 Funcionalidades

### 📊 Monitoramento de Performance
- **Web Vitals**: LCP, FID, CLS, FCP, TTFB
- **Métricas de Sistema**: CPU, memória, rede
- **Detecção de Memory Leaks**: Monitoramento automático
- **Alertas em Tempo Real**: Notificações de problemas

### ⚡ Otimizações Automáticas
- **Code Splitting**: Divisão inteligente de código
- **Lazy Loading**: Carregamento sob demanda
- **Cache Strategies**: Estratégias avançadas de cache
- **Bundle Analysis**: Análise e otimização de pacotes

### 📈 Análises e Relatórios
- **Performance Budgets**: Limites e alertas
- **Trending Analysis**: Análise de tendências
- **Relatórios Automáticos**: Geração de relatórios
- **A/B Testing**: Testes de otimizações

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Git

### Instalação Completa

```bash
# Clone o repositório
git clone [seu-repositorio]

# Entre no diretório
cd performance-optimization-system

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o desenvolvimento
npm run dev
## 📁 Estrutura do Projeto

```
/
├── src/                    # Código fonte do frontend
│   ├── components/         # Componentes React
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços e APIs
│   ├── utils/             # Utilitários
│   └── main.tsx           # Entry point
│   └── usePerformanceBudgets.ts          # Performance budgets e A/B testing
├── components/
│   └── performance/
│       ├── PerformanceDashboard.tsx      # Dashboard principal
│       ├── PerformanceOptimizationPanel.tsx  # Painel de otimização
│       └── PerformanceConfigPanel.tsx    # Configurações
├── utils/
│   ├── codeSplitting.ts                 # Utilitários de code splitting
│   ├── bundleAnalyzer.ts                # Analisador de bundle
│   ├── cacheManager.ts                  # Gerenciador de cache
│   └── performanceBudgets.ts            # Sistema de budgets
├── pages/
│   └── PerformancePage.tsx              # Página de demonstração
├── api/                    # Backend API (TypeScript)
│   ├── controllers/       # Controladores das rotas
│   ├── middleware/        # Middlewares Express
│   ├── routes/           # Definição de rotas
│   ├── services/         # Lógica de negócio
│   └── app.ts           # Configuração Express
├── assets/               # Assets estáticos
│   ├── images/          # Imagens do projeto
│   └── test-files/      # Arquivos de teste
├── coverage/            # Relatórios de cobertura
├── dist/               # Build de produção
├── docs/               # Documentação
├── .env                # Variáveis de ambiente (não versionado)
├── .env.example        # Exemplo de variáveis
├── simple-server.js    # Servidor backend simplificado
├── api-server.js       # Servidor API completo
├── package.json        # Dependências e scripts
├── vite.config.ts      # Configuração do Vite
└── App.tsx                              # Aplicação principal

public/
└── sw.js                                # Service Worker
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia frontend (Vite)
npm run dev:express      # Inicia servidor Express wrapper
npm run dev:vite        # Inicia apenas Vite

# Build e Preview
npm run build           # Build de produção
npm run preview         # Preview do build

# Testes
npm test                # Executa testes
npm run test:watch      # Testes em modo watch
npm run test:coverage   # Testes com cobertura

# Análise e Qualidade
npm run lint            # Verifica código com ESLint
npm run lint:fix        # Corrige problemas do ESLint
npm run type-check      # Verifica tipos TypeScript
npm run analyze         # Analisa bundle

# Performance
npm run performance:test  # Testa performance com Lighthouse
npm run performance:audit # Build + teste de performance
```

## 🔐 Configuração de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# API Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3001

# AI API Keys (opcional)
OPENAI_API_KEY=sua-chave-aqui
ANTHROPIC_API_KEY=sua-chave-aqui

# Outras configurações...
```

## 🎯 Como Usar

### 1. Hook Principal de Performance

```typescript
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization';

function App() {
  const performance = usePerformanceOptimization({
    monitoringInterval: 5000,
    enableAutoOptimization: true,
    enableMemoryLeakDetection: true
  });

  useEffect(() => {
    performance.startMonitoring();
  }, []);

  return (
    <div>
      {/* Sua aplicação */}
      <PerformanceIndicator metrics={performance.metrics} />
    </div>
  );
}
```

### 2. Lazy Loading Inteligente

```typescript
import { useLazyLoading } from './hooks/useLazyLoading';

function ComponentManager() {
  const lazyLoading = useLazyLoading({
    threshold: 0.1,
    preloadDistance: 200
  });

  const LazyComponent = lazyLoading.actions.createLazyComponent(
    () => import('./HeavyComponent'),
    { preload: true }
  );

  return <LazyComponent />;
}
```

### 3. Performance Budgets

```typescript
import { usePerformanceBudgets } from './hooks/usePerformanceBudgets';

function BudgetManager() {
  const budgets = usePerformanceBudgets({
    autoMonitoring: true,
    alertThreshold: 3
  });

  useEffect(() => {
    // Criar budget para LCP
    budgets.actions.createBudget({
      name: 'LCP Budget',
      metric: 'lcp',
      threshold: 2500,
      warning: 2000
    });
  }, []);

  return (
    <div>
      {budgets.state.violations.map(violation => (
        <Alert key={violation.id}>
          Budget violado: {violation.budgetName}
        </Alert>
      ))}
    </div>
  );
}
```

## 🚀 Deploy

### Produção

1. **Build do frontend**:
   ```bash
   npm run build
   ```

2. **Configurar servidor de produção**:
   - Configure as variáveis de ambiente de produção
   - Use um processo manager como PM2
   - Configure NGINX ou similar como proxy reverso

3. **Iniciar aplicação**:
   ```bash
   NODE_ENV=production node simple-server.js
   ```

## 📊 Monitoramento de Performance

O sistema inclui monitoramento automático de:

- **Web Vitals**: Métricas essenciais de UX
- **Resource Timing**: Tempo de carregamento de recursos
- **Long Tasks**: Tarefas que bloqueiam a thread principal
- **Memory Usage**: Uso de memória JavaScript
- **Network Information**: Informações de conexão

### Configuração de Performance

O monitoramento pode ser configurado através das variáveis de ambiente:

```env
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_LOG_LEVEL=error  # error, warn, info
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

### Cobertura de Código

```bash
npm run test:coverage
```

Os relatórios são gerados em `coverage/`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Notas de Desenvolvimento

### Problemas Conhecidos

1. **ESM Modules**: O projeto usa ES modules. Certifique-se de que seu ambiente suporta.
2. **Service Worker**: Apenas ativo em produção para evitar problemas de cache em desenvolvimento.
3. **Performance Monitoring**: Pode gerar muitos logs em desenvolvimento. Ajuste `PERFORMANCE_LOG_LEVEL` conforme necessário.

### Otimizações Aplicadas

1. **Code Splitting**: Configurado no Vite para dividir vendor chunks
2. **Lazy Loading**: Componentes carregados sob demanda
3. **Tree Shaking**: Remoção automática de código não utilizado
4. **Compression**: Gzip/Brotli em produção

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- React Team pela excelente biblioteca
- Vite pela ferramenta de build ultrarrápida
- Comunidade open source pelos pacotes utilizados

  return (
    <div>
      {budgets.state.violations.map(violation => (
        <Alert key={violation.id}>
          Budget violado: {violation.budgetName}
        </Alert>
      ))}
    </div>
  );
}
```

### 4. Bundle Analysis

```typescript
import { useBundleAnalysis } from './hooks/useBundleAnalysis';

function BundleOptimizer() {
  const bundle = useBundleAnalysis({
    autoAnalysis: true,
    autoOptimization: false
  });

  const optimizeBundle = async () => {
    await bundle.actions.analyzeBundle();
    await bundle.actions.optimizeBundle();
  };

  return (
    <div>
      <p>Bundle Size: {bundle.state.analysis?.totalSize} bytes</p>
      <p>Score: {bundle.state.analysis?.score}/100</p>
      <button onClick={optimizeBundle}>Otimizar</button>
    </div>
  );
}
```

## 🔧 Configuração Avançada

### Service Worker

O Service Worker implementa estratégias avançadas de cache:

- **Cache First**: Para recursos estáticos
- **Network First**: Para APIs
- **Stale While Revalidate**: Para conteúdo dinâmico
- **Limpeza Automática**: Remove entradas antigas

### Performance Budgets

Configure limites para métricas importantes:

```typescript
const budgetConfig = {
  lcp: { threshold: 2500, warning: 2000 },
  fid: { threshold: 100, warning: 75 },
  cls: { threshold: 0.1, warning: 0.05 },
  bundleSize: { threshold: 1000000, warning: 800000 }
};
```

### A/B Testing

Teste otimizações com grupos de controle:

```typescript
const abTest = {
  name: 'Lazy Loading Test',
  variants: [
    { id: 'control', trafficPercentage: 50 },
    { id: 'lazy', trafficPercentage: 50 }
  ],
  metrics: ['lcp', 'fid'],
  duration: 7 * 24 * 60 * 60 * 1000 // 7 dias
};
```

## 📊 Métricas Coletadas

### Web Vitals
- **LCP (Largest Contentful Paint)**: Tempo para carregar o maior elemento
- **FID (First Input Delay)**: Tempo de resposta à primeira interação
- **CLS (Cumulative Layout Shift)**: Estabilidade visual
- **FCP (First Contentful Paint)**: Tempo para primeiro conteúdo
- **TTFB (Time to First Byte)**: Tempo para primeiro byte

### Sistema
- **CPU Usage**: Uso de processador
- **Memory Usage**: Uso de memória
- **Network**: Latência e throughput
- **Cache**: Taxa de acerto e tamanho

### Bundle
- **Total Size**: Tamanho total do bundle
- **Chunk Analysis**: Análise de chunks
- **Dependencies**: Dependências duplicadas
- **Unused Code**: Código não utilizado

## 🎨 Interface de Usuário

### Dashboard Principal
- Visão geral das métricas
- Gráficos em tempo real
- Alertas e notificações
- Ações rápidas

### Painel de Otimização
- Análises detalhadas
- Recomendações automáticas
- Histórico de otimizações
- Comparações de performance

### Configurações
- Budgets de performance
- Configuração de A/B tests
- Estratégias de cache
- Intervalos de monitoramento

## 🔍 Debugging e Troubleshooting

### Logs de Performance
```typescript
// Habilitar logs detalhados
performance.enableDebugMode(true);

// Verificar métricas atuais
console.log('Métricas:', performance.metrics);

// Verificar problemas detectados
console.log('Problemas:', performance.issues);
```

### Análise de Memory Leaks
```typescript
// Verificar vazamentos de memória
const leaks = performance.detectMemoryLeaks();
console.log('Memory Leaks:', leaks);

// Forçar garbage collection (dev only)
if (window.gc) {
  window.gc();
}
```

### Cache Debugging
```typescript
// Verificar status do cache
const cacheStats = await cacheManager.getStats();
console.log('Cache Stats:', cacheStats);

// Limpar cache específico
await cacheManager.clearCache('api');
```

## 📈 Relatórios

### Relatório Automático
```typescript
const report = performance.generateReport();

// Exportar como PDF
const pdf = await performance.exportReportAsPDF(report);

// Exportar como JSON
const json = performance.exportReportAsJSON(report);
```

### Métricas Históricas
```typescript
// Obter tendências
const trends = performance.getTrends(30); // últimos 30 dias

// Comparar períodos
const comparison = performance.comparePeriods(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

## 🚀 Otimizações Recomendadas

### 1. Code Splitting
- Divida componentes grandes em chunks menores
- Use lazy loading para rotas
- Implemente preloading inteligente

### 2. Cache Strategy
- Configure TTL apropriado para cada tipo de recurso
- Use Service Worker para cache offline
- Implemente invalidação de cache inteligente

### 3. Bundle Optimization
- Remova dependências não utilizadas
- Use tree shaking
- Otimize imagens e assets

### 4. Performance Monitoring
- Configure budgets realistas
- Monitore tendências de longo prazo
- Use A/B testing para validar otimizações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação
- Verifique os exemplos de uso

---

**Desenvolvido com ❤️ para otimizar a performance de aplicações React**