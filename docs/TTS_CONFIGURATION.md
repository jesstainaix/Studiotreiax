# Configuração do Sistema TTS

Este documento descreve como configurar e usar o sistema de Text-to-Speech (TTS) com múltiplos provedores.

## Visão Geral

O sistema TTS suporta os seguintes provedores:
- **ElevenLabs** - TTS premium com vozes realistas
- **Google Cloud TTS** - Serviço robusto do Google
- **Azure Speech Services** - Solução da Microsoft
- **Browser Speech Synthesis** - API nativa do navegador (fallback)

## Configuração de Ambiente

### 1. Arquivo .env

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Google Cloud TTS Configuration
GOOGLE_CLOUD_TTS_API_KEY=your_google_api_key_here
GOOGLE_CLOUD_TTS_PROJECT_ID=your_project_id

# Azure Speech Services Configuration
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region

# TTS Service Configuration
TTS_DEFAULT_PROVIDER=browser
TTS_RETRY_ATTEMPTS=3
TTS_TIMEOUT_MS=30000
TTS_ENABLE_FALLBACK=true
```

### 2. Configuração por Provedor

#### ElevenLabs

**Pré-requisitos:**
- Conta no ElevenLabs
- API Key válida
- Créditos disponíveis

**Configuração:**
1. Acesse [ElevenLabs](https://elevenlabs.io)
2. Crie uma conta ou faça login
3. Vá para Profile → API Keys
4. Copie sua API Key
5. Adicione no arquivo `.env`:
   ```env
   ELEVENLABS_API_KEY=sk-your-api-key-here
   ```

**Modelos Disponíveis:**
- `eleven_multilingual_v2` - Melhor qualidade, suporte multilíngue
- `eleven_monolingual_v1` - Apenas inglês, mais rápido
- `eleven_turbo_v2` - Mais rápido, qualidade boa

**Vozes Populares:**
- `21m00Tcm4TlvDq8ikWAM` - Rachel (feminina, inglês)
- `AZnzlk1XvdvUeBnXmlld` - Domi (feminina, inglês)
- `EXAVITQu4vr4xnSDxMaL` - Bella (feminina, inglês)
- `ErXwobaYiN019PkySvjV` - Antoni (masculina, inglês)

#### Google Cloud TTS

**Pré-requisitos:**
- Conta no Google Cloud Platform
- Projeto com Cloud TTS API habilitada
- API Key ou Service Account

**Configuração:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou selecione um existente
3. Habilite a Cloud Text-to-Speech API
4. Crie uma API Key:
   - Vá para APIs & Services → Credentials
   - Clique em "Create Credentials" → "API Key"
   - Copie a chave gerada
5. Adicione no arquivo `.env`:
   ```env
   GOOGLE_CLOUD_TTS_API_KEY=your-api-key-here
   GOOGLE_CLOUD_TTS_PROJECT_ID=your-project-id
   ```

**Vozes Populares (Português):**
- `pt-BR-Standard-A` - Feminina
- `pt-BR-Standard-B` - Masculina
- `pt-BR-Wavenet-A` - Feminina (WaveNet)
- `pt-BR-Wavenet-B` - Masculina (WaveNet)

#### Azure Speech Services

**Pré-requisitos:**
- Conta no Microsoft Azure
- Recurso Speech Services criado
- Chave de assinatura

**Configuração:**
1. Acesse [Azure Portal](https://portal.azure.com)
2. Crie um recurso "Speech Services"
3. Após criado, vá para "Keys and Endpoint"
4. Copie uma das chaves e a região
5. Adicione no arquivo `.env`:
   ```env
   AZURE_SPEECH_KEY=your-speech-key-here
   AZURE_SPEECH_REGION=your-region
   ```

**Vozes Populares (Português):**
- `pt-BR-FranciscaNeural` - Feminina
- `pt-BR-AntonioNeural` - Masculina
- `pt-BR-BrendaNeural` - Feminina
- `pt-BR-DonatoNeural` - Masculina

#### Browser Speech Synthesis

**Pré-requisitos:**
- Navegador moderno com suporte a Web Speech API
- Nenhuma configuração adicional necessária

**Características:**
- Funciona offline
- Vozes dependem do sistema operacional
- Qualidade variável
- Usado como fallback automático

## Uso do Sistema

### 1. Usando o Hook useTTS

```typescript
import { useTTS } from '../hooks/useTTS';

function MyComponent() {
  const {
    synthesize,
    isLoading,
    providers,
    currentProvider,
    setProvider
  } = useTTS({
    defaultProvider: 'elevenlabs',
    defaultLanguage: 'pt-BR',
    autoPlay: true
  });

  const handleSpeak = async () => {
    await synthesize('Olá, mundo!', {
      voice: 'pt-BR-Standard-A',
      speed: 1.0,
      pitch: 0.0
    });
  };

  return (
    <div>
      <button onClick={handleSpeak} disabled={isLoading}>
        {isLoading ? 'Sintetizando...' : 'Falar'}
      </button>
    </div>
  );
}
```

### 2. Usando o Serviço Diretamente

```typescript
import { ttsService } from '../services/ttsService';

// Sintetizar fala
const response = await ttsService.synthesizeSpeech({
  text: 'Olá, mundo!',
  provider: 'elevenlabs',
  voice: '21m00Tcm4TlvDq8ikWAM',
  language: 'pt-BR',
  speed: 1.0,
  pitch: 0.0
});

