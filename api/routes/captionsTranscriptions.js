const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/', 'audio/'];
    if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Middleware de autenticação (simulado)
const authenticateUser = (req, res, next) => {
  // Implementar autenticação real
  req.user = { id: 'user123', name: 'Usuário Teste' };
  next();
};

// Simulação de banco de dados em memória
let transcriptions = [
  {
    id: 'trans_001',
    userId: 'user123',
    title: 'Entrevista com CEO',
    originalFile: {
      name: 'interview_ceo.mp4',
      type: 'video/mp4',
      size: 125000000,
      duration: 1800
    },
    status: 'completed',
    language: 'pt-BR',
    confidence: 0.92,
    transcriptionText: 'Bem-vindos ao nosso podcast. Hoje temos conosco o CEO da empresa...',
    segments: [
      {
        id: 'seg_001',
        startTime: 0,
        endTime: 5.2,
        text: 'Bem-vindos ao nosso podcast.',
        confidence: 0.95,
        speaker: 'Host'
      },
      {
        id: 'seg_002',
        startTime: 5.2,
        endTime: 12.8,
        text: 'Hoje temos conosco o CEO da empresa.',
        confidence: 0.89,
        speaker: 'Host'
      }
    ],
    captions: [
      {
        id: 'cap_001',
        format: 'srt',
        content: '1\n00:00:00,000 --> 00:00:05,200\nBem-vindos ao nosso podcast.\n\n2\n00:00:05,200 --> 00:00:12,800\nHoje temos conosco o CEO da empresa.\n\n',
        downloadUrl: '/api/ai/captions/trans_001/download/srt'
      },
      {
        id: 'cap_002',
        format: 'vtt',
        content: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.200\nBem-vindos ao nosso podcast.\n\n00:00:05.200 --> 00:00:12.800\nHoje temos conosco o CEO da empresa.\n\n',
        downloadUrl: '/api/ai/captions/trans_001/download/vtt'
      }
    ],
    aiModel: 'whisper-large-v3',
    processingTime: 45.2,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:01:30Z')
  }
];

let captionTemplates = [
  {
    id: 'template_001',
    name: 'YouTube Padrão',
    description: 'Template otimizado para vídeos do YouTube',
    format: 'srt',
    settings: {
      maxLineLength: 42,
      maxLinesPerCaption: 2,
      minDisplayTime: 1.0,
      maxDisplayTime: 6.0,
      fontSize: 16,
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textColor: '#FFFFFF',
      position: 'bottom-center'
    },
    isDefault: true,
    createdAt: new Date('2024-01-10T00:00:00Z')
  },
  {
    id: 'template_002',
    name: 'Instagram Stories',
    description: 'Template para stories do Instagram',
    format: 'srt',
    settings: {
      maxLineLength: 25,
      maxLinesPerCaption: 1,
      minDisplayTime: 0.8,
      maxDisplayTime: 3.0,
      fontSize: 20,
      fontFamily: 'Helvetica',
      backgroundColor: 'transparent',
      textColor: '#FFFFFF',
      position: 'center',
      outline: true
    },
    isDefault: false,
    createdAt: new Date('2024-01-10T00:00:00Z')
  }
];

let analytics = {
  totalTranscriptions: 156,
  totalMinutesProcessed: 8420,
  averageAccuracy: 0.91,
  languageDistribution: {
    'pt-BR': 89,
    'en-US': 45,
    'es-ES': 22
  },
  formatDistribution: {
    'srt': 98,
    'vtt': 45,
    'txt': 13
  },
  modelPerformance: {
    'whisper-large-v3': {
      accuracy: 0.93,
      avgProcessingTime: 0.8,
      usage: 120
    },
    'whisper-medium': {
      accuracy: 0.89,
      avgProcessingTime: 0.5,
      usage: 36
    }
  },
  monthlyStats: [
    { month: 'Jan 2024', transcriptions: 45, minutes: 2100 },
    { month: 'Feb 2024', transcriptions: 52, minutes: 2890 },
    { month: 'Mar 2024', transcriptions: 59, minutes: 3430 }
  ]
};

// Funções auxiliares
const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const validateTranscriptionData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Título é obrigatório');
  }
  
  if (!data.language) {
    errors.push('Idioma é obrigatório');
  }
  
  return errors;
};

const simulateTranscription = async (fileData, options) => {
  // Simular processamento de transcrição
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const sampleTexts = [
    'Bem-vindos ao nosso podcast. Hoje vamos falar sobre inovação tecnológica.',
    'Esta é uma apresentação sobre os resultados do último trimestre.',
    'Olá pessoal, no vídeo de hoje vamos aprender sobre inteligência artificial.',
    'Entrevista exclusiva com especialistas do setor.'
  ];
  
  const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  const words = randomText.split(' ');
  const segments = [];
  
  let currentTime = 0;
  for (let i = 0; i < words.length; i += 3) {
    const segmentWords = words.slice(i, i + 3);
    const segmentText = segmentWords.join(' ');
    const duration = segmentWords.length * 0.8 + Math.random() * 0.5;
    
    segments.push({
      id: generateId('seg'),
      startTime: currentTime,
      endTime: currentTime + duration,
      text: segmentText,
      confidence: 0.85 + Math.random() * 0.15,
      speaker: i % 6 === 0 ? 'Speaker 2' : 'Speaker 1'
    });
    
    currentTime += duration;
  }
  
  return {
    text: randomText,
    segments,
    confidence: 0.85 + Math.random() * 0.15,
    processingTime: 30 + Math.random() * 60
  };
};

const generateCaptions = (segments, format, template) => {
  const settings = template?.settings || {
    maxLineLength: 42,
    maxLinesPerCaption: 2,
    minDisplayTime: 1.0,
    maxDisplayTime: 6.0
  };
  
  let content = '';
  
  if (format === 'srt') {
    content = 'WEBVTT\n\n';
    segments.forEach((segment, index) => {
      const startTime = formatTime(segment.startTime, 'srt');
      const endTime = formatTime(segment.endTime, 'srt');
      content += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
    });
  } else if (format === 'vtt') {
    content = 'WEBVTT\n\n';
    segments.forEach(segment => {
      const startTime = formatTime(segment.startTime, 'vtt');
      const endTime = formatTime(segment.endTime, 'vtt');
      content += `${startTime} --> ${endTime}\n${segment.text}\n\n`;
    });
  } else if (format === 'txt') {
    content = segments.map(segment => segment.text).join(' ');
  }
  
  return content;
};

const formatTime = (seconds, format) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  if (format === 'srt') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  } else if (format === 'vtt') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  
  return `${hours}:${minutes}:${secs}`;
};

const calculateAccuracy = (segments) => {
  if (segments.length === 0) return 0;
  const totalConfidence = segments.reduce((sum, segment) => sum + segment.confidence, 0);
  return totalConfidence / segments.length;
};

// Rotas

// Listar transcrições
router.get('/transcriptions', authenticateUser, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      language = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let filteredTranscriptions = transcriptions.filter(transcription => {
      const matchesSearch = !search || 
        transcription.title.toLowerCase().includes(search.toLowerCase()) ||
        transcription.transcriptionText.toLowerCase().includes(search.toLowerCase());
      const matchesLanguage = !language || transcription.language === language;
      const matchesStatus = !status || transcription.status === status;
      
      return matchesSearch && matchesLanguage && matchesStatus;
    });
    
    // Ordenação
    filteredTranscriptions.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder === 'desc' ? -1 : 1;
      
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTranscriptions = filteredTranscriptions.slice(startIndex, endIndex);
    
    res.json({
      transcriptions: paginatedTranscriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredTranscriptions.length / limit),
        totalItems: filteredTranscriptions.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transcrições' });
  }
});

// Obter transcrição específica
router.get('/transcriptions/:id', authenticateUser, async (req, res) => {
  try {
    const transcription = transcriptions.find(t => t.id === req.params.id);
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }
    
    res.json(transcription);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transcrição' });
  }
});

// Criar nova transcrição
router.post('/transcriptions', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    const transcriptionData = JSON.parse(req.body.transcriptionData || '{}');
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }
    
    const errors = validateTranscriptionData(transcriptionData);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    const transcriptionId = generateId('trans');
    
    // Criar transcrição inicial
    const newTranscription = {
      id: transcriptionId,
      userId: req.user.id,
      title: transcriptionData.title,
      originalFile: {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        duration: transcriptionData.duration || 0
      },
      status: 'processing',
      language: transcriptionData.language,
      confidence: 0,
      transcriptionText: '',
      segments: [],
      captions: [],
      aiModel: transcriptionData.model || 'whisper-large-v3',
      processingTime: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    transcriptions.unshift(newTranscription);
    
    // Simular processamento assíncrono
    setTimeout(async () => {
      try {
        const result = await simulateTranscription(file, transcriptionData);
        
        // Atualizar transcrição com resultados
        const transcriptionIndex = transcriptions.findIndex(t => t.id === transcriptionId);
        if (transcriptionIndex !== -1) {
          transcriptions[transcriptionIndex] = {
            ...transcriptions[transcriptionIndex],
            status: 'completed',
            confidence: result.confidence,
            transcriptionText: result.text,
            segments: result.segments,
            processingTime: result.processingTime,
            updatedAt: new Date()
          };
          
          // Gerar legendas
          const template = captionTemplates.find(t => t.isDefault);
          const captions = [
            {
              id: generateId('cap'),
              format: 'srt',
              content: generateCaptions(result.segments, 'srt', template),
              downloadUrl: `/api/ai/captions/${transcriptionId}/download/srt`
            },
            {
              id: generateId('cap'),
              format: 'vtt',
              content: generateCaptions(result.segments, 'vtt', template),
              downloadUrl: `/api/ai/captions/${transcriptionId}/download/vtt`
            }
          ];
          
          transcriptions[transcriptionIndex].captions = captions;
        }
      } catch (error) {
        // Marcar como falha
        const transcriptionIndex = transcriptions.findIndex(t => t.id === transcriptionId);
        if (transcriptionIndex !== -1) {
          transcriptions[transcriptionIndex].status = 'failed';
          transcriptions[transcriptionIndex].updatedAt = new Date();
        }
      }
    }, 3000);
    
    res.status(201).json(newTranscription);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar transcrição' });
  }
});

// Atualizar transcrição
router.put('/transcriptions/:id', authenticateUser, async (req, res) => {
  try {
    const transcriptionIndex = transcriptions.findIndex(t => t.id === req.params.id);
    
    if (transcriptionIndex === -1) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }
    
    const updates = req.body;
    const errors = validateTranscriptionData(updates);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    transcriptions[transcriptionIndex] = {
      ...transcriptions[transcriptionIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    res.json(transcriptions[transcriptionIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar transcrição' });
  }
});

// Deletar transcrição
router.delete('/transcriptions/:id', authenticateUser, async (req, res) => {
  try {
    const transcriptionIndex = transcriptions.findIndex(t => t.id === req.params.id);
    
    if (transcriptionIndex === -1) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }
    
    transcriptions.splice(transcriptionIndex, 1);
    
    res.json({ message: 'Transcrição deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar transcrição' });
  }
});

// Editar segmento de transcrição
router.put('/transcriptions/:id/segments/:segmentId', authenticateUser, async (req, res) => {
  try {
    const transcription = transcriptions.find(t => t.id === req.params.id);
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }
    
    const segmentIndex = transcription.segments.findIndex(s => s.id === req.params.segmentId);
    
    if (segmentIndex === -1) {
      return res.status(404).json({ error: 'Segmento não encontrado' });
    }
    
    const { text, startTime, endTime, speaker } = req.body;
    
    transcription.segments[segmentIndex] = {
      ...transcription.segments[segmentIndex],
      text: text || transcription.segments[segmentIndex].text,
      startTime: startTime !== undefined ? startTime : transcription.segments[segmentIndex].startTime,
      endTime: endTime !== undefined ? endTime : transcription.segments[segmentIndex].endTime,
      speaker: speaker || transcription.segments[segmentIndex].speaker
    };
    
    // Recalcular texto completo
    transcription.transcriptionText = transcription.segments.map(s => s.text).join(' ');
    transcription.updatedAt = new Date();
    
    // Regenerar legendas
    const template = captionTemplates.find(t => t.isDefault);
    transcription.captions = [
      {
        id: generateId('cap'),
        format: 'srt',
        content: generateCaptions(transcription.segments, 'srt', template),
        downloadUrl: `/api/ai/captions/${transcription.id}/download/srt`
      },
      {
        id: generateId('cap'),
        format: 'vtt',
        content: generateCaptions(transcription.segments, 'vtt', template),
        downloadUrl: `/api/ai/captions/${transcription.id}/download/vtt`
      }
    ];
    
    res.json(transcription);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao editar segmento' });
  }
});

// Gerar legendas com template específico
router.post('/transcriptions/:id/captions', authenticateUser, async (req, res) => {
  try {
    const transcription = transcriptions.find(t => t.id === req.params.id);
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }
    
    const { templateId, format } = req.body;
    const template = captionTemplates.find(t => t.id === templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const content = generateCaptions(transcription.segments, format, template);
    
    const newCaption = {
      id: generateId('cap'),
      format,
      content,
      downloadUrl: `/api/ai/captions/${transcription.id}/download/${format}`,
      templateId,
      createdAt: new Date()
    };
    
    // Remover legenda existente do mesmo formato
    transcription.captions = transcription.captions.filter(c => c.format !== format);
    transcription.captions.push(newCaption);
    
    res.json(newCaption);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar legendas' });
  }
});

// Download de legendas
router.get('/transcriptions/:id/download/:format', authenticateUser, async (req, res) => {
  try {
    const transcription = transcriptions.find(t => t.id === req.params.id);
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }
    
    const caption = transcription.captions.find(c => c.format === req.params.format);
    
    if (!caption) {
      return res.status(404).json({ error: 'Formato de legenda não encontrado' });
    }
    
    const filename = `${transcription.title.replace(/[^a-zA-Z0-9]/g, '_')}.${req.params.format}`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(caption.content);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer download' });
  }
});

