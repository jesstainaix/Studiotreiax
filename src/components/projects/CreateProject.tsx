import React, { useState } from 'react';
import { Plus, Upload, Settings, Folder, X } from 'lucide-react';
import { ProjectTemplate, ProjectCreateData, ProjectSettings } from '../../types/project';
import { ProjectTemplates } from './ProjectTemplates';
import { projectService } from '../../services/projectService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CreateProjectProps {
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({
  onClose,
  onProjectCreated
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'method' | 'template' | 'details' | 'settings'>('method');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectData, setProjectData] = useState<Partial<ProjectCreateData>>({
    title: '',
    description: '',
    tags: [],
    category: '',
    nrCategory: '',
    difficulty: 'Básico'
  });
  const [settings, setSettings] = useState<Partial<ProjectSettings>>({
    resolution: '1080p',
    fps: 30,
    frameRate: 30,
    videoBitrate: 5000,
    audioSampleRate: 44100,
    audioBitrate: 128,
    audio_quality: 'standard',
    watermark: false,
    auto_captions: false,
    background_music: false,
    voice_over: 'none',
    language: 'pt-BR',
    autoSave: true,
    autoSaveInterval: 5,
    enableCollaboration: true,
    enableVersioning: true
  });
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const frameRateOptions = [24, 25, 30, 50, 60];
  const audioSampleRates = [44100, 48000, 96000];

  const handleCreateFromTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectData({
      title: `${template.name} - Novo Projeto`,
      description: template.description,
      tags: [...template.tags],
      category: template.category,
      nrCategory: template.nrCategory
    });
    setSettings({
      ...settings,
      resolution: template.settings?.resolution || settings.resolution || '1080p',
      fps: template.settings?.fps || settings.fps || 30
    });
    setStep('details');
  };

  const handleCreateBlank = () => {
    setSelectedTemplate(null);
    setStep('details');
  };

  const handleImportProject = () => {
    // Implementar importação de projeto
    toast.info('Funcionalidade de importação em desenvolvimento');
  };

  const addTag = () => {
    if (newTag.trim() && !projectData.tags?.includes(newTag.trim())) {
      setProjectData({
        ...projectData,
        tags: [...(projectData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProjectData({
      ...projectData,
      tags: projectData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleCreateProject = async () => {
    if (!projectData.title?.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      const createData: ProjectCreateData = {
        title: projectData.title,
        description: projectData.description || '',
        tags: projectData.tags || [],
        category: projectData.category || '',
        nrCategory: projectData.nrCategory || '',
        difficulty: projectData.difficulty || 'Básico',
        ...(selectedTemplate?.id && { templateId: selectedTemplate.id }),
        settings: settings as ProjectSettings
      };

      const project = await projectService.createProject(createData);
      
      toast.success('Projeto criado com sucesso!');
      
      if (onProjectCreated) {
        onProjectCreated(project.id);
      }
      
      // Navegar para o editor do projeto
      navigate(`/editor/${project.id}`);
      onClose();
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Como deseja criar seu projeto?</h2>
        <p className="text-gray-600 text-lg">Escolha a melhor opção para começar seu novo projeto de vídeo</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Template */}
        <div
          onClick={() => setStep('template')}
          className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
        >
          <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors shadow-lg">
            <Folder className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Usar Template</h3>
          <p className="text-gray-600 leading-relaxed">Comece com um template pré-configurado para acelerar seu trabalho e manter a consistência visual.</p>
        </div>

        {/* Projeto em Branco */}
        <div
          onClick={handleCreateBlank}
          className="p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100"
        >
          <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors shadow-lg">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Projeto em Branco</h3>
          <p className="text-gray-600 leading-relaxed">Comece do zero com um projeto completamente personalizado e criado especificamente para suas necessidades.</p>
        </div>

        {/* Importar */}
        <div
          onClick={handleImportProject}
          className="p-8 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100"
        >
          <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors shadow-lg">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Importar Projeto</h3>
          <p className="text-gray-600 leading-relaxed">Importe um projeto existente de outro formato ou plataforma e continue sua edição aqui.</p>
        </div>
      </div>
    </div>
  );

  const renderProjectDetails = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Detalhes do Projeto</h2>
        <button
          onClick={() => setStep('method')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          Voltar
        </button>
      </div>

      <div className="space-y-6">
        {/* Nome do Projeto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Projeto *
          </label>
          <input
            type="text"
            value={projectData.title || ''}
            onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
            placeholder="Digite o nome do projeto"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={projectData.description || ''}
            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
            placeholder="Descreva seu projeto (opcional)"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {projectData.tags?.map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Adicionar tag"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Template Info */}
        {selectedTemplate && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Template Selecionado</h4>
            <p className="text-blue-800 text-sm">{selectedTemplate.name}</p>
            <p className="text-blue-700 text-xs mt-1">{selectedTemplate.description}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep('method')}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Voltar
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setStep('settings')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </button>
          <button
            onClick={handleCreateProject}
            disabled={!projectData.title?.trim() || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Configurações do Projeto</h2>
        <button
          onClick={() => setStep('details')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configurações de Vídeo */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Vídeo</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolução
            </label>
            <select
              value={settings.resolution || '1080p'}
              onChange={(e) => {
                const value = e.target.value as '720p' | '1080p' | '4K';
                setSettings({ ...settings, resolution: value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="720p">720p (1280x720)</option>
              <option value="1080p">1080p (1920x1080)</option>
              <option value="4K">4K (3840x2160)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa de Quadros (FPS)
            </label>
            <select
              value={settings.frameRate}
              onChange={(e) => setSettings({ ...settings, frameRate: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {frameRateOptions.map(fps => (
                <option key={fps} value={fps}>{fps} FPS</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitrate de Vídeo (kbps)
            </label>
            <input
              type="number"
              value={settings.videoBitrate}
              onChange={(e) => setSettings({ ...settings, videoBitrate: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Configurações de Áudio */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Áudio</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa de Amostragem
            </label>
            <select
              value={settings.audioSampleRate}
              onChange={(e) => setSettings({ ...settings, audioSampleRate: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {audioSampleRates.map(rate => (
                <option key={rate} value={rate}>{rate} Hz</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitrate de Áudio (kbps)
            </label>
            <input
              type="number"
              value={settings.audioBitrate}
              onChange={(e) => setSettings({ ...settings, audioBitrate: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Configurações Gerais */}
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Geral</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoSave || false}
              onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-salvamento</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableCollaboration || false}
              onChange={(e) => setSettings({ ...settings, enableCollaboration: e.target.checked })}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Habilitar colaboração</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableVersioning || false}
              onChange={(e) => setSettings({ ...settings, enableVersioning: e.target.checked })}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Controle de versão</span>
          </label>
        </div>

        {settings.autoSave && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo de auto-salvamento (segundos)
            </label>
            <input
              type="number"
              value={settings.autoSaveInterval}
              onChange={(e) => setSettings({ ...settings, autoSaveInterval: Number(e.target.value) })}
              min="30"
              max="3600"
              className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep('details')}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleCreateProject}
          disabled={!projectData.title?.trim() || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Criando...' : 'Criar Projeto'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Projeto</h1>
            <p className="text-sm text-gray-600 mt-1">Crie um novo projeto de vídeo personalizado</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {step === 'method' && renderMethodSelection()}
        {step === 'template' && (
          <ProjectTemplates
            onSelectTemplate={handleCreateFromTemplate}
            onClose={() => setStep('method')}
          />
        )}
        {step === 'details' && renderProjectDetails()}
        {step === 'settings' && renderSettings()}
      </div>
    </div>
  );
};