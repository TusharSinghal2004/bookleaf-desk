import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. AppError (domain error with explicit status code)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // 2. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (e.g., P2002)
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return res.status(409).json({
        status: 'error',
        statusCode: 409,
        message: `Conflict: A record with this ${target.join(', ') || 'field'} already exists.`,
      });
    }

    // Record not found (e.g., P2025)
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'The requested resource was not found.',
      });
    }
  }

  // 3. Fallback 500 without leaking stack traces in production
  console.error('Unhandled internal server error:', err);

  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: isDev ? err.message : 'An unexpected internal server error occurred.',
    ...(isDev ? { stack: err.stack } : {}),
  });
}