// Exportar transcrição
router.get('/transcriptions/:id/export', authenticateUser, async (req, res) => {
  try {
    const transcription = transcriptions.find(t => t.id === req.params.id);
    
    if (!transcription) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }
    
    const exportData = {
      ...transcription,
      exportedAt: new Date(),
      exportedBy: req.user.id
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="transcription_${transcription.id}.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar transcrição' });
  }
});

// Listar templates de legendas
router.get('/caption-templates', authenticateUser, async (req, res) => {
  try {
    res.json(captionTemplates);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

// Criar template de legenda
router.post('/caption-templates', authenticateUser, async (req, res) => {
  try {
    const { name, description, format, settings } = req.body;
    
    if (!name || !format) {
      return res.status(400).json({ error: 'Nome e formato são obrigatórios' });
    }
    
    const newTemplate = {
      id: generateId('template'),
      name,
      description: description || '',
      format,
      settings: settings || {},
      isDefault: false,
      createdAt: new Date()
    };
    
    captionTemplates.push(newTemplate);
    
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// Atualizar template de legenda
router.put('/caption-templates/:id', authenticateUser, async (req, res) => {
  try {
    const templateIndex = captionTemplates.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const updates = req.body;
    
    captionTemplates[templateIndex] = {
      ...captionTemplates[templateIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    res.json(captionTemplates[templateIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// Deletar template de legenda
router.delete('/caption-templates/:id', authenticateUser, async (req, res) => {
  try {
    const templateIndex = captionTemplates.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    if (captionTemplates[templateIndex].isDefault) {
      return res.status(400).json({ error: 'Não é possível deletar template padrão' });
    }
    
    captionTemplates.splice(templateIndex, 1);
    
    res.json({ message: 'Template deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar template' });
  }
});

// Obter idiomas suportados
router.get('/supported-languages', async (req, res) => {
  try {
    const languages = [
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
    
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar idiomas' });
  }
});

// Obter modelos de IA disponíveis
router.get('/ai-models', async (req, res) => {
  try {
    const models = [
      {
        id: 'whisper-large-v3',
        name: 'Whisper Large v3',
        description: 'Modelo mais preciso, ideal para conteúdo profissional',
        accuracy: 0.95,
        speed: 'Lento',
        languages: 99,
        maxDuration: 7200, // 2 horas
        costPerMinute: 0.006
      },
      {
        id: 'whisper-medium',
        name: 'Whisper Medium',
        description: 'Equilíbrio entre precisão e velocidade',
        accuracy: 0.91,
        speed: 'Médio',
        languages: 99,
        maxDuration: 3600, // 1 hora
        costPerMinute: 0.004
      },
      {
        id: 'whisper-small',
        name: 'Whisper Small',
        description: 'Rápido e eficiente para conteúdo simples',
        accuracy: 0.87,
        speed: 'Rápido',
        languages: 99,
        maxDuration: 1800, // 30 minutos
        costPerMinute: 0.002
      }
    ];
    
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar modelos' });
  }
});

// Obter analytics
router.get('/analytics', authenticateUser, async (req, res) => {
  try {
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

module.exports = router;