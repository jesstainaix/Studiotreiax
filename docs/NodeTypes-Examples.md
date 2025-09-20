# Tipos de Nós - Guia Completo com Exemplos

## Visão Geral

O sistema de nós do Advanced VFX Engine suporta diferentes tipos de nós para processamento de efeitos visuais. Cada tipo tem características específicas e casos de uso otimizados.

## Tipos de Nós Disponíveis

### 1. Nó de Entrada (Input Node)

**Tipo:** `input`
**Descrição:** Nós que fornecem dados de entrada para o pipeline de processamento.

#### Exemplo de Configuração:
```javascript
const inputNode = {
  id: 'input-1',
  type: 'input',
  position: { x: 0, y: 0 },
  properties: {
    source: 'camera', // 'camera', 'file', 'texture'
    width: 1920,
    height: 1080,
    format: 'rgba'
  },
  outputs: [
    { id: 'output', type: 'texture', name: 'Texture Output' }
  ]
};
```

#### Casos de Uso:
- Captura de câmera em tempo real
- Carregamento de imagens/vídeos
- Geração de texturas procedurais
- Entrada de dados de sensores

### 2. Nó de Mistura (Blend Node)

**Tipo:** `blend`
**Descrição:** Combina duas ou mais entradas usando diferentes modos de mistura.

#### Exemplo de Configuração:
```javascript
const blendNode = {
  id: 'blend-1',
  type: 'blend',
  position: { x: 200, y: 100 },
  properties: {
    mode: 'multiply', // 'normal', 'multiply', 'screen', 'overlay', 'add'
    opacity: 0.8,
    maskEnabled: false
  },
  inputs: [
    { id: 'base', type: 'texture', name: 'Base Layer' },
    { id: 'overlay', type: 'texture', name: 'Overlay Layer' },
    { id: 'mask', type: 'texture', name: 'Mask (Optional)' }
  ],
  outputs: [
    { id: 'result', type: 'texture', name: 'Blended Result' }
  ]
};
```

#### Modos de Mistura Disponíveis:
- **Normal:** Sobreposição simples
- **Multiply:** Multiplicação de cores
- **Screen:** Efeito de tela
- **Overlay:** Combinação de multiply e screen
- **Add:** Adição de cores
- **Subtract:** Subtração de cores

### 3. Nó de Filtro (Filter Node)

**Tipo:** `filter`
**Descrição:** Aplica filtros e efeitos de processamento de imagem.

#### Exemplo de Configuração:
```javascript
const filterNode = {
  id: 'filter-1',
  type: 'filter',
  position: { x: 400, y: 50 },
  properties: {
    filterType: 'blur', // 'blur', 'sharpen', 'edge', 'emboss'
    intensity: 1.0,
    radius: 5.0,
    customShader: null // Shader personalizado opcional
  },
  inputs: [
    { id: 'input', type: 'texture', name: 'Input Texture' }
  ],
  outputs: [
    { id: 'output', type: 'texture', name: 'Filtered Output' }
  ]
};
```

#### Filtros Disponíveis:
- **Blur:** Desfoque gaussiano
- **Sharpen:** Aumento de nitidez
- **Edge:** Detecção de bordas
- **Emboss:** Efeito de relevo
- **Custom:** Shader personalizado

### 4. Nó de Efeito (Effect Node)

**Tipo:** `effect`
**Descrição:** Aplica efeitos visuais complexos e transformações.

#### Exemplo de Configuração:
```javascript
const effectNode = {
  id: 'effect-1',
  type: 'effect',
  position: { x: 600, y: 150 },
  properties: {
    effectType: 'distortion',
    parameters: {
      strength: 0.5,
      frequency: 2.0,
      amplitude: 0.1
    },
    animatable: true,
    expressions: {
      strength: 'sin(time * 2) * 0.3 + 0.2'
    }
  },
  inputs: [
    { id: 'input', type: 'texture', name: 'Source' },
    { id: 'control', type: 'texture', name: 'Control Map' }
  ],
  outputs: [
    { id: 'output', type: 'texture', name: 'Effect Output' }
  ]
};
```

#### Efeitos Disponíveis:
- **Distortion:** Distorção de imagem
- **Particle:** Sistema de partículas
- **Lighting:** Efeitos de iluminação
- **Color Grading:** Correção de cor
- **Chromatic Aberration:** Aberração cromática

