import React from 'react';
import { createPortal } from 'react-dom';
import { DraggedEffect, DropTarget } from '../../hooks/useEffectDragDrop';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';

interface DragPreviewProps {
  draggedEffect: DraggedEffect | null;
  dropTarget: DropTarget | null;
  isDragging: boolean;
  canDrop?: boolean;
  feedbackMessage?: string;
}

export const DragPreview: React.FC<DragPreviewProps> = ({
  draggedEffect,
  dropTarget,
  isDragging,
  canDrop = true,
  feedbackMessage
}) => {
  if (!isDragging || !draggedEffect) return null;

  return createPortal(
    <>
      {/* Preview do efeito sendo arrastado */}
      <div
        className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: '0px',
          top: '0px'
        }}
      >
        <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-3 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium text-sm">{draggedEffect.name}</span>
          </div>
          
          <div className="text-xs text-gray-400 mb-2">
            {draggedEffect.category}
          </div>
          
          {draggedEffect.preview && (
            <div className="w-full h-16 bg-gray-800 rounded border overflow-hidden">
              <img 
                src={draggedEffect.preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Feedback de drop */}
      {dropTarget && feedbackMessage && (
        <div className="fixed pointer-events-none z-40 bg-black/80 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          {canDrop ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          {feedbackMessage}
        </div>
      )}

      {/* Overlay de drop zones */}
      {dropTarget && (
        <style>{`
          [data-clip-id="${dropTarget.clipId}"] {
            box-shadow: 0 0 0 2px ${canDrop ? '#10b981' : '#ef4444'} !important;
            z-index: 10 !important;
          }
        `}</style>
      )}
    </>,
    document.body
  );
};

// Componente para indicar zonas de drop válidas
export const DropZoneIndicator: React.FC<{
  isActive: boolean;
  canDrop: boolean;
  children: React.ReactNode;
}> = ({ isActive, canDrop, children }) => {
  return (
    <div 
      className={`relative transition-all duration-200 ${
        isActive 
          ? canDrop 
            ? 'ring-2 ring-green-400 ring-opacity-75 bg-green-400/10' 
            : 'ring-2 ring-red-400 ring-opacity-75 bg-red-400/10'
          : ''
      }`}
    >
      {children}
      
      {isActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            canDrop 
              ? 'bg-green-400 text-green-900' 
              : 'bg-red-400 text-red-900'
          }`}>
            {canDrop ? 'Soltar aqui' : 'Incompatível'}
          </div>
        </div>
      )}
    </div>
  );
};