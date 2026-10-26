import React from 'react';
import { Book } from '../../api/author';
import { BookOpen, CheckCircle, Clock, Store, AlertCircle } from 'lucide-react';

const PRODUCTION_STAGES = [
  'Manuscript Received',
  'Cover Design',
  'Typesetting',
  'Proofreading',
  'ISBN Assignment',
  'Printing',
  'Distribution Setup',
  'Published & Live',
];

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const isPublished = book.status.toLowerCase().includes('published');
  const isRollover = book.royalty_pending > 0 && book.royalty_pending < 1000;

  // Determine active production stage index
  const getCurrentStageIndex = () => {
    const statusLower = book.status.toLowerCase();
    if (statusLower.includes('cover design')) return 1;
    if (statusLower.includes('typesetting')) return 2;
    if (statusLower.includes('proofreading')) return 3;
    if (statusLower.includes('isbn')) return 4;
    if (statusLower.includes('printing')) return 5;
    if (statusLower.includes('distribution')) return 6;
    if (isPublished) return 7;
    return 0; // Manuscript Received
  };

  const activeStageIdx = getCurrentStageIndex();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                {book.book_id}
              </span>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {book.genre}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 truncate" title={book.title}>
              {book.title}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ISBN: <span className="text-slate-700">{book.isbn || 'Pending Allocation'}</span>
            </p>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5 ${
              isPublished
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isPublished ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {book.status}
          </span>
        </div>
      </div>

      {/* Body: Published vs In-Production */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {isPublished ? (
          <>
            {/* Financial & Sales Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">MRP</span>
                <span className="text-sm font-bold text-slate-800">₹{book.mrp ?? 0}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Copies Sold</span>
                <span className="text-sm font-bold text-slate-800">{book.copies_sold.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Royalty / Copy</span>
                <span className="text-sm font-bold text-slate-800">₹{book.royalty_per_copy ?? 0}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Total Earned</span>
                <span className="text-sm font-bold text-emerald-600">₹{book.royalty_earned.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payout & Pending Status */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="text-slate-600">
                <span className="font-semibold text-slate-900">Paid:</span> ₹{book.royalty_paid.toLocaleString('en-IN')}
                {book.last_payout_date && (
                  <span className="text-slate-400 text-[11px] ml-1">
                    ({new Date(book.last_payout_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-900">Pending:</span>{' '}
                <span className="font-bold text-slate-900">₹{book.royalty_pending.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Rollover notice if sub-threshold (< ₹1,000) */}
            {isRollover && (
              <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <span className="font-semibold">₹{book.royalty_pending.toLocaleString('en-IN')} pending</span> is below the ₹1,000 threshold and will roll over to the next quarterly payout per KB policy.
                </p>
              </div>
            )}

            {/* Distribution platforms */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Store className="w-3 h-3 text-slate-400" />
                Available Channels ({book.available_on.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {book.available_on.length > 0 ? (
                  book.available_on.map((platform) => (
                    <span
                      key={platform}
                      className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                    >
                      {platform}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Distribution setup in progress</span>
                )}
              </div>
            </div>
          </>
        ) : (
          /* In-Production Stage Timeline (Clean, no nulls) */
          <div className="space-y-4 py-1">
            <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100/80">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs mb-1">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Currently in Production Pipeline
              </div>
              <p className="text-xs text-slate-600">
                Your book is progressing through publication stages. Our team is actively preparing your title.
              </p>
            </div>

            {/* Stepper Timeline */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Production Progress
              </span>
              <div className="space-y-1.5">
                {PRODUCTION_STAGES.slice(0, 5).map((stage, idx) => {
                  const isDone = idx < activeStageIdx;
                  const isCurrent = idx === activeStageIdx;
                  return (
                    <div
                      key={stage}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                          : isDone
                          ? 'text-emerald-800 bg-emerald-50/50'
                          : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isCurrent
                            ? 'bg-amber-500 ring-4 ring-amber-200'
                            : isDone
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span>{stage}</span>
                      {isCurrent && (
                        <span className="ml-auto text-[10px] uppercase font-bold text-amber-700 px-1.5 py-0.5 bg-amber-100 rounded">
                          Current Stage
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
              * Royalties, pricing, and distribution links will appear automatically once publication is complete.
            </div>
          </div>
        )}
      </div>

      {/* Footer Details */}
      <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          {isPublished && book.publication_date
            ? `Published: ${new Date(book.publication_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}`
            : 'Pre-Publication Stage'}
        </span>
        {book.print_partner && (
          <span className="font-medium text-slate-600">Partner: {book.print_partner}</span>
        )}
      </div>
    </div>
  );
};