if (response.success) {
  // Reproduzir áudio
  const audio = new Audio(response.audioUrl);
  audio.play();
}
```

### 3. Verificando Status dos Provedores

```typescript
// Verificar se um provedor está disponível
const isAvailable = await ttsService.checkProviderHealth('elevenlabs');

// Obter todos os provedores disponíveis
const providers = ttsService.getAvailableProviders();

// Obter vozes de um provedor
const voices = ttsService.getVoicesForProvider('google');
```

## Sistema de Fallback

O sistema implementa fallback automático na seguinte ordem:

1. **Provedor Preferido** - Definido pelo usuário
2. **ElevenLabs** - Se disponível e configurado
3. **Google Cloud TTS** - Se disponível e configurado
4. **Azure Speech** - Se disponível e configurado
5. **Browser Speech** - Sempre disponível como último recurso

### Configuração do Fallback

```env
# Habilitar/desabilitar fallback automático
TTS_ENABLE_FALLBACK=true

# Ordem de prioridade (separado por vírgula)
TTS_FALLBACK_ORDER=elevenlabs,google,azure,browser

# Número de tentativas antes do fallback
TTS_RETRY_ATTEMPTS=3

# Timeout por tentativa (ms)
TTS_TIMEOUT_MS=30000
```

## Componentes de Interface

### TTSConfigPanel

Componente para configuração e teste dos provedores:

```typescript
import { TTSConfigPanel } from '../components/tts/TTSConfigPanel';

function SettingsPage() {
  return (
    <div>
      <h1>Configurações TTS</h1>
      <TTSConfigPanel />
    </div>
  );
}
```

### TTSTestComponent

Componente para testar a síntese de voz:

```typescript
import { TTSTestComponent } from '../components/tts/TTSTestComponent';

function TestPage() {
  return (
    <div>
      <h1>Teste TTS</h1>
      <TTSTestComponent />
    </div>
  );
}
```

## Troubleshooting

### Problemas Comuns

#### 1. ElevenLabs não funciona
- Verifique se a API Key está correta
- Confirme se há créditos disponíveis
- Teste a API Key diretamente no site

#### 2. Google Cloud TTS falha
- Verifique se a API está habilitada no projeto
- Confirme se a API Key tem permissões corretas
- Verifique se o projeto ID está correto

#### 3. Azure Speech não responde
- Verifique se a chave e região estão corretas
- Confirme se o recurso está ativo
- Teste a conectividade com a região especificada

#### 4. Browser Speech não funciona
- Verifique se o navegador suporta Web Speech API
- Teste em navegador diferente
- Verifique se há vozes instaladas no sistema

### Logs e Debugging

Para habilitar logs detalhados:

```env
# Habilitar logs de debug
TTS_DEBUG=true
TTS_LOG_LEVEL=debug
```

Os logs aparecerão no console do navegador e incluirão:
- Tentativas de síntese
- Falhas e fallbacks
- Tempos de resposta
- Uso de créditos/cotas

### Monitoramento

O sistema fornece métricas úteis:

```typescript
// Obter estatísticas de uso
const stats = ttsService.getUsageStats();
console.log(stats);
// {
//   totalRequests: 150,
//   successfulRequests: 145,
//   failedRequests: 5,
//   providerUsage: {
//     elevenlabs: 100,
//     google: 30,
//     azure: 15,
//     browser: 5
//   },
//   averageResponseTime: 1200
// }
```

## Custos e Limites

### ElevenLabs
- **Gratuito**: 10.000 caracteres/mês
- **Starter**: $5/mês - 30.000 caracteres
- **Creator**: $22/mês - 100.000 caracteres
- **Pro**: $99/mês - 500.000 caracteres

### Google Cloud TTS
- **Gratuito**: 1 milhão caracteres/mês (Standard)
- **Standard**: $4.00 por 1 milhão caracteres
- **WaveNet**: $16.00 por 1 milhão caracteres
- **Neural2**: $16.00 por 1 milhão caracteres

### Azure Speech Services
- **Gratuito**: 500.000 caracteres/mês
- **Standard**: $4.00 por 1 milhão caracteres
- **Neural**: $16.00 por 1 milhão caracteres

### Browser Speech
- **Gratuito**: Sem limites
- **Offline**: Funciona sem internet

## Segurança

### Proteção de API Keys

1. **Nunca** commite API keys no código
2. Use variáveis de ambiente
3. Configure `.env` no `.gitignore`
4. Use diferentes keys para dev/prod
5. Rotacione keys regularmente

### Validação de Entrada

O sistema valida automaticamente:
- Tamanho máximo do texto
- Caracteres permitidos
- Parâmetros de voz
- Rate limiting

### Rate Limiting

```env
# Configurar limites de uso
TTS_RATE_LIMIT_REQUESTS=100
TTS_RATE_LIMIT_WINDOW=3600000  # 1 hora em ms
TTS_MAX_TEXT_LENGTH=5000
```

## Contribuição

Para adicionar novos provedores:

1. Implemente a interface `TTSProvider`
2. Adicione configurações no `.env.example`
3. Atualize a documentação
4. Adicione testes
5. Submeta um Pull Request

## Suporte

Para suporte técnico:
- Abra uma issue no repositório
- Inclua logs de erro
- Descreva os passos para reproduzir
- Informe versões do navegador/sistema

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0