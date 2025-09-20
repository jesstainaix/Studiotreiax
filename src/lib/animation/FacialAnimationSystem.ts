// Sistema Avançado de Animação Facial com Blend Shapes
// Suporte para expressões realistas, sincronização labial e animações faciais

import * as THREE from 'three';

export interface BlendShape {
  name: string;
  index: number;
  weight: number;
  description: string;
  category: 'emotion' | 'phoneme' | 'custom' | 'micro';
}

export interface FacialExpression {
  id: string;
  name: string;
  blendShapes: Map<string, number>;
  duration: number;
  intensity: number;
  transitionTime: number;
  category: 'emotion' | 'speech' | 'gesture';
}

export interface PhonemeData {
  phoneme: string;
  blendShapes: Map<string, number>;
  duration: number;
  intensity: number;
}

export interface LipSyncData {
  text: string;
  phonemes: PhonemeData[];
  timing: number[];
  audioDuration: number;
}

export interface MicroExpression {
  id: string;
  type: 'blink' | 'brow_raise' | 'nose_wrinkle' | 'lip_pucker' | 'cheek_raise';
  duration: number;
  intensity: number;
  frequency: number;
}

export interface FacialAnimationConfig {
  enableMicroExpressions: boolean;
  enableAdaptiveExpressions: boolean;
  lipSyncSensitivity: number;
  expressionBlendSpeed: number;
  maxConcurrentExpressions: number;
  useMotionCapture: boolean;
}

export class FacialAnimationSystem {
  private static instance: FacialAnimationSystem;
  private avatar: THREE.Group | null = null;
  private morphTargetInfluences: number[] = [];
  private blendShapes: Map<string, BlendShape> = new Map();
  private expressions: Map<string, FacialExpression> = new Map();
  private currentExpressions: Map<string, { expression: FacialExpression; startTime: number; progress: number }> = new Map();
  private microExpressions: MicroExpression[] = [];
  private lipSyncData: LipSyncData | null = null;
  private config: FacialAnimationConfig;

