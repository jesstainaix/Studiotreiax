import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import { 
  Users, 
  ArrowLeft,
  Plus,
  Settings,
  Download,
  Upload,
  Mic,
  Camera,
  Palette,
  Sparkles
} from 'lucide-react';

const Avatars: React.FC = () => {
  const navigate = useNavigate();

  const avatarCategories = [
    { id: 'business', name: 'Negócios', count: 12, color: 'blue' },
    { id: 'education', name: 'Educação', count: 8, color: 'green' },
    { id: 'healthcare', name: 'Saúde', count: 6, color: 'red' },
    { id: 'technology', name: 'Tecnologia', count: 10, color: 'purple' }
  ];

  const avatars = [
    { id: 1, name: 'Ana Silva', category: 'business', image: '/api/placeholder/100/100', voice: 'Feminina', language: 'PT-BR' },
    { id: 2, name: 'João Santos', category: 'education', image: '/api/placeholder/100/100', voice: 'Masculina', language: 'PT-BR' },
    { id: 3, name: 'Maria Costa', category: 'healthcare', image: '/api/placeholder/100/100', voice: 'Feminina', language: 'PT-BR' },
    { id: 4, name: 'Pedro Lima', category: 'technology', image: '/api/placeholder/100/100', voice: 'Masculina', language: 'PT-BR' },
    { id: 5, name: 'Sofia Rodrigues', category: 'business', image: '/api/placeholder/100/100', voice: 'Feminina', language: 'PT-BR' },
    { id: 6, name: 'Carlos Oliveira', category: 'education', image: '/api/placeholder/100/100', voice: 'Masculina', language: 'PT-BR' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="avatars" />
      
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
              Avatares IA
            </h1>
            <p className="text-gray-600">
              Escolha e personalize avatares com inteligência artificial para seus vídeos
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Criar Avatar</span>
            </button>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-xl text-white">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {avatarCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.count} avatares</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  category.color === 'blue' ? 'bg-blue-100' :
                  category.color === 'green' ? 'bg-green-100' :
                  category.color === 'red' ? 'bg-red-100' : 'bg-purple-100'
                }`}>
                  <Users className={`w-5 h-5 ${
                    category.color === 'blue' ? 'text-blue-600' :
                    category.color === 'green' ? 'text-green-600' :
                    category.color === 'red' ? 'text-red-600' : 'text-purple-600'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Avatar Gallery */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Galeria de Avatares
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {avatars.map((avatar) => (
                  <div key={avatar.id} className="group relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      <Users className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">{avatar.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Mic className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{avatar.voice}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          avatar.category === 'business' ? 'bg-blue-100 text-blue-800' :
                          avatar.category === 'education' ? 'bg-green-100 text-green-800' :
                          avatar.category === 'healthcare' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {avatarCategories.find(c => c.id === avatar.category)?.name}
                        </span>
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button className="bg-white text-gray-900 px-3 py-1 rounded-lg text-sm hover:bg-gray-100">
                        Preview
                      </button>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700">
                        Usar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Avatar Creator */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Criador de Avatar
              </h3>
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors">
                  Upload de Foto
                </button>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Nome do avatar" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voz</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option>Feminina - Clara</option>
                      <option>Masculina - Roberto</option>
                      <option>Feminina - Maria</option>
                      <option>Masculina - João</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option>Negócios</option>
                      <option>Educação</option>
                      <option>Saúde</option>
                      <option>Tecnologia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Customization Options */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personalização
              </h3>
              <div className="space-y-4">
                {[
                  { icon: Palette, label: 'Cor da Pele', desc: 'Ajustar tom' },
                  { icon: Sparkles, label: 'Expressões', desc: 'Emoções faciais' },
                  { icon: Camera, label: 'Ângulo', desc: 'Posição da câmera' },
                  { icon: Mic, label: 'Modulação', desc: 'Tom de voz' }
                ].map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <option.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Atividade Recente
              </h3>
              <div className="space-y-3">
                {[
                  { action: 'Avatar criado', name: 'Ana Silva', time: '2h atrás' },
                  { action: 'Voz alterada', name: 'João Santos', time: '5h atrás' },
                  { action: 'Avatar usado', name: 'Maria Costa', time: '1d atrás' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.name}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Avatars;