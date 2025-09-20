import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  Download,
  X,
  Clock,
  Zap,
  Brain,
  Video
} from 'lucide-react';
import { toast } from 'sonner';

interface UploadJob {
  id: string;
  originalName: string;
  status: 'processing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  result?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    fileSize: number;
    format: string;
  };
  error?: string;
  createdAt: string;
  estimatedDuration: number;
}

const STAGE_DESCRIPTIONS = {
  uploaded: 'Arquivo enviado',
  validation: 'Validando arquivo',
  extraction: 'Extraindo conteúdo',
  ai_analysis: 'Análise com IA',
  video_generation: 'Gerando vídeo',
  finalization: 'Finalizando'
};

const FunctionalPPTXUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState<UploadJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<UploadJob[]>([]);

  // Load recent jobs on component mount
  React.useEffect(() => {
    loadRecentJobs();
  }, []);

  // Poll job status if there's an active job
  React.useEffect(() => {
    if (currentJob && currentJob.status === 'processing') {
      const interval = setInterval(() => {
        checkJobStatus(currentJob.id);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [currentJob]);

  const loadRecentJobs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/pptx/jobs');
      const data = await response.json();
      if (data.success) {
        setRecentJobs(data.jobs.slice(0, 5)); // Show only last 5 jobs
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error);
    }
  };

  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/pptx/status/${jobId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentJob(data.job);
        
        if (data.job.status === 'completed') {
          toast.success('Conversão concluída com sucesso!');
          loadRecentJobs();
        } else if (data.job.status === 'failed') {
          toast.error(`Erro na conversão: ${data.job.error}`);
        }
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    const validExtensions = ['.pptx', '.ppt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error('Por favor, selecione um arquivo PowerPoint (.pptx ou .ppt)');
      return false;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Limite máximo: 100MB');
      return false;
    }

    return true;
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:3001/api/pptx/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setCurrentJob(data.job);
        setSelectedFile(null);
        toast.success('Upload realizado com sucesso! Iniciando conversão...');
      } else {
        toast.error(data.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro de conexão com o servidor');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed transition-colors duration-200 hover:border-blue-400">
        <CardContent className="p-8">
          <div
            className={`text-center transition-colors duration-200 ${
              dragActive ? 'text-blue-600' : 'text-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={uploadFile}
                  disabled={isUploading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Iniciar Conversão
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Faça upload do seu PowerPoint
                </h3>
                <p className="text-gray-600 mb-6">
                  Arraste e solte seu arquivo .pptx ou clique para selecionar
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Selecionar Arquivo
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Suporte para arquivos até 100MB • Formatos: .pptx, .ppt
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx,.ppt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Job Progress */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentJob.status === 'processing' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
              {currentJob.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {currentJob.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-600" />}
              <span>Conversão em Andamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{currentJob.originalName}</span>
              <Badge variant={
                currentJob.status === 'completed' ? 'default' :
                currentJob.status === 'failed' ? 'destructive' : 'secondary'
              }>
                {currentJob.status === 'completed' ? 'Concluído' :
                 currentJob.status === 'failed' ? 'Falhou' : 'Processando'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{STAGE_DESCRIPTIONS[currentJob.stage as keyof typeof STAGE_DESCRIPTIONS] || currentJob.stage}</span>
                <span>{currentJob.progress}%</span>
              </div>
              <Progress value={currentJob.progress} className="w-full" />
            </div>

            {currentJob.status === 'processing' && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                Tempo estimado: {Math.ceil(currentJob.estimatedDuration / 60)} minutos
              </div>
            )}

            {currentJob.status === 'completed' && currentJob.result && (
              <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Conversão concluída!</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Duração:</span>
                    <span className="ml-2 font-medium">{formatDuration(currentJob.result.duration)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tamanho:</span>
                    <span className="ml-2 font-medium">{currentJob.result.fileSize} MB</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/video-editor')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}

            {currentJob.status === 'failed' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {currentJob.error || 'Erro desconhecido durante a conversão'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversões Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{job.originalName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {job.status === 'completed' ? 'Concluído' :
                       job.status === 'failed' ? 'Falhou' : 'Processando'}
                    </Badge>
                    {job.status === 'completed' && (
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FunctionalPPTXUpload;