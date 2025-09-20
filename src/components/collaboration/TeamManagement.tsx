import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Mail, Shield, MoreHorizontal, Crown, Edit, Trash2, Check, X } from 'lucide-react'
import { TeamMember, TeamInvitation, User, TeamRole, TeamPermissions } from '../../types'
import { collaborationService } from '../../services/collaborationService'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'

interface TeamManagementProps {
  projectId: string
  currentUser: User
  onTeamChange?: () => void
}

interface TeamMemberCardProps {
  member: TeamMember
  currentUser: User
  isOwner: boolean
  onRoleChange: (memberId: string, role: TeamRole) => void
  onRemoveMember: (memberId: string) => void
  onUpdatePermissions: (memberId: string, permissions: TeamPermissions) => void
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  currentUser,
  isOwner,
  onRoleChange,
  onRemoveMember,
  onUpdatePermissions
}) => {
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [permissions, setPermissions] = useState<TeamPermissions>(member.permissions)

  const getRoleBadge = (role: TeamRole) => {
    const variants = {
      owner: { variant: 'default' as const, icon: Crown, text: 'Proprietário', color: 'bg-yellow-100 text-yellow-800' },
      admin: { variant: 'secondary' as const, icon: Shield, text: 'Administrador', color: 'bg-blue-100 text-blue-800' },
      editor: { variant: 'outline' as const, icon: Edit, text: 'Editor', color: 'bg-green-100 text-green-800' },
      viewer: { variant: 'outline' as const, icon: Users, text: 'Visualizador', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = variants[role]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const canManage = isOwner || (currentUser.role === 'admin' && member.role !== 'owner')
  const canRemove = canManage && member.userId !== currentUser.id
  const canChangeRole = canManage && member.role !== 'owner'

  const handleSavePermissions = () => {
    onUpdatePermissions(member.id, permissions)
    setShowPermissionsDialog(false)
    toast.success('Permissões atualizadas')
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`} />
              <AvatarFallback>{member.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div>
              <h4 className="font-medium">{member.userId}</h4>
              <p className="text-sm text-gray-500">{member.email}</p>
              <p className="text-xs text-gray-400">Membro desde {formatDate(member.joinedAt)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getRoleBadge(member.role)}
            
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end">
                  {canChangeRole && (
                    <>
                      <DropdownMenuItem onClick={() => onRoleChange(member.id, 'admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Tornar Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRoleChange(member.id, 'editor')}>
                        <Edit className="h-4 w-4 mr-2" />
                        Tornar Editor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRoleChange(member.id, 'viewer')}>
                        <Users className="h-4 w-4 mr-2" />
                        Tornar Visualizador
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={() => setShowPermissionsDialog(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Gerenciar Permissões
                  </DropdownMenuItem>
                  
                  {canRemove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onRemoveMember(member.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover do Time
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {member.lastActivity && (
          <div className="mt-3 text-xs text-gray-500">
            Última atividade: {formatDate(member.lastActivity)}
          </div>
        )}
        
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerenciar Permissões - {member.userId}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Permissões de Projeto</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canEdit"
                      checked={permissions.canEdit}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canEdit: checked as boolean }))
                      }
                    />
                    <label htmlFor="canEdit" className="text-sm">Pode editar projeto</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canComment"
                      checked={permissions.canComment}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canComment: checked as boolean }))
                      }
                    />
                    <label htmlFor="canComment" className="text-sm">Pode comentar</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canShare"
                      checked={permissions.canShare}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canShare: checked as boolean }))
                      }
                    />
                    <label htmlFor="canShare" className="text-sm">Pode compartilhar</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canExport"
                      checked={permissions.canExport}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canExport: checked as boolean }))
                      }
                    />
                    <label htmlFor="canExport" className="text-sm">Pode exportar</label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Permissões Administrativas</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canManageTeam"
                      checked={permissions.canManageTeam}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canManageTeam: checked as boolean }))
                      }
                      disabled={!isOwner}
                    />
                    <label htmlFor="canManageTeam" className="text-sm">Pode gerenciar time</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canApprove"
                      checked={permissions.canApprove}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canApprove: checked as boolean }))
                      }
                      disabled={!isOwner}
                    />
                    <label htmlFor="canApprove" className="text-sm">Pode aprovar</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canDelete"
                      checked={permissions.canDelete}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canDelete: checked as boolean }))
                      }
                      disabled={!isOwner}
                    />
                    <label htmlFor="canDelete" className="text-sm">Pode excluir</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canViewAnalytics"
                      checked={permissions.canViewAnalytics}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canViewAnalytics: checked as boolean }))
                      }
                    />
                    <label htmlFor="canViewAnalytics" className="text-sm">Pode ver analytics</label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionsDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSavePermissions}>
                  Salvar Permissões
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

interface InvitationCardProps {
  invitation: TeamInvitation
  onResendInvitation: (invitationId: string) => void
  onCancelInvitation: (invitationId: string) => void
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onResendInvitation,
  onCancelInvitation
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { variant: 'default' as const, text: 'Aceito', color: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive' as const, text: 'Rejeitado', color: 'bg-red-100 text-red-800' },
      expired: { variant: 'outline' as const, text: 'Expirado', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.pending
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-gray-600" />
            </div>
            
            <div>
              <h4 className="font-medium">{invitation.email}</h4>
              <p className="text-sm text-gray-500">Função: {invitation.role}</p>
              <p className="text-xs text-gray-400">Enviado em {formatDate(invitation.createdAt)}</p>
              {invitation.expiresAt && (
                <p className="text-xs text-gray-400">Expira em {formatDate(invitation.expiresAt)}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(invitation.status)}
            
            {invitation.status === 'pending' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onResendInvitation(invitation.id)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar Convite
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onCancelInvitation(invitation.id)}
                    className="text-red-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Convite
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  projectId,
  currentUser,
  onTeamChange
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer')
  const [inviteMessage, setInviteMessage] = useState('')

  useEffect(() => {
    loadTeamData()
  }, [projectId])

  const loadTeamData = async () => {
    try {
      setIsLoading(true)
      
      const [membersResponse, invitationsResponse] = await Promise.all([
        collaborationService.getTeamMembers(projectId),
        collaborationService.getTeamInvitations(projectId)
      ])
      
      if (membersResponse.success) {
        setTeamMembers(membersResponse.data)
      }
      
      if (invitationsResponse.success) {
        setInvitations(invitationsResponse.data)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do time')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email é obrigatório')
      return
    }

    try {
      const response = await collaborationService.inviteTeamMember(projectId, {
        email: inviteEmail,
        role: inviteRole,
        message: inviteMessage
      })

      if (response.success) {
        setInvitations(prev => [response.data, ...prev])
        setShowInviteDialog(false)
        setInviteEmail('')
        setInviteRole('viewer')
        setInviteMessage('')
        toast.success('Convite enviado com sucesso')
        onTeamChange?.()
      }
    } catch (error) {
      toast.error('Erro ao enviar convite')
    }
  }

  const handleRoleChange = async (memberId: string, role: TeamRole) => {
    try {
      const response = await collaborationService.updateMemberRole(memberId, { role })
      
      if (response.success) {
        setTeamMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, role } : member
        ))
        toast.success('Função atualizada')
        onTeamChange?.()
      }
    } catch (error) {
      toast.error('Erro ao atualizar função')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Tem certeza que deseja remover este membro do time?')) {
      try {
        const response = await collaborationService.removeMember(memberId)
        
        if (response.success) {
          setTeamMembers(prev => prev.filter(member => member.id !== memberId))
          toast.success('Membro removido do time')
          onTeamChange?.()
        }
      } catch (error) {
        toast.error('Erro ao remover membro')
      }
    }
  }

  const handleUpdatePermissions = async (memberId: string, permissions: TeamPermissions) => {
    try {
      const response = await collaborationService.updateMemberPermissions(memberId, { permissions })
      
      if (response.success) {
        setTeamMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, permissions } : member
        ))
        onTeamChange?.()
      }
    } catch (error) {
      toast.error('Erro ao atualizar permissões')
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await collaborationService.resendInvitation(invitationId)
      
      if (response.success) {
        toast.success('Convite reenviado')
      }
    } catch (error) {
      toast.error('Erro ao reenviar convite')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await collaborationService.cancelInvitation(invitationId)
      
      if (response.success) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        toast.success('Convite cancelado')
      }
    } catch (error) {
      toast.error('Erro ao cancelar convite')
    }
  }

  const isOwner = teamMembers.find(member => member.userId === currentUser.id)?.role === 'owner'
  const canManageTeam = isOwner || currentUser.role === 'admin'
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Users className="h-6 w-6 mr-2" />
            Gerenciamento de Time
          </h2>
          <p className="text-gray-600 mt-1">
            {teamMembers.length} membro{teamMembers.length !== 1 ? 's' : ''}
            {pendingInvitations.length > 0 && (
              <span className="text-yellow-600">
                {' '}• {pendingInvitations.length} convite{pendingInvitations.length !== 1 ? 's' : ''} pendente{pendingInvitations.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        
        {canManageTeam && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Função</label>
                  <Select value={inviteRole} onValueChange={(value: TeamRole) => setInviteRole(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Mensagem (opcional)</label>
                  <Input
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Mensagem personalizada para o convite..."
                    className="mt-1"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleInviteMember}>
                    Enviar Convite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Membros do Time</TabsTrigger>
          <TabsTrigger value="invitations">
            Convites
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando membros...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Nenhum membro encontrado</p>
            </div>
          ) : (
            teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                currentUser={currentUser}
                isOwner={isOwner}
                onRoleChange={handleRoleChange}
                onRemoveMember={handleRemoveMember}
                onUpdatePermissions={handleUpdatePermissions}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Nenhum convite encontrado</p>
            </div>
          ) : (
            invitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onResendInvitation={handleResendInvitation}
                onCancelInvitation={handleCancelInvitation}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TeamManagement