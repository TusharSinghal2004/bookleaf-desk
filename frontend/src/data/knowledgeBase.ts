export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  keyPoints: string[];
  slaOrTurnaround: string;
  keywords: string[];
}

export const KNOWLEDGE_BASE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'royalty-policy',
    category: 'ROYALTY_AND_PAYMENTS',
    title: 'Royalty Calculation & Payout Schedule',
    summary:
      'BookLeaf operates on an 80/20 net profit split: 80% goes to the author and 20% to BookLeaf.',
    keyPoints: [
      'Net Profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.',
      'Royalties are calculated quarterly and distributed within 45 days after quarter-end.',
      'Minimum payout threshold is ₹1,000. Pending royalties under ₹1,000 automatically roll over to the next quarter.',
      'Payouts are transferred directly to your linked bank account via NEFT/IMPS.',
    ],
    slaOrTurnaround: 'Quarterly cycle (within 45 days of quarter end)',
    keywords: ['royalty', 'payment', 'payout', 'money', 'earnings', 'bank', 'transfer', 'profit', 'split', 'rollover', 'threshold', 'quarter'],
  },
  {
    id: 'isbn-metadata',
    category: 'ISBN_AND_METADATA_ISSUES',
    title: 'ISBN Assignment & Metadata Changes',
    summary:
      'Every book published through BookLeaf receives a unique 13-digit ISBN registered under BookLeaf Publishing imprint.',
    keyPoints: [
      'ISBN is assigned prior to publication and registered in international bibliographic registries.',
      'If you notice a duplicate ISBN or mismatched book title on marketplace listings, it is escalated directly to the production desk.',
      'Metadata changes (book description, subtitle, author bio) can take 3–5 business days to reflect across Amazon and Flipkart.',
    ],
    slaOrTurnaround: '48-hour resolution SLA for ISBN errors; 3–5 days for metadata sync',
    keywords: ['isbn', 'metadata', 'barcode', 'imprint', 'title', 'duplicate', 'error', 'description', 'author bio'],
  },
  {
    id: 'printing-quality',
    category: 'PRINTING_AND_QUALITY',
    title: 'Print Quality & Free Reprint Guarantee',
    summary:
      'Books are printed at our in-house facility in Delhi or through certified print partners (Repro India, Epitome Books).',
    keyPoints: [
      'Standard printing and fulfillment turnaround is 5–7 business days from order confirmation.',
      'If you receive a defective copy (misprint, binding defect, damaged spine, or cover color discrepancy), BookLeaf provides a free reprint.',
      'To expedite your reprint request, attach 1–2 photos showing the defect when submitting your ticket.',
    ],
    slaOrTurnaround: '5–7 business days for free reprint verification and dispatch',
    keywords: ['print', 'printing', 'quality', 'misprint', 'binding', 'defect', 'damaged', 'paper', 'color', 'reprint'],
  },
  {
    id: 'distribution-availability',
    category: 'DISTRIBUTION_AND_AVAILABILITY',
    title: 'Marketplace Distribution & Stock Sync',
    summary:
      'Books are distributed across Amazon India, Flipkart, BookLeaf Store, and internationally via Amazon US/UK.',
    keyPoints: [
      'New titles typically go live on online marketplaces within 7–10 business days after publication is completed.',
      'If a book temporarily shows as "Currently Unavailable" or "Out of Stock", it is usually a stock sync delay rather than an actual print shortage.',
      'Our operations team can trigger a manual catalog re-sync with marketplace partners within 24–48 hours.',
    ],
    slaOrTurnaround: '24–48 hours for marketplace re-sync; 7–10 days for new listings',
    keywords: ['distribution', 'amazon', 'flipkart', 'store', 'stock', 'available', 'unavailable', 'out of stock', 'listing', 'live'],
  },
  {
    id: 'production-pipeline',
    category: 'BOOK_STATUS_AND_PRODUCTION_UPDATES',
    title: 'Publication Pipeline & Milestones',
    summary:
      'Your manuscript progresses through an 8-stage publication workflow with automated updates at every milestone.',
    keyPoints: [
      'Stages: Manuscript Received → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.',
      'Authors receive notification at each completed milestone.',
      'Most timeline delays occur during Cover Design or Proofreading revisions while awaiting author approval.',
    ],
    slaOrTurnaround: 'Milestone-based (typical turnaround 2–4 weeks from manuscript to live)',
    keywords: ['production', 'status', 'stage', 'manuscript', 'typesetting', 'proofreading', 'cover design', 'timeline', 'pipeline', 'milestone'],
  },
];

export function findMatchingKnowledge(text: string): KnowledgeArticle[] {
  if (!text || text.trim().length === 0) return [];
  const clean = text.toLowerCase();
  
  const matches = KNOWLEDGE_BASE_ARTICLES.filter((article) => {
    return article.keywords.some((kw) => clean.includes(kw));
  });

  return matches;
}

export function getKnowledgeByCategory(category?: string): KnowledgeArticle | undefined {
  if (!category) return undefined;
  return KNOWLEDGE_BASE_ARTICLES.find((a) => a.category === category);
}
