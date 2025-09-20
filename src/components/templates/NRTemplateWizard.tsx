import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Eye, Save, Wand2 } from 'lucide-react';
import { NRTemplateSystem } from '@/services/NRTemplateSystem';
import { toast } from 'sonner';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

interface TemplateData {
  name: string;
  description: string;
  nrBase: string;
  duration: number;
  targetAudience: string;
  objectives: string[];
  content: {
    slides: Array<{
      title: string;
      content: string;
      type: 'intro' | 'content' | 'quiz' | 'summary';
    }>;
  };
  compliance: {
    requirements: string[];
    validations: string[];
  };
  customization: {
    branding: {
      primaryColor: string;
      secondaryColor: string;
      logo?: string;
    };
    layout: string;
  };
}

const initialTemplateData: TemplateData = {
  name: '',
  description: '',
  nrBase: '',
  duration: 60,
  targetAudience: '',
  objectives: [],
  content: {
    slides: []
  },
  compliance: {
    requirements: [],
    validations: []
  },
  customization: {
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF'
    },
    layout: 'standard'
  }
};

const NR_OPTIONS = [
  { value: 'NR-6', label: 'NR-6 - Equipamentos de Proteção Individual', description: 'Normas sobre uso e fornecimento de EPIs' },
  { value: 'NR-10', label: 'NR-10 - Segurança em Instalações Elétricas', description: 'Segurança em trabalhos com eletricidade' },
  { value: 'NR-12', label: 'NR-12 - Segurança no Trabalho em Máquinas', description: 'Proteção em operação de máquinas e equipamentos' },
  { value: 'NR-35', label: 'NR-35 - Trabalho em Altura', description: 'Segurança para trabalhos acima de 2 metros' },
  { value: 'NR-33', label: 'NR-33 - Segurança em Espaços Confinados', description: 'Trabalhos em ambientes confinados' },
  { value: 'NR-18', label: 'NR-18 - Condições de Segurança na Construção', description: 'Segurança na construção civil' }
];

// Step 1: Informações Básicas
const BasicInfoStep: React.FC<{ data: TemplateData; onChange: (data: Partial<TemplateData>) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Template</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ex: Treinamento Personalizado NR-10"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Duração (minutos)</Label>
          <Input
            id="duration"
            type="number"
            value={data.duration}
            onChange={(e) => onChange({ duration: parseInt(e.target.value) || 60 })}
            min="15"
            max="480"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descreva o objetivo e conteúdo do treinamento..."
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="audience">Público-Alvo</Label>
        <Input
          id="audience"
          value={data.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          placeholder="Ex: Eletricistas, Técnicos, Engenheiros"
        />
      </div>
    </div>
  );
};

// Step 2: Seleção de Norma Base
const NRSelectionStep: React.FC<{ data: TemplateData; onChange: (data: Partial<TemplateData>) => void }> = ({ data, onChange }) => {
  const selectedNR = NR_OPTIONS.find(nr => nr.value === data.nrBase);
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Selecione a Norma Regulamentadora Base</h3>
        <p className="text-gray-600">Escolha a NR que servirá como base para seu template personalizado</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NR_OPTIONS.map((nr) => (
          <Card 
            key={nr.value} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              data.nrBase === nr.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => onChange({ nrBase: nr.value })}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{nr.label}</h4>
                  <p className="text-xs text-gray-600">{nr.description}</p>
                </div>
                {data.nrBase === nr.value && (
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedNR && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Selecionado: <strong>{selectedNR.label}</strong> - {selectedNR.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Step 3: Configuração de Conteúdo
const ContentConfigStep: React.FC<{ data: TemplateData; onChange: (data: Partial<TemplateData>) => void }> = ({ data, onChange }) => {
  const [newObjective, setNewObjective] = useState('');
  const [newSlide, setNewSlide] = useState({ title: '', content: '', type: 'content' as const });
  
  const addObjective = () => {
    if (newObjective.trim()) {
      onChange({ objectives: [...data.objectives, newObjective.trim()] });
      setNewObjective('');
    }
  };
  
  const removeObjective = (index: number) => {
    onChange({ objectives: data.objectives.filter((_, i) => i !== index) });
  };
  
  const addSlide = () => {
    if (newSlide.title.trim() && newSlide.content.trim()) {
      onChange({ 
        content: { 
          slides: [...data.content.slides, { ...newSlide }] 
        } 
      });
      setNewSlide({ title: '', content: '', type: 'content' });
    }
  };
  
  const removeSlide = (index: number) => {
    onChange({ 
      content: { 
        slides: data.content.slides.filter((_, i) => i !== index) 
      } 
    });
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
          <TabsTrigger value="slides">Slides</TabsTrigger>
        </TabsList>
        
        <TabsContent value="objectives" className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Adicionar objetivo de aprendizagem..."
                onKeyPress={(e) => e.key === 'Enter' && addObjective()}
              />
              <Button onClick={addObjective} size="sm">
                Adicionar
              </Button>
            </div>
            
            <div className="space-y-2">
              {data.objectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{objective}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeObjective(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="slides" className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Slide</Label>
                <Input
                  value={newSlide.title}
                  onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                  placeholder="Título do slide..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tipo do Slide</Label>
                <Select value={newSlide.type} onValueChange={(value: any) => setNewSlide({ ...newSlide, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intro">Introdução</SelectItem>
                    <SelectItem value="content">Conteúdo</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="summary">Resumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Conteúdo do Slide</Label>
              <Textarea
                value={newSlide.content}
                onChange={(e) => setNewSlide({ ...newSlide, content: e.target.value })}
                placeholder="Conteúdo do slide..."
                rows={3}
              />
            </div>
            
            <Button onClick={addSlide} className="w-full">
              Adicionar Slide
            </Button>
            
            <div className="space-y-2">
              {data.content.slides.map((slide, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{slide.title}</h4>
                          <Badge variant="outline" className="text-xs">{slide.type}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{slide.content}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeSlide(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Step 4: Preview e Finalização
const PreviewStep: React.FC<{ data: TemplateData; onSave: () => void }> = ({ data, onSave }) => {
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    validateCompliance();
  }, [data]);
  
  const validateCompliance = async () => {
    setIsValidating(true);
    try {
      const nrSystem = new NRTemplateSystem();
      const validation = await nrSystem.validateCompliance(data as any);
      setComplianceStatus(validation);
    } catch (error) {
      console.error('Erro na validação:', error);
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo do Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Resumo do Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Nome</Label>
              <p className="text-sm text-gray-600">{data.name || 'Não definido'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Norma Base</Label>
              <p className="text-sm text-gray-600">{data.nrBase || 'Não selecionada'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Duração</Label>
              <p className="text-sm text-gray-600">{data.duration} minutos</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Objetivos</Label>
              <p className="text-sm text-gray-600">{data.objectives.length} objetivos definidos</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Slides</Label>
              <p className="text-sm text-gray-600">{data.content.slides.length} slides criados</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Status de Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isValidating ? (
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              ) : complianceStatus?.isCompliant ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              Status de Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isValidating ? (
              <p className="text-sm text-gray-600">Validando compliance...</p>
            ) : complianceStatus ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={complianceStatus.isCompliant ? 'default' : 'secondary'}>
                    {complianceStatus.isCompliant ? 'Conforme' : 'Requer Atenção'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Score: {complianceStatus.score}%
                  </span>
                </div>
                
                {complianceStatus.recommendations && complianceStatus.recommendations.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Recomendações:</Label>
                    <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                      {complianceStatus.recommendations.slice(0, 3).map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Erro na validação</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Botão de Salvar */}
      <div className="flex justify-center">
        <Button 
          onClick={onSave} 
          size="lg" 
          className="px-8"
          disabled={!data.name || !data.nrBase || data.content.slides.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          Criar Template
        </Button>
      </div>
    </div>
  );
};

export const NRTemplateWizard: React.FC<{ onClose: () => void; onSave: (template: TemplateData) => void }> = ({ onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [templateData, setTemplateData] = useState<TemplateData>(initialTemplateData);
  
  const steps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Informações Básicas',
      description: 'Nome, descrição e configurações gerais',
      component: BasicInfoStep
    },
    {
      id: 'nr-selection',
      title: 'Norma Base',
      description: 'Selecione a NR que servirá como base',
      component: NRSelectionStep
    },
    {
      id: 'content-config',
      title: 'Conteúdo',
      description: 'Configure objetivos e slides',
      component: ContentConfigStep
    },
    {
      id: 'preview',
      title: 'Preview & Finalizar',
      description: 'Revise e finalize seu template',
      component: PreviewStep
    }
  ];
  
  const updateTemplateData = (updates: Partial<TemplateData>) => {
    setTemplateData(prev => ({ ...prev, ...updates }));
  };
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSave = async () => {
    try {
      await onSave(templateData);
      toast.success('Template criado com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao criar template');
      console.error('Erro:', error);
    }
  };
  
  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle>Wizard de Criação de Template NR</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {steps[currentStep].title} - {steps[currentStep].description}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{currentStep + 1} de {steps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          <CurrentStepComponent 
            data={templateData} 
            onChange={updateTemplateData}
            onSave={handleSave}
          />
        </CardContent>
        
        <div className="border-t p-4 flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSave}
                disabled={!templateData.name || !templateData.nrBase || templateData.content.slides.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NRTemplateWizard;