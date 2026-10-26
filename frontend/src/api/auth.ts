import { apiRequest } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'AUTHOR' | 'ADMIN';
  authorCode?: string | null;
  city?: string | null;
  phone?: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/me');
}
