# Configuração de Limites da API OpenAI

## Visão Geral

Este documento descreve as configurações de limites da API OpenAI e como gerenciar quotas para evitar erros de rate limiting.

## Configurações no .env

### Variáveis Obrigatórias

```env
# OpenAI API Configuration
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### Verificação de Configuração

1. **Chave da API válida**: Deve começar com `sk-` e não conter placeholders
2. **Conta ativa**: Verificar se a conta OpenAI está ativa e com créditos
3. **Permissões**: Confirmar acesso ao modelo GPT-4 Vision

## Limites Implementados

### Rate Limiting

- **Máximo**: 3 requisições por minuto
- **Janela**: 60 segundos
- **Bloqueio**: 5 minutos após exceder limite

### Cache Local

- **Duração**: 24 horas por análise
- **Limpeza**: Automática a cada hora
- **Armazenamento**: localStorage do navegador

## Tratamento de Erros

### Erro 429 - Quota Excedida

```
🚫 OpenAI API quota exceeded (Error 429)
```

**Soluções:**
1. Aguardar renovação automática da quota
2. Verificar limites da conta no dashboard OpenAI
3. Considerar upgrade do plano

### Erro 401 - Autenticação

```
🔑 OpenAI API authentication failed
```

**Soluções:**
1. Verificar se a chave da API está correta
2. Confirmar se a chave não expirou
3. Regenerar chave se necessário

### Erro 403 - Acesso Negado

```
🚫 OpenAI API access forbidden
```

**Soluções:**
1. Verificar permissões da conta
2. Confirmar acesso ao modelo GPT-4
3. Contatar suporte OpenAI se necessário

## Monitoramento

### Logs do Console

- `✅ Using cached analysis`: Resultado do cache
- `⏳ Rate limit reached`: Limite atingido
- `🚫 Rate limiter activated`: Bloqueio ativado
- `✅ GPT-4 Vision analysis completed`: Sucesso

### Verificação de Status

1. Abrir DevTools do navegador
2. Verificar aba Console
3. Procurar por mensagens de erro ou aviso

## Configuração de Billing

### Dashboard OpenAI

1. Acessar [platform.openai.com](https://platform.openai.com)
2. Ir para "Usage" → "Billing"
3. Verificar:
   - Créditos disponíveis
   - Limites de rate
   - Histórico de uso

### Limites Recomendados

- **Desenvolvimento**: $5-10/mês
- **Produção**: $20-50/mês
- **Enterprise**: Contato direto

## Fallbacks Implementados

### Análise Básica

Quando a API não está disponível:
- Detecção por nome do arquivo
- Análise de texto básica
- Sugestões genéricas

### Cache Inteligente

- Evita requisições desnecessárias
- Melhora performance
- Reduz custos da API

## Troubleshooting

### Problema: Análise sempre usa fallback

**Verificar:**
1. Chave da API no .env
2. Conexão com internet
3. Status da conta OpenAI

### Problema: Rate limit muito frequente

**Soluções:**
1. Aguardar entre uploads
2. Usar cache existente
3. Considerar upgrade do plano

### Problema: Erros de autenticação

**Verificar:**
1. Formato da chave (sk-...)
2. Validade da chave
3. Permissões da conta

## Contato e Suporte

- **OpenAI Support**: [help.openai.com](https://help.openai.com)
- **Documentação**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Status**: [status.openai.com](https://status.openai.com)