import dotenv from 'dotenv';
dotenv.config();

import { selectKbSections } from '../src/ai/kb';
import { getAiProvider } from '../src/services/aiService';
import { TicketCategory, TicketPriority } from '@prisma/client';

interface SampleTest {
  id: number;
  expectedCategory: TicketCategory;
  authorName: string;
  bookTitle?: string;
  bookStatus?: string;
  copiesSold?: number;
  royaltyPending?: number;
  lastPayoutDate?: string;
  query: string;
}

const SAMPLE_QUERIES: SampleTest[] = [
  {
    id: 1,
    expectedCategory: TicketCategory.ROYALTY_AND_PAYMENTS,
    authorName: 'Priya Sharma',
    bookTitle: 'Whispers of the Ganges',
    bookStatus: 'Published & Live',
    copiesSold: 342,
    royaltyPending: 3570,
    lastPayoutDate: '2025-10-15',
    query: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
  },
  {
    id: 2,
    expectedCategory: TicketCategory.ROYALTY_AND_PAYMENTS,
    authorName: 'Rohit Kapoor',
    bookTitle: 'Code & Karma',
    bookStatus: 'Published & Live',
    copiesSold: 876,
    royaltyPending: 5280,
    lastPayoutDate: '2025-09-01',
    query: 'My royalty amount seems too low. I sold 200 copies but only received ₹3,000.',
  },
  {
    id: 3,
    expectedCategory: TicketCategory.ISBN_AND_METADATA_ISSUES,
    authorName: 'Ananya Reddy',
    bookTitle: 'Between Two Temples',
    bookStatus: 'Published & Live',
    copiesSold: 67,
    royaltyPending: 2546,
    lastPayoutDate: undefined,
    query: "My book is showing a different ISBN on Amazon than what's on the physical copy.",
  },
  {
    id: 4,
    expectedCategory: TicketCategory.PRINTING_AND_QUALITY,
    authorName: 'Vikram Joshi',
    bookTitle: 'Debugging Life',
    bookStatus: 'Published & Live',
    copiesSold: 534,
    royaltyPending: 3350,
    lastPayoutDate: '2025-08-20',
    query: 'I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.',
  },
  {
    id: 5,
    expectedCategory: TicketCategory.DISTRIBUTION_AND_AVAILABILITY,
    authorName: 'Meera Nair',
    bookTitle: 'Cardamom & Chaos',
    bookStatus: 'Published & Live',
    copiesSold: 445,
    royaltyPending: 0,
    lastPayoutDate: '2025-12-01',
    query: 'My book is published but it\'s showing as "Currently Unavailable" on Amazon.',
  },
  {
    id: 6,
    expectedCategory: TicketCategory.BOOK_STATUS_AND_PRODUCTION_UPDATES,
    authorName: 'Kavita Deshmukh',
    bookTitle: 'Raising Roots',
    bookStatus: 'In Production - Typesetting',
    copiesSold: 0,
    royaltyPending: 0,
    lastPayoutDate: undefined,
    query: "It's been 3 weeks and my book is still in typesetting. When will it be done?",
  },
];

async function runEvaluation() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  BOOKLEAF AI INTEGRATION EVALUATION (6 PDF Sample Queries)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const provider = getAiProvider();
  const apiKeySet = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '');

  console.log(`Status: OPENAI_API_KEY is ${apiKeySet ? 'SET' : 'UNSET (Running Fallback Evaluator)'}`);
  console.log(`Provider: ${provider.constructor.name}\n`);

  let passedFluffCheck = true;

  for (const item of SAMPLE_QUERIES) {
    console.log(`-------------------------------------------------------------------`);
    console.log(`[Query #${item.id}] Author: ${item.authorName} · Title: ${item.bookTitle}`);
    console.log(`Query: "${item.query}"\n`);

    const context = {
      authorName: item.authorName,
      bookTitle: item.bookTitle,
      bookStatus: item.bookStatus,
      royaltyPending: item.royaltyPending,
      lastPayoutDate: item.lastPayoutDate,
      copiesSold: item.copiesSold,
    };

    // 1. Classification
    const classification = await provider.classifyTicket(
      `Support query regarding ${item.bookTitle}`,
      item.query,
      context
    );

    console.log(`AI Classification: [${classification.category}] · Priority: [${classification.priority}]`);
    console.log(`Rationale: ${classification.rationale}`);

    // 2. Draft Response
    const { content: kbContent } = selectKbSections(classification.category);
    const draft = await provider.draftResponse(
      `Query #${item.id}`,
      item.query,
      context,
      kbContent,
      classification.category
    );

    const words = draft.draft.trim().split(/\s+/).length;
    console.log(`\nDrafted Response (${words} words):`);
    console.log(`"""\n${draft.draft}\n"""`);

    // Verify forbidden fluff: "We apologize for the inconvenience"
    if (draft.draft.toLowerCase().includes('we apologize for the inconvenience')) {
      console.error('❌ FAILED: Detected forbidden corporate fluff: "We apologize for the inconvenience"');
      passedFluffCheck = false;
    } else {
      console.log('✔ Passed Fluff Check (Genuine partner tone)');
    }

    if (words > 150) {
      console.warn(`⚠️ Warning: Draft length is ${words} words (target ≤150 words)`);
    } else {
      console.log(`✔ Passed Length Check (${words} words ≤ 150 words)`);
    }

    console.log(`Tokens: in=${draft.promptTokens}, out=${draft.completionTokens}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  if (passedFluffCheck) {
    console.log('🎉 ALL SAMPLE QUERIES EVALUATED SUCCESSFULLY WITH 0 FLUFF DETECTED!');
  } else {
    console.error('❌ EVALUATION FAILED FLUFF CHECK');
    process.exit(1);
  }
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

runEvaluation().catch((e) => {
  console.error('Evaluation run error:', e);
  process.exit(1);
});
