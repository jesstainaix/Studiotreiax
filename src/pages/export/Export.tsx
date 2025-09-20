import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Settings, Video, FileText, Image, Music, Check, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExportSettings {
  format: 'mp4' | 'avi' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '1440p' | '4k';
  fps: 24 | 30 | 60;
  audioQuality: 'low' | 'medium' | 'high';
  includeSubtitles: boolean;
  includeWatermark: boolean;
  customWatermark?: string;
}

interface ExportJob {
  id: string;
  projectId: string;
  projectTitle: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  settings: ExportSettings;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  fileSize?: number;
  estimatedTime?: number;
}

const Export: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'mp4',
    quality: 'high',
    resolution: '1080p',
    fps: 30,
    audioQuality: 'high',
    includeSubtitles: false,
    includeWatermark: true
  });
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Mock projects data
  const projects = [
    {
      id: '1',
      title: 'Treinamento NR-10 - Segurança Elétrica',
      duration: 1800,
      thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20safety%20training%20video%20thumbnail%20professional%20industrial&image_size=landscape_16_9',
      status: 'completed'
    },
    {
      id: '2',
      title: 'NR-35 - Trabalho em Altura',
      duration: 2100,
      thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=height%20safety%20training%20video%20thumbnail%20construction%20worker&image_size=landscape_16_9',
      status: 'completed'
    },
    {
      id: '3',
      title: 'Apresentação Corporativa Q1 2024',
      duration: 900,
      thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=corporate%20presentation%20video%20thumbnail%20business%20professional&image_size=landscape_16_9',
      status: 'completed'
    }
  ];

  const formatOptions = [
    { value: 'mp4', label: 'MP4', description: 'Formato universal, compatível com todos os dispositivos' },
    { value: 'avi', label: 'AVI', description: 'Alta qualidade, ideal para edição posterior' },
    { value: 'mov', label: 'MOV', description: 'Formato Apple, ideal para dispositivos Mac/iOS' },
    { value: 'webm', label: 'WebM', description: 'Otimizado para web, menor tamanho de arquivo' }
  ];

  const qualityOptions = [
    { value: 'low', label: 'Baixa', description: 'Arquivo menor, qualidade reduzida' },
    { value: 'medium', label: 'Média', description: 'Equilíbrio entre qualidade e tamanho' },
    { value: 'high', label: 'Alta', description: 'Boa qualidade, tamanho moderado' },
    { value: 'ultra', label: 'Ultra', description: 'Máxima qualidade, arquivo maior' }
  ];

  const resolutionOptions = [
    { value: '720p', label: '720p HD', description: '1280x720 pixels' },
    { value: '1080p', label: '1080p Full HD', description: '1920x1080 pixels' },
    { value: '1440p', label: '1440p 2K', description: '2560x1440 pixels' },
    { value: '4k', label: '4K Ultra HD', description: '3840x2160 pixels' }
  ];

  const getEstimatedFileSize = () => {
    const selectedProjectData = projects.find(p => p.id === selectedProject);
    if (!selectedProjectData) return '--';

    const duration = selectedProjectData.duration;
    const multipliers = {
      low: 0.5,
      medium: 1,
      high: 2,
      ultra: 4
    };

    const resolutionMultipliers = {
      '720p': 0.5,
      '1080p': 1,
      '1440p': 2,
      '4k': 4
    };

    const baseSizeMB = (duration / 60) * 50; // 50MB per minute base
    const estimatedSize = baseSizeMB * multipliers[exportSettings.quality] * resolutionMultipliers[exportSettings.resolution];
    
    if (estimatedSize > 1024) {
      return `${(estimatedSize / 1024).toFixed(1)} GB`;
    }
    return `${estimatedSize.toFixed(0)} MB`;
  };

  const getEstimatedTime = () => {
    const selectedProjectData = projects.find(p => p.id === selectedProject);
    if (!selectedProjectData) return '--';

    const duration = selectedProjectData.duration;
    const baseTime = duration / 10; // 10x faster than real time
    const qualityMultipliers = {
      low: 0.5,
      medium: 1,
      high: 1.5,
      ultra: 3
    };

    const estimatedSeconds = baseTime * qualityMultipliers[exportSettings.quality];
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = Math.floor(estimatedSeconds % 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartExport = () => {
    if (!selectedProject) return;

    const selectedProjectData = projects.find(p => p.id === selectedProject);
    if (!selectedProjectData) return;

    const newJob: ExportJob = {
      id: `export-${Date.now()}`,
      projectId: selectedProject,
      projectTitle: selectedProjectData.title,
      status: 'pending',
      progress: 0,
      settings: { ...exportSettings },
      createdAt: new Date()
    };

    setExportJobs(prev => [newJob, ...prev]);
    setIsExporting(true);
    setCurrentStep(4);

    // Simulate export progress
    simulateExportProgress(newJob.id);
  };

  const simulateExportProgress = (jobId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: progress >= 100 ? 'completed' : 'processing',
              progress: Math.min(progress, 100),
              completedAt: progress >= 100 ? new Date() : undefined,
              downloadUrl: progress >= 100 ? `/downloads/${jobId}.${exportSettings.format}` : undefined,
              fileSize: progress >= 100 ? Math.floor(Math.random() * 500 + 100) * 1024 * 1024 : undefined
            }
          : job
      ));

      if (progress >= 100) {
        clearInterval(interval);
        setIsExporting(false);
      }
    }, 500);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecionar Projeto</h2>
              <p className="text-gray-600">Escolha o projeto que deseja exportar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.filter(p => p.status === 'completed').map((project) => (
                <div
                  key={project.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProject === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                  <h3 className="font-medium text-gray-900 mb-1">{project.title}</h3>
                  <p className="text-sm text-gray-600">Duração: {formatDuration(project.duration)}</p>
                  {selectedProject === project.id && (
                    <div className="mt-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        <Check className="w-3 h-3 mr-1" />
                        Selecionado
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configurações de Exportação</h2>
              <p className="text-gray-600">Configure o formato e qualidade do vídeo</p>
            </div>

            <Tabs defaultValue="format" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="format">Formato</TabsTrigger>
                <TabsTrigger value="quality">Qualidade</TabsTrigger>
                <TabsTrigger value="resolution">Resolução</TabsTrigger>
                <TabsTrigger value="audio">Áudio</TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formatOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        exportSettings.format === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setExportSettings(prev => ({ ...prev, format: option.value as any }))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{option.label}</h3>
                        {exportSettings.format === option.value && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qualityOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        exportSettings.quality === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setExportSettings(prev => ({ ...prev, quality: option.value as any }))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{option.label}</h3>
                        {exportSettings.quality === option.value && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resolution" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resolutionOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        exportSettings.resolution === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setExportSettings(prev => ({ ...prev, resolution: option.value as any }))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{option.label}</h3>
                        {exportSettings.resolution === option.value && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taxa de Quadros (FPS)</label>
                    <select
                      value={exportSettings.fps}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={24}>24 FPS (Cinema)</option>
                      <option value={30}>30 FPS (Padrão)</option>
                      <option value={60}>60 FPS (Suave)</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualidade do Áudio</label>
                  <select
                    value={exportSettings.audioQuality}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, audioQuality: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baixa (128 kbps)</option>
                    <option value="medium">Média (192 kbps)</option>
                    <option value="high">Alta (320 kbps)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeSubtitles}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, includeSubtitles: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Incluir legendas</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeWatermark}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, includeWatermark: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Incluir marca d'água</span>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmar Exportação</h2>
              <p className="text-gray-600">Revise as configurações antes de iniciar a exportação</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Projeto Selecionado</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Título:</span> {projects.find(p => p.id === selectedProject)?.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Duração:</span> {formatDuration(projects.find(p => p.id === selectedProject)?.duration || 0)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Configurações</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Formato:</span> {exportSettings.format.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Qualidade:</span> {qualityOptions.find(q => q.value === exportSettings.quality)?.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Resolução:</span> {exportSettings.resolution}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">FPS:</span> {exportSettings.fps}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getEstimatedFileSize()}</div>
                    <div className="text-sm text-gray-600">Tamanho Estimado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{getEstimatedTime()}</div>
                    <div className="text-sm text-gray-600">Tempo Estimado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{exportSettings.format.toUpperCase()}</div>
                    <div className="text-sm text-gray-600">Formato</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Exportação em Andamento</h2>
              <p className="text-gray-600">Acompanhe o progresso da exportação</p>
            </div>

            <div className="space-y-4">
              {exportJobs.map((job) => (
                <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{job.projectTitle}</h3>
                      <p className="text-sm text-gray-600">
                        {job.settings.format.toUpperCase()} • {job.settings.resolution} • {job.settings.quality}
                      </p>
                    </div>
                    <Badge
                      variant={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'destructive' : 'warning'}
                    >
                      {job.status === 'pending' && 'Pendente'}
                      {job.status === 'processing' && 'Processando'}
                      {job.status === 'completed' && 'Concluído'}
                      {job.status === 'failed' && 'Falhou'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-medium">{Math.round(job.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {job.status === 'completed' && job.downloadUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <p>Arquivo: {formatFileSize(job.fileSize || 0)}</p>
                          <p>Concluído em: {job.completedAt?.toLocaleTimeString()}</p>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {job.status === 'processing' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Tempo restante estimado: {getEstimatedTime()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exportar Vídeo</h1>
          <p className="text-gray-600">Configure e exporte seus vídeos em diferentes formatos</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 py-6">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-center space-x-16 text-sm text-gray-600 mb-8">
        <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Projeto</span>
        <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Configurações</span>
        <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Confirmar</span>
        <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : ''}>Exportar</span>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1 || isExporting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {currentStep < 3 && (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 1 && !selectedProject}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button
              onClick={handleStartExport}
              disabled={!selectedProject || isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Iniciar Exportação
            </Button>
          )}

          {currentStep === 4 && !isExporting && (
            <Button
              onClick={() => {
                setCurrentStep(1);
                setSelectedProject('');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Nova Exportação
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Export;