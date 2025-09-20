import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import { 
  Brain, 
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Type,
  Video,
  Music,
  Wand2,
  Download,
  Upload,
  Settings,
  Play,
  RefreshCw
} from 'lucide-react';

const AIGenerative: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('image');
  const [isGenerating, setIsGenerating] = useState(false);

  const generativeTools = [
    { id: 'image', name: 'Gerador de Imagens', icon: ImageIcon, color: 'blue' },
    { id: 'text', name: 'Gerador de Texto', icon: Type, color: 'green' },
    { id: 'video', name: 'Gerador de Vídeo', icon: Video, color: 'purple' },
    { id: 'audio', name: 'Gerador de Áudio', icon: Music, color: 'yellow' }
  ];

  const imageStyles = [
    'Realista', 'Cartoon', 'Artístico', 'Minimalista', 
    'Vintage', 'Futurista', 'Aquarela', 'Digital Art'
  ];

  const recentGenerations = [
    { id: 1, type: 'image', prompt: 'Paisagem futurista com...', created: '5 min atrás', status: 'completed' },
    { id: 2, type: 'text', prompt: 'Artigo sobre tecnologia...', created: '12 min atrás', status: 'completed' },
    { id: 3, type: 'video', prompt: 'Animação de logo...', created: '1h atrás', status: 'processing' },
    { id: 4, type: 'audio', prompt: 'Música instrumental...', created: '2h atrás', status: 'completed' }
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="ai-generative" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              IA Generativa
            </h1>
            <p className="text-gray-600">
              Crie conteúdo incrível com inteligência artificial
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl text-white">
            <Brain className="w-8 h-8" />
          </div>
        </div>

        {/* Tool Tabs */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex space-x-4 mb-6">
            {generativeTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tool.id
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tool.icon className="w-4 h-4" />
                <span>{tool.name}</span>
              </button>
            ))}
          </div>

          {/* Image Generator */}
          {activeTab === 'image' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descreva a imagem que deseja gerar
                      </label>
                      <textarea
                        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none"
                        placeholder="Ex: Uma paisagem futurista com prédios altos, carros voadores e céu roxo..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                          {imageStyles.map((style) => (
                            <option key={style} value={style}>{style}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resolução</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                          <option>1024x1024</option>
                          <option>1920x1080</option>
                          <option>512x512</option>
                          <option>1080x1920</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                        isGenerating
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Gerando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Gerar Imagem</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center min-h-64">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Sua imagem aparecerá aqui</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Generator */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Conteúdo
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>Artigo de Blog</option>
                      <option>Post para Redes Sociais</option>
                      <option>Descrição de Produto</option>
                      <option>Email Marketing</option>
                      <option>Script para Vídeo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema/Tópico
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="Ex: Benefícios da inteligência artificial"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tom/Estilo
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>Profissional</option>
                      <option>Casual</option>
                      <option>Persuasivo</option>
                      <option>Educativo</option>
                      <option>Criativo</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                      isGenerating
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Type className="w-4 h-4" />
                        <span>Gerar Texto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-gray-100 rounded-lg p-6 min-h-64">
                  <div className="text-center">
                    <Type className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Seu texto será gerado aqui</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Generator */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerador de Vídeo</h3>
                <p className="text-gray-600 mb-6">Em breve: Criação de vídeos com IA</p>
                <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg">
                  Notify Me
                </button>
              </div>
            </div>
          )}

          {/* Audio Generator */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerador de Áudio</h3>
                <p className="text-gray-600 mb-6">Em breve: Criação de áudio e música com IA</p>
                <button className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg">
                  Notify Me
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Generations */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Gerações Recentes
            </h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Upload className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentGenerations.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'image' ? 'bg-blue-100' :
                    item.type === 'text' ? 'bg-green-100' :
                    item.type === 'video' ? 'bg-purple-100' : 'bg-yellow-100'
                  }`}>
                    {item.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-600" />}
                    {item.type === 'text' && <Type className="w-4 h-4 text-green-600" />}
                    {item.type === 'video' && <Video className="w-4 h-4 text-purple-600" />}
                    {item.type === 'audio' && <Music className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status === 'completed' ? 'Concluído' : 'Processando'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-900 mb-2 truncate">{item.prompt}</p>
                <p className="text-xs text-gray-500 mb-3">{item.created}</p>
                
                <div className="flex items-center space-x-2">
                  <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs">
                    <Play className="w-3 h-3 inline mr-1" />
                    Ver
                  </button>
                  {item.status === 'completed' && (
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs">
                      <Download className="w-3 h-3 inline mr-1" />
                      Baixar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerative;