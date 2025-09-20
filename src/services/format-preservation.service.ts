import { SlideData, ShapeData, ImageData } from '../types/pptx-analysis';

// Interfaces para formatação
export interface FontFormatting {
  family: string;
  size: number;
  weight: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  style: 'normal' | 'italic' | 'oblique';
  color: string;
  decoration: 'none' | 'underline' | 'overline' | 'line-through';
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
}

export interface ColorFormatting {
  primary: string;
  secondary?: string;
  background: string;
  border: string;
  accent: string;
  gradient?: {
    type: 'linear' | 'radial';
    direction: number;
    stops: { color: string; position: number }[];
  };
}

export interface LayoutFormatting {
  position: {
    x: number;
    y: number;
    z?: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  rotation: number;
  scale: {
    x: number;
    y: number;
  };
}

export interface BorderFormatting {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  color: string;
  radius: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  };
}

export interface ShadowFormatting {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  spread: number;
  inset: boolean;
}

export interface AnimationFormatting {
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce' | 'none';
  duration: number;
  delay: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  iterations: number | 'infinite';
}

export interface CompleteFormatting {
  id: string;
  elementType: 'text' | 'shape' | 'image' | 'table' | 'chart' | 'smartart';
  font: FontFormatting;
  colors: ColorFormatting;
  layout: LayoutFormatting;
  border: BorderFormatting;
  shadow: ShadowFormatting;
  animation: AnimationFormatting;
  customProperties: Record<string, any>;
}

export interface PreservationResult {
  originalFormatting: CompleteFormatting[];
  preservedElements: number;
  conversionAccuracy: number;
  unsupportedFeatures: string[];
  cssOutput: string;
  processingTime: number;
}

export interface PreservationConfig {
  preserveFonts: boolean;
  preserveColors: boolean;
  preserveLayout: boolean;
  preserveAnimations: boolean;
  generateCSS: boolean;
  optimizeOutput: boolean;
  fallbackFonts: string[];
  colorProfile: 'sRGB' | 'Adobe RGB' | 'P3';
}

// Classe principal para preservação de formatação
export class FormatPreservationService {
  private config: PreservationConfig;
  private fontCache: Map<string, FontFormatting> = new Map();
  private colorCache: Map<string, ColorFormatting> = new Map();
  private processingStats: {
    startTime: number;
    elementsProcessed: number;
    errors: string[];
  };

  constructor(config: Partial<PreservationConfig> = {}) {
    this.config = {
      preserveFonts: true,
      preserveColors: true,
      preserveLayout: true,
      preserveAnimations: true,
      generateCSS: true,
      optimizeOutput: true,
      fallbackFonts: ['Arial', 'Helvetica', 'sans-serif'],
      colorProfile: 'sRGB',
      ...config
    };

    this.processingStats = {
      startTime: 0,
      elementsProcessed: 0,
      errors: []
    };
  }

  // Método principal para preservar formatação
  async preserveFormatting(slides: SlideData[]): Promise<PreservationResult> {
    this.processingStats.startTime = Date.now();
    this.processingStats.elementsProcessed = 0;
    this.processingStats.errors = [];

    const result: PreservationResult = {
      originalFormatting: [],
      preservedElements: 0,
      conversionAccuracy: 0,
      unsupportedFeatures: [],
      cssOutput: '',
      processingTime: 0
    };

    try {
      // Processar cada slide
      for (const slide of slides) {
        const slideFormatting = await this.extractSlideFormatting(slide);
        result.originalFormatting.push(...slideFormatting);
      }

      // Gerar CSS se habilitado
      if (this.config.generateCSS) {
        result.cssOutput = this.generateCSS(result.originalFormatting);
      }

      // Calcular estatísticas
      result.preservedElements = result.originalFormatting.length;
      result.conversionAccuracy = this.calculateAccuracy(result.originalFormatting);
      result.processingTime = Date.now() - this.processingStats.startTime;

    } catch (error) {
      this.processingStats.errors.push(`Erro na preservação de formatação: ${error}`);
    }

    return result;
  }

