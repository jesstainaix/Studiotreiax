import { useState, useCallback, useRef } from 'react';
import { useTimeline } from '../components/editor/Timeline';

export interface DraggedEffect {
  id: string;
  name: string;
  type: string;
  category: string;
  parameters: any;
  preview?: string;
}

export interface DropTarget {
  clipId: string;
  trackId: string;
  position: { x: number; y: number };
}

export const useEffectDragDrop = () => {
  const [draggedEffect, setDraggedEffect] = useState<DraggedEffect | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  
  const { updateClip } = useTimeline();

  // Iniciar drag de efeito
  const startEffectDrag = useCallback((effect: DraggedEffect, event: React.MouseEvent) => {
    setDraggedEffect(effect);
    setIsDragging(true);
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    
    // Prevenir seleção de texto durante o drag
    event.preventDefault();
  }, []);

  // Finalizar drag
  const endEffectDrag = useCallback(() => {
    if (draggedEffect && dropTarget) {
      // Aplicar efeito ao clipe
      updateClip(dropTarget.clipId, {
        effects: (clip) => {
          const currentEffects = clip.effects || [];
          if (!currentEffects.includes(draggedEffect.id)) {
            return [...currentEffects, draggedEffect.id];
          }
          return currentEffects;
        }
      });
    }
    
    setDraggedEffect(null);
    setDropTarget(null);
    setIsDragging(false);
  }, [draggedEffect, dropTarget, updateClip]);

  // Cancelar drag
  const cancelEffectDrag = useCallback(() => {
    setDraggedEffect(null);
    setDropTarget(null);
    setIsDragging(false);
  }, []);

  // Detectar drop target válido
  const detectDropTarget = useCallback((event: MouseEvent): DropTarget | null => {
    const timelineElement = document.querySelector('.timeline-tracks');
    if (!timelineElement) return null;
    
    const rect = timelineElement.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    
    // Encontrar o clipe sob o cursor
    const clipElements = timelineElement.querySelectorAll('[data-clip-id]');
    
    for (const clipEl of clipElements) {
      const clipRect = clipEl.getBoundingClientRect();
      const timelineRect = timelineElement.getBoundingClientRect();
      
      const clipRelativeX = clipRect.left - timelineRect.left;
      const clipRelativeY = clipRect.top - timelineRect.top;
      
      if (
        relativeX >= clipRelativeX &&
        relativeX <= clipRelativeX + clipRect.width &&
        relativeY >= clipRelativeY &&
        relativeY <= clipRelativeY + clipRect.height
      ) {
        const clipId = clipEl.getAttribute('data-clip-id');
        const trackId = clipEl.getAttribute('data-track-id');
        
        if (clipId && trackId) {
          return {
            clipId,
            trackId,
            position: { x: relativeX, y: relativeY }
          };
        }
      }
    }
    
    return null;
  }, []);

  // Atualizar posição do drag
  const updateDragPosition = useCallback((event: MouseEvent) => {
    if (!isDragging || !dragPreviewRef.current) return;
    
    const preview = dragPreviewRef.current;
    preview.style.left = `${event.clientX - dragOffset.x}px`;
    preview.style.top = `${event.clientY - dragOffset.y}px`;
    
    // Detectar drop target
    const target = detectDropTarget(event);
    setDropTarget(target);
  }, [isDragging, dragOffset, detectDropTarget]);

  // Verificar se um clipe pode receber o efeito
  const canDropOnClip = useCallback((clipId: string, effect: DraggedEffect): boolean => {
    // Lógica para verificar compatibilidade
    // Por exemplo, efeitos de áudio só podem ser aplicados a clipes de áudio
    return true; // Simplificado por enquanto
  }, []);

  // Obter feedback visual do drop
  const getDropFeedback = useCallback((target: DropTarget | null) => {
    if (!target || !draggedEffect) return null;
    
    const canDrop = canDropOnClip(target.clipId, draggedEffect);
    
    return {
      canDrop,
      message: canDrop 
        ? `Aplicar ${draggedEffect.name} ao clipe`
        : `${draggedEffect.name} não é compatível com este clipe`
    };
  }, [draggedEffect, canDropOnClip]);

  return {
    // Estado
    draggedEffect,
    dropTarget,
    isDragging,
    dragOffset,
    dragPreviewRef,
    
    // Ações
    startEffectDrag,
    endEffectDrag,
    cancelEffectDrag,
    updateDragPosition,
    
    // Utilitários
    canDropOnClip,
    getDropFeedback
  };
};