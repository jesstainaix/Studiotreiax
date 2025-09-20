import {
  AutomationRule,
  AutomationWorkflow,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
  WorkflowStats,
  WorkflowError,
  Template
} from '../types/templates';
import { templateEngine } from './templateEngine';

// Automation Engine - Sistema de automação e workflows
export class AutomationEngine {
  private static instance: AutomationEngine;
  private workflows: Map<string, AutomationWorkflow> = new Map();
  private activeRules: Map<string, AutomationRule> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private executionQueue: Array<{ ruleId: string; context: any }> = [];
  private isProcessing = false;

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  constructor() {
    this.initializeDefaultWorkflows();
    this.startExecutionLoop();
  }

  // Registrar workflow de automação
  registerWorkflow(workflow: AutomationWorkflow): void {
    this.workflows.set(workflow.id, workflow);
    
    // Registrar regras ativas
    workflow.rules.forEach(rule => {
      if (rule.enabled) {
        this.activeRules.set(rule.id, rule);
        this.registerTriggerListener(rule);
      }
    });

    console.log(`Workflow registrado: ${workflow.name}`);
  }

  // Remover workflow
  unregisterWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      // Remover regras ativas
      workflow.rules.forEach(rule => {
        this.activeRules.delete(rule.id);
        this.unregisterTriggerListener(rule);
      });
      
