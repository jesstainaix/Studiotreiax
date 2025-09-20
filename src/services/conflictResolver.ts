import { Change, Conflict } from './collaborationEngine';

export interface ResolutionStrategy {
  type: string;
  priority: number;
  canResolve: (conflict: Conflict) => boolean;
  resolve: (conflict: Conflict, resolution: any, userId: string) => Change | null;
}

export interface ResolutionOptions {
  strategy: 'auto' | 'manual' | 'merge' | 'override' | 'reject';
  preferredUser?: string;
  mergeRules?: MergeRule[];
  customData?: any;
}

export interface MergeRule {
  property: string;
  strategy: 'latest' | 'earliest' | 'max' | 'min' | 'concat' | 'custom';
  customResolver?: (values: any[]) => any;
}

class ConflictResolver {
  private strategies: Map<string, ResolutionStrategy> = new Map();

  constructor() {
    this.registerDefaultStrategies();
  }

  // Registrar estratégias padrão
  private registerDefaultStrategies(): void {
    // Estratégia de merge automático
    this.registerStrategy({
      type: 'auto-merge',
      priority: 1,
      canResolve: (conflict) => conflict.type === 'concurrent_edit',
      resolve: (conflict, resolution, userId) => this.autoMergeStrategy(conflict, resolution, userId)
    });

    // Estratégia de última modificação vence
    this.registerStrategy({
      type: 'last-write-wins',
      priority: 2,
      canResolve: (conflict) => conflict.type === 'concurrent_edit',
      resolve: (conflict, resolution, userId) => this.lastWriteWinsStrategy(conflict, resolution, userId)
    });

    // Estratégia de usuário preferido
    this.registerStrategy({
      type: 'preferred-user',
      priority: 3,
      canResolve: (conflict) => true,
      resolve: (conflict, resolution, userId) => this.preferredUserStrategy(conflict, resolution, userId)
    });

    // Estratégia de merge manual
    this.registerStrategy({
      type: 'manual-merge',
      priority: 4,
      canResolve: (conflict) => true,
      resolve: (conflict, resolution, userId) => this.manualMergeStrategy(conflict, resolution, userId)
    });

    // Estratégia de rejeição
    this.registerStrategy({
      type: 'reject',
      priority: 5,
      canResolve: (conflict) => true,
      resolve: (conflict, resolution, userId) => null
    });
  }

  // Registrar nova estratégia
  registerStrategy(strategy: ResolutionStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  // Resolver conflito
  resolve(conflict: Conflict, resolution: ResolutionOptions, userId: string): Change | null {
    try {
      // Encontrar estratégia apropriada
      const strategy = this.findStrategy(conflict, resolution.strategy);
      if (!strategy) {
        console.warn('Nenhuma estratégia encontrada para o conflito:', conflict.id);
        return null;
      }

      // Aplicar estratégia
      const resolvedChange = strategy.resolve(conflict, resolution, userId);
      
      if (resolvedChange) {
        // Adicionar metadados de resolução
        resolvedChange.data._conflictResolution = {
          conflictId: conflict.id,
          strategy: strategy.type,
          resolvedBy: userId,
          resolvedAt: new Date(),
          originalChanges: conflict.changes.map(c => c.id)
        };
      }

      return resolvedChange;
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
      return null;
    }
  }

  // Encontrar estratégia apropriada
  private findStrategy(conflict: Conflict, preferredType?: string): ResolutionStrategy | null {
    // Se tipo específico foi solicitado
    if (preferredType && preferredType !== 'auto') {
      const strategy = this.strategies.get(preferredType);
      if (strategy && strategy.canResolve(conflict)) {
        return strategy;
      }
    }

    // Encontrar melhor estratégia por prioridade
    const availableStrategies = Array.from(this.strategies.values())
      .filter(s => s.canResolve(conflict))
      .sort((a, b) => a.priority - b.priority);

    return availableStrategies[0] || null;
  }

  // Estratégia de merge automático
  private autoMergeStrategy(conflict: Conflict, resolution: ResolutionOptions, userId: string): Change | null {
    if (conflict.changes.length < 2) return null;

    const baseChange = conflict.changes[0];
    const mergedData = { ...baseChange.data };

    // Aplicar regras de merge
    const mergeRules = resolution.mergeRules || this.getDefaultMergeRules();
    
    conflict.changes.forEach((change, index) => {
      if (index === 0) return; // Pular mudança base
      
      Object.keys(change.data).forEach(property => {
        const rule = mergeRules.find(r => r.property === property) || 
                    mergeRules.find(r => r.property === '*');
        
        if (rule) {
          mergedData[property] = this.applyMergeRule(
            rule,
            [mergedData[property], change.data[property]],
            conflict.changes.map(c => ({ value: c.data[property], timestamp: c.timestamp }))
          );
        } else {
          // Estratégia padrão: última modificação
          mergedData[property] = change.data[property];
        }
      });
    });

    return {
      id: this.generateId(),
      elementId: baseChange.elementId,
      userId,
      timestamp: new Date(),
      type: 'update',
      data: mergedData,
      previousData: baseChange.previousData,
      version: Math.max(...conflict.changes.map(c => c.version)) + 1
    };
  }

  // Estratégia de última modificação vence
  private lastWriteWinsStrategy(conflict: Conflict, resolution: ResolutionOptions, userId: string): Change | null {
    if (conflict.changes.length === 0) return null;

    // Encontrar mudança mais recente
    const latestChange = conflict.changes.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );

    return {
      id: this.generateId(),
      elementId: latestChange.elementId,
      userId,
      timestamp: new Date(),
      type: latestChange.type,
      data: { ...latestChange.data },
      previousData: latestChange.previousData,
      version: latestChange.version + 1
    };
  }

