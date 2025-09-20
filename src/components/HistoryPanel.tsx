import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Undo2,
  Redo2,
  History,
  Trash2,
  Clock,
  Layers,
  Plus,
  Minus,
  Move,
  Copy,
  Settings,
  Eye,
  Volume2
} from 'lucide-react';
import { HistoryAction, HistoryState } from '@/hooks/useHistory';

interface HistoryPanelProps {
  historyState: HistoryState<any>;
  onUndo: () => void;
  onRedo: () => void;
  onClearHistory: () => void;
  onJumpToAction?: (actionIndex: number) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  historyState,
  onUndo,
  onRedo,
  onClearHistory,
  onJumpToAction
}) => {
  const { canUndo, canRedo, history, undoStack, redoStack } = historyState;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        if (canUndo) onUndo();
      } else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo) onRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'ADD_LAYER':
        return <Plus className="w-3 h-3" />;
      case 'REMOVE_LAYER':
        return <Minus className="w-3 h-3" />;
      case 'UPDATE_LAYER':
        return <Settings className="w-3 h-3" />;
      case 'MOVE_LAYER':
        return <Move className="w-3 h-3" />;
      case 'DUPLICATE_LAYER':
        return <Copy className="w-3 h-3" />;
      case 'TOGGLE_VISIBILITY':
        return <Eye className="w-3 h-3" />;
      case 'ADJUST_VOLUME':
        return <Volume2 className="w-3 h-3" />;
      default:
        return <Layers className="w-3 h-3" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'ADD_LAYER':
        return 'text-green-600';
      case 'REMOVE_LAYER':
        return 'text-red-600';
      case 'UPDATE_LAYER':
        return 'text-blue-600';
      case 'MOVE_LAYER':
        return 'text-purple-600';
      case 'DUPLICATE_LAYER':
        return 'text-orange-600';
      case 'TOGGLE_VISIBILITY':
        return 'text-gray-600';
      case 'ADJUST_VOLUME':
        return 'text-indigo-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Agora mesmo';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m atrás`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h atrás`;
    } else {
      return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const currentActionIndex = undoStack.length - 1;
  const allActions = [...undoStack, ...redoStack.slice().reverse()];

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <h3 className="font-medium">Histórico</h3>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onClearHistory}
            disabled={history.length === 0}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1"
          >
            <Undo2 className="w-3 h-3 mr-1" />
            Desfazer
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1"
          >
            <Redo2 className="w-3 h-3 mr-1" />
            Refazer
          </Button>
        </div>

        {(canUndo || canRedo) && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Ctrl+Z para desfazer • Ctrl+Y para refazer
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma ação realizada</p>
            <p className="text-xs mt-1">As ações aparecerão aqui conforme você edita</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {allActions.map((action, index) => {
                const isCurrentAction = index === currentActionIndex;
                const isUndoAction = index <= currentActionIndex;
                const isRedoAction = index > currentActionIndex;
                
                return (
                  <div
                    key={action.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isCurrentAction
                        ? 'border-blue-500 bg-blue-50'
                        : isUndoAction
                        ? 'border-gray-200 bg-white hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 opacity-60 hover:opacity-80'
                    }`}
                    onClick={() => onJumpToAction?.(index)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 ${getActionColor(action.type)}`}>
                        {getActionIcon(action.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {action.description}
                          </p>
                          
                          {isCurrentAction && (
                            <div className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Atual
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTime(action.timestamp)}
                          </span>
                          
                          <span className="text-xs text-gray-400">•</span>
                          
                          <span className="text-xs text-gray-500 capitalize">
                            {action.type.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {history.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{undoStack.length} ações realizadas</span>
            <span>{redoStack.length} ações para refazer</span>
          </div>
          
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all"
              style={{ 
                width: `${allActions.length > 0 ? ((currentActionIndex + 1) / allActions.length) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default HistoryPanel;