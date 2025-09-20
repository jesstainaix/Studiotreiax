import React from 'react';
import { X, Keyboard, Zap, Play, Edit, Navigation, Layers, Settings } from 'lucide-react';
import { Button } from '../../ui/button';
import { TIMELINE_SHORTCUTS_REFERENCE } from './TimelineShortcuts';

interface ShortcutsHelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpPanel: React.FC<ShortcutsHelpPanelProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcutCategories = [
    {
      title: 'Reprodução',
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      shortcuts: TIMELINE_SHORTCUTS_REFERENCE.playback
    },
    {
      title: 'Edição',
      icon: Edit,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      shortcuts: TIMELINE_SHORTCUTS_REFERENCE.editing
    },
    {
      title: 'Timeline',
      icon: Navigation,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      shortcuts: TIMELINE_SHORTCUTS_REFERENCE.timeline
    },
    {
      title: 'Faixas',
      icon: Layers,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      shortcuts: TIMELINE_SHORTCUTS_REFERENCE.tracks
    },
    {
      title: 'Avançado',
      icon: Settings,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      shortcuts: TIMELINE_SHORTCUTS_REFERENCE.advanced
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Atalhos de Teclado
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Acelere sua edição com atalhos profissionais
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shortcutCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="space-y-4">
                  {/* Category Header */}
                  <div className={`flex items-center space-x-3 p-3 rounded-lg ${category.bgColor}`}>
                    <Icon className={`w-5 h-5 ${category.color}`} />
                    <h3 className={`font-semibold ${category.color}`}>
                      {category.title}
                    </h3>
                  </div>

                  {/* Shortcuts List */}
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, shortcutIndex) => (
                      <div 
                        key={shortcutIndex}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {shortcut.action}
                        </span>
                        <div className="flex items-center space-x-1">
                          {shortcut.keys.split('/').map((keyCombo, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {keyIndex > 0 && (
                                <span className="text-xs text-gray-400 mx-1">ou</span>
                              )}
                              <div className="flex items-center space-x-1">
                                {keyCombo.split('+').map((key, keyPartIndex) => (
                                  <span
                                    key={keyPartIndex}
                                    className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono text-gray-800 dark:text-gray-200 shadow-sm"
                                  >
                                    {key.trim()}
                                  </span>
                                ))}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Tips */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Dicas Profissionais
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Space</kbd> ou <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">K</kbd> para Play/Pause rápido</li>
                  <li>• <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">J</kbd> e <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">L</kbd> para navegação precisa (1 segundo)</li>
                  <li>• Selecione itens e use <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">S</kbd> para cortar no playhead</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Ctrl+D</kbd> para duplicar rapidamente</li>
                  <li>• <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Ctrl+Z/Y</kbd> para Desfazer/Refazer com histórico completo</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pressione <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> ou <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">F1</kbd> para abrir esta ajuda a qualquer momento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelpPanel;