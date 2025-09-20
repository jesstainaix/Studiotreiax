import { SlideDataValidator, ValidationRule, ValidationResult, SlideData } from '../slide-data-validator';

describe('SlideDataValidator', () => {
  let validator: SlideDataValidator;
  
  beforeEach(() => {
    validator = new SlideDataValidator();
  });

  describe('validateSlide', () => {
    it('should validate a valid slide successfully', () => {
      const validSlide: SlideData = {
        id: 'slide-1',
        title: 'Test Slide',
        content: 'Valid content',
        images: [{
          id: 'img-1',
          src: 'https://example.com/image.jpg',
          alt: 'Test image',
          width: 800,
          height: 600
        }],
        shapes: [],
        animations: [],
        notes: 'Speaker notes',
        metadata: {
          slideNumber: 1,
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      };

      const result = validator.validateSlide(validSlide);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidSlide: Partial<SlideData> = {
        id: 'slide-1'
        // Missing title and content
      };

      const result = validator.validateSlide(invalidSlide as SlideData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
      expect(result.errors.some(e => e.field === 'content')).toBe(true);
    });

    it('should validate image properties', () => {
      const slideWithInvalidImage: SlideData = {
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

      const result = validator.validateSlide(slideWithInvalidImage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'images[0].src')).toBe(true);
      expect(result.errors.some(e => e.field === 'images[0].width')).toBe(true);
      expect(result.warnings.some(w => w.field === 'images[0].alt')).toBe(true);
    });
  });

  describe('validateSlides', () => {
    it('should validate multiple slides', () => {
      const slides: SlideData[] = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          content: 'Content 1',
          images: [],
          shapes: [],
          animations: [],
          notes: '',
          metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
        },
        {
          id: 'slide-2',
          title: 'Slide 2',
          content: 'Content 2',
          images: [],
          shapes: [],
          animations: [],
          notes: '',
          metadata: { slideNumber: 2, createdAt: new Date(), modifiedAt: new Date() }
        }
      ];

      const results = validator.validateSlides(slides);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.isValid)).toBe(true);
    });
  });

  describe('addCustomRule', () => {
    it('should add and apply custom validation rules', () => {
      const customRule: ValidationRule = {
        id: 'custom-title-length',
        field: 'title',
        type: 'error',
        message: 'Title must be at least 5 characters',
        validator: (value: any) => typeof value === 'string' && value.length >= 5
      };

      validator.addCustomRule(customRule);

      const slideWithShortTitle: SlideData = {
        id: 'slide-1',
        title: 'Hi',
        content: 'Content',
        images: [],
        shapes: [],
        animations: [],
        notes: '',
        metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
      };

      const result = validator.validateSlide(slideWithShortTitle);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.ruleId === 'custom-title-length')).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate a comprehensive validation report', () => {
      const slides: SlideData[] = [
        {
          id: 'slide-1',
          title: 'Valid Slide',
          content: 'Valid content',
          images: [],
          shapes: [],
          animations: [],
          notes: '',
          metadata: { slideNumber: 1, createdAt: new Date(), modifiedAt: new Date() }
        },
        {
          id: 'slide-2',
          title: '', // Invalid
          content: 'Content',
          images: [],
          shapes: [],
          animations: [],
          notes: '',
          metadata: { slideNumber: 2, createdAt: new Date(), modifiedAt: new Date() }
        }
      ];

      const report = validator.generateReport(slides);
      
      expect(report.totalSlides).toBe(2);
      expect(report.validSlides).toBe(1);
      expect(report.invalidSlides).toBe(1);
      expect(report.totalErrors).toBeGreaterThan(0);
      expect(report.summary).toBeDefined();
    });
  });
})