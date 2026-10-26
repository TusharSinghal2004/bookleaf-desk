import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as bookService from '../services/bookService';
import * as royaltyService from '../services/royaltyService';
import * as ticketService from '../services/ticketService';
import * as aiService from '../services/aiService';
import { TicketStatus } from '@prisma/client';

export const createTicketSchema = z.object({
  book_id: z.string().uuid().nullable().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
});

export const addReplySchema = z.object({
  body: z.string().min(1, 'Reply message cannot be empty'),
});

export async function getBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const books = await bookService.getAuthorBooks(req.user!.userId);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
}

export async function getRoyalties(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await royaltyService.getAuthorRoyaltySummary(req.user!.userId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
}

export async function getTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as TicketStatus | undefined;
    const tickets = await ticketService.getAuthorTickets(req.user!.userId, status);
    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { book_id, subject, description } = req.body;
    const ticket = await ticketService.createTicket({
      authorId: req.user!.userId,
      bookId: book_id,
      subject,
      description,
    });

    // Fire non-blocking AI classification in background
    aiService.triggerAutoClassification(ticket.id).catch((err) => {
      console.error('[AI] Background classification error:', err);
    });

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function getTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.getAuthorTicketById(req.params.id, req.user!.userId);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function addReply(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = req.body;
    const reply = await ticketService.addAuthorReply(req.params.id, req.user!.userId, body);
    res.status(201).json(reply);
  } catch (error) {
    next(error);
  }
}