  // Extrair formatação de um slide
  private async extractSlideFormatting(slide: SlideData): Promise<CompleteFormatting[]> {
    const formatting: CompleteFormatting[] = [];

    try {
      // Processar shapes
      for (const shape of slide.shapes) {
        const shapeFormatting = await this.extractShapeFormatting(shape);
        if (shapeFormatting) {
          formatting.push(shapeFormatting);
          this.processingStats.elementsProcessed++;
        }
      }

      // Processar imagens
      for (const image of slide.images) {
        const imageFormatting = await this.extractImageFormatting(image);
        if (imageFormatting) {
          formatting.push(imageFormatting);
          this.processingStats.elementsProcessed++;
        }
      }

    } catch (error) {
      this.processingStats.errors.push(`Erro ao extrair formatação do slide ${slide.id}: ${error}`);
    }

    return formatting;
  }

  // Extrair formatação de shape
  private async extractShapeFormatting(shape: ShapeData): Promise<CompleteFormatting | null> {
    try {
      const formatting: CompleteFormatting = {
        id: shape.id,
        elementType: this.determineElementType(shape),
        font: await this.extractFontFormatting(shape),
        colors: await this.extractColorFormatting(shape),
        layout: await this.extractLayoutFormatting(shape),
        border: await this.extractBorderFormatting(shape),
        shadow: await this.extractShadowFormatting(shape),
        animation: await this.extractAnimationFormatting(shape),
        customProperties: this.extractCustomProperties(shape)
      };

      return formatting;

    } catch (error) {
      this.processingStats.errors.push(`Erro ao extrair formatação do shape ${shape.id}: ${error}`);
      return null;
    }
  }

  // Extrair formatação de imagem
  private async extractImageFormatting(image: ImageData): Promise<CompleteFormatting | null> {
    try {
      const formatting: CompleteFormatting = {
        id: image.id,
        elementType: 'image',
        font: this.getDefaultFontFormatting(),
        colors: await this.extractImageColorFormatting(image),
        layout: await this.extractImageLayoutFormatting(image),
        border: await this.extractImageBorderFormatting(image),
        shadow: await this.extractImageShadowFormatting(image),
        animation: this.getDefaultAnimationFormatting(),
        customProperties: {
          src: image.src,
          alt: image.alt,
          format: image.format
        }
      };

      return formatting;

    } catch (error) {
      this.processingStats.errors.push(`Erro ao extrair formatação da imagem ${image.id}: ${error}`);
      return null;
    }
  }

  // Métodos de extração específicos
  private async extractFontFormatting(shape: ShapeData): Promise<FontFormatting> {
    const cacheKey = `font_${shape.id}`;
    
    if (this.fontCache.has(cacheKey)) {
      return this.fontCache.get(cacheKey)!;
    }

    const fontFormatting: FontFormatting = {
      family: this.extractFontFamily(shape.content) || 'Arial',
      size: this.extractFontSize(shape.content) || 12,
      weight: this.extractFontWeight(shape.content) || 'normal',
      style: this.extractFontStyle(shape.content) || 'normal',
      color: this.extractTextColor(shape.content) || '#000000',
      decoration: this.extractTextDecoration(shape.content) || 'none',
      alignment: this.extractTextAlignment(shape.content) || 'left',
      lineHeight: this.extractLineHeight(shape.content) || 1.2,
      letterSpacing: this.extractLetterSpacing(shape.content) || 0
    };

    this.fontCache.set(cacheKey, fontFormatting);
    return fontFormatting;
  }

