import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Star, 
  Download, 
  Upload,
  Brain,
  Zap,
  Target,
  Shield
} from 'lucide-react';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  system: string;
  user: string;
  variables: string[];
  category: string;
  nrFocus: string;
  createdBy: string;
  createdAt: string;
  usage: number;
  rating: number;
  type?: 'default' | 'custom';
}

interface AIConfig {
  openaiModel: string;
  anthropicModel: string;
  temperature: number;
  maxTokens: number;
  cacheEnabled: boolean;
  fallbackEnabled: boolean;
}

const AIConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNR, setSelectedNR] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    openaiModel: 'gpt-4',
    anthropicModel: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 2000,
    cacheEnabled: true,
    fallbackEnabled: true
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    system: '',
    user: '',
    variables: '',
    category: 'custom',
    nrFocus: 'general'
  });

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'safety_committee', label: 'Comissão de Segurança' },
    { value: 'personal_protection', label: 'Proteção Individual' },
    { value: 'electrical_safety', label: 'Segurança Elétrica' },
    { value: 'machine_safety', label: 'Segurança de Máquinas' },
    { value: 'height_safety', label: 'Trabalho em Altura' },
    { value: 'emergency_procedures', label: 'Procedimentos de Emergência' },
    { value: 'risk_assessment', label: 'Avaliação de Riscos' },
    { value: 'practical_training', label: 'Treinamento Prático' },
    { value: 'compliance', label: 'Conformidade' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const nrOptions = [
    { value: 'all', label: 'Todas as NRs' },
    { value: 'general', label: 'Geral' },
    { value: 'NR-5', label: 'NR-5 (CIPA)' },
    { value: 'NR-6', label: 'NR-6 (EPI)' },
    { value: 'NR-10', label: 'NR-10 (Elétrica)' },
    { value: 'NR-12', label: 'NR-12 (Máquinas)' },
    { value: 'NR-35', label: 'NR-35 (Altura)' }
  ];

  useEffect(() => {
    loadTemplates();
    loadAIConfig();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/ai/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    }
  };

  const loadAIConfig = async () => {
    try {
      const response = await fetch('/api/ai/config');
      const data = await response.json();
      setAiConfig(data.config || aiConfig);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const saveAIConfig = async () => {
    try {
      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig)
      });
      
      if (response.ok) {
        toast.success('Configuração salva com sucesso!');
      } else {
        throw new Error('Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const createTemplate = async () => {
    try {
      const templateData = {
        ...newTemplate,
        variables: newTemplate.variables.split(',').map(v => v.trim()).filter(v => v)
      };

      const response = await fetch('/api/ai/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        toast.success('Template criado com sucesso!');
        setIsCreateDialogOpen(false);
        setNewTemplate({
          name: '',
          description: '',
          system: '',
          user: '',
          variables: '',
          category: 'custom',
          nrFocus: 'general'
        });
        loadTemplates();
      } else {
        throw new Error('Erro ao criar template');
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;

    try {
      const response = await fetch(`/api/ai/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Template deletado com sucesso!');
        loadTemplates();
      } else {
        throw new Error('Erro ao deletar template');
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      toast.error('Erro ao deletar template');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesNR = selectedNR === 'all' || template.nrFocus === selectedNR;
    
    return matchesSearch && matchesCategory && matchesNR;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety_committee': return <Shield className="w-4 h-4" />;
      case 'electrical_safety': return <Zap className="w-4 h-4" />;
      case 'risk_assessment': return <Target className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de IA</h1>
          <p className="text-muted-foreground">
            Configure modelos de IA e gerencie templates de prompts
          </p>
        </div>
        <Settings className="w-8 h-8 text-muted-foreground" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates de Prompts</TabsTrigger>
          <TabsTrigger value="models">Modelos de IA</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedNR} onValueChange={setSelectedNR}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nrOptions.map(nr => (
                  <SelectItem key={nr.value} value={nr.value}>
                    {nr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Template</DialogTitle>
                  <DialogDescription>
                    Crie um template personalizado para geração de conteúdo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                        placeholder="Nome do template"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.value !== 'all').map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nrFocus">Foco NR</Label>
                      <Select value={newTemplate.nrFocus} onValueChange={(value) => setNewTemplate({...newTemplate, nrFocus: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {nrOptions.filter(nr => nr.value !== 'all').map(nr => (
                            <SelectItem key={nr.value} value={nr.value}>
                              {nr.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="variables">Variáveis (separadas por vírgula)</Label>
                      <Input
                        id="variables"
                        value={newTemplate.variables}
                        onChange={(e) => setNewTemplate({...newTemplate, variables: e.target.value})}
                        placeholder="topic, audience, duration"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                      placeholder="Descreva o propósito deste template"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="system">Prompt do Sistema</Label>
                    <Textarea
                      id="system"
                      value={newTemplate.system}
                      onChange={(e) => setNewTemplate({...newTemplate, system: e.target.value})}
                      placeholder="Você é um especialista em..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user">Prompt do Usuário</Label>
                    <Textarea
                      id="user"
                      value={newTemplate.user}
                      onChange={(e) => setNewTemplate({...newTemplate, user: e.target.value})}
                      placeholder="Crie um roteiro sobre {topic} para {audience}..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createTemplate}>
                      Criar Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.type === 'default' ? 'default' : 'secondary'}>
                        {template.type === 'default' ? 'Padrão' : 'Personalizado'}
                      </Badge>
                      {template.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{template.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{template.nrFocus}</Badge>
                      <Badge variant="outline">{template.category}</Badge>
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Sistema:</strong> {template.system.substring(0, 100)}...</p>
                      <p><strong>Usuário:</strong> {template.user.substring(0, 100)}...</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Usado {template.usage} vezes
                      </div>
                      {template.type === 'custom' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração dos Modelos</CardTitle>
              <CardDescription>
                Configure os modelos de IA utilizados para geração de conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openaiModel">Modelo OpenAI</Label>
                  <Select value={aiConfig.openaiModel} onValueChange={(value) => setAiConfig({...aiConfig, openaiModel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="anthropicModel">Modelo Anthropic</Label>
                  <Select value={aiConfig.anthropicModel} onValueChange={(value) => setAiConfig({...aiConfig, anthropicModel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configure parâmetros de geração e comportamento da IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperatura ({aiConfig.temperature})</Label>
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiConfig.temperature}
                    onChange={(e) => setAiConfig({...aiConfig, temperature: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Controla a criatividade das respostas
                  </div>
                </div>
                <div>
                  <Label htmlFor="maxTokens">Máximo de Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={aiConfig.maxTokens}
                    onChange={(e) => setAiConfig({...aiConfig, maxTokens: parseInt(e.target.value)})}
                    min="100"
                    max="4000"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cacheEnabled"
                  checked={aiConfig.cacheEnabled}
                  onChange={(e) => setAiConfig({...aiConfig, cacheEnabled: e.target.checked})}
                />
                <Label htmlFor="cacheEnabled">Habilitar cache de respostas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fallbackEnabled"
                  checked={aiConfig.fallbackEnabled}
                  onChange={(e) => setAiConfig({...aiConfig, fallbackEnabled: e.target.checked})}
                />
                <Label htmlFor="fallbackEnabled">Habilitar fallback entre modelos</Label>
              </div>
              <Button onClick={saveAIConfig} className="w-full">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIConfiguration;