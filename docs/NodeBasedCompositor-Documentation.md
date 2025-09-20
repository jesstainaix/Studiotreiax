# Documentação Técnica - Sistema de Nós do Advanced VFX Engine

## Visão Geral

O NodeBasedCompositor é um sistema avançado de composição baseado em nós que permite criar efeitos visuais complexos através de uma interface visual intuitiva. O sistema suporta processamento em tempo real, expressões JavaScript para automação e uma arquitetura extensível para nós customizados.

## Arquitetura do Sistema

### Componentes Principais

1. **NodeBasedCompositor**: Classe principal que gerencia o grafo de nós
2. **ExpressionEngine**: Sistema de expressões JavaScript para automação
3. **TemporalContextManager**: Gerenciador de contexto temporal e animações
4. **NodeProcessor**: Classes base para processamento de nós

### Fluxo de Dados

```
Entrada → Nós de Processamento → Conexões → Saída Final
    ↓           ↓                  ↓         ↓
Imagens    Transformações    Blend/Mix   Resultado
```

## Tipos de Nós Disponíveis

### 1. Nós de Entrada (Input)
- **input**: Nó de entrada básico para imagens/vídeos
- **generator**: Gerador de texturas procedurais
- **texture**: Carregador de texturas estáticas

### 2. Nós de Transformação (Transform)
- **transform**: Transformações básicas (posição, rotação, escala)
- **distortion**: Distorções avançadas (wave, ripple, twist)
- **mask**: Aplicação de máscaras e recortes

### 3. Nós de Efeitos (Effects)
- **filter**: Filtros de imagem (blur, sharpen, edge detection)
- **color**: Correção de cor (brightness, contrast, saturation)
- **lighting**: Efeitos de iluminação (ambient, directional, point)
- **particle**: Sistemas de partículas
- **volumetric**: Efeitos volumétricos (fog, smoke)

### 4. Nós de Composição (Blend)
- **blend**: Modos de mistura (normal, multiply, screen, overlay)
- **math**: Operações matemáticas entre imagens
- **conditional**: Lógica condicional para processamento

### 5. Nós de Saída (Output)
- **output**: Nó de saída final

## Sistema de Expressões JavaScript

### Variáveis Disponíveis

```javascript
// Variáveis temporais
time        // Tempo atual em segundos
frame       // Frame atual
fps         // Frames por segundo
deltaTime   // Delta time desde o último frame

// Variáveis espaciais
position.x  // Posição X do nó
position.y  // Posição Y do nó
rotation    // Rotação em radianos
scale.x     // Escala X
scale.y     // Escala Y

// Propriedades do nó
opacity     // Opacidade (0-1)
visible     // Visibilidade (boolean)
```

### Funções Matemáticas

#### Trigonométricas
```javascript
sin(x)      // Seno
cos(x)      // Cosseno
tan(x)      // Tangente
asin(x)     // Arco seno
acos(x)     // Arco cosseno
atan(x)     // Arco tangente
atan2(y,x)  // Arco tangente de y/x
```

#### Exponenciais e Logarítmicas
```javascript
exp(x)      // e^x
log(x)      // Logaritmo natural
log10(x)    // Logaritmo base 10
log2(x)     // Logaritmo base 2
pow(x,y)    // x^y
sqrt(x)     // Raiz quadrada
cbrt(x)     // Raiz cúbica
```

#### Interpolação e Easing
```javascript
lerp(a,b,t)           // Interpolação linear
smoothstep(a,b,t)     // Interpolação suave
easeIn(t)             // Ease in quadrático
easeOut(t)            // Ease out quadrático
easeInOut(t)          // Ease in-out quadrático
elastic(t)            // Easing elástico
bounce(t)             // Easing bounce
```

#### Funções de Onda
```javascript
wave(freq, phase, amp) // Onda senoidal
square(freq, phase)    // Onda quadrada
triangle(freq, phase)  // Onda triangular
sawtooth(freq, phase)  // Onda dente de serra
```

#### Ruído (Noise)
```javascript
noise(x)              // Ruído 1D
noise2D(x, y)         // Ruído 2D
noise3D(x, y, z)      // Ruído 3D
fbm(x, octaves)       // Fractional Brownian Motion
```

### Exemplos de Expressões

#### Animação de Rotação
```javascript
// Rotação contínua
rotation = time * 2 * PI;

// Rotação oscilatória
rotation = sin(time * 2) * PI / 4;
```

