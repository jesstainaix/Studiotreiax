// Biblioteca Avançada de Gestos e Emoções com Foco em Expressões Brasileiras
import * as THREE from 'three';
import { FacialAnimationSystem } from '../lib/animation/FacialAnimationSystem';

export interface GestureAnimation {
  id: string;
  name: string;
  category: 'greeting' | 'emotion' | 'conversation' | 'cultural' | 'professional' | 'casual';
  culture: 'brazilian' | 'universal';
  description: string;
  duration: number;
  intensity: number;
  keyframes: AnimationKeyframe[];
  blendShapes?: Map<string, number>;
  soundEffects?: string[];
  contextualUse: string[];
}

export interface AnimationKeyframe {
  time: number; // 0 to 1 (normalized time)
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
  bodyParts: {
    head?: { rotation: THREE.Euler; position?: THREE.Vector3 };
    leftArm?: { rotation: THREE.Euler; position?: THREE.Vector3 };
    rightArm?: { rotation: THREE.Euler; position?: THREE.Vector3 };
    leftHand?: { rotation: THREE.Euler; fingers?: FingerPose };
    rightHand?: { rotation: THREE.Euler; fingers?: FingerPose };
    torso?: { rotation: THREE.Euler; position?: THREE.Vector3 };
    leftLeg?: { rotation: THREE.Euler; position?: THREE.Vector3 };
    rightLeg?: { rotation: THREE.Euler; position?: THREE.Vector3 };
  };
}

export interface FingerPose {
  thumb: number; // 0 = fechado, 1 = aberto
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export interface EmotionState {
  id: string;
  name: string;
  intensity: number; // 0 to 1
  primaryEmotion: string;
  secondaryEmotions: string[];
  facialExpressions: FacialExpression[];
  microExpressions: MicroExpression[];
  bodyLanguage: BodyLanguageElement[];
  vocalCharacteristics: VocalCharacteristics;
}

export interface FacialExpression {
  blendShape: string;
  value: number;
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface MicroExpression {
  id: string;
  name: string;
  trigger: 'random' | 'contextual' | 'emotional';
  frequency: number; // vezes por minuto
  duration: number; // milissegundos
  blendShapes: Map<string, number>;
}

export interface BodyLanguageElement {
  bodyPart: string;
  movement: 'tilt' | 'lean' | 'shift' | 'cross' | 'open';
  direction: THREE.Vector3;
  intensity: number;
}

export interface VocalCharacteristics {
  pitch: number; // -1 to 1
  speed: number; // 0.5 to 2
  volume: number; // 0 to 1
  tremor: number; // 0 to 1
  breathiness: number; // 0 to 1
}

export interface CompositeGesture {
  id: string;
  name: string;
  description: string;
  gestures: string[]; // IDs dos gestos a combinar
  emotions: string[]; // IDs das emoções a aplicar
  timing: 'sequential' | 'parallel' | 'overlapping';
  transitionDuration: number;
}

export class GestureEmotionLibrary {
  private static instance: GestureEmotionLibrary;
  private gestures: Map<string, GestureAnimation> = new Map();
  private emotions: Map<string, EmotionState> = new Map();
  private microExpressions: Map<string, MicroExpression> = new Map();
  private compositeGestures: Map<string, CompositeGesture> = new Map();
  private culturalVariations: Map<string, any> = new Map();
  private activeAnimations: Map<string, any> = new Map();
  
  constructor() {
    this.initializeBrazilianGestures();
    this.initializeUniversalGestures();
    this.initializeEmotions();
    this.initializeMicroExpressions();
    this.initializeCulturalVariations();
  }

  static getInstance(): GestureEmotionLibrary {
    if (!GestureEmotionLibrary.instance) {
      GestureEmotionLibrary.instance = new GestureEmotionLibrary();
    }
    return GestureEmotionLibrary.instance;
  }

