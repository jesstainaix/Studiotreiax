const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ProjectsService {
  constructor() {
    this.projects = new Map();
    this.collaborations = new Map();
    this.versions = new Map();
    this.comments = new Map();
    this.tasks = new Map();
    this.media = new Map();
    this.analytics = new Map();
    this.initializeService();
  }

  async initializeService() {
    // Initialize mock data and services
    this.initializeMockData();
    this.setupAnalyticsTracking();
  }

  initializeMockData() {
    // Mock projects data
    this.projects.set('proj1', {
      id: 'proj1',
      title: 'Treinamento NR-35 - Trabalho em Altura',
      description: 'Curso completo sobre segurança em trabalho em altura conforme NR-35',
      type: 'training',
      category: 'safety',
      nr: 'NR-35',
      status: 'published',
      visibility: 'public',
      ownerId: 'user1',
      collaborators: ['user2', 'user3'],
      tags: ['segurança', 'altura', 'nr35', 'construção', 'epi'],
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20height%20work%20construction%20helmet&image_size=landscape_16_9',
      duration: 3600,
      difficulty: 'intermediate',
      language: 'pt',
      content: {
        scenes: [
          {
            id: 'scene1',
            title: 'Introdução à NR-35',
            type: '3d_scene',
            duration: 300,
            environment: 'construction_site',
            avatars: ['safety_instructor'],
            objects: ['safety_signs', 'construction_equipment'],
            script: 'Bem-vindos ao treinamento sobre trabalho em altura conforme a NR-35. Neste módulo, vamos abordar os principais conceitos e procedimentos de segurança.',
            interactions: [
              {
                id: 'intro_interaction',
                type: 'click',
                target: 'safety_signs',
                action: 'show_info',
                content: 'Placas de sinalização são fundamentais para identificar áreas de risco.'
              }
            ]
          },
          {
            id: 'scene2',
            title: 'Equipamentos de Proteção Individual',
            type: '3d_interactive',
            duration: 600,
            environment: 'equipment_room',
            avatars: ['instructor'],
            objects: ['safety_harness', 'helmet', 'rope', 'anchor_points'],
            script: 'Agora vamos conhecer os equipamentos de proteção individual essenciais para trabalho em altura.',
            interactions: [
              {
                id: 'harness_inspection',
                type: 'drag_drop',
                target: 'safety_harness',
                action: 'inspect',
                content: 'Verifique sempre o estado do cinturão antes do uso.'
              },
              {
                id: 'helmet_check',
                type: 'click',
                target: 'helmet',
                action: 'rotate_view',
                content: 'O capacete deve estar em perfeitas condições.'
              }
            ]
          },
          {
            id: 'scene3',
            title: 'Procedimentos de Segurança',
            type: '3d_simulation',
            duration: 900,
            environment: 'industrial_platform',
            avatars: ['worker', 'supervisor'],
            objects: ['platform', 'guardrails', 'safety_net'],
            script: 'Vamos praticar os procedimentos corretos de segurança em trabalho em altura.',
            simulations: [
              {
                id: 'proper_attachment',
                name: 'Ancoragem Correta',
                steps: [
                  'Identificar ponto de ancoragem',
                  'Conectar o cinturão',
                  'Verificar conexão',
                  'Testar resistência'
                ]
              },
              {
                id: 'fall_arrest',
                name: 'Sistema de Retenção de Quedas',
                steps: [
                  'Posicionar equipamento',
                  'Ajustar cinturão',
                  'Conectar talabarte',
                  'Verificar funcionamento'
                ]
              }
            ]
          },
          {
            id: 'scene4',
            title: 'Avaliação de Conhecimento',
            type: 'quiz',
            duration: 600,
            questions: [
              {
                id: 'q1',
                type: 'multiple_choice',
                question: 'Qual a altura mínima para aplicação da NR-35?',
                options: ['1,5 metros', '2,0 metros', '2,5 metros', '3,0 metros'],
                correct: 1,
                explanation: 'A NR-35 se aplica a trabalhos realizados acima de 2,0 metros de altura.'
              },
              {
                id: 'q2',
                type: 'true_false',
                question: 'É obrigatório o uso de cinturão de segurança em trabalhos acima de 2 metros?',
                correct: true,
                explanation: 'Sim, o uso de EPI é obrigatório conforme a NR-35.'
              },
              {
                id: 'q3',
                type: 'multiple_choice',
                question: 'Qual equipamento NÃO é considerado EPI para trabalho em altura?',
                options: ['Cinturão de segurança', 'Capacete', 'Luvas', 'Óculos de sol'],
                correct: 3,
                explanation: 'Óculos de sol não são EPI específico para trabalho em altura.'
              }
            ]
          },
          {
            id: 'scene5',
            title: 'Certificação',
            type: 'certificate',
            duration: 120,
            certificateTemplate: 'nr35_certificate',
            requirements: {
              minScore: 70,
              completedScenes: ['scene1', 'scene2', 'scene3', 'scene4']
            }
          }
        ],
        totalDuration: 3600,
        hasQuiz: true,
        hasCertificate: true,
        hasSimulation: true,
        has3DContent: true
      },
      analytics: {
        views: 1250,
        completions: 890,
        averageScore: 85.5,
        averageTime: 3200,
        engagement: 92.3,
        dropoffPoints: [
          { sceneId: 'scene2', percentage: 15 },
          { sceneId: 'scene3', percentage: 8 }
        ],
        userFeedback: {
          rating: 4.7,
          comments: 67,
          satisfaction: 89.2
        }
      },
      compliance: {
        approved: true,
        approvedBy: 'compliance_team',
        approvedAt: new Date('2024-01-15'),
        certificationValid: true,
        expiresAt: new Date('2025-01-15'),
        complianceChecks: [
          {
            type: 'content_review',
            status: 'passed',
            checkedAt: new Date('2024-01-10'),
            checkedBy: 'expert1'
          },
          {
            type: 'technical_review',
            status: 'passed',
            checkedAt: new Date('2024-01-12'),
            checkedBy: 'tech_team'
          }
        ]
      },
      settings: {
        allowComments: true,
        allowDownload: false,
        requireCompletion: true,
        certificateEnabled: true,
        adaptiveLearning: true,
        accessibility: {
          subtitles: true,
          audioDescription: true,
          highContrast: false,
          screenReader: true
        },
        notifications: {
          emailOnCompletion: true,
          reminderEmails: true,
          progressUpdates: true
        }
      },
      metadata: {
        fileSize: 125000000, // bytes
        lastBackup: new Date('2024-01-20'),
        version: '2.1.0',
        checksum: 'sha256:abc123def456',
        dependencies: ['three.js', 'babylon.js', 'audio-engine']
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      publishedAt: new Date('2024-01-10')
    });

    // Mock collaboration data
    this.collaborations.set('collab1', {
      id: 'collab1',
      projectId: 'proj1',
      userId: 'user2',
      role: 'editor',
      permissions: ['read', 'write', 'comment', 'review'],
      invitedBy: 'user1',
      status: 'accepted',
      invitedAt: new Date('2024-01-05'),
      acceptedAt: new Date('2024-01-06'),
      lastActivity: new Date('2024-01-18'),
      contributionStats: {
        edits: 23,
        comments: 8,
        reviews: 3,
        timeSpent: 7200 // seconds
      }
    });

    // Mock version data
    this.versions.set('version1', {
      id: 'version1',
      projectId: 'proj1',
      version: '2.1.0',
      title: 'Atualização de Conteúdo',
      description: 'Adicionadas novas simulações e melhorias na interface',
      changes: [
        'Adicionada simulação de resgate',
        'Melhorada qualidade dos modelos 3D',
        'Corrigidos bugs na navegação',
        'Atualizado conteúdo conforme nova legislação'
      ],
      createdBy: 'user1',
      createdAt: new Date('2024-01-15'),
      isPublished: true,
      size: 125000000,
      downloadUrl: '/api/projects/proj1/versions/version1/download',
      changelog: {
        added: ['Nova simulação de resgate', 'Suporte a VR'],
        modified: ['Interface do quiz', 'Modelos 3D'],
        fixed: ['Bug na navegação', 'Problema de áudio'],
        removed: ['Conteúdo obsoleto']
      }
    });

    // Mock analytics data
    this.analytics.set('proj1', {
      projectId: 'proj1',
      dailyViews: [
        { date: '2024-01-15', views: 45, completions: 32 },
        { date: '2024-01-16', views: 52, completions: 38 },
        { date: '2024-01-17', views: 38, completions: 28 },
        { date: '2024-01-18', views: 61, completions: 45 },
        { date: '2024-01-19', views: 47, completions: 35 }
      ],
      userEngagement: {
        averageSessionTime: 3200,
        bounceRate: 12.5,
        returnVisitors: 34.2,
        socialShares: 89,
        bookmarks: 156
      },
      learningOutcomes: {
        knowledgeRetention: 87.3,
        skillImprovement: 92.1,
        behaviorChange: 78.9,
        jobPerformance: 85.6
      },
      deviceStats: {
        desktop: 65.2,
        mobile: 28.7,
        tablet: 6.1
      },
      geographicData: [
        { region: 'São Paulo', percentage: 35.2 },
        { region: 'Rio de Janeiro', percentage: 22.1 },
        { region: 'Minas Gerais', percentage: 18.7 },
        { region: 'Outros', percentage: 24.0 }
      ]
    });
  }

  setupAnalyticsTracking() {
    // Setup real-time analytics tracking
    this.analyticsInterval = setInterval(() => {
      this.updateRealTimeAnalytics();
    }, 30000); // Update every 30 seconds
  }

  updateRealTimeAnalytics() {
    // Simulate real-time analytics updates
    for (const [projectId, analytics] of this.analytics.entries()) {
      // Simulate new views and interactions
      const randomViews = Math.floor(Math.random() * 10);
      const randomCompletions = Math.floor(Math.random() * 5);
      
      const today = new Date().toISOString().split('T')[0];
      const todayData = analytics.dailyViews.find(d => d.date === today);
      
      if (todayData) {
        todayData.views += randomViews;
        todayData.completions += randomCompletions;
      } else {
        analytics.dailyViews.push({
          date: today,
          views: randomViews,
          completions: randomCompletions
        });
      }
      
      // Keep only last 30 days
      if (analytics.dailyViews.length > 30) {
        analytics.dailyViews = analytics.dailyViews.slice(-30);
      }
    }
  }

  // Project management methods
  async createProject(projectData, userId) {
    try {
      const projectId = 'proj_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      
      const newProject = {
        id: projectId,
        title: projectData.title,
        description: projectData.description,
        type: projectData.type || 'training',
        category: projectData.category,
        nr: projectData.nr,
        status: 'draft',
        visibility: projectData.visibility || 'private',
        ownerId: userId,
        collaborators: [],
        tags: projectData.tags || [],
        thumbnail: null,
        duration: projectData.duration || 3600,
        difficulty: projectData.difficulty || 'intermediate',
        language: projectData.language || 'pt',
        content: {
          scenes: [],
          totalDuration: 0,
          hasQuiz: false,
          hasCertificate: false,
          hasSimulation: false,
          has3DContent: false
        },
        analytics: {
          views: 0,
          completions: 0,
          averageScore: 0,
          averageTime: 0,
          engagement: 0,
          dropoffPoints: [],
          userFeedback: {
            rating: 0,
            comments: 0,
            satisfaction: 0
          }
        },
        compliance: {
          approved: false,
          approvedBy: null,
          approvedAt: null,
          certificationValid: false,
          expiresAt: null,
          complianceChecks: []
        },
        settings: {
          allowComments: true,
          allowDownload: false,
          requireCompletion: true,
          certificateEnabled: false,
          adaptiveLearning: false,
          accessibility: {
            subtitles: false,
            audioDescription: false,
            highContrast: false,
            screenReader: false
          },
          notifications: {
            emailOnCompletion: false,
            reminderEmails: false,
            progressUpdates: false
          }
        },
        metadata: {
          fileSize: 0,
          lastBackup: null,
          version: '1.0.0',
          checksum: null,
          dependencies: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Apply template if provided
      if (projectData.templateId) {
        await this.applyTemplate(newProject, projectData.templateId);
      }

      this.projects.set(projectId, newProject);
      
      // Initialize analytics
      this.analytics.set(projectId, {
        projectId,
        dailyViews: [],
        userEngagement: {
          averageSessionTime: 0,
          bounceRate: 0,
          returnVisitors: 0,
          socialShares: 0,
          bookmarks: 0
        },
        learningOutcomes: {
          knowledgeRetention: 0,
          skillImprovement: 0,
          behaviorChange: 0,
          jobPerformance: 0
        },
        deviceStats: {
          desktop: 0,
          mobile: 0,
          tablet: 0
        },
        geographicData: []
      });

      return newProject;
    } catch (error) {
      console.error('Create project error:', error);
      throw new Error('Failed to create project');
    }
  }

  async applyTemplate(project, templateId) {
    try {
      // Mock template application
      const templates = {
        'template_nr35_basic': {
          content: {
            scenes: [
              {
                id: 'intro',
                title: 'Introdução',
                type: '3d_scene',
                duration: 300
              },
              {
                id: 'equipment',
                title: 'Equipamentos',
                type: '3d_interactive',
                duration: 600
              }
            ],
            hasQuiz: true,
            hasCertificate: true,
            has3DContent: true
          },
          duration: 3600,
          settings: {
            certificateEnabled: true,
            adaptiveLearning: true
          }
        }
      };

      const template = templates[templateId];
      if (template) {
        project.content = { ...project.content, ...template.content };
        project.duration = template.duration;
        project.settings = { ...project.settings, ...template.settings };
      }
    } catch (error) {
      console.error('Apply template error:', error);
    }
  }

  async updateProject(projectId, updateData, userId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check permissions
      if (project.ownerId !== userId && !project.collaborators.includes(userId)) {
        throw new Error('Access denied');
      }

      // Update fields
      const allowedFields = [
        'title', 'description', 'category', 'nr', 'visibility', 'tags',
        'duration', 'difficulty', 'language', 'content', 'settings'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === 'content' || field === 'settings') {
            project[field] = { ...project[field], ...updateData[field] };
          } else {
            project[field] = updateData[field];
          }
        }
      }

      project.updatedAt = new Date();
      project.metadata.version = this.incrementVersion(project.metadata.version);
      
      this.projects.set(projectId, project);
      
      // Create version if significant changes
      if (updateData.content) {
        await this.createVersion(projectId, {
          title: 'Atualização de Conteúdo',
          description: 'Conteúdo atualizado automaticamente',
          changes: ['Conteúdo modificado']
        }, userId);
      }

      return project;
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  }

  async deleteProject(projectId, userId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check permissions (only owner can delete)
      if (project.ownerId !== userId) {
        throw new Error('Only project owner can delete');
      }

      // Delete related data
      this.projects.delete(projectId);
      this.analytics.delete(projectId);
      
      // Delete collaborations
      for (const [collabId, collab] of this.collaborations.entries()) {
        if (collab.projectId === projectId) {
          this.collaborations.delete(collabId);
        }
      }
      
      // Delete versions
      for (const [versionId, version] of this.versions.entries()) {
        if (version.projectId === projectId) {
          this.versions.delete(versionId);
        }
      }

      return true;
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }

  async publishProject(projectId, userId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check permissions
      if (project.ownerId !== userId) {
        throw new Error('Only project owner can publish');
      }

      // Validate project before publishing
      const validation = await this.validateProject(project);
      if (!validation.isValid) {
        throw new Error(`Cannot publish: ${validation.errors.join(', ')}`);
      }

      project.status = 'published';
      project.publishedAt = new Date();
      project.updatedAt = new Date();
      
      this.projects.set(projectId, project);

      return project;
    } catch (error) {
      console.error('Publish project error:', error);
      throw error;
    }
  }

  async validateProject(project) {
    const errors = [];
    
    // Basic validation
    if (!project.title || project.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
    
    if (!project.description || project.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
    
    if (!project.content.scenes || project.content.scenes.length === 0) {
      errors.push('Project must have at least one scene');
    }
    
    // Content validation
    if (project.content.hasQuiz) {
      const quizScenes = project.content.scenes.filter(scene => scene.type === 'quiz');
      if (quizScenes.length === 0) {
        errors.push('Project marked as having quiz but no quiz scene found');
      }
    }
    
    // Compliance validation
    if (project.nr && !project.compliance.approved) {
      errors.push('NR-related content must be approved by compliance team');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Collaboration methods
  async addCollaborator(projectId, userId, collaboratorData, requesterId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check permissions
      if (project.ownerId !== requesterId) {
        throw new Error('Only project owner can add collaborators');
      }

      // Check if already collaborator
      if (project.collaborators.includes(userId)) {
        throw new Error('User is already a collaborator');
      }

      // Add to project
      project.collaborators.push(userId);
      project.updatedAt = new Date();
      this.projects.set(projectId, project);

      // Create collaboration record
      const collabId = 'collab_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const collaboration = {
        id: collabId,
        projectId,
        userId,
        role: collaboratorData.role || 'viewer',
        permissions: collaboratorData.permissions || ['read'],
        invitedBy: requesterId,
        status: 'pending',
        invitedAt: new Date(),
        lastActivity: null,
        contributionStats: {
          edits: 0,
          comments: 0,
          reviews: 0,
          timeSpent: 0
        }
      };

      this.collaborations.set(collabId, collaboration);

      return collaboration;
    } catch (error) {
      console.error('Add collaborator error:', error);
      throw error;
    }
  }

  // Version control methods
  async createVersion(projectId, versionData, userId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const versionId = 'version_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const version = {
        id: versionId,
        projectId,
        version: versionData.version || this.incrementVersion(project.metadata.version),
        title: versionData.title,
        description: versionData.description,
        changes: versionData.changes || [],
        createdBy: userId,
        createdAt: new Date(),
        isPublished: false,
        size: project.metadata.fileSize,
        downloadUrl: `/api/projects/${projectId}/versions/${versionId}/download`,
        changelog: {
          added: versionData.added || [],
          modified: versionData.modified || [],
          fixed: versionData.fixed || [],
          removed: versionData.removed || []
        }
      };

      this.versions.set(versionId, version);

      return version;
    } catch (error) {
      console.error('Create version error:', error);
      throw error;
    }
  }

  incrementVersion(currentVersion) {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  // Analytics methods
  async getProjectAnalytics(projectId, timeRange = '30d') {
    try {
      const analytics = this.analytics.get(projectId);
      if (!analytics) {
        throw new Error('Analytics not found');
      }

      // Filter data based on time range
      const days = parseInt(timeRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filteredViews = analytics.dailyViews.filter(view => 
        new Date(view.date) >= cutoffDate
      );

      return {
        ...analytics,
        dailyViews: filteredViews,
        summary: {
          totalViews: filteredViews.reduce((sum, day) => sum + day.views, 0),
          totalCompletions: filteredViews.reduce((sum, day) => sum + day.completions, 0),
          averageViews: filteredViews.length > 0 ? 
            filteredViews.reduce((sum, day) => sum + day.views, 0) / filteredViews.length : 0,
          completionRate: filteredViews.length > 0 ? 
            (filteredViews.reduce((sum, day) => sum + day.completions, 0) / 
             filteredViews.reduce((sum, day) => sum + day.views, 0)) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Get project analytics error:', error);
      throw error;
    }
  }

  async trackProjectView(projectId, userId, sessionData) {
    try {
      const analytics = this.analytics.get(projectId);
      if (!analytics) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let todayData = analytics.dailyViews.find(d => d.date === today);
      
      if (!todayData) {
        todayData = { date: today, views: 0, completions: 0 };
        analytics.dailyViews.push(todayData);
      }
      
      todayData.views++;
      
      // Update engagement metrics
      if (sessionData) {
        analytics.userEngagement.averageSessionTime = 
          (analytics.userEngagement.averageSessionTime + sessionData.sessionTime) / 2;
        
        if (sessionData.device) {
          analytics.deviceStats[sessionData.device]++;
        }
        
        if (sessionData.location) {
          const locationData = analytics.geographicData.find(g => g.region === sessionData.location);
          if (locationData) {
            locationData.percentage++;
          } else {
            analytics.geographicData.push({ region: sessionData.location, percentage: 1 });
          }
        }
      }
      
      this.analytics.set(projectId, analytics);
    } catch (error) {
      console.error('Track project view error:', error);
    }
  }

  async trackProjectCompletion(projectId, userId, completionData) {
    try {
      const analytics = this.analytics.get(projectId);
      if (!analytics) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let todayData = analytics.dailyViews.find(d => d.date === today);
      
      if (todayData) {
        todayData.completions++;
      }
      
      // Update learning outcomes
      if (completionData) {
        if (completionData.score) {
          analytics.learningOutcomes.knowledgeRetention = 
            (analytics.learningOutcomes.knowledgeRetention + completionData.score) / 2;
        }
        
        if (completionData.feedback) {
          analytics.userEngagement.socialShares++;
        }
      }
      
      this.analytics.set(projectId, analytics);
    } catch (error) {
      console.error('Track project completion error:', error);
    }
  }

  // Content management methods
  async updateProjectContent(projectId, contentData, userId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check permissions
      const collaboration = Array.from(this.collaborations.values())
        .find(c => c.projectId === projectId && c.userId === userId);
      
      if (project.ownerId !== userId && 
          (!collaboration || !collaboration.permissions.includes('write'))) {
        throw new Error('Access denied');
      }

      // Update content
      project.content = { ...project.content, ...contentData };
      project.updatedAt = new Date();
      
      // Recalculate total duration
      if (contentData.scenes) {
        project.content.totalDuration = contentData.scenes.reduce(
          (total, scene) => total + (scene.duration || 0), 0
        );
      }
      
      this.projects.set(projectId, project);

      return project.content;
    } catch (error) {
      console.error('Update project content error:', error);
      throw error;
    }
  }

  // Search and filtering
  async searchProjects(query, filters = {}, userId) {
    try {
      let projects = Array.from(this.projects.values());
      
      // Filter by visibility and permissions
      projects = projects.filter(project => {
        if (project.visibility === 'public') return true;
        if (project.ownerId === userId) return true;
        if (project.collaborators.includes(userId)) return true;
        return false;
      });
      
      // Apply search query
      if (query) {
        const queryLower = query.toLowerCase();
        projects = projects.filter(project =>
          project.title.toLowerCase().includes(queryLower) ||
          project.description.toLowerCase().includes(queryLower) ||
          project.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );
      }
      
      // Apply filters
      if (filters.category) {
        projects = projects.filter(p => p.category === filters.category);
      }
      
      if (filters.nr) {
        projects = projects.filter(p => p.nr === filters.nr);
      }
      
      if (filters.status) {
        projects = projects.filter(p => p.status === filters.status);
      }
      
      if (filters.difficulty) {
        projects = projects.filter(p => p.difficulty === filters.difficulty);
      }
      
      return projects;
    } catch (error) {
      console.error('Search projects error:', error);
      throw error;
    }
  }

  // Utility methods
  async generateProjectThumbnail(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Generate thumbnail based on project content
      const prompt = `${project.category} training ${project.nr || ''} ${project.tags.join(' ')}`;
      const thumbnailUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
      
      project.thumbnail = thumbnailUrl;
      project.updatedAt = new Date();
      
      this.projects.set(projectId, project);
      
      return thumbnailUrl;
    } catch (error) {
      console.error('Generate thumbnail error:', error);
      throw error;
    }
  }

  async calculateProjectComplexity(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      let complexity = 0;
      
      // Base complexity from scenes
      complexity += project.content.scenes.length * 10;
      
      // Add complexity for 3D content
      if (project.content.has3DContent) complexity += 30;
      
      // Add complexity for simulations
      if (project.content.hasSimulation) complexity += 25;
      
      // Add complexity for quiz
      if (project.content.hasQuiz) complexity += 15;
      
      // Add complexity for interactions
      const totalInteractions = project.content.scenes.reduce(
        (total, scene) => total + (scene.interactions?.length || 0), 0
      );
      complexity += totalInteractions * 5;
      
      return Math.min(complexity, 100); // Cap at 100
    } catch (error) {
      console.error('Calculate complexity error:', error);
      return 0;
    }
  }

  // Cleanup method
  destroy() {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
  }
}

module.exports = new ProjectsService();