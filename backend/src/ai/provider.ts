import OpenAI from 'openai';
import { TicketCategory, TicketPriority } from '@prisma/client';
import { AiAuthorContext, ClassificationResult, DraftResult } from '../services/aiService';
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  buildClassificationUserPrompt,
  DRAFT_SYSTEM_PROMPT,
  buildDraftUserPrompt,
} from './prompts';

// Standard pricing for gpt-4o-mini: $0.150 / 1M input tokens, $0.600 / 1M output tokens
export function calculateGpt4oMiniCost(promptTokens: number, completionTokens: number): number {
  return (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.6;
}

export interface AiProvider {
  classifyTicket(
    subject: string,
    description: string,
    context: AiAuthorContext
  ): Promise<ClassificationResult>;

  draftResponse(
    subject: string,
    description: string,
    context: AiAuthorContext,
    kbContent: string,
    category: TicketCategory
  ): Promise<DraftResult>;
}

// Map textual category to Prisma TicketCategory enum
function mapTextToCategory(cat: string): TicketCategory {
  switch (cat) {
    case 'Royalty & Payments':
      return TicketCategory.ROYALTY_AND_PAYMENTS;
    case 'ISBN & Metadata Issues':
      return TicketCategory.ISBN_AND_METADATA_ISSUES;
    case 'Printing & Quality':
      return TicketCategory.PRINTING_AND_QUALITY;
    case 'Distribution & Availability':
      return TicketCategory.DISTRIBUTION_AND_AVAILABILITY;
    case 'Book Status & Production Updates':
      return TicketCategory.BOOK_STATUS_AND_PRODUCTION_UPDATES;
    case 'General Inquiry':
      return TicketCategory.GENERAL_INQUIRY;
    default:
      return TicketCategory.UNCLASSIFIED;
  }
}

// Map textual priority to Prisma TicketPriority enum
function mapTextToPriority(pri: string): TicketPriority {
  switch (pri) {
    case 'Critical':
      return TicketPriority.CRITICAL;
    case 'High':
      return TicketPriority.HIGH;
    case 'Medium':
      return TicketPriority.MEDIUM;
    case 'Low':
      return TicketPriority.LOW;
    default:
      return TicketPriority.UNSET;
  }
}

/**
 * Executes an async operation with 10s timeout and 1 retry.
 */
async function withTimeoutAndRetry<T>(fn: (signal: AbortSignal) => Promise<T>, timeoutMs = 10000): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt === 0) {
        // Wait 500ms before retry
        await new Promise((res) => setTimeout(res, 500));
      }
    }
  }

  throw lastError;
}

export class OpenAiProvider implements AiProvider {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = 'gpt-4o-mini') {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    this.model = model;
  }

  async classifyTicket(
    subject: string,
    description: string,
    context: AiAuthorContext
  ): Promise<ClassificationResult> {
    const userPrompt = buildClassificationUserPrompt(subject, description, context);

    const result = await withTimeoutAndRetry(async (signal) => {
      const response = await this.openai.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'ticket_classification_schema',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    enum: [
                      'Royalty & Payments',
                      'ISBN & Metadata Issues',
                      'Printing & Quality',
                      'Distribution & Availability',
                      'Book Status & Production Updates',
                      'General Inquiry',
                    ],
                  },
                  priority: {
                    type: 'string',
                    enum: ['Critical', 'High', 'Medium', 'Low'],
                  },
                  rationale: {
                    type: 'string',
                    description: 'A 1-sentence concise explanation for this categorization and priority.',
                  },
                },
                required: ['category', 'priority', 'rationale'],
                additionalProperties: false,
              },
            },
          },
        },
        { signal }
      );

      const choice = response.choices[0];
      const parsed = JSON.parse(choice.message.content || '{}');
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const cost = calculateGpt4oMiniCost(promptTokens, completionTokens);

      console.log(
        `[AI] op=CLASSIFY model=${this.model} tokens=${promptTokens}/${completionTokens} cost=$${cost.toFixed(6)} category="${parsed.category}" priority="${parsed.priority}"`
      );

      return {
        category: mapTextToCategory(parsed.category),
        priority: mapTextToPriority(parsed.priority),
        rationale: parsed.rationale || 'Classified by OpenAI model.',
        promptTokens,
        completionTokens,
        model: this.model,
      };
    });

    return result;
  }

  async draftResponse(
    subject: string,
    description: string,
    context: AiAuthorContext,
    kbContent: string,
    _category: TicketCategory
  ): Promise<DraftResult> {
    const userPrompt = buildDraftUserPrompt(subject, description, context, kbContent);

    const result = await withTimeoutAndRetry(async (signal) => {
      const response = await this.openai.chat.completions.create(
        {
          model: this.model,
          temperature: 0.3, // Consistent and factual
          messages: [
            { role: 'system', content: DRAFT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        },
        { signal }
      );

      const content = response.choices[0]?.message?.content || '';
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const cost = calculateGpt4oMiniCost(promptTokens, completionTokens);

      console.log(
        `[AI] op=DRAFT model=${this.model} tokens=${promptTokens}/${completionTokens} cost=$${cost.toFixed(6)} words=${content.split(/\s+/).length}`
      );

      return {
        draft: content.trim(),
        promptTokens,
        completionTokens,
        model: this.model,
        selectedSections: [],
      };
    });

    return result;
  }
}

export class NoopAiProvider implements AiProvider {
  async classifyTicket(): Promise<ClassificationResult> {
    return {
      category: TicketCategory.UNCLASSIFIED,
      priority: TicketPriority.UNSET,
      rationale: 'AI unavailable — manual classification required.',
      promptTokens: 0,
      completionTokens: 0,
      model: 'none',
    };
  }

  async draftResponse(
    _subject: string,
    _description: string,
    context: AiAuthorContext
  ): Promise<DraftResult> {
    return {
      draft: `Hello ${context.authorName},\n\nWe have received your message regarding "${context.bookTitle || 'your query'}". Our operations team is reviewing your account details and will provide an update within 24–48 hours.\n\nBest regards,\nBookLeaf Operations Team`,
      promptTokens: 0,
      completionTokens: 0,
      model: 'none',
      selectedSections: [],
    };
  }
}
