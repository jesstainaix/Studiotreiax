const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, validateProject } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting
const projectLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many project requests from this IP'
});

// Apply rate limiting to all routes
router.use(projectLimit);

// Project CRUD operations
router.get('/', authenticate, projectController.getUserProjects);
router.get('/:id', authenticate, projectController.getProject);
router.post('/', authenticate, validateProject, projectController.createProject);
router.put('/:id', authenticate, validateProject, projectController.updateProject);
router.delete('/:id', authenticate, projectController.deleteProject);

// Project collaboration
router.post('/:id/share', authenticate, projectController.shareProject);
router.get('/:id/collaborators', authenticate, projectController.getCollaborators);
router.post('/:id/collaborators', authenticate, projectController.addCollaborator);
router.delete('/:id/collaborators/:userId', authenticate, projectController.removeCollaborator);
router.put('/:id/collaborators/:userId/permissions', authenticate, projectController.updateCollaboratorPermissions);

// Project versions
router.get('/:id/versions', authenticate, projectController.getProjectVersions);
router.post('/:id/versions', authenticate, projectController.createVersion);
router.get('/:id/versions/:versionId', authenticate, projectController.getVersion);
router.post('/:id/versions/:versionId/restore', authenticate, projectController.restoreVersion);
router.delete('/:id/versions/:versionId', authenticate, projectController.deleteVersion);

// Project templates
router.get('/:id/template', authenticate, projectController.getProjectTemplate);
router.post('/:id/save-as-template', authenticate, projectController.saveAsTemplate);
router.post('/from-template/:templateId', authenticate, projectController.createFromTemplate);

// Project export/import
router.get('/:id/export', authenticate, projectController.exportProject);
router.post('/import', authenticate, projectController.importProject);

// Project analytics
router.get('/:id/analytics', authenticate, projectController.getProjectAnalytics);
router.get('/:id/engagement', authenticate, projectController.getEngagementMetrics);
router.get('/:id/completion-stats', authenticate, projectController.getCompletionStats);

// Project content
router.get('/:id/content', authenticate, projectController.getProjectContent);
router.put('/:id/content', authenticate, projectController.updateProjectContent);
router.post('/:id/content/validate', authenticate, projectController.validateContent);

// Project media
router.get('/:id/media', authenticate, projectController.getProjectMedia);
router.post('/:id/media', authenticate, projectController.uploadMedia);
router.delete('/:id/media/:mediaId', authenticate, projectController.deleteMedia);

// Project publishing
router.post('/:id/publish', authenticate, projectController.publishProject);
router.post('/:id/unpublish', authenticate, projectController.unpublishProject);
router.get('/:id/publish-status', authenticate, projectController.getPublishStatus);

// Project comments and feedback
router.get('/:id/comments', authenticate, projectController.getComments);
router.post('/:id/comments', authenticate, projectController.addComment);
router.put('/:id/comments/:commentId', authenticate, projectController.updateComment);
router.delete('/:id/comments/:commentId', authenticate, projectController.deleteComment);

// Project tasks and milestones
router.get('/:id/tasks', authenticate, projectController.getTasks);
router.post('/:id/tasks', authenticate, projectController.createTask);
router.put('/:id/tasks/:taskId', authenticate, projectController.updateTask);
router.delete('/:id/tasks/:taskId', authenticate, projectController.deleteTask);

// Project compliance
router.get('/:id/compliance', authenticate, projectController.getComplianceStatus);
router.post('/:id/compliance/check', authenticate, projectController.runComplianceCheck);
router.get('/:id/compliance/report', authenticate, projectController.getComplianceReport);

// Project search and filtering
router.get('/search', authenticate, projectController.searchProjects);
router.get('/filter', authenticate, projectController.filterProjects);
router.get('/recent', authenticate, projectController.getRecentProjects);
router.get('/favorites', authenticate, projectController.getFavoriteProjects);
router.post('/:id/favorite', authenticate, projectController.addToFavorites);
router.delete('/:id/favorite', authenticate, projectController.removeFromFavorites);

// Project duplication
router.post('/:id/duplicate', authenticate, projectController.duplicateProject);

// Project archiving
router.post('/:id/archive', authenticate, projectController.archiveProject);
router.post('/:id/unarchive', authenticate, projectController.unarchiveProject);
router.get('/archived', authenticate, projectController.getArchivedProjects);

// Project statistics
router.get('/stats/overview', authenticate, projectController.getProjectsOverview);
router.get('/stats/by-nr', authenticate, projectController.getProjectsByNR);
router.get('/stats/by-status', authenticate, projectController.getProjectsByStatus);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Projects API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access'
    });
  }
  
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;