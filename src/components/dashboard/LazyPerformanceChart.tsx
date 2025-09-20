import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, Zap, Target, TrendingUp } from 'lucide-react'

interface PerformanceMetric {
  label: string
  value: number
  unit: string
  target: number
  status: 'good' | 'warning' | 'critical'
}

interface LazyPerformanceChartProps {
  metrics?: PerformanceMetric[]
  className?: string
}

const defaultMetrics: PerformanceMetric[] = [
  {
    label: 'Tempo de Processamento',
    value: 25,
    unit: 's',
    target: 30,
    status: 'good'
  },
  {
    label: 'Qualidade de Vídeo',
    value: 95,
    unit: '%',
    target: 90,
    status: 'good'
  },
  {
    label: 'Taxa de Sucesso',
    value: 98,
    unit: '%',
    target: 95,
    status: 'good'
  },
  {
    label: 'Uso de CPU',
    value: 75,
    unit: '%',
    target: 80,
    status: 'warning'
  }
]

const LazyPerformanceChart: React.FC<LazyPerformanceChartProps> = ({
  metrics = defaultMetrics,
  className
}) => {
  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }, [])

  const getProgressColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }, [])

  const getIcon = useMemo(() => (index: number) => {
    const icons = [Clock, Zap, Target, TrendingUp]
    const IconComponent = icons[index % icons.length]
    return <IconComponent className="h-4 w-4" />
  }, [])

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <Card key={metric.label} className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getIcon(index)}
              {metric.label}
              <Badge className={`ml-auto ${getStatusColor(metric.status)}`}>
                {metric.status === 'good' ? 'Ótimo' : 
                 metric.status === 'warning' ? 'Atenção' : 'Crítico'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {metric.value}{metric.unit}
                </span>
                <span className="text-sm text-gray-500">
                  Meta: {metric.target}{metric.unit}
                </span>
              </div>
              <Progress 
                value={(metric.value / metric.target) * 100} 
                className="h-2"
              />
              <div className="text-xs text-gray-600">
                {metric.value >= metric.target ? 
                  `${((metric.value / metric.target - 1) * 100).toFixed(1)}% acima da meta` :
                  `${((1 - metric.value / metric.target) * 100).toFixed(1)}% abaixo da meta`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default LazyPerformanceChart