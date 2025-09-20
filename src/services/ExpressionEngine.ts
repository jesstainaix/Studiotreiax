import * as THREE from 'three';

// Interface para variáveis disponíveis nas expressões
export interface ExpressionContext {
  // Variáveis de tempo
  time: number;           // Tempo atual em segundos
  frame: number;          // Frame atual
  fps: number;            // Frames por segundo
  duration: number;       // Duração total em segundos
  
  // Variáveis de posição e transformação
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  
  // Variáveis de propriedades do nó
  nodeId: string;
  nodeType: string;
  
  // Variáveis customizadas
  [key: string]: any;
}

// Interface para resultado de avaliação de expressão
export interface ExpressionResult {
  success: boolean;
  value?: any;
  error?: string;
  executionTime: number;
}

// Interface para expressão compilada
export interface CompiledExpression {
  id: string;
  source: string;
  compiled: Function;
  dependencies: string[];
  lastModified: number;
}

// Classe principal do motor de expressões
export class ExpressionEngine {
  private compiledExpressions: Map<string, CompiledExpression> = new Map();
  private globalContext: Partial<ExpressionContext> = {};
  private mathFunctions: Record<string, Function> = {};
  private utilityFunctions: Record<string, Function> = {};
  
  constructor() {
    this.initializeMathFunctions();
    this.initializeUtilityFunctions();
  }
  
