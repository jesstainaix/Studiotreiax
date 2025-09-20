# PROMPT PARA ANÁLISE SISTEMÁTICA E IMPLEMENTAÇÃO COMPLETA DO PROJETO ESTUDIO_IA_VIDEOS

## 1. Visão Geral do Processo

### 1.1 Objetivo Principal
Este prompt foi desenvolvido para conduzir uma análise completa e sistemática do projeto estudio_ia_videos, garantindo que cada componente seja totalmente implementado, testado e livre de falhas através de um processo iterativo de melhoria contínua.

### 1.2 Metodologia de Execução
- **Análise Incremental**: Divisão do projeto em módulos para análise detalhada
- **Validação Contínua**: Verificação em cada etapa antes de prosseguir
- **Correção Iterativa**: Ciclos de identificação, correção e validação
- **Documentação Sistemática**: Registro detalhado de todas as alterações

## 2. FASE 1: ANÁLISE ARQUITETURAL E ESTRUTURAL

### 2.1 Prompt para Análise de Arquitetura
```
Analise a arquitetura completa do projeto estudio_ia_videos seguindo estes critérios:

1. **ESTRUTURA DE DIRETÓRIOS**:
   - Verifique a organização lógica de pastas e arquivos
   - Identifique inconsistências na estrutura
   - Valide se a separação de responsabilidades está clara
   - Critério de validação: Estrutura deve seguir padrões Next.js 14

2. **DEPENDÊNCIAS E CONFIGURAÇÕES**:
   - Analise package.json para dependências obsoletas ou conflitantes
   - Verifique configurações do TypeScript, ESLint, Tailwind
   - Valide arquivos de ambiente (.env)
   - Critério de validação: Zero vulnerabilidades de segurança

3. **ARQUITETURA DE COMPONENTES**:
   - Mapeie todos os componentes React e suas dependências
   - Identifique componentes órfãos ou não utilizados
   - Verifique padrões de design e reutilização
   - Critério de validação: 100% dos componentes devem ter propósito claro

4. **SISTEMA DE ROTEAMENTO**:
   - Analise todas as rotas da aplicação
   - Verifique middleware e proteções de rota
   - Valide navegação e fluxos de usuário
   - Critério de validação: Todas as rotas devem ser acessíveis e funcionais
```

### 2.2 Checklist de Validação Arquitetural
- [ ] Estrutura de pastas segue convenções Next.js
- [ ] Todas as dependências estão atualizadas e compatíveis
- [ ] Configurações de build estão otimizadas
- [ ] Sistema de tipos TypeScript está completo
- [ ] Não há imports circulares ou quebrados

## 3. FASE 2: ANÁLISE DE CÓDIGO E QUALIDADE

### 3.1 Prompt para Análise de Código
```
Execute uma análise detalhada do código seguindo estes parâmetros:

1. **QUALIDADE DO CÓDIGO**:
   - Verifique aderência aos padrões de codificação
   - Identifique code smells e anti-patterns
   - Analise complexidade ciclomática dos métodos
   - Critério de validação: Score de qualidade > 8.5/10

2. **PERFORMANCE E OTIMIZAÇÃO**:
   - Identifique gargalos de performance
   - Analise uso de memória e renderizações desnecessárias
   - Verifique lazy loading e code splitting
   - Critério de validação: Lighthouse score > 90 em todas as métricas

3. **SEGURANÇA**:
   - Analise vulnerabilidades de segurança
   - Verifique sanitização de inputs
   - Valide autenticação e autorização
   - Critério de validação: Zero vulnerabilidades críticas ou altas

4. **ACESSIBILIDADE**:
   - Verifique conformidade com WCAG 2.1
   - Analise navegação por teclado
   - Valide semântica HTML e ARIA labels
   - Critério de validação: Score de acessibilidade > 95
```

### 3.2 Ferramentas de Análise Recomendadas
- **ESLint**: Análise estática de código
- **SonarQube**: Qualidade e segurança
- **Lighthouse**: Performance e acessibilidade
- **Bundle Analyzer**: Análise de bundle size

## 4. FASE 3: ANÁLISE FUNCIONAL DETALHADA

