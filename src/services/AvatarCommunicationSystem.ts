// Sistema Avançado de Comunicação entre Avatares 3D
import * as THREE from 'three';
import { Avatar3DSystem } from './Avatar3DSystem';
import { FacialAnimationSystem } from '../lib/animation/FacialAnimationSystem';
import { TTSService } from '../lib/tts/TTSService';
import { HyperRealisticAvatarSystem } from '../lib/rendering/HyperRealisticAvatarSystem';
import GestureEmotionLibrary from './GestureEmotionLibrary';

export interface DialogueLine {
  id: string;
  avatarId: string;
  text: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'confused' | 'excited';
  gesture?: string;
  duration?: number;
  delay?: number;
  responseToId?: string; // ID da fala anterior para contexto
  interactionType?: 'statement' | 'question' | 'response' | 'greeting' | 'farewell';
}

export interface ConversationConfig {
  id: string;
  name: string;
  avatars: string[]; // IDs dos avatares participantes
  dialogues: DialogueLine[];
  environment?: string;
  cameraMovements?: CameraMovement[];
  backgroundMusic?: string;
}

export interface CameraMovement {
  startTime: number;
  duration: number;
  from: { position: THREE.Vector3; lookAt: THREE.Vector3 };
  to: { position: THREE.Vector3; lookAt: THREE.Vector3 };
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface AvatarInteraction {
  type: 'look_at' | 'gesture_to' | 'move_to' | 'turn_to';
  sourceAvatar: string;
  targetAvatar?: string;
  targetPosition?: THREE.Vector3;
  duration: number;
  startTime: number;
}

export interface ConversationContext {
  topic: string;
  mood: 'formal' | 'casual' | 'educational' | 'emotional' | 'humorous';
  participants: Map<string, ParticipantState>;
  currentSpeaker: string | null;
  lastSpeaker: string | null;
  conversationHistory: DialogueLine[];
}

export interface ParticipantState {
  avatarId: string;
  currentEmotion: string;
  attentionTarget: string | null;
  speakingTime: number;
  lastSpokeAt: number;
  interactionCount: number;
}

export class AvatarCommunicationSystem {
  private static instance: AvatarCommunicationSystem;
  private avatarSystem: Avatar3DSystem;
  private facialAnimation: FacialAnimationSystem;
  private ttsService: TTSService;
  private hyperRealisticSystem: HyperRealisticAvatarSystem | null = null;
  private gestureLibrary: GestureEmotionLibrary;
  
  private activeConversations: Map<string, ConversationConfig> = new Map();
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private avatarPositions: Map<string, THREE.Vector3> = new Map();
  private avatarOrientations: Map<string, THREE.Quaternion> = new Map();
  
  private currentConversationId: string | null = null;
  private currentDialogueIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  
  // Gestos brasileiros específicos
  private brazilianGestures = {
    'aceno': { type: 'wave', intensity: 0.8, duration: 2 },
    'joia': { type: 'thumbs_up', intensity: 1.0, duration: 1.5 },
    'abraco': { type: 'hug', intensity: 0.9, duration: 3 },
    'beijo': { type: 'kiss', intensity: 0.7, duration: 1 },
    'apontar': { type: 'point', intensity: 0.8, duration: 2 },
    'concordar': { type: 'nod', intensity: 0.6, duration: 1 },
    'discordar': { type: 'head_shake', intensity: 0.6, duration: 1 },
    'pensar': { type: 'thinking', intensity: 0.5, duration: 2 },
    'dar_ombros': { type: 'shrug', intensity: 0.7, duration: 1.5 },
    'aplaudir': { type: 'clap', intensity: 0.9, duration: 2 }
  };
  
  // Expressões faciais contextuais
  private contextualExpressions = {
    'greeting': ['smile', 'eyebrow_raise', 'head_tilt'],
    'question': ['eyebrow_raise', 'head_tilt', 'slight_frown'],
    'agreement': ['nod', 'smile', 'eye_contact'],
    'disagreement': ['head_shake', 'frown', 'look_away'],
    'surprise': ['eye_widen', 'mouth_open', 'eyebrow_raise'],
    'thinking': ['look_up', 'slight_frown', 'lip_bite']
  };

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    avatarSystem: Avatar3DSystem
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.avatarSystem = avatarSystem;
    this.facialAnimation = FacialAnimationSystem.getInstance();
    this.ttsService = new TTSService();
    this.gestureLibrary = GestureEmotionLibrary.getInstance();
    
    this.initialize();
  }

