import { prisma } from '../db/client';
import { TicketCategory, TicketPriority, AiStatus } from '@prisma/client';

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

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      console.log(`[AI] Classification skipped for ticket=${ticket.id} (OPENAI_API_KEY unset)`);
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          category: TicketCategory.UNCLASSIFIED,
          priority: TicketPriority.UNSET,
          ai_status: AiStatus.SKIPPED,
          ai_rationale: 'AI auto-classification unavailable: OPENAI_API_KEY is not configured.',
        },
      });
      return;
    }

    // Phase 5 will implement full OpenAI call here
  } catch (err: any) {
    console.error(`[AI] Auto-classification failed for ticket=${ticketId}:`, err.message);
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        category: TicketCategory.UNCLASSIFIED,
        priority: TicketPriority.UNSET,
        ai_status: AiStatus.FAILED,
        ai_rationale: `AI classification error: ${err.message}`,
      },
    }).catch(() => {});
  }
}
