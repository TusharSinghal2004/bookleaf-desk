import { prisma } from '../db/client';
import { TicketCategory, TicketPriority, AiStatus } from '@prisma/client';
import { AiProvider, OpenAiProvider, NoopAiProvider } from '../ai/provider';
import { selectKbSections } from '../ai/kb';
import { getFallbackClassification, getFallbackDraft } from '../ai/fallback';
import { parsePlatforms } from '../utils/helpers';

export interface AiAuthorContext {
  authorName: string;
  authorCode?: string | null;
  bookTitle?: string | null;
  bookStatus?: string | null;
  royaltyPending?: number | null;
  lastPayoutDate?: string | null;
  availableOn?: string[] | null;
  copiesSold?: number | null;
  recentReplies?: string[];
}

export interface ClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  rationale: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
}

export interface DraftResult {
  draft: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  selectedSections: string[];
}

/**
 * Returns an instance of the configured AiProvider.
 */
export function getAiProvider(): AiProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return new NoopAiProvider();
  }
  return new OpenAiProvider(apiKey.trim());
}

/**
 * Classifies a ticket with subject, description, and minimal author context.
 * Wrapped with 10s timeout, retry, and typed fallback.
 */
export async function classifyTicket(
  ticketId: string,
  subject: string,
  description: string,
  context: AiAuthorContext
): Promise<ClassificationResult & { ai_status: AiStatus }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      category: TicketCategory.UNCLASSIFIED,
      priority: TicketPriority.UNSET,
      rationale: 'AI unavailable — manual classification required.',
      promptTokens: 0,
      completionTokens: 0,
      model: 'none',
      ai_status: AiStatus.SKIPPED,
    };
  }

  const provider = getAiProvider();
  try {
    const result = await provider.classifyTicket(subject, description, context);

    // Record in AILog
    await prisma.aILog.create({
      data: {
        ticket_id: ticketId,
        operation: 'CLASSIFY',
        model: result.model,
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        success: true,
      },
    });

    return {
      ...result,
      ai_status: AiStatus.OK,
    };
  } catch (err: any) {
    console.error(`[AI] Classification failed for ticket=${ticketId}:`, err.message);

    // Record error in AILog
    await prisma.aILog.create({
      data: {
        ticket_id: ticketId,
        operation: 'CLASSIFY',
        model: 'gpt-4o-mini',
        prompt_tokens: 0,
        completion_tokens: 0,
        success: false,
        error: err.message,
      },
    }).catch(() => {});

    return getFallbackClassification(err.message);
  }
}

/**
 * Generates an empathetic, KB-informed draft response.
 * Includes selective KB injection and real context figures.
 */
export async function draftResponse(
  ticketId: string,
  subject: string,
  description: string,
  context: AiAuthorContext,
  category: TicketCategory
): Promise<DraftResult> {
  const { sections, content: kbContent } = selectKbSections(category);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return getFallbackDraft(context.authorName, context.bookTitle);
  }

  const provider = getAiProvider();
  try {
    const result = await provider.draftResponse(
      subject,
      description,
      context,
      kbContent,
      category
    );

    // Record in AILog
    await prisma.aILog.create({
      data: {
        ticket_id: ticketId,
        operation: 'DRAFT',
        model: result.model,
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        success: true,
      },
    });

    return {
      ...result,
      selectedSections: sections,
    };
  } catch (err: any) {
    console.error(`[AI] Draft failed for ticket=${ticketId}:`, err.message);

    await prisma.aILog.create({
      data: {
        ticket_id: ticketId,
        operation: 'DRAFT',
        model: 'gpt-4o-mini',
        prompt_tokens: 0,
        completion_tokens: 0,
        success: false,
        error: err.message,
      },
    }).catch(() => {});

    return getFallbackDraft(context.authorName, context.bookTitle);
  }
}

/**
 * Triggers background AI auto-classification on ticket creation.
 * Non-blocking: will never cause createTicket to fail or hang.
 */
export async function triggerAutoClassification(ticketId: string): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        book: true,
        author: true,
      },
    });

    if (!ticket) return;

    const authorContext: AiAuthorContext = {
      authorName: ticket.author.name,
      authorCode: ticket.author.author_code,
      bookTitle: ticket.book?.title,
      bookStatus: ticket.book?.status,
      royaltyPending: ticket.book?.royalty_pending,
      lastPayoutDate: ticket.book?.last_payout_date?.toISOString(),
      availableOn: ticket.book ? parsePlatforms(ticket.book.available_on) : [],
      copiesSold: ticket.book?.copies_sold,
    };

    const result = await classifyTicket(ticket.id, ticket.subject, ticket.description, authorContext);

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        category: result.category,
        priority: result.priority,
        ai_rationale: result.rationale,
        ai_status: result.ai_status,
      },
    });
  } catch (err: any) {
    console.error(`[AI] triggerAutoClassification fatal catch for ticket=${ticketId}:`, err.message);
  }
}
