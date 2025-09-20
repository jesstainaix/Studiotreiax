# Sistema de Fallback TTS

## Visão Geral

O Sistema de Fallback TTS é uma solução robusta que garante alta disponibilidade para síntese de voz, utilizando múltiplos provedores com fallback automático. O sistema tenta usar ElevenLabs como provedor principal e, em caso de falha, utiliza Google Cloud Text-to-Speech como backup.

## Arquitetura

### Componentes Principais

1. **FallbackTTSService** (`src/services/fallback-tts-service.ts`)
   - Serviço principal que gerencia o fallback entre provedores
   - Implementa retry automático e logging detalhado
   - Integra com o EnhancedTTSService para funcionalidades avançadas

2. **EnhancedTTSService** (`src/services/enhanced-tts-service.ts`)
   - Serviço base que suporta múltiplos provedores TTS
   - Inclui cache, retry e configurações avançadas
   - Suporte para ElevenLabs, Google Cloud TTS e Azure

3. **useFallbackTTS Hook** (`src/hooks/useFallbackTTS.ts`)
   - Hook React para integração fácil com componentes
   - Gerencia estado de loading, erro e reprodução
   - Fornece estatísticas e logs em tempo real

4. **TTSDemo Component** (`src/components/tts/TTSDemo.tsx`)
   - Componente de demonstração com interface completa
   - Exibe logs, métricas e status dos provedores
   - Permite teste de todas as funcionalidades

### Fluxo de Fallback

```
1. Requisição TTS recebida
2. Tentativa com ElevenLabs (provedor principal)
3. Se falhar → Tentativa com Google Cloud TTS (fallback)
4. Se ambos falharem → Retorna erro
5. Log detalhado de todas as tentativas
```

## Configuração

### Variáveis de Ambiente

```env
# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Google Cloud TTS
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
```

### Configuração do Serviço

```typescript
const config: FallbackTTSConfig = {
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY!,
    defaultVoice: 'Rachel',
    retries: 2
  },
  googleCloud: {
    apiKey: process.env.GOOGLE_CLOUD_API_KEY!,
    defaultVoice: 'pt-BR-Standard-A',
    timeout: 15000
  },
  fallbackProvider: 'google',
  cacheEnabled: true
};

const ttsService = new FallbackTTSService(config);
```

## Uso

### Com React Hook

```typescript
import { useFallbackTTS } from '../hooks/useFallbackTTS';

function MyComponent() {
  const tts = useFallbackTTS();
  
  const handleSpeak = async () => {
    const response = await tts.synthesize('Olá mundo!', {
      language: 'pt-BR',
      speed: 1.0
    });
    
    if (response?.success && response.audioUrl) {
      await tts.play(response.audioUrl);
    }
  };
  
  return (
    <div>
      <button onClick={handleSpeak} disabled={tts.isLoading}>
        {tts.isLoading ? 'Sintetizando...' : 'Falar'}
      </button>
      
      {tts.error && <p>Erro: {tts.error}</p>}
      
      {/* Estatísticas */}
      <div>
        <p>Taxa de Sucesso: {tts.getStats().successRate.toFixed(1)}%</p>
        <p>Total de Requisições: {tts.getStats().totalRequests}</p>
      </div>
    </div>
  );
}
```

### Uso Direto do Serviço

```typescript
import { FallbackTTSService } from '../services/fallback-tts-service';

const ttsService = new FallbackTTSService(config);

// Síntese com fallback automático
const response = await ttsService.synthesize('Texto para sintetizar', {
  language: 'pt-BR',
  voice: 'Rachel',
  speed: 1.2
});

if (response.success) {
  console.log('Provedor usado:', response.finalProvider);
  console.log('Fallback usado:', response.fallbackUsed);
  console.log('Tentativas:', response.totalAttempts);
  
  // Reproduzir áudio
  const audio = new Audio(response.audioUrl);
  await audio.play();
}
```

## Monitoramento e Logs

### Logs de Tentativas

Cada síntese gera logs detalhados:

```typescript
{
  provider: 'elevenlabs',
  success: false,
  duration: 5000,
  error: 'API rate limit exceeded',
  timestamp: '2024-01-15T10:30:00Z',
  voiceUsed: 'Rachel'
}
```

### Estatísticas

O sistema mantém estatísticas em tempo real:

```typescript
{
  totalRequests: 150,
  successRate: 94.7,
  providerStats: {
    elevenlabs: { attempts: 150, successes: 135 },
    google: { attempts: 15, successes: 15 }
  },
  recentLogs: [...] // Últimos 50 logs
}
```

### Health Check

```typescript
// Verificar status dos provedores
const status = await ttsService.healthCheck();
console.log(status); // { elevenlabs: true, google: true }
```

## Tratamento de Erros

### Tipos de Erro

1. **Erro de Configuração**: API keys inválidas ou ausentes
2. **Erro de Rede**: Timeout ou falha de conexão
3. **Erro de API**: Rate limit, quota excedida, etc.
4. **Erro de Validação**: Texto vazio ou muito longo

### Estratégias de Recuperação

- **Retry Automático**: Até 2 tentativas por provedor
- **Fallback**: Troca automática para provedor secundário
- **Cache**: Reutilização de sínteses anteriores
- **Graceful Degradation**: Falha controlada com logs detalhados

## Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes do fallback
npm test -- fallback-tts-service.test.ts

# Com coverage
npm run test:coverage
```

### Cenários Testados

- ✅ Síntese bem-sucedida com provedor principal
- ✅ Fallback automático quando provedor principal falha
- ✅ Tratamento de erros de configuração
- ✅ Validação de entrada (texto vazio/longo)
- ✅ Health check de provedores
- ✅ Logs e estatísticas
- ✅ Cache de sínteses

## Performance

### Otimizações Implementadas

1. **Cache Inteligente**: Evita sínteses duplicadas
2. **Timeout Configurável**: Evita travamentos
3. **Retry com Backoff**: Reduz carga em APIs com problemas
4. **Lazy Loading**: Componentes carregados sob demanda

### Métricas Típicas

- **ElevenLabs**: 2-4 segundos (alta qualidade)
- **Google Cloud**: 1-2 segundos (boa qualidade)
- **Fallback**: +500ms overhead
- **Cache Hit**: <100ms

## Troubleshooting

### Problemas Comuns

1. **"API key not configured"**
   - Verificar variáveis de ambiente
   - Confirmar formato das chaves

2. **"Rate limit exceeded"**
   - Aguardar reset do limite
   - Considerar upgrade do plano

3. **"Fallback always used"**
   - Verificar conectividade com ElevenLabs
   - Validar API key do ElevenLabs

4. **"No audio output"**
   - Verificar permissões do navegador
   - Testar com diferentes navegadores

### Debug

```typescript
// Habilitar logs detalhados
const tts = useFallbackTTS({ debug: true });

// Verificar último erro
console.log(tts.lastResponse?.attemptLogs);

// Health check manual
const status = await tts.healthCheck();
console.log('Provider status:', status);
```

## Roadmap

### Próximas Funcionalidades

- [ ] Suporte a Azure Cognitive Services
- [ ] Cache persistente (localStorage/IndexedDB)
- [ ] Métricas avançadas (latência P95, P99)
- [ ] Dashboard de monitoramento
- [ ] Configuração dinâmica de provedores
- [ ] Suporte a streaming de áudio

### Melhorias Planejadas

- [ ] Otimização de bundle size
- [ ] Suporte a Web Workers
- [ ] Fallback baseado em qualidade de rede
- [ ] Integração com analytics

## Contribuição

### Estrutura de Arquivos

```
src/
├── services/
│   ├── fallback-tts-service.ts     # Serviço principal
│   ├── enhanced-tts-service.ts     # Serviço base
│   └── tts-providers/              # Implementações específicas
├── hooks/
│   └── useFallbackTTS.ts          # Hook React
├── components/
│   └── tts/
│       └── TTSDemo.tsx            # Componente demo
└── __tests__/
    └── fallback-tts-service.test.ts # Testes
```

### Guidelines

1. Manter cobertura de testes > 90%
2. Documentar todas as APIs públicas
3. Seguir padrões TypeScript rigorosos
4. Implementar tratamento de erro robusto
5. Otimizar para performance e UX

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Autor**: Sistema TTS Team