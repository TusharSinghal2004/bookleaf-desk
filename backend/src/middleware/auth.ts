import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth';
import { AppError } from '../utils/helpers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-bookleaf-jwt-key-2026-development-only';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required: Missing or invalid Authorization header', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
}
