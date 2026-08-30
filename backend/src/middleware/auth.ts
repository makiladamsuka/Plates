import type { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: User | { id: string; email?: string };
}

/**
 * Middleware to authenticate requests via Supabase JWT Bearer tokens.
 * Enforces strict JWT verification in production environments.
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { id: (req.query.userId as string) || (req.body?.userId) || 'demo-user-me' };
        return next();
      }
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }

    const token = authHeader.split(' ')[1];

    if (process.env.NODE_ENV !== 'production' && token === 'guest-token') {
      req.user = { id: (req.query.userId as string) || (req.body?.userId) || 'demo-user-me' };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { id: (req.query.userId as string) || (req.body?.userId) || 'demo-user-me' };
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: (req.query.userId as string) || (req.body?.userId) || 'demo-user-me' };
      return next();
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

