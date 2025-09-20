const Joi = require('joi');

/**
 * Generic validation middleware factory
 * Creates middleware that validates request data against Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // User schemas
  userRegister: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
      'any.required': 'Senha é obrigatória'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 50 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Sobrenome deve ter pelo menos 2 caracteres',
      'string.max': 'Sobrenome deve ter no máximo 50 caracteres',
      'any.required': 'Sobrenome é obrigatório'
    }),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Telefone deve ter um formato válido'
    }),
    department: Joi.string().valid('safety', 'training', 'hr', 'operations').optional(),
    position: Joi.string().max(100).optional(),
    role: Joi.string().valid('admin', 'manager', 'instructor', 'user').default('user')
  }),

  userLogin: Joi.object({
    email: Joi.string().required().messages({
      'any.required': 'Email ou usuário é obrigatório'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Senha é obrigatória'
    }),
    rememberMe: Joi.boolean().default(false)
  }),

  userUpdate: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    position: Joi.string().max(100).optional(),
    department: Joi.string().valid('safety', 'training', 'hr', 'operations').optional(),
    role: Joi.string().valid('admin', 'manager', 'instructor', 'user').optional(),
    status: Joi.string().valid('active', 'inactive', 'pending_verification').optional(),
    avatar: Joi.string().uri().optional(),
    preferences: Joi.object({
      language: Joi.string().valid('pt', 'en', 'es').optional(),
      timezone: Joi.string().optional(),
      theme: Joi.string().valid('light', 'dark').optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        sms: Joi.boolean().optional()
      }).optional()
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Senha atual é obrigatória'
    }),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
      'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
      'string.pattern.base': 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
      'any.required': 'Nova senha é obrigatória'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Confirmação de senha deve ser igual à nova senha',
      'any.required': 'Confirmação de senha é obrigatória'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Token de redefinição é obrigatório'
    }),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
      'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
      'string.pattern.base': 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
      'any.required': 'Nova senha é obrigatória'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Confirmação de senha deve ser igual à nova senha',
      'any.required': 'Confirmação de senha é obrigatória'
    })
  }),

  // Project schemas
  projectCreate: Joi.object({
    title: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Título deve ter pelo menos 3 caracteres',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título é obrigatório'
    }),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().valid('safety', 'training', 'compliance', 'general').required(),
    nrCategory: Joi.string().valid('NR-01', 'NR-05', 'NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-18', 'NR-20', 'NR-23', 'NR-33', 'NR-35').optional(),
    templateId: Joi.string().optional(),
    isPublic: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    settings: Joi.object({
      allowComments: Joi.boolean().default(true),
      allowCollaboration: Joi.boolean().default(false),
      autoSave: Joi.boolean().default(true),
      quality: Joi.string().valid('low', 'medium', 'high', 'ultra').default('high')
    }).optional()
  }),

  projectUpdate: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().valid('safety', 'training', 'compliance', 'general').optional(),
    nrCategory: Joi.string().valid('NR-01', 'NR-05', 'NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-18', 'NR-20', 'NR-23', 'NR-33', 'NR-35').optional(),
    isPublic: Joi.boolean().optional(),
    status: Joi.string().valid('draft', 'in_progress', 'review', 'published', 'archived').optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    settings: Joi.object({
      allowComments: Joi.boolean().optional(),
      allowCollaboration: Joi.boolean().optional(),
      autoSave: Joi.boolean().optional(),
      quality: Joi.string().valid('low', 'medium', 'high', 'ultra').optional()
    }).optional()
  }),

  // Template schemas
  templateCreate: Joi.object({
    name: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Nome deve ter pelo menos 3 caracteres',
      'string.max': 'Nome deve ter no máximo 200 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().valid('safety', 'training', 'compliance', 'general').required(),
    nrCategory: Joi.string().valid('NR-01', 'NR-05', 'NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-18', 'NR-20', 'NR-23', 'NR-33', 'NR-35').required(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
    duration: Joi.number().min(1).max(480).optional(), // minutes
    language: Joi.string().valid('pt', 'en', 'es').default('pt'),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    isPublic: Joi.boolean().default(true),
    isPremium: Joi.boolean().default(false),
    content: Joi.object().optional(),
    assets3D: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      url: Joi.string().uri().required(),
      type: Joi.string().valid('model', 'texture', 'animation').required(),
      size: Joi.number().optional()
    })).optional()
  }),

  templateUpdate: Joi.object({
    name: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().valid('safety', 'training', 'compliance', 'general').optional(),
    nrCategory: Joi.string().valid('NR-01', 'NR-05', 'NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-18', 'NR-20', 'NR-23', 'NR-33', 'NR-35').optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    duration: Joi.number().min(1).max(480).optional(),
    language: Joi.string().valid('pt', 'en', 'es').optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    isPublic: Joi.boolean().optional(),
    isPremium: Joi.boolean().optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    content: Joi.object().optional()
  }),

  // Comment schemas
  commentCreate: Joi.object({
    content: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Comentário não pode estar vazio',
      'string.max': 'Comentário deve ter no máximo 1000 caracteres',
      'any.required': 'Conteúdo do comentário é obrigatório'
    }),
    parentId: Joi.string().optional(), // For replies
    timestamp: Joi.number().optional() // Video timestamp
  }),

  // Review schemas
  reviewCreate: Joi.object({
    rating: Joi.number().min(1).max(5).required().messages({
      'number.min': 'Avaliação deve ser entre 1 e 5',
      'number.max': 'Avaliação deve ser entre 1 e 5',
      'any.required': 'Avaliação é obrigatória'
    }),
    comment: Joi.string().max(500).optional(),
    aspects: Joi.object({
      content: Joi.number().min(1).max(5).optional(),
      usability: Joi.number().min(1).max(5).optional(),
      design: Joi.number().min(1).max(5).optional(),
      effectiveness: Joi.number().min(1).max(5).optional()
    }).optional()
  }),

  // File upload schemas
  fileUpload: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('image', 'video', 'audio', 'document', '3d_model').required(),
    size: Joi.number().max(100 * 1024 * 1024).required(), // 100MB max
    mimeType: Joi.string().required()
  }),

  // Search and filter schemas
  searchQuery: Joi.object({
    q: Joi.string().min(1).max(200).optional(),
    category: Joi.string().optional(),
    nrCategory: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    language: Joi.string().valid('pt', 'en', 'es').optional(),
    sortBy: Joi.string().valid('created', 'updated', 'name', 'rating', 'popularity').default('created'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Analytics schemas
  analyticsQuery: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    granularity: Joi.string().valid('hour', 'day', 'week', 'month').default('day'),
    metrics: Joi.array().items(Joi.string()).optional(),
    filters: Joi.object().optional()
  }),

  // Collaboration schemas
  collaboratorAdd: Joi.object({
    userId: Joi.string().required(),
    role: Joi.string().valid('viewer', 'editor', 'admin').default('viewer'),
    permissions: Joi.array().items(Joi.string()).optional()
  }),

  // Notification schemas
  notificationCreate: Joi.object({
    type: Joi.string().valid('system', 'project', 'comment', 'collaboration', 'course').required(),
    title: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(1000).required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    data: Joi.object().optional(),
    recipients: Joi.array().items(Joi.string()).optional() // User IDs
  })
};

// Validation middleware functions
const validateUserRegister = validate(schemas.userRegister);
const validateUserLogin = validate(schemas.userLogin);
const validateUserUpdate = validate(schemas.userUpdate);
const validateChangePassword = validate(schemas.changePassword);
const validateForgotPassword = validate(schemas.forgotPassword);
const validateResetPassword = validate(schemas.resetPassword);

const validateProjectCreate = validate(schemas.projectCreate);
const validateProjectUpdate = validate(schemas.projectUpdate);

const validateTemplateCreate = validate(schemas.templateCreate);
const validateTemplateUpdate = validate(schemas.templateUpdate);

const validateCommentCreate = validate(schemas.commentCreate);
const validateReviewCreate = validate(schemas.reviewCreate);

const validateFileUpload = validate(schemas.fileUpload);
const validateSearchQuery = validate(schemas.searchQuery, 'query');
const validatePagination = validate(schemas.pagination, 'query');
const validateAnalyticsQuery = validate(schemas.analyticsQuery, 'query');

const validateCollaboratorAdd = validate(schemas.collaboratorAdd);
const validateNotificationCreate = validate(schemas.notificationCreate);

/**
 * Custom validation for file uploads
 */
