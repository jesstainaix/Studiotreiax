const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, validateTemplate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting
const templateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many template requests from this IP'
});

// Apply rate limiting to all routes
router.use(templateLimit);

// Template CRUD operations
router.get('/', templateController.getTemplates);
router.get('/:id', templateController.getTemplate);
router.post('/', authenticate, validateTemplate, templateController.createTemplate);
router.put('/:id', authenticate, validateTemplate, templateController.updateTemplate);
router.delete('/:id', authenticate, templateController.deleteTemplate);

// Templates by NR (Norma Regulamentadora)
router.get('/nr/:nrType', templateController.getTemplatesByNR);
router.get('/nr/:nrType/categories', templateController.getNRCategories);
router.get('/nr/:nrType/featured', templateController.getFeaturedTemplatesByNR);
router.get('/nr/:nrType/popular', templateController.getPopularTemplatesByNR);
router.get('/nr/:nrType/recent', templateController.getRecentTemplatesByNR);

// Template categories and filtering
router.get('/categories', templateController.getCategories);
router.get('/categories/:category', templateController.getTemplatesByCategory);
router.get('/filter', templateController.filterTemplates);
router.get('/search', templateController.searchTemplates);

// Template preview and demo
router.get('/:id/preview', templateController.getTemplatePreview);
router.get('/:id/demo', templateController.getTemplateDemo);
router.get('/:id/screenshots', templateController.getTemplateScreenshots);

// Template 3D assets and scenarios
router.get('/:id/3d-assets', templateController.get3DAssets);
router.get('/:id/scenarios', templateController.getScenarios);
router.get('/:id/avatars', templateController.getAvatars);
router.get('/:id/environments', templateController.getEnvironments);

// Template customization
router.post('/:id/customize', authenticate, templateController.customizeTemplate);
router.get('/:id/customization-options', templateController.getCustomizationOptions);
router.post('/:id/save-customization', authenticate, templateController.saveCustomization);

// Template usage and analytics
router.post('/:id/use', authenticate, templateController.useTemplate);
router.get('/:id/usage-stats', templateController.getUsageStats);
router.get('/:id/analytics', templateController.getTemplateAnalytics);

// Template ratings and reviews
router.get('/:id/reviews', templateController.getReviews);
router.post('/:id/reviews', authenticate, templateController.addReview);
router.put('/:id/reviews/:reviewId', authenticate, templateController.updateReview);
router.delete('/:id/reviews/:reviewId', authenticate, templateController.deleteReview);
router.post('/:id/rate', authenticate, templateController.rateTemplate);

// Template collections and playlists
router.get('/collections', templateController.getCollections);
router.get('/collections/:collectionId', templateController.getCollection);
router.post('/collections', authenticate, templateController.createCollection);
router.put('/collections/:collectionId', authenticate, templateController.updateCollection);
router.delete('/collections/:collectionId', authenticate, templateController.deleteCollection);
router.post('/collections/:collectionId/templates/:templateId', authenticate, templateController.addToCollection);
router.delete('/collections/:collectionId/templates/:templateId', authenticate, templateController.removeFromCollection);

// Template compliance and validation
router.get('/:id/compliance', templateController.getComplianceInfo);
router.post('/:id/validate', templateController.validateTemplate);
router.get('/:id/compliance-report', templateController.getComplianceReport);

// Template export and sharing
router.get('/:id/export', authenticate, templateController.exportTemplate);
router.post('/:id/share', authenticate, templateController.shareTemplate);
router.get('/:id/share-link', authenticate, templateController.getShareLink);

// Template versioning
router.get('/:id/versions', templateController.getTemplateVersions);
router.post('/:id/versions', authenticate, templateController.createTemplateVersion);
router.get('/:id/versions/:versionId', templateController.getTemplateVersion);

// Template marketplace features
router.get('/marketplace/featured', templateController.getFeaturedTemplates);
router.get('/marketplace/trending', templateController.getTrendingTemplates);
router.get('/marketplace/new', templateController.getNewTemplates);
router.get('/marketplace/top-rated', templateController.getTopRatedTemplates);

// Template recommendations
router.get('/recommendations', authenticate, templateController.getRecommendations);
router.get('/recommendations/similar/:templateId', templateController.getSimilarTemplates);
router.get('/recommendations/for-nr/:nrType', templateController.getRecommendationsForNR);

// Template favorites and bookmarks
router.get('/favorites', authenticate, templateController.getFavoriteTemplates);
router.post('/:id/favorite', authenticate, templateController.addToFavorites);
router.delete('/:id/favorite', authenticate, templateController.removeFromFavorites);

// Template tags and metadata
router.get('/tags', templateController.getTags);
router.get('/tags/:tag', templateController.getTemplatesByTag);
router.post('/:id/tags', authenticate, templateController.addTags);
router.delete('/:id/tags/:tag', authenticate, templateController.removeTag);

// Template learning paths
router.get('/learning-paths', templateController.getLearningPaths);
router.get('/learning-paths/:pathId', templateController.getLearningPath);
router.post('/learning-paths', authenticate, templateController.createLearningPath);
router.post('/learning-paths/:pathId/templates/:templateId', authenticate, templateController.addToLearningPath);

// Template industry-specific
router.get('/industry/:industry', templateController.getTemplatesByIndustry);
router.get('/industries', templateController.getIndustries);

// Template difficulty levels
router.get('/difficulty/:level', templateController.getTemplatesByDifficulty);
router.get('/difficulty-levels', templateController.getDifficultyLevels);

// Template duration-based filtering
router.get('/duration/:range', templateController.getTemplatesByDuration);
router.get('/duration-ranges', templateController.getDurationRanges);

// Template language support
router.get('/languages', templateController.getSupportedLanguages);
router.get('/language/:lang', templateController.getTemplatesByLanguage);

// Template accessibility features
router.get('/:id/accessibility', templateController.getAccessibilityFeatures);
router.post('/:id/accessibility/validate', templateController.validateAccessibility);

// Template AI-generated content
router.post('/generate', authenticate, templateController.generateTemplate);
router.get('/generation-options', templateController.getGenerationOptions);
router.post('/:id/enhance', authenticate, templateController.enhanceTemplate);

// Template bulk operations
router.post('/bulk/download', authenticate, templateController.bulkDownload);
router.post('/bulk/update', authenticate, templateController.bulkUpdate);
router.post('/bulk/delete', authenticate, templateController.bulkDelete);

// Template statistics and reporting
router.get('/stats/overview', templateController.getTemplatesOverview);
router.get('/stats/usage', templateController.getUsageStatistics);
router.get('/stats/popular', templateController.getPopularityStats);
router.get('/stats/by-nr', templateController.getStatsByNR);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Templates API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Template validation error',
      errors: error.details
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access to template'
    });
  }
  
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }
  
  if (error.name === 'DuplicateError') {
    return res.status(409).json({
      success: false,
      message: 'Template already exists'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;