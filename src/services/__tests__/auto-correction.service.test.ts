import { AutoCorrectionService, CorrectionRule, SlideData } from '../auto-correction.service';

describe('AutoCorrectionService', () => {
  let correctionService: AutoCorrectionService;
  
  beforeEach(() => {
    correctionService = new AutoCorrectionService();
  });

  describe('correctSlide', () => {
    it('should correct text content issues', async () => {
      const slideWithIssues: SlideData = {
        id: 'slide-1',
        title: '  untrimmed title  ',
        content: 'Content with    multiple   spaces',
        images: [],
        shapes: [],
        animations: [],
        notes: '',
        metadata: {
          slideNumber: 1,
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      };

      const result = await correctionService.correctSlide(slideWithIssues);
      
      expect(result.success).toBe(true);
      expect(result.correctedSlide?.title).toBe('untrimmed title');
      expect(result.correctedSlide?.content).toBe('Content with multiple spaces');
      expect(result.corrections.length).toBeGreaterThan(0);
    });

    it('should fix image properties', async () => {
      const slideWithImageIssues: SlideData = {
        id: 'slide-1',
        title: 'Test Slide',
        content: 'Content',
        images: [{
          id: 'img-1',
          src: 'invalid-url',
          alt: '',
          width: -100,
          height: 0
        }],
        shapes: [],
        animations: [],
        notes: '',
        metadata: {
          slideNumber: 1,
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      };

      const result = await correctionService.correctSlide(slideWithImageIssues);
      
      expect(result.success).toBe(true);
      expect(result.correctedSlide?.images[0].width).toBeGreaterThan(0);
      expect(result.correctedSlide?.images[0].height).toBeGreaterThan(0);
      expect(result.correctedSlide?.images[0].alt).toBeTruthy();
    });

    it('should handle slides with no issues', async () => {
      const validSlide: SlideData = {
        id: 'slide-1',
        title: 'Perfect Slide',
        content: 'Perfect content',
        images: [{
          id: 'img-1',
          src: 'https://example.com/image.jpg',
          alt: 'Perfect image',
          width: 800,
          height: 600
        }],
        shapes: [],
        animations: [],
        notes: 'Perfect notes',
        metadata: {
          slideNumber: 1,
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      };

      const result = await correctionService.correctSlide(validSlide);
      
      expect(result.success).toBe(true);
      expect(result.corrections).toHaveLength(0);
      expect(result.correctedSlide).toEqual(validSlide);
    });
  });

  describe('correctSlides', () => {
    it('should correct multiple slides in batch', async () => {
      const slidesWithIssues: SlideData[] = [
        {
          id: 'slide-1',
          title: '  Title 1  ',
          content: 'Content 1',
          images: [],
          shapes: [],
          animations: [],
          notes: '',
          metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
        },
        {
          id: 'slide-2',
          title: '  Title 2  ',
          content: 'Content 2',
          images: [],
          shapes: [],
          animations: [],
          notes: '',
          metadata: { slideNumber: 2, createdAt: new Date(), modifiedAt: new Date() }
        }
      ];

      const results = await correctionService.correctSlides(slidesWithIssues);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
      expect(results[0].correctedSlide?.title).toBe('Title 1');
      expect(results[1].correctedSlide?.title).toBe('Title 2');
    });
  });

  describe('addCustomRule', () => {
    it('should add and apply custom correction rules', async () => {
      const customRule: CorrectionRule = {
        id: 'uppercase-title',
        field: 'title',
        description: 'Convert title to uppercase',
        corrector: (value: any) => typeof value === 'string' ? value.toUpperCase() : value
      };

      correctionService.addCustomRule(customRule);

      const slide: SlideData = {
        id: 'slide-1',
        title: 'lowercase title',
        content: 'Content',
        images: [],
        shapes: [],
        animations: [],
        notes: '',
        metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
      };

      const result = await correctionService.correctSlide(slide);
      
      expect(result.success).toBe(true);
      expect(result.correctedSlide?.title).toBe('LOWERCASE TITLE');
      expect(result.corrections.some(c => c.ruleId === 'uppercase-title')).toBe(true);
    });
  });

  describe('createBackup and restoreFromBackup', () => {
    it('should create and restore slide backups', () => {
      const originalSlide: SlideData = {
        id: 'slide-1',
        title: 'Original Title',
        content: 'Original Content',
        images: [],
        shapes: [],
        animations: [],
        notes: '',
        metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
      };

      const backupId = correctionService.createBackup(originalSlide);
      expect(backupId).toBeTruthy();

      const restoredSlide = correctionService.restoreFromBackup(backupId);
      expect(restoredSlide).toEqual(originalSlide);
    });

    it('should return null for invalid backup ID', () => {
      const restoredSlide = correctionService.restoreFromBackup('invalid-id');
      expect(restoredSlide).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should track correction statistics', async () => {
      const slide: SlideData = {
        id: 'slide-1',
        title: '  Title with issues  ',
        content: 'Content',
        images: [],
        shapes: [],
        animations: [],
        notes: '',
        metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
      };

      await correctionService.correctSlide(slide);
      
      const stats = correctionService.getStats();
      
      expect(stats.totalCorrections).toBeGreaterThan(0);
      expect(stats.slidesProcessed).toBe(1);
      expect(stats.successRate).toBe(100);
    });
  });
});