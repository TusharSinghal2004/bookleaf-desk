import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth';
import { AppError } from '../utils/helpers';
import { prisma } from '../db/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-bookleaf-jwt-key-2026-development-only';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required: Missing or invalid Authorization header', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Self-healing check: look up user by ID or email to ensure database consistency across seeds
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: decoded.userId }, { email: decoded.email }],
      },
    });

    if (!dbUser) {
      return next(new AppError('Session expired or user not found. Please log in again.', 401));
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
      authorCode: dbUser.author_code,
    };

    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
}