      this.workflows.delete(workflowId);
      console.log(`Workflow removido: ${workflowId}`);
    }
  }

  // Executar regra de automação
  async executeRule(ruleId: string, context: any): Promise<boolean> {
    const rule = this.activeRules.get(ruleId);
    if (!rule || !rule.enabled) {
      return false;
    }

    try {
      console.log(`Executando regra: ${rule.name}`);
      
      // Verificar condições
      const conditionsMet = await this.evaluateConditions(rule.conditions, context);
      if (!conditionsMet) {
        console.log(`Condições não atendidas para regra: ${rule.name}`);
        return false;
      }

      // Executar ações
      const results = await this.executeActions(rule.actions, context);
      
      // Atualizar estatísticas
      this.updateRuleStats(ruleId, true);
      
      console.log(`Regra executada com sucesso: ${rule.name}`);
      return results.every(r => r.success);
    } catch (error) {
      console.error(`Erro ao executar regra ${rule.name}:`, error);
      this.updateRuleStats(ruleId, false, error as Error);
      return false;
    }
  }

  // Avaliar condições
  private async evaluateConditions(
    conditions: AutomationCondition[],
    context: any
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  // Avaliar condição individual
  private async evaluateCondition(
    condition: AutomationCondition,
    context: any
  ): Promise<boolean> {
    const targetValue = condition.target ? context[condition.target] : context;
    
    switch (condition.type) {
      case 'contentType':
        return this.evaluateContentType(targetValue, condition);
      case 'duration':
        return this.evaluateDuration(targetValue, condition);
      case 'aspectRatio':
        return this.evaluateAspectRatio(targetValue, condition);
      case 'fileSize':
        return this.evaluateFileSize(targetValue, condition);
      case 'metadata':
        return this.evaluateMetadata(targetValue, condition);
      case 'custom':
        return this.evaluateCustomCondition(targetValue, condition, context);
      default:
        return false;
    }
  }

  // Executar ações
  private async executeActions(
    actions: AutomationAction[],
    context: any
  ): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
    const results = [];
    
    for (const action of actions) {
      try {
        // Aplicar delay se especificado
        if (action.delay && action.delay > 0) {
          await this.delay(action.delay);
        }
        
        const result = await this.executeAction(action, context);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    return results;
  }

  // Executar ação individual
  private async executeAction(action: AutomationAction, context: any): Promise<any> {
    switch (action.type) {
      case 'applyTemplate':
        return this.applyTemplateAction(action, context);
      case 'addEffect':
        return this.addEffectAction(action, context);
      case 'adjustTiming':
        return this.adjustTimingAction(action, context);
      case 'cropVideo':
        return this.cropVideoAction(action, context);
      case 'addText':
        return this.addTextAction(action, context);
      case 'addMusic':
        return this.addMusicAction(action, context);
      case 'export':
        return this.exportAction(action, context);
      case 'notify':
        return this.notifyAction(action, context);
      default:
        throw new Error(`Tipo de ação não suportado: ${action.type}`);
    }
  }

  // Ações específicas
  private async applyTemplateAction(action: AutomationAction, context: any): Promise<any> {
    const { templateId, options = {} } = action.config;
    
    if (!templateId) {
      throw new Error('Template ID não especificado');
    }

    // Buscar template (simulado)
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }

    // Aplicar template usando o Template Engine
    const result = await templateEngine.applyTemplate(template, context.projectData, options);
    
    // Atualizar contexto com resultado
    context.appliedTemplate = result;
    
    return result;
  }

  private async addEffectAction(action: AutomationAction, context: any): Promise<any> {
    const { effectType, intensity = 1.0, target = 'all' } = action.config;
    
    const effect = {
      id: `auto_${Date.now()}`,
      type: effectType,
      intensity,
      target,
      timestamp: new Date()
    };
    
    if (!context.effects) {
      context.effects = [];
    }
    context.effects.push(effect);
    
    return effect;
  }

  private async adjustTimingAction(action: AutomationAction, context: any): Promise<any> {
    const { adjustment, target = 'all' } = action.config;
    
    const timingAdjustment = {
      target,
      adjustment,
      appliedAt: new Date()
    };
    
    if (!context.timingAdjustments) {
      context.timingAdjustments = [];
    }
    context.timingAdjustments.push(timingAdjustment);
    
    return timingAdjustment;
  }

  private async cropVideoAction(action: AutomationAction, context: any): Promise<any> {
    const { startTime, endTime, target } = action.config;
    
    const cropOperation = {
      target: target || context.currentVideo,
      startTime,
      endTime,
      appliedAt: new Date()
    };
    
    if (!context.cropOperations) {
      context.cropOperations = [];
    }
    context.cropOperations.push(cropOperation);
    
    return cropOperation;
  }

  private async addTextAction(action: AutomationAction, context: any): Promise<any> {
    const { text, position, style = {} } = action.config;
    
    const textElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      content: text,
      position: position || { x: 50, y: 50 },
      style: {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        ...style
      },
      createdAt: new Date()
    };
    
    if (!context.textElements) {
      context.textElements = [];
    }
    context.textElements.push(textElement);
    
    return textElement;
  }

  private async addMusicAction(action: AutomationAction, context: any): Promise<any> {
    const { musicUrl, volume = 0.5, fadeIn = true } = action.config;
    
    const musicTrack = {
      id: `music_${Date.now()}`,
      url: musicUrl,
      volume,
      fadeIn,
      addedAt: new Date()
    };
    
    if (!context.musicTracks) {
      context.musicTracks = [];
    }
    context.musicTracks.push(musicTrack);
    
    return musicTrack;
  }

  private async exportAction(action: AutomationAction, context: any): Promise<any> {
    const { format = 'mp4', quality = 'high', destination } = action.config;
    
    const exportJob = {
      id: `export_${Date.now()}`,
      format,
      quality,
      destination,
      status: 'queued',
      createdAt: new Date()
    };
    
    // Simular processo de export
    setTimeout(() => {
      exportJob.status = 'completed';
    }, 5000);
    
    return exportJob;
  }

  private async notifyAction(action: AutomationAction, context: any): Promise<any> {
    const { message, type = 'info', recipients } = action.config;
    
    const notification = {
      id: `notification_${Date.now()}`,
      message,
      type,
      recipients: recipients || ['user'],
      sentAt: new Date()
    };
    
    // Emitir evento de notificação
    this.emit('notification', notification);
    
    return notification;
  }

  // Avaliadores de condição
  private evaluateContentType(value: any, condition: AutomationCondition): boolean {
    const contentTypes = Array.isArray(value) ? value : [value];
    const expectedType = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return contentTypes.includes(expectedType);
      case 'notEquals':
        return !contentTypes.includes(expectedType);
      case 'contains':
        return contentTypes.some(type => type.includes(expectedType));
      default:
        return false;
    }
  }

  private evaluateDuration(value: number, condition: AutomationCondition): boolean {
    const duration = typeof value === 'number' ? value : parseFloat(value) || 0;
    const expectedDuration = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return Math.abs(duration - expectedDuration) < 1; // 1 segundo de tolerância
      case 'greaterThan':
        return duration > expectedDuration;
      case 'lessThan':
        return duration < expectedDuration;
      case 'between':
        return Array.isArray(expectedDuration) && 
               duration >= expectedDuration[0] && 
               duration <= expectedDuration[1];
      default:
        return false;
    }
  }

  private evaluateAspectRatio(value: string, condition: AutomationCondition): boolean {
    const aspectRatio = value || '16:9';
    const expectedRatio = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return aspectRatio === expectedRatio;
      case 'notEquals':
        return aspectRatio !== expectedRatio;
      default:
        return false;
    }
  }

  private evaluateFileSize(value: number, condition: AutomationCondition): boolean {
    const fileSize = typeof value === 'number' ? value : parseFloat(value) || 0;
    const expectedSize = condition.value;
    
    switch (condition.operator) {
      case 'greaterThan':
        return fileSize > expectedSize;
      case 'lessThan':
        return fileSize < expectedSize;
      case 'between':
        return Array.isArray(expectedSize) && 
               fileSize >= expectedSize[0] && 
               fileSize <= expectedSize[1];
      default:
        return false;
    }
  }

  private evaluateMetadata(value: any, condition: AutomationCondition): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }
    
    const metadataValue = condition.target ? value[condition.target] : value;
    const expectedValue = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return metadataValue === expectedValue;
      case 'contains':
        return typeof metadataValue === 'string' && 
               metadataValue.includes(expectedValue);
      default:
        return false;
    }
  }

  private evaluateCustomCondition(
    value: any, 
    condition: AutomationCondition, 
    context: any
  ): boolean {
    // Implementar lógica customizada baseada na configuração
    try {
      const customLogic = condition.value;
      if (typeof customLogic === 'function') {
        return customLogic(value, context);
      }
      return false;
    } catch (error) {
      console.error('Erro ao avaliar condição customizada:', error);
      return false;
    }
  }

  // Registrar listener de trigger
  private registerTriggerListener(rule: AutomationRule): void {
    const triggerType = rule.trigger.type;
    
    if (!this.eventListeners.has(triggerType)) {
      this.eventListeners.set(triggerType, []);
    }
    
    const listener = (context: any) => {
      this.queueRuleExecution(rule.id, context);
    };
    
    this.eventListeners.get(triggerType)!.push(listener);
  }

  // Remover listener de trigger
  private unregisterTriggerListener(rule: AutomationRule): void {
    const triggerType = rule.trigger.type;
    const listeners = this.eventListeners.get(triggerType);
    
    if (listeners) {
      // Remover todos os listeners desta regra (simplificado)
      this.eventListeners.set(triggerType, []);
    }
  }

  // Adicionar execução à fila
  private queueRuleExecution(ruleId: string, context: any): void {
    this.executionQueue.push({ ruleId, context });
  }

  // Loop de execução
  private startExecutionLoop(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.isProcessing = true;
        
        const execution = this.executionQueue.shift();
        if (execution) {
          await this.executeRule(execution.ruleId, execution.context);
        }
        
        this.isProcessing = false;
      }
    }, 100);
  }

  // Emitir evento
  emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Erro ao executar listener para evento ${eventType}:`, error);
      }
    });
  }

  // Atualizar estatísticas da regra
  private updateRuleStats(ruleId: string, success: boolean, error?: Error): void {
    // Encontrar workflow que contém a regra
    for (const workflow of Array.from(this.workflows.values())) {
      const rule = workflow.rules.find(r => r.id === ruleId);
      if (rule) {
        workflow.stats.executions++;
        
        if (success) {
          workflow.stats.successRate = 
            (workflow.stats.successRate * (workflow.stats.executions - 1) + 1) / 
            workflow.stats.executions;
        } else {
          workflow.stats.successRate = 
            (workflow.stats.successRate * (workflow.stats.executions - 1)) / 
            workflow.stats.executions;
          
          if (error) {
            workflow.stats.errors.push({
              timestamp: new Date(),
              ruleId,
              error: error.message,
              context: {}
            });
          }
        }
        
        workflow.stats.lastExecution = new Date();
        break;
      }
    }
  }

  // Obter template (simulado)
  private async getTemplate(templateId: string): Promise<Template | null> {
    // Simulação de busca de template
    return {
      id: templateId,
      name: `Template ${templateId}`,
      description: 'Template de automação',
      category: 'business',
      tags: ['automation'],
      thumbnail: '/thumbnails/default.jpg',
      preview: '/previews/default.mp4',
      elements: [],
      duration: 30,
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      metadata: {
        difficulty: 'beginner',
        estimatedTime: 300,
        requiredAssets: [],
        compatibleFormats: ['mp4'],
        features: ['automation'],
        industry: ['business'],
        mood: ['professional'],
        colorScheme: ['#000000', '#ffffff']
      },
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: 'system',
        name: 'Sistema',
        verified: true,
        rating: 5,
        totalTemplates: 1
      },
      license: {
        type: 'free',
        usage: ['commercial'],
        restrictions: [],
        attribution: false
      },
      pricing: {
        type: 'free'
      },
      analytics: {
        downloads: 0,
        views: 0,
        likes: 0,
        rating: 5,
        reviews: 0,
        trending: false,
        featured: false
      }
    };
  }

  // Utilitários
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Inicializar workflows padrão
  private initializeDefaultWorkflows(): void {
    // Workflow de aplicação automática de templates
    const autoTemplateWorkflow: AutomationWorkflow = {
      id: 'auto-template-application',
      name: 'Aplicação Automática de Templates',
      description: 'Aplica templates automaticamente baseado no tipo de conteúdo',
      rules: [
        {
          id: 'social-media-auto',
          name: 'Template para Redes Sociais',
          description: 'Aplica template de redes sociais para vídeos quadrados',
          trigger: {
            type: 'contentAdded',
            config: {}
          },
          conditions: [
            {
              type: 'aspectRatio',
              operator: 'equals',
              value: '1:1'
            },
            {
              type: 'duration',
              operator: 'lessThan',
              value: 60
            }
          ],
          actions: [
            {
              type: 'applyTemplate',
              config: {
                templateId: 'social-media-square',
                options: { quality: 'high' }
              }
            }
          ],
          enabled: true,
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      enabled: true,
      stats: {
        executions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        errors: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.registerWorkflow(autoTemplateWorkflow);
  }

  // Métodos públicos para gerenciamento
  getWorkflows(): AutomationWorkflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string): AutomationWorkflow | undefined {
    return this.workflows.get(id);
  }

  enableWorkflow(id: string): void {
    const workflow = this.workflows.get(id);
    if (workflow) {
      workflow.enabled = true;
      workflow.rules.forEach(rule => {
        rule.enabled = true;
        this.activeRules.set(rule.id, rule);
        this.registerTriggerListener(rule);
      });
    }
  }

  disableWorkflow(id: string): void {
    const workflow = this.workflows.get(id);
    if (workflow) {
      workflow.enabled = false;
      workflow.rules.forEach(rule => {
        rule.enabled = false;
        this.activeRules.delete(rule.id);
        this.unregisterTriggerListener(rule);
      });
    }
  }
}

// Instância singleton
export const automationEngine = AutomationEngine.getInstance();

// Funções utilitárias
export const AutomationUtils = {
  // Criar regra simples
  createSimpleRule(
    name: string,
    triggerType: string,
    conditions: AutomationCondition[],
    actions: AutomationAction[]
  ): AutomationRule {
    return {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: `Regra criada automaticamente: ${name}`,
      trigger: {
        type: triggerType as any,
        config: {}
      },
      conditions,
      actions,
      enabled: true,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Validar workflow
  validateWorkflow(workflow: Partial<AutomationWorkflow>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!workflow.name) errors.push('Nome é obrigatório');
    if (!workflow.rules || workflow.rules.length === 0) {
      errors.push('Workflow deve ter pelo menos uma regra');
    }
    
    workflow.rules?.forEach((rule, index) => {
      if (!rule.name) errors.push(`Regra ${index + 1}: Nome é obrigatório`);
      if (!rule.trigger) errors.push(`Regra ${index + 1}: Trigger é obrigatório`);
      if (!rule.actions || rule.actions.length === 0) {
        errors.push(`Regra ${index + 1}: Pelo menos uma ação é obrigatória`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Criar workflow de template automático
  createAutoTemplateWorkflow(
    templateId: string,
    conditions: AutomationCondition[]
  ): AutomationWorkflow {
    const rule = this.createSimpleRule(
      `Auto aplicar ${templateId}`,
      'contentAdded',
      conditions,
      [{
        type: 'applyTemplate',
        config: { templateId }
      }]
    );

    return {
      id: `auto_template_${templateId}_${Date.now()}`,
      name: `Auto Template: ${templateId}`,
      description: `Aplicação automática do template ${templateId}`,
      rules: [rule],
      enabled: true,
      stats: {
        executions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        errors: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};