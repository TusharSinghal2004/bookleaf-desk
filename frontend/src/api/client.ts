const API_BASE = (((import.meta as any).env?.VITE_API_URL as string) || '/api').replace(/\/$/, '');

export interface ApiErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  details?: any;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('bookleaf_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        status: 'error',
        statusCode: response.status,
        message: response.statusText || 'Network request failed',
      };
    }

    if (response.status === 401) {
      // Clear token on 401 if unauthorized
      localStorage.removeItem('bookleaf_token');
      localStorage.removeItem('bookleaf_user');
    }

    throw errorData;
  }

  return response.json();
}