### 5. Nó de Saída (Output Node)

**Tipo:** `output`
**Descrição:** Nós finais que exportam ou exibem o resultado processado.

#### Exemplo de Configuração:
```javascript
const outputNode = {
  id: 'output-1',
  type: 'output',
  position: { x: 800, y: 100 },
  properties: {
    destination: 'screen', // 'screen', 'file', 'stream'
    format: 'rgba',
    quality: 1.0,
    realtime: true
  },
  inputs: [
    { id: 'input', type: 'texture', name: 'Final Result' }
  ]
};
```

## Exemplos de Pipelines Completos

### Pipeline Básico de Processamento
```javascript
const basicPipeline = {
  nodes: [
    // Entrada de câmera
    {
      id: 'camera-input',
      type: 'input',
      properties: { source: 'camera' }
    },
    // Aplicar blur
    {
      id: 'blur-filter',
      type: 'filter',
      properties: { filterType: 'blur', radius: 3.0 }
    },
    // Saída para tela
    {
      id: 'screen-output',
      type: 'output',
      properties: { destination: 'screen' }
    }
  ],
  connections: [
    { from: 'camera-input.output', to: 'blur-filter.input' },
    { from: 'blur-filter.output', to: 'screen-output.input' }
  ]
};
```

### Pipeline com Múltiplas Camadas
```javascript
const multiLayerPipeline = {
  nodes: [
    // Camada base
    {
      id: 'base-layer',
      type: 'input',
      properties: { source: 'file', path: 'background.jpg' }
    },
    // Camada de overlay
    {
      id: 'overlay-layer',
      type: 'input',
      properties: { source: 'file', path: 'overlay.png' }
    },
    // Misturar camadas
    {
      id: 'blend-layers',
      type: 'blend',
      properties: { mode: 'overlay', opacity: 0.7 }
    },
    // Aplicar efeito de distorção
    {
      id: 'distortion-effect',
      type: 'effect',
      properties: {
        effectType: 'distortion',
        expressions: { strength: 'sin(time) * 0.2' }
      }
    },
    // Saída final
    {
      id: 'final-output',
      type: 'output',
      properties: { destination: 'screen' }
    }
  ],
  connections: [
    { from: 'base-layer.output', to: 'blend-layers.base' },
    { from: 'overlay-layer.output', to: 'blend-layers.overlay' },
    { from: 'blend-layers.result', to: 'distortion-effect.input' },
    { from: 'distortion-effect.output', to: 'final-output.input' }
  ]
};
```

## Propriedades Animáveis

Todos os nós suportam propriedades animáveis através do sistema de expressões:

```javascript
// Exemplo de propriedades animadas
const animatedNode = {
  id: 'animated-filter',
  type: 'filter',
  properties: {
    filterType: 'blur',
    radius: 5.0, // Valor padrão
    expressions: {
      // Animação baseada no tempo
      radius: 'sin(time * 2) * 3 + 5',
      // Animação baseada na posição do mouse
      intensity: 'mouseX / width'
    }
  }
};
```

## Variáveis Disponíveis nas Expressões

- **time:** Tempo atual em segundos
- **frame:** Número do frame atual
- **width/height:** Dimensões da textura
- **mouseX/mouseY:** Posição do mouse
- **random:** Valor aleatório (0-1)

## Funções Matemáticas Disponíveis

- **sin(x), cos(x), tan(x):** Funções trigonométricas
- **abs(x):** Valor absoluto
- **min(a,b), max(a,b):** Mínimo e máximo
- **clamp(x,min,max):** Limitar valor
- **lerp(a,b,t):** Interpolação linear
- **smoothstep(a,b,x):** Interpolação suave

## Otimização e Performance

### Dicas para Melhor Performance:
1. **Minimize conexões desnecessárias**
2. **Use cache quando possível**
3. **Evite expressões complexas em loops**
4. **Reutilize texturas quando apropriado**
5. **Configure qualidade adequada para o uso**

### Exemplo de Configuração Otimizada:
```javascript
const optimizedNode = {
  id: 'optimized-effect',
  type: 'effect',
  properties: {
    effectType: 'blur',
    cacheEnabled: true,
    quality: 0.8, // Reduzir qualidade se necessário
    updateFrequency: 30 // FPS limitado
  }
};
```

Esta documentação fornece uma base sólida para trabalhar com todos os tipos de nós disponíveis no sistema.