  // Sistema de blend shapes padrão (ARKit/Apple)
  private readonly ARKIT_BLEND_SHAPES = [
    // Olhos e sobrancelhas
    { name: 'eyeBlinkLeft', description: 'Piscar olho esquerdo' },
    { name: 'eyeBlinkRight', description: 'Piscar olho direito' },
    { name: 'eyeLookDownLeft', description: 'Olhar para baixo esquerdo' },
    { name: 'eyeLookDownRight', description: 'Olhar para baixo direito' },
    { name: 'eyeLookInLeft', description: 'Olhar para dentro esquerdo' },
    { name: 'eyeLookInRight', description: 'Olhar para dentro direito' },
    { name: 'eyeLookOutLeft', description: 'Olhar para fora esquerdo' },
    { name: 'eyeLookOutRight', description: 'Olhar para fora direito' },
    { name: 'eyeLookUpLeft', description: 'Olhar para cima esquerdo' },
    { name: 'eyeLookUpRight', description: 'Olhar para cima direito' },
    { name: 'eyeSquintLeft', description: 'Apertar olho esquerdo' },
    { name: 'eyeSquintRight', description: 'Apertar olho direito' },
    { name: 'eyeWideLeft', description: 'Abrir olho esquerdo' },
    { name: 'eyeWideRight', description: 'Abrir olho direito' },
    { name: 'browDownLeft', description: 'Sobrancelha esquerda para baixo' },
    { name: 'browDownRight', description: 'Sobrancelha direita para baixo' },
    { name: 'browInnerUp', description: 'Sobrancelhas internas para cima' },
    { name: 'browOuterUpLeft', description: 'Sobrancelha externa esquerda para cima' },
    { name: 'browOuterUpRight', description: 'Sobrancelha externa direita para cima' },

    // Boca e lábios
    { name: 'mouthClose', description: 'Fechar boca' },
    { name: 'mouthFunnel', description: 'Boca em funil' },
    { name: 'mouthPucker', description: 'Boca franzida' },
    { name: 'mouthLeft', description: 'Boca para esquerda' },
    { name: 'mouthRight', description: 'Boca para direita' },
    { name: 'mouthSmileLeft', description: 'Sorriso esquerdo' },
    { name: 'mouthSmileRight', description: 'Sorriso direito' },
    { name: 'mouthFrownLeft', description: 'Carranca esquerda' },
    { name: 'mouthFrownRight', description: 'Carranca direita' },
    { name: 'mouthDimpleLeft', description: 'Covinha esquerda' },
    { name: 'mouthDimpleRight', description: 'Covinha direita' },
    { name: 'mouthStretchLeft', description: 'Esticar boca esquerda' },
    { name: 'mouthStretchRight', description: 'Esticar boca direita' },
    { name: 'mouthRollLower', description: 'Rolar lábio inferior' },
    { name: 'mouthRollUpper', description: 'Rolar lábio superior' },
    { name: 'mouthShrugLower', description: 'Encolher lábio inferior' },
    { name: 'mouthShrugUpper', description: 'Encolher lábio superior' },
    { name: 'mouthPressLeft', description: 'Pressionar lábio esquerdo' },
    { name: 'mouthPressRight', description: 'Pressionar lábio direito' },

    // Bochechas e mandíbula
    { name: 'cheekPuff', description: 'Inchar bochechas' },
    { name: 'cheekSquintLeft', description: 'Apertar bochecha esquerda' },
    { name: 'cheekSquintRight', description: 'Apertar bochecha direita' },
    { name: 'noseSneerLeft', description: 'Torcer nariz esquerdo' },
    { name: 'noseSneerRight', description: 'Torcer nariz direito' },
    { name: 'jawOpen', description: 'Abrir mandíbula' },
    { name: 'jawForward', description: 'Mandíbula para frente' },
    { name: 'jawLeft', description: 'Mandíbula para esquerda' },
    { name: 'jawRight', description: 'Mandíbula para direita' },

    // Língua
    { name: 'tongueOut', description: 'Língua para fora' }
  ];

  constructor() {
    this.config = {
      enableMicroExpressions: true,
      enableAdaptiveExpressions: true,
      lipSyncSensitivity: 1.0,
      expressionBlendSpeed: 0.1,
      maxConcurrentExpressions: 3,
      useMotionCapture: false
    };

    this.initializeBlendShapes();
    this.initializeExpressions();
    this.initializeMicroExpressions();
  }

  static getInstance(): FacialAnimationSystem {
    if (!FacialAnimationSystem.instance) {
      FacialAnimationSystem.instance = new FacialAnimationSystem();
    }
    return FacialAnimationSystem.instance;
  }

  private initializeBlendShapes(): void {
    // Inicializar blend shapes ARKit
    this.ARKIT_BLEND_SHAPES.forEach((shape, index) => {
      const blendShape: BlendShape = {
        name: shape.name,
        index,
        weight: 0,
        description: shape.description,
        category: this.categorizeBlendShape(shape.name)
      };
      this.blendShapes.set(shape.name, blendShape);
    });
  }

  private categorizeBlendShape(name: string): BlendShape['category'] {
    if (name.includes('eye') || name.includes('brow')) {
      return 'emotion';
    } else if (name.includes('mouth') || name.includes('jaw') || name.includes('tongue')) {
      return 'phoneme';
    } else {
      return 'custom';
    }
  }

