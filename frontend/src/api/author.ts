import { apiRequest } from './client';

export interface Book {
  id: string;
  book_id: string;
  author_id: string;
  title: string;
  isbn: string | null;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  royalty_per_copy: number | null;
  copies_sold: number;
  royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
}

export interface RoyaltySummary {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  isRollover: boolean;
  threshold: number;
  currency: string;
  rolloverNotice: string | null;
}

export interface Reply {
  id: string;
  body: string;
  created_at: string;
  senderId: string;
  senderName: string;
  senderRole: 'AUTHOR' | 'ADMIN';
}

export interface TicketSummary {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  ai_status: 'OK' | 'FAILED' | 'SKIPPED';
  created_at: string;
  updated_at: string;
  book: { id: string; book_id: string; title: string; status: string } | null;
  replyCount: number;
  lastReply: {
    id: string;
    body: string;
    created_at: string;
    senderName: string;
    senderRole: string;
  } | null;
}

export interface TicketDetail extends Omit<TicketSummary, 'book'> {
  book: Book | null;
  replies: Reply[];
}

export async function fetchAuthorBooks(): Promise<Book[]> {
  return apiRequest<Book[]>('/author/books');
}

export async function fetchAuthorRoyalties(): Promise<RoyaltySummary> {
  return apiRequest<RoyaltySummary>('/author/royalties');
}

export async function fetchAuthorTickets(status?: string): Promise<TicketSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<TicketSummary[]>(`/author/tickets${query}`);
}

export async function fetchAuthorTicketById(id: string): Promise<TicketDetail> {
  return apiRequest<TicketDetail>(`/author/tickets/${id}`);
}

export async function createTicket(data: {
  book_id?: string | null;
  subject: string;
  description: string;
}): Promise<TicketDetail> {
  return apiRequest<TicketDetail>('/author/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function postAuthorReply(ticketId: string, body: string): Promise<Reply> {
  return apiRequest<Reply>(`/author/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}
