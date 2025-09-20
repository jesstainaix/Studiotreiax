/**
 * Extrator de Elementos Complexos para PPTX
 * Especializado em tabelas, gráficos, SmartArt e outros elementos avançados
 */

// Interfaces para elementos complexos
export interface TableElement {
  type: 'table';
  id: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rows: number;
  columns: number;
  data: TableCell[][];
  style: {
    borderStyle?: string;
    borderColor?: string;
    borderWidth?: number;
    backgroundColor?: string;
    headerStyle?: CellStyle;
  };
  metadata: {
    hasHeader: boolean;
    hasFooter: boolean;
    totalCells: number;
    emptycells: number;
  };
}

export interface TableCell {
  content: string;
  rowSpan: number;
  colSpan: number;
  style: CellStyle;
  dataType: 'text' | 'number' | 'date' | 'formula' | 'empty';
  alignment: {
    horizontal: 'left' | 'center' | 'right' | 'justify';
    vertical: 'top' | 'middle' | 'bottom';
  };
}

export interface CellStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'strikethrough';
  border?: {
    top?: BorderStyle;
    right?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
  };
}

export interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  color: string;
}

export interface ChartElement {
  type: 'chart';
  id: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'bubble' | 'doughnut' | 'radar' | 'combo';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  title?: string;
  data: ChartData;
  style: ChartStyle;
  axes?: {
    x?: AxisConfig;
    y?: AxisConfig;
    y2?: AxisConfig; // Para gráficos com eixo Y secundário
  };
  legend?: LegendConfig;
  metadata: {
    dataPoints: number;
    series: number;
    hasAnimation: boolean;
    is3D: boolean;
  };
}

export interface ChartData {
  categories: string[];
  series: ChartSeries[];
  rawData?: any; // Dados brutos do Excel/PowerPoint
}

export interface ChartSeries {
  name: string;
  data: (number | null)[];
  color?: string;
  type?: string; // Para gráficos combo
  yAxisId?: 'primary' | 'secondary';
}

export interface ChartStyle {
  backgroundColor?: string;
  plotAreaColor?: string;
  gridLines?: {
    major?: GridLineStyle;
    minor?: GridLineStyle;
  };
  dataLabels?: {
    show: boolean;
    position?: 'center' | 'outside' | 'inside';
    format?: string;
  };
}

export interface GridLineStyle {
  show: boolean;
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface AxisConfig {
  title?: string;
  min?: number;
  max?: number;
  tickInterval?: number;
  format?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  alignment?: 'start' | 'center' | 'end';
}

export interface SmartArtElement {
  type: 'smartart';
  id: string;
  smartArtType: 'list' | 'process' | 'cycle' | 'hierarchy' | 'relationship' | 'matrix' | 'pyramid' | 'picture';
  layout: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  nodes: SmartArtNode[];
  connections: SmartArtConnection[];
  style: SmartArtStyle;
  metadata: {
    nodeCount: number;
    levels: number;
    hasImages: boolean;
    colorScheme?: string;
  };
}

export interface SmartArtNode {
  id: string;
  text: string;
  level: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
  };
  image?: {
    src: string;
    alt: string;
  };
  children: string[]; // IDs dos nós filhos
}

