import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ticketService from '../services/ticketService';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

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
    // Phase 5 will implement on-demand classification
    // For now, return current ticket state or placeholder
    const ticket = await ticketService.getAdminTicketById(req.params.id);
    res.status(200).json({
      category: ticket.category,
      priority: ticket.priority,
      ai_rationale: ticket.ai_rationale,
      ai_status: ticket.ai_status,
    });
  } catch (error) {
    next(error);
  }
}

export async function draftResponse(req: Request, res: Response, next: NextFunction) {
  try {
    // Phase 5 will connect to real OpenAI draft generator
    res.status(200).json({
      draft: 'AI response drafting will be executed via OpenAI provider in Phase 5.',
      tokens: { prompt: 0, completion: 0 },
    });
  } catch (error) {
    next(error);
  }
}
