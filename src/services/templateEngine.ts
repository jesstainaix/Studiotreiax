import {
  Template,
  TemplateElement,
  TemplateRenderOptions,
  TemplateRenderJob,
  ContentAnalysis,
  SmartSuggestion,
  Animation
} from '../types/templates';

// Template Engine - Sistema principal de processamento de templates
export class TemplateEngine {
  private static instance: TemplateEngine;
  private renderJobs: Map<string, TemplateRenderJob> = new Map();
  private templateCache: Map<string, Template> = new Map();
  private analysisCache: Map<string, ContentAnalysis> = new Map();

  static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  // Aplicar template a um projeto
  async applyTemplate(
    template: Template,
    projectData: any,
    options: Partial<TemplateRenderOptions> = {}
  ): Promise<any> {
    try {
      console.log(`Aplicando template: ${template.name}`);
      
      // Análise de compatibilidade
      const compatibility = await this.analyzeCompatibility(template, projectData);
      if (compatibility.score < 0.7) {
        throw new Error(`Template incompatível. Score: ${compatibility.score}`);
      }

      // Processamento dos elementos
      const processedElements = await this.processTemplateElements(
        template.elements,
        projectData,
        options
      );

      // Aplicação de animações
      const animatedElements = await this.applyAnimations(
        processedElements,
        template.duration
      );

      // Ajuste de timing e sincronização
      const synchronizedElements = await this.synchronizeElements(
        animatedElements,
        projectData.timeline
      );

      return {
        elements: synchronizedElements,
        duration: template.duration,
        metadata: template.metadata,
        applied: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      throw error;
    }
  }

  // Análise de compatibilidade entre template e projeto
  private async analyzeCompatibility(
    template: Template,
    projectData: any
  ): Promise<{ score: number; issues: string[] }> {
    const issues: string[] = [];
    let score = 1.0;

    // Verificar aspect ratio
    if (projectData.aspectRatio && template.aspectRatio !== projectData.aspectRatio) {
      issues.push('Aspect ratio incompatível');
      score -= 0.2;
    }

    // Verificar duração
    if (projectData.duration && Math.abs(template.duration - projectData.duration) > 30) {
      issues.push('Duração muito diferente');
      score -= 0.1;
    }

    // Verificar assets necessários
    const missingAssets = template.metadata.requiredAssets.filter(
      asset => !projectData.assets?.some((a: any) => a.type === asset)
    );
    if (missingAssets.length > 0) {
      issues.push(`Assets faltando: ${missingAssets.join(', ')}`);
      score -= missingAssets.length * 0.1;
    }

    return { score: Math.max(0, score), issues };
  }

  // Processar elementos do template
  private async processTemplateElements(
    elements: TemplateElement[],
    projectData: any,
    options: Partial<TemplateRenderOptions>
  ): Promise<TemplateElement[]> {
    const processedElements: TemplateElement[] = [];

    for (const element of elements) {
      const processed = await this.processElement(element, projectData, options);
      processedElements.push(processed);
    }

    return processedElements;
  }

  // Processar elemento individual
  private async processElement(
    element: TemplateElement,
    projectData: any,
    options: Partial<TemplateRenderOptions>
  ): Promise<TemplateElement> {
    const processed = { ...element };

    switch (element.type) {
      case 'text':
        processed.properties = await this.processTextElement(element, projectData);
        break;
      case 'image':
        processed.properties = await this.processImageElement(element, projectData);
        break;
      case 'video':
        processed.properties = await this.processVideoElement(element, projectData);
        break;
      case 'audio':
        processed.properties = await this.processAudioElement(element, projectData);
        break;
      default:
        break;
    }

    // Aplicar ajustes de resolução se necessário
    if (options.resolution) {
      processed.position = this.scalePosition(
        processed.position,
        options.resolution,
        { width: 1920, height: 1080 } // resolução base
      );
      processed.dimensions = this.scaleDimensions(
        processed.dimensions,
        options.resolution,
        { width: 1920, height: 1080 }
      );
    }

    return processed;
  }

  // Processar elemento de texto
  private async processTextElement(
    element: TemplateElement,
    projectData: any
  ): Promise<Record<string, any>> {
    const properties = { ...element.properties };

    // Substituir placeholders dinâmicos
    if (properties.text && typeof properties.text === 'string') {
      properties.text = this.replacePlaceholders(properties.text, projectData);
    }

    // Ajustar fonte baseado no conteúdo
    if (projectData.style?.fontFamily) {
      properties.fontFamily = projectData.style.fontFamily;
    }

    // Ajustar cores baseado no esquema de cores do projeto
    if (projectData.colorScheme) {
      properties.color = this.adaptColorToScheme(
        properties.color,
        projectData.colorScheme
      );
    }

    return properties;
  }

  // Processar elemento de imagem
  private async processImageElement(
    element: TemplateElement,
    projectData: any
  ): Promise<Record<string, any>> {
    const properties = { ...element.properties };

    // Substituir por imagens do projeto se disponível
    if (projectData.assets?.images?.length > 0) {
      const suitableImage = this.findSuitableAsset(
        projectData.assets.images,
        element.properties
      );
      if (suitableImage) {
        properties.src = suitableImage.url;
        properties.alt = suitableImage.alt || properties.alt;
      }
    }

    // Aplicar filtros baseados no mood do projeto
    if (projectData.mood) {
      properties.filters = this.generateFiltersForMood(projectData.mood);
    }

    return properties;
  }

  // Processar elemento de vídeo
  private async processVideoElement(
    element: TemplateElement,
    projectData: any
  ): Promise<Record<string, any>> {
    const properties = { ...element.properties };

    // Substituir por vídeos do projeto
    if (projectData.assets?.videos?.length > 0) {
      const suitableVideo = this.findSuitableAsset(
        projectData.assets.videos,
        element.properties
      );
      if (suitableVideo) {
        properties.src = suitableVideo.url;
        properties.duration = suitableVideo.duration;
      }
    }

    // Ajustar timing baseado na duração total
    if (projectData.duration) {
      properties.playbackRate = this.calculateOptimalPlaybackRate(
        properties.duration,
        projectData.duration
      );
    }

    return properties;
  }

  // Processar elemento de áudio
  private async processAudioElement(
    element: TemplateElement,
    projectData: any
  ): Promise<Record<string, any>> {
    const properties = { ...element.properties };

    // Substituir por áudios do projeto
    if (projectData.assets?.audio?.length > 0) {
      const suitableAudio = this.findSuitableAsset(
        projectData.assets.audio,
        element.properties
      );
      if (suitableAudio) {
        properties.src = suitableAudio.url;
        properties.duration = suitableAudio.duration;
      }
    }

    // Ajustar volume baseado no tipo de conteúdo
    if (projectData.contentType === 'podcast') {
      properties.volume = Math.min(properties.volume * 1.2, 1.0);
    } else if (projectData.contentType === 'music-video') {
      properties.volume = Math.max(properties.volume * 0.8, 0.1);
    }

    return properties;
  }

  // Aplicar animações aos elementos
  private async applyAnimations(
    elements: TemplateElement[],
    totalDuration: number
  ): Promise<TemplateElement[]> {
    return elements.map(element => {
      if (element.animations && element.animations.length > 0) {
        const processedAnimations = element.animations.map(animation => 
          this.processAnimation(animation, totalDuration)
        );
        return { ...element, animations: processedAnimations };
      }
      return element;
    });
  }

  // Processar animação individual
  private processAnimation(animation: Animation, totalDuration: number): Animation {
    const processed = { ...animation };

    // Ajustar timing baseado na duração total
    if (animation.delay > totalDuration * 0.8) {
      processed.delay = totalDuration * 0.7;
    }

    if (animation.delay + animation.duration > totalDuration) {
      processed.duration = totalDuration - animation.delay;
    }

    return processed;
  }

  // Sincronizar elementos com timeline
  private async synchronizeElements(
    elements: TemplateElement[],
    timeline: any
  ): Promise<TemplateElement[]> {
    if (!timeline) return elements;

    return elements.map(element => {
      // Ajustar posição temporal baseada na timeline
      const timelinePosition = this.calculateTimelinePosition(element, timeline);
      return {
        ...element,
        properties: {
          ...element.properties,
          startTime: timelinePosition.start,
          endTime: timelinePosition.end
        }
      };
    });
  }

  // Análise de conteúdo para sugestões inteligentes
  async analyzeContent(contentData: any): Promise<ContentAnalysis> {
    const cacheKey = this.generateCacheKey(contentData);
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis: ContentAnalysis = {
      contentType: this.detectContentType(contentData),
      dominantColors: await this.extractDominantColors(contentData),
      mood: this.analyzeMood(contentData),
      style: this.analyzeStyle(contentData),
      complexity: this.calculateComplexity(contentData),
      duration: contentData.duration || 0,
      aspectRatio: contentData.aspectRatio || '16:9',
      quality: this.assessQuality(contentData),
      metadata: contentData.metadata || {}
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  // Gerar sugestões inteligentes
  async generateSmartSuggestions(
    contentAnalysis: ContentAnalysis,
    availableTemplates: Template[]
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // Sugestões baseadas no tipo de conteúdo
    const contentTypeSuggestions = this.generateContentTypeSuggestions(
      contentAnalysis,
      availableTemplates
    );
    suggestions.push(...contentTypeSuggestions);

    // Sugestões baseadas no mood
    const moodSuggestions = this.generateMoodSuggestions(
      contentAnalysis,
      availableTemplates
    );
    suggestions.push(...moodSuggestions);

    // Sugestões baseadas nas cores dominantes
    const colorSuggestions = this.generateColorSuggestions(
      contentAnalysis,
      availableTemplates
    );
    suggestions.push(...colorSuggestions);

    // Ordenar por confiança
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  // Renderizar template
  async renderTemplate(
    template: Template,
    options: TemplateRenderOptions
  ): Promise<TemplateRenderJob> {
    const jobId = this.generateJobId();
    const job: TemplateRenderJob = {
      id: jobId,
      templateId: template.id,
      options,
      status: 'pending',
      progress: 0,
      startTime: new Date()
    };

    this.renderJobs.set(jobId, job);

    // Simular processo de renderização
    this.simulateRenderProcess(job);

    return job;
  }

  // Obter status do job de renderização
  getRenderJobStatus(jobId: string): TemplateRenderJob | undefined {
    return this.renderJobs.get(jobId);
  }

  // Métodos auxiliares
  private replacePlaceholders(text: string, data: any): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private adaptColorToScheme(color: string, scheme: string[]): string {
    // Lógica para adaptar cor ao esquema
    return scheme[0] || color;
  }

  private findSuitableAsset(assets: any[], properties: any): any {
    // Encontrar asset mais adequado baseado nas propriedades
    return assets[0]; // Simplificado
  }

  private generateFiltersForMood(mood: string): string[] {
    const moodFilters: Record<string, string[]> = {
      'happy': ['brightness(1.1)', 'saturate(1.2)'],
      'sad': ['brightness(0.8)', 'saturate(0.7)', 'sepia(0.3)'],
      'energetic': ['contrast(1.2)', 'saturate(1.3)'],
      'calm': ['brightness(0.9)', 'saturate(0.8)']
    };
    return moodFilters[mood] || [];
  }

  private calculateOptimalPlaybackRate(videoDuration: number, targetDuration: number): number {
    return Math.min(Math.max(videoDuration / targetDuration, 0.5), 2.0);
  }

  private scalePosition(position: any, newRes: any, baseRes: any): any {
    return {
      x: (position.x * newRes.width) / baseRes.width,
      y: (position.y * newRes.height) / baseRes.height,
      z: position.z
    };
  }

  private scaleDimensions(dimensions: any, newRes: any, baseRes: any): any {
    return {
      width: (dimensions.width * newRes.width) / baseRes.width,
      height: (dimensions.height * newRes.height) / baseRes.height
    };
  }

  private calculateTimelinePosition(element: TemplateElement, timeline: any): any {
    // Lógica para calcular posição na timeline
    return {
      start: 0,
      end: timeline.duration || 10
    };
  }

  private generateCacheKey(data: any): string {
    return JSON.stringify(data).slice(0, 50);
  }

  private detectContentType(data: any): string[] {
    const types = [];
    if (data.assets?.videos?.length > 0) types.push('video');
    if (data.assets?.images?.length > 0) types.push('image');
    if (data.assets?.audio?.length > 0) types.push('audio');
    return types;
  }

  private async extractDominantColors(data: any): Promise<string[]> {
    // Simulação de extração de cores dominantes
    return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  }

  private analyzeMood(data: any): string {
    // Análise simplificada de mood
    const moods = ['happy', 'energetic', 'calm', 'professional', 'creative'];
    return moods[Math.floor(Math.random() * moods.length)];
  }

  private analyzeStyle(data: any): string {
    const styles = ['modern', 'classic', 'minimalist', 'bold', 'elegant'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private calculateComplexity(data: any): number {
    let complexity = 0;
    if (data.assets?.videos?.length > 0) complexity += data.assets.videos.length * 0.3;
    if (data.assets?.images?.length > 0) complexity += data.assets.images.length * 0.2;
    if (data.effects?.length > 0) complexity += data.effects.length * 0.1;
    return Math.min(complexity, 1.0);
  }

  private assessQuality(data: any): number {
    // Avaliação simplificada de qualidade
    return Math.random() * 0.3 + 0.7; // Entre 0.7 e 1.0
  }

  private generateContentTypeSuggestions(
    analysis: ContentAnalysis,
    templates: Template[]
  ): SmartSuggestion[] {
    return templates
      .filter(t => analysis.contentType.some(ct => t.tags.includes(ct)))
      .slice(0, 3)
      .map(template => ({
        id: `content-${template.id}`,
        type: 'template',
        title: `Template para ${analysis.contentType.join(', ')}`,
        description: template.description,
        confidence: 0.8,
        reasoning: `Baseado no tipo de conteúdo detectado: ${analysis.contentType.join(', ')}`,
        data: template
      }));
  }

  private generateMoodSuggestions(
    analysis: ContentAnalysis,
    templates: Template[]
  ): SmartSuggestion[] {
    return templates
      .filter(t => t.metadata.mood.includes(analysis.mood))
      .slice(0, 2)
      .map(template => ({
        id: `mood-${template.id}`,
        type: 'template',
        title: `Template ${analysis.mood}`,
        description: template.description,
        confidence: 0.7,
        reasoning: `Baseado no mood detectado: ${analysis.mood}`,
        data: template
      }));
  }

  private generateColorSuggestions(
    analysis: ContentAnalysis,
    templates: Template[]
  ): SmartSuggestion[] {
    return templates
      .filter(t => 
        analysis.dominantColors.some(color => 
          t.metadata.colorScheme.some(tc => this.colorsMatch(color, tc))
        )
      )
      .slice(0, 2)
      .map(template => ({
        id: `color-${template.id}`,
        type: 'template',
        title: 'Template com cores compatíveis',
        description: template.description,
        confidence: 0.6,
        reasoning: 'Baseado nas cores dominantes do conteúdo',
        data: template
      }));
  }

  private colorsMatch(color1: string, color2: string): boolean {
    // Lógica simplificada de comparação de cores
    return color1.toLowerCase() === color2.toLowerCase();
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simulateRenderProcess(job: TemplateRenderJob): void {
    job.status = 'processing';
    
    const updateProgress = () => {
      if (job.progress < 100) {
        job.progress += Math.random() * 10;
        job.progress = Math.min(job.progress, 100);
        
        if (job.progress >= 100) {
          job.status = 'completed';
          job.endTime = new Date();
          job.outputUrl = `/renders/${job.id}.mp4`;
        } else {
          setTimeout(updateProgress, 500);
        }
      }
    };
    
    setTimeout(updateProgress, 100);
  }
}

// Instância singleton
export const templateEngine = TemplateEngine.getInstance();

// Funções utilitárias exportadas
export const TemplateUtils = {
  // Validar template
  validateTemplate(template: Partial<Template>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.name) errors.push('Nome é obrigatório');
    if (!template.elements || template.elements.length === 0) {
      errors.push('Template deve ter pelo menos um elemento');
    }
    if (!template.duration || template.duration <= 0) {
      errors.push('Duração deve ser maior que zero');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Gerar thumbnail do template
  generateThumbnail(template: Template): Promise<string> {
    return new Promise((resolve) => {
      // Simulação de geração de thumbnail
      setTimeout(() => {
        resolve(`/thumbnails/${template.id}.jpg`);
      }, 1000);
    });
  },

  // Calcular compatibilidade entre templates
  calculateCompatibility(template1: Template, template2: Template): number {
    let score = 0;
    
    // Comparar categorias
    if (template1.category === template2.category) score += 0.3;
    
    // Comparar tags
    const commonTags = template1.tags.filter(tag => template2.tags.includes(tag));
    score += (commonTags.length / Math.max(template1.tags.length, template2.tags.length)) * 0.3;
    
    // Comparar aspect ratio
    if (template1.aspectRatio === template2.aspectRatio) score += 0.2;
    
    // Comparar duração
    const durationDiff = Math.abs(template1.duration - template2.duration);
    score += Math.max(0, (30 - durationDiff) / 30) * 0.2;
    
    return Math.min(score, 1.0);
  }
};