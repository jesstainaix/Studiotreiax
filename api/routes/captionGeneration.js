const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Middleware de autenticação (simulado)
const authenticateUser = (req, res, next) => {
  // Simulação de autenticação
  req.user = { id: 'user123', name: 'Test User' };
  next();
};

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'audio/mp3', 'audio/wav', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Simulação de banco de dados em memória
let captionJobs = [];
let transcriptionJobs = [];
let templates = [
  {
    id: 'template_1',
    name: 'YouTube Padrão',
    type: 'caption',
    settings: {
      maxLineLength: 32,
      maxLinesPerCaption: 2,
      minDuration: 1.0,
      maxDuration: 6.0,
      fontSize: 16,
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textColor: '#FFFFFF',
      position: 'bottom-center'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'template_2',
    name: 'Instagram Stories',
    type: 'caption',
    settings: {
      maxLineLength: 25,
      maxLinesPerCaption: 3,
      minDuration: 0.8,
      maxDuration: 4.0,
      fontSize: 18,
      fontFamily: 'Helvetica',
      backgroundColor: 'rgba(0,0,0,0.6)',
      textColor: '#FFFFFF',
      position: 'center'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'template_3',
    name: 'Podcast Transcription',
    type: 'transcription',
    settings: {
      speakerIdentification: true,
      timestampInterval: 30,
      paragraphBreaks: true,
      punctuation: true,
      formatting: 'clean'
    },
    createdAt: new Date().toISOString()
  }
];

let languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', supported: true },
  { code: 'en-US', name: 'English (US)', supported: true },
  { code: 'es-ES', name: 'Español', supported: true },
  { code: 'fr-FR', name: 'Français', supported: true },
  { code: 'de-DE', name: 'Deutsch', supported: true },
  { code: 'it-IT', name: 'Italiano', supported: true },
  { code: 'ja-JP', name: '日本語', supported: true },
  { code: 'ko-KR', name: '한국어', supported: true },
  { code: 'zh-CN', name: '中文 (简体)', supported: true }
];

let analytics = {
  totalJobs: 0,
  completedJobs: 0,
  averageProcessingTime: 45,
  accuracyRate: 0.94,
  languageDistribution: {
    'pt-BR': 45,
    'en-US': 30,
    'es-ES': 15,
    'fr-FR': 5,
    'others': 5
  },
  monthlyStats: [
    { month: 'Jan', captions: 120, transcriptions: 80 },
    { month: 'Feb', captions: 150, transcriptions: 95 },
    { month: 'Mar', captions: 180, transcriptions: 110 },
    { month: 'Apr', captions: 200, transcriptions: 130 },
    { month: 'May', captions: 220, transcriptions: 145 },
    { month: 'Jun', captions: 250, transcriptions: 160 }
  ]
};

// Funções auxiliares
const generateId = () => {
  return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const validateJobData = (data) => {
  const errors = [];
  
  if (!data.title) errors.push('Título é obrigatório');
  if (!data.language) errors.push('Idioma é obrigatório');
  if (!data.type || !['caption', 'transcription'].includes(data.type)) {
    errors.push('Tipo deve ser "caption" ou "transcription"');
  }
  
  return errors;
};

const processAudioExtraction = async (videoBuffer, options = {}) => {
  // Simulação de extração de áudio
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    duration: 120, // segundos
    sampleRate: 44100,
    channels: 2,
    format: 'wav'
  };
};

const generateCaptions = async (audioData, options = {}) => {
  // Simulação de geração de legendas com IA
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const sampleCaptions = [
    {
      id: 'caption_1',
      startTime: 0.0,
      endTime: 3.2,
      text: 'Bem-vindos ao nosso canal!',
      confidence: 0.95,
      speaker: 'Speaker 1'
    },
    {
      id: 'caption_2',
      startTime: 3.5,
      endTime: 7.8,
      text: 'Hoje vamos falar sobre inteligência artificial.',
      confidence: 0.92,
      speaker: 'Speaker 1'
    },
    {
      id: 'caption_3',
      startTime: 8.0,
      endTime: 12.5,
      text: 'É uma tecnologia que está revolucionando o mundo.',
      confidence: 0.89,
      speaker: 'Speaker 1'
    },
    {
      id: 'caption_4',
      startTime: 13.0,
      endTime: 17.2,
      text: 'Vamos ver alguns exemplos práticos.',
      confidence: 0.94,
      speaker: 'Speaker 1'
    },
    {
      id: 'caption_5',
      startTime: 17.5,
      endTime: 22.0,
      text: 'Primeiro, temos os assistentes virtuais.',
      confidence: 0.91,
      speaker: 'Speaker 1'
    }
  ];
  
  return {
    captions: sampleCaptions,
    totalDuration: audioData.duration,
    averageConfidence: 0.92,
    detectedLanguage: options.language || 'pt-BR',
    speakerCount: 1
  };
};

const generateTranscription = async (audioData, options = {}) => {
  // Simulação de geração de transcrição com IA
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  const sampleTranscription = {
    text: `Bem-vindos ao nosso canal! Hoje vamos falar sobre inteligência artificial. É uma tecnologia que está revolucionando o mundo. Vamos ver alguns exemplos práticos. Primeiro, temos os assistentes virtuais como Siri, Alexa e Google Assistant. Eles conseguem entender nossa fala e responder de forma natural. Segundo, temos os sistemas de recomendação que usamos no Netflix, Spotify e YouTube. Eles analisam nosso comportamento e sugerem conteúdo relevante. Terceiro, temos os carros autônomos que estão sendo desenvolvidos por empresas como Tesla e Google. Eles usam IA para navegar pelas ruas de forma segura. Por fim, temos os sistemas de tradução automática como o Google Translate que quebram barreiras linguísticas. A inteligência artificial está presente em nossas vidas de muitas formas e continuará evoluindo. Obrigado por assistir e não esqueçam de se inscrever no canal!`,
    segments: [
      {
        startTime: 0.0,
        endTime: 30.0,
        text: 'Bem-vindos ao nosso canal! Hoje vamos falar sobre inteligência artificial. É uma tecnologia que está revolucionando o mundo. Vamos ver alguns exemplos práticos.',
        speaker: 'Speaker 1',
        confidence: 0.94
      },
      {
        startTime: 30.0,
        endTime: 60.0,
        text: 'Primeiro, temos os assistentes virtuais como Siri, Alexa e Google Assistant. Eles conseguem entender nossa fala e responder de forma natural. Segundo, temos os sistemas de recomendação que usamos no Netflix, Spotify e YouTube.',
        speaker: 'Speaker 1',
        confidence: 0.91
      },
      {
        startTime: 60.0,
        endTime: 90.0,
        text: 'Terceiro, temos os carros autônomos que estão sendo desenvolvidos por empresas como Tesla e Google. Eles usam IA para navegar pelas ruas de forma segura.',
        speaker: 'Speaker 1',
        confidence: 0.89
      },
      {
        startTime: 90.0,
        endTime: 120.0,
        text: 'Por fim, temos os sistemas de tradução automática como o Google Translate que quebram barreiras linguísticas. A inteligência artificial está presente em nossas vidas de muitas formas e continuará evoluindo. Obrigado por assistir!',
        speaker: 'Speaker 1',
        confidence: 0.93
      }
    ],
    metadata: {
      totalDuration: audioData.duration,
      wordCount: 156,
      averageConfidence: 0.92,
      detectedLanguage: options.language || 'pt-BR',
      speakerCount: 1,
      processingTime: 4.2
    }
  };
  
  return sampleTranscription;
};

const optimizeCaptions = async (captions, template) => {
  // Simulação de otimização de legendas
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return captions.map(caption => {
    let optimizedText = caption.text;
    
    // Aplicar configurações do template
    if (template.settings.maxLineLength) {
      // Quebrar linhas longas
      if (optimizedText.length > template.settings.maxLineLength) {
        const words = optimizedText.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
          if ((currentLine + ' ' + word).length <= template.settings.maxLineLength) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        optimizedText = lines.slice(0, template.settings.maxLinesPerCaption || 2).join('\n');
      }
    }
    
    return {
      ...caption,
      text: optimizedText,
      styling: {
        fontSize: template.settings.fontSize,
        fontFamily: template.settings.fontFamily,
        backgroundColor: template.settings.backgroundColor,
        textColor: template.settings.textColor,
        position: template.settings.position
      }
    };
  });
};

const exportToFormat = async (data, format, options = {}) => {
  // Simulação de exportação para diferentes formatos
  await new Promise(resolve => setTimeout(resolve, 500));
  
  switch (format) {
    case 'srt':
      return generateSRT(data);
    case 'vtt':
      return generateVTT(data);
    case 'ass':
      return generateASS(data);
    case 'txt':
      return generateTXT(data);
    case 'json':
      return JSON.stringify(data, null, 2);
    default:
      throw new Error('Formato não suportado');
  }
};

const generateSRT = (captions) => {
  return captions.map((caption, index) => {
    const startTime = formatSRTTime(caption.startTime);
    const endTime = formatSRTTime(caption.endTime);
    return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
  }).join('\n');
};

const generateVTT = (captions) => {
  let vtt = 'WEBVTT\n\n';
  vtt += captions.map(caption => {
    const startTime = formatVTTTime(caption.startTime);
    const endTime = formatVTTTime(caption.endTime);
    return `${startTime} --> ${endTime}\n${caption.text}\n`;
  }).join('\n');
  return vtt;
};

const generateASS = (captions) => {
  let ass = '[Script Info]\nTitle: Generated Subtitles\nScriptType: v4.00+\n\n';
  ass += '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';
  ass += 'Style: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n';
  ass += '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  
  ass += captions.map(caption => {
    const startTime = formatASSTime(caption.startTime);
    const endTime = formatASSTime(caption.endTime);
    return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${caption.text}`;
  }).join('\n');
  
  return ass;
};

const generateTXT = (data) => {
  if (data.segments) {
    // Transcrição
    return data.segments.map(segment => {
      const timestamp = formatTimestamp(segment.startTime);
      return `[${timestamp}] ${segment.speaker}: ${segment.text}`;
    }).join('\n\n');
  } else {
    // Legendas
    return data.map(caption => caption.text).join(' ');
  }
};

const formatSRTTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

const formatVTTTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const formatASSTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`;
};

const formatTimestamp = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Rotas da API

// Listar jobs de legendas/transcrições
router.get('/jobs', authenticateUser, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    let allJobs = [...captionJobs, ...transcriptionJobs];
    
    // Filtros
    if (type) {
      allJobs = allJobs.filter(job => job.type === type);
    }
    if (status) {
      allJobs = allJobs.filter(job => job.status === status);
    }
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedJobs = allJobs.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      jobs: paginatedJobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allJobs.length / limit),
        totalItems: allJobs.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar novo job de legenda/transcrição
router.post('/jobs', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    const { title, type, language, templateId, options } = req.body;
    const file = req.file;
    
    // Validação
    const errors = validateJobData({ title, type, language });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'Arquivo é obrigatório' });
    }
    
    // Criar job
    const jobId = generateId();
    const job = {
      id: jobId,
      title,
      type,
      language,
      templateId,
      status: 'processing',
      progress: 0,
      file: {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      },
      options: JSON.parse(options || '{}'),
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id,
      processingTime: 0
    };
    
    if (type === 'caption') {
      captionJobs.push(job);
    } else {
      transcriptionJobs.push(job);
    }
    
    // Simular processamento assíncrono
    processJobAsync(job, file.buffer);
    
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Função para processar job assincronamente
const processJobAsync = async (job, fileBuffer) => {
  try {
    const startTime = Date.now();
    
    // Atualizar progresso: Extração de áudio
    job.progress = 20;
    job.status = 'extracting_audio';
    
    const audioData = await processAudioExtraction(fileBuffer, job.options);
    
    // Atualizar progresso: Processamento com IA
    job.progress = 50;
    job.status = 'processing_ai';
    
    let result;
    if (job.type === 'caption') {
      result = await generateCaptions(audioData, { language: job.language, ...job.options });
      
      // Aplicar template se especificado
      if (job.templateId) {
        const template = templates.find(t => t.id === job.templateId);
        if (template) {
          job.progress = 80;
          job.status = 'optimizing';
          result.captions = await optimizeCaptions(result.captions, template);
        }
      }
    } else {
      result = await generateTranscription(audioData, { language: job.language, ...job.options });
    }
    
    // Finalizar
    job.progress = 100;
    job.status = 'completed';
    job.result = result;
    job.processingTime = (Date.now() - startTime) / 1000;
    job.updatedAt = new Date().toISOString();
    
    // Atualizar analytics
    analytics.totalJobs++;
    analytics.completedJobs++;
    analytics.averageProcessingTime = (analytics.averageProcessingTime + job.processingTime) / 2;
    
  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
  }
};

// Obter job específico
router.get('/jobs/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = [...captionJobs, ...transcriptionJobs].find(j => j.id === id);
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job não encontrado' });
    }
    
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar job
router.put('/jobs/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allJobs = [...captionJobs, ...transcriptionJobs];
    const jobIndex = allJobs.findIndex(j => j.id === id);
    
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, error: 'Job não encontrado' });
    }
    
    const job = allJobs[jobIndex];
    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
    
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar job
router.delete('/jobs/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    let jobIndex = captionJobs.findIndex(j => j.id === id);
    if (jobIndex !== -1) {
      captionJobs.splice(jobIndex, 1);
      return res.json({ success: true, message: 'Job deletado com sucesso' });
    }
    
    jobIndex = transcriptionJobs.findIndex(j => j.id === id);
    if (jobIndex !== -1) {
      transcriptionJobs.splice(jobIndex, 1);
      return res.json({ success: true, message: 'Job deletado com sucesso' });
    }
    
    res.status(404).json({ success: false, error: 'Job não encontrado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reprocessar job
router.post('/jobs/:id/reprocess', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { options } = req.body;
    
    const job = [...captionJobs, ...transcriptionJobs].find(j => j.id === id);
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job não encontrado' });
    }
    
    // Reset job status
    job.status = 'processing';
    job.progress = 0;
    job.error = null;
    job.options = { ...job.options, ...options };
    job.updatedAt = new Date().toISOString();
    
    // Simular reprocessamento (na prática, usaria o arquivo original)
    const mockFileBuffer = Buffer.from('mock file data');
    processJobAsync(job, mockFileBuffer);
    
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exportar resultado
router.get('/jobs/:id/export', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'srt' } = req.query;
    
    const job = [...captionJobs, ...transcriptionJobs].find(j => j.id === id);
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job não encontrado' });
    }
    
    if (job.status !== 'completed' || !job.result) {
      return res.status(400).json({ success: false, error: 'Job não foi concluído' });
    }
    
    const data = job.type === 'caption' ? job.result.captions : job.result;
    const exportedContent = await exportToFormat(data, format);
    
    const filename = `${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(exportedContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar templates
router.get('/templates', authenticateUser, async (req, res) => {
  try {
    const { type } = req.query;
    
    let filteredTemplates = templates;
    if (type) {
      filteredTemplates = templates.filter(t => t.type === type);
    }
    
    res.json({ success: true, templates: filteredTemplates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar template
router.post('/templates', authenticateUser, async (req, res) => {
  try {
    const { name, type, settings } = req.body;
    
    if (!name || !type || !settings) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome, tipo e configurações são obrigatórios' 
      });
    }
    
    const template = {
      id: generateId(),
      name,
      type,
      settings,
      createdAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    templates.push(template);
    
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar template
router.put('/templates/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ success: false, error: 'Template não encontrado' });
    }
    
    Object.assign(templates[templateIndex], updates, { 
      updatedAt: new Date().toISOString() 
    });
    
    res.json({ success: true, template: templates[templateIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar template
router.delete('/templates/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ success: false, error: 'Template não encontrado' });
    }
    
    templates.splice(templateIndex, 1);
    
    res.json({ success: true, message: 'Template deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar idiomas suportados
router.get('/languages', async (req, res) => {
  try {
    res.json({ success: true, languages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Detectar idioma do áudio
router.post('/detect-language', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'Arquivo é obrigatório' });
    }
    
    // Simulação de detecção de idioma
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const detectedLanguages = [
      { code: 'pt-BR', name: 'Português (Brasil)', confidence: 0.89 },
      { code: 'en-US', name: 'English (US)', confidence: 0.08 },
      { code: 'es-ES', name: 'Español', confidence: 0.03 }
    ];
    
    res.json({ 
      success: true, 
      detectedLanguages,
      primaryLanguage: detectedLanguages[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Processar em lote
router.post('/batch-process', authenticateUser, upload.array('files', 10), async (req, res) => {
  try {
    const { type, language, templateId, options } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Pelo menos um arquivo é obrigatório' });
    }
    
    const batchId = generateId();
    const jobs = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const jobId = generateId();
      
      const job = {
        id: jobId,
        batchId,
        title: `Batch ${batchId} - ${file.originalname}`,
        type,
        language,
        templateId,
        status: 'queued',
        progress: 0,
        file: {
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        },
        options: JSON.parse(options || '{}'),
        result: null,
        error: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: req.user.id,
        processingTime: 0
      };
      
      if (type === 'caption') {
        captionJobs.push(job);
      } else {
        transcriptionJobs.push(job);
      }
      
      jobs.push(job);
      
      // Processar com delay para simular fila
      setTimeout(() => {
        job.status = 'processing';
        processJobAsync(job, file.buffer);
      }, i * 5000);
    }
    
    res.json({ 
      success: true, 
      batchId,
      jobs,
      message: `${jobs.length} jobs criados e adicionados à fila` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter status do lote
router.get('/batch/:batchId', authenticateUser, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchJobs = [...captionJobs, ...transcriptionJobs].filter(j => j.batchId === batchId);
    
    if (batchJobs.length === 0) {
      return res.status(404).json({ success: false, error: 'Lote não encontrado' });
    }
    
    const totalJobs = batchJobs.length;
    const completedJobs = batchJobs.filter(j => j.status === 'completed').length;
    const errorJobs = batchJobs.filter(j => j.status === 'error').length;
    const processingJobs = batchJobs.filter(j => ['processing', 'queued', 'extracting_audio', 'processing_ai', 'optimizing'].includes(j.status)).length;
    
    const overallProgress = batchJobs.reduce((sum, job) => sum + job.progress, 0) / totalJobs;
    
    res.json({
      success: true,
      batchId,
      summary: {
        totalJobs,
        completedJobs,
        errorJobs,
        processingJobs,
        overallProgress: Math.round(overallProgress)
      },
      jobs: batchJobs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics
router.get('/analytics/overview', authenticateUser, async (req, res) => {
  try {
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics detalhadas
router.get('/analytics/detailed', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let jobs = [...captionJobs, ...transcriptionJobs];
    
    // Filtros
    if (type) {
      jobs = jobs.filter(job => job.type === type);
    }
    
    if (startDate && endDate) {
      jobs = jobs.filter(job => {
        const jobDate = new Date(job.createdAt);
        return jobDate >= new Date(startDate) && jobDate <= new Date(endDate);
      });
    }
    
    // Calcular métricas
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const errorJobs = jobs.filter(j => j.status === 'error').length;
    const averageProcessingTime = jobs.reduce((sum, job) => sum + (job.processingTime || 0), 0) / totalJobs;
    
    // Distribuição por idioma
    const languageDistribution = {};
    jobs.forEach(job => {
      languageDistribution[job.language] = (languageDistribution[job.language] || 0) + 1;
    });
    
    // Distribuição por status
    const statusDistribution = {};
    jobs.forEach(job => {
      statusDistribution[job.status] = (statusDistribution[job.status] || 0) + 1;
    });
    
    // Jobs por dia (últimos 30 dias)
    const dailyStats = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayJobs = jobs.filter(job => {
        return job.createdAt.split('T')[0] === dateStr;
      });
      
      dailyStats.push({
        date: dateStr,
        total: dayJobs.length,
        completed: dayJobs.filter(j => j.status === 'completed').length,
        errors: dayJobs.filter(j => j.status === 'error').length
      });
    }
    
    const detailedAnalytics = {
      summary: {
        totalJobs,
        completedJobs,
        errorJobs,
        successRate: totalJobs > 0 ? completedJobs / totalJobs : 0,
        averageProcessingTime
      },
      distributions: {
        language: languageDistribution,
        status: statusDistribution
      },
      trends: {
        daily: dailyStats
      }
    };
    
    res.json({ success: true, analytics: detailedAnalytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;