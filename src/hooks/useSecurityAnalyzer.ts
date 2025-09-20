import { useState, useEffect, useCallback, useMemo } from 'react';

// Interfaces para análise de segurança
interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'injection' | 'authentication' | 'encryption' | 'authorization' | 'configuration' | 'dependency' | 'xss' | 'csrf';
  cwe: string;
  cvss: number;
  component: string;
  file?: string;
  line?: number;
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive' | 'accepted_risk';
  assignee?: string;
  discoveredAt: Date;
  updatedAt: Date;
  evidence: {
    code?: string;
    request?: string;
    response?: string;
    screenshots?: string[];
  };
  references: string[];
  exploitability: 'high' | 'medium' | 'low';
  businessImpact: 'high' | 'medium' | 'low';
  remediationEffort: 'low' | 'medium' | 'high';
}

interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'vulnerabilities' | 'compliance' | 'monitoring' | 'incidents' | 'coverage';
  benchmark: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  description: string;
  history: { date: Date; value: number }[];
  threshold: {
    warning: number;
    critical: number;
  };
}

interface SecurityScan {
  id: string;
  name: string;
  type: 'sast' | 'dast' | 'dependency' | 'infrastructure' | 'compliance' | 'penetration' | 'container' | 'secrets';
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'cancelled';
  progress: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  coverage: number;
  config: {
    scope: string[];
    rules: string[];
    excludes: string[];
    depth?: number;
    timeout?: number;
  };
  results: {
    filesScanned: number;
    linesOfCode: number;
    falsePositives: number;
    suppressedIssues: number;
  };
}

interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  requirements: {
    id: string;
    title: string;
    description: string;
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    evidence: string[];
    gaps: string[];
    priority: 'high' | 'medium' | 'low';
    lastAssessed: Date;
    nextAssessment: Date;
    owner: string;
  }[];
  overallCompliance: number;
  lastAssessment: Date;
  nextAssessment: Date;
  certificationStatus: 'certified' | 'in_progress' | 'expired' | 'not_applicable';
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'breach' | 'attack' | 'vulnerability' | 'policy_violation' | 'system_failure' | 'data_leak';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  affectedSystems: string[];
  impact: string;
  timeline: {
    timestamp: Date;
    event: string;
    actor: string;
    details?: string;
  }[];
  response: {
    actions: string[];
    responsible: string;
    deadline: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  reportedAt: Date;
  resolvedAt?: Date;
  rootCause?: string;
  lessonsLearned?: string[];
  preventiveMeasures?: string[];
}

interface SecurityThreat {
  id: string;
  name: string;
  description: string;
  category: 'malware' | 'phishing' | 'ddos' | 'insider' | 'apt' | 'ransomware';
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  impact: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  riskScore: number;
  indicators: string[];
  mitigations: string[];
  detectedAt: Date;
  status: 'active' | 'mitigated' | 'false_positive';
}

interface SecurityConfig {
  scanningEnabled: boolean;
  realTimeMonitoring: boolean;
  alertsEnabled: boolean;
  complianceFrameworks: string[];
  scanSchedule: {
    sast: string;
    dast: string;
    dependency: string;
    infrastructure: string;
  };
  thresholds: {
    criticalVulns: number;
    highVulns: number;
    complianceScore: number;
    incidentResponseTime: number;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
    sms: boolean;
  };
  retention: {
    scans: number;
    incidents: number;
    logs: number;
    reports: number;
  };
  integrations: {
    siem: boolean;
    ticketing: boolean;
    cicd: boolean;
    monitoring: boolean;
  };
  autoRemediation: {
    enabled: boolean;
    lowRiskOnly: boolean;
    requireApproval: boolean;
  };
}

interface SecurityReport {
  id: string;
  name: string;
  type: 'vulnerability' | 'compliance' | 'incident' | 'threat' | 'executive';
  format: 'pdf' | 'html' | 'json' | 'csv';
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  recipients: string[];
  scheduled: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'vulnerability' | 'incident' | 'compliance' | 'threat' | 'system';
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actions: string[];
  relatedItems: string[];
}

