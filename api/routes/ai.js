import express from 'express';
import AIContentService from '../services/aiContentService.js';
import PromptTemplateService from '../services/promptTemplateService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Initialize services
const aiContentService = new AIContentService();
const promptTemplateService = new PromptTemplateService();

// AI Content Generation Routes

// Generate script
router.post('/generate-script', authenticate, async (req, res) => {
  try {
    const { topic, audience, duration, nrFocus, tone, requirements } = req.body;
    
    if (!topic || !audience) {
      return res.status(400).json({ 
        error: 'Topic and audience are required' 
      });
    }

    const script = await aiContentService.generateScript({
      topic,
      audience,
      duration: duration || 30,
      nrFocus: nrFocus || 'general',
      tone: tone || 'professional',
      requirements: requirements || []
    });

    res.json({ 
      success: true, 
      script,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({ 
      error: 'Failed to generate script',
      details: error.message 
    });
  }
});

// Generate storyboard
router.post('/generate-storyboard', authenticate, async (req, res) => {
  try {
    const { script, style, scenes } = req.body;
    
    if (!script) {
      return res.status(400).json({ 
        error: 'Script is required for storyboard generation' 
      });
    }

    const storyboard = await aiContentService.generateStoryboard({
      script,
      style: style || 'professional',
      scenes: scenes || 'auto'
    });

    res.json({ 
      success: true, 
      storyboard,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    res.status(500).json({ 
      error: 'Failed to generate storyboard',
      details: error.message 
    });
  }
});

// Generate captions
router.post('/generate-captions', authenticate, async (req, res) => {
  try {
    const { audioText, language, style } = req.body;
    
    if (!audioText) {
      return res.status(400).json({ 
        error: 'Audio text is required for caption generation' 
      });
    }

    const captions = await aiContentService.generateCaptions({
      audioText,
      language: language || 'pt-BR',
      style: style || 'standard'
    });

    res.json({ 
      success: true, 
      captions,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error generating captions:', error);
    res.status(500).json({ 
      error: 'Failed to generate captions',
      details: error.message 
    });
  }
});

// Optimize content
router.post('/optimize-content', authenticate, async (req, res) => {
  try {
    const { content, type, targetAudience, nrFocus } = req.body;
    
    if (!content || !type) {
      return res.status(400).json({ 
        error: 'Content and type are required' 
      });
    }

    const optimizedContent = await aiContentService.optimizeContent({
      content,
      type,
      targetAudience: targetAudience || 'general',
      nrFocus: nrFocus || 'general'
    });

    res.json({ 
      success: true, 
      optimizedContent,
      metadata: {
        optimizedAt: new Date().toISOString(),
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error optimizing content:', error);
    res.status(500).json({ 
      error: 'Failed to optimize content',
      details: error.message 
    });
  }
});

// Get content suggestions
router.post('/suggest-improvements', authenticate, async (req, res) => {
  try {
    const { content, type, nrFocus } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        error: 'Content is required for suggestions' 
      });
    }

    const suggestions = await aiContentService.suggestImprovements({
      content,
      type: type || 'script',
      nrFocus: nrFocus || 'general'
    });

    res.json({ 
      success: true, 
      suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message 
    });
  }
});

// Prompt Template Routes

// Get all templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    const { category, nrFocus, search } = req.query;
    
    let templates = [];
    
    if (search) {
      templates = await promptTemplateService.searchTemplates(search, {
        category,
        nrFocus,
        userId: req.user.id
      });
    } else {
      // Get user's custom templates
      const userTemplates = await promptTemplateService.getUserTemplates(req.user.id);
      
      // Get public templates
      const publicTemplates = await promptTemplateService.getPublicTemplates();
      
      // Get default templates for all NRs
      const availableNRs = promptTemplateService.getAvailableNRs();
      const defaultTemplates = [];
      
      for (const nr of availableNRs) {
        const nrTemplates = await promptTemplateService.getTemplatesForNR(nr);
        Object.keys(nrTemplates).forEach(templateKey => {
          defaultTemplates.push({
            id: `${nr}_${templateKey}`,
            type: 'default',
            nr,
            ...nrTemplates[templateKey]
          });
        });
      }
      
      templates = [...defaultTemplates, ...userTemplates, ...publicTemplates];
    }
    
    // Apply filters
    if (category && category !== 'all') {
      templates = templates.filter(t => t.category === category);
    }
    
    if (nrFocus && nrFocus !== 'all') {
      templates = templates.filter(t => t.nrFocus === nrFocus);
    }

    res.json({ 
      success: true, 
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      details: error.message 
    });
  }
});

// Create custom template
router.post('/templates', authenticate, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      userId: req.user.id
    };
    
    const template = await promptTemplateService.createCustomTemplate(templateData);
    
    res.status(201).json({ 
      success: true, 
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      error: 'Failed to create template',
      details: error.message 
    });
  }
});

