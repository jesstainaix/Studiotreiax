import { promises as fs } from 'fs';
import path from 'path';
import { PPTXValidator } from './pptx-validator.js';

export class PPTXTemplateIO {
  constructor(baseTemplatesPath = './templates') {
    this.baseTemplatesPath = baseTemplatesPath;
    this.validator = new PPTXValidator();
  }

  async exportTemplate(template, filename) {
    try {
      // Validar template antes de exportar
      this.validator.validateTemplate(template);

      // Preparar template para exportação
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        template: this.prepareTemplateForExport(template)
      };

      // Garantir que o diretório existe
      await fs.mkdir(this.baseTemplatesPath, { recursive: true });

      // Salvar arquivo
      const filePath = path.join(this.baseTemplatesPath, `${filename}.json`);
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

      return {
        success: true,
        filePath,
        message: `Template exportado com sucesso para ${filePath}`
      };
    } catch (error) {
      throw new Error(`Erro ao exportar template: ${error.message}`);
    }
  }

  async importTemplate(filename) {
    try {
      const filePath = path.join(this.baseTemplatesPath, `${filename}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const importData = JSON.parse(fileContent);

      // Verificar versão do template
      if (!this.isVersionCompatible(importData.version)) {
        throw new Error(`Versão do template incompatível: ${importData.version}`);
      }

      // Reconstruir template
      const template = this.reconstructTemplate(importData.template);

      // Validar template reconstruído
      this.validator.validateTemplate(template);

      return {
        success: true,
        template,
        message: `Template importado com sucesso de ${filePath}`
      };
    } catch (error) {
      throw new Error(`Erro ao importar template: ${error.message}`);
    }
  }

  async listTemplates() {
    try {
      const files = await fs.readdir(this.baseTemplatesPath);
      const templates = [];

      for (const file of files) {
        if (path.extname(file) === '.json') {
          try {
            const filePath = path.join(this.baseTemplatesPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            templates.push({
              name: path.basename(file, '.json'),
              version: data.version,
              exportDate: data.exportDate,
              preview: this.generateTemplatePreview(data.template)
            });
          } catch (error) {
            console.warn(`Aviso: Erro ao ler template ${file}:`, error.message);
          }
        }
      }

      return templates;
    } catch (error) {
      throw new Error(`Erro ao listar templates: ${error.message}`);
    }
  }

  async deleteTemplate(filename) {
    try {
      const filePath = path.join(this.baseTemplatesPath, `${filename}.json`);
      await fs.unlink(filePath);
      
      return {
        success: true,
        message: `Template ${filename} excluído com sucesso`
      };
    } catch (error) {
      throw new Error(`Erro ao excluir template: ${error.message}`);
    }
  }

  // Métodos auxiliares
  prepareTemplateForExport(template) {
    // Converter recursos incorporados para formato portável
    const portableTemplate = {
      ...template,
      resources: this.convertResourcesToPortable(template.resources)
    };

    // Remover propriedades específicas da instância
    delete portableTemplate.id;
    delete portableTemplate.createdAt;
    delete portableTemplate.modifiedAt;

    return portableTemplate;
  }

  convertResourcesToPortable(resources) {
    if (!resources) return null;

    const portableResources = {};

    // Converter imagens para Base64
    if (resources.images) {
      portableResources.images = resources.images.map(img => ({
        ...img,
        data: img.data.toString('base64')
      }));
    }

    // Converter outros recursos conforme necessário
    // ...

    return portableResources;
  }

  reconstructTemplate(exportedTemplate) {
    // Reconstruir recursos
    const template = {
      ...exportedTemplate,
      resources: this.reconstructResources(exportedTemplate.resources)
    };

    // Adicionar propriedades da instância
    template.id = Date.now().toString();
    template.createdAt = new Date().toISOString();
    template.modifiedAt = template.createdAt;

    return template;
  }

  reconstructResources(exportedResources) {
    if (!exportedResources) return null;

    const resources = {};

    // Reconstruir imagens de Base64
    if (exportedResources.images) {
      resources.images = exportedResources.images.map(img => ({
        ...img,
        data: Buffer.from(img.data, 'base64')
      }));
    }

    // Reconstruir outros recursos conforme necessário
    // ...

    return resources;
  }

  isVersionCompatible(version) {
    // Implementar lógica de compatibilidade de versão
    const currentVersion = '1.0';
    const [major, minor] = version.split('.');
    const [currentMajor, currentMinor] = currentVersion.split('.');

    // Verificar compatibilidade de versão maior
    if (parseInt(major) !== parseInt(currentMajor)) {
      return false;
    }

    // Versões menores são compatíveis para frente
    return parseInt(minor) <= parseInt(currentMinor);
  }

  generateTemplatePreview(template) {
    // Gerar visualização resumida do template
    return {
      layout: template.layout,
      elementCount: template.elements?.length || 0,
      hasCustomStyles: !!template.styles,
      resourceTypes: this.getResourceTypes(template.resources)
    };
  }

  getResourceTypes(resources) {
    if (!resources) return [];

    const types = [];
    if (resources.images?.length > 0) types.push('images');
    if (resources.fonts?.length > 0) types.push('fonts');
    if (resources.themes?.length > 0) types.push('themes');
    
    return types;
  }

  // Métodos de validação específicos para templates
  validateTemplateStructure(template) {
    const requiredFields = ['layout', 'elements'];
    const missingFields = requiredFields.filter(field => !template[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }

    // Validar elementos do template
    if (!Array.isArray(template.elements)) {
      throw new Error('Template deve conter um array de elementos');
    }

    template.elements.forEach((element, index) => {
      this.validateTemplateElement(element, index);
    });
  }

  validateTemplateElement(element, index) {
    const requiredElementFields = ['type', 'position'];
    const missingFields = requiredElementFields.filter(field => !element[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes no elemento ${index}: ${missingFields.join(', ')}`);
    }

    // Validar tipo de elemento
    const validTypes = ['title', 'content', 'image', 'shape', 'chart', 'table'];
    if (!validTypes.includes(element.type)) {
      throw new Error(`Tipo de elemento inválido no elemento ${index}: ${element.type}`);
    }

    // Validar posição
    this.validateElementPosition(element.position, index);
  }

  validateElementPosition(position, elementIndex) {
    const validPositions = ['top', 'bottom', 'left', 'right', 'center'];
    
    if (typeof position === 'string') {
      if (!validPositions.includes(position)) {
        throw new Error(`Posição inválida no elemento ${elementIndex}: ${position}`);
      }
    } else if (typeof position === 'object') {
      if (!position.x || !position.y) {
        throw new Error(`Coordenadas x,y ausentes no elemento ${elementIndex}`);
      }
      
      // Validar coordenadas (podem ser em pixels ou porcentagem)
      const validCoord = (coord) => {
        return typeof coord === 'number' || 
               (typeof coord === 'string' && coord.endsWith('%'));
      };

      if (!validCoord(position.x) || !validCoord(position.y)) {
        throw new Error(`Coordenadas inválidas no elemento ${elementIndex}`);
      }
    } else {
      throw new Error(`Formato de posição inválido no elemento ${elementIndex}`);
    }
  }
}