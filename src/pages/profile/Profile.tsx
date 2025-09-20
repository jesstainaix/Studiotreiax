import React, { useState } from 'react';
import { Camera, Edit3, Save, Mail, Phone, MapPin, Calendar, Award, BarChart3, Video, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
  joinDate: string;
  plan: 'free' | 'pro' | 'enterprise';
  stats: {
    totalProjects: number;
    totalVideos: number;
    totalHours: number;
    storageUsed: number;
    storageLimit: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'project_created' | 'video_exported' | 'template_used';
    title: string;
    timestamp: string;
  }>;
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    phone: '+55 11 99999-9999',
    location: 'São Paulo, SP',
    bio: 'Especialista em segurança do trabalho com foco em treinamentos NR. Utilizo o Estúdio IA para criar conteúdos educativos e engajantes.',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20person%20avatar%20headshot%20corporate%20style&image_size=square',
    joinDate: '2024-01-15',
    plan: 'pro',
    stats: {
      totalProjects: 24,
      totalVideos: 156,
      totalHours: 48.5,
      storageUsed: 2.4,
      storageLimit: 10
    },
    achievements: [
      {
        id: '1',
        title: 'Primeiro Projeto',
        description: 'Criou seu primeiro projeto no Estúdio IA',
        icon: '🎯',
        unlockedAt: '2024-01-15'
      },
      {
        id: '2',
        title: 'Criador Prolífico',
        description: 'Criou mais de 20 projetos',
        icon: '🚀',
        unlockedAt: '2024-02-28'
      },
      {
        id: '3',
        title: 'Especialista NR',
        description: 'Utilizou templates de todas as NRs disponíveis',
        icon: '🏆',
        unlockedAt: '2024-03-15'
      },
      {
        id: '4',
        title: 'Exportador Master',
        description: 'Exportou mais de 100 vídeos',
        icon: '📹',
        unlockedAt: '2024-04-01'
      }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'project_created',
        title: 'Criou projeto "Treinamento NR-35 - Trabalho em Altura"',
        timestamp: '2024-04-15T10:30:00Z'
      },
      {
        id: '2',
        type: 'video_exported',
        title: 'Exportou vídeo "Segurança em Espaços Confinados"',
        timestamp: '2024-04-14T16:45:00Z'
      },
      {
        id: '3',
        type: 'template_used',
        title: 'Utilizou template "NR-12 - Máquinas e Equipamentos"',
        timestamp: '2024-04-14T14:20:00Z'
      },
      {
        id: '4',
        type: 'project_created',
        title: 'Criou projeto "CIPA - Comissão Interna"',
        timestamp: '2024-04-13T09:15:00Z'
      },
      {
        id: '5',
        type: 'video_exported',
        title: 'Exportou vídeo "EPI - Equipamentos de Proteção"',
        timestamp: '2024-04-12T11:30:00Z'
      }
    ]
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsEditing(false);
    setIsSaving(false);
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfile(prev => ({
        ...prev,
        avatar: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created': return '📁';
      case 'video_exported': return '🎬';
      case 'template_used': return '📋';
      default: return '📌';
    }
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      free: { label: 'Gratuito', variant: 'secondary' as const },
      pro: { label: 'Pro', variant: 'default' as const },
      enterprise: { label: 'Enterprise', variant: 'success' as const }
    };
    return planConfig[plan as keyof typeof planConfig] || planConfig.free;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    className="text-2xl font-bold border-0 p-0 h-auto focus:ring-0"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                )}
                <Badge {...getPlanBadge(profile.plan)}>
                  {getPlanBadge(profile.plan).label}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {isEditing ? (
                  <Input
                    value={profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    className="border-0 p-0 h-auto focus:ring-0"
                  />
                ) : (
                  <span>{profile.email}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {isEditing ? (
                  <Input
                    value={profile.phone}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    className="border-0 p-0 h-auto focus:ring-0"
                  />
                ) : (
                  <span>{profile.phone}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {isEditing ? (
                  <Input
                    value={profile.location}
                    onChange={(e) => updateProfile('location', e.target.value)}
                    className="border-0 p-0 h-auto focus:ring-0"
                  />
                ) : (
                  <span>{profile.location}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Membro desde {formatDate(profile.joinDate)}</span>
              </div>
            </div>
            
            <div className="mt-4">
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => updateProfile('bio', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Conte um pouco sobre você..."
                />
              ) : (
                <p className="text-gray-700">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Projetos</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.totalProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Video className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vídeos</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.totalVideos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horas</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.totalHours}h</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Download className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Armazenamento</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats.storageUsed}GB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Uso de Armazenamento</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usado: {profile.stats.storageUsed}GB</span>
                <span className="text-gray-600">Limite: {profile.stats.storageLimit}GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(profile.stats.storageUsed / profile.stats.storageLimit) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {((profile.stats.storageLimit - profile.stats.storageUsed) * 100 / profile.stats.storageLimit).toFixed(1)}% disponível
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projetos por Mês</h3>
              <div className="space-y-3">
                {[
                  { month: 'Janeiro', count: 4, percentage: 60 },
                  { month: 'Fevereiro', count: 6, percentage: 80 },
                  { month: 'Março', count: 8, percentage: 100 },
                  { month: 'Abril', count: 6, percentage: 75 }
                ].map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-6">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates Mais Usados</h3>
              <div className="space-y-3">
                {[
                  { name: 'NR-35 - Trabalho em Altura', count: 12, percentage: 100 },
                  { name: 'NR-10 - Eletricidade', count: 8, percentage: 67 },
                  { name: 'NR-12 - Máquinas', count: 6, percentage: 50 },
                  { name: 'NR-06 - EPI', count: 4, percentage: 33 }
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">{item.name}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.achievements.map((achievement) => (
              <div key={achievement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-gray-500">
                        Desbloqueado em {formatDate(achievement.unlockedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">🎯 Próximas Conquistas</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center justify-between">
                <span>Criador Veterano (50 projetos)</span>
                <span className="font-medium">{profile.stats.totalProjects}/50</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${(profile.stats.totalProjects / 50) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {profile.recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;