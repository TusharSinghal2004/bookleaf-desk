import { TicketCategory, TicketPriority, AiStatus } from '@prisma/client';
import { ClassificationResult, DraftResult } from '../services/aiService';

export interface FallbackClassificationResult extends ClassificationResult {
  ai_status: AiStatus;
}

export interface FallbackDraftResult extends DraftResult {
  isFallback: boolean;
}

export function getFallbackClassification(errorMsg: string): FallbackClassificationResult {
  return {
    category: TicketCategory.UNCLASSIFIED,
    priority: TicketPriority.UNSET,
    rationale: `AI unavailable — classify manually (${errorMsg}).`,
    promptTokens: 0,
    completionTokens: 0,
    model: 'fallback',
    ai_status: AiStatus.FAILED,
  };
}

export function getFallbackDraft(authorName: string, bookTitle?: string | null): FallbackDraftResult {
  return {
    draft: `Hello ${authorName},\n\nWe have received your support request regarding ${
      bookTitle ? `"${bookTitle}"` : 'your query'
    }. Our operations team is currently reviewing your account details and will get back to you within 48 hours with a resolution.\n\nPlease let us know if you have any additional details to add in the meantime.\n\nBest regards,\nBookLeaf Operations`,
    promptTokens: 0,
    completionTokens: 0,
    model: 'fallback',
    selectedSections: ['Fallback'],
    isFallback: true,
  };
}
