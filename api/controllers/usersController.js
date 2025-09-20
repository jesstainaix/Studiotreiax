import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validationResult } from 'express-validator';

class UsersController {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.departments = new Map();
    this.roles = new Map();
    this.notifications = new Map();
    this.securityLogs = new Map();
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock departments
    this.departments.set('dept1', {
      id: 'dept1',
      name: 'Segurança do Trabalho',
      description: 'Departamento responsável pela segurança ocupacional',
      managerId: 'user1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    });

    this.departments.set('dept2', {
      id: 'dept2',
      name: 'Recursos Humanos',
      description: 'Gestão de pessoas e desenvolvimento organizacional',
      managerId: 'user2',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    });

    // Mock roles
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      permissions: ['read', 'write', 'delete', 'admin'],
      createdAt: new Date('2024-01-01')
    });

    this.roles.set('manager', {
      id: 'manager',
      name: 'Gerente',
      description: 'Gerenciamento de equipes e projetos',
      permissions: ['read', 'write', 'manage_team'],
      createdAt: new Date('2024-01-01')
    });

    this.roles.set('employee', {
      id: 'employee',
      name: 'Funcionário',
      description: 'Acesso básico ao sistema',
      permissions: ['read'],
      createdAt: new Date('2024-01-01')
    });