### 4.1 Prompt para Análise de Funcionalidades
```
Analise cada funcionalidade do sistema seguindo esta metodologia:

1. **MAPEAMENTO DE FUNCIONALIDADES**:
   - Liste todas as funcionalidades implementadas
   - Identifique funcionalidades parcialmente implementadas
   - Verifique funcionalidades documentadas mas não implementadas
   - Critério de validação: 100% das funcionalidades documentadas devem estar implementadas

2. **FLUXOS DE USUÁRIO**:
   - Teste todos os fluxos principais de usuário
   - Verifique tratamento de casos extremos
   - Valide mensagens de erro e feedback
   - Critério de validação: Todos os fluxos devem ser completáveis sem erros

3. **INTEGRAÇÃO DE SISTEMAS**:
   - Teste todas as integrações externas (APIs, serviços)
   - Verifique tratamento de falhas de rede
   - Valide sincronização de dados
   - Critério de validação: 99.9% de disponibilidade das integrações

4. **GESTÃO DE ESTADO**:
   - Analise consistência do estado global
   - Verifique persistência de dados
   - Valide sincronização entre componentes
   - Critério de validação: Estado sempre consistente e previsível
```

### 4.2 Matriz de Funcionalidades
| Módulo | Funcionalidade | Status | Cobertura de Testes | Critério de Aceitação |
|--------|---------------|--------|-------------------|----------------------|
| Autenticação | Login/Logout | ✅ | 95% | Funciona em todos os browsers |
| Dashboard | Visualização | 🔄 | 70% | Carrega em < 2s |
| Editor | Criação de Vídeos | ❌ | 45% | Exporta sem erros |
| Avatares | Geração 3D | 🔄 | 60% | Renderiza em < 5s |

## 5. FASE 4: FRAMEWORK DE TESTES RIGOROSOS

### 5.1 Prompt para Implementação de Testes
```
Implemente uma suíte completa de testes seguindo esta estrutura:

1. **TESTES UNITÁRIOS**:
   - Cobertura mínima de 90% para todas as funções
   - Teste todos os casos extremos e edge cases
   - Valide comportamento com dados inválidos
   - Critério de validação: 100% dos testes passando

2. **TESTES DE INTEGRAÇÃO**:
   - Teste comunicação entre componentes
   - Valide fluxos de dados end-to-end
   - Verifique integrações com APIs externas
   - Critério de validação: Todos os fluxos críticos cobertos

3. **TESTES E2E**:
   - Simule jornadas completas do usuário
   - Teste em diferentes browsers e dispositivos
   - Valide performance sob carga
   - Critério de validação: 100% dos cenários principais funcionais

4. **TESTES DE PERFORMANCE**:
   - Benchmark de carregamento de páginas
   - Teste de stress com múltiplos usuários
   - Análise de uso de memória
   - Critério de validação: Performance dentro dos SLAs definidos
```

### 5.2 Configuração de Ambiente de Testes
```bash
# Comandos para execução completa de testes
npm run test:unit          # Testes unitários
npm run test:integration   # Testes de integração
npm run test:e2e          # Testes end-to-end
npm run test:performance  # Testes de performance
npm run test:security     # Testes de segurança
npm run test:accessibility # Testes de acessibilidade
```

## 6. FASE 5: PROCESSO ITERATIVO DE CORREÇÃO

### 6.1 Prompt para Ciclo de Correção
```
Execute o seguinte ciclo iterativo até que todos os critérios sejam atendidos:

1. **IDENTIFICAÇÃO**:
   - Execute análise automatizada completa
   - Priorize problemas por criticidade (Crítico > Alto > Médio > Baixo)
   - Documente cada problema encontrado
   - Critério de parada: Zero problemas críticos e altos

2. **PLANEJAMENTO**:
   - Crie plano de correção para cada problema
   - Estime impacto e tempo de correção
   - Defina ordem de implementação
   - Critério de validação: Plano aprovado por stakeholders

3. **IMPLEMENTAÇÃO**:
   - Corrija problemas seguindo boas práticas
   - Implemente testes para prevenir regressões
   - Documente todas as alterações
   - Critério de validação: Código revisado e aprovado

4. **VALIDAÇÃO**:
   - Execute suíte completa de testes
   - Verifique se correção não introduziu novos problemas
   - Valide performance e funcionalidade
   - Critério de validação: Todos os testes passando

5. **DOCUMENTAÇÃO**:
   - Atualize documentação técnica
   - Registre lições aprendidas
   - Atualize guias de usuário se necessário
   - Critério de validação: Documentação 100% atualizada
```