const validateFileType = (allowedTypes = []) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const files = req.files || [req.file];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          code: 'INVALID_FILE_TYPE',
          allowed: allowedTypes,
          received: file.mimetype
        });
      }
    }

    next();
  };
};

/**
 * Validate file size
 */
const validateFileSize = (maxSize = 10 * 1024 * 1024) => { // 10MB default
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];
    
    for (const file of files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: 'File too large',
          code: 'FILE_TOO_LARGE',
          maxSize,
          fileSize: file.size
        });
      }
    }

    next();
  };
};

/**
 * Sanitize HTML content
 */
const sanitizeHtml = (fields = []) => {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field]) {
        // Basic HTML sanitization (in production, use a proper library like DOMPurify)
        req.body[field] = req.body[field]
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
    next();
  };
};

/**
 * Validate ObjectId format
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // Simple validation for our mock IDs (in production, use proper ObjectId validation)
    if (!id || typeof id !== 'string' || id.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        code: 'INVALID_ID',
        parameter: paramName
      });
    }

    next();
  };
};

module.exports = {
  validate,
  schemas,
  
  // User validations
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  
  // Project validations
  validateProjectCreate,
  validateProjectUpdate,
  
  // Template validations
  validateTemplateCreate,
  validateTemplateUpdate,
  
  // Content validations
  validateCommentCreate,
  validateReviewCreate,
  
  // File validations
  validateFileUpload,
  validateFileType,
  validateFileSize,
  
  // Query validations
  validateSearchQuery,
  validatePagination,
  validateAnalyticsQuery,
  
  // Other validations
  validateCollaboratorAdd,
  validateNotificationCreate,
  validateObjectId,
  sanitizeHtml
};