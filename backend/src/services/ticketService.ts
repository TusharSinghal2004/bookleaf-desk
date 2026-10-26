import { prisma } from '../db/client';
import { AppError, mapBookToApi } from '../utils/helpers';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  AiStatus,
  Prisma,
} from '@prisma/client';

export interface CreateTicketInput {
  authorId: string;
  bookId?: string | null;
  subject: string;
  description: string;
}

export interface AdminTicketFilter {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  from?: string;
  to?: string;
  sort?: string;
  assigned_to?: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  assigned_to?: string | null;
}

// Map priority to numeric weight for sorting (Critical first)
const PRIORITY_ORDER: Record<TicketPriority, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  UNSET: 1,
};

export async function createTicket(input: CreateTicketInput) {
  // If bookId is provided, verify it exists and belongs to this author
  if (input.bookId) {
    const book = await prisma.book.findUnique({
      where: { id: input.bookId },
    });
    if (!book) {
      throw new AppError('Referenced book not found', 404);
    }
    if (book.author_id !== input.authorId) {
      throw new AppError('Access denied: You do not own the selected book', 403);
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      author_id: input.authorId,
      book_id: input.bookId || null,
      subject: input.subject.trim(),
      description: input.description.trim(),
      category: TicketCategory.UNCLASSIFIED,
      priority: TicketPriority.UNSET,
      ai_status: AiStatus.SKIPPED,
      status: TicketStatus.OPEN,
    },
    include: {
      book: true,
      author: {
        select: { id: true, name: true, email: true, author_code: true },
      },
    },
  });

  return ticket;
}

export async function getAuthorTickets(authorId: string, statusFilter?: TicketStatus) {
  const where: Prisma.TicketWhereInput = {
    author_id: authorId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      book: {
        select: { id: true, book_id: true, title: true, status: true },
      },
      replies: {
        orderBy: { created_at: 'desc' },
        take: 1,
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  return tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    ai_status: t.ai_status,
    created_at: t.created_at.toISOString(),
    updated_at: t.updated_at.toISOString(),
    book: t.book,
    replyCount: t._count.replies,
    lastReply: t.replies[0]
      ? {
          id: t.replies[0].id,
          body: t.replies[0].body,
          created_at: t.replies[0].created_at.toISOString(),
          senderName: t.replies[0].sender.name,
          senderRole: t.replies[0].sender.role,
        }
      : null,
  }));
}

export async function getAuthorTicketById(ticketId: string, authorId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      book: true,
      replies: {
        orderBy: { created_at: 'asc' },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  // Strict ownership enforcement
  if (ticket.author_id !== authorId) {
    throw new AppError('Forbidden: You do not have permission to access this ticket', 403);
  }

  return {
    id: ticket.id,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    ai_status: ticket.ai_status,
    created_at: ticket.created_at.toISOString(),
    updated_at: ticket.updated_at.toISOString(),
    book: ticket.book ? mapBookToApi(ticket.book) : null,
    replies: ticket.replies.map((r) => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at.toISOString(),
      senderId: r.sender_id,
      senderName: r.sender.name,
      senderRole: r.sender.role,
    })),
  };
}

export async function addAuthorReply(ticketId: string, authorId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (ticket.author_id !== authorId) {
    throw new AppError('Forbidden: You do not have permission to reply to this ticket', 403);
  }

  // Reject with 409 if ticket is RESOLVED or CLOSED per requirements
  if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
    throw new AppError('This ticket is closed. Please open a new ticket.', 409);
  }

  const reply = await prisma.reply.create({
    data: {
      ticket_id: ticketId,
      sender_id: authorId,
      body: body.trim(),
    },
    include: {
      sender: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  // Touch updated_at on ticket
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { updated_at: new Date() },
  });

  return {
    id: reply.id,
    body: reply.body,
    created_at: reply.created_at.toISOString(),
    senderId: reply.sender_id,
    senderName: reply.sender.name,
    senderRole: reply.sender.role,
  };
}

// ----------------- ADMIN FUNCTIONS -----------------

