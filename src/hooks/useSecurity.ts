// Simplified security hook - authentication system completely disabled
// This hook provides minimal functionality without any active security features

import { useCallback } from 'react';
import { toast } from 'sonner';

export interface SecurityMetrics {
  systemHealth: 'excellent';
  lastCheck: Date;
}

export interface SecurityConfig {
  enabled: false;
  mode: 'disabled';
}

// Completely disabled security hook
export const useSecurity = () => {
  // All authentication functions disabled
  const login = useCallback(async () => {
    toast.info('Sistema de autenticação desabilitado');
    return { success: false, message: 'Authentication disabled' };
  }, []);
  
  const logout = useCallback(async () => {
    toast.info('Sistema de autenticação desabilitado');
  }, []);

  // All authorization functions disabled
  const hasPermission = useCallback(() => false, []);
  const hasRole = useCallback(() => false, []);
  const checkAccess = useCallback(() => false, []);

  // All management functions disabled
  const createUser = useCallback(() => {
    toast.info('Sistema de usuários desabilitado');
    return { success: false, message: 'User management disabled' };
  }, []);

  const updateUser = useCallback(() => {
    toast.info('Sistema de usuários desabilitado');
    return { success: false, message: 'User management disabled' };
  }, []);

  const deleteUser = useCallback(() => {
    toast.info('Sistema de usuários desabilitado');
    return { success: false, message: 'User management disabled' };
  }, []);

  const createRole = useCallback(() => {
    toast.info('Sistema de papéis desabilitado');
    return { success: false, message: 'Role management disabled' };
  }, []);

  const updateRole = useCallback(() => {
    toast.info('Sistema de papéis desabilitado');
    return { success: false, message: 'Role management disabled' };
  }, []);

  const deleteRole = useCallback(() => {
    toast.info('Sistema de papéis desabilitado');
    return { success: false, message: 'Role management disabled' };
  }, []);

  // All security functions disabled
  const logAuditEvent = useCallback(() => {
    // No-op - audit disabled
  }, []);

  const detectThreat = useCallback(() => {
    toast.info('Detecção de ameaças desabilitada');
    return null;
  }, []);

  const createAlert = useCallback(() => {
    toast.info('Sistema de alertas desabilitado');
    return null;
  }, []);

  const resolveAlert = useCallback(() => {
    toast.info('Sistema de alertas desabilitado');
  }, []);

  const markAlertAsRead = useCallback(() => {
    toast.info('Sistema de alertas desabilitado');
  }, []);

  const createIncident = useCallback(() => {
    toast.info('Sistema de incidentes desabilitado');
    return null;
  }, []);

  const updateIncident = useCallback(() => {
    toast.info('Sistema de incidentes desabilitado');
  }, []);

  const updateConfig = useCallback(() => {
    toast.info('Configuração de segurança desabilitada');
  }, []);

  return {
    // Estado básico - sistema de segurança completamente desabilitado
    currentUser: null,
    users: [],
    roles: [],
    permissions: [],
    auditLogs: [],
    threats: [],
    vulnerabilities: [],
    alerts: [],
    incidents: [],
    metrics: {
      totalUsers: 0,
      activeUsers: 0,
      lockedUsers: 0,
      mfaEnabledUsers: 0,
      totalRoles: 0,
      totalPermissions: 0,
      auditLogsToday: 0,
      threatsDetected: 0,
      vulnerabilities: 0,
      criticalAlerts: 0,
      securityScore: 100,
      complianceScore: 100
    },
    config: {
      enabled: false,
      mode: 'disabled' as const
    },
    loading: false,
    
    // Todas as funções desabilitadas
    login,
    logout,
    hasPermission,
    hasRole,
    checkAccess,
    createUser,
    updateUser,
    deleteUser,
    lockUser: () => { toast.info('Sistema de usuários desabilitado'); },
    unlockUser: () => { toast.info('Sistema de usuários desabilitado'); },
    resetPassword: () => { toast.info('Sistema de usuários desabilitado'); },
    createRole,
    updateRole,
    deleteRole,
    assignRole: () => { toast.info('Sistema de papéis desabilitado'); },
    removeRole: () => { toast.info('Sistema de papéis desabilitado'); },
    logAuditEvent,
    getAuditLogs: () => [],
    detectThreat,
    resolveThreat: () => { toast.info('Sistema de ameaças desabilitado'); },
    createAlert,
    resolveAlert,
    markAlertAsRead,
    createIncident,
    updateIncident,
    updateConfig
  };
};

export default useSecurity;