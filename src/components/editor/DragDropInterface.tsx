import React, { useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, X, Eye, Move, Grip } from 'lucide-react';

export interface DragDropItem {
  id: string;
  type: 'effect' | 'transition';
  name: string;
  icon?: React.ReactNode;
  data: any;
}

export interface DropZone {
  id: string;
  type: 'clip' | 'transition-point';
  clipId?: string;
  position?: number;
  accepts: ('effect' | 'transition')[];
}

export interface DragDropInterfaceProps {
  items: DragDropItem[];
  dropZones: DropZone[];
  onDrop: (item: DragDropItem, zone: DropZone) => void;
  onRemove?: (itemId: string, zoneId: string) => void;
  onPreview?: (item: DragDropItem) => void;
  appliedItems?: { [zoneId: string]: DragDropItem[] };
  className?: string;
}

interface DragState {
  isDragging: boolean;
  draggedItem?: DragDropItem;
  draggedFromZone?: string;
  hoveredZone?: string;
}

const DragDropInterface: React.FC<DragDropInterfaceProps> = ({
  items,
  dropZones,
  onDrop,
  onRemove,
  onPreview,
  appliedItems = {},
  className = ''
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false
  });
  
  const dragOverlayRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleDragStart = useCallback((item: DragDropItem, fromZone?: string) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      draggedFromZone: fromZone
    });
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: undefined,
      draggedFromZone: undefined,
      hoveredZone: undefined
    });
  }, []);

  // Handle drop
  const handleDrop = useCallback((targetZone: DropZone) => {
    const { draggedItem, draggedFromZone } = dragState;
    
    if (!draggedItem) return;
    
    // Check if the zone accepts this type of item
    if (!targetZone.accepts.includes(draggedItem.type)) {
      handleDragEnd();
      return;
    }
    
    // If moving from another zone, remove from original
    if (draggedFromZone && onRemove) {
      onRemove(draggedItem.id, draggedFromZone);
    }
    
    // Add to new zone
    onDrop(draggedItem, targetZone);
    handleDragEnd();
  }, [dragState, onDrop, onRemove, handleDragEnd]);

  // Handle zone hover
  const handleZoneHover = useCallback((zoneId: string) => {
    setDragState(prev => ({
      ...prev,
      hoveredZone: zoneId
    }));
  }, []);

  // Handle zone leave
  const handleZoneLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      hoveredZone: undefined
    }));
  }, []);

  // Check if zone can accept current dragged item
  const canAcceptDrop = useCallback((zone: DropZone) => {
    const { draggedItem } = dragState;
    return draggedItem && zone.accepts.includes(draggedItem.type);
  }, [dragState]);

  // Render draggable item
  const renderDraggableItem = useCallback((item: DragDropItem, fromZone?: string, index?: number) => {
    return (
      <div
        key={`${item.id}-${fromZone || 'source'}`}
        className="group relative bg-gray-800 rounded-lg border border-gray-700 p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all"
        draggable
        onDragStart={() => handleDragStart(item, fromZone)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grip className="w-4 h-4 text-gray-500" />
            {item.icon && <div className="text-gray-400">{item.icon}</div>}
            <span className="text-sm font-medium text-white truncate">
              {item.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(item);
                }}
                className="p-1 hover:bg-gray-700 rounded"
                title="Preview"
              >
                <Eye className="w-3 h-3 text-gray-400" />
              </button>
            )}
            
            {fromZone && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id, fromZone);
                }}
                className="p-1 hover:bg-gray-700 rounded"
                title="Remove"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Type indicator */}
        <div className="mt-2">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            item.type === 'effect' 
              ? 'bg-blue-900/50 text-blue-300' 
              : 'bg-purple-900/50 text-purple-300'
          }`}>
            {item.type === 'effect' ? 'Efeito' : 'Transição'}
          </span>
        </div>
      </div>
    );
  }, [handleDragStart, handleDragEnd, onPreview, onRemove]);

  // Render drop zone
  const renderDropZone = useCallback((zone: DropZone) => {
    const isHovered = dragState.hoveredZone === zone.id;
    const canAccept = canAcceptDrop(zone);
    const zoneItems = appliedItems[zone.id] || [];
    
    return (
      <div
        key={zone.id}
        className={`min-h-[100px] border-2 border-dashed rounded-lg p-4 transition-all ${
          isHovered && canAccept
            ? 'border-blue-500 bg-blue-500/10'
            : isHovered
            ? 'border-red-500 bg-red-500/10'
            : dragState.isDragging && canAccept
            ? 'border-gray-500 bg-gray-500/10'
            : 'border-gray-700 bg-gray-800/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          handleZoneHover(zone.id);
        }}
        onDragLeave={handleZoneLeave}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(zone);
        }}
      >
        {/* Zone header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              {zone.type === 'clip' ? `Clip ${zone.clipId}` : 'Ponto de Transição'}
            </span>
          </div>
          
          <div className="flex space-x-1">
            {zone.accepts.map(type => (
              <span
                key={type}
                className={`px-2 py-1 text-xs rounded-full ${
                  type === 'effect'
                    ? 'bg-blue-900/30 text-blue-400'
                    : 'bg-purple-900/30 text-purple-400'
                }`}
              >
                {type === 'effect' ? 'Efeitos' : 'Transições'}
              </span>
            ))}
          </div>
        </div>
        
        {/* Applied items */}
        <div className="space-y-2">
          {zoneItems.map((item, index) => 
            renderDraggableItem(item, zone.id, index)
          )}
        </div>
        
        {/* Drop hint */}
        {zoneItems.length === 0 && (
          <div className="text-center py-6">
            {dragState.isDragging && canAccept ? (
              <div className="text-blue-400">
                <Plus className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Solte aqui para aplicar</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <Plus className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">
                  Arraste {zone.accepts.join(' ou ')} aqui
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Invalid drop indicator */}
        {isHovered && !canAccept && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
            <div className="text-center text-red-400">
              <X className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Tipo não aceito</p>
            </div>
          </div>
        )}
      </div>
    );
  }, [dragState, canAcceptDrop, appliedItems, handleZoneHover, handleZoneLeave, handleDrop, renderDraggableItem]);

  return (
    <div className={`drag-drop-interface ${className}`}>
      {/* Source Items Panel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Biblioteca de Efeitos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => renderDraggableItem(item))}
        </div>
      </div>
      
      {/* Drop Zones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Timeline - Aplicar Efeitos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dropZones.map(zone => renderDropZone(zone))}
        </div>
      </div>
      
      {/* Drag Overlay */}
      {dragState.isDragging && dragState.draggedItem && (
        <div
          ref={dragOverlayRef}
          className="fixed pointer-events-none z-50 opacity-80"
          style={{
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              {dragState.draggedItem.icon && (
                <div className="text-gray-400">{dragState.draggedItem.icon}</div>
              )}
              <span className="text-sm font-medium text-white">
                {dragState.draggedItem.name}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropInterface;