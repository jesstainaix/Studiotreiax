import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

class UsersService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.departments = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.notifications = new Map();
    this.auditLogs = new Map();
    this.initializeService();
  }

  async initializeService() {
    this.initializeMockData();
    this.setupEmailTransporter();
    this.setupSessionCleanup();
  }

  initializeMockData() {
    // Initialize roles
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrador',
      description: 'Acesso completo ao sistema',
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'projects.create', 'projects.read', 'projects.update', 'projects.delete',
        'templates.create', 'templates.read', 'templates.update', 'templates.delete',
        'analytics.read', 'analytics.export',
        'system.configure', 'system.backup', 'system.restore'
      ],
      level: 100,
      createdAt: new Date('2023-01-01')
    });

    this.roles.set('manager', {
      id: 'manager',
      name: 'Gerente',
      description: 'Gerenciamento de equipe e projetos',
      permissions: [
        'users.read', 'users.update',
        'projects.create', 'projects.read', 'projects.update',
        'templates.read', 'templates.update',
        'analytics.read', 'analytics.export',
        'team.manage'
      ],
      level: 80,
      createdAt: new Date('2023-01-01')
    });

    this.roles.set('instructor', {
      id: 'instructor',
      name: 'Instrutor',
      description: 'Criação e gerenciamento de conteúdo educacional',
      permissions: [
        'projects.create', 'projects.read', 'projects.update',
        'templates.read', 'templates.use',
        'content.create', 'content.edit',
        'students.view', 'students.assess'
      ],
      level: 60,
      createdAt: new Date('2023-01-01')
    });

    this.roles.set('user', {
      id: 'user',
      name: 'Usuário',
      description: 'Acesso básico para visualização e uso de conteúdo',
      permissions: [
        'projects.read',
        'templates.read', 'templates.use',
        'content.view',
        'profile.update'
      ],
      level: 20,
      createdAt: new Date('2023-01-01')
    });

    // Initialize departments
    this.departments.set('safety', {
      id: 'safety',
      name: 'Segurança do Trabalho',
      description: 'Departamento responsável pela segurança e saúde ocupacional',
      managerId: 'user_manager_001',
      budget: 150000,
      location: 'Sede Principal',
      createdAt: new Date('2023-01-01')
    });

    this.departments.set('training', {
      id: 'training',
      name: 'Treinamento e Desenvolvimento',
      description: 'Departamento de capacitação e desenvolvimento de pessoal',
      managerId: 'user_manager_002',
      budget: 200000,
      location: 'Centro de Treinamento',
      createdAt: new Date('2023-01-01')
    });

    this.departments.set('hr', {
      id: 'hr',
      name: 'Recursos Humanos',
      description: 'Gestão de pessoas e desenvolvimento organizacional',
      managerId: 'user_manager_003',
      budget: 120000,
      location: 'Sede Principal',
      createdAt: new Date('2023-01-01')
    });

    // Initialize users
    this.users.set('user_admin_001', {
      id: 'user_admin_001',
      email: 'admin@studiotreiax.com',
      username: 'admin',
      password: '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ', // hashed 'admin123'
      firstName: 'Administrador',
      lastName: 'Sistema',
      fullName: 'Administrador Sistema',
      role: 'admin',
      department: 'training',
      status: 'active',
      emailVerified: true,
      twoFactorEnabled: true,
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20admin%20avatar%20business&image_size=square',
      phone: '+55 11 99999-0001',
      position: 'Administrador do Sistema',
      hireDate: new Date('2023-01-01'),
      lastLogin: new Date(),
      loginCount: 1250,
      preferences: {
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        dashboard: {
          layout: 'grid',
          widgets: ['analytics', 'recent_projects', 'notifications', 'team_activity']
        }
      },
      permissions: this.roles.get('admin').permissions,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date()
    });

    this.users.set('user_manager_001', {
      id: 'user_manager_001',
      email: 'manager.safety@studiotreiax.com',
      username: 'manager_safety',
      password: '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ',
      firstName: 'Carlos',
      lastName: 'Silva',
      fullName: 'Carlos Silva',
      role: 'manager',
      department: 'safety',
      status: 'active',
      emailVerified: true,
      twoFactorEnabled: false,
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20manager%20safety%20engineer&image_size=square',
      phone: '+55 11 99999-0002',
      position: 'Gerente de Segurança',
      hireDate: new Date('2023-02-15'),
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      loginCount: 890,
      team: ['user_instructor_001', 'user_instructor_002'],
      certifications: [
        {
          name: 'Técnico em Segurança do Trabalho',
          issuer: 'CREA-SP',
          number: 'TST-12345',
          issuedAt: new Date('2020-06-15'),
          expiresAt: new Date('2025-06-15')
        },
        {
          name: 'Engenheiro de Segurança',
          issuer: 'CONFEA',
          number: 'ENG-67890',
          issuedAt: new Date('2018-03-20'),
          expiresAt: null // permanent
        }
      ],
      preferences: {
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: true
        }
      },
      permissions: this.roles.get('manager').permissions,
      createdAt: new Date('2023-02-15'),
      updatedAt: new Date()
    });

    this.users.set('user_instructor_001', {
      id: 'user_instructor_001',
      email: 'instructor1@studiotreiax.com',
      username: 'instructor_maria',
      password: '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ',
      firstName: 'Maria',
      lastName: 'Santos',
      fullName: 'Maria Santos',
      role: 'instructor',
      department: 'training',
      status: 'active',
      emailVerified: true,
      twoFactorEnabled: false,
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20instructor%20teacher&image_size=square',
      phone: '+55 11 99999-0003',
      position: 'Instrutora de Segurança',
      hireDate: new Date('2023-03-01'),
      lastLogin: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      loginCount: 456,
      specializations: ['NR-35', 'NR-33', 'NR-10'],
      coursesCreated: 23,
      studentsImpacted: 1250,
      averageRating: 4.8,
      preferences: {
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      },
      permissions: this.roles.get('instructor').permissions,
      createdAt: new Date('2023-03-01'),
      updatedAt: new Date()
    });

    this.users.set('user_student_001', {
      id: 'user_student_001',
      email: 'joao.worker@empresa.com',
      username: 'joao_worker',
      password: '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ',
      firstName: 'João',
      lastName: 'Trabalhador',
      fullName: 'João Trabalhador',
      role: 'user',
      department: 'safety',
      status: 'active',
      emailVerified: true,
      twoFactorEnabled: false,
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=construction%20worker%20professional%20portrait&image_size=square',
      phone: '+55 11 99999-0004',
      position: 'Operador de Máquinas',
      hireDate: new Date('2023-06-01'),
      lastLogin: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      loginCount: 89,
      coursesCompleted: 5,
      certificationsEarned: 3,
      totalStudyTime: 2400, // minutes
      averageScore: 87.5,
      preferences: {
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        theme: 'dark',
        notifications: {
          email: false,
          push: true,
          sms: false
        }
      },
      permissions: this.roles.get('user').permissions,
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date()
    });

    // Initialize notifications
    this.notifications.set('notif_001', {
      id: 'notif_001',
      userId: 'user_manager_001',
      type: 'system',
      title: 'Novo template disponível',
      message: 'Um novo template para NR-35 foi adicionado à biblioteca',
      data: {
        templateId: 'template_nr35_001',
        category: 'NR-35'
      },
      read: false,
      priority: 'medium',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    this.notifications.set('notif_002', {
      id: 'notif_002',
      userId: 'user_instructor_001',
      type: 'course',
      title: 'Avaliação pendente',
      message: 'Você tem 3 avaliações de alunos pendentes de correção',
      data: {
        pendingAssessments: 3,
        courseId: 'course_safety_001'
      },
      read: false,
      priority: 'high',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    });

    // Initialize audit logs
    this.auditLogs.set('audit_001', {
      id: 'audit_001',
      userId: 'user_admin_001',
      action: 'user.create',
      resource: 'user_instructor_001',
      details: {
        targetUser: 'user_instructor_001',
        changes: ['created new instructor account']
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });
  }

  setupEmailTransporter() {
    // Mock email transporter for development
    this.emailTransporter = {
      sendMail: async (options) => {
        console.log('Mock email sent:', options);
        return { messageId: 'mock_' + Date.now() };
      }
    };
  }

  setupSessionCleanup() {
    // Clean expired sessions every hour
    setInterval(() => {
      this.cleanExpiredSessions();
    }, 60 * 60 * 1000);
  }

  cleanExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Authentication methods
  async register(userData) {
    try {
      // Validate required fields
      const requiredFields = ['email', 'password', 'firstName', 'lastName'];
      for (const field of requiredFields) {
        if (!userData[field]) {
          throw new Error(`Field ${field} is required`);
        }
      }

      // Check if email already exists
      const existingUser = Array.from(this.users.values())
        .find(user => user.email.toLowerCase() === userData.email.toLowerCase());
      
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Check if username already exists (if provided)
      if (userData.username) {
        const existingUsername = Array.from(this.users.values())
          .find(user => user.username === userData.username);
        
        if (existingUsername) {
          throw new Error('Username already taken');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Generate user ID
      const userId = 'user_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

      // Create user object
      const user = {
        id: userId,
        email: userData.email.toLowerCase(),
        username: userData.username || userData.email.split('@')[0],
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role || 'user',
        department: userData.department || null,
        status: 'pending_verification',
        emailVerified: false,
        twoFactorEnabled: false,
        avatar: userData.avatar || null,
        phone: userData.phone || null,
        position: userData.position || null,
        hireDate: userData.hireDate || new Date(),
        lastLogin: null,
        loginCount: 0,
        preferences: {
          language: userData.language || 'pt',
          timezone: userData.timezone || 'America/Sao_Paulo',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        permissions: this.roles.get(userData.role || 'user')?.permissions || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save user
      this.users.set(userId, user);

      // Send verification email
      await this.sendVerificationEmail(user);

      // Log audit
      await this.logAudit(null, 'user.register', userId, {
        email: user.email,
        role: user.role
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const { email, password, rememberMe = false } = credentials;

      // Find user by email or username
      const user = Array.from(this.users.values())
        .find(u => 
          u.email.toLowerCase() === email.toLowerCase() || 
          u.username === email
        );

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Check user status
      if (user.status !== 'active') {
        throw new Error(`Account is ${user.status}`);
      }

      // Update login info
      user.lastLogin = new Date();
      user.loginCount++;
      user.updatedAt = new Date();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Create session
      const sessionId = 'session_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (rememberMe ? 24 * 7 : 24)); // 7 days or 1 day

      this.sessions.set(sessionId, {
        id: sessionId,
        userId: user.id,
        accessToken,
        refreshToken,
        createdAt: new Date(),
        expiresAt,
        lastActivity: new Date(),
        ipAddress: '192.168.1.100', // Mock IP
        userAgent: 'Mock User Agent'
      });

      // Log audit
      await this.logAudit(user.id, 'user.login', user.id, {
        sessionId,
        rememberMe
      });

      // Return user data and tokens
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60 // seconds
        },
        session: {
          id: sessionId,
          expiresAt
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Log audit
      await this.logAudit(session.userId, 'user.logout', session.userId, {
        sessionId
      });

      // Remove session
      this.sessions.delete(sessionId);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Find session by refresh token
      const session = Array.from(this.sessions.values())
        .find(s => s.refreshToken === refreshToken);

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        this.sessions.delete(session.id);
        throw new Error('Session expired');
      }

      // Get user
      const user = this.users.get(session.userId);
      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update session
      session.accessToken = newAccessToken;
      session.refreshToken = newRefreshToken;
      session.lastActivity = new Date();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60 // 24 hours
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      const user = Array.from(this.users.values())
        .find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        // Don't reveal if email exists for security
        return { success: true, message: 'If email exists, reset instructions were sent' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

      // Store reset token (in real app, store in database)
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      user.updatedAt = new Date();

      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);

      // Log audit
      await this.logAudit(user.id, 'user.password_reset_request', user.id, {
        email: user.email
      });

      return { success: true, message: 'Password reset instructions sent to email' };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      // Find user by reset token
      const user = Array.from(this.users.values())
        .find(u => u.passwordResetToken === token);

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if token is expired
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new Error('Reset token has expired');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user
      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      user.updatedAt = new Date();

      // Invalidate all sessions for this user
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.userId === user.id) {
          this.sessions.delete(sessionId);
        }
      }

      // Log audit
      await this.logAudit(user.id, 'user.password_reset', user.id, {
        email: user.email
      });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      // Find user by verification token
      const user = Array.from(this.users.values())
        .find(u => u.emailVerificationToken === token);

      if (!user) {
        throw new Error('Invalid verification token');
      }

      // Update user
      user.emailVerified = true;
      user.status = 'active';
      user.emailVerificationToken = null;
      user.updatedAt = new Date();

      // Log audit
      await this.logAudit(user.id, 'user.email_verified', user.id, {
        email: user.email
      });

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }

  // User management methods
  async getUsers(filters = {}, pagination = {}) {
    try {
      let users = Array.from(this.users.values());

      // Apply filters
      if (filters.role) {
        users = users.filter(u => u.role === filters.role);
      }

      if (filters.department) {
        users = users.filter(u => u.department === filters.department);
      }

      if (filters.status) {
        users = users.filter(u => u.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        users = users.filter(u => 
          u.fullName.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.username.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const offset = (page - 1) * limit;

      const total = users.length;
      const paginatedUsers = users.slice(offset, offset + limit);

      // Remove passwords from response
      const usersWithoutPasswords = paginatedUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return {
        users: usersWithoutPasswords,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData, updatedBy) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Track changes for audit
      const changes = [];
      const allowedFields = [
        'firstName', 'lastName', 'phone', 'position', 'department',
        'role', 'status', 'avatar', 'preferences'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined && updateData[field] !== user[field]) {
          changes.push({
            field,
            oldValue: user[field],
            newValue: updateData[field]
          });
          user[field] = updateData[field];
        }
      }

      // Update full name if first or last name changed
      if (updateData.firstName || updateData.lastName) {
        user.fullName = `${user.firstName} ${user.lastName}`;
      }

      // Update permissions if role changed
      if (updateData.role) {
        const role = this.roles.get(updateData.role);
        if (role) {
          user.permissions = role.permissions;
        }
      }

      user.updatedAt = new Date();

      // Log audit
      if (changes.length > 0) {
        await this.logAudit(updatedBy, 'user.update', userId, {
          changes,
          targetUser: userId
        });
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId, deletedBy) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete - change status instead of removing
      user.status = 'deleted';
      user.deletedAt = new Date();
      user.deletedBy = deletedBy;
      user.updatedAt = new Date();

      // Invalidate all sessions
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.userId === userId) {
          this.sessions.delete(sessionId);
        }
      }

      // Log audit
      await this.logAudit(deletedBy, 'user.delete', userId, {
        targetUser: userId,
        email: user.email
      });

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Notification methods
  async getUserNotifications(userId, filters = {}) {
    try {
      let notifications = Array.from(this.notifications.values())
        .filter(n => n.userId === userId);

      if (filters.read !== undefined) {
        notifications = notifications.filter(n => n.read === filters.read);
      }

      if (filters.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }

      // Sort by creation date (newest first)
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return notifications;
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new Error('Unauthorized');
      }

      notification.read = true;
      notification.readAt = new Date();

      return notification;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Utility methods
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      'mock_jwt_secret',
      { expiresIn: '1h' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      'mock_jwt_refresh_secret',
      { expiresIn: '7d' }
    );
  }

  async sendVerificationEmail(user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    
    await this.emailTransporter.sendMail({
      to: user.email,
      subject: 'Verificação de Email - Studio TreiaX',
      html: `
        <h2>Bem-vindo ao Studio TreiaX!</h2>
        <p>Clique no link abaixo para verificar seu email:</p>
        <a href="${verificationUrl}">Verificar Email</a>
        <p>Este link expira em 24 horas.</p>
      `
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    
    await this.emailTransporter.sendMail({
      to: user.email,
      subject: 'Redefinição de Senha - Studio TreiaX',
      html: `
        <h2>Redefinição de Senha</h2>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
      `
    });
  }

  async logAudit(userId, action, resource, details = {}) {
    const auditId = 'audit_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    
    this.auditLogs.set(auditId, {
      id: auditId,
      userId,
      action,
      resource,
      details,
      ipAddress: '192.168.1.100', // Mock IP
      userAgent: 'Mock User Agent',
      timestamp: new Date()
    });
  }

  // Department and role management
  async getDepartments() {
    try {
      return Array.from(this.departments.values());
    } catch (error) {
      console.error('Get departments error:', error);
      throw error;
    }
  }

  async getRoles() {
    try {
      return Array.from(this.roles.values());
    } catch (error) {
      console.error('Get roles error:', error);
      throw error;
    }
  }

  async getUserAnalytics(timeRange = '30d') {
    try {
      const users = Array.from(this.users.values());
      const days = parseInt(timeRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const analytics = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        pending: users.filter(u => u.status === 'pending_verification').length,
        newUsers: users.filter(u => u.createdAt >= cutoffDate).length,
        byRole: {},
        byDepartment: {},
        loginActivity: {
          totalLogins: users.reduce((sum, u) => sum + u.loginCount, 0),
          activeToday: users.filter(u => 
            u.lastLogin && u.lastLogin >= new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length,
          activeThisWeek: users.filter(u => 
            u.lastLogin && u.lastLogin >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        }
      };

      // Group by role
      for (const user of users) {
        analytics.byRole[user.role] = (analytics.byRole[user.role] || 0) + 1;
      }

      // Group by department
      for (const user of users) {
        if (user.department) {
          analytics.byDepartment[user.department] = (analytics.byDepartment[user.department] || 0) + 1;
        }
      }

      return analytics;
    } catch (error) {
      console.error('Get user analytics error:', error);
      throw error;
    }
  }

  // Cleanup method
  destroy() {
    // Clean up any intervals or resources
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
  }
}

export default new UsersService();