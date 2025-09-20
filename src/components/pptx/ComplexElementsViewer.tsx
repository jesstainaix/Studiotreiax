import React, { useState, useEffect } from 'react';
import { 
  Table, 
  BarChart3, 
  Network, 
  Eye, 
  EyeOff, 
  Download, 
  Filter,
  Search,
  Grid,
  List,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  TableData, 
  ChartData, 
  SmartArtData, 
  ComplexElementsResult 
} from '../../services/complex-elements-extractor';

interface ComplexElementsViewerProps {
  elementsData: ComplexElementsResult;
  onElementSelect?: (elementId: string, type: 'table' | 'chart' | 'smartart') => void;
  onExport?: (elements: any[], format: 'json' | 'csv' | 'xlsx') => void;
}

interface ViewState {
  selectedTab: 'tables' | 'charts' | 'smartarts' | 'all';
  viewMode: 'grid' | 'list';
  searchTerm: string;
  filters: {
    showTables: boolean;
    showCharts: boolean;
    showSmartArts: boolean;
  };
  expandedElements: Set<string>;
}

const ComplexElementsViewer: React.FC<ComplexElementsViewerProps> = ({
  elementsData,
  onElementSelect,
  onExport
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    selectedTab: 'all',
    viewMode: 'grid',
    searchTerm: '',
    filters: {
      showTables: true,
      showCharts: true,
      showSmartArts: true
    },
    expandedElements: new Set()
  });

  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());

  // Filtrar elementos baseado na busca e filtros
  const getFilteredElements = () => {
    const { searchTerm, filters } = viewState;
    let elements: Array<{ id: string; type: 'table' | 'chart' | 'smartart'; data: any }> = [];

    if (filters.showTables) {
      elements.push(...elementsData.tables.map(table => ({ 
        id: table.id, 
        type: 'table' as const, 
        data: table 
      })));
    }

    if (filters.showCharts) {
      elements.push(...elementsData.charts.map(chart => ({ 
        id: chart.id, 
        type: 'chart' as const, 
        data: chart 
      })));
    }

    if (filters.showSmartArts) {
      elements.push(...elementsData.smartArts.map(smartArt => ({ 
        id: smartArt.id, 
        type: 'smartart' as const, 
        data: smartArt 
      })));
    }

    if (searchTerm) {
      elements = elements.filter(element => {
        const searchLower = searchTerm.toLowerCase();
        if (element.type === 'table') {
          return element.data.headers.some((header: string) => 
            header.toLowerCase().includes(searchLower)
          );
        } else if (element.type === 'chart') {
          return element.data.title.toLowerCase().includes(searchLower);
        } else if (element.type === 'smartart') {
          return element.data.nodes.some((node: any) => 
            node.text.toLowerCase().includes(searchLower)
          );
        }
        return false;
      });
    }

    return elements;
  };

  const handleElementToggle = (elementId: string) => {
    const newExpanded = new Set(viewState.expandedElements);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setViewState(prev => ({ ...prev, expandedElements: newExpanded }));
  };

  const handleElementSelect = (elementId: string, type: 'table' | 'chart' | 'smartart') => {
    const newSelected = new Set(selectedElements);
    if (newSelected.has(elementId)) {
      newSelected.delete(elementId);
    } else {
      newSelected.add(elementId);
    }
    setSelectedElements(newSelected);
    onElementSelect?.(elementId, type);
  };

  const handleExport = (format: 'json' | 'csv' | 'xlsx') => {
    const filteredElements = getFilteredElements();
    const selectedData = filteredElements
      .filter(element => selectedElements.has(element.id))
      .map(element => element.data);
    
    onExport?.(selectedData.length > 0 ? selectedData : filteredElements.map(e => e.data), format);
  };

  const renderTablePreview = (table: TableData) => {
    const isExpanded = viewState.expandedElements.has(table.id);
    const isSelected = selectedElements.has(table.id);

    return (
      <div 
        key={table.id} 
        className={`border rounded-lg p-4 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Table className="w-5 h-5 text-green-600" />
            <span className="font-medium">Tabela {table.rows}x{table.columns}</span>
            <button
              onClick={() => handleElementToggle(table.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => handleElementSelect(table.id, 'table')}
            className={`px-3 py-1 rounded text-sm ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selecionada' : 'Selecionar'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {table.headers.map((header, index) => (
                      <th key={index} className="px-3 py-2 border-b text-left font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.data.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 border-b">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.data.length > 3 && (
                <p className="text-xs text-gray-500 mt-2">
                  ... e mais {table.data.length - 3} linhas
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChartPreview = (chart: ChartData) => {
    const isExpanded = viewState.expandedElements.has(chart.id);
    const isSelected = selectedElements.has(chart.id);

    return (
      <div 
        key={chart.id} 
        className={`border rounded-lg p-4 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="font-medium">{chart.title}</span>
            <span className="text-sm text-gray-500 capitalize">({chart.type})</span>
            <button
              onClick={() => handleElementToggle(chart.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => handleElementSelect(chart.id, 'chart')}
            className={`px-3 py-1 rounded text-sm ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selecionado' : 'Selecionar'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Dados:</h4>
                <div className="space-y-1">
                  {chart.data.labels.map((label, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">
                        {chart.data.datasets[0]?.data[index] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Configurações:</h4>
                <div className="text-sm space-y-1">
                  <div>Tipo: <span className="capitalize">{chart.type}</span></div>
                  <div>Legenda: {chart.styling.legendPosition}</div>
                  <div>Tamanho da fonte: {chart.styling.fontSize}px</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSmartArtPreview = (smartArt: SmartArtData) => {
    const isExpanded = viewState.expandedElements.has(smartArt.id);
    const isSelected = selectedElements.has(smartArt.id);

    return (
      <div 
        key={smartArt.id} 
        className={`border rounded-lg p-4 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-purple-600" />
            <span className="font-medium">{smartArt.title}</span>
            <span className="text-sm text-gray-500 capitalize">({smartArt.type})</span>
            <button
              onClick={() => handleElementToggle(smartArt.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => handleElementSelect(smartArt.id, 'smartart')}
            className={`px-3 py-1 rounded text-sm ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selecionado' : 'Selecionar'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3">
            <div className="space-y-2">
              <h4 className="font-medium">Nós ({smartArt.nodes.length}):</h4>
              <div className="grid gap-2">
                {smartArt.nodes.slice(0, 5).map((node, index) => (
                  <div 
                    key={node.id} 
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm"
                  >
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: node.styling.backgroundColor }}
                    ></div>
                    <span>{node.text}</span>
                    {node.connections.length > 0 && (
                      <span className="text-xs text-gray-500">
                        → {node.connections.length} conexão(ões)
                      </span>
                    )}
                  </div>
                ))}
                {smartArt.nodes.length > 5 && (
                  <p className="text-xs text-gray-500">
                    ... e mais {smartArt.nodes.length - 5} nós
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredElements = getFilteredElements();

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header com estatísticas */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Elementos Complexos Extraídos</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Table className="w-5 h-5 text-green-600" />
              <span className="font-medium">Tabelas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{elementsData.tables.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Gráficos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{elementsData.charts.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-purple-600" />
              <span className="font-medium">SmartArt</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{elementsData.smartArts.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{elementsData.extractionStats.totalElements}</p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar elementos..."
              value={viewState.searchTerm}
              onChange={(e) => setViewState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewState(prev => ({ ...prev, viewMode: 'grid' }))}
              className={`p-2 rounded ${
                viewState.viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewState(prev => ({ ...prev, viewMode: 'list' }))}
              className={`p-2 rounded ${
                viewState.viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedElements.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedElements.size} selecionado(s)
              </span>
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <Download className="w-4 h-4 inline mr-1" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                <Download className="w-4 h-4 inline mr-1" />
                CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de elementos */}
      <div className={`space-y-4 ${
        viewState.viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''
      }`}>
        {filteredElements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600">Nenhum elemento encontrado</p>
          </div>
        ) : (
          filteredElements.map(element => {
            if (element.type === 'table') {
              return renderTablePreview(element.data);
            } else if (element.type === 'chart') {
              return renderChartPreview(element.data);
            } else if (element.type === 'smartart') {
              return renderSmartArtPreview(element.data);
            }
            return null;
          })
        )}
      </div>

      {/* Estatísticas de processamento */}
      {elementsData.extractionStats.processingTime > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Estatísticas de Processamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tempo de processamento:</span>
              <p className="font-medium">{elementsData.extractionStats.processingTime}ms</p>
            </div>
            <div>
              <span className="text-gray-600">Elementos encontrados:</span>
              <p className="font-medium">{elementsData.extractionStats.totalElements}</p>
            </div>
            <div>
              <span className="text-gray-600">Taxa de sucesso:</span>
              <p className="font-medium">
                {elementsData.extractionStats.errors.length === 0 ? '100%' : 
                 `${Math.round((elementsData.extractionStats.totalElements / 
                   (elementsData.extractionStats.totalElements + elementsData.extractionStats.errors.length)) * 100)}%`}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Erros:</span>
              <p className="font-medium text-red-600">{elementsData.extractionStats.errors.length}</p>
            </div>
          </div>
          
          {elementsData.extractionStats.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 mb-2">Erros encontrados:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {elementsData.extractionStats.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplexElementsViewer;