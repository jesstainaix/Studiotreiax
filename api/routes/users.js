import express from 'express';
import usersController from '../controllers/usersController.js';

const router = express.Router();

// Authentication routes - DISABLED
router.post('/register', (req, res) => {
  res.status(200).json({
    success: false,
    message: 'O sistema de registro está desabilitado nesta aplicação'
  });
});

router.post('/login', (req, res) => {
  res.status(200).json({
    success: false,
    message: 'O sistema de login está desabilitado nesta aplicação'
  });
});

router.post('/logout', (req, res) => {
  res.status(200).json({
    success: false,
    message: 'O sistema de logout está desabilitado nesta aplicação'
  });
});

// Profile management
router.get('/profile/:id', usersController.getProfile);
router.put('/profile/:id', usersController.updateProfile);

// User management
router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);
router.post('/:id/activate', usersController.activateUser);
router.post('/:id/deactivate', usersController.deactivateUser);

// Bulk operations
router.post('/bulk/import', usersController.bulkImport);
router.post('/bulk/export', usersController.bulkExport);
router.post('/bulk/update', usersController.bulkUpdate);
router.post('/bulk/delete', usersController.bulkDelete);

// Department management
router.get('/departments', usersController.getDepartments);
router.post('/departments', usersController.createDepartment);
router.put('/departments/:id', usersController.updateDepartment);
router.delete('/departments/:id', usersController.deleteDepartment);

// Role management
router.get('/roles', usersController.getRoles);
router.post('/roles', usersController.createRole);
router.put('/roles/:id', usersController.updateRole);
router.delete('/roles/:id', usersController.deleteRole);
router.get('/:id/permissions', usersController.getUserPermissions);
router.post('/:id/permissions', usersController.updateUserPermissions);

// User analytics and reporting
router.get('/:id/analytics', usersController.getUserAnalytics);
router.get('/:id/activity-log', usersController.getUserActivityLog);
router.get('/:id/learning-progress', usersController.getUserLearningProgress);
router.get('/:id/certifications-status', usersController.getUserCertificationsStatus);

// Team management
router.get('/:id/team', usersController.getUserTeam);
router.post('/:id/team/add', usersController.addTeamMembers);
router.post('/:id/team/remove', usersController.removeTeamMembers);

// Notifications
router.get('/:id/notifications', usersController.getUserNotifications);
router.post('/:id/notifications/mark-read', usersController.markNotificationsRead);
router.delete('/:id/notifications/:notificationId', usersController.deleteNotification);

// User sessions
router.get('/:id/sessions', usersController.getUserSessions);
router.delete('/:id/sessions/:sessionId', usersController.terminateSession);
router.delete('/:id/sessions', usersController.terminateAllSessions);

// User preferences and settings
router.get('/:id/preferences', usersController.getUserPreferences);
router.put('/:id/preferences', usersController.updateUserPreferences);

// Two-factor authentication
router.post('/:id/2fa/enable', usersController.enable2FA);
router.post('/:id/2fa/disable', usersController.disable2FA);
router.post('/:id/2fa/verify', usersController.verify2FA);

// Account security
router.get('/:id/security-log', usersController.getSecurityLog);
router.post('/:id/security/lock', usersController.lockAccount);
router.post('/:id/security/unlock', usersController.unlockAccount);

// Data export and privacy
router.post('/:id/export-data', usersController.exportUserData);
router.post('/:id/delete-account', usersController.deleteAccount);

// Search and filtering
router.get('/search/advanced', usersController.advancedSearch);

// Statistics and reports
router.get('/stats/overview', usersController.getUserStats);
router.get('/stats/departments', usersController.getDepartmentStats);
router.get('/stats/roles', usersController.getRoleStats);
router.get('/stats/activity', usersController.getActivityStats);

// Profile activity and achievements
router.get('/:id/profile/activity', usersController.getProfileActivity);
router.get('/:id/achievements', usersController.getAchievements);
router.get('/:id/certifications', usersController.getCertifications);
router.get('/:id/learning-path', usersController.getLearningPath);
router.put('/:id/preferences', usersController.updatePreferences);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Users API Error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export default router;