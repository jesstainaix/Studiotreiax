import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware para verificar autenticação JWT - DISABLED
 * Allows all requests to pass through without authentication
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Authentication disabled - allow all requests
  req.user = {
    id: 'anonymous',
    email: 'anonymous@disabled.com',
    name: 'Anonymous User'
  };
  next();
};

/**
 * Middleware opcional para verificar autenticação - DISABLED
 * Always allows requests without authentication
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Authentication disabled - set anonymous user
  req.user = {
    id: 'anonymous',
    email: 'anonymous@disabled.com',
    name: 'Anonymous User'
  };
  next();
};

/**
 * Middleware para verificar se o usuário é admin - DISABLED
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Admin check disabled - allow all requests
  next();
};

/**
 * Utilitário para gerar JWT token - DISABLED
 */
export const generateToken = (user: { id: string; email: string; name: string }): string => {
  // Token generation disabled - return dummy token
  return 'auth-disabled-token';
};

/**
 * Utilitário para verificar token - DISABLED
 */
export const verifyToken = (token: string): JWTPayload | null => {
  // Token verification disabled - return dummy payload
  return {
    id: 'anonymous',
    email: 'anonymous@disabled.com',
    name: 'Anonymous User'
  };
};