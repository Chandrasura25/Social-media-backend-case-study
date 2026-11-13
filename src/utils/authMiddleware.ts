import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

/** Reads the user id from a signed JWT. */
export function verifyJwt(token: string): string {
  const decoded = jwt.verify(token, config.jwtSecret) as { userId?: string };
  if (!decoded.userId) {
    throw new Error('Token has no userId');
  }
  return decoded.userId;
}

export function signJwt(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

/** Accepts `Authorization: Bearer <token>` (or a bare token for older clients). */
export default function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : header;

  if (!token) {
    res.status(401).json({ message: 'Access denied, token is required' });
    return;
  }

  try {
    req.user = { userId: verifyJwt(token) };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
