const { validationResult } = require('express-validator');
const crypto = require('crypto');

class ProjectsController {
  constructor() {
    this.projects = new Map();
    this.templates = new Map();
    this.collaborations = new Map();
    this.versions = new Map();
    this.comments = new Map();
    this.tasks = new Map();
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock projects
    this.projects.set('proj1', {
      id: 'proj1',
      title: 'Treinamento NR-35 - Trabalho em Altura',
      description: 'Curso completo sobre segurança em trabalho em altura conforme NR-35',
      type: 'training',
      category: 'safety',
      nr: 'NR-35',
      status: 'active',
      visibility: 'public',
      ownerId: 'user1',
      collaborators: ['user2'],
      tags: ['segurança', 'altura', 'nr35', 'epi'],
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20height%20work%20construction%20helmet&image_size=landscape_16_9',
      duration: 3600, // seconds
      difficulty: 'intermediate',
      language: 'pt',
      content: {
        scenes: [
          {
            id: 'scene1',
            title: 'Introdução à NR-35',
            type: '3d_scene',
            duration: 300,
            assets: ['avatar1', 'construction_site'],
            script: 'Bem-vindos ao treinamento sobre trabalho em altura...'
          }
        ],
        quiz: {
          questions: [
            {
              id: 'q1',
              type: 'multiple_choice',
              question: 'Qual a altura mínima para aplicação da NR-35?',
              options: ['1,5m', '2,0m', '2,5m', '3,0m'],
              correct: 1
            }
          ]
        }
      },
      analytics: {
        views: 1250,
        completions: 890,
        averageScore: 85.5,
        averageTime: 3200,
        engagement: 92.3
      },
      compliance: {
        approved: true,
        approvedBy: 'user1',
        approvedAt: new Date('2024-01-15'),
        certificationValid: true,
        expiresAt: new Date('2025-01-15')
      },
      settings: {
        allowComments: true,
        allowDownload: false,
        requireCompletion: true,
        certificateEnabled: true,
        adaptiveLearning: true
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      publishedAt: new Date('2024-01-10')
    });

    this.projects.set('proj2', {
      id: 'proj2',
      title: 'Segurança em Espaços Confinados - NR-33',
      description: 'Treinamento sobre entrada e trabalho em espaços confinados',
      type: 'training',
      category: 'safety',
      nr: 'NR-33',
      status: 'draft',
      visibility: 'private',
      ownerId: 'user2',
      collaborators: ['user1'],
      tags: ['segurança', 'espaços confinados', 'nr33', 'gases'],
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined%20space%20safety%20industrial%20training&image_size=landscape_16_9',
      duration: 2700,
      difficulty: 'advanced',
      language: 'pt',
      content: {
        scenes: [],
        quiz: { questions: [] }
      },
      analytics: {
        views: 45,
        completions: 0,
        averageScore: 0,
        averageTime: 0,
        engagement: 0
      },
      compliance: {
        approved: false,
        approvedBy: null,
        approvedAt: null,
        certificationValid: false,
        expiresAt: null
      },
      settings: {
        allowComments: true,
        allowDownload: false,
        requireCompletion: true,
        certificateEnabled: true,
        adaptiveLearning: false
      },
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-22')
    });

    // Mock templates
    this.templates.set('template1', {
      id: 'template1',
      name: 'Template NR-35 Básico',
      description: 'Template padrão para treinamentos de trabalho em altura',
      category: 'safety',
      nr: 'NR-35',
      type: 'training',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20template%20height%20work&image_size=square',
      structure: {
        scenes: 5,
        duration: 3600,
        hasQuiz: true,
        hasCertificate: true
      },
      assets: {
        avatars: ['safety_instructor', 'worker'],
        environments: ['construction_site', 'industrial_platform'],
        objects: ['safety_harness', 'helmet', 'rope']
      },
      usage: 156,
      rating: 4.8,
      createdAt: new Date('2024-01-01')
    });

    // Mock collaborations
    this.collaborations.set('collab1', {
      id: 'collab1',
      projectId: 'proj1',
      userId: 'user2',
      role: 'editor',
      permissions: ['read', 'write', 'comment'],
      invitedBy: 'user1',
      status: 'accepted',
      invitedAt: new Date('2024-01-05'),
      acceptedAt: new Date('2024-01-06')
    });

    // Mock versions
    this.versions.set('version1', {
      id: 'version1',
      projectId: 'proj1',
      version: '1.0.0',
      title: 'Versão inicial',
      description: 'Primeira versão do treinamento NR-35',
      changes: ['Criação do conteúdo inicial', 'Adição de quiz', 'Configuração de certificado'],
      createdBy: 'user1',
      createdAt: new Date('2024-01-10'),
      isPublished: true,
      size: 125000000 // bytes
    });

    // Mock comments
    this.comments.set('comment1', {
      id: 'comment1',
      projectId: 'proj1',
      userId: 'user2',
      content: 'Excelente conteúdo! Sugiro adicionar mais exemplos práticos.',
      type: 'general',
      status: 'active',
      replies: [],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12')
    });

    // Mock tasks
    this.tasks.set('task1', {
      id: 'task1',
      projectId: 'proj1',
      title: 'Revisar conteúdo da cena 3',
      description: 'Verificar se o conteúdo está alinhado com as normas atualizadas',
      assignedTo: 'user2',
      assignedBy: 'user1',
      priority: 'high',
      status: 'pending',
      dueDate: new Date('2024-02-01'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    });
  }

  // Project CRUD operations
  async getProjects(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        category, 
        nr, 
        status, 
        type, 
        ownerId,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = req.query;

      let projects = Array.from(this.projects.values());

      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        projects = projects.filter(project => 
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (category) {
        projects = projects.filter(project => project.category === category);
      }

      if (nr) {
        projects = projects.filter(project => project.nr === nr);
      }

      if (status) {
        projects = projects.filter(project => project.status === status);
      }

      if (type) {
        projects = projects.filter(project => project.type === type);
      }

      if (ownerId) {
        projects = projects.filter(project => project.ownerId === ownerId);
      }

      // Apply sorting
      projects.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedProjects = projects.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          projects: paginatedProjects,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: projects.length,
            pages: Math.ceil(projects.length / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      
      const project = this.projects.get(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check permissions
      if (project.visibility === 'private' && 
          project.ownerId !== req.user.userId && 
          !project.collaborators.includes(req.user.userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          project
        }
      });
    } catch (error) {
      console.error('Get project by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        title,
        description,
        type = 'training',
        category,
        nr,
        visibility = 'private',
        tags = [],
        duration = 3600,
        difficulty = 'intermediate',
        language = 'pt',
        templateId
      } = req.body;

      const projectId = 'proj' + Date.now();
      const newProject = {
        id: projectId,
        title,
        description,
        type,
        category,
        nr,
        status: 'draft',
        visibility,
        ownerId: req.user.userId,
        collaborators: [],
        tags,
        thumbnail: null,
        duration,
        difficulty,
        language,
        content: {
          scenes: [],
          quiz: { questions: [] }
        },
        analytics: {
          views: 0,
          completions: 0,
          averageScore: 0,
          averageTime: 0,
          engagement: 0
        },
        compliance: {
          approved: false,
          approvedBy: null,
          approvedAt: null,
          certificationValid: false,
          expiresAt: null
        },
        settings: {
          allowComments: true,
          allowDownload: false,
          requireCompletion: true,
          certificateEnabled: true,
          adaptiveLearning: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Apply template if provided
      if (templateId) {
        const template = this.templates.get(templateId);
        if (template) {
          newProject.content = { ...template.structure };
          newProject.duration = template.structure.duration || duration;
        }
      }

      this.projects.set(projectId, newProject);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          project: newProject
        }
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const project = this.projects.get(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check permissions
      if (project.ownerId !== req.user.userId && 
          !project.collaborators.includes(req.user.userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const {
        title,
        description,
        category,
        nr,
        visibility,
        tags,
        duration,
        difficulty,
        language,
        content,
        settings
      } = req.body;

      // Update fields
      if (title) project.title = title;
      if (description) project.description = description;
      if (category) project.category = category;
      if (nr) project.nr = nr;
      if (visibility) project.visibility = visibility;
      if (tags) project.tags = tags;
      if (duration) project.duration = duration;
      if (difficulty) project.difficulty = difficulty;
      if (language) project.language = language;
      if (content) project.content = { ...project.content, ...content };
      if (settings) project.settings = { ...project.settings, ...settings };
      
      project.updatedAt = new Date();
      this.projects.set(id, project);

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: {
          project
        }
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const project = this.projects.get(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check permissions (only owner can delete)
      if (project.ownerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner can delete'
        });
      }

      this.projects.delete(id);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Collaboration methods
  async addCollaborator(req, res) {
    try {
      const { id } = req.params;
      const { userId, role = 'viewer', permissions = ['read'] } = req.body;
      
      const project = this.projects.get(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user is owner
      if (project.ownerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner can add collaborators'
        });
      }

      // Check if already collaborator
      if (project.collaborators.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User is already a collaborator'
        });
      }

      // Add collaborator
      project.collaborators.push(userId);
      project.updatedAt = new Date();
      this.projects.set(id, project);

      // Create collaboration record
      const collabId = 'collab' + Date.now();
      const collaboration = {
        id: collabId,
        projectId: id,
        userId,
        role,
        permissions,
        invitedBy: req.user.userId,
        status: 'pending',
        invitedAt: new Date()
      };
      this.collaborations.set(collabId, collaboration);

      res.json({
        success: true,
        message: 'Collaborator added successfully',
        data: {
          collaboration
        }
      });
    } catch (error) {
      console.error('Add collaborator error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async removeCollaborator(req, res) {
    try {
      const { id, userId } = req.params;
      
      const project = this.projects.get(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check permissions
      if (project.ownerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner can remove collaborators'
        });
      }

      // Remove collaborator
      project.collaborators = project.collaborators.filter(id => id !== userId);
      project.updatedAt = new Date();
      this.projects.set(id, project);

      res.json({
        success: true,
        message: 'Collaborator removed successfully'
      });
    } catch (error) {
      console.error('Remove collaborator error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getCollaborators(req, res) {
    try {
      const { id } = req.params;
      
      const project = this.projects.get(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const collaborations = Array.from(this.collaborations.values())
        .filter(collab => collab.projectId === id);

      res.json({
        success: true,
        data: {
          collaborators: collaborations
        }
      });
    } catch (error) {
      console.error('Get collaborators error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Version control methods
  async createVersion(req, res) {
    try {
      const { id } = req.params;
      const { version, title, description, changes = [] } = req.body;
      
      const project = this.projects.get(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const versionId = 'version' + Date.now();
      const newVersion = {
        id: versionId,
        projectId: id,
        version,
        title,
        description,
        changes,
        createdBy: req.user.userId,
        createdAt: new Date(),
        isPublished: false,
        size: Math.floor(Math.random() * 200000000) // Mock size
      };

      this.versions.set(versionId, newVersion);

      res.status(201).json({
        success: true,
        message: 'Version created successfully',
        data: {
          version: newVersion
        }
      });
    } catch (error) {
      console.error('Create version error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getVersions(req, res) {
    try {
      const { id } = req.params;
      
      const versions = Array.from(this.versions.values())
        .filter(version => version.projectId === id)
        .sort((a, b) => b.createdAt - a.createdAt);

      res.json({
        success: true,
        data: {
          versions
        }
      });
    } catch (error) {
      console.error('Get versions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Publishing and status methods
  async publishProject(req, res) {
    try {
      const { id } = req.params;
      const project = this.projects.get(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check permissions
      if (project.ownerId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner can publish'
        });
      }

      project.status = 'published';
      project.publishedAt = new Date();
      project.updatedAt = new Date();
      this.projects.set(id, project);

      res.json({
        success: true,
        message: 'Project published successfully',
        data: {
          project
        }
      });
    } catch (error) {
      console.error('Publish project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async unpublishProject(req, res) {
    try {
      const { id } = req.params;
      const project = this.projects.get(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      project.status = 'draft';
      project.publishedAt = null;
      project.updatedAt = new Date();
      this.projects.set(id, project);

      res.json({
        success: true,
        message: 'Project unpublished successfully'
      });
    } catch (error) {
      console.error('Unpublish project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Mock implementations for remaining methods
  async getTemplates(req, res) { this.mockResponse(res, 'Templates retrieved', Array.from(this.templates.values())); }
  async createTemplate(req, res) { this.mockResponse(res, 'Template created successfully'); }
  async updateTemplate(req, res) { this.mockResponse(res, 'Template updated successfully'); }
  async deleteTemplate(req, res) { this.mockResponse(res, 'Template deleted successfully'); }
  async exportProject(req, res) { this.mockResponse(res, 'Project exported successfully'); }
  async importProject(req, res) { this.mockResponse(res, 'Project imported successfully'); }
  async getProjectAnalytics(req, res) { this.mockResponse(res, 'Analytics retrieved'); }
  async updateProjectContent(req, res) { this.mockResponse(res, 'Content updated successfully'); }
  async uploadProjectMedia(req, res) { this.mockResponse(res, 'Media uploaded successfully'); }
  async deleteProjectMedia(req, res) { this.mockResponse(res, 'Media deleted successfully'); }
  async getProjectComments(req, res) { this.mockResponse(res, 'Comments retrieved', Array.from(this.comments.values())); }
  async addProjectComment(req, res) { this.mockResponse(res, 'Comment added successfully'); }
  async updateProjectComment(req, res) { this.mockResponse(res, 'Comment updated successfully'); }
  async deleteProjectComment(req, res) { this.mockResponse(res, 'Comment deleted successfully'); }
  async getProjectTasks(req, res) { this.mockResponse(res, 'Tasks retrieved', Array.from(this.tasks.values())); }
  async createProjectTask(req, res) { this.mockResponse(res, 'Task created successfully'); }
  async updateProjectTask(req, res) { this.mockResponse(res, 'Task updated successfully'); }
  async deleteProjectTask(req, res) { this.mockResponse(res, 'Task deleted successfully'); }
  async checkProjectCompliance(req, res) { this.mockResponse(res, 'Compliance checked successfully'); }
  async searchProjects(req, res) { this.mockResponse(res, 'Search completed'); }
  async duplicateProject(req, res) { this.mockResponse(res, 'Project duplicated successfully'); }
  async archiveProject(req, res) { this.mockResponse(res, 'Project archived successfully'); }
  async restoreProject(req, res) { this.mockResponse(res, 'Project restored successfully'); }
  async getProjectStats(req, res) { this.mockResponse(res, 'Statistics retrieved'); }

  // Utility method
  mockResponse(res, message, data = null) {
    res.json({
      success: true,
      message,
      data
    });
  }
}

module.exports = new ProjectsController();