interface SecurityDashboard {
  riskScore: number;
  vulnerabilityTrend: 'improving' | 'stable' | 'degrading';
  complianceStatus: 'compliant' | 'partial' | 'non_compliant';
  incidentCount: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastScanDate: Date;
  nextScheduledScan: Date;
  criticalIssues: number;
  openIncidents: number;
  unacknowledgedAlerts: number;
}

export const useSecurityAnalyzer = () => {
  // Estado principal
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Ações de análise
  const startScan = useCallback(async (type: SecurityScan['type'], options?: Partial<SecurityScan['config']>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const scanId = `scan_${Date.now()}`;
      const newScan: SecurityScan = {
        id: scanId,
        name: `${type.toUpperCase()} Scan`,
        type,
        status: 'running',
        progress: 0,
        startTime: new Date(),
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
        coverage: 0,
        config: {
          scope: options?.scope || ['src/', 'api/'],
          rules: options?.rules || ['security', 'owasp-top-10'],
          excludes: options?.excludes || ['node_modules/', 'dist/'],
          ...options,
        },
        results: {
          filesScanned: 0,
          linesOfCode: 0,
          falsePositives: 0,
          suppressedIssues: 0,
        },
      };
      
      setScans(prev => [newScan, ...prev]);
      
      // Simular progresso do scan
      const progressInterval = setInterval(() => {
        setScans(prev => prev.map(scan => {
          if (scan.id === scanId && scan.status === 'running') {
            const newProgress = Math.min(scan.progress + Math.random() * 15, 100);
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return {
                ...scan,
                progress: 100,
                status: 'completed' as const,
                endTime: new Date(),
                duration: Math.round((Date.now() - scan.startTime.getTime()) / 1000 / 60),
                vulnerabilities: {
                  critical: Math.floor(Math.random() * 3),
                  high: Math.floor(Math.random() * 8),
                  medium: Math.floor(Math.random() * 15),
                  low: Math.floor(Math.random() * 20),
                },
                coverage: 85 + Math.random() * 15,
                results: {
                  filesScanned: Math.floor(Math.random() * 500) + 100,
                  linesOfCode: Math.floor(Math.random() * 50000) + 10000,
                  falsePositives: Math.floor(Math.random() * 5),
                  suppressedIssues: Math.floor(Math.random() * 10),
                },
              };
            }
            return { ...scan, progress: newProgress };
          }
          return scan;
        }));
      }, 1000);
      
      return scanId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar scan');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopScan = useCallback(async (scanId: string) => {
    setScans(prev => prev.map(scan => 
      scan.id === scanId ? { ...scan, status: 'cancelled' as const } : scan
    ));
  }, []);

  const scheduleScan = useCallback(async (type: SecurityScan['type'], schedule: string) => {
    setConfig(prev => ({
      ...prev,
      scanSchedule: { ...prev.scanSchedule, [type]: schedule }
    }));
  }, []);

  // Ações de vulnerabilidades
  const resolveVulnerability = useCallback(async (vulnerabilityId: string, resolution: string) => {
    setVulnerabilities(prev => prev.map(vuln => 
      vuln.id === vulnerabilityId 
        ? { ...vuln, status: 'resolved', updatedAt: new Date() }
        : vuln
    ));
  }, []);

  const assignVulnerability = useCallback(async (vulnerabilityId: string, assignee: string) => {
    setVulnerabilities(prev => prev.map(vuln => 
      vuln.id === vulnerabilityId 
        ? { ...vuln, assignee, status: 'in_progress', updatedAt: new Date() }
        : vuln
    ));
  }, []);

  const markFalsePositive = useCallback(async (vulnerabilityId: string, reason: string) => {
    setVulnerabilities(prev => prev.map(vuln => 
      vuln.id === vulnerabilityId 
        ? { ...vuln, status: 'false_positive', updatedAt: new Date() }
        : vuln
    ));
  }, []);

  const bulkResolveVulnerabilities = useCallback(async (vulnerabilityIds: string[], resolution: string) => {
    setVulnerabilities(prev => prev.map(vuln => 
      vulnerabilityIds.includes(vuln.id)
        ? { ...vuln, status: 'resolved', updatedAt: new Date() }
        : vuln
    ));
  }, []);

  // Ações de incidentes
  const createIncident = useCallback(async (incidentData: Partial<SecurityIncident>) => {
    const newIncident: SecurityIncident = {
      id: `incident_${Date.now()}`,
      title: incidentData.title || 'Novo Incidente',
      description: incidentData.description || '',
      severity: incidentData.severity || 'medium',
      type: incidentData.type || 'vulnerability',
      status: 'open',
      affectedSystems: incidentData.affectedSystems || [],
      impact: incidentData.impact || '',
      timeline: [{
        timestamp: new Date(),
        event: 'Incidente criado',
        actor: 'Sistema',
      }],
      response: [],
      reportedAt: new Date(),
      ...incidentData,
    };
    
    setIncidents(prev => [newIncident, ...prev]);
    return newIncident.id;
  }, []);

  const updateIncidentStatus = useCallback(async (incidentId: string, status: SecurityIncident['status']) => {
    setIncidents(prev => prev.map(incident => {
      if (incident.id === incidentId) {
        const updatedIncident = { ...incident, status };
        if (status === 'resolved' || status === 'closed') {
          updatedIncident.resolvedAt = new Date();
        }
        updatedIncident.timeline.push({
          timestamp: new Date(),
          event: `Status alterado para ${status}`,
          actor: 'Usuário',
        });
        return updatedIncident;
      }
      return incident;
    }));
  }, []);

  const addIncidentResponse = useCallback(async (incidentId: string, response: SecurityIncident['response'][0]) => {
    setIncidents(prev => prev.map(incident => 
      incident.id === incidentId 
        ? { ...incident, response: [...incident.response, response] }
        : incident
    ));
  }, []);

  // Ações de conformidade
  const updateComplianceRequirement = useCallback(async (
    frameworkId: string, 
    requirementId: string, 
    updates: Partial<ComplianceFramework['requirements'][0]>
  ) => {
    setComplianceFrameworks(prev => prev.map(framework => {
      if (framework.id === frameworkId) {
        const updatedRequirements = framework.requirements.map(req => 
          req.id === requirementId ? { ...req, ...updates, lastAssessed: new Date() } : req
        );
        const compliantCount = updatedRequirements.filter(req => req.status === 'compliant').length;
        const overallCompliance = Math.round((compliantCount / updatedRequirements.length) * 100);
        
        return {
          ...framework,
          requirements: updatedRequirements,
          overallCompliance,
          lastAssessment: new Date(),
        };
      }
      return framework;
    }));
  }, []);

  const generateComplianceReport = useCallback(async (frameworkId: string) => {
    const framework = complianceFrameworks.find(f => f.id === frameworkId);
    if (!framework) return null;
    
    const report: SecurityReport = {
      id: `report_${Date.now()}`,
      name: `Relatório de Conformidade - ${framework.name}`,
      type: 'compliance',
      format: 'pdf',
      generatedAt: new Date(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      data: framework,
      recipients: [],
      scheduled: false,
    };
    
    setReports(prev => [report, ...prev]);
    return report.id;
  }, [complianceFrameworks]);

  // Ações de ameaças
  const detectThreat = useCallback(async (threatData: Partial<SecurityThreat>) => {
    const newThreat: SecurityThreat = {
      id: `threat_${Date.now()}`,
      name: threatData.name || 'Ameaça Detectada',
      description: threatData.description || '',
      category: threatData.category || 'malware',
      severity: threatData.severity || 'medium',
      likelihood: threatData.likelihood || 'medium',
      impact: threatData.impact || 'medium',
      riskScore: calculateRiskScore(threatData.likelihood || 'medium', threatData.impact || 'medium'),
      indicators: threatData.indicators || [],
      mitigations: threatData.mitigations || [],
      detectedAt: new Date(),
      status: 'active',
      ...threatData,
    };
    
    setThreats(prev => [newThreat, ...prev]);
    
    // Criar alerta automático para ameaças críticas
    if (newThreat.severity === 'critical') {
      await createAlert({
        title: `Ameaça Crítica Detectada: ${newThreat.name}`,
        description: newThreat.description,
        severity: 'critical',
        type: 'threat',
        source: 'Threat Detection System',
        relatedItems: [newThreat.id],
      });
    }
    
    return newThreat.id;
  }, []);

  const mitigateThreat = useCallback(async (threatId: string, mitigations: string[]) => {
    setThreats(prev => prev.map(threat => 
      threat.id === threatId 
        ? { ...threat, status: 'mitigated', mitigations: [...threat.mitigations, ...mitigations] }
        : threat
    ));
  }, []);

  // Ações de alertas
  const createAlert = useCallback(async (alertData: Partial<SecurityAlert>) => {
    const newAlert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      title: alertData.title || 'Novo Alerta',
      description: alertData.description || '',
      severity: alertData.severity || 'medium',
      type: alertData.type || 'system',
      source: alertData.source || 'Sistema',
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      actions: alertData.actions || [],
      relatedItems: alertData.relatedItems || [],
      ...alertData,
    };
    
    setAlerts(prev => [newAlert, ...prev]);
    return newAlert.id;
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string, acknowledgedBy: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            acknowledged: true, 
            acknowledgedBy, 
            acknowledgedAt: new Date() 
          }
        : alert
    ));
  }, []);

  const resolveAlert = useCallback(async (alertId: string, resolvedBy: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            resolved: true, 
            resolvedBy, 
            resolvedAt: new Date() 
          }
        : alert
    ));
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Ações de configuração
  const updateConfig = useCallback(async (updates: Partial<SecurityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(async () => {
    setConfig(defaultConfig);
  }, []);

  const exportConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [config]);

  const importConfig = useCallback(async (configFile: File) => {
    try {
      const text = await configFile.text();
      const importedConfig = JSON.parse(text);
      setConfig(importedConfig);
    } catch (err) {
      setError('Erro ao importar configuração');
      throw err;
    }
  }, []);

  // Ações de relatórios
  const generateReport = useCallback(async (
    type: SecurityReport['type'], 
    format: SecurityReport['format'] = 'pdf',
    period?: { start: Date; end: Date }
  ) => {
    const reportPeriod = period || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };
    
    let data: any;
    let name: string;
    
    switch (type) {
      case 'vulnerability':
        data = vulnerabilities.filter(v => 
          v.discoveredAt >= reportPeriod.start && v.discoveredAt <= reportPeriod.end
        );
        name = 'Relatório de Vulnerabilidades';
        break;
      case 'compliance':
        data = complianceFrameworks;
        name = 'Relatório de Conformidade';
        break;
      case 'incident':
        data = incidents.filter(i => 
          i.reportedAt >= reportPeriod.start && i.reportedAt <= reportPeriod.end
        );
        name = 'Relatório de Incidentes';
        break;
      case 'threat':
        data = threats.filter(t => 
          t.detectedAt >= reportPeriod.start && t.detectedAt <= reportPeriod.end
        );
        name = 'Relatório de Ameaças';
        break;
      case 'executive':
        data = {
          summary: dashboard,
          vulnerabilities: vulnerabilities.slice(0, 10),
          incidents: incidents.slice(0, 5),
          compliance: complianceFrameworks,
          metrics,
        };
        name = 'Relatório Executivo de Segurança';
        break;
      default:
        throw new Error('Tipo de relatório não suportado');
    }
    
    const report: SecurityReport = {
      id: `report_${Date.now()}`,
      name,
      type,
      format,
      generatedAt: new Date(),
      period: reportPeriod,
      data,
      recipients: [],
      scheduled: false,
    };
    
    setReports(prev => [report, ...prev]);
    return report.id;
  }, [vulnerabilities, complianceFrameworks, incidents, threats, metrics]);

  const exportReport = useCallback((reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report.data, null, 2)], {
      type: report.format === 'json' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.toLowerCase().replace(/\s+/g, '-')}.${report.format}`;
    a.click();
  }, [reports]);

  const scheduleReport = useCallback(async (
    reportId: string, 
    frequency: SecurityReport['frequency'],
    recipients: string[]
  ) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, scheduled: true, frequency, recipients }
        : report
    ));
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    setReports(prev => prev.filter(report => report.id !== reportId));
  }, []);

  // Ações de monitoramento
  const startRealTimeMonitoring = useCallback(async () => {
    setIsMonitoring(true);
    setConfig(prev => ({ ...prev, realTimeMonitoring: true }));
    
    // Simular detecção de eventos em tempo real
    const monitoringInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance de detectar algo
        const eventTypes = ['vulnerability', 'threat', 'incident'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        switch (eventType) {
          case 'vulnerability':
            // Simular nova vulnerabilidade
            break;
          case 'threat':
            detectThreat({
              name: 'Atividade Suspeita Detectada',
              description: 'Padrão de tráfego anômalo identificado',
              category: 'malware',
              severity: 'medium',
            });
            break;
          case 'incident':
            createIncident({
              title: 'Tentativa de Acesso Não Autorizado',
              description: 'Múltiplas tentativas de login falharam',
              severity: 'medium',
              type: 'attack',
            });
            break;
        }
      }
    }, 30000); // Verificar a cada 30 segundos
    
    return () => clearInterval(monitoringInterval);
  }, [detectThreat, createIncident]);

  const stopRealTimeMonitoring = useCallback(async () => {
    setIsMonitoring(false);
    setConfig(prev => ({ ...prev, realTimeMonitoring: false }));
  }, []);

  // Funções utilitárias
  const clearCache = useCallback(() => {
    // Limpar dados em cache
    setError(null);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar métricas
      setMetrics(generateMockMetrics());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateConfig = useCallback((configToValidate: SecurityConfig): boolean => {
    // Validar configuração
    return (
      configToValidate.thresholds.criticalVulns >= 0 &&
      configToValidate.thresholds.complianceScore >= 0 &&
      configToValidate.thresholds.complianceScore <= 100
    );
  }, []);

  // Valores computados
  const dashboard = useMemo((): SecurityDashboard => {
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open').length;
    const highVulns = vulnerabilities.filter(v => v.severity === 'high' && v.status === 'open').length;
    const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
    
    const riskScore = calculateOverallRiskScore(vulnerabilities, threats, incidents);
    const vulnerabilityTrend = calculateVulnerabilityTrend(metrics);
    const complianceStatus = calculateComplianceStatus(complianceFrameworks);
    const threatLevel = calculateThreatLevel(threats);
    
    const lastScan = scans
      .filter(s => s.status === 'completed')
      .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())[0];
    
    const nextScan = scans
      .filter(s => s.status === 'scheduled')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
    
    return {
      riskScore,
      vulnerabilityTrend,
      complianceStatus,
      incidentCount: incidents.length,
      threatLevel,
      lastScanDate: lastScan?.endTime || new Date(),
      nextScheduledScan: nextScan?.startTime || new Date(),
      criticalIssues: criticalVulns + highVulns,
      openIncidents,
      unacknowledgedAlerts,
    };
  }, [vulnerabilities, threats, incidents, alerts, metrics, complianceFrameworks, scans]);

  const criticalIssuesCount = useMemo(() => 
    vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open').length,
    [vulnerabilities]
  );

  const highIssuesCount = useMemo(() => 
    vulnerabilities.filter(v => v.severity === 'high' && v.status === 'open').length,
    [vulnerabilities]
  );

  const overallComplianceScore = useMemo(() => {
    if (complianceFrameworks.length === 0) return 0;
    const totalScore = complianceFrameworks.reduce((sum, framework) => sum + framework.overallCompliance, 0);
    return Math.round(totalScore / complianceFrameworks.length);
  }, [complianceFrameworks]);

  const activeThreatCount = useMemo(() => 
    threats.filter(t => t.status === 'active').length,
    [threats]
  );

  const unacknowledgedAlertsCount = useMemo(() => 
    alerts.filter(a => !a.acknowledged).length,
    [alerts]
  );

  const runningScansCount = useMemo(() => 
    scans.filter(s => s.status === 'running').length,
    [scans]
  );

  const securityTrend = useMemo(() => {
    const recentMetrics = metrics.find(m => m.name === 'Vulnerabilidades Críticas');
    if (!recentMetrics || recentMetrics.history.length < 2) return 'stable';
    
    const recent = recentMetrics.history.slice(-7);
    const trend = recent[recent.length - 1].value - recent[0].value;
    
    if (trend > 0) return 'degrading';
    if (trend < 0) return 'improving';
    return 'stable';
  }, [metrics]);

  // Inicialização
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Carregar dados iniciais
        setVulnerabilities(generateMockVulnerabilities());
        setMetrics(generateMockMetrics());
        setScans(generateMockScans());
        setComplianceFrameworks(generateMockComplianceFrameworks());
        setIncidents(generateMockIncidents());
        setThreats(generateMockThreats());
        setAlerts(generateMockAlerts());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      // Limpar intervalos e recursos
    };
  }, []);

  return {
    // Estado
    vulnerabilities,
    metrics,
    scans,
    complianceFrameworks,
    incidents,
    threats,
    alerts,
    reports,
    config,
    isLoading,
    error,
    isMonitoring,
    
    // Ações de análise
    startScan,
    stopScan,
    scheduleScan,
    
    // Ações de vulnerabilidades
    resolveVulnerability,
    assignVulnerability,
    markFalsePositive,
    bulkResolveVulnerabilities,
    
    // Ações de incidentes
    createIncident,
    updateIncidentStatus,
    addIncidentResponse,
    
    // Ações de conformidade
    updateComplianceRequirement,
    generateComplianceReport,
    
    // Ações de ameaças
    detectThreat,
    mitigateThreat,
    
    // Ações de alertas
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    
    // Ações de configuração
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    
    // Ações de relatórios
    generateReport,
    exportReport,
    scheduleReport,
    deleteReport,
    
    // Ações de monitoramento
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    
    // Funções utilitárias
    clearCache,
    refreshData,
    validateConfig,
    
    // Valores computados
    dashboard,
    criticalIssuesCount,
    highIssuesCount,
    overallComplianceScore,
    activeThreatCount,
    unacknowledgedAlertsCount,
    runningScansCount,
    securityTrend,
  };
};

// Configuração padrão
const defaultConfig: SecurityConfig = {
  scanningEnabled: true,
  realTimeMonitoring: false,
  alertsEnabled: true,
  complianceFrameworks: ['owasp-top-10', 'iso-27001'],
  scanSchedule: {
    sast: '0 2 * * *', // Diário às 2h
    dast: '0 3 * * 0', // Semanal aos domingos às 3h
    dependency: '0 4 * * 1', // Semanal às segundas às 4h
    infrastructure: '0 5 * * 6', // Semanal aos sábados às 5h
  },
  thresholds: {
    criticalVulns: 0,
    highVulns: 5,
    complianceScore: 90,
    incidentResponseTime: 4, // horas
  },
  notifications: {
    email: true,
    slack: false,
    webhook: false,
    sms: false,
  },
  retention: {
    scans: 90, // dias
    incidents: 365, // dias
    logs: 30, // dias
    reports: 180, // dias
  },
  integrations: {
    siem: false,
    ticketing: false,
    cicd: true,
    monitoring: true,
  },
  autoRemediation: {
    enabled: false,
    lowRiskOnly: true,
    requireApproval: true,
  },
};

// Funções auxiliares
function calculateRiskScore(likelihood: string, impact: string): number {
  const likelihoodScore = {
    very_low: 1, low: 2, medium: 3, high: 4, very_high: 5
  }[likelihood] || 3;
  
  const impactScore = {
    very_low: 1, low: 2, medium: 3, high: 4, very_high: 5
  }[impact] || 3;
  
  return likelihoodScore * impactScore;
}

function calculateOverallRiskScore(
  vulnerabilities: SecurityVulnerability[], 
  threats: SecurityThreat[], 
  incidents: SecurityIncident[]
): number {
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open').length;
  const highVulns = vulnerabilities.filter(v => v.severity === 'high' && v.status === 'open').length;
  const activeThreats = threats.filter(t => t.status === 'active').length;
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
  
  const score = (criticalVulns * 10) + (highVulns * 5) + (activeThreats * 3) + (openIncidents * 2);
  return Math.min(score, 100);
}

function calculateVulnerabilityTrend(metrics: SecurityMetric[]): 'improving' | 'stable' | 'degrading' {
  const vulnMetric = metrics.find(m => m.name === 'Vulnerabilidades Críticas');
  if (!vulnMetric || vulnMetric.history.length < 2) return 'stable';
  
  const recent = vulnMetric.history.slice(-7);
  const trend = recent[recent.length - 1].value - recent[0].value;
  
  if (trend > 0) return 'degrading';
  if (trend < 0) return 'improving';
  return 'stable';
}

function calculateComplianceStatus(frameworks: ComplianceFramework[]): 'compliant' | 'partial' | 'non_compliant' {
  if (frameworks.length === 0) return 'non_compliant';
  
  const avgCompliance = frameworks.reduce((sum, f) => sum + f.overallCompliance, 0) / frameworks.length;
  
  if (avgCompliance >= 90) return 'compliant';
  if (avgCompliance >= 70) return 'partial';
  return 'non_compliant';
}

function calculateThreatLevel(threats: SecurityThreat[]): 'low' | 'medium' | 'high' | 'critical' {
  const activeThreats = threats.filter(t => t.status === 'active');
  if (activeThreats.length === 0) return 'low';
  
  const criticalThreats = activeThreats.filter(t => t.severity === 'critical').length;
  const highThreats = activeThreats.filter(t => t.severity === 'high').length;
  
  if (criticalThreats > 0) return 'critical';
  if (highThreats > 2) return 'high';
  if (activeThreats.length > 5) return 'medium';
  return 'low';
}

// Funções de geração de dados mock
function generateMockVulnerabilities(): SecurityVulnerability[] {
  return [
    {
      id: '1',
      title: 'SQL Injection em endpoint de login',
      description: 'Parâmetro de entrada não sanitizado permite injeção SQL',
      severity: 'critical',
      category: 'injection',
      cwe: 'CWE-89',
      cvss: 9.8,
      component: 'Authentication Service',
      file: 'auth.js',
      line: 45,
      impact: 'Acesso não autorizado ao banco de dados',
      recommendation: 'Implementar prepared statements e validação de entrada',
      status: 'open',
      discoveredAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      evidence: {
        code: "SELECT * FROM users WHERE username = '" + username + "'",
        request: "POST /login username=admin' OR '1'='1",
      },
      references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
      exploitability: 'high',
      businessImpact: 'high',
      remediationEffort: 'medium',
    },
    {
      id: '2',
      title: 'Cross-Site Scripting (XSS) Refletido',
      description: 'Entrada do usuário refletida sem sanitização',
      severity: 'high',
      category: 'xss',
      cwe: 'CWE-79',
      cvss: 7.5,
      component: 'Search Component',
      file: 'search.tsx',
      line: 23,
      impact: 'Execução de scripts maliciosos no navegador',
      recommendation: 'Implementar sanitização de HTML e CSP',
      status: 'in_progress',
      assignee: 'dev@example.com',
      discoveredAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-16'),
      evidence: {
        code: '<div>{searchTerm}</div>',
        request: 'GET /search?q=<script>alert(1)</script>',
      },
      references: ['https://owasp.org/www-community/attacks/xss/'],
      exploitability: 'medium',
      businessImpact: 'medium',
      remediationEffort: 'low',
    },
  ];
}

function generateMockMetrics(): SecurityMetric[] {
  return [
    {
      id: '1',
      name: 'Vulnerabilidades Críticas',
      value: 2,
      unit: 'count',
      category: 'vulnerabilities',
      benchmark: 0,
      trend: 'up',
      status: 'critical',
      description: 'Número de vulnerabilidades críticas abertas',
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 5),
      })).reverse(),
      threshold: { warning: 1, critical: 3 },
    },
    {
      id: '2',
      name: 'Score de Conformidade',
      value: 78,
      unit: '%',
      category: 'compliance',
      benchmark: 90,
      trend: 'up',
      status: 'warning',
      description: 'Porcentagem de conformidade com frameworks de segurança',
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        value: 70 + Math.random() * 20,
      })).reverse(),
      threshold: { warning: 80, critical: 70 },
    },
  ];
}

function generateMockScans(): SecurityScan[] {
  return [
    {
      id: '1',
      name: 'SAST - Análise Estática',
      type: 'sast',
      status: 'completed',
      progress: 100,
      startTime: new Date('2024-01-16T10:00:00'),
      endTime: new Date('2024-01-16T10:15:00'),
      duration: 15,
      vulnerabilities: { critical: 2, high: 5, medium: 12, low: 8 },
      coverage: 95,
      config: {
        scope: ['src/', 'api/'],
        rules: ['security', 'owasp-top-10'],
        excludes: ['node_modules/', 'dist/'],
      },
      results: {
        filesScanned: 245,
        linesOfCode: 15420,
        falsePositives: 3,
        suppressedIssues: 7,
      },
    },
  ];
}

function generateMockComplianceFrameworks(): ComplianceFramework[] {
  return [
    {
      id: '1',
      name: 'OWASP Top 10',
      version: '2021',
      description: 'Os 10 principais riscos de segurança em aplicações web',
      requirements: [
        {
          id: 'A01',
          title: 'Broken Access Control',
          description: 'Controle de acesso quebrado',
          status: 'non_compliant',
          evidence: [],
          gaps: ['Falta validação de autorização em endpoints'],
          priority: 'high',
          lastAssessed: new Date('2024-01-16'),
          nextAssessment: new Date('2024-02-16'),
          owner: 'Security Team',
        },
      ],
      overallCompliance: 25,
      lastAssessment: new Date('2024-01-16'),
      nextAssessment: new Date('2024-02-16'),
      certificationStatus: 'in_progress',
    },
  ];
}

function generateMockIncidents(): SecurityIncident[] {
  return [
    {
      id: '1',
      title: 'Tentativa de SQL Injection detectada',
      description: 'Sistema de monitoramento detectou múltiplas tentativas de SQL injection',
      severity: 'high',
      type: 'attack',
      status: 'investigating',
      affectedSystems: ['Web Application', 'Database'],
      impact: 'Possível exposição de dados sensíveis',
      timeline: [
        {
          timestamp: new Date('2024-01-16T14:30:00'),
          event: 'Primeira tentativa detectada',
          actor: 'Security Monitor',
        },
      ],
      response: [],
      reportedAt: new Date('2024-01-16T14:30:00'),
    },
  ];
}

function generateMockThreats(): SecurityThreat[] {
  return [
    {
      id: '1',
      name: 'Botnet Activity',
      description: 'Atividade suspeita de botnet detectada',
      category: 'malware',
      severity: 'high',
      likelihood: 'medium',
      impact: 'high',
      riskScore: 12,
      indicators: ['Múltiplos IPs suspeitos', 'Padrão de tráfego anômalo'],
      mitigations: ['Bloqueio de IPs', 'Monitoramento intensificado'],
      detectedAt: new Date('2024-01-16T15:00:00'),
      status: 'active',
    },
  ];
}

function generateMockAlerts(): SecurityAlert[] {
  return [
    {
      id: '1',
      title: 'Vulnerabilidade Crítica Detectada',
      description: 'Nova vulnerabilidade crítica encontrada no sistema',
      severity: 'critical',
      type: 'vulnerability',
      source: 'Security Scanner',
      timestamp: new Date('2024-01-16T16:00:00'),
      acknowledged: false,
      resolved: false,
      actions: ['Revisar código', 'Aplicar patch'],
      relatedItems: ['1'],
    },
  ];
}

export default useSecurityAnalyzer;