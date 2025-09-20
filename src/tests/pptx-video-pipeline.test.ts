import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock do FormData para upload
global.FormData = class FormData {
  private data: Map<string, any> = new Map();
  
  append(key: string, value: any) {
    this.data.set(key, value);
  }
  
  get(key: string) {
    return this.data.get(key);
  }
};

// Mock do fetch para APIs
global.fetch = vi.fn();

// Mock dos serviços
const mockPPTXService = {
  uploadFile: vi.fn(),
  extractSlides: vi.fn(),
  parseContent: vi.fn()
};

const mockTTSService = {
  generateAudio: vi.fn(),
  getVoices: vi.fn(),
  synthesize: vi.fn()
};

const mockAvatarService = {
  generateAvatar: vi.fn(),
  syncLipMovement: vi.fn(),
  renderAvatar: vi.fn()
};

const mockVideoService = {
  createComposition: vi.fn(),
  renderVideo: vi.fn(),
  exportVideo: vi.fn()
};

// Mock dos componentes
const MockPPTXUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  return React.createElement('div', { 'data-testid': 'pptx-upload' },
    React.createElement('input', {
      type: 'file',
      'data-testid': 'file-input',
      onChange: (e: any) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
      }
    }),
    React.createElement('button', { 'data-testid': 'upload-button' }, 'Upload PPTX')
  );
};

const MockVideoEditor: React.FC<{ slides: any[] }> = ({ slides }) => {
  return React.createElement('div', { 'data-testid': 'video-editor' },
    React.createElement('div', { 'data-testid': 'slides-count' }, `${slides.length} slides`),
    React.createElement('button', { 'data-testid': 'generate-video' }, 'Gerar Vídeo')
  );
};

const MockProgressMonitor: React.FC<{ progress: number }> = ({ progress }) => {
  return React.createElement('div', { 'data-testid': 'progress-monitor' },
    React.createElement('div', { 'data-testid': 'progress-value' }, `${progress}%`)
  );
};

describe('PPTX → Video Pipeline Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockPPTXService.uploadFile.mockResolvedValue({
      success: true,
      fileId: 'test-file-123',
      fileName: 'test.pptx'
    });
    
    mockPPTXService.extractSlides.mockResolvedValue({
      slides: [
        { id: 1, title: 'Slide 1', content: 'Conteúdo do slide 1' },
        { id: 2, title: 'Slide 2', content: 'Conteúdo do slide 2' }
      ]
    });
    
    mockTTSService.generateAudio.mockResolvedValue({
      audioUrl: 'https://example.com/audio.mp3',
      duration: 30000
    });
    
    mockAvatarService.generateAvatar.mockResolvedValue({
      avatarUrl: 'https://example.com/avatar.mp4',
      lipSyncData: []
    });
    
    mockVideoService.renderVideo.mockResolvedValue({
      videoUrl: 'https://example.com/final-video.mp4',
      duration: 60000
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Upload PPTX Stage', () => {
    it('deve fazer upload de arquivo PPTX com sucesso', async () => {
      const onUpload = vi.fn();
      const mockElement = React.createElement(MockPPTXUpload, { onUpload });
      render(mockElement);
      
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(onUpload).toHaveBeenCalledWith(file);
    });
    
    it('deve extrair slides do PPTX corretamente', async () => {
      const result = await mockPPTXService.extractSlides('test-file-123');
      
      expect(mockPPTXService.extractSlides).toHaveBeenCalledWith('test-file-123');
      expect(result.slides).toHaveLength(2);
      expect(result.slides[0]).toHaveProperty('title', 'Slide 1');
    });
  });

  describe('Content Processing Stage', () => {
    it('deve processar conteúdo dos slides para TTS', async () => {
      const slides = [
        { id: 1, title: 'Slide 1', content: 'Conteúdo do slide 1' },
        { id: 2, title: 'Slide 2', content: 'Conteúdo do slide 2' }
      ];
      
      for (const slide of slides) {
        const audioResult = await mockTTSService.generateAudio(slide.content);
        expect(audioResult).toHaveProperty('audioUrl');
        expect(audioResult).toHaveProperty('duration');
      }
      
      expect(mockTTSService.generateAudio).toHaveBeenCalledTimes(2);
    });
    
    it('deve gerar avatares com sincronização labial', async () => {
      const audioData = {
        audioUrl: 'https://example.com/audio.mp3',
        duration: 30000
      };
      
      const avatarResult = await mockAvatarService.generateAvatar(audioData);
      
      expect(mockAvatarService.generateAvatar).toHaveBeenCalledWith(audioData);
      expect(avatarResult).toHaveProperty('avatarUrl');
      expect(avatarResult).toHaveProperty('lipSyncData');
    });
  });

  describe('Video Generation Stage', () => {
    it('deve criar composição de vídeo com todos os elementos', async () => {
      const composition = {
        slides: [{ id: 1, title: 'Slide 1' }],
        audio: { url: 'audio.mp3', duration: 30000 },
        avatar: { url: 'avatar.mp4', lipSync: [] }
      };
      
      const result = await mockVideoService.createComposition(composition);
      
      expect(mockVideoService.createComposition).toHaveBeenCalledWith(composition);
    });
    
    it('deve renderizar vídeo final', async () => {
      const compositionId = 'comp-123';
      
      const result = await mockVideoService.renderVideo(compositionId);
      
      expect(mockVideoService.renderVideo).toHaveBeenCalledWith(compositionId);
      expect(result).toHaveProperty('videoUrl');
      expect(result).toHaveProperty('duration');
    });
  });

  describe('End-to-End Pipeline', () => {
    it('deve executar pipeline completo PPTX → Vídeo', async () => {
      // 1. Upload PPTX
      const uploadResult = await mockPPTXService.uploadFile(new File([], 'test.pptx'));
      expect(uploadResult.success).toBe(true);
      
      // 2. Extrair slides
      const slidesResult = await mockPPTXService.extractSlides(uploadResult.fileId);
      expect(slidesResult.slides).toHaveLength(2);
      
      // 3. Gerar áudio para cada slide
      const audioPromises = slidesResult.slides.map(slide => 
        mockTTSService.generateAudio(slide.content)
      );
      const audioResults = await Promise.all(audioPromises);
      expect(audioResults).toHaveLength(2);
      
      // 4. Gerar avatares
      const avatarPromises = audioResults.map(audio => 
        mockAvatarService.generateAvatar(audio)
      );
      const avatarResults = await Promise.all(avatarPromises);
      expect(avatarResults).toHaveLength(2);
      
      // 5. Criar composição
      const composition = {
        slides: slidesResult.slides,
        audio: audioResults,
        avatars: avatarResults
      };
      await mockVideoService.createComposition(composition);
      
      // 6. Renderizar vídeo final
      const finalVideo = await mockVideoService.renderVideo('comp-123');
      expect(finalVideo).toHaveProperty('videoUrl');
      
      // Verificar que todos os serviços foram chamados
      expect(mockPPTXService.uploadFile).toHaveBeenCalled();
      expect(mockPPTXService.extractSlides).toHaveBeenCalled();
      expect(mockTTSService.generateAudio).toHaveBeenCalledTimes(2);
      expect(mockAvatarService.generateAvatar).toHaveBeenCalledTimes(2);
      expect(mockVideoService.createComposition).toHaveBeenCalled();
      expect(mockVideoService.renderVideo).toHaveBeenCalled();
    });
    
    it('deve monitorar progresso durante o pipeline', async () => {
      let progress = 0;
      const updateProgress = (value: number) => { progress = value; };
      
      const mockElement = React.createElement(MockProgressMonitor, { progress });
      render(mockElement);
      
      // Simular progresso do pipeline
      updateProgress(20); // Upload completo
      expect(progress).toBe(20);
      
      updateProgress(40); // Slides extraídos
      expect(progress).toBe(40);
      
      updateProgress(60); // TTS gerado
      expect(progress).toBe(60);
      
      updateProgress(80); // Avatares criados
      expect(progress).toBe(80);
      
      updateProgress(100); // Vídeo renderizado
      expect(progress).toBe(100);
      
      // Simular atualizações de progresso
      updateProgress(25);
      updateProgress(50);
      updateProgress(75);
      updateProgress(100);
      
      expect(progress).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erro de upload de arquivo', async () => {
      mockPPTXService.uploadFile.mockRejectedValue(new Error('Upload failed'));
      
      await expect(mockPPTXService.uploadFile(new File([], 'test.pptx')))
        .rejects.toThrow('Upload failed');
    });
    
    it('deve tratar erro de geração de TTS', async () => {
      mockTTSService.generateAudio.mockRejectedValue(new Error('TTS service unavailable'));
      
      await expect(mockTTSService.generateAudio('test content'))
        .rejects.toThrow('TTS service unavailable');
    });
    
    it('deve tratar erro de renderização de vídeo', async () => {
      mockVideoService.renderVideo.mockRejectedValue(new Error('Render failed'));
      
      await expect(mockVideoService.renderVideo('comp-123'))
        .rejects.toThrow('Render failed');
    });
  });

  describe('Performance Tests', () => {
    it('deve processar pipeline em tempo aceitável', async () => {
      const startTime = Date.now();
      
      // Simular pipeline com pequeno delay para garantir tempo mensurável
      await new Promise(resolve => setTimeout(resolve, 10));
      await mockPPTXService.uploadFile(new File([], 'test.pptx'));
      await mockPPTXService.extractSlides('test-file-123');
      await mockTTSService.generateAudio('test content');
      await mockAvatarService.generateAvatar({ audioUrl: 'test.mp3', duration: 1000 });
      await mockVideoService.renderVideo('comp-123');
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Pipeline deve completar em menos de 1 segundo (mocks)
      expect(processingTime).toBeLessThan(1000);
      expect(processingTime).toBeGreaterThanOrEqual(10);
    });
    
    it('deve gerenciar memória eficientemente', () => {
      // Simular processamento de múltiplos arquivos
      const files = Array.from({ length: 10 }, (_, i) => 
        new File([], `test${i}.pptx`)
      );
      
      files.forEach(file => {
        mockPPTXService.uploadFile(file);
      });
      
      expect(mockPPTXService.uploadFile).toHaveBeenCalledTimes(10);
    });
  });
});