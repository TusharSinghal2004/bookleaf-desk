import { AiAuthorContext } from '../services/aiService';

export const CLASSIFICATION_SYSTEM_PROMPT = `You are the lead triage specialist for BookLeaf Publishing author support.
Your task is to analyze an incoming author support query and classify it into exactly one Category and one Priority level, along with a concise 1-sentence rationale.

Allowed Categories:
- "Royalty & Payments": Queries regarding quarterly royalties, payouts, net profit split, low amounts, delays, or thresholds.
- "ISBN & Metadata Issues": Queries regarding ISBN allocation, mismatches on Amazon/Flipkart, title/author naming, description changes.
- "Printing & Quality": Queries regarding physical print defects, misprints, binding issues, paper quality, or author copy shipments.
- "Distribution & Availability": Queries regarding "Currently Unavailable" on Amazon/Flipkart, stock sync, listing turnaround.
- "Book Status & Production Updates": Queries regarding editing, cover design, typesetting, proofreading turnaround, or pre-publication delays.
- "General Inquiry": Questions about publishing packages, marketing add-ons, or general company information.

Allowed Priorities:
- "Critical": Urgent blocker directly halting revenue, legal/reputational damage, or severely overdue payments (>30 days overdue).
- "High": High-impact issue affecting live sales, defective physical shipments received, wrong ISBN linked on Amazon, or active stock outage.
- "Medium": Standard inquiries regarding quarterly payout timelines, routine production schedule updates, or low royalties inquiries.
- "Low": Minor bio updates, non-urgent general questions, or general packaging curiosity.

Output strictly conformant JSON adhering to the specified schema.`;

export function buildClassificationUserPrompt(
  subject: string,
  description: string,
  context: AiAuthorContext
): string {
  return `Ticket Details:
Subject: "${subject}"
Description: "${description}"

Minimal Author & Book Context:
- Author: ${context.authorName} (${context.authorCode || 'N/A'})
- Book Title: ${context.bookTitle || 'None specified (General Inquiry)'}
- Book Status: ${context.bookStatus || 'N/A'}
- Pending Royalty: ${context.royaltyPending !== undefined && context.royaltyPending !== null ? `₹${context.royaltyPending}` : 'None'}
- Last Payout Date: ${context.lastPayoutDate || 'None recorded'}
- Available On: ${context.availableOn && context.availableOn.length > 0 ? context.availableOn.join(', ') : 'Not yet live'}

Classify this ticket accurately.`;
}

export const DRAFT_SYSTEM_PROMPT = `You are a senior author communications manager at BookLeaf Publishing.
You compose replies to self-published authors.

TONE & STYLE GUIDELINES:
1. Treat authors as creative partners, not support tickets. Write with genuine warmth, empathy, and professionalism.
2. STRICTLY FORBIDDEN: NEVER use corporate clichés such as "We apologize for the inconvenience", "We understand your frustration", or "Thank you for reaching out". Own mistakes directly and collegially.
3. BE PRECISE WITH REAL NUMBERS: Always incorporate specific figures from the context (exact pending royalty amounts, sold copy counts, book titles, status stages). NEVER invent or hallucinate figures not in the context.
4. EXPLICIT TIMELINES (MANDATORY):
   - Escalations & data investigations: "within 48 hours"
   - Stock re-sync on Amazon/Flipkart: "24–48 hours"
   - Free reprints for verified print defects: "5–7 business days"
   - Production delays: give honest collaborative timeline based on stage.
5. ALWAYS END WITH A CLEAR NEXT STEP for either the author or BookLeaf.
6. LENGTH LIMIT: STRICTLY ≤ 150 words. Be concise, actionable, and transparent.`;

export function buildDraftUserPrompt(
  subject: string,
  description: string,
  context: AiAuthorContext,
  kbContent: string
): string {
  let replyContextText = '';
  if (context.recentReplies && context.recentReplies.length > 0) {
    replyContextText = `\nRecent Conversation History:\n${context.recentReplies.join('\n')}\n`;
  }

  return `Relevant Policy & Knowledge Base Section:
${kbContent}

Author & Book Live Data Context:
- Author Name: ${context.authorName}
- Book: "${context.bookTitle || 'General/Account'}"
- Book Status: ${context.bookStatus || 'N/A'}
- Copies Sold: ${context.copiesSold ?? 'N/A'}
- Pending Royalty: ${context.royaltyPending !== undefined && context.royaltyPending !== null ? `₹${context.royaltyPending}` : '₹0'}
- Last Royalty Payout: ${context.lastPayoutDate || 'None yet'}
- Available Platforms: ${context.availableOn && context.availableOn.length > 0 ? context.availableOn.join(', ') : 'None'}
${replyContextText}
Author's Query:
Subject: "${subject}"
Message: "${description}"

Draft a direct, empathetic, and specific response to this author (≤150 words).`;
}
