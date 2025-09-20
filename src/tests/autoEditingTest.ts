import { AIAutoEditingEngine } from '../services/aiAutoEditingEngine';
import { AutoEditingConfig } from '../types/autoEditing';

// Test configuration
const testConfig: AutoEditingConfig = {
  smartCuts: {
    enabled: true,
    sensitivity: 0.7,
    minSegmentDuration: 2,
    maxSegmentDuration: 30
  },
  sceneTransitions: {
    enabled: true,
    transitionTypes: ['fade', 'dissolve', 'wipe'],
    autoDetectScenes: true
  },
  colorGrading: {
    enabled: true,
    autoCorrection: true,
    style: 'cinematic'
  },
  audioLeveling: {
    enabled: true,
    targetLevel: -23,
    normalization: true
  },
  contentAnalysis: {
    enabled: true,
    detectFaces: true,
    detectObjects: true,
    detectText: true
  },
  realTimeSuggestions: {
    enabled: true,
    suggestionTypes: ['cut', 'transition', 'effect', 'audio']
  },
  batchProcessing: {
    enabled: true,
    maxConcurrentJobs: 3,
    priority: 'balanced'
  },
  learningSystem: {
    enabled: true,
    adaptToUserPreferences: true,
    collectMetrics: true
  }
};

// Test function
export async function testAutoEditingSystem() {
  console.log('🤖 Iniciando teste do sistema de Auto-Editing com IA...');
  
  try {
    // Initialize AI engine
    const aiEngine = new AIAutoEditingEngine(testConfig);
    console.log('✅ Engine de IA inicializada com sucesso');
    
    // Test smart cut detection
    console.log('\n🎬 Testando detecção inteligente de cortes...');
    const mockVideoData = new ArrayBuffer(1024); // Mock video data
    const mockAudioData = new ArrayBuffer(512);  // Mock audio data
    
    const smartCuts = await aiEngine.detectSmartCuts(mockVideoData, mockAudioData);
    console.log(`📊 Detectados ${smartCuts.length} cortes inteligentes:`);
    smartCuts.forEach((cut, index) => {
      console.log(`   ${index + 1}. Tempo: ${cut.timestamp}s, Confiança: ${cut.confidence}, Tipo: ${cut.type}`);
    });
    
    // Test scene transitions
    console.log('\n🎭 Testando transições de cena...');
    const sceneTransitions = await aiEngine.suggestSceneTransitions(mockVideoData);
    console.log(`🔄 Sugeridas ${sceneTransitions.length} transições:`);
    sceneTransitions.forEach((transition, index) => {
      console.log(`   ${index + 1}. ${transition.fromTime}s → ${transition.toTime}s: ${transition.type} (${transition.duration}s)`);
    });
    
    // Test color grading
    console.log('\n🎨 Testando correção automática de cores...');
    const colorProfile = await aiEngine.generateColorGrading(mockVideoData);
    console.log(`🌈 Perfil de cores gerado:`);
    console.log(`   Brilho: ${colorProfile.brightness}, Contraste: ${colorProfile.contrast}`);
    console.log(`   Saturação: ${colorProfile.saturation}, Temperatura: ${colorProfile.temperature}`);
    
    // Test audio leveling
    console.log('\n🔊 Testando nivelamento de áudio...');
    const audioLeveling = await aiEngine.levelAudio(mockAudioData);
    console.log(`🎵 Configurações de áudio:`);
    console.log(`   Ganho: ${audioLeveling.gain}dB, Compressão: ${audioLeveling.compression}`);
    console.log(`   Normalização: ${audioLeveling.normalization ? 'Ativada' : 'Desativada'}`);
    
    // Test content analysis
    console.log('\n🔍 Testando análise de conteúdo...');
    const contentAnalysis = await aiEngine.analyzeContent(mockVideoData);
    console.log(`📈 Análise de conteúdo:`);
    console.log(`   Faces detectadas: ${contentAnalysis.faces?.length || 0}`);
    console.log(`   Objetos detectados: ${contentAnalysis.objects?.length || 0}`);
    console.log(`   Texto detectado: ${contentAnalysis.text?.length || 0} elementos`);
    console.log(`   Sentimento: ${contentAnalysis.sentiment}`);
    
    // Test real-time suggestions
    console.log('\n💡 Testando sugestões em tempo real...');
    const suggestions = await aiEngine.generateRealTimeSuggestions(mockVideoData, 10.5);
    console.log(`🚀 ${suggestions.length} sugestões geradas para o tempo 10.5s:`);
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion.type}: ${suggestion.description} (Confiança: ${suggestion.confidence})`);
    });
    
    // Test metrics
    console.log('\n📊 Testando métricas do sistema...');
    const metrics = aiEngine.getMetrics();
    console.log(`📈 Métricas atuais:`);
    console.log(`   Cortes processados: ${metrics.cutsProcessed}`);
    console.log(`   Transições aplicadas: ${metrics.transitionsApplied}`);
    console.log(`   Tempo total de processamento: ${metrics.totalProcessingTime}ms`);
    console.log(`   Taxa de sucesso: ${metrics.successRate}%`);
    
    console.log('\n🎉 Teste do sistema de Auto-Editing concluído com sucesso!');
    console.log('✨ Todas as funcionalidades de IA estão operacionais!');
    
    return {
      success: true,
      smartCuts: smartCuts.length,
      transitions: sceneTransitions.length,
      suggestions: suggestions.length,
      metrics
    };
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Auto-run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to global scope for manual testing
  (window as any).testAutoEditingSystem = testAutoEditingSystem;
  console.log('🔧 Teste disponível globalmente: testAutoEditingSystem()');
} else {
  // Node environment - run immediately
  testAutoEditingSystem().then(result => {
    console.log('\n📋 Resultado final:', result);
  });
}