export interface SmartArtConnection {
  from: string;
  to: string;
  type: 'arrow' | 'line' | 'curve';
  style: {
    color?: string;
    width?: number;
    dashStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

export interface SmartArtStyle {
  colorScheme?: string;
  effectStyle?: string;
  fontScheme?: string;
  backgroundColor?: string;
}

export interface DiagramElement {
  type: 'diagram';
  id: string;
  diagramType: 'flowchart' | 'organizational' | 'network' | 'timeline' | 'mindmap';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  elements: DiagramNode[];
  connections: DiagramConnection[];
  style: DiagramStyle;
}

export interface DiagramNode {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond' | 'triangle' | 'custom';
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    textColor?: string;
    fontSize?: number;
  };
}

export interface DiagramConnection {
  id: string;
  from: string;
  to: string;
  type: 'straight' | 'curved' | 'elbow';
  style: {
    stroke?: string;
    strokeWidth?: number;
    dashArray?: string;
    markerEnd?: 'arrow' | 'circle' | 'square';
  };
  label?: string;
}

export interface DiagramStyle {
  backgroundColor?: string;
  gridVisible?: boolean;
  snapToGrid?: boolean;
}

export interface MediaElement {
  type: 'media';
  id: string;
  mediaType: 'video' | 'audio' | 'animation';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  source: {
    url?: string;
    embedded?: boolean;
    format?: string;
    duration?: number;
  };
  controls: {
    autoPlay?: boolean;
    loop?: boolean;
    showControls?: boolean;
    volume?: number;
  };
  thumbnail?: {
    src: string;
    alt: string;
  };
}

export type ComplexElement = TableElement | ChartElement | SmartArtElement | DiagramElement | MediaElement;

export interface ExtractionConfig {
  extractTables: boolean;
  extractCharts: boolean;
  extractSmartArt: boolean;
  extractDiagrams: boolean;
  extractMedia: boolean;
  preserveFormatting: boolean;
  includeMetadata: boolean;
  optimizeForWeb: boolean;
  generateThumbnails: boolean;
}

export interface ExtractionResult {
  elements: ComplexElement[];
  summary: {
    totalElements: number;
    tables: number;
    charts: number;
    smartArt: number;
    diagrams: number;
    media: number;
  };
  errors: ExtractionError[];
  warnings: string[];
  processingTime: number;
}

export interface ExtractionError {
  elementId: string;
  elementType: string;
  error: string;
  severity: 'low' | 'medium' | 'high';
  recoverable: boolean;
}

/**
 * Classe principal para extração de elementos complexos
 */
export class ComplexElementsExtractor {
  private static instance: ComplexElementsExtractor;
  private config: ExtractionConfig;

  private constructor() {
    this.config = {
      extractTables: true,
      extractCharts: true,
      extractSmartArt: true,
      extractDiagrams: true,
      extractMedia: true,
      preserveFormatting: true,
      includeMetadata: true,
      optimizeForWeb: true,
      generateThumbnails: false
    };
  }

  public static getInstance(): ComplexElementsExtractor {
    if (!ComplexElementsExtractor.instance) {
      ComplexElementsExtractor.instance = new ComplexElementsExtractor();
    }
    return ComplexElementsExtractor.instance;
  }

  /**
   * Configura o extrator
   */
  public configure(config: Partial<ExtractionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Extrai elementos complexos de um slide
   */
  public async extractFromSlide(slideData: any, slideIndex: number): Promise<ExtractionResult> {
    const startTime = Date.now();
    const elements: ComplexElement[] = [];
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];

    try {

      // Extrai tabelas
      if (this.config.extractTables) {
        const tables = await this.extractTables(slideData, slideIndex);
        elements.push(...tables.elements);
        errors.push(...tables.errors);
        warnings.push(...tables.warnings);
      }

      // Extrai gráficos
      if (this.config.extractCharts) {
        const charts = await this.extractCharts(slideData, slideIndex);
        elements.push(...charts.elements);
        errors.push(...charts.errors);
        warnings.push(...charts.warnings);
      }

      // Extrai SmartArt
      if (this.config.extractSmartArt) {
        const smartArt = await this.extractSmartArt(slideData, slideIndex);
        elements.push(...smartArt.elements);
        errors.push(...smartArt.errors);
        warnings.push(...smartArt.warnings);
      }

      // Extrai diagramas
      if (this.config.extractDiagrams) {
        const diagrams = await this.extractDiagrams(slideData, slideIndex);
        elements.push(...diagrams.elements);
        errors.push(...diagrams.errors);
        warnings.push(...diagrams.warnings);
      }

      // Extrai elementos de mídia
      if (this.config.extractMedia) {
        const media = await this.extractMedia(slideData, slideIndex);
        elements.push(...media.elements);
        errors.push(...media.errors);
        warnings.push(...media.warnings);
      }

      const processingTime = Date.now() - startTime;

      const summary = {
        totalElements: elements.length,
        tables: elements.filter(e => e.type === 'table').length,
        charts: elements.filter(e => e.type === 'chart').length,
        smartArt: elements.filter(e => e.type === 'smartart').length,
        diagrams: elements.filter(e => e.type === 'diagram').length,
        media: elements.filter(e => e.type === 'media').length
      };

      return {
        elements,
        summary,
        errors,
        warnings,
        processingTime
      };

    } catch (error) {
      console.error('Error extracting complex elements:', error);
      errors.push({
        elementId: 'unknown',
        elementType: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        severity: 'high',
        recoverable: false
      });

      return {
        elements,
        summary: {
          totalElements: 0,
          tables: 0,
          charts: 0,
          smartArt: 0,
          diagrams: 0,
          media: 0
        },
        errors,
        warnings,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extrai tabelas do slide
   */
  private async extractTables(slideData: any, slideIndex: number): Promise<{
    elements: TableElement[];
    errors: ExtractionError[];
    warnings: string[];
  }> {
    const elements: TableElement[] = [];
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];

    try {
      // Busca por elementos de tabela no XML do slide
      const tableElements = this.findTableElements(slideData);

      for (let i = 0; i < tableElements.length; i++) {
        const tableXml = tableElements[i];
        
        try {
          const table = await this.parseTable(tableXml, `slide-${slideIndex}-table-${i}`);
          elements.push(table);
        } catch (error) {
          errors.push({
            elementId: `slide-${slideIndex}-table-${i}`,
            elementType: 'table',
            error: error instanceof Error ? error.message : 'Failed to parse table',
            severity: 'medium',
            recoverable: true
          });
        }
      }

      if (elements.length > 0) {
      }

    } catch (error) {
      errors.push({
        elementId: `slide-${slideIndex}`,
        elementType: 'table',
        error: 'Failed to extract tables from slide',
        severity: 'low',
        recoverable: true
      });
    }

    return { elements, errors, warnings };
  }

  /**
   * Extrai gráficos do slide
   */
  private async extractCharts(slideData: any, slideIndex: number): Promise<{
    elements: ChartElement[];
    errors: ExtractionError[];
    warnings: string[];
  }> {
    const elements: ChartElement[] = [];
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];

    try {
      const chartElements = this.findChartElements(slideData);

      for (let i = 0; i < chartElements.length; i++) {
        const chartXml = chartElements[i];
        
        try {
          const chart = await this.parseChart(chartXml, `slide-${slideIndex}-chart-${i}`);
          elements.push(chart);
        } catch (error) {
          errors.push({
            elementId: `slide-${slideIndex}-chart-${i}`,
            elementType: 'chart',
            error: error instanceof Error ? error.message : 'Failed to parse chart',
            severity: 'medium',
            recoverable: true
          });
        }
      }

      if (elements.length > 0) {
      }

    } catch (error) {
      errors.push({
        elementId: `slide-${slideIndex}`,
        elementType: 'chart',
        error: 'Failed to extract charts from slide',
        severity: 'low',
        recoverable: true
      });
    }

    return { elements, errors, warnings };
  }

  /**
   * Extrai SmartArt do slide
   */
  private async extractSmartArt(slideData: any, slideIndex: number): Promise<{
    elements: SmartArtElement[];
    errors: ExtractionError[];
    warnings: string[];
  }> {
    const elements: SmartArtElement[] = [];
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];

    try {
      const smartArtElements = this.findSmartArtElements(slideData);

      for (let i = 0; i < smartArtElements.length; i++) {
        const smartArtXml = smartArtElements[i];
        
        try {
          const smartArt = await this.parseSmartArt(smartArtXml, `slide-${slideIndex}-smartart-${i}`);
          elements.push(smartArt);
        } catch (error) {
          errors.push({
            elementId: `slide-${slideIndex}-smartart-${i}`,
            elementType: 'smartart',
            error: error instanceof Error ? error.message : 'Failed to parse SmartArt',
            severity: 'medium',
            recoverable: true
          });
        }
      }

      if (elements.length > 0) {
      }

    } catch (error) {
      errors.push({
        elementId: `slide-${slideIndex}`,
        elementType: 'smartart',
        error: 'Failed to extract SmartArt from slide',
        severity: 'low',
        recoverable: true
      });
    }

    return { elements, errors, warnings };
  }

  /**
   * Extrai diagramas do slide
   */
  private async extractDiagrams(slideData: any, slideIndex: number): Promise<{
    elements: DiagramElement[];
    errors: ExtractionError[];
    warnings: string[];
  }> {
    const elements: DiagramElement[] = [];
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];

    // Implementação simplificada - em produção, analisar formas e conexões
    return { elements, errors, warnings };
  }

  /**
   * Extrai elementos de mídia do slide
   */
  private async extractMedia(slideData: any, slideIndex: number): Promise<{
    elements: MediaElement[];
    errors: ExtractionError[];
    warnings: string[];
  }> {
    const elements: MediaElement[] = [];
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];

    try {
      const mediaElements = this.findMediaElements(slideData);

      for (let i = 0; i < mediaElements.length; i++) {
        const mediaXml = mediaElements[i];
        
        try {
          const media = await this.parseMedia(mediaXml, `slide-${slideIndex}-media-${i}`);
          elements.push(media);
        } catch (error) {
          errors.push({
            elementId: `slide-${slideIndex}-media-${i}`,
            elementType: 'media',
            error: error instanceof Error ? error.message : 'Failed to parse media',
            severity: 'low',
            recoverable: true
          });
        }
      }

      if (elements.length > 0) {
      }

    } catch (error) {
      errors.push({
        elementId: `slide-${slideIndex}`,
        elementType: 'media',
        error: 'Failed to extract media from slide',
        severity: 'low',
        recoverable: true
      });
    }