  private async extractColorFormatting(shape: ShapeData): Promise<ColorFormatting> {
    const cacheKey = `color_${shape.id}`;
    
    if (this.colorCache.has(cacheKey)) {
      return this.colorCache.get(cacheKey)!;
    }

    const colorFormatting: ColorFormatting = {
      primary: this.extractPrimaryColor(shape) || '#000000',
      secondary: this.extractSecondaryColor(shape),
      background: this.extractBackgroundColor(shape) || '#ffffff',
      border: this.extractBorderColor(shape) || '#cccccc',
      accent: this.extractAccentColor(shape) || '#0066cc',
      gradient: this.extractGradient(shape)
    };

    this.colorCache.set(cacheKey, colorFormatting);
    return colorFormatting;
  }

  private async extractLayoutFormatting(shape: ShapeData): Promise<LayoutFormatting> {
    return {
      position: {
        x: shape.position?.x || 0,
        y: shape.position?.y || 0,
        z: shape.position?.z || 0
      },
      dimensions: {
        width: shape.position?.width || 100,
        height: shape.position?.height || 100
      },
      margins: this.extractMargins(shape),
      padding: this.extractPadding(shape),
      rotation: this.extractRotation(shape) || 0,
      scale: {
        x: this.extractScaleX(shape) || 1,
        y: this.extractScaleY(shape) || 1
      }
    };
  }

  private async extractBorderFormatting(shape: ShapeData): Promise<BorderFormatting> {
    return {
      width: this.extractBorderWidth(shape) || 1,
      style: this.extractBorderStyle(shape) || 'solid',
      color: this.extractBorderColor(shape) || '#cccccc',
      radius: {
        topLeft: this.extractBorderRadius(shape, 'topLeft') || 0,
        topRight: this.extractBorderRadius(shape, 'topRight') || 0,
        bottomLeft: this.extractBorderRadius(shape, 'bottomLeft') || 0,
        bottomRight: this.extractBorderRadius(shape, 'bottomRight') || 0
      }
    };
  }

  private async extractShadowFormatting(shape: ShapeData): Promise<ShadowFormatting> {
    return {
      enabled: this.hasShadow(shape),
      color: this.extractShadowColor(shape) || '#000000',
      blur: this.extractShadowBlur(shape) || 0,
      offsetX: this.extractShadowOffsetX(shape) || 0,
      offsetY: this.extractShadowOffsetY(shape) || 0,
      spread: this.extractShadowSpread(shape) || 0,
      inset: this.isShadowInset(shape) || false
    };
  }

  private async extractAnimationFormatting(shape: ShapeData): Promise<AnimationFormatting> {
    return {
      type: this.extractAnimationType(shape) || 'none',
      duration: this.extractAnimationDuration(shape) || 0,
      delay: this.extractAnimationDelay(shape) || 0,
      easing: this.extractAnimationEasing(shape) || 'ease',
      direction: this.extractAnimationDirection(shape) || 'normal',
      iterations: this.extractAnimationIterations(shape) || 1
    };
  }

  // Gerar CSS a partir da formatação
  private generateCSS(formatting: CompleteFormatting[]): string {
    let css = '/* CSS Gerado automaticamente para preservação de formatação PPTX */\n\n';

    for (const format of formatting) {
      css += this.generateElementCSS(format);
    }

    if (this.config.optimizeOutput) {
      css = this.optimizeCSS(css);
    }

    return css;
  }

