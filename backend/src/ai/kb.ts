import { TicketCategory } from '@prisma/client';

export const KB_SECTIONS = {
  COMPANY_OVERVIEW: `BookLeaf Publishing is a self-publishing company operating in India and the US.
We offer publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
We handle cover design, typesetting, ISBN assignment, printing, distribution, and royalty management for our authors.
Our in-house printing facility and warehouse are located in Delhi. We also work with print partners including Repro India and Epitome Books.`,

  ROYALTY_POLICY: `BookLeaf follows an 80/20 royalty split: 80% of the net profit per book goes to the author, 20% to BookLeaf.
Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
Royalties are calculated quarterly and paid within 45 days of the quarter ending.
Minimum payout threshold: ₹1,000. If accumulated royalties are below this, they roll over to the next quarter.
Payouts are made via bank transfer to the account linked in the author's dashboard.
Authors can view a detailed royalty breakdown in their dashboard, showing sales figures per platform.`,

  ISBN_POLICY: `Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.
ISBNs are registered under BookLeaf's publisher imprint. If an author wants an ISBN under their own imprint, they need to obtain it independently.
If an author reports an ISBN error (duplicate, wrong book linked), it is treated as a high-priority issue and escalated to the production team immediately with a 48-hour resolution timeline.`,

  PRINTING_AND_QUALITY: `In-house printing handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.
Standard print turnaround: 5–7 business days from order confirmation.
If an author reports a quality issue (misprints, binding defects, color inconsistency), BookLeaf arranges a free reprint after verification. The author may need to share photos of the defective copy. Free reprint turnaround is 5–7 business days.`,

  DISTRIBUTION_AND_AVAILABILITY: `Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
New listings typically go live within 7–10 business days after publication is complete.
If a book is showing as unavailable on a platform, it usually indicates a stock sync issue—BookLeaf's team can trigger a re-sync with the distribution team within 24–48 hours for it to go live again.`,

  PRODUCTION_STAGES: `A book goes through the following stages: Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
Authors are updated at each stage via email. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds). Changes typically reflect on platforms within 3–5 business days once live.`,
};

/**
 * Selects only the 1-2 relevant KB sections for a given category.
 * Prevents full-KB context dumps and minimizes token costs.
 */
export function selectKbSections(category: TicketCategory): { sections: string[]; content: string } {
  switch (category) {
    case TicketCategory.ROYALTY_AND_PAYMENTS:
      return {
        sections: ['Royalty Policy'],
        content: `[BookLeaf Royalty Policy]\n${KB_SECTIONS.ROYALTY_POLICY}`,
      };

    case TicketCategory.ISBN_AND_METADATA_ISSUES:
      return {
        sections: ['ISBN Policy', 'Distribution Setup'],
        content: `[BookLeaf ISBN Policy]\n${KB_SECTIONS.ISBN_POLICY}\n\n[Metadata Updates]\nMetadata updates can be submitted through the dashboard. Changes typically reflect on platforms within 3–5 business days.`,
      };

    case TicketCategory.PRINTING_AND_QUALITY:
      return {
        sections: ['Printing & Quality'],
        content: `[BookLeaf Printing & Quality Policy]\n${KB_SECTIONS.PRINTING_AND_QUALITY}`,
      };

    case TicketCategory.DISTRIBUTION_AND_AVAILABILITY:
      return {
        sections: ['Distribution & Availability'],
        content: `[BookLeaf Distribution & Availability Policy]\n${KB_SECTIONS.DISTRIBUTION_AND_AVAILABILITY}`,
      };

    case TicketCategory.BOOK_STATUS_AND_PRODUCTION_UPDATES:
      return {
        sections: ['Production Stages'],
        content: `[BookLeaf Production Stages]\n${KB_SECTIONS.PRODUCTION_STAGES}`,
      };

    case TicketCategory.GENERAL_INQUIRY:
    case TicketCategory.UNCLASSIFIED:
    default:
      return {
        sections: ['Company Overview', 'General Policy'],
        content: `[BookLeaf Company Overview]\n${KB_SECTIONS.COMPANY_OVERVIEW}\n\n[General Operations]\nAuthors are partners. Our team provides dedicated assistance with 24-48 hour response turnaround.`,
      };
  }
}
