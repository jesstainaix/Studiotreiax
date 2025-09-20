import React, { useState, useEffect } from 'react'
import { Users, MessageCircle, Eye, EyeOff, Settings, Crown, UserPlus, UserMinus, Clock, Activity } from 'lucide-react'
import { useCollaboration } from '@/hooks/useCollaboration'
import type { CollaborationParticipant, CollaborationPermissions } from '@/types/collaboration'
import { toast } from 'sonner'

interface CollaborationPanelProps {
  projectId: string
  isVisible: boolean
  onToggle: () => void
  className?: string
}

export function CollaborationPanel({
  projectId,
  isVisible,
  onToggle,
  className = ''
}: CollaborationPanelProps) {
  const {
    session,
    participants,
    isConnected,
    joinSession,
    leaveSession,
    inviteParticipant,
    removeParticipant,
    updatePermissions,
    sendMessage,
    messages,
    loading,
    error
  } = useCollaboration({ projectId })

  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'activity'>('participants')
  const [inviteEmail, setInviteEmail] = useState('')
  const [messageText, setMessageText] = useState('')
  const [showPermissions, setShowPermissions] = useState<string | null>(null)

  // Auto-conectar quando o painel é aberto
  useEffect(() => {
    if (isVisible && !session && !loading) {
      handleJoinSession()
    }
  }, [isVisible, session, loading])

  const handleJoinSession = async () => {
    try {
      await joinSession()
      toast.success('Conectado à sessão de colaboração')
    } catch (err) {
      toast.error('Erro ao conectar à sessão')
    }
  }

  const handleLeaveSession = async () => {
    try {
      await leaveSession()
      toast.success('Desconectado da sessão')
    } catch (err) {
      toast.error('Erro ao desconectar')
    }
  }

  const handleInviteParticipant = async () => {
    if (!inviteEmail.trim()) return
    
    try {
      await inviteParticipant(inviteEmail, {
        canEdit: true,
        canComment: true,
        canView: true,
        canShare: false,
        canManagePermissions: false
      })
      setInviteEmail('')
      toast.success(`Convite enviado para ${inviteEmail}`)
    } catch (err) {
      toast.error('Erro ao enviar convite')
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipant(participantId)
      toast.success('Participante removido')
    } catch (err) {
      toast.error('Erro ao remover participante')
    }
  }

  const handleUpdatePermissions = async (participantId: string, permissions: CollaborationPermissions) => {
    try {
      await updatePermissions(participantId, permissions)
      setShowPermissions(null)
      toast.success('Permissões atualizadas')
    } catch (err) {
      toast.error('Erro ao atualizar permissões')
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) return
    
    try {
      await sendMessage(messageText, 'text')
      setMessageText('')
    } catch (err) {
      toast.error('Erro ao enviar mensagem')
    }
  }

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'idle': return 'text-yellow-500'
      case 'away': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  const getPermissionLevel = (permissions: CollaborationPermissions) => {
    if (permissions.canManagePermissions) return 'Admin'
    if (permissions.canEdit) return 'Editor'
    if (permissions.canComment) return 'Comentarista'
    return 'Visualizador'
  }

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Abrir painel de colaboração"
      >
        <Users className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-40 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Colaboração</h2>
          {isConnected && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Conectado" />
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Status da Sessão */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {session ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sessão Ativa</span>
              <button
                onClick={handleLeaveSession}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Sair
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {participants.length} participante{participants.length !== 1 ? 's' : ''} online
            </div>
          </div>
        ) : (
          <button
            onClick={handleJoinSession}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded text-sm transition-colors"
          >
            {loading ? 'Conectando...' : 'Iniciar Colaboração'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'participants', label: 'Participantes', icon: Users },
          { id: 'chat', label: 'Chat', icon: MessageCircle },
          { id: 'activity', label: 'Atividade', icon: Activity }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium transition-colors ${
              activeTab === id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'participants' && (
          <div className="h-full flex flex-col">
            {/* Convite */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email do colaborador"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleInviteParticipant()}
                />
                <button
                  onClick={handleInviteParticipant}
                  disabled={!inviteEmail.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista de Participantes */}
            <div className="flex-1 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="p-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {participant.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                          participant.status === 'active' ? 'bg-green-500' :
                          participant.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {participant.user.name}
                          {participant.role === 'owner' && (
                            <Crown className="inline w-3 h-3 ml-1 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getPermissionLevel(participant.permissions)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPermissions(
                          showPermissions === participant.id ? null : participant.id
                        )}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      
                      {participant.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Painel de Permissões */}
                  {showPermissions === participant.id && participant.role !== 'owner' && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="space-y-2">
                        {[
                          { key: 'canView', label: 'Visualizar' },
                          { key: 'canEdit', label: 'Editar' },
                          { key: 'canComment', label: 'Comentar' },
                          { key: 'canShare', label: 'Compartilhar' },
                          { key: 'canManagePermissions', label: 'Gerenciar Permissões' }
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={participant.permissions[key as keyof CollaborationPermissions]}
                              onChange={(e) => {
                                const newPermissions = {
                                  ...participant.permissions,
                                  [key]: e.target.checked
                                }
                                handleUpdatePermissions(participant.id, newPermissions)
                              }}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {message.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-3">
              {/* Atividades recentes */}
              <div className="text-xs text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>João editou o timeline há 2 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Maria adicionou um comentário há 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Pedro entrou na sessão há 10 minutos</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

export default CollaborationPanel