  private generateElementCSS(format: CompleteFormatting): string {
    const selector = `.pptx-element-${format.id}`;
    let css = `${selector} {\n`;

    // Font properties
    if (this.config.preserveFonts) {
      css += `  font-family: "${format.font.family}", ${this.config.fallbackFonts.join(', ')};\n`;
      css += `  font-size: ${format.font.size}px;\n`;
      css += `  font-weight: ${format.font.weight};\n`;
      css += `  font-style: ${format.font.style};\n`;
      css += `  color: ${format.font.color};\n`;
      css += `  text-decoration: ${format.font.decoration};\n`;
      css += `  text-align: ${format.font.alignment};\n`;
      css += `  line-height: ${format.font.lineHeight};\n`;
      css += `  letter-spacing: ${format.font.letterSpacing}px;\n`;
    }

    // Color properties
    if (this.config.preserveColors) {
      css += `  background-color: ${format.colors.background};\n`;
      css += `  border-color: ${format.colors.border};\n`;
      
      if (format.colors.gradient) {
        css += this.generateGradientCSS(format.colors.gradient);
      }
    }

    // Layout properties
    if (this.config.preserveLayout) {
      css += `  position: absolute;\n`;
      css += `  left: ${format.layout.position.x}px;\n`;
      css += `  top: ${format.layout.position.y}px;\n`;
      css += `  width: ${format.layout.dimensions.width}px;\n`;
      css += `  height: ${format.layout.dimensions.height}px;\n`;
      css += `  margin: ${format.layout.margins.top}px ${format.layout.margins.right}px ${format.layout.margins.bottom}px ${format.layout.margins.left}px;\n`;
      css += `  padding: ${format.layout.padding.top}px ${format.layout.padding.right}px ${format.layout.padding.bottom}px ${format.layout.padding.left}px;\n`;
      
      if (format.layout.rotation !== 0) {
        css += `  transform: rotate(${format.layout.rotation}deg) scale(${format.layout.scale.x}, ${format.layout.scale.y});\n`;
      }
    }

    // Border properties
    css += `  border: ${format.border.width}px ${format.border.style} ${format.border.color};\n`;
    css += `  border-radius: ${format.border.radius.topLeft}px ${format.border.radius.topRight}px ${format.border.radius.bottomRight}px ${format.border.radius.bottomLeft}px;\n`;

    // Shadow properties
    if (format.shadow.enabled) {
      const shadowType = format.shadow.inset ? 'inset' : '';
      css += `  box-shadow: ${shadowType} ${format.shadow.offsetX}px ${format.shadow.offsetY}px ${format.shadow.blur}px ${format.shadow.spread}px ${format.shadow.color};\n`;
    }

    // Animation properties
    if (this.config.preserveAnimations && format.animation.type !== 'none') {
      css += `  animation: ${format.animation.type} ${format.animation.duration}ms ${format.animation.easing} ${format.animation.delay}ms ${format.animation.iterations} ${format.animation.direction};\n`;
    }

    css += '}\n\n';
    return css;
  }

  // Métodos auxiliares de extração
  private extractFontFamily(content: string): string | null {
    const match = content.match(/font-family:\s*([^;]+)/i);
    return match ? match[1].replace(/["']/g, '') : null;
  }

  private extractFontSize(content: string): number | null {
    const match = content.match(/font-size:\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  private extractPrimaryColor(shape: ShapeData): string | null {
    // Simular extração de cor primária
    return shape.type === 'text' ? '#000000' : '#0066cc';
  }

  private extractBackgroundColor(shape: ShapeData): string | null {
    // Simular extração de cor de fundo
    return '#ffffff';
  }

  private extractMargins(shape: ShapeData): LayoutFormatting['margins'] {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  private extractPadding(shape: ShapeData): LayoutFormatting['padding'] {
    return { top: 8, right: 8, bottom: 8, left: 8 };
  }

  private hasShadow(shape: ShapeData): boolean {
    return shape.content.toLowerCase().includes('shadow');
  }

  private determineElementType(shape: ShapeData): CompleteFormatting['elementType'] {
    if (shape.type === 'text') return 'text';
    if (shape.type === 'table') return 'table';
    if (shape.type === 'chart') return 'chart';
    if (shape.type === 'smartart') return 'smartart';
    return 'shape';
  }

  private getDefaultFontFormatting(): FontFormatting {
    return {
      family: 'Arial',
      size: 12,
      weight: 'normal',
      style: 'normal',
      color: '#000000',
      decoration: 'none',
      alignment: 'left',
      lineHeight: 1.2,
      letterSpacing: 0
    };
  }

  private getDefaultAnimationFormatting(): AnimationFormatting {
    return {
      type: 'none',
      duration: 0,
      delay: 0,
      easing: 'ease',
      direction: 'normal',
      iterations: 1
    };
  }

  private calculateAccuracy(formatting: CompleteFormatting[]): number {
    // Simular cálculo de precisão
    const totalProperties = formatting.length * 8; // 8 categorias principais
    const preservedProperties = totalProperties - this.processingStats.errors.length;
    return Math.round((preservedProperties / totalProperties) * 100);
  }

  private optimizeCSS(css: string): string {
    // Remover duplicatas e otimizar
    return css
      .replace(/\n\s*\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateGradientCSS(gradient: ColorFormatting['gradient']): string {
    if (!gradient) return '';
    
    const stops = gradient.stops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
    
    if (gradient.type === 'linear') {
      return `  background: linear-gradient(${gradient.direction}deg, ${stops});\n`;
    } else {
      return `  background: radial-gradient(circle, ${stops});\n`;
    }
  }

  // Métodos auxiliares adicionais (implementação simplificada)
  private extractFontWeight = (content: string) => 'normal';
  private extractFontStyle = (content: string) => 'normal';
  private extractTextColor = (content: string) => '#000000';
  private extractTextDecoration = (content: string) => 'none';
  private extractTextAlignment = (content: string) => 'left';
  private extractLineHeight = (content: string) => 1.2;
  private extractLetterSpacing = (content: string) => 0;
  private extractSecondaryColor = (shape: ShapeData) => undefined;
  private extractBorderColor = (shape: ShapeData) => '#cccccc';
  private extractAccentColor = (shape: ShapeData) => '#0066cc';
  private extractGradient = (shape: ShapeData) => undefined;
  private extractRotation = (shape: ShapeData) => 0;
  private extractScaleX = (shape: ShapeData) => 1;
  private extractScaleY = (shape: ShapeData) => 1;
  private extractBorderWidth = (shape: ShapeData) => 1;
  private extractBorderStyle = (shape: ShapeData) => 'solid';
  private extractBorderRadius = (shape: ShapeData, corner: string) => 0;
  private extractShadowColor = (shape: ShapeData) => '#000000';
  private extractShadowBlur = (shape: ShapeData) => 0;
  private extractShadowOffsetX = (shape: ShapeData) => 0;
  private extractShadowOffsetY = (shape: ShapeData) => 0;
  private extractShadowSpread = (shape: ShapeData) => 0;
  private isShadowInset = (shape: ShapeData) => false;
  private extractAnimationType = (shape: ShapeData) => 'none';
  private extractAnimationDuration = (shape: ShapeData) => 0;
  private extractAnimationDelay = (shape: ShapeData) => 0;
  private extractAnimationEasing = (shape: ShapeData) => 'ease';
  private extractAnimationDirection = (shape: ShapeData) => 'normal';
  private extractAnimationIterations = (shape: ShapeData) => 1;
  private extractCustomProperties = (shape: ShapeData) => ({});
  private extractImageColorFormatting = async (image: ImageData) => ({ primary: '#000000', background: '#ffffff', border: '#cccccc', accent: '#0066cc' });
  private extractImageLayoutFormatting = async (image: ImageData) => ({
    position: { x: image.position?.x || 0, y: image.position?.y || 0 },
    dimensions: { width: image.position?.width || 100, height: image.position?.height || 100 },
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    rotation: 0,
    scale: { x: 1, y: 1 }
  });
  private extractImageBorderFormatting = async (image: ImageData) => ({
    width: 0,
    style: 'solid' as const,
    color: '#cccccc',
    radius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 }
  });
  private extractImageShadowFormatting = async (image: ImageData) => ({
    enabled: false,
    color: '#000000',
    blur: 0,
    offsetX: 0,
    offsetY: 0,
    spread: 0,
    inset: false
  });

  // Método para obter estatísticas
  getProcessingStats() {
    return {
      ...this.processingStats,
      processingTime: Date.now() - this.processingStats.startTime
    };
  }

  // Método para atualizar configuração
  updateConfig(newConfig: Partial<PreservationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Método para limpar cache
  clearCache() {
    this.fontCache.clear();
    this.colorCache.clear();
  }
}