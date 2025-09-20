import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PromptTemplateService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../data/prompt-templates.json');
    this.templates = new Map();
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      const data = await fs.readFile(this.templatesPath, 'utf8');
      const templates = JSON.parse(data);
      templates.forEach(template => {
        this.templates.set(template.id, template);
      });
    } catch (error) {
      console.log('Criando arquivo de templates inicial');
      await this.initializeDefaultTemplates();
    }
  }

  async saveTemplates() {
    try {
      const templatesArray = Array.from(this.templates.values());
      await fs.writeFile(this.templatesPath, JSON.stringify(templatesArray, null, 2));
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      throw error;
    }
  }

  async initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        id: uuidv4(),
        name: 'Roteiro NR-35 Básico',
        type: 'script',
        category: 'NR-35',
        description: 'Template para criação de roteiros básicos sobre trabalho em altura',
        prompt: `Você é um especialista em segurança do trabalho especializado em NR-35.
Crie um roteiro educativo sobre trabalho em altura com as seguintes características:

Tópico: {{topic}}
Duração: {{duration}} segundos
Público-alvo: {{audience}}
Tom: {{tone}}

O roteiro deve:
- Seguir as diretrizes da NR-35
- Incluir exemplos práticos
- Ter linguagem clara e objetiva
- Incluir pontos de segurança essenciais
- Ter estrutura: introdução, desenvolvimento, conclusão

Formato de resposta JSON com title, scenes, keyPoints e callToAction.`,
        variables: [
          { name: 'topic', type: 'text', required: true, description: 'Tópico específico da NR-35' },
          { name: 'duration', type: 'number', required: true, description: 'Duração em segundos' },
          { name: 'audience', type: 'select', options: ['trabalhadores', 'supervisores', 'técnicos'], required: true },
          { name: 'tone', type: 'select', options: ['formal', 'didático', 'conversacional'], required: false }
        ],
        tags: ['NR-35', 'segurança', 'altura', 'roteiro'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usage: 0,
        rating: 0,
        reviews: []
      },
      {
        id: uuidv4(),
        name: 'Storyboard Profissional',
        type: 'storyboard',
        category: 'visual',
        description: 'Template para criação de storyboards profissionais',
        prompt: `Você é um especialista em storyboard para vídeos educativos corporativos.
Crie um storyboard detalhado baseado no seguinte roteiro:

Roteiro: {{script}}
Estilo visual: {{visualStyle}}
Público-alvo: {{audience}}
Número de frames: {{frameCount}}

O storyboard deve:
- Ter descrições visuais detalhadas
- Incluir elementos gráficos específicos
- Especificar transições entre frames
- Considerar a identidade visual corporativa
- Incluir timing preciso

Formato de resposta JSON com frames, totalDuration, visualStyle e colorPalette.`,
        variables: [
          { name: 'script', type: 'textarea', required: true, description: 'Roteiro base para o storyboard' },
          { name: 'visualStyle', type: 'select', options: ['corporativo', 'moderno', 'minimalista', 'ilustrativo'], required: true },
          { name: 'audience', type: 'text', required: true, description: 'Público-alvo específico' },
          { name: 'frameCount', type: 'number', required: false, description: 'Número de frames desejado' }
        ],
        tags: ['storyboard', 'visual', 'corporativo'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usage: 0,
        rating: 0,
        reviews: []
      },
      {
        id: uuidv4(),
        name: 'Legendas Acessíveis',
        type: 'captions',
        category: 'acessibilidade',
        description: 'Template para criação de legendas com foco em acessibilidade',
        prompt: `Você é um especialista em acessibilidade e criação de legendas.
Crie legendas acessíveis para o seguinte conteúdo:

Texto do áudio: {{audioText}}
Idioma: {{language}}
Duração máxima por segmento: {{segmentDuration}} segundos
Caracteres por linha: {{maxCharsPerLine}}

As legendas devem:
- Seguir padrões de acessibilidade WCAG
- Ter timing preciso
- Incluir descrições de sons importantes
- Usar formatação adequada
- Ser facilmente legíveis

Formato de resposta JSON com segments, totalDuration, language e accessibility.`,
        variables: [
          { name: 'audioText', type: 'textarea', required: true, description: 'Transcrição do áudio' },
          { name: 'language', type: 'select', options: ['pt-BR', 'en-US', 'es-ES'], required: true },
          { name: 'segmentDuration', type: 'number', required: false, description: 'Duração máxima por segmento' },
          { name: 'maxCharsPerLine', type: 'number', required: false, description: 'Caracteres máximos por linha' }
        ],
        tags: ['legendas', 'acessibilidade', 'WCAG'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usage: 0,
        rating: 0,
        reviews: []
      },
      {
        id: uuidv4(),
        name: 'Análise de Qualidade NR',
        type: 'analysis',
        category: 'qualidade',
        description: 'Template para análise de qualidade de conteúdo sobre normas regulamentadoras',
        prompt: `Você é um auditor especializado em conteúdo educativo sobre normas regulamentadoras.
Analise a qualidade do seguinte conteúdo:

Conteúdo: {{content}}
Norma: {{nrType}}
Critérios: {{criteria}}
Pontuação mínima: {{minScore}}

Avalie:
- Conformidade com a norma
- Clareza e objetividade
- Completude das informações
- Engajamento do público
- Precisão técnica

Formato de resposta JSON com overallScore, criteria, strengths, weaknesses e recommendations.`,
        variables: [
          { name: 'content', type: 'textarea', required: true, description: 'Conteúdo a ser analisado' },
          { name: 'nrType', type: 'select', options: ['NR-35', 'NR-33', 'NR-10', 'NR-06', 'NR-12'], required: true },
          { name: 'criteria', type: 'multiselect', options: ['clareza', 'completude', 'engajamento', 'conformidade'], required: true },
          { name: 'minScore', type: 'number', required: false, description: 'Pontuação mínima esperada' }
        ],
        tags: ['análise', 'qualidade', 'NR', 'auditoria'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usage: 0,
        rating: 0,
        reviews: []
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    await this.saveTemplates();
  }

  // Listar templates
  async getTemplates(filters = {}) {
    const { type, category, tags, isActive, search } = filters;
    let templates = Array.from(this.templates.values());

    if (type) {
      templates = templates.filter(t => t.type === type);
    }

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (tags && tags.length > 0) {
      templates = templates.filter(t => 
        tags.some(tag => t.tags.includes(tag))
      );
    }

    if (isActive !== undefined) {
      templates = templates.filter(t => t.isActive === isActive);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return templates.sort((a, b) => {
      // Ordenar por rating e uso
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.usage - a.usage;
    });
  }

  // Obter template por ID
  async getTemplate(id) {
    return this.templates.get(id);
  }

  // Criar novo template
  async createTemplate(templateData) {
    const template = {
      id: uuidv4(),
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: 0,
      rating: 0,
      reviews: []
    };

    this.templates.set(template.id, template);
    await this.saveTemplates();
    
    return template;
  }

  // Atualizar template
  async updateTemplate(id, updates) {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.templates.set(id, updatedTemplate);
    await this.saveTemplates();
    
    return updatedTemplate;
  }

  // Deletar template
  async deleteTemplate(id) {
    const deleted = this.templates.delete(id);
    if (deleted) {
      await this.saveTemplates();
    }
    return deleted;
  }

  // Processar template com variáveis
  async processTemplate(id, variables) {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    let processedPrompt = template.prompt;

    // Substituir variáveis no prompt
    template.variables.forEach(variable => {
      const value = variables[variable.name];
      if (variable.required && !value) {
        throw new Error(`Variável obrigatória '${variable.name}' não fornecida`);
      }
      
      const placeholder = `{{${variable.name}}}`;
      const replacement = value || '';
      processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), replacement);
    });

    // Incrementar uso
    template.usage += 1;
    this.templates.set(id, template);
    await this.saveTemplates();

    return {
      processedPrompt,
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
        category: template.category
      }
    };
  }

  // Avaliar template
  async rateTemplate(id, rating, review = '') {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    template.reviews.push({
      rating,
      review,
      timestamp: new Date().toISOString()
    });

    // Calcular nova média
    const totalRating = template.reviews.reduce((sum, r) => sum + r.rating, 0);
    template.rating = totalRating / template.reviews.length;

    this.templates.set(id, template);
    await this.saveTemplates();
    
    return template;
  }

  // Duplicar template
  async duplicateTemplate(id, newName) {
    const original = this.templates.get(id);
    if (!original) {
      throw new Error('Template não encontrado');
    }

    const duplicate = {
      ...original,
      id: uuidv4(),
      name: newName || `${original.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: 0,
      rating: 0,
      reviews: []
    };

    this.templates.set(duplicate.id, duplicate);
    await this.saveTemplates();
    
    return duplicate;
  }

  // Exportar templates
  async exportTemplates(ids = []) {
    let templatesToExport;
    
    if (ids.length > 0) {
      templatesToExport = ids.map(id => this.templates.get(id)).filter(Boolean);
    } else {
      templatesToExport = Array.from(this.templates.values());
    }

    return {
      templates: templatesToExport,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Importar templates
  async importTemplates(importData, options = {}) {
    const { overwrite = false, prefix = '' } = options;
    const imported = [];
    const errors = [];

    for (const templateData of importData.templates) {
      try {
        let template = { ...templateData };
        
        // Gerar novo ID se não sobrescrever
        if (!overwrite || !this.templates.has(template.id)) {
          template.id = uuidv4();
        }
        
        // Adicionar prefixo ao nome se especificado
        if (prefix) {
          template.name = `${prefix}${template.name}`;
        }
        
        // Atualizar timestamps
        template.updatedAt = new Date().toISOString();
        if (!overwrite) {
          template.createdAt = new Date().toISOString();
          template.usage = 0;
          template.rating = 0;
          template.reviews = [];
        }

        this.templates.set(template.id, template);
        imported.push(template);
      } catch (error) {
        errors.push({
          template: templateData.name || 'Desconhecido',
          error: error.message
        });
      }
    }

    await this.saveTemplates();
    
    return {
      imported: imported.length,
      errors,
      templates: imported
    };
  }

  // Obter estatísticas
  async getStatistics() {
    const templates = Array.from(this.templates.values());
    
    return {
      total: templates.length,
      active: templates.filter(t => t.isActive).length,
      byType: templates.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {}),
      byCategory: templates.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {}),
      totalUsage: templates.reduce((sum, t) => sum + t.usage, 0),
      averageRating: templates.reduce((sum, t) => sum + t.rating, 0) / templates.length,
      mostUsed: templates.sort((a, b) => b.usage - a.usage).slice(0, 5),
      topRated: templates.sort((a, b) => b.rating - a.rating).slice(0, 5)
    };
  }

  // Validar template
  validateTemplate(templateData) {
    const required = ['name', 'type', 'category', 'prompt', 'variables'];
    const missing = required.filter(field => !templateData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }

    // Validar variáveis
    if (!Array.isArray(templateData.variables)) {
      throw new Error('Variáveis devem ser um array');
    }

    templateData.variables.forEach((variable, index) => {
      if (!variable.name || !variable.type) {
        throw new Error(`Variável ${index + 1}: nome e tipo são obrigatórios`);
      }
    });

    return true;
  }
}

export default PromptTemplateService;