import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Send, MessageSquare, History, Download, Eye } from 'lucide-react'
import { ApprovalRequest, ApprovalStatus, User, ProjectVersion } from '../../types'
import { collaborationService } from '../../services/collaborationService'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { toast } from 'sonner'

interface ApprovalWorkflowProps {
  projectId: string
  currentUser: User
  onApprovalStatusChange?: (status: ApprovalStatus) => void
}

interface ApprovalRequestCardProps {
  request: ApprovalRequest
  currentUser: User
  onApprove: (requestId: string, feedback?: string) => void
  onReject: (requestId: string, feedback: string) => void
  onViewVersion: (versionId: string) => void
}

const ApprovalRequestCard: React.FC<ApprovalRequestCardProps> = ({
  request,
  currentUser,
  onApprove,
  onReject,
  onViewVersion
}) => {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')

  const handleAction = () => {
    if (actionType === 'approve') {
      onApprove(request.id, feedback || undefined)
    } else {
      if (!feedback.trim()) {
        toast.error('Feedback é obrigatório para rejeição')
        return
      }
      onReject(request.id, feedback)
    }
    setShowFeedbackDialog(false)
    setFeedback('')
  }

  const getStatusBadge = (status: ApprovalStatus) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pendente', color: 'text-yellow-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, text: 'Aprovado', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejeitado', color: 'text-red-600' }
    }
    
    const config = variants[status]
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canApprove = currentUser.role === 'admin' || currentUser.role === 'manager'
  const isPending = request.status === 'pending'

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.requestedBy}`} />
              <AvatarFallback>{request.requestedBy.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <p className="text-sm text-gray-500">Solicitado por {request.requestedBy}</p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-gray-700">{request.description}</p>
            <p className="text-xs text-gray-500 mt-2">Solicitado em {formatDate(request.createdAt)}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewVersion(request.versionId)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Versão
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/projects/${request.projectId}/versions/${request.versionId}/download`, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {isPending && canApprove && (
            <div className="flex space-x-2 pt-2 border-t">
              <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActionType('approve')
                      setShowFeedbackDialog(true)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </DialogTrigger>
                
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setActionType('reject')
                      setShowFeedbackDialog(true)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {actionType === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Feedback {actionType === 'reject' ? '(obrigatório)' : '(opcional)'}
                      </label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={`Adicione um feedback ${actionType === 'approve' ? 'opcional' : 'explicando o motivo da rejeição'}...`}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowFeedbackDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAction}
                        variant={actionType === 'approve' ? 'default' : 'destructive'}
                      >
                        {actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {request.feedback && (
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Feedback</span>
                {request.reviewedAt && (
                  <span className="text-xs text-gray-500">
                    em {formatDate(request.reviewedAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{request.feedback}</p>
              {request.reviewedBy && (
                <p className="text-xs text-gray-500 mt-1">Por {request.reviewedBy}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface VersionHistoryProps {
  projectId: string
  versions: ProjectVersion[]
  onViewVersion: (versionId: string) => void
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ projectId, versions, onViewVersion }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: ApprovalStatus) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pendente', color: 'text-yellow-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, text: 'Aprovado', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejeitado', color: 'text-red-600' }
    }
    
    const config = variants[status]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {versions.map((version) => (
        <Card key={version.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{version.name}</h4>
                <p className="text-sm text-gray-500">v{version.version} • {formatDate(version.createdAt)}</p>
              </div>
              {version.approvalStatus && getStatusBadge(version.approvalStatus)}
            </div>
            
            {version.description && (
              <p className="text-sm text-gray-700 mb-3">{version.description}</p>
            )}
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewVersion(version.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/projects/${projectId}/versions/${version.id}/download`, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            {version.approvalFeedback && (
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <div className="flex items-center space-x-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Feedback da Aprovação</span>
                </div>
                <p className="text-sm text-gray-700">{version.approvalFeedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  projectId,
  currentUser,
  onApprovalStatusChange
}) => {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([])
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitDescription, setSubmitDescription] = useState('')

  useEffect(() => {
    loadApprovalData()
  }, [projectId])

  const loadApprovalData = async () => {
    try {
      setIsLoading(true)
      
      const [requestsResponse, versionsResponse] = await Promise.all([
        collaborationService.getApprovalRequests(projectId),
        collaborationService.getProjectVersions(projectId)
      ])
      
      if (requestsResponse.success) {
        setApprovalRequests(requestsResponse.data)
      }
      
      if (versionsResponse.success) {
        setVersions(versionsResponse.data)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados de aprovação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!submitTitle.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    try {
      const response = await collaborationService.submitForApproval(projectId, {
        title: submitTitle,
        description: submitDescription
      })

      if (response.success) {
        setApprovalRequests(prev => [response.data, ...prev])
        setShowSubmitDialog(false)
        setSubmitTitle('')
        setSubmitDescription('')
        toast.success('Projeto enviado para aprovação')
        onApprovalStatusChange?.('pending')
      }
    } catch (error) {
      toast.error('Erro ao enviar para aprovação')
    }
  }

  const handleApprove = async (requestId: string, feedback?: string) => {
    try {
      const response = await collaborationService.approveRequest(requestId, { feedback })
      
      if (response.success) {
        setApprovalRequests(prev => prev.map(req => 
          req.id === requestId ? response.data : req
        ))
        toast.success('Solicitação aprovada')
        onApprovalStatusChange?.('approved')
      }
    } catch (error) {
      toast.error('Erro ao aprovar solicitação')
    }
  }

  const handleReject = async (requestId: string, feedback: string) => {
    try {
      const response = await collaborationService.rejectRequest(requestId, { feedback })
      
      if (response.success) {
        setApprovalRequests(prev => prev.map(req => 
          req.id === requestId ? response.data : req
        ))
        toast.success('Solicitação rejeitada')
        onApprovalStatusChange?.('rejected')
      }
    } catch (error) {
      toast.error('Erro ao rejeitar solicitação')
    }
  }

  const handleViewVersion = (versionId: string) => {
    // Implementar visualização de versão
    window.open(`/projects/${projectId}/versions/${versionId}`, '_blank')
  }

  const canSubmit = currentUser.role !== 'viewer'
  const pendingRequests = approvalRequests.filter(req => req.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fluxo de Aprovação</h2>
        
        {canSubmit && (
          <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Enviar para Aprovação
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Projeto para Aprovação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título *</label>
                  <input
                    type="text"
                    value={submitTitle}
                    onChange={(e) => setSubmitTitle(e.target.value)}
                    placeholder="Título da solicitação de aprovação"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={submitDescription}
                    onChange={(e) => setSubmitDescription(e.target.value)}
                    placeholder="Descreva as alterações e o que precisa ser aprovado..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitForApproval}>
                    Enviar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {pendingRequests.length} solicitação{pendingRequests.length !== 1 ? 'ões' : ''} pendente{pendingRequests.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Solicitações de Aprovação</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Histórico de Versões
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando solicitações...</p>
            </div>
          ) : approvalRequests.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Nenhuma solicitação de aprovação encontrada</p>
            </div>
          ) : (
            approvalRequests.map((request) => (
              <ApprovalRequestCard
                key={request.id}
                request={request}
                currentUser={currentUser}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewVersion={handleViewVersion}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="history">
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Nenhuma versão encontrada</p>
            </div>
          ) : (
            <VersionHistory
              projectId={projectId}
              versions={versions}
              onViewVersion={handleViewVersion}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ApprovalWorkflow