#### Animação de Posição
```javascript
// Movimento circular
position.x = cos(time) * 100;
position.y = sin(time) * 100;

// Movimento com ruído
position.x = noise(time * 0.5) * 200;
position.y = noise(time * 0.5 + 100) * 200;
```

#### Animação de Opacidade
```javascript
// Fade in/out
opacity = smoothstep(0, 2, time % 4);

// Pulsação
opacity = (sin(time * 4) + 1) * 0.5;
```

## Interface de Programação (API)

### Criando um Compositor

```typescript
import { NodeBasedCompositor } from './services/NodeBasedCompositor';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const compositor = new NodeBasedCompositor(canvas);
```

### Adicionando Nós

```typescript
// Criar nó de entrada
const inputNode = {
  id: 'input_1',
  type: 'input' as const,
  name: 'Entrada de Vídeo',
  position: { x: 100, y: 100 },
  inputs: [],
  outputs: [{
    id: 'output',
    name: 'Imagem',
    type: 'output',
    dataType: 'image',
    value: null,
    connected: false
  }],
  parameters: {
    source: 'video_source'
  },
  enabled: true,
  processing: false
};

compositor.addNode(inputNode);
```

### Conectando Nós

```typescript
const connection = {
  id: 'conn_1',
  sourceNodeId: 'input_1',
  sourceSocket: 'output',
  targetNodeId: 'effect_1',
  targetSocket: 'input',
  dataType: 'image' as const
};

compositor.addConnection(connection);
```

### Definindo Expressões

```typescript
// Definir expressão para rotação
compositor.setNodeExpression('effect_1', 'rotation', 'sin(time * 2) * PI / 4');

// Definir expressão para opacidade
compositor.setNodeExpression('effect_1', 'opacity', '(sin(time * 4) + 1) * 0.5');
```

### Processamento

```typescript
// Processar todos os nós
const results = await compositor.processAll();

// Processar nó específico
const result = await compositor.processNode('effect_1');
```

## Eventos do Sistema

### Eventos Disponíveis

```typescript
// Eventos de nós
compositor.on('nodeAdded', (node) => { /* ... */ });
compositor.on('nodeRemoved', (nodeId) => { /* ... */ });
compositor.on('nodeProcessed', (nodeId, result) => { /* ... */ });
compositor.on('nodeError', (nodeId, error) => { /* ... */ });

// Eventos de conexões
compositor.on('connectionAdded', (connection) => { /* ... */ });
compositor.on('connectionRemoved', (connectionId) => { /* ... */ });

// Eventos temporais
compositor.on('timeUpdate', (time) => { /* ... */ });
compositor.on('frameUpdate', (frame) => { /* ... */ });
```

## Performance e Otimização

### Dicas de Performance

1. **Cache de Resultados**: Use cache para nós que não mudam frequentemente
2. **Processamento Assíncrono**: Processe nós em paralelo quando possível
3. **Otimização de Expressões**: Evite expressões complexas em loops
4. **Gerenciamento de Memória**: Limpe recursos não utilizados

### Métricas de Performance

```typescript
// Obter estatísticas
const stats = compositor.getStats();
console.log('Nós processados:', stats.processedNodes);
console.log('Tempo de processamento:', stats.processingTime);
console.log('FPS:', stats.fps);
```

## Tratamento de Erros

### Tipos de Erro

1. **Erro de Conexão**: Conexões inválidas entre nós
2. **Erro de Processamento**: Falha no processamento de um nó
3. **Erro de Expressão**: Erro na avaliação de expressões JavaScript
4. **Erro de Recurso**: Falha no carregamento de recursos

### Exemplo de Tratamento

```typescript
compositor.on('nodeError', (nodeId, error) => {
  console.error(`Erro no nó ${nodeId}:`, error);
  
  // Desabilitar nó com erro
  const node = compositor.getNode(nodeId);
  if (node) {
    node.enabled = false;
    node.error = error.message;
  }
});
```

## Extensibilidade

### Criando Nós Customizados

Veja o guia de desenvolvimento de nós customizados para informações detalhadas sobre como criar seus próprios tipos de nós.

### Plugins e Extensões

O sistema suporta plugins para adicionar funcionalidades extras:

```typescript
// Registrar plugin
compositor.registerPlugin(new CustomEffectPlugin());
```

## Conclusão

O NodeBasedCompositor oferece uma plataforma poderosa e flexível para criação de efeitos visuais avançados. Com suporte a expressões JavaScript, processamento em tempo real e arquitetura extensível, é possível criar desde efeitos simples até composições complexas de alta qualidade.

Para mais informações, consulte os exemplos práticos e o guia de desenvolvimento de nós customizados.