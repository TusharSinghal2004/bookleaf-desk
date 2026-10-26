import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ticketService from '../services/ticketService';
import * as aiService from '../services/aiService';
import { prisma } from '../db/client';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import { parsePlatforms } from '../utils/helpers';

export const updateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export const replyOrNoteSchema = z.object({
  body: z.string().min(1, 'Body cannot be empty'),
});

export async function getTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as TicketStatus | undefined,
      category: req.query.category as TicketCategory | undefined,
      priority: req.query.priority as TicketPriority | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      sort: req.query.sort as string | undefined,
      assigned_to: req.query.assigned_to as string | undefined,
    };

    const tickets = await ticketService.getAdminTickets(filters);
    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
}

export async function getTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.getAdminTicketById(req.params.id);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await ticketService.updateAdminTicket(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function addReply(req: Request, res: Response, next: NextFunction) {
  try {
    const reply = await ticketService.addAdminReply(
      req.params.id,
      req.user!.userId,
      req.body.body
    );
    res.status(201).json(reply);
  } catch (error) {
    next(error);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await ticketService.addInternalNote(
      req.params.id,
      req.user!.userId,
      req.body.body
    );
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
}

export async function classifyTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { book: true, author: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const context: aiService.AiAuthorContext = {
      authorName: ticket.author.name,
      authorCode: ticket.author.author_code,
      bookTitle: ticket.book?.title,
      bookStatus: ticket.book?.status,
      royaltyPending: ticket.book?.royalty_pending,
      lastPayoutDate: ticket.book?.last_payout_date?.toISOString(),
      availableOn: ticket.book ? parsePlatforms(ticket.book.available_on) : [],
      copiesSold: ticket.book?.copies_sold,
    };

    const result = await aiService.classifyTicket(
      ticket.id,
      ticket.subject,
      ticket.description,
      context
    );

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        category: result.category,
        priority: result.priority,
        ai_rationale: result.rationale,
        ai_status: result.ai_status,
      },
    });

    res.status(200).json({
      category: updated.category,
      priority: updated.priority,
      ai_rationale: updated.ai_rationale,
      ai_status: updated.ai_status,
    });
  } catch (error) {
    next(error);
  }
}

export async function draftResponse(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        book: true,
        author: true,
        replies: {
          orderBy: { created_at: 'desc' },
          take: 2,
          include: { sender: { select: { name: true, role: true } } },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Format last 2 replies in chronological order for follow-up context
    const recentReplies = ticket.replies
      .reverse()
      .map((r) => `${r.sender.name} (${r.sender.role}): ${r.body}`);

    const context: aiService.AiAuthorContext = {
      authorName: ticket.author.name,
      authorCode: ticket.author.author_code,
      bookTitle: ticket.book?.title,
      bookStatus: ticket.book?.status,
      royaltyPending: ticket.book?.royalty_pending,
      lastPayoutDate: ticket.book?.last_payout_date?.toISOString(),
      availableOn: ticket.book ? parsePlatforms(ticket.book.available_on) : [],
      copiesSold: ticket.book?.copies_sold,
      recentReplies,
    };

    const result = await aiService.draftResponse(
      ticket.id,
      ticket.subject,
      ticket.description,
      context,
      ticket.category
    );

    res.status(200).json({
      draft: result.draft,
      tokens: {
        prompt: result.promptTokens,
        completion: result.completionTokens,
      },
      selectedSections: result.selectedSections,
    });
  } catch (error) {
    next(error);
  }
}