  // Estratégia de usuário preferido
  private preferredUserStrategy(conflict: Conflict, resolution: ResolutionOptions, userId: string): Change | null {
    if (!resolution.preferredUser || conflict.changes.length === 0) return null;

    // Encontrar mudança do usuário preferido
    const preferredChange = conflict.changes.find(c => c.userId === resolution.preferredUser);
    if (!preferredChange) {
      // Se usuário preferido não encontrado, usar última modificação
      return this.lastWriteWinsStrategy(conflict, resolution, userId);
    }

    return {
      id: this.generateId(),
      elementId: preferredChange.elementId,
      userId,
      timestamp: new Date(),
      type: preferredChange.type,
      data: { ...preferredChange.data },
      previousData: preferredChange.previousData,
      version: preferredChange.version + 1
    };
  }

  // Estratégia de merge manual
  private manualMergeStrategy(conflict: Conflict, resolution: ResolutionOptions, userId: string): Change | null {
    if (!resolution.customData || conflict.changes.length === 0) return null;

    const baseChange = conflict.changes[0];
    
    return {
      id: this.generateId(),
      elementId: baseChange.elementId,
      userId,
      timestamp: new Date(),
      type: 'update',
      data: { ...resolution.customData },
      previousData: baseChange.previousData,
      version: Math.max(...conflict.changes.map(c => c.version)) + 1
    };
  }

  // Aplicar regra de merge
  private applyMergeRule(rule: MergeRule, values: any[], metadata: any[]): any {
    const validValues = values.filter(v => v !== undefined && v !== null);
    if (validValues.length === 0) return null;
    if (validValues.length === 1) return validValues[0];

    switch (rule.strategy) {
      case 'latest':
        const latestIndex = metadata.reduce((maxIndex, current, index) => 
          current.timestamp > metadata[maxIndex].timestamp ? index : maxIndex, 0
        );
        return values[latestIndex];

      case 'earliest':
        const earliestIndex = metadata.reduce((minIndex, current, index) => 
          current.timestamp < metadata[minIndex].timestamp ? index : minIndex, 0
        );
        return values[earliestIndex];

      case 'max':
        return Math.max(...validValues.filter(v => typeof v === 'number'));

      case 'min':
        return Math.min(...validValues.filter(v => typeof v === 'number'));

      case 'concat':
        if (Array.isArray(validValues[0])) {
          return validValues.reduce((acc, val) => acc.concat(val), []);
        }
        if (typeof validValues[0] === 'string') {
          return validValues.join(' ');
        }
        return validValues[validValues.length - 1];

      case 'custom':
        if (rule.customResolver) {
          return rule.customResolver(validValues);
        }
        return validValues[validValues.length - 1];

      default:
        return validValues[validValues.length - 1];
    }
  }

  // Regras de merge padrão
  private getDefaultMergeRules(): MergeRule[] {
    return [
      { property: 'x', strategy: 'latest' },
      { property: 'y', strategy: 'latest' },
      { property: 'width', strategy: 'max' },
      { property: 'height', strategy: 'max' },
      { property: 'opacity', strategy: 'latest' },
      { property: 'rotation', strategy: 'latest' },
      { property: 'scale', strategy: 'latest' },
      { property: 'color', strategy: 'latest' },
      { property: 'text', strategy: 'latest' },
      { property: 'effects', strategy: 'concat' },
      { property: 'filters', strategy: 'concat' },
      { property: 'keyframes', strategy: 'concat' },
      { property: 'duration', strategy: 'max' },
      { property: 'startTime', strategy: 'earliest' },
      { property: 'endTime', strategy: 'latest' },
      { property: 'volume', strategy: 'latest' },
      { property: 'muted', strategy: 'latest' },
      { property: 'visible', strategy: 'latest' },
      { property: 'locked', strategy: 'latest' },
      { property: '*', strategy: 'latest' } // Regra padrão
    ];
  }

  // Analisar conflito e sugerir resolução
  analyzeConflict(conflict: Conflict): {
    severity: 'low' | 'medium' | 'high';
    suggestedStrategy: string;
    canAutoResolve: boolean;
    affectedProperties: string[];
    recommendations: string[];
  } {
    const affectedProperties = new Set<string>();
    let hasDestructiveChanges = false;
    let hasComplexChanges = false;

    // Analisar mudanças
    conflict.changes.forEach(change => {
      Object.keys(change.data).forEach(prop => affectedProperties.add(prop));
      
      if (change.type === 'delete') {
        hasDestructiveChanges = true;
      }
      
      if (change.data.effects || change.data.keyframes || change.data.filters) {
        hasComplexChanges = true;
      }
    });

    // Determinar severidade
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (hasDestructiveChanges) {
      severity = 'high';
    } else if (hasComplexChanges || affectedProperties.size > 5) {
      severity = 'medium';
    }

    // Sugerir estratégia
    let suggestedStrategy = 'auto-merge';
    let canAutoResolve = true;
    
    if (severity === 'high') {
      suggestedStrategy = 'manual-merge';
      canAutoResolve = false;
    } else if (severity === 'medium') {
      suggestedStrategy = 'last-write-wins';
    }

    // Gerar recomendações
    const recommendations: string[] = [];
    
    if (hasDestructiveChanges) {
      recommendations.push('Conflito envolve exclusão de elementos - requer atenção manual');
    }
    
    if (hasComplexChanges) {
      recommendations.push('Mudanças complexas detectadas - considere merge manual');
    }
    
    if (conflict.users.length > 2) {
      recommendations.push('Múltiplos usuários envolvidos - considere comunicação em equipe');
    }
    
    if (affectedProperties.size > 10) {
      recommendations.push('Muitas propriedades afetadas - revise cuidadosamente');
    }

    return {
      severity,
      suggestedStrategy,
      canAutoResolve,
      affectedProperties: Array.from(affectedProperties),
      recommendations
    };
  }

  // Simular resolução (para preview)
  simulateResolution(conflict: Conflict, options: ResolutionOptions): any {
    const strategy = this.findStrategy(conflict, options.strategy);
    if (!strategy) return null;

    try {
      const resolvedChange = strategy.resolve(conflict, options, 'simulator');
      return resolvedChange ? resolvedChange.data : null;
    } catch (error) {
      console.error('Erro na simulação:', error);
      return null;
    }
  }

  // Gerar ID único
  private generateId(): string {
    return `resolved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos utilitários
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  getStrategyInfo(type: string): ResolutionStrategy | undefined {
    return this.strategies.get(type);
  }

  // Validar opções de resolução
  validateResolutionOptions(options: ResolutionOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.strategy) {
      errors.push('Estratégia de resolução é obrigatória');
    }

    if (options.strategy === 'preferred-user' && !options.preferredUser) {
      errors.push('Usuário preferido deve ser especificado para estratégia preferred-user');
    }

    if (options.strategy === 'manual-merge' && !options.customData) {
      errors.push('Dados customizados são obrigatórios para merge manual');
    }

    if (options.strategy === 'merge' && options.mergeRules) {
      options.mergeRules.forEach((rule, index) => {
        if (!rule.property || !rule.strategy) {
          errors.push(`Regra de merge ${index} inválida: propriedade e estratégia são obrigatórias`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Instância singleton
export const conflictResolver = new ConflictResolver();

export default conflictResolver;