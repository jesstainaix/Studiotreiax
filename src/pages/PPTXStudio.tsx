import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import FunctionalPPTXUpload from '../components/upload/FunctionalPPTXUpload';
import { 
  Presentation, 
  ArrowLeft,
  Sparkles,
  Brain,
  Settings,
  PlayCircle,
  Zap,
  Target,
  Users,
  Shield
} from 'lucide-react';

const PPTXStudio: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="pptx-studio" />
      
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
              PPTX Studio
            </h1>
            <p className="text-gray-600">
              Converta suas apresentações PowerPoint em vídeos profissionais com IA
            </p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-xl text-white">
            <Presentation className="w-8 h-8" />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <FunctionalPPTXUpload />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Features */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recursos Disponíveis
              </h3>
              <div className="space-y-4">
                {[
                  { icon: Brain, title: 'IA Inteligente', desc: 'Conversão automática com IA' },
                  { icon: Sparkles, title: 'Efeitos Visuais', desc: 'Transições e animações' },
                  { icon: PlayCircle, title: 'Preview em Tempo Real', desc: 'Acompanhe o progresso' },
                  { icon: Settings, title: 'Personalização', desc: 'Ajuste cores, fontes e layouts' },
                  { icon: Zap, title: 'Processamento Rápido', desc: 'Conversão em minutos' },
                  { icon: Target, title: 'Alta Qualidade', desc: 'Vídeos profissionais' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <feature.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{feature.title}</p>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Templates Populares
              </h3>
              <div className="space-y-3">
                {[
                  'Treinamento Corporativo',
                  'Segurança no Trabalho',
                  'Apresentação Comercial',
                  'Tutorial Educativo'
                ].map((template, index) => (
                  <button 
                    key={index}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{template}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PPTXStudio;