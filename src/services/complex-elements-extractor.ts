import { SlideData, ImageData, ShapeData } from '../types/pptx-analysis';

// Interfaces para elementos complexos
export interface TableData {
  id: string;
  rows: number;
  columns: number;
  headers: string[];
  data: string[][];
  styling: {
    borderStyle: string;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ChartData {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'column' | 'area' | 'scatter' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string;
    }[];
  };
  styling: {
    colors: string[];
    fontSize: number;
    legendPosition: 'top' | 'bottom' | 'left' | 'right';
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SmartArtData {
  id: string;
  type: 'hierarchy' | 'process' | 'cycle' | 'relationship' | 'matrix' | 'pyramid';
  title: string;
  nodes: {
    id: string;
    text: string;
    level: number;
    connections: string[];
    styling: {
      backgroundColor: string;
      textColor: string;
      borderColor: string;
    };
  }[];
  layout: {
    direction: 'horizontal' | 'vertical';
    spacing: number;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ComplexElementsResult {
  tables: TableData[];
  charts: ChartData[];
  smartArts: SmartArtData[];
  extractionStats: {
    totalElements: number;
    tablesFound: number;
    chartsFound: number;
    smartArtsFound: number;
    processingTime: number;
    errors: string[];
  };
}

export interface ExtractionConfig {
  enableTables: boolean;
  enableCharts: boolean;
  enableSmartArt: boolean;
  preserveFormatting: boolean;
  extractMetadata: boolean;
  optimizePerformance: boolean;
}

// Classe principal para extração de elementos complexos
export class ComplexElementsExtractor {
  private config: ExtractionConfig;
  private processingStats: {
    startTime: number;
    elementsProcessed: number;
    errors: string[];
  };

  constructor(config: Partial<ExtractionConfig> = {}) {
    this.config = {
      enableTables: true,
      enableCharts: true,
      enableSmartArt: true,
      preserveFormatting: true,
      extractMetadata: true,
      optimizePerformance: true,
      ...config
    };
    
    this.processingStats = {
      startTime: 0,
      elementsProcessed: 0,
      errors: []
    };
  }

  // Método principal para extrair elementos complexos
  async extractComplexElements(slides: SlideData[]): Promise<ComplexElementsResult> {
    this.processingStats.startTime = Date.now();
    this.processingStats.elementsProcessed = 0;
    this.processingStats.errors = [];

    const result: ComplexElementsResult = {
      tables: [],
      charts: [],
      smartArts: [],
      extractionStats: {
        totalElements: 0,
        tablesFound: 0,
        chartsFound: 0,
        smartArtsFound: 0,
        processingTime: 0,
        errors: []
      }
    };

    try {
      for (const slide of slides) {
        if (this.config.enableTables) {
          const tables = await this.extractTables(slide);
          result.tables.push(...tables);
        }

        if (this.config.enableCharts) {
          const charts = await this.extractCharts(slide);
          result.charts.push(...charts);
        }

        if (this.config.enableSmartArt) {
          const smartArts = await this.extractSmartArt(slide);
          result.smartArts.push(...smartArts);
        }
      }

      // Calcular estatísticas finais
      result.extractionStats = {
        totalElements: result.tables.length + result.charts.length + result.smartArts.length,
        tablesFound: result.tables.length,
        chartsFound: result.charts.length,
        smartArtsFound: result.smartArts.length,
        processingTime: Date.now() - this.processingStats.startTime,
        errors: this.processingStats.errors
      };

    } catch (error) {
      this.processingStats.errors.push(`Erro geral na extração: ${error}`);
      result.extractionStats.errors = this.processingStats.errors;
    }

    return result;
  }

  // Extração de tabelas
  private async extractTables(slide: SlideData): Promise<TableData[]> {
    const tables: TableData[] = [];

    try {
      // Procurar por elementos de tabela nos shapes
      const tableShapes = slide.shapes.filter(shape => 
        shape.type === 'table' || 
        shape.content.toLowerCase().includes('table') ||
        this.isTableStructure(shape)
      );

      for (const shape of tableShapes) {
        const tableData = await this.parseTableData(shape, slide.id);
        if (tableData) {
          tables.push(tableData);
          this.processingStats.elementsProcessed++;
        }
      }

    } catch (error) {
      this.processingStats.errors.push(`Erro na extração de tabelas do slide ${slide.id}: ${error}`);
    }

    return tables;
  }

  // Extração de gráficos
  private async extractCharts(slide: SlideData): Promise<ChartData[]> {
    const charts: ChartData[] = [];

    try {
      // Procurar por elementos de gráfico
      const chartShapes = slide.shapes.filter(shape => 
        shape.type === 'chart' || 
        this.isChartElement(shape)
      );

      for (const shape of chartShapes) {
        const chartData = await this.parseChartData(shape, slide.id);
        if (chartData) {
          charts.push(chartData);
          this.processingStats.elementsProcessed++;
        }
      }

    } catch (error) {
      this.processingStats.errors.push(`Erro na extração de gráficos do slide ${slide.id}: ${error}`);
    }

    return charts;
  }

  // Extração de SmartArt
  private async extractSmartArt(slide: SlideData): Promise<SmartArtData[]> {
    const smartArts: SmartArtData[] = [];

    try {
      // Procurar por elementos SmartArt
      const smartArtShapes = slide.shapes.filter(shape => 
        shape.type === 'smartart' || 
        this.isSmartArtElement(shape)
      );

      for (const shape of smartArtShapes) {
        const smartArtData = await this.parseSmartArtData(shape, slide.id);
        if (smartArtData) {
          smartArts.push(smartArtData);
          this.processingStats.elementsProcessed++;
        }
      }

    } catch (error) {
      this.processingStats.errors.push(`Erro na extração de SmartArt do slide ${slide.id}: ${error}`);
    }

    return smartArts;
  }

  // Métodos auxiliares para parsing
  private async parseTableData(shape: ShapeData, slideId: string): Promise<TableData | null> {
    try {
      // Simular extração de dados de tabela
      const tableId = `table_${slideId}_${shape.id}`;
      
      // Extrair estrutura da tabela do conteúdo
      const lines = shape.content.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split('\t') || [];
      const dataRows = lines.slice(1).map(line => line.split('\t'));

      return {
        id: tableId,
        rows: dataRows.length,
        columns: headers.length,
        headers,
        data: dataRows,
        styling: {
          borderStyle: 'solid',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          fontSize: 12
        },
        position: {
          x: shape.position?.x || 0,
          y: shape.position?.y || 0,
          width: shape.position?.width || 300,
          height: shape.position?.height || 200
        }
      };

    } catch (error) {
      this.processingStats.errors.push(`Erro ao processar tabela: ${error}`);
      return null;
    }
  }

  private async parseChartData(shape: ShapeData, slideId: string): Promise<ChartData | null> {
    try {
      const chartId = `chart_${slideId}_${shape.id}`;
      
      // Detectar tipo de gráfico baseado no conteúdo
      const chartType = this.detectChartType(shape.content);
      
      // Extrair dados do gráfico
      const chartInfo = this.extractChartInfo(shape.content);

      return {
        id: chartId,
        type: chartType,
        title: chartInfo.title || 'Gráfico sem título',
        data: {
          labels: chartInfo.labels || ['Categoria 1', 'Categoria 2', 'Categoria 3'],
          datasets: [{
            label: 'Dados',
            data: chartInfo.values || [10, 20, 30],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
          }]
        },
        styling: {
          colors: ['#FF6384', '#36A2EB', '#FFCE56'],
          fontSize: 12,
          legendPosition: 'top'
        },
        position: {
          x: shape.position?.x || 0,
          y: shape.position?.y || 0,
          width: shape.position?.width || 400,
          height: shape.position?.height || 300
        }
      };

    } catch (error) {
      this.processingStats.errors.push(`Erro ao processar gráfico: ${error}`);
      return null;
    }
  }

  private async parseSmartArtData(shape: ShapeData, slideId: string): Promise<SmartArtData | null> {
    try {
      const smartArtId = `smartart_${slideId}_${shape.id}`;
      
      // Detectar tipo de SmartArt
      const smartArtType = this.detectSmartArtType(shape.content);
      
      // Extrair nós e conexões
      const nodes = this.extractSmartArtNodes(shape.content);

      return {
        id: smartArtId,
        type: smartArtType,
        title: 'SmartArt',
        nodes,
        layout: {
          direction: 'horizontal',
          spacing: 20
        },
        position: {
          x: shape.position?.x || 0,
          y: shape.position?.y || 0,
          width: shape.position?.width || 500,
          height: shape.position?.height || 300
        }
      };

    } catch (error) {
      this.processingStats.errors.push(`Erro ao processar SmartArt: ${error}`);
      return null;
    }
  }

  // Métodos de detecção e validação
  private isTableStructure(shape: ShapeData): boolean {
    const content = shape.content.toLowerCase();
    return content.includes('\t') && content.split('\n').length > 1;
  }

  private isChartElement(shape: ShapeData): boolean {
    const content = shape.content.toLowerCase();
    return content.includes('chart') || 
           content.includes('gráfico') || 
           content.includes('data') ||
           /\d+%/.test(content);
  }

  private isSmartArtElement(shape: ShapeData): boolean {
    const content = shape.content.toLowerCase();
    return content.includes('smartart') || 
           content.includes('processo') ||
           content.includes('hierarquia') ||
           content.includes('ciclo');
  }

  private detectChartType(content: string): ChartData['type'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('pie') || lowerContent.includes('pizza')) return 'pie';
    if (lowerContent.includes('line') || lowerContent.includes('linha')) return 'line';
    if (lowerContent.includes('bar') || lowerContent.includes('barra')) return 'bar';
    if (lowerContent.includes('column') || lowerContent.includes('coluna')) return 'column';
    if (lowerContent.includes('area') || lowerContent.includes('área')) return 'area';
    if (lowerContent.includes('scatter') || lowerContent.includes('dispersão')) return 'scatter';
    
    return 'column'; // padrão
  }

  private detectSmartArtType(content: string): SmartArtData['type'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('hierarchy') || lowerContent.includes('hierarquia')) return 'hierarchy';
    if (lowerContent.includes('process') || lowerContent.includes('processo')) return 'process';
    if (lowerContent.includes('cycle') || lowerContent.includes('ciclo')) return 'cycle';
    if (lowerContent.includes('relationship') || lowerContent.includes('relacionamento')) return 'relationship';
    if (lowerContent.includes('matrix') || lowerContent.includes('matriz')) return 'matrix';
    if (lowerContent.includes('pyramid') || lowerContent.includes('pirâmide')) return 'pyramid';
    
    return 'process'; // padrão
  }

  private extractChartInfo(content: string): { title?: string; labels?: string[]; values?: number[] } {
    const lines = content.split('\n').filter(line => line.trim());
    const title = lines[0] || undefined;
    
    // Tentar extrair dados numéricos
    const numbers = content.match(/\d+/g)?.map(Number) || [];
    
    return {
      title,
      labels: lines.slice(1, 4),
      values: numbers.slice(0, 3)
    };
  }

  private extractSmartArtNodes(content: string): SmartArtData['nodes'] {
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => ({
      id: `node_${index}`,
      text: line.trim(),
      level: 0,
      connections: index < lines.length - 1 ? [`node_${index + 1}`] : [],
      styling: {
        backgroundColor: '#4472C4',
        textColor: '#FFFFFF',
        borderColor: '#2F5597'
      }
    }));
  }

  // Método para obter estatísticas de processamento
  getProcessingStats() {
    return {
      ...this.processingStats,
      processingTime: Date.now() - this.processingStats.startTime
    };
  }

  // Método para atualizar configuração
  updateConfig(newConfig: Partial<ExtractionConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}