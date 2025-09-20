const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const AICacheService = require('../services/aiCacheService');
const PromptTemplateService = require('../services/promptTemplateService');

// Middleware de autenticação (simulado)
const authenticateUser = (req, res, next) => {
  // Implementar autenticação real aqui
  req.user = { id: 'user123', role: 'admin' };
  next();
};

// Inicializar serviços
const aiCache = new AICacheService();
const promptService = new PromptTemplateService();

// Simulação de dados de legendas
let captions = [];
let transcriptions = [];

// Configurações de idiomas suportados
const supportedLanguages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français (France)', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italiano (Italia)', flag: '🇮🇹' },
  { code: 'ja-JP', name: '日本語 (日本)', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어 (대한민국)', flag: '🇰🇷' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ru-RU', name: 'Русский (Россия)', flag: '🇷🇺' }
];

// Templates de legendas
const captionTemplates = [
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Legendas simples e claras',
    settings: {
      maxCharsPerLine: 42,
      maxLines: 2,
      minDuration: 1.0,
      maxDuration: 6.0,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.8)',
      position: 'bottom-center'
    }
  },
  {
    id: 'accessibility',
    name: 'Acessibilidade',
    description: 'Otimizado para acessibilidade',
    settings: {
      maxCharsPerLine: 32,
      maxLines: 3,
      minDuration: 1.5,
      maxDuration: 5.0,
      fontSize: 18,
      fontFamily: 'Arial Bold',
      color: '#FFFF00',
      backgroundColor: 'rgba(0,0,0,0.9)',
      position: 'bottom-center',
      includeAudioDescriptions: true
    }
  },
  {
    id: 'social',
    name: 'Redes Sociais',
    description: 'Otimizado para redes sociais',
    settings: {
      maxCharsPerLine: 25,
      maxLines: 2,
      minDuration: 0.8,
      maxDuration: 4.0,
      fontSize: 20,
      fontFamily: 'Helvetica Bold',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.7)',
      position: 'center',
      includeEmojis: true
    }
  },
  {
    id: 'educational',
    name: 'Educacional',
    description: 'Para conteúdo educativo',
    settings: {
      maxCharsPerLine: 50,
      maxLines: 3,
      minDuration: 2.0,
      maxDuration: 8.0,
      fontSize: 16,
      fontFamily: 'Times New Roman',
      color: '#000000',
      backgroundColor: 'rgba(255,255,255,0.9)',
      position: 'bottom-center',
      includeKeywords: true
    }
  }
];

// Função para simular transcrição de áudio
const transcribeAudioWithAI = async (audioData, settings) => {
  // Simular delay da API
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Simular transcrição baseada no idioma
  const mockTranscriptions = {
    'pt-BR': [
      {
        start: 0.0,
        end: 3.5,
        text: "Olá pessoal, bem-vindos ao nosso canal!",
        confidence: 0.95,
        speaker: "Narrador"
      },
      {
        start: 3.5,
        end: 8.2,
        text: "Hoje vamos falar sobre um tópico muito importante.",
        confidence: 0.92,
        speaker: "Narrador"
      },
      {
        start: 8.2,
        end: 12.8,
        text: "Vamos começar explicando os conceitos básicos.",
        confidence: 0.89,
        speaker: "Narrador"
      },
      {
        start: 12.8,
        end: 18.5,
        text: "É importante entender que este assunto tem várias camadas.",
        confidence: 0.94,
        speaker: "Narrador"
      },
      {
        start: 18.5,
        end: 23.0,
        text: "Vamos abordar cada uma de forma clara e didática.",
        confidence: 0.91,
        speaker: "Narrador"
      }
    ],
    'en-US': [
      {
        start: 0.0,
        end: 3.5,
        text: "Hello everyone, welcome to our channel!",
        confidence: 0.96,
        speaker: "Narrator"
      },
      {
        start: 3.5,
        end: 8.2,
        text: "Today we're going to talk about a very important topic.",
        confidence: 0.93,
        speaker: "Narrator"
      },
      {
        start: 8.2,
        end: 12.8,
        text: "Let's start by explaining the basic concepts.",
        confidence: 0.90,
        speaker: "Narrator"
      },
      {
        start: 12.8,
        end: 18.5,
        text: "It's important to understand that this subject has many layers.",
        confidence: 0.95,
        speaker: "Narrator"
      },
      {
        start: 18.5,
        end: 23.0,
        text: "We'll approach each one clearly and didactically.",
        confidence: 0.88,
        speaker: "Narrator"
      }
    ]
  };
  
  return mockTranscriptions[settings.language] || mockTranscriptions['pt-BR'];
};

// Função para gerar legendas a partir de transcrição
const generateCaptionsFromTranscription = (transcription, template) => {
  const captions = [];
  let captionId = 1;
  
  transcription.forEach((segment, index) => {
    const text = segment.text;
    const duration = segment.end - segment.start;
    
    // Dividir texto longo em múltiplas legendas
    if (text.length > template.settings.maxCharsPerLine) {
      const words = text.split(' ');
      let currentCaption = '';
      let currentStart = segment.start;
      
      words.forEach((word, wordIndex) => {
        if ((currentCaption + ' ' + word).length <= template.settings.maxCharsPerLine) {
          currentCaption += (currentCaption ? ' ' : '') + word;
        } else {
          // Criar legenda atual
          const captionDuration = (duration / words.length) * currentCaption.split(' ').length;
          captions.push({
            id: captionId++,
            start: currentStart,
            end: currentStart + captionDuration,
            text: currentCaption,
            speaker: segment.speaker,
            confidence: segment.confidence
          });
          
          currentStart += captionDuration;
          currentCaption = word;
        }
      });
      
      // Adicionar última legenda
      if (currentCaption) {
        captions.push({
          id: captionId++,
          start: currentStart,
          end: segment.end,
          text: currentCaption,
          speaker: segment.speaker,
          confidence: segment.confidence
        });
      }
    } else {
      captions.push({
        id: captionId++,
        start: segment.start,
        end: segment.end,
        text: text,
        speaker: segment.speaker,
        confidence: segment.confidence
      });
    }
  });
  
  return captions;
};

// Função para converter legendas para diferentes formatos
const convertCaptionsToFormat = (captions, format) => {
  switch (format.toLowerCase()) {
    case 'srt':
      return captions.map((caption, index) => {
        const startTime = formatTime(caption.start);
        const endTime = formatTime(caption.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
      }).join('\n');
      
    case 'vtt':
      const vttHeader = 'WEBVTT\n\n';
      const vttCaptions = captions.map(caption => {
        const startTime = formatTime(caption.start, true);
        const endTime = formatTime(caption.end, true);
        return `${startTime} --> ${endTime}\n${caption.text}\n`;
      }).join('\n');
      return vttHeader + vttCaptions;
      
    case 'ass':
      const assHeader = `[Script Info]\nTitle: Generated Subtitles\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
      const assEvents = captions.map(caption => {
        const startTime = formatTimeASS(caption.start);
        const endTime = formatTimeASS(caption.end);
        return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${caption.text}`;
      }).join('\n');
      return assHeader + assEvents;
      
    default:
      return JSON.stringify(captions, null, 2);
  }
};

// Função para formatar tempo
const formatTime = (seconds, isVTT = false) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  if (isVTT) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }
};

const formatTimeASS = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
};

// Rotas

// GET /api/ai/captions/languages - Listar idiomas suportados
router.get('/languages', authenticateUser, async (req, res) => {
  try {
    res.json({
      success: true,
      data: supportedLanguages
    });
  } catch (error) {
    console.error('Erro ao listar idiomas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/ai/captions/templates - Listar templates de legendas
router.get('/templates', authenticateUser, async (req, res) => {
  try {
    res.json({
      success: true,
      data: captionTemplates
    });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/ai/captions - Listar legendas do usuário
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userCaptions = captions.filter(c => c.userId === req.user.id);
    
    res.json({
      success: true,
      data: userCaptions
    });
  } catch (error) {
    console.error('Erro ao listar legendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/ai/captions/transcriptions - Listar transcrições
router.get('/transcriptions', authenticateUser, async (req, res) => {
  try {
    const userTranscriptions = transcriptions.filter(t => t.userId === req.user.id);
    
    res.json({
      success: true,
      data: userTranscriptions
    });
  } catch (error) {
    console.error('Erro ao listar transcrições:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/ai/captions/transcribe - Transcrever áudio
router.post('/transcribe', authenticateUser, async (req, res) => {
  try {
    const { audioFile, settings } = req.body;
    
    if (!audioFile) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo de áudio é obrigatório'
      });
    }
    
    const transcriptionSettings = {
      language: settings?.language || 'pt-BR',
      model: settings?.model || 'whisper-1',
      temperature: settings?.temperature || 0.0,
      includeSpeakers: settings?.includeSpeakers || false,
      includeTimestamps: settings?.includeTimestamps || true,
      includeConfidence: settings?.includeConfidence || true
    };
    
    // Verificar cache
    const cacheKey = `transcription_${audioFile}_${JSON.stringify(transcriptionSettings)}`;
    const cachedResult = await aiCache.get(cacheKey);
    
    if (cachedResult) {
      return res.json({
        success: true,
        transcription: cachedResult.transcription,
        metadata: cachedResult.metadata,
        cached: true
      });
    }
    
    // Transcrever com IA
    const transcriptionData = await transcribeAudioWithAI(audioFile, transcriptionSettings);
    
    // Calcular métricas
    const metadata = {
      duration: transcriptionData[transcriptionData.length - 1]?.end || 0,
      wordCount: transcriptionData.reduce((acc, segment) => acc + segment.text.split(' ').length, 0),
      averageConfidence: transcriptionData.reduce((acc, segment) => acc + segment.confidence, 0) / transcriptionData.length,
      speakerCount: [...new Set(transcriptionData.map(segment => segment.speaker))].length,
      language: transcriptionSettings.language
    };
    
    // Criar registro de transcrição
    const transcription = {
      id: Date.now().toString(),
      userId: req.user.id,
      audioFile,
      transcriptionData,
      settings: transcriptionSettings,
      metadata,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    transcriptions.push(transcription);
    
    // Salvar no cache
    await aiCache.set(cacheKey, { transcription: transcriptionData, metadata }, 7200); // 2 horas
    
    res.json({
      success: true,
      transcription: transcriptionData,
      metadata,
      transcriptionId: transcription.id,
      cached: false
    });
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao transcrever áudio'
    });
  }
});

// POST /api/ai/captions/generate - Gerar legendas a partir de transcrição
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { transcriptionId, templateId, customSettings } = req.body;
    
    if (!transcriptionId) {
      return res.status(400).json({
        success: false,
        message: 'ID da transcrição é obrigatório'
      });
    }
    
    const transcription = transcriptions.find(t => t.id === transcriptionId && t.userId === req.user.id);
    if (!transcription) {
      return res.status(404).json({
        success: false,
        message: 'Transcrição não encontrada'
      });
    }
    
    const template = captionTemplates.find(t => t.id === templateId) || captionTemplates[0];
    const settings = { ...template.settings, ...customSettings };
    
    // Verificar cache
    const cacheKey = `captions_${transcriptionId}_${templateId}_${JSON.stringify(customSettings)}`;
    const cachedResult = await aiCache.get(cacheKey);
    
    if (cachedResult) {
      return res.json({
        success: true,
        captions: cachedResult.captions,
        metadata: cachedResult.metadata,
        cached: true
      });
    }
    
    // Gerar legendas
    const generatedCaptions = generateCaptionsFromTranscription(transcription.transcriptionData, template);
    
    // Calcular métricas
    const metadata = {
      totalCaptions: generatedCaptions.length,
      totalDuration: transcription.metadata.duration,
      averageDuration: generatedCaptions.reduce((acc, cap) => acc + (cap.end - cap.start), 0) / generatedCaptions.length,
      template: template.name,
      language: transcription.metadata.language
    };
    
    // Criar registro de legendas
    const captionRecord = {
      id: Date.now().toString(),
      userId: req.user.id,
      transcriptionId,
      captions: generatedCaptions,
      template,
      settings,
      metadata,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    captions.push(captionRecord);
    
    // Salvar no cache
    await aiCache.set(cacheKey, { captions: generatedCaptions, metadata }, 3600); // 1 hora
    
    res.json({
      success: true,
      captions: generatedCaptions,
      metadata,
      captionId: captionRecord.id,
      cached: false
    });
  } catch (error) {
    console.error('Erro ao gerar legendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar legendas'
    });
  }
});

// POST /api/ai/captions/translate - Traduzir legendas
router.post('/translate', authenticateUser, async (req, res) => {
  try {
    const { captionId, targetLanguage } = req.body;
    
    if (!captionId || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'ID das legendas e idioma de destino são obrigatórios'
      });
    }
    
    const captionRecord = captions.find(c => c.id === captionId && c.userId === req.user.id);
    if (!captionRecord) {
      return res.status(404).json({
        success: false,
        message: 'Legendas não encontradas'
      });
    }
    
    // Verificar cache
    const cacheKey = `translate_${captionId}_${targetLanguage}`;
    const cachedResult = await aiCache.get(cacheKey);
    
    if (cachedResult) {
      return res.json({
        success: true,
        translatedCaptions: cachedResult,
        cached: true
      });
    }
    
    // Simular tradução
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const translatedCaptions = captionRecord.captions.map(caption => ({
      ...caption,
      text: `[${targetLanguage}] ${caption.text}`,
      originalText: caption.text,
      language: targetLanguage
    }));
    
    // Salvar no cache
    await aiCache.set(cacheKey, translatedCaptions, 3600); // 1 hora
    
    res.json({
      success: true,
      translatedCaptions,
      cached: false
    });
  } catch (error) {
    console.error('Erro ao traduzir legendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao traduzir legendas'
    });
  }
});

// POST /api/ai/captions/export - Exportar legendas
router.post('/export', authenticateUser, async (req, res) => {
  try {
    const { captionId, format } = req.body;
    
    if (!captionId || !format) {
      return res.status(400).json({
        success: false,
        message: 'ID das legendas e formato são obrigatórios'
      });
    }
    
    const captionRecord = captions.find(c => c.id === captionId && c.userId === req.user.id);
    if (!captionRecord) {
      return res.status(404).json({
        success: false,
        message: 'Legendas não encontradas'
      });
    }
    
    const exportedContent = convertCaptionsToFormat(captionRecord.captions, format);
    
    res.json({
      success: true,
      export: {
        format,
        content: exportedContent,
        filename: `captions_${captionRecord.id}.${format.toLowerCase()}`,
        mimeType: format === 'srt' ? 'text/srt' : format === 'vtt' ? 'text/vtt' : 'text/plain'
      }
    });
  } catch (error) {
    console.error('Erro ao exportar legendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar legendas'
    });
  }
});

// PUT /api/ai/captions/:id - Editar legendas
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { captions: updatedCaptions } = req.body;
    
    const captionIndex = captions.findIndex(c => c.id === id && c.userId === req.user.id);
    if (captionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Legendas não encontradas'
      });
    }
    
    captions[captionIndex] = {
      ...captions[captionIndex],
      captions: updatedCaptions,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: captions[captionIndex]
    });
  } catch (error) {
    console.error('Erro ao editar legendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao editar legendas'
    });
  }
});

// DELETE /api/ai/captions/:id - Deletar legendas
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const captionIndex = captions.findIndex(c => c.id === id && c.userId === req.user.id);
    
    if (captionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Legendas não encontradas'
      });
    }
    
    captions.splice(captionIndex, 1);
    
    res.json({
      success: true,
      message: 'Legendas deletadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar legendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar legendas'
    });
  }
});

// GET /api/ai/captions/stats - Estatísticas
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userCaptions = captions.filter(c => c.userId === req.user.id);
    const userTranscriptions = transcriptions.filter(t => t.userId === req.user.id);
    
    const stats = {
      totalCaptions: userCaptions.length,
      totalTranscriptions: userTranscriptions.length,
      totalDuration: userTranscriptions.reduce((acc, t) => acc + t.metadata.duration, 0),
      totalWords: userTranscriptions.reduce((acc, t) => acc + t.metadata.wordCount, 0),
      averageConfidence: userTranscriptions.length > 0 
        ? userTranscriptions.reduce((acc, t) => acc + t.metadata.averageConfidence, 0) / userTranscriptions.length
        : 0,
      languageDistribution: userTranscriptions.reduce((acc, t) => {
        acc[t.metadata.language] = (acc[t.metadata.language] || 0) + 1;
        return acc;
      }, {}),
      recentActivity: [...userCaptions, ...userTranscriptions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Middleware de tratamento de erros
router.use((error, req, res, next) => {
  console.error('Erro na API de legendas:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

module.exports = router;