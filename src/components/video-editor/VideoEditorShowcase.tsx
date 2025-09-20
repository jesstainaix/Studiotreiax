import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Play,
  Monitor,
  Film,
  Sparkles,
  Download,
  Settings,
  Zap,
  Target,
  Clock,
  CheckCircle,
  Star,
  Rocket,
  Code,
  Palette,
  Video,
  Music,
  Image,
  Type,
  Layers,
  Grid3X3,
  Eye,
  Volume2,
  RotateCw,
  Maximize2,
  Cpu,
  HardDrive,
  Wifi,
  Youtube,
  Instagram,
  Smartphone,
  Twitch
} from 'lucide-react';
import CompleteVideoEditor from '../video-editor/CompleteVideoEditor';

const VideoEditorShowcase: React.FC = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [activeDemo, setActiveDemo] = useState<'preview' | 'timeline' | 'effects' | 'render'>('preview');

  const features = [
    {
      category: 'Preview System',
      icon: <Monitor className="w-8 h-8 text-blue-400" />,
      title: 'Advanced Video Preview',
      description: 'Sistema de preview profissional com controles avançados',
      items: [
        'Zoom e Pan com precisão',
        'Timeline Scrubbing frame-accurate',
        'Marcadores e annotations',
        'Overlays (grid, rulers, safe zones)',
        'Análise de áudio (waveform)',
        'Fullscreen mode',
        'Keyboard shortcuts',
        'Qualidade de preview ajustável'
      ]
    },
    {
      category: 'Timeline',
      icon: <Film className="w-8 h-8 text-green-400" />,
      title: 'Professional Timeline',
      description: 'Timeline multi-track com funcionalidades profissionais',
      items: [
        'Multi-track editing',
        'Drag & Drop de items',
        'Snap functionality',
        'Zoom e scroll suaves',
        'Context menus',
        'Track controls (mute/solo/lock)',
        'Waveform display',
        'Keyboard shortcuts (split, copy, paste)',
        'Seleção múltipla',
        'Trim handles'
      ]
    },
    {
      category: 'Effects',
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: 'Advanced Effects System',
      description: 'Sistema completo de efeitos visuais e de áudio',
      items: [
        'Biblioteca extensa de efeitos',
        'Color Correction profissional',
        'Audio effects e filters',
        'Real-time preview',
        'Keyframe animation',
        'Effect stacking/layering',
        'Preset management',
        'Custom effect creation',
        'GPU acceleration',
        'Parameter controls'
      ]
    },
    {
      category: 'Rendering',
      icon: <Download className="w-8 h-8 text-red-400" />,
      title: 'Professional Render System',
      description: 'Sistema de renderização e exportação profissional',
      items: [
        'Render queue management',
        'Presets para plataformas',
        'Multiple format support',
        'Quality presets (4K, 1080p, etc)',
        'Batch rendering',
        'Background processing',
        'Progress tracking',
        'Render farm integration',
        'Export templates',
        'Cloud upload integration'
      ]
    }
  ];

  const platformPresets = [
    { name: 'YouTube 4K', icon: <Youtube className="w-5 h-5 text-red-500" />, specs: '3840x2160, 30fps, H.264' },
    { name: 'Instagram Story', icon: <Instagram className="w-5 h-5 text-pink-500" />, specs: '1080x1920, 30fps, H.264' },
    { name: 'TikTok', icon: <Music className="w-5 h-5 text-purple-500" />, specs: '1080x1920, 30fps, H.264' },
    { name: 'Twitch Stream', icon: <Twitch className="w-5 h-5 text-purple-600" />, specs: '1920x1080, 60fps, H.264' },
    { name: 'Mobile Web', icon: <Smartphone className="w-5 h-5 text-blue-500" />, specs: '720p, 30fps, H.264' },
    { name: 'ProRes 4K', icon: <Film className="w-5 h-5 text-gray-400" />, specs: '3840x2160, 24fps, ProRes' }
  ];

  const techSpecs = [
    { label: 'Real-time Preview', icon: <Eye className="w-4 h-4" />, value: '4K 60fps' },
    { label: 'GPU Acceleration', icon: <Zap className="w-4 h-4" />, value: 'CUDA/OpenCL' },
    { label: 'Audio Processing', icon: <Volume2 className="w-4 h-4" />, value: '48kHz 24-bit' },
    { label: 'Timeline Precision', icon: <Target className="w-4 h-4" />, value: 'Frame-accurate' },
    { label: 'Effect Stacking', icon: <Layers className="w-4 h-4" />, value: 'Unlimited' },
    { label: 'Render Speed', icon: <Rocket className="w-4 h-4" />, value: '2-5x realtime' }
  ];

  if (showEditor) {
    return (
      <div className="h-screen">
        <CompleteVideoEditor
          onSave={() => console.log('Save project')}
          onExport={() => console.log('Export project')}
          onImport={() => console.log('Import media')}
        />
        
        {/* Back button */}
        <Button
          className="fixed top-4 left-4 z-50"
          onClick={() => setShowEditor(false)}
        >
          ← Voltar ao Showcase
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 text-lg px-4 py-2">
              🎬 Editor de Vídeo Profissional Completo
            </Badge>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Complete Video Editor
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Sistema completo de edição de vídeo com preview avançado, timeline profissional, 
              sistema de efeitos robusto e renderização multiplataforma. Desenvolvido com React e TypeScript.
            </p>
            
            <div className="flex items-center justify-center space-x-4 mb-12">
              <Button
                size="lg"
                onClick={() => setShowEditor(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Abrir Editor Completo
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                <Code className="w-6 h-6 mr-2" />
                Ver Código
              </Button>
            </div>

            {/* Tech Stack */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>React 18</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>TypeScript</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Canvas API</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Web Audio</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>WebGL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Especificações Técnicas</h2>
          <p className="text-gray-400">Performance e capacidades do sistema</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {techSpecs.map((spec, index) => (
            <Card key={index} className="p-6 bg-gray-800/50 border-gray-700 text-center">
              <div className="flex justify-center mb-3">
                {spec.icon}
              </div>
              <h3 className="font-medium text-sm mb-2">{spec.label}</h3>
              <p className="text-blue-400 font-bold">{spec.value}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Sistemas Implementados</h2>
          <p className="text-gray-400 text-lg">Cada componente foi desenvolvido com foco em performance e usabilidade profissional</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
              <div className="flex items-center mb-6">
                {feature.icon}
                <div className="ml-4">
                  <Badge variant="outline" className="mb-2">
                    {feature.category}
                  </Badge>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {feature.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Presets */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Presets de Plataforma</h2>
          <p className="text-gray-400">Configurações otimizadas para cada plataforma</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {platformPresets.map((preset, index) => (
            <Card key={index} className="p-4 bg-gray-800/50 border-gray-700 text-center hover:bg-gray-800/70 transition-colors">
              <div className="flex justify-center mb-3">
                {preset.icon}
              </div>
              <h3 className="font-medium text-sm mb-2">{preset.name}</h3>
              <p className="text-xs text-gray-400">{preset.specs}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* System Architecture */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Arquitetura do Sistema</h2>
          <p className="text-gray-400">Componentes modulares e escaláveis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-700">
            <Monitor className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="font-bold mb-2">Preview Engine</h3>
            <p className="text-sm text-gray-300">Canvas-based rendering com controles avançados</p>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-700">
            <Film className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="font-bold mb-2">Timeline Core</h3>
            <p className="text-sm text-gray-300">Multi-track editing com precisão frame-perfect</p>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-700">
            <Sparkles className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="font-bold mb-2">Effects Pipeline</h3>
            <p className="text-sm text-gray-300">Sistema de efeitos com GPU acceleration</p>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-700">
            <Download className="w-8 h-8 text-red-400 mb-4" />
            <h3 className="font-bold mb-2">Render Farm</h3>
            <p className="text-sm text-gray-300">Exportação profissional multiplataforma</p>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-12 border border-blue-700/50">
          <Star className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Pronto para Experimentar?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Explore todas as funcionalidades do editor de vídeo mais avançado desenvolvido em React.
            Sistema completo com preview profissional, timeline multi-track, efeitos em tempo real e renderização multiplataforma.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              size="lg"
              onClick={() => setShowEditor(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg"
            >
              <Rocket className="w-6 h-6 mr-2" />
              Lançar Editor Completo
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              <Settings className="w-6 h-6 mr-2" />
              Ver Documentação
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2024 Complete Video Editor - Desenvolvido com React, TypeScript e Canvas API</p>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorShowcase;