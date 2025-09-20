import { supabase } from '@/lib/supabase'
import type {
  CollaborationSession,
  CollaborationParticipant,
  CollaborationPermissions,
  CollaborationSettings,
  RealTimeEdit,
  CollaborationConflict,
  ProjectAnnotation,
  ApprovalWorkflow,
  RealTimeNotification,
  ProjectShareLink,
  CollaborationMetrics
} from '@/types/collaboration'

class CollaborationService {
  private activeSession: CollaborationSession | null = null
  private realtimeChannel: any = null
  private eventListeners: Map<string, Function[]> = new Map()

  // Gerenciamento de sessões
  async createSession(
    projectId: string,
    settings: Partial<CollaborationSettings> = {}
  ): Promise<CollaborationSession> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const defaultSettings: CollaborationSettings = {
      maxParticipants: 10,
      allowAnonymous: false,
      requireApproval: false,
      autoSave: true,
      autoSaveInterval: 30,
      conflictResolution: 'last-write-wins',
      notifications: {
        onJoin: true,
        onLeave: true,
        onEdit: true,
        onComment: true
      },
      ...settings
    }

    const { data: session, error } = await supabase
      .from('collaboration_sessions')
      .insert({
        project_id: projectId,
        owner_id: user.id,
        status: 'active',
        settings: defaultSettings
      })
      .select()
      .single()

    if (error) throw error

    // Adicionar o criador como participante
    await this.addParticipant(session.id, user.id, 'owner')

    return this.mapSessionFromDB(session)
  }

  async joinSession(
    sessionId: string,
    role: 'editor' | 'viewer' | 'reviewer' = 'viewer'
  ): Promise<CollaborationParticipant> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar se a sessão existe e está ativa
    const session = await this.getSession(sessionId)
    if (!session || session.status !== 'active') {
      throw new Error('Sessão não encontrada ou inativa')
    }

    // Verificar limites de participantes
    if (session.participants.length >= session.settings.maxParticipants) {
      throw new Error('Sessão lotada')
    }

    // Verificar se já é participante
    const existingParticipant = session.participants.find(p => p.userId === user.id)
    if (existingParticipant) {
      return existingParticipant
    }

    return await this.addParticipant(sessionId, user.id, role)
  }

  async leaveSession(sessionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    await supabase
      .from('collaboration_participants')
      .update({
        status: 'offline',
        left_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)

    // Desconectar do canal em tempo real
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe()
      this.realtimeChannel = null
    }

    this.activeSession = null
  }

  async endSession(sessionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('collaboration_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('owner_id', user.id)

    if (error) throw error

    // Notificar todos os participantes
    await this.broadcastEvent(sessionId, {
      type: 'session_ended',
      data: { endedBy: user.id }
    })
  }

  // Gerenciamento de participantes
  private async addParticipant(
    sessionId: string,
    userId: string,
    role: 'owner' | 'editor' | 'viewer' | 'reviewer'
  ): Promise<CollaborationParticipant> {
    const permissions = this.getDefaultPermissions(role)

    const { data: participant, error } = await supabase
      .from('collaboration_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role,
        permissions,
        status: 'online',
        last_activity: new Date().toISOString(),
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    const mappedParticipant = this.mapParticipantFromDB(participant)

    // Notificar outros participantes
    await this.broadcastEvent(sessionId, {
      type: 'participant_joined',
      data: { participant: mappedParticipant }
    })

    return mappedParticipant
  }

  async updateParticipantPermissions(
    sessionId: string,
    userId: string,
    permissions: Partial<CollaborationPermissions>
  ): Promise<void> {
    const { error } = await supabase
      .from('collaboration_participants')
      .update({ permissions })
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (error) throw error

    await this.broadcastEvent(sessionId, {
      type: 'permissions_updated',
      data: { userId, permissions }
    })
  }

  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar se é o owner da sessão
    const session = await this.getSession(sessionId)
    if (session?.ownerId !== user.id) {
      throw new Error('Apenas o proprietário pode remover participantes')
    }

    const { error } = await supabase
      .from('collaboration_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (error) throw error

    await this.broadcastEvent(sessionId, {
      type: 'participant_removed',
      data: { userId, removedBy: user.id }
    })
  }

  // Edição em tempo real
  async applyEdit(sessionId: string, edit: Omit<RealTimeEdit, 'id' | 'timestamp' | 'applied'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Verificar permissões
    const participant = await this.getParticipant(sessionId, user.id)
    if (!participant?.permissions.canEdit) {
      throw new Error('Sem permissão para editar')
    }

    const realTimeEdit: RealTimeEdit = {
      ...edit,
      id: crypto.randomUUID(),
      userId: user.id,
      timestamp: new Date().toISOString(),
      applied: false
    }

    // Salvar no banco
    const { error } = await supabase
      .from('realtime_edits')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        layer_id: realTimeEdit.layerId,
        operation: realTimeEdit.operation,
        before: realTimeEdit.before,
        after: realTimeEdit.after,
        timestamp: realTimeEdit.timestamp,
        applied: false
      })

    if (error) throw error

    // Broadcast para outros participantes
    await this.broadcastEvent(sessionId, {
      type: 'edit_applied',
      data: { edit: realTimeEdit }
    })
  }

  async resolveConflict(
    conflictId: string,
    resolution: any,
    strategy: 'accept_source' | 'accept_target' | 'merge' | 'custom'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('collaboration_conflicts')
      .update({
        status: 'resolved',
        resolution,
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', conflictId)

    if (error) throw error

    // Notificar participantes
    const { data: conflict } = await supabase
      .from('collaboration_conflicts')
      .select('session_id')
      .eq('id', conflictId)
      .single()

    if (conflict) {
      await this.broadcastEvent(conflict.session_id, {
        type: 'conflict_resolved',
        data: { conflictId, resolution, strategy, resolvedBy: user.id }
      })
    }
  }

  // Comentários e anotações
  async addAnnotation(
    projectId: string,
    annotation: Omit<ProjectAnnotation, 'id' | 'createdAt' | 'updatedAt' | 'replies'>
  ): Promise<ProjectAnnotation> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: newAnnotation, error } = await supabase
      .from('project_annotations')
      .insert({
        project_id: projectId,
        layer_id: annotation.layerId,
        user_id: user.id,
        type: annotation.type,
        content: annotation.content,
        position: annotation.position,
        status: annotation.status,
        priority: annotation.priority,
        assigned_to: annotation.assignedTo,
        due_date: annotation.dueDate,
        tags: annotation.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    const mappedAnnotation = this.mapAnnotationFromDB(newAnnotation)

    // Notificar participantes da sessão ativa
    if (this.activeSession?.projectId === projectId) {
      await this.broadcastEvent(this.activeSession.id, {
        type: 'annotation_added',
        data: { annotation: mappedAnnotation }
      })
    }

    return mappedAnnotation
  }

  async updateAnnotation(
    annotationId: string,
    updates: Partial<Pick<ProjectAnnotation, 'content' | 'status' | 'priority' | 'assignedTo' | 'dueDate' | 'tags'>>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { error } = await supabase
      .from('project_annotations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', annotationId)
      .eq('user_id', user.id)

    if (error) throw error

    // Notificar sobre a atualização
    const { data: annotation } = await supabase
      .from('project_annotations')
      .select('project_id')
      .eq('id', annotationId)
      .single()

    if (annotation && this.activeSession?.projectId === annotation.project_id) {
      await this.broadcastEvent(this.activeSession.id, {
        type: 'annotation_updated',
        data: { annotationId, updates }
      })
    }
  }

  // Comunicação em tempo real
  async connectToSession(sessionId: string): Promise<void> {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe()
    }

    this.realtimeChannel = supabase
      .channel(`collaboration:${sessionId}`)
      .on('broadcast', { event: 'collaboration_event' }, (payload) => {
        this.handleRealtimeEvent(payload)
      })
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync()
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handlePresenceJoin(key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handlePresenceLeave(key, leftPresences)
      })
      .subscribe()

    // Atualizar presença
    await this.updatePresence(sessionId)
  }

  async disconnectFromSession(sessionId: string): Promise<void> {
    try {
      // Desconectar do canal em tempo real
      if (this.realtimeChannel) {
        await this.realtimeChannel.unsubscribe()
        this.realtimeChannel = null
      }

      // Atualizar status do participante
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('collaboration_participants')
          .update({
            status: 'offline',
            left_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
      }

      // Limpar sessão ativa
      this.activeSession = null
    } catch (error) {
      console.error('Error disconnecting from session:', error)
      throw error
    }
  }

  private async updatePresence(sessionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !this.realtimeChannel) return

    await this.realtimeChannel.track({
      userId: user.id,
      sessionId,
      timestamp: new Date().toISOString()
    })
  }

  private async broadcastEvent(sessionId: string, event: any): Promise<void> {
    if (!this.realtimeChannel) return

    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'collaboration_event',
      payload: {
        sessionId,
        ...event,
        timestamp: new Date().toISOString()
      }
    })
  }

  private handleRealtimeEvent(payload: any): void {
    const { type, data } = payload
    const listeners = this.eventListeners.get(type) || []
    listeners.forEach(listener => listener(data))
  }

  private handlePresenceSync(): void {
    // Implementar sincronização de presença
  }

  private handlePresenceJoin(key: string, newPresences: any[]): void {
    // Implementar lógica quando alguém entra
  }

  private handlePresenceLeave(key: string, leftPresences: any[]): void {
    // Implementar lógica quando alguém sai
  }

  // Event listeners
  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Métodos auxiliares
  private async getSession(sessionId: string): Promise<CollaborationSession | null> {
    const { data, error } = await supabase
      .from('collaboration_sessions')
      .select(`
        *,
        participants:collaboration_participants(*)
      `)
      .eq('id', sessionId)
      .single()

    if (error) return null
    return this.mapSessionFromDB(data)
  }

  private async getParticipant(sessionId: string, userId: string): Promise<CollaborationParticipant | null> {
    const { data, error } = await supabase
      .from('collaboration_participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return this.mapParticipantFromDB(data)
  }

  private getDefaultPermissions(role: string): CollaborationPermissions {
    const permissions: Record<string, CollaborationPermissions> = {
      owner: {
        canEdit: true,
        canComment: true,
        canShare: true,
        canExport: true,
        canManageParticipants: true,
        canViewHistory: true,
        canCreateVersions: true
      },
      editor: {
        canEdit: true,
        canComment: true,
        canShare: false,
        canExport: true,
        canManageParticipants: false,
        canViewHistory: true,
        canCreateVersions: true
      },
      viewer: {
        canEdit: false,
        canComment: true,
        canShare: false,
        canExport: false,
        canManageParticipants: false,
        canViewHistory: false,
        canCreateVersions: false
      },
      reviewer: {
        canEdit: false,
        canComment: true,
        canShare: false,
        canExport: false,
        canManageParticipants: false,
        canViewHistory: true,
        canCreateVersions: false
      }
    }

    return permissions[role] || permissions.viewer
  }

  private mapSessionFromDB(data: any): CollaborationSession {
    return {
      id: data.id,
      projectId: data.project_id,
      ownerId: data.owner_id,
      participants: data.participants?.map((p: any) => this.mapParticipantFromDB(p)) || [],
      status: data.status,
      settings: data.settings,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      endedAt: data.ended_at
    }
  }

  private mapParticipantFromDB(data: any): CollaborationParticipant {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      role: data.role,
      permissions: data.permissions,
      status: data.status,
      cursor: data.cursor,
      lastActivity: data.last_activity,
      joinedAt: data.joined_at,
      leftAt: data.left_at
    }
  }

  private mapAnnotationFromDB(data: any): ProjectAnnotation {
    return {
      id: data.id,
      projectId: data.project_id,
      layerId: data.layer_id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      position: data.position,
      status: data.status,
      priority: data.priority,
      assignedTo: data.assigned_to,
      dueDate: data.due_date,
      tags: data.tags || [],
      attachments: [],
      replies: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at,
      resolvedBy: data.resolved_by
    }
  }
}

export const collaborationService = new CollaborationService()
export default collaborationService