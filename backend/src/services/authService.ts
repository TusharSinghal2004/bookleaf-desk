import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';
import { AppError } from '../utils/helpers';
import { JwtPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-bookleaf-jwt-key-2026-development-only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function loginUser(email: string, passwordPlain: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    authorCode: user.author_code,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  return {
    token,
    user: {
      id: user.id,
      authorCode: user.author_code,
      email: user.email,
      name: user.name,
      role: user.role,
      city: user.city,
      phone: user.phone,
    },
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      author_code: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      city: true,
      joined_date: true,
      created_at: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    authorCode: user.author_code,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    city: user.city,
    joinedDate: user.joined_date ? user.joined_date.toISOString() : null,
  };
}
