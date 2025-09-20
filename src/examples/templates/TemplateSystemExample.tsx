/**
 * Exemplo completo de uso do Sistema de Templates Profissionais
 * Demonstra integração entre o TemplateManager e TemplateLibrary
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, Upload, Video, Eye, Settings } from 'lucide-react';
import { TemplateManager, ProfessionalTemplate } from '../../../lib/templates/TemplateManager';
import { TemplateLibrary } from '../../../components/ui/TemplateLibrary';

interface ExamplePresentation {
  id: string;
  title: string;
  description: string;
  slides: {
    id: string;
    title: string;
    content: string;
    isTitle?: boolean;
    charts?: any[];
    images?: string[];
  }[];
  metadata: {
    created: Date;
    modified: Date;
    author: string;
  };
}

export const TemplateSystemExample: React.FC = () => {
  const [templateManager] = useState(() => new TemplateManager());
  const [selectedTemplate, setSelectedTemplate] = useState<ProfessionalTemplate | null>(null);
  const [currentPresentation, setCurrentPresentation] = useState<ExamplePresentation | null>(null);
  const [styledPresentation, setStyledPresentation] = useState<any>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Apresentação de exemplo
  const samplePresentation: ExamplePresentation = {
    id: 'sample-presentation',
    title: 'Apresentação de Vendas Q1 2024',
    description: 'Resultados e estratégias para o primeiro trimestre',
    slides: [
      {
        id: 'slide-1',
        title: 'Vendas Q1 2024',
        content: 'Resultados do Primeiro Trimestre - Superando Expectativas',
        isTitle: true
      },
      {
        id: 'slide-2',
        title: 'Visão Geral dos Resultados',
        content: 'Principais métricas e conquistas do trimestre',
        charts: [{ type: 'bar', data: [] }]
      },
      {
        id: 'slide-3',
        title: 'Análise de Performance',
        content: 'Crescimento de 25% em relação ao trimestre anterior. Expansão para 3 novos mercados. Aumento de 40% na satisfação do cliente.',
        charts: [{ type: 'line', data: [] }]
      },
      {
        id: 'slide-4',
        title: 'Estratégias para Q2',
        content: 'Foco em inovação de produtos. Expansão da equipe de vendas. Investimento em marketing digital.',
      },
      {
        id: 'slide-5',
        title: 'Próximos Passos',
        content: 'Implementação de novo CRM. Treinamento da equipe. Lançamento de campanha integrada.',
      }
    ],
    metadata: {
      created: new Date(),
      modified: new Date(),
      author: 'Equipe de Vendas'
    }
  };

  const handleTemplateSelect = useCallback((template: ProfessionalTemplate) => {
    setSelectedTemplate(template);
    console.log('Template selecionado:', template.name);
  }, []);

  const handleApplyTemplate = useCallback(async () => {
    if (!selectedTemplate || !currentPresentation) return;

    setIsProcessing(true);
    
    try {
      // Simula tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const styled = templateManager.applyTemplateToPresentation(
        selectedTemplate.id,
        currentPresentation
      );
      
      setStyledPresentation(styled);
      console.log('Template aplicado com sucesso:', styled);
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTemplate, currentPresentation, templateManager]);

  const handleExportTemplate = useCallback(() => {
    if (!selectedTemplate) return;
    
    try {
      const exported = templateManager.exportTemplate(selectedTemplate.id);
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar template:', error);
    }
  }, [selectedTemplate, templateManager]);

  const handleImportTemplate = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = templateManager.importTemplate(content);
        console.log('Template importado:', imported);
        // Refresh template library
        setShowTemplateLibrary(false);
        setTimeout(() => setShowTemplateLibrary(true), 100);
      } catch (error) {
        console.error('Erro ao importar template:', error);
      }
    };
    reader.readAsText(file);
  }, [templateManager]);

  const generateVideoPreview = useCallback(async () => {
    if (!styledPresentation) return;

    setIsProcessing(true);
    
    try {
      // Simula geração de preview de vídeo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('Preview de vídeo gerado para apresentação estilizada');
      
      // Aqui você integraria com o sistema de geração de vídeo real
      alert('Preview de vídeo gerado com sucesso! (Simulação)');
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [styledPresentation]);

  React.useEffect(() => {
    setCurrentPresentation(samplePresentation);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sistema de Templates Profissionais</h1>
        <p className="text-muted-foreground">
          Exemplo completo de integração entre TemplateManager e TemplateLibrary
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Controle */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Controles
            </CardTitle>
            <CardDescription>
              Gerencie templates e apresentações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Apresentação Atual</h4>
              {currentPresentation && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{currentPresentation.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentPresentation.slides.length} slides
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Autor: {currentPresentation.metadata.author}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-semibold">Template Selecionado</h4>
              {selectedTemplate ? (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{selectedTemplate.name}</p>
                    {selectedTemplate.isPremium && (
                      <Badge variant="secondary">Premium</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.category}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: selectedTemplate.style.primaryColor }}
                    />
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: selectedTemplate.style.secondaryColor }}
                    />
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: selectedTemplate.style.accentColor }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum template selecionado
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Button 
                onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}
                className="w-full"
                variant={showTemplateLibrary ? "secondary" : "default"}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showTemplateLibrary ? 'Ocultar' : 'Mostrar'} Biblioteca
              </Button>

              <Button 
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate || !currentPresentation || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Aplicando...' : 'Aplicar Template'}
              </Button>

              {styledPresentation && (
                <Button 
                  onClick={generateVideoPreview}
                  disabled={isProcessing}
                  className="w-full"
                  variant="outline"
                >
                  <Video className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Gerando...' : 'Gerar Vídeo'}
                </Button>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleExportTemplate}
                  disabled={!selectedTemplate}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </Button>

                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => document.getElementById('import-template')?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Importar
                </Button>
                <input
                  id="import-template"
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportTemplate}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          {styledPresentation && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Template aplicado com sucesso! Apresentação estilizada com {styledPresentation.slides.length} slides.
                Cores principais: {selectedTemplate?.style.primaryColor}, transição: {selectedTemplate?.transitions.default.type}.
              </AlertDescription>
            </Alert>
          )}

          {/* Biblioteca de Templates */}
          {showTemplateLibrary && (
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Templates</CardTitle>
                <CardDescription>
                  Selecione um template profissional para sua apresentação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateLibrary
                  onTemplateSelect={handleTemplateSelect}
                  selectedTemplateId={selectedTemplate?.id}
                />
              </CardContent>
            </Card>
          )}

          {/* Preview da Apresentação */}
          <Card>
            <CardHeader>
              <CardTitle>Preview da Apresentação</CardTitle>
              <CardDescription>
                {styledPresentation 
                  ? `Apresentação com template "${selectedTemplate?.name}" aplicado`
                  : 'Apresentação original (sem template aplicado)'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(styledPresentation || currentPresentation)?.slides.map((slide: any, index: number) => (
                  <div 
                    key={slide.id}
                    className="p-4 border rounded-lg"
                    style={styledPresentation ? {
                      backgroundColor: slide.style?.backgroundColor || '#ffffff',
                      color: slide.style?.color || '#000000',
                      fontFamily: slide.style?.fontFamily || 'inherit'
                    } : {}}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Slide {index + 1}</Badge>
                      {slide.isTitle && <Badge>Título</Badge>}
                      {slide.charts && <Badge variant="secondary">Com Gráficos</Badge>}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{slide.title}</h3>
                    <p className="text-sm">{slide.content}</p>
                    
                    {styledPresentation && slide.layout && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Layout: {slide.layout.name} | Transição: {slide.transition?.type || 'Nenhuma'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Templates Disponíveis</p>
                    <p className="text-2xl font-bold">
                      {templateManager.getTemplatesByCategory().length}
                    </p>
                  </div>
                  <Settings className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Categorias</p>
                    <p className="text-2xl font-bold">
                      {new Set(templateManager.getTemplatesByCategory().map(t => t.category)).size}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Templates Premium</p>
                    <p className="text-2xl font-bold">
                      {templateManager.getTemplatesByCategory().filter(t => t.isPremium).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Informações de Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Debug</CardTitle>
          <CardDescription>
            Estados internos do sistema (apenas para desenvolvimento)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <h4 className="font-bold mb-2">Template Selecionado:</h4>
              <pre className="bg-muted p-3 rounded overflow-auto">
                {selectedTemplate ? JSON.stringify({
                  id: selectedTemplate.id,
                  name: selectedTemplate.name,
                  category: selectedTemplate.category,
                  isPremium: selectedTemplate.isPremium,
                  primaryColor: selectedTemplate.style.primaryColor
                }, null, 2) : 'null'}
              </pre>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">Status do Sistema:</h4>
              <pre className="bg-muted p-3 rounded overflow-auto">
                {JSON.stringify({
                  showTemplateLibrary,
                  isProcessing,
                  hasCurrentPresentation: !!currentPresentation,
                  hasStyledPresentation: !!styledPresentation,
                  totalTemplates: templateManager.getTemplatesByCategory().length
                }, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateSystemExample;