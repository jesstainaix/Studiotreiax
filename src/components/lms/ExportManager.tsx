import React, { useState, useCallback } from 'react';
import { Download, Upload, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { LMSService } from '../../services/lmsService';
import { SCORMExporter } from '../../services/lms/scorm/scormExporter';
import { XAPIService } from '../../services/lms/xapi/xapiService';
import { 
  LMSPlatform, 
  SCORMVersion, 
  ExportFormat, 
  ExportOptions,
  ExportProgress,
  CourseMetadata 
} from '../../types/lms';
import { Project } from '../../types';

interface ExportManagerProps {
  project: Project;
  onExportComplete?: (exportData: any) => void;
}

interface ExportState {
  isExporting: boolean;
  progress: ExportProgress | null;
  exportHistory: ExportRecord[];
}

interface ExportRecord {
  id: string;
  projectId: string;
  format: ExportFormat;
  platform: LMSPlatform;
  createdAt: Date;
  status: 'completed' | 'failed' | 'pending';
  downloadUrl?: string;
  error?: string;
}

const ExportManager: React.FC<ExportManagerProps> = ({ project, onExportComplete }) => {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: null,
    exportHistory: []
  });

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'scorm_2004',
    platform: 'moodle',
    includeAnalytics: true,
    includeSubtitles: true,
    includeTranscripts: false,
    compressionLevel: 'medium',
    customMetadata: {}
  });

  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata>({
    title: project.title || '',
    description: project.description || '',
    author: 'Studio Treiax',
    version: '1.0',
    language: 'pt-BR',
    keywords: [],
    duration: 0,
    difficulty: 'beginner',
    objectives: [],
    prerequisites: []
  });

  const [selectedLMS, setSelectedLMS] = useState<LMSPlatform>('moodle');
  const [publishSettings, setPublishSettings] = useState({
    courseCategory: '',
    enrollmentKey: '',
    visibility: 'visible' as 'visible' | 'hidden',
    startDate: '',
    endDate: '',
    allowGuests: false,
    enableCompletion: true
  });

  const lmsService = new LMSService();
  const scormExporter = new SCORMExporter();
  const xapiService = new XAPIService({
    endpoint: '',
    auth: { username: '', password: '' },
    version: '1.0.3'
  });

  const handleExport = useCallback(async () => {
    if (!project) {
      toast.error('Nenhum projeto selecionado');
      return;
    }

    setExportState(prev => ({ ...prev, isExporting: true, progress: null }));

    try {
      const progressCallback = (progress: ExportProgress) => {
        setExportState(prev => ({ ...prev, progress }));
      };

      let exportResult;

      switch (exportOptions.format) {
        case 'scorm_1_2':
        case 'scorm_2004':
          exportResult = await exportSCORM(progressCallback);
          break;
        case 'xapi':
          exportResult = await exportXAPI(progressCallback);
          break;
        case 'video':
          exportResult = await exportVideo(progressCallback);
          break;
        default:
          throw new Error('Formato de exportação não suportado');
      }

      const exportRecord: ExportRecord = {
        id: generateId(),
        projectId: project.id,
        format: exportOptions.format,
        platform: exportOptions.platform,
        createdAt: new Date(),
        status: 'completed',
        downloadUrl: exportResult.downloadUrl
      };

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        progress: null,
        exportHistory: [exportRecord, ...prev.exportHistory]
      }));

      toast.success('Exportação concluída com sucesso!');
      onExportComplete?.(exportResult);

    } catch (error) {
      console.error('Export failed:', error);
      
      const exportRecord: ExportRecord = {
        id: generateId(),
        projectId: project.id,
        format: exportOptions.format,
        platform: exportOptions.platform,
        createdAt: new Date(),
        status: 'failed',
        error: error.message
      };

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        progress: null,
        exportHistory: [exportRecord, ...prev.exportHistory]
      }));

      toast.error(`Erro na exportação: ${error.message}`);
    }
  }, [project, exportOptions, courseMetadata, onExportComplete]);

  const exportSCORM = async (progressCallback: (progress: ExportProgress) => void) => {
    progressCallback({ stage: 'preparing', progress: 0, message: 'Preparando exportação SCORM...' });

    // Prepare video data
    const videoData = {
      url: project.videoUrl || '',
      duration: project.duration || 0,
      subtitles: exportOptions.includeSubtitles ? project.subtitles : undefined,
      transcripts: exportOptions.includeTranscripts ? project.transcripts : undefined
    };

    progressCallback({ stage: 'processing', progress: 25, message: 'Processando conteúdo...' });

    // Generate SCORM package
    const scormPackage = await scormExporter.exportProject(
      project,
      {
        version: exportOptions.format as SCORMVersion,
        metadata: courseMetadata,
        includeAnalytics: exportOptions.includeAnalytics,
        compressionLevel: exportOptions.compressionLevel
      },
      progressCallback
    );

    progressCallback({ stage: 'finalizing', progress: 90, message: 'Finalizando pacote...' });

    // Create download URL
    const blob = new Blob([scormPackage], { type: 'application/zip' });
    const downloadUrl = URL.createObjectURL(blob);

    progressCallback({ stage: 'completed', progress: 100, message: 'Exportação concluída!' });

    return {
      downloadUrl,
      filename: `${project.title}_scorm.zip`,
      format: exportOptions.format,
      size: blob.size
    };
  };

  const exportXAPI = async (progressCallback: (progress: ExportProgress) => void) => {
    progressCallback({ stage: 'preparing', progress: 0, message: 'Preparando exportação xAPI...' });

    // Generate xAPI statements
    const statements = await xapiService.generateStatementsForProject(project, courseMetadata);

    progressCallback({ stage: 'processing', progress: 50, message: 'Gerando statements xAPI...' });

    // Create xAPI package
    const xapiPackage = {
      statements,
      metadata: courseMetadata,
      project: {
        id: project.id,
        title: project.title,
        description: project.description
      }
    };

    const blob = new Blob([JSON.stringify(xapiPackage, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);

    progressCallback({ stage: 'completed', progress: 100, message: 'Exportação xAPI concluída!' });

    return {
      downloadUrl,
      filename: `${project.title}_xapi.json`,
      format: 'xapi',
      size: blob.size
    };
  };

  const exportVideo = async (progressCallback: (progress: ExportProgress) => void) => {
    progressCallback({ stage: 'preparing', progress: 0, message: 'Preparando exportação de vídeo...' });

    // For video export, we'll create a package with video and metadata
    const videoPackage = {
      video: {
        url: project.videoUrl,
        duration: project.duration,
        format: 'mp4'
      },
      metadata: courseMetadata,
      subtitles: exportOptions.includeSubtitles ? project.subtitles : undefined,
      transcripts: exportOptions.includeTranscripts ? project.transcripts : undefined
    };

    progressCallback({ stage: 'completed', progress: 100, message: 'Exportação de vídeo concluída!' });

    const blob = new Blob([JSON.stringify(videoPackage, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      downloadUrl,
      filename: `${project.title}_video_package.json`,
      format: 'video',
      size: blob.size
    };
  };

  const handlePublishToLMS = async () => {
    if (!selectedLMS) {
      toast.error('Selecione uma plataforma LMS');
      return;
    }

    try {
      setExportState(prev => ({ ...prev, isExporting: true }));

      // First export the content
      const exportResult = await exportSCORM(() => {});

      // Then publish to LMS
      const publishResult = await lmsService.publishCourse(selectedLMS, {
        courseData: {
          title: courseMetadata.title,
          description: courseMetadata.description,
          category: publishSettings.courseCategory,
          visibility: publishSettings.visibility,
          startDate: publishSettings.startDate ? new Date(publishSettings.startDate) : undefined,
          endDate: publishSettings.endDate ? new Date(publishSettings.endDate) : undefined,
          enrollmentKey: publishSettings.enrollmentKey,
          allowGuests: publishSettings.allowGuests,
          enableCompletion: publishSettings.enableCompletion
        },
        contentPackage: exportResult,
        metadata: courseMetadata
      });

      setExportState(prev => ({ ...prev, isExporting: false }));
      toast.success(`Curso publicado com sucesso no ${selectedLMS}!`);

      return publishResult;
    } catch (error) {
      console.error('Publish failed:', error);
      setExportState(prev => ({ ...prev, isExporting: false }));
      toast.error(`Erro ao publicar: ${error.message}`);
    }
  };

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Configuração de Exportação
          </CardTitle>
          <CardDescription>
            Configure as opções de exportação para seu conteúdo de treinamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Formato de Exportação</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: ExportFormat) => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scorm_1_2">SCORM 1.2</SelectItem>
                  <SelectItem value="scorm_2004">SCORM 2004</SelectItem>
                  <SelectItem value="xapi">xAPI (Tin Can)</SelectItem>
                  <SelectItem value="video">Vídeo + Metadados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-platform">Plataforma Alvo</Label>
              <Select
                value={exportOptions.platform}
                onValueChange={(value: LMSPlatform) => 
                  setExportOptions(prev => ({ ...prev, platform: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moodle">Moodle</SelectItem>
                  <SelectItem value="canvas">Canvas</SelectItem>
                  <SelectItem value="blackboard">Blackboard</SelectItem>
                  <SelectItem value="generic">Genérico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Opções de Conteúdo</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-analytics"
                  checked={exportOptions.includeAnalytics}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeAnalytics: checked as boolean }))
                  }
                />
                <Label htmlFor="include-analytics">Incluir Analytics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-subtitles"
                  checked={exportOptions.includeSubtitles}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeSubtitles: checked as boolean }))
                  }
                />
                <Label htmlFor="include-subtitles">Incluir Legendas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-transcripts"
                  checked={exportOptions.includeTranscripts}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeTranscripts: checked as boolean }))
                  }
                />
                <Label htmlFor="include-transcripts">Incluir Transcrições</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Metadados do Curso
          </CardTitle>
          <CardDescription>
            Configure as informações do curso para o LMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">Título do Curso</Label>
              <Input
                id="course-title"
                value={courseMetadata.title}
                onChange={(e) => setCourseMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título do curso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-author">Autor</Label>
              <Input
                id="course-author"
                value={courseMetadata.author}
                onChange={(e) => setCourseMetadata(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Nome do autor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-description">Descrição</Label>
            <Textarea
              id="course-description"
              value={courseMetadata.description}
              onChange={(e) => setCourseMetadata(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição detalhada do curso"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-version">Versão</Label>
              <Input
                id="course-version"
                value={courseMetadata.version}
                onChange={(e) => setCourseMetadata(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-language">Idioma</Label>
              <Select
                value={courseMetadata.language}
                onValueChange={(value) => setCourseMetadata(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-difficulty">Dificuldade</Label>
              <Select
                value={courseMetadata.difficulty}
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                  setCourseMetadata(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {exportState.isExporting && exportState.progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Progresso da Exportação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{exportState.progress.message}</span>
                <span>{exportState.progress.progress}%</span>
              </div>
              <Progress value={exportState.progress.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleExport}
          disabled={exportState.isExporting}
          className="flex items-center gap-2"
        >
          {exportState.isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar Conteúdo
        </Button>

        <Button
          onClick={handlePublishToLMS}
          disabled={exportState.isExporting}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Publicar no LMS
        </Button>
      </div>

      {/* Export History */}
      {exportState.exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Exportações</CardTitle>
            <CardDescription>
              Visualize suas exportações anteriores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportState.exportHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {record.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{record.format.toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.createdAt.toLocaleDateString()} - {record.platform}
                      </p>
                    </div>
                  </div>
                  {record.downloadUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = record.downloadUrl!;
                        a.download = `export_${record.id}`;
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExportManager;