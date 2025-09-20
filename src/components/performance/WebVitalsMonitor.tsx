import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { 
  Activity, 
  Zap, 
  Eye, 
  Clock, 
  Target,
  Download,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useWebVitals } from '../../hooks/useWebVitals';

interface MetricCardProps {
  name: string;
  value: number | null;
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  unit: string;
  icon: React.ReactNode;
  description: string;
  thresholds: { good: number; poor: number };
}

function MetricCard({ name, value, rating, unit, icon, description, thresholds }: MetricCardProps) {
  const getProgressValue = () => {
    if (value === null) return 0;
    return Math.min((value / thresholds.poor) * 100, 100);
  };

  const getProgressColor = () => {
    switch (rating) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getRatingIcon = () => {
    switch (rating) {
      case 'good': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'needs-improvement': return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {name}
        </CardTitle>
        {getRatingIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value !== null ? `${value.toFixed(name === 'CLS' ? 3 : 0)}${unit}` : '--'}
        </div>
        <div className="mt-2">
          <Progress 
            value={getProgressValue()} 
            className={`h-2 ${getProgressColor()}`}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {rating && (
            <Badge variant={rating === 'good' ? 'default' : rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
              {rating}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Bom: &lt;{thresholds.good}{unit} | Ruim: &gt;{thresholds.poor}{unit}
        </div>
      </CardContent>
    </Card>
  );
}

export function WebVitalsMonitor() {
  const { state, actions } = useWebVitals({
    enableReporting: true,
    enableLogging: false,
    reportInterval: 10000,
    thresholds: {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 }
    }
  });

  const metrics = [
    {
      name: 'LCP',
      fullName: 'Largest Contentful Paint',
      value: state.metrics.lcp,
      rating: state.ratings.lcp as 'good' | 'needs-improvement' | 'poor' | null,
      unit: 'ms',
      icon: <Target className="h-4 w-4" />,
      description: 'Tempo para maior elemento visível',
      thresholds: { good: 2500, poor: 4000 }
    },
    {
      name: 'FID',
      fullName: 'First Input Delay',
      value: state.metrics.fid,
      rating: state.ratings.fid as 'good' | 'needs-improvement' | 'poor' | null,
      unit: 'ms',
      icon: <Zap className="h-4 w-4" />,
      description: 'Tempo de resposta primeira interação',
      thresholds: { good: 100, poor: 300 }
    },
    {
      name: 'CLS',
      fullName: 'Cumulative Layout Shift',
      value: state.metrics.cls,
      rating: state.ratings.cls as 'good' | 'needs-improvement' | 'poor' | null,
      unit: '',
      icon: <Activity className="h-4 w-4" />,
      description: 'Estabilidade visual da página',
      thresholds: { good: 0.1, poor: 0.25 }
    },
    {
      name: 'FCP',
      fullName: 'First Contentful Paint',
      value: state.metrics.fcp,
      rating: state.ratings.fcp as 'good' | 'needs-improvement' | 'poor' | null,
      unit: 'ms',
      icon: <Eye className="h-4 w-4" />,
      description: 'Tempo para primeiro conteúdo',
      thresholds: { good: 1800, poor: 3000 }
    },
    {
      name: 'TTFB',
      fullName: 'Time to First Byte',
      value: state.metrics.ttfb,
      rating: state.ratings.ttfb as 'good' | 'needs-improvement' | 'poor' | null,
      unit: 'ms',
      icon: <Clock className="h-4 w-4" />,
      description: 'Tempo para primeiro byte',
      thresholds: { good: 800, poor: 1800 }
    }
  ];

  const overallScore = () => {
    const validRatings = Object.values(state.ratings).filter(rating => rating);
    if (validRatings.length === 0) return null;
    
    const scores = validRatings.map(rating => {
      switch (rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const score = overallScore();

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Web Vitals Monitor</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real das métricas de performance do Core Web Vitals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={actions.resetMetrics}
            disabled={!state.isTracking}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const data = actions.exportData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `web-vitals-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!state.isTracking}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant={state.isTracking ? "destructive" : "default"}
            size="sm"
            onClick={state.isTracking ? actions.stopTracking : actions.startTracking}
          >
            {state.isTracking ? 'Parar' : 'Iniciar'} Monitoramento
          </Button>
        </div>
      </div>

      {/* Score geral */}
      {score !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Score Geral de Performance
            </CardTitle>
            <CardDescription>
              Pontuação baseada nas métricas do Core Web Vitals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {score}/100
            </div>
            <Progress value={score} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Ruim</span>
              <span>Bom</span>
              <span>Excelente</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status do tracking */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`h-2 w-2 rounded-full ${state.isTracking ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-muted-foreground">
          {state.isTracking ? 'Monitoramento ativo' : 'Monitoramento pausado'}
        </span>
        {state.isTracking && (
          <span className="text-xs text-muted-foreground ml-2">
            Última atualização: {new Date(state.metrics.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.name}
            name={metric.name}
            value={metric.value}
            rating={metric.rating}
            unit={metric.unit}
            icon={metric.icon}
            description={metric.description}
            thresholds={metric.thresholds}
          />
        ))}
      </div>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre as Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Métricas de Carregamento</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong>LCP:</strong> Mede quando o maior elemento visível é renderizado</li>
                <li><strong>FCP:</strong> Tempo até o primeiro conteúdo aparecer na tela</li>
                <li><strong>TTFB:</strong> Tempo até o primeiro byte ser recebido do servidor</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Métricas de Interatividade</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong>FID:</strong> Tempo entre primeira interação e resposta do navegador</li>
                <li><strong>CLS:</strong> Medida de mudanças inesperadas no layout</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}