  private initializeExpressions(): void {
    // Expressões faciais pré-definidas
    const expressions: FacialExpression[] = [
      {
        id: 'happy',
        name: 'Feliz',
        blendShapes: new Map([
          ['mouthSmileLeft', 0.8],
          ['mouthSmileRight', 0.8],
          ['eyeSquintLeft', 0.3],
          ['eyeSquintRight', 0.3],
          ['cheekSquintLeft', 0.2],
          ['cheekSquintRight', 0.2]
        ]),
        duration: 2.0,
        intensity: 1.0,
        transitionTime: 0.3,
        category: 'emotion'
      },
      {
        id: 'sad',
        name: 'Triste',
        blendShapes: new Map([
          ['mouthFrownLeft', 0.7],
          ['mouthFrownRight', 0.7],
          ['browDownLeft', 0.5],
          ['browDownRight', 0.5],
          ['eyeSquintLeft', -0.2],
          ['eyeSquintRight', -0.2]
        ]),
        duration: 2.0,
        intensity: 1.0,
        transitionTime: 0.4,
        category: 'emotion'
      },
      {
        id: 'surprised',
        name: 'Surpreso',
        blendShapes: new Map([
          ['eyeWideLeft', 0.9],
          ['eyeWideRight', 0.9],
          ['browUpLeft', 0.8],
          ['browUpRight', 0.8],
          ['mouthClose', 0.3],
          ['jawOpen', 0.2]
        ]),
        duration: 1.5,
        intensity: 1.0,
        transitionTime: 0.2,
        category: 'emotion'
      },
      {
        id: 'angry',
        name: 'Bravo',
        blendShapes: new Map([
          ['browDownLeft', 0.8],
          ['browDownRight', 0.8],
          ['eyeSquintLeft', 0.6],
          ['eyeSquintRight', 0.6],
          ['mouthFrownLeft', 0.5],
          ['mouthFrownRight', 0.5],
          ['noseSneerLeft', 0.3],
          ['noseSneerRight', 0.3]
        ]),
        duration: 2.0,
        intensity: 1.0,
        transitionTime: 0.3,
        category: 'emotion'
      }
    ];

    expressions.forEach(expression => {
      this.expressions.set(expression.id, expression);
    });
  }

  private initializeMicroExpressions(): void {
    // Micro-expressões para realismo
    this.microExpressions = [
      {
        id: 'blink',
        type: 'blink',
        duration: 0.15,
        intensity: 1.0,
        frequency: 0.002 // A cada ~3-4 segundos
      },
      {
        id: 'brow_micro',
        type: 'brow_raise',
        duration: 0.1,
        intensity: 0.3,
        frequency: 0.001
      },
      {
        id: 'lip_micro',
        type: 'lip_pucker',
        duration: 0.08,
        intensity: 0.2,
        frequency: 0.0015
      }
    ];
  }

  // Configurar avatar para animação facial
  setAvatar(avatar: THREE.Group): void {
    this.avatar = avatar;
    this.initializeMorphTargets();
  }

