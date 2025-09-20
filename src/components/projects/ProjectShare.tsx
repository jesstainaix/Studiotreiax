import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Link, 
  Mail, 
  Copy, 
  Eye, 
  Edit3, 
  Download, 
  Clock, 
  Users, 
  Shield, 
  X,
  Check,
  Calendar,
  Globe,
  Lock
} from 'lucide-react';
import { Project } from '../../types/project';
import { ProjectShareLink, SharePermission } from '../../types/collaboration';
import { toast } from 'sonner';

interface ProjectShareProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (shareData: ProjectShareData) => void;
}

interface ProjectShareData {
  type: 'link' | 'email' | 'embed';
  permission: SharePermission;
  expiresAt?: Date;
  password?: string;
  allowDownload: boolean;
  allowComments: boolean;
  emails?: string[];
}

interface ShareLinkItem {
  id: string;
  url: string;
  permission: SharePermission;
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessed?: Date;
  isActive: boolean;
}

export function ProjectShare({ project, isOpen, onClose, onShare }: ProjectShareProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [shareType, setShareType] = useState<'link' | 'email' | 'embed'>('link');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [password, setPassword] = useState('');
  const [allowDownload, setAllowDownload] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [emails, setEmails] = useState<string[]>(['']);
  const [existingLinks, setExistingLinks] = useState<ShareLinkItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExistingLinks();
    }
  }, [isOpen, project.id]);

  const loadExistingLinks = async () => {
    try {
      // Simular carregamento de links existentes
      const mockLinks: ShareLinkItem[] = [
        {
          id: '1',
          url: `https://studio.treiax.com/shared/${project.id}/abc123`,
          permission: 'view',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          accessCount: 15,
          lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isActive: true
        },
        {
          id: '2',
          url: `https://studio.treiax.com/shared/${project.id}/def456`,
          permission: 'edit',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          accessCount: 3,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      ];
      setExistingLinks(mockLinks);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
    }
  };

  const handleCreateShare = async () => {
    try {
      setLoading(true);
      
      const shareData: ProjectShareData = {
        type: shareType,
        permission,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        password: password || undefined,
        allowDownload,
        allowComments,
        emails: shareType === 'email' ? emails.filter(email => email.trim()) : undefined
      };

      // Simular criação do compartilhamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onShare?.(shareData);
      toast.success('Compartilhamento criado com sucesso!');
      
      // Recarregar links existentes
      await loadExistingLinks();
      
      // Resetar formulário
      setShareType('link');
      setPermission('view');
      setExpiresAt('');
      setPassword('');
      setAllowDownload(false);
      setAllowComments(true);
      setEmails(['']);
      
    } catch (error) {
      console.error('Erro ao criar compartilhamento:', error);
      toast.error('Erro ao criar compartilhamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      // Simular revogação do link
      setExistingLinks(prev => prev.map(link => 
        link.id === linkId ? { ...link, isActive: false } : link
      ));
      toast.success('Link revogado com sucesso!');
    } catch (error) {
      toast.error('Erro ao revogar link');
    }
  };

  const addEmailField = () => {
    setEmails(prev => [...prev, '']);
  };

  const updateEmail = (index: number, value: string) => {
    setEmails(prev => prev.map((email, i) => i === index ? value : email));
  };

  const removeEmail = (index: number) => {
    setEmails(prev => prev.filter((_, i) => i !== index));
  };

  const getPermissionIcon = (perm: SharePermission) => {
    switch (perm) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'comment': return <Users className="w-4 h-4" />;
      case 'edit': return <Edit3 className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
    }
  };

  const getPermissionLabel = (perm: SharePermission) => {
    switch (perm) {
      case 'view': return 'Visualizar';
      case 'comment': return 'Comentar';
      case 'edit': return 'Editar';
      case 'admin': return 'Administrar';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Share2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Compartilhar Projeto</h2>
              <p className="text-sm text-gray-600">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Criar Compartilhamento
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Gerenciar Links ({existingLinks.filter(l => l.isActive).length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              {/* Tipo de compartilhamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Compartilhamento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShareType('link')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      shareType === 'link'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Link className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Link</div>
                    <div className="text-xs text-gray-500">Compartilhar via URL</div>
                  </button>
                  
                  <button
                    onClick={() => setShareType('email')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      shareType === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Email</div>
                    <div className="text-xs text-gray-500">Enviar por email</div>
                  </button>
                  
                  <button
                    onClick={() => setShareType('embed')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      shareType === 'embed'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Globe className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Embed</div>
                    <div className="text-xs text-gray-500">Incorporar em site</div>
                  </button>
                </div>
              </div>

              {/* Emails (apenas para tipo email) */}
              {shareType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Endereços de Email
                  </label>
                  <div className="space-y-2">
                    {emails.map((email, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          placeholder="email@exemplo.com"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {emails.length > 1 && (
                          <button
                            onClick={() => removeEmail(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addEmailField}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Adicionar email
                    </button>
                  </div>
                </div>
              )}

              {/* Permissões */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nível de Permissão
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['view', 'comment', 'edit', 'admin'] as SharePermission[]).map((perm) => (
                    <button
                      key={perm}
                      onClick={() => setPermission(perm)}
                      className={`p-3 border-2 rounded-lg text-left transition-colors ${
                        permission === perm
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {getPermissionIcon(perm)}
                        <span className="font-medium">{getPermissionLabel(perm)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {perm === 'view' && 'Apenas visualizar o projeto'}
                        {perm === 'comment' && 'Visualizar e comentar'}
                        {perm === 'edit' && 'Visualizar, comentar e editar'}
                        {perm === 'admin' && 'Controle total do projeto'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configurações adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data de expiração */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Expiração (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha de Proteção (opcional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite uma senha"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Opções */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowDownload"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowDownload" className="text-sm text-gray-700">
                    Permitir download do projeto
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowComments"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowComments" className="text-sm text-gray-700">
                    Permitir comentários
                  </label>
                </div>
              </div>

              {/* Botão de criar */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateShare}
                  disabled={loading || (shareType === 'email' && !emails.some(e => e.trim()))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{loading ? 'Criando...' : 'Criar Compartilhamento'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Gerenciar links existentes */
            <div className="space-y-4">
              {existingLinks.length === 0 ? (
                <div className="text-center py-12">
                  <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum link de compartilhamento criado ainda</p>
                </div>
              ) : (
                existingLinks.map((link) => (
                  <div key={link.id} className={`border rounded-lg p-4 ${
                    link.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getPermissionIcon(link.permission)}
                          <span className="font-medium text-gray-900">
                            {getPermissionLabel(link.permission)}
                          </span>
                          {!link.isActive && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Revogado
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded mb-2 break-all">
                          {link.url}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Criado: {formatDate(link.createdAt)}</span>
                          {link.expiresAt && (
                            <span>Expira: {formatDate(link.expiresAt)}</span>
                          )}
                          <span>{link.accessCount} acessos</span>
                          {link.lastAccessed && (
                            <span>Último acesso: {formatDate(link.lastAccessed)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {link.isActive && (
                          <button
                            onClick={() => handleCopyLink(link.url)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            title="Copiar link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        
                        {link.isActive && (
                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Revogar link"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}