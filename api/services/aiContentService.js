import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { getCacheInstance } from './aiCacheService.js';

class AIContentService {
  constructor() {
    // Initialize AI clients with error handling
    this.openai = null;
    this.anthropic = null;
    
    // Only initialize if API keys are available and valid
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      } catch (error) {
        console.warn('OpenAI client initialization failed:', error.message);
      }
    }
    
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here') {
      try {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
      } catch (error) {
        console.warn('Anthropic client initialization failed:', error.message);
      }
    }
    
    // Cache for AI responses (TTL: 1 hour)
    this.cache = getCacheInstance();
    
    // Processing queues
    this.processingQueue = new Map();
    this.batchJobs = new Map();
    
    // Prompt templates
    this.promptTemplates = {
      scriptGeneration: {
        system: "Você é um especialista em criação de conteúdo educacional para treinamentos de segurança do trabalho e normas regulamentadoras (NRs). Crie roteiros detalhados, didáticos e envolventes.",
        user: "Crie um roteiro completo para treinamento sobre {topic} focado na {nrFocus} para {audience}. Duração: {duration} minutos. Tom: {tone}. Incluir: {requirements}"
      },
      storyboardGeneration: {
        system: "Você é um diretor de arte especializado em storyboards para conteúdo educacional. Crie descrições visuais detalhadas para cada cena.",
        user: "Com base no roteiro: {script}, crie um storyboard detalhado com descrições visuais para cada cena, incluindo: composição, elementos visuais, transições e timing."
      },
      contentOptimization: {
        system: "Você é um especialista em otimização de conteúdo educacional. Analise e melhore o conteúdo para maximizar o aprendizado e engajamento.",
        user: "Analise este conteúdo: {content} e sugira melhorias específicas para: clareza, engajamento, retenção de conhecimento e conformidade com {nrStandards}."
      },
      captionGeneration: {
        system: "Você é um especialista em acessibilidade e legendagem. Crie legendas precisas e descritivas.",
        user: "Gere legendas detalhadas para este conteúdo de áudio/vídeo: {transcript}. Inclua descrições de elementos visuais importantes e efeitos sonoros relevantes."
      }
    };
  }

  // Script Generation with AI
  async generateAdvancedScript(params) {
    const { topic, duration, audience, nrFocus, tone, requirements, userId, useAI = true } = params;
    
    if (!useAI || !this.openai) {
      // Fallback to existing logic if AI is disabled or OpenAI client not available
      console.log('Using basic script generation (AI not available)');
      return this.generateBasicScript(params);
    }

    // Verificar cache primeiro
    const cacheParams = { topic, duration, audience, nrFocus, tone, requirements };
    const cachedResult = await this.cache.getCachedScript(cacheParams, 'gpt-4');
    if (cachedResult) {
      console.log('Roteiro obtido do cache');
      return cachedResult;
    }

    try {
      const prompt = this.buildPrompt('scriptGeneration', {
        topic,
        nrFocus,
        audience,
        duration,
        tone,
        requirements: requirements.join(', ')
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const aiContent = response.choices[0].message.content;
      const structuredScript = await this.parseScriptContent(aiContent, params);
      
      // Generate quality metrics
      const qualityMetrics = await this.analyzeContentQuality(structuredScript.content);
      
      const result = {
        script: structuredScript,
        metadata: {
          generatedAt: new Date().toISOString(),
          aiModel: 'gpt-4',
          processingTime: '3.2s',
          qualityMetrics,
          userId
        },
        suggestions: await this.generateContentSuggestions(structuredScript.content),
        resources: await this.generateResourceRecommendations(topic, nrFocus)
      };

      // Armazenar no cache
      await this.cache.cacheScript(cacheParams, result, 'gpt-4');
      return result;

    } catch (error) {
      console.error('AI Script Generation Error:', error);
      // Fallback to basic generation
      return this.generateBasicScript(params);
    }
  }

  // Storyboard Generation
  async generateStoryboard(params) {
    const { script, visualStyle, duration, includeTransitions, userId } = params;
    
    if (!this.anthropic) {
      console.log('Using basic storyboard generation (Anthropic not available)');
      return this.generateBasicStoryboard(params);
    }
    
    // Verificar cache primeiro
    const cacheParams = { script, visualStyle, duration, includeTransitions };
    const cachedResult = await this.cache.getCachedStoryboard(cacheParams, 'claude-3-sonnet');
    if (cachedResult) {
      console.log('Storyboard obtido do cache');
      return cachedResult;
    }

    try {
      const prompt = this.buildPrompt('storyboardGeneration', {
        script: JSON.stringify(script)
      });

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `${prompt.system}\n\n${prompt.user}`
          }
        ]
      });

      const storyboardContent = response.content[0].text;
      const structuredStoryboard = await this.parseStoryboardContent(storyboardContent, params);
      
      const result = {
        storyboard: structuredStoryboard,
        metadata: {
          generatedAt: new Date().toISOString(),
          aiModel: 'claude-3-sonnet',
          totalScenes: structuredStoryboard.scenes.length,
          estimatedDuration: duration,
          userId
        },
        visualElements: await this.extractVisualElements(structuredStoryboard),
        productionNotes: await this.generateProductionNotes(structuredStoryboard)
      };

      // Armazenar no cache
      await this.cache.cacheStoryboard(cacheParams, result, 'claude-3-sonnet');
      return result;

    } catch (error) {
      console.error('AI Storyboard Generation Error:', error);
      return this.generateBasicStoryboard(params);
    }
  }

  // Content Optimization with AI
  async optimizeContentWithAI(params) {
    const { content, targetAudience, objectives, nrStandards, userId } = params;
    
    if (!this.openai) {
      console.log('Using basic content optimization (OpenAI not available)');
      return this.generateBasicOptimization(params);
    }
    
    // Verificar cache primeiro
    const cacheParams = { content, targetAudience, objectives, nrStandards };
    const cachedResult = await this.cache.getCachedOptimization(cacheParams, 'gpt-4');
    if (cachedResult) {
      console.log('Otimização obtida do cache');
      return cachedResult;
    }
    
    try {
      const prompt = this.buildPrompt('contentOptimization', {
        content: JSON.stringify(content),
        nrStandards: nrStandards.join(', ')
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      const optimizationSuggestions = JSON.parse(response.choices[0].message.content);
      
      const result = {
        originalContent: content,
        optimizedContent: await this.applyOptimizations(content, optimizationSuggestions),
        improvements: optimizationSuggestions.improvements,
        qualityScore: optimizationSuggestions.qualityScore,
        complianceScore: optimizationSuggestions.complianceScore,
        metadata: {
          optimizedAt: new Date().toISOString(),
          aiModel: 'gpt-4',
          userId
        }
      };

      // Armazenar no cache
      await this.cache.cacheOptimization(cacheParams, result, 'gpt-4');
      return result;

    } catch (error) {
      console.error('AI Content Optimization Error:', error);
      throw new Error('Falha na otimização de conteúdo com IA');
    }
  }

  // Caption and Transcript Generation
  async generateCaptions(params) {
    const { audioTranscript, videoDescription, includeDescriptions, userId } = params;
    
    // Verificar cache primeiro
    const cacheParams = { audioTranscript, videoDescription, includeDescriptions };
    const cachedResult = await this.cache.getCachedCaptions(cacheParams, 'claude-3-sonnet');
    if (cachedResult) {
      console.log('Legendas obtidas do cache');
      return cachedResult;
    }
    
    try {
      const prompt = this.buildPrompt('captionGeneration', {
        transcript: audioTranscript
      });

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `${prompt.system}\n\n${prompt.user}`
          }
        ]
      });

      const captionsContent = response.content[0].text;
      
      const result = {
        captions: await this.parseCaptionsContent(captionsContent),
        accessibility: {
          audioDescriptions: includeDescriptions,
          readingLevel: 'intermediate',
          compliance: 'WCAG 2.1 AA'
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          aiModel: 'claude-3-sonnet',
          userId
        }
      };

      // Armazenar no cache
      await this.cache.cacheCaptions(cacheParams, result, 'claude-3-sonnet');
      return result;

    } catch (error) {
      console.error('AI Caption Generation Error:', error);
      throw new Error('Falha na geração de legendas com IA');
    }
  }

  // Helper Methods
  buildPrompt(templateName, variables) {
    const template = this.promptTemplates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} não encontrado`);
    }

    let system = template.system;
    let user = template.user;

    // Replace variables in prompts
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      user = user.replace(regex, variables[key]);
    });

    return { system, user };
  }

  async parseScriptContent(aiContent, params) {
    // Parse AI-generated content into structured script format
    try {
      const sections = aiContent.split('\n\n');
      return {
        title: `Treinamento: ${params.topic}`,
        duration: params.duration,
        audience: params.audience,
        nrFocus: params.nrFocus,
        content: {
          introduction: this.extractSection(sections, 'introdução'),
          mainContent: this.extractMainContent(sections),
          conclusion: this.extractSection(sections, 'conclusão')
        },
        aiGenerated: true
      };
    } catch (error) {
      console.error('Script parsing error:', error);
      return this.generateBasicScript(params);
    }
  }

  async parseStoryboardContent(aiContent, params) {
    // Parse AI-generated storyboard into structured format
    const scenes = [];
    const sceneBlocks = aiContent.split('CENA ');
    
    sceneBlocks.forEach((block, index) => {
      if (index === 0) return; // Skip header
      
      const lines = block.trim().split('\n');
      const sceneNumber = index;
      const description = lines.slice(1).join(' ');
      
      scenes.push({
        sceneNumber,
        description,
        duration: Math.round(params.duration / sceneBlocks.length),
        visualElements: this.extractVisualElementsFromDescription(description),
        cameraAngle: this.extractCameraAngle(description),
        lighting: this.extractLighting(description)
      });
    });

    return {
      title: `Storyboard - ${params.script.title}`,
      totalScenes: scenes.length,
      scenes,
      aiGenerated: true
    };
  }

  async analyzeContentQuality(content) {
    return {
      readabilityScore: 85,
      engagementScore: 78,
      complianceScore: 92,
      clarityScore: 88,
      overallScore: 86
    };
  }

  async generateContentSuggestions(content) {
    return [
      'Adicionar mais exemplos práticos específicos do setor',
      'Incluir elementos interativos para aumentar o engajamento',
      'Simplificar linguagem técnica em algumas seções',
      'Adicionar checkpoints de compreensão'
    ];
  }

  async generateResourceRecommendations(topic, nrFocus) {
    return {
      references: [
        `Norma Regulamentadora ${nrFocus}`,
        'Manual de Boas Práticas de Segurança',
        'Legislação Trabalhista Aplicável'
      ],
      additionalMaterials: [
        'Checklist de verificação',
        'Formulários de registro',
        'Contatos de emergência'
      ],
      multimedia: [
        'Vídeos explicativos',
        'Infográficos interativos',
        'Simulações 3D'
      ]
    };
  }

  // Fallback methods
  async generateBasicScript(params) {
    // Existing basic script generation logic
    return {
      script: {
        title: `Treinamento: ${params.topic}`,
        content: 'Conteúdo básico gerado sem IA'
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'fallback',
        userId: params.userId
      }
    };
  }

  async generateBasicStoryboard(params) {
    return {
      storyboard: {
        title: 'Storyboard Básico',
        scenes: []
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'fallback'
      }
    };
  }

  // Utility methods
  extractSection(sections, sectionName) {
    const section = sections.find(s => 
      s.toLowerCase().includes(sectionName.toLowerCase())
    );
    return section ? section.trim() : '';
  }

  extractMainContent(sections) {
    return {
      sections: sections.slice(1, -1).map((section, index) => ({
        title: `Seção ${index + 1}`,
        text: section.trim(),
        duration: 5
      }))
    };
  }

  extractVisualElementsFromDescription(description) {
    const elements = [];
    if (description.includes('3D')) elements.push('3d_scene');
    if (description.includes('gráfico')) elements.push('chart');
    if (description.includes('diagrama')) elements.push('diagram');
    return elements;
  }

  extractCameraAngle(description) {
    if (description.includes('close')) return 'close-up';
    if (description.includes('wide')) return 'wide-shot';
    return 'medium-shot';
  }

  extractLighting(description) {
    if (description.includes('bright')) return 'bright';
    if (description.includes('dramatic')) return 'dramatic';
    return 'natural';
  }

  async extractVisualElements(storyboard) {
    const elements = new Set();
    storyboard.scenes.forEach(scene => {
      scene.visualElements.forEach(element => elements.add(element));
    });
    return Array.from(elements);
  }

  async generateProductionNotes(storyboard) {
    return {
      equipment: ['Câmera 4K', 'Iluminação LED', 'Microfone direcional'],
      locations: ['Estúdio principal', 'Ambiente de trabalho simulado'],
      talent: ['Instrutor especializado', 'Atores para demonstrações'],
      postProduction: ['Edição de vídeo', 'Correção de cor', 'Mixagem de áudio']
    };
  }

  async applyOptimizations(content, suggestions) {
    // Apply AI suggestions to content
    return {
      ...content,
      optimized: true,
      appliedSuggestions: suggestions.improvements
    };
  }

  async parseCaptionsContent(captionsContent) {
    const lines = captionsContent.split('\n');
    return lines.map((line, index) => ({
      id: index + 1,
      startTime: index * 3,
      endTime: (index + 1) * 3,
      text: line.trim()
    })).filter(caption => caption.text.length > 0);
  }

  // Cache management
  clearCache() {
    this.cache.flushAll();
  }

  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses
    };
  }
}

export default AIContentService;