### 6.2 Template de Relatório de Iteração
```markdown
## Relatório de Iteração #X

### Problemas Identificados
- [ ] Problema 1: Descrição detalhada
- [ ] Problema 2: Descrição detalhada

### Correções Implementadas
- [x] Correção 1: Detalhes da implementação
- [x] Correção 2: Detalhes da implementação

### Testes Executados
- [x] Testes unitários: 95% cobertura
- [x] Testes integração: Todos passando
- [x] Testes E2E: 98% sucesso

### Métricas de Qualidade
- Performance: 92/100
- Segurança: 98/100
- Acessibilidade: 96/100
- Qualidade de Código: 89/100

### Próximos Passos
1. Corrigir problema X
2. Implementar feature Y
3. Otimizar performance Z
```

## 7. FASE 6: MECANISMO DE VERIFICAÇÃO CONTÍNUA

### 7.1 Prompt para Configuração de CI/CD
```
Configure um pipeline de verificação contínua com os seguintes estágios:

1. **VERIFICAÇÃO AUTOMÁTICA**:
   - Lint e formatação de código
   - Testes unitários e integração
   - Análise de segurança
   - Critério de validação: Pipeline verde em todas as etapas

2. **ANÁLISE DE QUALIDADE**:
   - SonarQube para qualidade de código
   - Lighthouse para performance
   - Snyk para vulnerabilidades
   - Critério de validação: Scores acima dos thresholds definidos

3. **TESTES AUTOMATIZADOS**:
   - Execução de suíte completa de testes
   - Testes de regressão visual
   - Testes de carga automatizados
   - Critério de validação: 100% dos testes críticos passando

4. **DEPLOYMENT CONDICIONAL**:
   - Deploy apenas se todos os critérios forem atendidos
   - Rollback automático em caso de falha
   - Monitoramento pós-deploy
   - Critério de validação: Zero downtime durante deploys
```

### 7.2 Configuração de Monitoramento
```yaml
# Exemplo de configuração de alertas
monitoring:
  performance:
    response_time: < 2s
    error_rate: < 0.1%
    availability: > 99.9%
  
  quality:
    code_coverage: > 90%
    security_score: > 95
    accessibility_score: > 95
  
  business:
    user_satisfaction: > 4.5/5
    conversion_rate: > 85%
    feature_adoption: > 70%
```

## 8. FASE 7: VALIDAÇÃO FINAL E CERTIFICAÇÃO

### 8.1 Prompt para Validação 100% Funcional
```
Execute a validação final seguindo este checklist abrangente:

1. **FUNCIONALIDADE COMPLETA**:
   - [ ] Todas as features documentadas estão implementadas
   - [ ] Todos os fluxos de usuário funcionam perfeitamente
   - [ ] Integração com sistemas externos está estável
   - [ ] Performance atende aos requisitos definidos

2. **QUALIDADE TÉCNICA**:
   - [ ] Cobertura de testes > 90%
   - [ ] Zero vulnerabilidades críticas ou altas
   - [ ] Score de qualidade de código > 8.5/10
   - [ ] Documentação técnica 100% atualizada

3. **EXPERIÊNCIA DO USUÁRIO**:
   - [ ] Interface responsiva em todos os dispositivos
   - [ ] Acessibilidade WCAG 2.1 AA compliant
   - [ ] Tempos de carregamento < 3s
   - [ ] Feedback adequado para todas as ações

4. **OPERACIONAL**:
   - [ ] Pipeline CI/CD funcionando perfeitamente
   - [ ] Monitoramento e alertas configurados
   - [ ] Backup e recovery testados
   - [ ] Documentação de operação completa

5. **NEGÓCIO**:
   - [ ] Todos os requisitos de negócio atendidos
   - [ ] Métricas de sucesso definidas e mensuráveis
   - [ ] Treinamento de usuários realizado
   - [ ] Plano de suporte pós-lançamento definido
```

