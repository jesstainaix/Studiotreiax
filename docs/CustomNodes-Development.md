# Guia de Desenvolvimento de Nós Customizados

## Visão Geral

Este guia explica como criar nós customizados para o Advanced VFX Engine, permitindo estender as funcionalidades do sistema com efeitos e processamentos personalizados.

## Arquitetura de Nós

### Interface Base do Nó

Todos os nós devem implementar a interface `CompositorNode`:

```typescript
interface CompositorNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  inputs: NodeSocket[];
  outputs: NodeSocket[];
  properties: Record<string, any>;
  processor?: NodeProcessor;
}
```

### Processador de Nó

Cada nó deve ter um processador que implementa `NodeProcessor`:

```typescript
interface NodeProcessor {
  process(inputs: Record<string, any>, properties: Record<string, any>): Promise<ProcessingResult>;
  getRequiredInputs(): string[];
  getOutputTypes(): Record<string, string>;
  validateProperties(properties: Record<string, any>): boolean;
}
```

## Criando um Nó Customizado

### Passo 1: Definir o Processador

```typescript
// src/processors/CustomEffectProcessor.ts
import { NodeProcessor, ProcessingResult } from '../services/NodeBasedCompositor';

export class CustomEffectProcessor implements NodeProcessor {
  async process(
    inputs: Record<string, any>, 
    properties: Record<string, any>
  ): Promise<ProcessingResult> {
    const inputTexture = inputs.input;
    const { intensity, color, mode } = properties;
    
    // Implementar lógica de processamento customizada
    const processedTexture = await this.applyCustomEffect(
      inputTexture, 
      intensity, 
      color, 
      mode
    );
    
    return {
      success: true,
      outputs: {
        output: processedTexture
      },
      metadata: {
        processingTime: Date.now(),
        effectApplied: 'custom-effect'
      }
    };
  }
  
  getRequiredInputs(): string[] {
    return ['input'];
  }
  
  getOutputTypes(): Record<string, string> {
    return {
      output: 'texture'
    };
  }
  
  validateProperties(properties: Record<string, any>): boolean {
    return (
      typeof properties.intensity === 'number' &&
      properties.intensity >= 0 &&
      properties.intensity <= 1 &&
      typeof properties.color === 'string' &&
      ['normal', 'multiply', 'screen'].includes(properties.mode)
    );
  }
  
  private async applyCustomEffect(
    texture: any, 
    intensity: number, 
    color: string, 
    mode: string
  ): Promise<any> {
    // Implementação do efeito customizado
    // Pode usar WebGL, Canvas 2D, ou outras tecnologias
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Aplicar transformações baseadas nos parâmetros
    // ...
    
    return canvas;
  }
}
```

### Passo 2: Registrar o Processador

```typescript
// src/services/NodeBasedCompositor.ts
import { CustomEffectProcessor } from '../processors/CustomEffectProcessor';

export class NodeBasedCompositor extends EventEmitter {
  private processors: Map<string, NodeProcessor>;
  
  constructor() {
    super();
    this.processors = new Map();
    this.registerDefaultProcessors();
    this.registerCustomProcessors();
  }
  
  private registerCustomProcessors(): void {
    // Registrar processadores customizados
    this.processors.set('custom-effect', new CustomEffectProcessor());
  }
  
  // Método para registrar processadores externos
  registerProcessor(type: string, processor: NodeProcessor): void {
    this.processors.set(type, processor);
  }
}
```

### Passo 3: Definir o Template do Nó

```typescript
// src/templates/CustomEffectNodeTemplate.ts
export const CustomEffectNodeTemplate = {
  type: 'custom-effect',
  name: 'Custom Effect',
  category: 'Effects',
  description: 'Aplica um efeito visual customizado',
  
  defaultProperties: {
    intensity: 0.5,
    color: '#ffffff',
    mode: 'normal',
    enabled: true
  },
  
  inputs: [
    {
      id: 'input',
      type: 'texture',
      name: 'Input Texture',
      required: true
    }
  ],
  
  outputs: [
    {
      id: 'output',
      type: 'texture',
      name: 'Processed Output'
    }
  ],
  
  propertySchema: {
    intensity: {
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      label: 'Intensity',
      animatable: true
    },
    color: {
      type: 'color',
      label: 'Effect Color',
      animatable: false
    },
    mode: {
      type: 'select',
      options: ['normal', 'multiply', 'screen'],
      label: 'Blend Mode',
      animatable: false
    }
  }
};
```

## Processamento com WebGL

### Shader Customizado

```typescript
// src/shaders/CustomEffectShader.ts
export class CustomEffectShader {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.program = this.createShaderProgram();
  }
  
  private createShaderProgram(): WebGLProgram {
    const vertexShader = this.compileShader(
      this.gl.VERTEX_SHADER,
      this.getVertexShaderSource()
    );
    
    const fragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER,
      this.getFragmentShaderSource()
    );
    
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    return program;
  }
  
  private getVertexShaderSource(): string {
    return `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
  }
  
  private getFragmentShaderSource(): string {
    return `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_intensity;
      uniform vec3 u_color;
      uniform float u_time;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        
        // Aplicar efeito customizado
        vec3 effect = u_color * u_intensity;
        vec3 result = mix(texColor.rgb, effect, u_intensity);
        
        // Adicionar animação baseada no tempo
        float wave = sin(u_time * 2.0 + v_texCoord.x * 10.0) * 0.1;
        result += wave * u_intensity;
        
        gl_FragColor = vec4(result, texColor.a);
      }
    `;
  }
  
  render(texture: WebGLTexture, properties: any): void {
    this.gl.useProgram(this.program);
    
    // Configurar uniforms
    const intensityLocation = this.gl.getUniformLocation(this.program, 'u_intensity');
    const colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
    const timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
    
    this.gl.uniform1f(intensityLocation, properties.intensity);
    this.gl.uniform3f(colorLocation, ...this.hexToRgb(properties.color));
    this.gl.uniform1f(timeLocation, performance.now() / 1000);
    
    // Renderizar
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
  
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
  }
}
```

## Integração com Sistema de Expressões

### Suporte a Expressões Animáveis

```typescript
// src/processors/AnimatedCustomProcessor.ts
import { ExpressionEngine } from '../services/ExpressionEngine';

export class AnimatedCustomProcessor implements NodeProcessor {
  private expressionEngine: ExpressionEngine;
  
  constructor() {
    this.expressionEngine = new ExpressionEngine();
  }
  
  async process(
    inputs: Record<string, any>, 
    properties: Record<string, any>
  ): Promise<ProcessingResult> {
    // Avaliar expressões para propriedades animáveis
    const evaluatedProperties = await this.evaluateExpressions(properties);
    
    // Processar com propriedades avaliadas
    return this.processWithEvaluatedProperties(inputs, evaluatedProperties);
  }
  
  private async evaluateExpressions(
    properties: Record<string, any>
  ): Promise<Record<string, any>> {
    const evaluated = { ...properties };
    
    // Avaliar expressões se existirem
    if (properties.expressions) {
      for (const [key, expression] of Object.entries(properties.expressions)) {
        if (typeof expression === 'string') {
          try {
            evaluated[key] = await this.expressionEngine.evaluate(expression);
          } catch (error) {
            console.warn(`Erro ao avaliar expressão para ${key}:`, error);
            // Manter valor padrão em caso de erro
          }
        }
      }
    }
    
    return evaluated;
  }
}
```

## Sistema de Plugins

### Carregamento Dinâmico de Nós

```typescript
// src/plugins/PluginManager.ts
export class PluginManager {
  private loadedPlugins: Map<string, any> = new Map();
  private compositor: NodeBasedCompositor;
  
  constructor(compositor: NodeBasedCompositor) {
    this.compositor = compositor;
  }
  
  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const plugin = await import(pluginPath);
      
      if (plugin.default && plugin.default.register) {
        await plugin.default.register(this.compositor);
        this.loadedPlugins.set(pluginPath, plugin.default);
        
        console.log(`Plugin carregado: ${pluginPath}`);
      } else {
        throw new Error('Plugin deve exportar função register');
      }
    } catch (error) {
      console.error(`Erro ao carregar plugin ${pluginPath}:`, error);
    }
  }
  
  unloadPlugin(pluginPath: string): void {
    const plugin = this.loadedPlugins.get(pluginPath);
    if (plugin && plugin.unregister) {
      plugin.unregister(this.compositor);
      this.loadedPlugins.delete(pluginPath);
    }
  }
}
```

### Estrutura de Plugin

```typescript
// plugins/MyCustomPlugin.ts
import { NodeBasedCompositor } from '../src/services/NodeBasedCompositor';
import { MyCustomProcessor } from './MyCustomProcessor';

export default {
  name: 'My Custom Plugin',
  version: '1.0.0',
  
  register(compositor: NodeBasedCompositor): void {
    // Registrar processadores
    compositor.registerProcessor('my-custom-effect', new MyCustomProcessor());
    
    // Registrar templates de nós
    // compositor.registerNodeTemplate(MyCustomNodeTemplate);
    
    console.log('My Custom Plugin registrado');
  },
  
  unregister(compositor: NodeBasedCompositor): void {
    // Limpar recursos se necessário
    console.log('My Custom Plugin removido');
  }
};
```

## Testes para Nós Customizados

### Teste Unitário

```typescript
// tests/CustomEffectProcessor.test.ts
import { CustomEffectProcessor } from '../src/processors/CustomEffectProcessor';

describe('CustomEffectProcessor', () => {
  let processor: CustomEffectProcessor;
  
  beforeEach(() => {
    processor = new CustomEffectProcessor();
  });
  
  test('deve processar entrada corretamente', async () => {
    const mockInput = { input: createMockTexture() };
    const properties = {
      intensity: 0.5,
      color: '#ff0000',
      mode: 'normal'
    };
    
    const result = await processor.process(mockInput, properties);
    
    expect(result.success).toBe(true);
    expect(result.outputs.output).toBeDefined();
  });
  
  test('deve validar propriedades corretamente', () => {
    const validProperties = {
      intensity: 0.5,
      color: '#ffffff',
      mode: 'normal'
    };
    
    const invalidProperties = {
      intensity: 2.0, // Inválido: > 1
      color: 'invalid-color',
      mode: 'invalid-mode'
    };
    
    expect(processor.validateProperties(validProperties)).toBe(true);
    expect(processor.validateProperties(invalidProperties)).toBe(false);
  });
});

function createMockTexture(): any {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  return canvas;
}
```

## Melhores Práticas

### Performance
1. **Cache resultados** quando possível
2. **Reutilize recursos** (texturas, shaders)
3. **Evite alocações desnecessárias** no loop de renderização
4. **Use WebGL** para processamento intensivo

### Compatibilidade
1. **Valide entradas** sempre
2. **Forneça fallbacks** para recursos não suportados
3. **Documente dependências** claramente
4. **Teste em diferentes navegadores**

### Manutenibilidade
1. **Separe lógica** em módulos pequenos
2. **Use TypeScript** para tipagem forte
3. **Escreva testes** abrangentes
4. **Documente APIs** públicas

## Exemplo Completo

Veja o arquivo `examples/CustomNodeExample.ts` para um exemplo completo de implementação de nó customizado com todas as funcionalidades integradas.

Este guia fornece a base necessária para criar nós customizados poderosos e bem integrados ao sistema VFX Engine.