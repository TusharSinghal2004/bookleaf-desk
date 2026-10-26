import { apiRequest } from './client';
import { Book, Reply } from './author';

export interface InternalNote {
  id: string;
  body: string;
  created_at: string;
  senderId: string;
  senderName: string;
}

export interface AILogItem {
  id: string;
  operation: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  success: boolean;
  error?: string | null;
  created_at: string;
}

export interface AdminTicketItem {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSET';
  ai_rationale?: string | null;
  ai_status: 'OK' | 'FAILED' | 'SKIPPED';
  is_overridden: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigned_to?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  author: { id: string; name: string; email: string; author_code?: string | null; city?: string | null };
  book?: { id: string; book_id: string; title: string; status: string } | null;
  replyCount: number;
  internalNoteCount: number;
  created_at: string;
  updated_at: string;
}

export interface AdminTicketDetail extends AdminTicketItem {
  author: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    city?: string | null;
    author_code?: string | null;
    joined_date?: string | null;
  };
  book: Book | null;
  replies: Reply[];
  internal_notes: InternalNote[];
  ai_logs: AILogItem[];
}

export interface AdminFilterParams {
  status?: string;
  category?: string;
  priority?: string;
  from?: string;
  to?: string;
  sort?: string;
  assigned_to?: string;
}

export async function fetchAdminTickets(params: AdminFilterParams = {}): Promise<AdminTicketItem[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val) query.append(key, val);
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<AdminTicketItem[]>(`/admin/tickets${queryString}`);
}

export async function fetchAdminTicketById(id: string): Promise<AdminTicketDetail> {
  return apiRequest<AdminTicketDetail>(`/admin/tickets/${id}`);
}

export async function updateAdminTicket(
  id: string,
  updates: {
    status?: string;
    category?: string;
    priority?: string;
    assigned_to?: string | null;
  }
): Promise<AdminTicketItem> {
  return apiRequest<AdminTicketItem>(`/admin/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function postAdminReply(ticketId: string, body: string): Promise<Reply> {
  return apiRequest<Reply>(`/admin/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function postAdminNote(ticketId: string, body: string): Promise<InternalNote> {
  return apiRequest<InternalNote>(`/admin/tickets/${ticketId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function reclassifyTicket(ticketId: string): Promise<{
  category: string;
  priority: string;
  ai_rationale?: string;
  ai_status: string;
}> {
  return apiRequest(`/admin/tickets/${ticketId}/classify`, {
    method: 'POST',
  });
}

export async function generateDraft(ticketId: string): Promise<{
  draft: string;
  tokens: { prompt: number; completion: number };
}> {
  return apiRequest(`/admin/tickets/${ticketId}/draft`, {
    method: 'POST',
  });
}