    return { elements, errors, warnings };
  }

  // Métodos auxiliares para parsing específico
  private findTableElements(slideData: any): any[] {
    // Implementação simplificada - buscar por elementos <a:tbl> no XML
    return [];
  }

  private findChartElements(slideData: any): any[] {
    // Implementação simplificada - buscar por elementos <c:chart> no XML
    return [];
  }

  private findSmartArtElements(slideData: any): any[] {
    // Implementação simplificada - buscar por elementos SmartArt no XML
    return [];
  }

  private findMediaElements(slideData: any): any[] {
    // Implementação simplificada - buscar por elementos de mídia no XML
    return [];
  }

  private async parseTable(tableXml: any, id: string): Promise<TableElement> {
    // Implementação simplificada do parsing de tabela
    return {
      type: 'table',
      id,
      position: { x: 0, y: 0, width: 100, height: 100 },
      rows: 3,
      columns: 3,
      data: [
        [
          { content: 'Header 1', rowSpan: 1, colSpan: 1, style: {}, dataType: 'text', alignment: { horizontal: 'center', vertical: 'middle' } },
          { content: 'Header 2', rowSpan: 1, colSpan: 1, style: {}, dataType: 'text', alignment: { horizontal: 'center', vertical: 'middle' } },
          { content: 'Header 3', rowSpan: 1, colSpan: 1, style: {}, dataType: 'text', alignment: { horizontal: 'center', vertical: 'middle' } }
        ],
        [
          { content: 'Data 1', rowSpan: 1, colSpan: 1, style: {}, dataType: 'text', alignment: { horizontal: 'left', vertical: 'middle' } },
          { content: 'Data 2', rowSpan: 1, colSpan: 1, style: {}, dataType: 'text', alignment: { horizontal: 'left', vertical: 'middle' } },
          { content: 'Data 3', rowSpan: 1, colSpan: 1, style: {}, dataType: 'text', alignment: { horizontal: 'left', vertical: 'middle' } }
        ]
      ],
      style: {},
      metadata: {
        hasHeader: true,
        hasFooter: false,
        totalCells: 6,
        emptycells: 0
      }
    };
  }

  private async parseChart(chartXml: any, id: string): Promise<ChartElement> {
    // Implementação simplificada do parsing de gráfico
    return {
      type: 'chart',
      id,
      chartType: 'bar',
      position: { x: 0, y: 0, width: 200, height: 150 },
      title: 'Sample Chart',
      data: {
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
          {
            name: 'Sales',
            data: [100, 150, 120, 180],
            color: '#4472C4'
          }
        ]
      },
      style: {},
      metadata: {
        dataPoints: 4,
        series: 1,
        hasAnimation: false,
        is3D: false
      }
    };
  }

  private async parseSmartArt(smartArtXml: any, id: string): Promise<SmartArtElement> {
    // Implementação simplificada do parsing de SmartArt
    return {
      type: 'smartart',
      id,
      smartArtType: 'process',
      layout: 'basic-process',
      position: { x: 0, y: 0, width: 300, height: 100 },
      nodes: [
        {
          id: 'node1',
          text: 'Step 1',
          level: 0,
          position: { x: 0, y: 0, width: 100, height: 50 },
          style: {},
          children: ['node2']
        },
        {
          id: 'node2',
          text: 'Step 2',
          level: 0,
          position: { x: 100, y: 0, width: 100, height: 50 },
          style: {},
          children: ['node3']
        },
        {
          id: 'node3',
          text: 'Step 3',
          level: 0,
          position: { x: 200, y: 0, width: 100, height: 50 },
          style: {},
          children: []
        }
      ],
      connections: [
        {
          from: 'node1',
          to: 'node2',
          type: 'arrow',
          style: {}
        },
        {
          from: 'node2',
          to: 'node3',
          type: 'arrow',
          style: {}
        }
      ],
      style: {},
      metadata: {
        nodeCount: 3,
        levels: 1,
        hasImages: false
      }
    };
  }

  private async parseMedia(mediaXml: any, id: string): Promise<MediaElement> {
    // Implementação simplificada do parsing de mídia
    return {
      type: 'media',
      id,
      mediaType: 'video',
      position: { x: 0, y: 0, width: 320, height: 240 },
      source: {
        embedded: true,
        format: 'mp4'
      },
      controls: {
        showControls: true
      }
    };
  }
}

// Funções utilitárias
export const complexElementsExtractor = ComplexElementsExtractor.getInstance();

export async function extractComplexElements(
  slideData: any, 
  slideIndex: number, 
  config?: Partial<ExtractionConfig>
): Promise<ExtractionResult> {
  if (config) {
    complexElementsExtractor.configure(config);
  }
  return await complexElementsExtractor.extractFromSlide(slideData, slideIndex);
}

export function createDefaultExtractionConfig(): ExtractionConfig {
  return {
    extractTables: true,
    extractCharts: true,
    extractSmartArt: true,
    extractDiagrams: true,
    extractMedia: true,
    preserveFormatting: true,
    includeMetadata: true,
    optimizeForWeb: true,
    generateThumbnails: false
  };
}

export function validateComplexElement(element: ComplexElement): boolean {
  if (!element.id || !element.type || !element.position) {
    return false;
  }
  
  const { x, y, width, height } = element.position;
  if (typeof x !== 'number' || typeof y !== 'number' || 
      typeof width !== 'number' || typeof height !== 'number') {
    return false;
  }
  
  return width > 0 && height > 0;
}

export function optimizeElementForWeb(element: ComplexElement): ComplexElement {
  // Implementação de otimização para web
  const optimized = { ...element };
  
  // Reduz precisão de posicionamento
  optimized.position = {
    x: Math.round(element.position.x),
    y: Math.round(element.position.y),
    width: Math.round(element.position.width),
    height: Math.round(element.position.height)
  };
  
  return optimized;
}