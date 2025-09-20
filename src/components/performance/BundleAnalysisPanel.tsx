import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  Package,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Zap,
  Target,
  Settings,
  Info,
  Lightbulb
} from 'lucide-react';
import { useBundleAnalysis } from '../../hooks/useRealBundleAnalysis';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function BundleAnalysisPanel() {
  const { state, actions } = useBundleAnalysis();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Auto-analyze on component mount
  useEffect(() => {
    if (!state.analysis && !state.isAnalyzing) {
      actions.analyzeBundle();
    }
  }, [state.analysis, state.isAnalyzing, actions]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getChunkTypeColor = (type: string): string => {
    switch (type) {
      case 'entry': return '#ef4444';
      case 'vendor': return '#3b82f6';
      case 'async': return '#10b981';
      case 'runtime': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const chunkData = state.chunks.map(chunk => ({
    name: chunk.name,
    size: chunk.size,
    gzippedSize: chunk.gzippedSize || chunk.size * 0.3,
    type: chunk.type || 'unknown'
  }));

  const dependencyData = state.dependencies
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(dep => ({
      name: dep.name.length > 20 ? dep.name.slice(0, 20) + '...' : dep.name,
      size: dep.size,
      usage: dep.usage || Math.random() * 100
    }));

  const historicalData = state.historicalData
    .slice(-10)
    .map(entry => ({
      date: entry.date.toLocaleDateString(),
      totalSize: entry.totalSize / 1024 / 1024, // Convert to MB
      gzippedSize: entry.gzippedSize / 1024 / 1024,
      chunkCount: entry.chunkCount
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Bundle</h2>
          <p className="text-muted-foreground">
            Análise detalhada do tamanho e composição do bundle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={actions.analyzeDependencies}
            disabled={state.isAnalyzing}
          >
            <Package className="h-4 w-4 mr-2" />
            Analisar Dependências
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const report = actions.generateReport();
              const blob = new Blob([report], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `bundle-analysis-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!state.analysis}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button
            onClick={actions.analyzeBundle}
            disabled={state.isAnalyzing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${state.isAnalyzing ? 'animate-spin' : ''}`} />
            {state.isAnalyzing ? 'Analisando...' : 'Analisar Bundle'}
          </Button>
        </div>
      </div>

      {/* Status and Quick Stats */}
      {state.analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(state.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Comprimido: {formatBytes(state.gzippedSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chunks</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.chunks.length}</div>
              <p className="text-xs text-muted-foreground">
                Maior: {formatBytes(Math.max(...state.chunks.map(c => c.size)))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dependências</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.dependencies.length}</div>
              <p className="text-xs text-muted-foreground">
                Tamanho médio: {formatBytes(state.dependencies.reduce((acc, dep) => acc + dep.size, 0) / state.dependencies.length || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avisos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.warnings.length}</div>
              <p className="text-xs text-muted-foreground">
                {state.warnings.filter(w => w.severity === 'high').length} críticos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compression Ratio */}
      {state.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Taxa de Compressão
            </CardTitle>
            <CardDescription>
              Eficiência da compressão do bundle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Original: {formatBytes(state.totalSize)}</span>
                <span className="text-sm">Comprimido: {formatBytes(state.gzippedSize)}</span>
              </div>
              <Progress 
                value={(state.gzippedSize / state.totalSize) * 100} 
                className="h-3"
              />
              <div className="text-center">
                <span className="text-2xl font-bold">
                  {((1 - state.gzippedSize / state.totalSize) * 100).toFixed(1)}%
                </span>
                <p className="text-sm text-muted-foreground">economia de espaço</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed analysis */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="chunks">Chunks</TabsTrigger>
          <TabsTrigger value="dependencies">Dependências</TabsTrigger>
          <TabsTrigger value="warnings">Avisos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chunk Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Tamanho dos chunks por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chunkData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="size"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chunkData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getChunkTypeColor(entry.type)} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatBytes(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Dependencies */}
            <Card>
              <CardHeader>
                <CardTitle>Maiores Dependências</CardTitle>
                <CardDescription>Top 10 bibliotecas por tamanho</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dependencyData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatBytes} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value: number) => formatBytes(value)} />
                    <Bar dataKey="size" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chunks" className="space-y-4">
          <div className="grid gap-4">
            {state.chunks.map((chunk, index) => (
              <Card key={chunk.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full`} style={{ backgroundColor: getChunkTypeColor(chunk.type || 'unknown') }} />
                      <div>
                        <h4 className="font-medium">{chunk.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {chunk.type || 'unknown'} • {chunk.modules?.length || 0} módulos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatBytes(chunk.size)}</div>
                      <div className="text-sm text-muted-foreground">
                        Comprimido: {formatBytes(chunk.gzippedSize || chunk.size * 0.3)}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(chunk.size / state.totalSize) * 100} 
                    className="h-2 mt-3"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <div className="grid gap-4">
            {state.dependencies.map((dep, index) => (
              <Card key={dep.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{dep.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        v{dep.version} • {((dep.usage || 0) * 100).toFixed(1)}% utilizado
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatBytes(dep.size)}</div>
                      <Badge variant={dep.size > 100000 ? 'destructive' : dep.size > 50000 ? 'secondary' : 'outline'}>
                        {dep.size > 100000 ? 'Grande' : dep.size > 50000 ? 'Médio' : 'Pequeno'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          {state.warnings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum aviso encontrado</h3>
                <p className="text-muted-foreground">
                  Seu bundle está bem otimizado!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {state.warnings.map((warning) => (
                <Alert key={warning.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{warning.message}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {warning.details}
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          💡 {warning.suggestion}
                        </p>
                      </div>
                      <Badge variant={getSeverityColor(warning.severity) as any}>
                        {warning.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {state.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Sugestões de Otimização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {state.suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{suggestion.description}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={suggestion.impact === 'high' ? 'default' : suggestion.impact === 'medium' ? 'secondary' : 'outline'}>
                            {suggestion.impact} impacto
                          </Badge>
                          <Badge variant="outline">
                            {suggestion.effort}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.implementation}
                      </p>
                      <p className="text-sm text-green-600">
                        📈 Economia estimada: {suggestion.estimatedSavings}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historicalData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Tamanho do Bundle</CardTitle>
                <CardDescription>
                  Acompanhe como o tamanho do bundle mudou ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)}MB`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)}MB`, 
                        name === 'totalSize' ? 'Tamanho Total' : 'Comprimido'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalSize" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Tamanho Total"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gzippedSize" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Comprimido"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Histórico não disponível</h3>
                <p className="text-muted-foreground">
                  Execute mais análises para ver a evolução do bundle
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={actions.clearHistory}
              disabled={historicalData.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}