  /**
   * Compila uma expressão JavaScript para uso posterior
   */
  compileExpression(id: string, expression: string): boolean {
    try {
      // Sanitizar a expressão
      const sanitizedExpression = this.sanitizeExpression(expression);
      
      // Extrair dependências
      const dependencies = this.extractDependencies(sanitizedExpression);
      
      // Criar função compilada
      const functionBody = `
        const { ${Object.keys(this.mathFunctions).join(', ')} } = this.mathFunctions;
        const { ${Object.keys(this.utilityFunctions).join(', ')} } = this.utilityFunctions;
        
        with (context) {
          return (${sanitizedExpression});
        }
      `;
      
      const compiledFunction = new Function('context', functionBody).bind(this);
      
      const compiled: CompiledExpression = {
        id,
        source: expression,
        compiled: compiledFunction,
        dependencies,
        lastModified: Date.now()
      };
      
      this.compiledExpressions.set(id, compiled);
      return true;
      
    } catch (error) {
      console.error(`Erro ao compilar expressão ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Avalia uma expressão compilada com o contexto fornecido
   */
  evaluateExpression(id: string, context: Partial<ExpressionContext>): ExpressionResult {
    const startTime = performance.now();
    
    const compiled = this.compiledExpressions.get(id);
    if (!compiled) {
      return {
        success: false,
        error: `Expressão ${id} não encontrada`,
        executionTime: performance.now() - startTime
      };
    }
    
    try {
      // Mesclar contexto global com contexto local
      const fullContext = { ...this.globalContext, ...context };
      
      // Executar expressão
      const value = compiled.compiled(fullContext);
      
      return {
        success: true,
        value,
        executionTime: performance.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        executionTime: performance.now() - startTime
      };
    }
  }
  
  /**
   * Avalia uma expressão diretamente sem compilação prévia
   */
  evaluateDirectly(expression: string, context: Partial<ExpressionContext>): ExpressionResult {
    const tempId = `temp_${Date.now()}`;
    
    if (!this.compileExpression(tempId, expression)) {
      return {
        success: false,
        error: 'Falha na compilação da expressão',
        executionTime: 0
      };
    }
    
    const result = this.evaluateExpression(tempId, context);
    this.compiledExpressions.delete(tempId);
    
    return result;
  }

  /**
   * Avalia múltiplas expressões em lote
   */
  evaluateBatch(expressions: Record<string, string>, context: Partial<ExpressionContext>): Record<string, ExpressionResult> {
    const results: Record<string, ExpressionResult> = {};
    
    for (const [key, expression] of Object.entries(expressions)) {
      results[key] = this.evaluateDirectly(expression, context);
    }
    
    return results;
  }

  /**
   * Valida se uma expressão é sintaticamente correta
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    const tempId = `validate_${Date.now()}`;
    
    try {
      const success = this.compileExpression(tempId, expression);
      this.compiledExpressions.delete(tempId);
      return { valid: success };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Cria um contexto padrão com variáveis comuns
   */
  createDefaultContext(time: number = 0, frame: number = 0): ExpressionContext {
    return {
      time,
      frame,
      fps: 30,
      duration: 10,
      
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      
      nodeId: '',
      nodeType: 'default',
      
      // Aliases comuns
      t: time,
      f: frame
    };
  }

  /**
   * Interpola entre dois valores usando uma expressão
   */
  interpolate(fromValue: number, toValue: number, expression: string, context: Partial<ExpressionContext>): number {
    const result = this.evaluateDirectly(expression, context);
    if (!result.success) return fromValue;
    
    const t = Math.max(0, Math.min(1, Number(result.value) || 0));
    return fromValue + (toValue - fromValue) * t;
  }

  /**
   * Cria uma expressão de keyframe animada
   */
  createKeyframeExpression(keyframes: Array<{ time: number; value: number; easing?: string }>): string {
    if (keyframes.length === 0) return '0';
    if (keyframes.length === 1) return keyframes[0].value.toString();
    
    // Ordenar keyframes por tempo
    keyframes.sort((a, b) => a.time - b.time);
    
    let expression = '';
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      const current = keyframes[i];
      const next = keyframes[i + 1];
      const easing = current.easing || 'linear';
      
      if (i > 0) expression += ' : ';
      
      expression += `time >= ${current.time} && time <= ${next.time} ? `;
      
      if (easing === 'linear') {
        expression += `lerp(${current.value}, ${next.value}, (time - ${current.time}) / ${next.time - current.time})`;
      } else {
        expression += `lerp(${current.value}, ${next.value}, ${easing}((time - ${current.time}) / ${next.time - current.time}))`;
      }
    }
    
    // Adicionar valores para antes do primeiro e depois do último keyframe
    const first = keyframes[0];
    const last = keyframes[keyframes.length - 1];
    
    expression = `time < ${first.time} ? ${first.value} : time > ${last.time} ? ${last.value} : ${expression}`;
    
    return expression;
  }

  /**
   * Gera documentação para funções matemáticas disponíveis
   */
  getAvailableFunctions(): Record<string, string> {
    return {
      // Trigonométricas
      'sin(x)': 'Seno de x (em radianos)',
      'cos(x)': 'Cosseno de x (em radianos)',
      'tan(x)': 'Tangente de x (em radianos)',
      'asin(x)': 'Arco seno de x',
      'acos(x)': 'Arco cosseno de x',
      'atan(x)': 'Arco tangente de x',
      'atan2(y, x)': 'Arco tangente de y/x',
      
      // Exponenciais
      'exp(x)': 'e elevado a x',
      'log(x)': 'Logaritmo natural de x',
      'log10(x)': 'Logaritmo base 10 de x',
      'pow(x, y)': 'x elevado a y',
      'sqrt(x)': 'Raiz quadrada de x',
      
      // Arredondamento
      'abs(x)': 'Valor absoluto de x',
      'floor(x)': 'Maior inteiro menor ou igual a x',
      'ceil(x)': 'Menor inteiro maior ou igual a x',
      'round(x)': 'Arredonda x para o inteiro mais próximo',
      
      // Interpolação
      'lerp(a, b, t)': 'Interpolação linear entre a e b usando t',
      'smoothstep(edge0, edge1, x)': 'Interpolação suave entre edge0 e edge1',
      
      // Easing
      'easeInQuad(t)': 'Easing quadrático de entrada',
      'easeOutQuad(t)': 'Easing quadrático de saída',
      'easeInOutQuad(t)': 'Easing quadrático de entrada e saída',
      
      // Ondas
      'wave(t, freq, amp, phase)': 'Onda senoidal com frequência, amplitude e fase',
      'sawtooth(t, freq)': 'Onda dente de serra',
      'triangle(t, freq)': 'Onda triangular',
      'square(t, freq, duty)': 'Onda quadrada com ciclo de trabalho',
      
      // Utilitárias
      'clamp(value, min, max)': 'Limita value entre min e max',
      'map(value, inMin, inMax, outMin, outMax)': 'Mapeia value de uma faixa para outra',
      'noise(x, y, z)': 'Ruído pseudo-aleatório baseado em coordenadas',
      'distance(x1, y1, x2, y2)': 'Distância euclidiana entre dois pontos 2D',
      'radToDeg(rad)': 'Converte radianos para graus',
      'degToRad(deg)': 'Converte graus para radianos'
    };
  }
  
  /**
   * Define variáveis globais disponíveis em todas as expressões
   */
  setGlobalContext(context: Partial<ExpressionContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }
  
  /**
   * Obtém informações sobre uma expressão compilada
   */
  getExpressionInfo(id: string): CompiledExpression | null {
    return this.compiledExpressions.get(id) || null;
  }
  
  /**
   * Remove uma expressão compilada
   */
  removeExpression(id: string): boolean {
    return this.compiledExpressions.delete(id);
  }
  
  /**
   * Lista todas as expressões compiladas
   */
  listExpressions(): string[] {
    return Array.from(this.compiledExpressions.keys());
  }
  
  /**
   * Limpa o cache de expressões
   */
  clearCache(): void {
    this.compiledExpressions.clear();
  }
  
  /**
   * Sanitiza uma expressão para prevenir código malicioso
   */
  private sanitizeExpression(expression: string): string {
    // Lista de palavras-chave perigosas
    const dangerousKeywords = [
      'eval', 'Function', 'constructor', 'prototype',
      'window', 'document', 'global', 'process',
      'require', 'import', 'export', 'module'
    ];
    
    // Verificar se contém palavras perigosas
    for (const keyword of dangerousKeywords) {
      if (expression.includes(keyword)) {
        throw new Error(`Palavra-chave não permitida: ${keyword}`);
      }
    }
    
    // Remover comentários
    expression = expression.replace(/\/\*[\s\S]*?\*\//g, '');
    expression = expression.replace(/\/\/.*$/gm, '');
    
    return expression.trim();
  }
  
  /**
   * Extrai dependências de uma expressão
   */
  private extractDependencies(expression: string): string[] {
    const dependencies: string[] = [];
    
    // Regex para identificar variáveis
    const variableRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;
    
    while ((match = variableRegex.exec(expression)) !== null) {
      const variable = match[1];
      
      // Ignorar palavras-chave JavaScript e funções matemáticas
      if (!this.isReservedWord(variable) && !dependencies.includes(variable)) {
        dependencies.push(variable);
      }
    }
    
    return dependencies;
  }
  
  /**
   * Verifica se uma palavra é reservada
   */
  private isReservedWord(word: string): boolean {
    const reserved = [
      'true', 'false', 'null', 'undefined',
      'if', 'else', 'for', 'while', 'do',
      'switch', 'case', 'default', 'break', 'continue',
      'function', 'return', 'var', 'let', 'const',
      'typeof', 'instanceof', 'new', 'this'
    ];
    
    return reserved.includes(word) || 
           this.mathFunctions.hasOwnProperty(word) ||
           this.utilityFunctions.hasOwnProperty(word);
  }
  
  /**
   * Inicializa funções matemáticas disponíveis
   */
  private initializeMathFunctions(): void {
    this.mathFunctions = {
      // Trigonométricas básicas
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      atan2: Math.atan2,
      
      // Hiperbólicas
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      
      // Logarítmicas e exponenciais
      exp: Math.exp,
      log: Math.log,
      log10: Math.log10,
      log2: Math.log2,
      pow: Math.pow,
      sqrt: Math.sqrt,
      cbrt: Math.cbrt,
      
      // Arredondamento
      abs: Math.abs,
      sign: Math.sign,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      trunc: Math.trunc,
      
      // Comparação
      min: Math.min,
      max: Math.max,
      
      // Aleatórios
      random: Math.random,
      
      // Constantes
      PI: Math.PI,
      E: Math.E,
      
      // Funções de interpolação
      lerp: (a: number, b: number, t: number) => a + (b - a) * t,
      smoothstep: (edge0: number, edge1: number, x: number) => {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
      },
      smootherstep: (edge0: number, edge1: number, x: number) => {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * t * (t * (t * 6 - 15) + 10);
      },
      
      // Funções de easing
      easeInQuad: (t: number) => t * t,
      easeOutQuad: (t: number) => t * (2 - t),
      easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: (t: number) => t * t * t,
      easeOutCubic: (t: number) => (--t) * t * t + 1,
      easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      easeInSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
      easeOutSine: (t: number) => Math.sin(t * Math.PI / 2),
      easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
      
      // Funções de onda
      wave: (t: number, frequency: number = 1, amplitude: number = 1, phase: number = 0) => {
        return amplitude * Math.sin(2 * Math.PI * frequency * t + phase);
      },
      sawtooth: (t: number, frequency: number = 1) => {
        return 2 * (t * frequency - Math.floor(t * frequency + 0.5));
      },
      triangle: (t: number, frequency: number = 1) => {
        const x = t * frequency;
        return 2 * Math.abs(2 * (x - Math.floor(x + 0.5))) - 1;
      },
      square: (t: number, frequency: number = 1, dutyCycle: number = 0.5) => {
        const x = t * frequency;
        return (x - Math.floor(x)) < dutyCycle ? 1 : -1;
      },
      
      // Funções de ruído (simplificadas)
      noise: (x: number, y: number = 0, z: number = 0) => {
        // Implementação simples de ruído pseudo-aleatório
        const hash = (n: number) => {
          n = ((n << 13) ^ n);
          return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
        };
        return hash(Math.floor(x * 1000) + Math.floor(y * 1000) * 1000 + Math.floor(z * 1000) * 1000000);
      },
      
      // Conversões de ângulo
      radians: (degrees: number) => degrees * Math.PI / 180,
      degrees: (radians: number) => radians * 180 / Math.PI,
      radToDeg: (rad: number) => rad * 180 / Math.PI,
      degToRad: (deg: number) => deg * Math.PI / 180,
      
      // Funções de clamp
      clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
      normalize: (value: number, min: number, max: number) => {
        return (value - min) / (max - min);
      },
      
      // Funções de mapeamento
      map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
      },
      
      // Funções de distância
      distance: (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      },
      distance3D: (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
      },
      
      // Funções de tempo
      pulse: (t: number, duration: number = 1) => {
        return t % duration < duration / 2 ? 1 : 0;
      },
      bounce: (t: number) => {
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      },
      
      // Funções de array/vetor
      length: (...args: number[]) => Math.sqrt(args.reduce((sum, val) => sum + val * val, 0)),
      dot: (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0),
      
      // Funções condicionais
      step: (edge: number, x: number) => x < edge ? 0 : 1
    };
  }
  
  /**
   * Inicializa funções utilitárias disponíveis
   */
  private initializeUtilityFunctions(): void {
    this.utilityFunctions = {
      // Funções de cor
      rgb: (r: number, g: number, b: number) => ({ r, g, b, a: 1 }),
      rgba: (r: number, g: number, b: number, a: number) => ({ r, g, b, a }),
      hsv: (h: number, s: number, v: number) => this.hsvToRgb(h, s, v),
      
      // Funções de vetor
      vec2: (x: number, y: number) => new THREE.Vector2(x, y),
      vec3: (x: number, y: number, z: number) => new THREE.Vector3(x, y, z),
      
      // Funções de tempo
      oscillate: (frequency: number, phase: number = 0) => {
        return (time: number) => Math.sin(time * frequency * 2 * Math.PI + phase);
      },
      
      // Funções de array
      length: (arr: any[]) => arr.length,
      sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
      average: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
      
      // Funções condicionais
      iff: (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,
      
      // Funções de string
      concat: (...args: any[]) => args.join(''),
      
      // Funções de debug
      log: console.log,
      warn: console.warn
    };
  }
  
  /**
   * Converte HSV para RGB
   */
  private hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number, a: number } {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a: 1
    };
  }
}

// Instância singleton do motor de expressões
export const expressionEngine = new ExpressionEngine();

// Tipos para propriedades animáveis
export interface AnimatableProperty {
  id: string;
  name: string;
  type: 'number' | 'vector2' | 'vector3' | 'color' | 'boolean';
  value: any;
  expression?: string;
  keyframes?: Keyframe[];
}

export interface Keyframe {
  time: number;
  value: any;
  easing?: string;
}

// Classe para gerenciar propriedades animáveis com expressões
export class AnimatablePropertyManager {
  private properties: Map<string, AnimatableProperty> = new Map();
  private engine: ExpressionEngine;
  
  constructor(engine: ExpressionEngine = expressionEngine) {
    this.engine = engine;
  }
  
  /**
   * Adiciona uma propriedade animável
   */
  addProperty(property: AnimatableProperty): void {
    this.properties.set(property.id, property);
    
    // Compilar expressão se existir
    if (property.expression) {
      this.engine.compileExpression(`prop_${property.id}`, property.expression);
    }
  }
  
  /**
   * Atualiza o valor de uma propriedade baseado em expressões ou keyframes
   */
  updateProperty(propertyId: string, context: ExpressionContext): any {
    const property = this.properties.get(propertyId);
    if (!property) return null;
    
    // Se tem expressão, avaliar
    if (property.expression) {
      const result = this.engine.evaluateExpression(`prop_${propertyId}`, context);
      if (result.success) {
        property.value = result.value;
        return result.value;
      }
    }
    
    // Se tem keyframes, interpolar
    if (property.keyframes && property.keyframes.length > 0) {
      const interpolatedValue = this.interpolateKeyframes(property.keyframes, context.time);
      property.value = interpolatedValue;
      return interpolatedValue;
    }
    
    return property.value;
  }
  
  /**
   * Interpola entre keyframes
   */
  private interpolateKeyframes(keyframes: Keyframe[], time: number): any {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0].value;
    
    // Ordenar keyframes por tempo
    const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
    
    // Se o tempo está antes do primeiro keyframe
    if (time <= sortedKeyframes[0].time) {
      return sortedKeyframes[0].value;
    }
    
    // Se o tempo está depois do último keyframe
    if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
      return sortedKeyframes[sortedKeyframes.length - 1].value;
    }
    
    // Encontrar keyframes adjacentes
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const current = sortedKeyframes[i];
      const next = sortedKeyframes[i + 1];
      
      if (time >= current.time && time <= next.time) {
        const t = (time - current.time) / (next.time - current.time);
        return this.interpolateValues(current.value, next.value, t, next.easing);
      }
    }
    
    return null;
  }
  
  /**
   * Interpola entre dois valores
   */
  private interpolateValues(a: any, b: any, t: number, easing?: string): any {
    // Aplicar easing se especificado
    if (easing) {
      t = this.applyEasing(t, easing);
    }
    
    // Interpolação baseada no tipo
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t;
    }
    
    if (a instanceof THREE.Vector2 && b instanceof THREE.Vector2) {
      return new THREE.Vector2().lerpVectors(a, b, t);
    }
    
    if (a instanceof THREE.Vector3 && b instanceof THREE.Vector3) {
      return new THREE.Vector3().lerpVectors(a, b, t);
    }
    
    // Para outros tipos, retornar o valor mais próximo
    return t < 0.5 ? a : b;
  }
  
  /**
   * Aplica função de easing
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'easeInQuad': return t * t;
      case 'easeOutQuad': return t * (2 - t);
      case 'easeInOutQuad': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'easeInCubic': return t * t * t;
      case 'easeOutCubic': return (--t) * t * t + 1;
      case 'easeInOutCubic': return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      default: return t; // linear
    }
  }
  
  /**
   * Obtém uma propriedade
   */
  getProperty(propertyId: string): AnimatableProperty | null {
    return this.properties.get(propertyId) || null;
  }
  
  /**
   * Remove uma propriedade
   */
  removeProperty(propertyId: string): boolean {
    const property = this.properties.get(propertyId);
    if (property && property.expression) {
      this.engine.removeExpression(`prop_${propertyId}`);
    }
    return this.properties.delete(propertyId);
  }
  
  /**
   * Lista todas as propriedades
   */
  listProperties(): string[] {
    return Array.from(this.properties.keys());
  }
}