export async function getAdminTickets(filters: AdminTicketFilter) {
  const where: Prisma.TicketWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assigned_to) {
    if (filters.assigned_to === 'unassigned') {
      where.assigned_to = null;
    } else {
      where.assigned_to = filters.assigned_to;
    }
  }

  if (filters.from || filters.to) {
    where.created_at = {};
    if (filters.from) where.created_at.gte = new Date(filters.from);
    if (filters.to) where.created_at.lte = new Date(filters.to);
  }

  const rawTickets = await prisma.ticket.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true, author_code: true, city: true },
      },
      book: {
        select: { id: true, book_id: true, title: true, status: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { replies: true, internal_notes: true },
      },
    },
  });

  // Default server sort: Priority desc (Critical -> High -> Medium -> Low -> Unset), then created_at asc (oldest first)
  const sorted = rawTickets.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.created_at.getTime() - b.created_at.getTime();
  });

  return sorted.map((t) => ({
    id: t.id,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    ai_rationale: t.ai_rationale,
    ai_status: t.ai_status,
    is_overridden: t.is_overridden,
    status: t.status,
    assigned_to: t.assigned_to,
    assignee: t.assignee,
    author: t.author,
    book: t.book,
    replyCount: t._count.replies,
    internalNoteCount: t._count.internal_notes,
    created_at: t.created_at.toISOString(),
    updated_at: t.updated_at.toISOString(),
  }));
}

export async function getAdminTicketById(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          author_code: true,
          joined_date: true,
        },
      },
      book: true,
      assignee: {
        select: { id: true, name: true, email: true },
      },
      replies: {
        orderBy: { created_at: 'asc' },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      internal_notes: {
        orderBy: { created_at: 'asc' },
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
      },
      ai_logs: {
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  return {
    id: ticket.id,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    ai_rationale: ticket.ai_rationale,
    ai_status: ticket.ai_status,
    is_overridden: ticket.is_overridden,
    status: ticket.status,
    assigned_to: ticket.assigned_to,
    assignee: ticket.assignee,
    author: ticket.author,
    book: ticket.book ? mapBookToApi(ticket.book) : null,
    created_at: ticket.created_at.toISOString(),
    updated_at: ticket.updated_at.toISOString(),
    replies: ticket.replies.map((r) => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at.toISOString(),
      senderId: r.sender_id,
      senderName: r.sender.name,
      senderRole: r.sender.role,
    })),
    internal_notes: ticket.internal_notes.map((n) => ({
      id: n.id,
      body: n.body,
      created_at: n.created_at.toISOString(),
      senderId: n.sender_id,
      senderName: n.sender.name,
    })),
    ai_logs: ticket.ai_logs.map((log) => ({
      id: log.id,
      operation: log.operation,
      model: log.model,
      prompt_tokens: log.prompt_tokens,
      completion_tokens: log.completion_tokens,
      success: log.success,
      error: log.error,
      created_at: log.created_at.toISOString(),
    })),
  };
}

export async function updateAdminTicket(ticketId: string, data: UpdateTicketInput) {
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!existing) {
    throw new AppError('Ticket not found', 404);
  }

  // Detect if admin is overriding AI's category or priority
  let isOverridden = existing.is_overridden;
  if (
    (data.category && data.category !== existing.category) ||
    (data.priority && data.priority !== existing.priority)
  ) {
    isOverridden = true;
  }

  // Validate assignee if supplied
  if (data.assigned_to) {
    const assignee = await prisma.user.findUnique({
      where: { id: data.assigned_to },
    });
    if (!assignee || assignee.role !== 'ADMIN') {
      throw new AppError('Invalid assignee: Must be an admin user', 400);
    }
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.assigned_to !== undefined ? { assigned_to: data.assigned_to } : {}),
      is_overridden: isOverridden,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updated;
}

export async function addAdminReply(ticketId: string, adminId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const reply = await prisma.reply.create({
    data: {
      ticket_id: ticketId,
      sender_id: adminId,
      body: body.trim(),
    },
    include: {
      sender: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  // If ticket is OPEN, transition to IN_PROGRESS automatically
  const newStatus = ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : ticket.status;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: newStatus,
      updated_at: new Date(),
    },
  });

  return {
    id: reply.id,
    body: reply.body,
    created_at: reply.created_at.toISOString(),
    senderId: reply.sender_id,
    senderName: reply.sender.name,
    senderRole: reply.sender.role,
  };
}

export async function addInternalNote(ticketId: string, adminId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const note = await prisma.internalNote.create({
    data: {
      ticket_id: ticketId,
      sender_id: adminId,
      body: body.trim(),
    },
    include: {
      sender: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    id: note.id,
    body: note.body,
    created_at: note.created_at.toISOString(),
    senderId: note.sender_id,
    senderName: note.sender.name,
  };
}
