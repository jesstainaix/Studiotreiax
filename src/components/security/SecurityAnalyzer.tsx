import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

const SecurityAnalyzer: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Shield className="w-16 h-16 text-gray-400" />
              <AlertTriangle className="w-6 h-6 text-orange-500 absolute -top-1 -right-1" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sistema de Segurança Desabilitado
          </h1>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            O analisador de segurança foi desabilitado. Todas as funcionalidades de 
            análise de vulnerabilidades, conformidade e monitoramento estão inativas.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">
                Funcionalidades Desabilitadas
              </span>
            </div>
            <ul className="text-sm text-orange-700 text-left space-y-1">
              <li>• Análise de vulnerabilidades</li>
              <li>• Scans de segurança</li>
              <li>• Monitoramento em tempo real</li>
              <li>• Relatórios de conformidade</li>
              <li>• Gerenciamento de incidentes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAnalyzer;