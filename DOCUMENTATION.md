# Documentação PPTX Studio

## Visão Geral

O PPTX Studio é um módulo avançado para manipulação de apresentações PowerPoint, oferecendo funcionalidades robustas para criação, edição e otimização de arquivos PPTX.

## Componentes Principais

### 1. EnhancedPPTXParser
Classe responsável por analisar e extrair informações de arquivos PPTX.

```javascript
const parser = new EnhancedPPTXParser();
const document = await parser.parsePPTX(buffer, 'presentation.pptx');
```

### 2. PPTXSlideManager
Gerencia a criação e manipulação de slides.

```javascript
const slideManager = new PPTXSlideManager();

// Criar novo slide
const slide = await slideManager.createSlide({
  title: 'Meu Slide',
  content: [
    { type: 'text', text: 'Exemplo' },
    { type: 'image', src: './imagem.jpg' }
  ]
});
```

### 3. PPTXTemplateManager
Sistema de templates para reutilização de layouts.

```javascript
const templateManager = new PPTXTemplateManager();

// Registrar template
templateManager.registerTemplate('meuTemplate', {
  layout: 'custom',
  elements: [
    { type: 'title', position: 'top' },
    { type: 'content', position: 'center' }
  ]
});
```

### 4. PPTXStyleManager
Gerenciamento de estilos e efeitos visuais.

```javascript
const styleManager = new PPTXStyleManager();

// Criar estilo com gradiente
const style = {
  fill: styleManager.fills.gradient([
    { position: 0, color: '#FF0000' },
    { position: 1, color: '#0000FF' }
  ])
};
```

### 5. PPTXResourceOptimizer
Otimização de recursos como imagens.

```javascript
const optimizer = new PPTXResourceOptimizer();

// Otimizar imagem
const optimizedImage = await optimizer.optimizeImage(buffer, 'jpeg');
```

### 6. PPTXHistoryManager
Controle de histórico de alterações.

```javascript
const history = new PPTXHistoryManager();

// Registrar ação
history.recordState({
  type: 'edit',
  target: 'slide1',
  changes: { title: 'Novo Título' }
});
```

## Exemplos de Uso

### Criar Apresentação Completa

```javascript
async function criarApresentacao() {
  const parser = new EnhancedPPTXParser();
  const slideManager = new PPTXSlideManager();
  const templateManager = new PPTXTemplateManager();

  // Criar slides
  const slides = await Promise.all([
    slideManager.createSlide({
      title: 'Introdução',
      content: [
        { type: 'text', text: 'Bem-vindo!' }
      ]
    }),
    slideManager.createSlide({
      title: 'Conteúdo',
      content: [
        { type: 'image', src: './diagrama.jpg' },
        { type: 'text', text: 'Explicação do diagrama' }
      ]
    })
  ]);

  // Aplicar template
  await Promise.all(
    slides.map(slide => 
      templateManager.applyTemplateToSlide(slide.id, 'default')
    )
  );

  return slides;
}
```

### Trabalhar com Estilos

```javascript
async function aplicarEstilos(slide) {
  const styleManager = new PPTXStyleManager();

  const titulo = {
    fill: styleManager.fills.solid('#1a73e8'),
    effects: [
      styleManager.effects.shadow({
        blur: 5,
        distance: 3,
        color: '#000000'
      })
    ]
  };

  const conteudo = {
    fill: styleManager.fills.gradient([
      { position: 0, color: '#ffffff' },
      { position: 1, color: '#f1f3f4' }
    ]),
    effects: [
      styleManager.effects.glow({
        color: '#4285f4',
        size: 3
      })
    ]
  };

  await styleManager.applyStyleToShape(slide.title, titulo);
  await styleManager.applyStyleToShape(slide.content, conteudo);
}
```

### Otimizar Recursos

```javascript
async function otimizarApresentacao(pptxBuffer) {
  const optimizer = new PPTXResourceOptimizer({
    maxImageWidth: 1920,
    maxImageHeight: 1080,
    imageQuality: 85,
    enableDeduplication: true
  });

  // Otimizar apresentação
  const optimizedPPTX = await optimizer.optimizePPTXResources(pptxBuffer);

  return optimizedPPTX;
}
```

## Referência da API

### EnhancedPPTXParser

- `parsePPTX(buffer, filename)`: Analisa arquivo PPTX
- `extractMetadata(zip)`: Extrai metadados
- `extractDesignSystem(zip)`: Extrai sistema de design
- `extractMasterLayouts(zip)`: Extrai layouts mestre

### PPTXSlideManager

- `createSlide(options)`: Cria novo slide
- `addSlideToPresentation(pptx, slide)`: Adiciona slide
- `removeSlideFromPresentation(pptx, slideId)`: Remove slide
- `updateSlide(pptx, slideId, options)`: Atualiza slide

### PPTXTemplateManager

- `registerTemplate(name, template)`: Registra template
- `getTemplate(name)`: Recupera template
- `listTemplates()`: Lista templates disponíveis
- `createSlideFromTemplate(name, data)`: Cria slide de template

### PPTXStyleManager

- `fills`: Coleção de preenchimentos
- `effects`: Coleção de efeitos
- `transitions`: Coleção de transições
- `animations`: Coleção de animações
- `applyStyleToShape(shape, styles)`: Aplica estilos

### PPTXResourceOptimizer

- `optimizeImage(buffer, format, options)`: Otimiza imagem
- `optimizePPTXResources(pptxBuffer)`: Otimiza apresentação
- `clearCache()`: Limpa cache de recursos
- `pruneCache(maxAge)`: Limpa cache antigo

### PPTXHistoryManager

- `recordState(action)`: Registra ação
- `undo()`: Desfaz última ação
- `redo()`: Refaz ação desfeita
- `getHistory()`: Obtém histórico completo
- `goToState(stateId)`: Vai para estado específico

## Guia de Resolução de Problemas

### Problemas Comuns

1. **Erro ao criar slide**
   - Verifique se todos os recursos existem
   - Confirme se o template é válido
   - Valide os parâmetros passados

2. **Problemas de Performance**
   - Use otimização de recursos
   - Implemente cache quando possível
   - Evite operações síncronas

3. **Erros de Memória**
   - Utilize streams para arquivos grandes
   - Implemente limpeza periódica de cache
   - Otimize recursos antes de adicionar

## Melhores Práticas

1. **Organização de Código**
   - Use módulos separados para cada funcionalidade
   - Mantenha responsabilidades bem definidas
   - Implemente tratamento de erros adequado

2. **Performance**
   - Otimize recursos antes de usar
   - Use operações em lote quando possível
   - Implemente cache estrategicamente

3. **Manutenção**
   - Mantenha documentação atualizada
   - Use versionamento semântico
   - Implemente testes automatizados

## Recursos Adicionais

- [Referência OOXML](https://docs.microsoft.com/office/open-xml/open-xml-sdk)
- [Especificação PresentationML](https://docs.microsoft.com/office/open-xml/presentation-ml)
- [Exemplos de Código](./examples/)