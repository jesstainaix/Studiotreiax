# 📝 TEMPLATE PARA ATUALIZAÇÕES DE PROGRESSO

## Como Atualizar os Documentos

### Quando uma tarefa é iniciada:

1. **Atualize o TRACKING_PROGRESSO_EDITOR_VIDEO.md:**
   - Mude status de "❌ NÃO INICIADO" para "🚧 EM PROGRESSO"
   - Adicione data de início
   - Adicione responsável
   - Atualize progresso da fase

2. **Adicione entrada no log de atualizações:**
   ```markdown
   ### [DATA] - Iniciada Tarefa X.Y
   - 🚧 Tarefa X.Y iniciada por [RESPONSÁVEL]
   - ⏰ Prazo estimado: [DATA]
   - 📋 Dependências: [LISTA]
   ```

### Quando uma tarefa é concluída:

1. **Atualize o TRACKING_PROGRESSO_EDITOR_VIDEO.md:**
   - Mude status para "✅ CONCLUÍDO"
   - Adicione data de fim real
   - Atualize progresso (exemplo: 1/4 tarefas -> 25%)
   - Marque critérios de conclusão se aplicável

2. **Adicione entrada no log:**
   ```markdown
   ### [DATA] - Concluída Tarefa X.Y
   - ✅ Tarefa X.Y finalizada por [RESPONSÁVEL]
   - 🎯 Entregue: [RESUMO DO QUE FOI FEITO]
   - ⏱️ Tempo real vs estimado: [COMPARAÇÃO]
   - 🔗 PR/Commit: [LINK]
   ```

### Quando uma fase é concluída:

1. **Atualize ambos os documentos:**
   - Marque fase como "✅ CONCLUÍDO" 
   - Adicione data de fim real
   - Marque todos os critérios de conclusão
   - Atualize progresso geral

2. **Adicione entrada especial no log:**
   ```markdown
   ### [DATA] - ✅ FASE X CONCLUÍDA
   - 🎉 Fase X totalmente finalizada
   - 👥 Equipe: [LISTA DE RESPONSÁVEIS]
   - 📊 Resultado: [MÉTRICAS DE SUCESSO]
   - 🔄 Próximos passos: Iniciando Fase X+1
   - 📸 Screenshots/demos: [LINKS]
   ```

### Quando há bloqueios:

1. **Marque tarefa como "❌ BLOQUEADO"**
2. **Adicione na seção de notas:**
   ```markdown
   ### Bloqueios Ativos
   - **Tarefa X.Y:** Bloqueada por [MOTIVO]
   - **Ação necessária:** [O QUE PRECISA SER FEITO]
   - **Responsável:** [QUEM DEVE RESOLVER]
   - **Prazo:** [QUANDO DEVE SER RESOLVIDO]
   ```

## Exemplo de Atualização Completa

### Cenário: Tarefa 1.1 foi concluída

**No TRACKING_PROGRESSO_EDITOR_VIDEO.md:**

```markdown
#### 1.1 Corrigir Import de Mídia
- **Status:** ✅ CONCLUÍDO
- **Prioridade:** 🚨 CRÍTICO
- **Estimativa:** 3-4 dias
- **Progresso:** 100%
- **Responsável:** João Silva
- **Início:** 20/09/2025
- **Fim Previsto:** 24/09/2025
- **Fim Real:** 23/09/2025
- **Arquivos:** `src/components/video-editor/MediaLibrary/MediaLibrary.tsx`
- **Notas:** Implementado drag & drop e validação. PR #123 merged.
```

**E atualizar resumo da fase:**
```markdown
- **Progresso:** 1/4 tarefas concluídas (25%)
```

**No log de atualizações:**
```markdown
### 23/09/2025 - ✅ Concluída Tarefa 1.1
- ✅ Import de mídia totalmente funcional por João Silva
- 🎯 Entregue: Upload de arquivos, drag & drop, validação de tipos
- ⏱️ Tempo real vs estimado: 3 dias vs 3-4 dias (dentro do prazo)
- 🔗 PR: #123
- 📋 Próximo: Iniciar tarefa 1.2 (Progress Indicators)
```

## Checklist Para Cada Atualização

### ✅ Antes de commitar a atualização:
- [ ] Status da tarefa atualizado
- [ ] Datas preenchidas corretamente
- [ ] Progresso da fase recalculado
- [ ] Entrada no log adicionada
- [ ] Links para PRs/commits incluídos
- [ ] Screenshots ou demos anexados (se aplicável)
- [ ] Próximos passos definidos
- [ ] Bloqueios documentados (se houver)

### ✅ Para conclusão de fase:
- [ ] Todos os critérios de conclusão verificados
- [ ] Testes de aceitação passaram
- [ ] Documentação atualizada
- [ ] Demo funcional preparada
- [ ] Métricas de sucesso atingidas
- [ ] Retrospectiva da fase documentada
- [ ] Preparação para próxima fase iniciada

## Scripts de Automação (Opcional)

### Script para atualizar progresso:
```bash
#!/bin/bash
# update_progress.sh
# Uso: ./update_progress.sh [fase] [tarefa] [status] [responsavel]

FASE=$1
TAREFA=$2
STATUS=$3
RESPONSAVEL=$4
DATA=$(date +"%d/%m/%Y")

echo "Atualizando Fase $FASE, Tarefa $TAREFA para $STATUS por $RESPONSAVEL em $DATA"
# Lógica de atualização dos arquivos aqui
```

### Commit message padrão:
```
feat(editor): [FASE X.Y] - [TÍTULO DA TAREFA]

- Status: [STATUS]
- Responsável: [NOME]
- Entregue: [RESUMO]

Refs: #issue-number
```

---

**💡 Dica:** Mantenha as atualizações frequentes e detalhadas. Isso ajuda no tracking do progresso e na identificação precoce de problemas.