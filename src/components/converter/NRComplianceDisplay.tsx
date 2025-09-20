import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertCircle,
  Info
} from 'lucide-react'

interface NRComplianceIssue {
  severity: 'high' | 'medium' | 'low'
  description: string
  location: string
  recommendation: string
}

interface NRSpecificCompliance {
  score: number
  status: 'compliant' | 'partially_compliant' | 'non_compliant'
  gaps: string[]
}

interface NRComplianceData {
  detectedNRs: string[]
  complianceScore: number
  complianceLevel: 'high' | 'medium' | 'low'
  safetyTerms: string[]
  requiredElements: string[]
  missingElements: string[]
  nrSpecificCompliance?: Record<string, NRSpecificCompliance>
  issues?: NRComplianceIssue[]
  summary?: {
    overallCompliance: string
    criticalIssues: number
    recommendedActions: number
    estimatedFixTime: string
  }
}

interface NRComplianceDisplayProps {
  complianceData: NRComplianceData
  className?: string
}

export const NRComplianceDisplay: React.FC<NRComplianceDisplayProps> = ({ 
  complianceData, 
  className = '' 
}) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'low': return <Info className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'partially_compliant': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'non_compliant': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getComplianceLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Compliance Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Análise de Conformidade NR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score Geral de Conformidade</span>
            <Badge className={getComplianceLevelColor(complianceData.complianceLevel)}>
              {complianceData.complianceScore}% ({complianceData.complianceLevel.toUpperCase()})
            </Badge>
          </div>
          
          <Progress value={complianceData.complianceScore} className="h-2" />
          
          {complianceData.summary && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {complianceData.summary.criticalIssues}
                </div>
                <div className="text-xs text-gray-500">Issues Críticos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {complianceData.summary.recommendedActions}
                </div>
                <div className="text-xs text-gray-500">Ações Recomendadas</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detected NRs */}
      {complianceData.detectedNRs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Normas Regulamentadoras Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {complianceData.detectedNRs.map(nr => (
                <Badge key={nr} variant="outline" className="text-xs">
                  {nr}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Specific NR Compliance */}
      {complianceData.nrSpecificCompliance && Object.keys(complianceData.nrSpecificCompliance).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Conformidade Específica por NR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(complianceData.nrSpecificCompliance).map(([nr, compliance]) => (
              <div key={nr} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getComplianceStatusIcon(compliance.status)}
                    <span className="font-medium text-sm">{nr}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {compliance.score}%
                  </Badge>
                </div>
                
                <Progress value={compliance.score} className="h-1" />
                
                {compliance.gaps.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Lacunas Identificadas:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {compliance.gaps.map((gap, index) => (
                        <li key={index} className="text-xs text-gray-700">{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Issues & Recommendations */}
      {complianceData.issues && complianceData.issues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Issues Identificados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceData.issues.map((issue, index) => (
              <div key={index} className={`border rounded-lg p-3 ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start gap-2">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{issue.description}</div>
                    {issue.location && (
                      <div className="text-xs opacity-75">Local: {issue.location}</div>
                    )}
                    {issue.recommendation && (
                      <div className="text-xs mt-2 p-2 bg-white/50 rounded border">
                        <strong>Recomendação:</strong> {issue.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Time Estimate */}
      {complianceData.summary?.estimatedFixTime && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-sm">Tempo Estimado para Correções</div>
              <div className="text-xs text-gray-600">{complianceData.summary.estimatedFixTime}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}