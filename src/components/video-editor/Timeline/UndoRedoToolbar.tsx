import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { 
  Undo2, 
  Redo2, 
  History, 
  Clock,
  Save,
  RotateCcw 
} from 'lucide-react';
import { useCommandManager } from '../../../hooks/useCommandManager';
import { commandManager } from '../../../utils/commandManager';
import { toast } from 'sonner';

interface UndoRedoToolbarProps {
  className?: string;
  onStateChange?: (state: any) => void;
  showHistoryPanel?: boolean;
  onToggleHistoryPanel?: () => void;
}

export const UndoRedoToolbar: React.FC<UndoRedoToolbarProps> = ({
  className = '',
  onStateChange,
  showHistoryPanel = false,
  onToggleHistoryPanel
}) => {
  const {
    undo,
    redo,
    getHistoryState,
    clearHistory
  } = useCommandManager();

  const [commandState, setCommandState] = useState(() => getHistoryState());
  const [performanceMetrics, setPerformanceMetrics] = useState(() => 
    commandManager.getPerformanceMetrics()
  );

  // Update state when commands change
  useEffect(() => {
    const updateState = () => {
      const newState = getHistoryState();
      const newMetrics = commandManager.getPerformanceMetrics();
      
      setCommandState(newState);
      setPerformanceMetrics(newMetrics);
      
      if (onStateChange) {
        onStateChange({
          ...newState,
          metrics: newMetrics
        });
      }
    };

    // Listen for command events
    const handleCommandEvent = () => updateState();
    
    // Update state periodically (for real-time metrics)
    const interval = setInterval(updateState, 1000);
    
    // Listen to command manager events if available
    // Note: We'd need to add event emitter to CommandManager for real-time updates
    
    return () => {
      clearInterval(interval);
    };
  }, [getHistoryState, onStateChange]);

  const handleUndo = async () => {
    try {
      const success = await undo();
      if (success) {
        toast.success('Ação desfeita com sucesso', {
          description: commandState.undoDescription || 'Última ação revertida'
        });
      } else {
        toast.warning('Não foi possível desfazer a ação');
      }
    } catch (error) {
      console.error('Erro ao desfazer:', error);
      toast.error('Erro ao desfazer a ação');
    }
  };

  const handleRedo = async () => {
    try {
      const success = await redo();
      if (success) {
        toast.success('Ação refeita com sucesso', {
          description: commandState.redoDescription || 'Ação restaurada'
        });
      } else {
        toast.warning('Não foi possível refazer a ação');
      }
    } catch (error) {
      console.error('Erro ao refazer:', error);
      toast.error('Erro ao refazer a ação');
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    toast.info('Histórico de comandos limpo', {
      description: 'Todas as ações de undo/redo foram removidas'
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        if (commandState.canUndo) {
          handleUndo();
        }
      } else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (commandState.canRedo) {
          handleRedo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandState.canUndo, commandState.canRedo]);

  return (
    <div className={`flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg p-2 ${className}`}>
      {/* Undo Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!commandState.canUndo}
        onClick={handleUndo}
        title={`Desfazer: ${commandState.undoDescription || 'Ctrl+Z'}`}
        className="text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Undo2 className="w-4 h-4" />
      </Button>

      {/* Redo Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!commandState.canRedo}
        onClick={handleRedo}
        title={`Refazer: ${commandState.redoDescription || 'Ctrl+Y'}`}
        className="text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Redo2 className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 bg-gray-600" />

      {/* History Info */}
      <div className="flex items-center space-x-2 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{commandState.historySize || 0}</span>
        {commandState.hasUnsavedChanges && (
          <Badge variant="outline" className="text-xs bg-yellow-600/20 text-yellow-400 border-yellow-600">
            Não salvo
          </Badge>
        )}
      </div>

      {/* History Panel Toggle */}
      {onToggleHistoryPanel && (
        <>
          <Separator orientation="vertical" className="h-6 bg-gray-600" />
          <Button
            variant={showHistoryPanel ? "default" : "ghost"}
            size="sm"
            onClick={onToggleHistoryPanel}
            title="Mostrar/Ocultar Painel de Histórico"
            className="text-gray-300 hover:text-white"
          >
            <History className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Performance Badge */}
      {performanceMetrics.commandsExecuted > 0 && (
        <Badge variant="outline" className="text-xs">
          {performanceMetrics.commandsExecuted} ops
        </Badge>
      )}

      {/* Clear History (Hidden by default, show on hover) */}
      <div className="opacity-0 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          title="Limpar Histórico"
          className="text-red-400 hover:text-red-300"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default UndoRedoToolbar;