  private initializeMorphTargets(): void {
    if (!this.avatar) return;

    // Encontrar mesh da cabeça/cabeça
    this.avatar.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetInfluences) {
        this.morphTargetInfluences = child.morphTargetInfluences;

        // Mapear blend shapes para morph targets
        if (child.morphTargetDictionary) {
          Object.entries(child.morphTargetDictionary).forEach(([name, index]) => {
            if (this.blendShapes.has(name)) {
              this.blendShapes.get(name)!.index = index as number;
            }
          });
        }
      }
    });
  }

  // Sistema de expressões faciais
  playExpression(expressionId: string, intensity: number = 1.0): void {
    const expression = this.expressions.get(expressionId);
    if (!expression) {
      console.warn(`Expressão não encontrada: ${expressionId}`);
      return;
    }

    // Limitar expressões concorrentes
    if (this.currentExpressions.size >= this.config.maxConcurrentExpressions) {
      // Remover expressão mais antiga
      const oldestKey = this.currentExpressions.keys().next().value;
      this.currentExpressions.delete(oldestKey);
    }

    this.currentExpressions.set(expressionId, {
      expression,
      startTime: Date.now(),
      progress: 0
    });
  }

  stopExpression(expressionId: string): void {
    this.currentExpressions.delete(expressionId);
  }

  // Sistema de sincronização labial
  playLipSync(text: string, audioDuration: number): void {
    this.lipSyncData = this.generateLipSyncData(text, audioDuration);
  }

  private generateLipSyncData(text: string, audioDuration: number): LipSyncData {
    // Análise simples de texto para fonemas
    const phonemes = this.textToPhonemes(text);
    const timing = this.distributeTiming(phonemes.length, audioDuration);

    const lipSyncPhonemes: PhonemeData[] = phonemes.map((phoneme, index) => ({
      phoneme,
      blendShapes: this.getPhonemeBlendShapes(phoneme),
      duration: timing[index + 1] ? timing[index + 1] - timing[index] : 0.1,
      intensity: 1.0
    }));

    return {
      text,
      phonemes: lipSyncPhonemes,
      timing,
      audioDuration
    };
  }

  private textToPhonemes(text: string): string[] {
    // Conversão simplificada de texto para fonemas brasileiros
    const phonemeMap: { [key: string]: string } = {
      'a': 'AA', 'á': 'AA', 'ã': 'AA', 'â': 'AA',
      'e': 'EH', 'é': 'EH', 'ê': 'EH',
      'i': 'IY', 'í': 'IY',
      'o': 'OW', 'ó': 'OW', 'ô': 'OW', 'õ': 'OW',
      'u': 'UW', 'ú': 'UW',
      'b': 'B', 'c': 'K', 'd': 'D', 'f': 'F',
      'g': 'G', 'h': 'HH', 'j': 'ZH', 'k': 'K',
      'l': 'L', 'm': 'M', 'n': 'N', 'p': 'P',
      'q': 'K', 'r': 'R', 's': 'S', 't': 'T',
      'v': 'V', 'w': 'W', 'x': 'SH', 'y': 'Y', 'z': 'Z'
    };

    return text.toLowerCase().split('').map(char => phonemeMap[char] || 'AA');
  }

  private distributeTiming(phonemeCount: number, totalDuration: number): number[] {
    const timing: number[] = [];
    const averageDuration = totalDuration / phonemeCount;

    for (let i = 0; i <= phonemeCount; i++) {
      timing.push(i * averageDuration);
    }

    return timing;
  }

  private getPhonemeBlendShapes(phoneme: string): Map<string, number> {
    // Mapeamento de fonemas para blend shapes
    const phonemeShapes: { [key: string]: Map<string, number> } = {
      'AA': new Map([['jawOpen', 0.3], ['mouthClose', -0.2]]),
      'EH': new Map([['jawOpen', 0.2], ['mouthSmileLeft', 0.1], ['mouthSmileRight', 0.1]]),
      'IY': new Map([['mouthSmileLeft', 0.2], ['mouthSmileRight', 0.2], ['jawOpen', 0.1]]),
      'OW': new Map([['mouthPucker', 0.3], ['jawOpen', 0.2]]),
      'UW': new Map([['mouthPucker', 0.4], ['jawOpen', 0.1]]),
      'B': new Map([['mouthClose', 0.8], ['jawOpen', -0.1]]),
      'P': new Map([['mouthClose', 0.9], ['jawOpen', -0.2]]),
      'M': new Map([['mouthClose', 0.7], ['noseSneerLeft', 0.1], ['noseSneerRight', 0.1]]),
      'F': new Map([['mouthPucker', 0.2], ['mouthStretchLeft', 0.3], ['mouthStretchRight', 0.3]]),
      'V': new Map([['mouthPucker', 0.1], ['mouthStretchLeft', 0.2], ['mouthStretchRight', 0.2]]),
      'S': new Map([['mouthSmileLeft', 0.4], ['mouthSmileRight', 0.4], ['jawOpen', 0.1]]),
      'Z': new Map([['mouthSmileLeft', 0.3], ['mouthSmileRight', 0.3], ['jawOpen', 0.1]]),
      'L': new Map([['tongueOut', 0.3], ['mouthSmileLeft', 0.2], ['mouthSmileRight', 0.2]]),
      'R': new Map([['mouthSmileLeft', 0.3], ['mouthSmileRight', 0.3], ['jawOpen', 0.2]])
    };

    return phonemeShapes[phoneme] || new Map([['jawOpen', 0.1]]);
  }

  // Sistema de micro-expressões
  private updateMicroExpressions(deltaTime: number): void {
    if (!this.config.enableMicroExpressions) return;

    this.microExpressions.forEach(micro => {
      if (Math.random() < micro.frequency * deltaTime * 60) { // 60 FPS
        this.playMicroExpression(micro);
      }
    });
  }

  private playMicroExpression(micro: MicroExpression): void {
    const blendShapes = this.getMicroExpressionBlendShapes(micro.type);
    const intensity = micro.intensity * (0.8 + Math.random() * 0.4); // Variação

    // Aplicar micro-expressão
    blendShapes.forEach((weight, shapeName) => {
      if (this.blendShapes.has(shapeName)) {
        const blendShape = this.blendShapes.get(shapeName)!;
        blendShape.weight = weight * intensity;

        // Reset após duração
        setTimeout(() => {
          blendShape.weight = 0;
        }, micro.duration * 1000);
      }
    });
  }

  private getMicroExpressionBlendShapes(type: MicroExpression['type']): Map<string, number> {
    const shapes: { [key: string]: Map<string, number> } = {
      'blink': new Map([
        ['eyeBlinkLeft', 1.0],
        ['eyeBlinkRight', 1.0]
      ]),
      'brow_raise': new Map([
        ['browInnerUp', 0.5],
        ['browOuterUpLeft', 0.3],
        ['browOuterUpRight', 0.3]
      ]),
      'nose_wrinkle': new Map([
        ['noseSneerLeft', 0.4],
        ['noseSneerRight', 0.4]
      ]),
      'lip_pucker': new Map([
        ['mouthPucker', 0.3]
      ]),
      'cheek_raise': new Map([
        ['cheekSquintLeft', 0.4],
        ['cheekSquintRight', 0.4]
      ])
    };

    return shapes[type] || new Map();
  }

  // Sistema de motion capture
  loadMotionCaptureData(data: any): void {
    if (!this.config.useMotionCapture) return;

    // Processar dados de motion capture
    // Em produção, seria integrado com sistemas como Live Link Face
  }

  // Método principal de atualização
  update(deltaTime: number): void {
    if (!this.avatar) return;

    // Atualizar expressões atuais
    this.updateExpressions(deltaTime);

    // Atualizar sincronização labial
    this.updateLipSync(deltaTime);

    // Atualizar micro-expressões
    this.updateMicroExpressions(deltaTime);

    // Aplicar blend shapes aos morph targets
    this.applyBlendShapes();
  }

  private updateExpressions(deltaTime: number): void {
    const currentTime = Date.now();
    const toRemove: string[] = [];

    this.currentExpressions.forEach((data, expressionId) => {
      const elapsed = (currentTime - data.startTime) / 1000;
      const totalDuration = data.expression.duration + data.expression.transitionTime * 2;

      if (elapsed >= totalDuration) {
        toRemove.push(expressionId);
        return;
      }

      // Calcular progresso com transição suave
      let progress = elapsed / data.expression.duration;

      if (elapsed < data.expression.transitionTime) {
        // Fase de entrada
        progress = (elapsed / data.expression.transitionTime) * 0.3;
      } else if (elapsed > data.expression.duration) {
        // Fase de saída
        const exitProgress = (elapsed - data.expression.duration) / data.expression.transitionTime;
        progress = Math.max(0, 1.0 - exitProgress);
      }

      data.progress = progress;
    });

    // Remover expressões concluídas
    toRemove.forEach(id => this.currentExpressions.delete(id));
  }

  private updateLipSync(deltaTime: number): void {
    if (!this.lipSyncData) return;

    // Em produção, seria sincronizado com áudio
    // Por enquanto, simulação baseada em tempo
    const currentTime = (Date.now() % (this.lipSyncData.audioDuration * 1000)) / 1000;

    // Encontrar fonema atual
    const currentPhonemeIndex = this.lipSyncData.timing.findIndex(time => time > currentTime) - 1;
    if (currentPhonemeIndex >= 0 && currentPhonemeIndex < this.lipSyncData.phonemes.length) {
      const phoneme = this.lipSyncData.phonemes[currentPhonemeIndex];

      // Aplicar blend shapes do fonema
      phoneme.blendShapes.forEach((weight, shapeName) => {
        if (this.blendShapes.has(shapeName)) {
          this.blendShapes.get(shapeName)!.weight = weight * phoneme.intensity * this.config.lipSyncSensitivity;
        }
      });
    }
  }

  private applyBlendShapes(): void {
    if (this.morphTargetInfluences.length === 0) return;

    // Aplicar expressões atuais
    this.currentExpressions.forEach(data => {
      data.expression.blendShapes.forEach((weight, shapeName) => {
        if (this.blendShapes.has(shapeName)) {
          const blendShape = this.blendShapes.get(shapeName)!;
          const baseWeight = blendShape.weight;
          const expressionWeight = weight * data.expression.intensity * data.progress;

          // Combinar com expressão atual
          blendShape.weight = Math.max(baseWeight, expressionWeight);
        }
      });
    });

    // Aplicar aos morph targets
    this.blendShapes.forEach(blendShape => {
      if (blendShape.index < this.morphTargetInfluences.length) {
        this.morphTargetInfluences[blendShape.index] = blendShape.weight;
      }
    });
  }

  // Métodos de controle
  setBlendShapeWeight(shapeName: string, weight: number): void {
    if (this.blendShapes.has(shapeName)) {
      this.blendShapes.get(shapeName)!.weight = Math.max(0, Math.min(1, weight));
    }
  }

  getBlendShapeWeight(shapeName: string): number {
    return this.blendShapes.get(shapeName)?.weight || 0;
  }

  resetAllBlendShapes(): void {
    this.blendShapes.forEach(blendShape => {
      blendShape.weight = 0;
    });
    this.currentExpressions.clear();
    this.lipSyncData = null;
  }

  // Configuração
  updateConfig(newConfig: Partial<FacialAnimationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): FacialAnimationConfig {
    return { ...this.config };
  }

  // Utilitários
  getAvailableExpressions(): FacialExpression[] {
    return Array.from(this.expressions.values());
  }

  getAvailableBlendShapes(): BlendShape[] {
    return Array.from(this.blendShapes.values());
  }

  // Sistema de aprendizado adaptativo
  enableAdaptiveLearning(): void {
    if (!this.config.enableAdaptiveExpressions) return;

    // Em produção, seria um sistema de ML para aprender expressões naturais
  }

  // Limpeza
  dispose(): void {
    this.resetAllBlendShapes();
    this.blendShapes.clear();
    this.expressions.clear();
    this.currentExpressions.clear();
    this.microExpressions = [];
    this.lipSyncData = null;
    this.avatar = null;
  }
}

// Configurações padrão para diferentes estilos de avatar
export const FACIAL_ANIMATION_PRESETS = {
  realistic: {
    enableMicroExpressions: true,
    enableAdaptiveExpressions: true,
    lipSyncSensitivity: 1.2,
    expressionBlendSpeed: 0.15,
    maxConcurrentExpressions: 3,
    useMotionCapture: false
  },
  cartoon: {
    enableMicroExpressions: false,
    enableAdaptiveExpressions: false,
    lipSyncSensitivity: 0.8,
    expressionBlendSpeed: 0.2,
    maxConcurrentExpressions: 2,
    useMotionCapture: false
  },
  performance: {
    enableMicroExpressions: false,
    enableAdaptiveExpressions: false,
    lipSyncSensitivity: 0.6,
    expressionBlendSpeed: 0.1,
    maxConcurrentExpressions: 1,
    useMotionCapture: false
  }
};
