import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Circle, Square, Type, Pen, Eraser, 
  Undo, Redo, Save, Download, Upload,
  Palette, Settings, Trash2, Move,
  ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { WhiteboardElement } from '../../hooks/useRealTimeCollaboration';

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[];
  onElementsChange: (elements: WhiteboardElement[]) => void;
  currentUser: { id: string; name: string; color: string } | null;
  isReadOnly?: boolean;
  className?: string;
}

type DrawingTool = 'select' | 'pen' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser';

interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentElement: WhiteboardElement | null;
  selectedElement: WhiteboardElement | null;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  elements,
  onElementsChange,
  currentUser,
  isReadOnly = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentElement: null,
    selectedElement: null
  });

  // Salvar no histórico
  const saveToHistory = useCallback((newElements: WhiteboardElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Desfazer
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onElementsChange(history[historyIndex - 1]);
    }
  }, [historyIndex, history, onElementsChange]);

  // Refazer
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onElementsChange(history[historyIndex + 1]);
    }
  }, [historyIndex, history, onElementsChange]);

  // Converter coordenadas do mouse para coordenadas do canvas
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  }, [zoom, pan]);

  // Gerar ID único
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Iniciar desenho
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly || !currentUser) return;
    
    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    
    if (selectedTool === 'select') {
      // Verificar se clicou em algum elemento
      const clickedElement = elements.find(element => 
        coords.x >= element.position.x &&
        coords.x <= element.position.x + element.size.width &&
        coords.y >= element.position.y &&
        coords.y <= element.position.y + element.size.height
      );
      
      setDrawingState(prev => ({
        ...prev,
        selectedElement: clickedElement || null
      }));
      return;
    }
    
    if (selectedTool === 'eraser') {
      // Apagar elemento clicado
      const elementToErase = elements.find(element => 
        coords.x >= element.position.x &&
        coords.x <= element.position.x + element.size.width &&
        coords.y >= element.position.y &&
        coords.y <= element.position.y + element.size.height
      );
      
      if (elementToErase) {
        const newElements = elements.filter(el => el.id !== elementToErase.id);
        onElementsChange(newElements);
        saveToHistory(newElements);
      }
      return;
    }
    
    const newElement: WhiteboardElement = {
      id: generateId(),
      type: selectedTool as any,
      position: coords,
      size: { width: 0, height: 0 },
      style: {
        stroke: strokeColor,
        fill: fillColor === '#transparent' ? 'transparent' : fillColor,
        strokeWidth,
        fontSize: selectedTool === 'text' ? fontSize : undefined
      },
      content: selectedTool === 'text' ? 'Texto' : undefined,
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setDrawingState({
      isDrawing: true,
      startPoint: coords,
      currentElement: newElement,
      selectedElement: null
    });
  }, [isReadOnly, currentUser, selectedTool, getCanvasCoordinates, elements, strokeColor, fillColor, strokeWidth, fontSize, onElementsChange, saveToHistory]);

  // Continuar desenho
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentElement) return;
    
    const coords = getCanvasCoordinates(event.clientX, event.clientY);
    
    const updatedElement: WhiteboardElement = {
      ...drawingState.currentElement,
      size: {
        width: Math.abs(coords.x - drawingState.startPoint.x),
        height: Math.abs(coords.y - drawingState.startPoint.y)
      },
      position: {
        x: Math.min(coords.x, drawingState.startPoint.x),
        y: Math.min(coords.y, drawingState.startPoint.y)
      },
      updatedAt: new Date()
    };
    
    setDrawingState(prev => ({
      ...prev,
      currentElement: updatedElement
    }));
  }, [drawingState, getCanvasCoordinates]);

  // Finalizar desenho
  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !drawingState.currentElement) return;
    
    const newElements = [...elements, drawingState.currentElement];
    onElementsChange(newElements);
    saveToHistory(newElements);
    
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentElement: null,
      selectedElement: null
    });
  }, [drawingState, elements, onElementsChange, saveToHistory]);

  // Renderizar elementos no canvas
  const renderElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar transformações
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x / zoom, pan.y / zoom);
    
    // Renderizar elementos
    const allElements = [...elements];
    if (drawingState.currentElement) {
      allElements.push(drawingState.currentElement);
    }
    
    allElements.forEach(element => {
      ctx.strokeStyle = element.style.stroke || '#000000';
      ctx.fillStyle = element.style.fill || 'transparent';
      ctx.lineWidth = element.style.strokeWidth || 1;
      
      switch (element.type) {
        case 'rectangle':
          if (element.style.fill && element.style.fill !== 'transparent') {
            ctx.fillRect(element.position.x, element.position.y, element.size.width, element.size.height);
          }
          ctx.strokeRect(element.position.x, element.position.y, element.size.width, element.size.height);
          break;
          
        case 'circle':
          const centerX = element.position.x + element.size.width / 2;
          const centerY = element.position.y + element.size.height / 2;
          const radius = Math.min(element.size.width, element.size.height) / 2;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          if (element.style.fill && element.style.fill !== 'transparent') {
            ctx.fill();
          }
          ctx.stroke();
          break;
          
        case 'line':
          ctx.beginPath();
          ctx.moveTo(element.position.x, element.position.y);
          ctx.lineTo(element.position.x + element.size.width, element.position.y + element.size.height);
          ctx.stroke();
          break;
          
        case 'text':
          ctx.font = `${element.style.fontSize || 16}px Arial`;
          ctx.fillStyle = element.style.stroke || '#000000';
          ctx.fillText(element.content || '', element.position.x, element.position.y + (element.style.fontSize || 16));
          break;
      }
      
      // Destacar elemento selecionado
      if (drawingState.selectedElement?.id === element.id) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          element.position.x - 5,
          element.position.y - 5,
          element.size.width + 10,
          element.size.height + 10
        );
        ctx.setLineDash([]);
      }
    });
    
    ctx.restore();
  }, [elements, drawingState, zoom, pan]);

  // Atualizar canvas quando elementos mudarem
  useEffect(() => {
    renderElements();
  }, [renderElements]);

  // Redimensionar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        renderElements();
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [renderElements]);

  // Salvar como imagem
  const saveAsImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  // Limpar quadro
  const clearBoard = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar todo o quadro?')) {
      onElementsChange([]);
      saveToHistory([]);
    }
  }, [onElementsChange, saveToHistory]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {/* Ferramentas de desenho */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
            {[
              { tool: 'select', icon: Move, label: 'Selecionar' },
              { tool: 'pen', icon: Pen, label: 'Caneta' },
              { tool: 'rectangle', icon: Square, label: 'Retângulo' },
              { tool: 'circle', icon: Circle, label: 'Círculo' },
              { tool: 'text', icon: Type, label: 'Texto' },
              { tool: 'eraser', icon: Eraser, label: 'Borracha' }
            ].map(({ tool, icon: Icon, label }) => (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool as DrawingTool)}
                className={`p-2 rounded transition-colors ${
                  selectedTool === tool
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
                title={label}
                disabled={isReadOnly}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          
          {/* Controles de cor e espessura */}
          <div className="flex items-center space-x-2 border-r border-gray-300 pr-2">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-8 h-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: strokeColor }}
                title="Cor do traço"
                disabled={isReadOnly}
              />
              {showColorPicker && (
                <div className="absolute top-10 left-0 z-10 bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {[
                      '#000000', '#FF0000', '#00FF00', '#0000FF',
                      '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
                      '#800080', '#008000', '#000080', '#808080'
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          setStrokeColor(color);
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={isReadOnly}
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={4}>4px</option>
              <option value={6}>6px</option>
              <option value={8}>8px</option>
            </select>
          </div>
          
          {/* Controles de histórico */}
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0 || isReadOnly}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Desfazer"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1 || isReadOnly}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refazer"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Controles de zoom e ações */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="p-1 rounded hover:bg-gray-100"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="p-1 rounded hover:bg-gray-100"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1 rounded hover:bg-gray-100"
              title="Resetar zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={saveAsImage}
              className="p-2 rounded hover:bg-gray-100"
              title="Salvar como imagem"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={clearBoard}
              className="p-2 rounded hover:bg-gray-100 text-red-600"
              title="Limpar quadro"
              disabled={isReadOnly}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      {/* Status */}
      <div className="flex items-center justify-between p-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
        <div>Elementos: {elements.length}</div>
        <div>Ferramenta: {selectedTool}</div>
        <div>Zoom: {Math.round(zoom * 100)}%</div>
      </div>
    </div>
  );
};

export default WhiteboardCanvas;