    // Mock users
    this.users.set('user1', {
      id: 'user1',
      email: 'admin@studio.com',
      password: 'hashedpassword',
      firstName: 'Admin',
      lastName: 'Sistema',
      department: 'dept1',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      phone: '+55 11 99999-9999',
      bio: 'Administrador do sistema',
      avatar: null,
      preferences: {
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      twoFactorEnabled: false,
      lastLogin: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    });

    this.users.set('user2', {
      id: 'user2',
      email: 'manager@studio.com',
      password: 'hashedpassword',
      firstName: 'Maria',
      lastName: 'Silva',
      department: 'dept2',
      role: 'manager',
      status: 'active',
      emailVerified: true,
      phone: '+55 11 88888-8888',
      bio: 'Gerente de RH',
      avatar: null,
      preferences: {
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          sms: true
        }
      },
      twoFactorEnabled: false,
      lastLogin: new Date(Date.now() - 86400000),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    });
  }

  // Authentication methods
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email, password, firstName, lastName, department, role = 'employee' } = req.body;

      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(user => user.email === email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const userId = 'user' + Date.now();
      const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        department: department || null,
        role,
        status: 'pending',
        emailVerified: false,
        phone: null,
        bio: null,
        avatar: null,
        preferences: {
          language: 'pt',
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        twoFactorEnabled: false,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.users.set(userId, newUser);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: this.sanitizeUser(newUser),
          verificationToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is active
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        { expiresIn: '7d' }
      );

      // Update last login
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      // Create session
      const sessionId = 'session' + Date.now();
      this.sessions.set(sessionId, {
        id: sessionId,
        userId: user.id,
        refreshToken,
        createdAt: new Date(),
        lastActivity: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: this.sanitizeUser(user),
          accessToken,
          refreshToken,
          expiresIn: 900 // 15 minutes
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        // In a real implementation, you would blacklist the token
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Find session
      const session = Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken);
      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Verify refresh token
      try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret');
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Get user
      const user = this.users.get(session.userId);
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '15m' }
      );

      // Update session activity
      session.lastActivity = new Date();
      this.sessions.set(session.id, session);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          expiresIn: 900
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If the email exists, a reset link has been sent'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // In a real implementation, you would save the token and send email
      
      res.json({
        success: true,
        message: 'Password reset link sent to email',
        data: { resetToken } // Only for testing
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      // In a real implementation, you would verify the token
      // For now, we'll just update the first user's password
      const user = Array.from(this.users.values())[0];
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      // In a real implementation, you would verify the token
      // For now, we'll just mark the first pending user as verified
      const user = Array.from(this.users.values()).find(u => !u.emailVerified);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      user.emailVerified = true;
      user.status = 'active';
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user || user.emailVerified) {
        return res.json({
          success: true,
          message: 'If the email exists and is unverified, a verification link has been sent'
        });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');

      res.json({
        success: true,
        message: 'Verification email sent',
        data: { verificationToken } // Only for testing
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Profile management
  async getProfile(req, res) {
    try {
      const user = this.users.get(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: this.sanitizeUser(user)
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = this.users.get(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { firstName, lastName, department, phone, bio } = req.body;

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (department) user.department = department;
      if (phone) user.phone = phone;
      if (bio) user.bio = bio;
      
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: this.sanitizeUser(user)
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const user = this.users.get(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Mock avatar upload
      user.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: user.avatar
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async deleteAvatar(req, res) {
    try {
      const user = this.users.get(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.avatar = null;
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      res.json({
        success: true,
        message: 'Avatar deleted successfully'
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = this.users.get(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // User management (Admin/Manager only)
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, search, department, role, status } = req.query;
      
      let users = Array.from(this.users.values());

      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(user => 
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }

      if (department) {
        users = users.filter(user => user.department === department);
      }

      if (role) {
        users = users.filter(user => user.role === role);
      }

      if (status) {
        users = users.filter(user => user.status === status);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedUsers = users.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          users: paginatedUsers.map(user => this.sanitizeUser(user)),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: users.length,
            pages: Math.ceil(users.length / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = this.users.get(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: this.sanitizeUser(user)
        }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async createUser(req, res) {
    try {
      const { email, firstName, lastName, department, role, sendWelcomeEmail = true } = req.body;

      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(user => user.email === email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Generate temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create new user
      const userId = 'user' + Date.now();
      const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        department: department || null,
        role,
        status: 'active',
        emailVerified: true,
        phone: null,
        bio: null,
        avatar: null,
        preferences: {
          language: 'pt',
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        twoFactorEnabled: false,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.users.set(userId, newUser);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: this.sanitizeUser(newUser),
          temporaryPassword: tempPassword // Only for testing
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, department, role, status } = req.body;

      const user = this.users.get(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (department) user.department = department;
      if (role) user.role = role;
      if (status) user.status = status;
      
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: this.sanitizeUser(user)
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = this.users.get(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      this.users.delete(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Mock implementations for remaining methods
  async activateUser(req, res) { this.mockResponse(res, 'User activated successfully'); }
  async deactivateUser(req, res) { this.mockResponse(res, 'User deactivated successfully'); }
  async adminResetPassword(req, res) { this.mockResponse(res, 'Password reset successfully'); }
  async bulkImport(req, res) { this.mockResponse(res, 'Users imported successfully'); }
  async bulkExport(req, res) { this.mockResponse(res, 'Users exported successfully'); }
  async bulkUpdate(req, res) { this.mockResponse(res, 'Users updated successfully'); }
  async bulkDelete(req, res) { this.mockResponse(res, 'Users deleted successfully'); }
  async getDepartments(req, res) { this.mockResponse(res, 'Departments retrieved', Array.from(this.departments.values())); }
  async createDepartment(req, res) { this.mockResponse(res, 'Department created successfully'); }
  async updateDepartment(req, res) { this.mockResponse(res, 'Department updated successfully'); }
  async deleteDepartment(req, res) { this.mockResponse(res, 'Department deleted successfully'); }
  async getRoles(req, res) { this.mockResponse(res, 'Roles retrieved', Array.from(this.roles.values())); }
  async createRole(req, res) { this.mockResponse(res, 'Role created successfully'); }
  async updateRole(req, res) { this.mockResponse(res, 'Role updated successfully'); }
  async deleteRole(req, res) { this.mockResponse(res, 'Role deleted successfully'); }
  async getUserPermissions(req, res) { this.mockResponse(res, 'Permissions retrieved'); }
  async updateUserPermissions(req, res) { this.mockResponse(res, 'Permissions updated successfully'); }
  async getUserAnalytics(req, res) { this.mockResponse(res, 'Analytics retrieved'); }
  async getUserActivityLog(req, res) { this.mockResponse(res, 'Activity log retrieved'); }
  async getUserLearningProgress(req, res) { this.mockResponse(res, 'Learning progress retrieved'); }
  async getUserCertificationsStatus(req, res) { this.mockResponse(res, 'Certifications status retrieved'); }
  async getUserTeam(req, res) { this.mockResponse(res, 'Team retrieved'); }
  async addTeamMembers(req, res) { this.mockResponse(res, 'Team members added successfully'); }
  async removeTeamMembers(req, res) { this.mockResponse(res, 'Team members removed successfully'); }
  async getUserNotifications(req, res) { this.mockResponse(res, 'Notifications retrieved'); }
  async markNotificationsRead(req, res) { this.mockResponse(res, 'Notifications marked as read'); }
  async deleteNotification(req, res) { this.mockResponse(res, 'Notification deleted successfully'); }
  async getUserSessions(req, res) { this.mockResponse(res, 'Sessions retrieved'); }
  async terminateSession(req, res) { this.mockResponse(res, 'Session terminated successfully'); }
  async terminateAllSessions(req, res) { this.mockResponse(res, 'All sessions terminated successfully'); }
  async getUserPreferences(req, res) { this.mockResponse(res, 'Preferences retrieved'); }
  async updateUserPreferences(req, res) { this.mockResponse(res, 'Preferences updated successfully'); }
  async enable2FA(req, res) { this.mockResponse(res, '2FA enabled successfully'); }
  async disable2FA(req, res) { this.mockResponse(res, '2FA disabled successfully'); }
  async verify2FA(req, res) { this.mockResponse(res, '2FA verified successfully'); }
  async getSecurityLog(req, res) { this.mockResponse(res, 'Security log retrieved'); }
  async lockAccount(req, res) { this.mockResponse(res, 'Account locked successfully'); }
  async unlockAccount(req, res) { this.mockResponse(res, 'Account unlocked successfully'); }
  async exportUserData(req, res) { this.mockResponse(res, 'User data exported successfully'); }
  async deleteAccount(req, res) { this.mockResponse(res, 'Account deleted successfully'); }
  async advancedSearch(req, res) { this.mockResponse(res, 'Search completed'); }
  async getUserStats(req, res) { this.mockResponse(res, 'User statistics retrieved'); }
  async getDepartmentStats(req, res) { this.mockResponse(res, 'Department statistics retrieved'); }
  async getRoleStats(req, res) { this.mockResponse(res, 'Role statistics retrieved'); }
  async getActivityStats(req, res) { this.mockResponse(res, 'Activity statistics retrieved'); }
  async getProfileActivity(req, res) { this.mockResponse(res, 'Profile activity retrieved'); }
  async getAchievements(req, res) { this.mockResponse(res, 'Achievements retrieved'); }
  async getCertifications(req, res) { this.mockResponse(res, 'Certifications retrieved'); }
  async getLearningPath(req, res) { this.mockResponse(res, 'Learning path retrieved'); }
  async updatePreferences(req, res) { this.mockResponse(res, 'Preferences updated successfully'); }

  // Utility methods
  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  mockResponse(res, message, data = null) {
    res.json({
      success: true,
      message,
      data
    });
  }
}

export default new UsersController();