  static getInstance(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    avatarSystem: Avatar3DSystem
  ): AvatarCommunicationSystem {
    if (!AvatarCommunicationSystem.instance) {
      AvatarCommunicationSystem.instance = new AvatarCommunicationSystem(
        scene, camera, renderer, avatarSystem
      );
    }
    return AvatarCommunicationSystem.instance;
  }

  private async initialize(): Promise<void> {
    // Tentar inicializar o sistema hiper-realista se disponível
    try {
      this.hyperRealisticSystem = HyperRealisticAvatarSystem.getInstance(
        this.scene, this.renderer, this.camera
      );
    } catch (error) {
      console.log('Sistema hiper-realista não disponível, usando sistema padrão');
    }
  }

  // Criar uma nova conversa entre avatares
  async createConversation(config: ConversationConfig): Promise<string> {
    const conversationId = config.id || `conv_${Date.now()}`;
    
    // Validar avatares
    for (const avatarId of config.avatars) {
      const avatar = this.avatarSystem.getAvatar(avatarId);
      if (!avatar) {
        throw new Error(`Avatar ${avatarId} não encontrado`);
      }
    }
    
    // Posicionar avatares em círculo ou linha
    this.arrangeAvatarsForConversation(config.avatars);
    
    // Criar contexto da conversa
    const context: ConversationContext = {
      topic: this.extractTopicFromDialogue(config.dialogues),
      mood: this.detectConversationMood(config.dialogues),
      participants: new Map(),
      currentSpeaker: null,
      lastSpeaker: null,
      conversationHistory: []
    };
    
    // Inicializar estado dos participantes
    for (const avatarId of config.avatars) {
      context.participants.set(avatarId, {
        avatarId,
        currentEmotion: 'neutral',
        attentionTarget: null,
        speakingTime: 0,
        lastSpokeAt: 0,
        interactionCount: 0
      });
    }
    
    this.activeConversations.set(conversationId, config);
    this.conversationContexts.set(conversationId, context);
    
    return conversationId;
  }

  // Arranjar avatares para conversa
  private arrangeAvatarsForConversation(avatarIds: string[]): void {
    const count = avatarIds.length;
    
    if (count === 2) {
      // Dois avatares: face a face
      this.positionAvatarsFaceToFace(avatarIds[0], avatarIds[1]);
    } else if (count <= 4) {
      // 3-4 avatares: em semicírculo
      this.positionAvatarsInSemicircle(avatarIds);
    } else {
      // 5+ avatares: em círculo completo
      this.positionAvatarsInCircle(avatarIds);
    }
  }

  private positionAvatarsFaceToFace(avatar1Id: string, avatar2Id: string): void {
    const distance = 2.5; // metros
    
    // Posicionar primeiro avatar
    const pos1 = new THREE.Vector3(-distance/2, 0, 0);
    this.avatarSystem.setAvatarPosition(avatar1Id, pos1);
    this.avatarPositions.set(avatar1Id, pos1);
    
    // Posicionar segundo avatar
    const pos2 = new THREE.Vector3(distance/2, 0, 0);
    this.avatarSystem.setAvatarPosition(avatar2Id, pos2);
    this.avatarPositions.set(avatar2Id, pos2);
    
    // Fazer avatares se olharem
    this.makeAvatarsLookAtEachOther(avatar1Id, avatar2Id);
  }

  private positionAvatarsInSemicircle(avatarIds: string[]): void {
    const radius = 2.5;
    const angleStep = Math.PI / (avatarIds.length + 1);
    
    avatarIds.forEach((avatarId, index) => {
      const angle = angleStep * (index + 1);
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      const position = new THREE.Vector3(x, 0, z);
      this.avatarSystem.setAvatarPosition(avatarId, position);
      this.avatarPositions.set(avatarId, position);
      
      // Orientar para o centro
      const lookAtCenter = new THREE.Vector3(0, 1.6, 0);
      this.makeAvatarLookAt(avatarId, lookAtCenter);
    });
  }

  private positionAvatarsInCircle(avatarIds: string[]): void {
    const radius = 3;
    const angleStep = (Math.PI * 2) / avatarIds.length;
    
    avatarIds.forEach((avatarId, index) => {
      const angle = angleStep * index;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      const position = new THREE.Vector3(x, 0, z);
      this.avatarSystem.setAvatarPosition(avatarId, position);
      this.avatarPositions.set(avatarId, position);
      
      // Orientar para o centro
      const lookAtCenter = new THREE.Vector3(0, 1.6, 0);
      this.makeAvatarLookAt(avatarId, lookAtCenter);
    });
  }

  // Fazer avatares se olharem
  private makeAvatarsLookAtEachOther(avatar1Id: string, avatar2Id: string): void {
    const pos1 = this.avatarPositions.get(avatar1Id);
    const pos2 = this.avatarPositions.get(avatar2Id);
    
    if (pos1 && pos2) {
      const lookAt1 = pos2.clone();
      lookAt1.y = 1.6; // altura dos olhos
      this.makeAvatarLookAt(avatar1Id, lookAt1);
      
      const lookAt2 = pos1.clone();
      lookAt2.y = 1.6;
      this.makeAvatarLookAt(avatar2Id, lookAt2);
    }
  }

  private makeAvatarLookAt(avatarId: string, target: THREE.Vector3): void {
    const avatar = this.avatarSystem.getAvatar(avatarId);
    if (avatar) {
      avatar.lookAt(target);
      this.avatarOrientations.set(avatarId, avatar.quaternion.clone());
    }
  }

  // Reproduzir conversa
  async playConversation(conversationId: string): Promise<void> {
    const config = this.activeConversations.get(conversationId);
    const context = this.conversationContexts.get(conversationId);
    
    if (!config || !context) {
      throw new Error('Conversa não encontrada');
    }
    
    this.currentConversationId = conversationId;
    this.currentDialogueIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    
    // Processar cada linha de diálogo sequencialmente
    for (let i = 0; i < config.dialogues.length; i++) {
      if (!this.isPlaying) break;
      
      while (this.isPaused) {
        await this.sleep(100);
      }
      
      this.currentDialogueIndex = i;
      const dialogue = config.dialogues[i];
      
      // Atualizar contexto
      this.updateConversationContext(context, dialogue);
      
      // Processar linha de diálogo
      await this.processDialogueLine(dialogue, context, config);
      
      // Adicionar ao histórico
      context.conversationHistory.push(dialogue);
    }
    
    this.isPlaying = false;
  }

  private async processDialogueLine(
    dialogue: DialogueLine,
    context: ConversationContext,
    config: ConversationConfig
  ): Promise<void> {
    const startTime = Date.now();
    
    // 1. Preparar avatar para falar
    await this.prepareAvatarToSpeak(dialogue.avatarId, dialogue.emotion);
    
    // 2. Fazer outros avatares prestarem atenção
    await this.makeOthersPayAttention(dialogue.avatarId, config.avatars, dialogue.interactionType);
    
    // 3. Aplicar gesto se especificado
    if (dialogue.gesture) {
      this.applyGesture(dialogue.avatarId, dialogue.gesture);
    }
    
    // 4. Aplicar expressão facial contextual
    await this.applyContextualExpression(dialogue.avatarId, dialogue.interactionType || 'statement');
    
    // 5. Gerar e reproduzir áudio
    const audioBuffer = await this.ttsService.synthesizeSpeech(dialogue.text, {
      voice: this.getVoiceForAvatar(dialogue.avatarId),
      emotion: dialogue.emotion,
      speed: 1.0
    });
    
    // 6. Sincronizar lip sync
    this.startLipSync(dialogue.avatarId, dialogue.text, audioBuffer.duration);
    
    // 7. Reproduzir áudio
    await this.playAudio(audioBuffer);
    
    // 8. Aguardar delay adicional se especificado
    if (dialogue.delay) {
      await this.sleep(dialogue.delay * 1000);
    }
    
    // Atualizar tempo de fala
    const participant = context.participants.get(dialogue.avatarId);
    if (participant) {
      participant.speakingTime += (Date.now() - startTime) / 1000;
      participant.lastSpokeAt = Date.now();
      participant.interactionCount++;
    }
  }

  private async prepareAvatarToSpeak(avatarId: string, emotion: string): Promise<void> {
    // Aplicar emoção base
    this.avatarSystem.setAvatarEmotion(avatarId, emotion);
    
    // Adicionar micro-expressões
    this.addMicroExpressions(avatarId, emotion);
    
    // Ajustar postura
    this.adjustPostureForSpeaking(avatarId);
    
    await this.sleep(200); // Pequeno delay para transição suave
  }

  private async makeOthersPayAttention(
    speakerId: string,
    allAvatars: string[],
    interactionType?: string
  ): Promise<void> {
    const speakerPos = this.avatarPositions.get(speakerId);
    if (!speakerPos) return;
    
    const lookAtTarget = speakerPos.clone();
    lookAtTarget.y = 1.6; // altura dos olhos
    
    for (const avatarId of allAvatars) {
      if (avatarId === speakerId) continue;
      
      // Fazer avatar olhar para quem está falando
      this.makeAvatarLookAt(avatarId, lookAtTarget);
      
      // Aplicar reação apropriada baseada no tipo de interação
      if (interactionType === 'question') {
        this.avatarSystem.setAvatarExpression(avatarId, 'attentive');
      } else if (interactionType === 'greeting') {
        this.avatarSystem.setAvatarExpression(avatarId, 'friendly');
      }
    }
  }

  private applyGesture(avatarId: string, gestureName: string): void {
    // Primeiro tentar usar gesto da biblioteca
    const libraryGesture = this.gestureLibrary.getGesture(gestureName);
    
    if (libraryGesture) {
      // Usar gesto da biblioteca avançada
      this.gestureLibrary.applyGesture(avatarId, gestureName, {
        intensity: 0.8,
        speed: 1.0,
        loop: false,
        blendWithCurrent: true
      });
    } else {
      // Fallback para gestos internos simples
      const gesture = this.brazilianGestures[gestureName as keyof typeof this.brazilianGestures];
      
      if (gesture) {
        this.avatarSystem.playAvatarAnimation(avatarId, gesture.type, {
          intensity: gesture.intensity,
          duration: gesture.duration,
          loop: false
        });
      }
    }
  }

  private async applyContextualExpression(avatarId: string, interactionType: string): Promise<void> {
    const expressions = this.contextualExpressions[interactionType as keyof typeof this.contextualExpressions];
    
    if (expressions) {
      for (const expression of expressions) {
        this.facialAnimation.addExpression(avatarId, expression, 0.5);
      }
    }
  }

  private startLipSync(avatarId: string, text: string, duration: number): void {
    if (this.hyperRealisticSystem) {
      this.hyperRealisticSystem.playLipSync(avatarId, text, duration);
    } else {
      this.facialAnimation.playLipSync(text, duration);
    }
  }

  private async playAudio(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => resolve();
        source.start();
      } catch (error) {
        console.error('Erro ao reproduzir áudio:', error);
        // Continuar sem áudio em caso de erro
        setTimeout(resolve, 2000); // Simular duração de fala
      }
    });
  }

  private addMicroExpressions(avatarId: string, baseEmotion: string): void {
    // Usar biblioteca de emoções para micro-expressões mais realistas
    const emotion = this.gestureLibrary.getEmotion(`${baseEmotion}_brasileiro`) || 
                    this.gestureLibrary.getEmotion(baseEmotion);
    
    if (emotion) {
      this.gestureLibrary.applyEmotion(avatarId, emotion.id, {
        intensity: 0.7,
        duration: 2000,
        blendWithCurrent: true
      });
    } else {
      // Fallback para micro-expressões simples
      const microExpressions = {
        'happy': ['slight_eye_squint', 'corner_mouth_lift'],
        'sad': ['inner_brow_raise', 'lip_corner_down'],
        'angry': ['brow_furrow', 'nostril_flare'],
        'surprised': ['rapid_blink', 'mouth_slight_open'],
        'neutral': ['occasional_blink', 'subtle_head_movement']
      };
      
      const expressions = microExpressions[baseEmotion as keyof typeof microExpressions] || microExpressions.neutral;
      
      expressions.forEach(expr => {
        this.facialAnimation.addMicroExpression(avatarId, expr, Math.random() * 0.3 + 0.1);
      });
    }
  }

  private adjustPostureForSpeaking(avatarId: string): void {
    // Ajustar postura corporal para parecer mais natural ao falar
    const avatar = this.avatarSystem.getAvatar(avatarId);
    if (!avatar) return;
    
    // Leve inclinação para frente (engajamento)
    avatar.rotation.x = 0.05;
    
    // Movimento sutil de balanço
    this.animateSubtleSwaying(avatar);
  }

  private animateSubtleSwaying(avatar: THREE.Group): void {
    const startRotation = avatar.rotation.z;
    const swayAmount = 0.02;
    const swaySpeed = 2;
    
    const animate = () => {
      if (!this.isPlaying) return;
      
      avatar.rotation.z = startRotation + Math.sin(Date.now() * 0.001 * swaySpeed) * swayAmount;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  private updateConversationContext(context: ConversationContext, dialogue: DialogueLine): void {
    context.lastSpeaker = context.currentSpeaker;
    context.currentSpeaker = dialogue.avatarId;
    
    // Atualizar estado emocional do falante
    const participant = context.participants.get(dialogue.avatarId);
    if (participant) {
      participant.currentEmotion = dialogue.emotion;
    }
    
    // Ajustar mood da conversa se necessário
    if (dialogue.emotion === 'angry' || dialogue.emotion === 'sad') {
      if (context.mood === 'casual' || context.mood === 'humorous') {
        context.mood = 'emotional';
      }
    }
  }

  private extractTopicFromDialogue(dialogues: DialogueLine[]): string {
    // Análise simples do tópico baseada em palavras-chave
    const allText = dialogues.map(d => d.text).join(' ');
    
    // Detectar tópicos comuns
    if (allText.includes('trabalho') || allText.includes('projeto')) return 'work';
    if (allText.includes('família') || allText.includes('filho')) return 'family';
    if (allText.includes('estudo') || allText.includes('escola')) return 'education';
    
    return 'general';
  }

  private detectConversationMood(dialogues: DialogueLine[]): 'formal' | 'casual' | 'educational' | 'emotional' | 'humorous' {
    const emotions = dialogues.map(d => d.emotion);
    
    if (emotions.filter(e => e === 'happy' || e === 'excited').length > dialogues.length / 2) {
      return 'humorous';
    }
    if (emotions.filter(e => e === 'sad' || e === 'angry').length > dialogues.length / 3) {
      return 'emotional';
    }
    
    // Analisar formalidade pelo texto
    const hasInformalWords = dialogues.some(d => 
      d.text.includes('oi') || d.text.includes('né') || d.text.includes('cara')
    );
    
    return hasInformalWords ? 'casual' : 'formal';
  }

  private getVoiceForAvatar(avatarId: string): string {
    // Mapear avatar para voz apropriada
    const voiceMap: { [key: string]: string } = {
      'avatar_male_1': 'br-male-adult-1',
      'avatar_female_1': 'br-female-adult-1',
      'avatar_young_1': 'br-male-young-1',
      'avatar_elderly_1': 'br-female-elderly-1'
    };
    
    return voiceMap[avatarId] || 'br-male-adult-1';
  }

  // Controles de reprodução
  pauseConversation(): void {
    this.isPaused = true;
  }

  resumeConversation(): void {
    this.isPaused = false;
  }

  stopConversation(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentConversationId = null;
    this.currentDialogueIndex = 0;
  }

  // Adicionar reações dinâmicas durante a conversa
  async addDynamicReaction(
    avatarId: string,
    reaction: 'agree' | 'disagree' | 'surprise' | 'confusion' | 'laugh'
  ): Promise<void> {
    const reactions = {
      'agree': { gesture: 'concordar', expression: 'happy', sound: 'uhum' },
      'disagree': { gesture: 'discordar', expression: 'confused', sound: 'hmm' },
      'surprise': { gesture: null, expression: 'surprised', sound: 'oh' },
      'confusion': { gesture: 'dar_ombros', expression: 'confused', sound: 'huh' },
      'laugh': { gesture: null, expression: 'happy', sound: 'haha' }
    };
    
    const reactionConfig = reactions[reaction];
    
    if (reactionConfig) {
      // Aplicar expressão
      this.avatarSystem.setAvatarExpression(avatarId, reactionConfig.expression);
      
      // Aplicar gesto se houver
      if (reactionConfig.gesture) {
        this.applyGesture(avatarId, reactionConfig.gesture);
      }
      
      // Reproduzir som de reação (opcional)
      if (reactionConfig.sound) {
        // Implementar reprodução de sons curtos de reação
      }
    }
  }

  // Criar conversa a partir de template
  createConversationFromTemplate(
    template: 'interview' | 'meeting' | 'casual_chat' | 'presentation' | 'training',
    avatarIds: string[],
    customData?: any
  ): ConversationConfig {
    const templates = {
      'interview': this.createInterviewTemplate(avatarIds, customData),
      'meeting': this.createMeetingTemplate(avatarIds, customData),
      'casual_chat': this.createCasualChatTemplate(avatarIds, customData),
      'presentation': this.createPresentationTemplate(avatarIds, customData),
      'training': this.createTrainingTemplate(avatarIds, customData)
    };
    
    return templates[template];
  }

  private createInterviewTemplate(avatarIds: string[], data?: any): ConversationConfig {
    const [interviewer, candidate] = avatarIds;
    
    return {
      id: `interview_${Date.now()}`,
      name: 'Entrevista de Emprego',
      avatars: avatarIds,
      dialogues: [
        {
          id: '1',
          avatarId: interviewer,
          text: 'Bom dia! Seja bem-vindo. Por favor, sente-se.',
          emotion: 'happy',
          gesture: 'aceno',
          interactionType: 'greeting'
        },
        {
          id: '2',
          avatarId: candidate,
          text: 'Bom dia! Muito obrigado pela oportunidade.',
          emotion: 'happy',
          gesture: 'concordar',
          interactionType: 'response',
          responseToId: '1'
        },
        {
          id: '3',
          avatarId: interviewer,
          text: 'Pode me contar um pouco sobre sua experiência profissional?',
          emotion: 'neutral',
          interactionType: 'question'
        },
        {
          id: '4',
          avatarId: candidate,
          text: data?.experience || 'Tenho 5 anos de experiência na área, trabalhando com projetos desafiadores.',
          emotion: 'neutral',
          gesture: 'apontar',
          interactionType: 'response',
          responseToId: '3'
        }
      ]
    };
  }

  private createMeetingTemplate(avatarIds: string[], data?: any): ConversationConfig {
    return {
      id: `meeting_${Date.now()}`,
      name: 'Reunião de Equipe',
      avatars: avatarIds,
      dialogues: [
        {
          id: '1',
          avatarId: avatarIds[0],
          text: 'Bom dia a todos! Vamos começar nossa reunião semanal.',
          emotion: 'neutral',
          gesture: 'aceno',
          interactionType: 'greeting'
        },
        {
          id: '2',
          avatarId: avatarIds[1],
          text: 'Bom dia! Tenho algumas atualizações importantes do projeto.',
          emotion: 'neutral',
          interactionType: 'statement'
        }
      ]
    };
  }

  private createCasualChatTemplate(avatarIds: string[], data?: any): ConversationConfig {
    return {
      id: `chat_${Date.now()}`,
      name: 'Conversa Casual',
      avatars: avatarIds,
      dialogues: [
        {
          id: '1',
          avatarId: avatarIds[0],
          text: 'Oi! Como você está?',
          emotion: 'happy',
          gesture: 'aceno',
          interactionType: 'greeting'
        },
        {
          id: '2',
          avatarId: avatarIds[1],
          text: 'Oi! Estou bem, e você?',
          emotion: 'happy',
          gesture: 'joia',
          interactionType: 'response',
          responseToId: '1'
        }
      ]
    };
  }

  private createPresentationTemplate(avatarIds: string[], data?: any): ConversationConfig {
    return {
      id: `presentation_${Date.now()}`,
      name: 'Apresentação',
      avatars: avatarIds,
      dialogues: [
        {
          id: '1',
          avatarId: avatarIds[0],
          text: data?.openingText || 'Hoje vou apresentar nosso novo produto.',
          emotion: 'confident',
          gesture: 'apontar',
          interactionType: 'statement'
        }
      ]
    };
  }

  private createTrainingTemplate(avatarIds: string[], data?: any): ConversationConfig {
    const [instructor, ...trainees] = avatarIds;
    
    return {
      id: `training_${Date.now()}`,
      name: 'Treinamento',
      avatars: avatarIds,
      dialogues: [
        {
          id: '1',
          avatarId: instructor,
          text: 'Bem-vindos ao treinamento de hoje sobre segurança no trabalho.',
          emotion: 'neutral',
          gesture: 'aceno',
          interactionType: 'greeting'
        },
        {
          id: '2',
          avatarId: instructor,
          text: 'Vamos começar com os conceitos básicos.',
          emotion: 'neutral',
          gesture: 'apontar',
          interactionType: 'statement'
        },
        {
          id: '3',
          avatarId: trainees[0],
          text: 'Professor, pode explicar melhor esse ponto?',
          emotion: 'confused',
          gesture: 'pensar',
          interactionType: 'question'
        }
      ]
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Getters para estado
  getActiveConversations(): ConversationConfig[] {
    return Array.from(this.activeConversations.values());
  }

  getCurrentConversationState(): {
    conversationId: string | null;
    dialogueIndex: number;
    isPlaying: boolean;
    isPaused: boolean;
  } {
    return {
      conversationId: this.currentConversationId,
      dialogueIndex: this.currentDialogueIndex,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused
    };
  }

  getConversationContext(conversationId: string): ConversationContext | undefined {
    return this.conversationContexts.get(conversationId);
  }
}

export default AvatarCommunicationSystem;