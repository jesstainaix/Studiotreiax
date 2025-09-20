/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = Router();

// Interface para usuários
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Simulação de banco de dados em memória
const users: User[] = [
  {
    id: 'demo-user',
    email: 'demo@example.com',
    name: 'Usuário Demo',
    password: '$2b$10$rOvHPxfuqjNy.33ErMdCa.6NCXa0M.saUZuVxo2p5TAkzANm2Aw7y', // password: demo123
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@studio.com',
    name: 'Admin Studio',
    password: '$2b$10$OIkeoqpB8SNYqiKjiE7eGOkfhZwnrte6cLJMXyRfvUCviNRmGbdy2', // password: admin123
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true
  }
];

/**
 * POST /api/auth/register
 * Register a new user - DISABLED
 */
router.post('/register', async (req: Request, res: Response) => {
  res.status(200).json({
    success: false,
    message: 'Sistema de autenticação desabilitado',
    error: 'O registro de usuários está desabilitado nesta aplicação'
  });
});

/**
 * POST /api/auth/login
 * Login user - DISABLED
 */
router.post('/login', async (req: Request, res: Response) => {
  res.status(200).json({
    success: false,
    message: 'Sistema de autenticação desabilitado',
    error: 'O login está desabilitado nesta aplicação'
  });
});

/**
 * POST /api/auth/logout
 * Logout user - DISABLED
 */
router.post('/logout', (req: Request, res: Response) => {
  res.status(200).json({
    success: false,
    message: 'Sistema de autenticação desabilitado',
    error: 'O logout está desabilitado nesta aplicação'
  });
});

/**
 * GET /api/auth/me
 * Get current user info - DISABLED
 */
router.get('/me', (req: Request, res: Response) => {
  res.status(200).json({
    success: false,
    message: 'Sistema de autenticação desabilitado',
    error: 'A verificação de usuário está desabilitada nesta aplicação'
  });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset - DISABLED
 */
router.post('/forgot-password', (req: Request, res: Response) => {
  res.status(200).json({
    success: false,
    message: 'Sistema de autenticação desabilitado',
    error: 'A recuperação de senha está desabilitada nesta aplicação'
  });
});

export default router;