### 8.2 Certificado de Qualidade
```
🏆 CERTIFICADO DE QUALIDADE - PROJETO ESTUDIO_IA_VIDEOS

✅ Funcionalidade: 100% implementada e testada
✅ Qualidade: Score 9.2/10
✅ Performance: Lighthouse 94/100
✅ Segurança: Zero vulnerabilidades críticas
✅ Acessibilidade: WCAG 2.1 AA compliant
✅ Testes: 95% cobertura, 100% passando
✅ Documentação: 100% atualizada

Data de Certificação: [DATA]
Válido até: [DATA + 3 meses]
Próxima Revisão: [DATA + 1 mês]
```

## 9. PROCESSO DE MANUTENÇÃO CONTÍNUA

### 9.1 Prompt para Manutenção Preventiva
```
Execute manutenção preventiva mensal seguindo este roteiro:

1. **ATUALIZAÇÃO DE DEPENDÊNCIAS**:
   - Verifique atualizações de segurança
   - Teste compatibilidade de novas versões
   - Atualize documentação se necessário
   - Critério: Dependências sempre atualizadas e seguras

2. **ANÁLISE DE PERFORMANCE**:
   - Execute benchmarks de performance
   - Identifique degradações ou melhorias
   - Otimize gargalos identificados
   - Critério: Performance mantida ou melhorada

3. **REVISÃO DE CÓDIGO**:
   - Analise código adicionado no período
   - Refatore código com debt técnico
   - Atualize testes conforme necessário
   - Critério: Qualidade de código mantida

4. **VALIDAÇÃO DE FUNCIONALIDADES**:
   - Execute testes de regressão completos
   - Verifique funcionalidades críticas
   - Valide integrações externas
   - Critério: Todas as funcionalidades operacionais
```

## 10. MÉTRICAS E KPIs DE SUCESSO

### 10.1 Dashboard de Qualidade
```
📊 MÉTRICAS DE QUALIDADE DO PROJETO

🔧 Técnicas:
- Cobertura de Testes: 95%
- Qualidade de Código: 9.2/10
- Performance (Lighthouse): 94/100
- Vulnerabilidades: 0 críticas, 2 baixas

👥 Experiência do Usuário:
- Tempo de Carregamento: 1.8s
- Taxa de Erro: 0.05%
- Satisfação do Usuário: 4.7/5
- Acessibilidade: 96/100

🚀 Operacional:
- Uptime: 99.95%
- Deploy Success Rate: 98%
- MTTR: 15 minutos
- Frequência de Deploy: 2x/semana

💼 Negócio:
- Feature Adoption: 78%
- User Retention: 85%
- Conversion Rate: 12.5%
- ROI: 340%
```

### 10.2 Alertas e Thresholds
```yaml
alerts:
  critical:
    - error_rate > 1%
    - response_time > 5s
    - availability < 99%
    - security_vulnerabilities > 0
  
  warning:
    - test_coverage < 90%
    - code_quality < 8.0
    - performance_score < 85
    - user_satisfaction < 4.0
```

## 11. CONCLUSÃO E PRÓXIMOS PASSOS

### 11.1 Resumo do Processo
Este prompt fornece um framework completo para:
- ✅ Análise sistemática de todos os aspectos do projeto
- ✅ Identificação proativa de problemas e oportunidades
- ✅ Implementação de correções com validação rigorosa
- ✅ Manutenção contínua da qualidade
- ✅ Monitoramento e melhoria constante

### 11.2 Cronograma Sugerido
```
Semana 1-2: Análise Arquitetural e de Código
Semana 3-4: Análise Funcional e Implementação de Testes
Semana 5-6: Ciclo Iterativo de Correções
Semana 7: Configuração de CI/CD e Monitoramento
Semana 8: Validação Final e Certificação
Ongoing: Manutenção Contínua
```

### 11.3 Recursos Necessários
- **Equipe**: 2-3 desenvolvedores sênior, 1 QA, 1 DevOps
- **Ferramentas**: SonarQube, Lighthouse, Jest, Playwright, GitHub Actions
- **Tempo**: 8 semanas para implementação completa
- **Budget**: Estimativa baseada no tamanho da equipe

---

**📝 Nota**: Este prompt deve ser executado de forma iterativa, com validação contínua em cada etapa. O sucesso é medido pela ausência de falhas críticas e pelo atendimento de todos os critérios de qualidade definidos.