import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

const SecurityPanel: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl text-orange-800">
            Sistema de Segurança Desabilitado
          </CardTitle>
          <CardDescription className="text-orange-700">
            O painel de segurança foi desativado para esta aplicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Funcionalidades Desabilitadas:</span>
          </div>
          <ul className="list-disc list-inside space-y-2 text-orange-600 ml-4">
            <li>Gerenciamento de usuários e roles</li>
            <li>Monitoramento de ameaças</li>
            <li>Análise de vulnerabilidades</li>
            <li>Logs de auditoria</li>
            <li>Alertas de segurança</li>
            <li>Configurações de compliance</li>
            <li>Relatórios de segurança</li>
            <li>Detecção de intrusão</li>
          </ul>
          <div className="mt-6 p-4 bg-orange-100 rounded-lg">
            <p className="text-sm text-orange-800">
              Este painel foi simplificado para remover todas as funcionalidades de segurança.
              Para reativar o sistema de segurança, consulte a documentação do projeto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPanel;
