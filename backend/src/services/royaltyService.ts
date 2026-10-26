import { prisma } from '../db/client';

export async function getAuthorRoyaltySummary(authorUserId: string) {
  const books = await prisma.book.findMany({
    where: { author_id: authorUserId },
  });

  const totalEarned = books.reduce((sum, b) => sum + (b.royalty_earned || 0), 0);
  const totalPaid = books.reduce((sum, b) => sum + (b.royalty_paid || 0), 0);
  const totalPending = books.reduce((sum, b) => sum + (b.royalty_pending || 0), 0);

  // KB Policy: Minimum payout threshold is ₹1,000. Under ₹1,000 rolls over to next quarter.
  const isRollover = totalPending > 0 && totalPending < 1000;

  return {
    totalEarned,
    totalPaid,
    totalPending,
    isRollover,
    threshold: 1000,
    currency: 'INR',
    rolloverNotice: isRollover
      ? `₹${totalPending.toLocaleString('en-IN')} pending is below the ₹1,000 payout threshold and will roll over to next quarter.`
      : null,
  };
}
