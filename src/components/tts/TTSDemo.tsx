import React, { useState } from 'react';
import { useFallbackTTS, useSimpleTTS } from '../../hooks/useFallbackTTS';
import { EnhancedTTSOptions } from '../../services/enhanced-tts-service';

interface TTSDemoProps {
  className?: string;
}

export function TTSDemo({ className = '' }: TTSDemoProps) {
  const [text, setText] = useState('Olá! Este é um teste do sistema TTS com fallback automático.');
  const [options, setOptions] = useState<EnhancedTTSOptions>({
    voice: '',
    language: 'pt-BR',
    speed: 1.0,
    pitch: 0.0
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const tts = useFallbackTTS();
  const simpleTTS = useSimpleTTS();
  const [healthStatus, setHealthStatus] = useState<{ [provider: string]: boolean } | null>(null);

  const handleSynthesize = async () => {
    const response = await tts.synthesize(text, options);
    if (response?.success && response.audioUrl) {
      await tts.play(response.audioUrl);
    }
  };

  const handleSimpleSpeak = async () => {
    await simpleTTS.speak(text, options);
  };

  const handleHealthCheck = async () => {
    const status = await tts.healthCheck();
    setHealthStatus(status);
  };

  const stats = tts.getStats();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎤 Demonstração TTS com Fallback
        </h2>
        <p className="text-gray-600">
          Sistema que tenta ElevenLabs primeiro e usa Google Cloud TTS como backup
        </p>
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto para síntese:
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Digite o texto que deseja sintetizar..."
        />
      </div>

      {/* Basic Options */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idioma:
          </label>
          <select
            value={options.language || 'pt-BR'}
            onChange={(e) => setOptions(prev => ({ ...prev, language: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Velocidade: {options.speed}
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={options.speed || 1.0}
            onChange={(e) => setOptions(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
            className="w-full"
          />
        </div>
      </div>

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAdvanced ? '▼' : '▶'} Opções Avançadas
        </button>
        
        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tom: {options.pitch}
              </label>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.1"
                value={options.pitch || 0.0}
                onChange={(e) => setOptions(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estabilidade (ElevenLabs): {options.stability}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={options.stability || 0.5}
                onChange={(e) => setOptions(prev => ({ ...prev, stability: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleSynthesize}
          disabled={tts.isLoading || !text.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {tts.isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sintetizando...
            </>
          ) : (
            <>
              🎤 Sintetizar
            </>
          )}
        </button>
        
        <button
          onClick={handleSimpleSpeak}
          disabled={simpleTTS.isLoading || !text.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {simpleTTS.isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Falando...
            </>
          ) : (
            <>
              🔊 Falar Agora
            </>
          )}
        </button>
        
        {(tts.isPlaying || simpleTTS.isPlaying) && (
          <button
            onClick={() => {
              tts.stop();
              simpleTTS.stop();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            ⏹️ Parar
          </button>
        )}
        
        <button
          onClick={handleHealthCheck}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
        >
          🏥 Health Check
        </button>
      </div>

      {/* Error Display */}
      {(tts.error || simpleTTS.error) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800 font-medium">Erro:</span>
          </div>
          <p className="text-red-700 mt-1">{tts.error || simpleTTS.error}</p>
          <button
            onClick={() => {
              tts.clearError();
              simpleTTS.clearError();
            }}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Limpar erro
          </button>
        </div>
      )}

      {/* Last Response Info */}
      {tts.lastResponse && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">📊 Última Resposta:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Provedor Final:</strong> {tts.lastResponse.finalProvider}</p>
            <p><strong>Tentativas:</strong> {tts.lastResponse.totalAttempts}</p>
            <p><strong>Fallback Usado:</strong> {tts.lastResponse.fallbackUsed ? 'Sim' : 'Não'}</p>
            {tts.lastResponse.duration && (
              <p><strong>Duração:</strong> {Math.round(tts.lastResponse.duration / 1000)}s</p>
            )}
          </div>
          
          {tts.lastResponse.attemptLogs && tts.lastResponse.attemptLogs.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-blue-800 mb-1">Log de Tentativas:</h4>
              <div className="space-y-1">
                {tts.lastResponse.attemptLogs.map((log, index) => (
                  <div key={index} className="text-xs text-blue-600 flex items-center gap-2">
                    <span>{log.success ? '✅' : '❌'}</span>
                    <span>{log.provider}</span>
                    {log.duration && <span>({log.duration}ms)</span>}
                    {log.error && <span className="text-red-600">- {log.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Health Status */}
      {healthStatus && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">🏥 Status dos Provedores:</h3>
          <div className="space-y-1">
            {Object.entries(healthStatus).map(([provider, status]) => (
              <div key={provider} className="flex items-center gap-2 text-sm">
                <span>{status ? '✅' : '❌'}</span>
                <span className={status ? 'text-green-700' : 'text-red-700'}>
                  {provider}: {status ? 'Funcionando' : 'Com problemas'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="mb-6">
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          {showStats ? '▼' : '▶'} Estatísticas
        </button>
        
        {showStats && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-purple-800">Geral</h4>
                <p>Total de Requisições: {stats.totalRequests}</p>
                <p>Taxa de Sucesso: {stats.successRate.toFixed(1)}%</p>
              </div>
              
              <div>
                <h4 className="font-medium text-purple-800">Por Provedor</h4>
                {Object.entries(stats.providerStats).map(([provider, stat]) => (
                  <div key={provider} className="mb-1">
                    <p className="font-medium">{provider}:</p>
                    <p className="ml-2 text-xs">
                      {stat.successes}/{stat.attempts} 
                      ({stat.attempts > 0 ? ((stat.successes / stat.attempts) * 100).toFixed(1) : 0}%)
                    </p>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="font-medium text-purple-800">Logs Recentes</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stats.recentLogs.map((log, index) => (
                    <div key={index} className="text-xs flex items-center gap-1">
                      <span>{log.success ? '✅' : '❌'}</span>
                      <span>{log.provider}</span>
                      {log.duration && <span>({log.duration}ms)</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TTSDemo;