// Update custom template
router.put('/templates/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const template = await promptTemplateService.updateCustomTemplate(
      id, 
      updates, 
      req.user.id
    );
    
    res.json({ 
      success: true, 
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ 
      error: 'Failed to update template',
      details: error.message 
    });
  }
});

// Delete custom template
router.delete('/templates/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await promptTemplateService.deleteCustomTemplate(id, req.user.id);
    
    res.json({ 
      success: true, 
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ 
      error: 'Failed to delete template',
      details: error.message 
    });
  }
});

// Rate template
router.post('/templates/:id/rate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const template = await promptTemplateService.rateTemplate(
      id, 
      rating, 
      review || '', 
      req.user.id
    );
    
    res.json({ 
      success: true, 
      template
    });
  } catch (error) {
    console.error('Error rating template:', error);
    res.status(500).json({ 
      error: 'Failed to rate template',
      details: error.message 
    });
  }
});

// Build prompt from template
router.post('/templates/:id/build', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;
    
    const prompt = await promptTemplateService.buildPromptFromTemplate(id, variables);
    
    res.json({ 
      success: true, 
      prompt
    });
  } catch (error) {
    console.error('Error building prompt:', error);
    res.status(500).json({ 
      error: 'Failed to build prompt',
      details: error.message 
    });
  }
});

// Get template categories
router.get('/templates/categories', (req, res) => {
  try {
    const categories = promptTemplateService.getTemplateCategories();
    
    res.json({ 
      success: true, 
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
});

// Get available NRs
router.get('/templates/nrs', (req, res) => {
  try {
    const nrs = promptTemplateService.getAvailableNRs();
    
    res.json({ 
      success: true, 
      nrs
    });
  } catch (error) {
    console.error('Error fetching NRs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NRs',
      details: error.message 
    });
  }
});

// Export/Import templates
router.post('/templates/export', authenticate, async (req, res) => {
  try {
    const { templateIds } = req.body;
    
    if (!templateIds || !Array.isArray(templateIds)) {
      return res.status(400).json({ 
        error: 'Template IDs array is required' 
      });
    }
    
    const exportData = await promptTemplateService.exportTemplates(
      templateIds, 
      req.user.id
    );
    
    res.json({ 
      success: true, 
      exportData
    });
  } catch (error) {
    console.error('Error exporting templates:', error);
    res.status(500).json({ 
      error: 'Failed to export templates',
      details: error.message 
    });
  }
});

router.post('/templates/import', authenticate, async (req, res) => {
  try {
    const { templatesData } = req.body;
    
    if (!templatesData) {
      return res.status(400).json({ 
        error: 'Templates data is required' 
      });
    }
    
    const result = await promptTemplateService.importTemplates(
      templatesData, 
      req.user.id
    );
    
    res.json({ 
      success: true, 
      result
    });
  } catch (error) {
    console.error('Error importing templates:', error);
    res.status(500).json({ 
      error: 'Failed to import templates',
      details: error.message 
    });
  }
});

// AI Configuration Routes

// Get AI configuration
router.get('/config', authenticate, async (req, res) => {
  try {
    const config = await aiContentService.getConfiguration();
    
    res.json({ 
      success: true, 
      config
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AI configuration',
      details: error.message 
    });
  }
});

// Update AI configuration
router.post('/config', authenticate, async (req, res) => {
  try {
    const config = req.body;
    
    await aiContentService.updateConfiguration(config);
    
    res.json({ 
      success: true, 
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(500).json({ 
      error: 'Failed to update AI configuration',
      details: error.message 
    });
  }
});

// Get AI statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const templateStats = promptTemplateService.getTemplateStats();
    const aiStats = await aiContentService.getUsageStats();
    
    res.json({ 
      success: true, 
      stats: {
        templates: templateStats,
        ai: aiStats
      }
    });
  } catch (error) {
    console.error('Error fetching AI stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AI statistics',
      details: error.message 
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await aiContentService.healthCheck();
    
    res.json({ 
      success: true, 
      health
    });
  } catch (error) {
    console.error('Error checking AI health:', error);
    res.status(500).json({ 
      error: 'Failed to check AI health',
      details: error.message 
    });
  }
});

export default router;