  private initializeBrazilianGestures(): void {
    // Gestos tipicamente brasileiros
    const brazilianGestures: GestureAnimation[] = [
      {
        id: 'br_joia',
        name: 'Joinha',
        category: 'casual',
        culture: 'brazilian',
        description: 'Polegar para cima com movimento enfático',
        duration: 1.5,
        intensity: 0.9,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              rightArm: {
                rotation: new THREE.Euler(0, 0, 0)
              },
              rightHand: {
                rotation: new THREE.Euler(0, 0, 0),
                fingers: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0 }
              }
            }
          },
          {
            time: 0.3,
            bodyParts: {
              rightArm: {
                rotation: new THREE.Euler(-Math.PI / 4, 0, Math.PI / 6)
              }
            }
          },
          {
            time: 0.5,
            bodyParts: {
              rightArm: {
                rotation: new THREE.Euler(-Math.PI / 3, 0, Math.PI / 4)
              },
              rightHand: {
                rotation: new THREE.Euler(0, 0, Math.PI / 8),
                fingers: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0 }
              }
            }
          }
        ],
        contextualUse: ['aprovação', 'concordância', 'positivo']
      },
      {
        id: 'br_abraco_aereo',
        name: 'Abraço no Ar',
        category: 'greeting',
        culture: 'brazilian',
        description: 'Abraço gestual à distância',
        duration: 2,
        intensity: 0.8,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              leftArm: { rotation: new THREE.Euler(0, 0, 0) },
              rightArm: { rotation: new THREE.Euler(0, 0, 0) }
            }
          },
          {
            time: 0.5,
            bodyParts: {
              leftArm: { rotation: new THREE.Euler(-Math.PI / 2, Math.PI / 4, 0) },
              rightArm: { rotation: new THREE.Euler(-Math.PI / 2, -Math.PI / 4, 0) }
            }
          },
          {
            time: 0.8,
            bodyParts: {
              leftArm: { rotation: new THREE.Euler(-Math.PI / 2, Math.PI / 6, 0) },
              rightArm: { rotation: new THREE.Euler(-Math.PI / 2, -Math.PI / 6, 0) },
              torso: { rotation: new THREE.Euler(0.1, 0, 0) }
            }
          }
        ],
        contextualUse: ['cumprimento caloroso', 'afeto', 'saudade']
      },
      {
        id: 'br_cafezinho',
        name: 'Gesto do Cafezinho',
        category: 'cultural',
        culture: 'brazilian',
        description: 'Convite para tomar café',
        duration: 1.8,
        intensity: 0.6,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              rightHand: {
                rotation: new THREE.Euler(0, 0, 0),
                fingers: { thumb: 0.3, index: 0.3, middle: 0.8, ring: 0.8, pinky: 1 }
              }
            }
          },
          {
            time: 0.5,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 6, 0, 0) },
              rightHand: {
                rotation: new THREE.Euler(0, 0, -Math.PI / 4),
                fingers: { thumb: 0.3, index: 0.3, middle: 0.8, ring: 0.8, pinky: 1 }
              }
            }
          },
          {
            time: 1,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 4, 0, 0) },
              rightHand: { rotation: new THREE.Euler(Math.PI / 8, 0, -Math.PI / 4) }
            }
          }
        ],
        contextualUse: ['convite', 'hospitalidade', 'pausa']
      },
      {
        id: 'br_tudo_certo',
        name: 'Tudo Certo (OK brasileiro)',
        category: 'conversation',
        culture: 'brazilian',
        description: 'Sinal de OK com balanço característico',
        duration: 1.5,
        intensity: 0.7,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              rightHand: {
                rotation: new THREE.Euler(0, 0, 0),
                fingers: { thumb: 0.5, index: 0.5, middle: 1, ring: 1, pinky: 1 }
              }
            }
          },
          {
            time: 0.3,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 6, 0, Math.PI / 8) },
              rightHand: { rotation: new THREE.Euler(0, 0, Math.PI / 6) }
            }
          },
          {
            time: 0.6,
            bodyParts: {
              rightHand: { rotation: new THREE.Euler(0, 0, -Math.PI / 6) }
            }
          },
          {
            time: 0.9,
            bodyParts: {
              rightHand: { rotation: new THREE.Euler(0, 0, Math.PI / 6) }
            }
          }
        ],
        contextualUse: ['confirmação', 'tranquilidade', 'acordo']
      },
      {
        id: 'br_nao_nao',
        name: 'Não com o Dedo',
        category: 'conversation',
        culture: 'brazilian',
        description: 'Negação com dedo indicador balançando',
        duration: 1.2,
        intensity: 0.8,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              rightHand: {
                rotation: new THREE.Euler(0, 0, 0),
                fingers: { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 }
              }
            }
          },
          {
            time: 0.25,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 4, 0, 0) },
              rightHand: { rotation: new THREE.Euler(0, 0, -Math.PI / 8) }
            }
          },
          {
            time: 0.5,
            bodyParts: {
              rightHand: { rotation: new THREE.Euler(0, 0, Math.PI / 8) }
            }
          },
          {
            time: 0.75,
            bodyParts: {
              rightHand: { rotation: new THREE.Euler(0, 0, -Math.PI / 8) }
            }
          }
        ],
        contextualUse: ['negação', 'repreensão leve', 'discordância']
      },
      {
        id: 'br_vai_dar_certo',
        name: 'Vai Dar Certo',
        category: 'emotion',
        culture: 'brazilian',
        description: 'Gesto de otimismo e fé',
        duration: 2,
        intensity: 0.9,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              rightHand: {
                rotation: new THREE.Euler(0, 0, 0),
                fingers: { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 }
              }
            }
          },
          {
            time: 0.5,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 2, 0, 0) },
              rightHand: { rotation: new THREE.Euler(0, Math.PI / 2, 0) },
              head: { rotation: new THREE.Euler(-0.2, 0, 0) }
            }
          },
          {
            time: 1,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 2, 0, 0) },
              head: { rotation: new THREE.Euler(0.1, 0, 0) }
            }
          }
        ],
        contextualUse: ['encorajamento', 'fé', 'esperança']
      }
    ];

    brazilianGestures.forEach(gesture => {
      this.gestures.set(gesture.id, gesture);
    });
  }

  private initializeUniversalGestures(): void {
    // Gestos universais com adaptações brasileiras
    const universalGestures: GestureAnimation[] = [
      {
        id: 'wave_hello',
        name: 'Acenar Olá',
        category: 'greeting',
        culture: 'universal',
        description: 'Aceno de mão para cumprimento',
        duration: 2,
        intensity: 0.7,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(0, 0, 0) }
            }
          },
          {
            time: 0.3,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 2, 0, Math.PI / 4) },
              rightHand: { rotation: new THREE.Euler(0, 0, 0) }
            }
          },
          {
            time: 0.5,
            bodyParts: {
              rightHand: { rotation: new THREE.Euler(0, 0, -Math.PI / 6) }
            }
          },
          {
            time: 0.7,
            bodyParts: {
              rightHand: { rotation: new THREE.Euler(0, 0, Math.PI / 6) }
            }
          },
          {
            time: 0.9,
            bodyParts: {
              rightHand: { rotation: new THREE.Euler(0, 0, -Math.PI / 6) }
            }
          }
        ],
        contextualUse: ['cumprimento', 'despedida', 'chamar atenção']
      },
      {
        id: 'thinking',
        name: 'Pensando',
        category: 'conversation',
        culture: 'universal',
        description: 'Gesto de reflexão',
        duration: 3,
        intensity: 0.5,
        keyframes: [
          {
            time: 0,
            bodyParts: {
              rightHand: {
                rotation: new THREE.Euler(0, 0, 0),
                fingers: { thumb: 0.8, index: 0.8, middle: 0.3, ring: 0.2, pinky: 0.2 }
              }
            }
          },
          {
            time: 0.5,
            bodyParts: {
              rightArm: { rotation: new THREE.Euler(-Math.PI / 3, 0, Math.PI / 6) },
              rightHand: { rotation: new THREE.Euler(0, 0, 0), position: new THREE.Vector3(0, 0.2, 0.1) },
              head: { rotation: new THREE.Euler(0.1, 0.2, 0) }
            }
          },
          {
            time: 1.5,
            bodyParts: {
              head: { rotation: new THREE.Euler(0.1, -0.2, 0) }
            }
          }
        ],
        contextualUse: ['reflexão', 'dúvida', 'consideração']
      }
    ];

    universalGestures.forEach(gesture => {
      this.gestures.set(gesture.id, gesture);
    });
  }

  private initializeEmotions(): void {
    // Estados emocionais complexos
    const emotions: EmotionState[] = [
      {
        id: 'alegria_brasileira',
        name: 'Alegria Brasileira',
        intensity: 0.9,
        primaryEmotion: 'joy',
        secondaryEmotions: ['excitement', 'warmth'],
        facialExpressions: [
          {
            blendShape: 'mouthSmile',
            value: 0.9,
            duration: 1000,
            easing: 'easeInOut'
          },
          {
            blendShape: 'eyeSquint',
            value: 0.4,
            duration: 800,
            easing: 'easeOut'
          },
          {
            blendShape: 'cheekPuff',
            value: 0.3,
            duration: 600,
            easing: 'linear'
          }
        ],
        microExpressions: [],
        bodyLanguage: [
          {
            bodyPart: 'torso',
            movement: 'lean',
            direction: new THREE.Vector3(0, 0, 0.1),
            intensity: 0.3
          },
          {
            bodyPart: 'shoulders',
            movement: 'open',
            direction: new THREE.Vector3(0.1, 0, 0),
            intensity: 0.4
          }
        ],
        vocalCharacteristics: {
          pitch: 0.3,
          speed: 1.1,
          volume: 0.8,
          tremor: 0,
          breathiness: 0.1
        }
      },
      {
        id: 'saudade',
        name: 'Saudade',
        intensity: 0.7,
        primaryEmotion: 'nostalgia',
        secondaryEmotions: ['melancholy', 'longing'],
        facialExpressions: [
          {
            blendShape: 'mouthFrown',
            value: 0.3,
            duration: 1500,
            easing: 'easeInOut'
          },
          {
            blendShape: 'eyeSad',
            value: 0.5,
            duration: 1200,
            easing: 'easeIn'
          },
          {
            blendShape: 'browInnerUp',
            value: 0.4,
            duration: 1000,
            easing: 'linear'
          }
        ],
        microExpressions: [],
        bodyLanguage: [
          {
            bodyPart: 'head',
            movement: 'tilt',
            direction: new THREE.Vector3(0.1, 0, 0),
            intensity: 0.3
          },
          {
            bodyPart: 'shoulders',
            movement: 'lean',
            direction: new THREE.Vector3(0, -0.05, 0),
            intensity: 0.2
          }
        ],
        vocalCharacteristics: {
          pitch: -0.2,
          speed: 0.9,
          volume: 0.6,
          tremor: 0.1,
          breathiness: 0.3
        }
      },
      {
        id: 'empolgacao',
        name: 'Empolgação',
        intensity: 0.95,
        primaryEmotion: 'excitement',
        secondaryEmotions: ['anticipation', 'enthusiasm'],
        facialExpressions: [
          {
            blendShape: 'mouthOpen',
            value: 0.4,
            duration: 500,
            easing: 'easeOut'
          },
          {
            blendShape: 'eyeWide',
            value: 0.6,
            duration: 400,
            easing: 'easeOut'
          },
          {
            blendShape: 'browUp',
            value: 0.5,
            duration: 300,
            easing: 'linear'
          }
        ],
        microExpressions: [],
        bodyLanguage: [
          {
            bodyPart: 'torso',
            movement: 'lean',
            direction: new THREE.Vector3(0, 0.1, 0.2),
            intensity: 0.5
          }
        ],
        vocalCharacteristics: {
          pitch: 0.4,
          speed: 1.3,
          volume: 0.9,
          tremor: 0.05,
          breathiness: 0.2
        }
      },
      {
        id: 'desconfianca',
        name: 'Desconfiança',
        intensity: 0.6,
        primaryEmotion: 'suspicion',
        secondaryEmotions: ['doubt', 'caution'],
        facialExpressions: [
          {
            blendShape: 'eyeSquint',
            value: 0.6,
            duration: 800,
            easing: 'easeIn'
          },
          {
            blendShape: 'browFurrow',
            value: 0.5,
            duration: 700,
            easing: 'linear'
          },
          {
            blendShape: 'mouthPucker',
            value: 0.2,
            duration: 600,
            easing: 'easeInOut'
          }
        ],
        microExpressions: [],
        bodyLanguage: [
          {
            bodyPart: 'head',
            movement: 'tilt',
            direction: new THREE.Vector3(0, 0, 0.15),
            intensity: 0.4
          },
          {
            bodyPart: 'torso',
            movement: 'lean',
            direction: new THREE.Vector3(0, 0, -0.1),
            intensity: 0.3
          }
        ],
        vocalCharacteristics: {
          pitch: -0.1,
          speed: 0.8,
          volume: 0.5,
          tremor: 0,
          breathiness: 0.1
        }
      }
    ];

    emotions.forEach(emotion => {
      this.emotions.set(emotion.id, emotion);
    });
  }

  private initializeMicroExpressions(): void {
    // Micro-expressões sutis para realismo
    const microExpressions: MicroExpression[] = [
      {
        id: 'blink',
        name: 'Piscar',
        trigger: 'random',
        frequency: 15,
        duration: 150,
        blendShapes: new Map([
          ['eyeBlinkLeft', 1],
          ['eyeBlinkRight', 1]
        ])
      },
      {
        id: 'eye_dart',
        name: 'Movimento Rápido dos Olhos',
        trigger: 'contextual',
        frequency: 5,
        duration: 200,
        blendShapes: new Map([
          ['eyeLookLeft', 0.3],
          ['eyeLookRight', -0.3]
        ])
      },
      {
        id: 'lip_compression',
        name: 'Compressão dos Lábios',
        trigger: 'emotional',
        frequency: 3,
        duration: 300,
        blendShapes: new Map([
          ['mouthPress', 0.4],
          ['mouthTighten', 0.3]
        ])
      },
      {
        id: 'nostril_flare',
        name: 'Dilatação das Narinas',
        trigger: 'emotional',
        frequency: 2,
        duration: 400,
        blendShapes: new Map([
          ['noseSneer', 0.2],
          ['nostrilDilate', 0.3]
        ])
      },
      {
        id: 'eyebrow_flash',
        name: 'Flash de Sobrancelha',
        trigger: 'contextual',
        frequency: 1,
        duration: 250,
        blendShapes: new Map([
          ['browUpLeft', 0.4],
          ['browUpRight', 0.4]
        ])
      },
      {
        id: 'mouth_corner_pull',
        name: 'Puxada do Canto da Boca',
        trigger: 'emotional',
        frequency: 4,
        duration: 350,
        blendShapes: new Map([
          ['mouthCornerPullLeft', 0.2],
          ['mouthCornerPullRight', 0.2]
        ])
      },
      {
        id: 'swallow',
        name: 'Engolir',
        trigger: 'random',
        frequency: 1,
        duration: 500,
        blendShapes: new Map([
          ['throatSwallow', 0.6],
          ['jawOpen', -0.1]
        ])
      },
      {
        id: 'tongue_show',
        name: 'Mostrar Língua Sutilmente',
        trigger: 'contextual',
        frequency: 0.5,
        duration: 200,
        blendShapes: new Map([
          ['tongueOut', 0.1],
          ['mouthOpen', 0.05]
        ])
      }
    ];

    microExpressions.forEach(micro => {
      this.microExpressions.set(micro.id, micro);
    });
  }

  private initializeCulturalVariations(): void {
    // Variações culturais de gestos
    this.culturalVariations.set('personal_space', {
      brazilian: 0.5, // metros - brasileiros ficam mais próximos
      american: 1.2,
      japanese: 1.5,
      middle_eastern: 0.8
    });

    this.culturalVariations.set('touch_frequency', {
      brazilian: 0.8, // alta frequência de toque
      american: 0.3,
      japanese: 0.1,
      middle_eastern: 0.4
    });

    this.culturalVariations.set('gesture_amplitude', {
      brazilian: 0.9, // gestos amplos
      american: 0.6,
      japanese: 0.3,
      middle_eastern: 0.7
    });

    this.culturalVariations.set('eye_contact_duration', {
      brazilian: 0.7,
      american: 0.5,
      japanese: 0.3,
      middle_eastern: 0.6
    });
  }

  // Aplicar gesto a um avatar
  async applyGesture(
    avatarId: string,
    gestureId: string,
    options?: {
      intensity?: number;
      speed?: number;
      loop?: boolean;
      blendWithCurrent?: boolean;
    }
  ): Promise<void> {
    const gesture = this.gestures.get(gestureId);
    if (!gesture) {
      throw new Error(`Gesto ${gestureId} não encontrado`);
    }

    const intensity = options?.intensity ?? gesture.intensity;
    const speed = options?.speed ?? 1;
    const loop = options?.loop ?? false;
    const blendWithCurrent = options?.blendWithCurrent ?? false;

    // Criar animação
    const animation = {
      avatarId,
      gesture,
      intensity,
      speed,
      loop,
      blendWithCurrent,
      currentTime: 0,
      isPlaying: true
    };

    this.activeAnimations.set(`${avatarId}_gesture`, animation);

    // Executar animação
    await this.playGestureAnimation(animation);
  }

  private async playGestureAnimation(animation: any): Promise<void> {
    const { gesture, intensity, speed } = animation;
    const duration = gesture.duration * 1000 / speed; // Converter para milissegundos
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const animate = () => {
        if (!animation.isPlaying) {
          resolve();
          return;
        }
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Interpolar entre keyframes
        const currentKeyframe = this.interpolateKeyframes(gesture.keyframes, progress);
        
        // Aplicar transformações ao avatar
        this.applyKeyframeToAvatar(animation.avatarId, currentKeyframe, intensity);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else if (animation.loop) {
          // Reiniciar se em loop
          animation.currentTime = 0;
          this.playGestureAnimation(animation);
        } else {
          animation.isPlaying = false;
          resolve();
        }
      };
      
      animate();
    });
  }

  private interpolateKeyframes(keyframes: AnimationKeyframe[], progress: number): AnimationKeyframe {
    // Encontrar keyframes adjacentes
    let prevKeyframe: AnimationKeyframe | null = null;
    let nextKeyframe: AnimationKeyframe | null = null;
    
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= progress) {
        prevKeyframe = keyframes[i];
      }
      if (keyframes[i].time > progress && !nextKeyframe) {
        nextKeyframe = keyframes[i];
        break;
      }
    }
    
    if (!prevKeyframe) return keyframes[0];
    if (!nextKeyframe) return keyframes[keyframes.length - 1];
    
    // Calcular fator de interpolação
    const range = nextKeyframe.time - prevKeyframe.time;
    const elapsed = progress - prevKeyframe.time;
    const t = elapsed / range;
    
    // Interpolar entre keyframes
    return this.lerpKeyframes(prevKeyframe, nextKeyframe, t);
  }

  private lerpKeyframes(from: AnimationKeyframe, to: AnimationKeyframe, t: number): AnimationKeyframe {
    const result: AnimationKeyframe = {
      time: from.time + (to.time - from.time) * t,
      bodyParts: {}
    };
    
    // Interpolar cada parte do corpo
    Object.keys(from.bodyParts).forEach(part => {
      const fromPart = from.bodyParts[part as keyof typeof from.bodyParts];
      const toPart = to.bodyParts[part as keyof typeof to.bodyParts];
      
      if (fromPart && toPart) {
        result.bodyParts[part as keyof typeof result.bodyParts] = this.lerpBodyPart(fromPart, toPart, t);
      }
    });
    
    return result;
  }

  private lerpBodyPart(from: any, to: any, t: number): any {
    const result: any = {};
    
    if (from.rotation && to.rotation) {
      result.rotation = new THREE.Euler(
        from.rotation.x + (to.rotation.x - from.rotation.x) * t,
        from.rotation.y + (to.rotation.y - from.rotation.y) * t,
        from.rotation.z + (to.rotation.z - from.rotation.z) * t
      );
    }
    
    if (from.position && to.position) {
      result.position = new THREE.Vector3(
        from.position.x + (to.position.x - from.position.x) * t,
        from.position.y + (to.position.y - from.position.y) * t,
        from.position.z + (to.position.z - from.position.z) * t
      );
    }
    
    if (from.fingers && to.fingers) {
      result.fingers = {
        thumb: from.fingers.thumb + (to.fingers.thumb - from.fingers.thumb) * t,
        index: from.fingers.index + (to.fingers.index - from.fingers.index) * t,
        middle: from.fingers.middle + (to.fingers.middle - from.fingers.middle) * t,
        ring: from.fingers.ring + (to.fingers.ring - from.fingers.ring) * t,
        pinky: from.fingers.pinky + (to.fingers.pinky - from.fingers.pinky) * t
      };
    }
    
    return result;
  }

  private applyKeyframeToAvatar(avatarId: string, keyframe: AnimationKeyframe, intensity: number): void {
    // Esta função seria integrada com o sistema de avatar real
    // Por enquanto, apenas registra a aplicação
    console.log(`Aplicando keyframe ao avatar ${avatarId} com intensidade ${intensity}`);
  }

  // Aplicar emoção a um avatar
  async applyEmotion(
    avatarId: string,
    emotionId: string,
    options?: {
      intensity?: number;
      duration?: number;
      blendWithCurrent?: boolean;
    }
  ): Promise<void> {
    const emotion = this.emotions.get(emotionId);
    if (!emotion) {
      throw new Error(`Emoção ${emotionId} não encontrada`);
    }

    const intensity = options?.intensity ?? emotion.intensity;
    const duration = options?.duration ?? 3000;

    // Aplicar expressões faciais
    for (const expression of emotion.facialExpressions) {
      await this.applyFacialExpression(avatarId, expression, intensity);
    }

    // Aplicar linguagem corporal
    for (const bodyLanguage of emotion.bodyLanguage) {
      await this.applyBodyLanguage(avatarId, bodyLanguage, intensity);
    }

    // Aplicar micro-expressões
    this.startMicroExpressions(avatarId, emotion.microExpressions);
  }

  private async applyFacialExpression(
    avatarId: string,
    expression: FacialExpression,
    intensity: number
  ): Promise<void> {
    // Integrar com sistema de animação facial
    const facialSystem = FacialAnimationSystem.getInstance();
    facialSystem.addExpression(avatarId, expression.blendShape, expression.value * intensity);
  }

  private async applyBodyLanguage(
    avatarId: string,
    bodyLanguage: BodyLanguageElement,
    intensity: number
  ): Promise<void> {
    // Aplicar movimento corporal
    console.log(`Aplicando linguagem corporal ${bodyLanguage.movement} ao avatar ${avatarId}`);
  }

  private startMicroExpressions(avatarId: string, microExpressionIds: string[]): void {
    // Iniciar ciclo de micro-expressões
    microExpressionIds.forEach(id => {
      const micro = this.microExpressions.get(id);
      if (micro) {
        this.scheduleMicroExpression(avatarId, micro);
      }
    });
  }

  private scheduleMicroExpression(avatarId: string, micro: MicroExpression): void {
    const interval = (60000 / micro.frequency); // Converter frequência para intervalo em ms
    
    const applyMicro = () => {
      if (micro.trigger === 'random' || this.checkTriggerCondition(micro.trigger)) {
        // Aplicar micro-expressão
        micro.blendShapes.forEach((value, blendShape) => {
          const facialSystem = FacialAnimationSystem.getInstance();
          facialSystem.addMicroExpression(avatarId, blendShape, value);
        });
        
        // Remover após duração
        setTimeout(() => {
          micro.blendShapes.forEach((_, blendShape) => {
            const facialSystem = FacialAnimationSystem.getInstance();
            facialSystem.removeMicroExpression(avatarId, blendShape);
          });
        }, micro.duration);
      }
      
      // Agendar próxima ocorrência com variação aleatória
      const nextInterval = interval + (Math.random() - 0.5) * interval * 0.3;
      setTimeout(applyMicro, nextInterval);
    };
    
    // Iniciar com delay aleatório
    setTimeout(applyMicro, Math.random() * interval);
  }

  private checkTriggerCondition(trigger: string): boolean {
    // Verificar condições contextuais ou emocionais
    // Por enquanto, retorna true com 50% de chance
    return Math.random() > 0.5;
  }

  // Criar gesto composto
  createCompositeGesture(config: CompositeGesture): void {
    this.compositeGestures.set(config.id, config);
  }

  // Aplicar gesto composto
  async applyCompositeGesture(
    avatarId: string,
    compositeId: string,
    options?: any
  ): Promise<void> {
    const composite = this.compositeGestures.get(compositeId);
    if (!composite) {
      throw new Error(`Gesto composto ${compositeId} não encontrado`);
    }

    if (composite.timing === 'sequential') {
      // Executar gestos sequencialmente
      for (const gestureId of composite.gestures) {
        await this.applyGesture(avatarId, gestureId, options);
        await this.sleep(composite.transitionDuration);
      }
    } else if (composite.timing === 'parallel') {
      // Executar gestos em paralelo
      const promises = composite.gestures.map(gestureId =>
        this.applyGesture(avatarId, gestureId, { ...options, blendWithCurrent: true })
      );
      await Promise.all(promises);
    } else if (composite.timing === 'overlapping') {
      // Executar com sobreposição
      for (let i = 0; i < composite.gestures.length; i++) {
        this.applyGesture(avatarId, composite.gestures[i], { ...options, blendWithCurrent: true });
        if (i < composite.gestures.length - 1) {
          await this.sleep(composite.transitionDuration / 2);
        }
      }
    }

    // Aplicar emoções associadas
    for (const emotionId of composite.emotions) {
      await this.applyEmotion(avatarId, emotionId, options);
    }
  }

  // Obter gesto por contexto
  getGesturesByContext(context: string): GestureAnimation[] {
    return Array.from(this.gestures.values()).filter(gesture =>
      gesture.contextualUse.includes(context)
    );
  }

  // Obter gestos por cultura
  getGesturesByCulture(culture: 'brazilian' | 'universal'): GestureAnimation[] {
    return Array.from(this.gestures.values()).filter(gesture =>
      gesture.culture === culture
    );
  }

  // Adaptar gesto para cultura
  adaptGestureForCulture(gestureId: string, culture: string): GestureAnimation {
    const gesture = this.gestures.get(gestureId);
    if (!gesture) {
      throw new Error(`Gesto ${gestureId} não encontrado`);
    }

    const culturalAmplitude = this.culturalVariations.get('gesture_amplitude')?.[culture] || 1;
    
    // Ajustar intensidade baseado na cultura
    const adaptedGesture = { ...gesture };
    adaptedGesture.intensity *= culturalAmplitude;
    
    return adaptedGesture;
  }

  // Parar animação ativa
  stopAnimation(avatarId: string): void {
    const animation = this.activeAnimations.get(`${avatarId}_gesture`);
    if (animation) {
      animation.isPlaying = false;
    }
  }

  // Limpar todas as animações
  clearAllAnimations(): void {
    this.activeAnimations.forEach(animation => {
      animation.isPlaying = false;
    });
    this.activeAnimations.clear();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Getters
  getAllGestures(): GestureAnimation[] {
    return Array.from(this.gestures.values());
  }

  getAllEmotions(): EmotionState[] {
    return Array.from(this.emotions.values());
  }

  getAllMicroExpressions(): MicroExpression[] {
    return Array.from(this.microExpressions.values());
  }

  getGesture(id: string): GestureAnimation | undefined {
    return this.gestures.get(id);
  }

  getEmotion(id: string): EmotionState | undefined {
    return this.emotions.get(id);
  }

  getCulturalVariation(aspect: string, culture: string): number {
    return this.culturalVariations.get(aspect)?.[culture] || 1;
  }
}

export default GestureEmotionLibrary;